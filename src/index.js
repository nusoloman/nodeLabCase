// --- Core Modules & Third-party Middleware ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const amqp = require('amqplib');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('mongo-sanitize');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');

// --- Custom Middleware & Services ---
const rateLimiter = require('./middlewares/rateLimiter');
const onlineUserService = require('./services/onlineUserService');
const rabbitmqService = require('./services/rabbitmqService');
require('./services/autoMessageScheduler');
require('./services/autoMessageQueueCron');
const errorHandler = require('./middlewares/errorHandler');

// --- Express App Setup ---
const app = express();

// CORS configuration
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite default ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(helmet());
app.use(rateLimiter);
// Sanitize all incoming data to prevent NoSQL injection
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body);
  if (req.query) req.query = mongoSanitize(req.query);
  if (req.params) req.params = mongoSanitize(req.params);
  next();
});

// --- Swagger (OpenAPI) Documentation ---
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NodeLabCase API',
    version: '1.0.0',
    description:
      'Node.js, Express, MongoDB, Redis, RabbitMQ tabanlı backend API dokümantasyonu',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};
const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/models/*.js'],
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API Routes ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const conversationRoutes = require('./routes/conversation');
const onlineUsersRoutes = require('./routes/onlineUsers');
const searchRoutes = require('./routes/search');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/online-users', onlineUsersRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is running');
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin',
});
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error: ' + err.message);
});

// --- Redis Connection ---
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('connect', () => {
  logger.info('Redis connected');
});
redisClient.on('error', (err) => {
  logger.error('Redis connection error: ' + err.message);
});
redisClient.connect();

// --- RabbitMQ Connection ---
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    logger.info('RabbitMQ connected');
    return connection;
  } catch (err) {
    logger.error('RabbitMQ connection error: ' + err.message);
  }
}
connectRabbitMQ();

// --- Socket.IO Real-time Communication ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.userId = payload.userId;
    await onlineUserService.addOnlineUser(socket.userId);
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO event handlers
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

io.on('connection', (socket) => {
  // Kullanıcı bir konuşma odasına katılır
  socket.on('join_room', async (conversationId) => {
    console.log('join_room', conversationId, socket.id, socket.userId);
    socket.join(conversationId);
    socket.to(conversationId).emit('user_online', { userId: socket.userId });
  });

  // Gerçek zamanlı mesaj gönderimi
  socket.on('send_message', async (data) => {
    console.log('send_message', data, socket.id, socket.userId);
    const sender = socket.userId;
    const { receiver, content } = data;
    if (!receiver || !content) return;
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver],
      });
    }
    const message = await Message.create({
      sender,
      receiver,
      content,
      conversation: conversation._id,
    });
    io.to(conversation._id.toString()).emit('message_received', {
      _id: message._id,
      sender,
      receiver,
      content,
      conversation: conversation._id,
      createdAt: message.createdAt,
    });
  });

  // Tiping (yazıyor) bildirimi
  socket.on('typing', (data) => {
    if (data?.conversationId) {
      socket.to(data.conversationId).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    }
  });

  // Kullanıcı bağlantısı kesildiğinde online listesinden çıkarılır
  socket.on('disconnect', async () => {
    if (socket.userId) {
      await onlineUserService.removeOnlineUser(socket.userId);
    }
  });
});

// Socket.IO instance'ını ve RabbitMQ consumer'ı başlat
rabbitmqService.setIO(io);
rabbitmqService.startConsumer();

// --- Global Error Handler ---
app.use(errorHandler);
logger.info('Server started and logger initialized');

// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

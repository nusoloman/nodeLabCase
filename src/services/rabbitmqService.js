const amqp = require('amqplib');
const AutoMessage = require('../models/AutoMessage');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

let channel = null;
let ioInstance = null;
const QUEUE = 'message_sending_queue';

async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
}

async function sendToQueue(autoMessage) {
  if (!channel) await connectRabbitMQ();
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(autoMessage)), {
    persistent: true,
  });
}

function setIO(io) {
  ioInstance = io;
}

async function startConsumer() {
  if (!channel) await connectRabbitMQ();
  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());
      const autoMsg = await AutoMessage.findById(data._id);
      if (!autoMsg) return channel.ack(msg);
      if (autoMsg.isSent) return channel.ack(msg); // idempotency
      let conversation = await Conversation.findOne({
        participants: { $all: [autoMsg.from, autoMsg.to], $size: 2 },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [autoMsg.from, autoMsg.to],
        });
      }
      // Aynı mesaj daha önce kaydedilmiş mi?
      const existing = await Message.findOne({
        sender: autoMsg.from,
        receiver: autoMsg.to,
        content: autoMsg.content,
        conversation: conversation._id,
        createdAt: autoMsg.sendDate,
      });
      if (existing) {
        autoMsg.isSent = true;
        await autoMsg.save();
        channel.ack(msg);
        return;
      }
      const message = await Message.create({
        sender: autoMsg.from,
        receiver: autoMsg.to,
        content: autoMsg.content,
        conversation: conversation._id,
        createdAt: autoMsg.sendDate,
      });
      autoMsg.isSent = true;
      await autoMsg.save();
      if (ioInstance) {
        ioInstance.to(conversation._id.toString()).emit('message_received', {
          _id: message._id,
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          conversation: message.conversation,
          createdAt: message.createdAt,
        });
      }
      channel.ack(msg);
    }
  });
}

module.exports = {
  connectRabbitMQ,
  sendToQueue,
  startConsumer,
  setIO,
};

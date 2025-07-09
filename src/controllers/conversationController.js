const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');

module.exports = {
  list: async (req, res) => {
    try {
      const userId = req.user._id;
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'username email')
        .sort({ createdAt: -1 });

      // Her konuşma için son mesajı ve seen durumunu al
      const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conv) => {
          const lastMessage = await Message.findOne({ conversation: conv._id })
            .sort({ createdAt: -1 })
            .select('content sender receiver seen createdAt');

          return {
            ...conv.toObject(),
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  sender: lastMessage.sender,
                  receiver: lastMessage.receiver,
                  seen: lastMessage.seen,
                  createdAt: lastMessage.createdAt,
                }
              : null,
          };
        })
      );

      res.json({ conversations: conversationsWithLastMessage });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to fetch conversations', error: err.message });
    }
  },
};

const Conversation = require('../models/Conversation');
const User = require('../models/User');

module.exports = {
  list: async (req, res) => {
    try {
      const userId = req.user._id;
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'username email')
        .sort({ createdAt: -1 });
      res.json({ conversations });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to fetch conversations', error: err.message });
    }
  },
};

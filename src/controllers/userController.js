const User = require('../models/User');

module.exports = {
  list: async (req, res) => {
    try {
      const users = await User.find({}, 'username email');
      res.json({ users });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to fetch users', error: err.message });
    }
  },
  // Kullanıcı profilini güncelle
  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      const { username, email } = req.body;
      if (!username || !email) {
        return res
          .status(400)
          .json({ message: 'Username and email are required' });
      }
      // Sadece username ve email güncellenebilir
      const updated = await User.findByIdAndUpdate(
        userId,
        { username, email },
        { new: true, runValidators: true, context: 'query' }
      ).select('-password');
      res.json({ user: updated });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to update profile', error: err.message });
    }
  },
};

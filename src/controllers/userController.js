const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
  // Şifre değiştir
  changePassword: async (req, res) => {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: 'Current password and new password are required' });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: 'New password must be at least 6 characters long' });
      }

      // Kullanıcıyı bul
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Mevcut şifreyi kontrol et
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' });
      }

      // Yeni şifreyi hashle
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Şifreyi güncelle
      await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to change password', error: err.message });
    }
  },
};

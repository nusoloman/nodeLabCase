const User = require('../models/User');
const bcrypt = require('bcryptjs');
const AutoMessage = require('../models/AutoMessage');
const rabbitmqService = require('../services/rabbitmqService');

const randomMessages = [
  'Merhaba! Nasılsın?',
  'Bugün harika görünüyorsun!',
  'Başarılar dilerim!',
  'Günün güzel geçsin!',
  'Yeni bir şeyler denemeye ne dersin?',
  'Birlikte kahve içelim mi?',
  'Sana iyi haberlerim var!',
  'Motivasyonunu yüksek tut!',
  'Her şey yolunda mı?',
  'Gülümsemeyi unutma!',
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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
  // Shuffle demo: random eşleştirme ve mesaj üretimi (DB'ye yazmaz)
  shuffleDemo: async (req, res) => {
    try {
      const users = await User.find({}, 'username email');
      if (users.length < 2) {
        return res.json({ pairs: [], unpaired: users });
      }
      const shuffled = shuffle([...users]);
      const pairs = [];
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const from = shuffled[i];
        const to = shuffled[i + 1];
        const content =
          randomMessages[Math.floor(Math.random() * randomMessages.length)];
        pairs.push({ from, to, content });
      }
      let unpaired = null;
      if (shuffled.length % 2 === 1) {
        unpaired = shuffled[shuffled.length - 1];
      }
      res.json({ pairs, unpaired });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Shuffle demo failed', error: err.message });
    }
  },
  // Shuffle send: gelen eşleşmeleri DB'ye kaydeder ve RabbitMQ'ya yollar
  shuffleSend: async (req, res) => {
    try {
      const { pairs } = req.body;
      if (!Array.isArray(pairs) || pairs.length === 0) {
        return res.status(400).json({ message: 'No pairs provided' });
      }
      const results = [];
      for (const pair of pairs) {
        const { from, to, content } = pair;
        if (!from?._id || !to?._id || !content) {
          results.push({ pair, status: 'invalid' });
          continue;
        }
        // AutoMessage kaydet
        const autoMsg = await AutoMessage.create({
          from: from._id,
          to: to._id,
          content,
          sendDate: new Date(),
          isQueued: false,
          isSent: false,
        });
        // RabbitMQ kuyruğuna ekle
        await rabbitmqService.sendToQueue(autoMsg);
        autoMsg.isQueued = true;
        await autoMsg.save();
        results.push({ pair, status: 'queued' });
      }
      res.json({ results });
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Shuffle send failed', error: err.message });
    }
  },
};

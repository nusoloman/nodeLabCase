const cron = require('node-cron');
const User = require('../models/User');
const AutoMessage = require('../models/AutoMessage');

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

cron.schedule('0 2 * * *', async () => {
  try {
    const users = await User.find({}, '_id');
    if (users.length < 2) return;
    const shuffled = shuffle(users.map((u) => u._id.toString()));
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const from = shuffled[i];
      const to = shuffled[i + 1];
      const content =
        randomMessages[Math.floor(Math.random() * randomMessages.length)];
      const sendDate = new Date();
      await AutoMessage.create({
        from,
        to,
        content,
        sendDate,
        isQueued: false,
        isSent: false,
      });
    }
    // Eğer tek kişi kaldıysa eşleşmeden atlanır
  } catch (err) {
    console.error('AutoMessage cronjob error:', err);
  }
});

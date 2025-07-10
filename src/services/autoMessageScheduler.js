const cron = require('node-cron');
const User = require('../models/User');
const AutoMessage = require('../models/AutoMessage');
const rabbitmqService = require('../services/rabbitmqService');

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

// Her gece saat 02:00'de çalışacak şekilde cron ayarla
cron.schedule('0 2 * * *', async () => {
  try {
    // 1. Tüm kullanıcıları çek
    const users = await User.find({});
    if (users.length < 2) return; // Eşleşecek yeterli kullanıcı yok

    // 2. Kullanıcıları karıştır ve rastgele eşleştir
    const shuffled = shuffle([...users]);
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const from = shuffled[i]._id;
      const to = shuffled[i + 1]._id;
      // 3. Rastgele mesaj seç
      const content =
        randomMessages[Math.floor(Math.random() * randomMessages.length)];
      // 4. AutoMessage kaydet
      const autoMsg = await AutoMessage.create({
        from,
        to,
        content,
        sendDate: new Date(),
        isQueued: false,
        isSent: false,
      });
      // 5. RabbitMQ kuyruğuna ekle
      await rabbitmqService.sendToQueue(autoMsg);
      autoMsg.isQueued = true;
      await autoMsg.save();
    }
    // Eğer tek sayıda kullanıcı varsa son kullanıcı eşleşmeden kalır
  } catch (err) {
    console.error('AutoMessage cronjob error:', err);
  }
});

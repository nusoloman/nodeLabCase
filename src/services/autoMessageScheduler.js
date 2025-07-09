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

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const messages = await AutoMessage.find({
      sendDate: { $lte: now },
      isQueued: false,
    });

    for (const msg of messages) {
      await rabbitmqService.sendToQueue(msg);
      msg.isQueued = true;
      await msg.save();
    }
  } catch (err) {
    console.error('AutoMessage queue cronjob error:', err);
  }
});

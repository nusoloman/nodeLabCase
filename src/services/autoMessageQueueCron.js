const cron = require('node-cron');
const AutoMessage = require('../models/AutoMessage');
const rabbitmqService = require('./rabbitmqService');

cron.schedule('* * * * *', async () => {
  try {
    while (true) {
      // Atomik olarak bir mesajı bul, processing=true yap
      const msg = await AutoMessage.findOneAndUpdate(
        { sendDate: { $lte: new Date() }, isQueued: false, processing: false },
        { $set: { processing: true } },
        { new: true }
      );
      if (!msg) break;

      await rabbitmqService.sendToQueue(msg);
      // Kuyruğa atıldıktan sonra isQueued=true, processing=false yap
      msg.isQueued = true;
      msg.processing = false;
      await msg.save();
    }
  } catch (err) {
    console.error('AutoMessage queue cronjob error:', err);
  }
});

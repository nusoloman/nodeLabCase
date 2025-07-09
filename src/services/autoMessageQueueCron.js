const cron = require('node-cron');
const AutoMessage = require('../models/AutoMessage');
const rabbitmqService = require('./rabbitmqService');

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

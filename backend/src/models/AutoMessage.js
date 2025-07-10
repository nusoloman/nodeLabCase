const mongoose = require('mongoose');

const autoMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  sendDate: { type: Date, required: true },
  isQueued: { type: Boolean, default: false },
  isSent: { type: Boolean, default: false },
  processing: { type: Boolean, default: false },
});

module.exports = mongoose.model('AutoMessage', autoMessageSchema);

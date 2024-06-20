const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
  room: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  createdAt: { type: Date, default: Date.now }
});

const chat = mongoose.model('chat', chatSchema);
module.exports = chat;

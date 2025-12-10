const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contextType: {
    type: String,
    enum: ['house', 'direct', 'group'],
    default: 'house'
  },
  contextId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    index: true
  },
  tags: [
    {
      type: String,
      trim: true
    }
  ]
}, {
  timestamps: true
});

const ChatThread = mongoose.model('ChatThread', chatThreadSchema);

module.exports = ChatThread;

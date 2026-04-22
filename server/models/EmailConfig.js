const mongoose = require('mongoose');

const emailConfigSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  appPassword: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    default: 'Presales Reports'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmailConfig', emailConfigSchema);

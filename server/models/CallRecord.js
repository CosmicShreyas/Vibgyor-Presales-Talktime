const mongoose = require('mongoose');

const callRecordSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: [
      // New lead statuses
      'pending',
      'no-response',
      'not-interested',
      'qualified',
      'number-inactive',
      'number-switched-off',
      'on-hold',
      'no-requirement',
      'follow-up',
      'disqualified',
      'disconnected',
      'already-finalised',
      // Legacy statuses for backward compatibility
      'connected',
      'no_answer',
      'ignored',
      'on_hold',
      'callback',
      'switched_off',
      'busy',
      'wrong_number',
      'contacted',
      'interested',
      'closed'
    ],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  callbackDate: {
    type: Date
  },
  callDuration: {
    type: Number, // in seconds
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
callRecordSchema.index({ employeeId: 1, timestamp: -1 });
callRecordSchema.index({ clientId: 1, timestamp: -1 });

module.exports = mongoose.model('CallRecord', callRecordSchema);

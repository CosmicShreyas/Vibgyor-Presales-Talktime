const mongoose = require('mongoose');

const reportScheduleSchema = new mongoose.Schema({
  daily: {
    type: Boolean,
    default: false
  },
  weekly: {
    type: Boolean,
    default: false
  },
  monthly: {
    type: Boolean,
    default: false
  },
  recipients: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReportSchedule', reportScheduleSchema);

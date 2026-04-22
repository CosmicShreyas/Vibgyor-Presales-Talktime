const mongoose = require('mongoose');

// Function to generate unique ID
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}-${random}`;
};

const clientSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    unique: true,
    default: generateUniqueId
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  budget: {
    type: String,
    trim: true
  },
  tags: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: [
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
    ],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  lastCalled: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  importMethod: {
    type: String,
    enum: ['manual', 'csv', 'facebook', 'instagram', 'mapping'],
    default: 'manual'
  },
  csvFileName: {
    type: String,
    trim: true
  },
  csvImportId: {
    type: String,
    trim: true
  },
  isUnassigned: {
    type: Boolean,
    default: false
  },
  importedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
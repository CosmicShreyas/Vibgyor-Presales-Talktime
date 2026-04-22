const mongoose = require('mongoose');

const leadImageSchema = new mongoose.Schema({
  // Image identification
  imageId: {
    type: String,
    unique: true,
    required: true
  },
  
  // File information
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  
  // Metadata
  title: {
    type: String,
    required: true,
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  
  // Lead association
  leadUniqueId: {
    type: String,
    required: true,
    index: true
  },
  leadName: {
    type: String,
    required: true
  },
  
  // Brand partner association
  brandPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandPartner',
    required: true,
    index: true
  },
  brandPartnerCode: {
    type: String,
    required: true
  },
  brandPartnerName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
leadImageSchema.index({ brandPartnerId: 1, leadUniqueId: 1 });
leadImageSchema.index({ imageId: 1 });

module.exports = mongoose.model('LeadImage', leadImageSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const brandPartnerSchema = new mongoose.Schema({
  // Partner Information
  partnerName: {
    type: String,
    required: true,
    trim: true
  },
  nickName: {
    type: String,
    trim: true
  },
  partnerCode: {
    type: String,
    unique: true,
    trim: true
  },
  
  // Contact Information
  contactPerson1: {
    type: String,
    required: true,
    trim: true
  },
  phoneNo1: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be a valid 10-digit Indian mobile number'
    }
  },
  contactPerson2: {
    type: String,
    trim: true
  },
  phoneNo2: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Phone number must be a valid 10-digit Indian mobile number'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Address
  address: {
    type: String,
    required: true,
    trim: true
  },
  
  // Bank Details
  accountHolderName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  ifscCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: 'IFSC code must be in valid format (e.g., SBIN0001234)'
    }
  },
  
  // Documents
  pan: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'PAN must be in valid format (e.g., ABCDE1234F)'
    }
  },
  panDocument: {
    type: String, // Store file path or base64
    trim: true
  },
  ifscDocument: {
    type: String, // Store file path or base64
    trim: true
  },
  
  // Additional Information
  remarks: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  about: {
    type: String,
    trim: true,
    default: ''
  },
  memberSince: {
    type: Date,
    default: Date.now
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate partner code before saving
brandPartnerSchema.pre('save', async function(next) {
  // Generate partner code if not provided
  if (!this.partnerCode) {
    const count = await this.constructor.countDocuments();
    this.partnerCode = `VP${String(count + 1).padStart(3, '0')}`;
  }
  
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

// Method to compare password
brandPartnerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('BrandPartner', brandPartnerSchema);

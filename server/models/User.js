const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: function() {
      return this.role === 'sales'; // Only required for sales users
    },
    unique: true,
    sparse: true, // Allows multiple null values
    uppercase: true,
    trim: true
  },
  mappingId: {
    type: String,
    required: function() {
      return this.role === 'mapping'; // Required for mapping users
    },
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'sales', 'mapping'],
    default: 'sales'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystemAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
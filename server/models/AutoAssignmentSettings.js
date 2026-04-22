const mongoose = require('mongoose');

const autoAssignmentSettingsSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  lastAssignedIndex: {
    type: Number,
    default: -1
  },
  excludedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  employeeOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sourceAssignments: [{
    sourceName: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  csvFileAssignments: [{
    csvFileName: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Singleton pattern - only one settings document
autoAssignmentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('AutoAssignmentSettings', autoAssignmentSettingsSchema);

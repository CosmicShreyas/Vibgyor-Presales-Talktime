const express = require('express');
const ProjectSource = require('../models/ProjectSource');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all project sources
router.get('/', auth, async (req, res) => {
  try {
    const sources = await ProjectSource.find()
      .sort({ name: 1 })
      .populate('createdBy', 'name');
    res.json(sources);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new project source (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Source name is required' });
    }

    // Check if an ACTIVE source with the same name already exists
    const existingSource = await ProjectSource.findOne({ 
      name: name.trim(),
      isActive: true 
    });
    if (existingSource) {
      return res.status(400).json({ message: 'An active source with this name already exists' });
    }

    const source = new ProjectSource({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user._id
    });

    await source.save();
    await source.populate('createdBy', 'name');

    res.status(201).json(source);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project source (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Source name is required' });
    }

    // Get the current source to check the old name
    const currentSource = await ProjectSource.findById(req.params.id);
    if (!currentSource) {
      return res.status(404).json({ message: 'Source not found' });
    }

    const oldName = currentSource.name;
    const newName = name.trim();

    // Check if another ACTIVE source with the same name exists
    const existingSource = await ProjectSource.findOne({ 
      name: newName,
      _id: { $ne: req.params.id },
      isActive: true
    });
    
    if (existingSource) {
      return res.status(400).json({ message: 'An active source with this name already exists' });
    }

    // Update the source
    const source = await ProjectSource.findByIdAndUpdate(
      req.params.id,
      {
        name: newName,
        description: description?.trim() || '',
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('createdBy', 'name');

    // If the name changed, update all leads that use the old source name
    if (oldName !== newName) {
      const Client = require('../models/Client');
      const updateResult = await Client.updateMany(
        { source: oldName },
        { $set: { source: newName } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} lead(s) from source "${oldName}" to "${newName}"`);
    }

    res.json(source);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project source (admin only) - PERMANENT DELETE
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const source = await ProjectSource.findById(req.params.id);

    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    // Check if any leads are using this source
    const Client = require('../models/Client');
    const leadsUsingSource = await Client.countDocuments({ source: source.name });

    if (leadsUsingSource > 0) {
      return res.status(400).json({ 
        message: `Cannot delete source "${source.name}" because it is assigned to ${leadsUsingSource} lead${leadsUsingSource > 1 ? 's' : ''}.`,
        leadsCount: leadsUsingSource
      });
    }

    await ProjectSource.findByIdAndDelete(req.params.id);

    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const AutoAssignmentSettings = require('../models/AutoAssignmentSettings');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get auto-assignment settings
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const settings = await AutoAssignmentSettings.getSettings();
    await settings.populate('excludedEmployees', 'name email employeeId');
    await settings.populate('employeeOrder', 'name email employeeId');
    await settings.populate('sourceAssignments.assignedTo', 'name email employeeId');
    await settings.populate('csvFileAssignments.assignedTo', 'name email employeeId');
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update auto-assignment settings
router.put('/', auth, adminAuth, async (req, res) => {
  try {
    const { excludedEmployees, employeeOrder, sourceAssignments, csvFileAssignments } = req.body;
    
    const settings = await AutoAssignmentSettings.getSettings();
    
    if (excludedEmployees !== undefined) settings.excludedEmployees = excludedEmployees;
    if (employeeOrder !== undefined) settings.employeeOrder = employeeOrder;
    if (sourceAssignments !== undefined) settings.sourceAssignments = sourceAssignments;
    if (csvFileAssignments !== undefined) settings.csvFileAssignments = csvFileAssignments;
    
    await settings.save();
    await settings.populate('excludedEmployees', 'name email employeeId');
    await settings.populate('employeeOrder', 'name email employeeId');
    await settings.populate('sourceAssignments.assignedTo', 'name email employeeId');
    await settings.populate('csvFileAssignments.assignedTo', 'name email employeeId');
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get next employee for assignment (round-robin)
router.get('/next-employee', auth, adminAuth, async (req, res) => {
  try {
    const { source, csvFileName } = req.query;
    const settings = await AutoAssignmentSettings.getSettings();
    
    // Priority 1: Check if there's a CSV filename-specific assignment
    if (csvFileName && settings.csvFileAssignments && settings.csvFileAssignments.length > 0) {
      const csvAssignment = settings.csvFileAssignments.find(ca => ca.csvFileName === csvFileName);
      if (csvAssignment && csvAssignment.assignedTo) {
        // Get the employee details
        const employee = await User.findById(csvAssignment.assignedTo);
        if (employee) {
          return res.json({
            employeeId: employee._id,
            employeeName: employee.name,
            assignmentType: 'csv-file-specific'
          });
        }
      }
    }
    
    // Priority 2: Check if there's a source-specific assignment
    if (source && settings.sourceAssignments && settings.sourceAssignments.length > 0) {
      const sourceAssignment = settings.sourceAssignments.find(sa => sa.sourceName === source);
      if (sourceAssignment && sourceAssignment.assignedTo) {
        // Get the employee details
        const employee = await User.findById(sourceAssignment.assignedTo);
        if (employee) {
          return res.json({
            employeeId: employee._id,
            employeeName: employee.name,
            assignmentType: 'source-specific'
          });
        }
      }
    }
    
    // Priority 3: Fall back to round-robin if no specific assignment
    // Get all sales and mapping employees
    const allEmployees = await User.find({ 
      role: { $in: ['sales', 'mapping'] },
      isActive: true 
    }).sort({ createdAt: 1 });
    
    if (allEmployees.length === 0) {
      return res.status(404).json({ message: 'No employees available' });
    }
    
    // Use employeeOrder if set, otherwise use all employees
    let orderedEmployees = allEmployees;
    if (settings.employeeOrder && settings.employeeOrder.length > 0) {
      orderedEmployees = settings.employeeOrder.map(id => 
        allEmployees.find(emp => emp._id.toString() === id.toString())
      ).filter(Boolean);
    }
    
    // Filter out excluded employees
    const availableEmployees = orderedEmployees.filter(emp => 
      !settings.excludedEmployees.some(excluded => 
        excluded.toString() === emp._id.toString()
      )
    );
    
    if (availableEmployees.length === 0) {
      return res.status(404).json({ message: 'No available employees for assignment' });
    }
    
    // Round-robin: get next employee
    let nextIndex = (settings.lastAssignedIndex + 1) % availableEmployees.length;
    const nextEmployee = availableEmployees[nextIndex];
    
    // Update last assigned index
    settings.lastAssignedIndex = nextIndex;
    await settings.save();
    
    res.json({
      employeeId: nextEmployee._id,
      employeeName: nextEmployee.name,
      nextIndex,
      assignmentType: 'round-robin'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize employee order (sets order to all current employees)
router.post('/initialize-order', auth, adminAuth, async (req, res) => {
  try {
    const settings = await AutoAssignmentSettings.getSettings();
    const allEmployees = await User.find({ 
      role: { $in: ['sales', 'mapping'] },
      isActive: true 
    }).sort({ createdAt: 1 });
    
    settings.employeeOrder = allEmployees.map(emp => emp._id);
    await settings.save();
    await settings.populate('employeeOrder', 'name email employeeId');
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unique CSV filenames from imported leads
router.get('/csv-files', auth, adminAuth, async (req, res) => {
  try {
    const Client = require('../models/Client');
    
    // Get unique CSV filenames
    const csvFiles = await Client.distinct('csvFileName', {
      importMethod: 'csv',
      csvFileName: { $exists: true, $ne: null, $ne: '' }
    });
    
    res.json(csvFiles.sort());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process all unassigned leads
router.post('/process-unassigned', auth, adminAuth, async (req, res) => {
  try {
    const Client = require('../models/Client');
    const settings = await AutoAssignmentSettings.getSettings();
    
    // Get all unassigned leads
    const unassignedLeads = await Client.find({ isUnassigned: true });
    
    if (unassignedLeads.length === 0) {
      return res.json({ success: false, message: 'No unassigned leads to process', assignedCount: 0 });
    }
    
    let assignedCount = 0;
    let failedCount = 0;
    
    for (const lead of unassignedLeads) {
      try {
        let assignedEmployeeId = null;
        
        // Priority 1: Check CSV file-specific assignment
        if (lead.csvFileName && settings.csvFileAssignments && settings.csvFileAssignments.length > 0) {
          const csvAssignment = settings.csvFileAssignments.find(ca => ca.csvFileName === lead.csvFileName);
          if (csvAssignment && csvAssignment.assignedTo) {
            assignedEmployeeId = csvAssignment.assignedTo;
          }
        }
        
        // Priority 2: Check source-specific assignment
        if (!assignedEmployeeId && lead.source && settings.sourceAssignments && settings.sourceAssignments.length > 0) {
          const sourceAssignment = settings.sourceAssignments.find(sa => sa.sourceName === lead.source);
          if (sourceAssignment && sourceAssignment.assignedTo) {
            assignedEmployeeId = sourceAssignment.assignedTo;
          }
        }
        
        // Priority 3: Round-robin assignment
        if (!assignedEmployeeId) {
          // Get all sales and mapping employees
          const allEmployees = await User.find({ 
            role: { $in: ['sales', 'mapping'] },
            isActive: true 
          }).sort({ createdAt: 1 });
          
          if (allEmployees.length === 0) {
            failedCount++;
            continue;
          }
          
          // Use employeeOrder if set, otherwise use all employees
          let orderedEmployees = allEmployees;
          if (settings.employeeOrder && settings.employeeOrder.length > 0) {
            orderedEmployees = settings.employeeOrder.map(id => 
              allEmployees.find(emp => emp._id.toString() === id.toString())
            ).filter(Boolean);
          }
          
          // Filter out excluded employees
          const availableEmployees = orderedEmployees.filter(emp => 
            !settings.excludedEmployees.some(excluded => 
              excluded.toString() === emp._id.toString()
            )
          );
          
          if (availableEmployees.length === 0) {
            failedCount++;
            continue;
          }
          
          // Round-robin: get next employee
          let nextIndex = (settings.lastAssignedIndex + 1) % availableEmployees.length;
          const nextEmployee = availableEmployees[nextIndex];
          
          assignedEmployeeId = nextEmployee._id;
          
          // Update last assigned index
          settings.lastAssignedIndex = nextIndex;
          await settings.save();
        }
        
        // Assign the lead
        if (assignedEmployeeId) {
          lead.assignedTo = assignedEmployeeId;
          lead.isUnassigned = false;
          await lead.save();
          assignedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error assigning lead ${lead._id}:`, error);
        failedCount++;
      }
    }
    
    res.json({
      success: true,
      assignedCount,
      failedCount,
      message: `Successfully assigned ${assignedCount} lead(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

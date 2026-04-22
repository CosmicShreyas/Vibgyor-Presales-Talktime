const express = require('express');
const nodemailer = require('nodemailer');
const EmailConfig = require('../models/EmailConfig');
const ReportSchedule = require('../models/ReportSchedule');
const Client = require('../models/Client');
const CallRecord = require('../models/CallRecord');
const User = require('../models/User');
const reportGenerator = require('../services/reportGenerator');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get email configuration
router.get('/email-config', auth, adminAuth, async (req, res) => {
  try {
    const config = await EmailConfig.findOne().select('-appPassword');
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save email configuration
router.post('/email-config', auth, adminAuth, async (req, res) => {
  try {
    const { email, appPassword, senderName } = req.body;

    if (!email || !appPassword || !senderName) {
      return res.status(400).json({ message: 'Email, app password, and sender name are required' });
    }

    // Update or create email config
    let config = await EmailConfig.findOne();
    if (config) {
      config.email = email;
      config.appPassword = appPassword;
      config.senderName = senderName;
      config.updatedBy = req.user._id;
      await config.save();
    } else {
      config = new EmailConfig({
        email,
        appPassword,
        senderName,
        updatedBy: req.user._id
      });
      await config.save();
    }

    res.json({ message: 'Email configuration saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get report schedule
router.get('/schedule', auth, adminAuth, async (req, res) => {
  try {
    const schedule = await ReportSchedule.findOne();
    res.json(schedule || { daily: false, weekly: false, monthly: false, recipients: '' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save report schedule
router.post('/schedule', auth, adminAuth, async (req, res) => {
  try {
    const { daily, weekly, monthly, recipients } = req.body;

    let schedule = await ReportSchedule.findOne();
    if (schedule) {
      schedule.daily = daily;
      schedule.weekly = weekly;
      schedule.monthly = monthly;
      schedule.recipients = recipients;
      schedule.updatedBy = req.user._id;
      await schedule.save();
    } else {
      schedule = new ReportSchedule({
        daily,
        weekly,
        monthly,
        recipients,
        updatedBy: req.user._id
      });
      await schedule.save();
    }

    res.json({ message: 'Report schedule saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate and send report
router.post('/generate', auth, adminAuth, async (req, res) => {
  try {
    const { type } = req.body; // daily, weekly, monthly

    const config = await EmailConfig.findOne();
    if (!config) {
      return res.status(400).json({ message: 'Email configuration not found' });
    }

    const schedule = await ReportSchedule.findOne();
    if (!schedule || !schedule.recipients) {
      return res.status(400).json({ message: 'No recipients configured' });
    }

    // Calculate date range based on report type
    const now = new Date();
    let startDate;
    let reportTitle;
    let reportTypeText;

    switch (type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        reportTitle = 'Daily Report';
        reportTypeText = 'daily';
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        reportTitle = 'Weekly Report';
        reportTypeText = 'weekly';
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        reportTitle = 'Monthly Report';
        reportTypeText = 'monthly';
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Fetch all necessary data
    const [leads, callRecords, users] = await Promise.all([
      Client.find({ createdAt: { $gte: startDate } }).populate('assignedTo'),
      CallRecord.find({ timestamp: { $gte: startDate } }).populate('clientId').populate('employeeId'),
      User.find({ role: { $in: ['sales', 'mapping'] }, isActive: true })
    ]);
    
    // Get all unique leads that were contacted in this period (for status distribution)
    const contactedLeadIds = [...new Set(callRecords.map(r => r.clientId?._id?.toString()).filter(Boolean))];
    const contactedLeads = await Client.find({ _id: { $in: contactedLeadIds } });

    // Calculate statistics
    const uniqueLeads = contactedLeadIds.length;
    const dueScheduledCalls = leads.filter(l => 
      l.followUpDate && new Date(l.followUpDate) <= now && l.status === 'follow-up'
    ).length;

    // Call statistics
    const callStats = {
      incoming: { count: 0, duration: 0 },
      outgoing: { count: 0, duration: 0 },
      missed: { count: 0, duration: 0 },
      rejected: { count: 0, duration: 0 },
      total: { count: callRecords.length, duration: 0 },
      neverAttended: 0,
      notPickup: 0,
      workingHours: 0,
      connectedCalls: 0
    };

    callRecords.forEach(record => {
      const duration = record.callDuration || 0;
      callStats.total.duration += duration;
      callStats.workingHours += duration;
      
      if (duration > 0) {
        callStats.connectedCalls++;
      }
      
      // Categorize by call type (you may need to add callType field to CallRecord model)
      if (record.status === 'qualified' || record.status === 'already-finalised') {
        callStats.outgoing.count++;
        callStats.outgoing.duration += duration;
      } else if (record.status === 'no-response') {
        callStats.missed.count++;
        callStats.neverAttended++;
      } else if (record.status === 'not-interested') {
        callStats.notPickup++;
      }
    });

    callStats.incoming.duration = formatDuration(callStats.incoming.duration);
    callStats.outgoing.duration = formatDuration(callStats.outgoing.duration);
    callStats.total.duration = formatDuration(callStats.total.duration);
    callStats.workingHours = formatDuration(callStats.workingHours);

    // Status distribution - use contacted leads (leads that have call records in this period)
    const statusCounts = {};
    
    // If we have contacted leads, use them
    if (contactedLeads.length > 0) {
      contactedLeads.forEach(lead => {
        const status = lead.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    } else if (leads.length > 0) {
      // Fallback: if no call records, use newly created leads
      leads.forEach(lead => {
        const status = lead.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));
    
    console.log('=== Report Generation Debug ===');
    console.log('Date Range:', startDate, 'to', now);
    console.log('Total Call Records:', callRecords.length);
    console.log('Contacted Leads:', contactedLeads.length);
    console.log('Newly Created Leads:', leads.length);
    console.log('Status Distribution:', statusDistribution);
    console.log('Status Distribution Length:', statusDistribution.length);
    console.log('==============================');

    // Employee statistics
    const employeeStats = [];
    for (const user of users) {
      const userCalls = callRecords.filter(r => r.employeeId?._id?.toString() === user._id.toString());
      const userLeads = new Set(userCalls.map(r => r.clientId?._id?.toString()).filter(Boolean));
      
      const totalDuration = userCalls.reduce((sum, call) => sum + (call.callDuration || 0), 0);
      const connectedCalls = userCalls.filter(call => (call.callDuration || 0) > 0).length;
      
      const userLeadStatuses = {};
      userCalls.forEach(call => {
        if (call.clientId) {
          const status = call.status || 'pending';
          userLeadStatuses[status] = (userLeadStatuses[status] || 0) + 1;
        }
      });
      
      employeeStats.push({
        name: `${user.name} (+91-${user.employeeId})`,
        totalCalls: userCalls.length,
        totalDuration: formatDuration(totalDuration),
        workingHours: formatDuration(totalDuration),
        uniqueLeads: userLeads.size,
        connectedCalls,
        statusWiseLeads: Object.entries(userLeadStatuses).map(([status, count]) => ({
          status: status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count
        }))
      });
    }

    // Generate PDF
    const reportData = {
      dateRange: `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      uniqueLeads,
      dueScheduledCalls,
      callStats,
      statusDistribution,
      employeeStats
    };

    const pdfBuffer = await reportGenerator.generateLeadReport(reportData, type);

    // Create stylish email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
          .content { padding: 40px 30px; }
          .content p { color: #333; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0; }
          .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
          .highlight h2 { margin: 0 0 10px 0; font-size: 24px; }
          .highlight p { margin: 0; font-size: 14px; opacity: 0.9; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
          .footer p { color: #6c757d; margin: 5px 0; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; color: white; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📊 Presales</div>
            <h1>${reportTitle}</h1>
            <p>${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Here are your <strong>${reportTypeText}</strong> reports from <strong>Presales</strong>.</p>
            <p>The attached PDF contains comprehensive analytics including:</p>
            <ul style="color: #555; line-height: 1.8;">
              <li>📈 Lead summary and statistics</li>
              <li>📞 Call type breakdown with talk time</li>
              <li>🎯 Lead status distribution chart</li>
              <li>👥 Employee performance metrics</li>
            </ul>
            <div class="highlight">
              <h2>${uniqueLeads}</h2>
              <p>Unique Leads Contacted</p>
            </div>
            <p>Please find the detailed report attached as a PDF file.</p>
            <p>If you have any questions or need additional information, feel free to reach out.</p>
          </div>
          <div class="footer">
            <p><strong>Presales - Sales Call Manager</strong></p>
            <p>Automated Report System</p>
            <p style="font-size: 12px; margin-top: 15px;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email with PDF attachment
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email,
        pass: config.appPassword
      }
    });

    const recipients = schedule.recipients.split(',').map(email => email.trim());

    await transporter.sendMail({
      from: `"${config.senderName}" <${config.email}>`,
      to: recipients,
      subject: `${reportTitle} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | Presales`,
      html: emailHTML,
      attachments: [{
        filename: `TalkTime_${type}_Report_${now.toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    res.json({ message: `${reportTitle} generated and sent successfully` });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

module.exports = router;

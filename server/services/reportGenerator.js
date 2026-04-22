const PDFDocument = require('pdfkit');
const axios = require('axios');
const { createCanvas } = require('canvas');

class ReportGenerator {
  constructor() {
    // Using QuickChart.io API for chart generation
  }

  async generateLeadReport(reportData, reportType) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Page 1: Header and Lead Summary
        this.addHeader(doc, reportData.dateRange);
        this.addLeadSummary(doc, reportData);
        await this.addCallTypeTable(doc, reportData.callStats);
        
        // Page 2: Pie Chart for Lead Status Distribution
        if (reportData.statusDistribution && reportData.statusDistribution.length > 0) {
          console.log('Adding pie chart page - status distribution has', reportData.statusDistribution.length, 'statuses');
          doc.addPage();
          this.addHeader(doc, reportData.dateRange);
          await this.addStatusPieChart(doc, reportData.statusDistribution);
        } else {
          console.log('Skipping pie chart page - no status distribution data');
          console.log('statusDistribution:', reportData.statusDistribution);
        }
        
        // Page 3: Employee Performance Table
        if (reportData.employeeStats && reportData.employeeStats.length > 0) {
          doc.addPage();
          this.addHeader(doc, reportData.dateRange);
          this.addEmployeePerformanceTable(doc, reportData.employeeStats);
        }
        
        doc.end();
      } catch (error) {
        console.error('PDF Generation Error:', error);
        reject(error);
      }
    });
  }

  addHeader(doc, dateRange) {
    // Presales logo (left side)
    doc.fontSize(20)
       .fillColor('#FF6B35')
       .text('Presales', 50, 50);
    
    // Title (center)
    doc.fontSize(24)
       .fillColor('#000000')
       .text('LEAD REPORT', 0, 50, { align: 'center', width: doc.page.width });
    
    // Company name (right side)
    doc.fontSize(16)
       .fillColor('#000000')
       .text('VIBGYOR', doc.page.width - 150, 50, { width: 100 });
    
    // Orange line
    doc.moveTo(50, 85)
       .lineTo(doc.page.width - 50, 85)
       .strokeColor('#FF9500')
       .lineWidth(3)
       .stroke();
    
    // Date range
    doc.fontSize(18)
       .fillColor('#000000')
       .text(`Lead Summary of ${dateRange}`, 50, 110, { align: 'center', width: doc.page.width - 100 });
  }

  addLeadSummary(doc, reportData) {
    const startY = 160;
    const boxWidth = 150;
    const boxHeight = 100;
    
    // Left box - Unique Leads
    doc.rect(50, startY, boxWidth, boxHeight)
       .fillAndStroke('#F5F5F5', '#CCCCCC');
    
    doc.fontSize(14)
       .fillColor('#000000')
       .text('Unique Leads', 50, startY + 25, { width: boxWidth, align: 'center' });
    
    doc.fontSize(32)
       .fillColor('#000000')
       .text(reportData.uniqueLeads.toString(), 50, startY + 50, { width: boxWidth, align: 'center' });
    
    // Left box - Due Scheduled Calls
    const box2Y = startY + boxHeight + 20;
    doc.rect(50, box2Y, boxWidth, boxHeight)
       .fillAndStroke('#F5F5F5', '#CCCCCC');
    
    doc.fontSize(14)
       .fillColor('#000000')
       .text('Due Scheduled', 50, box2Y + 20, { width: boxWidth, align: 'center' });
    
    doc.fontSize(14)
       .fillColor('#000000')
       .text('Calls', 50, box2Y + 38, { width: boxWidth, align: 'center' });
    
    doc.fontSize(32)
       .fillColor('#000000')
       .text(reportData.dueScheduledCalls.toString(), 50, box2Y + 55, { width: boxWidth, align: 'center' });
  }

  async addCallTypeTable(doc, callStats) {
    const startX = 220;
    const startY = 160;
    const tableWidth = doc.page.width - startX - 50;
    const col1Width = tableWidth * 0.45;
    const col2Width = tableWidth * 0.25;
    const col3Width = tableWidth * 0.30;
    const rowHeight = 40;
    
    // Table header
    doc.rect(startX, startY, tableWidth, rowHeight)
       .fillAndStroke('#E5E5E5', '#CCCCCC');
    
    doc.fontSize(12)
       .fillColor('#000000');
    
    doc.text('Call Type', startX + 10, startY + 13, { width: col1Width - 20, continued: false });
    doc.text('Calls', startX + col1Width + 10, startY + 13, { width: col2Width - 20, continued: false });
    doc.text('Talk Time', startX + col1Width + col2Width + 10, startY + 13, { width: col3Width - 20, continued: false });
    
    // Table rows
    const rows = [
      { type: 'Incoming', calls: callStats.incoming.count, time: callStats.incoming.duration, color: '#10B981' },
      { type: 'Outgoing', calls: callStats.outgoing.count, time: callStats.outgoing.duration, color: '#F59E0B' },
      { type: 'Missed', calls: callStats.missed.count, time: '-', color: '#EF4444' },
      { type: 'Rejected', calls: callStats.rejected.count, time: '-', color: '#6B7280' }
    ];
    
    let currentY = startY + rowHeight;
    rows.forEach(row => {
      doc.rect(startX, currentY, tableWidth, rowHeight)
         .stroke('#CCCCCC');
      
      doc.fontSize(11)
         .fillColor(row.color);
      doc.text(row.type, startX + 10, currentY + 13, { width: col1Width - 20, continued: false });
      
      doc.fillColor('#000000');
      doc.text(row.calls.toString(), startX + col1Width + 10, currentY + 13, { width: col2Width - 20, continued: false });
      doc.text(row.time, startX + col1Width + col2Width + 10, currentY + 13, { width: col3Width - 20, continued: false });
      
      currentY += rowHeight;
    });
    
    // Total row
    doc.rect(startX, currentY, tableWidth, rowHeight)
       .fillAndStroke('#E5E5E5', '#CCCCCC');
    
    doc.fontSize(12)
       .fillColor('#000000');
    doc.text('Total', startX + 10, currentY + 13, { width: col1Width - 20, continued: false });
    doc.text(callStats.total.count.toString(), startX + col1Width + 10, currentY + 13, { width: col2Width - 20, continued: false });
    doc.text(callStats.total.duration, startX + col1Width + col2Width + 10, currentY + 13, { width: col3Width - 20, continued: false });
    
    // Additional stats
    currentY += rowHeight + 10;
    const additionalStats = [
      { label: 'Never Attended', value: callStats.neverAttended },
      { label: 'Not Pickup by Client', value: callStats.notPickup },
      { label: 'Working Hours', value: callStats.workingHours },
      { label: 'Connected Calls', value: callStats.connectedCalls }
    ];
    
    additionalStats.forEach(stat => {
      doc.rect(startX, currentY, tableWidth, rowHeight)
         .stroke('#CCCCCC');
      
      doc.fontSize(11)
         .fillColor('#000000');
      doc.text(stat.label, startX + 10, currentY + 13, { width: col1Width + col2Width - 20, continued: false });
      doc.text(stat.value.toString(), startX + col1Width + col2Width + 10, currentY + 13, { width: col3Width - 20, continued: false });
      
      currentY += rowHeight;
    });
  }

  async addStatusPieChart(doc, statusDistribution) {
    try {
      console.log('Generating 3D pie chart with node-canvas, data:', statusDistribution);
      
      doc.fontSize(18)
         .fillColor('#000000')
         .text('Lead Status Distribution', 50, 160, { align: 'center', width: doc.page.width - 100, continued: false });
      
      const total = statusDistribution.reduce((sum, item) => sum + item.count, 0);
      
      if (total === 0) {
        doc.fontSize(12)
           .fillColor('#6B7280')
           .text('No data available for chart', 50, 250, { align: 'center', width: doc.page.width - 100, continued: false });
        return;
      }
      
      // Assign random colors based on status type
      const dataWithColors = statusDistribution.map((item) => {
        const status = item.status.toLowerCase();
        let color;
        
        // Negative fields - lighter shade colors
        if (status.includes('no response') || 
            status.includes('number inactive') || 
            status.includes('not interested') || 
            status.includes('number switched off') || 
            status.includes('no requirement') || 
            status.includes('disconnected') ||
            status.includes('inactive') ||
            status.includes('switched off') ||
            status.includes('rejected') ||
            status.includes('disqualified')) {
          // Generate random lighter colors (pastel shades)
          color = this.generateRandomLightColor();
        } else {
          // Positive/neutral fields - darker colors
          color = this.generateRandomDarkColor();
        }
        
        return {
          ...item,
          color: color
        };
      });
      
      // Generate 3D pie chart using canvas
      const chartBuffer = this.generate3DPieChart(dataWithColors, 600, 450);
      
      console.log('3D chart image generated, size:', chartBuffer.length, 'bytes');
      
      // Add the chart image to PDF
      doc.image(chartBuffer, 50, 200, { 
        width: 500,
        height: 375
      });
      
      console.log('3D pie chart added to PDF successfully');
      
    } catch (error) {
      console.error('3D pie chart generation error:', error.message);
      console.error('Stack trace:', error.stack);
      
      doc.fontSize(16)
         .fillColor('#000000')
         .text('Lead Status Distribution', 50, 160, { continued: false });
      
      doc.fontSize(12)
         .fillColor('#EF4444')
         .text('Error generating 3D pie chart. Displaying data as list:', 50, 200, { continued: false });
      
      // Display data as text list as fallback
      doc.fontSize(10)
         .fillColor('#000000');
      let y = 230;
      statusDistribution.forEach(item => {
        const percentage = Math.round((item.count / statusDistribution.reduce((sum, i) => sum + i.count, 0)) * 100);
        doc.text(`${item.status}: ${item.count} (${percentage}%)`, 50, y, { continued: false });
        y += 20;
      });
    }
  }

  generateRandomLightColor() {
    // Generate pastel/light colors (RGB values between 180-255)
    const r = Math.floor(Math.random() * 76) + 180; // 180-255
    const g = Math.floor(Math.random() * 76) + 180; // 180-255
    const b = Math.floor(Math.random() * 76) + 180; // 180-255
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  generateRandomDarkColor() {
    // Generate darker/vibrant colors (RGB values between 0-180)
    const r = Math.floor(Math.random() * 181); // 0-180
    const g = Math.floor(Math.random() * 181); // 0-180
    const b = Math.floor(Math.random() * 181); // 0-180
    
    // Ensure at least one channel is reasonably bright for visibility
    const maxChannel = Math.max(r, g, b);
    if (maxChannel < 100) {
      // Boost one random channel to ensure visibility
      const channels = [r, g, b];
      const boostIndex = Math.floor(Math.random() * 3);
      channels[boostIndex] = Math.floor(Math.random() * 81) + 100; // 100-180
      return `#${channels[0].toString(16).padStart(2, '0')}${channels[1].toString(16).padStart(2, '0')}${channels[2].toString(16).padStart(2, '0')}`;
    }
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  generate3DPieChart(data, width = 600, height = 450) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate total
    const total = data.reduce((sum, item) => sum + item.count, 0);
    
    // Chart settings
    const centerX = width * 0.35;
    const centerY = height * 0.5;
    const radiusX = 140; // Horizontal radius
    const radiusY = 95; // Vertical radius (smaller for 3D effect)
    const depth = 30; // 3D depth - increased for better visibility
    
    // Calculate angles for each slice
    let currentAngle = -Math.PI / 2; // Start from top
    const slices = data.map(item => {
      const angle = (item.count / total) * 2 * Math.PI;
      const slice = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        angle: angle
      };
      currentAngle += angle;
      return slice;
    });
    
    // Sort slices to draw back slices first, then front slices
    const backSlices = slices.filter(slice => {
      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      return midAngle > 0 && midAngle < Math.PI;
    });
    
    const frontSlices = slices.filter(slice => {
      const midAngle = (slice.startAngle + slice.endAngle) / 2;
      return midAngle <= 0 || midAngle >= Math.PI;
    });
    
    // Draw 3D sides for back slices (visible sides)
    ctx.save();
    backSlices.forEach(slice => {
      // Draw the side/edge of the slice
      ctx.beginPath();
      
      // Calculate edge points
      const x1 = centerX + radiusX * Math.cos(slice.startAngle);
      const y1 = centerY + radiusY * Math.sin(slice.startAngle);
      const x2 = centerX + radiusX * Math.cos(slice.endAngle);
      const y2 = centerY + radiusY * Math.sin(slice.endAngle);
      
      // Draw the outer edge
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y1 + depth);
      
      // Draw the arc at the bottom
      ctx.ellipse(centerX, centerY + depth, radiusX, radiusY, 0, slice.startAngle, slice.endAngle);
      
      // Complete the shape
      ctx.lineTo(x2, y2);
      ctx.closePath();
      
      // Fill with darkened color
      ctx.fillStyle = this.darkenColor(slice.color, 0.5);
      ctx.fill();
      
      // Add border
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
    
    // Draw the bottom ellipse edge (outline)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + depth, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    
    // Draw top surface of pie (all slices)
    slices.forEach(slice => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.ellipse(
        centerX, 
        centerY, 
        radiusX, 
        radiusY, 
        0, 
        slice.startAngle, 
        slice.endAngle
      );
      ctx.closePath();
      
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw labels with lines
    const labelStartX = width * 0.62;
    let labelY = 60;
    const labelSpacing = Math.min(35, (height - 120) / data.length);
    
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    
    slices.forEach((slice) => {
      // Draw color box
      ctx.fillStyle = slice.color;
      ctx.fillRect(labelStartX, labelY - 10, 15, 15);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(labelStartX, labelY - 10, 15, 15);
      
      // Draw label text
      ctx.fillStyle = '#000';
      const percentage = Math.round((slice.count / total) * 100);
      ctx.fillText(`${slice.status}`, labelStartX + 22, labelY);
      
      // Draw count and percentage
      ctx.font = '10px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(`(${slice.count}) ${percentage}%`, labelStartX + 22, labelY + 12);
      ctx.font = 'bold 11px Arial';
      
      labelY += labelSpacing;
    });
    
    return canvas.toBuffer('image/png');
  }

  darkenColor(color, factor) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Darken
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  addEmployeePerformanceTable(doc, employeeStats) {
    doc.fontSize(16)
       .fillColor('#000000')
       .text('Employee Performance', 50, 160);
    
    const startY = 200;
    const pageWidth = doc.page.width - 100;
    const colWidths = [30, 100, 50, 70, 60, 70, 60, 105];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const scale = pageWidth / totalWidth;
    const scaledWidths = colWidths.map(w => w * scale);
    const rowHeight = 25;
    
    // Table header
    doc.rect(50, startY, pageWidth, rowHeight)
       .fillAndStroke('#E5E5E5', '#CCCCCC');
    
    const headers = ['Sr.', 'Employee', 'Calls', 'Duration', 'Hours', 'Leads', 'Conn.', 'Status'];
    let currentX = 50;
    doc.fontSize(8).fillColor('#000000');
    headers.forEach((header, i) => {
      doc.text(header, currentX + 3, startY + 8, { width: scaledWidths[i] - 6, align: 'center', continued: false });
      currentX += scaledWidths[i];
    });
    
    // Table rows
    let currentY = startY + rowHeight;
    employeeStats.forEach((emp, index) => {
      const statusLines = emp.statusWiseLeads.slice(0, 5); // Limit to 5 statuses
      const cellHeight = Math.max(rowHeight, statusLines.length * 12 + 8);
      
      // Check if we need a new page
      if (currentY + cellHeight > doc.page.height - 100) {
        doc.addPage();
        this.addHeader(doc, '');
        currentY = 200;
      }
      
      doc.rect(50, currentY, pageWidth, cellHeight)
         .stroke('#CCCCCC');
      
      currentX = 50;
      doc.fontSize(8).fillColor('#000000');
      
      // Sr. No
      doc.text((index + 1).toString(), currentX + 3, currentY + 8, { width: scaledWidths[0] - 6, align: 'center', continued: false });
      currentX += scaledWidths[0];
      
      // Employee Name
      doc.text(emp.name, currentX + 3, currentY + 8, { width: scaledWidths[1] - 6, continued: false });
      currentX += scaledWidths[1];
      
      // Total Calls
      doc.text(emp.totalCalls.toString(), currentX + 3, currentY + 8, { width: scaledWidths[2] - 6, align: 'center', continued: false });
      currentX += scaledWidths[2];
      
      // Total Duration
      doc.text(emp.totalDuration, currentX + 3, currentY + 8, { width: scaledWidths[3] - 6, align: 'center', continued: false });
      currentX += scaledWidths[3];
      
      // Working Hours
      doc.text(emp.workingHours, currentX + 3, currentY + 8, { width: scaledWidths[4] - 6, align: 'center', continued: false });
      currentX += scaledWidths[4];
      
      // Unique Leads
      doc.text(emp.uniqueLeads.toString(), currentX + 3, currentY + 8, { width: scaledWidths[5] - 6, align: 'center', continued: false });
      currentX += scaledWidths[5];
      
      // Connected Calls
      doc.text(emp.connectedCalls.toString(), currentX + 3, currentY + 8, { width: scaledWidths[6] - 6, align: 'center', continued: false });
      currentX += scaledWidths[6];
      
      // Status Wise Leads
      doc.fontSize(7);
      let statusY = currentY + 5;
      statusLines.forEach(status => {
        doc.text(`${status.status} (${status.count})`, currentX + 3, statusY, { width: scaledWidths[7] - 6, continued: false });
        statusY += 11;
      });
      
      currentY += cellHeight;
    });
    
    // Total row
    const totalRow = this.calculateTotals(employeeStats);
    doc.rect(50, currentY, pageWidth, rowHeight)
       .fillAndStroke('#E5E5E5', '#CCCCCC');
    
    currentX = 50;
    doc.fontSize(9).fillColor('#000000');
    doc.text('', currentX + 3, currentY + 8, { width: scaledWidths[0] - 6, continued: false });
    currentX += scaledWidths[0];
    doc.text('Total', currentX + 3, currentY + 8, { width: scaledWidths[1] - 6, continued: false });
    currentX += scaledWidths[1];
    doc.text(totalRow.totalCalls.toString(), currentX + 3, currentY + 8, { width: scaledWidths[2] - 6, align: 'center', continued: false });
    currentX += scaledWidths[2];
    doc.text(totalRow.totalDuration, currentX + 3, currentY + 8, { width: scaledWidths[3] - 6, align: 'center', continued: false });
    currentX += scaledWidths[3];
    doc.text(totalRow.workingHours, currentX + 3, currentY + 8, { width: scaledWidths[4] - 6, align: 'center', continued: false });
    currentX += scaledWidths[4];
    doc.text(totalRow.uniqueLeads.toString(), currentX + 3, currentY + 8, { width: scaledWidths[5] - 6, align: 'center', continued: false });
    currentX += scaledWidths[5];
    doc.text(totalRow.connectedCalls.toString(), currentX + 3, currentY + 8, { width: scaledWidths[6] - 6, align: 'center', continued: false });
  }

  calculateTotals(employeeStats) {
    return employeeStats.reduce((acc, emp) => ({
      totalCalls: acc.totalCalls + emp.totalCalls,
      totalDuration: this.addDurations(acc.totalDuration, emp.totalDuration),
      workingHours: this.addDurations(acc.workingHours, emp.workingHours),
      uniqueLeads: acc.uniqueLeads + emp.uniqueLeads,
      connectedCalls: acc.connectedCalls + emp.connectedCalls
    }), { totalCalls: 0, totalDuration: '0h 0m 0s', workingHours: '0h 0m 0s', uniqueLeads: 0, connectedCalls: 0 });
  }

  addDurations(dur1, dur2) {
    const parse = (dur) => {
      const match = dur.match(/(\d+)h\s*(\d+)m\s*(\d+)s/);
      if (!match) return 0;
      return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
    };
    
    const totalSeconds = parse(dur1) + parse(dur2);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
}

module.exports = new ReportGenerator();

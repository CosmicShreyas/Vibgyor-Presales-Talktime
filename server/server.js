const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const callRoutes = require('./routes/calls');
const reportRoutes = require('./routes/reports');
const projectSourceRoutes = require('./routes/projectSources');
const facebookWebhookRoutes = require('./routes/facebookWebhook');
const autoAssignmentRoutes = require('./routes/autoAssignment');
const mappingSyncRoutes = require('./routes/mappingSync');
const brandPartnerRoutes = require('./routes/brandPartners');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Presales API Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/project-sources', projectSourceRoutes);
app.use('/api/facebook-webhook', facebookWebhookRoutes);
app.use('/api/auto-assignment', autoAssignmentRoutes);
app.use('/api/mapping-sync', mappingSyncRoutes);
app.use('/api/brand-partners', brandPartnerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Presales API Server',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      documentation: '/api-docs',
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      clients: '/api/clients/*',
      calls: '/api/calls/*',
      reports: '/api/reports/*'
    }
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Auto-create system admin if it doesn't exist
    const User = require('./models/User');
    try {
      const existingAdmin = await User.findOne({ email: 'admin@talktime.com' });
      
      if (!existingAdmin) {
        const adminUser = new User({
          name: 'Admin User',
          email: 'admin@talktime.com',
          password: 'admin123',
          role: 'admin',
          isActive: true,
          isSystemAdmin: true
        });
        await adminUser.save();
        console.log('✓ System admin account created automatically');
        console.log('  Email: admin@talktime.com');
        console.log('  Password: admin123');
      } else if (!existingAdmin.isSystemAdmin) {
        // Update existing admin to be system admin
        existingAdmin.isSystemAdmin = true;
        await existingAdmin.save();
        console.log('✓ Existing admin account marked as system admin');
      }
    } catch (error) {
      console.error('Error creating system admin:', error.message);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://0.0.0.0:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log('\nTo access from mobile device, use your computer\'s IP address');
  console.log('Example: http://192.168.1.X:' + PORT);
});
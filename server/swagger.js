const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Presales API',
      version: '1.0.0',
      description: 'Sales Team Management Platform API - Manage leads, employees, and call tracking',
      contact: {
        name: 'Presales Support',
        email: 'support@presales.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'http://10.0.2.2:5000/api',
        description: 'Android Emulator'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Sales' },
            email: { type: 'string', format: 'email', example: 'john@talktime.com' },
            role: { type: 'string', enum: ['admin', 'sales', 'mapping'], example: 'sales' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Lead: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '1234567890' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            company: { type: 'string', example: 'Acme Corp' },
            assignedTo: { 
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' }
              }
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'contacted', 'interested', 'not-interested', 'closed'],
              example: 'pending'
            },
            priority: { 
              type: 'string', 
              enum: ['low', 'medium', 'high'],
              example: 'medium'
            },
            notes: { type: 'string', example: 'Follow up next week' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CallRecord: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            clientId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            employeeId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            status: { 
              type: 'string',
              enum: ['connected', 'no_answer', 'ignored', 'on_hold', 'callback', 'switched_off', 'busy', 'wrong_number', 'pending'],
              example: 'connected'
            },
            notes: { type: 'string', example: 'Discussed pricing' },
            callbackDate: { type: 'string', format: 'date-time' },
            callDuration: { type: 'number', example: 180, description: 'Duration in seconds' },
            timestamp: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error information' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

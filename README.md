# Presales - Complete Lead Management Platform

A comprehensive lead management and sales tracking platform consisting of three integrated applications: a web-based admin dashboard, a REST API backend, and a mobile application for field sales teams.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Projects](#projects)
  - [1. Web Dashboard (Client)](#1-web-dashboard-client)
  - [2. Backend API (Server)](#2-backend-api-server)
  - [3. Mobile App (TalkTime-main)](#3-mobile-app-talktime-main)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Key Workflows](#key-workflows)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Presales is an enterprise-grade lead management platform designed for real estate and sales organizations. It provides a complete ecosystem for managing leads from acquisition to conversion, with features for lead assignment, tracking, reporting, and mobile field operations.

### Key Capabilities

- **Lead Management**: Import, assign, track, and manage leads from multiple sources
- **Brand Partner Portal**: Dedicated portal for brand partners to submit and track leads
- **Auto-Assignment**: Intelligent lead distribution with round-robin and rule-based assignment
- **Mobile App**: React Native app for field sales teams to make calls and update lead status
- **Analytics & Reporting**: Comprehensive dashboards, statistics, and automated email reports
- **Multi-Source Integration**: Support for CSV imports, manual entry, and brand partner submissions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presales Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │              │    │              │    │              │  │
│  │  Web Client  │◄───┤  Backend API │───►│  Mobile App  │  │
│  │   (React)    │    │   (Node.js)  │    │(React Native)│  │
│  │              │    │              │    │              │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                                │
│                      ┌──────▼───────┐                        │
│                      │   MongoDB    │                        │
│                      │   Database   │                        │
│                      └──────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Projects

### 1. Web Dashboard (Client)

**Location:** `/client`

A modern, responsive React-based web application for administrators and sales managers.

#### Features

- **Dashboard**: Real-time statistics and lead overview
- **Lead Management**: 
  - View leads in flat or grouped views
  - Filter by source, status, employee
  - Bulk import via CSV
  - Manual lead creation
  - Date range filtering
- **User Management**: Create and manage sales employees and admins
- **Brand Partner Management**: 
  - CRUD operations for brand partners
  - CSV import for bulk partner creation
  - Partner profile management
- **Auto-Assignment**: 
  - Configure round-robin assignment
  - Source-specific assignments
  - CSV file-specific assignments
  - Employee availability management
- **Unassigned Leads**: Review and manually assign leads
- **Reports**: 
  - Generate PDF reports
  - Schedule automated email reports
  - Daily, weekly, monthly reports
- **Statistics**: Visual analytics and performance metrics
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Works on desktop, tablet, and mobile

#### Technology

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router
- **State Management**: React Context API

#### Key Components

- `Dashboard.jsx` - Main dashboard with statistics
- `ClientManagement.jsx` - Lead management interface
- `UserManagement.jsx` - Employee management
- `BrandPartnerManagement.jsx` - Brand partner portal
- `UnassignedLeads.jsx` - Lead assignment interface
- `Reports.jsx` - Report generation and scheduling
- `AutoAssignmentModal.jsx` - Auto-assignment configuration

---

### 2. Backend API (Server)

**Location:** `/server`

A robust Node.js/Express REST API with MongoDB for data persistence.

#### Features

- **Authentication & Authorization**:
  - JWT-based authentication
  - Role-based access control (Admin, Sales, Mapping, Brand Partner)
  - Separate auth flows for web and mobile
  - 30-day token expiry for brand partners

- **Lead Management APIs**:
  - CRUD operations for leads
  - Bulk CSV import
  - Date range filtering
  - Source-based filtering
  - Auto-assignment logic
  - Lead status tracking

- **Brand Partner APIs**:
  - Partner authentication
  - Lead submission (CSV and JSON)
  - Lead statistics (monthly, quarterly, YTD)
  - Profile management
  - Image upload for leads
  - Lead tracking and updates

- **User Management**:
  - Employee CRUD operations
  - Active/inactive status management
  - CSV bulk import
  - Auto-generated employee IDs

- **Auto-Assignment System**:
  - Round-robin distribution
  - Source-specific assignments
  - CSV file-specific assignments
  - Employee exclusion rules
  - Configurable assignment order

- **Reporting**:
  - PDF report generation
  - Email report scheduling
  - Daily, weekly, monthly reports
  - Customizable report templates

- **Integration**:
  - Vibgyor API integration for qualified leads
  - Facebook webhook support
  - Email service integration

#### Technology

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **CSV Parsing**: csv-parser
- **PDF Generation**: PDFKit
- **Email**: Nodemailer
- **API Documentation**: Swagger/OpenAPI

#### API Endpoints

**Authentication**
- `POST /api/auth/login` - Web/mobile login
- `POST /api/brand-partners/login` - Brand partner login

**Leads**
- `GET /api/clients` - Get all leads
- `GET /api/clients/filter/by-date` - Filter leads by date range
- `GET /api/clients/unassigned` - Get unassigned leads
- `POST /api/clients` - Create lead
- `PUT /api/clients/:id` - Update lead
- `DELETE /api/clients/:id` - Delete lead
- `POST /api/clients/import` - Bulk CSV import

**Brand Partners**
- `GET /api/brand-partners` - List all partners (admin)
- `POST /api/brand-partners` - Create partner (admin)
- `GET /api/brand-partners/profile` - Get partner profile
- `PUT /api/brand-partners/profile/about` - Update about section
- `GET /api/brand-partners/leads` - Get partner's leads
- `GET /api/brand-partners/leads/statistics` - Get lead statistics
- `POST /api/brand-partners/leads/import` - Import leads
- `PUT /api/brand-partners/leads/:uniqueId` - Update lead
- `DELETE /api/brand-partners/leads/:uniqueId` - Delete lead
- `POST /api/brand-partners/images/upload` - Upload lead image
- `GET /api/brand-partners/images` - Get all images
- `GET /api/brand-partners/images/:imageId` - Get specific image
- `DELETE /api/brand-partners/images/:imageId` - Delete image

**Users**
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/import` - Bulk CSV import

**Auto-Assignment**
- `GET /api/auto-assignment` - Get settings
- `PUT /api/auto-assignment` - Update settings
- `GET /api/auto-assignment/next-employee` - Get next employee
- `POST /api/auto-assignment/process-unassigned` - Process all unassigned leads

**Reports**
- `POST /api/reports/generate` - Generate PDF report
- `GET /api/reports/schedules` - Get scheduled reports
- `POST /api/reports/schedules` - Create schedule
- `PUT /api/reports/schedules/:id` - Update schedule
- `DELETE /api/reports/schedules/:id` - Delete schedule

#### Database Models

- **User**: Employees and admins
- **Client**: Lead/customer data
- **BrandPartner**: Brand partner accounts
- **LeadImage**: Images associated with leads
- **ProjectSource**: Lead sources
- **AutoAssignmentSettings**: Assignment configuration
- **ReportSchedule**: Scheduled report configuration
- **EmailConfig**: Email settings
- **CallRecord**: Call history (mobile app)

---

### 3. Mobile App (TalkTime-main)

**Location:** `/TalkTime-main`

A React Native mobile application for field sales teams to manage calls and update lead status on the go.

#### Features

- **Authentication**: 
  - Employee login with Employee ID
  - Secure token-based authentication
  - Auto-login persistence

- **Lead Management**:
  - View assigned leads
  - Search and filter leads
  - View lead details
  - Update lead status
  - Add notes and remarks

- **Call Management**:
  - Make calls directly from the app
  - Automatic call logging
  - Call duration tracking
  - Call history
  - Call status updates

- **Offline Support**:
  - Cache lead data
  - Queue status updates
  - Sync when online

- **User Interface**:
  - Clean, intuitive design
  - Tab-based navigation
  - Pull-to-refresh
  - Loading states
  - Error handling

#### Technology

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Phone Integration**: expo-linking, expo-phone-call
- **UI Components**: Custom components with React Native

#### Key Screens

- **Login**: Employee authentication
- **Home/Leads**: List of assigned leads
- **Lead Details**: Detailed lead information
- **Call History**: Past call records
- **Profile**: User profile and settings

#### Build & Deploy

The mobile app can be built for both Android and iOS:

```bash
# Development
npm start

# Android build
eas build --platform android

# iOS build
eas build --platform ios
```

See `TalkTime-main/BUILD_ANDROID_APP.md` for detailed build instructions.

---

## ✨ Features

### Lead Management
- Multi-source lead import (CSV, manual, brand partners)
- Automatic lead assignment with configurable rules
- Lead status tracking (pending, follow-up, qualified, won, lost)
- Priority management (low, medium, high)
- Lead notes and history
- Bulk operations

### Brand Partner Portal
- Dedicated authentication system
- Lead submission via CSV or JSON
- Real-time statistics dashboard
- Lead tracking and updates
- Image upload for leads
- Profile management
- Monthly/Quarterly/YTD analytics

### Auto-Assignment System
- Round-robin distribution
- Source-specific assignments
- CSV file-specific assignments
- Employee availability management
- Configurable assignment order
- Automatic processing of unassigned leads

### Reporting & Analytics
- Real-time dashboard statistics
- PDF report generation
- Scheduled email reports
- Date range filtering
- Source-wise analytics
- Employee performance tracking
- Brand partner statistics

### Mobile Field Operations
- Native mobile app for sales teams
- Direct calling from app
- Call logging and tracking
- Offline support
- Lead status updates on the go
- Search and filter capabilities

### User Management
- Role-based access control
- Active/inactive status management
- Employee ID system
- Bulk user import
- Profile management

---

## 🛠️ Technology Stack

### Frontend (Web)
- React 18
- Vite
- Tailwind CSS
- Axios
- Lucide React Icons
- React Router

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer (file uploads)
- PDFKit (PDF generation)
- Nodemailer (email)
- Swagger (API docs)

### Mobile
- React Native
- Expo
- Expo Router
- AsyncStorage
- Axios

### DevOps & Tools
- Git
- npm/yarn
- MongoDB Atlas (cloud database)
- Environment variables (.env)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- Git
- Expo CLI (for mobile app)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd presales-platform
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Web Client
cd ../client
npm install

# Mobile App
cd ../TalkTime-main
npm install
```

3. **Configure environment variables**
```bash
# Backend
cd server
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Run the applications**

```bash
# Terminal 1 - Backend API
cd server
npm start

# Terminal 2 - Web Client
cd client
npm run dev

# Terminal 3 - Mobile App
cd TalkTime-main
npm start
```

---

## 📥 Installation

### Backend Setup

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env file with your settings:
# - MongoDB connection string
# - JWT secret
# - Email configuration
# - API keys

# Initialize database (creates admin user)
node setup.js

# Start server
npm start
```

The API will be available at `http://localhost:5000`

Default admin credentials:
- Email: `admin@presales.com`
- Password: `admin123`

### Web Client Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The web app will be available at `http://localhost:5173`

### Mobile App Setup

```bash
cd TalkTime-main

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/presales

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Vibgyor API Integration
VIBGYOR_API_URL=https://api.vibgyor.co.in/api/
VIBGYOR_API_KEY=your-api-key

# Mapping API
MAPPING_API_URL=https://api.vibgyor.co.in/api

# Email Configuration (for reports)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Web Client Configuration

The client automatically connects to `http://localhost:5000` in development. For production, update the API base URL in `client/src/main.jsx` or use environment variables.

### Mobile App Configuration

Update the API URL in `TalkTime-main/services/api.ts`:

```typescript
const API_URL = 'http://your-server-ip:5000/api';
```

For production, use your production API URL.

---

## 📚 API Documentation

### Swagger Documentation

Once the backend is running, access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

### Additional Documentation

Detailed documentation for specific features:

- **Brand Partner Implementation**: `BRAND_PARTNER_IMPLEMENTATION.md`
- **Brand Partner Profile API**: `BRAND_PARTNER_PROFILE_API.md`
- **Brand Partner Leads**: `BRAND_PARTNER_LEADS_FETCH.md`
- **Brand Partner Image Upload**: `BRAND_PARTNER_IMAGE_UPLOAD.md`
- **Brand Partner Statistics**: `BRAND_PARTNER_STATISTICS_API.md`
- **Lead Date Filtering**: `LEADS_DATE_FILTER_API.md`
- **Authentication Troubleshooting**: `BRAND_PARTNER_AUTH_TROUBLESHOOTING.md`
- **Mobile App Build**: `TalkTime-main/BUILD_ANDROID_APP.md`

---

## 👥 User Roles

### Admin
- Full system access
- User management
- Brand partner management
- Lead assignment
- Report generation
- System configuration
- View all leads and statistics

### Sales Employee
- View assigned leads
- Update lead status
- Make calls (mobile app)
- Add notes and remarks
- View personal statistics
- Limited to own leads

### Mapping User
- Similar to sales employee
- Specialized for mapping operations
- Auto-generated mapping IDs

### Brand Partner
- Dedicated portal access
- Submit leads (CSV/JSON)
- View own leads
- Track lead statistics
- Upload images
- Update lead information
- View analytics dashboard

---

## 🔄 Key Workflows

### Lead Import Workflow

1. **Admin imports CSV** → Leads created as unassigned
2. **Auto-assignment triggered** → Leads distributed based on rules
3. **Sales employee receives leads** → Visible in mobile app
4. **Employee makes calls** → Status updated in real-time
5. **Qualified leads** → Sent to Vibgyor API
6. **Reports generated** → Automated email reports sent

### Brand Partner Workflow

1. **Brand partner logs in** → Dedicated portal
2. **Submits leads** → Via CSV upload or manual entry
3. **Leads tagged** → Automatically marked as "Brand Partners" source
4. **Admin reviews** → Unassigned leads page
5. **Assignment** → Manual or auto-assignment
6. **Partner tracks** → Statistics dashboard shows progress
7. **Updates** → Partner can update lead information

### Auto-Assignment Workflow

1. **Configure rules** → Set up assignment preferences
2. **Import leads** → Leads marked as unassigned
3. **Process documents** → Trigger auto-assignment
4. **Priority matching**:
   - CSV file-specific assignments (highest priority)
   - Source-specific assignments
   - Round-robin distribution (default)
5. **Leads distributed** → Assigned to available employees
6. **Notifications** → Employees see new leads

---

## 📖 Documentation

### Project Documentation

- `README.md` - This file
- `server/.env.example` - Environment configuration template
- `server/swagger.js` - API documentation configuration

### Feature Documentation

- Brand Partner system documentation (multiple files)
- Lead filtering and statistics
- Image upload system
- Authentication and troubleshooting

### Sample Files

- `server/sample-leads-import.csv` - Lead import template
- `server/sample-employees-import.csv` - Employee import template
- `server/sample-brand-partners-import.csv` - Brand partner import template
- `server/sample-brand-partner-leads-import.csv` - Brand partner lead import template
- `server/sample-mapping-import.csv` - Mapping user import template

### Test Scripts

- `server/test-login.js` - Test authentication
- `server/test-brand-partner-login.js` - Test brand partner auth
- `server/test-brand-partner-images.js` - Test image upload
- `server/test-unique-ids.js` - Test unique ID generation

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

### Code Style

- Use ESLint for JavaScript/TypeScript
- Follow React best practices
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

### Testing

- Test all API endpoints
- Verify mobile app functionality
- Check responsive design
- Test different user roles
- Validate data integrity

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For issues, questions, or feature requests:

1. Check the documentation files
2. Review the API documentation at `/api-docs`
3. Check the troubleshooting guides
4. Contact the development team

---

## 🎯 Roadmap

### Planned Features

- [ ] WhatsApp integration
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Lead scoring system
- [ ] Email campaign management
- [ ] Calendar integration
- [ ] Task management
- [ ] Document management
- [ ] Mobile app for iOS
- [ ] Real-time notifications
- [ ] Advanced reporting
- [ ] API rate limiting
- [ ] Two-factor authentication

---

## 📊 System Requirements

### Backend Server
- CPU: 2+ cores
- RAM: 4GB minimum
- Storage: 20GB minimum
- OS: Linux, Windows, or macOS
- Node.js: v16 or higher
- MongoDB: v4.4 or higher

### Web Client
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1024x768

### Mobile App
- Android: 8.0 or higher
- iOS: 13.0 or higher
- Internet connection required

---

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Environment variable configuration
- Secure file upload handling
- Token expiration
- Active/inactive user management

---

## 🌟 Acknowledgments

Built with modern technologies and best practices for enterprise-grade lead management.

---

**Version**: 1.0.0  
**Last Updated**: April 2024  
**Maintained by**: Development Team

# SBNCorp Delivery Management System

A comprehensive delivery management system for Stronghold Bolts and Nuts Corporation to manage branch delivery requests, warehouse processing, and delivery tracking.

## Project Overview

The SBNCorp Delivery Management System is a full-stack web application designed to streamline the process of managing delivery requests from branches, processing by warehouse staff, and tracking deliveries across the company. It features role-based access control, real-time status updates, and comprehensive reporting.

## Technology Stack

- **Frontend**: React.js with Vite, Material UI (Joy UI)
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Vercel (frontend and backend)

## Project Structure

- `/client` - Frontend application (React, Joy UI)
- `/server` - Backend API server (Node.js, Express)
  - `/routes` - API endpoints
  - `/middleware` - Authentication and validation middleware
  - `/db.js` - Database connection and queries

## Features

### User Management
- Role-based access control (Admin, Warehouse, Branch)
- User profile management
- Company directory with staff information
- Admin password reset functionality
- Simplified password handling for easier maintenance

### Branch Features
- Create delivery requests
- Track ongoing deliveries
- View delivery history
- Confirm receipt of deliveries
- Branch-specific analytics

### Warehouse Features
- Process delivery requests
- Create and schedule deliveries
- Update delivery status
- Warehouse analytics and reporting
- Streamlined warehouse history view with improved UI

### Admin Features
- User management with enhanced password administration
- Branch management
- System-wide analytics
- Performance reporting
- Advanced user profile control

### General Features
- Real-time status updates
- Comprehensive dashboard
- Notification system
- Search and filtering capabilities
- Responsive design for all devices
- Improved background image handling for login page
- Enhanced synchronization between requests and deliveries

## User Roles

### Admin
- Full access to all system features
- User management including password resets
- System configuration
- View all analytics and reports

### Warehouse
- Process branch requests
- Create and manage deliveries
- Update delivery status
- View warehouse-specific analytics

### Branch
- Create delivery requests
- Track deliveries to the branch
- Confirm receipt of deliveries
- View branch-specific analytics

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory with your database credentials:
   ```
   DATABASE_URL=postgres://your-database-connection-string
   PORT=5000
   JWT_SECRET=your_jwt_secret
   ```

4. Run the server:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the client directory (for development):
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Build for production:
   ```
   npm run build
   ```

## Deployment

The application is configured for deployment on Vercel. Both the frontend and backend directories include Vercel configuration files.

### Backend Deployment

1. Make sure your Vercel CLI is installed and you're logged in
2. Navigate to the server directory
3. Run `vercel` to deploy to staging
4. Run `vercel --prod` to deploy to production

### Frontend Deployment

1. Navigate to the client directory
2. Run `vercel` to deploy to staging
3. Run `vercel --prod` to deploy to production

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Port for the server (defaults to 5000)

### Frontend (.env)
- `VITE_API_URL`: URL to the backend API

## Database

The application uses PostgreSQL for data storage. The database schema is defined in the `db-schema.sql` file in the server directory.

### Tables
- `users`: User accounts and authentication
- `branches`: Branch information
- `deliveries`: Delivery records
- `delivery_requests`: Branch requests for deliveries
- `delivery_request_items`: Items included in delivery requests

## Authentication

The system uses JWT (JSON Web Tokens) for authentication. Tokens are generated on successful login and must be included in the `Authorization` header for protected API requests:

```
Authorization: Bearer <token>
```

## Password Management

The system includes a dedicated password reset feature for administrators:
- Admins can reset any user's password without knowing their current password
- Password handling is simplified for easier maintenance and troubleshooting
- The "Reset Password" button appears in user details when viewed by an admin
- For security reasons, users can only change their own passwords with current password verification

## Default Credentials

For initial setup, the following default users are created:

- Admin:
  - Username: admin
  - Password: password123

- Warehouse:
  - Username: warehouse
  - Password: password123

- Branch:
  - Username: branch
  - Password: password123

**IMPORTANT:** Change these default passwords after first login.

## Recent Updates

- Added dedicated admin password reset functionality
- Improved UI alignment in Warehouse History view
- Enhanced synchronization between delivery requests and deliveries
- Fixed image loading issues in the login page
- Improved error handling and diagnostic logging
- Streamlined branch requests history for warehouse users

## Support

For any issues or questions, please contact the development team at:
juan_porferio_napiza@dlsu.edu.ph
willer_uy@dlsu.edu.ph
marcus_quimoyog@dlsu.edu.ph

## License

This project is proprietary software developed exclusively for Stronghold Bolts and Nuts Corporation. 
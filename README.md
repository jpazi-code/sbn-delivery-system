# Delivery Management System

A full stack delivery management system with user authentication and basic CRUD operations for managing deliveries.

## Project Structure

- `/client` - Frontend (Vite + React + Joy UI)
- `/server` - Backend (Node.js + Express + PostgreSQL)

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL (Neon Database account)

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
   DATABASE_URL=postgres://your-neon-connection-string
   PORT=5000
   JWT_SECRET=your_jwt_secret
   ```

4. Run the server:
   ```
   npm start
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

3. Create a `.env` file in the client directory:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Run the development server:
   ```
   npm run dev
   ```

## Features

- User authentication (login)
- Dashboard with delivery overview
- CRUD operations for managing deliveries 
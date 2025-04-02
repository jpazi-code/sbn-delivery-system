# SBN Delivery System

A delivery management system for SBN Corporation.

## Project Structure

This project is divided into two main parts:
- `client/`: React.js frontend built with Vite and MUI Joy
- `server/`: Express.js backend with PostgreSQL database

## Deployment Instructions

### Backend Deployment (Railway)

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add a PostgreSQL database from the Railway dashboard
4. Set environment variables:
   - `DATABASE_URL`: Provided by Railway PostgreSQL plugin
   - `JWT_SECRET`: A secure random string for JWT authentication
   - `NODE_ENV`: Set to `production`
   - `PORT`: Leave as Railway's default (optional)
5. The deployment will use the railway.json configuration

### Frontend Deployment (Vercel)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Configure deployment settings:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set environment variables:
   - `VITE_API_URL`: Your Railway backend URL

## Local Development

1. Clone the repository
2. Install dependencies for both client and server:
   ```bash
   cd client && npm install
   cd server && npm install
   ```
3. Set up environment variables
4. Start the development servers:
   ```bash
   # In one terminal
   cd server && npm run dev
   
   # In another terminal
   cd client && npm run dev
   ```

## Features

- User authentication (login)
- Dashboard with delivery overview
- CRUD operations for managing deliveries 
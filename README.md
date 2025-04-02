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
5. The deployment will use the Docker configuration defined in:
   - `Dockerfile`
   - `railway.json`
6. After successful deployment, generate a domain:
   - Go to your service in Railway dashboard
   - Click on "Settings" → "Networking"
   - Click "Generate Domain"
   - Your app will now be accessible at the generated URL

If you encounter deployment issues, check the build logs in Railway. Common issues:
- Database connection errors: Verify the DATABASE_URL variable is correctly set
- Docker build failures: Check your Dockerfile for syntax errors
- Startup failures: Verify your server's port configuration matches Railway's environment

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
- Dashboard with delivery overview
- CRUD operations for managing deliveries 

## Deployment on Vercel (Monorepo Approach)

To deploy both frontend and backend as a single project on Vercel:

1. Push your code to GitHub
2. Connect your Vercel account to your GitHub repository
3. Import the project into Vercel (select the root directory, not just client or server)
4. Set up environment variables in the Vercel dashboard:
   - `DATABASE_URL`: Connection string for your PostgreSQL database
   - `JWT_SECRET`: Secret key for JWT token generation
   - `NODE_ENV`: Set to `production`
5. The deployment will use the configuration in `vercel.json`, which:
   - Routes API requests (`/api/*`) to the server
   - Routes all other requests to the client build
   - Sets up proper build commands for both client and server

### Verifying Your Deployment

After deployment:
1. Your API will be available at `https://your-vercel-domain.vercel.app/api/*`
2. Your frontend will be available at `https://your-vercel-domain.vercel.app/`
3. The server's healthcheck endpoint will be at `https://your-vercel-domain.vercel.app/healthcheck`

### Troubleshooting Vercel Deployment

- If you encounter issues with the API routes, check the Vercel Function Logs
- Verify that your database connection is working properly
- Make sure all required environment variables are set
- Check that the build process completes successfully for both client and server
- If encountering timeout issues during build, you may need to adjust your build commands or split the deployment into separate projects 
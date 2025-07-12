# 🚀 CogniShape Vercel Deployment Guide

## Overview
This guide will help you deploy your CogniShape frontend to Vercel, a popular platform for hosting React applications.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install the Vercel command-line tool
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## 🛠️ Installation

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)
```bash
# Make the deployment script executable
chmod +x deploy-vercel.sh

# Run the deployment script
./deploy-vercel.sh
```

### Option 2: Manual Deployment
```bash
# Navigate to the frontend directory
cd frontend

# Deploy to Vercel
vercel --prod
```

## ⚙️ Configuration

### Environment Variables Setup

1. **Create Environment File**:
   ```bash
   # In the frontend directory
   cat > .env.local << EOF
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_WS_URL=wss://your-backend-url.com
   REACT_APP_BACKEND_URL=https://your-backend-url.com
   EOF
   ```

2. **Set Environment Variables in Vercel Dashboard**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add the following variables:
     - `REACT_APP_API_URL`: Your backend API URL
     - `REACT_APP_WS_URL`: Your WebSocket URL
     - `REACT_APP_BACKEND_URL`: Your backend URL

3. **Set Environment Variables via CLI**:
   ```bash
   vercel env add REACT_APP_API_URL
   vercel env add REACT_APP_WS_URL
   vercel env add REACT_APP_BACKEND_URL
   ```

## 🔧 Backend Deployment Options

Since Vercel only hosts frontend applications, you'll need to deploy your backend separately:

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy backend
cd backend
railway init
railway up
```

### Option 2: Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Option 3: Heroku
```bash
# Install Heroku CLI
# Create Procfile with: web: uvicorn main:app --host 0.0.0.0 --port $PORT
heroku create your-app-name
git push heroku main
```

## 🔄 Database Setup

### Option 1: Neon PostgreSQL (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Get your connection string
4. Update your backend environment variables

### Option 2: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Use the provided connection string

## 🚀 Complete Deployment Process

### Step 1: Deploy Backend
```bash
# Choose one of the backend deployment options above
# Example with Railway:
cd backend
railway init
railway up
```

### Step 2: Get Backend URL
After deploying your backend, note the URL (e.g., `https://your-app.railway.app`)

### Step 3: Update Frontend Environment
```bash
# Update frontend/.env.local with your backend URL
REACT_APP_API_URL=https://your-app.railway.app
REACT_APP_WS_URL=wss://your-app.railway.app
REACT_APP_BACKEND_URL=https://your-app.railway.app
```

### Step 4: Deploy Frontend to Vercel
```bash
# Run the deployment script
./deploy-vercel.sh
```

### Step 5: Configure CORS
Update your backend CORS settings to allow your Vercel domain:

```python
# In your backend main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs
   vercel logs
   
   # Rebuild locally
   cd frontend
   npm run build
   ```

2. **Environment Variables Not Working**:
   ```bash
   # Check current environment variables
   vercel env ls
   
   # Add missing variables
   vercel env add REACT_APP_API_URL
   ```

3. **CORS Errors**:
   - Ensure your backend CORS settings include your Vercel domain
   - Check that your backend is accessible from the internet

4. **WebSocket Connection Issues**:
   - Ensure your backend supports WebSocket connections
   - Check that your WebSocket URL uses `wss://` for production

### Debugging Commands

```bash
# Check Vercel deployment status
vercel ls

# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Redeploy
vercel --prod
```

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics in your project dashboard
- Monitor performance and user behavior

### Custom Domain
1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS settings

## 🔄 Updates and Maintenance

### Updating Your Application
```bash
# Make changes to your code
git add .
git commit -m "Update application"
git push

# Vercel will automatically redeploy
# Or manually trigger deployment:
vercel --prod
```

### Environment Variable Updates
```bash
# Update environment variables
vercel env add REACT_APP_API_URL
vercel env rm REACT_APP_API_URL
vercel env pull .env.local
```

## 🎯 Best Practices

1. **Environment Variables**: Always use environment variables for configuration
2. **CORS**: Properly configure CORS for production
3. **HTTPS**: Use HTTPS for all production URLs
4. **Monitoring**: Set up monitoring and logging
5. **Backup**: Regularly backup your database
6. **Security**: Keep dependencies updated

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Your CogniShape application is now ready for Vercel deployment!** 🚀 
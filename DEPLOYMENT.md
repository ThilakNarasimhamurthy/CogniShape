# 🚀 CogniShape Deployment Guide

## Overview
CogniShape is a web application with a FastAPI backend, React frontend, WebSocket real-time communication, and AI-driven game configuration. This guide covers multiple deployment options.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Git (for version control)
- A domain name (for production)
- API keys for Gemini AI and Razorpay (optional)

## 🎯 Deployment Options

### Option 1: Local Development (Currently Running)

Your application is already running locally! Access it at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

**To restart local services:**
```bash
# Stop services
docker compose down

# Start services
docker compose up -d

# View logs
docker compose logs -f
```

### Option 2: Production Deployment with Docker

#### Step 1: Environment Setup
Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_PASSWORD=your-secure-database-password
DATABASE_URL=postgresql://neuronest_user:your-secure-database-password@postgres:5432/neuronest

# Redis Configuration
REDIS_PASSWORD=your-secure-redis-password
REDIS_HOST=redis
REDIS_PORT=6379

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Payment Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=False

# Application Configuration
HOST=0.0.0.0
PORT=8000

# Frontend Configuration
REACT_APP_API_URL=http://your-domain.com:8000
REACT_APP_WS_URL=ws://your-domain.com:8000
REACT_APP_BACKEND_URL=http://your-domain.com:8000
```

#### Step 2: Deploy to Production
```bash
# Make deployment script executable
chmod +x deploy-production.sh

# Run production deployment
./deploy-production.sh
```

#### Step 3: Verify Deployment
```bash
# Check service status
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:3000
```

### Option 3: Cloud Deployment

#### A. Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Environment Variables in Vercel Dashboard:**
   - `REACT_APP_API_URL`: Your backend URL
   - `REACT_APP_WS_URL`: Your WebSocket URL
   - `REACT_APP_BACKEND_URL`: Your backend URL

#### B. Backend Deployment (Railway/Render/Heroku)

1. **Railway Deployment:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Render Deployment:**
   - Connect your GitHub repository
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Heroku Deployment:**
   ```bash
   # Install Heroku CLI
   # Create Procfile with: web: uvicorn main:app --host 0.0.0.0 --port $PORT
   heroku create your-app-name
   git push heroku main
   ```

#### C. Database Deployment

1. **Neon PostgreSQL (Recommended):**
   - Sign up at neon.tech
   - Create a new project
   - Update `DATABASE_URL` in your environment

2. **Supabase:**
   - Sign up at supabase.com
   - Create a new project
   - Use the provided connection string

3. **Railway PostgreSQL:**
   - Create a new PostgreSQL service
   - Use the provided connection string

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI config generation | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `REDIS_PASSWORD` | Redis password | No |
| `RAZORPAY_KEY_ID` | Razorpay payment key | No |
| `RAZORPAY_KEY_SECRET` | Razorpay payment secret | No |
| `SECRET_KEY` | Application secret key | Yes |
| `DEBUG` | Debug mode (False for production) | Yes |

### Security Checklist

- [ ] Change default passwords
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS configuration
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
docker compose exec backend python -c "from database import engine; print('DB OK')"

# Redis connection
docker compose exec redis redis-cli ping
```

### Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Production logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Find process using port
   lsof -i :8000
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues:**
   ```bash
   # Check database status
   docker compose exec postgres pg_isready -U neuronest_user
   ```

3. **Memory Issues:**
   ```bash
   # Check container resources
   docker stats
   ```

4. **Build Failures:**
   ```bash
   # Clean and rebuild
   docker compose down
   docker system prune -f
   docker compose build --no-cache
   ```

### Performance Optimization

1. **Enable Gzip compression**
2. **Use CDN for static assets**
3. **Implement caching strategies**
4. **Optimize database queries**
5. **Use connection pooling**

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Migrations
```bash
# Run migrations
docker compose exec backend python -c "from database import init_db; init_db()"
```

### Backup and Restore
```bash
# Backup database
docker compose exec postgres pg_dump -U neuronest_user neuronest > backup.sql

# Restore database
docker compose exec -T postgres psql -U neuronest_user neuronest < backup.sql
```

## 📞 Support

For deployment issues:
1. Check the logs: `docker compose logs -f`
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review security configurations

## 🚀 Quick Start Commands

```bash
# Development
docker compose up -d

# Production
./deploy-production.sh

# Stop all services
docker compose down

# View status
docker compose ps

# View logs
docker compose logs -f
```

---

**Your CogniShape application is ready for deployment!** 🎉 
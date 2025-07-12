#!/bin/bash

# CogniShape Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    log_error ".env file not found. Please create one with your production settings."
    echo "Example .env file:"
    echo ""
    echo "# Database Configuration"
    echo "DB_PASSWORD=your-secure-database-password"
    echo "DATABASE_URL=postgresql://neuronest_user:your-secure-database-password@postgres:5432/neuronest"
    echo ""
    echo "# Redis Configuration"
    echo "REDIS_PASSWORD=your-secure-redis-password"
    echo "REDIS_HOST=redis"
    echo "REDIS_PORT=6379"
    echo ""
    echo "# AI Configuration"
    echo "GEMINI_API_KEY=your-gemini-api-key"
    echo ""
    echo "# Payment Configuration"
    echo "RAZORPAY_KEY_ID=your-razorpay-key-id"
    echo "RAZORPAY_KEY_SECRET=your-razorpay-key-secret"
    echo ""
    echo "# Security"
    echo "SECRET_KEY=your-super-secret-key-change-this-in-production"
    echo "DEBUG=False"
    echo ""
    echo "# Application Configuration"
    echo "HOST=0.0.0.0"
    echo "PORT=8000"
    echo ""
    echo "# Frontend Configuration"
    echo "REACT_APP_API_URL=http://your-domain.com:8000"
    echo "REACT_APP_WS_URL=ws://your-domain.com:8000"
    echo "REACT_APP_BACKEND_URL=http://your-domain.com:8000"
    exit 1
fi

log_info "Starting production deployment..."

# Stop existing containers
log_info "Stopping existing containers..."
docker compose down

# Build production images
log_info "Building production images..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
log_info "Starting production services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Check service health
log_info "Checking service health..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Show deployment info
log_success "Production deployment completed!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
echo ""
echo "📝 Logs:"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml down" 
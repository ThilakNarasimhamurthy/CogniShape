#!/bin/bash

# NeuroNest Deployment Script
# This script automates the deployment process for the NeuroNest application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="neuronest"
BACKEND_PORT=8000
FRONTEND_PORT=3000
DB_PORT=5432
REDIS_PORT=6379

# Functions
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

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Node.js is installed (for frontend development)
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed. This is required for frontend development."
    fi
    
    # Check if Python is installed (for backend development)
    if ! command -v python3 &> /dev/null; then
        log_warning "Python 3 is not installed. This is required for backend development."
    fi
    
    log_success "Dependencies check completed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Database Configuration
DATABASE_URL=postgresql://neuronest_user:neuronest_password@localhost:5432/neuronest

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production

# Application Configuration
DEBUG=True
HOST=0.0.0.0
PORT=8000
EOF
        log_warning "Please update the .env file with your actual API keys and configuration"
    fi
    
    # Create backend .env if it doesn't exist
    if [ ! -f backend/.env ]; then
        log_info "Creating backend .env file..."
        cp .env backend/.env
    fi
    
    # Create frontend .env.local if it doesn't exist
    if [ ! -f frontend/.env.local ]; then
        log_info "Creating frontend .env.local file..."
        cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
EOF
    fi
    
    log_success "Environment setup completed"
}

build_application() {
    log_info "Building application..."
    
    # Build Docker images
    log_info "Building Docker images..."
    docker-compose build
    
    log_success "Application build completed"
}

start_services() {
    log_info "Starting services..."
    
    # Start the services
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Start backend and frontend
    docker-compose up -d backend frontend
    
    log_success "Services started successfully"
}

setup_database() {
    log_info "Setting up database..."
    
    # Wait a bit more for backend to be ready
    sleep 5
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec backend python -c "from database import init_db; init_db()"
    
    log_success "Database setup completed"
}

run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    if [ -d "backend/tests" ]; then
        docker-compose exec backend pytest tests/ -v || log_warning "Backend tests failed or not found"
    else
        log_warning "Backend tests directory not found"
    fi
    
    # Frontend tests
    log_info "Running frontend tests..."
    if [ -f "frontend/package.json" ]; then
        docker-compose exec frontend npm test -- --coverage --watchAll=false || log_warning "Frontend tests failed"
    else
        log_warning "Frontend package.json not found"
    fi
    
    log_success "Tests completed"
}

show_status() {
    log_info "Application Status:"
    echo ""
    echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
    echo "🔧 Backend API: http://localhost:$BACKEND_PORT"
    echo "📚 API Documentation: http://localhost:$BACKEND_PORT/docs"
    echo "🗄️ Database: localhost:$DB_PORT"
    echo "🔄 Redis: localhost:$REDIS_PORT"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
}

deploy_production() {
    log_info "Deploying to production..."
    
    # Build production images
    log_info "Building production images..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
    
    # Start production services
    log_info "Starting production services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
    
    log_success "Production deployment completed"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Stop all services
    docker-compose down
    
    # Remove volumes (optional)
    read -p "Do you want to remove all data volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        log_warning "All data volumes have been removed"
    fi
    
    # Remove images (optional)
    read -p "Do you want to remove Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down --rmi all
        log_warning "All Docker images have been removed"
    fi
    
    log_success "Cleanup completed"
}

show_help() {
    echo "NeuroNest Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment"
    echo "  prod        Deploy to production"
    echo "  build       Build the application"
    echo "  test        Run tests"
    echo "  status      Show application status"
    echo "  cleanup     Clean up resources"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Start development environment"
    echo "  $0 prod     # Deploy to production"
    echo "  $0 cleanup  # Clean up all resources"
}

# Main script logic
case "${1:-dev}" in
    dev)
        log_info "Starting NeuroNest in development mode..."
        check_dependencies
        setup_environment
        build_application
        start_services
        setup_database
        show_status
        ;;
    prod)
        log_info "Deploying NeuroNest to production..."
        check_dependencies
        setup_environment
        deploy_production
        show_status
        ;;
    build)
        log_info "Building NeuroNest application..."
        check_dependencies
        build_application
        ;;
    test)
        log_info "Running NeuroNest tests..."
        run_tests
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

log_success "Script execution completed!"
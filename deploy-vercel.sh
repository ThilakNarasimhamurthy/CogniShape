#!/bin/bash

# CogniShape Vercel Deployment Script
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

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "frontend/package.json" ]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Setup environment variables
setup_env() {
    log_info "Setting up environment variables..."
    
    # Create .env.local in frontend if it doesn't exist
    if [ ! -f "frontend/.env.local" ]; then
        log_info "Creating frontend/.env.local..."
        cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
EOF
        log_warning "Please update frontend/.env.local with your production backend URLs"
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel..."
    
    # Navigate to frontend directory
    cd frontend
    
    # Deploy to Vercel
    log_info "Running Vercel deployment..."
    vercel --prod --yes
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        log_success "Deployment successful!"
        echo ""
        echo "🌐 Your CogniShape frontend is now live at:"
        echo "   $DEPLOYMENT_URL"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Update your backend CORS settings to allow your Vercel domain"
        echo "   2. Set up environment variables in Vercel dashboard"
        echo "   3. Deploy your backend to a cloud service (Railway, Render, etc.)"
        echo "   4. Update frontend/.env.local with your production backend URLs"
        echo ""
        echo "🔧 To update environment variables in Vercel:"
        echo "   vercel env add REACT_APP_API_URL"
        echo "   vercel env add REACT_APP_WS_URL"
        echo "   vercel env add REACT_APP_BACKEND_URL"
    else
        log_error "Deployment failed or URL not found"
        exit 1
    fi
    
    # Go back to root directory
    cd ..
}

# Main deployment process
main() {
    log_info "Starting Vercel deployment for CogniShape..."
    
    # Check prerequisites
    check_vercel_cli
    check_directory
    
    # Setup environment
    setup_env
    
    # Deploy
    deploy_to_vercel
    
    log_success "Vercel deployment completed!"
}

# Run main function
main 
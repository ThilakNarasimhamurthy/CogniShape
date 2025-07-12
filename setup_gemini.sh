#!/bin/bash

echo "🔑 CogniShape Gemini API Key Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://neuronest_user:neuronest_password@localhost:5432/neuronest

# Security
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Gemini
GEMINI_API_KEY=your-actual-gemini-api-key-here

# Razorpay (for dummy payment system)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Debug
DEBUG=True
EOF
    echo "✅ .env file created!"
else
    echo "📄 .env file already exists"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit the .env file and replace 'your-actual-gemini-api-key-here' with your real API key"
echo "3. Restart the containers: docker compose down && docker compose up -d"
echo ""
echo "📝 To edit the .env file, run:"
echo "   nano .env"
echo "   # or"
echo "   code .env"
echo ""
echo "🚀 After adding your API key, restart containers:"
echo "   docker compose down && docker compose up -d" 
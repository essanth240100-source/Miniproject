#!/bin/bash

# Travel Organizer Backend Deployment Script
# This script helps you deploy your backend to various platforms

echo "🚀 Travel Organizer Backend Deployment Script"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found backend directory"

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "📦 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    echo "🔐 Logging into Railway..."
    railway login
    
    # Deploy
    echo "🚀 Deploying..."
    railway up
    
    echo "✅ Deployment complete!"
    echo "🌐 Your backend is now live on Railway!"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "🟣 Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        echo "❌ Heroku CLI not found. Please install it first:"
        echo "   https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Login to Heroku
    echo "🔐 Logging into Heroku..."
    heroku login
    
    # Create app (if not exists)
    echo "📱 Creating Heroku app..."
    heroku create travel-organizer-backend-$(date +%s)
    
    # Set environment variables
    echo "⚙️ Setting environment variables..."
    heroku config:set NODE_ENV=production
    heroku config:set PORT=8080
    
    # Deploy
    echo "🚀 Deploying..."
    git push heroku main
    
    echo "✅ Deployment complete!"
    echo "🌐 Your backend is now live on Heroku!"
}

# Function to build Docker image
build_docker() {
    echo "🐳 Building Docker image..."
    
    cd backend
    docker build -t travel-organizer-backend .
    cd ..
    
    echo "✅ Docker image built successfully!"
    echo "📦 Image name: travel-organizer-backend"
    echo "🚀 You can now deploy this image to any container platform"
}

# Function to test locally
test_local() {
    echo "🧪 Testing backend locally..."
    
    cd backend
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🚀 Starting server..."
    echo "🌐 Backend will be available at: http://localhost:8080"
    echo "🔍 Health check: http://localhost:8080/health"
    echo "📊 API endpoints: http://localhost:8080/api/trips"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    npm start
}

# Main menu
echo ""
echo "Choose deployment option:"
echo "1) Deploy to Railway (Recommended)"
echo "2) Deploy to Heroku"
echo "3) Build Docker image"
echo "4) Test locally"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_railway
        ;;
    2)
        deploy_heroku
        ;;
    3)
        build_docker
        ;;
    4)
        test_local
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

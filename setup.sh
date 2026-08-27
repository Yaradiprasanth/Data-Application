#!/bin/bash

# Movie Recommendation Engine - Complete Setup Script
# This script sets up the entire application from scratch

set -e

echo "🚀 Movie Recommendation Engine - Setup Script"
echo "=============================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Please create a .env file with the following:"
    echo "COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud"
    echo "COGNODB_USERNAME=cognodb"
    echo "COGNODB_PASSWORD=your-password-here"
    echo "PORT=5000"
    echo "NODE_ENV=development"
    echo ""
    echo "Get these from your CognoDB Console: https://console.cognodb.com"
    exit 1
fi

echo "✓ .env file found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

echo "✓ Dependencies installed"

# Seed the database
echo ""
echo "🌱 Seeding database..."
npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend: npm start"
echo "2. In a new terminal, start the frontend: cd client && npm start"
echo "3. Visit http://localhost:3000"
echo ""

@echo off
REM Movie Recommendation Engine - Complete Setup Script for Windows
REM This script sets up the entire application from scratch

setlocal enabledelayedexpansion

echo 🚀 Movie Recommendation Engine - Setup Script
echo =============================================="

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo.
    echo Please create a .env file with the following:
    echo COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
    echo COGNODB_USERNAME=cognodb
    echo COGNODB_PASSWORD=your-password-here
    echo PORT=5000
    echo NODE_ENV=development
    echo.
    echo Get these from your CognoDB Console: https://console.cognodb.com
    exit /b 1
)

echo ✓ .env file found

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
cd server
call npm install
cd ..
cd client
call npm install
cd ..

echo ✓ Dependencies installed

REM Seed the database
echo.
echo 🌱 Seeding database...
call npm run seed

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Start the backend: npm start
echo 2. In a new terminal, start the frontend: cd client ^&^& npm start
echo 3. Visit http://localhost:3000
echo.

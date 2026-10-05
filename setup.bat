@echo off
setlocal enabledelayedexpansion

REM SRMS Pariksha - Quick Setup Script for Windows
REM Run this script to automatically set up the project

echo 🎓 SRMS Pariksha - Academic Examination Portal
echo ==============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected:
node --version

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

echo ✅ npm detected:
npm --version
echo.

REM Install dependencies
echo 📦 Installing project dependencies...
npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env configuration file...
    (
        echo # Firebase Configuration ^(Replace with your actual values^)
        echo VITE_FIREBASE_API_KEY=your_firebase_api_key_here
        echo VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
        echo VITE_FIREBASE_PROJECT_ID=your_project_id_here
        echo VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
        echo VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
        echo VITE_FIREBASE_APP_ID=your_app_id_here
        echo.
        echo # Google Drive API ^(Optional^)
        echo VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id_here
    ) > .env
    echo ✅ .env file created. Please update it with your Firebase configuration.
) else (
    echo ✅ .env file already exists
)

echo.
echo 🔧 Running TypeScript type check...
npx tsc --noEmit

if %errorlevel% neq 0 (
    echo ⚠️  TypeScript errors detected. Please review the output above.
) else (
    echo ✅ TypeScript check passed
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update .env file with your Firebase configuration
echo 2. Run 'npm run dev' to start the development server
echo 3. Open http://localhost:3001 in your browser
echo.
echo 🚀 To start the development server now, run:
echo    npm run dev
echo.
pause
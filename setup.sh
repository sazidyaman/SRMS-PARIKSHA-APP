#!/bin/bash

# SRMS Pariksha - Quick Setup Script
# Run this script to automatically set up the project

echo "🎓 SRMS Pariksha - Academic Examination Portal"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version must be 16 or higher. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm --version) detected"
echo ""

# Install dependencies
echo "📦 Installing project dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env configuration file..."
    cat > .env << EOL
# Firebase Configuration (Replace with your actual values)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# Google Drive API (Optional)
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id_here
EOL
    echo "✅ .env file created. Please update it with your Firebase configuration."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 Running TypeScript type check..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "⚠️  TypeScript errors detected. Please review the output above."
else
    echo "✅ TypeScript check passed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your Firebase configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3001 in your browser"
echo ""
echo "🚀 To start the development server now, run:"
echo "   npm run dev"
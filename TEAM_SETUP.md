# Team Setup Guide - SRMS Pariksha Project

## 🚀 Quick Start for Team Members

### Option 1: Automated Setup (Recommended)

**For Linux/Mac users:**
```bash
chmod +x setup.sh
./setup.sh
```

**For Windows users:**
```cmd
setup.bat
```

### Option 2: Manual Setup

Follow the detailed instructions in [README.md](README.md)

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js v16+** installed ([Download here](https://nodejs.org/))
- [ ] **Git** installed ([Download here](https://git-scm.com/))
- [ ] **Code editor** (VS Code recommended)
- [ ] **Firebase account** (free tier is sufficient)

---

## 🔧 Step-by-Step Setup Instructions

### 1. Clone the Repository
```bash
git clone [repository-url]
cd srms-pariksha---academic-examinationv2
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Google Drive Integration
VITE_GOOGLE_DRIVE_CLIENT_ID=your-client-id.googleusercontent.com
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open Application
Navigate to: **http://localhost:3001**

---

## 🔥 Firebase Setup (Required)

### Creating Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `srms-pariksha-[your-name]`
4. Enable Google Analytics (optional)
5. Create project

### Configuring Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Add your domain to authorized domains if deploying

### Setting up Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Test mode** for development
3. Select your preferred location
4. Create database

### Getting Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web app** (</>) icon
4. Register app with nickname: `srms-pariksha-web`
5. Copy the config values to your `.env` file

---

## 🛠️ Development Workflow

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
npm run lint     # Run code linting
```

### Testing Different User Roles

1. **Student Access**: 
   - Register with roll number: `2400100100095`
   - Registration number: `SRMS/2026/BTECH/CSE/095`

2. **Admin Access**:
   - Switch to "Admin & Faculty Hub" 
   - Use institutional email

3. **Faculty Access**:
   - Select "Faculty Coordinator" role
   - Use faculty credentials

---

## 🏗️ Project Architecture Overview

```
Key Components:
├── LoginPage.tsx          # Authentication interface
├── AdminDashboard.tsx     # Timetable management
├── ScheduleScreen.tsx     # Student dashboard  
├── TimetableScreen.tsx    # Interactive timetable
└── firebase.ts           # Backend integration
```

### Key Features to Test
- [ ] Student registration creates unique profiles
- [ ] Google Sign-In works properly  
- [ ] Admin can build collision-free timetables
- [ ] Real-time synchronization between users
- [ ] PDF admit card generation
- [ ] Leave application workflow

---

## 🔍 Troubleshooting Common Issues

### Node.js Issues
```bash
# Check Node version (should be 16+)
node --version

# If version is old, update Node.js
# Download from nodejs.org
```

### Dependency Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Firebase Connection Issues
- Verify `.env` file has correct Firebase config
- Check Firebase console for project status
- Ensure authentication providers are enabled

### Build Errors
```bash
# Type check
npx tsc --noEmit

# Lint check  
npm run lint
```

---

## 📞 Getting Help

1. **Code Issues**: Create GitHub issue with error details
2. **Setup Problems**: Check this guide first, then ask team
3. **Firebase Issues**: Verify configuration in Firebase Console
4. **Feature Questions**: Reference the [README.md](README.md)

---

## 🎯 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow existing naming conventions
- Add proper type definitions
- Use Tailwind CSS for styling

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### Testing Changes
1. Test all user roles (Student, Faculty, Admin)
2. Verify Firebase integration works
3. Check responsive design on mobile
4. Test collision detection in timetable

---

## ✅ Setup Verification Checklist

After setup, verify these work:

- [ ] Application loads at http://localhost:3001
- [ ] Login page shows (no "Rahul Sen" hardcoded user)
- [ ] Student registration creates new profiles
- [ ] Admin timetable builder loads without errors
- [ ] Firebase connection established (check browser console)
- [ ] No TypeScript errors in terminal
- [ ] All components render properly

---

**🎉 You're all set! Happy coding!**

For questions or issues, reach out to the team lead or create a GitHub issue.
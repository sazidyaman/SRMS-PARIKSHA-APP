# SRMS Pariksha - Academic Examination Portal

A comprehensive academic examination and timetable management system built with React, TypeScript, and Firebase for SRMS College of Engineering & Technology.

## 🌟 Features

- **Student Dashboard**: Personalized academic portal with real-time timetable integration
- **Admin Timetable Management**: Interactive collision-free timetable builder for all 7 college branches
- **Google Authentication**: Seamless sign-in with Firebase Auth
- **Multi-Role Access**: Student, Faculty, and Admin portals with role-based permissions
- **Real-time Synchronization**: Firebase Firestore integration with offline localStorage caching
- **Biometric Security**: Proctoring gateway for secure examinations
- **PDF Generation**: Official admit card and hall ticket downloads
- **Leave Management**: Student leave application workflow with faculty approval

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v16.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **Modern Web Browser**
   - Chrome (recommended for development)
   - Firefox, Safari, or Edge

### Optional but Recommended

1. **Visual Studio Code** (or your preferred IDE)
   - Download from: https://code.visualstudio.com/
   - Recommended extensions:
     - ES7+ React/Redux/React-Native snippets
     - TypeScript Importer
     - Prettier - Code formatter
     - Tailwind CSS IntelliSense

2. **Firebase CLI** (for deployment)
   ```bash
   npm install -g firebase-tools
   ```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/srms-pariksha-academic-examination.git
cd srms-pariksha-academic-examination
```

### 2. Install Dependencies

```bash
# Install all required packages
npm install

# If you encounter peer dependency issues, use:
npm install --legacy-peer-deps
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Drive API (Optional)
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
```

### 4. Firebase Setup (Required)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication with Google provider
4. Create Firestore Database
5. Copy your Firebase config to `.env` file

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3001**

## 📦 Dependencies Overview

### Core Framework
- **React 18** - UI framework
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Material Symbols** - Google's icon library
- **Recharts** - Charts and data visualization

### Backend & Database
- **Firebase** - Authentication, Firestore database, and hosting
- **Google APIs** - Drive integration for file storage

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TSX** - TypeScript execution for server

### PDF & File Handling
- **jsPDF** - PDF generation for admit cards
- **Google Drive API** - Cloud storage integration

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── AdminDashboard.tsx
│   ├── LoginPage.tsx
│   ├── ScheduleScreen.tsx
│   ├── TimetableScreen.tsx
│   └── ...
├── data/               # Static data and configuration
│   ├── subjects.ts
│   ├── srmsTimetable.ts
│   └── ...
├── services/           # API and external services
│   ├── firebase.ts
│   ├── googleDriveService.ts
│   └── ...
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## 🔑 Key Features & Usage

### Authentication Options

1. **Google Sign-In**: One-click authentication with Google accounts
2. **Roll Number Login**: AKTU University Roll Number + SRMS Registration Number
3. **Admin/Faculty Access**: Institutional email credentials

### Role-Based Access

- **Students**: Personal dashboard, timetable, exam portal, leave applications
- **Faculty**: Resource management, leave approvals, student oversight
- **Admin**: Complete timetable management, user administration, system oversight

### Admin Timetable Builder

- Interactive 7-branch collision detection system (CS1, CS2, IT, AIML, DS, EN, ME)
- Real-time conflict resolution with 294 total weekly slots
- Copy/paste day schedules between branches
- Bulk operations and official schedule restoration

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run clean        # Clean build artifacts

# Deployment
npm start           # Start production server
```

## 🌐 Deployment Options

### Firebase Hosting (Recommended)
```bash
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

## 🔒 Security Considerations

- All Firebase security rules are configured for authenticated users only
- Student data is isolated by branch and role
- Admin operations require elevated permissions
- API keys are environment-specific and never committed to repository

## 🐛 Troubleshooting

### Common Issues

1. **Firebase connection errors**
   - Verify `.env` configuration
   - Check Firebase project settings
   - Ensure authentication providers are enabled

2. **Build failures**
   - Try `npm install --legacy-peer-deps`
   - Clear node_modules: `rm -rf node_modules && npm install`

3. **TypeScript errors**
   - Run type check: `npx tsc --noEmit`
   - Update type definitions if needed

### Getting Help

- Check browser console for detailed error messages
- Review Firebase console for authentication/database issues
- Ensure all environment variables are properly set

## 👥 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏫 About SRMS

Developed for **Shriram Murti Smarak College of Engineering & Technology, Bareilly**
- AKTU College Code: 010
- Affiliated to Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow

## 📞 Support

For technical support or questions about the project:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in `/docs` folder

---

**Happy Coding! 🚀**
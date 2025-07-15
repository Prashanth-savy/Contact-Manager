# Contact Manager - Complete Setup & Deployment Guide

##  Table of Contents
1. [Quick Start](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [File Structure](#file-structure)
4. [Code Implementation](#code-implementation)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

##  Quick Start

### Prerequisites
```bash
# Install Node.js 18+ and Angular CLI
node --version  # Should be 18+
npm install -g @angular/cli@17
```

### 1-Minute Setup
```bash
# Create project structure
mkdir contact-manager && cd contact-manager
mkdir -p backend/{src/{controllers,models,routes,middleware,utils},tests,database}
mkdir -p frontend/src/app/{components/{contact-list,contact-form,search-bar},services}

# Backend setup
cd backend
npm init -y
npm install express better-sqlite3 joi cors helmet morgan dotenv
npm install -D nodemon jest supertest

# Frontend setup
cd ../frontend
ng new . --routing --style=css --skip-git
npm install

# Start development servers
cd ../backend && npm run dev &
cd ../frontend && ng serve
```

##  Detailed Setup

### Backend Implementation

#### 1. Package Configuration
Copy the backend `package.json` from the artifacts above and run:
```bash
cd backend
npm install
```

#### 2. Core Backend Files
Create these files in `backend/src/`:

**server.js** - Main application entry point
**models/database.js** - Database setup and operations
**models/ContactModel.js** - Contact business logic and validation
**controllers/contactController.js** - API request handlers
**routes/contactRoutes.js** - Route definitions
**middleware/errorHandler.js** - Global error handling
**utils/searchUtils.js** - Typo-tolerant search algorithms

#### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (defaults work for development)
```

### Frontend Implementation

#### 1. Angular Project Setup
```bash
cd frontend
ng new . --routing --style=css --skip-git --package-manager=npm
```

#### 2. Core Angular Files
Update/create these files in `frontend/src/`:

**main.ts** - Bootstrap configuration
**app/app.component.ts** - Main app component
**app/app.routes.ts** - Route configuration
**app/services/contact.service.ts** - API communication service
**app/components/contact-form/contact-form.component.ts** - Add contact form
**app/components/contact-list/contact-list.component.ts** - Display contacts
**app/components/search-bar/search-bar.component.ts** - Search functionality
**styles.css** - Global styles
**index.html** - Main HTML template

## File Structure

```
contact-manager/
├── backend/
│   ├── src/
│   │   ├── server.js                    # Main server entry
│   │   ├── controllers/
│   │   │   └── contactController.js     # API controllers
│   │   ├── models/
│   │   │   ├── database.js              # SQLite setup
│   │   │   └── ContactModel.js          # Contact model
│   │   ├── routes/
│   │   │   └── contactRoutes.js         # API routes
│   │   ├── middleware/
│   │   │   └── errorHandler.js          # Error handling
│   │   └── utils/
│   │       └── searchUtils.js           # Search algorithms
│   ├── tests/
│   │   └── contact.test.js              # Test suite
│   ├── database/                        # SQLite database files
│   ├── .env                             # Environment variables
│   └── package.json                     # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── main.ts                      # Angular bootstrap
│   │   ├── index.html                   # Main HTML
│   │   ├── styles.css                   # Global styles
│   │   └── app/
│   │       ├── app.component.ts         # Main component
│   │       ├── app.routes.ts            # Route config
│   │       ├── services/
│   │       │   └── contact.service.ts   # API service
│   │       └── components/
│   │           ├── contact-form/
│   │           ├── contact-list/
│   │           └── search-bar/
│   ├── angular.json                     # Angular configuration
│   ├── tsconfig.json                    # TypeScript config
│   └── package.json                     # Frontend dependencies
├── .gitignore                           # Git ignore rules
└── README.md                            # Project documentation
```

## 💻 Code Implementation

### Step-by-Step Implementation

1. **Copy all code from the artifacts above** into their respective files
2. **Install dependencies** in both backend and frontend directories
3. **Run the applications**:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
ng serve
```

4. **Access the application** at `http://localhost:4200`

### Key Features Implemented

#### Backend Features
- ✅ **RESTful API** with Express.js
- ✅ **SQLite Database** with better-sqlite3
- ✅ **Input Validation** with Joi schemas
- ✅ **Error Handling** with proper HTTP status codes
- ✅ **CORS Configuration** for frontend communication
- ✅ **Typo-Tolerant Search** using Levenshtein distance
- ✅ **Email Uniqueness** validation
- ✅ **Comprehensive Tests** with Jest and Supertest

#### Frontend Features
- ✅ **Angular 19** with standalone components
- ✅ **Reactive Forms** with validation
- ✅ **Real-time Search** with debouncing
- ✅ **Responsive Design** with modern CSS
- ✅ **Error Handling** with user-friendly messages
- ✅ **Loading States** and animations
- ✅ **Accessibility** features

### Test Coverage
- ✅ **API Endpoints** - CRUD operations
- ✅ **Search Functionality** - Typo tolerance
- ✅ **Validation** - Email uniqueness, required fields
- ✅ **Error Handling** - Edge cases and invalid input
- ✅ **Search Algorithms** - Levenshtein distance

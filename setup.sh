#!/bin/bash

# Contact Manager Setup Script
# This script creates the complete project structure for the Contact Manager application

echo " Setting up Contact Manager project structure..."

# Create main project directory
mkdir -p contact-manager
cd contact-manager

# Create backend structure
echo " Creating backend structure..."
mkdir -p backend/{src/{controllers,models,routes,middleware,utils},tests,database,logs}

# Create frontend structure  
echo " Creating frontend structure..."
mkdir -p frontend/src/{app/{components/{contact-list,contact-form,search-bar},services},assets}

# Create backend files
echo " Creating backend files..."

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "contact-manager-backend",
  "version": "1.0.0",
  "description": "Backend API for Contact List Manager",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "keywords": ["contact-manager", "api", "express", "sqlite"],
  "author": "Senior Software Engineer",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  },
  "jest": {
    "testEnvironment": "node",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/server.js"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
EOF

# Frontend package.json
echo " Creating frontend files..."
cat > frontend/package.json << 'EOF'
{
  "name": "contact-manager-frontend",
  "version": "1.0.0",
  "description": "Angular frontend for Contact List Manager",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:coverage": "ng test --code-coverage",
    "lint": "ng lint",
    "serve": "ng serve --host 0.0.0.0 --port 4200"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^19.2.14",
    "@angular/common": "^19.2.14",
    "@angular/compiler": "^19.2.14",
    "@angular/core": "^19.2.14",
    "@angular/forms": "^19.2.14",
    "@angular/platform-browser": "^19.2.14",
    "@angular/platform-browser-dynamic": "^19.2.14",
    "@angular/router": "^19.2.14",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.2.15",
    "@angular/cli": "^19.2.15",
    "@angular/compiler-cli": "^19.2.14",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^18.18.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "5.8"
  }
}
EOF

# Environment files
echo " Creating environment files..."
cat > backend/.env.example << 'EOF'
# Backend Environment Variables
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
DB_PATH=./database/contacts.db
API_RATE_LIMIT=100
API_TIMEOUT=30000
LOG_LEVEL=info
LOG_FILE=./logs/app.log
CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
HELMET_ENABLED=true
DEBUG=contact-manager:*
EOF

cp backend/.env.example backend/.env

# Git ignore
echo " Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
*.lcov
.nyc_output

# Environment variables
.env
.env.test
.env.production
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database files
*.db
*.sqlite
*.sqlite3
database/

# Logs
logs
*.log

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Angular specific
/frontend/dist/
/frontend/.angular/

# Build artifacts
build/
dist/

# Test results
test-results/
junit.xml
EOF

# Create a simple README
echo " Creating README..."
cat > README.md << 'EOF'
# Contact List Manager

A full-stack contact management application built with Angular and Node.js/Express.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup** (in new terminal)
   ```bash
   cd frontend
   npm install
   ng serve
   ```

3. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

### Features
-  Add/Delete contacts with validation
-  Typo-tolerant search
-  Real-time updates
-  Responsive design
-  Comprehensive tests

### Technology Stack
- **Frontend**: Angular 17+ with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite with better-sqlite3
- **Testing**: Jest for backend tests

For detailed setup instructions and architecture decisions, see the complete README in the project root.
EOF

echo ""
echo " Next steps:"
echo "1. cd contact-manager"
echo "2. Copy the provided code files to their respective locations"
echo "3. cd backend && npm install && npm run dev"
echo "4. cd frontend && npm install && ng serve"
echo "5. Open http://localhost:4200"
echo ""

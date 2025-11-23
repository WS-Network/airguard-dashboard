# Getting Started with Airguard

## 🎯 Project Overview

Airguard is a comprehensive IoT monitoring and environmental tracking system designed to provide real-time insights into device performance, network health, and environmental conditions. The system consists of:

- **Frontend**: Modern React-based dashboard built with Next.js
- **Backend**: RESTful API built with Express.js and Node.js
- **Database**: PostgreSQL with Prisma ORM for data persistence
- **Real-time Communication**: WebSocket support via Socket.io

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices  │    │   Frontend      │    │   Backend       │
│   (Sensors)    │◄──►│   (Next.js)     │◄──►│   (Express.js)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Real-time     │    │   Database      │
                       │   Updates       │    │   (PostgreSQL)  │
                       │   (Socket.io)   │    └─────────────────┘
                       └─────────────────┘
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **PostgreSQL**: Version 12 or higher (optional, SQLite fallback available)

### Development Tools
- **VS Code** (recommended) or any modern code editor
- **Postman** or **Insomnia** for API testing
- **Docker** (optional) for containerized development

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd airguard-web-frontend
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit the .env file with your configuration
nano backend/.env
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/airguard_db"
# Or use SQLite for development:
# DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data (optional)
npm run db:seed
```

### 5. Start Development Servers
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio`)

## 🔧 Development Environment Setup

### VS Code Extensions (Recommended)
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Prisma** - Database schema support
- **Tailwind CSS IntelliSense** - CSS class suggestions
- **Thunder Client** - API testing (alternative to Postman)

### Git Hooks Setup
```bash
# Install husky for git hooks (if configured)
npm install -g husky

# Set up pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm run lint"
```

## 📱 First Steps

### 1. Create a User Account
- Navigate to the signup page
- Fill in your details
- Verify your account

### 2. Explore the Dashboard
- View the main dashboard
- Check device status
- Monitor network health metrics

### 3. Test API Endpoints
- Use the built-in API testing page
- Test authentication endpoints
- Verify device management APIs

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if port 3001 is available
- Verify environment variables are set correctly
- Ensure database is running and accessible

**Database connection errors:**
- Verify DATABASE_URL in .env file
- Check if PostgreSQL is running
- Ensure database exists and user has permissions

**Frontend build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript compilation: `npm run build`
- Verify Next.js version compatibility

**CORS errors:**
- Check FRONTEND_URL in backend .env
- Verify frontend is running on the expected port
- Check browser console for specific error messages

### Getting Help
- Check the [Development Guide](./development.md) for detailed troubleshooting
- Review the [API Reference](./api/README.md) for endpoint documentation
- Open an issue in the repository with detailed error information

## 📚 Next Steps

After completing the setup:
1. Read the [Architecture Overview](./architecture.md) to understand the system design
2. Explore the [Frontend Documentation](./frontend/README.md) for UI development
3. Review the [Backend Documentation](./backend/README.md) for API development
4. Check the [Security Documentation](./security.md) for authentication details

---

*Ready to start building? Let's dive into the architecture and start developing!*

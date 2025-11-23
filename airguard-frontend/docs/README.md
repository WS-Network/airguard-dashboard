# Airguard Web Frontend - Complete Documentation

Welcome to the comprehensive documentation for the Airguard IoT monitoring and environmental tracking system. This project consists of a modern React frontend and a robust Node.js backend designed for real-time device monitoring and management.

## 📚 Documentation Sections

### 🚀 [Getting Started](./getting-started.md)
- Project overview and architecture
- Prerequisites and system requirements
- Quick start guide
- Development environment setup

### 🏗️ [Architecture Overview](./architecture.md)
- System architecture and design patterns
- Frontend and backend structure
- Database schema and relationships
- API design principles

### 🎯 [Frontend Documentation](./frontend/README.md)
- Next.js application structure
- Component library and UI patterns
- State management and data flow
- Styling with Tailwind CSS
- TypeScript interfaces and types

### ⚙️ [Backend Documentation](./backend/README.md)
- Express.js API structure
- Authentication and authorization
- Database operations with Prisma
- Real-time communication with Socket.io
- API endpoints and validation

### 🗄️ [Database Documentation](./database/README.md)
- Database schema and models
- Prisma ORM usage
- Migration and seeding
- Data relationships and constraints

### 🔐 [Security Documentation](./security.md)
- Authentication flow
- JWT token management
- API security measures
- Rate limiting and CORS
- Data encryption

### 🧪 [Testing Documentation](./testing.md)
- Testing strategy and tools
- Unit and integration tests
- API testing with HTTP files
- Frontend component testing

### 🚢 [Deployment Documentation](./deployment.md)
- Docker containerization
- Environment configuration
- Production deployment
- Monitoring and logging

### 📖 [API Reference](./api/README.md)
- Complete API endpoint documentation
- Request/response schemas
- Authentication requirements
- Error handling

### 🛠️ [Development Guide](./development.md)
- Development workflow
- Code standards and conventions
- Git workflow
- Troubleshooting guide

## 🎯 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd airguard-web-frontend

# Install dependencies
npm install
cd backend && npm install

# Set up environment variables
cp backend/env.example backend/.env
# Edit backend/.env with your configuration

# Start the backend
cd backend
npm run dev

# Start the frontend (in a new terminal)
npm run dev
```

## 🌟 Key Features

- **Real-time IoT Monitoring**: Live device status and metrics
- **Multi-tenant Architecture**: Organization-based user management
- **Modern Web Interface**: Responsive React dashboard
- **Secure API**: JWT authentication and rate limiting
- **Device Simulation**: Built-in testing and development tools
- **Comprehensive Logging**: Winston-based logging system

## 🔧 Technology Stack

### Frontend
- Next.js 15.3.3, React 19.0.0, TypeScript 5.x
- Tailwind CSS 4.x, ESLint 9.x

### Backend
- Express.js 4.18.0, Node.js 18+
- Prisma ORM, PostgreSQL/SQLite
- Socket.io, JWT, bcryptjs

## 📞 Support

For questions, issues, or contributions:
- Check the troubleshooting guide
- Review the development guide
- Open an issue in the repository

---



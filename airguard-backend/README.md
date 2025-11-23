# Airguard Backend API

Backend API for the Airguard IoT monitoring and environmental tracking system.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Device Management**: CRUD operations for IoT devices
- **Real-time Monitoring**: WebSocket support for live device updates
- **Environmental Tracking**: Monitor electricity usage, carbon emissions, and ESG compliance
- **Network Analytics**: Real-time network health and performance metrics
- **Alert System**: Comprehensive alerting for device and network issues
- **Achievement System**: Gamified environmental impact tracking

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/airguard_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
# Start development server with hot reload
npm run dev

# Or build and start production server
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Device Management

- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create new device
- `GET /api/devices/:id` - Get device by ID
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Dashboard & Analytics

- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/network-health` - Get network health data
- `GET /api/dashboard/throughput-performance` - Get throughput data
- `GET /api/dashboard/device-status` - Get device status summary

### Real-time WebSocket Events

- `join-organization` - Join organization room
- `subscribe-devices` - Subscribe to device updates
- `device-update` - Device status/metric updates
- `network-update` - Network health updates
- `alert` - New alert notifications

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts and authentication
- **Organizations**: Multi-tenant organization support
- **Devices**: IoT device management
- **DeviceMetrics**: Time-series device data
- **NetworkHealth**: Network performance metrics
- **Alerts**: System alerts and notifications
- **Achievements**: Environmental impact tracking

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode

# Linting
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint errors
```

### Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configurable CORS policies
- **Helmet**: Security headers
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with file rotation
- **Error Handling**: Comprehensive error handling middleware
- **Health Checks**: `/health` endpoint for monitoring
- **Request Logging**: API request/response logging

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t airguard-backend .

# Run container
docker run -p 3001:3001 --env-file .env airguard-backend
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository. 
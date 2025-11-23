# Airguard Backend API - Deployment Guide

Backend API for Airguard IoT monitoring and environmental tracking system.

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, bcrypt

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Build the image
docker build -t airguard-backend .

# Run with docker-compose (includes PostgreSQL and Redis)
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## 📋 Environment Variables

See `env.example` for all available configuration options. Key variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/airguard_db"
REDIS_URL="redis://localhost:6379"

# JWT (Generate secure secrets!)
JWT_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key"
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Database

### Migrations

```bash
# Create a new migration
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio (GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### Database Schema

See `prisma/schema.prisma` for the complete data model including:
- Users & Authentication
- IoT Devices
- Sensor Readings
- Alerts & Notifications
- API Keys

## 🔐 API Authentication

The API uses JWT-based authentication with access and refresh tokens.

### Authentication Flow

1. **Signup/Login** → Receive access token (15m) + refresh token (7d)
2. **API Requests** → Include access token in Authorization header
3. **Token Refresh** → Use refresh token to get new access token

### Protected Routes

Add the auth middleware to protect routes:

```typescript
import { authenticateToken } from './middleware/auth';

router.get('/protected', authenticateToken, controller);
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and receive tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate refresh token
- `GET /api/auth/profile` - Get current user profile

### Devices

- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device details
- `POST /api/devices` - Register new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Remove device

### Readings

- `GET /api/readings` - Get sensor readings (with filters)
- `POST /api/readings` - Submit new reading (IoT devices)

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/api-keys` - Generate new API key

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Test with coverage
npm test -- --coverage
```

Test files are located in `src/__tests__/`.

## 🐳 Docker

### Dockerfile

Multi-stage build optimized for production:
- Dependencies layer (cached)
- Build layer (TypeScript compilation)
- Runtime layer (minimal, Node.js only)

### Docker Compose

Includes:
- Backend API (port 3001)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Prisma Studio (port 5555)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure access and refresh tokens
- **Rate Limiting**: Configurable request limits
- **Helmet**: Security headers
- **CORS**: Configurable origins
- **Data Encryption**: AES-256-GCM for sensitive data
- **Input Validation**: Joi/Zod validation

## 📊 Logging

Uses Winston for structured logging:

```typescript
import logger from './config/logger';

logger.info('Message');
logger.error('Error', { error });
logger.debug('Debug info');
```

Log levels: error, warn, info, http, verbose, debug, silly

## 🚢 Production Deployment

### Build for Production

```bash
# Install production dependencies only
npm ci --only=production

# Build TypeScript
npm run build

# Start production server
npm start
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Configure secure DATABASE_URL
- [ ] Set up Redis (managed service recommended)
- [ ] Enable rate limiting
- [ ] Configure CORS for your domain
- [ ] Set up logging/monitoring
- [ ] Configure backups
- [ ] Use environment secrets management
- [ ] Enable HTTPS
- [ ] Review security headers

### Environment-Specific Config

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
LOG_LEVEL=error
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Fix linting issues |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL
```

**Prisma errors:**
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```

**Port already in use:**
```bash
# Change PORT in .env
PORT=3002
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

## 📄 License

MIT License

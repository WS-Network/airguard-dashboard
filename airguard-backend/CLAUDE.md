# CLAUDE.md - AI Assistant Guide for Airguard Backend

This document provides comprehensive guidance for AI assistants working with the Airguard Backend codebase.

## 📋 Project Overview

**Airguard Backend** is a Node.js/TypeScript API server for an IoT monitoring and environmental tracking system. It provides:

- JWT-based authentication and authorization
- IoT device management and real-time monitoring
- WebSocket support for live updates
- Environmental impact tracking (electricity, carbon, ESG)
- Network analytics and health monitoring
- Alert system for device and network issues
- Achievement/gamification system

**Key Technologies:**
- Runtime: Node.js 24+ LTS
- Language: TypeScript 5.x (strict mode)
- Framework: Express.js
- Database: PostgreSQL with Prisma ORM
- Real-time: Socket.io
- Security: JWT, bcrypt, helmet, CORS, rate limiting
- Validation: Zod
- Logging: Winston

## 🏗️ Codebase Structure

```
airguard-backend/
├── src/
│   ├── config/           # Configuration modules
│   │   ├── database.ts   # Prisma client instance
│   │   ├── jwt.ts        # JWT configuration
│   │   └── logger.ts     # Winston logger setup
│   ├── controllers/      # Request handlers
│   │   ├── authController.ts       # Authentication endpoints
│   │   ├── deviceController.ts     # Device management
│   │   └── settingsController.ts   # User settings
│   ├── middleware/       # Express middleware
│   │   └── auth.ts       # JWT authentication & organization check
│   ├── services/         # Business logic layer
│   │   ├── authService.ts          # Auth logic (signup, login, tokens)
│   │   ├── deviceService.ts        # Device operations
│   │   ├── deviceSimulator.ts      # Dev/test device simulation
│   │   └── settingsService.ts      # Settings management
│   ├── utils/            # Utility functions
│   │   ├── encryption.ts # AES-256-GCM encryption for API keys
│   │   └── validation.ts # Input validation helpers
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Shared types
│   ├── scripts/          # Utility scripts
│   │   ├── seed.ts       # Database seeding
│   │   └── iot-device-simulator.ts  # Standalone device simulator
│   ├── __tests__/        # Test files
│   │   ├── setup.ts      # Test configuration
│   │   └── auth.test.ts  # Authentication tests
│   └── index.ts          # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema definition
├── logs/                 # Application logs (gitignored)
├── .env.example          # Environment variable template
├── Dockerfile            # Multi-stage production Docker image
├── docker-compose.yml    # Full stack with Postgres, Redis, Prisma Studio
├── tsconfig.json         # TypeScript configuration (strict mode)
├── .eslintrc.js          # ESLint rules
├── jest.config.js        # Jest testing configuration
└── package.json          # Dependencies and scripts
```

## 🗄️ Database Schema

### Core Models

**User** (`users`)
- Authentication: email/password (bcrypt hashed)
- Profile: fullName, country, phoneNumber, companyName, industry
- Relations: belongs to Organization, has UserSession[], has UserSettings

**Organization** (`organizations`)
- Multi-tenancy support
- Has owner (User), members (User[]), devices, alerts, achievements, networkHealth

**Device** (`devices`)
- IoT device records
- Fields: name, deviceType, firmwareVersion, location (lat/lng), status, batteryLevel, lastSeen
- Relations: belongs to Organization, has DeviceMetric[], has Alert[]

**DeviceMetric** (`device_metrics`)
- Time-series sensor data
- Fields: metricType (throughput, health, qos, interference), value, unit, timestamp
- Cascades on device deletion

**NetworkHealth** (`network_health`)
- Aggregated network analytics per organization
- Fields: healthIndex, throughputMbps, qosScore, interferenceDbm, predictedLoadPercent

**Alert** (`alerts`)
- System notifications
- Fields: alertType (warning, success, error, info), severity (low, medium, high, critical)
- Optional device association

**Achievement** (`achievements`)
- Environmental impact tracking
- Fields: achievementType (electricity, carbon, esg), progressPercent, currentLevel, maxLevel

**UserSession** (`user_sessions`)
- Refresh token management
- Cascades on user deletion

**UserSettings** (`user_settings`)
- User preferences and encrypted API keys (OpenAI, Anthropic)
- Fields: theme, language, notifications, timezone, dateFormat

### Database Operations

Always use Prisma Client for database operations:

```typescript
import { PrismaClient } from '@prisma/client';

// Instance available at @/config/database
const prisma = new PrismaClient();

// Always handle errors appropriately
try {
  const device = await prisma.device.findUnique({ where: { id } });
} catch (error) {
  logger.error('Database error', { error });
  throw error;
}
```

## 🔧 Development Workflows

### Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**
   ```bash
   npm run db:generate   # Generate Prisma Client
   npm run db:migrate    # Run migrations
   npm run db:seed       # Seed sample data (optional)
   ```

4. **Start development server:**
   ```bash
   npm run dev           # Starts with tsx watch mode
   ```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Run production build (node dist/index.js) |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run db:migrate` | Create and apply database migration |
| `npm run db:generate` | Generate Prisma Client after schema changes |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio GUI (port 5555) |

### Docker Workflow

**Using Docker Compose (recommended for development):**

```bash
# Start full stack (Postgres, Redis, Backend, Prisma Studio)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

**Standalone Docker:**

```bash
# Build image
docker build -t airguard-backend .

# Run container
docker run -p 3001:3001 --env-file .env airguard-backend
```

### Testing

- Test files in `src/__tests__/`
- Using Jest with ts-jest
- Setup file: `src/__tests__/setup.ts`
- Run tests before committing changes

## 🎨 Code Conventions

### TypeScript Standards

**Strict Mode Enabled:**
- `strict: true` in tsconfig.json
- `noImplicitAny`, `noImplicitReturns`, `noImplicitThis`
- `noUnusedLocals`, `noUnusedParameters`
- `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`

**Path Aliases:**
```typescript
// Use @ prefix for imports
import { authService } from '@/services/authService';
import { User } from '@/types';
import logger from '@/config/logger';

// Available aliases:
// @/* - src/*
// @/types/* - src/types/*
// @/services/* - src/services/*
// @/controllers/* - src/controllers/*
// @/middleware/* - src/middleware/*
// @/utils/* - src/utils/*
// @/config/* - src/config/*
```

### ESLint Rules

Key rules to follow:
- No unused variables (except prefixed with `_`)
- Prefer `const` over `let`, never use `var`
- `@typescript-eslint/no-explicit-any` is a warning (avoid `any` when possible)
- `@typescript-eslint/no-non-null-assertion` is a warning (use safe checks)

### Naming Conventions

- **Files:** camelCase for modules (e.g., `authController.ts`, `deviceService.ts`)
- **Types/Interfaces:** PascalCase (e.g., `User`, `DeviceMetric`)
- **Functions/Variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Database tables:** snake_case (via Prisma @@map)

### API Response Format

Always return consistent JSON responses:

```typescript
// Success response
res.json({
  success: true,
  data: { /* payload */ },
  message: 'Optional success message'
});

// Error response
res.status(statusCode).json({
  success: false,
  error: 'Error message'
});
```

### Error Handling

1. **Use try-catch blocks** in async functions
2. **Log errors** with Winston logger
3. **Return appropriate HTTP status codes:**
   - 400: Bad Request (validation errors)
   - 401: Unauthorized (missing/invalid token)
   - 403: Forbidden (insufficient permissions)
   - 404: Not Found
   - 500: Internal Server Error

```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', { error, context });
  res.status(500).json({ success: false, error: 'Operation failed' });
}
```

### Logging

Use Winston logger from `@/config/logger`:

```typescript
import logger from '@/config/logger';

logger.info('User logged in', { userId, email });
logger.warn('Suspicious activity', { ip, attempts });
logger.error('Database connection failed', { error });
logger.debug('Request details', { method, path, body });
```

## 🔐 Security Practices

### Authentication Flow

1. **Signup/Login** → Returns access token (15m) + refresh token (7d)
2. **Protected routes** → Require `Authorization: Bearer <token>` header
3. **Token refresh** → Use refresh token to get new access token
4. **Logout** → Invalidate refresh token

### Middleware Usage

```typescript
import { authenticateToken, requireOrganization } from '@/middleware/auth';

// Require authenticated user
app.get('/api/protected', authenticateToken, handler);

// Require user with organization
app.get('/api/devices', authenticateToken, requireOrganization, handler);
```

### Sensitive Data

- **Passwords:** Always hash with bcrypt (12 rounds)
- **API Keys:** Encrypt with AES-256-GCM before storing
- **JWT Secrets:** Use strong, random secrets (32+ characters)
- **Environment Variables:** Never commit `.env` files

### Security Headers

- **Helmet** applies security headers
- **CORS** configured for specific origins
- **Rate limiting:** 100 requests per 15 minutes per IP

## 🌐 API Architecture

### Entry Point

`src/index.ts` - Express app setup with:
- Security middleware (helmet, CORS, rate limiting)
- Body parsers
- Route definitions
- WebSocket setup
- Error handlers
- Graceful shutdown handlers

### Route Structure

```
/health                                    # Health check
/api/auth/*                                # Authentication
  POST /signup, /login, /refresh, /logout
  GET /profile
/api/devices/*                             # Device management
  GET /devices, /devices/:id
  POST /devices
  PUT /devices/:id
  DELETE /devices/:id
  POST /devices/:deviceId/metrics
  GET /devices/:deviceId/metrics
/api/settings/*                            # User settings
  GET /settings
  PUT /settings
/api/dashboard/*                           # Dashboard metrics
  GET /metrics, /network-health
/api/simulation/*                          # Device simulation (dev)
  POST /start, /stop
```

### WebSocket Events

**Client → Server:**
- `join-organization` - Join organization room
- `subscribe-devices` - Subscribe to device updates

**Server → Client:**
- `device-update` - Device status/metrics changed
- `network-update` - Network health updated
- `alert` - New alert notification

## 🧪 Testing Guidelines

1. **Write tests for:**
   - Authentication flows
   - Authorization checks
   - Business logic in services
   - Input validation

2. **Test structure:**
   ```typescript
   describe('Feature', () => {
     beforeEach(() => {
       // Setup
     });

     it('should handle case', async () => {
       // Arrange
       // Act
       // Assert
     });
   });
   ```

3. **Run tests before committing:**
   ```bash
   npm test
   ```

## 🚢 Deployment

### Environment Variables

Required in production:
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (optional)
- `JWT_SECRET` - Strong secret (32+ chars)
- `JWT_REFRESH_SECRET` - Strong secret (32+ chars)
- `ENCRYPTION_KEY` - 32-character key for API key encryption
- `FRONTEND_URL` - For CORS configuration

### Production Build

```bash
npm ci --only=production  # Install production deps
npm run build             # Compile TypeScript
npm start                 # Run production server
```

### Docker Deployment

The Dockerfile uses Node.js 24 LTS Alpine with multi-stage build:
- Dependencies layer (cached)
- Production runtime with Prisma client
- Runs with tsx (no build step needed)
- Non-root user (nodejs:nodejs)
- Exposed port: 3001

### Database Migrations

```bash
# Production migration
npx prisma migrate deploy
```

## 📝 Common Tasks for AI Assistants

### Adding a New API Endpoint

1. **Define route** in `src/index.ts`
2. **Create controller** method in appropriate controller
3. **Implement service** logic if needed
4. **Add authentication** middleware if protected
5. **Update types** if new data structures
6. **Write tests**

### Adding a Database Model

1. **Update** `prisma/schema.prisma`
2. **Create migration:** `npm run db:migrate`
3. **Generate client:** `npm run db:generate`
4. **Add TypeScript types** in `src/types/index.ts`
5. **Update seed script** if needed

### Modifying Authentication

- Auth logic in `src/services/authService.ts`
- Middleware in `src/middleware/auth.ts`
- Controller in `src/controllers/authController.ts`
- Always test token generation and validation

### Working with IoT Data

- Device simulator: `src/services/deviceSimulator.ts`
- Device operations: `src/services/deviceService.ts`
- Metrics stored in `DeviceMetric` model
- Real-time updates via Socket.io

### Debugging Tips

1. **Check logs:** `logs/app.log` or console output
2. **Database GUI:** `npm run db:studio`
3. **Test API:** Use `test-api.http` or `test-curl.sh`
4. **Environment:** Verify `.env` configuration
5. **Docker logs:** `docker-compose logs -f`

## 🚨 Important Notes

### What to Avoid

- **Never commit** `.env` files or secrets
- **Don't use `any` type** unless absolutely necessary
- **Don't bypass** authentication middleware
- **Don't write raw SQL** - use Prisma
- **Don't skip** input validation
- **Don't ignore** ESLint warnings

### Best Practices

- **Always use path aliases** (`@/`) for imports
- **Log important operations** with appropriate level
- **Handle errors gracefully** with try-catch
- **Validate input** before processing
- **Use TypeScript types** for type safety
- **Write meaningful commit messages**
- **Test before committing**

### Performance Considerations

- **Database queries:** Use Prisma's `select` to fetch only needed fields
- **N+1 queries:** Use `include` for relations
- **Pagination:** Implement for large datasets
- **Caching:** Consider Redis for frequently accessed data
- **WebSocket:** Don't broadcast to all clients unnecessarily

### Multi-tenancy

- All devices, alerts, achievements, and network health are **organization-scoped**
- Always filter by `organizationId` from `req.user.organizationId`
- Use `requireOrganization` middleware for organization-specific endpoints
- Validate user has access to requested resources

## 📚 Related Documentation

- **README.md** - General project overview and setup
- **README-DEPLOYMENT.md** - Detailed deployment guide
- **DATA_SOURCES.md** - IoT data flow and device integration
- **.env.example** - All available environment variables
- **prisma/schema.prisma** - Complete database schema

## 🔄 Keeping This Document Updated

When making significant changes to the codebase:

1. Update this document to reflect new patterns
2. Document new environment variables
3. Add new common tasks
4. Update the structure diagram if folders change
5. Reflect dependency updates in the tech stack section

---

**Last Updated:** 2025-11-15
**Node.js Version:** 24 LTS
**Prisma Version:** 5.10.0
**TypeScript Version:** 5.0+

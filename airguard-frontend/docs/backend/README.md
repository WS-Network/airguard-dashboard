# Backend Documentation

## 🎯 Overview

The Airguard backend is a **Node.js** application built with **Express.js 4.18.0** and **TypeScript 5.x**. It provides a RESTful API for IoT device management, real-time monitoring, and user authentication with comprehensive security features.

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/              # Request handlers and business logic
│   │   ├── authController.ts     # Authentication operations
│   │   ├── deviceController.ts   # Device management
│   │   └── settingsController.ts # User settings management
│   ├── services/                 # Business logic layer
│   │   ├── authService.ts        # Authentication service
│   │   ├── deviceService.ts      # Device operations
│   │   ├── encryptionService.ts  # Data encryption utilities
│   │   └── deviceSimulator.ts    # Device simulation service
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # JWT authentication
│   │   ├── validation.ts         # Request validation
│   │   └── errorHandler.ts       # Error handling middleware
│   ├── routes/                   # API route definitions
│   ├── types/                    # TypeScript interfaces
│   ├── utils/                    # Utility functions
│   ├── config/                   # Configuration files
│   │   └── logger.ts             # Winston logging configuration
│   └── index.ts                  # Application entry point
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Database schema definition
│   └── migrations/               # Database migration files
├── scripts/                      # Database utilities
│   └── seed.ts                   # Database seeding script
├── __tests__/                    # Test files
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── Dockerfile                    # Docker containerization
└── docker-compose.yml            # Docker services configuration
```

## ⚙️ Core Technologies

### Runtime & Framework
- **Node.js**: Version 18.0.0 or higher
- **Express.js**: Web application framework
- **TypeScript**: Type-safe JavaScript development
- **tsx**: TypeScript execution environment

### Database & ORM
- **Prisma**: Type-safe database client
- **PostgreSQL**: Primary database (with SQLite fallback)
- **Database Migrations**: Version-controlled schema changes

### Security & Authentication
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling

### Real-time Communication
- **Socket.io**: WebSocket server for real-time updates
- **HTTP Server**: RESTful API endpoints

## 🚀 Application Entry Point

### Main Server (`src/index.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env['FRONTEND_URL'] || 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [process.env['FRONTEND_URL'] || 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);
```

## 🔐 Authentication System

### JWT Token Management

#### Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}
```

#### Authentication Flow
```
1. User Login → 2. Credential Validation → 3. JWT Generation
       ↓
4. Token Storage → 5. API Requests → 6. Token Validation
       ↓
7. Access Control → 8. Resource Authorization
```

#### Authentication Middleware
```typescript
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as JWTPayload;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};
```

## 🎮 API Controllers

### 1. **Authentication Controller** (`controllers/authController.ts`)

#### User Registration
```typescript
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, ...otherData } = req.body;
    
    // Validate input
    const validation = signupSchema.validate(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error.details[0].message
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        ...otherData
      }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        }
      },
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

#### User Login
```typescript
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        organizationId: user.organizationId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

### 2. **Device Controller** (`controllers/deviceController.ts`)

#### Device Management
```typescript
export const getDevices = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    
    const devices = await prisma.device.findMany({
      where: { organizationId },
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    res.json({
      success: true,
      data: devices,
      message: 'Devices retrieved successfully'
    });
  } catch (error) {
    logger.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const createDevice = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const deviceData = req.body;

    const device = await prisma.device.create({
      data: {
        ...deviceData,
        organizationId
      }
    });

    res.status(201).json({
      success: true,
      data: device,
      message: 'Device created successfully'
    });
  } catch (error) {
    logger.error('Create device error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

### 3. **Settings Controller** (`controllers/settingsController.ts`)

#### User Settings Management
```typescript
export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      return res.status(404).json({
        success: false,
        error: 'Settings not found'
      });
    }

    res.json({
      success: true,
      data: settings,
      message: 'Settings retrieved successfully'
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

## 🔧 Services Layer

### 1. **Authentication Service** (`services/authService.ts`)

#### Password Management
```typescript
export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(userId: string, email: string, organizationId?: string) {
    const accessToken = jwt.sign(
      { userId, email, organizationId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}
```

### 2. **Encryption Service** (`services/encryptionService.ts`)

#### API Key Encryption
```typescript
export class EncryptionService {
  private static algorithm = 'aes-256-cbc';
  private static secretKey = process.env.ENCRYPTION_KEY!;

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 3. **Device Simulator Service** (`services/deviceSimulator.ts`)

#### Simulation Management
```typescript
export class DeviceSimulator {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static startSimulation(intervalMs: number = 30000): void {
    if (this.isRunning) {
      throw new Error('Simulation already running');
    }

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.generateSimulatedData();
    }, intervalMs);

    logger.info(`Device simulation started with ${intervalMs}ms interval`);
  }

  static stopSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info('Device simulation stopped');
    }
  }

  private static async generateSimulatedData(): Promise<void> {
    try {
      // Generate simulated device metrics
      const metrics = this.generateRandomMetrics();
      
      // Store in database
      await prisma.deviceMetric.createMany({
        data: metrics
      });

      // Emit real-time updates
      io.emit('metrics:update', { metrics });
    } catch (error) {
      logger.error('Error generating simulated data:', error);
    }
  }

  private static generateRandomMetrics() {
    // Implementation for generating random metrics
    return [];
  }
}
```

## 🛡️ Middleware

### 1. **Authentication Middleware** (`middleware/auth.ts`)

#### JWT Validation
```typescript
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const requireOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({
      success: false,
      error: 'Organization access required'
    });
  }
  next();
};
```

### 2. **Validation Middleware** (`middleware/validation.ts`)

#### Request Validation
```typescript
export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    next();
  };
};
```

### 3. **Error Handling Middleware** (`middleware/errorHandler.ts`)

#### Global Error Handler
```typescript
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error:', error);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
};
```

## 📡 Real-Time Communication

### Socket.io Integration

#### Connection Management
```typescript
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join organization room
  socket.on('join:organization', (organizationId: string) => {
    socket.join(`org:${organizationId}`);
    logger.info(`Client ${socket.id} joined organization ${organizationId}`);
  });

  // Handle device updates
  socket.on('device:update', async (data) => {
    try {
      // Process device update
      const updatedDevice = await deviceService.updateDevice(data);
      
      // Broadcast to organization
      socket.to(`org:${data.organizationId}`).emit('device:updated', updatedDevice);
    } catch (error) {
      logger.error('Device update error:', error);
      socket.emit('error', { message: 'Failed to update device' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});
```

#### Event Types
- **Device Status**: Real-time device online/offline updates
- **Metrics Updates**: Live sensor data streaming
- **Alert Notifications**: System alerts and warnings
- **User Activity**: Login/logout and session events

## 🗄️ Database Operations

### Prisma Integration

#### Database Client
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

#### Transaction Management
```typescript
export const createUserWithOrganization = async (
  userData: CreateUserData,
  organizationData: CreateOrganizationData
) => {
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: organizationData
    });

    const user = await tx.user.create({
      data: {
        ...userData,
        organizationId: organization.id
      }
    });

    return { user, organization };
  });
};
```

## 📊 Logging & Monitoring

### Winston Configuration

#### Logger Setup
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

#### Logging Usage
```typescript
// Request logging
logger.info(`${req.method} ${req.path}`, { 
  ip: req.ip, 
  userAgent: req.get('User-Agent'),
  userId: req.user?.userId 
});

// Error logging
logger.error('Database operation failed', {
  error: error.message,
  stack: error.stack,
  userId: req.user?.userId,
  operation: 'createDevice'
});
```

## 🧪 Testing

### Testing Strategy

#### Unit Tests
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../services/authService';

describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash).toHaveLength(60);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });
});
```

#### Integration Tests
```typescript
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/database';

describe('Auth API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/signup', () => {
    it('should create new user', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });
  });
});
```

## 🚀 Performance Optimization

### Database Optimization
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries and efficient joins
- **Batch Operations**: Bulk insert/update operations
- **Caching**: Redis integration for frequently accessed data

### API Optimization
- **Rate Limiting**: Prevent API abuse
- **Response Compression**: Gzip compression for large responses
- **Pagination**: Efficient data retrieval
- **Field Selection**: Allow clients to specify required fields

## 🔒 Security Features

### Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

*This backend architecture provides a robust, scalable foundation for IoT device management and real-time monitoring.*

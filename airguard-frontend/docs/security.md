# Security Documentation

## 🎯 Overview

Airguard implements comprehensive security measures to protect user data, API endpoints, and system resources. The security architecture follows industry best practices and provides multiple layers of protection.

## 🔐 Authentication System

### JWT Token Architecture

#### Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: 'user' | 'admin';
  iat: number;        // Issued at timestamp
  exp: number;        // Expiration timestamp
  jti: string;        // JWT ID for token uniqueness
}
```

#### Token Types

**Access Token**
- **Lifetime**: 15 minutes
- **Purpose**: API authentication
- **Storage**: Memory (not persisted)
- **Refresh**: Automatic via refresh token

**Refresh Token**
- **Lifetime**: 7 days
- **Purpose**: Token renewal
- **Storage**: Secure HTTP-only cookie
- **Rotation**: New refresh token on each use

#### Token Generation
```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class TokenService {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m',
      issuer: 'airguard-api',
      audience: 'airguard-web',
      jwtid: crypto.randomUUID()
    });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: '7d',
        issuer: 'airguard-api',
        audience: 'airguard-web',
        jwtid: crypto.randomUUID()
      }
    );
  }
}
```

### Authentication Flow

#### 1. User Login
```
User submits credentials → Backend validates → Generates tokens → Returns to client
```

#### 2. Token Usage
```
Client includes access token → Backend validates → Processes request → Returns response
```

#### 3. Token Refresh
```
Access token expires → Client uses refresh token → Backend validates → Issues new tokens
```

#### 4. Token Invalidation
```
User logout → Backend invalidates refresh token → Client clears local storage
```

### Password Security

#### Hashing Implementation
```typescript
import bcrypt from 'bcryptjs';

export class PasswordService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  }
}
```

#### Password Requirements
- **Minimum Length**: 8 characters
- **Complexity**: Uppercase, lowercase, numbers, special characters
- **Common Passwords**: Blocked via dictionary check
- **History**: Prevent reuse of recent passwords

## 🛡️ Authorization & Access Control

### Role-Based Access Control (RBAC)

#### User Roles
```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  ORGANIZATION_OWNER = 'owner'
}

interface UserPermissions {
  canManageDevices: boolean;
  canViewMetrics: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
  canViewAnalytics: boolean;
}
```

#### Permission Matrix
| Role | Devices | Metrics | Users | Settings | Analytics |
|------|---------|---------|-------|----------|-----------|
| User | View | View | None | Own | Limited |
| Admin | Full | Full | View | Full | Full |
| Owner | Full | Full | Full | Full | Full |

### Organization Isolation

#### Data Segregation
```typescript
// Middleware to ensure organization access
export const requireOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { organizationId } = req.user!;
  
  if (!organizationId) {
    return res.status(403).json({
      success: false,
      error: 'Organization access required'
    });
  }

  // Ensure user can only access their organization's data
  req.organizationId = organizationId;
  next();
};

// Controller with organization isolation
export const getDevices = async (req: Request, res: Response) => {
  const { organizationId } = req.user!;
  
  const devices = await prisma.device.findMany({
    where: { organizationId }, // Only devices from user's organization
    include: { metrics: true }
  });

  res.json({ success: true, data: devices });
};
```

#### Cross-Organization Protection
- **Database Queries**: Always filtered by organizationId
- **API Endpoints**: Validate organization membership
- **File Access**: Organization-scoped file storage
- **Real-time Events**: Organization-specific WebSocket rooms

## 🔒 Data Encryption

### API Key Encryption

#### Encryption Service
```typescript
import crypto from 'crypto';

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

  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

#### Encryption Usage
```typescript
// Store encrypted API key
const encryptedKey = EncryptionService.encrypt(apiKey);
await prisma.userSettings.update({
  where: { userId },
  data: { apiKeys: { openai: encryptedKey } }
});

// Retrieve and decrypt API key
const encryptedKey = userSettings.apiKeys.openai;
const decryptedKey = EncryptionService.decrypt(encryptedKey);
```

### Sensitive Data Protection

#### Data Classification
- **Public**: Device names, public metrics
- **Internal**: User preferences, organization details
- **Confidential**: API keys, passwords, personal information
- **Restricted**: Admin access, system configuration

#### Encryption at Rest
- **Database**: Encrypted columns for sensitive fields
- **File Storage**: Encrypted files for confidential documents
- **Backups**: Encrypted backup files
- **Logs**: Masked sensitive data in logs

## 🌐 Network Security

### HTTPS/TLS Configuration

#### SSL/TLS Setup
```typescript
import https from 'https';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ca: fs.readFileSync('path/to/ca-bundle.pem'),
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256'
};

const server = https.createServer(httpsOptions, app);
```

#### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### CORS Configuration

#### CORS Policy
```typescript
import cors from 'cors';

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = [
      process.env.FRONTEND_URL!,
      'http://localhost:3000',
      'https://airguard.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Remaining']
};

app.use(cors(corsOptions));
```

## 🚦 Rate Limiting & DDoS Protection

### Rate Limiting Implementation

#### Express Rate Limit
```typescript
import rateLimit from 'express-rate-limit';

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Stricter limits for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
```

#### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
Retry-After: 900
```

### DDoS Protection

#### Protection Measures
- **Request Throttling**: Per-IP rate limiting
- **Connection Limits**: Maximum concurrent connections
- **Request Size Limits**: Maximum payload size
- **Timeout Configuration**: Request timeout limits

#### Monitoring & Alerts
```typescript
// Monitor rate limit violations
app.use((req, res, next) => {
  const clientIP = req.ip;
  const requestCount = req.rateLimit?.current || 0;
  
  if (requestCount > 80) { // 80% of limit
    logger.warn('High request rate detected', {
      ip: clientIP,
      count: requestCount,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
});
```

## 🔍 Input Validation & Sanitization

### Request Validation

#### Joi Schema Validation
```typescript
import Joi from 'joi';

const userSignupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')
  ).required(),
  fullName: Joi.string().min(2).max(100).required(),
  country: Joi.string().max(100).optional(),
  phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  acceptTerms: Joi.boolean().valid(true).required()
});

export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userSignupSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  next();
};
```

#### SQL Injection Prevention
```typescript
// Prisma automatically prevents SQL injection
const user = await prisma.user.findUnique({
  where: { email: userEmail } // Safe from SQL injection
});

// Never use raw SQL with user input
// ❌ DON'T DO THIS
// const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userEmail}`;

// ✅ DO THIS INSTEAD
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});
```

### XSS Protection

#### Content Security Policy
```typescript
// CSP configuration in helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
```

#### Input Sanitization
```typescript
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Usage in controllers
export const createDevice = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  // Sanitize user input
  const sanitizedName = sanitizeInput(name);
  const sanitizedDescription = sanitizeInput(description);
  
  const device = await prisma.device.create({
    data: {
      name: sanitizedName,
      description: sanitizedDescription,
      organizationId: req.user!.organizationId
    }
  });
  
  res.status(201).json({ success: true, data: device });
};
```

## 📊 Security Monitoring & Logging

### Security Event Logging

#### Winston Logger Configuration
```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: 'logs/security-error.log',
      level: 'error'
    })
  ]
});

// Log security events
export const logSecurityEvent = (event: string, details: any) => {
  securityLogger.info(event, {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity: 'info'
  });
};

export const logSecurityViolation = (event: string, details: any) => {
  securityLogger.error(event, {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity: 'high'
  });
};
```

#### Security Events to Log
- **Authentication**: Login attempts, failures, token refresh
- **Authorization**: Access denied, permission violations
- **Input Validation**: Invalid input, malformed requests
- **Rate Limiting**: Rate limit violations, suspicious activity
- **System Access**: Admin actions, configuration changes

### Intrusion Detection

#### Suspicious Activity Detection
```typescript
// Monitor for suspicious patterns
export const detectSuspiciousActivity = (req: Request) => {
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');
  const path = req.path;
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,           // Directory traversal
    /<script>/i,        // XSS attempts
    /union\s+select/i,  // SQL injection
    /eval\s*\(/i        // Code injection
  ];
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(req.body) || pattern.test(req.query)
  );
  
  if (hasSuspiciousPattern) {
    logSecurityViolation('Suspicious activity detected', {
      ip: clientIP,
      userAgent,
      path,
      body: req.body,
      query: req.query
    });
    
    return true;
  }
  
  return false;
};
```

## 🚨 Incident Response

### Security Incident Types

#### 1. **Authentication Breach**
- **Detection**: Multiple failed login attempts, suspicious login patterns
- **Response**: Account lockout, password reset, security review
- **Recovery**: Account restoration, security audit

#### 2. **Data Breach**
- **Detection**: Unauthorized data access, suspicious API usage
- **Response**: Immediate access revocation, incident investigation
- **Recovery**: Data restoration, security hardening

#### 3. **DDoS Attack**
- **Detection**: Unusual traffic patterns, service degradation
- **Response**: Traffic filtering, rate limiting, CDN protection
- **Recovery**: Service restoration, attack analysis

### Incident Response Plan

#### Immediate Response (0-1 hour)
1. **Assess Impact**: Determine scope and severity
2. **Contain Threat**: Isolate affected systems
3. **Notify Stakeholders**: Alert security team and management
4. **Preserve Evidence**: Log all relevant information

#### Short-term Response (1-24 hours)
1. **Investigate Cause**: Root cause analysis
2. **Implement Fixes**: Security patches and updates
3. **Monitor Systems**: Enhanced monitoring and alerting
4. **Update Stakeholders**: Regular status updates

#### Long-term Response (1-30 days)
1. **Post-incident Review**: Lessons learned analysis
2. **Security Improvements**: Implement preventive measures
3. **Documentation**: Update security procedures
4. **Training**: Staff security awareness training

## 🔧 Security Configuration

### Environment Variables

#### Required Security Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Security Settings
NODE_ENV=production
SESSION_SECRET=your-session-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

#### Security Best Practices
- **Strong Secrets**: Use cryptographically secure random strings
- **Environment Separation**: Different secrets for dev/staging/prod
- **Secret Rotation**: Regular secret updates
- **Access Control**: Limit access to production secrets

### Security Headers

#### Comprehensive Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true
}));
```

## 📚 Security Resources

### Security Tools & Libraries
- **Helmet**: Security middleware for Express
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT implementation
- **joi**: Input validation
- **cors**: CORS configuration
- **express-rate-limit**: Rate limiting

### Security Standards
- **OWASP Top 10**: Web application security risks
- **NIST Cybersecurity Framework**: Security best practices
- **ISO 27001**: Information security management
- **GDPR**: Data protection regulations

### Security Testing

#### Automated Security Testing
```bash
# Run security audits
npm audit

# Fix security vulnerabilities
npm audit fix

# Run security linting
npm run lint:security

# Run security tests
npm run test:security
```

#### Manual Security Testing
- **Penetration Testing**: Regular security assessments
- **Code Reviews**: Security-focused code analysis
- **Vulnerability Scanning**: Automated security scanning
- **Security Training**: Developer security awareness

---

*This security architecture provides comprehensive protection for the Airguard platform while maintaining usability and performance.*

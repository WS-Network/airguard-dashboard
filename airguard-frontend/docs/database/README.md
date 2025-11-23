# Database Documentation

## 🎯 Overview

The Airguard database uses **PostgreSQL** as the primary database with **Prisma ORM** for type-safe database operations. The database is designed to support multi-tenant IoT device management with comprehensive data tracking and real-time monitoring capabilities.

## 🏗️ Database Architecture

### Technology Stack
- **Database**: PostgreSQL 12+ (with SQLite fallback for development)
- **ORM**: Prisma 5.10.0
- **Migration Tool**: Prisma Migrate
- **Database Client**: Prisma Client
- **Schema Management**: Prisma Schema Language

### Database Design Principles
- **Normalization**: Proper table structure and relationships
- **Multi-tenancy**: Organization-based data isolation
- **Performance**: Optimized indexes and query patterns
- **Scalability**: Efficient data storage and retrieval
- **Data Integrity**: Constraints and validation rules

## 📊 Database Schema

### Core Entity Relationships

```
User (1) ←→ (1) Organization (1) ←→ (N) Device
  ↓              ↓                    ↓
  ↓              ↓                    ↓
UserSettings  NetworkHealth      DeviceMetric
  ↓              ↓                    ↓
  ↓              ↓                    ↓
UserSession   Achievement         Alert
```

### Complete Schema Definition

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id                      String   @id @default(cuid())
  email                   String   @unique
  passwordHash            String
  fullName                String
  country                 String?
  phoneNumber             String?
  companyName             String?
  industry                String?
  businessType            String?
  hearAboutUs             String?
  nonGovernmentEndUser    Boolean  @default(false)
  acceptTerms             Boolean  @default(false)
  newsPromotions          Boolean  @default(false)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  // Relations
  organization            Organization? @relation("OrganizationMembers", fields: [organizationId], references: [id])
  organizationId          String?
  sessions                UserSession[]
  ownedOrganizations      Organization[] @relation("OrganizationOwner")
  settings                UserSettings?

  @@map("users")
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())

  // Relations
  owner     User     @relation("OrganizationOwner", fields: [ownerId], references: [id])
  ownerId   String
  users     User[]   @relation("OrganizationMembers")
  devices   Device[]
  alerts    Alert[]
  achievements Achievement[]
  networkHealth NetworkHealth[]

  @@map("organizations")
}

model Device {
  id                    String   @id @default(cuid())
  name                  String
  deviceType            String?
  firmwareVersion       String?
  latitude              Float?
  longitude             Float?
  locationDescription   String?
  status                String   @default("offline") // online, offline, warning
  batteryLevel          Int?
  lastSeen              DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  organization          Organization @relation(fields: [organizationId], references: [id])
  organizationId        String
  metrics               DeviceMetric[]
  alerts                Alert[]

  @@map("devices")
}

model DeviceMetric {
  id         String   @id @default(cuid())
  metricType String   // throughput, health, qos, interference
  value      Float
  unit       String?
  timestamp  DateTime @default(now())

  // Relations
  device     Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  deviceId   String

  @@map("device_metrics")
}

model NetworkHealth {
  id                    String   @id @default(cuid())
  healthIndex           Float? // 0-100
  throughputMbps        Float?
  qosScore              Float?
  interferenceDbm       Float?
  predictedLoadPercent  Float?
  timestamp             DateTime @default(now())

  // Relations
  organization          Organization @relation(fields: [organizationId], references: [id])
  organizationId        String

  @@map("network_health")
}

model Alert {
  id          String   @id @default(cuid())
  type        String   // warning, error, critical
  message     String
  severity    String   // low, medium, high
  isResolved  Boolean  @default(false)
  createdAt   DateTime @default(now())
  resolvedAt  DateTime?

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  device        Device? @relation(fields: [deviceId], references: [id])
  deviceId      String?

  @@map("alerts")
}

model Achievement {
  id          String   @id @default(cuid())
  name        String
  description String
  icon        String?
  unlockedAt  DateTime @default(now())

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])
  organizationId String

  @@map("achievements")
}

model UserSession {
  id        String   @id @default(cuid())
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String

  @@map("user_sessions")
}

model UserSettings {
  id        String   @id @default(cuid())
  theme     String   @default("light") // light, dark, auto
  notifications Json? // JSON object for notification preferences
  apiKeys   Json?   // Encrypted API keys
  preferences Json? // User preferences
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String   @unique

  @@map("user_settings")
}
```

## 🔗 Entity Relationships

### 1. **User & Organization**
- **One-to-Many**: User can own multiple organizations
- **Many-to-One**: User can belong to one organization
- **Cascade Delete**: When organization is deleted, all related data is removed

### 2. **Organization & Devices**
- **One-to-Many**: Organization can have multiple devices
- **Device Isolation**: Devices are isolated by organization
- **Shared Resources**: Devices share organization-level resources

### 3. **Device & Metrics**
- **One-to-Many**: Device can have multiple metrics
- **Time-series Data**: Metrics are timestamped for historical analysis
- **Cascade Delete**: Device deletion removes all related metrics

### 4. **User & Settings**
- **One-to-One**: Each user has one settings record
- **Personalization**: Settings are user-specific
- **Encrypted Storage**: Sensitive data (API keys) are encrypted

## 🗄️ Database Operations

### Prisma Client Usage

#### Database Connection
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

#### Basic CRUD Operations

**Create Operations**
```typescript
// Create user with organization
const userWithOrg = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    fullName: 'John Doe',
    ownedOrganizations: {
      create: {
        name: 'Tech Corp'
      }
    }
  },
  include: {
    ownedOrganizations: true
  }
});

// Create device
const device = await prisma.device.create({
  data: {
    name: 'Air Quality Sensor 1',
    deviceType: 'air-quality',
    organizationId: 'org123',
    latitude: 40.7128,
    longitude: -74.0060
  }
});
```

**Read Operations**
```typescript
// Get user with organization and devices
const user = await prisma.user.findUnique({
  where: { id: 'user123' },
  include: {
    organization: {
      include: {
        devices: {
          include: {
            metrics: {
              orderBy: { timestamp: 'desc' },
              take: 10
            }
          }
        }
      }
    }
  }
});

// Get devices with latest metrics
const devices = await prisma.device.findMany({
  where: { organizationId: 'org123' },
  include: {
    metrics: {
      orderBy: { timestamp: 'desc' },
      take: 1
    }
  }
});
```

**Update Operations**
```typescript
// Update device status
const updatedDevice = await prisma.device.update({
  where: { id: 'device123' },
  data: {
    status: 'online',
    lastSeen: new Date(),
    batteryLevel: 85
  }
});

// Update user settings
const updatedSettings = await prisma.userSettings.update({
  where: { userId: 'user123' },
  data: {
    theme: 'dark',
    notifications: {
      email: true,
      push: false
    }
  }
});
```

**Delete Operations**
```typescript
// Delete device (cascades to metrics)
const deletedDevice = await prisma.device.delete({
  where: { id: 'device123' }
});

// Delete user (cascades to sessions and settings)
const deletedUser = await prisma.user.delete({
  where: { id: 'user123' }
});
```

### Advanced Queries

#### Aggregation Queries
```typescript
// Get device statistics
const deviceStats = await prisma.device.aggregate({
  where: { organizationId: 'org123' },
  _count: {
    id: true
  },
  _avg: {
    batteryLevel: true
  },
  _sum: {
    batteryLevel: true
  }
});

// Get metrics over time
const metricsOverTime = await prisma.deviceMetric.groupBy({
  by: ['metricType'],
  where: {
    deviceId: 'device123',
    timestamp: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  },
  _avg: {
    value: true
  },
  _count: {
    id: true
  }
});
```

#### Complex Joins
```typescript
// Get organization overview with device counts and health
const orgOverview = await prisma.organization.findMany({
  include: {
    _count: {
      select: {
        devices: true,
        users: true,
        alerts: true
      }
    },
    networkHealth: {
      orderBy: { timestamp: 'desc' },
      take: 1
    },
    devices: {
      where: { status: 'online' },
      select: { id: true }
    }
  }
});
```

#### Transaction Operations
```typescript
// Create user with organization in transaction
const result = await prisma.$transaction(async (tx) => {
  const organization = await tx.organization.create({
    data: {
      name: 'New Corp',
      ownerId: 'user123'
    }
  });

  const user = await tx.user.update({
    where: { id: 'user123' },
    data: {
      organizationId: organization.id
    }
  });

  return { organization, user };
});
```

## 🔐 Data Security

### Encryption
- **API Keys**: Encrypted using AES-256-CBC
- **Passwords**: Hashed using bcrypt with salt rounds 12
- **Sensitive Data**: Encrypted before database storage

### Access Control
- **Organization Isolation**: Data access restricted by organization
- **User Permissions**: Role-based access control
- **Audit Logging**: Track data access and modifications

## 📈 Performance Optimization

### Indexing Strategy
```sql
-- Primary indexes (automatic)
CREATE INDEX ON users(email);
CREATE INDEX ON devices(organization_id);
CREATE INDEX ON device_metrics(device_id, timestamp);

-- Composite indexes for common queries
CREATE INDEX ON devices(organization_id, status);
CREATE INDEX ON device_metrics(device_id, metric_type, timestamp);
CREATE INDEX ON alerts(organization_id, is_resolved, created_at);
```

### Query Optimization
- **Selective Fields**: Only fetch required data
- **Pagination**: Limit result sets for large queries
- **Connection Pooling**: Efficient database connections
- **Query Caching**: Cache frequently accessed data

## 🗃️ Data Migration

### Prisma Migrations
```bash
# Create new migration
npx prisma migrate dev --name add_user_settings

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View migration history
npx prisma migrate status
```

### Migration Files
```sql
-- Migration: add_user_settings
-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "notifications" TEXT,
    "api_keys" TEXT,
    "preferences" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");
```

## 🌱 Database Seeding

### Seed Script
```typescript
// scripts/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Corp',
      owner: {
        create: {
          email: 'admin@democorp.com',
          passwordHash: await bcrypt.hash('password123', 12),
          fullName: 'Demo Admin',
          acceptTerms: true
        }
      }
    }
  });

  // Create sample devices
  const devices = await Promise.all([
    prisma.device.create({
      data: {
        name: 'Air Quality Sensor 1',
        deviceType: 'air-quality',
        organizationId: organization.id,
        latitude: 40.7128,
        longitude: -74.0060
      }
    }),
    prisma.device.create({
      data: {
        name: 'Temperature Sensor 1',
        deviceType: 'temperature',
        organizationId: organization.id,
        latitude: 40.7589,
        longitude: -73.9851
      }
    })
  ]);

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Seeds
```bash
# Run seed script
npm run db:seed

# Or manually
npx tsx src/scripts/seed.ts
```

## 🔍 Database Monitoring

### Prisma Studio
```bash
# Open Prisma Studio
npm run db:studio

# Or manually
npx prisma studio
```

### Query Logging
```typescript
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## 🧪 Testing

### Test Database Setup
```typescript
// __tests__/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db'
    }
  }
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.device.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Database Testing
```typescript
describe('User Management', () => {
  it('should create user with organization', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        fullName: 'Test User',
        ownedOrganizations: {
          create: {
            name: 'Test Corp'
          }
        }
      },
      include: {
        ownedOrganizations: true
      }
    });

    expect(user.ownedOrganizations).toHaveLength(1);
    expect(user.ownedOrganizations[0].name).toBe('Test Corp');
  });
});
```

## 🚀 Production Considerations

### Database Scaling
- **Connection Pooling**: Configure appropriate pool size
- **Read Replicas**: Use read replicas for heavy queries
- **Sharding**: Consider sharding for very large datasets
- **Backup Strategy**: Regular automated backups

### Environment Configuration
```env
# Production Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Connection Pool
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=30000

# SSL Configuration
DATABASE_SSL_MODE=require
```

---

*This database architecture provides a robust foundation for IoT device management with proper data isolation, performance optimization, and security measures.*

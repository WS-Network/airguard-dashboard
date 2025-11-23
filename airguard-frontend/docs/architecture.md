# Architecture Overview

## 🏗️ System Architecture

Airguard follows a modern, scalable architecture pattern designed for IoT monitoring and real-time data processing. The system is built with separation of concerns, microservices principles, and event-driven architecture.

## 🔄 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        IoT Devices Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Sensor 1  │  │   Sensor 2  │  │   Sensor N  │           │
│  │ (Air Quality)│  │ (Temperature)│  │ (Humidity)  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Communication Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   HTTP      │  │   MQTT      │  │   WebSocket │           │
│  │   REST API  │  │   Protocol  │  │   Real-time │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   API       │  │   Business  │  │   Data      │           │
│  │   Gateway   │  │   Logic     │  │   Access    │           │
│  │ (Express.js)│  │ (Services)  │  │   (Prisma)  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ PostgreSQL  │  │   Redis     │  │   File      │           │
│  │ (Primary)   │  │ (Cache)     │  │   Storage   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Dashboard │  │   Device    │  │   Settings  │           │
│  │   (Home)    │  │   Management│  │   Panel     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### 1. **Separation of Concerns**
- **Frontend**: UI/UX, state management, API communication
- **Backend**: Business logic, data processing, API endpoints
- **Database**: Data persistence, relationships, constraints

### 2. **Microservices Architecture**
- **Authentication Service**: User management and JWT handling
- **Device Service**: IoT device management and monitoring
- **Metrics Service**: Data collection and analysis
- **Settings Service**: User preferences and configuration

### 3. **Event-Driven Design**
- Real-time updates via WebSocket connections
- Asynchronous processing of device metrics
- Event-based notification system

### 4. **Multi-Tenant Architecture**
- Organization-based user isolation
- Shared infrastructure with data separation
- Scalable user management

## 🏛️ Frontend Architecture

### Next.js App Router Structure
```
src/
├── app/                          # App Router pages
│   ├── dashboard/                # Dashboard routes
│   │   ├── home/                # Main dashboard
│   │   ├── devices/             # Device management
│   │   ├── manage/              # Settings and configuration
│   │   └── api-test/            # API testing interface
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                   # Reusable components
│   ├── dashboard/                # Dashboard-specific components
│   ├── ui/                      # Generic UI components
│   └── forms/                    # Form components
├── services/                     # API and external services
│   └── api.ts                   # API service layer
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
└── assets/                       # Static assets
```

### Component Architecture
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Container/Presentational Pattern**: Separation of logic and presentation
- **Custom Hooks**: Reusable stateful logic
- **Context API**: Global state management

## ⚙️ Backend Architecture

### Express.js Application Structure
```
backend/
├── src/
│   ├── controllers/              # Request handlers
│   │   ├── authController.ts     # Authentication logic
│   │   ├── deviceController.ts   # Device management
│   │   └── settingsController.ts # User settings
│   ├── services/                 # Business logic layer
│   │   ├── authService.ts        # Authentication service
│   │   ├── deviceService.ts      # Device operations
│   │   ├── encryptionService.ts  # Data encryption
│   │   └── deviceSimulator.ts    # Device simulation
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # JWT authentication
│   │   ├── validation.ts         # Request validation
│   │   └── errorHandler.ts       # Error handling
│   ├── routes/                   # API route definitions
│   ├── types/                    # TypeScript interfaces
│   ├── utils/                    # Utility functions
│   ├── config/                   # Configuration files
│   └── index.ts                  # Application entry point
├── prisma/                       # Database schema and migrations
└── scripts/                      # Database seeding and utilities
```

### Service Layer Pattern
- **Controller Layer**: HTTP request/response handling
- **Service Layer**: Business logic and data processing
- **Data Access Layer**: Database operations via Prisma
- **Middleware Layer**: Cross-cutting concerns (auth, validation, logging)

## 🗄️ Database Architecture

### Prisma Schema Design
```prisma
// Core entities
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  passwordHash String
  fullName    String
  // ... other fields
  
  // Relationships
  organization Organization? @relation("OrganizationMembers")
  ownedOrganizations Organization[] @relation("OrganizationOwner")
  settings    UserSettings?
  sessions    UserSession[]
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  
  // Relationships
  owner     User     @relation("OrganizationOwner")
  users     User[]   @relation("OrganizationMembers")
  devices   Device[]
  alerts    Alert[]
}

model Device {
  id        String   @id @default(cuid())
  name      String
  deviceType String?
  status    String   @default("offline")
  // ... other fields
  
  // Relationships
  organization Organization
  metrics     DeviceMetric[]
  alerts      Alert[]
}
```

### Database Design Principles
- **Normalization**: Proper table structure and relationships
- **Indexing**: Performance optimization for queries
- **Constraints**: Data integrity and validation
- **Migrations**: Version-controlled schema changes

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login → 2. Credential Validation → 3. JWT Generation
       ↓
4. Token Storage → 5. API Requests → 6. Token Validation
       ↓
7. Access Control → 8. Resource Authorization
```

### Security Layers
- **Transport Layer**: HTTPS/TLS encryption
- **Application Layer**: JWT tokens and session management
- **Data Layer**: Password hashing and data encryption
- **Network Layer**: CORS, rate limiting, and IP filtering

## 📡 Real-Time Communication

### WebSocket Architecture
```
Client ←→ Socket.io Server ←→ Express.js Backend
   ↓              ↓              ↓
Real-time    Event handling   Data processing
updates      and routing      and storage
```

### Event Types
- **Device Status Updates**: Online/offline status changes
- **Metric Updates**: Real-time sensor data
- **Alert Notifications**: System alerts and warnings
- **User Activity**: Login/logout events

## 🚀 Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple backend instances
- **Database Replication**: Read replicas for performance
- **Caching**: Redis for session and data caching
- **CDN**: Static asset distribution

### Performance Optimization
- **Database Indexing**: Query optimization
- **Connection Pooling**: Database connection management
- **Rate Limiting**: API request throttling
- **Compression**: Response size reduction

## 🔄 Data Flow

### 1. **Device Data Ingestion**
```
IoT Device → HTTP POST → Backend API → Validation → Database Storage
```

### 2. **Real-Time Updates**
```
Database Change → Event Trigger → WebSocket Broadcast → Frontend Update
```

### 3. **User Authentication**
```
Login Request → Credential Check → JWT Generation → Token Storage
```

### 4. **Data Retrieval**
```
Frontend Request → API Gateway → Authentication → Authorization → Data Fetch
```

## 🧪 Testing Architecture

### Testing Pyramid
```
    ┌─────────────┐
    │   E2E Tests │ ← Few, slow, expensive
    └─────────────┘
    ┌─────────────┐
    │Integration  │ ← Some, medium speed
    │   Tests     │
    └─────────────┘
    ┌─────────────┐
    │  Unit Tests │ ← Many, fast, cheap
    └─────────────┘
```

### Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Load testing and optimization

## 📊 Monitoring and Observability

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: Error, Warn, Info, Debug
- **Context Information**: Request ID, user ID, timestamp
- **Centralized Logging**: Winston-based logging system

### Metrics Collection
- **Application Metrics**: Response times, error rates
- **Business Metrics**: User activity, device status
- **Infrastructure Metrics**: CPU, memory, database performance

---

*This architecture provides a solid foundation for building scalable, maintainable IoT monitoring applications.*

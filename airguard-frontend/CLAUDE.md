# CLAUDE.md - AI Assistant Development Guide

> **Purpose**: This document provides comprehensive guidance for AI assistants (like Claude) working on the Airguard IoT monitoring and environmental tracking system. It explains codebase structure, development workflows, and key conventions to follow.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Structure](#codebase-structure)
4. [Development Workflow](#development-workflow)
5. [Key Conventions](#key-conventions)
6. [Authentication & Security](#authentication--security)
7. [Database Schema](#database-schema)
8. [API Architecture](#api-architecture)
9. [Component Patterns](#component-patterns)
10. [State Management](#state-management)
11. [Styling Guidelines](#styling-guidelines)
12. [Environment Configuration](#environment-configuration)
13. [Docker & Deployment](#docker--deployment)
14. [Common Tasks](#common-tasks)
15. [Important Notes](#important-notes)

---

## Project Overview

**Airguard Web Frontend** is a Next.js-based IoT monitoring and environmental tracking system designed for real-time device management and analytics.

### Key Features
- Real-time IoT device monitoring
- Multi-tenant architecture (organization-based)
- JWT-based authentication with httpOnly cookies
- Dashboard with live metrics and analytics
- Device management and simulation
- AI chat integration (OpenAI & Anthropic)
- Geospatial device tracking with Leaflet maps

### Current Version
- **Version**: 0.1.0
- **Node.js**: >=24.0.0 (Node.js 24 LTS)
- **Next.js**: 15.3.3
- **React**: 19.0.0

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.3 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Icons**: Lucide React
- **Charts**: Recharts
- **Maps**: React Leaflet
- **Animation**: Framer Motion

### Backend (Integrated via API Routes)
- **Runtime**: Node.js 24 LTS
- **API Routes**: Next.js App Router API routes
- **Database ORM**: Prisma 6.18.0
- **Database**: PostgreSQL (Digital Ocean)
- **Authentication**: JWT with bcryptjs
- **Validation**: Custom TypeScript interfaces

### Development Tools
- **Linting**: ESLint 9.x with Next.js config
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm 10+
- **Containerization**: Docker (multi-stage builds)

---

## Codebase Structure

```
airguard-frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Home page (redirects to signup)
│   │   ├── login/               # Login page
│   │   ├── signup/              # Signup page
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── home/           # Dashboard home
│   │   │   ├── manage/         # Device management
│   │   │   ├── setup/          # Device setup
│   │   │   ├── ai-chat/        # AI assistant
│   │   │   ├── design/         # Design system
│   │   │   ├── unlock/         # Achievements
│   │   │   └── api-test/       # API testing
│   │   └── api/                # API Routes
│   │       └── auth/           # Authentication endpoints
│   │           ├── login/
│   │           ├── signup/
│   │           ├── logout/
│   │           ├── profile/
│   │           └── refresh/
│   ├── components/              # React components
│   │   ├── common/             # Shared components
│   │   ├── login/              # Login-specific
│   │   ├── signup/             # Signup-specific
│   │   ├── dashboard/          # Dashboard components
│   │   └── sidebar/            # Navigation
│   ├── contexts/                # React Context providers
│   │   ├── LoadingContext.tsx  # Global loading state
│   │   └── ToastContext.tsx    # Toast notifications
│   ├── hooks/                   # Custom React hooks
│   │   ├── useLoginForm.ts
│   │   ├── useSignupForm.ts
│   │   ├── useNavigationWithLoading.ts
│   │   └── useAchievements*.ts
│   ├── services/                # API communication
│   │   └── api.ts              # API service singleton
│   ├── middleware.ts            # Route protection
│   └── styles/                  # Global styles
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/                      # Static assets
├── docs/                        # Documentation
├── Dockerfile                   # Production container
├── docker-compose.yml          # Development setup
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind configuration
├── .env.example                # Environment template
└── package.json                # Dependencies

```

### Key Directories

#### `/src/app`
- **Purpose**: Next.js 13+ App Router pages and API routes
- **Convention**: Each folder with `page.tsx` becomes a route
- **Layout**: `layout.tsx` files provide nested layouts

#### `/src/components`
- **Purpose**: Reusable React components
- **Organization**: Grouped by feature (login, signup, dashboard, common)
- **Pattern**: Each component in its own file, named with PascalCase

#### `/src/api`
- **Purpose**: Backend API communication layer
- **Pattern**: Singleton service class with typed methods

#### `/src/contexts`
- **Purpose**: React Context for global state
- **Current Contexts**: Loading state, Toast notifications

#### `/src/hooks`
- **Purpose**: Custom React hooks for reusable logic
- **Naming**: Prefix with `use*`

---

## Development Workflow

### Branching Strategy

**CRITICAL**: This project follows a strict branching workflow to protect the main codebase.

#### Branch Rules
- **`main` branch**: PROTECTED - Only update when explicitly instructed
- **`claude/testing-<session-id>` branch**: Default development branch for all work
- All changes must be developed and tested on the testing branch first
- Never push directly to main unless explicitly requested

#### Standard Workflow
```bash
# 1. Always work on the testing branch
git checkout claude/testing-<session-id>

# 2. Pull latest changes
git pull origin claude/testing-<session-id>

# 3. Make your changes and commit
git add .
git commit -m "Description of changes"

# 4. Push to testing branch
git push origin claude/testing-<session-id>

# 5. After local testing confirms success, changes can be merged to main
# (Only when explicitly approved by project owner)
```

#### Web-to-Local Workflow
When working on Claude Code web:
1. Complete a task/phase on the testing branch
2. Commit and push to `claude/testing-<session-id>`
3. Provide pull commands for local testing
4. User tests locally and reports results
5. Iterate or continue based on feedback

### Initial Setup

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Development Commands

```bash
# Development server (port 3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Prisma commands
npx prisma studio          # Database GUI
npx prisma generate        # Generate client
npx prisma migrate dev     # Create/apply migration
npx prisma db push         # Push schema without migration
```

### Docker Development

```bash
# Build production image
docker build -t airguard-frontend .

# Run container
docker run -p 3000:3000 --env-file .env airguard-frontend

# Docker Compose (if available)
docker-compose up
```

---

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `LoginForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLoginForm.ts`)
- **Services**: camelCase (e.g., `api.ts`)
- **Pages**: lowercase (e.g., `page.tsx`)
- **Types/Interfaces**: PascalCase (e.g., `LoginRequest`)

### Code Style
- **TypeScript**: Strict mode enabled
- **Imports**: Absolute imports using `@/*` alias
- **Comments**: JSDoc style for functions and complex logic
- **Error Handling**: Try-catch blocks with proper error messages

### Component Structure
```typescript
/**
 * Component description
 */
export default function ComponentName() {
  // Hooks at the top
  const [state, setState] = useState();

  // Event handlers
  const handleEvent = () => {
    // Implementation
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Service Pattern
```typescript
// Services use singleton pattern
class ApiService {
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Centralized request handling
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }
}

export const apiService = new ApiService();
```

---

## Authentication & Security

### Authentication Flow

1. **Cookie-Based Authentication**
   - Access tokens stored in httpOnly cookies (secure, not accessible via JavaScript)
   - Refresh tokens also in httpOnly cookies
   - No localStorage usage for tokens

2. **Token Lifecycle**
   - Access token: 15 minutes expiry
   - Refresh token: 7 days expiry
   - Auto-refresh handled by middleware

3. **Protected Routes**
   - Middleware at `src/middleware.ts` protects `/dashboard/*` routes
   - Unauthenticated users redirected to `/login`
   - Authenticated users on `/login` or `/signup` redirected to `/dashboard/home`

### Security Best Practices

```typescript
// ✅ CORRECT: Use credentials: 'include' for authenticated requests
const response = await fetch('/api/endpoint', {
  credentials: 'include',  // Sends cookies
  headers: { 'Content-Type': 'application/json' }
});

// ❌ WRONG: Don't access tokens in client-side code
// Tokens are httpOnly and not accessible

// ✅ CORRECT: Password hashing (server-side)
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ CORRECT: JWT signing (server-side)
import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
```

### Environment Variables (Security)

**CRITICAL**: Never commit `.env` or `.env.local` files!

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (min 32 chars)
- `JWT_ACCESS_EXPIRY`: Access token expiry (default: "15m")
- `JWT_REFRESH_EXPIRY`: Refresh token expiry (default: "7d")
- `COOKIE_SECURE`: Set to "true" in production
- `COOKIE_DOMAIN`: Domain for cookies (e.g., "yourdomain.com")

---

## Database Schema

### Key Models

#### User
```prisma
model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  passwordHash         String
  fullName             String
  country              String?
  phoneNumber          String?
  companyName          String?
  industry             String?
  businessType         String?
  organizationId       String?
  organization         Organization?
  sessions             UserSession[]
  settings             UserSettings?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

#### Organization
```prisma
model Organization {
  id              String   @id @default(cuid())
  name            String
  owner           User
  ownerId         String
  users           User[]
  devices         Device[]
  alerts          Alert[]
  achievements    Achievement[]
  networkHealth   NetworkHealth[]
}
```

#### Device
```prisma
model Device {
  id                  String   @id @default(cuid())
  name                String
  deviceType          String?
  latitude            Float?
  longitude           Float?
  status              String   @default("offline")
  batteryLevel        Int?
  organizationId      String
  organization        Organization
  metrics             DeviceMetric[]
  alerts              Alert[]
}
```

### Database Operations

```typescript
// ✅ CORRECT: Use Prisma client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create with relations
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    fullName: 'John Doe',
    organization: {
      create: { name: 'Acme Corp' }
    }
  },
  include: { organization: true }
});

// Query with filters
const devices = await prisma.device.findMany({
  where: { organizationId: orgId, status: 'online' },
  include: { metrics: true }
});
```

---

## API Architecture

### API Routes Structure

All API routes are in `/src/app/api/`:

```
/api/
├── auth/
│   ├── login/route.ts        # POST - User login
│   ├── signup/route.ts       # POST - User registration
│   ├── logout/route.ts       # POST - User logout
│   ├── profile/route.ts      # GET - Get user profile
│   └── refresh/route.ts      # POST - Refresh access token
```

### API Route Pattern

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT (implement auth middleware)
    const userId = await getUserFromRequest(request);

    // Query database
    const data = await prisma.model.findMany({
      where: { userId }
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }

    // Process request
    const result = await prisma.model.create({ data: body });

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Client-Side API Calls

```typescript
// ✅ CORRECT: Use the API service
import { apiService } from '@/services/api';

const handleLogin = async () => {
  try {
    const response = await apiService.login({ email, password });
    // Success
  } catch (error) {
    // Handle error
  }
};
```

---

## Component Patterns

### Page Components (App Router)

```typescript
// src/app/dashboard/home/page.tsx
export default function DashboardHomePage() {
  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

### Layout Components

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LoadingProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
```

### Reusable Components

```typescript
// src/components/dashboard/MetricCard.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export default function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {change !== undefined && (
        <div className={`mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
  );
}
```

### Form Components

```typescript
// Custom hook for form handling
export function useLoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { formData, errors, handleChange, validate };
}
```

---

## State Management

### Context Providers

#### Loading Context
```typescript
// src/contexts/LoadingContext.tsx
const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}>({ isLoading: false, setIsLoading: () => {} });

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && <LoadingScreen />}
    </LoadingContext.Provider>
  );
}
```

#### Toast Context
```typescript
// src/contexts/ToastContext.tsx
const ToastContext = createContext<{
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}
```

### Custom Hooks for State

```typescript
// src/hooks/useNavigationWithLoading.ts
export function useNavigationWithLoading() {
  const router = useRouter();
  const { setIsLoading } = useLoading();

  const navigateWithLoading = async (path: string) => {
    setIsLoading(true);
    await router.push(path);
    // Loading state cleared by page component
  };

  return { navigateWithLoading };
}
```

---

## Styling Guidelines

### Tailwind CSS Conventions

```typescript
// ✅ CORRECT: Use Tailwind utility classes
<div className="flex items-center justify-between rounded-lg bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
    Action
  </button>
</div>

// ✅ CORRECT: Conditional classes
<div className={`rounded-lg p-4 ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
  Content
</div>

// ✅ CORRECT: Responsive design
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Grid items */}
</div>
```

### Color Palette (Tailwind)
- **Primary**: Blue (`bg-blue-600`, `text-blue-600`)
- **Success**: Green (`bg-green-600`, `text-green-600`)
- **Warning**: Yellow (`bg-yellow-500`, `text-yellow-600`)
- **Error**: Red (`bg-red-600`, `text-red-600`)
- **Neutral**: Gray (`bg-gray-100`, `text-gray-900`)

### Animation with Framer Motion

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Environment Configuration

### Environment Files
- `.env.example`: Template with all required variables
- `.env.local`: Local development (gitignored)
- `.env`: Production (gitignored, never commit!)

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:25060/dbname?sslmode=require"

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Cookies
COOKIE_SECURE="false"  # Set to "true" in production
COOKIE_DOMAIN="localhost"
```

### Accessing Environment Variables

```typescript
// ✅ CORRECT: Server-side (API routes, server components)
const secret = process.env.JWT_SECRET;

// ✅ CORRECT: Client-side (must be prefixed with NEXT_PUBLIC_)
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// ❌ WRONG: Accessing non-public env vars on client
// const secret = process.env.JWT_SECRET; // undefined on client!
```

---

## Docker & Deployment

### Dockerfile Structure

The project uses a **multi-stage Docker build**:

1. **deps**: Install dependencies
2. **builder**: Build Next.js app and generate Prisma client
3. **runner**: Production runtime (minimal footprint)

### Docker Build

```bash
# Build image
docker build -t airguard-frontend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  airguard-frontend
```

### Next.js Configuration for Docker

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',  // Required for Docker
  // ... other config
};
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `COOKIE_SECURE=true`
- [ ] Use strong JWT secrets (32+ chars)
- [ ] Configure `COOKIE_DOMAIN` to your domain
- [ ] Enable SSL/HTTPS
- [ ] Run database migrations
- [ ] Generate Prisma client
- [ ] Test authentication flow
- [ ] Enable error logging

---

## Common Tasks

### Adding a New Page

```bash
# 1. Create page directory
mkdir -p src/app/dashboard/new-page

# 2. Create page.tsx
# src/app/dashboard/new-page/page.tsx
export default function NewPage() {
  return <div>New Page Content</div>;
}

# 3. Add to navigation (if needed)
# Update sidebar component
```

### Adding a New API Route

```bash
# 1. Create route directory
mkdir -p src/app/api/new-endpoint

# 2. Create route.ts
# src/app/api/new-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello' });
}
```

### Adding a New Component

```bash
# 1. Create component file
# src/components/dashboard/NewComponent.tsx
interface NewComponentProps {
  title: string;
}

export default function NewComponent({ title }: NewComponentProps) {
  return <div>{title}</div>;
}

# 2. Import and use
import NewComponent from '@/components/dashboard/NewComponent';
```

### Adding a Database Model

```bash
# 1. Update prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())

  @@map("new_models")
}

# 2. Create migration
npx prisma migrate dev --name add_new_model

# 3. Generate client
npx prisma generate
```

### Running Database Migrations

```bash
# Development (creates migration files)
npx prisma migrate dev --name migration_description

# Production (applies existing migrations)
npx prisma migrate deploy

# Reset database (DEV ONLY!)
npx prisma migrate reset

# View database in GUI
npx prisma studio
```

---

## Important Notes

### For AI Assistants

1. **Always Use TypeScript**
   - Provide type annotations for all functions and variables
   - Use interfaces for component props
   - Avoid `any` type unless absolutely necessary

2. **Follow Next.js App Router Conventions**
   - Use Server Components by default
   - Add `'use client'` directive only when needed (useState, useEffect, etc.)
   - Use async/await in Server Components for data fetching

3. **Authentication Handling**
   - Never store tokens in localStorage or sessionStorage
   - Always use `credentials: 'include'` in fetch calls
   - Check middleware.ts for protected route patterns

4. **Error Handling**
   - Always wrap async operations in try-catch
   - Return proper HTTP status codes (200, 201, 400, 401, 404, 500)
   - Provide user-friendly error messages

5. **Code Organization**
   - Keep components small and focused
   - Extract reusable logic into custom hooks
   - Use the API service for all backend communication
   - Group related components in feature directories

6. **Database Operations**
   - Always use Prisma client
   - Include proper relations in queries
   - Use transactions for multi-step operations
   - Handle unique constraint violations

7. **Security First**
   - Validate all user inputs
   - Sanitize data before database operations
   - Use environment variables for secrets
   - Hash passwords with bcryptjs (rounds: 10)

8. **Build Warnings**
   - TypeScript and ESLint errors are ignored during builds (next.config.ts)
   - This is for development speed - fix type errors when possible
   - Don't introduce new type errors unnecessarily

9. **Styling Best Practices**
   - Use Tailwind utility classes
   - Follow responsive-first design (mobile → tablet → desktop)
   - Keep animations subtle (duration: 0.2-0.3s)
   - Use consistent spacing (p-4, p-6, p-8)

10. **Testing Considerations**
    - Test API endpoints with proper authentication
    - Verify database migrations before deploying
    - Test responsive layouts on multiple screen sizes
    - Validate form inputs on client and server

### Common Pitfalls to Avoid

❌ **Don't**:
- Store JWT tokens in localStorage
- Use `any` type excessively
- Commit `.env` files
- Hardcode sensitive data
- Ignore TypeScript errors
- Create God components (keep them focused)
- Forget to validate user inputs
- Mix server and client component patterns incorrectly

✅ **Do**:
- Use httpOnly cookies for auth
- Provide proper types
- Use `.env.example` as template
- Use environment variables
- Fix errors when reasonable
- Break down complex components
- Validate on both client and server
- Understand when to use `'use client'` directive

---

## Additional Resources

### Documentation
- [Project Documentation](docs/README.md)
- [Frontend Docs](docs/frontend/README.md)
- [Backend Docs](docs/backend/README.md)
- [API Docs](docs/api/README.md)
- [Database Docs](docs/database/README.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for recent changes and updates.

---

**Last Updated**: 2025-11-15
**Maintainers**: Wirestorm Software
**AI Assistant**: Claude (Anthropic)

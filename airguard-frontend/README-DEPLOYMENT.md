# Airguard Frontend - Deployment Guide

Frontend application for Airguard IoT monitoring and environmental tracking system.

## 🏗️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Build the image
docker build -t airguard-frontend .

# Run the container
docker run -p 3000:3000 --env-file .env airguard-frontend

# Or use docker-compose
docker-compose up -d
```

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations (if needed)
npx prisma migrate deploy

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/airguard_db"

# JWT Configuration
JWT_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Cookies
COOKIE_SECURE="false"  # Set to "true" in production with HTTPS
COOKIE_DOMAIN="localhost"
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Database

The frontend includes Prisma for database operations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npx prisma studio
```

## 📱 Features

### Authentication
- User signup with business info
- Login with JWT tokens
- Protected routes via middleware
- Token refresh mechanism
- Secure cookie management

### Dashboard
- **Home**: Metrics overview with charts
- **Map View**: Interactive device map with real-time data
- **Device Management**: Add, edit, remove devices
- **AI Chat**: Interactive AI assistance
- **Settings**: User preferences and API keys
- **Alerts**: Real-time notifications

### Components
- Responsive sidebar navigation
- Real-time data visualization
- Interactive maps with device markers
- Toast notifications
- Loading states and skeletons
- Modal dialogs

## 🎨 Styling

Built with Tailwind CSS 4:

```bash
# Configuration
- tailwind.config.js
- postcss.config.mjs

# Global styles
- src/app/globals.css
```

### Color Scheme
Custom color variables defined in `globals.css`:
- Primary colors (slate, blue)
- Chart colors
- Alert colors
- Status colors

## 🐳 Docker

### Dockerfile Features

- **Multi-stage build** for optimized image size
- **Standalone output** for minimal runtime dependencies
- **Prisma client** included in image
- **Non-root user** for security
- **Production-ready** configuration

### Building

```bash
# Build image
docker build -t airguard-frontend:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  airguard-frontend:latest
```

### Docker Compose

```yaml
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
```

## 🧪 Testing

```bash
# Run tests (if available)
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 🚀 Build & Deploy

### Development Build

```bash
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Static Export (Optional)

If you need static HTML export:

```typescript
// next.config.ts
const nextConfig = {
  output: 'export', // For static export
  // OR
  output: 'standalone', // For Docker (current config)
};
```

## 🔐 Security Features

### Authentication
- JWT-based authentication
- Secure HTTP-only cookies
- Token refresh mechanism
- Protected API routes
- Middleware-based route protection

### Security Headers
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

### Production Checklist
- [ ] Set `COOKIE_SECURE=true`
- [ ] Enable HTTPS
- [ ] Use strong JWT secrets
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Validate all user inputs
- [ ] Sanitize database queries

## 📊 Performance Optimization

### Next.js Features
- **Server Components**: Reduced client-side JavaScript
- **Standalone Output**: Minimal runtime dependencies
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Static Generation**: Pre-rendered pages where possible

### Performance Tips
```typescript
// Dynamic imports for heavy components
const MapComponent = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── common/           # Shared components
│   ├── dashboard/        # Dashboard components
│   ├── login/           # Login components
│   └── sidebar/         # Sidebar components
├── contexts/             # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities and helpers
├── services/            # API services
├── styles/              # CSS files
└── types/               # TypeScript types
```

## 🗺️ Routes

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/signup` - User registration

### Protected Routes (require authentication)
- `/dashboard/home` - Dashboard overview
- `/dashboard/manage` - Device management
- `/dashboard/ai-chat` - AI assistant
- `/dashboard/setup` - Initial setup
- `/dashboard/unlock` - Feature unlock

### API Routes
- `/api/auth/login` - User authentication
- `/api/auth/signup` - User registration
- `/api/auth/logout` - User logout
- `/api/auth/refresh` - Token refresh
- `/api/auth/profile` - User profile

## 🐛 Troubleshooting

### Common Issues

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Prisma errors:**
```bash
# Regenerate Prisma client
npx prisma generate

# Check database connection
npx prisma db pull
```

**Port already in use:**
```bash
# Use a different port
PORT=3001 npm run dev
```

**Hydration errors:**
- Check for mismatched HTML between server and client
- Ensure localStorage/sessionStorage access is client-only
- Use `useEffect` for client-side only code

## 🚢 Production Deployment

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker Deployment

```bash
# Build image
docker build -t airguard-frontend:v1.0.0 .

# Tag for registry
docker tag airguard-frontend:v1.0.0 your-registry.com/airguard-frontend:v1.0.0

# Push to registry
docker push your-registry.com/airguard-frontend:v1.0.0

# Deploy to your container platform
# (AWS ECS, Google Cloud Run, Azure Container Apps, etc.)
```

### Environment-Specific Config

**Development:**
```bash
NODE_ENV=development
COOKIE_SECURE=false
NEXT_TELEMETRY_DISABLED=1
```

**Production:**
```bash
NODE_ENV=production
COOKIE_SECURE=true
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Leaflet Documentation](https://leafletjs.com/)

## 📄 License

MIT License

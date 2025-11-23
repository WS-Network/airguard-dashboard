# Frontend Documentation

## 🎯 Overview

The Airguard frontend is built with **Next.js 15.3.3** using the App Router architecture, **React 19.0.0**, and **TypeScript 5.x**. The application provides a modern, responsive dashboard for IoT device monitoring and management.

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Dashboard routes
│   │   ├── home/                # Main dashboard page
│   │   │   └── page.tsx         # Dashboard home component
│   │   ├── devices/             # Device management (planned)
│   │   ├── manage/              # Settings and configuration
│   │   └── api-test/            # API testing interface
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Landing page (redirects to dashboard)
│   └── globals.css              # Global styles and Tailwind imports
├── components/                   # Reusable React components
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── DeviceMap.tsx        # Device location mapping
│   │   ├── MetricsInfoModal.tsx # Metrics information modal
│   │   └── SettingsPanel.tsx    # User settings panel
│   ├── ui/                      # Generic UI components
│   └── forms/                    # Form components
├── services/                     # API and external services
│   └── api.ts                   # API service layer
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
└── assets/                       # Static assets (SVG, images)
```

## 🎨 UI Framework & Styling

### Tailwind CSS 4.x
The application uses Tailwind CSS for utility-first styling with custom design tokens:

```css
@theme {
  --color-ag-purple: #7b8ae7;
  --color-ag-blue: #519691;
  --color-ag-gray: #a0a1b3;
  --color-ag-dark-gray: #4b4d59;
  --color-ag-black: #202020;
  --color-ag-white: #ffffff;
}
```

### Design System
- **Color Palette**: Airguard brand colors with semantic variations
- **Typography**: Outfit font family with proper hierarchy
- **Spacing**: Consistent spacing scale using Tailwind utilities
- **Components**: Reusable UI patterns and layouts

## 🧩 Component Architecture

### Component Categories

#### 1. **Page Components** (`app/` directory)
- **Layout Components**: Define page structure and navigation
- **Page Components**: Main content for each route
- **Loading States**: Suspense boundaries and loading UI

#### 2. **Dashboard Components** (`components/dashboard/`)
- **DeviceMap**: Interactive device location visualization
- **MetricsInfoModal**: Detailed metrics information display
- **SettingsPanel**: User preferences and API key management

#### 3. **UI Components** (`components/ui/`)
- **Generic Components**: Buttons, inputs, modals, etc.
- **Layout Components**: Containers, grids, cards, etc.
- **Feedback Components**: Alerts, notifications, progress bars

### Component Patterns

#### Container/Presentational Pattern
```typescript
// Container component (logic)
const DashboardContainer = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return <Dashboard data={data} loading={loading} />;
};

// Presentational component (UI)
const Dashboard = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;
  return <div>{/* Dashboard UI */}</div>;
};
```

#### Custom Hooks Pattern
```typescript
const useDeviceData = (deviceId: string) => {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch device data
  }, [deviceId]);

  return { device, loading };
};
```

## 📱 Pages & Routing

### App Router Structure

#### 1. **Root Layout** (`app/layout.tsx`)
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Features:**
- Google Fonts integration (Outfit)
- Global CSS imports
- Metadata configuration
- Responsive design setup

#### 2. **Dashboard Home** (`app/dashboard/home/page.tsx`)
```typescript
export default function Homepage() {
  return (
    <div className="w-full min-h-svh flex justify-center items-center">
      <h1 className="text-5xl font-bold">Airguard Control Center</h1>
    </div>
  );
}
```

**Features:**
- Full-screen layout
- Responsive typography
- Centered content alignment

#### 3. **API Test Page** (`app/dashboard/api-test/page.tsx`)
**Features:**
- Interactive API testing interface
- Real-time request/response display
- Authentication testing
- Backend connectivity verification

## 🔌 API Integration

### API Service Layer (`services/api.ts`)

#### Service Architecture
```typescript
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // HTTP request implementation
  }
}
```

#### Available Methods

**Authentication:**
- `login(credentials)`: User authentication
- `signup(userData)`: User registration
- `getProfile(token)`: Fetch user profile
- `refreshToken(refreshToken)`: Token refresh
- `logout(token)`: User logout

**Device Management:**
- `getDevices(token)`: Fetch device list
- `createDevice(token, deviceData)`: Create new device
- `startSimulation(token, intervalMs)`: Start device simulation
- `stopSimulation()`: Stop device simulation

**Settings:**
- `getUserSettings()`: Fetch user preferences
- `updateUserSettings(settings)`: Update user settings
- `testApiKey(keyType)`: Test external API keys
- `deleteApiKey(keyType)`: Remove API keys

### Token Management
```typescript
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem('accessToken', token);
  },
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};
```

## 🎭 State Management

### Local State
- **useState**: Component-level state management
- **useEffect**: Side effects and data fetching
- **useCallback**: Memoized function references
- **useMemo**: Computed value memoization

### Global State
- **Context API**: Theme, authentication, user preferences
- **Local Storage**: Persistent user data and tokens
- **URL State**: Route parameters and query strings

### Data Flow
```
User Action → Component State → API Call → Response → UI Update
     ↓              ↓              ↓         ↓         ↓
  Button Click → Loading State → HTTP → Success → Data Display
```

## 🎨 Styling & Theming

### CSS Architecture
```css
/* Global styles */
@import "tailwindcss";

@layer base {
  html {
    @apply bg-ag-white tracking-widest;
  }
}

/* Component-specific styles */
@layer components {
  .btn-primary {
    @apply bg-ag-purple text-white px-4 py-2 rounded;
  }
}
```

### Responsive Design
- **Mobile-first approach**: Base styles for mobile devices
- **Breakpoint system**: Tailwind's responsive utilities
- **Flexible layouts**: CSS Grid and Flexbox for adaptive layouts
- **Touch-friendly**: Proper touch targets and interactions

### Dark Mode Support
- **CSS Variables**: Theme-aware color definitions
- **System preference**: Automatic theme detection
- **User preference**: Manual theme switching
- **Persistent storage**: Theme choice persistence

## 🔧 Development Tools

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ESLint Configuration
- **Next.js rules**: Framework-specific linting
- **TypeScript rules**: Type-aware code quality
- **React rules**: Component best practices
- **Accessibility rules**: A11y compliance

### Build Configuration
- **Turbopack**: Fast development bundling
- **TypeScript compilation**: Strict type checking
- **CSS optimization**: Tailwind purging and minification
- **Asset optimization**: Image and font optimization

## 📱 Responsive Design

### Breakpoint Strategy
```css
/* Mobile first approach */
.container {
  @apply px-4; /* Base mobile padding */
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    @apply px-6;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    @apply px-8;
  }
}
```

### Component Responsiveness
- **Flexible grids**: CSS Grid with auto-fit columns
- **Adaptive navigation**: Mobile hamburger menu
- **Responsive typography**: Fluid font sizes
- **Touch interactions**: Mobile-optimized controls

## 🧪 Testing Strategy

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **MSW**: API mocking and testing
- **Playwright**: E2E testing

### Testing Patterns
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Airguard Control Center')).toBeInTheDocument();
  });
});
```

## 🚀 Performance Optimization

### Code Splitting
- **Route-based splitting**: Automatic page-level code splitting
- **Component lazy loading**: Dynamic imports for heavy components
- **Bundle analysis**: Webpack bundle analyzer integration

### Image Optimization
- **Next.js Image**: Automatic image optimization
- **WebP format**: Modern image format support
- **Responsive images**: Multiple size variants
- **Lazy loading**: Intersection Observer integration

### Caching Strategy
- **Static generation**: Pre-rendered pages
- **Incremental Static Regeneration**: Dynamic content updates
- **Service Worker**: Offline functionality
- **CDN integration**: Global content distribution

## 🔍 SEO & Accessibility

### SEO Features
- **Metadata management**: Dynamic meta tags
- **Structured data**: JSON-LD schema markup
- **Sitemap generation**: Automatic sitemap creation
- **Open Graph**: Social media optimization

### Accessibility
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Full keyboard accessibility
- **Color contrast**: WCAG compliance
- **Focus management**: Proper focus indicators

## 📚 Component Library

### Available Components

#### 1. **DeviceMap Component**
- Interactive device location visualization
- Real-time status updates
- Geographic data integration
- Responsive map controls

#### 2. **MetricsInfoModal Component**
- Detailed metrics information display
- Chart and graph integration
- Historical data comparison
- Export functionality

#### 3. **SettingsPanel Component**
- User preferences management
- API key configuration
- Theme customization
- Notification settings

## 🎯 Best Practices

### Code Organization
- **Feature-based structure**: Group related components
- **Consistent naming**: Clear, descriptive names
- **Separation of concerns**: Logic vs. presentation
- **Reusable patterns**: Common component patterns

### Performance
- **Memoization**: Prevent unnecessary re-renders
- **Lazy loading**: Load components on demand
- **Bundle optimization**: Minimize bundle size
- **Image optimization**: Efficient image handling

### Accessibility
- **Semantic HTML**: Proper HTML structure
- **ARIA attributes**: Screen reader support
- **Keyboard navigation**: Full keyboard access
- **Color contrast**: Readable text colors

---

*This frontend architecture provides a solid foundation for building modern, responsive IoT monitoring dashboards.*

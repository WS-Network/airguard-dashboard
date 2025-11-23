# API Reference

## 🎯 Overview

The Airguard API provides a comprehensive RESTful interface for IoT device management, user authentication, and real-time monitoring. All endpoints return JSON responses and use standard HTTP status codes.

## 🔐 Authentication

### JWT Token Authentication

Most API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your-access-token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal

### Authentication Flow

```
1. POST /api/auth/login → Receive access + refresh tokens
2. Use access token for API requests
3. When access token expires → POST /api/auth/refresh
4. Continue with new access token
```

## 📡 Base URL

```
Development: http://localhost:3001
Production: https://api.airguard.com
```

## 🚀 API Endpoints

### Authentication Endpoints

#### 1. User Registration

```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "country": "United States",
  "phoneNumber": "+1-555-0123",
  "nonGovernmentEndUser": false,
  "companyName": "Tech Corp",
  "industry": "Technology",
  "businessType": "Corporation",
  "hearAboutUs": "Search Engine",
  "acceptTerms": true,
  "newsPromotions": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "email": "user@example.com",
      "fullName": "John Doe"
    }
  },
  "message": "User created successfully"
}
```

#### 2. User Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "email": "user@example.com",
      "fullName": "John Doe"
    }
  },
  "message": "Login successful"
}
```

#### 3. Token Refresh

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "email": "user@example.com",
      "fullName": "John Doe"
    }
  },
  "message": "Token refreshed successfully"
}
```

#### 4. Get User Profile

```http
GET /api/auth/profile
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "fullName": "John Doe",
    "country": "United States",
    "phoneNumber": "+1-555-0123",
    "companyName": "Tech Corp",
    "industry": "Technology",
    "businessType": "Corporation",
    "organization": {
      "id": "org1234567890",
      "name": "Tech Corp"
    }
  },
  "message": "Profile retrieved successfully"
}
```

#### 5. User Logout

```http
POST /api/auth/logout
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Device Management Endpoints

#### 1. Get All Devices

```http
GET /api/devices
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dev1234567890",
      "name": "Air Quality Sensor 1",
      "deviceType": "air-quality",
      "firmwareVersion": "1.2.3",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "locationDescription": "Downtown Office",
      "status": "online",
      "batteryLevel": 85,
      "lastSeen": "2024-12-20T10:30:00Z",
      "createdAt": "2024-12-01T00:00:00Z",
      "updatedAt": "2024-12-20T10:30:00Z",
      "metrics": [
        {
          "id": "met1234567890",
          "metricType": "air-quality",
          "value": 45.2,
          "unit": "AQI",
          "timestamp": "2024-12-20T10:30:00Z"
        }
      ]
    }
  ],
  "message": "Devices retrieved successfully"
}
```

#### 2. Create New Device

```http
POST /api/devices
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "name": "New Air Quality Sensor",
  "deviceType": "air-quality",
  "firmwareVersion": "1.0.0",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "locationDescription": "Times Square"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "dev1234567891",
    "name": "New Air Quality Sensor",
    "deviceType": "air-quality",
    "firmwareVersion": "1.0.0",
    "latitude": 40.7589,
    "longitude": -73.9851,
    "locationDescription": "Times Square",
    "status": "offline",
    "createdAt": "2024-12-20T10:35:00Z",
    "updatedAt": "2024-12-20T10:35:00Z"
  },
  "message": "Device created successfully"
}
```

#### 3. Get Device by ID

```http
GET /api/devices/{deviceId}
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "dev1234567890",
    "name": "Air Quality Sensor 1",
    "deviceType": "air-quality",
    "firmwareVersion": "1.2.3",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "locationDescription": "Downtown Office",
    "status": "online",
    "batteryLevel": 85,
    "lastSeen": "2024-12-20T10:30:00Z",
    "createdAt": "2024-12-01T00:00:00Z",
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Device retrieved successfully"
}
```

#### 4. Update Device

```http
PUT /api/devices/{deviceId}
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "name": "Updated Device Name",
  "locationDescription": "New Location Description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "dev1234567890",
    "name": "Updated Device Name",
    "locationDescription": "New Location Description",
    "updatedAt": "2024-12-20T10:40:00Z"
  },
  "message": "Device updated successfully"
}
```

#### 5. Delete Device

```http
DELETE /api/devices/{deviceId}
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```

### Device Metrics Endpoints

#### 1. Send Device Metrics

```http
POST /api/devices/{deviceId}/metrics
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "metricType": "air-quality",
  "value": 42.5,
  "unit": "AQI"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "met1234567891",
    "metricType": "air-quality",
    "value": 42.5,
    "unit": "AQI",
    "timestamp": "2024-12-20T10:45:00Z",
    "deviceId": "dev1234567890"
  },
  "message": "Metrics sent successfully"
}
```

#### 2. Get Device Metrics

```http
GET /api/devices/{deviceId}/metrics
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `limit`: Number of metrics to return (default: 100)
- `offset`: Number of metrics to skip (default: 0)
- `type`: Filter by metric type
- `startDate`: Start date for filtering (ISO 8601)
- `endDate`: End date for filtering (ISO 8601)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "met1234567890",
        "metricType": "air-quality",
        "value": 45.2,
        "unit": "AQI",
        "timestamp": "2024-12-20T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 100,
      "offset": 0,
      "hasMore": true
    }
  },
  "message": "Metrics retrieved successfully"
}
```

#### 3. Get Device Statistics

```http
GET /api/devices/stats
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalDevices": 15,
    "onlineDevices": 12,
    "offlineDevices": 3,
    "averageBatteryLevel": 78.5,
    "totalMetrics": 15420,
    "metricsToday": 1250
  },
  "message": "Statistics retrieved successfully"
}
```

#### 4. Get Device Locations

```http
GET /api/devices/locations
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "dev1234567890",
      "name": "Air Quality Sensor 1",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "status": "online",
      "lastSeen": "2024-12-20T10:30:00Z"
    }
  ],
  "message": "Device locations retrieved successfully"
}
```

### Settings Endpoints

#### 1. Get User Settings

```http
GET /api/settings
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "set1234567890",
    "userId": "clx1234567890",
    "theme": "light",
    "notifications": {
      "email": true,
      "push": false,
      "sms": false
    },
    "apiKeys": {
      "openai": "sk-...",
      "anthropic": "sk-ant-..."
    },
    "preferences": {
      "timezone": "America/New_York",
      "language": "en",
      "dateFormat": "MM/DD/YYYY"
    },
    "createdAt": "2024-12-01T00:00:00Z",
    "updatedAt": "2024-12-20T10:30:00Z"
  },
  "message": "Settings retrieved successfully"
}
```

#### 2. Update User Settings

```http
PUT /api/settings
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  },
  "preferences": {
    "timezone": "America/Los_Angeles",
    "language": "en",
    "dateFormat": "DD/MM/YYYY"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "set1234567890",
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "preferences": {
      "timezone": "America/Los_Angeles",
      "language": "en",
      "dateFormat": "DD/MM/YYYY"
    },
    "updatedAt": "2024-12-20T10:50:00Z"
  },
  "message": "Settings updated successfully"
}
```

#### 3. Test API Key

```http
POST /api/settings/test-key/{keyType}
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Path Parameters:**
- `keyType`: Either `openai` or `anthropic`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "API key is valid and working"
  },
  "message": "API key test completed"
}
```

#### 4. Delete API Key

```http
DELETE /api/settings/delete-key/{keyType}
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Path Parameters:**
- `keyType`: Either `openai` or `anthropic`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

### Simulation Endpoints

#### 1. Start Device Simulation

```http
POST /api/simulation/start
```

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "intervalMs": 30000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "started",
    "intervalMs": 30000,
    "startedAt": "2024-12-20T10:55:00Z"
  },
  "message": "Device simulation started"
}
```

#### 2. Stop Device Simulation

```http
POST /api/simulation/stop
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "stopped",
    "stoppedAt": "2024-12-20T11:00:00Z"
  },
  "message": "Device simulation stopped"
}
```

### Health Check Endpoint

#### 1. API Health Status

```http
GET /health
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Airguard Backend API is running",
  "timestamp": "2024-12-20T11:00:00Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "errors": {
    "field": "Field-specific error message"
  }
}
```

## 🔢 HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 🚦 Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information included in response headers

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## 🔒 Security

### CORS Configuration
- **Origin**: Configurable via environment variables
- **Credentials**: Supported for authenticated requests
- **Methods**: GET, POST, PUT, DELETE, OPTIONS

### Security Headers
- **Helmet**: Comprehensive security middleware
- **HSTS**: HTTP Strict Transport Security
- **CSP**: Content Security Policy
- **XSS Protection**: Cross-site scripting protection

## 📡 WebSocket Events

### Connection Events
```typescript
// Join organization room
socket.emit('join:organization', organizationId);

// Leave organization room
socket.emit('leave:organization', organizationId);
```

### Real-time Updates
```typescript
// Device status update
socket.on('device:status', (data) => {
  console.log('Device status:', data);
});

// Metrics update
socket.on('metrics:update', (data) => {
  console.log('New metrics:', data);
});

// Alert notification
socket.on('alert:new', (data) => {
  console.log('New alert:', data);
});
```

## 🧪 Testing

### API Testing Tools
- **HTTP Files**: Use the provided `test-api.http` file
- **cURL Scripts**: Use the provided `test-curl.sh` script
- **Postman**: Import the API collection
- **Insomnia**: REST client for testing

### Test Environment
```bash
# Start backend server
cd backend
npm run dev

# Test endpoints
curl -X GET http://localhost:3001/health
```

## 📚 SDK Examples

### JavaScript/TypeScript
```typescript
import { apiService } from './services/api';

// Login user
const response = await apiService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get devices
const devices = await apiService.getDevices(response.data.accessToken);
```

### Python
```python
import requests

# Login
response = requests.post('http://localhost:3001/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})

token = response.json()['data']['accessToken']

# Get devices
headers = {'Authorization': f'Bearer {token}'}
devices = requests.get('http://localhost:3001/api/devices', headers=headers)
```

---

*This API provides a comprehensive interface for building IoT monitoring applications with Airguard.*

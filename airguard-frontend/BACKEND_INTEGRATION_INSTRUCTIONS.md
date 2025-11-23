# Backend Integration Instructions for Device Setup Flow

## Overview
This document provides instructions for the backend agent to integrate the device setup flow with the database and create necessary API endpoints.

## Database Schema Updates Needed

### 1. Device Table Enhancements
The `Device` model needs to support the full setup flow with all configuration options:

```prisma
model Device {
  id                  String   @id @default(cuid())
  name                String
  deviceType          String   // 'airguard', 'access_point', 'router', etc.
  manufacturer        String?
  firmwareVersion     String?

  // Location data
  latitude            Float?
  longitude           Float?
  locationDescription String?
  altitude            Float?     // From GPS data
  gpsAccuracy         Float?     // GPS accuracy in meters
  heading             Float?     // Device heading/orientation

  // Network configuration
  ipAddress           String?
  macAddress          String?
  subnetMask          String?
  gateway             String?
  dns1                String?
  dns2                String?
  openPorts           String?    // Comma-separated list
  sshPort             String?

  // Wireless configuration
  ssid                String?
  password            String?    // Should be encrypted
  channel             String?
  bandwidth           String?
  securityType        String?

  // Status and management
  status              String   @default("offline") // "healthy" | "warning" | "critical" | "offline"
  batteryLevel        Int?
  lastSeen            DateTime?

  // Relationships
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])

  // Managed devices (for Airguard devices only)
  managedBy           String?    // ID of parent Airguard device
  parentDevice        Device?    @relation("ManagedDevices", fields: [managedBy], references: [id])
  managedDevices      Device[]   @relation("ManagedDevices")

  // SSH Configuration
  sshUsername         String?    // Should be encrypted
  sshPasswordHash     String?    // Hashed SSH password
  sshConfigured       Boolean    @default(false)
  gpsConfigured       Boolean    @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("devices")
}
```

### 2. GPS Data Logs (Optional - for audit trail)
Create a separate table to log GPS synchronization events:

```prisma
model GpsLog {
  id                String   @id @default(cuid())
  deviceId          String
  device            Device   @relation(fields: [deviceId], references: [id])

  latitude          Float
  longitude         Float
  altitude          Float
  accuracy          Float
  heading           Float

  syncMethod        String   // "dongle", "manual", "api"
  timestamp         DateTime @default(now())

  @@map("gps_logs")
}
```

### 3. Device Configuration Templates (Future Enhancement)
```prisma
model DeviceTemplate {
  id                String   @id @default(cuid())
  name              String
  deviceType        String
  config            Json     // Store all configuration as JSON

  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("device_templates")
}
```

## API Endpoints to Create

### 1. Device Setup Endpoints

#### POST /api/devices/setup
Create a new device with full configuration from the setup flow:

**Request Body:**
```typescript
{
  // Step 1: Device Type & Basic Info
  name: string;
  deviceType: string;
  firmwareVersion?: string;

  // Step 2: Location
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  altitude?: number;
  gpsAccuracy?: number;
  heading?: number;

  // Step 3: Wireless Config
  ssid?: string;
  password?: string;
  channel?: string;
  bandwidth?: string;
  securityType?: string;

  // Step 4: Network Config
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  dns1?: string;
  dns2?: string;

  // Step 5: Managed Devices
  managedDeviceIds?: string[];

  // Organization context
  organizationId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  device: {
    id: string;
    name: string;
    deviceType: string;
    status: string;
    // ... all other fields
  };
  managedDevices?: Array<{
    id: string;
    name: string;
    configured: boolean;
  }>;
}
```

**Implementation Notes:**
- Encrypt sensitive data (WiFi passwords, SSH passwords)
- Validate all coordinates (latitude: -90 to 90, longitude: -180 to 180)
- Hash SSH passwords using bcrypt
- Create relationships between Airguard device and managed devices
- Set initial status to "offline" until device comes online

### 2. GPS Synchronization Endpoint

#### POST /api/devices/:deviceId/gps-sync
Update device location from GPS dongle data:

**Request Body:**
```typescript
{
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  timestamp: string;  // ISO 8601 format
  syncMethod: "dongle" | "manual" | "api";
}
```

**Response:**
```typescript
{
  success: boolean;
  device: {
    id: string;
    latitude: number;
    longitude: number;
    altitude: number;
    gpsConfigured: boolean;
  };
  logId?: string;  // ID of GPS log entry
}
```

**Implementation Notes:**
- Create GPS log entry for audit trail
- Update device's gpsConfigured flag to true
- Validate GPS data accuracy threshold (e.g., reject if accuracy > 50m)
- Return error if accuracy is too low

### 3. SSH Configuration Endpoint

#### POST /api/devices/:deviceId/ssh-config
Configure SSH access for a managed device:

**Request Body:**
```typescript
{
  username: string;
  password: string;
  sshPort?: string;  // Default: "22"
}
```

**Response:**
```typescript
{
  success: boolean;
  device: {
    id: string;
    sshUsername: string;  // Encrypted
    sshConfigured: boolean;
    sshPort: string;
  };
  connectionTest?: {
    success: boolean;
    message: string;
  };
}
```

**Implementation Notes:**
- Encrypt SSH username and hash password
- Store SSH port (default "22")
- Optionally test SSH connection (timeout: 5s)
- Set sshConfigured flag to true
- Never return passwords in response

### 4. Address Lookup (Reverse Geocoding)

#### GET /api/location/reverse-geocode
Get human-readable address from coordinates:

**Query Parameters:**
```
lat: number
lon: number
```

**Response:**
```typescript
{
  success: boolean;
  address: {
    displayName: string;
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
}
```

**Implementation Notes:**
- Integrate with OpenStreetMap Nominatim API
- Cache results for 24 hours to reduce API calls
- Add rate limiting (max 1 request/second per user)

### 5. Managed Devices Endpoints

#### GET /api/devices/:deviceId/managed
Get all devices managed by an Airguard device:

**Response:**
```typescript
{
  success: boolean;
  managedDevices: Array<{
    id: string;
    name: string;
    ip: string;
    manufacturer: string;
    status: string;
    sshConfigured: boolean;
    gpsConfigured: boolean;
    lastSeen?: string;
  }>;
}
```

#### POST /api/devices/:deviceId/add-managed
Add a device to be managed by an Airguard device:

**Request Body:**
```typescript
{
  managedDeviceId: string;
  sshConfig?: {
    username: string;
    password: string;
  };
  gpsData?: {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
    heading: number;
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  device: {
    id: string;
    name: string;
    managedBy: string;
    sshConfigured: boolean;
    gpsConfigured: boolean;
  };
}
```

### 6. Device Templates (Future Enhancement)

#### POST /api/devices/templates
Save current device configuration as a template:

**Request Body:**
```typescript
{
  name: string;
  deviceType: string;
  config: {
    // All configuration fields from the device
  };
}
```

#### GET /api/devices/templates
Get all device templates for the organization

#### POST /api/devices/from-template/:templateId
Create a new device from a saved template

## Security Considerations

### 1. Data Encryption
```typescript
// Example encryption for sensitive fields
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DEVICE_ENCRYPTION_KEY; // Must be 32 bytes
const IV_LENGTH = 16;

export function encryptField(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptField(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### 2. Password Hashing
```typescript
import bcrypt from 'bcryptjs';

// For SSH passwords
export async function hashSshPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifySshPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

### 3. Input Validation
```typescript
// Validate coordinates
export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Validate IP address
export function validateIPAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Validate MAC address
export function validateMACAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}
```

## Deployment Checklist

- [ ] Update Prisma schema with new fields
- [ ] Generate Prisma migration
- [ ] Apply migration to database
- [ ] Create API endpoints for device setup
- [ ] Implement data encryption for sensitive fields
- [ ] Add input validation for all endpoints
- [ ] Set up rate limiting for external API calls (geocoding)
- [ ] Create database indexes on frequently queried fields (organizationId, deviceType, status)
- [ ] Update API documentation
- [ ] Create integration tests
- [ ] Set up environment variables for encryption keys
- [ ] Deploy to staging environment for testing
- [ ] Verify frontend-backend integration
- [ ] Deploy to production

## Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
DEVICE_ENCRYPTION_KEY="your-32-byte-encryption-key-hex-encoded"

# External APIs
NOMINATIM_API_URL="https://nominatim.openstreetmap.org"
NOMINATIM_USER_AGENT="AirguardApp/1.0"

# SSH Connection Testing (optional)
SSH_CONNECTION_TIMEOUT="5000"  # milliseconds
```

## Testing Instructions

### 1. Test Device Setup Flow
```bash
# Create a test device with full configuration
curl -X POST http://localhost:3000/api/devices/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test AP-01",
    "deviceType": "airguard",
    "latitude": 33.8938,
    "longitude": 35.5018,
    "ssid": "TestNetwork",
    "password": "securepass123",
    "organizationId": "$ORG_ID"
  }'
```

### 2. Test GPS Sync
```bash
curl -X POST http://localhost:3000/api/devices/$DEVICE_ID/gps-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "latitude": 33.8940,
    "longitude": 35.5020,
    "altitude": 125.5,
    "accuracy": 5.2,
    "heading": 180.0,
    "timestamp": "2025-01-15T10:30:00Z",
    "syncMethod": "dongle"
  }'
```

### 3. Test SSH Configuration
```bash
curl -X POST http://localhost:3000/api/devices/$DEVICE_ID/ssh-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "username": "admin",
    "password": "adminpass123",
    "sshPort": "22"
  }'
```

### 4. Test Managed Devices
```bash
# Add a managed device
curl -X POST http://localhost:3000/api/devices/$AIRGUARD_ID/add-managed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "managedDeviceId": "$MANAGED_DEVICE_ID",
    "sshConfig": {
      "username": "root",
      "password": "devicepass"
    },
    "gpsData": {
      "latitude": 33.8945,
      "longitude": 35.5025,
      "altitude": 120.0,
      "accuracy": 8.0,
      "heading": 90.0
    }
  }'

# Get all managed devices
curl -X GET http://localhost:3000/api/devices/$AIRGUARD_ID/managed \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend Integration Points

The frontend sends data to the backend at these key moments:

1. **Step 6 (Review) - Deploy Button**: Calls `POST /api/devices/setup` with all collected data
2. **Step 2 (Location) - Use GPS Button**: Simulates GPS dongle, would call `POST /api/devices/:id/gps-sync`
3. **Step 5 (Managed Devices) - Add Device**: Calls `POST /api/devices/:id/add-managed` for each device
4. **Step 2 (Location) - Address Lookup**: Calls Nominatim API directly (can proxy through backend)

## Data Flow Diagram

```
Frontend Setup Flow:
┌─────────────────┐
│  Step 1: Type   │ → Stores in formData state
└─────────────────┘
         ↓
┌─────────────────┐
│  Step 2: Loc    │ → GPS/Map/Address → Updates formData
└─────────────────┘
         ↓
┌─────────────────┐
│  Step 3: WiFi   │ → Stores wireless config
└─────────────────┘
         ↓
┌─────────────────┐
│  Step 4: Net    │ → Stores network config
└─────────────────┘
         ↓
┌─────────────────┐
│  Step 5: Mgd    │ → Stores managed devices
└─────────────────┘
         ↓
┌─────────────────┐
│  Step 6: Review │ → POST /api/devices/setup → Database
└─────────────────┘
```

## Notes for Backend Agent

1. **Priority**: Start with the core `/api/devices/setup` endpoint first
2. **Security**: Encrypt all sensitive fields (passwords, SSH credentials)
3. **Validation**: Add comprehensive input validation
4. **Error Handling**: Return clear error messages for the frontend
5. **Logging**: Log all device configuration changes for audit trail
6. **Performance**: Add database indexes for frequently queried fields
7. **Testing**: Create comprehensive integration tests

For questions or clarifications, refer to the frontend implementation in `/src/app/dashboard/setup/page.tsx`.

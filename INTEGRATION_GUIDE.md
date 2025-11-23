# 🔗 AirGuard Dashboard - IoT Dongle Integration Guide

## Overview

This guide explains how the AirGuard Dashboard integrates IoT dongle data (GPS, IMU sensors) with the main backend database and frontend UI.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ESP32 Sender (Button Press 10s)                                    │
│       ↓ ESP-NOW Wireless                                            │
│  ESP32 Receiver (Serial USB @ 115200 baud)                          │
│       ↓ JSON Output                                                 │
│  Python Gateway (gateway.py)                                        │
│       ↓ Publishes                                                   │
│  MQTT Broker (Port 1883, Topic: espnow/samples)                     │
│       ↓ Subscribes                                                  │
│  Backend DongleGateway (dongleGateway.ts)                           │
│       ↓ Redis Pub/Sub (channel: dongle:data)                        │
│  Pairing Worker (pairingController.ts)                              │
│       ↓ Creates/Updates                                             │
│  PostgreSQL Main Database (devices table)                           │
│       ↓ Polls via API                                               │
│  Frontend (DeviceSetupTable component)                              │
│       ↓ Displays                                                    │
│  User sees GPS data with checkmark ✓                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📡 Components

### 1. **MQTT Broker** (Port 1883)
- **Location**: `airguard-esp32-iot-postgresql/mqtt-broker/broker.js`
- **Topic**: `espnow/samples`
- **Purpose**: Receives sensor data from Python gateway and distributes to subscribers

### 2. **Python Gateway**
- **Location**: `airguard-esp32-iot-postgresql/host/python-gateway/gateway.py`
- **Purpose**:
  - Reads ESP32 serial output
  - Parses sensor packets
  - Publishes to MQTT broker
  - Stores locally in SQLite (backup)

### 3. **Backend DongleGateway**
- **Location**: `airguard-backend/src/services/dongleGateway.ts`
- **Purpose**:
  - Subscribes to MQTT topic `espnow/samples`
  - Converts dongle data to GPS format
  - Publishes to Redis channel `dongle:data`
  - Can also read serial directly (optional)

### 4. **Backend Pairing System**
- **Location**: `airguard-backend/src/controllers/pairingController.ts`
- **Endpoints**:
  - `POST /api/devices/pair/start` - Start pairing session
  - `GET /api/devices/pair/status/:sessionId` - Poll for GPS data
  - `POST /api/devices/:deviceId/gps-sync` - Manual GPS sync
  - `POST /api/devices/test-dongle` - Test with dummy data
- **Purpose**:
  - Background worker listens on Redis `dongle:data` channel
  - When data arrives, creates/updates device in PostgreSQL
  - Stores GPS, IMU, and session data
  - Updates pairing session status to `paired`

### 5. **Frontend Device Setup**
- **Location**: `airguard-frontend/src/components/dashboard/DeviceSetupTable.tsx`
- **Flow**:
  1. User clicks "Add" on a network device
  2. Modal shows **Step 1: SSH Configuration** (username/password)
  3. User clicks "Next"
  4. Frontend calls `/api/devices/pair/start` → gets `sessionId`
  5. Modal shows **Step 2: GPS Waiting** (spinner animation)
  6. Frontend polls `/api/devices/pair/status/:sessionId` every 2 seconds
  7. User presses dongle button near device
  8. Backend receives MQTT data → updates device → sets status to `paired`
  9. Frontend receives GPS data → shows checkmark ✓
  10. User clicks "Finish" → device is added

---

## 🗄️ Database Schema

### Device Table (PostgreSQL)
```sql
-- Main device record
id                    STRING (PRIMARY KEY)
name                  STRING
deviceType            STRING  -- 'access_point', 'router', etc.

-- GPS Data (from dongle)
latitude              FLOAT
longitude             FLOAT
altitude              FLOAT
gpsAccuracy           FLOAT
heading               FLOAT
gpsConfigured         BOOLEAN

-- IMU Sensor Data (from dongle)
accelerometerX        FLOAT   -- m/s²
accelerometerY        FLOAT
accelerometerZ        FLOAT
gyroscopeX            FLOAT   -- rad/s
gyroscopeY            FLOAT
gyroscopeZ            FLOAT
temperature           FLOAT   -- °C

-- Dongle Session Info
dongleBatchId         STRING  -- Unique batch ID
dongleSessionMs       INT     -- Session duration
dongleSampleCount     INT     -- Number of samples
dongleDateYMD         INT     -- YYYYMMDD
dongleTimeHMS         INT     -- HHMMSS
dongleMsec            INT     -- Milliseconds
dongleGpsFix          INT     -- GPS fix status
dongleSatellites      INT     -- Number of satellites

-- Network Info
ipAddress             STRING
macAddress            STRING (UNIQUE)
sshUsername           STRING
sshConfigured         BOOLEAN

-- Status
status                STRING  -- 'online', 'offline', 'warning'
setupComplete         BOOLEAN
organizationId        STRING (FOREIGN KEY)
```

### PairingSession Table
```sql
sessionId     STRING (PRIMARY KEY)
status        STRING  -- 'waiting', 'paired', 'timeout'
deviceId      STRING  -- Created device ID
dongleId      STRING  -- Dongle batch ID
expiresAt     DATETIME
createdAt     DATETIME
```

### GpsLog Table (Audit Trail)
```sql
id            STRING (PRIMARY KEY)
deviceId      STRING (FOREIGN KEY)
latitude      FLOAT
longitude     FLOAT
altitude      FLOAT
accuracy      FLOAT
heading       FLOAT
syncMethod    STRING  -- 'dongle', 'manual', 'api'
timestamp     DATETIME
```

---

## 🚀 Quick Start

### Prerequisites
1. PostgreSQL running on port 5432
2. Redis running on port 6379
3. Node.js 18+ installed
4. Python 3.8+ installed (for gateway, optional)

### Option 1: Automated Startup
```bash
# Start all services
./start-integration.sh

# View logs
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/mqtt-broker.log

# Stop all services
./stop-integration.sh
```

### Option 2: Manual Startup

**1. Start MQTT Broker**
```bash
cd airguard-esp32-iot-postgresql/mqtt-broker
npm install
node broker.js
```

**2. Start Backend**
```bash
cd airguard-backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

**3. Start Frontend**
```bash
cd airguard-frontend
npm install
npm run dev
```

---

## 🧪 Testing the Integration

### Test 1: Backend Test Endpoint
```bash
# Inject test dongle data
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 2: Frontend "Test with Dummy Data" Button
1. Open http://localhost:3000
2. Go to Device Setup (Step 5: Add Managed Devices)
3. Click "Add" on any device
4. Enter SSH credentials → Click "Next"
5. Click "Test with Dummy Data" button
6. GPS data should appear with checkmark ✓

### Test 3: Real Dongle Pairing (if hardware available)
1. Start Python Gateway:
   ```bash
   cd airguard-esp32-iot-postgresql/host/python-gateway
   python3 gateway.py
   ```
2. Frontend: Click "Add" → Enter SSH → Click "Next"
3. Press and hold dongle button for 10 seconds
4. GPS data should appear in frontend automatically

---

## 🔧 Environment Variables

### Backend (`.env`)
```env
# MQTT Configuration
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_TOPIC=espnow/samples
ENABLE_DONGLE_GATEWAY=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/airguard

# JWT
JWT_SECRET=your-secret-key
```

### Python Gateway (`.env`)
```env
SERIAL_PORT=/dev/ttyUSB0
MQTT_BROKER=127.0.0.1
MQTT_PORT=1883
MQTT_TOPIC=espnow/samples
```

---

## 📊 API Endpoints

### Pairing Endpoints

#### Start Pairing Session
```http
POST /api/devices/pair/start
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "deviceId": "optional-existing-device-id"
}

Response:
{
  "sessionId": "uuid-v4",
  "status": "waiting"
}
```

#### Check Pairing Status (Poll this every 2 seconds)
```http
GET /api/devices/pair/status/:sessionId
Authorization: Bearer TOKEN

Response (waiting):
{
  "status": "waiting"
}

Response (paired):
{
  "status": "paired",
  "gpsData": {
    "latitude": 33.888630,
    "longitude": 35.495480,
    "altitude": 79.20,
    "accuracy": 5.0,
    "heading": 45.2,
    "timestamp": "2025-11-23T12:34:56.789Z"
  },
  "imuData": {
    "accelerometer": { "x": 0.15, "y": -0.22, "z": 9.8 },
    "gyroscope": { "x": 0.05, "y": -0.08, "z": 0.02 },
    "temperature": 25.3
  },
  "dongleBatchId": "5A17C2EF"
}
```

---

##📱 Frontend Implementation

### DeviceSetupTable Component Flow

**State Variables:**
```typescript
const [currentStep, setCurrentStep] = useState(1); // 1=SSH, 2=GPS
const [sshUsername, setSshUsername] = useState("");
const [sshPassword, setSshPassword] = useState("");
const [pairingSessionId, setPairingSessionId] = useState<string | null>(null);
const [isWaitingForGps, setIsWaitingForGps] = useState(false);
const [gpsData, setGpsData] = useState<GpsData | null>(null);
```

**Pairing Flow:**
```typescript
// Step 1 → Step 2: Start pairing and poll
const handleNextStep = async () => {
  setCurrentStep(2);
  setIsWaitingForGps(true);

  // Call backend to start pairing session
  const response = await apiService.startPairing(selectedDevice?.id);
  setPairingSessionId(response.sessionId);

  // Start polling every 2 seconds
  const intervalId = setInterval(async () => {
    const status = await apiService.getPairingStatus(response.sessionId);

    if (status.status === 'paired' && status.gpsData) {
      setGpsData(status.gpsData);
      setIsWaitingForGps(false);
      clearInterval(intervalId);
    }
  }, 2000);
};
```

---

## 🐛 Troubleshooting

### MQTT Connection Issues
```bash
# Test MQTT broker is running
mosquitto_sub -h localhost -p 1883 -t espnow/samples

# Check MQTT broker logs
tail -f logs/mqtt-broker.log
```

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Should return: PONG
```

### Backend Not Receiving Dongle Data
1. Check MQTT broker is running: `lsof -i :1883`
2. Check backend DongleGateway logs: `tail -f logs/backend.log | grep Dongle`
3. Verify `ENABLE_DONGLE_GATEWAY=true` in backend `.env`
4. Check Redis pub/sub: `redis-cli PSUBSCRIBE dongle:*`

### Frontend Not Showing GPS Data
1. Open browser DevTools → Network tab
2. Look for polling requests to `/api/devices/pair/status/:sessionId`
3. Check response status and data
4. Verify auth token is included in requests

---

## 🎯 Next Steps

- [ ] Add NetWatch network scanning integration
- [ ] Implement WebSocket for real-time updates (replace polling)
- [ ] Add device type routing (SSH-only vs GPS-only flows)
- [ ] Create production Docker Compose setup
- [ ] Add device health monitoring

---

## 📚 Related Files

- **Backend Pairing**: `airguard-backend/src/controllers/pairingController.ts`
- **DongleGateway**: `airguard-backend/src/services/dongleGateway.ts`
- **Frontend Component**: `airguard-frontend/src/components/dashboard/DeviceSetupTable.tsx`
- **API Service**: `airguard-frontend/src/services/api.ts`
- **Database Schema**: `airguard-backend/prisma/schema.prisma`
- **Master Prompt**: `MASTER_AI_PROMPT.md`

---

**✅ Integration Complete!** The dongle data now flows seamlessly from ESP32 hardware → MQTT → Backend → PostgreSQL → Frontend UI.

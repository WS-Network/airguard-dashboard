# AirGuard Dashboard - Master AI Integration Prompt

## Repository Structure

**GitHub:** https://github.com/WS-Network/airguard-dashboard

| Branch | Contents | Purpose |
|--------|----------|---------|
| `main` | Complete monorepo | All projects together |
| `backend` | `airguard-backend/` | NestJS/Express API server |
| `frontend` | `airguard-frontend/` | Next.js React dashboard |
| `iot` | `airguard-esp32-iot-postgresql/` | ESP32 firmware + MQTT broker |
| `netwatch` | `netwatch.new/` | Network scanning & monitoring |

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AIRGUARD DASHBOARD SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   FRONTEND   │     │   BACKEND    │     │   SERVICES   │                │
│  │  (Next.js)   │────▶│  (Express)   │────▶│              │                │
│  │  Port: 3000  │     │  Port: 3001  │     │              │                │
│  └──────────────┘     └──────┬───────┘     │  ┌────────┐  │                │
│         │                    │             │  │NetWatch│  │                │
│         │              ┌─────┴─────┐       │  │Port:   │  │                │
│         │              │           │       │  │8080    │  │                │
│         │              ▼           ▼       │  └────────┘  │                │
│         │        ┌──────────┐ ┌────────┐   │              │                │
│         │        │PostgreSQL│ │ Redis  │   │  ┌────────┐  │                │
│         │        │Port: 5432│ │Port:   │   │  │  MQTT  │  │                │
│         │        └──────────┘ │6379    │   │  │ Broker │  │                │
│         │                     └────────┘   │  │Port:   │  │                │
│         │                          │       │  │1883    │  │                │
│         │                          │       │  └────────┘  │                │
│         │                          │       │      ▲       │                │
│         │                          │       └──────┼───────┘                │
│         │                          │              │                        │
│         │                     ┌────┴────┐   ┌─────┴─────┐                  │
│         │                     │ Dongle  │   │   ESP32   │                  │
│         │                     │ Gateway │◀──│  Devices  │                  │
│         │                     └─────────┘   └───────────┘                  │
│         │                                                                   │
│         └───────────────────── WebSocket ──────────────────────────────────│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. BACKEND (airguard-backend) - Port 3001

**Technology:** Node.js, Express, TypeScript, Prisma ORM

#### API Endpoints

| Category | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| **Auth** | `/api/auth/signup` | POST | Register user |
| | `/api/auth/login` | POST | Authenticate |
| | `/api/auth/refresh` | POST | Refresh tokens |
| | `/api/auth/logout` | POST | End session |
| | `/api/auth/profile` | GET | Get user data |
| **Devices** | `/api/devices` | GET/POST | List/Create devices |
| | `/api/devices/:id` | GET/PUT/DELETE | Device CRUD |
| | `/api/devices/:id/metrics` | GET/POST | Device metrics |
| | `/api/devices/port-scan` | GET | Network scan (calls NetWatch) |
| | `/api/devices/pair/start` | POST | Start dongle pairing |
| | `/api/devices/pair/status/:id` | GET | Check pairing status |
| | `/api/devices/:id/gps-sync` | POST | Sync GPS coordinates |
| **Settings** | `/api/settings` | GET/PUT | User preferences |
| **Dashboard** | `/api/dashboard/metrics` | GET | Dashboard data |

#### Database Schema (PostgreSQL)

**Key Tables:**
- `users` - User accounts
- `organizations` - Multi-tenant orgs
- `devices` - IoT devices with GPS, IMU, network config
- `device_metrics` - Time-series metrics
- `alerts` - System alerts
- `pairing_sessions` - Dongle pairing state
- `gps_logs` - GPS history

#### MQTT Integration

```
Topic: espnow/samples
Broker: localhost:1883
```

**Expected MQTT Payload:**
```json
{
  "batchId": "5A17C2EF",
  "lat": 33.888630,
  "lon": 35.495480,
  "alt": 79.20,
  "gpsFix": 1,
  "sats": 7,
  "ax": 0.15, "ay": -0.22, "az": 9.8,
  "gx": 0.05, "gy": -0.08, "gz": 0.02,
  "tempC": 25.3,
  "sessionMs": 10000,
  "samples": 200
}
```

#### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/airguard
JWT_SECRET=your-secret-key
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_TOPIC=espnow/samples
REDIS_HOST=localhost
NETWATCH_URL=http://localhost:8080
```

---

### 2. FRONTEND (airguard-frontend) - Port 3000

**Technology:** Next.js 15, React, Tailwind CSS, Leaflet Maps

#### Pages
- `/login` - Authentication
- `/signup` - Registration (multi-step)
- `/dashboard/home` - Main dashboard with metrics, charts, map
- `/dashboard/setup` - Device setup wizard (6 steps)
- `/dashboard/manage` - Settings panel
- `/dashboard/ai-chat` - AI assistant

#### Dashboard Features
- Network health metrics (health index, throughput, QoS, interference)
- Device map (Leaflet with device markers)
- Device status pie chart
- Recent alerts panel
- Achievements/ESG tracking

#### API Communication
- Uses `credentials: 'include'` for httpOnly cookies
- Polls `/api/devices/pair/status/:id` every 2 seconds during pairing
- Expects backend at `NEXT_PUBLIC_BACKEND_URL`

#### Environment Variables
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 3. IOT DONGLE (airguard-esp32-iot-postgresql) - MQTT Port 1883

**Technology:** Arduino (ESP32-S3), Node.js MQTT Broker, Python Gateway

#### ESP32 Firmware

**Sender Device (esp32s3-gps-mpu-button-sender.ino):**
- Sensors: GPS (NEO-6M), IMU (MPU6050), Temperature
- Trigger: Button hold ≥10 seconds
- Protocol: ESP-NOW wireless
- Output: 64-byte binary packet

**Receiver Device (esp32s3-receiver-json.ino):**
- Receives ESP-NOW packets
- Outputs JSON via Serial USB (115200 baud)

#### Data Packet Structure
```c
struct SensorPacket {
  uint32_t batchId;      // Unique ID
  uint32_t sessionMs;    // Duration (ms)
  uint32_t samples;      // Sample count
  uint32_t dateYMD;      // YYYYMMDD
  uint32_t timeHMS;      // HHMMSS
  uint16_t msec;         // Milliseconds
  float lat, lon, alt;   // GPS coordinates
  uint8_t gpsFix, sats;  // GPS quality
  float ax, ay, az;      // Accelerometer (m/s²)
  float gx, gy, gz;      // Gyroscope (rad/s)
  float tempC;           // Temperature
};
```

#### MQTT Broker (mqtt-broker/broker.js)
- Technology: Aedes (Node.js)
- Port: 1883
- Topic: `espnow/samples`

#### Python Gateway (host/python-gateway/gateway.py)
- Reads ESP32 serial output
- Publishes to MQTT topic
- Stores to local SQLite
- Can POST to REST API

#### MQTT-PostgreSQL Bridge (bridges/mqtt-postgresql/bridge.js)
- Subscribes to `espnow/samples`
- Inserts to PostgreSQL `samples` table
- Broadcasts via WebSocket (port 8081)

#### Node.js API (host/node-backend/server.js) - Port 8080
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/v1/samples` | GET | List samples (paginated) |
| `/v1/samples` | POST | Create sample |
| `/v1/samples/:batchId` | GET | Get specific sample |
| `/v1/stats` | GET | Statistics |

---

### 4. NETWATCH (netwatch.new) - Port 8080

**Technology:** Python, Flask, Scapy, Nmap

#### REST API Endpoints

| Category | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| **System** | `/api/status` | GET | System health |
| | `/api/connection` | GET | Network connection info |
| | `/api/scan` | GET | All unified scan results |
| **WiFi** | `/api/wifi/devices` | GET | Detected WiFi devices |
| | `/api/wifi/bad-frequencies` | GET | Problematic frequencies |
| | `/api/wifi/interference` | GET | Interference log |
| | `/api/wifi/monitor/enable` | POST | Enable monitor mode |
| **Network** | `/api/network/devices` | GET | Discovered network devices |
| | `/api/network/devices/:ip` | GET | Device details |
| | `/api/network/devices/:ip/ports` | GET | Open ports |
| | `/api/network/devices/:ip/ssh` | POST | SSH login |
| | `/api/network/rescan` | POST | Trigger rescan |
| **AI** | `/api/ai/model/status` | GET | Model status |
| | `/api/ai/model/train` | POST | Train model |
| **Export** | `/api/export/all` | GET | Export all data |

#### Data Formats

**Network Device:**
```json
{
  "ip": "192.168.1.100",
  "mac": "AA:BB:CC:DD:EE:FF",
  "vendor": "Manufacturer",
  "hostname": "device-name",
  "os": "Linux",
  "ports": [22, 80, 443],
  "ssh_status": "connected|failed"
}
```

**WiFi Device:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "signal": -65,
  "freq": 2437,
  "interfering": false
}
```

#### AI Features
- Algorithm: Isolation Forest
- Purpose: Detect WiFi interference anomalies
- Model: `output/models/wifi_rf_model.joblib`

---

## INTEGRATION TASKS

### Phase 1: Backend ↔ NetWatch Integration

**Goal:** Backend calls NetWatch API for network scanning

**Tasks:**
1. Add NetWatch service in backend (`src/services/netwatchService.ts`)
2. Implement `/api/devices/port-scan` to call `http://localhost:8080/api/network/devices`
3. Map NetWatch device format to backend Device model
4. Add WiFi interference data to dashboard metrics
5. Create endpoint for WiFi bad frequencies

**Backend Changes:**
```typescript
// src/services/netwatchService.ts
class NetwatchService {
  async getNetworkDevices(): Promise<NetworkDevice[]>
  async getWifiDevices(): Promise<WifiDevice[]>
  async getBadFrequencies(): Promise<BadFrequency[]>
  async getConnectionStatus(): Promise<ConnectionStatus>
  async triggerRescan(): Promise<void>
}
```

**New Endpoints to Add:**
- `GET /api/network/scan` → Calls NetWatch `/api/network/devices`
- `GET /api/wifi/scan` → Calls NetWatch `/api/wifi/devices`
- `GET /api/wifi/interference` → Calls NetWatch `/api/wifi/bad-frequencies`
- `POST /api/network/rescan` → Calls NetWatch `/api/network/rescan`

---

### Phase 2: Backend ↔ IoT Dongle Integration (MQTT)

**Goal:** Backend receives real-time dongle data via MQTT

**Tasks:**
1. Ensure DongleGateway service connects to MQTT broker
2. Process incoming `espnow/samples` messages
3. Create/update devices from dongle data
4. Store GPS logs and IMU readings
5. Implement pairing flow with Redis pub/sub

**MQTT Flow:**
```
ESP32 → Serial → Python Gateway → MQTT Broker (1883)
                                       ↓
                              Backend DongleGateway
                                       ↓
                              Redis Channel: dongle:data
                                       ↓
                              Pairing Worker → Database
```

**Backend Changes:**
```typescript
// src/services/dongleGateway.ts (already exists, verify config)
- MQTT_BROKER: localhost
- MQTT_PORT: 1883
- MQTT_TOPIC: espnow/samples
```

---

### Phase 3: Frontend ↔ Backend Integration

**Goal:** Frontend displays NetWatch and IoT data

**Tasks:**
1. Add network devices to device table
2. Display WiFi interference on map/dashboard
3. Show GPS coordinates from dongle on map
4. Implement real-time updates (WebSocket or polling)
5. Add interference alerts to alerts panel

**Frontend Changes:**
```typescript
// src/services/api.ts - Add new methods
async getNetworkScan(): Promise<NetworkDevice[]>
async getWifiScan(): Promise<WifiDevice[]>
async getInterference(): Promise<BadFrequency[]>
async triggerNetworkRescan(): Promise<void>
```

**New Dashboard Components:**
- `NetworkDevicesTable` - Display NetWatch devices
- `WifiInterferencePanel` - Show bad frequencies
- `SignalStrengthIndicator` - WiFi signal display

---

### Phase 4: Real-Time Communication

**Goal:** Live updates from IoT devices to dashboard

**Options:**
1. **WebSocket (Recommended)**
   - Backend broadcasts device updates
   - Frontend subscribes to organization room

2. **Polling (Current)**
   - Frontend polls every 5 seconds
   - Simpler but less efficient

**WebSocket Events:**
```typescript
// Server → Client
'device-update': { deviceId, status, metrics, gps }
'network-scan': { devices: NetworkDevice[] }
'wifi-alert': { frequency, reason, severity }
'dongle-paired': { deviceId, gpsData, imuData }

// Client → Server
'join-organization': organizationId
'subscribe-devices': organizationId
```

---

## Environment Setup

### Required Services

| Service | Port | Start Command |
|---------|------|---------------|
| PostgreSQL | 5432 | `docker-compose up postgres` |
| Redis | 6379 | `docker-compose up redis` |
| MQTT Broker | 1883 | `node mqtt-broker/broker.js` |
| Backend | 3001 | `npm run dev` |
| Frontend | 3000 | `npm run dev` |
| NetWatch | 8080 | `sudo python3 netwatch_unified.py` |
| IoT Gateway | - | `python3 gateway.py` |

### Docker Compose (Recommended)
```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: airguard
      POSTGRES_USER: airguard
      POSTGRES_PASSWORD: airguard

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mqtt:
    build: ./airguard-esp32-iot-postgresql/mqtt-broker
    ports: ["1883:1883"]

  backend:
    build: ./airguard-backend
    ports: ["3001:3001"]
    depends_on: [postgres, redis, mqtt]

  frontend:
    build: ./airguard-frontend
    ports: ["3000:3000"]
    depends_on: [backend]

  netwatch:
    build: ./netwatch.new
    ports: ["8080:8080"]
    network_mode: host  # Required for network scanning
    privileged: true    # Required for monitor mode
```

---

## Data Flow Summary

```
┌─────────────┐    ESP-NOW    ┌─────────────┐    Serial    ┌─────────────┐
│ ESP32 Sender│──────────────▶│ESP32 Receiver│─────────────▶│Python Gateway│
└─────────────┘               └─────────────┘              └──────┬──────┘
                                                                  │ MQTT
                                                                  ▼
┌─────────────┐    REST API   ┌─────────────┐    MQTT     ┌─────────────┐
│  NetWatch   │◀─────────────▶│   Backend   │◀────────────│ MQTT Broker │
│  Port:8080  │               │  Port:3001  │             │  Port:1883  │
└─────────────┘               └──────┬──────┘             └─────────────┘
                                     │
                              ┌──────┴──────┐
                              │             │
                              ▼             ▼
                        ┌──────────┐  ┌─────────┐
                        │PostgreSQL│  │  Redis  │
                        └──────────┘  └─────────┘
                              │
                              │ REST API
                              ▼
                        ┌─────────────┐
                        │  Frontend   │
                        │  Port:3000  │
                        └─────────────┘
```

---

## Key Integration Points Checklist

### Backend Needs to:
- [ ] Connect to MQTT broker at `localhost:1883`
- [ ] Subscribe to topic `espnow/samples`
- [ ] Call NetWatch API at `http://localhost:8080`
- [ ] Map NetWatch devices to Device model
- [ ] Process dongle GPS/IMU data
- [ ] Broadcast updates via WebSocket

### Frontend Needs to:
- [ ] Display network devices from NetWatch
- [ ] Show WiFi interference data
- [ ] Update device locations from dongle GPS
- [ ] Implement real-time updates
- [ ] Add network scan trigger button

### IoT Needs to:
- [ ] MQTT broker running on port 1883
- [ ] Python gateway publishing to `espnow/samples`
- [ ] ESP32 devices paired and transmitting

### NetWatch Needs to:
- [ ] Running on port 8080
- [ ] Network scanning active
- [ ] WiFi scanning active (requires monitor mode)
- [ ] API accessible from backend

---

## Testing Commands

```bash
# Test NetWatch API
curl http://localhost:8080/api/status
curl http://localhost:8080/api/network/devices
curl http://localhost:8080/api/wifi/devices

# Test Backend API
curl http://localhost:3001/health
curl http://localhost:3001/api/devices -H "Authorization: Bearer TOKEN"

# Test MQTT
mosquitto_sub -h localhost -t espnow/samples

# Test IoT Gateway
python3 gateway.py  # Watch for incoming dongle data
```

---

## File Locations Quick Reference

| Component | Key Files |
|-----------|-----------|
| Backend Routes | `airguard-backend/src/controllers/` |
| Backend Services | `airguard-backend/src/services/` |
| Backend Schema | `airguard-backend/prisma/schema.prisma` |
| Frontend Pages | `airguard-frontend/src/app/` |
| Frontend API | `airguard-frontend/src/services/api.ts` |
| MQTT Broker | `airguard-esp32-iot-postgresql/mqtt-broker/broker.js` |
| Python Gateway | `airguard-esp32-iot-postgresql/host/python-gateway/gateway.py` |
| ESP32 Sender | `airguard-esp32-iot-postgresql/esp32s3-gps-mpu-button-sender/` |
| ESP32 Receiver | `airguard-esp32-iot-postgresql/esp32s3-receiver-json/` |
| NetWatch API | `netwatch.new/api/rest_api.py` |
| NetWatch Core | `netwatch.new/core/netwatch_unified.py` |

---

## Summary

This system integrates four components:
1. **Frontend** - User interface displaying all data
2. **Backend** - Central API coordinating everything
3. **IoT Dongle** - Hardware sensors sending GPS/IMU via MQTT
4. **NetWatch** - Network scanner providing device discovery

**Communication:**
- Frontend ↔ Backend: REST API + WebSocket
- Backend ↔ NetWatch: REST API
- Backend ↔ IoT: MQTT (topic: `espnow/samples`)
- IoT Devices: ESP-NOW → Serial → MQTT

**Key Ports:**
- 3000: Frontend
- 3001: Backend
- 1883: MQTT Broker
- 5432: PostgreSQL
- 6379: Redis
- 8080: NetWatch API

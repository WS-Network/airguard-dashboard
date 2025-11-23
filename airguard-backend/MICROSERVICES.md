# Airguard Microservices Architecture

This document explains the microservices-based architecture for the Airguard IoT system, with standalone dockerized modules for ESP32 dongle integration and future port scanning detection.

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Airguard System Architecture                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  ESP32 Sender    │──ESP──▶│  ESP32 Receiver  │
│  (Button Press)  │  NOW   │  (USB Dongle)    │
└──────────────────┘         └────────┬─────────┘
                                      │ USB Serial
                                      ▼
                             ┌────────────────────┐
                             │  Dongle Service    │
                             │  (Python Gateway)  │
                             │  Docker Container  │
                             └────────┬───────────┘
                                      │ Redis Pub/Sub
                                      │ (dongle:data)
                                      ▼
┌──────────────────┐         ┌────────────────────┐
│  Port Scanner    │─Redis──▶│  Dashboard Backend │
│  Microservice    │ Pub/Sub │  (Node.js/Express) │
│  (Future)        │         │  Docker Container  │
└──────────────────┘         └────────┬───────────┘
                                      │ REST API
                                      │ WebSocket
                                      ▼
                             ┌────────────────────┐
                             │  PostgreSQL + Redis│
                             │  Docker Containers │
                             └────────────────────┘
                                      ▲
                                      │ HTTP/WS
                                      │
                             ┌────────┴───────────┐
                             │  Frontend Dashboard│
                             │  (Next.js React)   │
                             └────────────────────┘
```

## 🎯 Design Principles

### 1. **Microservices Pattern**

Each component is a **standalone, independently deployable service**:

- **Dongle Service**: Python service reading ESP32 serial data
- **Dashboard Backend**: Node.js API handling business logic
- **Port Scanner** (future): Network scanning service
- **Database Services**: PostgreSQL + Redis for persistence and messaging

### 2. **Communication via Redis Pub/Sub**

Services communicate asynchronously using **Redis channels**:

- `dongle:data` - ESP32 dongle sensor data
- `port-scan:results` (future) - Network scanning results
- Decoupled architecture allows independent scaling
- No direct dependencies between services

### 3. **JSON-Based Data Exchange**

All services exchange data in **standardized JSON format**:

- Easy to debug and monitor
- Language-agnostic (Python ↔ Node.js)
- Schema validation on both ends

### 4. **Docker Containerization**

Every service runs in its own **Docker container**:

- Isolated dependencies and environment
- Easy deployment and scaling
- Consistent behavior across environments
- USB device pass-through for hardware access

## 🚀 Current Implementation: Dongle Service

### Directory Structure

```
airguard-backend/
├── dongle-service/              # ESP32 dongle microservice
│   ├── Dockerfile               # Container definition
│   ├── gateway.py               # Python gateway script
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── README.md                # Service documentation
├── docker-compose.yml           # Orchestration config
└── src/                         # Dashboard backend
    └── controllers/
        └── pairingController.ts # Subscribes to Redis
```

### How It Works

1. **ESP32 Receiver** connected via USB sends data over serial port
2. **Dongle Gateway** (Python) reads serial port and parses data
3. **Gateway publishes** JSON to Redis channel `dongle:data`
4. **Dashboard Backend** subscribes to Redis when pairing starts
5. **Backend receives** message and creates/updates device in PostgreSQL
6. **Frontend** polls pairing status and displays GPS + IMU data

### Data Flow Example

**ESP32 Serial Output**:
```
---
Batch: A3F5B21C
Session: 10000 ms | Samples: 200
Timestamp: 20251117 103045.123
GPS: Lat=33.888630 Lon=35.495480 Alt=79.20 Fix=1 Sats=7
Accel X: 0.15  Y: -0.08  Z: 9.82
Gyro  X: 0.02  Y: -0.01  Z: 0.00
Temp: 25.3 C
---
```

**Redis Message** (published by gateway):
```json
{
  "batchId": "A3F5B21C",
  "sessionMs": 10000,
  "samples": 200,
  "dateYMD": 20251117,
  "timeHMS": 103045,
  "msec": 123,
  "lat": 33.888630,
  "lon": 35.495480,
  "alt": 79.20,
  "gpsFix": 1,
  "sats": 7,
  "ax": 0.15,
  "ay": -0.08,
  "az": 9.82,
  "gx": 0.02,
  "gy": -0.01,
  "gz": 0.00,
  "tempC": 25.3,
  "receivedTs": "2025-11-17T10:30:45.123Z"
}
```

**Backend Processing** (`pairingController.ts`):
```typescript
// Subscribe to Redis channel when pairing starts
const subscriber = new Redis();
subscriber.subscribe('dongle:data');

subscriber.on('message', async (channel, message) => {
  const dongleData = JSON.parse(message);

  // Create or update device with all 19 fields
  await prisma.device.create({
    data: {
      latitude: dongleData.lat,
      longitude: dongleData.lon,
      accelerometerX: dongleData.ax,
      // ... all 19 dongle fields
    }
  });
});
```

## 🔧 Deployment Guide

### Quick Start (All Services)

```bash
# Start all services including dongle
docker-compose up -d

# Check dongle service logs
docker-compose logs -f dongle-service
```

### Start Individual Services

```bash
# Only dashboard backend and database
docker-compose up -d postgres redis backend

# Add dongle service when ESP32 is connected
docker-compose up -d dongle-service

# Add future port scanner
docker-compose up -d port-scanner
```

### ESP32 Dongle Setup

1. **Connect ESP32 receiver** via USB

2. **Find serial port**:
   ```bash
   # Linux
   ls /dev/ttyUSB* /dev/ttyACM*

   # macOS
   ls /dev/tty.usb*
   ```

3. **Update docker-compose.yml**:
   ```yaml
   dongle-service:
     devices:
       - "/dev/ttyUSB0:/dev/ttyUSB0"  # Update this line
   ```

4. **Start service**:
   ```bash
   docker-compose up -d dongle-service
   ```

5. **Verify**:
   ```bash
   docker-compose logs -f dongle-service

   # Expected output:
   # dongle-gateway | Serial port opened: /dev/ttyUSB0
   # dongle-gateway | Published to Redis: A3F5B21C -> dongle:data
   ```

### Testing Without Hardware

Use the backend's test endpoint to simulate dongle data:

```bash
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This injects test data directly into Redis without requiring the ESP32 hardware.

## 📊 Service Configuration

### Dongle Service Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `SERIAL_PORT` | `/dev/ttyUSB0` | USB serial port for ESP32 |
| `SERIAL_BAUD` | `115200` | Baud rate |
| `REDIS_HOST` | `redis` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_CHANNEL` | `dongle:data` | Pub/sub channel |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

### Backend Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | PostgreSQL connection | Database connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection |
| `JWT_SECRET` | (required) | JWT signing key |
| `ENCRYPTION_KEY` | (required) | 32-char AES key |

## 🔍 Monitoring and Debugging

### Check Service Health

```bash
# All services status
docker-compose ps

# Specific service logs
docker-compose logs -f dongle-service
docker-compose logs -f backend

# Follow all logs
docker-compose logs -f
```

### Redis Pub/Sub Monitoring

```bash
# Subscribe to dongle data channel
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data

# Should show messages when ESP32 sends data
```

### Debug Dongle Communication

```bash
# Read raw serial data
docker-compose exec dongle-service cat /dev/ttyUSB0

# Enable debug logging
docker-compose run -e LOG_LEVEL=DEBUG dongle-service
```

### Database Inspection

```bash
# Open Prisma Studio
docker-compose up -d prisma-studio

# Access at: http://localhost:5555
# Check Device model for dongle fields
```

## 🚦 Future: Port Scanner Microservice

**Planned Architecture**:

```
┌────────────────────┐
│  Port Scanner      │
│  Microservice      │
│  (Python/Nmap)     │
│  Docker Container  │
└─────────┬──────────┘
          │ Redis Pub/Sub
          │ (port-scan:results)
          ▼
┌────────────────────┐
│  Dashboard Backend │
│  (Node.js)         │
└────────────────────┘
```

**Data Format** (future):
```json
{
  "scanId": "scan-uuid",
  "ipAddress": "192.168.1.100",
  "hostname": "airguard-ap-001",
  "openPorts": [22, 80, 443],
  "services": {
    "22": "SSH",
    "80": "HTTP",
    "443": "HTTPS"
  },
  "deviceType": "access_point",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "scannedAt": "2025-11-17T10:30:45Z"
}
```

**Implementation Steps**:
1. Create `port-scanner/` directory
2. Write Python scanner using `nmap` or `scapy`
3. Publish results to `port-scan:results` Redis channel
4. Update backend to subscribe and create devices
5. Add to `docker-compose.yml`

## ✅ Benefits of This Architecture

### 1. **Decoupling**
- Services can be developed, tested, and deployed independently
- No tight coupling between ESP32 code and dashboard
- Easy to swap implementations (e.g., different scanning tools)

### 2. **Scalability**
- Run multiple dongle services for multiple USB ports
- Scale backend independently from data collectors
- Redis pub/sub handles message distribution

### 3. **Reliability**
- Service failures are isolated
- Auto-restart with `restart: unless-stopped`
- Redis message buffering during brief outages

### 4. **Maintainability**
- Clear separation of concerns
- Each service has focused responsibility
- Easy to understand and debug

### 5. **Flexibility**
- Add new data sources without changing backend
- Replace Python gateway with Go/Rust version
- Test with simulated data easily

## 📝 Development Workflow

### Adding a New Microservice

1. **Create service directory**:
   ```bash
   mkdir my-service/
   ```

2. **Write service code** (any language):
   ```python
   # my-service/service.py
   import redis
   import json

   r = redis.Redis(host='redis', port=6379)

   data = {"key": "value"}
   r.publish('my-channel', json.dumps(data))
   ```

3. **Create Dockerfile**:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["python", "service.py"]
   ```

4. **Add to docker-compose.yml**:
   ```yaml
   my-service:
     build: ./my-service
     depends_on:
       - redis
     networks:
       - airguard-network
   ```

5. **Update backend** to subscribe to `my-channel`

### Testing Microservices

```bash
# Build and start service
docker-compose up --build my-service

# Watch logs
docker-compose logs -f my-service

# Test Redis communication
docker-compose exec redis redis-cli
> SUBSCRIBE my-channel
```

## 📚 Additional Resources

- **Dongle Service**: See `dongle-service/README.md`
- **Local Testing**: See `LOCAL_TESTING_GUIDE.md`
- **Backend API**: See `CLAUDE.md` and API documentation
- **Docker Compose**: Official docs at https://docs.docker.com/compose/

---

**Last Updated**: 2025-11-17
**Microservices**: 1 active (dongle), 1 planned (port-scanner)
**Communication**: Redis Pub/Sub
**Deployment**: Docker Compose

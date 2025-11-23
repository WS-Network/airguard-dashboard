# ESP32 Dongle - Quick Start Guide

**Fast setup for dockerized ESP32 dongle integration with Airguard dashboard**

---

## ⚡ Quick Start (5 Minutes)

### Option A: With ESP32 Hardware

```bash
# 1. Find your ESP32 USB port
ls /dev/ttyUSB* /dev/ttyACM*
# Example output: /dev/ttyUSB0

# 2. Update docker-compose.yml if needed
# Edit line 95-96 to match your serial port:
#   devices:
#     - "/dev/ttyUSB0:/dev/ttyUSB0"

# 3. Start all services
docker-compose up -d

# 4. Check dongle service logs
docker-compose logs -f dongle-service

# Expected output:
# ✅ Serial port opened: /dev/ttyUSB0 @ 115200
# ✅ Redis connected: redis:6379
# ✅ Published to Redis: A3F5B21C -> dongle:data
```

### Option B: Without ESP32 (Testing)

```bash
# 1. Start backend services only (no dongle)
docker-compose up -d postgres redis backend

# 2. Use test endpoint to simulate dongle press
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Check backend received data
docker-compose logs backend | grep "dongle"
```

---

## 🎯 End-to-End Test

### 1. Fix User Organization (if needed)

```bash
# Run organization fix script
npm run db:fix-orgs
```

### 2. Start Dashboard Frontend

```bash
cd ../airguard-frontend
npm run dev
```

### 3. Login and Test

1. Open browser: `http://localhost:3000`
2. Login with your credentials
3. Navigate to Device Setup
4. Click **"Use GPS"** button
5. Press button on ESP32 sender dongle
6. **Result**: Modal shows GPS coordinates + IMU sensor data

---

## 📊 Architecture Overview

```
┌────────────────┐
│  ESP32 Sender  │ ← User presses button
└───────┬────────┘
        │ ESP-NOW (wireless)
        ▼
┌────────────────┐
│ ESP32 Receiver │ ← USB dongle plugged into machine
└───────┬────────┘
        │ USB Serial (/dev/ttyUSB0)
        ▼
┌────────────────────┐
│  Dongle Service    │ ← Python container reads serial
│  (Docker)          │
└────────┬───────────┘
         │ Redis Pub/Sub (dongle:data)
         ▼
┌────────────────────┐
│  Backend API       │ ← Node.js subscribes to Redis
│  (Docker)          │
└────────┬───────────┘
         │ PostgreSQL (stores 19 fields)
         ▼
┌────────────────────┐
│  Frontend UI       │ ← React displays GPS + IMU data
│  (Next.js)         │
└────────────────────┘
```

---

## 🔧 Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis backend dongle-service

# Stop all services
docker-compose down

# Restart dongle service
docker-compose restart dongle-service

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f dongle-service
docker-compose logs -f backend
```

### Debugging

```bash
# Check which services are running
docker-compose ps

# Check Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG

# Subscribe to dongle data manually
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data
# Press ESP32 button - should show JSON message

# Check PostgreSQL connection
docker-compose exec postgres psql -U airguard_user -d airguard_db -c "SELECT 1;"

# Open Prisma Studio (database GUI)
docker-compose up -d prisma-studio
# Open: http://localhost:5555
```

### USB Serial Port Troubleshooting

```bash
# Linux: Check USB device detected
dmesg | grep tty
# Should show: USB device detected

# Linux: Add user to dialout group
sudo usermod -aG dialout $USER
# Log out and back in

# Check serial port permissions
ls -l /dev/ttyUSB0
# Should show: crw-rw---- 1 root dialout

# Test reading from serial port
cat /dev/ttyUSB0
# Should show ESP32 output when button pressed

# Inside Docker container
docker-compose exec dongle-service cat /dev/ttyUSB0
```

---

## 📦 Data Fields

When ESP32 button is pressed, **19 dongle fields** are stored in PostgreSQL:

### GPS Data (7 fields)
- `latitude`, `longitude`, `altitude` - GPS coordinates
- `gpsAccuracy`, `heading` - GPS quality metrics
- `dongleGpsFix` - GPS fix status (0=no fix, 1=fix)
- `dongleSatellites` - Number of satellites (0-12)

### IMU Sensors (7 fields)
- `accelerometerX`, `accelerometerY`, `accelerometerZ` - m/s²
- `gyroscopeX`, `gyroscopeY`, `gyroscopeZ` - rad/s
- `temperature` - °C

### Metadata (5 fields)
- `dongleBatchId` - Unique 8-char hex ID
- `dongleSessionMs` - Session duration in milliseconds
- `dongleSampleCount` - Number of IMU samples collected
- `dongleDateYMD`, `dongleTimeHMS`, `dongleMsec` - Timestamp

---

## ✅ Verification Checklist

**Backend**:
- [ ] `docker-compose ps` shows all services running
- [ ] `docker-compose logs dongle-service` shows "Serial port opened"
- [ ] `docker-compose logs backend` shows "Server started on port 3001"
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok"}`

**Dongle Service**:
- [ ] ESP32 receiver plugged in and detected (`ls /dev/ttyUSB*`)
- [ ] Serial port matches in docker-compose.yml
- [ ] Dongle logs show "Redis connected"
- [ ] Pressing ESP32 button shows "Published to Redis"

**Database**:
- [ ] Prisma Studio accessible at `http://localhost:5555`
- [ ] Device model shows all 19 dongle fields
- [ ] After pairing, device record populated with sensor data

**Frontend**:
- [ ] User has `organizationId` assigned (run `npm run db:fix-orgs`)
- [ ] Login successful
- [ ] "Use GPS" button triggers pairing
- [ ] Modal displays GPS coordinates and IMU data

---

## 🚀 Next Steps

### For Development:

1. **Test without hardware**:
   ```bash
   python dongle-service/test-gateway.py
   ```

2. **Enable debug logging**:
   ```bash
   docker-compose run -e LOG_LEVEL=DEBUG dongle-service
   ```

3. **Inspect database**:
   ```bash
   docker-compose up -d prisma-studio
   # Open: http://localhost:5555
   ```

### For Production:

1. **Secure secrets**: Update `.env` with production keys
2. **Use environment-specific configs**: Separate `.env.production`
3. **Monitor logs**: Set up log aggregation (ELK, Datadog, etc.)
4. **Health checks**: Monitor service availability
5. **USB reliability**: Consider USB hub with power management

### Add Port Scanner Microservice:

Follow the same pattern as dongle service:

1. Create `port-scanner/` directory
2. Write Python/Nmap scanner
3. Publish to Redis channel `port-scan:results`
4. Update backend to subscribe
5. Add to `docker-compose.yml`

See `MICROSERVICES.md` for detailed architecture guide.

---

## 📚 Documentation

- **Architecture**: `MICROSERVICES.md` - Complete microservices overview
- **Dongle Service**: `dongle-service/README.md` - Service-specific docs
- **Local Testing**: `LOCAL_TESTING_GUIDE.md` - Comprehensive testing guide
- **Backend API**: `CLAUDE.md` - Backend codebase guide

---

## 🆘 Support

**Issue**: 403 Forbidden when clicking "Use GPS"

**Solution**: Run `npm run db:fix-orgs` and re-login

---

**Issue**: Serial port permission denied

**Solution**: Add user to dialout group:
```bash
sudo usermod -aG dialout $USER
```

---

**Issue**: No data received from dongle

**Solution**: Check serial port connection:
```bash
cat /dev/ttyUSB0  # Should show ESP32 output
```

---

**Issue**: Redis connection failed

**Solution**: Ensure Redis is running:
```bash
docker-compose up -d redis
redis-cli ping  # Expected: PONG
```

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Status**: ✅ Production Ready

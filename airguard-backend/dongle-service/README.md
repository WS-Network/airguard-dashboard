# ESP32 Dongle Microservice

Standalone dockerized service that reads data from ESP32 receiver dongle and publishes to Redis for the Airguard dashboard.

## Architecture

```
ESP32 Receiver Dongle (USB Serial)
        ↓
  Dongle Gateway (Python)
        ↓
  Redis Pub/Sub (dongle:data channel)
        ↓
  Dashboard Backend (Node.js)
        ↓
  PostgreSQL Database
```

## Features

- ✅ Reads from ESP32 via USB serial port
- ✅ Parses both JSON and fenced block formats
- ✅ Publishes to Redis pub/sub channel
- ✅ Dockerized for easy deployment
- ✅ Standalone microservice (no database coupling)
- ✅ Automatic reconnection on errors

## Quick Start

### 1. Connect ESP32 Receiver

Plug the ESP32 receiver dongle into a USB port on your machine.

**Find the serial port**:

```bash
# Linux
ls /dev/ttyUSB* /dev/ttyACM*

# macOS
ls /dev/tty.usb*

# Windows (in PowerShell)
Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Description
```

### 2. Configure Environment

```bash
cd dongle-service
cp .env.example .env

# Edit .env and set your serial port
nano .env
```

Update `SERIAL_PORT` to match your ESP32 device (e.g., `/dev/ttyUSB0`).

### 3. Run with Docker Compose

The dongle service is included in the main `docker-compose.yml`:

```bash
# From project root
docker-compose up dongle-service

# Or run all services
docker-compose up -d
```

### 4. Verify Connection

Check logs to ensure dongle data is being received:

```bash
docker-compose logs -f dongle-service
```

**Expected output**:
```
dongle-gateway | ESP32 Dongle Gateway v1.0
dongle-gateway | Serial: /dev/ttyUSB0 @ 115200
dongle-gateway | Redis: redis:6379
dongle-gateway | Channel: dongle:data
dongle-gateway | Serial port opened: /dev/ttyUSB0 @ 115200
dongle-gateway | Published to Redis: A3F5B21C -> dongle:data
```

## Standalone Usage (Without Docker)

If you prefer to run the gateway directly:

```bash
cd dongle-service

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SERIAL_PORT=/dev/ttyUSB0
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Run gateway
python gateway.py
```

## Data Format

The gateway publishes JSON messages to the Redis channel `dongle:data`:

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
  "receivedTs": "2025-11-17T10:30:45.123456Z"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERIAL_PORT` | `/dev/ttyUSB0` | USB serial port for ESP32 |
| `SERIAL_BAUD` | `115200` | Baud rate for serial communication |
| `REDIS_HOST` | `redis` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_CHANNEL` | `dongle:data` | Redis pub/sub channel name |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

## Troubleshooting

### Serial Port Permission Denied

**Linux**: Add your user to the `dialout` group:

```bash
sudo usermod -aG dialout $USER
# Log out and back in for changes to take effect
```

**Docker**: Grant USB device access in `docker-compose.yml`:

```yaml
devices:
  - "/dev/ttyUSB0:/dev/ttyUSB0"
privileged: true  # Or use specific device permissions
```

### No Data Received

1. **Check ESP32 connection**:
   ```bash
   # Linux
   dmesg | grep tty

   # Should show: USB device detected
   ```

2. **Verify serial port**:
   ```bash
   # Test reading from serial port
   cat /dev/ttyUSB0

   # Should show ESP32 output
   ```

3. **Check baud rate**: Ensure `SERIAL_BAUD=115200` matches ESP32 configuration

### Redis Connection Failed

1. **Check Redis is running**:
   ```bash
   redis-cli ping
   # Expected: PONG
   ```

2. **Verify Redis host**: If running outside Docker, set `REDIS_HOST=localhost`

### Dashboard Not Receiving Data

1. **Verify Redis channel**: Both dongle service and dashboard backend must use the same channel (`dongle:data`)

2. **Check Redis pub/sub**:
   ```bash
   # Subscribe to channel manually
   redis-cli
   > SUBSCRIBE dongle:data

   # Should show messages when dongle button is pressed
   ```

3. **Check backend logs**:
   ```bash
   docker-compose logs -f backend

   # Should show: "Pairing session started"
   ```

## Integration with Dashboard

The dashboard backend automatically subscribes to the `dongle:data` Redis channel when a pairing session starts.

**Flow**:

1. User clicks "Use GPS" in dashboard
2. Backend creates pairing session
3. Backend subscribes to `dongle:data` Redis channel
4. User presses button on ESP32 sender dongle
5. ESP32 receiver receives data via ESP-NOW
6. Receiver sends data to gateway via serial port
7. Gateway publishes to Redis `dongle:data`
8. Backend receives message and creates/updates device
9. Dashboard shows GPS + IMU data

## Development

### Build Docker Image

```bash
docker build -t airguard-dongle-service .
```

### Run Container Manually

```bash
docker run --rm -it \
  --device=/dev/ttyUSB0 \
  -e REDIS_HOST=host.docker.internal \
  -e SERIAL_PORT=/dev/ttyUSB0 \
  airguard-dongle-service
```

### Enable Debug Logging

```bash
# In .env
LOG_LEVEL=DEBUG

# Or via environment variable
docker-compose run -e LOG_LEVEL=DEBUG dongle-service
```

## Testing Without ESP32 Hardware

You can test the integration using the backend's test endpoint:

```bash
# Simulate dongle button press
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This injects test data directly into Redis, bypassing the ESP32 hardware.

## Next Steps

- [ ] Connect ESP32 receiver dongle via USB
- [ ] Configure serial port in `.env`
- [ ] Start dongle service with `docker-compose up dongle-service`
- [ ] Test pairing from dashboard "Use GPS" button
- [ ] Verify device creation with all 19 dongle fields

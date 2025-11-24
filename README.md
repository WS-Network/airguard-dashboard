# 🛡️ AirGuard Dashboard - Complete IoT Monitoring System

**A comprehensive network and IoT monitoring platform for Jetson Orin Nano with ESP32 sensor integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Hardware Requirements](#hardware-requirements)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Components](#components)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## 🎯 Overview

AirGuard Dashboard is an integrated monitoring system that combines:
- **Network Monitoring** - Port scanning, device discovery, SNMP management
- **IoT Sensor Data** - GPS, IMU (accelerometer/gyroscope), temperature via ESP32
- **Real-time Dashboard** - Next.js frontend with live data visualization
- **Unified Database** - Single PostgreSQL database for all data

**Designed for:** Jetson Orin Nano deployment with all services auto-starting on boot.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    JETSON ORIN NANO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [ESP32 Receiver USB] ──► Python Gateway ──► MQTT (1883)        │
│                                                  │                │
│  [Ethernet Port] ───────► NetWatch (8080) ──────┤                │
│                                                  ▼                │
│                                          Backend (3001)          │
│                                                  │                │
│                                                  ▼                │
│                                          PostgreSQL              │
│                                                  ▲                │
│                                                  │                │
│                                          Frontend (3000)         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │ ESP-NOW Wireless
         │
    ┌────┴────┐
    │ ESP32   │ (Handheld GPS/IMU Dongle)
    │ Dongle  │ Press button 10s to transmit
    └─────────┘
```

### Data Flow

1. **Dongle Button Press (10s)** → ESP32 transmits GPS/IMU data via ESP-NOW
2. **ESP32 Receiver (USB)** → Python Gateway reads serial JSON
3. **Python Gateway** → Publishes to MQTT broker (`espnow/samples`)
4. **Backend DongleGateway** → Subscribes to MQTT, publishes to Redis
5. **Pairing Worker** → Creates/updates device in PostgreSQL
6. **Frontend** → Polls API, displays GPS data with checkmark ✓

**Network Scanning:**
1. **Ethernet Connection** → NetWatch detects network
2. **Port Scan** → Discovers devices on network
3. **SSH/SNMP** → Auto-configures SNMP on devices
4. **Backend Integration** → Stores scan results in PostgreSQL
5. **Frontend Display** → Shows discovered devices in setup table

---

## ✨ Features

### 🌐 Network Monitoring
- ✅ Automatic Ethernet detection
- ✅ Port scanning and device discovery
- ✅ SNMP auto-configuration via SSH
- ✅ WiFi interference detection
- ✅ Network health monitoring

### 📡 IoT Sensor Integration
- ✅ GPS location tracking (latitude, longitude, altitude)
- ✅ IMU sensor data (accelerometer, gyroscope)
- ✅ Temperature monitoring
- ✅ Real-time MQTT data streaming
- ✅ Device pairing with GPS sync

### 📊 Dashboard Features
- ✅ Real-time device monitoring
- ✅ Interactive map with device locations
- ✅ Network health metrics
- ✅ Alert system
- ✅ User authentication (JWT)
- ✅ Multi-organization support

### 🔧 System Features
- ✅ Auto-start on boot (systemd services)
- ✅ Unified PostgreSQL database
- ✅ Redis pub/sub for real-time updates
- ✅ WebSocket support (Socket.IO)
- ✅ RESTful API
- ✅ Automated deployment script

---

## 🖥️ Hardware Requirements

### Jetson Orin Nano
- **OS:** Ubuntu 20.04/22.04 (JetPack 5.x or 6.x)
- **Storage:** 32GB+ recommended
- **RAM:** 8GB minimum
- **Ports:**
  - 1x USB (for ESP32 receiver)
  - 1x Ethernet (for network scanning)

### ESP32 Hardware
- **Dongle (Transmitter):** ESP32 with GPS, MPU6050 (IMU), temperature sensor
- **Receiver:** ESP32 connected to Jetson via USB
- **Communication:** ESP-NOW protocol

---

## 🚀 Quick Start

### Prerequisites

```bash
# On Jetson Orin Nano
- Ubuntu 20.04/22.04
- Internet connection
- ESP32 receiver connected via USB
```

### One-Command Deployment

```bash
# If you have the repo locally
cd /path/to/airguard-dashboard
git pull origin claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
./deploy-local.sh
```

**OR**

```bash
# Fresh installation
git clone https://github.com/WS-Network/airguard-dashboard.git
cd airguard-dashboard
git checkout claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
./deploy-jetson.sh
```

The script will:
- Install all dependencies
- Setup PostgreSQL and Redis
- Build backend and frontend
- Create systemd services
- Start all services
- Enable auto-start on boot

**Time:** ~10-15 minutes

### Access Dashboard

```
http://YOUR_JETSON_IP:3000
```

---

## 📦 Components

### 1. Backend (`airguard-backend/`)
- **Tech:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Port:** 3001
- **Features:**
  - RESTful API
  - JWT authentication
  - Device management
  - GPS pairing system
  - NetWatch integration
  - WebSocket server (Socket.IO)

### 2. Frontend (`airguard-frontend/`)
- **Tech:** Next.js 14, React, TypeScript, Tailwind CSS
- **Port:** 3000
- **Features:**
  - Responsive dashboard UI
  - Interactive maps (Leaflet)
  - Real-time updates
  - Device setup wizard
  - User authentication

### 3. IoT Dongle System (`airguard-esp32-iot-postgresql/`)
- **MQTT Broker:** Aedes (Port 1883)
- **Python Gateway:** Serial → MQTT bridge
- **Features:**
  - ESP32 serial data parsing
  - MQTT publishing
  - SQLite backup storage

### 4. NetWatch (`netwatch.new/`)
- **Tech:** Python 3, Flask
- **Port:** 8080
- **Features:**
  - Network scanning (nmap)
  - WiFi monitoring
  - SNMP queries
  - SSH automation
  - REST API

---

## 🔌 API Documentation

### Backend API Base URL
```
http://localhost:3001/api
```

### Key Endpoints

#### Authentication
```
POST /api/auth/signup        - Create new user
POST /api/auth/login         - Login (returns JWT token)
POST /api/auth/logout        - Logout
GET  /api/auth/profile       - Get user profile
```

#### Devices
```
GET    /api/devices                    - List all devices
POST   /api/devices                    - Create device
GET    /api/devices/:id                - Get device details
PUT    /api/devices/:id                - Update device
DELETE /api/devices/:id                - Delete device
POST   /api/devices/pair/start         - Start GPS pairing
GET    /api/devices/pair/status/:id    - Check pairing status
POST   /api/devices/:id/gps-sync       - Sync GPS data
```

#### Network (NetWatch Integration)
```
GET  /api/network/connection-status    - Check Ethernet connection
POST /api/network/scan                 - Trigger port scan
GET  /api/network/discovered-devices   - Get scanned devices
POST /api/network/setup-snmp           - Auto-configure SNMP
GET  /api/network/wifi-devices         - WiFi devices
GET  /api/network/interference         - Interference data
```

### NetWatch API Base URL
```
http://localhost:8080/api
```

#### NetWatch Endpoints
```
GET  /api/status                       - Service health
GET  /api/connection                   - Network connection info
GET  /api/network/devices              - Discovered devices
POST /api/network/rescan               - Trigger rescan
GET  /api/wifi/devices                 - WiFi devices
```

---

## 🛠️ Deployment

### Automated Deployment (Recommended)

```bash
# For existing local repo
cd /home/user/airguard-dashboard
./deploy-local.sh
```

### Manual Deployment

See `DEVELOPMENT.md` for detailed manual setup instructions.

### Systemd Services Created

```
airguard-mqtt.service       - MQTT Broker
airguard-backend.service    - Backend API
airguard-frontend.service   - Next.js Frontend
airguard-dongle.service     - Python Gateway
airguard-netwatch.service   - Network Scanner
```

### Verify Deployment

```bash
# Check all services
systemctl list-units | grep airguard

# View logs
sudo journalctl -u airguard-backend -f
sudo journalctl -u airguard-frontend -f

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:8080/api/status
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status airguard-backend

# View detailed logs
sudo journalctl -u airguard-backend -n 50

# Restart service
sudo systemctl restart airguard-backend
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 PID
```

### Serial Port Not Found

```bash
# List available ports
ls -la /dev/ttyUSB* /dev/ttyACM*

# Add user to dialout group
sudo usermod -a -G dialout $USER
# Logout and login again
```

### Database Connection Failed

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U airguard_user -d airguard -h localhost -W
```

### NetWatch Permission Issues

```bash
# Grant network capabilities
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
```

---

## 👨‍💻 Development

### Project Structure

```
airguard-dashboard/
├── airguard-backend/           # Node.js API server
│   ├── src/
│   │   ├── controllers/        # API controllers
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Auth, validation
│   │   └── config/            # Configuration
│   └── prisma/                # Database schema
│
├── airguard-frontend/         # Next.js dashboard
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   └── services/         # API clients
│
├── airguard-esp32-iot/       # IoT dongle integration
│   ├── mqtt-broker/          # MQTT broker
│   └── host/python-gateway/  # Serial → MQTT
│
├── netwatch.new/             # Network scanner
│   ├── core/                 # Scanner logic
│   └── api/                  # REST API
│
├── deploy-local.sh           # Deployment script
└── DEVELOPMENT.md            # Development guide
```

### Environment Variables

**Backend (`.env`):**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/airguard
JWT_SECRET=your-secret-key
MQTT_BROKER=localhost
NETWATCH_URL=http://localhost:8080
ENABLE_DONGLE_GATEWAY=true
```

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running in Development Mode

```bash
# Backend
cd airguard-backend
npm run dev

# Frontend
cd airguard-frontend
npm run dev

# MQTT Broker
cd airguard-esp32-iot-postgresql/mqtt-broker
node broker.js

# Python Gateway
cd airguard-esp32-iot-postgresql/host/python-gateway
python3 gateway.py

# NetWatch
cd netwatch.new/core
sudo python3 netwatch_unified.py
```

### Database Migrations

```bash
cd airguard-backend

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

---

## 📝 Configuration Files

### Deployment Scripts
- `deploy-local.sh` - Deploy from existing repo
- `deploy-jetson.sh` - Fresh installation
- `start-integration.sh` - Start services (dev mode)
- `stop-integration.sh` - Stop services (dev mode)

### Documentation
- `README.md` - This file (complete overview)
- `DEVELOPMENT.md` - Development planning and tasks
- `MASTER_AI_PROMPT.md` - Original project specification

---

## 🔐 Security Notes

- Change default database passwords in production
- Generate unique JWT secrets
- Use HTTPS in production
- Implement rate limiting (already configured)
- Regularly update dependencies

---

## 📊 Monitoring

### View All Services

```bash
# Real-time monitoring
watch -n 2 'systemctl status airguard-* --no-pager | grep -E "Active:|airguard-"'
```

### Live Logs

```bash
# All services
sudo journalctl -u 'airguard-*' -f

# Specific service
sudo journalctl -u airguard-backend -f
```

### System Health

```bash
# Backend health
curl http://localhost:3001/health

# NetWatch status
curl http://localhost:8080/api/status

# Database connection
psql -U airguard_user -d airguard -h localhost -c "\conninfo"
```

---

## 🤝 Contributing

See `DEVELOPMENT.md` for:
- Development workflow
- Code standards
- Testing procedures
- Contribution guidelines

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For issues or questions:
- Check troubleshooting section above
- Review `DEVELOPMENT.md` for detailed guides
- Check service logs: `sudo journalctl -u airguard-* -f`

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Frontend accessible at `http://JETSON_IP:3000`
- [ ] Backend responds at `http://JETSON_IP:3001/health`
- [ ] NetWatch responds at `http://JETSON_IP:8080/api/status`
- [ ] PostgreSQL running and accessible
- [ ] Redis running
- [ ] All systemd services active
- [ ] ESP32 receiver detected (if connected)
- [ ] Ethernet connection detected (if connected)
- [ ] Services auto-start on reboot

---

**Built for Jetson Orin Nano | Deployed via systemd | Production-ready**

🚀 **Ready to deploy? Run `./deploy-local.sh` and you're good to go!**

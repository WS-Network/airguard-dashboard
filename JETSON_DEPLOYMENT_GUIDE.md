# 🚀 AirGuard Dashboard - Jetson Orin Nano Deployment Guide

##

 📋 **System Overview**

All components run on **Jetson Orin Nano**:
- ✅ Main Dashboard (Frontend + Backend)
- ✅ IoT Dongle Gateway (Python serial reader + MQTT)
- ✅ NetWatch (Network scanner + SNMP)
- ✅ PostgreSQL Database (unified for all data)
- ✅ Redis (pub/sub for dongle pairing)
- ✅ MQTT Broker (dongle data distribution)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     JETSON ORIN NANO                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ESP32 Receiver (USB) ──► Python Gateway ──► MQTT Broker            │
│                                                  │                    │
│  Ethernet Port ──────────► NetWatch API         ▼                    │
│                              │               Backend ────► PostgreSQL│
│                              │                  ▲                     │
│                              └──────────────────┘                     │
│                                                  │                    │
│                                             Frontend                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **Prerequisites**

### 1. System Requirements
```bash
- Jetson Orin Nano with JetPack 5.x or 6.x
- Ubuntu 20.04/22.04
- 32GB+ storage
- ESP32 receiver connected via USB
- Ethernet cable (for network scanning)
```

### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install system tools
sudo apt install -y git curl wget build-essential

# Install network scanning tools (for NetWatch)
sudo apt install -y nmap netdiscover scapy wireshark-common ethtool

# Install Python packages for NetWatch
pip3 install scapy netifaces psutil requests flask python-nmap
```

---

## 📦 **Installation Steps**

### Step 1: Clone Repository
```bash
cd ~
git clone https://github.com/WS-Network/airguard-dashboard.git
cd airguard-dashboard
```

### Step 2: Setup PostgreSQL Database
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER airguard_user WITH PASSWORD 'airguard_password';
CREATE DATABASE airguard OWNER airguard_user;
GRANT ALL PRIVILEGES ON DATABASE airguard TO airguard_user;
\q
EOF

# Verify connection
psql -U airguard_user -d airguard -h localhost -W
# Password: airguard_password
# Type \q to exit
```

### Step 3: Setup Backend
```bash
cd ~/airguard-dashboard/airguard-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env with your settings
nano .env
# Set DATABASE_URL, JWT_SECRET, etc.

# Run Prisma migrations
npx prisma migrate dev
npx prisma generate

# Build backend
npm run build
```

### Step 4: Setup Frontend
```bash
cd ~/airguard-dashboard/airguard-frontend

# Install dependencies
npm install

# Setup environment
echo "DATABASE_URL=postgresql://airguard_user:airguard_password@localhost:5432/airguard" > .env
echo "JWT_SECRET=your-secret-key-change-this" >> .env
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:3001" >> .env
echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> .env

# Build frontend
npm run build
```

### Step 5: Setup MQTT Broker
```bash
cd ~/airguard-dashboard/airguard-esp32-iot-postgresql/mqtt-broker

# Install dependencies
npm install
```

### Step 6: Setup Python Gateway (Dongle Reader)
```bash
cd ~/airguard-dashboard/airguard-esp32-iot-postgresql/host/python-gateway

# Install dependencies
pip3 install -r requirements.txt

# Configure serial port (find your ESP32 USB device)
ls /dev/ttyUSB* /dev/ttyACM*
# Update .env with correct SERIAL_PORT
```

### Step 7: Setup NetWatch
```bash
cd ~/airguard-dashboard/netwatch.new

# Install dependencies
pip3 install -r requirements.txt

# Make sure your user has network scanning permissions
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
```

---

## 🚀 **Jetson Boot Configuration**

### Create Systemd Services

#### 1. PostgreSQL (Already installed)
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 2. Redis Service
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### 3. MQTT Broker Service
```bash
sudo nano /etc/systemd/system/airguard-mqtt.service
```

```ini
[Unit]
Description=AirGuard MQTT Broker
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/airguard-dashboard/airguard-esp32-iot-postgresql/mqtt-broker
ExecStart=/usr/bin/node broker.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME
sudo sed -i 's/YOUR_USERNAME/'$(whoami)'/g' /etc/systemd/system/airguard-mqtt.service

# Enable service
sudo systemctl enable airguard-mqtt
sudo systemctl start airguard-mqtt
```

#### 4. Backend Service
```bash
sudo nano /etc/systemd/system/airguard-backend.service
```

```ini
[Unit]
Description=AirGuard Backend API
After=network.target postgresql.service redis-server.service airguard-mqtt.service
Requires=postgresql.service redis-server.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/airguard-dashboard/airguard-backend
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME
sudo sed -i 's/YOUR_USERNAME/'$(whoami)'/g' /etc/systemd/system/airguard-backend.service

# Enable service
sudo systemctl enable airguard-backend
sudo systemctl start airguard-backend
```

#### 5. Frontend Service
```bash
sudo nano /etc/systemd/system/airguard-frontend.service
```

```ini
[Unit]
Description=AirGuard Frontend
After=network.target airguard-backend.service
Requires=airguard-backend.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/airguard-dashboard/airguard-frontend
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME
sudo sed -i 's/YOUR_USERNAME/'$(whoami)'/g' /etc/systemd/system/airguard-frontend.service

# Enable service
sudo systemctl enable airguard-frontend
sudo systemctl start airguard-frontend
```

#### 6. Python Gateway Service (Dongle Reader)
```bash
sudo nano /etc/systemd/system/airguard-dongle.service
```

```ini
[Unit]
Description=AirGuard IoT Dongle Gateway
After=network.target airguard-mqtt.service
Requires=airguard-mqtt.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/airguard-dashboard/airguard-esp32-iot-postgresql/host/python-gateway
ExecStart=/usr/bin/python3 gateway.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME
sudo sed -i 's/YOUR_USERNAME/'$(whoami)'/g' /etc/systemd/system/airguard-dongle.service

# Enable service
sudo systemctl enable airguard-dongle
sudo systemctl start airguard-dongle
```

#### 7. NetWatch Service
```bash
sudo nano /etc/systemd/system/airguard-netwatch.service
```

```ini
[Unit]
Description=AirGuard NetWatch Network Scanner
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/YOUR_USERNAME/airguard-dashboard/netwatch.new/core
ExecStart=/usr/bin/python3 netwatch_unified.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Replace YOUR_USERNAME
sudo sed -i 's/YOUR_USERNAME/'$(whoami)'/g' /etc/systemd/system/airguard-netwatch.service

# Enable service
sudo systemctl enable airguard-netwatch
sudo systemctl start airguard-netwatch
```

### Reload Systemd and Check Services
```bash
sudo systemctl daemon-reload

# Check all services
sudo systemctl status airguard-mqtt
sudo systemctl status airguard-backend
sudo systemctl status airguard-frontend
sudo systemctl status airguard-dongle
sudo systemctl status airguard-netwatch
```

---

## 🔍 **Verification & Testing**

### 1. Check Services are Running
```bash
# Quick check all services
systemctl --user list-units | grep airguard
sudo systemctl list-units | grep airguard

# Check logs
sudo journalctl -u airguard-backend -f
sudo journalctl -u airguard-frontend -f
sudo journalctl -u airguard-netwatch -f
```

### 2. Test Endpoints
```bash
# Backend health
curl http://localhost:3001/health

# NetWatch status
curl http://localhost:8080/api/status

# Frontend (open in browser)
# http://localhost:3000
```

### 3. Test Ethernet Detection
```bash
# Via NetWatch directly
curl http://localhost:8080/api/connection

# Via Backend
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/network/connection-status
```

### 4. Test Dongle Data Flow
```bash
# Monitor MQTT messages
mosquitto_sub -h localhost -t espnow/samples -v

# Press dongle button (10s hold) and watch for data
```

---

## 🌐 **Access Points**

After successful deployment:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://JETSON_IP:3000 | Main dashboard UI |
| **Backend API** | http://JETSON_IP:3001 | REST API |
| **NetWatch API** | http://JETSON_IP:8080 | Network scanner API |
| **MQTT Broker** | mqtt://JETSON_IP:1883 | MQTT messages |
| **PostgreSQL** | JETSON_IP:5432 | Database |

---

## 🐛 **Troubleshooting**

### Service Won't Start
```bash
# Check service status
sudo systemctl status airguard-backend

# View logs
sudo journalctl -u airguard-backend -n 50

# Restart service
sudo systemctl restart airguard-backend
```

### Port Already in Use
```bash
# Find process using port 3001
sudo lsof -i :3001

# Kill process
sudo kill -9 PID
```

### Serial Port Not Found
```bash
# List serial devices
ls -la /dev/ttyUSB* /dev/ttyACM*

# Add user to dialout group
sudo usermod -a -G dialout $USER

# Logout and login again
```

### NetWatch Permission Issues
```bash
# Grant network capabilities
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)

# Run as root (systemd service already configured)
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U airguard_user -d airguard -h localhost -W

# Reset password if needed
sudo -u postgres psql
ALTER USER airguard_user WITH PASSWORD 'new_password';
```

---

## 🔄 **Updating the System**

```bash
cd ~/airguard-dashboard

# Pull latest changes
git pull origin main

# Update backend
cd airguard-backend
npm install
npx prisma migrate deploy
npm run build
sudo systemctl restart airguard-backend

# Update frontend
cd ../airguard-frontend
npm install
npm run build
sudo systemctl restart airguard-frontend

# Update NetWatch
cd ../netwatch.new
pip3 install -r requirements.txt --upgrade
sudo systemctl restart airguard-netwatch
```

---

## 📊 **Monitoring**

### View All Logs in Real-Time
```bash
# Create monitoring script
cat > ~/monitor-airguard.sh << 'EOF'
#!/bin/bash
echo "=== AirGuard System Monitor ==="
echo ""

while true; do
    clear
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           AIRGUARD DASHBOARD - SERVICE STATUS                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    systemctl is-active --quiet postgresql && echo "✓ PostgreSQL: RUNNING" || echo "✗ PostgreSQL: STOPPED"
    systemctl is-active --quiet redis-server && echo "✓ Redis: RUNNING" || echo "✗ Redis: STOPPED"
    systemctl is-active --quiet airguard-mqtt && echo "✓ MQTT Broker: RUNNING" || echo "✗ MQTT Broker: STOPPED"
    systemctl is-active --quiet airguard-backend && echo "✓ Backend: RUNNING" || echo "✗ Backend: STOPPED"
    systemctl is-active --quiet airguard-frontend && echo "✓ Frontend: RUNNING" || echo "✗ Frontend: STOPPED"
    systemctl is-active --quiet airguard-dongle && echo "✓ Dongle Gateway: RUNNING" || echo "✗ Dongle Gateway: STOPPED"
    systemctl is-active --quiet airguard-netwatch && echo "✓ NetWatch: RUNNING" || echo "✗ NetWatch: STOPPED"

    echo ""
    echo "Press Ctrl+C to exit..."
    sleep 5
done
EOF

chmod +x ~/monitor-airguard.sh
~/monitor-airguard.sh
```

---

## ✅ **Post-Deployment Checklist**

- [ ] All systemd services enabled and running
- [ ] Frontend accessible at http://JETSON_IP:3000
- [ ] Backend API responds at http://JETSON_IP:3001/health
- [ ] NetWatch API responds at http://JETSON_IP:8080/api/status
- [ ] Ethernet connection detected (if connected)
- [ ] MQTT broker receiving dongle data
- [ ] PostgreSQL database accessible
- [ ] Redis pub/sub working
- [ ] Services auto-start on reboot

---

## 🎯 **Next Steps**

1. **Configure Firewall** (if needed)
   ```bash
   sudo ufw allow 3000/tcp  # Frontend
   sudo ufw allow 3001/tcp  # Backend
   sudo ufw allow 8080/tcp  # NetWatch
   ```

2. **Setup Nginx Reverse Proxy** (optional, for production)
3. **Configure SSL/TLS** (for HTTPS)
4. **Setup automatic backups** for PostgreSQL

---

**🚀 Your AirGuard Dashboard is now running on Jetson Orin Nano!**

All services will automatically start on boot, and the system is ready for production use.

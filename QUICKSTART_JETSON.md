# 🚀 Quick Start - Jetson Deployment

## **Using Claude Code's "Open in CLI"**

### **Step 1: Connect to Jetson**
1. Click **"Open in CLI"** button in Claude Code
2. SSH into your Jetson:
   ```bash
   ssh YOUR_USERNAME@JETSON_IP
   # Example: ssh nvidia@192.168.1.100
   ```

### **Step 2: Run Automated Setup**
```bash
# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/WS-Network/airguard-dashboard/claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk/deploy-jetson.sh | bash
```

**OR if you already have the repo:**
```bash
cd ~/airguard-dashboard
git pull
./deploy-jetson.sh
```

That's it! The script will:
- ✅ Install all dependencies (Node.js, Python, PostgreSQL, Redis, etc.)
- ✅ Setup database and services
- ✅ Build backend and frontend
- ✅ Create systemd services
- ✅ Start everything automatically
- ✅ Enable auto-start on boot

### **Step 3: Access Dashboard**
```
Open in browser: http://JETSON_IP:3000
```

---

## 📋 **Manual Method (If Script Fails)**

### 1. Install Dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip postgresql redis-server
```

### 2. Clone Repository
```bash
cd ~
git clone https://github.com/WS-Network/airguard-dashboard.git
cd airguard-dashboard
git checkout claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
```

### 3. Setup Database
```bash
sudo -u postgres psql << EOF
CREATE USER airguard_user WITH PASSWORD 'airguard_password';
CREATE DATABASE airguard OWNER airguard_user;
GRANT ALL PRIVILEGES ON DATABASE airguard TO airguard_user;
EOF
```

### 4. Setup Backend
```bash
cd airguard-backend
npm install
cp .env.example .env
# Edit .env with your settings
npx prisma migrate deploy
npx prisma generate
npm run build
```

### 5. Setup Frontend
```bash
cd ../airguard-frontend
npm install
npm run build
```

### 6. Run Services
```bash
# Terminal 1 - MQTT Broker
cd ~/airguard-dashboard/airguard-esp32-iot-postgresql/mqtt-broker
npm install && node broker.js

# Terminal 2 - Backend
cd ~/airguard-dashboard/airguard-backend
npm run start

# Terminal 3 - Frontend
cd ~/airguard-dashboard/airguard-frontend
npm run start

# Terminal 4 - Dongle Gateway
cd ~/airguard-dashboard/airguard-esp32-iot-postgresql/host/python-gateway
python3 gateway.py

# Terminal 5 - NetWatch
cd ~/airguard-dashboard/netwatch.new/core
sudo python3 netwatch_unified.py
```

---

## 🔍 **Verify Everything is Running**

```bash
# Check services
sudo systemctl status airguard-backend
sudo systemctl status airguard-frontend
sudo systemctl status airguard-dongle
sudo systemctl status airguard-netwatch

# Check logs
sudo journalctl -u airguard-backend -f
sudo journalctl -u airguard-frontend -f

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:8080/api/status
```

---

## 🐛 **Troubleshooting**

### Service Won't Start
```bash
# Check what went wrong
sudo journalctl -u airguard-backend -n 50 --no-pager

# Restart service
sudo systemctl restart airguard-backend
```

### Can't Connect to Serial Port
```bash
# Add user to dialout group
sudo usermod -a -G dialout $USER

# Logout and login again
exit
# SSH back in

# Check available ports
ls -la /dev/ttyUSB* /dev/ttyACM*
```

### Port Already in Use
```bash
# Find and kill process
sudo lsof -i :3001
sudo kill -9 PID
```

---

## 📊 **Monitor Services**

```bash
# Real-time monitoring
watch -n 2 'systemctl status airguard-* --no-pager | grep -E "Active:|airguard-"'
```

---

## ✅ **Success!**

Access your dashboard at:
```
http://JETSON_IP:3000
```

All services will automatically start on reboot!

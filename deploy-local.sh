#!/bin/bash

###############################################################################
# AirGuard Dashboard - Local Deployment (No Git Clone)
# Run this from your existing airguard-dashboard directory
###############################################################################

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
INSTALL_DIR=$(pwd)
DB_NAME="airguard"
DB_USER="airguard_user"
DB_PASS="airguard_password"
CURRENT_USER=$(whoami)

if [ "$CURRENT_USER" = "root" ]; then
    echo -e "${RED}Error: Do not run this script as root or with sudo${NC}"
    echo -e "${YELLOW}Run as your normal user: ./deploy-local.sh${NC}"
    exit 1
fi

# Logo
clear
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           AirGuard Dashboard - Local Deployment             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}Deploying from: $INSTALL_DIR${NC}\n"
sleep 2

###############################################################################
# 1. Install Dependencies
###############################################################################
echo -e "${BLUE}[1/9] Installing system packages...${NC}"
sudo apt update
sudo apt install -y \
    curl wget git build-essential \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib \
    redis-server \
    nmap netdiscover \
    ethtool net-tools \
    mosquitto-clients \
    || echo -e "${YELLOW}Some packages may already be installed${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${GREEN}✓ Node.js already installed: $(node -v)${NC}"
fi

# Install Python packages
echo -e "${BLUE}Installing Python packages...${NC}"
pip3 install --upgrade pip
pip3 install scapy netifaces psutil requests flask python-nmap paho-mqtt pyserial python-dotenv

###############################################################################
# 2. Setup PostgreSQL
###############################################################################
echo -e "${BLUE}[2/9] Setting up PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql << EOF || echo -e "${YELLOW}Database may already exist${NC}"
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF

echo -e "${GREEN}✓ PostgreSQL configured${NC}"

###############################################################################
# 3. Setup Redis
###############################################################################
echo -e "${BLUE}[3/9] Setting up Redis...${NC}"
sudo systemctl start redis-server
sudo systemctl enable redis-server
echo -e "${GREEN}✓ Redis configured${NC}"

###############################################################################
# 4. Setup Backend
###############################################################################
echo -e "${BLUE}[4/9] Setting up Backend...${NC}"
cd "$INSTALL_DIR/airguard-backend"

npm install

# Create .env
cat > .env << EOF
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

REDIS_HOST=localhost
REDIS_PORT=6379

MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_TOPIC=espnow/samples
ENABLE_DONGLE_GATEWAY=true

SERIAL_PORT=/dev/ttyUSB0

NETWATCH_URL=http://localhost:8080

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
EOF

npx prisma migrate deploy
npx prisma generate
npm run build

echo -e "${GREEN}✓ Backend configured${NC}"

###############################################################################
# 5. Setup Frontend
###############################################################################
echo -e "${BLUE}[5/9] Setting up Frontend...${NC}"
cd "$INSTALL_DIR/airguard-frontend"

npm install

cat > .env.local << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

npm run build

echo -e "${GREEN}✓ Frontend configured${NC}"

###############################################################################
# 6. Setup MQTT Broker
###############################################################################
echo -e "${BLUE}[6/9] Setting up MQTT Broker...${NC}"
cd "$INSTALL_DIR/airguard-esp32-iot-postgresql/mqtt-broker"
npm install
echo -e "${GREEN}✓ MQTT Broker configured${NC}"

###############################################################################
# 7. Setup Python Gateway
###############################################################################
echo -e "${BLUE}[7/9] Setting up Python Gateway...${NC}"
cd "$INSTALL_DIR/airguard-esp32-iot-postgresql/host/python-gateway"

if [ ! -f .env ]; then
    cat > .env << EOF
SERIAL_PORT=/dev/ttyUSB0
SERIAL_BAUD=115200
SQLITE_DB=airguard.db
MQTT_BROKER=127.0.0.1
MQTT_PORT=1883
MQTT_TOPIC=espnow/samples
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_QOS=1
CLOUD_POST_URL=
CLOUD_AUTH_TOKEN=
LOG_LEVEL=INFO
EOF
fi

sudo usermod -a -G dialout $CURRENT_USER

echo -e "${GREEN}✓ Python Gateway configured${NC}"

###############################################################################
# 8. Setup NetWatch
###############################################################################
echo -e "${BLUE}[8/9] Setting up NetWatch...${NC}"
cd "$INSTALL_DIR/netwatch.new"

pip3 install -r requirements.txt

sudo setcap cap_net_raw,cap_net_admin=eip $(which python3) || echo -e "${YELLOW}NetWatch will run as root${NC}"

echo -e "${GREEN}✓ NetWatch configured${NC}"

###############################################################################
# 9. Create Systemd Services
###############################################################################
echo -e "${BLUE}[9/9] Creating systemd services...${NC}"

# MQTT Service
sudo tee /etc/systemd/system/airguard-mqtt.service > /dev/null << EOF
[Unit]
Description=AirGuard MQTT Broker
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR/airguard-esp32-iot-postgresql/mqtt-broker
ExecStart=/usr/bin/node broker.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Backend Service
sudo tee /etc/systemd/system/airguard-backend.service > /dev/null << EOF
[Unit]
Description=AirGuard Backend API
After=network.target postgresql.service redis-server.service airguard-mqtt.service
Requires=postgresql.service redis-server.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR/airguard-backend
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Frontend Service
sudo tee /etc/systemd/system/airguard-frontend.service > /dev/null << EOF
[Unit]
Description=AirGuard Frontend
After=network.target airguard-backend.service
Requires=airguard-backend.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR/airguard-frontend
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Dongle Service
sudo tee /etc/systemd/system/airguard-dongle.service > /dev/null << EOF
[Unit]
Description=AirGuard IoT Dongle Gateway
After=network.target airguard-mqtt.service
Requires=airguard-mqtt.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR/airguard-esp32-iot-postgresql/host/python-gateway
ExecStart=/usr/bin/python3 gateway.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# NetWatch Service
sudo tee /etc/systemd/system/airguard-netwatch.service > /dev/null << EOF
[Unit]
Description=AirGuard NetWatch Network Scanner
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/netwatch.new/core
ExecStart=/usr/bin/python3 netwatch_unified.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

echo -e "${CYAN}Enabling services...${NC}"
sudo systemctl enable airguard-mqtt
sudo systemctl enable airguard-backend
sudo systemctl enable airguard-frontend
sudo systemctl enable airguard-dongle
sudo systemctl enable airguard-netwatch

echo -e "${GREEN}✓ Services created and enabled${NC}"

###############################################################################
# 10. Start Services
###############################################################################
echo -e "${BLUE}Starting services...${NC}"

sudo systemctl start airguard-mqtt
sleep 2
sudo systemctl start airguard-backend
sleep 3
sudo systemctl start airguard-frontend
sleep 2
sudo systemctl start airguard-dongle
sleep 1
sudo systemctl start airguard-netwatch

echo -e "${GREEN}✓ All services started${NC}"

###############################################################################
# Verification
###############################################################################
echo -e "\n${BLUE}Checking service status...${NC}\n"

services=("postgresql" "redis-server" "airguard-mqtt" "airguard-backend" "airguard-frontend" "airguard-dongle" "airguard-netwatch")

for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo -e "  ${GREEN}✓${NC} $service: RUNNING"
    else
        echo -e "  ${RED}✗${NC} $service: STOPPED"
    fi
done

JETSON_IP=$(hostname -I | awk '{print $1}')

###############################################################################
# Success
###############################################################################
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║         🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉             ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}📊 Access Points:${NC}"
echo -e "  ${GREEN}►${NC} Frontend:     http://$JETSON_IP:3000"
echo -e "  ${GREEN}►${NC} Backend API:  http://$JETSON_IP:3001"
echo -e "  ${GREEN}►${NC} NetWatch API: http://$JETSON_IP:8080"
echo -e ""
echo -e "${CYAN}📝 Useful Commands:${NC}"
echo -e "  ${GREEN}►${NC} Check services:  sudo systemctl status airguard-*"
echo -e "  ${GREEN}►${NC} View logs:       sudo journalctl -u airguard-backend -f"
echo -e "  ${GREEN}►${NC} Restart all:     sudo systemctl restart airguard-*"
echo -e ""
echo -e "${YELLOW}⚠️  Important:${NC} Logout and login again for serial port access"
echo -e ""
echo -e "${GREEN}✅ Installation complete! Open http://$JETSON_IP:3000${NC}\n"

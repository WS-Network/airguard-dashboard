#!/bin/bash

###############################################################################
# AirGuard Dashboard - Jetson Orin Nano Automated Deployment
# This script sets up everything needed to run the dashboard on Jetson
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/WS-Network/airguard-dashboard.git"
INSTALL_DIR="$HOME/airguard-dashboard"
DB_NAME="airguard"
DB_USER="airguard_user"
DB_PASS="airguard_password"
CURRENT_USER=$(whoami)

# Logo
clear
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           AirGuard Dashboard - Jetson Deployment            ║
║                                                              ║
║              Automated Installation Script                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}Starting deployment...${NC}\n"
sleep 2

###############################################################################
# 1. System Updates and Dependencies
###############################################################################
echo -e "${BLUE}[1/10] Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

echo -e "${BLUE}[2/10] Installing required packages...${NC}"
sudo apt install -y \
    curl wget git build-essential \
    python3 python3-pip python3-venv \
    postgresql postgresql-contrib \
    redis-server \
    nmap netdiscover \
    ethtool net-tools \
    mosquitto-clients \
    || echo -e "${YELLOW}Some packages may already be installed${NC}"

# Install Node.js 18 if not present
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
# 2. Clone/Update Repository
###############################################################################
echo -e "${BLUE}[3/10] Setting up repository...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Repository exists, pulling latest changes...${NC}"
    cd "$INSTALL_DIR"
    git fetch origin
    git checkout claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
    git pull origin claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
else
    echo -e "${GREEN}Cloning repository...${NC}"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    git checkout claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
fi

###############################################################################
# 3. Setup PostgreSQL
###############################################################################
echo -e "${BLUE}[4/10] Configuring PostgreSQL database...${NC}"

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF || echo -e "${YELLOW}Database may already exist${NC}"
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF

echo -e "${GREEN}✓ PostgreSQL configured${NC}"

###############################################################################
# 4. Setup Redis
###############################################################################
echo -e "${BLUE}[5/10] Configuring Redis...${NC}"
sudo systemctl start redis-server
sudo systemctl enable redis-server
echo -e "${GREEN}✓ Redis configured${NC}"

###############################################################################
# 5. Setup Backend
###############################################################################
echo -e "${BLUE}[6/10] Setting up Backend...${NC}"
cd "$INSTALL_DIR/airguard-backend"

# Install dependencies
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
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
    echo -e "${GREEN}✓ Backend .env created${NC}"
fi

# Run database migrations
echo -e "${CYAN}Running database migrations...${NC}"
npx prisma migrate deploy
npx prisma generate

# Build backend
echo -e "${CYAN}Building backend...${NC}"
npm run build

echo -e "${GREEN}✓ Backend configured${NC}"

###############################################################################
# 6. Setup Frontend
###############################################################################
echo -e "${BLUE}[7/10] Setting up Frontend...${NC}"
cd "$INSTALL_DIR/airguard-frontend"

# Install dependencies
npm install

# Create .env file
cat > .env.local << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Build frontend
echo -e "${CYAN}Building frontend...${NC}"
npm run build

echo -e "${GREEN}✓ Frontend configured${NC}"

###############################################################################
# 7. Setup MQTT Broker
###############################################################################
echo -e "${BLUE}[8/10] Setting up MQTT Broker...${NC}"
cd "$INSTALL_DIR/airguard-esp32-iot-postgresql/mqtt-broker"
npm install
echo -e "${GREEN}✓ MQTT Broker configured${NC}"

###############################################################################
# 8. Setup Python Gateway
###############################################################################
echo -e "${BLUE}[9/10] Setting up Python Gateway (Dongle Reader)...${NC}"
cd "$INSTALL_DIR/airguard-esp32-iot-postgresql/host/python-gateway"

# Create .env if doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || cat > .env << EOF
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

# Add user to dialout group for serial access
sudo usermod -a -G dialout $CURRENT_USER

echo -e "${GREEN}✓ Python Gateway configured${NC}"

###############################################################################
# 9. Setup NetWatch
###############################################################################
echo -e "${BLUE}[10/10] Setting up NetWatch...${NC}"
cd "$INSTALL_DIR/netwatch.new"

# Install Python dependencies
pip3 install -r requirements.txt

# Grant network capabilities
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3) || echo -e "${YELLOW}Will need to run NetWatch as root${NC}"

echo -e "${GREEN}✓ NetWatch configured${NC}"

###############################################################################
# 10. Create Systemd Services
###############################################################################
echo -e "${BLUE}Creating systemd services...${NC}"

# MQTT Broker Service
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

# Python Gateway Service
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

# Reload systemd
sudo systemctl daemon-reload

# Enable all services
echo -e "${CYAN}Enabling services to start on boot...${NC}"
sudo systemctl enable airguard-mqtt
sudo systemctl enable airguard-backend
sudo systemctl enable airguard-frontend
sudo systemctl enable airguard-dongle
sudo systemctl enable airguard-netwatch

echo -e "${GREEN}✓ Systemd services created and enabled${NC}"

###############################################################################
# 11. Start All Services
###############################################################################
echo -e "${BLUE}Starting all services...${NC}"

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
# 12. Verification
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

# Get Jetson IP
JETSON_IP=$(hostname -I | awk '{print $1}')

###############################################################################
# Success Message
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
echo -e "  ${GREEN}►${NC} Check service status:    sudo systemctl status airguard-backend"
echo -e "  ${GREEN}►${NC} View backend logs:       sudo journalctl -u airguard-backend -f"
echo -e "  ${GREEN}►${NC} View frontend logs:      sudo journalctl -u airguard-frontend -f"
echo -e "  ${GREEN}►${NC} View dongle logs:        sudo journalctl -u airguard-dongle -f"
echo -e "  ${GREEN}►${NC} View netwatch logs:      sudo journalctl -u airguard-netwatch -f"
echo -e "  ${GREEN}►${NC} Restart all services:    sudo systemctl restart airguard-*"
echo -e ""
echo -e "${CYAN}🔍 Monitor All Services:${NC}"
echo -e "  ${GREEN}►${NC} watch -n 2 'systemctl status airguard-* --no-pager | grep -E \"Active:|airguard-\"'"
echo -e ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "  • Services will auto-start on reboot"
echo -e "  • Connect ESP32 dongle via USB to /dev/ttyUSB0"
echo -e "  • Connect Ethernet cable for network scanning"
echo -e "  • You may need to logout/login for serial port access"
echo -e ""
echo -e "${GREEN}✅ Installation complete! Open http://$JETSON_IP:3000 in your browser${NC}\n"

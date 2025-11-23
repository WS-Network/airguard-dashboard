#!/bin/bash

###################################################
# AirGuard Dashboard - Full Integration Startup
###################################################

echo "🚀 Starting AirGuard Dashboard Integration..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are already running
check_service() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for service
wait_for_service() {
    local port=$1
    local service=$2
    local max_wait=30
    local count=0

    echo -n "Waiting for $service (port $port)..."
    while ! nc -z localhost $port 2>/dev/null; do
        sleep 1
        count=$((count + 1))
        if [ $count -gt $max_wait ]; then
            echo -e " ${YELLOW}timeout${NC}"
            return 1
        fi
    done
    echo -e " ${GREEN}✓${NC}"
    return 0
}

echo "📋 Checking prerequisites..."

# Check if PostgreSQL is running
if ! nc -z localhost 5432 2>/dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running on port 5432${NC}"
    echo "Please start PostgreSQL first:"
    echo "  sudo systemctl start postgresql"
    echo "  OR docker-compose up -d postgres"
    exit 1
fi

# Check if Redis is running
if ! nc -z localhost 6379 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Redis not running on port 6379${NC}"
    echo "Please start Redis first:"
    echo "  sudo systemctl start redis"
    echo "  OR docker-compose up -d redis"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL and Redis are running${NC}"
echo ""

#=================================================
# 1. Start MQTT Broker (Port 1883)
#=================================================
echo -e "${BLUE}1️⃣  Starting MQTT Broker...${NC}"
cd airguard-esp32-iot-postgresql/mqtt-broker || exit 1

if check_service 1883; then
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing MQTT broker dependencies..."
        npm install
    fi

    # Start MQTT broker in background
    nohup node broker.js > ../../logs/mqtt-broker.log 2>&1 &
    echo $! > ../../logs/mqtt-broker.pid

    wait_for_service 1883 "MQTT Broker"
fi

cd ../..

#=================================================
# 2. Start Backend (Port 3001)
#=================================================
echo -e "${BLUE}2️⃣  Starting Backend API...${NC}"
cd airguard-backend || exit 1

if check_service 3001; then
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi

    # Run Prisma migrations
    echo "Running database migrations..."
    npx prisma migrate dev --name init

    # Generate Prisma client
    npx prisma generate

    # Start backend in background
    nohup npm run dev > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid

    wait_for_service 3001 "Backend API"
fi

cd ..

#=================================================
# 3. Start Frontend (Port 3000)
#=================================================
echo -e "${BLUE}3️⃣  Starting Frontend Dashboard...${NC}"
cd airguard-frontend || exit 1

if check_service 3000; then
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi

    # Start frontend in background
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid

    wait_for_service 3000 "Frontend"
fi

cd ..

echo ""
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 Frontend:    http://localhost:3000"
echo "  🔌 Backend API: http://localhost:3001"
echo "  📡 MQTT Broker: mqtt://localhost:1883"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "  Backend:      tail -f logs/backend.log"
echo "  Frontend:     tail -f logs/frontend.log"
echo "  MQTT Broker:  tail -f logs/mqtt-broker.log"
echo ""
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo "  ./stop-integration.sh"
echo ""

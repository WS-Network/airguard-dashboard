#!/bin/bash

###################################################
# AirGuard Dashboard - Stop All Services
###################################################

echo "🛑 Stopping AirGuard Dashboard services..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to stop service by PID file
stop_service() {
    local name=$1
    local pidfile="logs/${name}.pid"

    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if ps -p $pid > /dev/null 2>&1; then
            echo -n "Stopping $name (PID: $pid)..."
            kill $pid
            sleep 2
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
            fi
            echo -e " ${GREEN}✓${NC}"
        fi
        rm -f "$pidfile"
    fi
}

# Stop services in reverse order
stop_service "frontend"
stop_service "backend"
stop_service "mqtt-broker"

echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo "Log files preserved in ./logs/"

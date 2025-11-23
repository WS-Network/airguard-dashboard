#!/bin/bash

# Netwatch Dashboard Launcher
# Starts both the monitoring system and web dashboard

echo "=================================================="
echo "  🚀 Starting Netwatch Dashboard System"
echo "=================================================="
echo ""

# Check if running as root for WiFi features
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Note: Running without sudo"
    echo "   WiFi monitoring requires sudo for full functionality"
    echo ""
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start the Netwatch monitoring system in background
echo "📡 Starting Netwatch monitoring system..."
cd "$SCRIPT_DIR/core" && python3 netwatch_unified.py &
NETWATCH_PID=$!

# Wait a moment for API to start
sleep 3

# Start the web dashboard server
echo "🌐 Starting web dashboard server..."
cd "$SCRIPT_DIR/web" && python3 server.py 8081 &
WEB_PID=$!

# Wait for servers to initialize
sleep 2

echo ""
echo "=================================================="
echo "  ✅ Netwatch Dashboard is Running!"
echo "=================================================="
echo ""
echo "📊 Dashboard:  http://localhost:8081"
echo "🔌 API:        http://localhost:8080/api/scan"
echo ""
echo "🔐 Login:      admin / admin"
echo ""
echo "=================================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $NETWATCH_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for processes
wait

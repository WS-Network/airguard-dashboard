#!/bin/bash

# Netwatch Setup Script
# Installs all system and Python dependencies

echo "=================================================="
echo "  Netwatch - Network Monitoring System Setup"
echo "=================================================="
echo ""

# Check if running with sudo for system packages
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Note: System packages require sudo access"
    echo "   You may be prompted for your password"
    echo ""
fi

# Install system dependencies
echo "📦 Installing system dependencies..."
echo "   (nmap, wireless-tools, iw, tcpdump, snmp)"
sudo apt update
sudo apt install -y \
    python3-pip \
    python3-dev \
    nmap \
    wireless-tools \
    iw \
    tcpdump \
    snmp \
    snmp-mibs-downloader

if [ $? -eq 0 ]; then
    echo "✅ System dependencies installed successfully"
else
    echo "❌ Failed to install system dependencies"
    exit 1
fi

echo ""
echo "📦 Installing Python dependencies..."

# Install Python dependencies
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo ""
echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "To run Netwatch:"
echo "  1. Basic mode:  sudo ./scripts/run/netwatch_unified.sh"
echo "  2. Direct run:  cd core && sudo python3 netwatch_unified.py"
echo ""
echo "Features:"
echo "  - Terminal Dashboard: Real-time monitoring in terminal"
echo "  - API Server: http://localhost:8080/api/scan"
echo "  - Web Dashboard: http://localhost:8080/dashboard"
echo ""
echo "Note: Run with sudo for full WiFi monitoring capabilities"
echo "=================================================="

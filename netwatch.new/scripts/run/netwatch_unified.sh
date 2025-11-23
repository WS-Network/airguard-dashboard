#!/bin/bash

# Netwatch Unified Runner - Terminal-based with API
# Main script to run the unified monitoring system

cd "$(dirname "$0")/../../core"

echo "🔍 Starting Netwatch Unified System..."
echo "   - Terminal-based monitoring"
echo "   - API endpoints for external integration"
echo "   - Web dashboard for graphs only"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  WARNING: Not running as root"
    echo "   WiFi monitor mode and network scanning require sudo/root access"
    echo "   Consider running with: sudo $0"
    echo ""
fi

# Run the unified script
sudo python3 netwatch_unified.py

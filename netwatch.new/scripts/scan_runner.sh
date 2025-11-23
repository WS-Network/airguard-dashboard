#!/bin/bash

# Set base path (project root)
# Auto-detect base directory (parent of scripts directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Auto-detect wireless interface
IFACE=$(iw dev | awk '$1=="Interface"{print $2}' | head -n1)
if [ -z "$IFACE" ]; then
    echo "[!] No wireless interface found. Please set IFACE manually."
    exit 1
fi
echo "[*] Using wireless interface: $IFACE"
PCAP_FILE="$BASE_DIR/data/captures/live_capture.pcap"

echo "[*] Step 1: Enable monitor mode"
bash "$BASE_DIR/scripts/enable_monitor_ai.sh" "$IFACE"

echo "[*] Step 2: Capture 60 seconds of traffic to $PCAP_FILE"
mkdir -p "$BASE_DIR/data/captures"
sudo timeout 60 tcpdump -i $IFACE -w $PCAP_FILE

echo "[*] Step 3: Run AI detection on PCAP"
# Note: pcap_runner.py may not exist, skip if missing
if [ -f "$BASE_DIR/core/pcap_runner.py" ]; then
    python3 "$BASE_DIR/core/pcap_runner.py" --input "$PCAP_FILE"
else
    echo "[!] pcap_runner.py not found, skipping PCAP analysis"
fi

echo "[*] Step 4: Cross-check with local network devices + remote access"
python3 "$BASE_DIR/core/Netdiscover.py"

echo "[✔] Full scan completed. Results saved in $BASE_DIR/logs/"



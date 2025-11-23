#!/bin/bash

# Auto-detect wireless interface if not provided as argument
IFACE="${1:-$(iw dev | awk '$1=="Interface"{print $2}' | head -n1)}"

if [ -z "$IFACE" ]; then
    echo "[!] No wireless interface found. Usage: $0 [interface_name]"
    echo "[!] Available interfaces:"
    iw dev
    exit 1
fi

echo "[*] Enabling monitor mode on $IFACE..."
sudo ip link set $IFACE down
sudo iw dev $IFACE set type monitor
sudo ip link set $IFACE up

echo "[✔] $IFACE is now in monitor mode."

# Netwatch Quick Start

## Run the System

```bash
cd /home/hawtsauce/Documents/WireStorm/netwatch
sudo ./scripts/run/netwatch_unified.sh
```

## What You Get

- **Terminal Dashboard**: All scan results displayed clearly
- **API Endpoints**: 
  - `GET http://localhost:8080/api/scan` - All scan results
  - `GET http://localhost:8080/api/wifi` - WiFi results
  - `GET http://localhost:8080/api/network` - Network results
- **Web Dashboard**: `http://localhost:8080/dashboard` (professional real-time dashboard with charts)

## Features

✅ Auto-detect wireless interface  
✅ Scan wireless (WiFi) and wired (LAN) networks  
✅ Detect bad frequencies and interference  
✅ Auto SSH login (admin/admin)  
✅ Retrieve SNMP data automatically  

## Output Files

All outputs saved to `output/` directory:
- `output/scans/` - JSON scan results
- `output/exports/` - Device exports (TXT)
- `output/models/` - AI models
- `output/static/` - Graphs (PNG)

## Requirements

- Linux (Kali Linux recommended)
- Python 3.8+
- Root/sudo access
- Wireless interface with monitor mode support

See `README.md` for detailed documentation.


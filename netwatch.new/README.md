# Netwatch - Unified Network Monitoring System

Terminal-based network monitoring with WiFi interference detection, device discovery, and automatic SSH/SNMP management.

## 🚀 Quick Start

```bash
cd /home/hawtsauce/Documents/WireStorm/netwatch
sudo ./scripts/run/netwatch_unified.sh
```

## ✨ Features

- ✅ **Auto-detect wireless interface** - Automatically finds and uses WiFi adapter
- ✅ **Scan wireless (WiFi) networks** - Real-time WiFi packet capture and analysis
- ✅ **Scan wired (LAN) networks** - Discovers all devices on local network
- ✅ **Detect bad frequencies** - Identifies problematic frequencies and interference
- ✅ **Auto SSH login** - Automatically logs into devices with admin/admin
- ✅ **SNMP data retrieval** - Gets SNMP data automatically after SSH login
- ✅ **Terminal-based monitoring** - Everything displayed clearly in terminal
- ✅ **API endpoints** - REST API for external web integration
- ✅ **Graph visualization** - Simple web dashboard for graphs only

## 📁 Project Structure

```
netwatch/
├── core/                           # Core Python modules
│   ├── netwatch_unified.py        # ⭐ Main unified script (USE THIS!)
│   ├── WifiScanner.py             # WiFi scanning & interference detection
│   └── Netdiscover.py             # Network device discovery & SNMP
│
├── scripts/                        # Scripts
│   ├── run/                       
│   │   └── netwatch_unified.sh    # ⭐ Main runner script (USE THIS!)
│   ├── enable_monitor_ai.sh       # Enable monitor mode
│   └── scan_runner.sh             # Full scan workflow
│
├── ai_model/                      # AI model training
│   └── train_model.py             # Train interference detection model
│
├── output/                        # ✅ All output files (organized)
│   ├── scans/                     # Scan results (JSON)
│   │   ├── interference_scan.json
│   │   ├── scan_results.json
│   │   ├── spectral_scan.json
│   │   ├── bad_frequencies.json
│   │   └── snmp_data_*.json
│   ├── exports/                   # Device exports (TXT)
│   │   └── export_output_*.txt
│   ├── models/                    # AI models (joblib)
│   │   └── wifi_rf_model.joblib
│   └── static/                    # Graphs and images (PNG)
│       └── spectrum_heatmap.png
│
├── data/                          # Data files
│   └── captures/                  # PCAP files
│
├── logs/                          # Log files
│   └── wifi_log.csv               # WiFi scan logs for training
│
├── docs/                          # Additional documentation
│   └── *.md                       # Detailed guides
│
├── README.md                      # Main documentation
├── QUICKSTART.md                  # Quick start guide
├── STRUCTURE.md                   # Project structure details
└── requirements.txt               # Python dependencies
```

## 🔧 Installation

### System Dependencies

```bash
sudo apt update
sudo apt install -y python3-pip python3-dev nmap wireless-tools iw tcpdump snmp snmp-mibs-downloader
```

### Python Dependencies

```bash
pip3 install -r requirements.txt
```

## 📊 Usage

### Run Unified System (Recommended)

```bash
sudo ./scripts/run/netwatch_unified.sh
```

### Terminal Dashboard

The terminal displays:
- **WiFi Scanner Status**: Devices detected, bad frequencies, interference
- **Network Discovery Status**: Devices found, SSH connections, SNMP data
- **Device List**: IP, MAC, vendor, ports, SSH status, SNMP data
- **Auto-updates** every 5 seconds

### API Endpoints

All scan results available via REST API:

```bash
# Get all scan results
curl http://localhost:8080/api/scan

# Get WiFi results only
curl http://localhost:8080/api/wifi

# Get network results only
curl http://localhost:8080/api/network
```

### Web Dashboard

Professional real-time monitoring dashboard:
- URL: `http://localhost:8080/dashboard`
- Features:
  - Real-time statistics and charts
  - WiFi devices visualization with signal strength
  - Network devices with SSH/SNMP status
  - Bad frequencies detection display
  - Interactive charts (signal distribution, frequency bands)
  - Auto-updates every 3 seconds
- All data: Also available via API endpoints

## 🔍 How It Works

### 1. WiFi Scanning
- Auto-detects wireless interface
- Enables monitor mode
- Captures WiFi packets in real-time
- Detects interference using AI + rule-based algorithms
- Identifies bad frequencies (high noise, interference, non-standard channels)
- Generates spectrum heatmaps

### 2. Network Discovery
- Auto-detects network subnet
- Scans for all devices (wired + wireless)
- Scans open ports on each device
- Detects operating systems
- Auto-logs into devices via SSH (admin/admin)
- Retrieves SNMP data automatically
- Exports MikroTik router configurations

### 3. Bad Frequency Detection
- **High noise detection**: Signals below -85 dBm
- **Strong interference**: Signals above -70 dBm
- **Non-standard channels**: 2.4GHz channels not 1, 6, 11
- **DFS channels**: Weather radar interference on 5GHz
- All bad frequencies shown in terminal with reasons

### 4. Auto SSH Login
- Automatically tries: admin/admin, admin/, root/admin, root/root, admin/password
- Works on ports 22 (SSH) and 23 (Telnet)
- Immediately retrieves SNMP data after successful login
- Status shown in terminal for each device

### 5. SNMP Data Retrieval
- Automatically gets SNMP data after SSH login
- For MikroTik: Enables SNMP, exports router configuration
- Retrieves: System info, uptime, CPU, memory, temperature, interfaces
- All data shown in terminal and available via API

## 📤 Output Files

All outputs organized in `output/` directory:

- `output/scans/` - Scan results (JSON)
  - `interference_scan.json` - WiFi interference data
  - `scan_results.json` - Network device discovery results
  - `spectral_scan.json` - Spectral scan data
  - `spectral_history.json` - Spectral history
  - `bad_frequencies.json` - Bad frequency detections
  - `snmp_data_*.json` - SNMP data per device

- `output/exports/` - Device exports (TXT)
  - `export_output_*.txt` - RouterOS export configurations

- `output/models/` - AI models (joblib)
  - `wifi_rf_model.joblib` - Trained interference detection model

- `output/static/` - Graphs and images (PNG)
  - `spectrum_heatmap.png` - Real-time spectrum heatmap
  - `cdf_spectrum.png` - CDF spectrum visualization

## 🎯 Verification

### ✅ Devices Appearing?
- Check terminal: "Network Devices Found: X"
- Check terminal: Device list with IP, MAC, vendor, ports

### ✅ Wireless Scan Working?
- Check terminal: "WiFi Devices Detected: X"
- Check terminal: Shows WiFi devices with MAC, signal, frequency
- Check API: `curl http://localhost:8080/api/wifi`

### ✅ Local Network Scan Working?
- Check terminal: "Network Devices Found: X"
- Check terminal: Shows device list
- Check API: `curl http://localhost:8080/api/network`

### ✅ Bad Frequencies Detected?
- Check terminal: "Bad Frequencies Found: X"
- Check terminal: Shows list of bad frequencies with reasons
- Check API: `curl http://localhost:8080/api/wifi | jq .bad_frequencies`

### ✅ SSH Auto-Login Working?
- Check terminal: "SSH Connected: X"
- Check terminal: Shows "connected" status for devices
- Check terminal: Shows SNMP data for connected devices

## 🛠️ Configuration

### Bad Frequency Thresholds

Edit `core/WifiScanner.py`:
```python
BAD_FREQUENCY_THRESHOLDS = {
    'high_noise': -85,      # Adjust noise threshold
    'high_interference': -70, # Adjust interference threshold
}
```

### Auto-Login Credentials

Edit `core/Netdiscover.py` in `auto_login_ssh_devices()`:
```python
auto_creds = [
    {'username': 'admin', 'password': 'admin'},
    # Add more credentials here
]
```

### Network Subnet

Edit `core/Netdiscover.py` in `detect_subnet()`:
```python
return "192.168.1.0/24"  # Change to your subnet
```

## 🔒 Security Notes

⚠️ **Important**:
- Requires sudo/root access for monitor mode and network scanning
- SSH credentials stored in memory (not saved to disk)
- Use only on networks you own or have permission to scan
- Monitor mode enables promiscuous mode on WiFi interface

## 📝 Requirements

- Linux (Kali Linux recommended)
- Python 3.8+
- Root/sudo access
- Wireless interface with monitor mode support
- Network tools: `nmap`, `iw`, `tcpdump`, `snmpget`

## 🐛 Troubleshooting

### No Devices Appearing
1. Check network connectivity: `ping 8.8.8.8`
2. Check subnet detection: Look for subnet in terminal
3. Check firewall: May be blocking scans
4. Check permissions: Need sudo/root
5. Check Nmap: `which nmap` and `sudo nmap -sn 192.168.1.0/24`

### No WiFi Devices
1. Check wireless interface: Should auto-detect
2. Check monitor mode: Should enable automatically
3. Check permissions: Need sudo/root
4. Check adapter: Ensure WiFi adapter supports monitor mode

### SSH Not Working
1. Check ports: Devices must have port 22 or 23 open
2. Check credentials: Uses admin/admin by default
3. Check network: Must be able to reach devices
4. Check firewall: May be blocking SSH connections

## 📚 Documentation

For more details, see:
- `docs/UNIFIED_GUIDE.md` - Complete unified system guide
- `docs/README_UNIFIED.md` - Unified system overview

## 🎉 Summary

**One command**: `sudo ./scripts/run/netwatch_unified.sh`

**Everything in terminal** - Clear, organized, auto-updating
**API for external** - All data available via REST API
**Web for graphs** - Simple dashboard showing graphs only
**All features work** - Wireless scan, network scan, bad frequencies, SSH, SNMP

Run it and see everything in terminal! 🚀

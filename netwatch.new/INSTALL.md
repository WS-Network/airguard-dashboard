# Netwatch Installation Guide

## Quick Install

### Option 1: Automated Setup (Recommended)
```bash
# Run the setup script (installs everything)
./setup.sh
```

### Option 2: Manual Installation

#### Step 1: Install System Dependencies
```bash
sudo apt update
sudo apt install -y python3-pip python3-dev nmap wireless-tools iw tcpdump snmp snmp-mibs-downloader
```

#### Step 2: Install Python Dependencies
```bash
pip3 install -r requirements.txt
```

## Python Dependencies Included

The `requirements.txt` file includes:

### Core Libraries
- **numpy** (>=1.17.3, <2.0.0) - Array processing
- **scipy** (>=1.8.0, <1.25.0) - Scientific computing
- **matplotlib** (>=3.0.0) - Visualization and graphs
- **scikit-learn** (>=1.0.0) - Machine learning for interference detection
- **joblib** (>=1.0.0) - Model persistence

### Network Monitoring
- **scapy** (>=2.4.0) - Packet capture and analysis
- **python-nmap** (>=0.7.1) - Network discovery and port scanning

### Remote Access & Monitoring
- **paramiko** (>=2.7.0) - SSH client for auto-login
- **pysnmp** (>=4.4.0) - SNMP queries for device monitoring

### Utilities
- **requests** (>=2.25.0) - HTTP requests for MAC vendor lookup
- **tabulate** (>=0.8.0) - Pretty-print tabular data

## System Requirements

- **OS**: Linux (Kali Linux recommended, also works on Ubuntu/Debian)
- **Python**: 3.8 or higher
- **Permissions**: Root/sudo access required for:
  - WiFi monitor mode
  - Network packet capture
  - Port scanning

## Verification

After installation, verify everything is working:

```bash
# Check Python packages
pip3 list | grep -E "numpy|scapy|paramiko|pysnmp|nmap"

# Check system tools
which nmap tcpdump
```

## Running Netwatch

### With Full Features (Recommended)
```bash
# Run with sudo for WiFi monitoring
sudo ./scripts/run/netwatch_unified.sh

# Or directly
cd core && sudo python3 netwatch_unified.py
```

### Without WiFi Features
```bash
# Network discovery only (no sudo needed)
cd core && python3 netwatch_unified.py
```

## Access Points

Once running:
- **Terminal Dashboard**: Main display in terminal (auto-updating)
- **API Endpoint**: http://localhost:8080/api/scan
- **Web Dashboard**: http://localhost:8080/dashboard (graphs only)

## Troubleshooting

### "python-nmap not installed"
```bash
pip3 install python-nmap
```

### "Failed to set monitor mode"
- Requires sudo/root access
- Run with: `sudo python3 netwatch_unified.py`

### NumPy version conflicts
```bash
pip3 install "numpy>=1.17.3,<2.0.0" --force-reinstall
```

### Port 8080 already in use
```bash
# Find and kill the process
lsof -i :8080
kill <PID>
```

## Virtual Environment (Optional)

For isolated dependencies:

```bash
# Create virtual environment
python3 -m venv netwatch-env

# Activate it
source netwatch-env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Netwatch
sudo ./netwatch-env/bin/python3 core/netwatch_unified.py
```

## Need Help?

Check the main documentation:
- `README.md` - Main documentation
- `QUICKSTART.md` - Quick start guide
- `STRUCTURE.md` - Project structure

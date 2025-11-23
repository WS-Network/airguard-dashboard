# Monitor Mode Control Guide

## Overview

Netwatch now provides **manual control** over WiFi monitor mode with interactive prompts and triggers.

---

## What Changed

### Before:
- Monitor mode was **automatically enabled** when starting netwatch
- No user control over when WiFi scanning starts
- Interface was reconfigured without asking

### Now:
- Network information is **displayed first**
- User is **prompted** to enable monitor mode
- Monitor mode can be **controlled via API**
- Dashboard shows **current monitor mode status**

---

## Startup Flow

When you run `sudo python3 netwatch_unified.py`, this happens:

### 1. Network Connection Detection
```
[INFO] NETWORK: Checking network connection...
[SUCCESS] NETWORK: Connected via ETHERNET (eth0)

================================================================================
                         🌐 NETWORK CONFIGURATION
================================================================================

  Connection Type:  ETHERNET
  Interface:        eth0
  MAC Address:      AA:BB:CC:DD:EE:FF
  IP Address:       192.168.1.100
  Subnet Mask:      255.255.255.0
  Gateway:          192.168.1.1
  DNS Servers:      8.8.8.8
                    8.8.4.4
  IP Assignment:    DHCP (Dynamic)
  Link Speed:       1000Mb/s

================================================================================
```

### 2. Monitor Mode Prompt
```
================================================================================
                         📡 WIFI MONITOR MODE
================================================================================

  Monitor mode allows WiFi packet capture and interference detection.
  This requires a wireless interface and will temporarily reconfigure it.

  Options:
    [Y] - Enable monitor mode and start WiFi scanning
    [N] - Skip monitor mode (only network discovery will run)
    [L] - Enable later (you can trigger manually)

================================================================================

  Your choice [Y/N/L]: _
```

### 3. User Choices

#### Option Y - Enable Now
- Monitor mode enabled immediately
- WiFi scanning starts
- Packet capture begins
- Dashboard shows: `🟢 Monitor Mode: ENABLED`

#### Option N - Skip
- Monitor mode disabled
- Only network discovery runs
- Dashboard shows: `🔴 Monitor Mode: DISABLED (use API to enable)`

#### Option L - Enable Later
- Monitor mode deferred
- System starts without WiFi scanning
- You can enable via API anytime
- Dashboard shows: `🔴 Monitor Mode: DISABLED (use API to enable)`

---

## Manual Control via API

### Check Monitor Mode Status
```bash
curl http://localhost:8080/api/wifi/monitor/status
```

**Response:**
```json
{
  "interface": "wlan0",
  "monitor_mode": false,
  "status": "disabled"
}
```

### Enable Monitor Mode
```bash
curl -X POST http://localhost:8080/api/wifi/monitor/enable
```

**Response:**
```json
{
  "status": "success",
  "interface": "wlan0",
  "mode": "monitor",
  "message": "Monitor mode enabled and scanning started"
}
```

### Disable Monitor Mode
```bash
curl -X POST http://localhost:8080/api/wifi/monitor/disable
```

**Response:**
```json
{
  "status": "success",
  "interface": "wlan0",
  "mode": "managed",
  "message": "Monitor mode disabled"
}
```

---

## Dashboard Display

The terminal dashboard now shows monitor mode status:

### When Enabled:
```
📡 WIFI SCANNER STATUS
--------------------------------------------------------------------------------
  🟢 Monitor Mode: ENABLED
  ✅ WiFi Devices Detected: 15
  🔴 Bad Frequencies Found: 3
  ⚠️  Interfering Devices: 2
```

### When Disabled:
```
📡 WIFI SCANNER STATUS
--------------------------------------------------------------------------------
  🔴 Monitor Mode: DISABLED (use API to enable)
  ✅ WiFi Devices Detected: 0
  🔴 Bad Frequencies Found: 0
  ⚠️  Interfering Devices: 0
```

---

## Python Integration Example

```python
import requests
import time

API_BASE = "http://localhost:8080"

# Check status
status = requests.get(f"{API_BASE}/api/wifi/monitor/status").json()
print(f"Monitor mode: {status['status']}")

if status['status'] == 'disabled':
    # Enable it
    print("Enabling monitor mode...")
    result = requests.post(f"{API_BASE}/api/wifi/monitor/enable").json()
    print(result['message'])

    # Wait for scanning to start
    time.sleep(5)

    # Check WiFi devices
    devices = requests.get(f"{API_BASE}/api/wifi/devices").json()
    print(f"Found {devices['count']} WiFi devices")
```

---

## JavaScript Integration Example

```javascript
const API_BASE = 'http://localhost:8080';

// Check and enable monitor mode
async function enableMonitorMode() {
  // Check current status
  const status = await fetch(`${API_BASE}/api/wifi/monitor/status`)
    .then(r => r.json());

  console.log(`Monitor mode: ${status.status}`);

  if (!status.monitor_mode) {
    // Enable it
    const result = await fetch(`${API_BASE}/api/wifi/monitor/enable`, {
      method: 'POST'
    }).then(r => r.json());

    console.log(result.message);

    // Wait for scanning to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get WiFi devices
    const devices = await fetch(`${API_BASE}/api/wifi/devices`)
      .then(r => r.json());

    console.log(`Found ${devices.count} WiFi devices`);
  }
}

enableMonitorMode();
```

---

## Web Dashboard Integration

The web dashboard at `http://localhost:8080/dashboard` will also show monitor mode status and allow you to enable/disable it with a button (if you want to add this feature to the HTML).

---

## Benefits

1. **User Control**: You decide when to enable monitor mode
2. **Network Info First**: See your connection details before reconfiguring interfaces
3. **Flexible Workflow**: Enable now, skip, or enable later via API
4. **Clear Status**: Dashboard always shows current monitor mode state
5. **API Integration**: External tools can control monitor mode programmatically

---

## Troubleshooting

### Monitor Mode Fails to Enable

**Check wireless interface:**
```bash
iw dev
```

**Manually enable:**
```bash
sudo ip link set wlan0 down
sudo iw dev wlan0 set type monitor
sudo ip link set wlan0 up
```

### Dashboard Shows "Disabled" After Enabling

- Check API response for errors
- Verify wireless interface exists
- Ensure running with root privileges
- Check system logs for driver issues

### API Returns 500 Error

- Ensure wireless interface supports monitor mode
- Check if interface is being used by NetworkManager
- Try disabling NetworkManager temporarily:
  ```bash
  sudo systemctl stop NetworkManager
  ```

---

## Summary

Monitor mode is now **fully controllable**:

1. ✅ Network info displayed before enabling
2. ✅ User prompted with 3 options (Y/N/L)
3. ✅ Manual API triggers available
4. ✅ Dashboard shows real-time status
5. ✅ Enable/disable anytime during runtime

**The system respects your choice and gives you full control over when and how WiFi monitoring happens!**

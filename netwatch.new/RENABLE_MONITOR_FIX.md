# Re-Enable Monitor Mode Fix

## Problem Fixed

Previously, if you chose "N" or "L" at startup, you couldn't re-enable monitor mode via API because the WiFi scanner wasn't running.

## Solution Implemented

1. **WiFi Scanner Always Starts** - The WiFi scanner module now always initializes, even if you choose not to enable monitor mode at startup
2. **Monitor Scan Runs in Thread** - When API enables monitor mode, it starts the scan in a separate background thread
3. **State Tracking** - Global `monitor_mode_enabled` flag tracks current status and updates dashboard

## How to Test

### Test 1: Choose "Later" at Startup

```bash
# Start netwatch
sudo python3 /home/hawtsauce/Documents/WireStorm/netwatch/core/netwatch_unified.py

# When prompted, choose: L
# Your choice [Y/N/L]: L

# You should see:
# [INFO] SYSTEM: WiFi Scanner ready - use API to enable monitor mode
```

**Then enable via API:**

```bash
# In another terminal
curl -X POST http://localhost:8080/api/wifi/monitor/enable
```

**Expected response:**
```json
{
  "status": "success",
  "interface": "wlan0",
  "mode": "monitor",
  "message": "Monitor mode enabled and scanning started"
}
```

**Check dashboard** - should now show:
```
🟢 Monitor Mode: ENABLED
```

### Test 2: Choose "No" at Startup

```bash
# Start netwatch
sudo python3 /home/hawtsauce/Documents/WireStorm/netwatch/core/netwatch_unified.py

# When prompted, choose: N
# Your choice [Y/N/L]: N

# You should see:
# [WARNING] SYSTEM: WiFi Scanner loaded (monitor mode disabled)
```

**Then enable via API:**

```bash
curl -X POST http://localhost:8080/api/wifi/monitor/enable
```

**Should work the same as Test 1!**

### Test 3: Re-enable After Disable

```bash
# Start netwatch and enable monitor mode
sudo python3 /home/hawtsauce/Documents/WireStorm/netwatch/core/netwatch_unified.py
# Choose: Y

# After it's running, disable via API
curl -X POST http://localhost:8080/api/wifi/monitor/disable

# Response:
{
  "status": "success",
  "interface": "wlan0",
  "mode": "managed",
  "message": "Monitor mode disabled"
}

# Now re-enable
curl -X POST http://localhost:8080/api/wifi/monitor/enable

# Response:
{
  "status": "success",
  "interface": "wlan0",
  "mode": "monitor",
  "message": "Monitor mode enabled and scanning started"
}
```

## What Changed in Code

### `/core/netwatch_unified.py`

**Before:**
```python
if monitor_choice == 'enable':
    wifi_thread = threading.Thread(target=run_wifi_scanner, daemon=True)
    wifi_thread.start()
elif monitor_choice == 'later':
    print("WiFi Scanner ready - use API to enable")
else:
    print("WiFi Scanner disabled")
```

**After:**
```python
# Always start WiFi Scanner (but maybe without monitor mode)
wifi_thread = threading.Thread(target=run_wifi_scanner, daemon=True, name="WifiScanner")
wifi_thread.start()

if monitor_choice == 'enable':
    print("WiFi Scanner started with monitor mode enabled")
elif monitor_choice == 'later':
    print("WiFi Scanner ready - use API to enable monitor mode")
else:
    print("WiFi Scanner loaded (monitor mode disabled)")
```

### `/api/rest_api.py`

**Key changes:**
- API endpoint now starts `WifiScanner.start_monitor_scan()` in a **new thread** called "MonitorScan"
- Checks if thread already exists before starting a new one
- Updates global `netwatch.monitor_mode_enabled` flag
- Better error handling with full traceback

**Enable endpoint logic:**
```python
# Enable monitor mode on interface
interface = WifiScanner.enable_monitor_mode()

# Update global state
netwatch.monitor_mode_enabled = True

# Start scan in background thread
def start_scan_thread():
    WifiScanner.start_monitor_scan()

scan_thread = threading.Thread(target=start_scan_thread, daemon=True, name="MonitorScan")
scan_thread.start()
```

## Debugging

If re-enable still doesn't work, check these:

### 1. Check Thread Status
```bash
# Look at netwatch terminal output for:
[*] API: Starting monitor scan thread...
```

### 2. Check Interface Status
```bash
iw dev wlan0 info | grep type
# Should show: type monitor
```

### 3. Check API Errors
```bash
# In netwatch terminal, look for:
[!] API: Error in monitor scan thread: ...
[!] Monitor enable error: ...
```

### 4. Manually Test Interface
```bash
# Bring interface down
sudo ip link set wlan0 down

# Set to monitor
sudo iw dev wlan0 set type monitor

# Bring it up
sudo ip link set wlan0 up

# Verify
iw dev wlan0 info | grep type
```

## Expected Behavior

✅ **Working correctly if:**
- Dashboard shows monitor mode status changes in real-time
- API enable/disable commands return success
- WiFi devices start appearing after enable
- Bad frequencies detected after enable
- Can toggle monitor mode on/off multiple times

❌ **Not working if:**
- API returns 500 error
- Dashboard doesn't update status
- No WiFi devices appear even after waiting
- Terminal shows "Error in monitor scan thread"

## Architecture

```
User Prompt [Y/N/L]
       ↓
monitor_mode_enabled = true/false
       ↓
WiFi Scanner Thread (ALWAYS STARTS)
  ├─ Data update loop (always running)
  ├─ Spectral scan (always running)
  └─ Monitor scan (only if enabled)
       ↓
API Enable Endpoint
  ├─ enable_monitor_mode()
  ├─ monitor_mode_enabled = true
  └─ Start MonitorScan thread
       ↓
Dashboard Updates (reads monitor_mode_enabled)
```

## Summary

The fix ensures:
1. WiFi Scanner infrastructure **always loads**
2. Monitor scan **only runs when requested**
3. API can **start/stop monitor scan thread** dynamically
4. Dashboard **reflects current state** accurately

You can now toggle monitor mode on and off as many times as you want during a single netwatch session!

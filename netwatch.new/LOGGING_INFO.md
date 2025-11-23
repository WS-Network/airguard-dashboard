# Netwatch Logging System

## ✅ What Was Added

I've added **comprehensive timestamp-based logging** to `netwatch_unified.py` that keeps a complete record of every run.

## 📁 Log File Location

Each time you run Netwatch, a new timestamped log file is created:

```
logs/netwatch_run_YYYYMMDD_HHMMSS.log
```

**Example:**
```
logs/netwatch_run_20251115_170530.log
logs/netwatch_run_20251115_183245.log
```

## 📊 What Gets Logged

### System Events
- ✅ Application startup with timestamp
- ✅ Python version and user info
- ✅ Working directory
- ✅ Root privilege status
- ✅ Component initialization (API, WiFi, Network)
- ✅ Shutdown events (Ctrl+C or errors)

### WiFi Scanner
- ✅ WiFi Scanner initialization
- ✅ WiFi devices detected (count changes)
- ✅ Bad frequencies found (count changes)
- ✅ Thread start/stop events
- ✅ Errors with full stack traces

### Network Discovery
- ✅ Network Discovery initialization
- ✅ Devices discovered (count changes)
- ✅ SSH connections established (count changes)
- ✅ Thread start/stop events
- ✅ Errors with full stack traces

### API Server
- ✅ API server startup
- ✅ API endpoints registration
- ✅ Server ready state
- ✅ Connection errors

### All Status Messages
- ✅ INFO messages
- ✅ SUCCESS messages
- ✅ WARNING messages
- ✅ ERROR messages with stack traces
- ✅ CRITICAL failures

## 📝 Log Format

Each log entry has this format:
```
YYYY-MM-DD HH:MM:SS [LEVEL] Component: Message
```

**Example:**
```
2025-11-15 17:05:30 [INFO] Netwatch: Starting main function
2025-11-15 17:05:30 [INFO] Netwatch: Python version: 3.10.12
2025-11-15 17:05:32 [INFO] Netwatch: ✓ API_SERVER: API server started at http://localhost:8080
2025-11-15 17:05:35 [INFO] Netwatch: WiFi Scanner thread started
2025-11-15 17:05:36 [INFO] Netwatch: Network devices discovered: 14
2025-11-15 17:05:40 [WARNING] Netwatch: SYSTEM: Not running as root - WiFi monitoring features will be limited
2025-11-15 17:06:15 [ERROR] Netwatch: WiFi Scanner fatal error: Failed to set wlP7p1s0 to monitor mode
```

## 🔍 How to View Logs

### View Latest Log
```bash
tail -f logs/netwatch_run_*.log | tail -1
```

### View Latest 50 Lines
```bash
tail -50 logs/netwatch_run_$(ls -t logs/ | head -1)
```

### Watch Log in Real-Time
```bash
tail -f logs/netwatch_run_$(ls -t logs/ | head -1)
```

### Search for Errors
```bash
grep ERROR logs/netwatch_run_*.log
```

### Search for Specific Device
```bash
grep "192.168.10.1" logs/netwatch_run_*.log
```

### Count Events
```bash
# Count devices discovered
grep "Network devices discovered" logs/netwatch_run_*.log | tail -1

# Count WiFi devices
grep "WiFi devices detected" logs/netwatch_run_*.log | tail -1
```

## 📊 Log Levels

- **INFO**: Normal operations, status updates
- **WARNING**: Non-critical issues (e.g., not running as root)
- **ERROR**: Failures that don't stop the system
- **CRITICAL**: Fatal errors that stop the system

## 🗂️ Log Management

### View All Log Files
```bash
ls -lh logs/netwatch_run_*.log
```

### Delete Old Logs (older than 7 days)
```bash
find logs/ -name "netwatch_run_*.log" -mtime +7 -delete
```

### Archive Logs
```bash
# Create archive of logs
tar -czf netwatch_logs_archive_$(date +%Y%m%d).tar.gz logs/

# Keep only last 30 days
find logs/ -name "netwatch_run_*.log" -mtime +30 -delete
```

## 🎯 Example Use Cases

### Debugging WiFi Issues
```bash
# Find all WiFi-related errors
grep "WiFi" logs/netwatch_run_*.log | grep -i error

# Check monitor mode failures
grep "monitor mode" logs/netwatch_run_*.log
```

### Track Device Discovery
```bash
# See device count over time
grep "Network devices discovered" logs/netwatch_run_*.log

# Check SSH connections
grep "SSH connections" logs/netwatch_run_*.log
```

### Audit System Starts
```bash
# List all runs
ls logs/netwatch_run_*.log

# Show startup info for each run
grep "NETWATCH UNIFIED MONITORING SYSTEM" logs/netwatch_run_*.log
```

### Performance Analysis
```bash
# Check when system components started
grep "Launching.*thread" logs/netwatch_run_*.log

# See how long components take to initialize
grep -E "(Starting|initialized)" logs/netwatch_run_*.log
```

## 🔄 Log Rotation

Logs are **automatically created with timestamps**, so you don't need rotation. Each run creates a new file.

**Recommended:** Clean up old logs periodically:

```bash
# Add to crontab to run weekly
0 0 * * 0 find /path/to/logs/ -name "netwatch_run_*.log" -mtime +30 -delete
```

## 📈 Benefits

✅ **Full Audit Trail** - Every run is logged
✅ **Timestamp-Based** - Easy to find logs by date/time
✅ **Detailed Errors** - Stack traces for all errors
✅ **Change Tracking** - Logs when devices appear/disappear
✅ **Performance Data** - Track system behavior over time
✅ **Debugging** - Comprehensive information for troubleshooting

## 🎉 Summary

Now every time you run Netwatch, you get:
- ✅ Timestamped log file in `logs/` directory
- ✅ Complete record of all events
- ✅ Both console output AND file logging
- ✅ Easy to search and analyze
- ✅ Automatic error tracking with stack traces

**Location:** `logs/netwatch_run_YYYYMMDD_HHMMSS.log`

**Example Run:**
```bash
cd core && python3 netwatch_unified.py
# Creates: ../logs/netwatch_run_20251115_170530.log
```

All logs are preserved with timestamps for future reference! 🚀

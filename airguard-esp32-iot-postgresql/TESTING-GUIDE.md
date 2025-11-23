# Dongle Button Press Simulation Guide

## Overview

This guide explains how to simulate dongle button presses for testing when you're away from your desk or don't have physical access to the hardware.

## Available Tools

### 1. Direct Data Injector (Recommended) ⭐

**File:** `inject-test-data.py`

**What it does:** Directly injects simulated sensor data into your gateway's processing pipeline (SQLite, MQTT, Cloud API) without needing any serial connections or running ESP32 devices.

**Use when:** You want to quickly test the complete data pipeline end-to-end.

#### Usage Examples

```bash
# Single button press simulation (all targets: SQLite, MQTT, Cloud)
python inject-test-data.py

# Inject with custom duration and samples
python inject-test-data.py --duration 15000 --samples 300

# Inject only to SQLite database
python inject-test-data.py --targets sqlite

# Inject to SQLite and MQTT only
python inject-test-data.py --targets sqlite mqtt

# Continuous mode - simulate button presses every 5 seconds
python inject-test-data.py --continuous --interval 5

# Preview generated JSON without injection
python inject-test-data.py --json
```

#### Example Output

```
============================================================
SIMULATING DONGLE BUTTON PRESS
============================================================
Batch ID: 0xD8B2A56B
Duration: 10000ms, Samples: 200
GPS: (33.889190, 35.496064), Sats: 7
Timestamp: 2025-11-16T18:07:13.554511+00:00

Injecting data to:
✓ SQLite: Stored batch D8B2A56B to airguard.db
✓ MQTT: Published batch D8B2A56B to 127.0.0.1:1883
✓ Cloud API: Posted batch D8B2A56B to http://localhost:8080/v1/samples

============================================================
✓ SIMULATION SUCCESSFUL - All targets updated
============================================================
```

---

### 2. Receiver Output Simulator

**File:** `simulate-dongle-press.py`

**What it does:** Generates output in the exact format that the ESP32 receiver produces over serial. This can be used for testing the gateway's parser or piped to other tools.

**Use when:** You want to test the serial parser or integrate with other tools that expect receiver format.

#### Usage Examples

```bash
# Single button press simulation (outputs receiver format)
python simulate-dongle-press.py

# Custom duration and samples
python simulate-dongle-press.py --duration 15000 --samples 300

# Continuous mode - output every 5 seconds
python simulate-dongle-press.py --continuous --interval 5

# Save to file for later use
python simulate-dongle-press.py > test_data.txt
```

#### Example Output

```
=== Received Data ===
Batch: 0x5C57C95D | Duration: 10000 ms | Samples: 200
GPS Fix: 1, Sats: 8 | Date: 20251116 | Time: 200727.694
Lat: 33.889424  Lon: 35.494586  Alt: 79.37 m
Accel [m/s^2] X: -0.35  Y: -0.14  Z: 9.68
Gyro  [rad/s] X: 0.08  Y: 0.03  Z: 0.07
Temp: 24.57 °C
====================
```

---

## Configuration

Both tools use the same configuration as your gateway (from `host/python-gateway/.env`):

- **SQLITE_DB**: SQLite database path (default: `airguard.db`)
- **MQTT_BROKER**: MQTT broker address (default: `127.0.0.1`)
- **MQTT_PORT**: MQTT port (default: `1883`)
- **MQTT_TOPIC**: MQTT topic (default: `espnow/samples`)
- **CLOUD_POST_URL**: Cloud API endpoint
- **CLOUD_AUTH_TOKEN**: Cloud API authentication token

## Requirements

```bash
pip install paho-mqtt requests python-dotenv
```

(These should already be installed from `requirements.txt`)

## Testing Scenarios

### Quick Test (Single Press)
```bash
# Inject one test packet to database only
python inject-test-data.py --targets sqlite
```

### Load Testing (Continuous)
```bash
# Simulate button presses every 3 seconds
python inject-test-data.py --continuous --interval 3
```

### Integration Testing
```bash
# Test all targets (SQLite + MQTT + Cloud)
python inject-test-data.py
```

### Parser Testing
```bash
# Generate receiver format output
python simulate-dongle-press.py
```

## Current ESP32 Setup

Based on your configuration:

- **Receiver**: Connected to `/dev/ttyACM0` (gateway reads from this)
- **Sender (Dongle)**: Connected to `/dev/ttyACM1`
- **Communication**: ESP-NOW on WiFi Channel 1
- **Receiver MAC**: `48:CA:43:9A:48:D0`

## Data Fields Generated

The simulators generate realistic test data:

| Field | Description | Example Value |
|-------|-------------|---------------|
| `batchId` | Unique batch identifier | `0x5A17C2EF` |
| `sessionMs` | Button press duration | `10000` (10s) |
| `samples` | Sensor samples collected | `200` |
| `dateYMD` | Date (YYYYMMDD) | `20251116` |
| `timeHMS` | Time (HHMMSS) | `132523` |
| `lat` / `lon` | GPS coordinates | `33.888630`, `35.495480` |
| `alt` | Altitude (meters) | `79.20` |
| `gpsFix` | GPS fix status | `1` (fixed) |
| `sats` | Satellite count | `5-10` |
| `ax`, `ay`, `az` | Acceleration (m/s²) | `-0.12`, `0.03`, `9.73` |
| `gx`, `gy`, `gz` | Gyroscope (rad/s) | `0.01`, `-0.02`, `0.00` |
| `tempC` | Temperature (°C) | `28.10` |

## Tips

1. **Verify Database**: Check stored data with:
   ```bash
   sqlite3 host/python-gateway/airguard.db "SELECT * FROM samples ORDER BY id DESC LIMIT 5;"
   ```

2. **Monitor MQTT**: Subscribe to MQTT topic:
   ```bash
   mosquitto_sub -h 127.0.0.1 -t "espnow/samples" -v
   ```

3. **Adjust GPS Coordinates**: Edit the scripts to use your actual location coordinates if needed (search for `lat` and `lon` variables).

4. **Continuous Testing**: Use `--continuous` mode with `--interval` to simulate regular button presses for sustained testing.

## Troubleshooting

- **MQTT errors**: Ensure the MQTT broker is running (`mosquitto`)
- **SQLite permission errors**: Check file permissions on `airguard.db`
- **Cloud API errors**: Verify `CLOUD_POST_URL` and `CLOUD_AUTH_TOKEN` in `.env`

---

**Created:** 2025-11-16
**Purpose:** Remote testing of AirGuard dongle functionality without physical access

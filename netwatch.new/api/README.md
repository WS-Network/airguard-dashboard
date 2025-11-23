# Netwatch API

Complete REST API for Netwatch Network Monitoring System.

## Quick Start

### Start the API Server

#### Option 1: Via Netwatch Unified (Recommended)
```bash
sudo python3 core/netwatch_unified.py
```

The API starts automatically on port 8080.

#### Option 2: Standalone API Server
```bash
sudo python3 api/rest_api.py
```

### Access the API

- **API Documentation**: http://localhost:8080/api/docs
- **Dashboard**: http://localhost:8080/dashboard
- **System Status**: http://localhost:8080/api/status

## Features

### System Endpoints
- ✅ System health check
- ✅ Network connection status (with full config: IP, subnet, gateway, DNS, DHCP/static)
- ✅ Unified scan results

### WiFi Scanner Endpoints
- ✅ List WiFi devices
- ✅ Device details
- ✅ Bad frequency detection
- ✅ Interference monitoring
- ✅ Spectral scan data
- ✅ Interface management
- ✅ Monitor mode control

### Network Discovery Endpoints
- ✅ Device discovery
- ✅ Port scanning
- ✅ SNMP data retrieval
- ✅ SSH login
- ✅ Vendor lookup
- ✅ Network rescan

## API Endpoints Summary

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **System** | `/api` | GET | API information |
| | `/api/status` | GET | System health |
| | `/api/connection` | GET | Connection status + config |
| | `/api/scan` | GET | All scan data |
| **WiFi** | `/api/wifi` | GET | All WiFi data |
| | `/api/wifi/devices` | GET | WiFi devices |
| | `/api/wifi/bad-frequencies` | GET | Bad frequencies |
| | `/api/wifi/interference` | GET | Interference log |
| | `/api/wifi/spectral-scan` | GET | Latest spectral scan |
| | `/api/wifi/monitor/enable` | POST | Enable monitor mode |
| **Network** | `/api/network` | GET | All network data |
| | `/api/network/devices` | GET | Network devices |
| | `/api/network/devices/{ip}` | GET | Device details |
| | `/api/network/devices/{ip}/snmp` | GET | SNMP data |
| | `/api/network/rescan` | POST | Trigger rescan |
| | `/api/network/devices/{ip}/ssh` | POST | SSH login |

## Quick Examples

### Get Connection Status
```bash
curl http://localhost:8080/api/connection
```

Returns:
```json
{
  "connected": true,
  "type": "ethernet",
  "interface": "eth0",
  "ip_address": "192.168.1.100",
  "subnet_mask": "24",
  "gateway": "192.168.1.1",
  "dns_servers": ["8.8.8.8"],
  "ip_assignment": "dhcp",
  "mac_address": "AA:BB:CC:DD:EE:FF"
}
```

### List WiFi Devices
```bash
curl http://localhost:8080/api/wifi/devices
```

### Get Network Devices
```bash
curl http://localhost:8080/api/network/devices
```

### SSH to Device
```bash
curl -X POST http://localhost:8080/api/network/devices/192.168.1.1/ssh \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## Documentation

📚 Full API documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Or visit: http://localhost:8080/api/docs

## File Structure

```
api/
├── __init__.py           # Package init
├── rest_api.py           # Main REST API server
├── API_DOCUMENTATION.md  # Complete API docs
└── README.md            # This file
```

## Integration

### Python
```python
import requests

# Get scan data
response = requests.get('http://localhost:8080/api/scan')
data = response.json()

print(f"WiFi devices: {len(data['wifi_devices'])}")
print(f"Network devices: {len(data['network_devices'])}")
```

### JavaScript
```javascript
fetch('http://localhost:8080/api/connection')
  .then(response => response.json())
  .then(data => {
    console.log(`Connected via ${data.type}`);
    console.log(`IP: ${data.ip_address}`);
  });
```

### cURL
```bash
# System status
curl http://localhost:8080/api/status

# All data
curl http://localhost:8080/api/scan

# WiFi devices
curl http://localhost:8080/api/wifi/devices

# Network devices
curl http://localhost:8080/api/network/devices
```

## Response Format

All responses are JSON with HTTP status codes:
- `200`: Success
- `400`: Bad request
- `404`: Not found
- `500`: Server error
- `503`: Service unavailable

## CORS

CORS is enabled for all origins (`Access-Control-Allow-Origin: *`).

For production, configure specific origins in `rest_api.py`.

## Security

⚠️ **Important**: The API currently has NO authentication.

For production use, add:
- API keys
- OAuth 2.0
- JWT tokens
- Rate limiting

## Port Configuration

Default port: **8080**

To change, edit `rest_api.py` or pass as parameter:
```python
start_rest_api(host='0.0.0.0', port=9000)
```

## Requirements

- Python 3.6+
- Root privileges (for network scanning)
- All Netwatch dependencies

## Troubleshooting

### API Not Accessible
- Check if port 8080 is already in use
- Verify firewall settings
- Ensure running with sudo

### No Data Returned
- Make sure netwatch_unified.py is running
- Wait a few seconds for initial scans
- Check `/api/status` for component status

### CORS Errors
- API already has CORS enabled
- Check browser console for specific errors

## Support

For issues or questions:
- Check full documentation: `API_DOCUMENTATION.md`
- Visit API docs endpoint: http://localhost:8080/api/docs
- Check system status: http://localhost:8080/api/status

## License

Part of the Netwatch Network Monitoring System
Copyright (c) 2025

# 📊 Data Sources & IoT Device Integration

This document explains how the Airguard backend receives and processes data from various sources.

## 🔄 Data Flow Overview

```
IoT Devices → Backend API → Database → Frontend Dashboard
     ↓              ↓           ↓           ↓
  Sensors    →   REST/WS   →  PostgreSQL → Real-time UI
```

## 📡 Data Sources

### 1. **Real IoT Devices (Production)**

IoT devices send data to the backend via HTTP POST requests:

```bash
# Example: Device sending metrics
POST /api/devices/{deviceId}/metrics
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "metrics": [
    {
      "metricType": "throughput",
      "value": 875.5,
      "unit": "Mbps"
    },
    {
      "metricType": "health",
      "value": 98.2,
      "unit": "%"
    },
    {
      "metricType": "temperature",
      "value": 24.5,
      "unit": "°C"
    }
  ]
}
```

**Device Types Supported:**
- Environmental Monitors (temperature, humidity, air quality)
- Network Monitors (throughput, QoS, interference)
- Battery-powered sensors
- GPS-enabled location trackers

### 2. **Device Simulator (Development)**

For development and testing, we include a device simulator:

```typescript
// Start simulation for all devices in an organization
POST /api/simulation/start
{
  "intervalMs": 30000  // Send data every 30 seconds
}
```

**Simulated Metrics:**
- Network throughput: 500-1000 Mbps
- Device health: 70-100%
- QoS score: 85-100%
- Interference: -100 to -80 dBm
- Battery level: 20-100%
- Temperature: 15-35°C
- Humidity: 30-80%
- Air quality: 50-250 AQI

### 3. **Seed Data (Initial Setup)**

The database is seeded with sample data for immediate testing:

```bash
npm run db:seed
```

**Sample Data Includes:**
- Demo organization and user
- 3 sample devices in Beirut
- Historical metrics data
- Network health records
- Environmental achievements
- System alerts

## 🔌 How Real IoT Devices Connect

### **Device Registration**

1. **Create Device Record:**
```bash
POST /api/devices
{
  "name": "AirGuard Device #001",
  "deviceType": "Environmental Monitor",
  "latitude": 33.8938,
  "longitude": 35.5018,
  "locationDescription": "Downtown Beirut"
}
```

2. **Get Device ID and Auth Token:**
```json
{
  "success": true,
  "data": {
    "id": "device-001",
    "name": "AirGuard Device #001",
    "status": "offline"
  }
}
```

### **Data Transmission**

Devices send data periodically using their device ID:

```typescript
// Example device firmware code
class IoTDevice {
  private deviceId = 'device-001';
  private apiUrl = 'https://api.airguard.com';
  private authToken = 'jwt-token';

  async sendMetrics() {
    const metrics = await this.readSensors();
    
    await fetch(`${this.apiUrl}/api/devices/${this.deviceId}/metrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metrics })
    });
  }
}
```

### **Authentication**

Devices authenticate using JWT tokens:

```bash
# Device login
POST /api/auth/login
{
  "email": "device@airguard.com",
  "password": "device-password"
}

# Response includes access token
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📊 Data Processing Pipeline

### **1. Data Ingestion**
```typescript
// Device sends metrics
POST /api/devices/{deviceId}/metrics
↓
// Backend validates and stores
prisma.deviceMetric.create({ data: metric })
↓
// Update device status
prisma.device.update({ status: 'online' })
```

### **2. Real-time Processing**
```typescript
// Calculate network health from device metrics
const avgHealth = devices
  .flatMap(d => d.metrics)
  .filter(m => m.metricType === 'health')
  .reduce((sum, m) => sum + Number(m.value), 0) / count;
```

### **3. WebSocket Broadcasting**
```typescript
// Broadcast updates to connected clients
io.to(`org-${organizationId}`).emit('device-update', {
  deviceId,
  status: 'online',
  metrics: latestMetrics
});
```

## 🗄️ Database Schema

### **Device Data**
```sql
-- Device information
devices (
  id, name, device_type, firmware_version,
  latitude, longitude, location_description,
  status, battery_level, last_seen
)

-- Time-series metrics
device_metrics (
  id, device_id, metric_type, value, unit, timestamp
)
```

### **Network Analytics**
```sql
-- Aggregated network health
network_health (
  organization_id, health_index, throughput_mbps,
  qos_score, interference_dbm, predicted_load_percent
)
```

## 🚀 Getting Started

### **1. Start Backend with Simulation**
```bash
cd backend
npm run dev
# Backend starts on http://localhost:3001

# Start device simulation
curl -X POST http://localhost:3001/api/simulation/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intervalMs": 30000}'
```

### **2. Run IoT Device Simulator**
```bash
# Install axios for the simulator
npm install axios

# Run device simulator
npx tsx src/scripts/iot-device-simulator.ts
```

### **3. Monitor Data Flow**
```bash
# Check device metrics
curl http://localhost:3001/api/devices/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check network health
curl http://localhost:3001/api/dashboard/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Production Deployment

### **IoT Device Requirements**
- **Hardware**: ESP32, Raspberry Pi, or custom IoT board
- **Connectivity**: WiFi, Cellular, or LoRaWAN
- **Sensors**: Temperature, humidity, air quality, GPS
- **Firmware**: Embedded C/C++ or MicroPython
- **Security**: TLS/SSL, JWT authentication

### **Backend Infrastructure**
- **API Gateway**: Load balancing and rate limiting
- **Database**: PostgreSQL with read replicas
- **Caching**: Redis for real-time data
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

### **Data Retention**
- **Real-time**: Last 24 hours in memory
- **Short-term**: Last 30 days in database
- **Long-term**: Archived to data warehouse
- **Analytics**: Aggregated metrics for trends

## 📈 Data Analytics

### **Real-time Dashboards**
- Device status and location
- Network performance metrics
- Environmental conditions
- Battery levels and alerts

### **Historical Analysis**
- Performance trends over time
- Environmental impact tracking
- Predictive maintenance
- Capacity planning

### **Achievement System**
- Electricity savings tracking
- Carbon footprint reduction
- ESG compliance reporting
- Sustainability goals

## 🔒 Security Considerations

### **Device Security**
- Secure boot and firmware updates
- Encrypted communication (TLS)
- Device authentication (JWT)
- Rate limiting and DDoS protection

### **Data Security**
- Data encryption at rest
- Secure API endpoints
- Role-based access control
- Audit logging

### **Network Security**
- VPN for device communication
- Firewall rules and segmentation
- Intrusion detection systems
- Regular security audits

This architecture provides a scalable, secure, and real-time IoT data platform that can handle thousands of devices while maintaining high performance and reliability. 
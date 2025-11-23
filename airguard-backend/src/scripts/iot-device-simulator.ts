#!/usr/bin/env tsx

/**
 * IoT Device Simulator
 * 
 * This script simulates how real IoT devices would send data to the Airguard backend.
 * In production, this would be embedded firmware running on actual IoT devices.
 */

import axios from 'axios';

interface DeviceConfig {
  deviceId: string;
  apiUrl: string;
  authToken: string;
  intervalMs: number;
}

interface DeviceMetrics {
  throughput: number;
  health: number;
  qos: number;
  interference: number;
  battery: number;
  temperature: number;
  humidity: number;
  airQuality: number;
}

class IoTDeviceSimulator {
  private deviceId: string;
  private apiUrl: string;
  private authToken: string;
  private intervalMs: number;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: DeviceConfig) {
    this.deviceId = config.deviceId;
    this.apiUrl = config.apiUrl;
    this.authToken = config.authToken;
    this.intervalMs = config.intervalMs;
  }

  // Simulate sensor readings
  private generateSensorData(): DeviceMetrics {
    return {
      throughput: Math.random() * 500 + 500, // 500-1000 Mbps
      health: Math.random() * 30 + 70, // 70-100%
      qos: Math.random() * 15 + 85, // 85-100%
      interference: -(Math.random() * 20 + 80), // -100 to -80 dBm
      battery: Math.random() * 80 + 20, // 20-100%
      temperature: Math.random() * 20 + 15, // 15-35°C
      humidity: Math.random() * 50 + 30, // 30-80%
      airQuality: Math.random() * 200 + 50, // 50-250 AQI
    };
  }

  // Send metrics to backend
  private async sendMetrics(metrics: DeviceMetrics): Promise<void> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/devices/${this.deviceId}/metrics`,
        {
          metrics: [
            { metricType: 'throughput', value: metrics.throughput, unit: 'Mbps' },
            { metricType: 'health', value: metrics.health, unit: '%' },
            { metricType: 'qos', value: metrics.qos, unit: '%' },
            { metricType: 'interference', value: metrics.interference, unit: 'dBm' },
            { metricType: 'battery', value: metrics.battery, unit: '%' },
            { metricType: 'temperature', value: metrics.temperature, unit: '°C' },
            { metricType: 'humidity', value: metrics.humidity, unit: '%' },
            { metricType: 'air_quality', value: metrics.airQuality, unit: 'AQI' },
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log(`✅ Metrics sent successfully:`, {
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
        throughput: `${metrics.throughput.toFixed(1)} Mbps`,
        health: `${metrics.health.toFixed(1)}%`,
        battery: `${metrics.battery.toFixed(1)}%`,
      });
    } catch (error) {
      console.error(`❌ Failed to send metrics:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Start the device simulation
  start(): void {
    if (this.isRunning) {
      console.log('Device simulation already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting IoT device simulation for device: ${this.deviceId}`);
    console.log(`📡 Sending data to: ${this.apiUrl}`);
    console.log(`⏱️  Interval: ${this.intervalMs}ms`);

    this.interval = setInterval(async () => {
      const metrics = this.generateSensorData();
      await this.sendMetrics(metrics);
    }, this.intervalMs);
  }

  // Stop the device simulation
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log(`🛑 IoT device simulation stopped for device: ${this.deviceId}`);
  }

  // Send a single metrics reading
  async sendSingleReading(): Promise<void> {
    const metrics = this.generateSensorData();
    await this.sendMetrics(metrics);
  }
}

// Example usage
async function main() {
  // Configuration for the IoT device
  const deviceConfig: DeviceConfig = {
    deviceId: 'device-001', // This would be the actual device ID
    apiUrl: 'http://localhost:3001', // Backend API URL
    authToken: 'your-jwt-token-here', // JWT token for authentication
    intervalMs: 30000, // Send data every 30 seconds
  };

  // Create device simulator
  const device = new IoTDeviceSimulator(deviceConfig);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    device.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    device.stop();
    process.exit(0);
  });

  // Start the device simulation
  device.start();

  // Example: Send a single reading after 5 seconds
  setTimeout(async () => {
    console.log('📊 Sending single reading...');
    await device.sendSingleReading();
  }, 5000);
}

// Run the simulator
if (require.main === module) {
  main().catch(console.error);
}

export { IoTDeviceSimulator, DeviceConfig, DeviceMetrics }; 
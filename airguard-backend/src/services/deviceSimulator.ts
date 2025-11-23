import { deviceService } from './deviceService';
import { prisma } from '@/config/database';
import type { DeviceMetric } from '@/types';

export class DeviceSimulator {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Simulate device data generation
  async simulateDeviceData(deviceId: string, organizationId: string): Promise<void> {
    const metrics: Array<{ type: string; value: number; unit: string }> = [
      {
        type: 'throughput',
        value: this.generateThroughput(),
        unit: 'Mbps'
      },
      {
        type: 'health',
        value: this.generateHealthScore(),
        unit: '%'
      },
      {
        type: 'qos',
        value: this.generateQoSScore(),
        unit: '%'
      },
      {
        type: 'interference',
        value: this.generateInterference(),
        unit: 'dBm'
      },
      {
        type: 'battery',
        value: this.generateBatteryLevel(),
        unit: '%'
      },
      {
        type: 'temperature',
        value: this.generateTemperature(),
        unit: '°C'
      },
      {
        type: 'humidity',
        value: this.generateHumidity(),
        unit: '%'
      },
      {
        type: 'air_quality',
        value: this.generateAirQuality(),
        unit: 'AQI'
      }
    ];

    // Store metrics in database
    for (const metric of metrics) {
      await prisma.deviceMetric.create({
        data: {
          metricType: metric.type,
          value: metric.value,
          unit: metric.unit,
          deviceId
        }
      });
    }

    // Update device status based on health
    const healthMetric = metrics.find(m => m.type === 'health');
    if (healthMetric) {
      let status: 'online' | 'offline' | 'warning' = 'online';
      if (healthMetric.value < 50) status = 'offline';
      else if (healthMetric.value < 80) status = 'warning';

      await deviceService.updateDeviceStatus(deviceId, status, organizationId);
    }

    // Update battery level
    const batteryMetric = metrics.find(m => m.type === 'battery');
    if (batteryMetric) {
      await prisma.device.update({
        where: { id: deviceId },
        data: { 
          batteryLevel: Math.round(batteryMetric.value),
          lastSeen: new Date()
        }
      });
    }
  }

  // Start simulation for all devices in an organization
  async startSimulation(organizationId: string, intervalMs: number = 30000): Promise<void> {
    if (this.isRunning) {
      console.log('Simulation already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting device simulation for organization: ${organizationId}`);

    this.interval = setInterval(async () => {
      try {
        const devices = await prisma.device.findMany({
          where: { organizationId },
          select: { id: true }
        });

        for (const device of devices) {
          await this.simulateDeviceData(device.id, organizationId);
        }

        // Update network health based on device metrics
        await this.updateNetworkHealth(organizationId);

      } catch (error) {
        console.error('Error in device simulation:', error);
      }
    }, intervalMs);
  }

  // Stop simulation
  stopSimulation(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Device simulation stopped');
  }

  // Update network health based on device metrics
  private async updateNetworkHealth(organizationId: string): Promise<void> {
    const devices = await prisma.device.findMany({
      where: { organizationId },
      include: {
        metrics: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    if (devices.length === 0) return;

    // Calculate average metrics
    const throughputValues = devices
      .flatMap(d => d.metrics.filter(m => m.metricType === 'throughput'))
      .map(m => Number(m.value));
    
    const healthValues = devices
      .flatMap(d => d.metrics.filter(m => m.metricType === 'health'))
      .map(m => Number(m.value));
    
    const qosValues = devices
      .flatMap(d => d.metrics.filter(m => m.metricType === 'qos'))
      .map(m => Number(m.value));
    
    const interferenceValues = devices
      .flatMap(d => d.metrics.filter(m => m.metricType === 'interference'))
      .map(m => Number(m.value));

    const avgThroughput = throughputValues.length > 0 
      ? throughputValues.reduce((a, b) => a + b, 0) / throughputValues.length 
      : 875;
    
    const avgHealth = healthValues.length > 0 
      ? healthValues.reduce((a, b) => a + b, 0) / healthValues.length 
      : 98.2;
    
    const avgQoS = qosValues.length > 0 
      ? qosValues.reduce((a, b) => a + b, 0) / qosValues.length 
      : 99.1;
    
    const avgInterference = interferenceValues.length > 0 
      ? interferenceValues.reduce((a, b) => a + b, 0) / interferenceValues.length 
      : -92;

    // Create or update network health record
    await prisma.networkHealth.upsert({
      where: {
        organizationId_timestamp: {
          organizationId,
          timestamp: new Date()
        }
      },
      update: {
        healthIndex: avgHealth,
        throughputMbps: avgThroughput,
        qosScore: avgQoS,
        interferenceDbm: avgInterference,
        predictedLoadPercent: this.generatePredictedLoad()
      },
      create: {
        organizationId,
        healthIndex: avgHealth,
        throughputMbps: avgThroughput,
        qosScore: avgQoS,
        interferenceDbm: avgInterference,
        predictedLoadPercent: this.generatePredictedLoad()
      }
    });
  }

  // Data generation methods
  private generateThroughput(): number {
    // Simulate realistic network throughput (500-1000 Mbps)
    return Math.random() * 500 + 500;
  }

  private generateHealthScore(): number {
    // Simulate device health (70-100%)
    return Math.random() * 30 + 70;
  }

  private generateQoSScore(): number {
    // Simulate QoS score (85-100%)
    return Math.random() * 15 + 85;
  }

  private generateInterference(): number {
    // Simulate interference (-100 to -80 dBm)
    return -(Math.random() * 20 + 80);
  }

  private generateBatteryLevel(): number {
    // Simulate battery level (20-100%)
    return Math.random() * 80 + 20;
  }

  private generateTemperature(): number {
    // Simulate temperature (15-35°C)
    return Math.random() * 20 + 15;
  }

  private generateHumidity(): number {
    // Simulate humidity (30-80%)
    return Math.random() * 50 + 30;
  }

  private generateAirQuality(): number {
    // Simulate air quality index (0-500)
    return Math.random() * 200 + 50;
  }

  private generatePredictedLoad(): number {
    // Simulate predicted network load (-10 to +20%)
    return Math.random() * 30 - 10;
  }
}

export const deviceSimulator = new DeviceSimulator(); 
import axios from 'axios';
import logger from '@/config/logger';
import { prisma } from '@/config/database';
import type {
  Device,
  CreateDeviceData,
  UpdateDeviceData,
  DeviceMetric,
  CreateMetricData,
  TimeRange
} from '@/types';

export class DeviceService {
  async getDevices(organizationId: string): Promise<Device[]> {
    return await prisma.device.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDeviceById(id: string, organizationId: string): Promise<Device | null> {
    return await prisma.device.findFirst({
      where: {
        id,
        organizationId
      }
    });
  }

  async getDeviceByIdOnly(id: string): Promise<Device | null> {
    return await prisma.device.findUnique({
      where: { id }
    });
  }

  async createDevice(deviceData: CreateDeviceData): Promise<Device> {
    return await prisma.device.create({
      data: {
        name: deviceData.name,
        deviceType: deviceData.deviceType || null,
        firmwareVersion: deviceData.firmwareVersion || null,
        latitude: deviceData.latitude || null,
        longitude: deviceData.longitude || null,
        locationDescription: deviceData.locationDescription || null,
        organizationId: deviceData.organizationId
      }
    });
  }

  async updateDevice(id: string, deviceData: UpdateDeviceData, organizationId: string): Promise<Device> {
    return await prisma.device.update({
      where: {
        id,
        organizationId
      },
      data: deviceData
    });
  }

  async deleteDevice(id: string, organizationId: string): Promise<void> {
    await prisma.device.delete({
      where: {
        id,
        organizationId
      }
    });
  }

  async getDeviceMetrics(deviceId: string, timeRange?: TimeRange): Promise<DeviceMetric[]> {
    const where: { deviceId: string; timestamp?: { gte: Date; lte: Date } } = { deviceId };

    if (timeRange) {
      where.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end
      };
    }

    return await prisma.deviceMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });
  }

  async createMetric(metricData: CreateMetricData): Promise<DeviceMetric> {
    return await prisma.deviceMetric.create({
      data: {
        metricType: metricData.metricType,
        value: metricData.value,
        unit: metricData.unit || null,
        deviceId: metricData.deviceId
      }
    });
  }

  async updateDeviceStatus(deviceId: string, status: 'online' | 'offline' | 'warning', organizationId: string): Promise<Device> {
    return await prisma.device.update({
      where: {
        id: deviceId,
        organizationId
      },
      data: {
        status,
        lastSeen: status === 'online' ? new Date() : null
      }
    });
  }

  async getDeviceCount(organizationId: string): Promise<{ total: number; online: number; offline: number; warning: number }> {
    const devices = await prisma.device.findMany({
      where: { organizationId },
      select: { status: true }
    });

    const total = devices.length;
    const online = devices.filter((d: { status: string }) => d.status === 'online').length;
    const offline = devices.filter((d: { status: string }) => d.status === 'offline').length;
    const warning = devices.filter((d: { status: string }) => d.status === 'warning').length;

    return { total, online, offline, warning };
  }

  async getDeviceLocations(organizationId: string): Promise<Array<{ id: string; name: string; lat: number; lng: number; status: string }>> {
    const devices = await prisma.device.findMany({
      where: {
        organizationId,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        status: true
      }
    });

    return devices.map((device: any) => ({
      id: device.id,
      name: device.name,
      lat: Number(device.latitude),
      lng: Number(device.longitude),
      status: device.status
    }));
  }

  async getDiscoveredDevices(): Promise<any[]> {
    try {
      const netwatchUrl = process.env['NETWATCH_URL'] || 'http://localhost:8080';
      const response = await axios.get(`${netwatchUrl}/api/scan`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch discovered devices from Netwatch', { error });
      return [];
    }
  }
}

export const deviceService = new DeviceService(); 
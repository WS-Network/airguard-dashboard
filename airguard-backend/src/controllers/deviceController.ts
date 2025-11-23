import { Request, Response } from 'express';
import { deviceService } from '@/services/deviceService';
import { validateData, createDeviceSchema, updateDeviceSchema, createMetricSchema } from '@/utils/validation';
import type { ApiResponse, Device, DeviceMetric } from '@/types';

export class DeviceController {
  // Get all devices for an organization
  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const devices = await deviceService.getDevices(req.user.organizationId!);

      const response: ApiResponse<Device[]> = {
        success: true,
        data: devices,
        message: 'Devices retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get devices';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Get device by ID
  async getDeviceById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const { id } = req.params;
      const device = await deviceService.getDeviceById(id, req.user.organizationId!);

      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found'
        });
        return;
      }

      const response: ApiResponse<Device> = {
        success: true,
        data: device,
        message: 'Device retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get device';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Create new device
  async createDevice(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const validation = validateData(createDeviceSchema, req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
        return;
      }

      const deviceData = {
        ...req.body,
        organizationId: req.user.organizationId!
      };

      const device = await deviceService.createDevice(deviceData);

      const response: ApiResponse<Device> = {
        success: true,
        data: device,
        message: 'Device created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create device';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Update device
  async updateDevice(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const validation = validateData(updateDeviceSchema, req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
        return;
      }

      const { id } = req.params;
      const device = await deviceService.updateDevice(id, req.body, req.user.organizationId!);

      const response: ApiResponse<Device> = {
        success: true,
        data: device,
        message: 'Device updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update device';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Delete device
  async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const { id } = req.params;
      await deviceService.deleteDevice(id, req.user.organizationId!);

      const response: ApiResponse = {
        success: true,
        message: 'Device deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete device';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // IoT Device: Send metrics data
  async sendMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.params;
      const { metrics } = req.body;

      if (!Array.isArray(metrics)) {
        res.status(400).json({
          success: false,
          error: 'Metrics must be an array'
        });
        return;
      }

      const createdMetrics: DeviceMetric[] = [];

      for (const metric of metrics) {
        const validation = validateData(createMetricSchema, {
          ...metric,
          deviceId
        });

        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            error: 'Invalid metric data',
            details: validation.errors
          });
          return;
        }

        const createdMetric = await deviceService.createMetric({
          ...metric,
          deviceId
        });

        createdMetrics.push(createdMetric);
      }

      // Update device status to online
      // Note: For IoT devices, we don't require organization authentication
      // but we need to find the device's organization
      const device = await deviceService.getDeviceByIdOnly(deviceId);
      if (device) {
        await deviceService.updateDeviceStatus(deviceId, 'online', device.organizationId);
      }

      const response: ApiResponse<DeviceMetric[]> = {
        success: true,
        data: createdMetrics,
        message: 'Metrics received successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process metrics';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Get device metrics
  async getDeviceMetrics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const { deviceId } = req.params;
      const { start, end } = req.query;

      let timeRange;
      if (start && end) {
        timeRange = {
          start: new Date(start as string),
          end: new Date(end as string)
        };
      }

      const metrics = await deviceService.getDeviceMetrics(deviceId, timeRange);

      const response: ApiResponse<DeviceMetric[]> = {
        success: true,
        data: metrics,
        message: 'Device metrics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get device metrics';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Get device count and status summary
  async getDeviceStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const stats = await deviceService.getDeviceCount(req.user.organizationId!);

      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Device statistics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get device statistics';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Get device locations for map
  async getDeviceLocations(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const locations = await deviceService.getDeviceLocations(req.user.organizationId!);

      const response: ApiResponse = {
        success: true,
        data: locations,
        message: 'Device locations retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get device locations';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Get discovered devices from Netwatch
  async getDiscoveredDevices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const devices = await deviceService.getDiscoveredDevices();

      const response: ApiResponse = {
        success: true,
        data: devices,
        message: 'Discovered devices retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get discovered devices';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Start port scan via Netwatch (30 second scan)
  async startPortScan(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      // Call Netwatch API to start scan
      const netwatchResponse = await fetch('http://localhost:8080/api/scan', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!netwatchResponse.ok) {
        throw new Error(`Netwatch scan failed: ${netwatchResponse.statusText}`);
      }

      const scanResult = await netwatchResponse.json();

      const response: ApiResponse = {
        success: true,
        data: scanResult,
        message: 'Port scan completed successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start port scan';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Import dongle data into database
  async importDongleData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const dongleData = req.body;

      // Validate required fields
      if (!dongleData.batchId) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: batchId'
        });
        return;
      }

      // Create device with dongle data
      const deviceData = {
        name: `GPS Dongle ${dongleData.batchId}`,
        deviceType: 'gps-dongle',
        status: 'online',
        organizationId: req.user.organizationId,
        locationLat: dongleData.lat || null,
        locationLng: dongleData.lon || null,
        dongleBatchId: dongleData.batchId,
        dongleLat: dongleData.lat,
        dongleLon: dongleData.lon,
        dongleAlt: dongleData.alt,
        dongleAx: dongleData.ax,
        dongleAy: dongleData.ay,
        dongleAz: dongleData.az,
        dongleGx: dongleData.gx,
        dongleGy: dongleData.gy,
        dongleGz: dongleData.gz,
        dongleTempC: dongleData.tempC,
        dongleGpsFix: dongleData.gpsFix,
        dongleSats: dongleData.sats,
        dongleDateYMD: dongleData.dateYMD,
        dongleTimeHMS: dongleData.timeHMS,
        dongleMsec: dongleData.msec,
        dongleSessionMs: dongleData.sessionMs,
        dongleSamples: dongleData.samples
      };

      const device = await deviceService.createDevice(deviceData);

      const response: ApiResponse = {
        success: true,
        data: device,
        message: 'Dongle data imported successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import dongle data';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}

export const deviceController = new DeviceController(); 
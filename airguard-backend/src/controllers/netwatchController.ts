import { Request, Response } from 'express';
import { netwatchService } from '@/services/netwatchService';
import { prisma } from '@/config/database';
import logger from '@/config/logger';
import type { ApiResponse } from '@/types';

export class NetwatchController {
  /**
   * GET /api/network/connection-status
   * Check Ethernet/Network connection status on Jetson
   */
  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await netwatchService.getConnectionStatus();

      const response: ApiResponse = {
        success: true,
        data: status,
        message: status.connected
          ? `Connected via ${status.type}`
          : 'No network connection detected'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check connection status';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * POST /api/network/scan
   * Trigger a network scan to discover devices
   */
  async triggerNetworkScan(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      // First check if network is connected
      const connectionStatus = await netwatchService.getConnectionStatus();

      if (!connectionStatus.connected) {
        res.status(400).json({
          success: false,
          error: 'No network connection. Please connect to Ethernet.'
        });
        return;
      }

      // Trigger the scan
      const scanResult = await netwatchService.triggerRescan();

      logger.info('Network scan triggered', { organizationId: req.user.organizationId });

      const response: ApiResponse = {
        success: true,
        data: scanResult,
        message: 'Network scan initiated'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to trigger network scan';
      logger.error('Network scan failed', { error });
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/network/discovered-devices
   * Get all discovered network devices from NetWatch
   */
  async getDiscoveredDevices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const devices = await netwatchService.getNetworkDevices();

      const response: ApiResponse = {
        success: true,
        data: { devices },
        message: `Found ${devices.length} network device(s)`
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

  /**
   * POST /api/network/setup-snmp
   * Auto-setup SNMP on a device via SSH
   */
  async setupSnmp(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const { ip, username, password, deviceId } = req.body;

      if (!ip || !username || !password) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: ip, username, password'
        });
        return;
      }

      logger.info('Setting up SNMP via SSH', { ip, deviceId });

      // Setup SNMP via SSH
      const result = await netwatchService.setupSnmpViaSsh(ip, username, password);

      if (result.success) {
        // Get SNMP data
        const snmpData = await netwatchService.getSnmpData(ip);

        // If deviceId provided, update device with SNMP data
        if (deviceId && snmpData) {
          await prisma.device.update({
            where: {
              id: deviceId,
              organizationId: req.user.organizationId
            },
            data: {
              sshConfigured: true,
              // Store SNMP data in device record (you may want to create a separate snmp_data table)
              // For now, we'll just mark SSH as configured
              updatedAt: new Date()
            }
          });

          logger.info('Device updated with SNMP configuration', { deviceId, ip });
        }

        const response: ApiResponse = {
          success: true,
          data: {
            snmpData,
            setupResult: result
          },
          message: 'SNMP configured successfully'
        };

        res.status(200).json(response);
      } else {
        res.status(500).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup SNMP';
      logger.error('SNMP setup failed', { error });
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/network/wifi-devices
   * Get WiFi devices detected by NetWatch
   */
  async getWifiDevices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const devices = await netwatchService.getWifiDevices();

      const response: ApiResponse = {
        success: true,
        data: { devices },
        message: `Found ${devices.length} WiFi device(s)`
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get WiFi devices';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/network/interference
   * Get WiFi interference/bad frequencies
   */
  async getInterference(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const badFrequencies = await netwatchService.getBadFrequencies();

      const response: ApiResponse = {
        success: true,
        data: { badFrequencies },
        message: `Found ${badFrequencies.length} interference issue(s)`
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get interference data';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/network/all-data
   * Get all NetWatch scan data (connection + devices + wifi + interference)
   */
  async getAllData(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.organizationId) {
        res.status(403).json({
          success: false,
          error: 'Organization access required'
        });
        return;
      }

      const allData = await netwatchService.getAllScanData();

      const response: ApiResponse = {
        success: true,
        data: allData,
        message: 'NetWatch data retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get NetWatch data';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * GET /api/network/status
   * Check if NetWatch service is running
   */
  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = await netwatchService.isServiceAvailable();

      const response: ApiResponse = {
        success: true,
        data: {
          netwatch_available: isAvailable,
          service_url: process.env['NETWATCH_URL'] || 'http://localhost:8080'
        },
        message: isAvailable ? 'NetWatch service is running' : 'NetWatch service is not available'
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check service status';
      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}

export const netwatchController = new NetwatchController();

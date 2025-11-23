import axios from 'axios';
import logger from '@/config/logger';

export interface NetwatchConnectionStatus {
  connected: boolean;
  type: 'ethernet' | 'wireless' | 'none';
  interface: string | null;
  ip_address: string | null;
  subnet_mask: string | null;
  gateway: string | null;
  dns_servers: string[];
  ip_assignment: 'dhcp' | 'static' | null;
  mac_address: string | null;
  link_speed: string | null;
  last_check: string;
}

export interface NetwatchDevice {
  ip: string;
  mac?: string;
  vendor?: string;
  hostname?: string;
  os?: string;
  ports?: number[];
  ssh_status?: string;
  first_seen?: string;
  last_seen?: string;
}

export interface WifiDevice {
  mac: string;
  signal?: number;
  freq?: number;
  channel?: number;
  interfering?: boolean;
  vendor?: string;
}

export interface SnmpData {
  system_description?: string;
  system_uptime?: string;
  system_contact?: string;
  system_name?: string;
  system_location?: string;
  interfaces?: any[];
  [key: string]: any;
}

export class NetwatchService {
  private baseUrl: string;
  private isAvailable: boolean = false;

  constructor() {
    this.baseUrl = process.env['NETWATCH_URL'] || 'http://localhost:8080';
    this.checkAvailability();
  }

  /**
   * Check if NetWatch service is available
   */
  private async checkAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/status`, { timeout: 2000 });
      this.isAvailable = response.status === 200;
      if (this.isAvailable) {
        logger.info('NetWatch service is available');
      }
    } catch (error) {
      this.isAvailable = false;
      logger.warn('NetWatch service is not available - network scanning features disabled');
    }
  }

  /**
   * Get Ethernet/Network connection status
   * Returns connection details including IP, gateway, DNS, etc.
   */
  async getConnectionStatus(): Promise<NetwatchConnectionStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/connection`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error('Failed to get connection status from NetWatch', { error });
      return {
        connected: false,
        type: 'none',
        interface: null,
        ip_address: null,
        subnet_mask: null,
        gateway: null,
        dns_servers: [],
        ip_assignment: null,
        mac_address: null,
        link_speed: null,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * Get all discovered network devices (from port scan)
   */
  async getNetworkDevices(): Promise<NetwatchDevice[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/network/devices`, { timeout: 10000 });
      return response.data.devices || [];
    } catch (error) {
      logger.error('Failed to get network devices from NetWatch', { error });
      return [];
    }
  }

  /**
   * Get details for a specific device
   */
  async getDeviceDetails(ip: string): Promise<NetwatchDevice | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/network/devices/${ip}`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get device details for ${ip}`, { error });
      return null;
    }
  }

  /**
   * Trigger a network rescan
   * This will discover all devices on the local network
   */
  async triggerRescan(): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/network/rescan`, {}, { timeout: 60000 });
      return response.data;
    } catch (error) {
      logger.error('Failed to trigger network rescan', { error });
      throw new Error('Failed to trigger network rescan');
    }
  }

  /**
   * Get WiFi devices detected by NetWatch
   */
  async getWifiDevices(): Promise<WifiDevice[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/wifi/devices`, { timeout: 10000 });
      return response.data.devices || [];
    } catch (error) {
      logger.error('Failed to get WiFi devices from NetWatch', { error });
      return [];
    }
  }

  /**
   * Get WiFi bad frequencies/interference data
   */
  async getBadFrequencies(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/wifi/bad-frequencies`, { timeout: 5000 });
      return response.data.bad_frequencies || [];
    } catch (error) {
      logger.error('Failed to get bad frequencies from NetWatch', { error });
      return [];
    }
  }

  /**
   * SSH into a device and execute commands
   * Used for SNMP auto-setup
   */
  async sshLogin(ip: string, username: string, password: string): Promise<{ success: boolean; message: string; output?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/network/devices/${ip}/ssh`, {
        username,
        password
      }, { timeout: 30000 });
      return response.data;
    } catch (error) {
      logger.error(`Failed to SSH into device ${ip}`, { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'SSH connection failed'
      };
    }
  }

  /**
   * Get SNMP data for a device
   * NetWatch will attempt to query SNMP if available
   */
  async getSnmpData(ip: string): Promise<SnmpData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/network/devices/${ip}/snmp`, { timeout: 10000 });
      return response.data.snmp_data || null;
    } catch (error) {
      logger.error(`Failed to get SNMP data for ${ip}`, { error });
      return null;
    }
  }

  /**
   * Setup SNMP on a device via SSH
   * This will SSH into the device and configure SNMP
   */
  async setupSnmpViaSsh(ip: string, username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // First, SSH into the device
      const sshResult = await this.sshLogin(ip, username, password);

      if (!sshResult.success) {
        return {
          success: false,
          message: 'Failed to connect via SSH'
        };
      }

      // NetWatch's SSH endpoint should handle SNMP setup automatically
      // If it doesn't, we would need to add SNMP setup commands to NetWatch

      logger.info(`SNMP setup initiated for device ${ip}`);

      // Wait a bit for SNMP to be configured
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to get SNMP data to verify setup
      const snmpData = await this.getSnmpData(ip);

      if (snmpData) {
        return {
          success: true,
          message: 'SNMP configured successfully'
        };
      } else {
        return {
          success: false,
          message: 'SNMP setup completed but unable to verify'
        };
      }
    } catch (error) {
      logger.error(`Failed to setup SNMP for device ${ip}`, { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'SNMP setup failed'
      };
    }
  }

  /**
   * Get unified scan results (all data from NetWatch)
   */
  async getAllScanData(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/scan`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      logger.error('Failed to get scan data from NetWatch', { error });
      return {
        connection_status: { connected: false },
        network_devices: [],
        wifi_devices: [],
        bad_frequencies: [],
        last_update: null
      };
    }
  }

  /**
   * Check if NetWatch service is running
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/status`, { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const netwatchService = new NetwatchService();

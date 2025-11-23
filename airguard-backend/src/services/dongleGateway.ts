import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import Redis from 'ioredis';
import * as mqtt from 'mqtt';
import logger from '@/config/logger';
import type { DongleData, GpsData } from '@/types';

interface DongleGatewayConfig {
  serialPort?: string;
  baudRate?: number;
  redisHost?: string;
  redisPort?: number;
  mqttBroker?: string;
  mqttPort?: number;
  mqttTopic?: string;
}

export class DongleGateway {
  private port: SerialPort | null = null;
  private parser: ReadlineParser | null = null;
  private redis: Redis;
  private mqttClient: mqtt.MqttClient | null = null;
  private buffer: string[] = [];
  private isEnabled: boolean;
  private mqttTopic: string;

  constructor(config: DongleGatewayConfig = {}) {
    const {
      serialPort = process.env['SERIAL_PORT'] || '/dev/ttyUSB0',
      baudRate = 115200,
      redisHost = process.env['REDIS_HOST'] || 'localhost',
      redisPort = parseInt(process.env['REDIS_PORT'] || '6379'),
      mqttBroker = process.env['MQTT_BROKER'] || 'localhost',
      mqttPort = parseInt(process.env['MQTT_PORT'] || '1883'),
      mqttTopic = process.env['MQTT_TOPIC'] || 'espnow/samples'
    } = config;

    this.isEnabled = process.env['ENABLE_DONGLE_GATEWAY'] === 'true';
    this.mqttTopic = mqttTopic;

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 1000, 3000);
      }
    });

    // Initialize MQTT Client
    this.initMqttClient(`mqtt://${mqttBroker}:${mqttPort}`);

    if (this.isEnabled) {
      this.initSerialPort(serialPort, baudRate);
    } else {
      logger.info('Dongle Gateway serial disabled (ENABLE_DONGLE_GATEWAY not set to true)');
    }
  }

  private initMqttClient(brokerUrl: string) {
    try {
      logger.info(`Dongle Gateway: Connecting to MQTT broker at ${brokerUrl}`);
      // Robust connection options with explicit clientId and protocol version
      const clientId = `airguard-${Math.random().toString(16).substr(2, 8)}`;
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        reconnectPeriod: 1000, // 1 s between reconnection attempts
        connectTimeout: 30_000, // 30 s timeout for initial connection
        keepalive: 60, // keep‑alive ping interval (seconds)
        protocolVersion: 4 // MQTT 3.1.1 for compatibility
      });

      this.mqttClient.on('connect', () => {
        logger.info('Dongle Gateway: MQTT connected');
        this.mqttClient?.subscribe(this.mqttTopic, (err) => {
          if (err) {
            logger.error('Dongle Gateway: Failed to subscribe to MQTT topic', { error: err });
          } else {
            logger.info(`Dongle Gateway: Subscribed to ${this.mqttTopic}`);
          }
        });
      });

      this.mqttClient.on('message', (topic, message) => {
        if (topic === this.mqttTopic) {
          this.handleMqttMessage(message.toString());
        }
      });

      this.mqttClient.on('error', (err) => {
        logger.error('Dongle Gateway: MQTT error', { error: err.message });
      });

    } catch (error) {
      logger.error('Dongle Gateway: Failed to initialize MQTT client', { error });
    }
  }

  private handleMqttMessage(message: string) {
    try {
      const data = JSON.parse(message);
      // Validate minimum required fields
      if (data.batchId && data.lat !== undefined && data.lon !== undefined) {
        logger.info('Dongle data received via MQTT', { batchId: data.batchId });
        this.publishDongleData(data as DongleData);
      } else {
        logger.warn('Received invalid dongle data via MQTT', { data });
      }
    } catch (error) {
      logger.error('Failed to parse MQTT message', { error });
    }
  }

  private initSerialPort(portPath: string, baudRate: number) {
    try {
      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      this.port.on('open', () => {
        logger.info(`Dongle Gateway: Serial port opened (${portPath})`);
      });

      this.port.on('error', (err) => {
        logger.error('Dongle Gateway: Serial port error', { error: err.message });
      });

      this.parser.on('data', (line: string) => {
        this.handleSerialData(line);
      });

      // Open the port
      this.port.open((err) => {
        if (err) {
          logger.warn(`Dongle Gateway: Could not open serial port ${portPath}`, { error: err.message });
          logger.info('Dongle Gateway will continue in API/MQTT-only mode');
        }
      });

    } catch (error) {
      logger.error('Dongle Gateway: Failed to initialize serial port', { error });
      logger.info('Dongle Gateway will continue in API/MQTT-only mode');
    }
  }

  private handleSerialData(line: string) {
    const trimmed = line.trim();

    // Detect start of packet
    if (trimmed === '=== Received Data ===') {
      this.buffer = [];
      return;
    }

    // Detect end of packet
    if (trimmed === '====================') {
      this.processBuffer();
      this.buffer = [];
      return;
    }

    // Add line to buffer
    if (this.buffer.length > 0) {
      this.buffer.push(trimmed);
    }
  }

  private processBuffer() {
    try {
      const dongleData = this.parsePacket(this.buffer);
      if (dongleData) {
        logger.info('Dongle data received via Serial', { batchId: dongleData.batchId });
        this.publishDongleData(dongleData);
      }
    } catch (error) {
      logger.error('Failed to process dongle data', { error });
    }
  }

  private parsePacket(lines: string[]): DongleData | null {
    try {
      const data: Partial<DongleData> = {};

      for (const line of lines) {
        // Line 1: Batch | Duration | Samples
        if (line.includes('Batch:')) {
          const batchMatch = line.match(/Batch:\s*0x([0-9A-Fa-f]+)/);
          if (batchMatch) {
            data.batchId = batchMatch[1].toUpperCase();
          }
          const durationMatch = line.match(/Duration:\s*(\d+)/);
          if (durationMatch) {
            data.sessionMs = parseInt(durationMatch[1]);
          }
          const samplesMatch = line.match(/Samples:\s*(\d+)/);
          if (samplesMatch) {
            data.samples = parseInt(samplesMatch[1]);
          }
        }

        // Line 2: GPS Fix, Sats, Date, Time
        else if (line.includes('GPS Fix:')) {
          const fixMatch = line.match(/GPS Fix:\s*(\d+)/);
          if (fixMatch) {
            data.gpsFix = parseInt(fixMatch[1]);
          }
          const satsMatch = line.match(/Sats:\s*(\d+)/);
          if (satsMatch) {
            data.sats = parseInt(satsMatch[1]);
          }
          const dateMatch = line.match(/Date:\s*(\d+)/);
          if (dateMatch) {
            data.dateYMD = parseInt(dateMatch[1]);
          }
          const timeMatch = line.match(/Time:\s*(\d+)\.(\d+)/);
          if (timeMatch) {
            data.timeHMS = parseInt(timeMatch[1]);
            data.msec = parseInt(timeMatch[2]);
          }
        }

        // Line 3: Lat, Lon, Alt
        else if (line.includes('Lat:')) {
          const latMatch = line.match(/Lat:\s*([-\d.]+)/);
          if (latMatch) {
            data.lat = parseFloat(latMatch[1]);
          }
          const lonMatch = line.match(/Lon:\s*([-\d.]+)/);
          if (lonMatch) {
            data.lon = parseFloat(lonMatch[1]);
          }
          const altMatch = line.match(/Alt:\s*([-\d.]+)/);
          if (altMatch) {
            data.alt = parseFloat(altMatch[1]);
          }
        }

        // Line 4: Accel
        else if (line.includes('Accel')) {
          const accelMatch = line.match(/X:\s*([-\d.]+)\s+Y:\s*([-\d.]+)\s+Z:\s*([-\d.]+)/);
          if (accelMatch) {
            data.ax = parseFloat(accelMatch[1]);
            data.ay = parseFloat(accelMatch[2]);
            data.az = parseFloat(accelMatch[3]);
          }
        }

        // Line 5: Gyro
        else if (line.includes('Gyro')) {
          const gyroMatch = line.match(/X:\s*([-\d.]+)\s+Y:\s*([-\d.]+)\s+Z:\s*([-\d.]+)/);
          if (gyroMatch) {
            data.gx = parseFloat(gyroMatch[1]);
            data.gy = parseFloat(gyroMatch[2]);
            data.gz = parseFloat(gyroMatch[3]);
          }
        }

        // Line 6: Temp
        else if (line.includes('Temp:')) {
          const tempMatch = line.match(/Temp:\s*([-\d.]+)/);
          if (tempMatch) {
            data.tempC = parseFloat(tempMatch[1]);
          }
        }
      }

      // Validate required fields
      if (data.batchId && data.lat !== undefined && data.lon !== undefined) {
        return data as DongleData;
      }

      return null;
    } catch (error) {
      logger.error('Failed to parse dongle packet', { error });
      return null;
    }
  }

  private async publishDongleData(data: DongleData) {
    try {
      // Publish to Redis channel for pairing listeners
      await this.redis.publish('dongle:data', JSON.stringify(data));
      logger.debug('Published dongle data to Redis', { batchId: data.batchId });
    } catch (error) {
      logger.error('Failed to publish dongle data', { error });
    }
  }

  /**
   * Convert dongle data to GPS format
   */
  public dongleToGps(data: DongleData): GpsData {
    // Calculate heading from gyroscope data (simplified)
    const heading = Math.atan2(data.gy, data.gx) * (180 / Math.PI);

    // Calculate GPS accuracy from satellites
    // More satellites = better accuracy
    // Typical values: 4 sats = ~50m, 8 sats = ~5m, 12 sats = ~2m
    let accuracy = 100; // default 100m
    if (data.sats >= 8) {
      accuracy = 5;
    } else if (data.sats >= 6) {
      accuracy = 15;
    } else if (data.sats >= 4) {
      accuracy = 50;
    }

    // Parse timestamp from dongle data
    const dateStr = data.dateYMD.toString();
    const timeStr = data.timeHMS.toString().padStart(6, '0');
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    const seconds = parseInt(timeStr.substring(4, 6));

    const timestamp = new Date(year, month, day, hours, minutes, seconds, data.msec);

    return {
      latitude: data.lat,
      longitude: data.lon,
      altitude: data.alt,
      accuracy,
      heading: heading >= 0 ? heading : heading + 360,
      timestamp,
      syncMethod: 'dongle'
    };
  }

  /**
   * Manually inject dongle data (for testing)
   */
  public async injectDongleData(data: DongleData) {
    logger.info('Manually injecting dongle data', { batchId: data.batchId });
    await this.publishDongleData(data);
  }

  /**
   * Close connections
   */
  public async close() {
    if (this.port?.isOpen) {
      this.port.close();
    }
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    await this.redis.quit();
  }
}

// Singleton instance
let dongleGateway: DongleGateway | null = null;

export function getDongleGateway(): DongleGateway {
  if (!dongleGateway) {
    dongleGateway = new DongleGateway();
  }
  return dongleGateway;
}

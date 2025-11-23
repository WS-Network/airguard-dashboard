import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/config/logger';
import { getDongleGateway } from '@/services/dongleGateway';
import type { DongleData } from '@/types';

const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379')
});

/**
 * POST /api/devices/pair/start
 * Start a device pairing session
 * Optional body: { deviceId: string } - for existing devices from port scan
 */
export async function startPairing(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 60000); // 60 seconds timeout
    const { deviceId } = req.body;

    // If deviceId is provided, verify it exists and belongs to user's organization
    if (deviceId) {
      const device = await prisma.device.findFirst({
        where: {
          id: deviceId,
          organizationId: req.user?.organizationId
        }
      });

      if (!device) {
        res.status(404).json({ error: 'Device not found or access denied' });
        return;
      }

      logger.info('Pairing existing device', { deviceId, sessionId });
    }

    // Create pairing session in database
    const session = await prisma.pairingSession.create({
      data: {
        sessionId,
        status: 'waiting',
        deviceId: deviceId || null,
        expiresAt
      }
    });

    logger.info('Pairing session started', { sessionId, deviceId: deviceId || 'new' });

    // Start background worker to listen for dongle data
    startPairingWorker(sessionId, req.user?.organizationId || '', deviceId || null);

    res.json({
      sessionId: sessionId,
      status: 'waiting'
    });
  } catch (error) {
    logger.error('Failed to start pairing', { error });
    res.status(500).json({ error: 'Failed to start pairing session' });
  }
}

/**
 * GET /api/devices/pair/status/:sessionId
 * Check pairing session status
 */
export async function getPairingStatus(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    const session = await prisma.pairingSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      res.status(404).json({ error: 'Pairing session not found' });
      return;
    }

    // Check if session expired
    if (session.status === 'waiting' && new Date() > session.expiresAt) {
      await prisma.pairingSession.update({
        where: { sessionId },
        data: { status: 'timeout' }
      });
      res.json({ status: 'timeout' });
      return;
    }

    // If waiting, return just status
    if (session.status === 'waiting') {
      res.json({ status: 'waiting' });
      return;
    }

    // If paired, return GPS + IMU data
    if (session.status === 'paired' && session.deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: session.deviceId },
        select: {
          latitude: true,
          longitude: true,
          altitude: true,
          gpsAccuracy: true,
          heading: true,
          accelerometerX: true,
          accelerometerY: true,
          accelerometerZ: true,
          gyroscopeX: true,
          gyroscopeY: true,
          gyroscopeZ: true,
          temperature: true,
          dongleBatchId: true,
          updatedAt: true
        }
      });

      if (device) {
        res.json({
          status: 'paired',
          gpsData: {
            latitude: device.latitude,
            longitude: device.longitude,
            altitude: device.altitude,
            accuracy: device.gpsAccuracy,
            heading: device.heading,
            timestamp: device.updatedAt.toISOString()
          },
          imuData: {
            accelerometer: {
              x: device.accelerometerX,
              y: device.accelerometerY,
              z: device.accelerometerZ
            },
            gyroscope: {
              x: device.gyroscopeX,
              y: device.gyroscopeY,
              z: device.gyroscopeZ
            },
            temperature: device.temperature
          },
          dongleBatchId: device.dongleBatchId
        });
        return;
      }
    }

    // Fallback for timeout or unknown status
    res.json({ status: session.status });
  } catch (error) {
    logger.error('Failed to get pairing status', { error });
    res.status(500).json({ error: 'Failed to get pairing status' });
  }
}

/**
 * POST /api/devices/:deviceId/gps-sync
 * Update device GPS coordinates from dongle or manual input
 */
export async function syncGps(req: Request, res: Response): Promise<void> {
  try {
    const { deviceId } = req.params;
    const { latitude, longitude, altitude, accuracy, heading, timestamp, syncMethod = 'manual' } = req.body;

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    // Find device
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Update device GPS data
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        latitude,
        longitude,
        altitude: altitude || null,
        gpsAccuracy: accuracy || null,
        heading: heading || null,
        gpsConfigured: true
      }
    });

    // Create GPS log entry for audit trail
    const gpsLog = await prisma.gpsLog.create({
      data: {
        deviceId,
        latitude,
        longitude,
        altitude: altitude || 0,
        accuracy: accuracy || 0,
        heading: heading || 0,
        syncMethod
      }
    });

    logger.info('GPS data synchronized', { deviceId, syncMethod });

    res.json({
      success: true,
      device: {
        id: updatedDevice.id,
        latitude: updatedDevice.latitude,
        longitude: updatedDevice.longitude,
        altitude: updatedDevice.altitude,
        gpsConfigured: updatedDevice.gpsConfigured
      },
      logId: gpsLog.id
    });
  } catch (error) {
    logger.error('Failed to sync GPS', { error });
    res.status(500).json({ error: 'Failed to synchronize GPS data' });
  }
}

/**
 * POST /api/devices/test-dongle
 * Test endpoint to simulate dongle button press
 */
export async function testDongle(req: Request, res: Response): Promise<void> {
  try {
    const dongleData: DongleData = {
      batchId: Math.random().toString(16).substring(2, 10).toUpperCase(),
      sessionMs: 10000,
      samples: 200,
      dateYMD: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, '')),
      timeHMS: parseInt(new Date().toTimeString().slice(0, 8).replace(/:/g, '')),
      msec: new Date().getMilliseconds(),
      lat: 33.888630 + (Math.random() - 0.5) * 0.01,
      lon: 35.495480 + (Math.random() - 0.5) * 0.01,
      alt: 79.20 + (Math.random() - 0.5) * 10,
      gpsFix: 1,
      sats: 7,
      ax: (Math.random() - 0.5) * 0.5,
      ay: (Math.random() - 0.5) * 0.5,
      az: 9.8 + (Math.random() - 0.5) * 0.3,
      gx: (Math.random() - 0.5) * 0.2,
      gy: (Math.random() - 0.5) * 0.2,
      gz: (Math.random() - 0.5) * 0.2,
      tempC: 25.0 + (Math.random() - 0.5) * 6
    };

    const gateway = getDongleGateway();
    const gpsData = gateway.dongleToGps(dongleData);

    await gateway.injectDongleData(dongleData);

    logger.info('Test dongle data injected', { batchId: dongleData.batchId });

    res.json({
      gpsData: {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        altitude: gpsData.altitude,
        accuracy: gpsData.accuracy,
        heading: gpsData.heading,
        timestamp: gpsData.timestamp.toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to test dongle', { error });
    res.status(500).json({ error: 'Failed to inject test data' });
  }
}

/**
 * Background worker to listen for dongle data during pairing
 */
async function startPairingWorker(sessionId: string, organizationId: string, existingDeviceId: string | null) {
  const subscriber = new Redis({
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379')
  });

  await subscriber.subscribe('dongle:data');

  const timeout = setTimeout(async () => {
    logger.info('Pairing session timed out', { sessionId });
    await prisma.pairingSession.update({
      where: { sessionId },
      data: { status: 'timeout' }
    });
    subscriber.disconnect();
  }, 60000);

  subscriber.on('message', async (channel, message) => {
    if (channel !== 'dongle:data') return;

    try {
      const dongleData: DongleData = JSON.parse(message);
      const gateway = getDongleGateway();
      const gpsData = gateway.dongleToGps(dongleData);

      logger.info('Dongle data received in pairing worker', {
        sessionId,
        batchId: dongleData.batchId,
        existingDevice: !!existingDeviceId
      });

      let device;

      if (existingDeviceId) {
        // Update existing device with dongle data (GPS + IMU)
        device = await prisma.device.update({
          where: { id: existingDeviceId },
          data: {
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            altitude: gpsData.altitude,
            gpsAccuracy: gpsData.accuracy,
            heading: gpsData.heading,
            gpsConfigured: true,
            // IMU sensor data
            accelerometerX: dongleData.ax,
            accelerometerY: dongleData.ay,
            accelerometerZ: dongleData.az,
            gyroscopeX: dongleData.gx,
            gyroscopeY: dongleData.gy,
            gyroscopeZ: dongleData.gz,
            temperature: dongleData.tempC,
            // Dongle session info
            dongleBatchId: dongleData.batchId,
            dongleSessionMs: dongleData.sessionMs,
            dongleSampleCount: dongleData.samples,
            // Dongle timestamp info
            dongleDateYMD: dongleData.dateYMD,
            dongleTimeHMS: dongleData.timeHMS,
            dongleMsec: dongleData.msec,
            // Dongle GPS info
            dongleGpsFix: dongleData.gpsFix,
            dongleSatellites: dongleData.sats,
            setupComplete: true
          }
        });
        logger.info('Device updated with dongle data', { deviceId: device.id });
      } else {
        // Create new device with GPS + IMU data
        device = await prisma.device.create({
          data: {
            name: `Device-${dongleData.batchId}`,
            deviceType: 'access_point',
            manufacturer: 'Unknown',
            ipAddress: '0.0.0.0',
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            altitude: gpsData.altitude,
            gpsAccuracy: gpsData.accuracy,
            heading: gpsData.heading,
            gpsConfigured: true,
            // IMU sensor data
            accelerometerX: dongleData.ax,
            accelerometerY: dongleData.ay,
            accelerometerZ: dongleData.az,
            gyroscopeX: dongleData.gx,
            gyroscopeY: dongleData.gy,
            gyroscopeZ: dongleData.gz,
            temperature: dongleData.tempC,
            // Dongle session info
            dongleBatchId: dongleData.batchId,
            dongleSessionMs: dongleData.sessionMs,
            dongleSampleCount: dongleData.samples,
            // Dongle timestamp info
            dongleDateYMD: dongleData.dateYMD,
            dongleTimeHMS: dongleData.timeHMS,
            dongleMsec: dongleData.msec,
            // Dongle GPS info
            dongleGpsFix: dongleData.gpsFix,
            dongleSatellites: dongleData.sats,
            setupComplete: true,
            status: 'offline',
            organizationId
          }
        });
        logger.info('Device created via dongle pairing', { deviceId: device.id });
      }

      // Create GPS log
      await prisma.gpsLog.create({
        data: {
          deviceId: device.id,
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          altitude: gpsData.altitude,
          accuracy: gpsData.accuracy,
          heading: gpsData.heading,
          syncMethod: 'dongle'
        }
      });

      // Update pairing session
      await prisma.pairingSession.update({
        where: { sessionId },
        data: {
          status: 'paired',
          deviceId: device.id,
          dongleId: dongleData.batchId
        }
      });

      clearTimeout(timeout);
      subscriber.disconnect();
    } catch (error) {
      logger.error('Failed to process dongle data in pairing worker', { error });
    }
  });
}

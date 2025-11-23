import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { authController } from '@/controllers/authController';
import { deviceController } from '@/controllers/deviceController';
import { settingsController } from '@/controllers/settingsController';
import * as pairingController from '@/controllers/pairingController';
import { netwatchController } from '@/controllers/netwatchController';
import { authenticateToken, requireOrganization } from '@/middleware/auth';
import { deviceSimulator } from '@/services/deviceSimulator';
import { getDongleGateway } from '@/services/dongleGateway';
import logger from '@/config/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env['FRONTEND_URL'] || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008'
    ],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env['FRONTEND_URL'] || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Airguard Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', (req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Authentication routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/refresh', authController.refreshToken);
app.post('/api/auth/logout', authenticateToken, authController.logout);
app.get('/api/auth/profile', authenticateToken, authController.getProfile);

// Device management routes
app.get('/api/devices/port-scan', authenticateToken, requireOrganization, deviceController.startPortScan);
app.post('/api/devices/import-dongle', authenticateToken, deviceController.importDongleData);
app.get('/api/devices', authenticateToken, requireOrganization, deviceController.getDevices);
app.post('/api/devices', authenticateToken, requireOrganization, deviceController.createDevice);
app.get('/api/devices/:id', authenticateToken, requireOrganization, deviceController.getDeviceById);
app.put('/api/devices/:id', authenticateToken, requireOrganization, deviceController.updateDevice);
app.delete('/api/devices/:id', authenticateToken, requireOrganization, deviceController.deleteDevice);

// Device metrics routes
app.post('/api/devices/:deviceId/metrics', authenticateToken, requireOrganization, deviceController.sendMetrics);
app.get('/api/devices/:deviceId/metrics', authenticateToken, requireOrganization, deviceController.getDeviceMetrics);
app.get('/api/devices/stats', authenticateToken, requireOrganization, deviceController.getDeviceStats);
app.get('/api/devices/locations', authenticateToken, requireOrganization, deviceController.getDeviceLocations);

// Device pairing & GPS sync routes
app.post('/api/devices/pair/start', authenticateToken, requireOrganization, pairingController.startPairing);
app.get('/api/devices/pair/status/:sessionId', authenticateToken, pairingController.getPairingStatus);
app.post('/api/devices/:deviceId/gps-sync', authenticateToken, requireOrganization, pairingController.syncGps);
app.post('/api/devices/test-dongle', authenticateToken, pairingController.testDongle);

// Settings routes
app.get('/api/settings', authenticateToken, settingsController.getUserSettings);
app.put('/api/settings', authenticateToken, settingsController.updateUserSettings);
app.post('/api/settings/test-key/:keyType', authenticateToken, settingsController.testApiKey);
app.delete('/api/settings/delete-key/:keyType', authenticateToken, settingsController.deleteApiKey);

// NetWatch integration routes
app.get('/api/network/connection-status', authenticateToken, netwatchController.getConnectionStatus);
app.post('/api/network/scan', authenticateToken, requireOrganization, netwatchController.triggerNetworkScan);
app.get('/api/network/discovered-devices', authenticateToken, requireOrganization, netwatchController.getDiscoveredDevices);
app.post('/api/network/setup-snmp', authenticateToken, requireOrganization, netwatchController.setupSnmp);
app.get('/api/network/wifi-devices', authenticateToken, requireOrganization, netwatchController.getWifiDevices);
app.get('/api/network/interference', authenticateToken, requireOrganization, netwatchController.getInterference);
app.get('/api/network/all-data', authenticateToken, requireOrganization, netwatchController.getAllData);
app.get('/api/network/status', authenticateToken, netwatchController.getServiceStatus);

// Dashboard routes
app.get('/api/dashboard/metrics', authenticateToken, requireOrganization, (req, res) => {
  res.json({
    success: true,
    data: {
      networkHealth: 98.2,
      throughput: 875,
      qosScore: 99.1,
      interference: -92,
      predictedLoad: 5
    }
  });
});

// Simulation control routes
app.post('/api/simulation/start', authenticateToken, requireOrganization, async (req, res) => {
  try {
    if (!req.user?.organizationId) {
      res.status(403).json({ success: false, error: 'Organization access required' });
      return;
    }

    const { intervalMs = 30000 } = req.body;
    await deviceSimulator.startSimulation(req.user.organizationId, intervalMs);

    res.json({ success: true, message: 'Device simulation started' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start simulation' });
  }
});

app.post('/api/simulation/stop', (req, res) => {
  deviceSimulator.stopSimulation();
  res.json({ success: true, message: 'Device simulation stopped' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('join-organization', (orgId: string) => {
    socket.join(`org-${orgId}`);
    logger.info('Client joined organization', { socketId: socket.id, orgId });
  });

  socket.on('subscribe-devices', (orgId: string) => {
    socket.join(`devices-${orgId}`);
    logger.info('Client subscribed to devices', { socketId: socket.id, orgId });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Airguard Backend API running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 Frontend URL: ${process.env['FRONTEND_URL'] || 'http://localhost:3000'}`);

  // Initialize dongle gateway
  getDongleGateway();
  logger.info('🛰️  Dongle Gateway initialized');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { io }; 
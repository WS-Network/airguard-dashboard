# 🚀 AIRGUARD PROJECT - COMPLETE SETUP & INTEGRATION GUIDE

**Target Platform**: NVIDIA Jetson Orin Nano (ARM64)
**Date**: November 16, 2025

---

## 📌 AGENT ASSIGNMENTS

### 🔧 LOCAL AGENT (Infrastructure & Deployment)
**Your Mission**: Get the complete AirGuard system running on Jetson Orin Nano
**Read Sections**: 1, 2, 3, 4, 5, 6
**Primary Focus**: Fix Tailwind CSS issue, verify frontend loads properly

### 👨‍💻 BACKEND AGENT (Feature Development)
**Your Mission**: Build ESP32 dongle integration and device pairing system
**Read Sections**: 1, 2, 7, 8, 9, 10
**Primary Focus**: ESP32 Gateway, Device Pairing API, SSH Service

---

# SECTION 1: PROJECT OVERVIEW (BOTH AGENTS READ THIS)

## What is AirGuard?
IoT monitoring system for managing wireless network devices (APs, routers, bridges). Runs on **Jetson Orin Nano** as edge computing platform.

## 3-Tier Architecture

```
┌─────────────────────────────────────────────┐
│ TIER 1: Jetson Orin Nano (Edge Brain)      │
│ - Next.js Frontend (port 3000)             │
│ - Express Backend API (port 3001)          │
│ - PostgreSQL (port 5543)                   │
│ - Redis (port 6379)                        │
└─────────────────────────────────────────────┘
                    ↕ USB Serial
┌─────────────────────────────────────────────┐
│ TIER 2: Main ESP32 (Radio Bridge)          │
│ - Receives ESP-NOW from dongles            │
│ - Streams JSON over USB to Jetson          │
└─────────────────────────────────────────────┘
                    ↕ ESP-NOW
┌─────────────────────────────────────────────┐
│ TIER 3: Dongle ESP32 (Field Tool)          │
│ - GPS + IMU + Button                       │
│ - Technician presses button near AP        │
│ - Sends data via ESP-NOW                   │
└─────────────────────────────────────────────┘
```

## Repositories
- **Frontend**: `https://github.com/Wirestorm-Software/airguard-frontend`
- **Backend**: `https://github.com/Wirestorm-Software/airguard-backend`

---

# SECTION 2: CURRENT STATE (BOTH AGENTS READ THIS)

## ✅ What Works
- **Backend API**: 100% functional on port 3001
- **Database**: PostgreSQL + Redis running in Docker
- **Frontend on Windows**: Works perfectly (x64 architecture)

## ❌ What's Broken
- **Frontend on Jetson**: Tailwind CSS v4 incompatible with Next.js 15.3.3 on ARM64
- **Error**: `Module parse failed: Unexpected character '@'`
- **Fix Applied**: Branch `claude/testing-01KFW6adLgAKjUb9c2rnFPud` has Tailwind v3 downgrade

## 🔨 What Needs to Be Built (BACKEND AGENT)
- ESP32 Gateway Service (serial port communication)
- Device Pairing API (dongle → database workflow)
- SSH Client Service (remote device configuration)

---

# SECTION 3: TECH STACK (LOCAL AGENT READ THIS)

## Frontend
- **Framework**: Next.js 15.3.3
- **React**: 19.0.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 3.4.0 ⚠️ (MUST be v3, not v4!)
- **Database**: Prisma 6.18.0

## Backend
- **Framework**: Express.js 4.18.0
- **Node.js**: 24.11.0
- **Database**: PostgreSQL 15 (Docker)
- **Cache**: Redis 7 (Docker)
- **ORM**: Prisma 5.22.0

## Platform
- **OS**: Linux (JetPack)
- **Architecture**: ARM64 (aarch64)
- **Docker**: 28.5.1

---

# SECTION 4: JETSON SETUP INSTRUCTIONS (LOCAL AGENT - PRIMARY TASK)

## Complete Setup Script

```bash
# ============================================
# 1. CLONE REPOSITORIES
# ============================================
cd /home/myuser/Documents/airguard-dashboard

# Backend
git clone git@github.com:Wirestorm-Software/airguard-backend.git

# Frontend (⚠️ CRITICAL: Use testing branch)
git clone git@github.com:Wirestorm-Software/airguard-frontend.git
cd airguard-frontend
git checkout claude/testing-01KFW6adLgAKjUb9c2rnFPud
git pull origin claude/testing-01KFW6adLgAKjUb9c2rnFPud

# ============================================
# 2. BACKEND SETUP
# ============================================
cd /home/myuser/Documents/airguard-dashboard/airguard-backend

# Environment setup
cp .env.example .env
nano .env
# Update:
# DATABASE_URL="postgresql://airguard_user:airguard_password@localhost:5543/airguard_db"

# Start Docker
docker compose up -d postgres redis

# Install & setup
npm install
npm run db:generate
npm run db:migrate  # Enter "init" when prompted

# Start backend
npx tsx src/index.ts &

# Test
curl http://localhost:3001/health
# Expected: {"success":true,"message":"Airguard Backend API is running"}

# ============================================
# 3. FRONTEND SETUP (⚠️ CRITICAL SECTION)
# ============================================
cd /home/myuser/Documents/airguard-dashboard/airguard-frontend

# Verify correct branch
git branch
# Should show: * claude/testing-01KFW6adLgAKjUb9c2rnFPud

# Environment
cp .env.example .env.local
nano .env.local
# Update DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# ⚠️ CRITICAL: Clean install for Tailwind v3
rm -rf node_modules package-lock.json .next

# Install
npm install

# ⚠️ VERIFY TAILWIND VERSION
npm list tailwindcss
# MUST show: tailwindcss@3.4.0 (NOT v4!)

# If still showing v4, run again:
rm -rf node_modules package-lock.json
npm install

# Generate Prisma
npx prisma generate

# Start frontend
npm run dev

# ============================================
# 4. VERIFICATION (LOCAL AGENT)
# ============================================

# Should see:
# ▲ Next.js 15.3.3
# - Local:        http://localhost:3000
# ✓ Ready in X.Xs

# Test endpoints
curl -I http://localhost:3000/login
# Expected: HTTP/1.1 200 OK (NOT 500!)

curl -I http://localhost:3000/signup
# Expected: HTTP/1.1 200 OK
```

## ⚠️ CRITICAL CHECKS (LOCAL AGENT)

```bash
# 1. Verify Tailwind v3
cat package.json | grep tailwindcss
# MUST show: "tailwindcss": "^3.4.0"

# 2. Verify config exists
ls -la tailwind.config.js
# Should exist

# 3. Check PostCSS
cat postcss.config.mjs
# Should have: tailwindcss: {}, autoprefixer: {}

# 4. Check CSS
head -5 src/app/globals.css
# Should show:
# @tailwind base;
# @tailwind components;
# @tailwind utilities;
```

---

# SECTION 5: FRONTEND FEATURES (LOCAL AGENT VERIFY THESE)

## What You Should See

### Login/Signup Pages
- Green/lime color theme
- Forms load properly
- No CSS errors in console

### Dashboard Setup Page (`/dashboard/setup`)
- **6 steps** (not 5):
  1. Device Type
  2. Location
  3. Wireless Config
  4. Network Config
  5. **Add Managed Devices** ← NEW STEP
  6. Review

### Step 5: Add Managed Devices
- **Default view**: Table (not map)
- **6 dummy devices** displayed
- **Columns**: Name, Manufacturer, IP, MAC, Open Ports, SSH Port, Status, Actions
- **Action buttons** per device:
  - ⚙️ Configure (SSH credentials modal)
  - 🛰️ GPS Sync (waiting modal with spinner)
  - 🗑️ Delete (confirmation modal)
- **Toggle**: Smooth animation between table ↔ map

## Device Data Structure

```typescript
interface DeviceData {
  id: string;
  name: string;              // "AP-Office-01"
  manufacturer: string;      // "Ubiquiti"
  ip: string;                // "192.168.1.10"
  macAddress: string;        // "AA:BB:CC:DD:EE:01"
  openPorts: string;         // "22, 80, 443"
  sshPort: string;           // "22"
  status: "up" | "down";
  latitude: number;
  longitude: number;
  location: string;
}
```

---

# SECTION 6: TROUBLESHOOTING (LOCAL AGENT)

## Issue: Still Getting CSS Errors

```bash
# Solution 1: Nuclear clean
rm -rf node_modules package-lock.json .next
npm install
npm run dev

# Solution 2: Verify files changed
git diff HEAD package.json
git diff HEAD src/app/globals.css
git diff HEAD tailwind.config.js

# Solution 3: Force pull
git fetch origin
git reset --hard origin/claude/testing-01KFW6adLgAKjUb9c2rnFPud
rm -rf node_modules .next
npm install
```

## Issue: Permission Denied on Serial Port

```bash
sudo chmod 666 /dev/ttyUSB0
sudo usermod -aG dialout $USER
newgrp dialout
```

## Success Criteria (LOCAL AGENT)

- [ ] Backend health check returns 200
- [ ] Frontend dev server starts without errors
- [ ] Login page loads (no 500 error)
- [ ] Can create account and log in
- [ ] Dashboard setup page shows 6 steps
- [ ] Step 5 shows device table with 6 devices
- [ ] Configure modal opens
- [ ] GPS Sync modal opens with spinner
- [ ] Map/table toggle works

---

# SECTION 7: BACKEND INTEGRATION REQUIREMENTS (BACKEND AGENT - PRIMARY TASK)

## Overview
Build the ESP32 → Jetson → Database pipeline for device pairing.

## Priority Order
1. **Database Schema Updates** (REQUIRED FIRST)
2. **ESP32 Gateway Service** (HIGH)
3. **Device Pairing API** (HIGH)
4. **SSH Client Service** (MEDIUM)

---

# SECTION 8: DATABASE SCHEMA (BACKEND AGENT)

## Update `airguard-backend/prisma/schema.prisma`

```prisma
model Device {
  id                  String   @id @default(cuid())
  name                String
  manufacturer        String?  // NEW
  ip                  String?  // NEW
  macAddress          String?  @unique // NEW
  openPorts           String?  // NEW (comma-separated: "22, 80, 443")
  sshPort             String   @default("22") // NEW
  deviceType          String?
  latitude            Float?
  longitude           Float?
  status              String   @default("down") // "up" | "down"
  batteryLevel        Int?
  firmwareVersion     String?
  location            String?
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id])
  metrics             DeviceMetric[]
  alerts              Alert[]
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("devices")
}

// NEW MODEL for pairing sessions
model PairingSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  status      String   @default("waiting") // "waiting" | "success" | "timeout"
  deviceId    String?
  dongleId    String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@map("pairing_sessions")
}
```

## Run Migration

```bash
cd airguard-backend
npx prisma migrate dev --name add_device_fields_and_pairing
npx prisma generate
```

---

# SECTION 9: ESP32 GATEWAY SERVICE (BACKEND AGENT)

## Install Dependencies

```bash
cd airguard-backend
npm install serialport @serialport/parser-readline ioredis
```

## Create `src/services/esp32-gateway.ts`

```typescript
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import Redis from 'ioredis';

interface DongleMessage {
  type: "ap_registration" | "gps_update";
  dongle_id: string;
  ap_mac?: string;
  ssid?: string;
  gps?: { lat: number; lon: number; alt: number };
  imu?: { yaw: number; pitch: number; roll: number };
  rssi?: number;
  battery?: number;
  timestamp: number;
}

export class ESP32Gateway {
  private port: SerialPort;
  private parser: ReadlineParser;
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async start() {
    this.port = new SerialPort({
      path: '/dev/ttyUSB0',
      baudRate: 115200,
    });

    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

    this.parser.on('data', async (line: string) => {
      await this.handleMessage(line);
    });

    console.log('ESP32 Gateway listening on /dev/ttyUSB0');
  }

  private async handleMessage(line: string) {
    try {
      const msg: DongleMessage = JSON.parse(line);

      if (this.validateMessage(msg)) {
        await this.publishToQueue(msg);
        console.log('ESP32 message received:', msg.type, msg.dongle_id);
      }
    } catch (err) {
      console.error('Failed to parse ESP32 message:', err);
    }
  }

  private validateMessage(msg: any): msg is DongleMessage {
    return (
      msg &&
      typeof msg.type === 'string' &&
      typeof msg.dongle_id === 'string' &&
      typeof msg.timestamp === 'number'
    );
  }

  private async publishToQueue(msg: DongleMessage) {
    await this.redis.publish('esp32:messages', JSON.stringify(msg));
  }
}
```

## Start Gateway in `src/index.ts`

```typescript
import { ESP32Gateway } from './services/esp32-gateway';

// ... existing code ...

const gateway = new ESP32Gateway();
gateway.start().catch(console.error);
```

---

# SECTION 10: DEVICE PAIRING API (BACKEND AGENT)

## Create `src/routes/devices.ts`

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();
const redis = new Redis({ host: 'localhost', port: 6379 });

// POST /api/devices/pair/start
router.post('/pair/start', async (req, res) => {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 60000); // 60 seconds

  await prisma.pairingSession.create({
    data: {
      sessionId,
      status: 'waiting',
      expiresAt,
    },
  });

  // Start pairing worker
  startPairingWorker(sessionId);

  res.json({
    session_id: sessionId,
    status: 'waiting',
    expires_at: expiresAt,
  });
});

// GET /api/devices/pair/status/:sessionId
router.get('/pair/status/:sessionId', async (req, res) => {
  const session = await prisma.pairingSession.findUnique({
    where: { sessionId: req.params.sessionId },
  });

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  let device = null;
  if (session.deviceId) {
    device = await prisma.device.findUnique({
      where: { id: session.deviceId },
    });
  }

  res.json({
    status: session.status,
    device,
  });
});

// Pairing worker
async function startPairingWorker(sessionId: string) {
  const subscriber = new Redis({ host: 'localhost', port: 6379 });
  await subscriber.subscribe('esp32:messages');

  const timeout = setTimeout(async () => {
    await prisma.pairingSession.update({
      where: { sessionId },
      data: { status: 'timeout' },
    });
    subscriber.disconnect();
  }, 60000);

  subscriber.on('message', async (channel, message) => {
    const msg = JSON.parse(message);

    if (msg.type === 'ap_registration') {
      // Create device
      const device = await prisma.device.create({
        data: {
          name: msg.ssid || `Device-${msg.ap_mac}`,
          manufacturer: 'Unknown',
          ip: '0.0.0.0', // To be configured
          macAddress: msg.ap_mac,
          sshPort: '22',
          status: 'down',
          latitude: msg.gps?.lat,
          longitude: msg.gps?.lon,
          location: `GPS: ${msg.gps?.lat}, ${msg.gps?.lon}`,
          organizationId: 'default-org-id', // TODO: Get from auth
        },
      });

      // Update session
      await prisma.pairingSession.update({
        where: { sessionId },
        data: {
          status: 'success',
          deviceId: device.id,
          dongleId: msg.dongle_id,
        },
      });

      clearTimeout(timeout);
      subscriber.disconnect();
    }
  });
}

export default router;
```

## Add Route to `src/index.ts`

```typescript
import devicesRouter from './routes/devices';

app.use('/api/devices', devicesRouter);
```

---

# SECTION 11: SSH CLIENT SERVICE (BACKEND AGENT)

## Install SSH2

```bash
npm install ssh2 @types/ssh2
```

## Create `src/services/ssh-client.ts`

```typescript
import { Client } from 'ssh2';
import Redis from 'ioredis';

const redis = new Redis({ host: 'localhost', port: 6379 });

export async function connectSSH(
  deviceIp: string,
  port: string,
  username: string,
  password: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const sessionId = `ssh:${Date.now()}`;

    conn.on('ready', () => {
      // Store session
      redis.setex(sessionId, 300, JSON.stringify({ deviceIp, port }));
      resolve(sessionId);
    });

    conn.on('error', (err) => {
      reject(err);
    });

    conn.connect({
      host: deviceIp,
      port: parseInt(port),
      username,
      password,
    });
  });
}

export async function executeCommand(
  sessionId: string,
  command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Implementation...
}
```

## Add SSH Routes to `src/routes/devices.ts`

```typescript
import { connectSSH, executeCommand } from '../services/ssh-client';

// POST /api/devices/:deviceId/ssh/connect
router.post('/:deviceId/ssh/connect', async (req, res) => {
  const { username, password } = req.body;
  const device = await prisma.device.findUnique({
    where: { id: req.params.deviceId },
  });

  if (!device || !device.ip) {
    return res.status(404).json({ error: 'Device not found' });
  }

  try {
    const sessionId = await connectSSH(
      device.ip,
      device.sshPort,
      username,
      password
    );
    res.json({ success: true, session_id: sessionId });
  } catch (err) {
    res.status(500).json({ error: 'SSH connection failed' });
  }
});
```

---

# SECTION 12: TESTING (BOTH AGENTS)

## LOCAL AGENT - Frontend Tests

```bash
# Test pages load
curl -I http://localhost:3000/login  # → 200 OK
curl -I http://localhost:3000/signup # → 200 OK

# Browser tests
# 1. Go to http://localhost:3000/signup
# 2. Create account
# 3. Login
# 4. Navigate to /dashboard/setup
# 5. Click Next 4 times to reach Step 5
# 6. Verify:
#    - Table shows 6 devices
#    - Configure button opens modal
#    - GPS Sync button opens waiting modal
#    - Toggle works (table ↔ map)
```

## BACKEND AGENT - API Tests

```bash
# Test ESP32 Gateway
echo '{"type":"ap_registration","dongle_id":"TEST-001","ap_mac":"AA:BB:CC:DD:EE:FF","gps":{"lat":33.8,"lon":35.5,"alt":100},"timestamp":1731663600}' > /dev/ttyUSB0

# Test pairing
curl -X POST http://localhost:3001/api/devices/pair/start
# Save session_id from response

curl http://localhost:3001/api/devices/pair/status/<session_id>
# Should show status: "waiting"

# Press dongle button (or send test data)
# Then check status again - should be "success" with device data
```

---

# SECTION 13: DATA FLOW (BOTH AGENTS UNDERSTAND THIS)

## Complete Workflow

```
1. User clicks "GPS Sync" button on device in frontend
          ↓
2. Frontend calls: POST /api/devices/pair/start
          ↓
3. Backend creates PairingSession (60s timeout)
4. Backend starts worker listening to Redis "esp32:messages" channel
          ↓
5. User walks to AP location with dongle
6. User presses button on dongle
          ↓
7. Dongle ESP32 captures GPS + WiFi scan
8. Sends via ESP-NOW to Main ESP32
          ↓
9. Main ESP32 formats as JSON, writes to USB serial
          ↓
10. ESP32 Gateway reads serial, parses JSON
11. Publishes to Redis "esp32:messages" channel
          ↓
12. Pairing worker receives message
13. Creates Device in database
14. Updates PairingSession status = "success"
          ↓
15. Frontend polling detects success
16. Shows device in table
17. Closes waiting modal
```

---

# SECTION 14: SUCCESS CRITERIA

## LOCAL AGENT Complete When:
- [ ] Backend running on port 3001, health check passes
- [ ] Frontend running on port 3000
- [ ] Login page loads without CSS errors
- [ ] Device table shows 6 dummy devices on Step 5
- [ ] All modals open correctly
- [ ] Map/table toggle works

## BACKEND AGENT Complete When:
- [ ] Database schema updated with new fields
- [ ] ESP32 Gateway reads from /dev/ttyUSB0
- [ ] Pairing API endpoints working
- [ ] Pressing dongle button creates device in database
- [ ] Frontend receives new device via polling
- [ ] SSH connection works from Configure modal

## Full System Working When:
All of the above ✅ AND:
- [ ] End-to-end: Button press → Device appears in table
- [ ] SSH commands execute successfully
- [ ] Real-time status updates work

---

**END OF DOCUMENT**

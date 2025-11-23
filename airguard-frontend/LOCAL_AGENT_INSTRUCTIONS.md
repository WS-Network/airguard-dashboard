# LOCAL AGENT - Jetson Setup Instructions

## 📦 Repository Information

### Backend Repository
- **URL**: https://github.com/Wirestorm-Software/airguard-backend
- **Branch**: `claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr`
- **Changes**: Phase 1 - Database schema updates (Prisma v6.19.0, new Device fields, PairingSession model)

### Frontend Repository
- **URL**: https://github.com/Wirestorm-Software/airguard-frontend
- **Branch**: `claude/testing-01KFW6adLgAKjUb9c2rnFPud`
- **Changes**: Synced with backend schema, Tailwind CSS v3 compatibility fix for ARM64

---

## 🔄 What Changed (Summary)

### BACKEND AGENT Changes (3 commits)
1. **Commit `3b11d78`**: Added new Device fields and PairingSession model
   - Device fields: `manufacturer`, `ip`, `macAddress`, `openPorts`, `sshPort`
   - New model: `PairingSession` for ESP32 dongle pairing workflow

2. **Commit `a69a04d`**: Updated Prisma from v5.10.0 → v6.19.0
   - Required for new schema features
   - Ensures backend/frontend compatibility

### FRONTEND AGENT Changes (4 commits since last sync)
1. **Commit `7f0ea11`**: Tailwind CSS v3 downgrade for ARM64 compatibility
   - Fixed Jetson deployment issue with Tailwind v4
   - Created `tailwind.config.js` with custom utilities

2. **Commit `a2ac6ed`**: Fixed Tailwind CSS v4 compatibility
   - Updated `globals.css` and `postcss.config.mjs`

3. **Commit `5c262c4`**: Added INTEGRATION_GUIDE.md
   - Comprehensive guide for local and backend agents

4. **Commit `90615e3`**: Synced frontend with backend database changes
   - Updated Prisma to v6.19.0
   - Added same Device fields as backend
   - Added PairingSession model

---

## 🚀 Step-by-Step Setup Instructions

### Prerequisites
- Jetson Orin Nano running Linux
- Node.js 24+ and npm 10+ installed
- Docker and Docker Compose installed
- Git configured with GitHub access

---

## PART 1: Backend Setup

### Step 1.1: Clone or Pull Backend Repository
```bash
# Navigate to your workspace
cd /home/myuser/Documents/airguard-dashboard

# If repository doesn't exist, clone it
git clone https://github.com/Wirestorm-Software/airguard-backend.git
cd airguard-backend

# OR if repository exists, navigate to it
cd airguard-backend
```

### Step 1.2: Checkout Testing Branch
```bash
# Fetch all branches
git fetch origin

# Checkout the backend testing branch
git checkout claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# Pull latest changes
git pull origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
```

**Expected Output:**
```
From https://github.com/Wirestorm-Software/airguard-backend
 * branch            claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
Updating bf9eab6..a69a04d
Fast-forward
 package-lock.json    | 386 +++++++++++++++++++++++++++---------
 package.json         |   4 +-
 prisma/schema.prisma |  22 ++-
 3 files changed, 363 insertions(+), 45 deletions(-)
```

### Step 1.3: Install Backend Dependencies
```bash
# Clean install to update Prisma
rm -rf node_modules package-lock.json
npm install
```

**Expected Output:**
```
added XXX packages in XXs
```

### Step 1.4: Verify Prisma Version
```bash
npm list @prisma/client prisma
```

**Expected Output:**
```
airguard-backend@1.0.0 /home/myuser/Documents/airguard-dashboard/airguard-backend
├── @prisma/client@6.19.0
└── prisma@6.19.0
```

✅ **CHECKPOINT**: Verify you see Prisma v6.19.0 for both packages

### Step 1.5: Setup Environment Variables
```bash
# Copy example env file if needed
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Required Variables:**
```bash
DATABASE_URL="postgresql://user:password@localhost:25060/airguard?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
REDIS_HOST="localhost"
REDIS_PORT="6379"
PORT="3001"
```

### Step 1.6: Start Docker Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected Output:**
```
NAME                     STATUS
airguard-backend-db-1    Up
airguard-backend-redis-1 Up
```

### Step 1.7: Generate Prisma Client & Run Migrations
```bash
# Generate Prisma client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_device_fields_and_pairing
```

**Expected Output from `prisma generate`:**
```
✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in XXXms
```

**Expected Output from `prisma migrate`:**
```
Applying migration `20251116xxxxxx_add_device_fields_and_pairing`

The following migration(s) have been applied:

migrations/
  └─ 20251116xxxxxx_add_device_fields_and_pairing/
    └─ migration.sql

Your database is now in sync with your schema.
```

✅ **CHECKPOINT**: Database migration successful

### Step 1.8: Start Backend Server
```bash
# Start backend in background
npx tsx src/index.ts &

# OR use npm script if available
npm run dev &
```

**Expected Output:**
```
🚀 Server is running on http://localhost:3001
✅ Database connected successfully
✅ Redis connected successfully
```

### Step 1.9: Test Backend Health
```bash
# Test health endpoint
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Airguard Backend API is running",
  "timestamp": "2025-11-16T..."
}
```

✅ **BACKEND SETUP COMPLETE** ✅

---

## PART 2: Frontend Setup

### Step 2.1: Clone or Pull Frontend Repository
```bash
# Navigate to your workspace
cd /home/myuser/Documents/airguard-dashboard

# If repository doesn't exist, clone it
git clone https://github.com/Wirestorm-Software/airguard-frontend.git
cd airguard-frontend

# OR if repository exists, navigate to it
cd airguard-frontend
```

### Step 2.2: Checkout Testing Branch
```bash
# Fetch all branches
git fetch origin

# Checkout the frontend testing branch
git checkout claude/testing-01KFW6adLgAKjUb9c2rnFPud

# Pull latest changes
git pull origin claude/testing-01KFW6adLgAKjUb9c2rnFPud
```

**Expected Output:**
```
From https://github.com/Wirestorm-Software/airguard-frontend
 * branch            claude/testing-01KFW6adLgAKjUb9c2rnFPud
Updating [hash]..90615e3
Fast-forward
 INTEGRATION_GUIDE.md | 784 +++++++++++++++++++++++++++++++++++++++++++
 package-lock.json    | 1741 +++++++++++++++++++++-----------------
 package.json         |    4 +-
 prisma/schema.prisma |   26 +-
 tailwind.config.js   |   29 ++
 postcss.config.mjs   |    6 +-
 src/app/globals.css  |   XX +-
 X files changed, XXXX insertions(+), XXX deletions(-)
```

### Step 2.3: Clean Install Dependencies (CRITICAL for ARM64)
```bash
# CRITICAL: Remove all cached files for Tailwind v3 compatibility
rm -rf node_modules package-lock.json .next

# Fresh install
npm install
```

**Expected Output:**
```
added 495 packages in XXs
```

⚠️ **IMPORTANT**: If you see warnings about Node.js version (requires >=24, current v22), that's OK for testing but consider upgrading to Node 24 LTS later.

### Step 2.4: Verify Tailwind CSS Version (CRITICAL)
```bash
# Verify Tailwind v3.4.0 is installed (NOT v4)
npm list tailwindcss
```

**Expected Output:**
```
airguard-web-frontend@0.1.0 /home/myuser/Documents/airguard-dashboard/airguard-frontend
└── tailwindcss@3.4.0
```

✅ **CHECKPOINT**: Verify Tailwind is v3.4.0 (NOT v4.x)

❌ **If you see v4.x**: Something went wrong. Re-run Step 2.3 completely.

### Step 2.5: Verify Prisma Version
```bash
npm list @prisma/client prisma
```

**Expected Output:**
```
airguard-web-frontend@0.1.0 /home/myuser/Documents/airguard-dashboard/airguard-frontend
├── @prisma/client@6.19.0
└── prisma@6.19.0
```

✅ **CHECKPOINT**: Verify Prisma v6.19.0 matches backend

### Step 2.6: Generate Prisma Client
```bash
# Generate Prisma client with updated schema
npx prisma generate
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in XXXms
```

### Step 2.7: Setup Environment Variables
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Required Variables:**
```bash
# Database (same as backend)
DATABASE_URL="postgresql://user:password@localhost:25060/airguard?sslmode=require"

# JWT Secrets (same as backend)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Cookies (for local development)
COOKIE_SECURE="false"
COOKIE_DOMAIN="localhost"
```

### Step 2.8: Start Frontend Development Server
```bash
# Start Next.js dev server
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 15.3.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in XXXms
 ○ Compiling / ...
 ✓ Compiled / in XXXs
```

### Step 2.9: Test Frontend in Browser
```bash
# Open browser and navigate to:
http://localhost:3000
```

**Expected Behavior:**
1. ✅ Page loads without errors
2. ✅ No Tailwind CSS parsing errors in console
3. ✅ Redirected to signup page (if not logged in)
4. ✅ All styles render correctly
5. ✅ Can navigate to login page

### Step 2.10: Test Device Management Page
```bash
# After logging in, navigate to:
http://localhost:3000/dashboard/home
```

**Expected Behavior:**
1. ✅ Device table displays with 6 dummy devices
2. ✅ Table shows: Device Name, Manufacturer, IP, MAC, Open Ports, SSH Port, Status, Actions
3. ✅ Map/Table toggle works
4. ✅ Configure button opens SSH modal
5. ✅ GPS Sync button opens waiting modal
6. ✅ Delete button opens confirmation modal

### Step 2.11: Test Device Setup Page
```bash
# Navigate to:
http://localhost:3000/dashboard/setup
```

**Expected Behavior:**
1. ✅ 6-step wizard displays correctly
2. ✅ Step 5 is "Add Managed Devices"
3. ✅ Step 5 shows device table/map view
4. ✅ Step 6 is "Review"

✅ **FRONTEND SETUP COMPLETE** ✅

---

## 🧪 PART 3: Integration Testing

### Test 3.1: Database Connection
```bash
# In backend directory
cd /home/myuser/Documents/airguard-dashboard/airguard-backend

# Open Prisma Studio to view database
npx prisma studio
```

**Expected Behavior:**
- Browser opens at http://localhost:5555
- Can view `devices` table with new columns: manufacturer, ip, macAddress, openPorts, sshPort
- Can view `pairing_sessions` table

### Test 3.2: API Endpoints
```bash
# Test user signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User",
    "companyName": "Test Company"
  }'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... }
}
```

### Test 3.3: Frontend-Backend Communication
1. Open frontend: http://localhost:3000
2. Sign up with new account
3. Login
4. Navigate to dashboard
5. Check browser console for any errors

**Expected Behavior:**
- ✅ Signup works
- ✅ Login works
- ✅ Dashboard loads
- ✅ No CORS errors
- ✅ No authentication errors

---

## 📊 Database Schema Changes (What Changed)

### Device Model - NEW FIELDS:
```prisma
model Device {
  id                    String   @id @default(cuid())
  name                  String
  deviceType            String?
  manufacturer          String?  // ← NEW: Device manufacturer
  ip                    String?  // ← NEW: IP address
  macAddress            String?  // ← NEW: MAC address
  openPorts             String?  // ← NEW: Comma-separated ports
  sshPort               String?  // ← NEW: SSH port number
  firmwareVersion       String?
  latitude              Float?
  longitude             Float?
  locationDescription   String?
  status                String   @default("offline")
  batteryLevel          Int?
  lastSeen              DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  organization          Organization @relation(fields: [organizationId], references: [id])
  organizationId        String
  metrics               DeviceMetric[]
  alerts                Alert[]
}
```

### PairingSession Model - NEW MODEL:
```prisma
model PairingSession {
  id                String   @id @default(cuid())
  sessionToken      String   @unique  // Token for dongle pairing
  status            String   @default("waiting") // waiting, paired, expired, cancelled
  deviceId          String?  // Device being paired (null until complete)
  dongleData        Json?    // GPS coordinates, IMU data from dongle
  createdAt         DateTime @default(now())
  expiresAt         DateTime // Session expires after 5 minutes
  completedAt       DateTime?
}
```

---

## ⚠️ Known Issues & Troubleshooting

### Issue 1: Tailwind CSS Parse Error on ARM64
**Symptom:**
```
Module parse failed: Unexpected character '@' (1:0)
> @import "tailwindcss";
```

**Solution:**
You already have the fix! Just ensure you ran Step 2.3 completely:
```bash
rm -rf node_modules package-lock.json .next
npm install
npm list tailwindcss  # Should show v3.4.0
```

### Issue 2: Prisma Client Out of Sync
**Symptom:**
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npx prisma generate
```

### Issue 3: Backend Not Connecting to Database
**Symptom:**
```
Error: Can't reach database server
```

**Solution:**
```bash
# Check Docker services
docker-compose ps

# Restart if needed
docker-compose down
docker-compose up -d

# Check DATABASE_URL in .env
```

### Issue 4: Port Already in Use
**Symptom:**
```
Error: Port 3000 is already in use
```

**Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## ✅ Success Criteria Checklist

### Backend:
- [ ] Git checkout to correct branch: `claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr`
- [ ] Pulled 2 commits: `3b11d78`, `a69a04d`
- [ ] Prisma updated to v6.19.0
- [ ] Database migration applied successfully
- [ ] Backend running on http://localhost:3001
- [ ] Health check returns 200 OK
- [ ] Can view new Device fields in Prisma Studio
- [ ] Can view PairingSession table in Prisma Studio

### Frontend:
- [ ] Git checkout to correct branch: `claude/testing-01KFW6adLgAKjUb9c2rnFPud`
- [ ] Pulled 4 commits including `90615e3`
- [ ] Tailwind CSS v3.4.0 installed (NOT v4)
- [ ] Prisma updated to v6.19.0
- [ ] Frontend running on http://localhost:3000
- [ ] No Tailwind CSS parse errors
- [ ] All pages load without errors
- [ ] Device table shows new columns
- [ ] Device setup wizard has 6 steps
- [ ] Modals (Configure, GPS Sync, Delete) work

### Integration:
- [ ] Signup/Login works end-to-end
- [ ] Frontend can communicate with backend
- [ ] No CORS errors
- [ ] No authentication errors
- [ ] Database persists data correctly

---

## 🚀 Next Steps After Testing

Once you confirm everything works:

1. **Report Success**: Confirm all checkboxes above are ✅
2. **Backend Phase 2**: Backend agent will implement ESP32 Gateway Service
3. **Backend Phase 3**: Backend agent will implement Device Pairing API
4. **Backend Phase 4**: Backend agent will implement SSH Client Service
5. **Frontend Updates**: Frontend agent will integrate with new backend APIs

---

## 📞 What to Report Back

Please provide status on:

1. **Backend Setup Status**:
   - ✅ Branch checked out correctly?
   - ✅ Prisma v6.19.0 installed?
   - ✅ Migration applied successfully?
   - ✅ Server running without errors?
   - ✅ Health check passes?

2. **Frontend Setup Status**:
   - ✅ Branch checked out correctly?
   - ✅ Tailwind v3.4.0 installed? (NOT v4)
   - ✅ Prisma v6.19.0 installed?
   - ✅ All pages load without errors?
   - ✅ Device table displays correctly?

3. **Any Errors Encountered**:
   - Copy full error messages
   - Include commands that caused errors
   - Include output from verification commands

---

**Last Updated**: 2025-11-16
**Backend Branch**: `claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr`
**Frontend Branch**: `claude/testing-01KFW6adLgAKjUb9c2rnFPud`
**Backend Commits**: 3b11d78, a69a04d (2 commits)
**Frontend Commits**: 7f0ea11, a2ac6ed, 5c262c4, 90615e3 (4 commits)

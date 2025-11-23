# ESP32 Dongle Integration - Implementation Order & Instructions

**Goal**: Get ESP32 dongle working end-to-end in this iteration

**Status**: Backend ✅ Complete | Frontend ⚠️ Needs Verification | Local 🔧 Setup Required

---

## 📋 RECOMMENDED ORDER

```
1. LOCAL AGENT   → Set up infrastructure (30 min)
2. FRONTEND AGENT → Fix integration issues (15 min)
3. LOCAL AGENT   → End-to-end testing (15 min)
```

**Reasoning**: Local agent must set up database and services before frontend can connect.

---

# PART 1: LOCAL AGENT - Infrastructure Setup (START HERE)

**Estimated Time**: 30 minutes

## Step 1: Pull Latest Backend Code (2 min)

```bash
cd airguard-backend

# Switch to testing branch
git checkout claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# Pull latest changes
git pull origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# Verify new files exist
ls -la dongle-service/
# Should show: gateway.py, Dockerfile, README.md, etc.
```

**Expected Output**:
```
Already on 'claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr'
Already up to date.
```

## Step 2: Database Migration (5 min)

**Add 19 new dongle fields to Device table:**

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_complete_dongle_fields
```

**Expected Output**:
```
✔ Generated Prisma Client (v6.19.0)
Applying migration `20251117_add_complete_dongle_fields`
✅ Migration applied successfully
```

**Verify Migration**:
```bash
# Open Prisma Studio
npx prisma studio

# In browser (http://localhost:5555):
# 1. Navigate to "Device" model
# 2. Scroll right - should see new fields:
#    - accelerometerX, accelerometerY, accelerometerZ
#    - gyroscopeX, gyroscopeY, gyroscopeZ
#    - temperature
#    - dongleBatchId, dongleSessionMs, dongleSampleCount
#    - dongleDateYMD, dongleTimeHMS, dongleMsec
#    - dongleGpsFix, dongleSatellites
#    - setupComplete (boolean)
```

## Step 3: Fix User Organizations (3 min)

**Critical**: Users need organizationId to access pairing endpoints.

```bash
# Run organization fix script
npm run db:fix-orgs
```

**Expected Output**:
```
Starting user organization fix...
Found 1 users without organizations
Fixing user: demo@airguard.com (user-id-12345)
✅ Created organization org-id-67890 for user demo@airguard.com
✅ User organization fix completed successfully
✅ All users now have organizations
Done!
```

**Verify in Prisma Studio**:
1. Keep Prisma Studio open (http://localhost:5555)
2. Navigate to **User** model
3. Find your user by email
4. Check `organizationId` column - should have UUID value (not null)

## Step 4: Configure Serial Port (2 min)

**Only if you have ESP32 hardware connected:**

```bash
# Find USB serial port
ls /dev/ttyUSB* /dev/ttyACM*

# Example output: /dev/ttyUSB0
```

**Update docker-compose.yml** (line 95):
```yaml
devices:
  - "/dev/ttyUSB0:/dev/ttyUSB0"  # Update this to match your port
```

**If no ESP32 hardware**: Skip this step - you'll use test endpoint instead.

## Step 5: Start All Docker Services (5 min)

```bash
# Build and start all services
docker-compose up -d --build

# Wait for services to start (30 seconds)
sleep 30

# Check all services are running
docker-compose ps
```

**Expected Output**:
```
NAME                        STATUS
airguard-postgres           Up
airguard-redis              Up
airguard-backend            Up
airguard-dongle-service     Up (or Restarting if no USB device)
airguard-prisma-studio      Up
```

**Note**: `dongle-service` may show "Restarting" if `/dev/ttyUSB0` doesn't exist - this is OK for testing without hardware.

## Step 6: Verify Services (3 min)

```bash
# Check backend health
curl http://localhost:3001/health

# Expected: {"success":true,"message":"Airguard Backend API is running",...}

# Check Redis
docker-compose exec redis redis-cli ping

# Expected: PONG

# Check PostgreSQL
docker-compose exec postgres psql -U airguard_user -d airguard_db -c "SELECT 1;"

# Expected:
#  ?column?
# ----------
#        1
```

## Step 7: Check Service Logs (2 min)

```bash
# Backend logs
docker-compose logs backend | tail -20

# Should see:
# ✅ Server started on port 3001
# ✅ Database connected successfully
# ✅ Redis connected

# Dongle service logs (if hardware connected)
docker-compose logs dongle-service | tail -10

# Should see:
# ✅ Serial port opened: /dev/ttyUSB0 @ 115200
# ✅ Redis connected: redis:6379
# (Or "Serial port failed" if no USB device - OK for testing)
```

## Step 8: Create Test JWT Token (5 min)

**Login to get JWT token for testing:**

```bash
# Login with your user credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@airguard.com",
    "password": "your-password"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Copy the `accessToken` value** - you'll need it for testing.

**Save it in a variable**:
```bash
export JWT_TOKEN="paste-your-token-here"

# Verify it works
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $JWT_TOKEN"

# Should return your user profile
```

## Step 9: Test Pairing Endpoint (3 min)

```bash
# Test pairing session creation
curl -X POST http://localhost:3001/api/devices/pair/start \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "sessionId": "uuid-v4-here",
  "status": "waiting"
}
```

**If you get 403 Forbidden**: User doesn't have organizationId
- **Fix**: Go back to Step 3, run `npm run db:fix-orgs`
- Then logout/login from frontend to get new token with organizationId

**If you get 500 error**: Check backend logs
```bash
docker-compose logs backend | tail -50
```

## Step 10: Test Dongle Data Injection (3 min)

**Simulate ESP32 button press without hardware:**

```bash
# Inject test dongle data
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "gpsData": {
    "latitude": 33.88863,
    "longitude": 35.49548,
    "altitude": 79.2,
    "accuracy": 3.5,
    "heading": 0,
    "timestamp": "2025-11-17T..."
  }
}
```

**Verify Data Stored in Database**:
```bash
# Open Prisma Studio (if not already open)
npx prisma studio

# In browser:
# 1. Navigate to "Device" model
# 2. Find newly created device
# 3. Check all 19 dongle fields are populated:
#    - latitude: 33.88863
#    - longitude: 35.49548
#    - accelerometerX: 0.15
#    - gyroscopeX: 0.02
#    - temperature: 25.3
#    - dongleBatchId: (8-char hex)
#    - setupComplete: true
```

---

# ✅ LOCAL AGENT CHECKPOINT

**At this point you should have:**

- ✅ Database migrated with 19 new fields
- ✅ All users have organizationId assigned
- ✅ All Docker services running
- ✅ Backend API responding to requests
- ✅ Test dongle endpoint creates devices successfully
- ✅ JWT token ready for frontend testing

**Status**: Infrastructure setup complete! ✅

**Next**: Switch to **FRONTEND AGENT** to fix integration issues.

---

# PART 2: FRONTEND AGENT - Integration Fixes

**Estimated Time**: 15 minutes

## Prerequisites

- ✅ Backend running at `http://localhost:3001`
- ✅ Valid JWT token from local agent
- ✅ User has organizationId assigned

## Step 1: Pull Latest Frontend Code (2 min)

```bash
cd airguard-frontend

# Switch to testing branch
git checkout claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# Pull latest changes
git pull origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
```

## Step 2: Fix Cyclic Object Error (5 min)

**Issue**: Error logging causes "cyclic object value" when API errors occur.

**File**: `src/app/dashboard/setup/page.tsx` (around line 376)

**Find this code**:
```typescript
// Line ~376 in handleUseGps function
catch (error) {
  console.error('Error starting GPS pairing:', error);
  // OR
  console.error('Error starting GPS pairing:', JSON.stringify(error));
}
```

**Replace with**:
```typescript
catch (error) {
  console.error('Error starting GPS pairing:', {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : 'UnknownError',
    status: (error as any)?.response?.status,
    data: (error as any)?.response?.data
  });
}
```

**Why**: The error object from Axios has circular references. We need to extract only the serializable parts.

## Step 3: Verify Pairing Request Body (3 min)

**File**: `src/app/dashboard/setup/page.tsx`

**Find the pairing API call** (search for `POST /api/devices/pair/start`):

```typescript
const response = await fetch(`${API_URL}/api/devices/pair/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  // Check if body is included for existing devices
  body: JSON.stringify({ deviceId: existingDeviceId }) // If applicable
});
```

**Two scenarios**:

**Scenario A - Airguard Setup (New Device)**:
```typescript
// No deviceId in body - creates new device
body: JSON.stringify({})  // Or omit body entirely
```

**Scenario B - Managed Device (Update Existing)**:
```typescript
// Include deviceId - updates existing device
body: JSON.stringify({ deviceId: device.id })
```

**Verify**: Check which workflow you're implementing and ensure the body matches.

## Step 4: Verify IMU Data Display (5 min)

**File**: GPS modal component (likely `src/components/GPSModal.tsx` or in `setup/page.tsx`)

**Check for IMU data rendering**:

```typescript
// Should display IMU data from pairing status response
{pairingStatus.imuData && (
  <div className="imu-section">
    <h3>IMU Sensor Data</h3>

    <div className="accelerometer">
      <p>Accelerometer:</p>
      <p>X: {pairingStatus.imuData.accelerometer.x.toFixed(2)} m/s²</p>
      <p>Y: {pairingStatus.imuData.accelerometer.y.toFixed(2)} m/s²</p>
      <p>Z: {pairingStatus.imuData.accelerometer.z.toFixed(2)} m/s²</p>
    </div>

    <div className="gyroscope">
      <p>Gyroscope:</p>
      <p>X: {pairingStatus.imuData.gyroscope.x.toFixed(2)} rad/s</p>
      <p>Y: {pairingStatus.imuData.gyroscope.y.toFixed(2)} rad/s</p>
      <p>Z: {pairingStatus.imuData.gyroscope.z.toFixed(2)} rad/s</p>
    </div>

    <div className="temperature">
      <p>Temperature: {pairingStatus.imuData.temperature.toFixed(1)}°C</p>
    </div>
  </div>
)}
```

**If missing**: Add this section to your GPS modal/success view.

## Step 5: Test Frontend Integration (5 min)

```bash
# Start frontend dev server
npm run dev

# Should start at http://localhost:3000
```

**Manual Testing**:

1. Open browser: `http://localhost:3000`
2. **Logout and login again** (important to get new JWT with organizationId)
3. Navigate to Device Setup page
4. Click **"Use GPS"** button
5. **Check browser console** - should NOT show "cyclic object value" error
6. Modal should show "Waiting for GPS signal..."

**If 403 Forbidden**: User still doesn't have organizationId
- **Fix**: Tell local agent to re-run `npm run db:fix-orgs`
- **You must**: Logout and login again to get new token

**If "cyclic object value"**: Error logging not fixed
- Go back to Step 2

**If working**: Modal shows "Waiting..." without errors ✅

## Step 6: Commit Frontend Fixes

```bash
git add src/app/dashboard/setup/page.tsx
# Add any other modified files

git commit -m "Fix cyclic object error in GPS pairing error handling

- Replace JSON.stringify(error) with safe error serialization
- Extract only serializable error properties (message, name, status)
- Prevents 'cyclic object value' TypeError in console
- Improves error logging for debugging API failures
"

git push origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
```

---

# ✅ FRONTEND AGENT CHECKPOINT

**At this point you should have:**

- ✅ Cyclic object error fixed
- ✅ Pairing request body correct
- ✅ IMU data display implemented
- ✅ "Use GPS" button works without console errors
- ✅ Modal shows "Waiting for GPS signal..."

**Status**: Frontend integration complete! ✅

**Next**: Back to **LOCAL AGENT** for end-to-end testing.

---

# PART 3: LOCAL AGENT - End-to-End Testing

**Estimated Time**: 15 minutes

## Prerequisites

- ✅ Backend services running
- ✅ Frontend dev server running (`npm run dev`)
- ✅ User has organizationId
- ✅ Frontend fixes applied

## Test 1: Pairing with Test Endpoint (5 min)

**In Browser** (`http://localhost:3000`):

1. **Logout and login again** (get new token with organizationId)
2. Navigate to Device Setup
3. Click **"Use GPS"** button
4. Modal opens: "Waiting for GPS signal..."

**In Terminal**:

```bash
# Inject test dongle data
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Result** (in browser):

- ✅ Modal updates to "GPS Acquired!" or similar success message
- ✅ **IMU Sensor Data section appears** with:
  - Accelerometer: X: 0.15 m/s², Y: -0.08 m/s², Z: 9.82 m/s²
  - Gyroscope: X: 0.02 rad/s, Y: -0.01 rad/s, Z: 0.00 rad/s
  - Temperature: 25.3°C
- ✅ GPS coordinates display: ~33.888630, ~35.495480
- ✅ "Continue" or "Finish" button enabled

**Verify in Database**:

```bash
# Open Prisma Studio
npx prisma studio

# Navigate to Device model
# Find newly created device
# Verify ALL 19 fields populated:
# - GPS: lat, lon, alt, gpsAccuracy, heading, dongleGpsFix, dongleSatellites
# - IMU: ax, ay, az, gx, gy, gz, temperature
# - Meta: dongleBatchId, dongleSessionMs, dongleSampleCount
# - Time: dongleDateYMD, dongleTimeHMS, dongleMsec
# - Status: setupComplete = true
```

## Test 2: Pairing with Real ESP32 (Optional, 5 min)

**Only if you have ESP32 hardware:**

```bash
# Check dongle service is running
docker-compose logs dongle-service | tail -20

# Should show:
# ✅ Serial port opened: /dev/ttyUSB0
# ✅ Gateway started, listening for dongle data...
```

**In Browser**:

1. Click **"Use GPS"** button
2. Modal shows "Waiting for GPS signal..."

**Physical Action**:

3. **Press button on ESP32 sender dongle**
4. ESP32 receiver (USB) should receive data
5. Dongle service publishes to Redis

**Expected Result** (in browser):

- ✅ Modal updates with real GPS data from dongle
- ✅ IMU sensor data displays
- ✅ Device created with actual sensor readings

**Check Dongle Logs**:

```bash
docker-compose logs -f dongle-service

# Should show:
# Published to Redis: A3F5B21C -> dongle:data
```

## Test 3: Verify Complete Data Flow (5 min)

**Monitor entire pipeline:**

```bash
# Terminal 1: Watch Redis pub/sub
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data

# Terminal 2: Watch backend logs
docker-compose logs -f backend

# Terminal 3: Inject test data
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Flow**:

1. **Terminal 3**: Request sent
2. **Terminal 1**: Redis message appears with JSON data
3. **Terminal 2**: Backend logs "Pairing session updated" or "Device created"
4. **Browser**: Modal updates with GPS + IMU data
5. **Prisma Studio**: New device record with all 19 fields

## Test 4: Error Handling (2 min)

**Test timeout scenario:**

1. Click "Use GPS" button
2. Wait 60+ seconds without triggering dongle
3. Modal should show "Timeout" or error message
4. No console errors (cyclic object fixed!)

**Test 403 scenario** (if user has no org):

1. Remove user's organizationId in Prisma Studio
2. Click "Use GPS" button
3. Should show friendly error message
4. Console shows clean error object (not cyclic)

---

# ✅ FINAL VERIFICATION CHECKLIST

## Backend ✅

- [ ] All Docker services running (`docker-compose ps`)
- [ ] Database migration applied (19 new fields in Device model)
- [ ] Users have organizationId assigned
- [ ] Pairing endpoint returns sessionId
- [ ] Test dongle endpoint works
- [ ] Redis pub/sub functional

## Frontend ✅

- [ ] Cyclic object error fixed (no console errors)
- [ ] "Use GPS" button triggers pairing
- [ ] Modal shows "Waiting for GPS signal..."
- [ ] IMU sensor data section implemented
- [ ] GPS coordinates display correctly
- [ ] Success state shows all sensor data

## End-to-End ✅

- [ ] Click "Use GPS" → Modal opens
- [ ] Trigger test dongle → Modal updates
- [ ] GPS coordinates display (33.888630, 35.495480)
- [ ] IMU data displays (accel, gyro, temp)
- [ ] Device created in database
- [ ] All 19 dongle fields populated
- [ ] setupComplete = true
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

# 🎯 SUCCESS CRITERIA

**This iteration is complete when:**

1. ✅ User can click "Use GPS" button without errors
2. ✅ Modal shows "Waiting for GPS signal..."
3. ✅ Test dongle endpoint triggers data flow
4. ✅ Modal displays GPS coordinates + IMU sensor data
5. ✅ Device record created with all 19 dongle fields
6. ✅ No console errors (cyclic object fixed)
7. ✅ Complete data flow: Button → ESP32/API → Redis → Backend → DB → Frontend

---

# 🚨 TROUBLESHOOTING

## Issue: 403 Forbidden

**Symptom**: "Organization access required" when clicking "Use GPS"

**Fix**:
```bash
# Local agent:
npm run db:fix-orgs

# User must logout/login to get new token
```

## Issue: Cyclic Object Error

**Symptom**: "TypeError: cyclic object value" in console

**Fix**: Frontend agent - see Part 2, Step 2

## Issue: Modal Doesn't Update

**Symptom**: Modal stuck on "Waiting..." after triggering dongle

**Debug**:
```bash
# Check backend logs
docker-compose logs backend | grep pairing

# Check Redis
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data

# Verify frontend is polling:
# Check Network tab in browser DevTools
# Should see repeated GET requests to /api/devices/pair/status/:sessionId
```

## Issue: No IMU Data Displays

**Symptom**: GPS shows but no IMU sensor section

**Fix**: Frontend agent - verify Part 2, Step 4 implementation

---

# 📊 TIMELINE ESTIMATE

| Phase | Agent | Time | Tasks |
|-------|-------|------|-------|
| **Phase 1** | Local | 30 min | Infrastructure setup |
| **Phase 2** | Frontend | 15 min | Fix integration issues |
| **Phase 3** | Local | 15 min | End-to-end testing |
| **Total** | Both | **60 min** | **Complete iteration** |

---

# 📝 DELIVERABLES

**Local Agent**:
- [ ] Database migrated
- [ ] Services running
- [ ] Users fixed (organizationId)
- [ ] Test results documented
- [ ] Screenshots of working flow

**Frontend Agent**:
- [ ] Cyclic error fixed
- [ ] IMU display implemented
- [ ] Code committed and pushed
- [ ] No console errors confirmed

---

**Last Updated**: 2025-11-17
**Iteration Goal**: Working ESP32 dongle integration
**Status**: Ready to start - begin with LOCAL AGENT Part 1

# END-TO-END TESTING GUIDE - Ready to Test Now!

**Status**: Backend ✅ Complete | Frontend ✅ Complete | Ready for E2E Testing

---

## 🚨 CRITICAL FIRST STEP - MUST DO THIS

### User Must Logout and Re-Login

**Why**: The organization fix added `organizationId` to the database, but your current JWT token doesn't have it. You need a fresh token.

**Steps**:
1. Open browser: `http://localhost:3003`
2. Click **Logout** (top-right menu)
3. Login again:
   - Email: `demo@airguard.com`
   - Password: `demo123`
4. You now have a JWT token with `organizationId` ✅

**What this fixes**: The 403 Forbidden error when clicking "Use GPS"

---

## 🧪 TEST 1: Complete Pairing Flow (5 minutes)

### Step 1: Start Pairing Session

**In Browser** (`http://localhost:3003`):

1. Navigate to **Device Setup** page
2. Click **"Use GPS"** button
3. Modal should open showing: "Waiting for GPS signal..."
4. **Check browser console** - should have NO errors (cyclic error is fixed)

### Step 2: Trigger Dongle Data

**In Terminal** (from backend directory):

```bash
cd airguard-backend

# Get JWT token from browser
# Option A: From browser DevTools → Application → Local Storage → auth token
# Option B: Login via curl to get token

# Export token
export JWT_TOKEN="your-jwt-token-from-browser"

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

### Step 3: Verify Frontend Updates

**Back in Browser** - Modal should now show:

✅ **GPS Coordinates**:
- Latitude: 33.888630
- Longitude: 35.495480
- Altitude: 79.2 m

✅ **IMU Sensor Data** (according to frontend agent - already implemented):
- **Accelerometer**: X: 0.15 m/s², Y: -0.08 m/s², Z: 9.82 m/s²
- **Gyroscope**: X: 0.02 rad/s, Y: -0.01 rad/s, Z: 0.00 rad/s
- **Temperature**: 25.3°C

✅ **Success State**: "GPS Acquired!" or similar confirmation

✅ **No Console Errors**: Cyclic error is fixed

---

## 🔍 TEST 2: Verify Database (2 minutes)

### Open Prisma Studio

```bash
# Already running at http://localhost:5555
# Or start it:
npx prisma studio
```

### Check Device Record

1. Navigate to **Device** model
2. Find the newly created device (latest entry)
3. Scroll through fields and verify **all 19 dongle fields** are populated:

**GPS Data (7 fields)**:
- ✅ `latitude`: 33.88863
- ✅ `longitude`: 35.49548
- ✅ `altitude`: 79.2
- ✅ `gpsAccuracy`: 3.5
- ✅ `heading`: 0
- ✅ `dongleGpsFix`: 1
- ✅ `dongleSatellites`: 7

**IMU Sensors (7 fields)**:
- ✅ `accelerometerX`: 0.15
- ✅ `accelerometerY`: -0.08
- ✅ `accelerometerZ`: 9.82
- ✅ `gyroscopeX`: 0.02
- ✅ `gyroscopeY`: -0.01
- ✅ `gyroscopeZ`: 0.00
- ✅ `temperature`: 25.3

**Metadata (5 fields)**:
- ✅ `dongleBatchId`: (8-character hex, e.g., "A3F5B21C")
- ✅ `dongleSessionMs`: 10000
- ✅ `dongleSampleCount`: 200
- ✅ `dongleDateYMD`: 20251117
- ✅ `dongleTimeHMS`: (6-digit time)

**Status**:
- ✅ `setupComplete`: true
- ✅ `gpsConfigured`: true

---

## 📊 TEST 3: Monitor Complete Data Flow (5 minutes)

### Terminal Setup

**Terminal 1 - Redis Monitor**:
```bash
cd airguard-backend
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data

# Leave this open - you'll see messages when dongle triggers
```

**Terminal 2 - Backend Logs**:
```bash
cd airguard-backend
docker-compose logs -f backend

# Watch for:
# - "Pairing session started"
# - "Device created" or "Device updated"
```

**Terminal 3 - Trigger Dongle**:
```bash
cd airguard-backend

# Trigger test dongle
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Expected Flow

**Sequence**:
1. **Terminal 3**: Request sent ✅
2. **Terminal 1** (Redis): JSON message appears with dongle data ✅
3. **Terminal 2** (Backend): Logs show "Device created with dongle data" ✅
4. **Browser**: Modal updates with GPS + IMU ✅
5. **Prisma Studio**: Refresh - new device with 19 fields ✅

---

## ✅ SUCCESS VERIFICATION CHECKLIST

### Frontend ✅
- [ ] "Use GPS" button opens modal
- [ ] Modal shows "Waiting for GPS signal..."
- [ ] No "cyclic object value" error in console
- [ ] After trigger: GPS coordinates display
- [ ] After trigger: IMU sensor data displays (accel, gyro, temp)
- [ ] Success message shown
- [ ] No errors in browser console

### Backend ✅
- [ ] Pairing endpoint returns sessionId
- [ ] Test dongle endpoint returns GPS data
- [ ] Backend logs show device creation
- [ ] No errors in backend logs

### Database ✅
- [ ] Device record created in Prisma Studio
- [ ] All 19 dongle fields populated with values
- [ ] `setupComplete` = true
- [ ] `gpsConfigured` = true
- [ ] GPS coordinates match test data
- [ ] IMU values match test data

### Redis ✅
- [ ] Messages appear on `dongle:data` channel
- [ ] JSON structure is correct
- [ ] All 19 fields present in message

---

## 🎯 QUICK TEST COMMANDS

### Get JWT Token from Browser

```javascript
// Open browser console (F12) and run:
localStorage.getItem('authToken')
// Copy the token value
```

### Complete Test Sequence

```bash
# Export token
export JWT_TOKEN="paste-token-here"

# Test pairing session
curl -X POST http://localhost:3001/api/devices/pair/start \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Trigger dongle data
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"

# Check database
npx prisma studio
# Navigate to Device model → Latest device → Verify 19 fields
```

---

## 🐛 TROUBLESHOOTING

### Issue: 403 Forbidden

**Symptom**: "Organization access required" when clicking "Use GPS"

**Cause**: User hasn't logged out/in after organization fix

**Fix**:
1. Logout from frontend
2. Login again
3. Get fresh JWT token with organizationId

### Issue: Modal Doesn't Update

**Symptom**: Modal stuck on "Waiting..." after curl trigger

**Debug Steps**:
```bash
# Check backend logs
docker-compose logs backend | grep -i pairing

# Check Redis pub/sub
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data

# Verify frontend is polling
# In browser DevTools → Network tab
# Should see repeated GET requests to:
# /api/devices/pair/status/SESSION_ID
```

**Likely Causes**:
- Frontend not polling status endpoint
- Backend not publishing to Redis
- Session ID mismatch

### Issue: Database Fields Not Populated

**Symptom**: Device exists but dongle fields are null

**Debug**:
```bash
# Check backend logs for errors
docker-compose logs backend | tail -50

# Check Redis received data
docker-compose exec redis redis-cli
> SUBSCRIBE dongle:data
# Then trigger test-dongle in another terminal
# Should see JSON message
```

### Issue: No IMU Data in Modal

**Symptom**: GPS shows but no IMU sensor section

**Note**: Frontend agent says IMU display is already implemented on their branch (`claude/testing-01KFW6adLgAKjUb9c2rnFPud`)

**Verify**:
1. Check browser console for API response
2. Should include `imuData` object with accelerometer/gyroscope/temperature
3. If missing, check backend is returning complete pairing status

---

## 📸 DOCUMENTATION

### Take Screenshots

For documentation, capture:

1. **Frontend**: GPS modal showing GPS + IMU data
2. **Prisma Studio**: Device record with all 19 fields populated
3. **Terminal**: Redis pub/sub messages
4. **Browser Console**: No errors (cyclic fixed)

---

## 🎉 SUCCESS CRITERIA

**This iteration is COMPLETE when:**

✅ User clicks "Use GPS" without errors
✅ Test dongle triggers data flow
✅ Frontend displays GPS coordinates
✅ Frontend displays IMU sensor data (accel, gyro, temp)
✅ Database has device with all 19 dongle fields
✅ No console errors (cyclic fixed)
✅ Complete data flow verified: API → Redis → Backend → DB → Frontend

---

## 🚀 NEXT STEPS AFTER SUCCESS

### 1. Test with Real ESP32 (Optional)

If you have ESP32 hardware:

```bash
# Find USB port
ls /dev/ttyUSB*

# Update docker-compose.yml line 95 with your port
# Restart dongle service
docker-compose restart dongle-service

# Check logs
docker-compose logs -f dongle-service

# Press physical button on ESP32 sender
# Should see real GPS/IMU data flow through
```

### 2. Document Results

Create summary:
- What worked ✅
- What issues encountered
- Screenshots of working flow
- Performance observations

### 3. Merge to Main (When Ready)

```bash
# Backend
cd airguard-backend
git checkout main
git merge claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# Frontend
cd airguard-frontend
git checkout main
git merge claude/testing-01KFW6adLgAKjUb9c2rnFPud
```

---

**Testing Time Estimate**: 15-20 minutes
**Required**: User must logout/login first!
**Status**: Ready to test NOW ✅

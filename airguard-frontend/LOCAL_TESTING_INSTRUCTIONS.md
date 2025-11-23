# Local Testing Instructions - Frontend IMU Sensor Integration

## Overview

This guide provides step-by-step instructions for testing the complete ESP32 GPS/IMU dongle integration with the Airguard frontend on your local machine.

## What's Been Implemented

✅ Complete IMU sensor integration (19 dongle fields)
✅ Authentication with Bearer tokens (JWT from httpOnly cookies)
✅ Two-stage device creation workflow
✅ Managed device workflow (SSH + GPS sync)
✅ GPS modal with sensor data display
✅ Fixed cyclic object error in error logging

## Prerequisites

Before testing, ensure you have:

1. **Backend server running** at `http://localhost:3001`
2. **Frontend server running** at `http://localhost:3000`
3. **Database migrated** with latest schema (19 dongle fields)
4. **Organization assignment fix applied** (see Backend Setup below)

---

## Backend Setup

### Step 1: Fix Organization Assignment (CRITICAL)

The pairing endpoint requires users to have an `organizationId`. Run this script to fix existing users:

```bash
# In the backend directory
cd ~/airguard-backend
npm run db:fix-orgs
```

**Expected Output:**
```
Starting user organization fix...
Found 1 users without organizations
Fixing user: demo@airguard.com (abc123)
✅ Created organization xyz789 for user demo@airguard.com
✅ User organization fix completed successfully
✅ All users now have organizations
Done!
```

### Step 2: Verify Database Schema

Check that the Device model has all 19 dongle fields:

```bash
npx prisma studio
```

Navigate to the `Device` model and verify these fields exist:
- **GPS Fields:** latitude, longitude, altitude, gpsAccuracy, heading, gpsTimestamp
- **IMU Accelerometer:** accelerometerX, accelerometerY, accelerometerZ
- **IMU Gyroscope:** gyroscopeX, gyroscopeY, gyroscopeZ
- **IMU Temperature:** temperature
- **Dongle Info:** dongleBatchId
- **GPS Quality:** dongleGpsFix, dongleSatellites

### Step 3: Start Backend Server

```bash
npm run dev
```

Verify backend is running at `http://localhost:3001`

---

## Frontend Setup

### Step 1: Update Environment Configuration

Ensure `.env.local` has the correct backend API URL:

```bash
# In the frontend directory
cd ~/airguard-frontend

# Check .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL
```

Should show:
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

If not set, add it:
```bash
echo 'NEXT_PUBLIC_API_URL="http://localhost:3001"' >> .env.local
```

### Step 2: Start Frontend Server

```bash
npm run dev
```

Frontend should be running at `http://localhost:3000`

---

## Testing Workflows

### Important: Re-login Required

After running the backend organization fix script, you MUST re-login to the frontend to get a new JWT token with the updated `organizationId`.

**How to Re-login:**
1. Go to `http://localhost:3000/login`
2. Click "Logout" if already logged in
3. Login again with your credentials (e.g., `demo@airguard.com`)

This ensures your JWT token includes the `organizationId` field required by the pairing endpoint.

---

## Workflow A: Airguard Device Setup with GPS Sync

This workflow tests the standard Airguard device setup with GPS/IMU synchronization.

### Step 1: Navigate to Setup Page

1. Open browser to `http://localhost:3000`
2. Login if not already logged in
3. Navigate to Dashboard → Setup (`/dashboard/setup`)

### Step 2: Complete Device Type Step (Step 1)

1. Select **"Airguard"** device type (the only unlocked option)
2. Enter device name (e.g., "Office Airguard 01")
3. Enter firmware version (optional, e.g., "v2.1.3")
4. Click **Next**

### Step 3: Set Location with GPS (Step 2)

1. In the "Quick Location Options" section, click **"Use GPS"** button
2. GPS modal should open with "Waiting for GPS data from dongle..." message
3. Click **"Test with Dummy Data"** button (purple button)
4. Wait 2 seconds for simulated dongle response

### Step 4: Verify GPS + IMU Data Display

The GPS modal should display:

**📍 GPS Location Data:**
- Latitude: `33.888XXX` (6 decimal places)
- Longitude: `35.495XXX` (6 decimal places)
- Altitude: `XX.XX m`
- Accuracy: `XX.XX m`
- Heading: `XXX.XX°`
- Timestamp: Current time
- GPS Fix: `✓ Active` or `✗ No Fix`
- Satellites: `X`

**🔬 IMU Sensor Data:**

*Accelerometer (m/s²):*
- X: `-0.XX`, Y: `-0.XX`, Z: `9.XX` (approx. gravity)

*Gyroscope (rad/s):*
- X: `0.XXX`, Y: `0.XXX`, Z: `0.XXX` (small values near 0)

*Temperature:*
- `XX.XX°C` (e.g., 22-28°C)

**Dongle Batch ID:**
- Shows batch ID (e.g., "BATCH-2024-001")

### Step 5: Confirm GPS Data

1. Click **"Use This Location"** button (blue button at bottom)
2. GPS modal should close
3. Location fields should be auto-filled:
   - Latitude field populated
   - Longitude field populated
   - Altitude field populated
   - GPS Accuracy field populated
   - Heading field populated

### Step 6: Verify Form Population (Hidden Fields)

Open browser DevTools Console and check the component state (if needed), or continue to next steps and verify at Review page.

The following fields should be populated (not visible in UI but stored in state):
- `accelerometerX`, `accelerometerY`, `accelerometerZ`
- `gyroscopeX`, `gyroscopeY`, `gyroscopeZ`
- `temperature`
- `dongleBatchId`
- `dongleGpsFix`, `dongleSatellites`

### Step 7: Complete Remaining Steps

1. Continue through Step 3 (Wireless Config) - fill in SSID and password
2. Continue through Step 4 (Network Config) - use defaults or fill in
3. Continue through Step 5 (Managed Devices) - skip or test separately
4. Review at Step 6 - verify all data is correct

---

## Workflow B: Managed Device with SSH + GPS Sync

This workflow tests adding managed network devices discovered on the network with SSH credentials and GPS location.

### Step 1: Navigate to Setup Page

Same as Workflow A, navigate to `/dashboard/setup`

### Step 2: Skip to Managed Devices (Step 5)

Click **Next** through steps 1-4 quickly (you can leave fields empty for testing)

### Step 3: Test Managed Device Workflow

1. In Step 5 "Add Managed Devices", click **"Test Add Managed Device"** button
2. "Add Managed Device" modal should open

**Modal displays:**
- Device name: "Access Point 192.168.1.100"
- IP Address: "192.168.1.100"
- Manufacturer: "Ubiquiti"

### Step 4: Configure SSH Credentials

1. Enter SSH username (e.g., "root")
2. Enter SSH password (e.g., "admin123")
3. Click **"Sync GPS Location"** button (blue button)

### Step 5: Backend Device Creation

The frontend will:
1. Call `POST /api/devices` to create device with `setupComplete=false`
2. Store the returned device ID
3. Close the "Add Managed Device" modal
4. Open the GPS modal with the device ID parameter

### Step 6: GPS Modal Opens Automatically

The GPS synchronization modal should open automatically.

1. Modal shows "Waiting for GPS data from dongle..."
2. Click **"Test with Dummy Data"** button
3. Wait 2 seconds for simulated response

### Step 7: Verify GPS + IMU Data (Same as Workflow A)

GPS modal displays all sensor data (GPS, IMU, batch ID, quality)

### Step 8: Confirm GPS Data

1. Click **"Use This Location"** button
2. GPS modal closes
3. "Add Managed Device" modal should still be open (or reopened)

### Step 9: Verify GPS Sync Status

In the "Add Managed Device" modal:
- "GPS Location Data" section shows `✓ Synced` badge
- Displays position coordinates and temperature
- **"Finish"** button is now enabled (green)

### Step 10: Finish Adding Device

1. Click **"Finish"** button (green button)
2. Modal closes
3. Device is added to managed devices list

### Step 11: Verify at Review Page (Step 6)

1. Click **Next** to go to Step 6 (Review)
2. Scroll to **"Managed Devices Added to Airguard"** card
3. Verify the device is listed with:
   - Device name: "Access Point 192.168.1.100"
   - IP address: "192.168.1.100"
   - Manufacturer: "Ubiquiti"
   - **SSH ✓** badge (green)
   - **GPS ✓** badge (blue)

---

## Troubleshooting

### Issue: 403 Forbidden Error

**Symptom:** When clicking "Use GPS" button, you get HTTP 403 Forbidden error or "Organization access required" message.

**Root Cause:** User doesn't have an `organizationId` in the database.

**Solution:**
1. Run the backend organization fix script:
   ```bash
   cd ~/airguard-backend
   npm run db:fix-orgs
   ```
2. **CRITICAL:** Re-login to the frontend to get a new JWT token
3. Retry "Use GPS" button

### Issue: Cyclic Object Value Error

**Symptom:** Console shows `TypeError: cyclic object value` when API errors occur.

**Status:** ✅ FIXED in this commit

If you still see this error, ensure you're running the latest code:
```bash
git pull origin claude/testing-01KFW6adLgAKjUb9c2rnFPud
npm run dev
```

### Issue: GPS Modal Doesn't Open

**Symptom:** Clicking "Use GPS" does nothing.

**Check:**
1. Browser console for errors
2. Network tab - should see `POST /api/devices/pair/start`
3. Response status - if 401, re-login

### Issue: Backend Connection Refused

**Symptom:** Frontend shows "Failed to start GPS pairing" immediately.

**Check:**
1. Backend server is running at `http://localhost:3001`
2. `.env.local` has correct `NEXT_PUBLIC_API_URL`
3. No CORS errors in console

### Issue: No GPS Data After Clicking Test Button

**Symptom:** Test button does nothing or shows timeout error.

**Check:**
1. Backend `/api/devices/test-dongle` endpoint is working
2. Check backend logs for errors
3. Network tab shows 200 OK response with GPS data

---

## Expected API Calls

### Workflow A - GPS Sync

1. **Get Access Token:**
   ```
   GET /api/auth/token
   Status: 200 OK
   Response: { "accessToken": "jwt-token" }
   ```

2. **Start Pairing:**
   ```
   POST http://localhost:3001/api/devices/pair/start
   Headers: { "Authorization": "Bearer jwt-token" }
   Body: {} or { "deviceId": "device-id" }
   Status: 200 OK
   Response: { "sessionId": "session-id" }
   ```

3. **Poll Status (every 2 seconds):**
   ```
   GET http://localhost:3001/api/devices/pair/status/session-id
   Headers: { "Authorization": "Bearer jwt-token" }
   Status: 200 OK
   Response: {
     "status": "paired",
     "gpsData": { ... },
     "imuData": { ... },
     "dongleBatchId": "...",
     "gpsQuality": { ... }
   }
   ```

4. **Test Dummy Data:**
   ```
   POST http://localhost:3001/api/devices/test-dongle
   Headers: { "Authorization": "Bearer jwt-token" }
   Status: 200 OK
   Response: { "gpsData": {...}, "imuData": {...}, ... }
   ```

### Workflow B - Managed Device

1. **Create Device:**
   ```
   POST http://localhost:3001/api/devices
   Headers: { "Authorization": "Bearer jwt-token" }
   Body: {
     "name": "Access Point 192.168.1.100",
     "ipAddress": "192.168.1.100",
     "manufacturer": "Ubiquiti",
     "deviceType": "access_point",
     "sshUsername": "root",
     "sshPassword": "admin123",
     "setupComplete": false
   }
   Status: 201 Created
   Response: { "device": { "id": "device-id", ... } }
   ```

2. Then follow Workflow A GPS sync steps with device ID parameter

---

## Verification Checklist

Use this checklist to verify complete integration:

### Frontend Functionality
- [ ] GPS modal opens when clicking "Use GPS"
- [ ] Modal displays loading state with spinner
- [ ] Test button populates GPS data after 2 seconds
- [ ] GPS data displays with 6 decimal precision
- [ ] IMU data displays (accelerometer, gyroscope, temperature)
- [ ] Dongle batch ID displays
- [ ] GPS quality displays (fix status, satellites)
- [ ] "Use This Location" button populates form fields
- [ ] Form data includes all 19 dongle fields in state
- [ ] Managed device modal shows SSH credential inputs
- [ ] GPS sync button is disabled until credentials entered
- [ ] GPS sync creates backend device and opens GPS modal
- [ ] Finish button is disabled until GPS synced
- [ ] Managed device appears in review page with badges

### Backend Integration
- [ ] Organization fix script runs successfully
- [ ] Database has all 19 dongle fields
- [ ] `POST /api/devices/pair/start` returns 200 with session ID
- [ ] `GET /api/devices/pair/status/:sessionId` returns paired data
- [ ] `POST /api/devices/test-dongle` returns dummy data
- [ ] `POST /api/devices` creates device with setupComplete=false
- [ ] All endpoints require Bearer token authentication
- [ ] 403 error is returned if organizationId missing

### Error Handling
- [ ] No cyclic object errors in console
- [ ] 403 errors show user-friendly message
- [ ] Network errors show retry button
- [ ] Timeout after 60 seconds shows error message
- [ ] Error states clear when retrying

---

## Next Steps After Testing

Once local testing is complete and successful:

1. **Report Results:** Let the backend agent know if there are any issues
2. **Merge to Main:** If all tests pass, changes can be merged from testing branch
3. **Deploy:** Follow deployment procedures for staging/production
4. **Monitor:** Watch for any issues with real ESP32 dongle integration

---

## Support

If you encounter issues not covered in this guide:

1. Check backend logs: `~/airguard-backend/logs/`
2. Check browser console for frontend errors
3. Verify database schema matches expected fields
4. Ensure backend and frontend are on the same testing branch
5. Re-run organization fix script if 403 errors persist

---

**Last Updated:** 2025-11-17
**Testing Branch:** `claude/testing-01KFW6adLgAKjUb9c2rnFPud`
**Backend Agent:** Completed fixes (commits 817a954, b0f9a9f)
**Frontend Agent:** Fixed cyclic errors + created testing instructions

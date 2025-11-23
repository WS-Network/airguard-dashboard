# Playwright MCP Test Prompts for Airguard

Copy and paste these prompts into your AI client (Claude Desktop, VS Code, etc.) to run automated tests.

---

## 🚀 Quick Test (Verify MCP Works)

```
Use Playwright to navigate to http://localhost:3003 and take a screenshot.
```

**Expected Result**: Screenshot of Airguard login page

---

## 🔐 Test 1: Login Flow

```
Use Playwright to test the Airguard login flow:

1. Navigate to http://localhost:3003
2. Wait for the page to load completely
3. Fill in the email field with: demo@airguard.com
4. Fill in the password field with: demo123
5. Click the login button
6. Wait for navigation to the dashboard
7. Verify the URL contains "/dashboard"
8. Take a screenshot of the dashboard
9. Check for any console errors
10. Report the results

Verify that:
- Login was successful
- Dashboard loaded
- No JavaScript errors in console
- Auth token is stored in localStorage
```

**Expected Result**:
- ✅ Successfully logged in
- ✅ Dashboard visible
- ✅ No console errors

---

## 📍 Test 2: Navigate to Device Setup

```
Use Playwright to navigate to Device Setup:

Assumptions: Already logged in from previous test

1. Find and click the "Device Setup" link in the navigation
2. Wait for the Device Setup page to load
3. Verify the page heading contains "Device Setup" or "Setup"
4. Take a screenshot
5. List all visible buttons on the page
6. Report the results
```

**Expected Result**:
- ✅ Device Setup page loads
- ✅ "Use GPS" button is visible

---

## 🛰️ Test 3: GPS Pairing Modal (Opening)

```
Use Playwright to test opening the GPS pairing modal:

Assumptions: On Device Setup page, logged in

1. Find the "Use GPS" button
2. Click the "Use GPS" button
3. Wait for modal to appear (up to 5 seconds)
4. Verify modal is visible
5. Check for text "Waiting for GPS signal" or similar
6. Take a screenshot of the modal
7. Check browser console for any errors (especially "cyclic object value")
8. Get the current network requests and look for /api/devices/pair/start
9. Report all findings including:
   - Was modal opened successfully?
   - What text is displayed?
   - Are there any console errors?
   - Did the API request succeed?
```

**Expected Result**:
- ✅ Modal opens
- ✅ Shows "Waiting for GPS signal..."
- ✅ NO "cyclic object value" error
- ✅ API request to /pair/start succeeded

---

## 🧪 Test 4: Complete GPS Pairing Flow

```
Use Playwright to test the complete GPS pairing flow:

Assumptions: On Device Setup page, logged in

1. Click "Use GPS" button
2. Wait for modal with "Waiting for GPS signal"
3. Take screenshot (waiting state)

4. Get auth token from localStorage:
   - Execute: localStorage.getItem('authToken')
   - Store the token

5. Make POST request to trigger dongle:
   - URL: http://localhost:3001/api/devices/test-dongle
   - Method: POST
   - Headers: { "Authorization": "Bearer {token}" }
   - Content-Type: application/json

6. Wait up to 10 seconds for modal to update

7. Verify modal now shows:
   - GPS coordinates (should contain "33.888" or similar)
   - "Accelerometer" text
   - "Gyroscope" text
   - "Temperature" text

8. Take screenshot (success state)

9. Report all displayed data:
   - Latitude value
   - Longitude value
   - Accelerometer values (X, Y, Z)
   - Gyroscope values (X, Y, Z)
   - Temperature value

10. Check for console errors

Results to verify:
- ✅ API request succeeded
- ✅ Modal updated from "Waiting" to "GPS Acquired" or similar
- ✅ GPS coordinates display (33.888630, 35.495480)
- ✅ IMU sensor data displays
- ✅ No console errors
```

**Expected Result**:
- ✅ Complete GPS pairing flow works
- ✅ All 19 data fields display correctly
- ✅ No errors

---

## 🗄️ Test 5: Verify Database (Prisma Studio)

```
Use Playwright to verify data was stored in the database:

1. Navigate to http://localhost:5555 (Prisma Studio)
2. Wait for Prisma Studio to load
3. Click on "Device" model in the left sidebar
4. Sort by "updatedAt" descending (most recent first)
5. Click on the first device row to view details
6. Take screenshot showing the device fields
7. Verify these fields are NOT null:
   - latitude
   - longitude
   - altitude
   - accelerometerX, accelerometerY, accelerometerZ
   - gyroscopeX, gyroscopeY, gyroscopeZ
   - temperature
   - dongleBatchId
   - dongleSessionMs
   - dongleSampleCount
   - setupComplete (should be true)

8. Report:
   - Device ID
   - All dongle field values
   - setupComplete status
   - Any null fields that should have data
```

**Expected Result**:
- ✅ Device exists in database
- ✅ All 19 dongle fields populated
- ✅ setupComplete = true

---

## 🔄 Test 6: Complete End-to-End Flow

```
Use Playwright to run complete end-to-end test:

This test combines all previous tests into one flow.

1. SETUP:
   - Navigate to http://localhost:3003
   - Login with demo@airguard.com / demo123
   - Navigate to Device Setup

2. PAIRING:
   - Click "Use GPS" button
   - Verify modal opens
   - Take screenshot (waiting state)

3. TRIGGER DONGLE:
   - Get auth token from localStorage
   - POST to http://localhost:3001/api/devices/test-dongle with Bearer token
   - Wait for modal to update

4. VERIFY FRONTEND:
   - Check GPS coordinates display
   - Check IMU sensor data displays
   - Take screenshot (success state)
   - Verify no console errors

5. VERIFY DATABASE:
   - Navigate to http://localhost:5555
   - Open Device model
   - Find latest device
   - Verify all 19 fields populated
   - Take screenshot

6. FINAL REPORT:
   Create a comprehensive report with:
   - ✅/❌ Login successful
   - ✅/❌ Modal opened
   - ✅/❌ API request succeeded
   - ✅/❌ Frontend updated correctly
   - ✅/❌ Database populated
   - ✅/❌ No console errors
   - List of any failures or issues
   - Screenshots at each step
```

**Expected Result**: All steps pass ✅

---

## 🐛 Test 7: Error Handling (403 Forbidden)

```
Use Playwright to test error handling:

This test verifies the cyclic error fix and proper error display.

1. Navigate to http://localhost:3003 and login
2. Open browser DevTools console (if possible)
3. Navigate to Device Setup
4. Remove the auth token from localStorage:
   - Execute: localStorage.removeItem('authToken')

5. Click "Use GPS" button
6. Wait for error response

7. Verify:
   - Error message displays (not blank modal)
   - Browser console does NOT show "cyclic object value"
   - Error is handled gracefully

8. Take screenshot of error state
9. Report console errors (should be safe error object, not cyclic)
```

**Expected Result**:
- ✅ Error displayed gracefully
- ✅ NO "cyclic object value" error
- ✅ Safe error logging

---

## 📊 Test 8: Performance Check

```
Use Playwright to check performance:

1. Navigate to http://localhost:3003
2. Enable performance monitoring
3. Login with demo@airguard.com / demo123
4. Navigate to Device Setup
5. Click "Use GPS"
6. Trigger test dongle
7. Wait for completion

8. Measure and report:
   - Page load time
   - Time to interactive
   - API response times
   - Modal update time
   - Any slow network requests (>1 second)

9. Take performance timeline screenshot if possible
```

---

## 🔁 Test 9: Repeated Pairing

```
Use Playwright to test multiple pairing attempts:

1. Login to Airguard
2. Navigate to Device Setup
3. Run GPS pairing flow 3 times:
   - Click "Use GPS"
   - Trigger test dongle
   - Wait for completion
   - Close modal
   - Repeat

4. Verify:
   - Each pairing creates new device
   - No memory leaks
   - No accumulated errors
   - Modal works each time

5. Check database has 3 new devices
6. Report any issues
```

---

## 🌐 Test 10: Different Browsers

```
Note: This requires running MCP with different browser configurations.

Test with Chromium:
[Run Test 4 - Complete GPS Pairing Flow]

Test with Firefox:
Update MCP config to use --browser firefox
[Run Test 4 again]

Test with WebKit:
Update MCP config to use --browser webkit
[Run Test 4 again]

Compare results and report any browser-specific issues.
```

---

## 📝 Custom Test Template

```
Use Playwright to test [FEATURE_NAME]:

1. [Step 1]
2. [Step 2]
3. [Step 3]

Verify:
- [Expected result 1]
- [Expected result 2]

Take screenshots at key points and report results.
```

---

## 🎯 Quick Command Reference

### Check if logged in:
```
Execute JavaScript: window.isLoggedIn()
```

### Get auth token:
```
Execute JavaScript: window.getAuthToken()
```

### Get localStorage:
```
Execute JavaScript: JSON.stringify(localStorage)
```

### Clear all local storage:
```
Execute JavaScript: localStorage.clear()
```

### Check for errors:
```
Monitor console for errors during test execution
```

---

## 📸 Screenshot Naming Convention

Save screenshots with descriptive names:
- `01-login-page.png`
- `02-dashboard-loaded.png`
- `03-device-setup-page.png`
- `04-gps-modal-waiting.png`
- `05-gps-modal-success.png`
- `06-prisma-studio-device.png`

---

## ✅ Success Criteria

A test passes when:
- ✅ All steps complete without errors
- ✅ Expected elements are visible
- ✅ Data displays correctly
- ✅ No console errors (except expected ones)
- ✅ Database reflects changes
- ✅ Screenshots show expected UI state

---

## 🚨 Common Issues to Check

During testing, specifically look for:
- ❌ "cyclic object value" error
- ❌ 403 Forbidden errors
- ❌ Modal stuck on "Waiting..."
- ❌ Blank screens or loading states
- ❌ Network request failures
- ❌ Database fields still null
- ❌ Memory leaks (repeated tests)

---

**Usage**: Copy any prompt above and paste into your AI client with Playwright MCP configured.

**Created for**: Airguard ESP32 Dongle Integration Testing
**Last Updated**: 2025-11-17

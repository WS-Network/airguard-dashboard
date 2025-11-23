# LOCAL AGENT - Testing Instructions for Frontend UX Improvements

## 🎯 YOUR ROLE IN THE PROJECT

You are the **LOCAL AGENT** responsible for:
- Running the complete AirGuard system on the **Jetson Orin Nano** (production hardware)
- Testing frontend and backend integration on ARM64 architecture
- Verifying that changes work in the **actual deployment environment**
- Reporting bugs, issues, or success back to the development team
- **You are NOT making code changes** - you are TESTING code changes made by other agents

---

## 📦 WHAT JUST CHANGED (Context)

The **FRONTEND AGENT** just completed major UI/UX improvements based on user requirements:

### Changes Made:
1. **Device Table on Dashboard Home**:
   - Actions dropdown (3-dot menu) moved to FIRST column
   - Numbering column added as SECOND column
   - Column-specific filters for every data field
   - Global search across all device data
   - Clear Filters button

2. **Device Setup Page - Add Device Workflow**:
   - Green "Add" button in first column
   - Multi-step popup: SSH config → GPS sync
   - Test button to simulate GPS data acquisition
   - Visual step indicators and success states

3. **Layout Fixes**:
   - Fixed sidebar overlapping page content
   - Proper header alignment and spacing
   - Consistent responsive padding

### Your Job:
**Pull the latest frontend changes and verify everything works on Jetson**

---

## 📥 STEP 1: Pull Latest Frontend Changes

### Repository Information:
- **Repository**: https://github.com/Wirestorm-Software/airguard-frontend
- **Branch**: `claude/testing-01KFW6adLgAKjUb9c2rnFPud`
- **Latest Commit**: `ee3fed2` - "Add improved device tables with enhanced UX and multi-step add workflow"

### Pull Commands:
```bash
# Navigate to frontend directory
cd /home/myuser/Documents/airguard-dashboard/airguard-frontend

# Fetch latest changes
git fetch origin

# Pull the testing branch
git pull origin claude/testing-01KFW6adLgAKjUb9c2rnFPud
```

### Expected Output:
```
From https://github.com/Wirestorm-Software/airguard-frontend
 * branch            claude/testing-01KFW6adLgAKjUb9c2rnFPud
Updating d00654d..ee3fed2
Fast-forward
 src/app/dashboard/home/page.tsx                        |   10 +-
 src/app/dashboard/setup/page.tsx                       |    8 +-
 src/components/dashboard/DeviceMapWrapper.tsx          |    4 +-
 src/components/dashboard/DeviceSetupMapWrapper.tsx     |  160 ++++++++++
 src/components/dashboard/DeviceSetupTable.tsx          |  658 +++++++++++++++++++++++++++++++++++++++
 src/components/dashboard/DeviceTableImproved.tsx       | 1040 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 1870 insertions(+), 10 deletions(-)
 create mode 100644 src/components/dashboard/DeviceSetupMapWrapper.tsx
 create mode 100644 src/components/dashboard/DeviceSetupTable.tsx
 create mode 100644 src/components/dashboard/DeviceTableImproved.tsx
```

### Verify Files Were Created:
```bash
# Check that new components exist
ls -la src/components/dashboard/DeviceTableImproved.tsx
ls -la src/components/dashboard/DeviceSetupTable.tsx
ls -la src/components/dashboard/DeviceSetupMapWrapper.tsx
```

**Expected**: All three files should exist

---

## 🔧 STEP 2: Restart Frontend

### Stop Current Frontend (if running):
```bash
# Find and kill any running Next.js dev server
pkill -f "next dev"
```

### Clean Build (Important - Ensures New Components Load):
```bash
# Remove Next.js cache
rm -rf .next

# Start development server
npm run dev
```

### Expected Output:
```
  ▲ Next.js 15.3.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in XXXms
 ○ Compiling / ...
 ✓ Compiled / in XXXs
```

**Verify**: Frontend starts without errors

---

## 🧪 STEP 3: Test Dashboard Home Page

### 3.1 Navigate to Dashboard Home
```
URL: http://localhost:3000/dashboard/home
```

### 3.2 Verify Page Layout (NO SIDEBAR OVERLAP)
**What to Check:**
- ✅ Page title "Airguard Control Center" is **fully visible** (not cut off)
- ✅ Subtitle is **fully visible**
- ✅ Title is **left-aligned** (not centered)
- ✅ All content starts to the **right of the sidebar**
- ✅ No text is hidden under the sidebar

**How to Verify:**
1. Look at the top-left of the page
2. The letter "A" in "Airguard" should be fully visible, not cut off
3. On mobile/tablet, scroll down - content should not overlap sidebar

**Screenshot Location**: Take a screenshot and save as `dashboard-home-layout.png`

### 3.3 Navigate to Device Management Section
**What to Do:**
1. Scroll down to "Device Management" section
2. Click the Map/Table toggle
3. Switch to **Table view**

### 3.4 Test New Table Features

#### A. Verify Column Order
**First Column**: Actions (3-dot icon ⋮)
**Second Column**: # (Numbers: 1, 2, 3, etc.)
**Third Column**: Device Name
**Remaining Columns**: Manufacturer, IP, MAC, Ports, SSH Port, Status

**Expected Layout:**
```
| ⋮ | # | Device Name    | Manufacturer | IP           | MAC               | Ports      | SSH | Status |
|---|---|----------------|--------------|--------------|-------------------|------------|-----|--------|
| ⋮ | 1 | AP-Office-01   | Ubiquiti     | 192.168.1.10 | AA:BB:CC:DD:EE:01 | 22,80,443  | 22  | UP     |
| ⋮ | 2 | AP-Conf-02     | Cisco        | 192.168.1.11 | AA:BB:CC:DD:EE:02 | 22,80,443  | 22  | UP     |
```

**Test**: Count columns from left to right. First should be ⋮ (3-dot), second should be # (number).

#### B. Test Actions Dropdown Menu
**What to Do:**
1. Click the **3-dot icon (⋮)** in the first column of any device row
2. Dropdown menu should appear with:
   - Configure SSH
   - GPS Sync
   - Delete

**What to Test:**
- ✅ Click 3-dot → Menu appears
- ✅ Click "Configure SSH" → SSH modal opens
- ✅ Close modal
- ✅ Click 3-dot → Menu appears again
- ✅ Click **outside the menu** (anywhere on page) → Menu closes
- ✅ Click 3-dot of different device → New menu opens, old closes

**Screenshot**: Save as `dashboard-actions-dropdown.png`

#### C. Test Column Filters
**What to Do:**
1. Look at the **second row** of the table header (below column names)
2. You should see small input boxes under each column

**Test Each Filter:**

**Device Name Filter:**
```
Type: "Office"
Expected: Only devices with "Office" in name show
```

**Manufacturer Filter:**
```
Type: "Ubiquiti"
Expected: Only Ubiquiti devices show
```

**IP Filter:**
```
Type: "192.168.1.10"
Expected: Only that specific IP shows
```

**Clear All Filters:**
```
Click: "Clear Filters" button (red, top-right of table)
Expected: All filters clear, all devices show again
```

**Screenshot**: Save as `dashboard-column-filters.png` (with filters applied)

#### D. Test Global Search
**What to Do:**
1. Find the search box at the **top of the table** (says "Search all fields...")
2. Type different search terms

**Test Cases:**
```
Type: "Office"
Expected: Shows devices with "Office" in name or location

Type: "192.168"
Expected: Shows all devices with that IP pattern

Type: "Cisco"
Expected: Shows all Cisco devices

Type: "xyz123" (nonsense)
Expected: Shows "No devices found matching your criteria"
```

**Screenshot**: Save as `dashboard-global-search.png` (with search active)

#### E. Test Existing Modals (Should Still Work)
**Configure SSH Modal:**
1. Click 3-dot → Configure SSH
2. Enter username: `root`
3. Enter password: `test123`
4. Click "Connect via SSH"
5. Modal closes

**GPS Sync Modal:**
1. Click 3-dot → GPS Sync
2. Loading spinner should appear
3. Message: "Waiting for GPS data from dongle..."
4. Click "Cancel Sync"
5. Modal closes

**Delete Modal:**
1. Click 3-dot → Delete
2. Confirmation dialog appears
3. Shows device name and IP
4. Click "Cancel"
5. Modal closes

---

## 🔧 STEP 4: Test Device Setup Page

### 4.1 Navigate to Device Setup
```
URL: http://localhost:3000/dashboard/setup
```

### 4.2 Verify Page Layout (NO SIDEBAR OVERLAP)
**What to Check:**
- ✅ Page title "Device Setup" is **fully visible** (not cut off)
- ✅ Subtitle is **fully visible**
- ✅ Title is **left-aligned** (not centered)
- ✅ Stepper (6 steps) is **fully visible**
- ✅ All content starts to the **right of the sidebar**

**Screenshot**: Save as `setup-page-layout.png`

### 4.3 Navigate to Step 5
**What to Do:**
1. Click through steps or click directly on step 5 "Add Managed Devices"
2. Wait for page to load

### 4.4 Verify Step 5 Content
**What to Check:**
- ✅ Title: "Add Managed Devices"
- ✅ Description mentions SSH and GPS
- ✅ Map/Table toggle is visible
- ✅ Info box mentions "Add button" and "Test button"

### 4.5 Switch to Table View
**What to Do:**
1. Click Map/Table toggle
2. Switch to **Table view**

### 4.6 Test New Setup Table Features

#### A. Verify Column Order
**First Column**: Green "Add" button
**Second Column**: # (Numbers: 1, 2, 3, etc.)
**Third Column**: Device Name
**Remaining Columns**: Same as dashboard home table

**Expected Layout:**
```
| Add  | # | Device Name    | Manufacturer | IP           | MAC               | Ports      | SSH | Status |
|------|---|----------------|--------------|--------------|-------------------|------------|-----|--------|
| Add  | 1 | AP-Office-01   | Ubiquiti     | 192.168.1.10 | AA:BB:CC:DD:EE:01 | 22,80,443  | 22  | UP     |
| Add  | 2 | AP-Conf-02     | Cisco        | 192.168.1.11 | AA:BB:CC:DD:EE:02 | 22,80,443  | 22  | UP     |
```

**Test**: First column should have green "Add" buttons, second column should have numbers.

**Screenshot**: Save as `setup-table-columns.png`

#### B. Test Column Filters (Same as Dashboard)
**Quick Test:**
```
Type "Ubiquiti" in Manufacturer filter
Expected: Only Ubiquiti devices show
Clear Filters button should appear
Click Clear Filters
All devices show again
```

#### C. Test Multi-Step Add Device Popup

**Test Sequence - CRITICAL:**

**Step 1 - Click Add Button:**
```
Action: Click green "Add" button on any device row
Expected: Popup appears with title "SSH Configuration"
Expected: Shows device name and IP at top
Expected: Two input fields: SSH Username, SSH Password
Expected: Two buttons at bottom: "Cancel" (left), "Next" (right, disabled)
Expected: Step indicator shows 2 dots, first one highlighted
```

**Screenshot**: Save as `setup-step1-ssh.png`

**Step 2 - Fill SSH Credentials:**
```
Action: Type username: "admin"
Action: Type password: "password123"
Expected: "Next" button becomes enabled (not grayed out)
Action: Click "Next"
Expected: Popup transitions to Step 2
```

**Step 3 - GPS Sync Waiting State:**
```
Expected: Title changes to "GPS Synchronization"
Expected: Spinning loader appears
Expected: Message: "Waiting for GPS data from dongle..."
Expected: Instructions: "Press the button on the dongle near the device"
Expected: Purple "Test with Dummy Data" button with flask icon
Expected: Two buttons at bottom: "Previous" (left), "Finish" (right, GRAYED OUT)
Expected: Step indicator shows 2 dots, second one highlighted
```

**Screenshot**: Save as `setup-step2-gps-waiting.png`

**Step 4 - Test GPS Data Acquisition (CRITICAL TEST):**
```
Action: Click purple "Test with Dummy Data" button
Expected: Spinner stops
Expected: Large green checkmark appears
Expected: Title: "GPS Data Received!"
Expected: Green success box appears showing:
  - Latitude: (decimal number)
  - Longitude: (decimal number)
  - Altitude: (number) m
  - Accuracy: (number) m
  - Heading: (number)°
  - Timestamp: (time)
Expected: Blue info box: "✓ Device location and orientation data successfully captured"
Expected: "Finish" button becomes GREEN (not grayed out anymore)
```

**Screenshot**: Save as `setup-step2-gps-success.png`

**Step 5 - Test Previous Button:**
```
Action: Click "Previous" button
Expected: Returns to Step 1 (SSH Configuration)
Expected: Username and password fields are still filled
Expected: Step indicator shows first dot highlighted
Action: Click "Next" again
Expected: Returns to Step 2 with GPS data still showing
```

**Step 6 - Test Finish:**
```
Action: Click green "Finish" button
Expected: Popup closes
Expected: Console log (check browser console): "Device added: ..." with device ID, SSH config, GPS data
```

**Step 7 - Test Cancel:**
```
Action: Click "Add" on another device
Action: Fill SSH credentials, click Next
Action: Click "Test with Dummy Data"
Action: Click "X" (close button) in top-right
Expected: Popup closes immediately
```

**Step 8 - Test Outside Click:**
```
Action: Click "Add" on another device
Action: Click outside the popup (on the dark background)
Expected: Popup closes
```

---

## ✅ STEP 5: Verification Checklist

### Dashboard Home Page:
- [ ] Title "Airguard Control Center" fully visible, not cut off
- [ ] Title left-aligned (not centered)
- [ ] No sidebar overlap on content
- [ ] Device table has Actions column FIRST
- [ ] Device table has Numbering column SECOND
- [ ] 3-dot menu opens and shows 3 options
- [ ] 3-dot menu closes when clicking outside
- [ ] Column filters work for all columns
- [ ] Global search works across all fields
- [ ] Clear Filters button appears when filters active
- [ ] SSH, GPS, Delete modals still work

### Device Setup Page:
- [ ] Title "Device Setup" fully visible, not cut off
- [ ] Title left-aligned (not centered)
- [ ] No sidebar overlap on content
- [ ] Stepper shows 6 steps, fully visible
- [ ] Step 5 "Add Managed Devices" accessible
- [ ] Table has green "Add" button FIRST column
- [ ] Table has Numbering column SECOND
- [ ] Column filters work
- [ ] Multi-step popup opens on Add click
- [ ] Step 1: SSH form with Next button (disabled until filled)
- [ ] Step 2: GPS waiting with spinner
- [ ] Test button present (purple, flask icon)
- [ ] Test button shows dummy GPS data
- [ ] GPS success state shows checkmark and data
- [ ] Finish button grayed until GPS acquired
- [ ] Finish button green after GPS acquired
- [ ] Previous button works
- [ ] Finish button closes popup
- [ ] Cancel (X) button closes popup
- [ ] Click outside closes popup

### Responsive Testing (Optional but Recommended):
- [ ] Test on mobile width (< 640px)
- [ ] Test on tablet width (768px - 1024px)
- [ ] Test on desktop width (> 1024px)
- [ ] Sidebar behavior correct on all sizes

---

## 📊 STEP 6: Report Results

### Create Test Report File:
```bash
cd /home/myuser/Documents/airguard-dashboard
nano FRONTEND_UX_TEST_REPORT.md
```

### Report Template:
```markdown
# Frontend UX Improvements - Test Report
**Date**: YYYY-MM-DD
**Tester**: Local Agent
**Environment**: Jetson Orin Nano (ARM64)
**Branch**: claude/testing-01KFW6adLgAKjUb9c2rnFPud
**Commit**: ee3fed2

## Pull Status
- [ ] Successfully pulled latest changes
- [ ] 3 new files created
- [ ] 3 files modified

## Dashboard Home Page Tests

### Layout
- [ ] PASS / FAIL: Title fully visible
- [ ] PASS / FAIL: No sidebar overlap
- Issues: (describe any issues)

### Device Table
- [ ] PASS / FAIL: Actions column first
- [ ] PASS / FAIL: Numbering column second
- [ ] PASS / FAIL: 3-dot dropdown works
- [ ] PASS / FAIL: Dropdown closes on outside click
- [ ] PASS / FAIL: Column filters work
- [ ] PASS / FAIL: Global search works
- [ ] PASS / FAIL: Clear filters button works
- Issues: (describe any issues)

## Device Setup Page Tests

### Layout
- [ ] PASS / FAIL: Title fully visible
- [ ] PASS / FAIL: No sidebar overlap
- Issues: (describe any issues)

### Multi-Step Add Device Workflow
- [ ] PASS / FAIL: Add button in first column
- [ ] PASS / FAIL: Step 1 SSH form displays
- [ ] PASS / FAIL: Next button disabled until filled
- [ ] PASS / FAIL: Step 2 GPS waiting displays
- [ ] PASS / FAIL: Test button present
- [ ] PASS / FAIL: Test button shows GPS data
- [ ] PASS / FAIL: Success checkmark appears
- [ ] PASS / FAIL: GPS data displays correctly
- [ ] PASS / FAIL: Finish button grayed until GPS
- [ ] PASS / FAIL: Finish button green after GPS
- [ ] PASS / FAIL: Previous button works
- [ ] PASS / FAIL: Finish closes popup
- Issues: (describe any issues)

## Screenshots
- dashboard-home-layout.png
- dashboard-actions-dropdown.png
- dashboard-column-filters.png
- dashboard-global-search.png
- setup-page-layout.png
- setup-table-columns.png
- setup-step1-ssh.png
- setup-step2-gps-waiting.png
- setup-step2-gps-success.png

## Console Errors
(Copy any errors from browser console)

## Overall Assessment
- [ ] ALL TESTS PASSED
- [ ] SOME TESTS FAILED (see issues above)
- [ ] CRITICAL FAILURES (describe below)

## Additional Notes
(Any other observations)
```

### Save and Provide Results:
```bash
# Save the file (Ctrl+X, Y, Enter)

# If you have screenshots, organize them:
mkdir -p ~/Documents/airguard-dashboard/test-screenshots
mv *.png ~/Documents/airguard-dashboard/test-screenshots/
```

---

## 🚨 Common Issues and Fixes

### Issue 1: "Cannot find module 'DeviceTableImproved'"
**Cause**: New files not loaded
**Fix**:
```bash
rm -rf .next
npm run dev
```

### Issue 2: Table looks broken or missing columns
**Cause**: Browser cache
**Fix**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue 3: Modals don't open
**Cause**: JavaScript error
**Fix**: Check browser console (F12) for errors, report them

### Issue 4: Sidebar still overlapping content
**Cause**: CSS not applied
**Fix**: Clear browser cache and hard refresh

### Issue 5: Test button doesn't work
**Cause**: Click handler not firing
**Fix**: Check browser console for errors, try clicking again

---

## 📞 What to Do After Testing

### If All Tests Pass:
1. Save test report with "ALL TESTS PASSED" checked
2. Reply to this message with: "✅ All frontend UX tests passed on Jetson"
3. Attach screenshots (optional but helpful)

### If Some Tests Fail:
1. Save test report with specific failures noted
2. Include console errors in the report
3. Reply with: "⚠️ Frontend UX tests - X failures found"
4. List the specific failures

### If Critical Failure (Nothing Works):
1. Note the error in test report
2. Copy full console errors
3. Reply with: "🚨 CRITICAL: Frontend won't load - [error message]"
4. Provide full error log

---

## 🎯 Summary for Quick Reference

```bash
# 1. Pull changes
cd /home/myuser/Documents/airguard-dashboard/airguard-frontend
git pull origin claude/testing-01KFW6adLgAKjUb9c2rnFPud

# 2. Restart frontend
pkill -f "next dev"
rm -rf .next
npm run dev

# 3. Test in browser
# Go to: http://localhost:3000/dashboard/home
# Test: Table features, filters, actions menu

# Go to: http://localhost:3000/dashboard/setup
# Navigate to Step 5
# Test: Add button, multi-step popup, GPS simulation

# 4. Report results
# Create FRONTEND_UX_TEST_REPORT.md with findings
```

---

**Expected Time**: 30-45 minutes for complete testing
**Priority**: HIGH - These are user-facing features that need verification
**Your Role**: Quality assurance on production hardware (Jetson)

Good luck! 🚀

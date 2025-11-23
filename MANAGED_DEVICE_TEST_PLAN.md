# Managed Device GPS Sync Test Plan

## Goal
Verify the flow of adding a Managed Device with GPS synchronization via the Dongle.

## Prerequisites
- Backend running on port 3001
- Frontend running on port 3000
- User logged in

## Test Steps

1.  **Navigate to Device Setup**
    - Go to `/dashboard/setup`.
    - Click "Next" until Step 5 (Managed Devices).

2.  **Initiate Managed Device Add**
    - Click "Test Add Managed Device" button.
    - Verify "Add Managed Device" modal opens.
    - Enter dummy SSH credentials (e.g., `root` / `password`).

3.  **Start GPS Sync**
    - Click "Sync GPS Location".
    - Verify "Add Managed Device" modal closes.
    - Verify "GPS Synchronization" modal opens.
    - Verify status is "Waiting for GPS data...".

4.  **Simulate Dongle Data**
    - Click "Test with Dummy Data" button in the modal.
    - Verify GPS data appears in the modal.

5.  **Confirm GPS Data**
    - Click "Use This Location".
    - **EXPECTED (Ideal)**: "Add Managed Device" modal re-appears, "GPS Location Data" shows "Synced", and "Finish" button is enabled.
    - **PREDICTED (Bug)**: GPS modal closes, "Add Managed Device" modal does *not* re-appear, or if manually re-opened, state is lost.

6.  **Finish**
    - If possible, click "Finish".
    - Verify device is added to the list with "GPS ✓".

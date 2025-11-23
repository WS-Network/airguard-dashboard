# ESP32 Dongle Integration - Commands Cheatsheet

**TL;DR**: Copy and paste these commands in order. See `IMPLEMENTATION-ORDER.md` for detailed explanations.

---

## 🚀 START WITH: LOCAL AGENT (30 min)

### Setup Backend Infrastructure

```bash
# 1. Pull latest code
cd airguard-backend
git checkout claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
git pull origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# 2. Database migration (adds 19 dongle fields)
npx prisma generate
npx prisma migrate dev --name add_complete_dongle_fields

# 3. Fix user organizations (CRITICAL)
npm run db:fix-orgs

# 4. Find serial port (only if ESP32 connected)
ls /dev/ttyUSB* /dev/ttyACM*
# Update line 95 in docker-compose.yml if port is different

# 5. Start all services
docker-compose up -d --build
sleep 30  # Wait for services to start

# 6. Verify services
docker-compose ps  # All should show "Up"
curl http://localhost:3001/health  # Should return success

# 7. Get JWT token (save the accessToken)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@airguard.com","password":"yourpassword"}'

# Save token in variable (replace with your actual token)
export JWT_TOKEN="paste-your-access-token-here"

# 8. Test pairing endpoint
curl -X POST http://localhost:3001/api/devices/pair/start \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
# Expected: {"sessionId":"uuid","status":"waiting"}

# 9. Test dongle injection
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"
# Expected: GPS data JSON response

# 10. Verify in database
npx prisma studio
# Open http://localhost:5555
# Check Device model - should have device with 19 dongle fields populated
```

**✅ Checkpoint**: Backend infrastructure complete. Continue to Frontend Agent.

---

## 🎨 NEXT: FRONTEND AGENT (15 min)

### Fix Frontend Integration

```bash
# 1. Pull latest code
cd airguard-frontend
git checkout claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
git pull origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr

# 2. Fix cyclic object error
# Edit: src/app/dashboard/setup/page.tsx
# Find line ~376 in catch block of handleUseGps function
# Replace:
#   console.error('Error starting GPS pairing:', error);
# With:
#   console.error('Error starting GPS pairing:', {
#     message: error instanceof Error ? error.message : String(error),
#     name: error instanceof Error ? error.name : 'UnknownError',
#     status: (error as any)?.response?.status,
#     data: (error as any)?.response?.data
#   });

# 3. Start frontend
npm run dev
# Opens at http://localhost:3000

# 4. Test in browser
# - Logout and login again (get new JWT with organizationId)
# - Navigate to Device Setup
# - Click "Use GPS" button
# - Should see modal without console errors

# 5. Commit fix
git add src/app/dashboard/setup/page.tsx
git commit -m "Fix cyclic object error in GPS pairing error handling"
git push origin claude/testing-mi0b9h5vic67o86f-01KDpTwVgzXRbJTMu7D6TbPr
```

**✅ Checkpoint**: Frontend fixed. Continue to End-to-End Testing.

---

## 🧪 FINALLY: LOCAL AGENT - E2E Testing (15 min)

### Test Complete Flow

```bash
# Ensure both running:
# - Backend: docker-compose ps (all Up)
# - Frontend: npm run dev (localhost:3000)

# Test 1: Browser + API
# In browser (http://localhost:3000):
# 1. Logout and login again
# 2. Click "Use GPS" button
# 3. Modal shows "Waiting..."

# In terminal:
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"

# Browser should show:
# ✅ GPS coordinates
# ✅ IMU sensor data (accelerometer, gyroscope, temperature)
# ✅ Success message

# Test 2: Verify database
npx prisma studio
# Device model → Latest device → All 19 fields populated

# Test 3: Monitor data flow
# Terminal 1 - Redis:
docker-compose exec redis redis-cli
# > SUBSCRIBE dongle:data

# Terminal 2 - Backend logs:
docker-compose logs -f backend

# Terminal 3 - Trigger:
curl -X POST http://localhost:3001/api/devices/test-dongle \
  -H "Authorization: Bearer $JWT_TOKEN"

# Should see: Redis message → Backend log → Browser update
```

---

## 🎯 SUCCESS VERIFICATION

Run these commands to verify everything works:

```bash
# Backend health
curl http://localhost:3001/health

# Services status
docker-compose ps

# Database check
docker-compose exec postgres psql -U airguard_user -d airguard_db \
  -c "SELECT COUNT(*) FROM devices WHERE dongle_batch_id IS NOT NULL;"
# Should return count > 0 if devices created

# Redis check
docker-compose exec redis redis-cli ping

# Logs check
docker-compose logs backend | grep -i error | tail -10
# Should show no critical errors
```

---

## 🔧 Quick Fixes

### Fix 403 Forbidden Error

```bash
npm run db:fix-orgs
# Then user must logout/login from frontend
```

### Reset Everything

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d --build
npx prisma migrate deploy
npm run db:fix-orgs
```

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f dongle-service
docker-compose logs -f redis
```

### Restart Service

```bash
docker-compose restart backend
docker-compose restart dongle-service
```

---

## 📋 Execution Order Summary

```
┌─────────────────────────────────────────┐
│  1. LOCAL AGENT (30 min)                │
│     - Pull code                          │
│     - Migrate database                   │
│     - Fix organizations                  │
│     - Start Docker services              │
│     - Test backend APIs                  │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  2. FRONTEND AGENT (15 min)             │
│     - Pull code                          │
│     - Fix cyclic error                   │
│     - Test "Use GPS" button              │
│     - Commit fixes                       │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  3. LOCAL AGENT (15 min)                │
│     - E2E testing                        │
│     - Verify data flow                   │
│     - Check database                     │
│     - Document results                   │
└─────────────────────────────────────────┘
                   ↓
               ✅ DONE!
```

---

## 📞 Quick Reference URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| API Health | http://localhost:3001/health |
| Prisma Studio | http://localhost:5555 |
| PostgreSQL | localhost:5543 (user: airguard_user) |
| Redis | localhost:6379 |

---

## 💡 Pro Tips

1. **Always logout/login** after running `npm run db:fix-orgs` to get new JWT token
2. **Keep Prisma Studio open** to watch database changes in real-time
3. **Use multiple terminals** to monitor logs simultaneously
4. **Save JWT token** in environment variable for easy testing
5. **Check browser console** for frontend errors
6. **Check Docker logs** for backend errors

---

**For detailed explanations**: See `IMPLEMENTATION-ORDER.md`

**For architecture**: See `MICROSERVICES.md`

**For troubleshooting**: See `LOCAL_TESTING_GUIDE.md`

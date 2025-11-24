# 🛠️ AirGuard Dashboard - Development & Planning

**Project Planning, Task Tracking, and Development Guidelines**

---

## 📅 Current Status

**Last Updated:** 2025-01-24
**Version:** 1.0.0
**Branch:** `claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk`
**Status:** ✅ **Production Ready - Deployed on Jetson**

---

## 🎯 Completed Features

### ✅ Phase 1: Backend ↔ NetWatch Integration
- [x] NetWatch service integration (`netwatchService.ts`)
- [x] NetWatch controller with REST endpoints
- [x] Ethernet connection detection API
- [x] Port scanning and device discovery
- [x] SNMP auto-configuration via SSH
- [x] WiFi interference monitoring

### ✅ Phase 2: Backend ↔ IoT Dongle Integration
- [x] DongleGateway MQTT subscription
- [x] Redis pub/sub for pairing
- [x] PostgreSQL device storage
- [x] GPS + IMU data handling
- [x] Pairing session management
- [x] Test endpoints for development

### ✅ Phase 3: Frontend ↔ Backend Integration
- [x] Device setup table with modal
- [x] SSH credentials input
- [x] GPS waiting/pairing UI
- [x] Real-time GPS data polling
- [x] NetWatch API integration
- [x] Connection status checks

### ✅ Phase 4: Jetson Deployment
- [x] Automated deployment script (`deploy-local.sh`)
- [x] Systemd service files
- [x] Auto-start on boot configuration
- [x] Database setup automation
- [x] Component integration testing
- [x] Documentation complete

---

## 🚧 Current Sprint Tasks

### In Progress
- [ ] None - All core features completed

### Backlog
- [ ] Frontend: Add Ethernet disconnected popup
- [ ] Frontend: Auto-trigger port scan on page load
- [ ] Frontend: Device type routing (SSH-only vs GPS-only)
- [ ] Backend: WebSocket real-time updates (replace polling)
- [ ] Testing: End-to-end integration tests
- [ ] Production: Nginx reverse proxy setup
- [ ] Production: SSL/TLS configuration
- [ ] Production: Automated database backups

---

## 📋 Feature Roadmap

### Version 1.1 (Next Release)
**Target:** Q1 2025

#### Frontend Enhancements
- [ ] Ethernet connection popup modal
  - Show when not connected
  - Provide connection instructions
  - Auto-dismiss when connected
- [ ] Auto-trigger network scan
  - Detect page navigation to device setup
  - Check Ethernet connection
  - Start scan automatically if connected
- [ ] Device type detection
  - Detect device capabilities (SSH, GPS, both)
  - Show appropriate setup flow
  - Skip unnecessary steps

#### Backend Improvements
- [ ] WebSocket real-time data
  - Replace polling with Socket.IO events
  - Emit GPS data when received
  - Emit network scan updates
- [ ] Enhanced error handling
  - Better error messages
  - Retry logic for failed connections
  - Graceful degradation
- [ ] API rate limiting enhancements
  - Per-user rate limits
  - Endpoint-specific limits

#### DevOps
- [ ] Docker containers
  - Dockerfile for each component
  - Docker Compose orchestration
  - Volume management
- [ ] CI/CD Pipeline
  - Automated testing
  - Build verification
  - Deployment automation
- [ ] Monitoring
  - Prometheus metrics
  - Grafana dashboards
  - Alerting system

### Version 2.0 (Future)
**Target:** Q2 2025

- [ ] Multi-device support (multiple dongles)
- [ ] Historical data visualization
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Cloud sync capability
- [ ] Multi-user collaboration
- [ ] Role-based access control (RBAC)
- [ ] API key management
- [ ] Webhook integrations

---

## 🏗️ System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    JETSON ORIN NANO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ESP32 Receiver ──► Python Gateway ──► MQTT Broker              │
│         │                                  │                      │
│         │                                  ▼                      │
│  Ethernet ──► NetWatch ──────────► Backend API                  │
│                                          │                        │
│                                          ▼                        │
│                                    PostgreSQL                    │
│                                          ▲                        │
│                                          │                        │
│                                    Frontend UI                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 14+ with Prisma ORM
- **Cache:** Redis
- **Real-time:** Socket.IO
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Logging:** Winston

#### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Hooks
- **Maps:** Leaflet
- **Charts:** Recharts
- **Animations:** Framer Motion
- **HTTP Client:** Fetch API

#### IoT Dongle
- **Gateway:** Python 3.8+
- **MQTT Broker:** Aedes (Node.js)
- **Serial:** pyserial
- **Protocols:** ESP-NOW, MQTT

#### Network Scanning
- **Language:** Python 3.8+
- **Framework:** Flask
- **Scanner:** nmap, netdiscover
- **WiFi:** scapy
- **SNMP:** pysnmp

---

## 🔧 Development Setup

### Prerequisites

```bash
# System packages
Node.js 18+, Python 3.8+, PostgreSQL 14+, Redis

# Development tools
Git, VSCode/Cursor, Postman/Insomnia
```

### Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/WS-Network/airguard-dashboard.git
cd airguard-dashboard
git checkout claude/review-master-prompt-01PtZYNtF4t6xkUEzbA9yqjk
```

#### 2. Setup Database
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres psql << EOF
CREATE USER airguard_user WITH PASSWORD 'airguard_password';
CREATE DATABASE airguard OWNER airguard_user;
GRANT ALL PRIVILEGES ON DATABASE airguard TO airguard_user;
EOF
```

#### 3. Setup Backend
```bash
cd airguard-backend
npm install
cp .env.example .env
# Edit .env with your settings
npx prisma migrate dev
npx prisma generate
npm run dev  # Runs on port 3001
```

#### 4. Setup Frontend
```bash
cd airguard-frontend
npm install
npm run dev  # Runs on port 3000
```

#### 5. Setup MQTT Broker
```bash
cd airguard-esp32-iot-postgresql/mqtt-broker
npm install
node broker.js  # Runs on port 1883
```

#### 6. Setup NetWatch
```bash
cd netwatch.new
pip3 install -r requirements.txt
sudo python3 core/netwatch_unified.py  # Runs on port 8080
```

---

## 🧪 Testing

### Backend Tests
```bash
cd airguard-backend
npm test
npm run test:watch
npm run test:coverage
```

### Frontend Tests
```bash
cd airguard-frontend
npm test
npm run test:e2e
```

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# NetWatch status
curl http://localhost:8080/api/status

# Login (get token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get devices
curl http://localhost:3001/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Integration Testing
```bash
# Test dongle data flow
# 1. Start MQTT broker
# 2. Start backend
# 3. Press dongle button
# 4. Check logs: sudo journalctl -u airguard-dongle -f

# Test network scan
# 1. Connect Ethernet
# 2. Trigger scan: curl -X POST http://localhost:3001/api/network/scan
# 3. Check results: curl http://localhost:3001/api/network/discovered-devices
```

---

## 📊 Database Schema

### Main Tables

#### `users`
- Authentication and user management
- JWT token handling
- Organization relationships

#### `organizations`
- Multi-tenancy support
- User grouping
- Device ownership

#### `devices`
- Network devices and IoT dongles
- GPS/IMU sensor data
- SSH/SNMP configuration
- Status tracking

#### `pairing_sessions`
- GPS dongle pairing
- Session timeout handling
- Status tracking

#### `gps_logs`
- GPS sync audit trail
- Historical location data
- Sync method tracking

#### `device_metrics`
- Time-series sensor data
- Performance metrics
- Health indicators

#### `alerts`
- System notifications
- Device alerts
- Alert resolution

---

## 🔐 Security Considerations

### Authentication
- JWT tokens with expiration
- Refresh token rotation
- Secure password hashing (bcrypt)

### API Security
- Rate limiting per IP
- CORS configuration
- Input validation (Zod)
- SQL injection prevention (Prisma)

### Data Protection
- Encrypted sensitive fields
- Secure environment variables
- HTTPS in production (TODO)

### Network Security
- SSH credential encryption
- SNMP community string protection
- Network isolation recommendations

---

## 📝 Coding Standards

### TypeScript/JavaScript
- Use TypeScript strict mode
- ESLint + Prettier for formatting
- Async/await over callbacks
- Error handling with try/catch
- Descriptive variable names
- JSDoc comments for public APIs

### Python
- PEP 8 style guide
- Type hints where applicable
- Docstrings for functions
- Virtual environments

### Git Workflow
```bash
# Feature branch
git checkout -b feature/feature-name

# Commit messages
git commit -m "feat: Add Ethernet detection popup"
git commit -m "fix: Resolve GPS polling timeout"
git commit -m "docs: Update API documentation"

# Push and PR
git push origin feature/feature-name
```

### Commit Message Format
```
<type>: <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance
```

---

## 🐛 Known Issues

### Current Bugs
None reported

### Limitations
- Single dongle support (multi-device in v2.0)
- Serial port must be `/dev/ttyUSB0` (configurable in .env)
- NetWatch requires root privileges
- Frontend uses polling instead of WebSocket (to be improved)

---

## 📦 Deployment Checklist

### Pre-Deployment
- [ ] Update dependencies
- [ ] Run all tests
- [ ] Build backend and frontend
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Security review completed

### Deployment
- [ ] Backup existing database
- [ ] Stop services
- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Run migrations
- [ ] Build applications
- [ ] Start services
- [ ] Verify health checks

### Post-Deployment
- [ ] Smoke tests
- [ ] Monitor logs
- [ ] Check service status
- [ ] Verify API endpoints
- [ ] Test critical flows
- [ ] Update documentation

---

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.IO Docs](https://socket.io/docs)
- [ESP-NOW Protocol](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [MQTT Explorer](http://mqtt-explorer.com/) - MQTT debugging

---

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Code Review Process
- All PRs require review
- Tests must pass
- Documentation must be updated
- Follow coding standards

---

## 📞 Contact & Support

### Team
- **Project Lead:** [Your Name]
- **Backend:** [Backend Developer]
- **Frontend:** [Frontend Developer]
- **DevOps:** [DevOps Engineer]

### Getting Help
- Review documentation first
- Check troubleshooting section
- Search existing issues
- Create detailed bug reports

---

## 🎯 Sprint Planning Template

### Sprint Goals
```markdown
## Sprint [Number] - [Start Date] to [End Date]

### Goals
- [ ] Goal 1
- [ ] Goal 2

### Tasks
#### High Priority
- [ ] Task 1
- [ ] Task 2

#### Medium Priority
- [ ] Task 3

#### Low Priority
- [ ] Task 4

### Blockers
- None

### Notes
- Any important information
```

---

## 📈 Progress Tracking

### Completed Milestones
- ✅ **2025-01-20:** Project kickoff
- ✅ **2025-01-22:** Backend API complete
- ✅ **2025-01-23:** NetWatch integration
- ✅ **2025-01-24:** Jetson deployment ready

### Upcoming Milestones
- 🎯 **2025-02-01:** Version 1.1 release
- 🎯 **2025-03-01:** Production deployment
- 🎯 **2025-04-01:** Version 2.0 planning

---

**Last Updated:** 2025-01-24
**Next Review:** 2025-02-01

---

*This document is actively maintained. Update it as the project evolves.*

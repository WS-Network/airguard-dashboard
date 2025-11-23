# 🎨 Netwatch Modern Web Dashboard

## ✨ What I Created For You

A **complete, modern, single-page web dashboard** with:

✅ **One Route** - Everything on a single page
✅ **Beautiful Login Screen** - Gradient background with smooth animations
✅ **Real-time Monitoring** - Auto-updates every 5 seconds
✅ **Interactive Charts** - Network traffic and device distribution
✅ **Live Device Table** - Search, filter, and monitor all devices
✅ **Loading States** - Professional loading animations
✅ **Dark Theme** - Modern, eye-friendly design
✅ **Responsive** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Option 1: One-Command Launch (Easiest)
```bash
./run_dashboard.sh
```

### Option 2: Manual Launch

**Terminal 1 - API Server:**
```bash
cd core
python3 netwatch_unified.py
```

**Terminal 2 - Web Dashboard:**
```bash
cd web
python3 server.py
```

---

## 🌐 Access Your Dashboard

**🔗 Dashboard URL:** http://localhost:8081
**🔐 Login Credentials:**
- Username: `admin`
- Password: `admin`

---

## 📊 Dashboard Features

### 1. 🔐 Login Screen
- **Beautiful gradient background** (purple/blue)
- **Smooth slide-in animation**
- **Loading spinner** during authentication
- **Session persistence** - stays logged in

### 2. 📈 Statistics Cards (Top Row)
Four real-time cards showing:
- 📡 **WiFi Devices** - Active wireless networks detected
- 🌐 **Network Devices** - Total devices discovered
- ⚠️ **Bad Frequencies** - Interference detected
- 🔐 **SSH Connections** - Successfully connected devices

**Features:**
- Gradient icon backgrounds
- Real-time counters
- Hover effects with lift animation
- Loading skeleton states

### 3. 📊 Interactive Charts

**Chart 1: Network Traffic Over Time**
- Line chart showing device counts
- Blue line: Network devices
- Purple line: WiFi devices
- Updates in real-time
- Shows last 10 data points

**Chart 2: Device Distribution**
- Doughnut chart
- Green: SSH Connected devices
- Gray: Not connected devices
- Purple: WiFi devices
- Percentage breakdown

### 4. 📱 Devices Table

**Columns:**
- ● Status (online/offline indicator)
- IP Address (bold)
- Hostname
- MAC Address
- Vendor
- Open Ports
- SSH Status (badge)
- RSSI Signal Strength

**Features:**
- 🔍 **Real-time search** - Filter by any column
- 🔄 **Refresh button** - Manual update
- ✨ **Hover effects** - Row highlighting
- 🎨 **Status badges** - Visual connection states

### 5. ⚠️ Bad Frequencies Section

Shows detected interference:
- Frequency in MHz
- Signal strength in dBm
- Detailed reasons for flagging
- Red warning theme

### 6. 📡 Live Status Bar (Bottom)

Shows:
- ⏰ Last Update: Real-time timestamp
- 🔌 API Status: Connected/Disconnected
- 🔄 Auto-refresh: Refresh interval

---

## 🎨 UI Design Details

### Color Scheme
```
Primary Blue:    #3b82f6
Success Green:   #10b981
Warning Orange:  #f59e0b
Danger Red:      #ef4444
Dark Background: #0f172a
Card Background: #1e293b
```

### Animations
- ✓ Slide-in login screen
- ✓ Card hover lift effect
- ✓ Pulsing live indicator
- ✓ Loading spinners
- ✓ Skeleton loading states
- ✓ Smooth transitions

### Typography
- Modern system fonts
- Clear hierarchy
- Easy-to-read sizes
- Accessible contrast

---

## 📁 File Structure

```
web/
├── dashboard.html              # Main HTML (single page)
├── server.py                   # Python web server
├── static/
│   ├── css/
│   │   └── dashboard.css      # All styling (450+ lines)
│   └── js/
│       └── dashboard.js       # All functionality (400+ lines)
└── README.md

run_dashboard.sh               # One-command launcher
```

---

## 🎯 How It Works

### Data Flow
```
1. Login → Store session in localStorage
2. Show dashboard → Initialize charts
3. API Call → http://localhost:8080/api/scan
4. Update UI → Stats, charts, tables
5. Auto-refresh → Every 5 seconds
```

### API Integration
```javascript
API_BASE_URL = 'http://localhost:8080/api'

Endpoints Used:
- GET /api/scan    → All data (main endpoint)
- GET /api/wifi    → WiFi-specific data
- GET /api/network → Network-specific data
```

### Real-Time Updates
- Fetches data every 5 seconds
- Updates statistics cards
- Adds new data to charts
- Refreshes device table
- Shows last update time

---

## 🎮 User Interactions

### Login
1. Enter username: `admin`
2. Enter password: `admin`
3. Click "Sign In"
4. Loading spinner appears
5. Dashboard loads

### Search Devices
1. Type in search box
2. Table filters in real-time
3. Searches all columns

### Refresh Data
1. Click "Refresh" button
2. Data reloads immediately
3. Last update time changes

### Logout
1. Click "Logout" button
2. Clears session
3. Returns to login screen

---

## 📱 Responsive Design

### Desktop (1400px+)
- 4-column stats grid
- 2-column charts
- Full-width table
- All features visible

### Tablet (768px - 1399px)
- 2-column stats grid
- Stacked charts
- Scrollable table
- Optimized spacing

### Mobile (< 768px)
- Single column layout
- Stacked stats
- Scrollable table
- Touch-friendly buttons

---

## ⚡ Performance Features

- **Lightweight**: No heavy frameworks
- **Fast Load**: Minimal dependencies
- **Efficient**: Smart DOM updates
- **CDN Charts**: Chart.js from CDN
- **Local Storage**: Session persistence
- **Debounced Search**: Optimized filtering

---

## 🔒 Security Features

- Session-based authentication
- localStorage token storage
- CORS headers for API access
- Input validation
- XSS protection (sanitized inputs)

⚠️ **Note**: For production, enhance authentication!

---

## 🎨 Screenshots Description

### Login Screen
- Full-screen gradient background
- Centered white card
- SVG network logo
- Clean input fields
- Blue gradient button

### Dashboard
- Dark theme
- Top header with logo
- 4 colorful stat cards
- 2 interactive charts
- Searchable device table
- Live status footer

---

## 🔧 Customization

### Change Colors
Edit `web/static/css/dashboard.css`:
```css
:root {
    --primary-color: #3b82f6;  /* Change this */
}
```

### Change Refresh Interval
Edit `web/static/js/dashboard.js`:
```javascript
const REFRESH_INTERVAL = 5000;  // Change to desired ms
```

### Change Login Credentials
Edit `web/static/js/dashboard.js`:
```javascript
if (username === 'admin' && password === 'admin')
```

### Change Port
```bash
python3 server.py 9000  # Custom port
```

---

## 🐛 Troubleshooting

### Dashboard won't load
```bash
# Check web server
curl http://localhost:8081

# Check if port is in use
lsof -i :8081

# Restart server
cd web && python3 server.py
```

### No data showing
```bash
# Check API
curl http://localhost:8080/api/scan

# Verify API is running
ps aux | grep netwatch_unified
```

### Charts not appearing
- Check internet (Chart.js CDN)
- Open browser DevTools (F12)
- Check console for errors

---

## 🎉 What Makes This Special

1. **Zero Dependencies** (except Chart.js CDN)
2. **Pure Vanilla JavaScript** - No React, Vue, Angular
3. **Single Page** - No routing needed
4. **Modern CSS** - Gradients, animations, transitions
5. **Professional Design** - Production-ready UI
6. **Real-Time** - Live updates every 5s
7. **Responsive** - Mobile, tablet, desktop
8. **Loading States** - Professional UX
9. **Error Handling** - Graceful failures
10. **Easy Customization** - Well-documented code

---

## 📚 Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling (Grid, Flexbox, Animations)
- **JavaScript (ES6+)** - Vanilla JS (Promises, Async/Await)
- **Chart.js 4.4.0** - Beautiful charts
- **Python HTTP Server** - Simple, built-in server

---

## 🚀 Next Steps

1. **Run the dashboard:**
   ```bash
   ./run_dashboard.sh
   ```

2. **Open browser:**
   ```
   http://localhost:8081
   ```

3. **Login:**
   - Username: `admin`
   - Password: `admin`

4. **Enjoy your modern dashboard!** 🎉

---

## 📞 Need Help?

- Check `web/README.md` for detailed docs
- View console logs (F12 in browser)
- Check terminal output for errors
- Verify both servers are running

---

**Created with ❤️ for Netwatch**
*Modern UI • Real-Time Data • Beautiful Design*

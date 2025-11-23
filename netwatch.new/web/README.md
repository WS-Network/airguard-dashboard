# Netwatch Web Dashboard

Modern, single-page web dashboard for Netwatch network monitoring system.

## 🎨 Features

### ✅ Complete Single-Page Dashboard
- **One Route**: Everything on a single page
- **Real-time Updates**: Auto-refreshes every 5 seconds
- **Modern UI**: Dark theme with gradient accents
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🔐 Authentication
- Simple login system (default: admin/admin)
- Session persistence with localStorage
- Secure logout functionality

### 📊 Data Visualization
- **Live Statistics Cards**:
  - WiFi devices detected
  - Network devices discovered
  - Bad frequencies found
  - SSH connections established

- **Interactive Charts**:
  - Network traffic over time (line chart)
  - Device distribution (doughnut chart)
  - Real-time updates with Chart.js

### 📱 Device Management
- **Devices Table**:
  - IP addresses
  - Hostnames
  - MAC addresses
  - Vendor information
  - Open ports
  - SSH connection status
  - RSSI signal strength

- **Search & Filter**: Real-time device filtering
- **Status Indicators**: Visual online/offline status

### ⚠️ Alerts & Monitoring
- Bad frequency detection display
- Real-time API status indicator
- Loading states for all components
- Error handling and fallbacks

## 🚀 Quick Start

### Option 1: Using the Launcher Script
```bash
./run_dashboard.sh
```

This starts both:
- Netwatch monitoring system (port 8080)
- Web dashboard server (port 8081)

### Option 2: Manual Start

**Terminal 1 - Start Netwatch API:**
```bash
cd core
python3 netwatch_unified.py
```

**Terminal 2 - Start Web Dashboard:**
```bash
cd web
python3 server.py
```

## 🌐 Access

- **Dashboard**: http://localhost:8081
- **API Endpoint**: http://localhost:8080/api/scan

## 🔑 Login Credentials

Default credentials:
- **Username**: `admin`
- **Password**: `admin`

## 📁 File Structure

```
web/
├── dashboard.html          # Main HTML file
├── server.py              # Python web server
├── static/
│   ├── css/
│   │   └── dashboard.css  # All styling
│   └── js/
│       └── dashboard.js   # All functionality
└── README.md             # This file
```

## 🎨 UI Components

### Login Screen
- Beautiful gradient background
- Centered modal with smooth animation
- Input validation
- Loading state during authentication

### Dashboard Header
- Logo and branding
- Live monitoring indicator
- User menu with logout

### Statistics Cards
- Gradient icons
- Real-time counters
- Hover effects
- Loading skeletons

### Charts
- Network traffic timeline
- Device distribution
- Responsive sizing
- Dark theme optimized

### Devices Table
- Sortable columns
- Search functionality
- Status badges
- Hover highlights

### Footer
- Last update timestamp
- API connection status
- Auto-refresh indicator

## 🔄 Real-Time Updates

The dashboard automatically:
- Fetches data every 5 seconds
- Updates all statistics
- Refreshes charts
- Updates device table
- Shows last update time

## 🎯 Key Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern styling, animations, gradients
- **Vanilla JavaScript**: No framework dependencies
- **Chart.js**: Beautiful, responsive charts
- **Python HTTP Server**: Simple, built-in server

## 🛠️ Customization

### Change Refresh Interval
Edit `static/js/dashboard.js`:
```javascript
const REFRESH_INTERVAL = 5000; // Change to desired ms
```

### Change Colors
Edit `static/css/dashboard.css`:
```css
:root {
    --primary-color: #3b82f6;  /* Change colors here */
    --success-color: #10b981;
    /* ... */
}
```

### Change Port
```bash
python3 server.py 9000  # Use custom port
```

## 📱 Mobile Responsive

The dashboard is fully responsive:
- Desktop: Full layout with all features
- Tablet: Optimized grid layout
- Mobile: Single column, touch-friendly

## ⚡ Performance

- Lightweight: No heavy frameworks
- Fast loading: Minimal dependencies
- Efficient updates: Smart DOM manipulation
- Optimized charts: Hardware-accelerated

## 🔒 Security Notes

- Default credentials should be changed in production
- Authentication is basic (enhance for production use)
- CORS enabled for development
- Consider HTTPS for production deployment

## 🐛 Troubleshooting

### Dashboard won't load
- Check if web server is running: `http://localhost:8081`
- Check browser console for errors
- Ensure ports 8080 and 8081 are not in use

### No data showing
- Verify API is running: `curl http://localhost:8080/api/scan`
- Check API status indicator in footer
- Open browser DevTools to check network requests

### Charts not displaying
- Ensure Chart.js CDN is accessible
- Check browser console for errors
- Verify internet connection (for CDN)

## 📈 Future Enhancements

Potential additions:
- User management system
- Custom alert thresholds
- Export data to CSV/PDF
- Device grouping/tagging
- Historical data graphs
- Email/SMS notifications
- Multi-language support

## 🎉 Features Highlight

✅ Single-page application (SPA)
✅ Beautiful login screen
✅ Real-time data updates
✅ Interactive charts and graphs
✅ Device search and filtering
✅ Loading states for all components
✅ Error handling and recovery
✅ Mobile responsive design
✅ Dark theme optimized
✅ No framework dependencies

Enjoy your modern Netwatch dashboard! 🚀

# Playwright MCP Setup Guide for Airguard Testing

**Official Repository**: https://github.com/microsoft/playwright-mcp

---

## 🎯 Where to Set Up Playwright MCP

**IMPORTANT**: Playwright MCP is **NOT installed in your project**. It's configured in your **AI client** (Claude Desktop, VS Code, Cursor, etc.).

### Architecture

```
┌─────────────────────────────┐
│  Your AI Client             │
│  (Claude Desktop/VS Code)   │
│                             │
│  Configuration:             │
│  - MCP Server: Playwright   │
│  - Command: npx @playwright │
└──────────────┬──────────────┘
               │
               │ MCP Protocol
               ▼
┌─────────────────────────────┐
│  Playwright MCP Server      │
│  (Runs browser automation)  │
└──────────────┬──────────────┘
               │
               │ Browser Control
               ▼
┌─────────────────────────────┐
│  Your Airguard Frontend     │
│  http://localhost:3003      │
└─────────────────────────────┘
```

---

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ One of these AI clients:
  - Claude Desktop
  - VS Code with MCP extension
  - Cursor IDE
  - Goose
  - Other MCP-compatible clients

---

## 🚀 Setup Instructions by Client

### Option 1: Claude Desktop (Recommended)

**Step 1: Locate Configuration File**

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

**Step 2: Add Playwright MCP Configuration**

Create or edit the file:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser", "chromium",
        "--user-data-dir", "~/.cache/playwright-mcp-airguard",
        "--viewport-size", "1920x1080",
        "--timeout-action", "10000"
      ]
    }
  }
}
```

**Step 3: Restart Claude Desktop**

Close and reopen Claude Desktop to load the configuration.

**Step 4: Test It**

In Claude Desktop, ask:
```
"Use Playwright to navigate to http://localhost:3003 and take a screenshot"
```

---

### Option 2: VS Code / VS Code Insiders

**Step 1: Install VS Code Insiders** (recommended for latest MCP features)

Download from: https://code.visualstudio.com/insiders/

**Step 2: Install via CLI**

```bash
code --add-mcp '{
  "name": "playwright",
  "command": "npx",
  "args": ["@playwright/mcp@latest", "--browser", "chromium"]
}'
```

Or manually add to VS Code settings.

**Step 3: Verify Installation**

Open VS Code command palette (Cmd/Ctrl+Shift+P) → "MCP: Show Servers"

Should show Playwright server running.

---

### Option 3: Cursor IDE

**Step 1: Open Cursor Settings**

Cursor → Settings → MCP → Add new MCP Server

**Step 2: Add Configuration**

- Name: `playwright`
- Type: `command`
- Command: `npx @playwright/mcp@latest`
- Args: `--browser chromium --viewport-size 1920x1080`

**Step 3: Restart Cursor**

---

## 🔧 Configuration Options for Airguard Testing

### Basic Configuration (Recommended)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser", "chromium",
        "--headless",
        "--user-data-dir", "~/.cache/playwright-mcp-airguard",
        "--viewport-size", "1920x1080",
        "--timeout-action", "10000"
      ]
    }
  }
}
```

### Advanced Configuration (With Login Persistence)

```json
{
  "mcpServers": {
    "playwright-airguard": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser", "chromium",
        "--user-data-dir", "/path/to/airguard-profile",
        "--storage-state", "/path/to/airguard-auth.json",
        "--viewport-size", "1920x1080",
        "--timeout-action", "10000",
        "--init-page", "/path/to/airguard-init.ts"
      ]
    }
  }
}
```

### Headful Mode (See Browser While Testing)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@latest",
        "--browser", "chromium",
        "--viewport-size", "1920x1080"
      ]
    }
  }
}
```

**Note**: Remove `--headless` to see browser window during testing.

---

## 📄 Configuration Files for Airguard

### Auth State File (airguard-auth.json)

Save logged-in session for faster testing:

```json
{
  "cookies": [],
  "origins": [
    {
      "origin": "http://localhost:3003",
      "localStorage": [
        {
          "name": "authToken",
          "value": "your-jwt-token-here"
        }
      ]
    }
  ]
}
```

### Initialization Script (airguard-init.ts)

Run this on every page load:

```typescript
// airguard-init.ts
export default async ({ page }) => {
  // Set geolocation for GPS testing
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({
    latitude: 33.888630,
    longitude: 35.495480
  });

  // Add custom test headers
  await page.setExtraHTTPHeaders({
    'X-Test-Environment': 'playwright-mcp'
  });

  // Inject test utilities
  await page.addInitScript(() => {
    (window as any).TEST_MODE = true;
  });
};
```

---

## 🧪 Testing Airguard with Playwright MCP

### Test 1: Login Flow

**Prompt to AI**:
```
Use Playwright to:
1. Navigate to http://localhost:3003
2. Fill in email: demo@airguard.com
3. Fill in password: demo123
4. Click the login button
5. Wait for dashboard to load
6. Take a screenshot
7. Verify no console errors
```

### Test 2: GPS Pairing Flow

**Prompt to AI**:
```
Use Playwright to test the GPS pairing flow:
1. Navigate to http://localhost:3003 (should already be logged in)
2. Click on "Device Setup" in the navigation
3. Click the "Use GPS" button
4. Verify modal opens with text "Waiting for GPS signal"
5. Check that there are no console errors (especially no "cyclic object value")
6. Take a screenshot of the modal
7. Report the results
```

### Test 3: Complete GPS Pairing with Backend API

**Prompt to AI**:
```
Use Playwright to test complete GPS pairing:
1. Navigate to Device Setup page
2. Click "Use GPS" button
3. Get the auth token from localStorage
4. Make a POST request to http://localhost:3001/api/devices/test-dongle with Bearer token
5. Wait for modal to update (up to 10 seconds)
6. Verify GPS coordinates display (33.888)
7. Verify IMU data section appears (Accelerometer, Gyroscope, Temperature)
8. Take screenshots before and after
9. Report all data displayed
```

### Test 4: Verify Database

**Prompt to AI**:
```
After completing GPS pairing test:
1. Navigate to http://localhost:5555 (Prisma Studio)
2. Click on "Device" model
3. Find the most recent device entry
4. Verify these fields are populated:
   - latitude
   - longitude
   - accelerometerX, accelerometerY, accelerometerZ
   - gyroscopeX, gyroscopeY, gyroscopeZ
   - temperature
   - dongleBatchId
   - setupComplete (should be true)
5. Take a screenshot showing the populated fields
```

---

## 🔍 Available Playwright MCP Tools

Once configured, the AI can use these tools:

| Tool | Description |
|------|-------------|
| `playwright_navigate` | Navigate to URL |
| `playwright_screenshot` | Take screenshot |
| `playwright_click` | Click element |
| `playwright_fill` | Fill input field |
| `playwright_select` | Select from dropdown |
| `playwright_hover` | Hover over element |
| `playwright_evaluate` | Execute JavaScript |
| `playwright_expect` | Assert conditions |

---

## 🐛 Troubleshooting

### Issue: MCP Server Not Starting

**Check**:
```bash
# Test manually
npx @playwright/mcp@latest

# Should start without errors
```

**Fix**: Ensure Node.js 18+ installed:
```bash
node --version
# Should show v18.0.0 or higher
```

### Issue: Browser Not Found

**Fix**: Install Playwright browsers:
```bash
npx playwright install chromium
```

### Issue: Can't Connect to localhost:3003

**Check**:
1. Frontend is running: `npm run dev`
2. Shows "ready on http://localhost:3003"

### Issue: Auth Token Expires

**Solution**: Use storage state file to persist login:

```json
"args": ["--storage-state", "/path/to/airguard-auth.json"]
```

Generate auth file:
```bash
# Login once, export state
npx playwright codegen --save-storage=airguard-auth.json http://localhost:3003
```

---

## 📊 Comparison: Playwright MCP vs Standard Tests

| Feature | Playwright MCP | Standard Tests |
|---------|---------------|----------------|
| **Speed** | ⚡ Instant | 🐌 Slower |
| **AI-driven** | ✅ Yes | ❌ No |
| **CI/CD** | ⚠️ Limited | ✅ Full support |
| **Team use** | 👤 Individual | 👥 Team |
| **Maintenance** | 🤖 AI adapts | 👨‍💻 Manual |
| **Debugging** | 🔍 Interactive | 📝 Logs only |

---

## 🚀 Quick Start Commands

### Test if MCP is Working

**Ask your AI client**:
```
"Test Playwright MCP by navigating to google.com and taking a screenshot"
```

### Run Airguard Login Test

```
"Use Playwright to login to http://localhost:3003 with email demo@airguard.com
and password demo123, then take a screenshot of the dashboard"
```

### Complete GPS Pairing Test

```
"Test the complete GPS pairing flow:
1. Login to Airguard frontend
2. Navigate to Device Setup
3. Click Use GPS button
4. Trigger test dongle via backend API
5. Verify GPS and IMU data displays
6. Take screenshots at each step"
```

---

## 📝 Configuration File Locations

Create these files for easier testing:

```
~/.config/airguard-playwright/
├── claude_desktop_config.json    # MCP server config
├── airguard-auth.json             # Saved login state
├── airguard-init.ts               # Page initialization
└── screenshots/                   # Test screenshots
```

---

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] AI client installed (Claude Desktop/VS Code/Cursor)
- [ ] MCP configuration added to client config file
- [ ] Client restarted
- [ ] Test MCP with simple navigation
- [ ] Frontend running on localhost:3003
- [ ] Backend running on localhost:3001
- [ ] Can successfully test Airguard login flow
- [ ] Can test GPS pairing flow
- [ ] Screenshots saved for documentation

---

## 🎯 Next Steps

1. **Choose your AI client** (Claude Desktop recommended)
2. **Add Playwright MCP configuration** to client config
3. **Restart client**
4. **Test with simple prompt**: "Navigate to google.com using Playwright"
5. **Test Airguard**: Start with login flow
6. **Document results**: Save screenshots and test reports

---

## 📚 Additional Resources

- **Official Repo**: https://github.com/microsoft/playwright-mcp
- **MCP Documentation**: https://modelcontextprotocol.io
- **Playwright Docs**: https://playwright.dev
- **Issue Tracker**: https://github.com/microsoft/playwright-mcp/issues

---

**Created**: 2025-11-17
**For**: Airguard ESP32 Dongle Integration Testing
**Status**: Ready to use ✅

# Playwright MCP Configuration Files

This directory contains configuration files for testing Airguard with Playwright MCP.

## Files

| File | Purpose |
|------|---------|
| `claude-desktop-config.json` | MCP server configuration for Claude Desktop |
| `airguard-init.ts` | Page initialization script (geolocation, test utilities) |
| `TEST-PROMPTS.md` | Copy-paste test prompts for AI client |
| `README.md` | This file |

## Quick Setup

### 1. Install Playwright MCP in Your AI Client

**Claude Desktop**:
```bash
# macOS
cp claude-desktop-config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
copy claude-desktop-config.json %APPDATA%\Claude\claude_desktop_config.json

# Linux
cp claude-desktop-config.json ~/.config/Claude/claude_desktop_config.json

# Restart Claude Desktop
```

**VS Code**:
```bash
code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest","--browser","chromium"]}'
```

### 2. Test It Works

Open your AI client and say:
```
"Use Playwright to navigate to http://localhost:3003 and take a screenshot"
```

### 3. Run Airguard Tests

Open `TEST-PROMPTS.md` and copy any test prompt to your AI client.

Start with:
- Test 1: Login Flow
- Test 3: GPS Pairing Modal
- Test 4: Complete GPS Pairing Flow

## Configuration Options

### Headless Mode (Default)

Browser runs in background:
```json
"args": ["--browser", "chromium", "--headless"]
```

### Headful Mode (See Browser)

Browser window visible during tests:
```json
"args": ["--browser", "chromium"]
```

### With Initialization Script

Run airguard-init.ts on page load:
```json
"args": [
  "--browser", "chromium",
  "--init-page", "/absolute/path/to/airguard-init.ts"
]
```

### With Persistent Login

Save login state between tests:
```json
"args": [
  "--browser", "chromium",
  "--user-data-dir", "~/.cache/playwright-airguard-profile",
  "--storage-state", "/path/to/auth-state.json"
]
```

## Usage

See parent directory files for complete documentation:
- `PLAYWRIGHT-MCP-SETUP.md` - Full setup guide
- `PLAYWRIGHT-TESTING-GUIDE.md` - Testing strategies

## Requirements

- Node.js 18+
- AI client with MCP support (Claude Desktop, VS Code, Cursor)
- Airguard frontend running on localhost:3003
- Airguard backend running on localhost:3001

## Quick Test

```
Use Playwright to test Airguard login:
1. Navigate to http://localhost:3003
2. Fill email: demo@airguard.com
3. Fill password: demo123
4. Click login
5. Take screenshot
6. Report results
```

## Support

For issues, see:
- Official repo: https://github.com/microsoft/playwright-mcp
- Airguard docs: `../PLAYWRIGHT-MCP-SETUP.md`

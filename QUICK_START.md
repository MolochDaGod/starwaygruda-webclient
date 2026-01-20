# Warp Ambient Worker - Quick Start

Get up and running in 2 minutes!

## Step 1: Install Dependencies (if not already)

```bash
npm install
```

## Step 2: Start the Warp Worker

Open a terminal and run:

```bash
npm run warp
```

You should see:
```
🤖 Warp Ambient Worker
================================
HTTP API: http://localhost:3333
WebSocket: ws://localhost:3333
Project: C:\Users\david\Desktop\StarWayGRUDA-WebClient
AI: Disabled (set GEMINI_API_TOKEN)
Status: Running
```

## Step 3: Start Your Dev Server

In another terminal:

```bash
npm run dev
```

Or start everything at once:

```bash
npm run start:full
```

This will run:
- Warp Worker (port 3333)
- SWGEmu Bridge (port 3001)
- Vite Dev Server (port 8080)

## Step 4: Test It Out

Open your browser to `http://localhost:8080` and open the console (F12).

### Quick Tests in Browser Console:

```javascript
// Test connection
await WarpWorker.testConnection()

// Read a file
const result = await WarpWorker.readFile('package.json')
console.log(result.content)

// Get console logs
const logs = await WarpWorker.getConsoleLogs(10)
console.log(logs)

// Run a command
const result = await WarpWorker.runCommand('git status')
console.log(result.stdout)

// Check health
const health = await WarpWorker.getHealth()
console.log(health)
```

### Keyboard Shortcuts:

- `Ctrl+Shift+W` - Test worker connection
- `Ctrl+Shift+L` - Get recent logs (20 entries)
- `Ctrl+Shift+P` - Get active processes

## Step 5: Enable AI Features (Optional)

Get a Gemini API key from https://aistudio.google.com/app/apikey

In PowerShell:
```powershell
$env:GEMINI_API_TOKEN="your-api-key-here"
npm run warp
```

Or add to `.env` file:
```
GEMINI_API_TOKEN=your-api-key-here
```

Then test AI features:
```javascript
// Analyze code
const result = await WarpWorker.analyzeCode('src/main.js')
console.log(result.analysis)
```

## Common Commands

```bash
# Start worker only
npm run warp

# Start everything
npm run start:full

# Start dev server only
npm run dev

# Start bridge only
npm run bridge
```

## Example Usage

### Auto-reload on file changes

The worker automatically watches for file changes. Try editing a file and see the console:

```
📝 File changed: src/main.js
```

### Run terminal commands from browser

```javascript
// Install a package
await WarpWorker.runCommand('npm install lodash')

// Check git status
const status = await WarpWorker.runCommand('git status')
console.log(status.stdout)

// Run tests
const tests = await WarpWorker.runCommand('npm test')
```

### Start background processes

```javascript
// Start a background server
await WarpWorker.startProcess('api-server', 'node server.js')

// Check active processes
const { processes } = await WarpWorker.getActiveProcesses()
console.log(processes)

// Stop it
await WarpWorker.stopProcess('api-server')
```

### Monitor console output

```javascript
// Get last 50 logs
const { logs } = await WarpWorker.getConsoleLogs(50)

// Filter errors only
const errors = await WarpWorker.getConsoleLogs(100, 'error')

// Clear buffer
await WarpWorker.clearConsole()
```

## Integration with Your App

To enable Warp Worker in your app, add this to your `src/main.js`:

```javascript
import './warp-integration.js';
```

This will:
- Auto-connect to the worker
- Capture all console logs
- Setup keyboard shortcuts
- Make `window.WarpWorker` available globally

## Troubleshooting

### "Connection failed"
- Make sure `npm run warp` is running
- Check port 3333 is not in use: `netstat -ano | findstr :3333`

### "Module not found"
- Run `npm install`
- Make sure you're in the project directory

### WebSocket errors
- Refresh the browser page
- Restart the worker: `Ctrl+C` then `npm run warp`

## What's Next?

See `WARP_WORKER.md` for:
- Full API documentation
- Advanced usage examples
- Integration patterns
- Custom event listeners

---

**You're ready! Happy coding with Warp Worker 🚀**

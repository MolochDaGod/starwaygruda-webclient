# Warp Ambient Worker

Live development environment assistant that can monitor, edit, and interact with your codebase from within the running dev server.

## 🚀 Features

- **File Operations**: Read, write, edit, and parse files in real-time
- **Console Monitoring**: Capture all browser console output
- **Terminal Integration**: Run shell commands and manage processes
- **File Watching**: Real-time monitoring of file changes
- **AI Analysis**: Code analysis and fix suggestions (optional, requires Gemini API)
- **WebSocket Connection**: Live bidirectional communication
- **REST API**: Full HTTP API for all operations

---

## 📦 Installation

Dependencies are already in `package.json`. Install them:

```bash
npm install
```

Required packages:
- `chokidar` - File watching
- `ws` - WebSocket server
- `express` - HTTP API
- `@google/generative-ai` - AI features (optional)

---

## 🎯 Quick Start

### 1. Start the Ambient Worker

```bash
npm run warp
```

The worker starts on `http://localhost:3333`

### 2. Start Everything Together

```bash
npm run start:full
```

This runs:
- Warp Worker (port 3333)
- SWGEmu Bridge (port 3001)
- Vite Dev Server (port 8080)

---

## 🔌 Browser Integration

The client automatically initializes when your app loads.

### Auto-loaded Client

```javascript
// Already available in browser
window.WarpWorker
```

### Manual Import

```javascript
import { WarpWorkerClient } from './src/warp-worker-client.js';

const warp = new WarpWorkerClient({
    workerURL: 'http://localhost:3333',
    wsURL: 'ws://localhost:3333',
    autoConnect: true,
    captureConsole: true
});
```

---

## 📚 Usage Examples

### File Operations

```javascript
// Read a file
const result = await window.WarpWorker.readFile('src/main.js');
console.log(result.content);

// Write a file
await window.WarpWorker.writeFile('test.txt', 'Hello World');

// Edit a file (via WebSocket)
await window.WarpWorker.writeFile('config.js', `
export default {
    apiURL: 'https://new-api.com'
};
`);
```

### Run Terminal Commands

```javascript
// Run a command
const result = await window.WarpWorker.runCommand('npm test');
console.log(result.stdout);

// Via HTTP API
const response = await fetch('http://localhost:3333/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        command: 'git status',
        options: {}
    })
});
const data = await response.json();
console.log(data.stdout);
```

### Process Management

```javascript
// Start a long-running process
await window.WarpWorker.startProcess('test-server', 'npm run test:watch');

// Get active processes
const { processes } = await window.WarpWorker.getActiveProcesses();
console.log(processes); // [{ name: 'test-server', pid: 12345 }]

// Stop a process
await window.WarpWorker.stopProcess('test-server');
```

### Console Monitoring

```javascript
// Get recent console logs
const { logs } = await window.WarpWorker.getConsoleLogs(50);
logs.forEach(log => {
    console.log(`[${log.type}] ${log.message}`);
});

// Filter logs
const errors = await window.WarpWorker.getConsoleLogs(100, 'error');

// Clear console buffer
await window.WarpWorker.clearConsole();
```

### File Watching

```javascript
// Watch for file changes
window.WarpWorker.on('file-change', (data) => {
    console.log(`File changed: ${data.path}`);
    // Auto-reload or update UI
});

// Watch specific file
window.WarpWorker.watchFile('src/config.js', (data) => {
    console.log('Config file updated!');
    // Reload config
});
```

### AI Code Analysis (Optional)

Requires `GEMINI_API_TOKEN` environment variable.

```javascript
// Analyze code
const result = await window.WarpWorker.analyzeCode('src/game.js');
console.log(result.analysis);

// Ask specific question
const result = await window.WarpWorker.analyzeCode(
    'src/game.js', 
    'What are potential performance issues?'
);

// Via HTTP API
const response = await fetch('http://localhost:3333/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        path: 'src/game.js',
        question: 'How can I optimize this code?'
    })
});
const { analysis } = await response.json();
```

---

## 🌐 HTTP API Reference

### Health Check
```
GET /health
```

### File Operations
```
GET /file?path=src/main.js
POST /file { path: "test.txt", content: "..." }
PATCH /file { path: "src/main.js", edits: [...] }
GET /parse?path=package.json
```

### Console Operations
```
GET /console?limit=100&filter=error
POST /console { message: "...", type: "log" }
DELETE /console
```

### Terminal Operations
```
POST /command { command: "npm test", options: {} }
POST /process/start { name: "dev", command: "npm run dev" }
POST /process/stop { name: "dev" }
GET /processes
```

### AI Operations
```
POST /analyze { path: "src/game.js", question: "..." }
POST /suggest-fix { path: "src/game.js", issue: "..." }
```

---

## 🔐 Security Notes

- Worker runs locally on `localhost:3333`
- No authentication required (local dev only)
- File operations restricted to project directory
- **DO NOT expose to public internet**

---

## 🎨 Advanced Usage

### Custom Event Listeners

```javascript
// Listen to worker logs
window.WarpWorker.on('log', (data) => {
    console.log(`[${data.level}] ${data.message}`);
});

// Listen to command completion
window.WarpWorker.on('command-complete', (data) => {
    console.log(`Command "${data.command}" completed`);
});

// Listen to process exits
window.WarpWorker.on('process-exit', (data) => {
    console.log(`Process ${data.name} exited with code ${data.code}`);
});
```

### File Parsing

```javascript
// Parse JavaScript file
const result = await fetch('http://localhost:3333/parse?path=src/game.js')
    .then(r => r.json());

console.log(result.parsed);
// {
//   type: 'javascript',
//   functions: ['init', 'update', 'render'],
//   imports: ['three', './loader'],
//   exports: ['GameEngine']
// }

// Parse JSON
const pkg = await fetch('http://localhost:3333/parse?path=package.json')
    .then(r => r.json());
console.log(pkg.parsed.name); // "starwaygruda-webclient"
```

### Programmatic File Editing

```javascript
// Edit specific lines
await fetch('http://localhost:3333/file', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        path: 'src/config.js',
        edits: [
            { line: 5, replace: '    apiURL: "https://new-api.com",' }
        ]
    })
});

// Search and replace
await fetch('http://localhost:3333/file', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        path: 'src/game.js',
        edits: [
            { search: 'oldFunction', replace: 'newFunction' }
        ]
    })
});
```

---

## 🛠️ Integration Examples

### Auto-reload on File Change

```javascript
window.WarpWorker.on('file-change', (data) => {
    if (data.path.endsWith('.js')) {
        console.log('JavaScript file changed, reloading...');
        window.location.reload();
    }
});
```

### Console to File Logger

```javascript
window.WarpWorker.on('console', async (log) => {
    if (log.type === 'error') {
        // Save errors to file
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${log.message}\n`;
        
        const current = await window.WarpWorker.readFile('errors.log')
            .catch(() => ({ content: '' }));
        
        await window.WarpWorker.writeFile(
            'errors.log', 
            current.content + logEntry
        );
    }
});
```

### Live Code Testing

```javascript
// Edit code
await window.WarpWorker.writeFile('test-feature.js', `
export function newFeature() {
    return "Hello from live edit!";
}
`);

// Test it
const result = await window.WarpWorker.runCommand('node test-feature.js');
console.log(result.stdout);

// AI analysis
const analysis = await fetch('http://localhost:3333/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        path: 'test-feature.js',
        question: 'Is this code production-ready?'
    })
}).then(r => r.json());

console.log(analysis.analysis);
```

---

## 🐛 Troubleshooting

### Worker won't start
```bash
# Check if port 3333 is in use
netstat -ano | findstr :3333

# Kill the process
taskkill /PID <pid> /F

# Restart worker
npm run warp
```

### WebSocket connection failed
- Ensure worker is running on port 3333
- Check browser console for errors
- Verify CORS settings

### AI features not working
```bash
# Set API key
$env:GEMINI_API_TOKEN="your-key-here"

# Restart worker
npm run warp
```

---

## 📈 Performance Tips

- Console buffer limited to 1000 entries (configurable)
- File watcher ignores `node_modules`, `.git`, `dist`
- Large command output (>10MB) may be truncated
- WebSocket auto-reconnects (max 5 attempts)

---

## 🚀 Next Steps

1. **Custom Dashboard**: Build a UI to visualize worker activity
2. **Code Generators**: Use AI to generate boilerplate code
3. **Test Automation**: Auto-run tests on file changes
4. **Remote Access**: Add authentication for team access
5. **Docker Integration**: Run commands in containers

---

## 📄 License

MIT - Part of StarWayGRUDA WebClient

---

**Built for rapid development in the live dev server environment.**

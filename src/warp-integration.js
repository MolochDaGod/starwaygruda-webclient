/**
 * Warp Worker Integration
 * Import this file in your main.js to enable ambient worker features
 */

import { WarpWorkerClient } from './warp-worker-client.js';

// Initialize Warp Worker
const warp = new WarpWorkerClient({
    workerURL: 'http://localhost:3333',
    wsURL: 'ws://localhost:3333',
    autoConnect: true,
    captureConsole: true // Automatically capture browser console
});

// Make available globally
window.WarpWorker = warp;

// Setup event listeners
warp.on('connected', () => {
    console.log('🤖 Warp Worker connected');
});

warp.on('disconnected', () => {
    console.warn('⚠️ Warp Worker disconnected');
});

warp.on('file-change', (data) => {
    console.log(`📝 File changed: ${data.path}`);
});

warp.on('log', (data) => {
    // Worker logs (from the Node.js side)
    // Uncomment to see worker logs in browser
    // console.log(`[Worker ${data.level}] ${data.message}`);
});

// Example: Auto-reload on critical file changes
warp.on('file-change', (data) => {
    // Reload if config files change
    if (data.path.includes('config') || data.path.includes('.env')) {
        console.log('⚙️ Configuration changed - consider reloading');
        // Uncomment for auto-reload:
        // setTimeout(() => window.location.reload(), 1000);
    }
});

// Add keyboard shortcuts for common operations
document.addEventListener('keydown', async (e) => {
    // Ctrl+Shift+W - Test worker connection
    if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        const connected = await warp.testConnection();
        console.log(`Worker connection: ${connected ? '✅' : '❌'}`);
    }
    
    // Ctrl+Shift+L - Get recent logs
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        try {
            const { logs } = await warp.getConsoleLogs(20);
            console.log('Recent logs:', logs);
        } catch (error) {
            console.error('Failed to get logs:', error);
        }
    }
    
    // Ctrl+Shift+P - Get active processes
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        try {
            const { processes } = await warp.getActiveProcesses();
            console.log('Active processes:', processes);
        } catch (error) {
            console.error('Failed to get processes:', error);
        }
    }
});

console.log('🚀 Warp Worker integration loaded');
console.log('Keyboard shortcuts:');
console.log('  Ctrl+Shift+W - Test worker connection');
console.log('  Ctrl+Shift+L - Get recent logs');
console.log('  Ctrl+Shift+P - Get active processes');

export default warp;

/**
 * Warp Ambient Worker Client
 * Browser-side integration with the ambient worker
 */

export class WarpWorkerClient {
    constructor(options = {}) {
        this.workerURL = options.workerURL || 'http://localhost:3333';
        this.wsURL = options.wsURL || 'ws://localhost:3333';
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.listeners = new Map();
        
        // Auto-connect
        if (options.autoConnect !== false) {
            this.connect();
        }
        
        // Intercept console if enabled
        if (options.captureConsole) {
            this.captureConsoleLogs();
        }
    }

    // ===== CONNECTION =====
    
    connect() {
        console.log('[Warp Worker] Connecting...');
        
        try {
            this.ws = new WebSocket(this.wsURL);
            
            this.ws.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log('[Warp Worker] Connected');
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[Warp Worker] Parse error:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('[Warp Worker] WebSocket error:', error);
                this.emit('error', error);
            };
            
            this.ws.onclose = () => {
                this.connected = false;
                console.log('[Warp Worker] Disconnected');
                this.emit('disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('[Warp Worker] Connection failed:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[Warp Worker] Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`[Warp Worker] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => this.connect(), this.reconnectDelay);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // ===== MESSAGING =====
    
    send(message) {
        if (!this.connected || !this.ws) {
            console.warn('[Warp Worker] Not connected, queuing message');
            return Promise.reject(new Error('Not connected'));
        }
        
        return new Promise((resolve, reject) => {
            const messageId = Date.now() + Math.random();
            const messageWithId = { ...message, _id: messageId };
            
            const timeout = setTimeout(() => {
                this.off('response', responseHandler);
                reject(new Error('Request timeout'));
            }, 10000);
            
            const responseHandler = (data) => {
                if (data._id === messageId) {
                    clearTimeout(timeout);
                    this.off('response', responseHandler);
                    resolve(data.result);
                }
            };
            
            this.on('response', responseHandler);
            this.ws.send(JSON.stringify(messageWithId));
        });
    }

    handleMessage(message) {
        const { type, ...data } = message;
        
        switch (type) {
            case 'connected':
                console.log('[Warp Worker] Worker ready');
                break;
            case 'log':
                this.emit('log', data);
                break;
            case 'file-change':
                this.emit('file-change', data);
                break;
            case 'console':
                this.emit('console', data);
                break;
            case 'command-complete':
                this.emit('command-complete', data);
                break;
            case 'command-error':
                this.emit('command-error', data);
                break;
            case 'process-exit':
                this.emit('process-exit', data);
                break;
            case 'response':
                this.emit('response', data);
                break;
            default:
                console.log('[Warp Worker] Unknown message type:', type);
        }
    }

    // ===== EVENT SYSTEM =====
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => callback(data));
    }

    // ===== API METHODS =====
    
    async readFile(path) {
        return this.send({ type: 'read-file', path });
    }

    async writeFile(path, content) {
        return this.send({ type: 'write-file', path, content });
    }

    async runCommand(command, options = {}) {
        return this.send({ type: 'run-command', command, options });
    }

    async analyzeCode(path, question = null) {
        return this.send({ type: 'analyze', path, question });
    }

    // HTTP API methods (for non-WebSocket calls)
    
    async httpRequest(endpoint, options = {}) {
        const url = `${this.workerURL}${endpoint}`;
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }

    async getHealth() {
        return this.httpRequest('/health');
    }

    async getConsoleLogs(limit = 100, filter = null) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        if (filter) params.append('filter', filter);
        return this.httpRequest(`/console?${params}`);
    }

    async clearConsole() {
        return this.httpRequest('/console', { method: 'DELETE' });
    }

    async getActiveProcesses() {
        return this.httpRequest('/processes');
    }

    async startProcess(name, command, options = {}) {
        return this.httpRequest('/process/start', {
            method: 'POST',
            body: { name, command, options }
        });
    }

    async stopProcess(name) {
        return this.httpRequest('/process/stop', {
            method: 'POST',
            body: { name }
        });
    }

    // ===== CONSOLE CAPTURE =====
    
    captureConsoleLogs() {
        const originalConsole = {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            info: console.info.bind(console),
            debug: console.debug.bind(console)
        };

        const capture = (type) => {
            console[type] = (...args) => {
                originalConsole[type](...args);
                
                const message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');

                this.httpRequest('/console', {
                    method: 'POST',
                    body: { message, type }
                }).catch(err => {
                    originalConsole.error('[Warp Worker] Failed to capture console:', err);
                });
            };
        };

        ['log', 'warn', 'error', 'info', 'debug'].forEach(capture);
        
        console.log('[Warp Worker] Console capture enabled');
    }

    // ===== FILE WATCHING =====
    
    watchFile(path, callback) {
        this.on('file-change', (data) => {
            if (data.path === path) {
                callback(data);
            }
        });
    }

    // ===== UTILITIES =====
    
    async testConnection() {
        try {
            const health = await this.getHealth();
            console.log('[Warp Worker] Connection test passed:', health);
            return true;
        } catch (error) {
            console.error('[Warp Worker] Connection test failed:', error);
            return false;
        }
    }
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
    window.WarpWorker = new WarpWorkerClient({
        autoConnect: true,
        captureConsole: true
    });
    
    console.log('[Warp Worker] Client initialized. Access via window.WarpWorker');
}

export default WarpWorkerClient;

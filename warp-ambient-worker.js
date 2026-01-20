#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_KEY = process.env.GEMINI_API_TOKEN || process.env.GEMINI_API_KEY;
const WORKER_PORT = 3333;
const PROJECT_ROOT = __dirname;
const LOG_FILE = path.join(PROJECT_ROOT, 'warp-worker.log');

class WarpAmbientWorker {
    constructor() {
        this.genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;
        this.chat = null;
        
        // State management
        this.fileWatchers = new Map();
        this.consoleBuffer = [];
        this.consoleMaxSize = 1000;
        this.terminalHistory = [];
        this.activeProcesses = new Map();
        
        // HTTP server for API
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        
        // WebSocket clients
        this.clients = new Set();
        
        this.setupAPI();
        this.setupWebSocket();
        this.startFileWatcher();
    }

    // ===== LOGGING SYSTEM =====
    
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        
        // Console output
        console.log(logEntry.trim());
        
        // File output
        fsSync.appendFileSync(LOG_FILE, logEntry);
        
        // Broadcast to WebSocket clients
        this.broadcast({ type: 'log', level, message, timestamp });
    }

    // ===== FILE SYSTEM OPERATIONS =====
    
    async readFile(filePath) {
        try {
            const fullPath = path.resolve(PROJECT_ROOT, filePath);
            const content = await fs.readFile(fullPath, 'utf-8');
            this.log(`Read file: ${filePath}`);
            return { success: true, content, path: filePath };
        } catch (error) {
            this.log(`Error reading file ${filePath}: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async writeFile(filePath, content) {
        try {
            const fullPath = path.resolve(PROJECT_ROOT, filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
            this.log(`Wrote file: ${filePath}`);
            return { success: true, path: filePath };
        } catch (error) {
            this.log(`Error writing file ${filePath}: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async editFile(filePath, edits) {
        try {
            const result = await this.readFile(filePath);
            if (!result.success) return result;
            
            let content = result.content;
            const lines = content.split('\n');
            
            // Apply edits (format: { line, search, replace })
            for (const edit of edits) {
                if (edit.line !== undefined) {
                    lines[edit.line] = edit.replace;
                } else if (edit.search) {
                    content = content.replace(new RegExp(edit.search, 'g'), edit.replace);
                }
            }
            
            const newContent = lines.join('\n');
            return await this.writeFile(filePath, newContent);
        } catch (error) {
            this.log(`Error editing file ${filePath}: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async parseFile(filePath) {
        try {
            const result = await this.readFile(filePath);
            if (!result.success) return result;
            
            const ext = path.extname(filePath);
            let parsed = null;
            
            switch (ext) {
                case '.json':
                    parsed = JSON.parse(result.content);
                    break;
                case '.js':
                case '.ts':
                    // Basic AST analysis
                    parsed = {
                        type: 'javascript',
                        functions: this.extractFunctions(result.content),
                        imports: this.extractImports(result.content),
                        exports: this.extractExports(result.content)
                    };
                    break;
                default:
                    parsed = { type: 'text', lines: result.content.split('\n').length };
            }
            
            this.log(`Parsed file: ${filePath}`);
            return { success: true, parsed, path: filePath };
        } catch (error) {
            this.log(`Error parsing file ${filePath}: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    extractFunctions(content) {
        const functionRegex = /(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
        const functions = [];
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push(match[1] || match[2]);
        }
        return functions;
    }

    extractImports(content) {
        const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }

    extractExports(content) {
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
        const exports = [];
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        return exports;
    }

    // ===== FILE WATCHING =====
    
    startFileWatcher() {
        const watcher = chokidar.watch([
            path.join(PROJECT_ROOT, 'src/**/*'),
            path.join(PROJECT_ROOT, 'server/**/*'),
            path.join(PROJECT_ROOT, '*.js'),
            path.join(PROJECT_ROOT, '*.json')
        ], {
            ignored: /(node_modules|\.git|dist)/,
            persistent: true
        });

        watcher
            .on('change', (filepath) => {
                this.log(`File changed: ${path.relative(PROJECT_ROOT, filepath)}`, 'watch');
                this.broadcast({ 
                    type: 'file-change', 
                    path: path.relative(PROJECT_ROOT, filepath),
                    timestamp: Date.now()
                });
            })
            .on('add', (filepath) => {
                this.log(`File added: ${path.relative(PROJECT_ROOT, filepath)}`, 'watch');
            })
            .on('unlink', (filepath) => {
                this.log(`File deleted: ${path.relative(PROJECT_ROOT, filepath)}`, 'watch');
            });

        this.watcher = watcher;
        this.log('File watcher started');
    }

    // ===== CONSOLE MONITORING =====
    
    captureConsole(message, type = 'log') {
        const entry = {
            timestamp: Date.now(),
            type,
            message
        };
        
        this.consoleBuffer.push(entry);
        if (this.consoleBuffer.length > this.consoleMaxSize) {
            this.consoleBuffer.shift();
        }
        
        this.broadcast({ type: 'console', ...entry });
    }

    getConsoleLogs(limit = 100, filter = null) {
        let logs = this.consoleBuffer;
        
        if (filter) {
            logs = logs.filter(log => 
                log.message.toLowerCase().includes(filter.toLowerCase()) ||
                log.type === filter
            );
        }
        
        return logs.slice(-limit);
    }

    clearConsole() {
        this.consoleBuffer = [];
        this.log('Console cleared');
        return { success: true };
    }

    // ===== TERMINAL OPERATIONS =====
    
    async runCommand(command, options = {}) {
        const { cwd = PROJECT_ROOT, timeout = 30000 } = options;
        
        this.log(`Running command: ${command}`, 'terminal');
        this.terminalHistory.push({ command, timestamp: Date.now() });
        
        try {
            const { stdout, stderr } = await execAsync(command, { 
                cwd, 
                timeout,
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });
            
            const result = {
                success: true,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                command
            };
            
            this.log(`Command completed: ${command}`, 'terminal');
            this.broadcast({ type: 'command-complete', ...result });
            
            return result;
        } catch (error) {
            const result = {
                success: false,
                error: error.message,
                stdout: error.stdout || '',
                stderr: error.stderr || '',
                command
            };
            
            this.log(`Command failed: ${command} - ${error.message}`, 'error');
            this.broadcast({ type: 'command-error', ...result });
            
            return result;
        }
    }

    async startProcess(name, command, options = {}) {
        const { cwd = PROJECT_ROOT } = options;
        
        this.log(`Starting process: ${name} - ${command}`, 'process');
        
        const child = exec(command, { cwd });
        
        child.stdout?.on('data', (data) => {
            this.captureConsole(data.toString(), 'stdout');
        });
        
        child.stderr?.on('data', (data) => {
            this.captureConsole(data.toString(), 'stderr');
        });
        
        child.on('exit', (code) => {
            this.log(`Process ${name} exited with code ${code}`, 'process');
            this.activeProcesses.delete(name);
            this.broadcast({ type: 'process-exit', name, code });
        });
        
        this.activeProcesses.set(name, child);
        return { success: true, name, pid: child.pid };
    }

    async stopProcess(name) {
        const process = this.activeProcesses.get(name);
        if (!process) {
            return { success: false, error: 'Process not found' };
        }
        
        process.kill();
        this.activeProcesses.delete(name);
        this.log(`Stopped process: ${name}`, 'process');
        
        return { success: true, name };
    }

    getActiveProcesses() {
        return Array.from(this.activeProcesses.keys()).map(name => ({
            name,
            pid: this.activeProcesses.get(name).pid
        }));
    }

    // ===== AI ANALYSIS =====
    
    async analyzeCode(filePath, question = null) {
        if (!this.model) {
            return { success: false, error: 'AI model not initialized. Set GEMINI_API_TOKEN.' };
        }
        
        const result = await this.readFile(filePath);
        if (!result.success) return result;
        
        const prompt = question 
            ? `Analyze this code and answer: ${question}\n\n${result.content}`
            : `Analyze this code for potential issues, improvements, and patterns:\n\n${result.content}`;
        
        try {
            const response = await this.model.generateContent(prompt);
            const analysis = await response.response.text();
            
            this.log(`AI analysis completed for: ${filePath}`);
            return { success: true, analysis, path: filePath };
        } catch (error) {
            this.log(`AI analysis failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async suggestFix(filePath, issue) {
        if (!this.model) {
            return { success: false, error: 'AI model not initialized. Set GEMINI_API_TOKEN.' };
        }
        
        const result = await this.readFile(filePath);
        if (!result.success) return result;
        
        const prompt = `Given this code:\n\n${result.content}\n\nSuggest a fix for this issue: ${issue}\n\nProvide the exact code changes needed.`;
        
        try {
            const response = await this.model.generateContent(prompt);
            const suggestion = await response.response.text();
            
            this.log(`AI fix suggested for: ${filePath}`);
            return { success: true, suggestion, path: filePath };
        } catch (error) {
            this.log(`AI fix suggestion failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // ===== API SETUP =====
    
    setupAPI() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                uptime: process.uptime(),
                activeProcesses: this.activeProcesses.size,
                consoleBufferSize: this.consoleBuffer.length
            });
        });

        // File operations
        this.app.get('/file', async (req, res) => {
            const result = await this.readFile(req.query.path);
            res.json(result);
        });

        this.app.post('/file', async (req, res) => {
            const { path, content } = req.body;
            const result = await this.writeFile(path, content);
            res.json(result);
        });

        this.app.patch('/file', async (req, res) => {
            const { path, edits } = req.body;
            const result = await this.editFile(path, edits);
            res.json(result);
        });

        this.app.get('/parse', async (req, res) => {
            const result = await this.parseFile(req.query.path);
            res.json(result);
        });

        // Console operations
        this.app.get('/console', (req, res) => {
            const { limit, filter } = req.query;
            const logs = this.getConsoleLogs(
                limit ? parseInt(limit) : 100,
                filter
            );
            res.json({ success: true, logs });
        });

        this.app.post('/console', (req, res) => {
            const { message, type } = req.body;
            this.captureConsole(message, type);
            res.json({ success: true });
        });

        this.app.delete('/console', (req, res) => {
            const result = this.clearConsole();
            res.json(result);
        });

        // Terminal operations
        this.app.post('/command', async (req, res) => {
            const { command, options } = req.body;
            const result = await this.runCommand(command, options);
            res.json(result);
        });

        this.app.post('/process/start', async (req, res) => {
            const { name, command, options } = req.body;
            const result = await this.startProcess(name, command, options);
            res.json(result);
        });

        this.app.post('/process/stop', async (req, res) => {
            const { name } = req.body;
            const result = await this.stopProcess(name);
            res.json(result);
        });

        this.app.get('/processes', (req, res) => {
            const processes = this.getActiveProcesses();
            res.json({ success: true, processes });
        });

        // AI operations
        this.app.post('/analyze', async (req, res) => {
            const { path, question } = req.body;
            const result = await this.analyzeCode(path, question);
            res.json(result);
        });

        this.app.post('/suggest-fix', async (req, res) => {
            const { path, issue } = req.body;
            const result = await this.suggestFix(path, issue);
            res.json(result);
        });
    }

    // ===== WEBSOCKET SETUP =====
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            this.log(`WebSocket client connected (${this.clients.size} total)`);

            ws.send(JSON.stringify({ 
                type: 'connected', 
                message: 'Warp Ambient Worker connected',
                timestamp: Date.now()
            }));

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        error: error.message 
                    }));
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                this.log(`WebSocket client disconnected (${this.clients.size} remaining)`);
            });
        });
    }

    async handleWebSocketMessage(ws, message) {
        const { type, ...data } = message;
        let result;

        switch (type) {
            case 'read-file':
                result = await this.readFile(data.path);
                break;
            case 'write-file':
                result = await this.writeFile(data.path, data.content);
                break;
            case 'run-command':
                result = await this.runCommand(data.command, data.options);
                break;
            case 'analyze':
                result = await this.analyzeCode(data.path, data.question);
                break;
            default:
                result = { success: false, error: 'Unknown message type' };
        }

        ws.send(JSON.stringify({ type: 'response', result }));
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(data);
            }
        });
    }

    // ===== START SERVER =====
    
    start() {
        this.server.listen(WORKER_PORT, () => {
            console.log('\n🤖 Warp Ambient Worker');
            console.log('================================');
            console.log(`HTTP API: http://localhost:${WORKER_PORT}`);
            console.log(`WebSocket: ws://localhost:${WORKER_PORT}`);
            console.log(`Project: ${PROJECT_ROOT}`);
            console.log(`AI: ${this.model ? 'Enabled' : 'Disabled (set GEMINI_API_TOKEN)'}`);
            console.log('Status: Running\n');
            
            this.log('Warp Ambient Worker started');
        });
    }

    async shutdown() {
        this.log('Shutting down...');
        
        // Stop all active processes
        for (const [name, process] of this.activeProcesses) {
            process.kill();
            this.log(`Killed process: ${name}`);
        }
        
        // Close file watcher
        if (this.watcher) {
            await this.watcher.close();
        }
        
        // Close server
        this.server.close();
        
        this.log('Shutdown complete');
        process.exit(0);
    }
}

// Main execution
const worker = new WarpAmbientWorker();

// Handle shutdown signals
process.on('SIGINT', () => worker.shutdown());
process.on('SIGTERM', () => worker.shutdown());

// Start the worker
worker.start();

export default WarpAmbientWorker;

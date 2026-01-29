#!/usr/bin/env node

// Server test suite to verify functionality
import axios from 'axios';
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

class ServerTester {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.socket = null;
    }
    
    async test(description, testFn) {
        try {
            console.log(`🧪 Testing: ${description}`);
            await testFn();
            console.log(`✅ PASS: ${description}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ FAIL: ${description} - ${error.message}`);
            this.failed++;
        }
    }
    
    async run() {
        console.log('🚀 StarWayGRUDA Server Test Suite');
        console.log('=====================================\n');
        
        // HTTP API Tests
        await this.test('Server Health Check', async () => {
            const response = await axios.get(`${SERVER_URL}/api/health`);
            if (response.data.status !== 'online') {
                throw new Error('Server not online');
            }
        });
        
        await this.test('Server Status Endpoint', async () => {
            const response = await axios.get(`${SERVER_URL}/api/status`);
            if (typeof response.data.playerCount !== 'number') {
                throw new Error('Invalid status response');
            }
        });
        
        await this.test('Login Endpoint', async () => {
            const response = await axios.post(`${SERVER_URL}/api/login`, {
                username: 'testuser',
                password: 'testpass'
            });
            
            if (!response.data.success || !response.data.token) {
                throw new Error('Login failed');
            }
        });
        
        await this.test('Character Creation', async () => {\n            const response = await axios.post(`${SERVER_URL}/api/characters`, {\n                name: 'TestCharacter',\n                profession: 'Scout',\n                accountId: 12345\n            });\n            \n            if (!response.data.success || !response.data.character) {\n                throw new Error('Character creation failed');\n            }\n        });\n        \n        await this.test('Spawn Locations', async () => {\n            const response = await axios.get(`${SERVER_URL}/api/spawns`);\n            if (!response.data.planets || response.data.planets.length === 0) {\n                throw new Error('No spawn locations found');\n            }\n        });\n        \n        // WebSocket Tests\n        await this.test('WebSocket Connection', async () => {\n            return new Promise((resolve, reject) => {\n                this.socket = io(WS_URL, { \n                    transports: ['websocket'],\n                    timeout: 5000\n                });\n                \n                this.socket.on('connect', () => {\n                    resolve();\n                });\n                \n                this.socket.on('connect_error', (error) => {\n                    reject(new Error(`WebSocket connection failed: ${error.message}`));\n                });\n            });\n        });\n        \n        await this.test('WebSocket Authentication', async () => {\n            return new Promise((resolve, reject) => {\n                const timeout = setTimeout(() => {\n                    reject(new Error('Authentication timeout'));\n                }, 5000);\n                \n                this.socket.on('authenticated', (data) => {\n                    clearTimeout(timeout);\n                    if (data.success) {\n                        resolve();\n                    } else {\n                        reject(new Error('Authentication failed'));\n                    }\n                });\n                \n                this.socket.on('authError', (error) => {\n                    clearTimeout(timeout);\n                    reject(new Error(`Auth error: ${error.error}`));\n                });\n                \n                // Send auth request\n                this.socket.emit('authenticate', {\n                    token: 'test-token',\n                    characterId: 12345\n                });\n            });\n        });\n        \n        await this.test('WebSocket Ping/Pong', async () => {\n            return new Promise((resolve, reject) => {\n                const timeout = setTimeout(() => {\n                    reject(new Error('Ping timeout'));\n                }, 3000);\n                \n                this.socket.on('pong', (data) => {\n                    clearTimeout(timeout);\n                    if (data.timestamp) {\n                        resolve();\n                    } else {\n                        reject(new Error('Invalid pong response'));\n                    }\n                });\n                \n                this.socket.emit('ping');\n            });\n        });\n        \n        // Cleanup\n        if (this.socket) {\n            this.socket.disconnect();\n        }\n        \n        // Results\n        console.log('\\n=====================================');\n        console.log('🏁 Test Results:');\n        console.log(`✅ Passed: ${this.passed}`);\n        console.log(`❌ Failed: ${this.failed}`);\n        console.log(`📊 Total: ${this.passed + this.failed}`);\n        \n        if (this.failed === 0) {\n            console.log('🎉 All tests passed!');\n            process.exit(0);\n        } else {\n            console.log('💥 Some tests failed!');\n            process.exit(1);\n        }\n    }\n}\n\n// Run tests\nconst tester = new ServerTester();\ntester.run().catch(error => {\n    console.error('Test runner failed:', error);\n    process.exit(1);\n});
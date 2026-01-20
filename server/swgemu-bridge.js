#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dgram from 'dgram';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = 3001; // HTTP bridge port (SWGEmu uses 44453 UDP)
const SWGEMU_LOGIN_PORT = 44453;
const SWGEMU_ZONE_PORT = 44455;

// Session management
const sessions = new Map();
const connectedPlayers = new Map();

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'StarWayGRUDA Bridge',
        swgemu: {
            host: 'localhost',
            loginPort: 44453,
            zonePort: 44455
        },
        timestamp: new Date().toISOString()
    });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`Login attempt: ${username}`);
    
    // For now, return success with test character
    // TODO: Implement actual SWGEmu protocol communication
    res.json({
        success: true,
        accountId: 1,
        token: 'test-session-token',
        characters: [
            {
                id: 1,
                name: 'Tutorial Character',
                profession: 'Scout',
                level: 1,
                planet: 'tutorial',
                zone: 'Tutorial'
            }
        ]
    });
});

// Get characters endpoint
app.get('/api/characters/:accountId', (req, res) => {
    res.json([
        {
            id: 1,
            name: 'Tutorial Character',
            profession: 'Scout',
            level: 1,
            planet: 'tutorial',
            zone: 'Tutorial'
        }
    ]);
});

// Create character endpoint
app.post('/api/characters', (req, res) => {
    const { name, profession } = req.body;
    
    res.json({
        success: true,
        character: {
            id: Date.now(),
            name,
            profession,
            level: 1,
            planet: 'tutorial',
            zone: 'Tutorial'
        }
    });
});

// UDP communication helper (for future implementation)
function sendUDPMessage(message, port = 44453) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        const buffer = Buffer.from(JSON.stringify(message));
        
        client.send(buffer, 0, buffer.length, port, 'localhost', (err) => {
            if (err) {
                client.close();
                reject(err);
            } else {
                // Set timeout for response
                const timeout = setTimeout(() => {
                    client.close();
                    reject(new Error('UDP response timeout'));
                }, 5000);
                
                client.on('message', (msg) => {
                    clearTimeout(timeout);
                    client.close();
                    resolve(msg);
                });
            }
        });
    });
}

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    socket.on('authenticate', (data) => {
        const { token, characterId } = data;
        console.log(`[Auth] Player ${characterId} authenticating`);
        
        // Store player session
        connectedPlayers.set(socket.id, {
            characterId,
            token,
            position: { x: 0, y: 10, z: 0 },
            zone: 'tutorial'
        });
        
        socket.emit('authenticated', {
            success: true,
            worldState: {
                zone: 'tutorial',
                spawnPoint: { x: 0, y: 10, z: 0 },
                nearbyPlayers: Array.from(connectedPlayers.values()).filter(p => p.characterId !== characterId)
            }
        });
        
        // Notify other players
        socket.broadcast.emit('playerJoined', {
            characterId,
            position: { x: 0, y: 10, z: 0 }
        });
    });
    
    socket.on('playerMove', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player) {
            player.position = data.position;
            
            // Broadcast to nearby players (within 128m range)
            socket.broadcast.emit('playerMoved', {
                characterId: player.characterId,
                position: data.position,
                rotation: data.rotation
            });
        }
    });
    
    socket.on('chatMessage', (data) => {
        const player = connectedPlayers.get(socket.id);
        if (player) {
            socket.broadcast.emit('chatMessage', {
                characterId: player.characterId,
                message: data.message,
                type: data.type || 'spatial'
            });
        }
    });
    
    socket.on('disconnect', () => {
        const player = connectedPlayers.get(socket.id);
        if (player) {
            console.log(`[WebSocket] Player ${player.characterId} disconnected`);
            socket.broadcast.emit('playerLeft', {
                characterId: player.characterId
            });
            connectedPlayers.delete(socket.id);
        }
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`\n🌉 SWGEmu Bridge Server`);
    console.log(`================================`);
    console.log(`HTTP API: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`SWGEmu LoginServer: localhost:${SWGEMU_LOGIN_PORT} (UDP)`);
    console.log(`SWGEmu ZoneServer: localhost:${SWGEMU_ZONE_PORT} (TCP)`);
    console.log(`Status: Running`);
    console.log(`Connected Players: 0\n`);
});

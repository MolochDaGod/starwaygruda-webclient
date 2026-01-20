#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dgram from 'dgram';

const app = express();
const PORT = 3001; // HTTP bridge port (SWGEmu uses 44453 UDP)

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

// Start server
app.listen(PORT, () => {
    console.log(`\n🌉 SWGEmu Bridge Server`);
    console.log(`================================`);
    console.log(`HTTP API: http://localhost:${PORT}`);
    console.log(`SWGEmu Server: localhost:44453 (UDP)`);
    console.log(`Status: Running\n`);
});

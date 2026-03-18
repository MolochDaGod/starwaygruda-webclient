#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dgram from 'dgram';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES6 module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Configuration from environment or defaults
const PORT = process.env.PORT || 3001;
const SWGEMU_HOST = process.env.SWGEMU_HOST || 'localhost';
const SWGEMU_LOGIN_PORT = process.env.SWGEMU_LOGIN_PORT || 44453;
const SWGEMU_ZONE_PORT = process.env.SWGEMU_ZONE_PORT || 44455;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Grudge backend URLs
const GRUDGE_AUTH_URL = process.env.GRUDGE_AUTH_URL || 'https://id.grudge-studio.com';
const GRUDGE_API_URL = process.env.GRUDGE_API_URL || 'https://api.grudge-studio.com';

// Helper: forward requests to Grudge backend
async function grudgeFetch(baseUrl, path, opts = {}) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${baseUrl}${path}`, { ...opts, signal: controller.signal });
        clearTimeout(timeout);
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        console.warn(`[Grudge] Backend unreachable (${baseUrl}${path}): ${err.message}`);
        return { ok: false, offline: true, data: null };
    }
}

// Session management
const sessions = new Map();
const connectedPlayers = new Map();
const gameWorlds = new Map();
const playerPositions = new Map();

// Game state tracking
const gameState = {
    worldObjects: new Map(),
    activeZones: new Set(['tutorial', 'tatooine', 'naboo', 'corellia']),
    playerCount: 0,
    serverStartTime: Date.now()
};

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    const uptime = Date.now() - gameState.serverStartTime;
    res.json({
        status: 'online',
        server: 'StarWayGRUDA Bridge',
        version: '1.2.0',
        environment: NODE_ENV,
        swgemu: {
            host: SWGEMU_HOST,
            loginPort: SWGEMU_LOGIN_PORT,
            zonePort: SWGEMU_ZONE_PORT,
            connected: false // TODO: Implement actual connection checking
        },
        stats: {
            connectedPlayers: connectedPlayers.size,
            activeSessions: sessions.size,
            uptime: Math.floor(uptime / 1000),
            activeZones: Array.from(gameState.activeZones)
        },
        timestamp: new Date().toISOString()
    });
});

// Server status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        playerCount: connectedPlayers.size,
        maxPlayers: 100,
        serverLoad: Math.min(100, (connectedPlayers.size / 100) * 100),
        zones: Array.from(gameState.activeZones).map(zone => ({
            name: zone,
            playerCount: Array.from(connectedPlayers.values()).filter(p => p.zone === zone).length,
            status: 'online'
        }))
    });
});

// Login endpoint — forwards to Grudge backend
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }
        
        console.log(`[Auth] Login attempt: ${username}`);
        
        // Forward to Grudge auth backend
        const grudgeRes = await grudgeFetch(GRUDGE_AUTH_URL, '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        
        let sessionToken, accountId, grudgeId;
        
        if (grudgeRes.ok && grudgeRes.data?.token) {
            // Grudge backend authenticated successfully
            sessionToken = grudgeRes.data.token;
            accountId = grudgeRes.data.user?.id || grudgeRes.data.userId || generateAccountId(username);
            grudgeId = grudgeRes.data.grudgeId || grudgeRes.data.user?.grudgeId || '';
            console.log(`[Auth] Grudge backend authenticated: ${username} (GrudgeID: ${grudgeId})`);
        } else {
            // Fallback to local session when backend is offline
            console.warn(`[Auth] Grudge backend offline, using local session for: ${username}`);
            sessionToken = generateSessionToken(username);
            accountId = generateAccountId(username);
            grudgeId = '';
        }
        
        // Store session locally for WebSocket auth
        sessions.set(sessionToken, {
            accountId,
            grudgeId,
            username,
            grudgeToken: grudgeRes.ok ? sessionToken : null,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            ipAddress: req.ip || req.connection.remoteAddress
        });
        
        const characters = await getAccountCharacters(accountId, sessionToken);
        
        res.json({
            success: true,
            accountId,
            grudgeId,
            token: sessionToken,
            username,
            characters,
            serverInfo: {
                name: 'StarWayGRUDA',
                population: connectedPlayers.size,
                status: 'online',
                grudgeBackend: grudgeRes.ok ? 'connected' : 'offline'
            }
        });
        
        console.log(`[Auth] Login successful: ${username} (Account: ${accountId})`);
        
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Wallet login endpoint — forwards to Grudge backend
app.post('/api/wallet-login', async (req, res) => {
    try {
        const { walletAddress, signature, message } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ success: false, error: 'Wallet address required' });
        }

        console.log(`[Auth] Wallet login attempt: ${walletAddress}`);

        // Forward to Grudge wallet auth
        const grudgeRes = await grudgeFetch(GRUDGE_AUTH_URL, '/auth/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: walletAddress, signature, message }),
        });

        let sessionToken, accountId, grudgeId;

        if (grudgeRes.ok && grudgeRes.data?.token) {
            sessionToken = grudgeRes.data.token;
            accountId = grudgeRes.data.user?.id || generateAccountId(walletAddress);
            grudgeId = grudgeRes.data.grudgeId || '';
        } else {
            sessionToken = generateSessionToken(walletAddress);
            accountId = generateAccountId(walletAddress);
            grudgeId = '';
        }

        sessions.set(sessionToken, {
            accountId,
            grudgeId,
            username: walletAddress,
            walletAddress,
            grudgeToken: grudgeRes.ok ? sessionToken : null,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            ipAddress: req.ip || req.connection.remoteAddress,
            authMethod: 'wallet'
        });

        const characters = await getAccountCharacters(accountId, sessionToken);

        res.json({
            success: true,
            accountId,
            grudgeId,
            token: sessionToken,
            walletAddress,
            characters,
            serverInfo: {
                name: 'StarWayGRUDA',
                population: connectedPlayers.size,
                status: 'online',
                grudgeBackend: grudgeRes.ok ? 'connected' : 'offline'
            }
        });

        console.log(`[Auth] Wallet login successful: ${walletAddress} (Account: ${accountId})`);

    } catch (error) {
        console.error('[Auth] Wallet login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    try {
        const { token } = req.body;
        
        if (sessions.has(token)) {
            const session = sessions.get(token);
            console.log(`[Auth] Logout: ${session.username}`);
            sessions.delete(token);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('[Auth] Logout error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get characters endpoint
app.get('/api/characters/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const characters = await getAccountCharacters(parseInt(accountId));
        res.json(characters);
    } catch (error) {
        console.error('[Characters] Error fetching characters:', error);
        res.status(500).json({ error: 'Failed to fetch characters' });
    }
});

// Create character endpoint
app.post('/api/characters', async (req, res) => {
    try {
        const { name, profession, accountId, appearance } = req.body;
        
        if (!name || !profession) {
            return res.status(400).json({
                success: false,
                error: 'Name and profession are required'
            });
        }
        
        // Validate character name
        if (name.length < 3 || name.length > 16) {
            return res.status(400).json({
                success: false,
                error: 'Character name must be between 3 and 16 characters'
            });
        }
        
        const character = {
            id: Date.now(),
            name,
            profession,
            level: 1,
            experience: 0,
            credits: 1000,
            planet: 'tutorial',
            zone: 'Tutorial',
            position: { x: 0, y: 10, z: 0 },
            stats: {
                health: 100,
                action: 100,
                mind: 100
            },
            appearance: appearance || {},
            created: new Date().toISOString()
        };
        
        console.log(`[Characters] Created character: ${name} (${profession})`);
        
        res.json({
            success: true,
            character
        });
    } catch (error) {
        console.error('[Characters] Error creating character:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create character'
        });
    }
});

// Delete character endpoint
app.delete('/api/characters/:characterId', (req, res) => {
    try {
        const { characterId } = req.params;
        console.log(`[Characters] Deleting character: ${characterId}`);
        
        res.json({
            success: true,
            message: 'Character deleted successfully'
        });
    } catch (error) {
        console.error('[Characters] Error deleting character:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete character'
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// ACCOUNT-BOUND DATA ROUTES (inventory, professions, island)
// ═══════════════════════════════════════════════════════════════

// In-memory account data stores (TODO: replace with real DB)
const accountInventories = new Map();
const accountProfessions = new Map();
const accountIslands = new Map();

// Middleware: extract accountId from session token, verify with Grudge if available
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const session = sessions.get(token);
    session.lastActivity = Date.now();
    req.session = session;
    req.accountId = session.accountId;
    req.grudgeToken = session.grudgeToken || token;
    next();
}

// ── Account Inventory (syncs with Grudge backend) ─────────────

app.get('/api/account/inventory', requireAuth, async (req, res) => {
    // Try Grudge backend first
    const grudgeRes = await grudgeFetch(GRUDGE_API_URL, '/api/account/inventory', {
        headers: { Authorization: `Bearer ${req.grudgeToken}` },
    });
    if (grudgeRes.ok) return res.json(grudgeRes.data);
    // Fallback to local
    const data = accountInventories.get(req.accountId) || { items: [], credits: 1000, bankCredits: 0 };
    res.json(data);
});

app.put('/api/account/inventory', requireAuth, async (req, res) => {
    const payload = { items: req.body.items || [], credits: req.body.credits || 0, bankCredits: req.body.bankCredits || 0 };
    // Sync to Grudge backend
    grudgeFetch(GRUDGE_API_URL, '/api/account/inventory', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${req.grudgeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    accountInventories.set(req.accountId, payload);
    res.json({ success: true });
});

// ── Account Professions (syncs with Grudge backend) ──────────

app.get('/api/account/professions', requireAuth, async (req, res) => {
    const grudgeRes = await grudgeFetch(GRUDGE_API_URL, '/api/account/professions', {
        headers: { Authorization: `Bearer ${req.grudgeToken}` },
    });
    if (grudgeRes.ok) return res.json(grudgeRes.data);
    const data = accountProfessions.get(req.accountId) || { professions: {}, skillPoints: { available: 250, spent: 0 }, experience: {} };
    res.json(data);
});

app.put('/api/account/professions', requireAuth, async (req, res) => {
    const payload = { professions: req.body.professions || {}, skillPoints: req.body.skillPoints || {}, experience: req.body.experience || {} };
    grudgeFetch(GRUDGE_API_URL, '/api/account/professions', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${req.grudgeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    accountProfessions.set(req.accountId, payload);
    res.json({ success: true });
});

// ── Account Island (syncs with Grudge backend) ───────────────

app.get('/api/account/island', requireAuth, async (req, res) => {
    const grudgeRes = await grudgeFetch(GRUDGE_API_URL, '/api/account/island', {
        headers: { Authorization: `Bearer ${req.grudgeToken}` },
    });
    if (grudgeRes.ok) return res.json(grudgeRes.data);
    const island = accountIslands.get(req.accountId) || null;
    res.json({ island });
});

app.put('/api/account/island', requireAuth, async (req, res) => {
    grudgeFetch(GRUDGE_API_URL, '/api/account/island', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${req.grudgeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
    });
    accountIslands.set(req.accountId, req.body);
    res.json({ success: true });
});

app.post('/api/account/island/harvest', requireAuth, async (req, res) => {
    const { collectedItems } = req.body;
    if (!collectedItems || !Array.isArray(collectedItems)) {
        return res.status(400).json({ error: 'collectedItems array required' });
    }
    // Sync to Grudge
    grudgeFetch(GRUDGE_API_URL, '/api/account/island/harvest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${req.grudgeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectedItems }),
    });
    const inv = accountInventories.get(req.accountId) || { items: [], credits: 0, bankCredits: 0 };
    inv.items.push(...collectedItems);
    accountInventories.set(req.accountId, inv);
    res.json({ success: true, totalItems: inv.items.length });
});

// ── Account Characters (syncs with Grudge backend) ───────────

app.get('/api/account/characters', requireAuth, async (req, res) => {
    try {
        const characters = await getAccountCharacters(req.accountId, req.grudgeToken);
        res.json({ characters });
    } catch (error) {
        console.error('[Account] Error fetching characters:', error);
        res.status(500).json({ error: 'Failed to fetch characters' });
    }
});

// ═══════════════════════════════════════════════════════════════

// Get spawn locations
app.get('/api/spawns', (req, res) => {
    res.json({
        planets: [
            {
                name: 'tutorial',
                displayName: 'Tutorial',
                spawns: [{ x: 0, y: 10, z: 0, name: 'Tutorial Start' }]
            },
            {
                name: 'tatooine',
                displayName: 'Tatooine',
                spawns: [
                    { x: 3528, y: 5, z: -4804, name: 'Mos Eisley' },
                    { x: 1336, y: 7, z: 2734, name: 'Anchorhead' }
                ]
            },
            {
                name: 'naboo',
                displayName: 'Naboo',
                spawns: [
                    { x: -4856, y: 6, z: 4162, name: 'Theed' },
                    { x: 4054, y: 4, z: -6435, name: 'Moenia' }
                ]
            },
            {
                name: 'corellia',
                displayName: 'Corellia',
                spawns: [
                    { x: -137, y: 28, z: -4723, name: 'Coronet' },
                    { x: -5551, y: 21, z: -2605, name: 'Kor Vella' }
                ]
            }
        ]
    });
});

// Helper functions
function generateSessionToken(username) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${username}_${timestamp}_${random}`;
}

function generateAccountId(username) {
    // Simple hash function for consistent account IDs
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

async function getAccountCharacters(accountId, token) {
    // Try Grudge backend first
    if (token) {
        const grudgeRes = await grudgeFetch(GRUDGE_API_URL, '/api/account/characters', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (grudgeRes.ok && grudgeRes.data?.characters) {
            return grudgeRes.data.characters;
        }
    }
    
    // Fallback to local test data when Grudge backend is offline
    const professions = ['Scout', 'Marksman', 'Artisan', 'Medic', 'Entertainer'];
    const planets = ['tutorial', 'tatooine', 'naboo', 'corellia'];
    
    return [
        {
            id: accountId * 10 + 1,
            name: `Character${accountId}`,
            profession: professions[accountId % professions.length],
            level: Math.floor(Math.random() * 20) + 1,
            experience: Math.floor(Math.random() * 10000),
            credits: Math.floor(Math.random() * 50000) + 1000,
            planet: planets[accountId % planets.length],
            zone: planets[accountId % planets.length],
            position: {
                x: Math.floor(Math.random() * 1000),
                y: 10,
                z: Math.floor(Math.random() * 1000)
            },
            stats: {
                health: 100,
                maxHealth: 100,
                action: 100,
                maxAction: 100,
                mind: 100,
                maxMind: 100
            },
            lastPlayed: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        }
    ];
}

// Enhanced UDP communication helper
function sendUDPMessage(message, port = SWGEMU_LOGIN_PORT, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        const buffer = Buffer.from(JSON.stringify(message));
        
        // Set up error handling
        client.on('error', (err) => {
            client.close();
            reject(new Error(`UDP Error: ${err.message}`));
        });
        
        client.send(buffer, 0, buffer.length, port, SWGEMU_HOST, (err) => {
            if (err) {
                client.close();
                reject(new Error(`UDP Send Error: ${err.message}`));
                return;
            }
            
            // Set timeout for response
            const timeoutId = setTimeout(() => {
                client.close();
                reject(new Error('UDP response timeout'));
            }, timeout);
            
            client.on('message', (msg, rinfo) => {
                clearTimeout(timeoutId);
                client.close();
                try {
                    const response = JSON.parse(msg.toString());
                    resolve({ response, rinfo });
                } catch (parseErr) {
                    resolve({ response: msg.toString(), rinfo });
                }
            });
        });
    });
}

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id} from ${socket.handshake.address}`);
    
    // Connection timeout
    const connectionTimeout = setTimeout(() => {
        if (!connectedPlayers.has(socket.id)) {
            console.log(`[WebSocket] Connection timeout for ${socket.id}`);
            socket.disconnect();
        }
    }, 30000); // 30 second timeout for authentication
    
    socket.on('authenticate', async (data) => {
        try {
            clearTimeout(connectionTimeout);
            const { token, characterId } = data;
            
            console.log(`[Auth] WebSocket authentication: Character ${characterId}`);
            
            // Validate session token
            if (!sessions.has(token)) {
                socket.emit('authError', { error: 'Invalid session token' });
                return;
            }
            
            const session = sessions.get(token);
            session.lastActivity = Date.now();
            
            // Get character data
            const characters = await getAccountCharacters(session.accountId);
            const character = characters.find(c => c.id == characterId);
            
            if (!character) {
                socket.emit('authError', { error: 'Character not found' });
                return;
            }
            
            // Store player session
            const playerData = {
                socketId: socket.id,
                characterId: character.id,
                characterName: character.name,
                accountId: session.accountId,
                username: session.username,
                token,
                position: character.position,
                rotation: { x: 0, y: 0, z: 0 },
                zone: character.zone,
                stats: character.stats,
                profession: character.profession,
                level: character.level,
                connectedAt: Date.now(),
                lastUpdate: Date.now()
            };
            
            connectedPlayers.set(socket.id, playerData);
            playerPositions.set(characterId, character.position);
            gameState.playerCount = connectedPlayers.size;
            
            // Get nearby players in same zone
            const nearbyPlayers = Array.from(connectedPlayers.values())
                .filter(p => p.characterId !== characterId && p.zone === character.zone)
                .map(p => ({
                    characterId: p.characterId,
                    characterName: p.characterName,
                    position: p.position,
                    rotation: p.rotation,
                    profession: p.profession,
                    level: p.level
                }));
            
            socket.emit('authenticated', {
                success: true,
                character: {
                    id: character.id,
                    name: character.name,
                    profession: character.profession,
                    level: character.level,
                    stats: character.stats
                },
                worldState: {
                    zone: character.zone,
                    spawnPoint: character.position,
                    nearbyPlayers,
                    serverTime: Date.now()
                }
            });
            
            // Notify other players in the same zone
            socket.to(character.zone).emit('playerJoined', {
                characterId: character.id,
                characterName: character.name,
                position: character.position,
                profession: character.profession,
                level: character.level
            });
            
            // Join zone room
            socket.join(character.zone);
            
            console.log(`[Auth] Player ${character.name} authenticated and joined ${character.zone}`);
            
        } catch (error) {
            console.error('[Auth] WebSocket authentication error:', error);
            socket.emit('authError', { error: 'Authentication failed' });
        }
    });
    
    socket.on('playerMove', (data) => {
        try {
            const player = connectedPlayers.get(socket.id);
            if (!player) return;
            
            const { position, rotation, velocity } = data;
            
            // Update player position
            player.position = position;
            player.rotation = rotation || player.rotation;
            player.lastUpdate = Date.now();
            
            // Update position cache
            playerPositions.set(player.characterId, position);
            
            // Broadcast to players in same zone (within range)
            const moveData = {
                characterId: player.characterId,
                position,
                rotation,
                velocity,
                timestamp: Date.now()
            };
            
            socket.to(player.zone).emit('playerMoved', moveData);
            
        } catch (error) {
            console.error('[Movement] Error handling player move:', error);
        }
    });
    
    socket.on('chatMessage', (data) => {
        try {
            const player = connectedPlayers.get(socket.id);
            if (!player) return;
            
            const { message, type = 'spatial', target } = data;
            
            if (!message || message.trim().length === 0) return;
            
            const chatData = {
                characterId: player.characterId,
                characterName: player.characterName,
                message: message.trim(),
                type,
                timestamp: Date.now(),
                zone: player.zone
            };
            
            console.log(`[Chat] ${player.characterName} (${type}): ${message}`);
            
            // Handle different chat types
            switch (type) {
                case 'spatial':
                    // Send to all players in the same zone
                    socket.to(player.zone).emit('chatMessage', chatData);
                    break;
                    
                case 'tell':
                    // Private message to specific player
                    if (target) {
                        const targetPlayer = Array.from(connectedPlayers.values())
                            .find(p => p.characterName.toLowerCase() === target.toLowerCase());
                        
                        if (targetPlayer) {
                            io.to(targetPlayer.socketId).emit('chatMessage', {
                                ...chatData,
                                type: 'tell',
                                from: player.characterName
                            });
                        } else {
                            socket.emit('chatError', { error: `Player '${target}' not found or offline` });
                        }
                    }
                    break;
                    
                case 'broadcast':
                    // Send to all connected players
                    socket.broadcast.emit('chatMessage', chatData);
                    break;
                    
                default:
                    // Default to spatial
                    socket.to(player.zone).emit('chatMessage', chatData);
                    break;
            }
            
        } catch (error) {
            console.error('[Chat] Error handling chat message:', error);
        }
    });
    
    socket.on('playerAction', (data) => {
        try {
            const player = connectedPlayers.get(socket.id);
            if (!player) return;
            
            const { action, targetId, parameters } = data;
            
            console.log(`[Action] ${player.characterName} performed action: ${action}`);
            
            // Broadcast action to nearby players
            socket.to(player.zone).emit('playerAction', {
                characterId: player.characterId,
                characterName: player.characterName,
                action,
                targetId,
                parameters,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('[Action] Error handling player action:', error);
        }
    });
    
    // ── PvP Combat Events ─────────────────────────────────────
    
    socket.on('pvpAttack', (data) => {
        try {
            const attacker = connectedPlayers.get(socket.id);
            if (!attacker) return;
            
            const { targetCharacterId, damage, damageType, skill, isCrit, position } = data;
            
            // Find target player
            const targetEntry = Array.from(connectedPlayers.entries())
                .find(([, p]) => p.characterId == targetCharacterId);
            
            if (!targetEntry) {
                socket.emit('pvpError', { error: 'Target not found' });
                return;
            }
            
            const [targetSocketId, target] = targetEntry;
            
            // Validate same zone
            if (attacker.zone !== target.zone) {
                socket.emit('pvpError', { error: 'Target not in range' });
                return;
            }
            
            // Server-side damage validation (cap at reasonable values)
            const validatedDamage = Math.min(Math.max(0, damage || 0), 999);
            
            // Apply damage to target
            target.stats.health = Math.max(0, (target.stats.health || 100) - validatedDamage);
            const killed = target.stats.health <= 0;
            
            const pvpResult = {
                attackerId: attacker.characterId,
                attackerName: attacker.characterName,
                targetId: target.characterId,
                targetName: target.characterName,
                damage: validatedDamage,
                damageType: damageType || 'physical',
                skill: skill || 'basic_attack',
                isCrit: !!isCrit,
                targetHealthRemaining: target.stats.health,
                killed,
                timestamp: Date.now()
            };
            
            // Notify attacker
            socket.emit('pvpDamageDealt', pvpResult);
            
            // Notify target
            io.to(targetSocketId).emit('pvpDamageTaken', pvpResult);
            
            // Broadcast to zone for spectators
            socket.to(attacker.zone).emit('pvpCombatEvent', pvpResult);
            
            console.log(`[PvP] ${attacker.characterName} hit ${target.characterName} for ${validatedDamage} (${damageType})${killed ? ' — KILL!' : ''}`);
            
            if (killed) {
                // Respawn target after delay
                target.stats.health = target.stats.maxHealth || 100;
                io.to(targetSocketId).emit('pvpDeath', {
                    killedBy: attacker.characterName,
                    respawnIn: 5000
                });
                
                socket.emit('pvpKill', {
                    victimName: target.characterName,
                    victimId: target.characterId
                });
                
                // Log PvP kill to Grudge backend
                const session = sessions.get(attacker.token);
                if (session?.grudgeToken) {
                    grudgeFetch(GRUDGE_API_URL, '/api/pvp/log', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${session.grudgeToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            winnerId: attacker.characterId,
                            loserId: target.characterId,
                            zone: attacker.zone,
                            timestamp: Date.now()
                        }),
                    });
                }
            }
            
        } catch (error) {
            console.error('[PvP] Error handling pvp attack:', error);
        }
    });
    
    socket.on('pvpChallenge', (data) => {
        try {
            const challenger = connectedPlayers.get(socket.id);
            if (!challenger) return;
            
            const { targetCharacterId } = data;
            const targetEntry = Array.from(connectedPlayers.entries())
                .find(([, p]) => p.characterId == targetCharacterId);
            
            if (!targetEntry) {
                socket.emit('pvpError', { error: 'Target not found' });
                return;
            }
            
            const [targetSocketId, target] = targetEntry;
            
            io.to(targetSocketId).emit('pvpChallengeReceived', {
                challengerId: challenger.characterId,
                challengerName: challenger.characterName,
                challengerLevel: challenger.level
            });
            
            console.log(`[PvP] ${challenger.characterName} challenged ${target.characterName}`);
        } catch (error) {
            console.error('[PvP] Error handling pvp challenge:', error);
        }
    });
    
    socket.on('pvpChallengeAccept', (data) => {
        try {
            const accepter = connectedPlayers.get(socket.id);
            if (!accepter) return;
            
            const { challengerId } = data;
            const challengerEntry = Array.from(connectedPlayers.entries())
                .find(([, p]) => p.characterId == challengerId);
            
            if (!challengerEntry) return;
            
            const [challengerSocketId] = challengerEntry;
            
            // Notify both players the duel is starting
            socket.emit('pvpDuelStart', { opponentId: challengerId });
            io.to(challengerSocketId).emit('pvpDuelStart', { opponentId: accepter.characterId });
            
            // Broadcast to zone
            socket.to(accepter.zone).emit('pvpDuelAnnouncement', {
                player1: accepter.characterName,
                player2: challengerEntry[1].characterName
            });
            
            console.log(`[PvP] Duel started: ${accepter.characterName} vs ${challengerEntry[1].characterName}`);
        } catch (error) {
            console.error('[PvP] Error handling pvp challenge accept:', error);
        }
    });
    
    socket.on('zoneTransfer', (data) => {
        try {
            const player = connectedPlayers.get(socket.id);
            if (!player) return;
            
            const { newZone, spawnPoint } = data;
            
            console.log(`[Zone] ${player.characterName} transferring to ${newZone}`);
            
            // Leave old zone
            socket.leave(player.zone);
            socket.to(player.zone).emit('playerLeft', {
                characterId: player.characterId,
                characterName: player.characterName
            });
            
            // Update player zone
            player.zone = newZone;
            player.position = spawnPoint || { x: 0, y: 10, z: 0 };
            
            // Join new zone
            socket.join(newZone);
            
            // Get players in new zone
            const nearbyPlayers = Array.from(connectedPlayers.values())
                .filter(p => p.characterId !== player.characterId && p.zone === newZone)
                .map(p => ({
                    characterId: p.characterId,
                    characterName: p.characterName,
                    position: p.position,
                    rotation: p.rotation,
                    profession: p.profession,
                    level: p.level
                }));
            
            socket.emit('zoneTransferred', {
                zone: newZone,
                spawnPoint: player.position,
                nearbyPlayers
            });
            
            // Notify players in new zone
            socket.to(newZone).emit('playerJoined', {
                characterId: player.characterId,
                characterName: player.characterName,
                position: player.position,
                profession: player.profession,
                level: player.level
            });
            
        } catch (error) {
            console.error('[Zone] Error handling zone transfer:', error);
        }
    });
    
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });
    
    socket.on('disconnect', (reason) => {
        try {
            clearTimeout(connectionTimeout);
            
            const player = connectedPlayers.get(socket.id);
            if (player) {
                console.log(`[WebSocket] Player ${player.characterName} disconnected: ${reason}`);
                
                // Notify other players
                socket.to(player.zone).emit('playerLeft', {
                    characterId: player.characterId,
                    characterName: player.characterName
                });
                
                // Clean up
                connectedPlayers.delete(socket.id);
                playerPositions.delete(player.characterId);
                gameState.playerCount = connectedPlayers.size;
                
                // Update session activity
                if (sessions.has(player.token)) {
                    sessions.get(player.token).lastActivity = Date.now();
                }
            } else {
                console.log(`[WebSocket] Unauthenticated client ${socket.id} disconnected: ${reason}`);
            }
        } catch (error) {
            console.error('[Disconnect] Error handling disconnect:', error);
        }
    });
    
    socket.on('error', (error) => {
        console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });
});

// Session cleanup routine
setInterval(() => {
    const now = Date.now();
    const sessionTimeout = 3600000; // 1 hour
    
    for (const [token, session] of sessions.entries()) {
        if (now - session.lastActivity > sessionTimeout) {
            console.log(`[Cleanup] Removing expired session for ${session.username}`);
            sessions.delete(token);
        }
    }
}, 300000); // Check every 5 minutes

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n[Server] Received SIGINT, shutting down gracefully...');
    
    // Notify all connected players
    io.emit('serverShutdown', {
        message: 'Server is shutting down for maintenance',
        countdown: 30
    });
    
    // Close server after giving players time to disconnect
    setTimeout(() => {
        httpServer.close(() => {
            console.log('[Server] HTTP server closed');
            process.exit(0);
        });
    }, 30000);
});

process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    // Don't exit immediately in production
    if (NODE_ENV === 'development') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌉 StarWayGRUDA Bridge Server`);
    console.log(`====================================`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`HTTP API: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`SWGEmu Host: ${SWGEMU_HOST}`);
    console.log(`SWGEmu LoginServer: ${SWGEMU_HOST}:${SWGEMU_LOGIN_PORT} (UDP)`);
    console.log(`SWGEmu ZoneServer: ${SWGEMU_HOST}:${SWGEMU_ZONE_PORT} (TCP)`);
    console.log(`Status: Online and Ready`);
    console.log(`Connected Players: 0`);
    console.log(`Active Sessions: 0`);
    console.log(`Server PID: ${process.pid}`);
    console.log(`====================================\n`);
    
    // Test SWGEmu connection (optional)
    if (NODE_ENV === 'development') {
        testSWGEmuConnection();
    }
});

// Test SWGEmu connection function
async function testSWGEmuConnection() {
    try {
        console.log(`[Test] Testing connection to SWGEmu server...`);
        
        const testMessage = {
            type: 'ping',
            timestamp: Date.now()
        };
        
        const result = await sendUDPMessage(testMessage, SWGEMU_LOGIN_PORT, 3000);
        console.log(`[Test] SWGEmu connection successful:`, result.response);
        
    } catch (error) {
        console.log(`[Test] SWGEmu connection failed (expected in development): ${error.message}`);
        console.log(`[Test] Server will run in standalone mode`);
    }
}

// Error handling for server startup
httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[Server] Port ${PORT} is already in use`);
        console.error(`[Server] Please check if another instance is running`);
        process.exit(1);
    } else {
        console.error(`[Server] Server error:`, error);
    }
});

process.on('exit', (code) => {
    console.log(`\n[Server] Process exiting with code: ${code}`);
});

import { io } from 'socket.io-client';

export class WebSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.characterId = null;
        this.eventHandlers = new Map();
    }
    
    connect(url = 'http://localhost:3001') {
        return new Promise((resolve, reject) => {
            console.log(`[WebSocket] Connecting to ${url}...`);
            
            this.socket = io(url, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });
            
            this.socket.on('connect', () => {
                console.log('[WebSocket] Connected!');
                this.connected = true;
                resolve();
            });
            
            this.socket.on('disconnect', () => {
                console.log('[WebSocket] Disconnected');
                this.connected = false;
                this.emit('disconnected');
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('[WebSocket] Connection error:', error);
                reject(error);
            });
            
            // Handle server messages
            this.socket.on('authenticated', (data) => {
                console.log('[WebSocket] Authenticated successfully');
                this.emit('authenticated', data);
            });
            
            this.socket.on('playerJoined', (data) => {
                this.emit('playerJoined', data);
            });
            
            this.socket.on('playerLeft', (data) => {
                this.emit('playerLeft', data);
            });
            
            this.socket.on('playerMoved', (data) => {
                this.emit('playerMoved', data);
            });
            
            this.socket.on('chatMessage', (data) => {
                this.emit('chatMessage', data);
            });
        });
    }
    
    authenticate(token, characterId) {
        if (!this.socket || !this.connected) {
            console.error('[WebSocket] Cannot authenticate: not connected');
            return;
        }
        
        this.characterId = characterId;
        this.socket.emit('authenticate', { token, characterId });
    }
    
    sendPlayerMove(position, rotation) {
        if (!this.socket || !this.connected) return;
        
        this.socket.emit('playerMove', {
            position: { x: position.x, y: position.y, z: position.z },
            rotation: rotation
        });
    }
    
    sendChatMessage(message, type = 'spatial') {
        if (!this.socket || !this.connected) return;
        
        this.socket.emit('chatMessage', {
            message,
            type
        });
    }
    
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
}

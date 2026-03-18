/**
 * StarWayGRUDA WebSocketClient — Real-time multiplayer using socket.io-client
 *
 * Wraps socket.io-client with game-specific event helpers.
 * Reconnects automatically; emits typed game events via the game event bus.
 */
import { io } from 'socket.io-client';

export class WebSocketClient {
    constructor(config = {}) {
        this.namespace = config.namespace || '/game';
        this.url = config.url || '';
        this.socket = null;
        this._listeners = new Map();
    }

    connect() {
        if (this.socket?.connected) return this.socket;

        this.socket = io(this.url + this.namespace, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log(`[WS] Connected to ${this.namespace}`);
        });
        this.socket.on('disconnect', (reason) => {
            console.warn(`[WS] Disconnected: ${reason}`);
        });
        this.socket.on('connect_error', (err) => {
            console.error('[WS] Connection error:', err.message);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[WS] Cannot emit — not connected:', event);
        }
    }

    on(event, handler) {
        if (!this.socket) this.connect();
        this.socket.on(event, handler);
        if (!this._listeners.has(event)) this._listeners.set(event, []);
        this._listeners.get(event).push(handler);
    }

    off(event, handler) {
        this.socket?.off(event, handler);
    }

    get connected() {
        return this.socket?.connected ?? false;
    }
}

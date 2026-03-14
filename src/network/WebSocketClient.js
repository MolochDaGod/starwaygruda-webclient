/**
 * StarWayGRUDA WebSocketClient — Re-exports the shared SDK WS client
 *
 * Games import this file as before; it just delegates to GrudgeWSClient.
 * StarWay-specific events can be added here if needed.
 */
import { GrudgeWSClient } from 'grudge-studio/cloud';

export class WebSocketClient extends GrudgeWSClient {
    constructor(config = {}) {
        super({ ...config, namespace: '/game' });
    }
}

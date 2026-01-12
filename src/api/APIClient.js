import axios from 'axios';

export class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 5000
        });
    }
    
    async connect() {
        try {
            const response = await this.client.get('/api/health');
            console.log('✅ Connected to server:', response.data);
            return response.data;
        } catch (error) {
            console.warn('⚠️ Server not available, running in offline mode');
            return { status: 'offline' };
        }
    }
    
    async getCharacters(accountId) {
        const response = await this.client.get(`/api/characters/${accountId}`);
        return response.data;
    }
    
    async createCharacter(characterData) {
        const response = await this.client.post('/api/characters', characterData);
        return response.data;
    }
    
    async getSpawnLocations() {
        const response = await this.client.get('/api/spawns');
        return response.data;
    }
}

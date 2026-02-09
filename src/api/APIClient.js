import axios from 'axios';

export class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 5000
        });
        this.sessionToken = null;
        this.accountId = null;
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
    
    async login(username, password) {
        try {
            // Attempt to connect to SWGEmu LoginServer
            const response = await this.client.post('/api/login', {
                username,
                password
            });
            
            if (response.data.success) {
                this.sessionToken = response.data.token;
                this.accountId = response.data.accountId;
                return response.data;
            }
            
            return { success: false, message: 'Invalid credentials' };
        } catch (error) {
            // Server connection failed - return offline success for development
            console.warn('⚠️ Server offline - using local development mode');
            return {
                success: true,
                offline: true,
                accountId: 'dev-account',
                token: 'dev-token',
                message: 'Offline mode active'
            };
        }
    }
    
    async getCharacters(accountId) {
        try {
            const response = await this.client.get(`/api/characters/${accountId || this.accountId}`);
            return response.data;
        } catch (error) {
            // Return default characters for offline mode
            return {
                characters: [
                    {
                        id: 'dev-char-1',
                        name: 'Player',
                        species: 'Human',
                        gender: 'Male',
                        profession: 'Marksman',
                        planet: 'Tatooine',
                        level: 1
                    }
                ]
            };
        }
    }
    
    async createCharacter(characterData) {
        try {
            const response = await this.client.post('/api/characters', characterData);
            return response.data;
        } catch (error) {
            // Return created character for offline mode
            return {
                success: true,
                character: {
                    id: `char-${Date.now()}`,
                    ...characterData
                }
            };
        }
    }
    
    async getSpawnLocations() {
        try {
            const response = await this.client.get('/api/spawns');
            return response.data;
        } catch (error) {
            // Return default spawn for offline mode
            return {
                spawns: [
                    { planet: 'Tatooine', x: 0, y: 0, z: 0, name: 'Desert Outpost' }
                ]
            };
        }
    }
}

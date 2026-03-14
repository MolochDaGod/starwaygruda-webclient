import { GrudgeCharacterCreation } from './GrudgeCharacterCreation.js';

export class CharacterSelection {
    constructor(apiClient) {
        this.api = apiClient;
        this.characters = [];
        this.selectedCharacter = null;
        this.grudgeCreator = null;
        this.createUI();
    }
    
    createUI() {
        const container = document.createElement('div');
        container.id = 'character-selection';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        container.innerHTML = `
            <div style="text-align: center; color: #fff; max-width: 800px; padding: 20px;">
                <h1 style="font-size: 48px; margin-bottom: 10px; color: #fbbf24; text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);">
                    ⚔️ GRUDA Wars
                </h1>
                <p style="font-size: 18px; margin-bottom: 40px; color: #888;">
                    Grudge Studio — Arena · Islands · Conquest
                </p>
                
                <div id="login-section" style="margin-bottom: 30px;">
                    <h2 style="margin-bottom: 20px;">Grudge Studio Login</h2>
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="username" placeholder="Grudge ID / Username" 
                            style="padding: 12px; width: 300px; font-size: 16px; border-radius: 5px; border: 1px solid #333; background: #1a1a2e; color: #fff;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <input type="password" id="password" placeholder="Password" 
                            style="padding: 12px; width: 300px; font-size: 16px; border-radius: 5px; border: 1px solid #333; background: #1a1a2e; color: #fff;">
                    </div>
                    <button id="login-btn" style="padding: 12px 40px; font-size: 16px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%); color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        Login
                    </button>
                    <p id="login-status" style="margin-top: 15px; color: #ff6b6b;"></p>
                </div>
                
                <div id="character-list-section" style="display: none;">
                    <h2 style="margin-bottom: 20px;">Select Character</h2>
                    <div id="character-list" style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
                        <!-- Characters will be loaded here -->
                    </div>
                    <button id="create-char-btn" style="padding: 10px 30px; font-size: 14px; background: #2a2a3e; color: #fbbf24; border: 2px solid #fbbf24; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        Create New Character
                    </button>
                    <button id="enter-world-btn" style="padding: 10px 30px; font-size: 14px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%); color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;" disabled>
                        Enter World
                    </button>
                </div>
                
                <div id="character-creation-section" style="display: none;">
                    <h2 style="margin-bottom: 20px;">Quick Create</h2>
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="char-name" placeholder="Character Name" 
                            style="padding: 12px; width: 300px; font-size: 16px; border-radius: 5px; border: 1px solid #333; background: #1a1a2e; color: #fff;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <select id="char-class" style="padding: 12px; width: 326px; font-size: 16px; border-radius: 5px; border: 1px solid #333; background: #1a1a2e; color: #fff;">
                            <option value="">Select Class</option>
                            <option value="warrior">⚔️ Warrior</option>
                            <option value="worge">🐺 Worge</option>
                            <option value="mage">🔥 Mage</option>
                            <option value="ranger">🏹 Ranger</option>
                        </select>
                    </div>
                    <button id="create-confirm-btn" style="padding: 10px 30px; font-size: 14px; background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%); color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px;">
                        Create
                    </button>
                    <button id="create-cancel-btn" style="padding: 10px 30px; font-size: 14px; background: #2a2a3e; color: #fbbf24; border: 2px solid #fbbf24; border-radius: 5px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333;">
                    <p style="font-size: 12px; color: #555;">
                        Powered by <span style="color: #fbbf24;">Grudge Studio</span> · 
                        <span id="server-info" style="color: #888;">grudgewarlords.com</span>
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        this.container = container;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('enter-world-btn').addEventListener('click', () => this.handleEnterWorld());
        document.getElementById('create-char-btn').addEventListener('click', () => this.showCharacterCreation());
        document.getElementById('create-confirm-btn').addEventListener('click', () => this.handleQuickCreate());
        document.getElementById('create-cancel-btn').addEventListener('click', () => this.showCharacterList());
        
        // Enter key support
        ['username', 'password'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });
    }
    
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const status = document.getElementById('login-status');
        
        if (!username || !password) {
            status.textContent = 'Please enter username and password';
            return;
        }
        
        status.textContent = 'Connecting to server...';
        status.style.color = '#00d4ff';
        
        try {
            // Try to authenticate with server
            const response = await this.api.login(username, password);
            
            if (response.success) {
                // Load characters from API
                const charData = await this.api.getCharacters();
                this.characters = charData.characters || [];
                
                if (response.offline) {
                    status.textContent = 'Offline mode - Using local character';
                    status.style.color = '#ffa500';
                }
                
                this.showCharacterList();
            } else {
                status.textContent = response.message || 'Login failed';
                status.style.color = '#ff6b6b';
            }
        } catch (error) {
            // For now, allow offline mode for testing
            console.warn('Server connection failed, using offline mode:', error);
            status.textContent = 'Server offline - Creating tutorial character';
            status.style.color = '#ffa500';
            
            setTimeout(() => {
                this.characters = [{
                    id: 1,
                    name: 'Player',
                    race: 'human',
                    class: 'warrior',
                    faction: 'Crusade',
                    level: 1,
                    planet: 'tutorial',
                    zone: 'Tutorial Island'
                }];
                this.showCharacterList();
            }, 1000);
        }
    }
    
    showCharacterList() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('character-creation-section').style.display = 'none';
        document.getElementById('character-list-section').style.display = 'block';
        
        const list = document.getElementById('character-list');
        list.innerHTML = '';
        
        if (this.characters.length === 0) {
            list.innerHTML = '<p style="color: #888;">No characters found. Create one to begin!</p>';
            return;
        }
        
        this.characters.forEach(char => {
            const card = document.createElement('div');
            card.style.cssText = `
                width: 200px;
                padding: 20px;
                background: #1a1a2e;
                border: 2px solid #333;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
            `;
            
            const displayClass = (char.class || char.profession || 'Unknown');
            const displayRace = (char.race || 'Unknown');
            card.innerHTML = `
                <h3 style="margin: 0 0 10px 0; color: #fbbf24;">${char.name}</h3>
                <p style="margin: 5px 0; color: #ccc; font-size: 14px;">
                    ${displayRace.charAt(0).toUpperCase() + displayRace.slice(1)} ${displayClass.charAt(0).toUpperCase() + displayClass.slice(1)}
                </p>
                <p style="margin: 5px 0; color: #888; font-size: 12px;">
                    Level ${char.level} · ${char.faction || ''}
                </p>
                <p style="margin: 5px 0; color: #666; font-size: 11px;">
                    ${char.planet || 'tutorial'}
                </p>
            `;
            
            card.addEventListener('click', () => this.selectCharacter(char, card));
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = '#00d4ff';
                card.style.transform = 'translateY(-5px)';
            });
            card.addEventListener('mouseleave', () => {
                if (this.selectedCharacter !== char) {
                    card.style.borderColor = '#333';
                    card.style.transform = 'translateY(0)';
                }
            });
            
            list.appendChild(card);
        });
    }
    
    selectCharacter(char, cardElement) {
        // Remove selection from all cards
        document.querySelectorAll('#character-list > div').forEach(card => {
            card.style.borderColor = '#333';
            card.style.transform = 'translateY(0)';
        });
        
        // Select this card
        cardElement.style.borderColor = '#fbbf24';
        cardElement.style.transform = 'translateY(-5px)';
        this.selectedCharacter = char;
        
        document.getElementById('enter-world-btn').disabled = false;
    }
    
    showCharacterCreation() {
        // Launch the full Grudge character creation wizard (ported from warlord-crafting-suite)
        if (!this.grudgeCreator) {
            this.grudgeCreator = new GrudgeCharacterCreation({
                onComplete: (character) => {
                    console.log('[CharacterSelection] Grudge character created:', character);
                    // Add to character list and select it
                    this.characters.push({
                        id: character.id,
                        name: character.name,
                        class: character.class || character.classId,
                        race: character.race || character.raceId,
                        faction: character.faction,
                        level: character.level || 1,
                        planet: 'tutorial',
                        zone: 'Tutorial Island',
                        attributes: character.attributes,
                        avatarUrl: character.avatarUrl,
                    });
                    this.showCharacterList();
                },
                onCancel: () => {
                    // Return to character list
                    this.showCharacterList();
                },
            });
        }
        this.grudgeCreator.show();
    }
    
    async handleQuickCreate() {
        const name = document.getElementById('char-name').value;
        const charClass = document.getElementById('char-class').value;
        
        if (!name || !charClass) {
            alert('Please enter a name and select a class');
            return;
        }
        
        // Quick-create with defaults — race human, faction Crusade
        const newChar = {
            id: this.characters.length + 1,
            name: name,
            race: 'human',
            class: charClass,
            faction: 'Crusade',
            level: 1,
            planet: 'tutorial',
            zone: 'Tutorial Island'
        };
        
        this.characters.push(newChar);
        this.showCharacterList();
    }
    
    handleEnterWorld() {
        if (!this.selectedCharacter) return;
        
        // Hide character selection
        this.container.style.display = 'none';
        
        // Trigger game start event
        const event = new CustomEvent('characterSelected', {
            detail: this.selectedCharacter
        });
        window.dispatchEvent(event);
    }
    
    updateServerStatus(status) {
        const serverInfo = document.getElementById('server-info');
        if (serverInfo) {
            serverInfo.textContent = status;
        }
    }
}

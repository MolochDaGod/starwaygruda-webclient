export class CharacterSheet {
    constructor() {
        this.isVisible = false;
        this.characterData = {
            name: 'Unknown Wanderer',
            profession: 'Artisan',
            level: 15,
            experience: 15750,
            nextLevelXP: 20000,
            credits: 15000,
            bankCredits: 250000,
            health: 850,
            maxHealth: 1000,
            action: 300,
            maxAction: 300,
            mind: 400,
            maxMind: 400,
            attributes: {
                strength: 45,
                constitution: 52,
                stamina: 48,
                precision: 38,
                agility: 41,
                luck: 35,
                intellect: 55,
                knowledge: 60,
                willpower: 47
            },
            skills: {},
            badges: [],
            faction: 'Neutral',
            factionRank: 0,
            playTime: 127 // hours
        };
        
        this.createUI();
        this.setupEventListeners();
        this.loadCharacterData();
    }
    
    createUI() {
        // Main character sheet window
        this.window = document.createElement('div');
        this.window.id = 'character-window';
        this.window.className = 'game-window character-window hidden';
        
        this.window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-user"></i>
                    Character Sheet
                </div>
                <div class="window-controls">
                    <button class="minimize-btn"><i class="fas fa-minus"></i></button>
                    <button class="close-btn" onclick="window.characterSheet?.hide()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            
            <div class="window-content">
                <div class="character-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="overview">
                            <i class="fas fa-user-circle"></i> Overview
                        </button>
                        <button class="tab-btn" data-tab="attributes">
                            <i class="fas fa-dumbbell"></i> Attributes
                        </button>
                        <button class="tab-btn" data-tab="skills">
                            <i class="fas fa-star"></i> Skills
                        </button>
                        <button class="tab-btn" data-tab="badges">
                            <i class="fas fa-medal"></i> Badges
                        </button>
                        <button class="tab-btn" data-tab="faction">
                            <i class="fas fa-flag"></i> Faction
                        </button>
                    </div>
                    
                    <div class="tab-content">
                        <!-- Overview Tab -->
                        <div class="tab-panel active" id="overview-tab">
                            <div class="character-overview">
                                <div class="character-portrait">
                                    <div class="portrait-image">
                                        <i class="fas fa-user-astronaut"></i>
                                    </div>
                                    <div class="character-basic-info">
                                        <h2 id="character-name">${this.characterData.name}</h2>
                                        <p class="character-title">${this.characterData.profession} - Level ${this.characterData.level}</p>
                                        <div class="experience-bar">
                                            <div class="exp-progress" style="width: ${(this.characterData.experience / this.characterData.nextLevelXP) * 100}%"></div>
                                        </div>
                                        <p class="exp-text">${this.characterData.experience.toLocaleString()} / ${this.characterData.nextLevelXP.toLocaleString()} XP</p>
                                    </div>
                                </div>
                                
                                <div class="vital-stats">
                                    <div class="stat-group">
                                        <h3><i class="fas fa-heart"></i> Vital Statistics</h3>
                                        <div class="vital-bars">
                                            <div class="vital-bar health">
                                                <div class="vital-label">
                                                    <span>Health</span>
                                                    <span>${this.characterData.health} / ${this.characterData.maxHealth}</span>
                                                </div>
                                                <div class="vital-progress">
                                                    <div class="vital-fill health-fill" style="width: ${(this.characterData.health / this.characterData.maxHealth) * 100}%"></div>
                                                </div>
                                            </div>
                                            
                                            <div class="vital-bar action">
                                                <div class="vital-label">
                                                    <span>Action</span>
                                                    <span>${this.characterData.action} / ${this.characterData.maxAction}</span>
                                                </div>
                                                <div class="vital-progress">
                                                    <div class="vital-fill action-fill" style="width: ${(this.characterData.action / this.characterData.maxAction) * 100}%"></div>
                                                </div>
                                            </div>
                                            
                                            <div class="vital-bar mind">
                                                <div class="vital-label">
                                                    <span>Mind</span>
                                                    <span>${this.characterData.mind} / ${this.characterData.maxMind}</span>
                                                </div>
                                                <div class="vital-progress">
                                                    <div class="vital-fill mind-fill" style="width: ${(this.characterData.mind / this.characterData.maxMind) * 100}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="stat-group">
                                        <h3><i class="fas fa-coins"></i> Wealth</h3>
                                        <div class="wealth-info">
                                            <div class="wealth-item">
                                                <i class="fas fa-coins"></i>
                                                <span>Cash Credits: <strong>${this.characterData.credits.toLocaleString()}</strong></span>
                                            </div>
                                            <div class="wealth-item">
                                                <i class="fas fa-university"></i>
                                                <span>Bank Credits: <strong>${this.characterData.bankCredits.toLocaleString()}</strong></span>
                                            </div>
                                            <div class="wealth-item total">
                                                <i class="fas fa-wallet"></i>
                                                <span>Total Wealth: <strong>${(this.characterData.credits + this.characterData.bankCredits).toLocaleString()}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="character-stats">
                                    <div class="stat-group">
                                        <h3><i class="fas fa-clock"></i> Play Statistics</h3>
                                        <div class="play-stats">
                                            <div class="play-stat">
                                                <span class="stat-label">Total Play Time:</span>
                                                <span class="stat-value">${this.formatPlayTime(this.characterData.playTime)}</span>
                                            </div>
                                            <div class="play-stat">
                                                <span class="stat-label">Character Created:</span>
                                                <span class="stat-value">15 days ago</span>
                                            </div>
                                            <div class="play-stat">
                                                <span class="stat-label">Last Login:</span>
                                                <span class="stat-value">Today</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Attributes Tab -->
                        <div class="tab-panel" id="attributes-tab">
                            <div class="attributes-grid">
                                <div class="attribute-category">
                                    <h3><i class="fas fa-fist-raised"></i> Physical</h3>
                                    <div class="attribute-list" id="physical-attributes">
                                        ${this.generateAttributeHTML('strength', 'Strength')}
                                        ${this.generateAttributeHTML('constitution', 'Constitution')}
                                        ${this.generateAttributeHTML('stamina', 'Stamina')}
                                    </div>
                                </div>
                                
                                <div class="attribute-category">
                                    <h3><i class="fas fa-crosshairs"></i> Reflexes</h3>
                                    <div class="attribute-list" id="reflex-attributes">
                                        ${this.generateAttributeHTML('precision', 'Precision')}
                                        ${this.generateAttributeHTML('agility', 'Agility')}
                                        ${this.generateAttributeHTML('luck', 'Luck')}
                                    </div>
                                </div>
                                
                                <div class="attribute-category">
                                    <h3><i class="fas fa-brain"></i> Mental</h3>
                                    <div class="attribute-list" id="mental-attributes">
                                        ${this.generateAttributeHTML('intellect', 'Intellect')}
                                        ${this.generateAttributeHTML('knowledge', 'Knowledge')}
                                        ${this.generateAttributeHTML('willpower', 'Willpower')}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="attribute-points-info">
                                <div class="points-available">
                                    <i class="fas fa-plus-circle"></i>
                                    <span>Available Attribute Points: <strong>5</strong></span>
                                </div>
                                <div class="attribute-help">
                                    <p><i class="fas fa-info-circle"></i> Attributes affect your character's capabilities in combat, crafting, and social interactions.</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Skills Tab -->
                        <div class="tab-panel" id="skills-tab">
                            <div class="skills-container">
                                <div class="skill-trees">
                                    <div class="skill-tree" id="artisan-tree">
                                        <h3><i class="fas fa-hammer"></i> Artisan</h3>
                                        <div class="skill-progression">
                                            ${this.generateSkillTree('artisan')}
                                        </div>
                                    </div>
                                    
                                    <div class="skill-tree" id="combat-tree">
                                        <h3><i class="fas fa-sword"></i> Combat</h3>
                                        <div class="skill-progression">
                                            ${this.generateSkillTree('combat')}
                                        </div>
                                    </div>
                                    
                                    <div class="skill-tree" id="exploration-tree">
                                        <h3><i class="fas fa-map"></i> Exploration</h3>
                                        <div class="skill-progression">
                                            ${this.generateSkillTree('exploration')}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="skill-details" id="skill-details">
                                    <div class="no-skill-selected">
                                        <i class="fas fa-mouse-pointer"></i>
                                        <p>Select a skill to view details</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Badges Tab -->
                        <div class="tab-panel" id="badges-tab">
                            <div class="badges-grid" id="badges-grid">
                                ${this.generateBadgesHTML()}
                            </div>
                        </div>
                        
                        <!-- Faction Tab -->
                        <div class="tab-panel" id="faction-tab">
                            <div class="faction-info">
                                <div class="current-faction">
                                    <h3><i class="fas fa-flag"></i> Current Allegiance</h3>
                                    <div class="faction-display">
                                        <div class="faction-emblem">
                                            <i class="fas fa-balance-scale"></i>
                                        </div>
                                        <div class="faction-details">
                                            <h4>${this.characterData.faction}</h4>
                                            <p>Rank: ${this.characterData.factionRank} - Citizen</p>
                                            <div class="faction-standing">
                                                <span>Standing: Neutral</span>
                                                <div class="standing-bar">
                                                    <div class="standing-fill" style="width: 50%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="faction-options">
                                    <h3><i class="fas fa-handshake"></i> Available Factions</h3>
                                    <div class="faction-list">
                                        <div class="faction-choice imperial">
                                            <div class="choice-emblem">
                                                <i class="fas fa-empire"></i>
                                            </div>
                                            <div class="choice-info">
                                                <h4>Galactic Empire</h4>
                                                <p>Order through strength and unity</p>
                                                <div class="standing-indicator negative">
                                                    Standing: -150 (Enemy)
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="faction-choice rebel">
                                            <div class="choice-emblem">
                                                <i class="fas fa-rebel"></i>
                                            </div>
                                            <div class="choice-info">
                                                <h4>Rebel Alliance</h4>
                                                <p>Freedom and democracy for all</p>
                                                <div class="standing-indicator positive">
                                                    Standing: +75 (Friendly)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .character-window {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 1000px;
                height: 700px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 212, 255, 0.3);
                z-index: 1001;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
            }
            
            .character-window.hidden {
                display: none;
            }
            
            .character-tabs {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 20px;
            }
            
            .tab-buttons {
                display: flex;
                gap: 5px;
                margin-bottom: 20px;
                border-bottom: 2px solid rgba(0, 212, 255, 0.3);
                padding-bottom: 10px;
            }
            
            .tab-btn {
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                color: white;
                border-radius: 8px 8px 0 0;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
            }
            
            .tab-btn:hover {
                background: rgba(0, 212, 255, 0.1);
            }
            
            .tab-btn.active {
                background: rgba(0, 212, 255, 0.2);
                border-bottom-color: transparent;
                border-color: #00d4ff;
            }
            
            .tab-content {
                flex: 1;
                overflow-y: auto;
            }
            
            .tab-panel {
                display: none;
                height: 100%;
            }
            
            .tab-panel.active {
                display: block;
            }
            
            .character-overview {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                height: 100%;
            }
            
            .character-portrait {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .portrait-image {
                width: 150px;
                height: 150px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #00d4ff;
                border-radius: 75px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 64px;
                color: #00d4ff;
                margin: 0 auto;
            }
            
            .character-basic-info {
                text-align: center;
            }
            
            .character-basic-info h2 {
                margin: 0 0 5px 0;
                color: #00d4ff;
                font-size: 24px;
            }
            
            .character-title {
                margin: 0 0 15px 0;
                color: #ccc;
                font-size: 14px;
            }
            
            .experience-bar {
                width: 100%;
                height: 8px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .exp-progress {
                height: 100%;
                background: linear-gradient(90deg, #FFD700, #FFA500);
                border-radius: 4px;
                transition: width 0.3s;
            }
            
            .exp-text {
                margin: 0;
                font-size: 12px;
                color: #ccc;
            }
            
            .vital-stats,
            .character-stats {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .stat-group {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
            }
            
            .stat-group h3 {
                margin: 0 0 15px 0;
                color: #00d4ff;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .vital-bars {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .vital-bar {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .vital-label {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
            }
            
            .vital-progress {
                width: 100%;
                height: 6px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .vital-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.3s;
            }
            
            .health-fill {
                background: linear-gradient(90deg, #ff4757, #ff3838);
            }
            
            .action-fill {
                background: linear-gradient(90deg, #ffda79, #f39c12);
            }
            
            .mind-fill {
                background: linear-gradient(90deg, #74b9ff, #0984e3);
            }
            
            .wealth-info {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .wealth-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 5px;
                font-size: 12px;
            }
            
            .wealth-item.total {
                border-top: 1px solid rgba(0, 212, 255, 0.3);
                padding-top: 8px;
                margin-top: 5px;
                font-weight: bold;
            }
            
            .play-stats {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .play-stat {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
            }
            
            .stat-label {
                color: #ccc;
            }
            
            .stat-value {
                color: white;
                font-weight: bold;
            }
            
            .attributes-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .attribute-category {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
            }
            
            .attribute-category h3 {
                margin: 0 0 15px 0;
                color: #00d4ff;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .attribute-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .attribute-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
                font-size: 12px;
            }
            
            .attribute-name {
                color: #ccc;
            }
            
            .attribute-value {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .attribute-current {
                color: white;
                font-weight: bold;
                min-width: 30px;
                text-align: center;
            }
            
            .attribute-controls {
                display: flex;
                gap: 3px;
            }
            
            .attr-btn {
                width: 20px;
                height: 20px;
                background: rgba(0, 212, 255, 0.2);
                border: 1px solid #00d4ff;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .attr-btn:hover {
                background: rgba(0, 212, 255, 0.3);
            }
            
            .attribute-points-info {
                background: rgba(0, 255, 136, 0.05);
                border: 1px solid rgba(0, 255, 136, 0.3);
                border-radius: 10px;
                padding: 15px;
            }
            
            .points-available {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
                color: #00ff88;
                font-weight: bold;
            }
            
            .attribute-help {
                font-size: 12px;
                color: #ccc;
            }
            
            .skills-container {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 20px;
                height: 100%;
            }
            
            .skill-trees {
                display: flex;
                flex-direction: column;
                gap: 15px;
                overflow-y: auto;
            }
            
            .skill-tree {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
            }
            
            .skill-tree h3 {
                margin: 0 0 15px 0;
                color: #00d4ff;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .skill-progression {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }
            
            .skill-node {
                aspect-ratio: 1;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 10px;
                text-align: center;
                padding: 5px;
            }
            
            .skill-node:hover {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.1);
            }
            
            .skill-node.learned {
                border-color: #00ff88;
                background: rgba(0, 255, 136, 0.2);
            }
            
            .skill-node.available {
                border-color: #ffda79;
                background: rgba(255, 218, 121, 0.1);
            }
            
            .skill-icon {
                font-size: 16px;
                margin-bottom: 3px;
            }
            
            .skill-name {
                font-weight: bold;
                font-size: 9px;
            }
            
            .skill-level {
                color: #ccc;
                font-size: 8px;
            }
            
            .skill-details {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
                height: fit-content;
            }
            
            .no-skill-selected {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: #666;
                height: 200px;
            }
            
            .no-skill-selected i {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .badges-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .badge-item {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                transition: all 0.3s;
            }
            
            .badge-item:hover {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.1);
            }
            
            .badge-icon {
                font-size: 32px;
                margin-bottom: 10px;
                color: #FFD700;
            }
            
            .badge-name {
                font-weight: bold;
                color: white;
                margin-bottom: 5px;
            }
            
            .badge-description {
                font-size: 11px;
                color: #ccc;
            }
            
            .faction-info {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .current-faction,
            .faction-options {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 20px;
            }
            
            .current-faction h3,
            .faction-options h3 {
                margin: 0 0 15px 0;
                color: #00d4ff;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .faction-display {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .faction-emblem,
            .choice-emblem {
                width: 64px;
                height: 64px;
                background: rgba(0, 212, 255, 0.2);
                border: 2px solid #00d4ff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: #00d4ff;
            }
            
            .faction-details {
                flex: 1;
            }
            
            .faction-details h4 {
                margin: 0 0 5px 0;
                color: white;
                font-size: 18px;
            }
            
            .faction-details p {
                margin: 0 0 10px 0;
                color: #ccc;
                font-size: 12px;
            }
            
            .standing-bar {
                width: 100%;
                height: 6px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 3px;
                overflow: hidden;
                margin-top: 5px;
            }
            
            .standing-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff4757, #00ff88);
                border-radius: 3px;
            }
            
            .faction-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .faction-choice {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .faction-choice:hover {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.05);
            }
            
            .choice-info h4 {
                margin: 0 0 5px 0;
                color: white;
            }
            
            .choice-info p {
                margin: 0 0 8px 0;
                color: #ccc;
                font-size: 12px;
            }
            
            .standing-indicator {
                font-size: 11px;
                font-weight: bold;
            }
            
            .standing-indicator.positive {
                color: #00ff88;
            }
            
            .standing-indicator.negative {
                color: #ff4757;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.window);
        
        this.setupTabs();
    }
    
    setupTabs() {
        const tabButtons = this.window.querySelectorAll('.tab-btn');
        const tabPanels = this.window.querySelectorAll('.tab-panel');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab panel
                tabPanels.forEach(panel => panel.classList.remove('active'));
                document.getElementById(`${targetTab}-tab`).classList.add('active');
                
                console.log(`📊 Switched to ${targetTab} tab`);
            });
        });
    }
    
    generateAttributeHTML(attrKey, attrName) {
        const value = this.characterData.attributes[attrKey];
        return `
            <div class="attribute-item">
                <span class="attribute-name">${attrName}:</span>
                <div class="attribute-value">
                    <div class="attribute-controls">
                        <button class="attr-btn" onclick="window.characterSheet?.adjustAttribute('${attrKey}', -1)">-</button>
                    </div>
                    <span class="attribute-current">${value}</span>
                    <div class="attribute-controls">
                        <button class="attr-btn" onclick="window.characterSheet?.adjustAttribute('${attrKey}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateSkillTree(profession) {
        const skills = this.getSkillsForProfession(profession);
        return skills.map(skill => `
            <div class="skill-node ${skill.status}" onclick="window.characterSheet?.selectSkill('${skill.id}')">
                <div class="skill-icon">
                    <i class="${skill.icon}"></i>
                </div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">${skill.level}/${skill.maxLevel}</div>
            </div>
        `).join('');
    }
    
    getSkillsForProfession(profession) {
        const skillTrees = {
            artisan: [
                { id: 'basic_crafting', name: 'Basic Crafting', icon: 'fas fa-hammer', level: 4, maxLevel: 4, status: 'learned' },
                { id: 'tool_mastery', name: 'Tool Mastery', icon: 'fas fa-wrench', level: 3, maxLevel: 4, status: 'learned' },
                { id: 'resource_id', name: 'Resource ID', icon: 'fas fa-search', level: 2, maxLevel: 4, status: 'available' },
                { id: 'assembly', name: 'Assembly', icon: 'fas fa-cogs', level: 0, maxLevel: 4, status: 'available' },
                { id: 'experimentation', name: 'Experimentation', icon: 'fas fa-flask', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'repair', name: 'Repair', icon: 'fas fa-tools', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'mass_production', name: 'Mass Production', icon: 'fas fa-industry', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'master_artisan', name: 'Master Artisan', icon: 'fas fa-crown', level: 0, maxLevel: 1, status: 'locked' }
            ],
            combat: [
                { id: 'melee_combat', name: 'Melee Combat', icon: 'fas fa-sword', level: 2, maxLevel: 4, status: 'learned' },
                { id: 'ranged_combat', name: 'Ranged Combat', icon: 'fas fa-crosshairs', level: 1, maxLevel: 4, status: 'available' },
                { id: 'defense', name: 'Defense', icon: 'fas fa-shield-alt', level: 1, maxLevel: 4, status: 'available' },
                { id: 'tactics', name: 'Tactics', icon: 'fas fa-chess', level: 0, maxLevel: 4, status: 'available' },
                { id: 'berserker', name: 'Berserker', icon: 'fas fa-angry', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'weaponsmith', name: 'Weaponsmith', icon: 'fas fa-anvil', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'combat_medic', name: 'Combat Medic', icon: 'fas fa-medkit', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'master_warrior', name: 'Master Warrior', icon: 'fas fa-fist-raised', level: 0, maxLevel: 1, status: 'locked' }
            ],
            exploration: [
                { id: 'scouting', name: 'Scouting', icon: 'fas fa-binoculars', level: 3, maxLevel: 4, status: 'learned' },
                { id: 'tracking', name: 'Tracking', icon: 'fas fa-paw', level: 2, maxLevel: 4, status: 'learned' },
                { id: 'foraging', name: 'Foraging', icon: 'fas fa-seedling', level: 1, maxLevel: 4, status: 'available' },
                { id: 'survival', name: 'Survival', icon: 'fas fa-campground', level: 0, maxLevel: 4, status: 'available' },
                { id: 'creature_handling', name: 'Creature Handling', icon: 'fas fa-dragon', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'ranger', name: 'Ranger', icon: 'fas fa-tree', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'bio_engineer', name: 'Bio-Engineer', icon: 'fas fa-dna', level: 0, maxLevel: 4, status: 'locked' },
                { id: 'master_scout', name: 'Master Scout', icon: 'fas fa-compass', level: 0, maxLevel: 1, status: 'locked' }
            ]
        };
        
        return skillTrees[profession] || [];
    }
    
    generateBadgesHTML() {
        const badges = [
            { name: 'First Steps', description: 'Completed your first mission', icon: 'fas fa-baby', earned: true },
            { name: 'Apprentice Crafter', description: 'Crafted your first item', icon: 'fas fa-hammer', earned: true },
            { name: 'Explorer', description: 'Visited 5 different planets', icon: 'fas fa-rocket', earned: true },
            { name: 'Wealthy Trader', description: 'Accumulated 100,000 credits', icon: 'fas fa-coins', earned: true },
            { name: 'Combat Veteran', description: 'Won 50 combat encounters', icon: 'fas fa-medal', earned: false },
            { name: 'Master Artisan', description: 'Reached Master level in a crafting profession', icon: 'fas fa-crown', earned: false },
            { name: 'Guild Leader', description: 'Founded or led a guild', icon: 'fas fa-users-crown', earned: false },
            { name: 'Galactic Hero', description: 'Completed the main storyline', icon: 'fas fa-star', earned: false }
        ];
        
        return badges.map(badge => `
            <div class="badge-item ${badge.earned ? 'earned' : 'locked'}">
                <div class="badge-icon" style="color: ${badge.earned ? '#FFD700' : '#666'}">
                    <i class="${badge.icon}"></i>
                </div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
                ${badge.earned ? '<div class="badge-status">✅ Earned</div>' : '<div class="badge-status">🔒 Locked</div>'}
            </div>
        `).join('');
    }
    
    formatPlayTime(hours) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        
        if (days > 0) {
            return `${days} days, ${remainingHours} hours`;
        } else {
            return `${hours} hours`;
        }
    }
    
    setupEventListeners() {
        // Window dragging
        const header = this.window.querySelector('.window-header');
        this.setupWindowDragging(header);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'P' || e.key === 'p') {
                if (!e.ctrlKey && !e.altKey) {
                    this.toggle();
                }
            }
        });
    }
    
    setupWindowDragging(header) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.window.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault();
        });
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            this.window.style.left = (startLeft + deltaX) + 'px';
            this.window.style.top = (startTop + deltaY) + 'px';
            this.window.style.transform = 'none';
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
    
    loadCharacterData() {
        // Update character data display
        this.updateVitalBars();
        this.updateExperience();
        console.log('📊 Character data loaded');
    }
    
    updateVitalBars() {
        const healthFill = this.window.querySelector('.health-fill');
        const actionFill = this.window.querySelector('.action-fill');
        const mindFill = this.window.querySelector('.mind-fill');
        
        if (healthFill) {
            healthFill.style.width = `${(this.characterData.health / this.characterData.maxHealth) * 100}%`;
        }
        if (actionFill) {
            actionFill.style.width = `${(this.characterData.action / this.characterData.maxAction) * 100}%`;
        }
        if (mindFill) {
            mindFill.style.width = `${(this.characterData.mind / this.characterData.maxMind) * 100}%`;
        }
    }
    
    updateExperience() {
        const expProgress = this.window.querySelector('.exp-progress');
        if (expProgress) {
            expProgress.style.width = `${(this.characterData.experience / this.characterData.nextLevelXP) * 100}%`;
        }
    }
    
    adjustAttribute(attribute, change) {
        // In a real game, this would check available points and constraints
        console.log(`📈 Adjusting ${attribute} by ${change}`);
        // For demo, just log the action
    }
    
    selectSkill(skillId) {
        console.log(`🌟 Selected skill: ${skillId}`);
        
        // Show skill details
        const skillDetails = document.getElementById('skill-details');
        skillDetails.innerHTML = `
            <div class="skill-detail-card">
                <h3><i class="fas fa-star"></i> ${skillId}</h3>
                <div class="skill-description">
                    <p>Detailed description of the ${skillId} skill would appear here.</p>
                </div>
                <div class="skill-requirements">
                    <h4>Requirements:</h4>
                    <ul>
                        <li>Previous skill: Level 4</li>
                        <li>Skill points: 1 available</li>
                    </ul>
                </div>
                <button class="learn-skill-btn" onclick="window.characterSheet?.learnSkill('${skillId}')">
                    <i class="fas fa-plus"></i> Learn Skill
                </button>
            </div>
        `;
    }
    
    learnSkill(skillId) {
        console.log(`🎓 Learning skill: ${skillId}`);
        // In a real game, this would spend skill points and update the character
        alert(`Learned skill: ${skillId}!`);
    }
    
    updateCharacterData(newData) {
        this.characterData = { ...this.characterData, ...newData };
        this.loadCharacterData();
    }
    
    show() {
        this.window.classList.remove('hidden');
        this.isVisible = true;
        window.characterSheet = this; // Global access
        console.log('📊 Character sheet opened');
    }
    
    hide() {
        this.window.classList.add('hidden');
        this.isVisible = false;
        console.log('📊 Character sheet closed');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
export class CraftingInterface {
    constructor() {
        this.isVisible = false;
        this.currentSchematic = null;
        this.craftingSession = null;
        this.selectedProfession = 'artisan';
        this.craftingTool = null;
        this.ingredients = [];
        this.experimentPoints = 0;
        this.maxExperimentPoints = 10;
        
        this.professions = {
            artisan: { name: 'Artisan', color: '#FFD700', icon: 'fas fa-hammer' },
            weaponsmith: { name: 'Weaponsmith', color: '#DC143C', icon: 'fas fa-sword' },
            armorsmith: { name: 'Armorsmith', color: '#4682B4', icon: 'fas fa-shield-alt' },
            chef: { name: 'Chef', color: '#32CD32', icon: 'fas fa-utensils' },
            tailor: { name: 'Tailor', color: '#9370DB', icon: 'fas fa-tshirt' },
            architect: { name: 'Architect', color: '#8B4513', icon: 'fas fa-building' },
            droidengineer: { name: 'Droid Engineer', color: '#FF8C00', icon: 'fas fa-robot' },
            shipwright: { name: 'Shipwright', color: '#00CED1', icon: 'fas fa-space-shuttle' }
        };
        
        this.createUI();
        this.setupEventListeners();
        this.loadCraftingData();
    }
    
    createUI() {
        // Main crafting window
        this.window = document.createElement('div');
        this.window.id = 'crafting-window';
        this.window.className = 'game-window crafting-window hidden';
        
        this.window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-hammer"></i>
                    Crafting Interface
                </div>
                <div class="window-controls">
                    <button class="minimize-btn"><i class="fas fa-minus"></i></button>
                    <button class="close-btn" onclick="window.craftingInterface?.hide()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            
            <div class="window-content">
                <div class="crafting-main">
                    <div class="profession-panel">
                        <h3><i class="fas fa-graduation-cap"></i> Professions</h3>
                        <div class="profession-list" id="profession-list">
                            <!-- Generated dynamically -->
                        </div>
                        
                        <div class="skill-info" id="skill-info">
                            <h4>Current Skills</h4>
                            <div class="skill-progress">
                                <div class="skill-item">
                                    <span>Assembly: <strong>75/100</strong></span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 75%"></div>
                                    </div>
                                </div>
                                <div class="skill-item">
                                    <span>Experimentation: <strong>60/100</strong></span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 60%"></div>
                                    </div>
                                </div>
                                <div class="skill-item">
                                    <span>Customization: <strong>45/100</strong></span>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 45%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="schematic-browser">
                        <h3><i class="fas fa-book"></i> Schematics</h3>
                        <div class="schematic-filters">
                            <input type="text" id="schematic-search" placeholder="Search schematics...">
                            <select id="difficulty-filter">
                                <option value="all">All Difficulties</option>
                                <option value="novice">Novice</option>
                                <option value="apprentice">Apprentice</option>
                                <option value="journeyman">Journeyman</option>
                                <option value="expert">Expert</option>
                                <option value="master">Master</option>
                            </select>
                        </div>
                        <div class="schematic-list" id="schematic-list">
                            <!-- Generated dynamically -->
                        </div>
                    </div>
                    
                    <div class="crafting-session" id="crafting-session">
                        <div class="no-schematic-selected">
                            <i class="fas fa-hammer"></i>
                            <h3>No Schematic Selected</h3>
                            <p>Select a schematic from the list to begin crafting</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .crafting-window {
                position: fixed;
                top: 50px;
                left: 50px;
                width: 95vw;
                height: 90vh;
                max-width: 1400px;
                max-height: 900px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 212, 255, 0.3);
                z-index: 1002;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
            }
            
            .crafting-window.hidden {
                display: none;
            }
            
            .crafting-main {
                flex: 1;
                display: grid;
                grid-template-columns: 250px 350px 1fr;
                gap: 0;
                padding: 20px;
            }
            
            .profession-panel,
            .schematic-browser,
            .crafting-session {
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin-right: 15px;
                height: calc(90vh - 160px);
                overflow-y: auto;
            }
            
            .crafting-session {
                margin-right: 0;
            }
            
            .profession-panel h3,
            .schematic-browser h3 {
                margin: 0 0 15px 0;
                color: #00d4ff;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
                padding-bottom: 10px;
            }
            
            .profession-list {
                display: flex;
                flex-direction: column;
                gap: 5px;
                margin-bottom: 20px;
            }
            
            .profession-item {
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 12px;
            }
            
            .profession-item:hover {
                background: rgba(0, 212, 255, 0.1);
                border-color: #00d4ff;
            }
            
            .profession-item.active {
                background: rgba(0, 255, 136, 0.2);
                border-color: #00ff88;
            }
            
            .profession-icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }
            
            .skill-info {
                background: rgba(0, 212, 255, 0.05);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
            }
            
            .skill-info h4 {
                margin: 0 0 10px 0;
                color: #00d4ff;
                font-size: 14px;
            }
            
            .skill-item {
                margin-bottom: 8px;
                font-size: 11px;
            }
            
            .progress-bar {
                width: 100%;
                height: 4px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 2px;
                margin-top: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff, #00ff88);
                border-radius: 2px;
                transition: width 0.3s;
            }
            
            .schematic-filters {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 15px;
            }
            
            .schematic-filters input,
            .schematic-filters select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 212, 255, 0.5);
                color: white;
                padding: 8px 10px;
                border-radius: 5px;
                font-size: 11px;
            }
            
            .schematic-filters input:focus,
            .schematic-filters select:focus {
                outline: none;
                border-color: #00d4ff;
            }
            
            .schematic-list {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            
            .schematic-item {
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 11px;
            }
            
            .schematic-item:hover {
                background: rgba(0, 212, 255, 0.1);
                border-color: #00d4ff;
            }
            
            .schematic-item.selected {
                background: rgba(0, 255, 136, 0.2);
                border-color: #00ff88;
            }
            
            .schematic-name {
                font-weight: bold;
                color: #00d4ff;
                margin-bottom: 3px;
            }
            
            .schematic-info {
                color: #ccc;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .complexity-badge {
                background: rgba(255, 215, 0, 0.2);
                color: #ffda79;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 9px;
            }
            
            .no-schematic-selected {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
                text-align: center;
            }
            
            .no-schematic-selected i {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .crafting-session-active {
                display: block;
            }
            
            .crafting-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .crafting-title h3 {
                margin: 0;
                color: #00d4ff;
                font-size: 16px;
            }
            
            .crafting-title p {
                margin: 5px 0 0 0;
                color: #ccc;
                font-size: 12px;
            }
            
            .crafting-controls {
                display: flex;
                gap: 8px;
            }
            
            .craft-btn {
                padding: 8px 15px;
                border: 1px solid;
                background: rgba(0, 0, 0, 0.3);
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .craft-btn:hover {
                transform: translateY(-1px);
            }
            
            .craft-btn.primary {
                border-color: #00ff88;
                background: rgba(0, 255, 136, 0.1);
            }
            
            .craft-btn.primary:hover {
                background: rgba(0, 255, 136, 0.2);
            }
            
            .craft-btn.secondary {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.1);
            }
            
            .craft-btn.secondary:hover {
                background: rgba(0, 212, 255, 0.2);
            }
            
            .craft-btn.danger {
                border-color: #ff4757;
                background: rgba(255, 71, 87, 0.1);
            }
            
            .craft-btn.danger:hover {
                background: rgba(255, 71, 87, 0.2);
            }
            
            .ingredient-slots {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .ingredient-group {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 8px;
                padding: 15px;
            }
            
            .ingredient-group h4 {
                margin: 0 0 10px 0;
                color: #00d4ff;
                font-size: 12px;
            }
            
            .ingredient-slot {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px dashed rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                margin-bottom: 8px;
                min-height: 40px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .ingredient-slot:hover {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.05);
            }
            
            .ingredient-slot.filled {
                border-style: solid;
                border-color: #00ff88;
                background: rgba(0, 255, 136, 0.1);
            }
            
            .ingredient-icon {
                width: 32px;
                height: 32px;
                background: #666;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .ingredient-info {
                flex: 1;
                font-size: 11px;
            }
            
            .ingredient-name {
                font-weight: bold;
                color: white;
            }
            
            .ingredient-quality {
                color: #ccc;
            }
            
            .ingredient-quantity {
                color: #00d4ff;
                font-size: 10px;
                margin-left: auto;
            }
            
            .crafting-progress {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .progress-header h4 {
                margin: 0;
                color: #00d4ff;
                font-size: 12px;
            }
            
            .progress-stage {
                color: #ccc;
                font-size: 10px;
            }
            
            .progress-bar-large {
                width: 100%;
                height: 8px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill-large {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff, #00ff88);
                border-radius: 4px;
                transition: width 0.5s ease;
                width: 0%;
            }
            
            .progress-stats {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
                font-size: 10px;
            }
            
            .stat-item {
                text-align: center;
                padding: 5px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }
            
            .stat-label {
                color: #ccc;
                display: block;
            }
            
            .stat-value {
                color: white;
                font-weight: bold;
                font-size: 12px;
            }
            
            .experimentation-panel {
                background: rgba(255, 215, 0, 0.05);
                border: 1px solid rgba(255, 215, 0, 0.3);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .experimentation-panel h4 {
                margin: 0 0 10px 0;
                color: #ffda79;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .experiment-points {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                font-size: 11px;
            }
            
            .experiment-attributes {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 10px;
            }
            
            .attribute-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 8px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                font-size: 10px;
            }
            
            .attribute-slider {
                width: 100%;
                margin: 0 10px;
                accent-color: #ffda79;
            }
            
            .experiment-btn {
                grid-column: 1 / -1;
                padding: 8px 15px;
                background: rgba(255, 215, 0, 0.2);
                border: 1px solid #ffda79;
                color: #ffda79;
                border-radius: 6px;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.3s;
            }
            
            .experiment-btn:hover {
                background: rgba(255, 215, 0, 0.3);
            }
            
            .experiment-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .customization-panel {
                background: rgba(138, 43, 226, 0.05);
                border: 1px solid rgba(138, 43, 226, 0.3);
                border-radius: 8px;
                padding: 15px;
            }
            
            .customization-panel h4 {
                margin: 0 0 10px 0;
                color: #9370db;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .customization-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .custom-option {
                display: flex;
                flex-direction: column;
                gap: 5px;
                font-size: 10px;
            }
            
            .custom-option label {
                color: #ccc;
            }
            
            .custom-option select,
            .custom-option input[type="color"] {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(138, 43, 226, 0.5);
                color: white;
                padding: 4px 6px;
                border-radius: 3px;
                font-size: 10px;
            }
            
            .finish-btn {
                width: 100%;
                padding: 12px;
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
                color: #00ff88;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .finish-btn:hover {
                background: rgba(0, 255, 136, 0.3);
                transform: translateY(-2px);
            }
            
            .finish-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.window);
        
        this.generateProfessionList();
    }
    
    generateProfessionList() {
        const professionList = document.getElementById('profession-list');
        
        Object.entries(this.professions).forEach(([key, profession]) => {
            const item = document.createElement('div');
            item.className = 'profession-item';
            item.dataset.profession = key;
            
            if (key === this.selectedProfession) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="profession-icon" style="color: ${profession.color}">
                    <i class="${profession.icon}"></i>
                </div>
                <span>${profession.name}</span>
            `;
            
            item.addEventListener('click', () => this.selectProfession(key));
            professionList.appendChild(item);
        });
    }
    
    selectProfession(professionKey) {
        this.selectedProfession = professionKey;
        
        // Update active profession
        document.querySelectorAll('.profession-item').forEach(item => {
            item.classList.toggle('active', item.dataset.profession === professionKey);
        });
        
        // Load schematics for this profession
        this.loadSchematics();
        
        console.log(`🔨 Selected profession: ${this.professions[professionKey].name}`);
    }
    
    loadSchematics() {
        const schematicList = document.getElementById('schematic-list');
        const schematics = this.getSchematicsForProfession(this.selectedProfession);
        
        schematicList.innerHTML = '';
        
        schematics.forEach(schematic => {
            const item = document.createElement('div');
            item.className = 'schematic-item';
            item.dataset.schematicId = schematic.id;
            
            item.innerHTML = `
                <div class="schematic-name">${schematic.name}</div>
                <div class="schematic-info">
                    <span>${schematic.category}</span>
                    <span class="complexity-badge">Level ${schematic.level}</span>
                </div>
            `;
            
            item.addEventListener('click', () => this.selectSchematic(schematic));
            schematicList.appendChild(item);
        });
    }
    
    selectSchematic(schematic) {
        this.currentSchematic = schematic;
        
        // Update selected schematic
        document.querySelectorAll('.schematic-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.schematicId === schematic.id);
        });
        
        // Show crafting session
        this.showCraftingSession();
        
        console.log(`📋 Selected schematic: ${schematic.name}`);
    }
    
    showCraftingSession() {
        const sessionPanel = document.getElementById('crafting-session');
        
        sessionPanel.innerHTML = `
            <div class="crafting-session-active">
                <div class="crafting-header">
                    <div class="crafting-title">
                        <h3>${this.currentSchematic.name}</h3>
                        <p>${this.currentSchematic.description}</p>
                    </div>
                    <div class="crafting-controls">
                        <button class="craft-btn secondary" onclick="window.craftingInterface?.startAssembly()">
                            <i class="fas fa-play"></i> Start
                        </button>
                        <button class="craft-btn danger" onclick="window.craftingInterface?.resetSession()">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </div>
                
                <div class="ingredient-slots">
                    <div class="ingredient-group">
                        <h4><i class="fas fa-box"></i> Required Materials</h4>
                        <div id="required-ingredients">
                            ${this.generateIngredientSlots(this.currentSchematic.ingredients.required)}
                        </div>
                    </div>
                    <div class="ingredient-group">
                        <h4><i class="fas fa-plus-circle"></i> Optional Components</h4>
                        <div id="optional-ingredients">
                            ${this.generateIngredientSlots(this.currentSchematic.ingredients.optional)}
                        </div>
                    </div>
                </div>
                
                <div class="crafting-progress" id="crafting-progress" style="display: none;">
                    <div class="progress-header">
                        <h4><i class="fas fa-cogs"></i> Crafting Progress</h4>
                        <span class="progress-stage" id="progress-stage">Assembly Phase</span>
                    </div>
                    <div class="progress-bar-large">
                        <div class="progress-fill-large" id="progress-fill"></div>
                    </div>
                    <div class="progress-stats">
                        <div class="stat-item">
                            <span class="stat-label">Complexity</span>
                            <span class="stat-value">${this.currentSchematic.complexity}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Success Rate</span>
                            <span class="stat-value" id="success-rate">85%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Time Left</span>
                            <span class="stat-value" id="time-left">--:--</span>
                        </div>
                    </div>
                </div>
                
                <div class="experimentation-panel" id="experimentation-panel" style="display: none;">
                    <h4><i class="fas fa-flask"></i> Experimentation</h4>
                    <div class="experiment-points">
                        <span>Experiment Points: <strong id="current-exp-points">${this.experimentPoints}</strong>/${this.maxExperimentPoints}</span>
                        <span>Risk Level: <strong id="risk-level">Low</strong></span>
                    </div>
                    <div class="experiment-attributes" id="experiment-attributes">
                        ${this.generateExperimentationSliders()}
                        <button class="experiment-btn" onclick="window.craftingInterface?.runExperiment()">
                            <i class="fas fa-vial"></i> Run Experiment
                        </button>
                    </div>
                </div>
                
                <div class="customization-panel" id="customization-panel" style="display: none;">
                    <h4><i class="fas fa-paint-brush"></i> Customization</h4>
                    <div class="customization-options">
                        <div class="custom-option">
                            <label>Item Name:</label>
                            <input type="text" id="item-name" value="${this.currentSchematic.name}" maxlength="50">
                        </div>
                        <div class="custom-option">
                            <label>Primary Color:</label>
                            <input type="color" id="primary-color" value="#3498db">
                        </div>
                        <div class="custom-option">
                            <label>Secondary Color:</label>
                            <input type="color" id="secondary-color" value="#2ecc71">
                        </div>
                        <div class="custom-option">
                            <label>Material:</label>
                            <select id="material-select">
                                <option value="standard">Standard</option>
                                <option value="polished">Polished</option>
                                <option value="matte">Matte</option>
                                <option value="textured">Textured</option>
                            </select>
                        </div>
                    </div>
                    <button class="finish-btn" onclick="window.craftingInterface?.finishCrafting()">
                        <i class="fas fa-check"></i> Complete Item
                    </button>
                </div>
            </div>
        `;
    }
    
    generateIngredientSlots(ingredients) {
        return ingredients.map((ingredient, index) => `
            <div class="ingredient-slot" data-ingredient="${ingredient.type}" onclick="window.craftingInterface?.selectIngredient('${ingredient.type}')">
                <div class="ingredient-icon">
                    <i class="${ingredient.icon || 'fas fa-cube'}"></i>
                </div>
                <div class="ingredient-info">
                    <div class="ingredient-name">${ingredient.name}</div>
                    <div class="ingredient-quality">Required: ${ingredient.quantity} units</div>
                </div>
                <div class="ingredient-quantity">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
        `).join('');
    }
    
    generateExperimentationSliders() {
        const attributes = this.currentSchematic.experimentAttributes || [
            { name: 'Damage', current: 45, max: 100 },
            { name: 'Durability', current: 75, max: 100 },
            { name: 'Quality', current: 60, max: 100 }
        ];
        
        return attributes.map(attr => `
            <div class="attribute-item">
                <span style="min-width: 60px;">${attr.name}:</span>
                <input type="range" class="attribute-slider" 
                       min="0" max="${attr.max}" value="${attr.current}"
                       data-attribute="${attr.name.toLowerCase()}">
                <span style="min-width: 40px; text-align: right;">${attr.current}/${attr.max}</span>
            </div>
        `).join('');
    }
    
    setupEventListeners() {
        // Window dragging
        const header = this.window.querySelector('.window-header');
        this.setupWindowDragging(header);
        
        // Schematic filters
        document.getElementById('schematic-search')?.addEventListener('input', () => this.filterSchematics());
        document.getElementById('difficulty-filter')?.addEventListener('change', () => this.filterSchematics());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'C' || e.key === 'c') {
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
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
    
    loadCraftingData() {
        // Initialize with artisan schematics
        this.loadSchematics();
    }
    
    getSchematicsForProfession(profession) {
        const schematicsData = {
            artisan: [
                {
                    id: 'basic_tool',
                    name: 'Basic Crafting Tool',
                    description: 'A simple tool for basic crafting tasks',
                    category: 'Tools',
                    level: 1,
                    complexity: 15,
                    ingredients: {
                        required: [
                            { type: 'metal', name: 'Metal', quantity: 50, icon: 'fas fa-cube' },
                            { type: 'component', name: 'Generic Component', quantity: 2, icon: 'fas fa-cog' }
                        ],
                        optional: [
                            { type: 'enhancement', name: 'Quality Enhancement', quantity: 1, icon: 'fas fa-gem' }
                        ]
                    },
                    experimentAttributes: [
                        { name: 'Durability', current: 65, max: 100 },
                        { name: 'Efficiency', current: 55, max: 100 }
                    ]
                },
                {
                    id: 'survey_tool',
                    name: 'Resource Survey Tool',
                    description: 'Advanced tool for surveying planetary resources',
                    category: 'Survey',
                    level: 3,
                    complexity: 25,
                    ingredients: {
                        required: [
                            { type: 'metal', name: 'High-Grade Metal', quantity: 75, icon: 'fas fa-cube' },
                            { type: 'electronics', name: 'Electronic Component', quantity: 5, icon: 'fas fa-microchip' },
                            { type: 'crystal', name: 'Power Crystal', quantity: 1, icon: 'fas fa-gem' }
                        ],
                        optional: [
                            { type: 'enhancement', name: 'Range Amplifier', quantity: 1, icon: 'fas fa-satellite-dish' }
                        ]
                    },
                    experimentAttributes: [
                        { name: 'Range', current: 45, max: 100 },
                        { name: 'Accuracy', current: 70, max: 100 },
                        { name: 'Battery Life', current: 60, max: 100 }
                    ]
                }
            ],
            weaponsmith: [
                {
                    id: 'vibrosword',
                    name: 'Vibrosword',
                    description: 'A deadly melee weapon with vibrating blade',
                    category: 'Melee Weapons',
                    level: 4,
                    complexity: 35,
                    ingredients: {
                        required: [
                            { type: 'metal', name: 'Weapon-Grade Steel', quantity: 100, icon: 'fas fa-cube' },
                            { type: 'component', name: 'Vibration Unit', quantity: 1, icon: 'fas fa-cog' },
                            { type: 'crystal', name: 'Power Cell', quantity: 2, icon: 'fas fa-battery-full' }
                        ],
                        optional: [
                            { type: 'enhancement', name: 'Blade Coating', quantity: 1, icon: 'fas fa-tint' }
                        ]
                    },
                    experimentAttributes: [
                        { name: 'Damage', current: 75, max: 100 },
                        { name: 'Speed', current: 60, max: 100 },
                        { name: 'Durability', current: 80, max: 100 }
                    ]
                }
            ],
            chef: [
                {
                    id: 'travel_rations',
                    name: 'Travel Rations',
                    description: 'Nutritious food for long journeys',
                    category: 'Consumables',
                    level: 1,
                    complexity: 10,
                    ingredients: {
                        required: [
                            { type: 'meat', name: 'Processed Meat', quantity: 25, icon: 'fas fa-drumstick-bite' },
                            { type: 'vegetable', name: 'Preserved Vegetables', quantity: 30, icon: 'fas fa-carrot' },
                            { type: 'spice', name: 'Preservation Spice', quantity: 10, icon: 'fas fa-seedling' }
                        ],
                        optional: [
                            { type: 'additive', name: 'Flavor Enhancer', quantity: 5, icon: 'fas fa-plus' }
                        ]
                    },
                    experimentAttributes: [
                        { name: 'Nutrition', current: 70, max: 100 },
                        { name: 'Shelf Life', current: 50, max: 100 },
                        { name: 'Taste', current: 45, max: 100 }
                    ]
                }
            ]
        };
        
        return schematicsData[profession] || [];
    }
    
    filterSchematics() {
        const searchTerm = document.getElementById('schematic-search')?.value.toLowerCase() || '';
        const difficulty = document.getElementById('difficulty-filter')?.value || 'all';
        
        const schematicItems = document.querySelectorAll('.schematic-item');
        
        schematicItems.forEach(item => {
            const name = item.querySelector('.schematic-name').textContent.toLowerCase();
            const level = parseInt(item.querySelector('.complexity-badge').textContent.match(/\d+/)[0]);
            
            const matchesSearch = name.includes(searchTerm);
            const matchesDifficulty = difficulty === 'all' || this.levelToDifficulty(level) === difficulty;
            
            item.style.display = matchesSearch && matchesDifficulty ? 'block' : 'none';
        });
    }
    
    levelToDifficulty(level) {
        if (level <= 1) return 'novice';
        if (level <= 2) return 'apprentice';
        if (level <= 3) return 'journeyman';
        if (level <= 4) return 'expert';
        return 'master';
    }
    
    selectIngredient(ingredientType) {
        console.log(`🧪 Selecting ingredient: ${ingredientType}`);
        // In a real game, this would open inventory to select ingredient
        alert(`Please select ${ingredientType} from your inventory`);
    }
    
    startAssembly() {
        console.log('⚒️ Starting assembly phase...');
        
        // Show progress panel
        const progressPanel = document.getElementById('crafting-progress');
        progressPanel.style.display = 'block';
        
        // Simulate assembly process
        this.runCraftingPhase('assembly', 5000, () => {
            // Move to experimentation phase
            this.showExperimentationPhase();
        });
    }
    
    runCraftingPhase(phase, duration, onComplete) {
        const progressFill = document.getElementById('progress-fill');
        const timeLeft = document.getElementById('time-left');
        const progressStage = document.getElementById('progress-stage');
        
        progressStage.textContent = `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`;
        
        let startTime = Date.now();
        let progress = 0;
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            progressFill.style.width = (progress * 100) + '%';
            
            const remaining = Math.max(duration - elapsed, 0);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timeLeft.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (progress < 1) {
                requestAnimationFrame(updateProgress);
            } else {
                onComplete();
            }
        };
        
        updateProgress();
    }
    
    showExperimentationPhase() {
        console.log('🧪 Entering experimentation phase');
        
        const experimentPanel = document.getElementById('experimentation-panel');
        experimentPanel.style.display = 'block';
        
        // Update experiment points
        this.experimentPoints = this.maxExperimentPoints;
        document.getElementById('current-exp-points').textContent = this.experimentPoints;
        
        // Setup slider listeners
        document.querySelectorAll('.attribute-slider').forEach(slider => {
            slider.addEventListener('input', () => this.updateExperimentRisk());
        });
    }
    
    updateExperimentRisk() {
        const sliders = document.querySelectorAll('.attribute-slider');
        let totalRisk = 0;
        
        sliders.forEach(slider => {
            const value = parseInt(slider.value);
            const max = parseInt(slider.max);
            const risk = Math.max(0, value - max * 0.7) / (max * 0.3);
            totalRisk += risk;
        });
        
        const riskLevel = document.getElementById('risk-level');
        if (totalRisk < 0.5) {
            riskLevel.textContent = 'Low';
            riskLevel.style.color = '#00ff88';
        } else if (totalRisk < 1.5) {
            riskLevel.textContent = 'Medium';
            riskLevel.style.color = '#ffda79';
        } else {
            riskLevel.textContent = 'High';
            riskLevel.style.color = '#ff4757';
        }
    }
    
    runExperiment() {
        if (this.experimentPoints <= 0) return;
        
        this.experimentPoints--;
        document.getElementById('current-exp-points').textContent = this.experimentPoints;
        
        console.log('⚗️ Running experiment...');
        
        // Simulate experiment results
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            
            if (success) {
                console.log('✅ Experiment succeeded!');
                // Could update attribute values here
            } else {
                console.log('❌ Experiment failed');
            }
            
            if (this.experimentPoints <= 0) {
                this.showCustomizationPhase();
            }
        }, 1000);
    }
    
    showCustomizationPhase() {
        console.log('🎨 Entering customization phase');
        
        const customPanel = document.getElementById('customization-panel');
        customPanel.style.display = 'block';
    }
    
    finishCrafting() {
        const itemName = document.getElementById('item-name').value;
        console.log(`✅ Completed crafting: ${itemName}`);
        
        // In a real game, this would create the item and add to inventory
        alert(`Successfully crafted: ${itemName}!`);
        
        this.resetSession();
    }
    
    resetSession() {
        this.currentSchematic = null;
        this.craftingSession = null;
        this.experimentPoints = 0;
        
        // Hide crafting session
        const sessionPanel = document.getElementById('crafting-session');
        sessionPanel.innerHTML = `
            <div class="no-schematic-selected">
                <i class="fas fa-hammer"></i>
                <h3>No Schematic Selected</h3>
                <p>Select a schematic from the list to begin crafting</p>
            </div>
        `;
        
        // Clear schematic selection
        document.querySelectorAll('.schematic-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        console.log('🔄 Crafting session reset');
    }
    
    show() {
        this.window.classList.remove('hidden');
        this.isVisible = true;
        window.craftingInterface = this; // Global access
        
        console.log('⚒️ Crafting interface opened');
    }
    
    hide() {
        this.window.classList.add('hidden');
        this.isVisible = false;
        console.log('⚒️ Crafting interface closed');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
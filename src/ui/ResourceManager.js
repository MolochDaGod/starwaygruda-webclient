export class ResourceManager {
    constructor() {
        this.isVisible = false;
        this.currentTab = 'survey';
        this.surveyData = [];
        this.harvesters = [];
        this.resourceDatabase = [];
        this.selectedResource = null;
        this.surveyRange = 128; // meters
        this.currentPlanet = 'tatooine';
        
        this.createUI();
        this.setupEventListeners();
        this.loadResourceData();
    }
    
    createUI() {
        // Main resource manager window
        this.window = document.createElement('div');
        this.window.id = 'resource-manager-window';
        this.window.className = 'game-window resource-manager-window hidden';
        
        this.window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-mountain"></i>
                    Resource Manager
                </div>
                <div class="window-controls">
                    <button class="minimize-btn"><i class="fas fa-minus"></i></button>
                    <button class="close-btn" onclick="window.resourceManager?.hide()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            
            <div class="window-content">
                <div class="resource-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="survey">
                            <i class="fas fa-search"></i> Survey
                        </button>
                        <button class="tab-btn" data-tab="harvesters">
                            <i class="fas fa-industry"></i> Harvesters
                        </button>
                        <button class="tab-btn" data-tab="database">
                            <i class="fas fa-database"></i> Database
                        </button>
                        <button class="tab-btn" data-tab="quality">
                            <i class="fas fa-star"></i> Quality Browser
                        </button>
                    </div>
                    
                    <div class="tab-content">
                        <!-- Survey Tab -->
                        <div class="tab-panel active" id="survey-tab">
                            <div class="survey-controls">
                                <div class="survey-settings">
                                    <div class="setting-group">
                                        <label>Survey Range:</label>
                                        <div class="range-controls">
                                            <input type="range" id="survey-range" min="64" max="512" value="${this.surveyRange}" step="32">
                                            <span id="range-value">${this.surveyRange}m</span>
                                        </div>
                                    </div>
                                    
                                    <div class="setting-group">
                                        <label>Resource Type:</label>
                                        <select id="resource-filter">
                                            <option value="all">All Resources</option>
                                            <option value="mineral">Minerals</option>
                                            <option value="chemical">Chemicals</option>
                                            <option value="gas">Gases</option>
                                            <option value="energy">Energy</option>
                                            <option value="flora">Flora Resources</option>
                                            <option value="creature">Creature Resources</option>
                                        </select>
                                    </div>
                                    
                                    <div class="survey-actions">
                                        <button class="survey-btn" onclick="window.resourceManager?.startSurvey()">
                                            <i class="fas fa-radar-alt"></i> Start Survey
                                        </button>
                                        <button class="waypoint-btn" onclick="window.resourceManager?.setWaypoint()">
                                            <i class="fas fa-map-pin"></i> Set Waypoint
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="survey-results" id="survey-results">
                                <div class="survey-header">
                                    <h3><i class="fas fa-list"></i> Survey Results - ${this.currentPlanet.charAt(0).toUpperCase() + this.currentPlanet.slice(1)}</h3>
                                    <div class="result-count" id="result-count">No resources detected</div>
                                </div>
                                
                                <div class="resource-list" id="resource-list">
                                    <div class="no-survey-data">
                                        <i class="fas fa-search-location"></i>
                                        <p>Start a survey to detect nearby resources</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Harvesters Tab -->
                        <div class="tab-panel" id="harvesters-tab">
                            <div class="harvester-overview">
                                <div class="harvester-stats">
                                    <div class="stat-card">
                                        <div class="stat-icon active">
                                            <i class="fas fa-play"></i>
                                        </div>
                                        <div class="stat-info">
                                            <div class="stat-value" id="active-harvesters">3</div>
                                            <div class="stat-label">Active</div>
                                        </div>
                                    </div>
                                    
                                    <div class="stat-card">
                                        <div class="stat-icon idle">
                                            <i class="fas fa-pause"></i>
                                        </div>
                                        <div class="stat-info">
                                            <div class="stat-value" id="idle-harvesters">2</div>
                                            <div class="stat-label">Idle</div>
                                        </div>
                                    </div>
                                    
                                    <div class="stat-card">
                                        <div class="stat-icon maintenance">
                                            <i class="fas fa-wrench"></i>
                                        </div>
                                        <div class="stat-info">
                                            <div class="stat-value" id="maintenance-harvesters">1</div>
                                            <div class="stat-label">Maintenance</div>
                                        </div>
                                    </div>
                                    
                                    <div class="stat-card">
                                        <div class="stat-icon total">
                                            <i class="fas fa-industry"></i>
                                        </div>
                                        <div class="stat-info">
                                            <div class="stat-value" id="total-harvesters">6</div>
                                            <div class="stat-label">Total</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="harvester-actions">
                                    <button class="action-btn" onclick="window.resourceManager?.deployHarvester()">
                                        <i class="fas fa-plus"></i> Deploy New
                                    </button>
                                    <button class="action-btn" onclick="window.resourceManager?.recallAll()">
                                        <i class="fas fa-undo"></i> Recall All
                                    </button>
                                    <button class="action-btn" onclick="window.resourceManager?.maintenanceAll()">
                                        <i class="fas fa-tools"></i> Maintenance
                                    </button>
                                </div>
                            </div>
                            
                            <div class="harvester-list" id="harvester-list">
                                <div class="harvester-header">
                                    <h3><i class="fas fa-list"></i> Active Harvesters</h3>
                                </div>
                                ${this.generateHarvesterListHTML()}
                            </div>
                        </div>
                        
                        <!-- Database Tab -->
                        <div class="tab-panel" id="database-tab">
                            <div class="database-filters">
                                <div class="filter-row">
                                    <div class="filter-group">
                                        <label>Planet:</label>
                                        <select id="planet-filter">
                                            <option value="all">All Planets</option>
                                            <option value="tatooine">Tatooine</option>
                                            <option value="naboo">Naboo</option>
                                            <option value="corellia">Corellia</option>
                                            <option value="dathomir">Dathomir</option>
                                            <option value="rori">Rori</option>
                                            <option value="yavin4">Yavin 4</option>
                                        </select>
                                    </div>
                                    
                                    <div class="filter-group">
                                        <label>Type:</label>
                                        <select id="type-filter">
                                            <option value="all">All Types</option>
                                            <option value="mineral">Mineral</option>
                                            <option value="chemical">Chemical</option>
                                            <option value="gas">Gas</option>
                                            <option value="energy">Energy</option>
                                            <option value="flora">Flora</option>
                                            <option value="creature">Creature</option>
                                        </select>
                                    </div>
                                    
                                    <div class="filter-group">
                                        <label>Status:</label>
                                        <select id="status-filter">
                                            <option value="all">All Status</option>
                                            <option value="spawned">Currently Spawned</option>
                                            <option value="depleted">Recently Depleted</option>
                                            <option value="historical">Historical</option>
                                        </select>
                                    </div>
                                    
                                    <div class="filter-actions">
                                        <button class="filter-btn" onclick="window.resourceManager?.applyFilters()">
                                            <i class="fas fa-filter"></i> Apply
                                        </button>
                                        <button class="clear-btn" onclick="window.resourceManager?.clearFilters()">
                                            <i class="fas fa-times"></i> Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="database-results" id="database-results">
                                <div class="database-header">
                                    <h3><i class="fas fa-database"></i> Resource Database</h3>
                                    <div class="result-info">
                                        Showing <span id="db-result-count">156</span> of <span id="db-total-count">1,247</span> resources
                                    </div>
                                </div>
                                
                                <div class="database-table-container">
                                    <table class="resource-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Planet</th>
                                                <th>Quality</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="database-table-body">
                                            ${this.generateDatabaseTableHTML()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quality Browser Tab -->
                        <div class="tab-panel" id="quality-tab">
                            <div class="quality-browser">
                                <div class="quality-sidebar">
                                    <div class="resource-categories" id="resource-categories">
                                        <div class="category-group">
                                            <h3><i class="fas fa-gem"></i> Minerals</h3>
                                            <div class="category-items">
                                                <div class="resource-item" data-resource="ferrous_metal" onclick="window.resourceManager?.selectQualityResource('ferrous_metal')">
                                                    Ferrous Metal
                                                    <span class="quality-indicator excellent">998</span>
                                                </div>
                                                <div class="resource-item" data-resource="aluminum" onclick="window.resourceManager?.selectQualityResource('aluminum')">
                                                    Aluminum
                                                    <span class="quality-indicator good">875</span>
                                                </div>
                                                <div class="resource-item" data-resource="copper" onclick="window.resourceManager?.selectQualityResource('copper')">
                                                    Copper
                                                    <span class="quality-indicator average">654</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="category-group">
                                            <h3><i class="fas fa-flask"></i> Chemicals</h3>
                                            <div class="category-items">
                                                <div class="resource-item" data-resource="petrochem_fuel" onclick="window.resourceManager?.selectQualityResource('petrochem_fuel')">
                                                    Petrochem Fuel
                                                    <span class="quality-indicator excellent">923</span>
                                                </div>
                                                <div class="resource-item" data-resource="polymer" onclick="window.resourceManager?.selectQualityResource('polymer')">
                                                    Polymer
                                                    <span class="quality-indicator good">789</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="category-group">
                                            <h3><i class="fas fa-wind"></i> Gases</h3>
                                            <div class="category-items">
                                                <div class="resource-item" data-resource="reactive_gas" onclick="window.resourceManager?.selectQualityResource('reactive_gas')">
                                                    Reactive Gas
                                                    <span class="quality-indicator excellent">967</span>
                                                </div>
                                                <div class="resource-item" data-resource="inert_gas" onclick="window.resourceManager?.selectQualityResource('inert_gas')">
                                                    Inert Gas
                                                    <span class="quality-indicator average">598</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="quality-details" id="quality-details">
                                    <div class="no-resource-selected">
                                        <i class="fas fa-mouse-pointer"></i>
                                        <p>Select a resource to view quality details</p>
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
            .resource-manager-window {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 1200px;
                height: 800px;
                background: linear-gradient(135deg, #2d3436 0%, #636e72 50%, #74b9ff 100%);
                border: 2px solid #00cec9;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 206, 201, 0.3);
                z-index: 1002;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
            }
            
            .resource-manager-window.hidden {
                display: none;
            }
            
            .resource-tabs {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 20px;
            }
            
            .tab-buttons {
                display: flex;
                gap: 5px;
                margin-bottom: 20px;
                border-bottom: 2px solid rgba(0, 206, 201, 0.3);
                padding-bottom: 10px;
            }
            
            .tab-btn {
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
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
                background: rgba(0, 206, 201, 0.1);
            }
            
            .tab-btn.active {
                background: rgba(0, 206, 201, 0.2);
                border-bottom-color: transparent;
                border-color: #00cec9;
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
            
            .survey-controls {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .survey-settings {
                display: grid;
                grid-template-columns: 1fr 1fr auto;
                gap: 20px;
                align-items: end;
            }
            
            .setting-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .setting-group label {
                font-size: 12px;
                color: #00cec9;
                font-weight: bold;
            }
            
            .range-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            #survey-range {
                flex: 1;
                height: 4px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 2px;
                outline: none;
                -webkit-appearance: none;
            }
            
            #survey-range::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: #00cec9;
                border-radius: 50%;
                cursor: pointer;
            }
            
            #range-value {
                min-width: 50px;
                text-align: center;
                font-weight: bold;
                color: #00cec9;
            }
            
            select {
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 206, 201, 0.3);
                color: white;
                border-radius: 5px;
                font-size: 12px;
            }
            
            .survey-actions {
                display: flex;
                gap: 10px;
            }
            
            .survey-btn, .waypoint-btn {
                padding: 10px 20px;
                background: linear-gradient(45deg, #00cec9, #0984e3);
                border: none;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
            }
            
            .survey-btn:hover, .waypoint-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 206, 201, 0.3);
            }
            
            .waypoint-btn {
                background: linear-gradient(45deg, #fd79a8, #e84393);
            }
            
            .survey-results {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 20px;
                height: calc(100% - 200px);
                display: flex;
                flex-direction: column;
            }
            
            .survey-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 206, 201, 0.3);
            }
            
            .survey-header h3 {
                margin: 0;
                color: #00cec9;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .result-count {
                font-size: 12px;
                color: #ccc;
            }
            
            .resource-list {
                flex: 1;
                overflow-y: auto;
            }
            
            .no-survey-data {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: #666;
                height: 200px;
            }
            
            .no-survey-data i {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .resource-entry {
                display: flex;
                align-items: center;
                justify-content: between;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .resource-entry:hover {
                border-color: #00cec9;
                background: rgba(0, 206, 201, 0.1);
            }
            
            .resource-info {
                flex: 1;
            }
            
            .resource-name {
                font-weight: bold;
                color: white;
                margin-bottom: 3px;
            }
            
            .resource-details {
                font-size: 11px;
                color: #ccc;
                display: flex;
                gap: 15px;
            }
            
            .resource-quality {
                display: flex;
                align-items: center;
                gap: 5px;
                font-weight: bold;
                margin-left: 15px;
            }
            
            .quality-excellent { color: #00ff88; }
            .quality-good { color: #ffda79; }
            .quality-average { color: #fd79a8; }
            .quality-poor { color: #ff4757; }
            
            .resource-actions {
                display: flex;
                gap: 5px;
            }
            
            .resource-action-btn {
                padding: 5px 10px;
                background: rgba(0, 206, 201, 0.2);
                border: 1px solid #00cec9;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s;
            }
            
            .resource-action-btn:hover {
                background: rgba(0, 206, 201, 0.3);
            }
            
            .harvester-overview {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .harvester-stats {
                display: flex;
                gap: 15px;
            }
            
            .stat-card {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                min-width: 120px;
            }
            
            .stat-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .stat-icon.active {
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
            }
            
            .stat-icon.idle {
                background: rgba(255, 218, 121, 0.2);
                color: #ffda79;
            }
            
            .stat-icon.maintenance {
                background: rgba(255, 71, 87, 0.2);
                color: #ff4757;
            }
            
            .stat-icon.total {
                background: rgba(0, 206, 201, 0.2);
                color: #00cec9;
            }
            
            .stat-info {
                display: flex;
                flex-direction: column;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: white;
                line-height: 1;
            }
            
            .stat-label {
                font-size: 11px;
                color: #ccc;
            }
            
            .harvester-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .action-btn {
                padding: 8px 15px;
                background: rgba(0, 206, 201, 0.2);
                border: 1px solid #00cec9;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s;
                white-space: nowrap;
            }
            
            .action-btn:hover {
                background: rgba(0, 206, 201, 0.3);
            }
            
            .harvester-list {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 20px;
                height: calc(100% - 200px);
                overflow-y: auto;
            }
            
            .harvester-header {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 206, 201, 0.3);
            }
            
            .harvester-header h3 {
                margin: 0;
                color: #00cec9;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .harvester-item {
                display: grid;
                grid-template-columns: auto 1fr auto auto;
                gap: 15px;
                align-items: center;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                margin-bottom: 10px;
            }
            
            .harvester-status {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            
            .status-active { background: #00ff88; }
            .status-idle { background: #ffda79; }
            .status-maintenance { background: #ff4757; }
            
            .harvester-details {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            
            .harvester-name {
                font-weight: bold;
                color: white;
                font-size: 13px;
            }
            
            .harvester-info {
                font-size: 11px;
                color: #ccc;
            }
            
            .harvester-progress {
                display: flex;
                flex-direction: column;
                gap: 3px;
                min-width: 150px;
            }
            
            .progress-label {
                font-size: 10px;
                color: #ccc;
                display: flex;
                justify-content: space-between;
            }
            
            .progress-bar {
                height: 6px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00cec9, #0984e3);
                border-radius: 3px;
                transition: width 0.3s;
            }
            
            .harvester-controls {
                display: flex;
                gap: 5px;
            }
            
            .control-btn {
                padding: 5px 8px;
                background: rgba(0, 206, 201, 0.2);
                border: 1px solid #00cec9;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s;
            }
            
            .control-btn:hover {
                background: rgba(0, 206, 201, 0.3);
            }
            
            .database-filters {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .filter-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr auto;
                gap: 15px;
                align-items: end;
            }
            
            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .filter-group label {
                font-size: 11px;
                color: #00cec9;
                font-weight: bold;
            }
            
            .filter-actions {
                display: flex;
                gap: 8px;
            }
            
            .filter-btn, .clear-btn {
                padding: 8px 15px;
                border: none;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s;
            }
            
            .filter-btn {
                background: linear-gradient(45deg, #00cec9, #0984e3);
            }
            
            .clear-btn {
                background: linear-gradient(45deg, #636e72, #2d3436);
            }
            
            .filter-btn:hover, .clear-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
            }
            
            .database-results {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 20px;
                height: calc(100% - 120px);
                display: flex;
                flex-direction: column;
            }
            
            .database-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 206, 201, 0.3);
            }
            
            .database-header h3 {
                margin: 0;
                color: #00cec9;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .result-info {
                font-size: 12px;
                color: #ccc;
            }
            
            .database-table-container {
                flex: 1;
                overflow: auto;
            }
            
            .resource-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            
            .resource-table th {
                background: rgba(0, 206, 201, 0.2);
                color: #00cec9;
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid rgba(0, 206, 201, 0.3);
                font-weight: bold;
                position: sticky;
                top: 0;
            }
            
            .resource-table td {
                padding: 8px 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .resource-table tr:hover {
                background: rgba(0, 206, 201, 0.1);
            }
            
            .status-spawned { 
                color: #00ff88;
                font-weight: bold;
            }
            
            .status-depleted { 
                color: #ffda79;
            }
            
            .status-historical { 
                color: #636e72;
            }
            
            .table-action-btn {
                padding: 3px 8px;
                background: rgba(0, 206, 201, 0.2);
                border: 1px solid #00cec9;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
                margin: 0 2px;
                transition: all 0.2s;
            }
            
            .table-action-btn:hover {
                background: rgba(0, 206, 201, 0.3);
            }
            
            .quality-browser {
                display: grid;
                grid-template-columns: 300px 1fr;
                gap: 20px;
                height: 100%;
            }
            
            .quality-sidebar {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 15px;
                overflow-y: auto;
            }
            
            .category-group {
                margin-bottom: 20px;
            }
            
            .category-group h3 {
                margin: 0 0 10px 0;
                color: #00cec9;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .category-items {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .resource-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 11px;
            }
            
            .resource-item:hover {
                border-color: #00cec9;
                background: rgba(0, 206, 201, 0.1);
            }
            
            .resource-item.selected {
                border-color: #00cec9;
                background: rgba(0, 206, 201, 0.2);
            }
            
            .quality-indicator {
                font-weight: bold;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 10px;
                background: rgba(0, 0, 0, 0.5);
            }
            
            .quality-indicator.excellent {
                color: #00ff88;
                border: 1px solid #00ff88;
            }
            
            .quality-indicator.good {
                color: #ffda79;
                border: 1px solid #ffda79;
            }
            
            .quality-indicator.average {
                color: #fd79a8;
                border: 1px solid #fd79a8;
            }
            
            .quality-details {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 206, 201, 0.3);
                border-radius: 10px;
                padding: 20px;
            }
            
            .no-resource-selected {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: #666;
                height: 100%;
            }
            
            .no-resource-selected i {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.window);
        
        this.setupTabs();
        this.setupRangeSlider();
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
                
                this.currentTab = targetTab;
                console.log(`🔍 Switched to ${targetTab} tab`);
            });
        });
    }
    
    setupRangeSlider() {
        const rangeSlider = document.getElementById('survey-range');
        const rangeValue = document.getElementById('range-value');
        
        if (rangeSlider && rangeValue) {
            rangeSlider.addEventListener('input', (e) => {
                this.surveyRange = parseInt(e.target.value);
                rangeValue.textContent = `${this.surveyRange}m`;
            });
        }
    }
    
    setupEventListeners() {
        // Window dragging
        const header = this.window.querySelector('.window-header');
        this.setupWindowDragging(header);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'R' || e.key === 'r') {
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
    
    generateHarvesterListHTML() {
        const harvesters = [
            {
                id: 'hrv-001',
                name: 'Mining Rig Alpha',
                status: 'active',
                planet: 'Tatooine',
                resource: 'Ferrous Metal',
                efficiency: 87,
                maintenance: 15,
                hopperUsed: 8500,
                hopperCapacity: 10000
            },
            {
                id: 'hrv-002',
                name: 'Gas Extractor Beta',
                status: 'active',
                planet: 'Naboo',
                resource: 'Reactive Gas',
                efficiency: 92,
                maintenance: 8,
                hopperUsed: 3200,
                hopperCapacity: 5000
            },
            {
                id: 'hrv-003',
                name: 'Chemical Plant Gamma',
                status: 'idle',
                planet: 'Corellia',
                resource: 'None',
                efficiency: 0,
                maintenance: 45,
                hopperUsed: 0,
                hopperCapacity: 8000
            },
            {
                id: 'hrv-004',
                name: 'Ore Processor Delta',
                status: 'maintenance',
                planet: 'Dathomir',
                resource: 'Aluminum',
                efficiency: 0,
                maintenance: 78,
                hopperUsed: 1200,
                hopperCapacity: 6000
            }
        ];
        
        return harvesters.map(harvester => `
            <div class="harvester-item">
                <div class="harvester-status status-${harvester.status}"></div>
                
                <div class="harvester-details">
                    <div class="harvester-name">${harvester.name}</div>
                    <div class="harvester-info">
                        ${harvester.planet} • ${harvester.resource || 'No Resource'} • Efficiency: ${harvester.efficiency}%
                    </div>
                </div>
                
                <div class="harvester-progress">
                    <div class="progress-label">
                        <span>Hopper</span>
                        <span>${harvester.hopperUsed.toLocaleString()} / ${harvester.hopperCapacity.toLocaleString()}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(harvester.hopperUsed / harvester.hopperCapacity) * 100}%"></div>
                    </div>
                </div>
                
                <div class="harvester-controls">
                    <button class="control-btn" onclick="window.resourceManager?.manageHarvester('${harvester.id}')">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="control-btn" onclick="window.resourceManager?.recallHarvester('${harvester.id}')">
                        <i class="fas fa-home"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    generateDatabaseTableHTML() {
        const resources = [
            { name: 'Ferrous Metal', type: 'Mineral', planet: 'Tatooine', quality: 998, status: 'spawned' },
            { name: 'Reactive Gas', type: 'Gas', planet: 'Naboo', quality: 967, status: 'spawned' },
            { name: 'Petrochem Fuel', type: 'Chemical', planet: 'Corellia', quality: 923, status: 'spawned' },
            { name: 'Aluminum', type: 'Mineral', planet: 'Dathomir', quality: 875, status: 'depleted' },
            { name: 'Polymer', type: 'Chemical', planet: 'Rori', quality: 789, status: 'spawned' },
            { name: 'Copper', type: 'Mineral', planet: 'Yavin 4', quality: 654, status: 'historical' },
            { name: 'Inert Gas', type: 'Gas', planet: 'Tatooine', quality: 598, status: 'spawned' },
            { name: 'Energy Crystal', type: 'Energy', planet: 'Naboo', quality: 934, status: 'depleted' }
        ];
        
        return resources.map(resource => `
            <tr onclick="window.resourceManager?.selectDatabaseResource('${resource.name}')">
                <td>${resource.name}</td>
                <td>${resource.type}</td>
                <td>${resource.planet}</td>
                <td>
                    <span class="quality-${this.getQualityClass(resource.quality)}">
                        ${resource.quality}
                    </span>
                </td>
                <td>
                    <span class="status-${resource.status}">
                        ${resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="table-action-btn" onclick="window.resourceManager?.addToWaypoints('${resource.name}'); event.stopPropagation();">
                        <i class="fas fa-map-pin"></i>
                    </button>
                    <button class="table-action-btn" onclick="window.resourceManager?.trackResource('${resource.name}'); event.stopPropagation();">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    getQualityClass(quality) {
        if (quality >= 900) return 'excellent';
        if (quality >= 700) return 'good';
        if (quality >= 500) return 'average';
        return 'poor';
    }
    
    loadResourceData() {
        console.log('🔍 Loading resource data...');
        // In a real implementation, this would fetch from server
        this.updateResourceCounts();
    }
    
    updateResourceCounts() {
        // Update UI counters
        const resultCount = document.getElementById('result-count');
        const dbResultCount = document.getElementById('db-result-count');
        const dbTotalCount = document.getElementById('db-total-count');
        
        if (resultCount) resultCount.textContent = 'No resources detected';
        if (dbResultCount) dbResultCount.textContent = '156';
        if (dbTotalCount) dbTotalCount.textContent = '1,247';
    }
    
    startSurvey() {
        console.log(`🔍 Starting survey with ${this.surveyRange}m range...`);
        
        // Simulate survey results
        const mockResults = [
            {
                name: 'Ferrous Metal',
                type: 'Mineral',
                quality: 998,
                distance: 45,
                concentration: 'High',
                coordinates: { x: 1234, y: 5678 }
            },
            {
                name: 'Reactive Gas',
                type: 'Gas',
                quality: 967,
                distance: 78,
                concentration: 'Medium',
                coordinates: { x: 1456, y: 5234 }
            },
            {
                name: 'Aluminum',
                type: 'Mineral',
                quality: 875,
                distance: 112,
                concentration: 'Low',
                coordinates: { x: 1789, y: 5890 }
            }
        ];
        
        this.surveyData = mockResults;
        this.updateSurveyResults();
    }
    
    updateSurveyResults() {
        const resourceList = document.getElementById('resource-list');
        const resultCount = document.getElementById('result-count');
        
        if (this.surveyData.length === 0) {
            resourceList.innerHTML = `
                <div class="no-survey-data">
                    <i class="fas fa-search-location"></i>
                    <p>No resources detected in survey range</p>
                </div>
            `;
            resultCount.textContent = 'No resources detected';
            return;
        }
        
        resultCount.textContent = `${this.surveyData.length} resource${this.surveyData.length !== 1 ? 's' : ''} detected`;
        
        resourceList.innerHTML = this.surveyData.map(resource => `
            <div class="resource-entry" onclick="window.resourceManager?.selectSurveyResource('${resource.name}')">
                <div class="resource-info">
                    <div class="resource-name">${resource.name}</div>
                    <div class="resource-details">
                        <span><i class="fas fa-map-marker-alt"></i> ${resource.distance}m</span>
                        <span><i class="fas fa-layer-group"></i> ${resource.concentration}</span>
                        <span><i class="fas fa-map"></i> ${resource.coordinates.x}, ${resource.coordinates.y}</span>
                    </div>
                </div>
                
                <div class="resource-quality quality-${this.getQualityClass(resource.quality)}">
                    <i class="fas fa-star"></i>
                    ${resource.quality}
                </div>
                
                <div class="resource-actions">
                    <button class="resource-action-btn" onclick="window.resourceManager?.deployToResource('${resource.name}'); event.stopPropagation();">
                        Deploy
                    </button>
                    <button class="resource-action-btn" onclick="window.resourceManager?.waypointToResource('${resource.name}'); event.stopPropagation();">
                        Waypoint
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    setWaypoint() {
        console.log('📍 Setting waypoint to current location...');
        alert('Waypoint set to current location!');
    }
    
    selectSurveyResource(resourceName) {
        console.log(`🎯 Selected survey resource: ${resourceName}`);
        this.selectedResource = resourceName;
    }
    
    deployToResource(resourceName) {
        console.log(`🚀 Deploying harvester to ${resourceName}...`);
        alert(`Deploying harvester to ${resourceName}!`);
    }
    
    waypointToResource(resourceName) {
        console.log(`📍 Setting waypoint to ${resourceName}...`);
        alert(`Waypoint set to ${resourceName} location!`);
    }
    
    deployHarvester() {
        console.log('🚀 Deploying new harvester...');
        alert('Opening harvester deployment interface...');
    }
    
    recallAll() {
        console.log('🏠 Recalling all harvesters...');
        alert('Recalling all active harvesters...');
    }
    
    maintenanceAll() {
        console.log('🔧 Starting maintenance on all harvesters...');
        alert('Scheduling maintenance for all harvesters...');
    }
    
    manageHarvester(harvesterId) {
        console.log(`⚙️ Managing harvester: ${harvesterId}`);
        alert(`Opening management interface for ${harvesterId}...`);
    }
    
    recallHarvester(harvesterId) {
        console.log(`🏠 Recalling harvester: ${harvesterId}`);
        alert(`Recalling ${harvesterId}...`);
    }
    
    applyFilters() {
        console.log('🔍 Applying database filters...');
        // In real implementation, filter the database results
        alert('Filters applied to resource database!');
    }
    
    clearFilters() {
        console.log('🔄 Clearing database filters...');
        // Reset all filter dropdowns
        const filters = ['planet-filter', 'type-filter', 'status-filter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) filter.value = 'all';
        });
        alert('Database filters cleared!');
    }
    
    selectDatabaseResource(resourceName) {
        console.log(`📋 Selected database resource: ${resourceName}`);
        this.selectedResource = resourceName;
    }
    
    addToWaypoints(resourceName) {
        console.log(`📍 Adding ${resourceName} to waypoints...`);
        alert(`${resourceName} added to waypoints!`);
    }
    
    trackResource(resourceName) {
        console.log(`👁️ Tracking ${resourceName}...`);
        alert(`Now tracking ${resourceName} for quality changes!`);
    }
    
    selectQualityResource(resourceId) {
        console.log(`⭐ Selected quality resource: ${resourceId}`);
        
        // Update selected state
        const resourceItems = this.window.querySelectorAll('.resource-item');
        resourceItems.forEach(item => item.classList.remove('selected'));
        
        const selectedItem = this.window.querySelector(`[data-resource="${resourceId}"]`);
        if (selectedItem) selectedItem.classList.add('selected');
        
        // Show quality details
        this.showQualityDetails(resourceId);
    }
    
    showQualityDetails(resourceId) {
        const qualityDetails = document.getElementById('quality-details');
        
        // Mock resource data
        const resourceData = {
            ferrous_metal: {
                name: 'Ferrous Metal',
                type: 'Mineral',
                currentQuality: 998,
                planet: 'Tatooine',
                spawnedDate: '2 days ago',
                estimatedDepletion: '12 days',
                attributes: {
                    'Overall Quality': 998,
                    'Malleability': 987,
                    'Shock Resistance': 934,
                    'Unit Toughness': 967,
                    'Conductivity': 912
                },
                history: [
                    { date: '2 days ago', quality: 998, event: 'Resource spawned' },
                    { date: '1 day ago', quality: 996, event: 'Quality decay (-2)' },
                    { date: 'Today', quality: 998, event: 'Quality restored (+2)' }
                ]
            },
            aluminum: {
                name: 'Aluminum',
                type: 'Mineral',
                currentQuality: 875,
                planet: 'Dathomir',
                spawnedDate: '5 days ago',
                estimatedDepletion: '3 days',
                attributes: {
                    'Overall Quality': 875,
                    'Malleability': 834,
                    'Shock Resistance': 789,
                    'Unit Toughness': 912,
                    'Conductivity': 845
                }
            }
        };
        
        const data = resourceData[resourceId] || resourceData.ferrous_metal;
        
        qualityDetails.innerHTML = `
            <div class="quality-detail-card">
                <div class="quality-header">
                    <h2>${data.name}</h2>
                    <div class="quality-score quality-${this.getQualityClass(data.currentQuality)}">
                        <i class="fas fa-star"></i>
                        ${data.currentQuality}
                    </div>
                </div>
                
                <div class="resource-summary">
                    <div class="summary-item">
                        <i class="fas fa-globe"></i>
                        <span>Planet: <strong>${data.planet}</strong></span>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-calendar"></i>
                        <span>Spawned: <strong>${data.spawnedDate}</strong></span>
                    </div>
                    <div class="summary-item">
                        <i class="fas fa-clock"></i>
                        <span>Depletion: <strong>${data.estimatedDepletion}</strong></span>
                    </div>
                </div>
                
                <div class="quality-attributes">
                    <h3><i class="fas fa-list"></i> Attributes</h3>
                    <div class="attribute-list">
                        ${Object.entries(data.attributes).map(([attr, value]) => `
                            <div class="quality-attribute">
                                <div class="attr-name">${attr}</div>
                                <div class="attr-bar">
                                    <div class="attr-fill quality-${this.getQualityClass(value)}" style="width: ${(value / 1000) * 100}%"></div>
                                </div>
                                <div class="attr-value quality-${this.getQualityClass(value)}">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${data.history ? `
                    <div class="quality-history">
                        <h3><i class="fas fa-history"></i> Recent Changes</h3>
                        <div class="history-list">
                            ${data.history.map(entry => `
                                <div class="history-entry">
                                    <div class="history-date">${entry.date}</div>
                                    <div class="history-event">${entry.event}</div>
                                    <div class="history-quality quality-${this.getQualityClass(entry.quality)}">${entry.quality}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="quality-actions">
                    <button class="quality-action-btn" onclick="window.resourceManager?.trackQuality('${resourceId}')">
                        <i class="fas fa-bell"></i> Track Changes
                    </button>
                    <button class="quality-action-btn" onclick="window.resourceManager?.compareResource('${resourceId}')">
                        <i class="fas fa-balance-scale"></i> Compare
                    </button>
                    <button class="quality-action-btn" onclick="window.resourceManager?.exportData('${resourceId}')">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
            </div>
        `;
    }
    
    trackQuality(resourceId) {
        console.log(`📈 Setting up quality tracking for ${resourceId}...`);
        alert(`Quality tracking enabled for ${resourceId}!`);
    }
    
    compareResource(resourceId) {
        console.log(`⚖️ Opening comparison for ${resourceId}...`);
        alert(`Opening resource comparison for ${resourceId}!`);
    }
    
    exportData(resourceId) {
        console.log(`💾 Exporting data for ${resourceId}...`);
        alert(`Exporting quality data for ${resourceId}!`);
    }
    
    show() {
        this.window.classList.remove('hidden');
        this.isVisible = true;
        window.resourceManager = this; // Global access
        console.log('🔍 Resource manager opened');
    }
    
    hide() {
        this.window.classList.add('hidden');
        this.isVisible = false;
        console.log('🔍 Resource manager closed');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
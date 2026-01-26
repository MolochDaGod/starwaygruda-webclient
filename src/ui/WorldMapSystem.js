export class WorldMapSystem {
    constructor(playerPosition, currentPlanet = 'tatooine') {
        this.playerPosition = playerPosition;
        this.currentPlanet = currentPlanet;
        this.isVisible = false;
        this.mapScale = 1.0;
        this.minScale = 0.2;
        this.maxScale = 5.0;
        this.mapOffset = { x: 0, y: 0 };
        this.selectedWaypoint = null;
        this.waypoints = [];
        this.showPOIs = true;
        this.showResources = true;
        this.showPlayers = true;
        
        this.planets = {
            tatooine: { name: 'Tatooine', size: 16000, color: '#DAA520', image: '/textures/planets/tatooine.jpg' },
            naboo: { name: 'Naboo', size: 16000, color: '#32CD32', image: '/textures/planets/naboo.jpg' },
            corellia: { name: 'Corellia', size: 16000, color: '#4169E1', image: '/textures/planets/corellia.jpg' },
            dathomir: { name: 'Dathomir', size: 16000, color: '#8B0000', image: '/textures/planets/dathomir.jpg' },
            rori: { name: 'Rori', size: 8000, color: '#9370DB', image: '/textures/planets/rori.jpg' },
            yavin4: { name: 'Yavin 4', size: 16000, color: '#228B22', image: '/textures/planets/yavin4.jpg' },
            tutorial: { name: 'Tutorial Island', size: 4000, color: '#87CEEB', image: '/textures/planets/tutorial.jpg' }
        };
        
        this.createUI();
        this.setupEventListeners();
        this.loadMapData();
    }
    
    createUI() {
        // Main world map window
        this.window = document.createElement('div');
        this.window.id = 'worldmap-window';
        this.window.className = 'game-window worldmap-window hidden';
        
        this.window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-globe"></i>
                    Galactic Map - ${this.planets[this.currentPlanet].name}
                </div>
                <div class="window-controls">
                    <button class="minimize-btn"><i class="fas fa-minus"></i></button>
                    <button class="close-btn" onclick="window.worldMapSystem?.hide()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            
            <div class="window-content">
                <div class="map-toolbar">
                    <div class="planet-selector">
                        <label>Planet:</label>
                        <select id="planet-select">
                            <option value="tatooine">Tatooine</option>
                            <option value="naboo">Naboo</option>
                            <option value="corellia">Corellia</option>
                            <option value="dathomir">Dathomir</option>
                            <option value="rori">Rori</option>
                            <option value="yavin4">Yavin 4</option>
                            <option value="tutorial">Tutorial Island</option>
                        </select>
                    </div>
                    
                    <div class="map-controls">
                        <button id="zoom-in-btn" class="map-btn">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button id="zoom-out-btn" class="map-btn">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <button id="center-btn" class="map-btn" title="Center on Player">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                        <button id="travel-btn" class="map-btn highlight" title="Travel to Waypoint">
                            <i class="fas fa-rocket"></i>
                        </button>
                    </div>
                    
                    <div class="map-layers">
                        <label>
                            <input type="checkbox" id="show-pois" checked> POIs
                        </label>
                        <label>
                            <input type="checkbox" id="show-resources" checked> Resources
                        </label>
                        <label>
                            <input type="checkbox" id="show-players" checked> Players
                        </label>
                        <label>
                            <input type="checkbox" id="show-waypoints" checked> Waypoints
                        </label>
                    </div>
                </div>
                
                <div class="map-main">
                    <div class="map-container" id="map-container">
                        <canvas id="world-map-canvas"></canvas>
                        <div class="map-overlay" id="map-overlay">
                            <!-- Dynamic content -->
                        </div>
                    </div>
                    
                    <div class="map-sidebar">
                        <div class="location-info" id="location-info">
                            <h3><i class="fas fa-map-marker-alt"></i> Current Location</h3>
                            <div class="current-coords">
                                <strong>Coordinates:</strong>
                                <span id="player-coords">0, 0</span>
                            </div>
                            <div class="current-region">
                                <strong>Region:</strong>
                                <span id="current-region">Unknown</span>
                            </div>
                        </div>
                        
                        <div class="poi-list" id="poi-list">
                            <h3><i class="fas fa-landmark"></i> Points of Interest</h3>
                            <div class="poi-scroll" id="poi-scroll">
                                <!-- Dynamic POI list -->
                            </div>
                        </div>
                        
                        <div class="waypoint-manager" id="waypoint-manager">
                            <h3><i class="fas fa-map-pin"></i> Waypoints</h3>
                            <div class="waypoint-controls">
                                <input type="text" id="waypoint-name" placeholder="Waypoint name...">
                                <button id="add-waypoint-btn" class="action-btn">
                                    <i class="fas fa-plus"></i> Add
                                </button>
                            </div>
                            <div class="waypoint-list" id="waypoint-list">
                                <!-- Dynamic waypoint list -->
                            </div>
                        </div>
                        
                        <div class="resource-scanner" id="resource-scanner">
                            <h3><i class="fas fa-search"></i> Resource Scanner</h3>
                            <div class="scanner-controls">
                                <select id="resource-type">
                                    <option value="all">All Resources</option>
                                    <option value="metal">Metal</option>
                                    <option value="ore">Ore</option>
                                    <option value="gas">Gas</option>
                                    <option value="chemical">Chemical</option>
                                    <option value="flora">Flora</option>
                                    <option value="creature">Creature</option>
                                </select>
                                <button id="scan-btn" class="action-btn">
                                    <i class="fas fa-radar-dish"></i> Scan
                                </button>
                            </div>
                            <div class="resource-results" id="resource-results">
                                <p>Select resource type and scan to find deposits</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="map-status">
                    <div class="status-item">
                        <i class="fas fa-eye"></i>
                        Zoom: <span id="zoom-level">100%</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-arrows-alt"></i>
                        Scale: 1 unit = <span id="map-scale">100m</span>
                    </div>
                    <div class="status-item">
                        <i class="fas fa-clock"></i>
                        Last Update: <span id="last-update">Now</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .worldmap-window {
                position: fixed;
                top: 50px;
                left: 50px;
                width: 90vw;
                height: 85vh;
                max-width: 1200px;
                max-height: 800px;
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
            
            .worldmap-window.hidden {
                display: none;
            }
            
            .map-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: rgba(0, 0, 0, 0.3);
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
                flex-wrap: wrap;
                gap: 15px;
            }
            
            .planet-selector {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .planet-selector label {
                font-weight: bold;
                color: #00d4ff;
            }
            
            .planet-selector select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 212, 255, 0.5);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
            }
            
            .map-controls {
                display: flex;
                gap: 5px;
            }
            
            .map-btn {
                width: 36px;
                height: 36px;
                border: 1px solid #00d4ff;
                background: rgba(0, 212, 255, 0.1);
                color: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .map-btn:hover {
                background: rgba(0, 212, 255, 0.2);
                transform: translateY(-1px);
            }
            
            .map-btn.highlight {
                background: rgba(0, 255, 136, 0.2);
                border-color: #00ff88;
            }
            
            .map-layers {
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .map-layers label {
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .map-layers input[type="checkbox"] {
                accent-color: #00d4ff;
            }
            
            .map-main {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 300px;
                gap: 0;
            }
            
            .map-container {
                position: relative;
                background: #000;
                overflow: hidden;
                border-right: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            #world-map-canvas {
                display: block;
                cursor: grab;
                width: 100%;
                height: 100%;
            }
            
            #world-map-canvas:active {
                cursor: grabbing;
            }
            
            .map-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
            }
            
            .map-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                pointer-events: all;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .map-marker:hover {
                transform: translate(-50%, -50%) scale(1.2);
                z-index: 100;
            }
            
            .player-marker {
                width: 16px;
                height: 16px;
                background: #00ff88;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
                z-index: 50;
            }
            
            .poi-marker {
                width: 12px;
                height: 12px;
                background: #00d4ff;
                border: 1px solid white;
                border-radius: 3px;
            }
            
            .resource-marker {
                width: 8px;
                height: 8px;
                background: #ffda79;
                border-radius: 50%;
            }
            
            .waypoint-marker {
                width: 14px;
                height: 14px;
                background: #ff6b6b;
                border: 2px solid white;
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            }
            
            .map-sidebar {
                background: rgba(0, 0, 0, 0.2);
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .map-sidebar h3 {
                margin: 0 0 10px 0;
                color: #00d4ff;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .location-info {
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 8px;
                padding: 15px;
            }
            
            .current-coords,
            .current-region {
                margin-top: 8px;
                font-size: 12px;
            }
            
            .poi-list,
            .waypoint-manager,
            .resource-scanner {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 8px;
                padding: 15px;
            }
            
            .poi-scroll,
            .waypoint-list,
            .resource-results {
                max-height: 120px;
                overflow-y: auto;
                margin-top: 10px;
            }
            
            .poi-item,
            .waypoint-item {
                padding: 8px;
                margin-bottom: 5px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 12px;
            }
            
            .poi-item:hover,
            .waypoint-item:hover {
                background: rgba(0, 212, 255, 0.2);
            }
            
            .poi-item.selected,
            .waypoint-item.selected {
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
            }
            
            .waypoint-controls {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
            }
            
            .waypoint-controls input {
                flex: 1;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 212, 255, 0.5);
                color: white;
                padding: 6px 8px;
                border-radius: 3px;
                font-size: 11px;
            }
            
            .scanner-controls {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 10px;
            }
            
            .scanner-controls select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 212, 255, 0.5);
                color: white;
                padding: 6px 8px;
                border-radius: 3px;
                font-size: 11px;
            }
            
            .action-btn {
                padding: 6px 12px;
                background: rgba(0, 212, 255, 0.2);
                border: 1px solid #00d4ff;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s;
            }
            
            .action-btn:hover {
                background: rgba(0, 212, 255, 0.3);
            }
            
            .map-status {
                display: flex;
                justify-content: space-between;
                padding: 10px 20px;
                background: rgba(0, 0, 0, 0.3);
                border-top: 1px solid rgba(0, 212, 255, 0.3);
                font-size: 11px;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 5px;
                color: #ccc;
            }
            
            .status-item i {
                color: #00d4ff;
            }
            
            .marker-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #00d4ff;
                border-radius: 4px;
                padding: 8px 12px;
                color: white;
                font-size: 11px;
                z-index: 1000;
                pointer-events: none;
                white-space: nowrap;
                transform: translateY(-100%);
                margin-top: -8px;
            }
            
            .marker-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 4px solid transparent;
                border-top-color: #00d4ff;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.window);
        
        this.initializeCanvas();
    }
    
    initializeCanvas() {
        this.canvas = document.getElementById('world-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Initial render
        this.renderMap();
    }
    
    resizeCanvas() {
        const container = document.getElementById('map-container');
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        if (this.isVisible) {
            this.renderMap();
        }
    }
    
    setupEventListeners() {
        // Window dragging
        const header = this.window.querySelector('.window-header');
        this.setupWindowDragging(header);
        
        // Planet selection
        document.getElementById('planet-select').addEventListener('change', (e) => {
            this.switchPlanet(e.target.value);
        });
        
        // Map controls
        document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoomOut());
        document.getElementById('center-btn').addEventListener('click', () => this.centerOnPlayer());
        document.getElementById('travel-btn').addEventListener('click', () => this.travelToWaypoint());
        
        // Layer toggles
        document.getElementById('show-pois').addEventListener('change', (e) => {
            this.showPOIs = e.target.checked;
            this.updateMarkers();
        });
        document.getElementById('show-resources').addEventListener('change', (e) => {
            this.showResources = e.target.checked;
            this.updateMarkers();
        });
        document.getElementById('show-players').addEventListener('change', (e) => {
            this.showPlayers = e.target.checked;
            this.updateMarkers();
        });
        document.getElementById('show-waypoints').addEventListener('change', (e) => {
            this.showWaypoints = e.target.checked;
            this.updateMarkers();
        });
        
        // Waypoint controls
        document.getElementById('add-waypoint-btn').addEventListener('click', () => this.addWaypoint());
        document.getElementById('waypoint-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWaypoint();
        });
        
        // Resource scanner
        document.getElementById('scan-btn').addEventListener('click', () => this.scanResources());
        
        // Canvas interaction
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'M' || e.key === 'm') {
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
    
    renderMap() {
        const planet = this.planets[this.currentPlanet];
        
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw planet terrain/heightmap
        this.drawTerrain();
        
        // Draw grid
        this.drawGrid();
        
        // Update UI markers
        this.updateMarkers();
        
        // Update status
        this.updateStatus();
    }
    
    drawTerrain() {
        // Simple terrain representation
        const planet = this.planets[this.currentPlanet];
        const centerX = this.canvas.width / 2 + this.mapOffset.x;
        const centerY = this.canvas.height / 2 + this.mapOffset.y;
        const radius = (planet.size / 32) * this.mapScale; // Scale terrain to canvas
        
        // Base terrain
        this.ctx.fillStyle = planet.color;
        this.ctx.globalAlpha = 0.1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        
        // Add some terrain features based on planet
        this.drawTerrainFeatures(centerX, centerY, radius);
    }
    
    drawTerrainFeatures(centerX, centerY, radius) {
        const features = this.getTerrainFeatures(this.currentPlanet);
        
        features.forEach(feature => {
            const x = centerX + (feature.x * this.mapScale);
            const y = centerY + (feature.y * this.mapScale);
            const size = feature.size * this.mapScale;
            
            this.ctx.fillStyle = feature.color;
            this.ctx.globalAlpha = feature.alpha || 0.3;
            
            if (feature.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (feature.type === 'rect') {
                this.ctx.fillRect(x - size/2, y - size/2, size, size);
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    getTerrainFeatures(planet) {
        const features = {
            tatooine: [
                { type: 'circle', x: -1000, y: -800, size: 300, color: '#8B4513', alpha: 0.4 }, // Mountain
                { type: 'circle', x: 800, y: 600, size: 200, color: '#F4A460', alpha: 0.3 }, // Dune
                { type: 'rect', x: 0, y: -200, size: 400, color: '#CD853F', alpha: 0.2 } // Desert
            ],
            naboo: [
                { type: 'circle', x: -600, y: -400, size: 250, color: '#228B22', alpha: 0.5 }, // Forest
                { type: 'circle', x: 400, y: 300, size: 180, color: '#4169E1', alpha: 0.4 }, // Lake
                { type: 'rect', x: 0, y: 0, size: 500, color: '#32CD32', alpha: 0.2 } // Plains
            ]
        };
        
        return features[planet] || [];
    }
    
    drawGrid() {
        const gridSize = 100 * this.mapScale;
        if (gridSize < 10) return; // Don't draw grid when too zoomed out
        
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const startX = (-this.mapOffset.x % gridSize);
        const startY = (-this.mapOffset.y % gridSize);
        
        // Vertical lines
        for (let x = startX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    updateMarkers() {
        const overlay = document.getElementById('map-overlay');
        overlay.innerHTML = '';
        
        // Player marker
        this.addPlayerMarker();
        
        // POI markers
        if (this.showPOIs) {
            this.addPOIMarkers();
        }
        
        // Resource markers
        if (this.showResources) {
            this.addResourceMarkers();
        }
        
        // Waypoint markers
        if (this.showWaypoints) {
            this.addWaypointMarkers();
        }
    }
    
    addPlayerMarker() {
        const worldPos = this.worldToCanvas(this.playerPosition.x, this.playerPosition.z);
        
        const marker = document.createElement('div');
        marker.className = 'map-marker player-marker';
        marker.style.left = worldPos.x + 'px';
        marker.style.top = worldPos.y + 'px';
        marker.title = 'Your Location';
        
        document.getElementById('map-overlay').appendChild(marker);
    }
    
    addPOIMarkers() {
        const pois = this.getPOIsForPlanet(this.currentPlanet);
        
        pois.forEach(poi => {
            const worldPos = this.worldToCanvas(poi.x, poi.z);
            
            const marker = document.createElement('div');
            marker.className = 'map-marker poi-marker';
            marker.style.left = worldPos.x + 'px';
            marker.style.top = worldPos.y + 'px';
            marker.dataset.poi = poi.name;
            
            marker.addEventListener('click', () => this.selectPOI(poi));
            marker.addEventListener('mouseenter', (e) => this.showMarkerTooltip(e, poi.name, poi.type));
            marker.addEventListener('mouseleave', () => this.hideMarkerTooltip());
            
            document.getElementById('map-overlay').appendChild(marker);
        });
    }
    
    addResourceMarkers() {
        const resources = this.getResourcesForPlanet(this.currentPlanet);
        
        resources.forEach(resource => {
            const worldPos = this.worldToCanvas(resource.x, resource.z);
            
            const marker = document.createElement('div');
            marker.className = 'map-marker resource-marker';
            marker.style.left = worldPos.x + 'px';
            marker.style.top = worldPos.y + 'px';
            marker.style.background = this.getResourceColor(resource.type);
            
            marker.addEventListener('mouseenter', (e) => this.showMarkerTooltip(e, resource.name, `${resource.type} - Quality: ${resource.quality}%`));
            marker.addEventListener('mouseleave', () => this.hideMarkerTooltip());
            
            document.getElementById('map-overlay').appendChild(marker);
        });
    }
    
    addWaypointMarkers() {
        this.waypoints.forEach((waypoint, index) => {
            const worldPos = this.worldToCanvas(waypoint.x, waypoint.z);
            
            const marker = document.createElement('div');
            marker.className = 'map-marker waypoint-marker';
            marker.style.left = worldPos.x + 'px';
            marker.style.top = worldPos.y + 'px';
            marker.dataset.waypoint = index;
            
            marker.addEventListener('click', () => this.selectWaypoint(index));
            marker.addEventListener('mouseenter', (e) => this.showMarkerTooltip(e, waypoint.name, 'Waypoint'));
            marker.addEventListener('mouseleave', () => this.hideMarkerTooltip());
            
            document.getElementById('map-overlay').appendChild(marker);
        });
    }
    
    worldToCanvas(worldX, worldZ) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            x: centerX + (worldX * this.mapScale * 0.1) + this.mapOffset.x,
            y: centerY + (worldZ * this.mapScale * 0.1) + this.mapOffset.y
        };
    }
    
    canvasToWorld(canvasX, canvasY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            x: ((canvasX - centerX - this.mapOffset.x) / (this.mapScale * 0.1)),
            z: ((canvasY - centerY - this.mapOffset.y) / (this.mapScale * 0.1))
        };
    }
    
    zoomIn() {
        if (this.mapScale < this.maxScale) {
            this.mapScale = Math.min(this.mapScale * 1.5, this.maxScale);
            this.renderMap();
        }
    }
    
    zoomOut() {
        if (this.mapScale > this.minScale) {
            this.mapScale = Math.max(this.mapScale / 1.5, this.minScale);
            this.renderMap();
        }
    }
    
    centerOnPlayer() {
        this.mapOffset = { x: 0, y: 0 };
        this.renderMap();
        console.log('🎯 Centered map on player');
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.mapOffset.x += deltaX;
            this.mapOffset.y += deltaY;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.renderMap();
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    handleClick(e) {
        if (!this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            const worldPos = this.canvasToWorld(canvasX, canvasY);
            
            console.log(`🖱️ Clicked map at: ${worldPos.x.toFixed(0)}, ${worldPos.z.toFixed(0)}`);
            
            // Could add waypoint or show coordinates
        }
    }
    
    showMarkerTooltip(event, title, subtitle = '') {
        const tooltip = document.createElement('div');
        tooltip.className = 'marker-tooltip';
        tooltip.innerHTML = `
            <strong>${title}</strong>
            ${subtitle ? `<br><small>${subtitle}</small>` : ''}
        `;
        
        const marker = event.target;
        marker.appendChild(tooltip);
    }
    
    hideMarkerTooltip() {
        document.querySelectorAll('.marker-tooltip').forEach(tooltip => tooltip.remove());
    }
    
    loadMapData() {
        // Update planet selector
        document.getElementById('planet-select').value = this.currentPlanet;
        
        // Load POI list
        this.updatePOIList();
        
        // Update player coordinates
        this.updatePlayerCoords();
        
        // Load sample waypoints
        this.waypoints = [
            { name: 'Mining Site Alpha', x: 1200, z: -800, planet: this.currentPlanet },
            { name: 'Quest Location', x: -600, z: 400, planet: this.currentPlanet }
        ];
        
        this.updateWaypointList();
    }
    
    updatePOIList() {
        const pois = this.getPOIsForPlanet(this.currentPlanet);
        const poiScroll = document.getElementById('poi-scroll');
        
        poiScroll.innerHTML = pois.map(poi => `
            <div class="poi-item" onclick="window.worldMapSystem?.selectPOI({name:'${poi.name}', x:${poi.x}, z:${poi.z}})">
                <strong>${poi.name}</strong><br>
                <small>${poi.type} - ${Math.round(poi.x)}, ${Math.round(poi.z)}</small>
            </div>
        `).join('');
    }
    
    updateWaypointList() {
        const waypointList = document.getElementById('waypoint-list');
        
        waypointList.innerHTML = this.waypoints.map((waypoint, index) => `
            <div class="waypoint-item" onclick="window.worldMapSystem?.selectWaypoint(${index})">
                <strong>${waypoint.name}</strong><br>
                <small>${Math.round(waypoint.x)}, ${Math.round(waypoint.z)}</small>
                <button onclick="event.stopPropagation(); window.worldMapSystem?.removeWaypoint(${index})" 
                        style="float: right; font-size: 10px; padding: 2px 5px;">×</button>
            </div>
        `).join('');
    }
    
    updatePlayerCoords() {
        const coords = document.getElementById('player-coords');
        if (coords) {
            coords.textContent = `${Math.round(this.playerPosition.x)}, ${Math.round(this.playerPosition.z)}`;
        }
        
        const region = document.getElementById('current-region');
        if (region) {
            region.textContent = this.getCurrentRegion();
        }
    }
    
    updateStatus() {
        const zoomLevel = document.getElementById('zoom-level');
        const mapScale = document.getElementById('map-scale');
        const lastUpdate = document.getElementById('last-update');
        
        if (zoomLevel) zoomLevel.textContent = Math.round(this.mapScale * 100) + '%';
        if (mapScale) mapScale.textContent = Math.round(100 / this.mapScale) + 'm';
        if (lastUpdate) lastUpdate.textContent = new Date().toLocaleTimeString();
    }
    
    getPOIsForPlanet(planet) {
        // Sample POI data
        const pois = {
            tatooine: [
                { name: 'Mos Eisley', type: 'City', x: 3528, z: -4804 },
                { name: 'Anchorhead', type: 'City', x: 65, z: -5350 },
                { name: 'Bestine', type: 'City', x: -1290, z: -3590 },
                { name: 'Ben Kenobi\'s Hut', type: 'POI', x: -4515, z: -2270 }
            ],
            naboo: [
                { name: 'Theed', type: 'City', x: -5045, z: 4180 },
                { name: 'Keren', type: 'City', x: 1441, z: 2771 },
                { name: 'Moenia', type: 'City', x: 4865, z: -4742 }
            ]
        };
        
        return pois[planet] || [];
    }
    
    getResourcesForPlanet(planet) {
        // Sample resource data
        const resources = [];
        for (let i = 0; i < 20; i++) {
            resources.push({
                name: `Resource Deposit ${i + 1}`,
                type: ['metal', 'ore', 'gas', 'chemical'][Math.floor(Math.random() * 4)],
                quality: Math.floor(Math.random() * 100) + 1,
                x: (Math.random() - 0.5) * 10000,
                z: (Math.random() - 0.5) * 10000
            });
        }
        return resources;
    }
    
    getResourceColor(type) {
        const colors = {
            metal: '#C0C0C0',
            ore: '#8B4513',
            gas: '#87CEEB',
            chemical: '#98FB98',
            flora: '#32CD32',
            creature: '#FF69B4'
        };
        return colors[type] || '#FFD700';
    }
    
    getCurrentRegion() {
        // Simple region detection based on coordinates
        const x = this.playerPosition.x;
        const z = this.playerPosition.z;
        
        if (Math.abs(x) < 1000 && Math.abs(z) < 1000) return 'Central Plains';
        if (x > 2000) return 'Eastern Territories';
        if (x < -2000) return 'Western Badlands';
        if (z > 2000) return 'Northern Highlands';
        if (z < -2000) return 'Southern Desert';
        
        return 'Wilderness';
    }
    
    switchPlanet(planetName) {
        this.currentPlanet = planetName;
        
        // Update window title
        const title = this.window.querySelector('.window-title');
        title.innerHTML = `<i class="fas fa-globe"></i> Galactic Map - ${this.planets[planetName].name}`;
        
        // Reset view
        this.mapOffset = { x: 0, y: 0 };
        this.mapScale = 1.0;
        
        // Reload data
        this.loadMapData();
        this.renderMap();
        
        console.log(`🌍 Switched to ${this.planets[planetName].name}`);
    }
    
    selectPOI(poi) {
        console.log(`📍 Selected POI: ${poi.name} at ${poi.x}, ${poi.z}`);
        
        // Highlight POI
        document.querySelectorAll('.poi-item').forEach(item => item.classList.remove('selected'));
        document.querySelector(`[onclick*="${poi.name}"]`)?.classList.add('selected');
        
        // Center map on POI
        const worldPos = this.worldToCanvas(poi.x, poi.z);
        this.mapOffset.x = this.canvas.width / 2 - worldPos.x + this.mapOffset.x;
        this.mapOffset.y = this.canvas.height / 2 - worldPos.y + this.mapOffset.y;
        this.renderMap();
    }
    
    selectWaypoint(index) {
        this.selectedWaypoint = index;
        const waypoint = this.waypoints[index];
        
        console.log(`📌 Selected waypoint: ${waypoint.name}`);
        
        // Highlight waypoint
        document.querySelectorAll('.waypoint-item').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.waypoint-item')[index]?.classList.add('selected');
    }
    
    addWaypoint() {
        const nameInput = document.getElementById('waypoint-name');
        const name = nameInput.value.trim();
        
        if (!name) return;
        
        const waypoint = {
            name: name,
            x: this.playerPosition.x,
            z: this.playerPosition.z,
            planet: this.currentPlanet
        };
        
        this.waypoints.push(waypoint);
        this.updateWaypointList();
        this.updateMarkers();
        
        nameInput.value = '';
        console.log(`📌 Added waypoint: ${name}`);
    }
    
    removeWaypoint(index) {
        const waypoint = this.waypoints[index];
        this.waypoints.splice(index, 1);
        this.updateWaypointList();
        this.updateMarkers();
        
        console.log(`🗑️ Removed waypoint: ${waypoint.name}`);
    }
    
    travelToWaypoint() {
        if (this.selectedWaypoint !== null && this.waypoints[this.selectedWaypoint]) {
            const waypoint = this.waypoints[this.selectedWaypoint];
            console.log(`🚀 Traveling to waypoint: ${waypoint.name}`);
            
            // In a real game, this would trigger travel mechanics
            // For now, just show a message
            alert(`Traveling to ${waypoint.name} at coordinates ${waypoint.x}, ${waypoint.z}`);
        } else {
            alert('Please select a waypoint first');
        }
    }
    
    scanResources() {
        const resourceType = document.getElementById('resource-type').value;
        const results = document.getElementById('resource-results');
        
        console.log(`🔍 Scanning for ${resourceType} resources...`);
        
        // Simulate resource scanning
        setTimeout(() => {
            const foundResources = this.getResourcesForPlanet(this.currentPlanet)
                .filter(r => resourceType === 'all' || r.type === resourceType)
                .slice(0, 5); // Show top 5
            
            if (foundResources.length > 0) {
                results.innerHTML = foundResources.map(resource => `
                    <div class="poi-item">
                        <strong>${resource.name}</strong><br>
                        <small>${resource.type} - Quality: ${resource.quality}% - Distance: ${Math.round(Math.sqrt(Math.pow(resource.x - this.playerPosition.x, 2) + Math.pow(resource.z - this.playerPosition.z, 2)))}m</small>
                    </div>
                `).join('');
            } else {
                results.innerHTML = '<p>No resources found in scanning range</p>';
            }
        }, 1000);
        
        results.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Scanning...</p>';
    }
    
    updatePlayerPosition(position) {
        this.playerPosition = position;
        this.updatePlayerCoords();
        
        if (this.isVisible) {
            this.updateMarkers();
        }
    }
    
    show() {
        this.window.classList.remove('hidden');
        this.isVisible = true;
        window.worldMapSystem = this; // Global access
        
        this.resizeCanvas();
        this.renderMap();
        
        console.log('🗺️ World map opened');
    }
    
    hide() {
        this.window.classList.add('hidden');
        this.isVisible = false;
        console.log('🗺️ World map closed');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}
import { getPlanetPOIs } from '../data/poi-database.js';

/**
 * Minimap UI Component
 * Shows player position, cities, POIs, and NPCs
 */
export class Minimap {
    constructor(camera, planetName = 'tatooine') {
        this.camera = camera;
        this.planetName = planetName;
        this.planetData = getPlanetPOIs(planetName);
        this.scale = 0.05; // Map scale (0.05 = 1 game unit = 0.05 pixels)
        this.mapSize = 200; // Minimap size in pixels
        this.visible = true;
        
        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Container
        this.container = document.createElement('div');
        this.container.id = 'minimap';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: ${this.mapSize}px;
            height: ${this.mapSize}px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00d4ff;
            border-radius: 10px;
            overflow: hidden;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
        `;

        // Canvas for drawing
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.mapSize;
        this.canvas.height = this.mapSize;
        this.canvas.style.cssText = 'display: block;';
        this.ctx = this.canvas.getContext('2d');

        // Planet name label
        this.label = document.createElement('div');
        this.label.style.cssText = `
            position: absolute;
            bottom: 5px;
            left: 0;
            right: 0;
            text-align: center;
            color: #00d4ff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-shadow: 0 0 5px rgba(0, 212, 255, 0.5);
        `;
        this.label.textContent = this.planetName;

        // Toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.innerHTML = '−';
        this.toggleBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            width: 20px;
            height: 20px;
            background: rgba(0, 212, 255, 0.2);
            border: 1px solid #00d4ff;
            color: #00d4ff;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 14px;
            padding: 0;
        `;
        this.toggleBtn.onclick = () => this.toggle();

        // Zoom controls
        this.zoomIn = this.createZoomButton('+', 5, 30);
        this.zoomOut = this.createZoomButton('−', 5, 55);

        this.container.appendChild(this.canvas);
        this.container.appendChild(this.label);
        this.container.appendChild(this.toggleBtn);
        this.container.appendChild(this.zoomIn);
        this.container.appendChild(this.zoomOut);

        document.body.appendChild(this.container);
    }

    createZoomButton(text, top, topOffset) {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.style.cssText = `
            position: absolute;
            top: ${topOffset}px;
            right: 5px;
            width: 20px;
            height: 20px;
            background: rgba(0, 212, 255, 0.2);
            border: 1px solid #00d4ff;
            color: #00d4ff;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 14px;
            padding: 0;
        `;
        btn.onclick = () => {
            if (text === '+') {
                this.scale = Math.min(this.scale * 1.5, 0.2);
            } else {
                this.scale = Math.max(this.scale / 1.5, 0.01);
            }
        };
        return btn;
    }

    setupEventListeners() {
        // M key to toggle minimap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.visible = !this.visible;
        this.canvas.style.display = this.visible ? 'block' : 'none';
        this.label.style.display = this.visible ? 'block' : 'none';
        this.toggleBtn.innerHTML = this.visible ? '−' : '+';
    }

    worldToMap(x, z) {
        // Convert world coordinates to map coordinates
        const centerX = this.mapSize / 2;
        const centerY = this.mapSize / 2;
        
        // Player is always at center, so we offset everything relative to player
        const playerX = this.camera.position.x;
        const playerZ = this.camera.position.z;
        
        const mapX = centerX + (x - playerX) * this.scale;
        const mapY = centerY + (z - playerZ) * this.scale;
        
        return { x: mapX, y: mapY };
    }

    update(npcs = []) {
        if (!this.visible) return;

        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(10, 20, 30, 0.9)';
        ctx.fillRect(0, 0, this.mapSize, this.mapSize);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let i = 0; i < this.mapSize; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.mapSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.mapSize, i);
            ctx.stroke();
        }

        // Draw cities
        if (this.planetData?.cities) {
            this.planetData.cities.forEach(city => {
                const pos = this.worldToMap(city.position.x, city.position.z);
                
                // Only draw if visible on map
                if (pos.x >= 0 && pos.x <= this.mapSize && pos.y >= 0 && pos.y <= this.mapSize) {
                    // City circle
                    ctx.fillStyle = 'rgba(255, 170, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, city.radius * this.scale, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // City marker
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // City name (if zoomed in enough)
                    if (this.scale > 0.03) {
                        ctx.fillStyle = '#ffaa00';
                        ctx.font = '8px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(city.name, pos.x, pos.y - 8);
                    }
                }
            });
        }

        // Draw POIs
        if (this.planetData?.pois) {
            this.planetData.pois.forEach(poi => {
                const pos = this.worldToMap(poi.x, poi.z);
                
                if (pos.x >= 0 && pos.x <= this.mapSize && pos.y >= 0 && pos.y <= this.mapSize) {
                    // POI marker
                    ctx.fillStyle = this.getPOIColor(poi.type);
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // POI icon
                    ctx.strokeStyle = this.getPOIColor(poi.type);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        // Draw NPCs (if provided)
        npcs.forEach(npc => {
            if (!npc.position) return;
            const pos = this.worldToMap(npc.position.x, npc.position.z);
            
            if (pos.x >= 0 && pos.x <= this.mapSize && pos.y >= 0 && pos.y <= this.mapSize) {
                const hostile = npc.userData?.hostile || false;
                ctx.fillStyle = hostile ? '#ff4444' : '#44ff44';
                ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
            }
        });

        // Draw player (always at center)
        const centerX = this.mapSize / 2;
        const centerY = this.mapSize / 2;
        
        // Player direction indicator
        const playerRotation = this.camera.rotation.y;
        const arrowLength = 8;
        const arrowX = centerX + Math.sin(playerRotation) * arrowLength;
        const arrowY = centerY + Math.cos(playerRotation) * arrowLength;
        
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();
        
        // Player dot
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Player glow
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Draw coordinates
        ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`X: ${Math.floor(this.camera.position.x)}`, 5, 12);
        ctx.fillText(`Z: ${Math.floor(this.camera.position.z)}`, 5, 22);
    }

    getPOIColor(type) {
        const colors = {
            ruins: '#8b4513',
            landmark: '#00ffff',
            dungeon: '#ff0000',
            imperial: '#00ff00',
            rebel: '#ff6600',
            village: '#ffff00',
            camp: '#ff9900',
            spawn: '#ff00ff',
            default: '#ffffff'
        };
        return colors[type] || colors.default;
    }

    setPlanet(planetName) {
        this.planetName = planetName;
        this.planetData = getPlanetPOIs(planetName);
        this.label.textContent = planetName;
    }

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

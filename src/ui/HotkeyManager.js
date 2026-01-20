import { getPlanetPOIs } from '../data/poi-database.js';
import { getPlanetSpawns } from '../data/npc-spawns.js';

/**
 * Hotkey Manager with Admin Fast Travel
 * Provides keyboard shortcuts and admin teleportation
 */
export class HotkeyManager {
    constructor(camera, options = {}) {
        this.camera = camera;
        this.adminMode = options.adminMode || false;
        this.planetName = options.planetName || 'tatooine';
        this.onPlanetChange = options.onPlanetChange || null;
        
        this.helpVisible = false;
        this.travelMenuVisible = false;
        
        this.createHelpOverlay();
        this.createTravelMenu();
        this.setupHotkeys();
        
        console.log('🎮 Hotkey Manager initialized');
        if (this.adminMode) {
            console.log('👑 Admin Mode: Fast travel enabled (Press T)');
        }
    }

    createHelpOverlay() {
        this.helpOverlay = document.createElement('div');
        this.helpOverlay.id = 'hotkey-help';
        this.helpOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00d4ff;
            border-radius: 15px;
            padding: 30px;
            color: #fff;
            font-family: 'Courier New', monospace;
            z-index: 10000;
            display: none;
            max-width: 600px;
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
        `;

        this.helpOverlay.innerHTML = `
            <h2 style="color: #00d4ff; margin-top: 0; text-align: center;">⌨️ HOTKEYS</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <h3 style="color: #ffaa00; margin-bottom: 10px;">Movement</h3>
                    <div style="line-height: 1.8;">
                        <strong>WASD</strong> - Move<br>
                        <strong>Space</strong> - Jump<br>
                        <strong>Shift</strong> - Sprint<br>
                        <strong>Mouse</strong> - Look<br>
                        <strong>E</strong> - Interact
                    </div>
                </div>
                
                <div>
                    <h3 style="color: #ffaa00; margin-bottom: 10px;">UI</h3>
                    <div style="line-height: 1.8;">
                        <strong>M</strong> - Toggle Minimap<br>
                        <strong>H</strong> - This Help<br>
                        <strong>I</strong> - Inventory<br>
                        <strong>Tab</strong> - Stats<br>
                        <strong>Esc</strong> - Menu
                    </div>
                </div>
                
                ${this.adminMode ? `
                <div>
                    <h3 style="color: #ff0066; margin-bottom: 10px;">Admin</h3>
                    <div style="line-height: 1.8;">
                        <strong>T</strong> - Fast Travel<br>
                        <strong>G</strong> - God Mode<br>
                        <strong>F</strong> - Fly Mode<br>
                        <strong>N</strong> - Noclip<br>
                        <strong>~</strong> - Console
                    </div>
                </div>
                ` : ''}
                
                <div>
                    <h3 style="color: #ffaa00; margin-bottom: 10px;">Space</h3>
                    <div style="line-height: 1.8;">
                        <strong>WASD</strong> - Thrust<br>
                        <strong>Q/E</strong> - Vertical<br>
                        <strong>Shift</strong> - Boost<br>
                        <strong>C</strong> - Change Ship<br>
                        <strong>V</strong> - Camera View
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #888;">
                Press <strong>H</strong> or <strong>Esc</strong> to close
            </div>
        `;

        document.body.appendChild(this.helpOverlay);
    }

    createTravelMenu() {
        this.travelMenu = document.createElement('div');
        this.travelMenu.id = 'travel-menu';
        this.travelMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 3px solid #ff0066;
            border-radius: 15px;
            padding: 25px;
            color: #fff;
            font-family: 'Courier New', monospace;
            z-index: 10001;
            display: none;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 40px rgba(255, 0, 102, 0.6);
        `;

        this.updateTravelMenu();
        document.body.appendChild(this.travelMenu);
    }

    updateTravelMenu() {
        const planetData = getPlanetPOIs(this.planetName);
        const spawnData = getPlanetSpawns(this.planetName);

        if (!planetData) {
            this.travelMenu.innerHTML = '<h2 style="color: #ff0066;">⚠️ No data for this planet</h2>';
            return;
        }

        let html = `
            <h2 style="color: #ff0066; margin-top: 0; text-align: center;">
                👑 ADMIN FAST TRAVEL - ${this.planetName.toUpperCase()}
            </h2>
            <div style="text-align: center; color: #888; margin-bottom: 20px;">
                Click location to teleport
            </div>
        `;

        // Cities
        if (planetData.cities && planetData.cities.length > 0) {
            html += '<h3 style="color: #ffaa00; border-bottom: 2px solid #ffaa00; padding-bottom: 5px;">🏙️ Cities</h3>';
            html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">';
            
            planetData.cities.forEach((city, index) => {
                html += `
                    <button 
                        onclick="window.hotkeyManager.travelTo(${city.position.x}, ${city.position.y}, ${city.position.z}, '${city.name}')"
                        style="
                            background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 170, 0, 0.1));
                            border: 2px solid #ffaa00;
                            color: #ffaa00;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-family: 'Courier New', monospace;
                            font-weight: bold;
                            transition: all 0.3s;
                            text-align: left;
                        "
                        onmouseover="this.style.background='linear-gradient(135deg, rgba(255, 170, 0, 0.4), rgba(255, 170, 0, 0.2))'; this.style.transform='scale(1.05)';"
                        onmouseout="this.style.background='linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 170, 0, 0.1))'; this.style.transform='scale(1)';"
                    >
                        <div style="font-size: 14px;">${city.name}</div>
                        <div style="font-size: 10px; color: #888; margin-top: 4px;">
                            ${city.type || 'city'} • ${city.buildings?.length || 0} buildings
                        </div>
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">
                            ${city.position.x}, ${city.position.y}, ${city.position.z}
                        </div>
                    </button>
                `;
            });
            html += '</div>';
        }

        // POIs
        if (planetData.pois && planetData.pois.length > 0) {
            html += '<h3 style="color: #00ffff; border-bottom: 2px solid #00ffff; padding-bottom: 5px;">📍 Points of Interest</h3>';
            html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">';
            
            planetData.pois.forEach(poi => {
                const color = this.getPOIColor(poi.type);
                html += `
                    <button 
                        onclick="window.hotkeyManager.travelTo(${poi.x}, ${poi.y}, ${poi.z}, '${poi.name}')"
                        style="
                            background: linear-gradient(135deg, ${this.hexToRgba(color, 0.2)}, ${this.hexToRgba(color, 0.1)});
                            border: 2px solid ${color};
                            color: ${color};
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-family: 'Courier New', monospace;
                            font-weight: bold;
                            transition: all 0.3s;
                            text-align: left;
                        "
                        onmouseover="this.style.background='linear-gradient(135deg, ${this.hexToRgba(color, 0.4)}, ${this.hexToRgba(color, 0.2)})'; this.style.transform='scale(1.05)';"
                        onmouseout="this.style.background='linear-gradient(135deg, ${this.hexToRgba(color, 0.2)}, ${this.hexToRgba(color, 0.1)})'; this.style.transform='scale(1)';"
                    >
                        <div style="font-size: 14px;">${poi.name}</div>
                        <div style="font-size: 10px; color: #888; margin-top: 4px;">
                            ${poi.type}
                        </div>
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">
                            ${poi.x}, ${poi.y}, ${poi.z}
                        </div>
                    </button>
                `;
            });
            html += '</div>';
        }

        // NPC Spawns (first 10)
        if (spawnData?.creatures && spawnData.creatures.length > 0) {
            html += '<h3 style="color: #ff6600; border-bottom: 2px solid #ff6600; padding-bottom: 5px;">👥 NPC Spawns</h3>';
            html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">';
            
            spawnData.creatures.slice(0, 10).forEach(spawn => {
                html += `
                    <button 
                        onclick="window.hotkeyManager.travelTo(${spawn.x}, ${spawn.y}, ${spawn.z}, '${spawn.name}')"
                        style="
                            background: linear-gradient(135deg, rgba(255, 102, 0, 0.2), rgba(255, 102, 0, 0.1));
                            border: 2px solid #ff6600;
                            color: #ff6600;
                            padding: 10px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-family: 'Courier New', monospace;
                            transition: all 0.3s;
                            text-align: left;
                        "
                        onmouseover="this.style.background='linear-gradient(135deg, rgba(255, 102, 0, 0.4), rgba(255, 102, 0, 0.2))'; this.style.transform='scale(1.05)';"
                        onmouseout="this.style.background='linear-gradient(135deg, rgba(255, 102, 0, 0.2), rgba(255, 102, 0, 0.1))'; this.style.transform='scale(1)';"
                    >
                        <div style="font-size: 12px;">${spawn.name}</div>
                        <div style="font-size: 9px; color: #888;">
                            ${spawn.faction} • Lvl ${spawn.level || '?'}
                        </div>
                    </button>
                `;
            });
            html += '</div>';
        }

        html += '<div style="text-align: center; margin-top: 20px; color: #666;">Press <strong>T</strong> or <strong>Esc</strong> to close</div>';

        this.travelMenu.innerHTML = html;
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

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    setupHotkeys() {
        // Store reference globally for onclick handlers
        window.hotkeyManager = this;

        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key.toLowerCase()) {
                case 'h':
                    this.toggleHelp();
                    break;
                case 't':
                    if (this.adminMode) {
                        this.toggleTravelMenu();
                    }
                    break;
                case 'escape':
                    this.closeAllMenus();
                    break;
                case '`':
                case '~':
                    if (this.adminMode) {
                        console.log('Console toggle (not yet implemented)');
                    }
                    break;
            }
        });
    }

    toggleHelp() {
        this.helpVisible = !this.helpVisible;
        this.helpOverlay.style.display = this.helpVisible ? 'block' : 'none';
        if (this.helpVisible) {
            this.travelMenuVisible = false;
            this.travelMenu.style.display = 'none';
        }
    }

    toggleTravelMenu() {
        if (!this.adminMode) {
            console.log('⛔ Admin mode required for fast travel');
            return;
        }
        
        this.travelMenuVisible = !this.travelMenuVisible;
        this.travelMenu.style.display = this.travelMenuVisible ? 'block' : 'none';
        
        if (this.travelMenuVisible) {
            this.helpVisible = false;
            this.helpOverlay.style.display = 'none';
            this.updateTravelMenu();
        }
    }

    closeAllMenus() {
        this.helpVisible = false;
        this.travelMenuVisible = false;
        this.helpOverlay.style.display = 'none';
        this.travelMenu.style.display = 'none';
    }

    travelTo(x, y, z, locationName) {
        console.log(`✈️ Traveling to ${locationName} (${x}, ${y}, ${z})`);
        
        // Teleport camera
        this.camera.position.set(x, y + 50, z); // +50 to spawn above ground
        
        // Create teleport effect
        this.createTeleportEffect();
        
        // Show notification
        this.showNotification(`Teleported to ${locationName}`, '#00ff00');
        
        // Close menu
        this.closeAllMenus();
    }

    createTeleportEffect() {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: radial-gradient(circle, rgba(0, 212, 255, 0.5), transparent);
            pointer-events: none;
            z-index: 9999;
            animation: teleportFlash 0.5s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes teleportFlash {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(effect);

        setTimeout(() => {
            document.body.removeChild(effect);
        }, 500);
    }

    showNotification(message, color = '#00d4ff') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid ${color};
            color: ${color};
            padding: 20px 40px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            z-index: 10002;
            box-shadow: 0 0 20px ${color};
            animation: fadeInOut 2s ease-in-out;
        `;
        notification.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 2000);
    }

    setPlanet(planetName) {
        this.planetName = planetName;
        this.updateTravelMenu();
    }

    setAdminMode(enabled) {
        this.adminMode = enabled;
        console.log(this.adminMode ? '👑 Admin mode enabled' : '👤 Admin mode disabled');
        this.createHelpOverlay(); // Recreate to update hotkey list
    }

    dispose() {
        if (this.helpOverlay && this.helpOverlay.parentNode) {
            this.helpOverlay.parentNode.removeChild(this.helpOverlay);
        }
        if (this.travelMenu && this.travelMenu.parentNode) {
            this.travelMenu.parentNode.removeChild(this.travelMenu);
        }
        window.hotkeyManager = null;
    }
}

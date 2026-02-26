import * as THREE from 'three';

/**
 * Ship Interaction System
 * Handles entering/exiting ships, boarding mechanics, and character/ship state transitions
 */
export class ShipInteractionSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // State management
        this.state = 'on_foot'; // 'on_foot', 'boarding', 'in_ship', 'landing', 'exiting'
        this.currentShip = null;
        this.playerMesh = null;
        this.playerController = null;
        
        // Ship registry
        this.ships = new Map();
        this.nearbyShip = null;
        
        // Interaction settings
        this.boardingDistance = 15;  // Distance to board a ship
        this.exitDistance = 5;       // Distance from ship when exiting
        
        // Landing state
        this.isLanded = false;
        this.landedPlanet = null;
        this.landingPosition = new THREE.Vector3();
        
        // UI elements
        this.interactionPrompt = null;
        this.shipStatusUI = null;
        
        // Callbacks
        this.onEnterShip = null;
        this.onExitShip = null;
        this.onLand = null;
        this.onTakeoff = null;
        
        this.setupUI();
        this.setupControls();
        
        console.log('🚀 Ship Interaction System initialized');
    }
    
    setupUI() {
        // Create interaction prompt
        this.interactionPrompt = document.createElement('div');
        this.interactionPrompt.id = 'ship-interaction-prompt';
        this.interactionPrompt.style.cssText = `
            position: fixed;
            bottom: 25%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: #00ffff;
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid #00ffff;
            font-family: 'Orbitron', 'Courier New', monospace;
            font-size: 16px;
            text-align: center;
            z-index: 1000;
            display: none;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        `;
        document.body.appendChild(this.interactionPrompt);
        
        // Create ship status UI
        this.shipStatusUI = document.createElement('div');
        this.shipStatusUI.id = 'ship-status-ui';
        this.shipStatusUI.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 20, 40, 0.9);
            color: #00ffff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #0066aa;
            font-family: 'Orbitron', monospace;
            font-size: 12px;
            z-index: 999;
            display: none;
            min-width: 200px;
        `;
        document.body.appendChild(this.shipStatusUI);
    }
    
    setupControls() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyE') {
                this.handleInteraction();
            }
            if (event.code === 'KeyF' && this.state === 'in_ship' && !this.isLanded) {
                // Already handled by main.js for launching
            }
        });
    }
    
    /**
     * Register a ship that can be boarded
     */
    registerShip(id, shipMesh, config = {}) {
        const shipData = {
            id,
            mesh: shipMesh,
            type: config.type || 'fighter',
            name: config.name || 'Starship',
            canBoard: true,
            isPlayerOwned: config.isPlayerOwned || false,
            cockpitOffset: config.cockpitOffset || new THREE.Vector3(0, 2, 0),
            exitOffset: config.exitOffset || new THREE.Vector3(5, 0, 0),
            speed: config.speed || 50,
            health: config.health || 100,
            maxHealth: config.maxHealth || 100,
            fuel: config.fuel || 100,
            weapons: config.weapons || ['laser'],
        };
        
        this.ships.set(id, shipData);
        console.log(`🛸 Registered ship: ${shipData.name} (${id})`);
        return shipData;
    }
    
    /**
     * Set player reference
     */
    setPlayer(playerController, playerMesh) {
        this.playerController = playerController;
        this.playerMesh = playerMesh;
    }
    
    /**
     * Check for nearby ships player can board
     */
    checkNearbyShips(playerPosition) {
        if (this.state !== 'on_foot') return null;
        
        let closestShip = null;
        let closestDistance = this.boardingDistance;
        
        this.ships.forEach((shipData, id) => {
            if (!shipData.mesh || !shipData.canBoard) return;
            
            const distance = playerPosition.distanceTo(shipData.mesh.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestShip = shipData;
            }
        });
        
        this.nearbyShip = closestShip;
        
        // Update UI prompt
        if (closestShip) {
            this.showPrompt(`Press [E] to board ${closestShip.name}`);
        } else {
            this.hidePrompt();
        }
        
        return closestShip;
    }
    
    /**
     * Handle E key interaction
     */
    handleInteraction() {
        switch (this.state) {
            case 'on_foot':
                if (this.nearbyShip) {
                    this.boardShip(this.nearbyShip);
                }
                break;
                
            case 'in_ship':
                if (this.isLanded) {
                    this.exitShip();
                } else {
                    this.showPrompt('Land first before exiting! (fly near planet, press ENTER)', 3000);
                }
                break;
                
            case 'landing':
                // Wait for landing to complete
                break;
        }
    }
    
    /**
     * Board a ship
     */
    boardShip(shipData) {
        console.log(`🚀 Boarding ${shipData.name}...`);
        
        this.state = 'boarding';
        this.currentShip = shipData;
        
        // Hide player mesh
        if (this.playerMesh) {
            this.playerMesh.visible = false;
        }
        
        // Disable player controller
        if (this.playerController) {
            this.playerController.enabled = false;
        }
        
        // Animate boarding sequence
        this.playBoardingAnimation(() => {
            this.state = 'in_ship';
            this.showShipStatus();
            
            // Show controls hint
            this.showPrompt('🚀 Ship controls: WASD to fly, E to exit (when landed)', 5000);
            
            if (this.onEnterShip) {
                this.onEnterShip(shipData);
            }
            
            console.log(`✅ Now piloting ${shipData.name}`);
        });
    }
    
    /**
     * Exit ship after landing
     */
    exitShip() {
        if (!this.currentShip || !this.isLanded) {
            console.warn('Cannot exit: not landed or no ship');
            return;
        }
        
        console.log(`🚶 Exiting ${this.currentShip.name}...`);
        
        this.state = 'exiting';
        
        // Calculate exit position
        const exitPos = this.currentShip.mesh.position.clone();
        exitPos.add(this.currentShip.exitOffset);
        exitPos.y = this.landingPosition.y || 1; // Ground level
        
        // Play exit animation
        this.playExitAnimation(() => {
            // Show player mesh at exit position
            if (this.playerMesh) {
                this.playerMesh.position.copy(exitPos);
                this.playerMesh.visible = true;
            }
            
            // Update player controller position
            if (this.playerController) {
                this.playerController.setPosition(exitPos.x, exitPos.y, exitPos.z);
                this.playerController.enabled = true;
            }
            
            this.state = 'on_foot';
            this.hideShipStatus();
            
            if (this.onExitShip) {
                this.onExitShip(this.currentShip, exitPos);
            }
            
            console.log(`✅ Exited ship at ${exitPos.x.toFixed(0)}, ${exitPos.y.toFixed(0)}, ${exitPos.z.toFixed(0)}`);
            
            // Keep reference to ship for re-boarding
            // this.currentShip = null; // Don't clear so player can re-board
        });
    }
    
    /**
     * Handle landing on a planet
     */
    land(planetName, landingPosition) {
        if (this.state !== 'in_ship') {
            console.warn('Cannot land: not in ship');
            return;
        }
        
        console.log(`🛬 Landing on ${planetName}...`);
        
        this.state = 'landing';
        this.landedPlanet = planetName;
        this.landingPosition.copy(landingPosition);
        
        // Play landing animation
        this.playLandingAnimation(() => {
            this.isLanded = true;
            this.state = 'in_ship'; // Still in ship, but landed
            
            // Update ship position to landing spot
            if (this.currentShip && this.currentShip.mesh) {
                this.currentShip.mesh.position.copy(landingPosition);
                this.currentShip.mesh.position.y += 2; // Slight hover
            }
            
            this.showPrompt(`Landed on ${planetName}! Press [E] to disembark`, 5000);
            this.updateShipStatus();
            
            if (this.onLand) {
                this.onLand(planetName, landingPosition);
            }
            
            console.log(`✅ Landed on ${planetName}`);
        });
    }
    
    /**
     * Take off from planet
     */
    takeoff() {
        if (!this.isLanded || this.state !== 'in_ship') {
            console.warn('Cannot takeoff: not landed');
            return;
        }
        
        console.log(`🚀 Taking off from ${this.landedPlanet}...`);
        
        this.isLanded = false;
        
        // Play takeoff animation
        this.playTakeoffAnimation(() => {
            this.landedPlanet = null;
            this.landingPosition.set(0, 0, 0);
            
            this.showPrompt('🚀 Launched! Fly to another planet to land', 4000);
            this.updateShipStatus();
            
            if (this.onTakeoff) {
                this.onTakeoff();
            }
        });
    }
    
    /**
     * Animation helpers — annihilate-inspired smooth tweened sequences
     */
    playBoardingAnimation(callback) {
        if (!this.currentShip || !this.currentShip.mesh) {
            setTimeout(() => { if (callback) callback(); }, 500);
            return;
        }
        
        const ship = this.currentShip.mesh;
        const landedPos = ship.position.clone();
        
        // Phase 1: Ship swoops down from above (2s)
        const swoopHeight = 40;
        const swoopOffset = 30;
        ship.position.y += swoopHeight;
        ship.position.z -= swoopOffset;
        const swoopStartRot = -0.3; // nose-down approach angle
        ship.rotation.x = swoopStartRot;
        ship.visible = true;
        
        const swoopDuration = 2000;
        const swoopStart = Date.now();
        this.showPrompt('Ship incoming...', swoopDuration);
        
        const animateSwoop = () => {
            const elapsed = Date.now() - swoopStart;
            const progress = Math.min(elapsed / swoopDuration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            
            ship.position.y = landedPos.y + swoopHeight * (1 - eased);
            ship.position.z = landedPos.z - swoopOffset * (1 - eased);
            ship.rotation.x = swoopStartRot * (1 - eased); // level out
            
            if (progress < 1) {
                requestAnimationFrame(animateSwoop);
            } else {
                ship.position.copy(landedPos);
                ship.rotation.x = 0;
                
                // Phase 2: Player walks to ship and enters (1s)
                this.showPrompt('Boarding...', 1000);
                setTimeout(() => {
                    if (callback) callback();
                }, 1000);
            }
        };
        animateSwoop();
    }
    
    playExitAnimation(callback) {
        if (!this.currentShip || !this.currentShip.mesh) {
            setTimeout(() => { if (callback) callback(); }, 500);
            return;
        }
        
        const ship = this.currentShip.mesh;
        
        // Phase 1: Ramp opens / player steps out (0.8s)
        this.showPrompt('Disembarking...', 800);
        
        setTimeout(() => {
            if (callback) callback();
        }, 800);
    }
    
    playLandingAnimation(callback) {
        const duration = 2000;
        
        // Animate ship descent
        if (this.currentShip && this.currentShip.mesh) {
            const ship = this.currentShip.mesh;
            const startY = ship.position.y;
            const targetY = this.landingPosition.y + 2;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out
                const eased = 1 - Math.pow(1 - progress, 3);
                ship.position.y = startY + (targetY - startY) * eased;
                ship.position.x += (this.landingPosition.x - ship.position.x) * 0.05;
                ship.position.z += (this.landingPosition.z - ship.position.z) * 0.05;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (callback) callback();
                }
            };
            
            animate();
        } else {
            setTimeout(callback, duration);
        }
    }
    
    playTakeoffAnimation(callback) {
        const duration = 1500;
        
        if (this.currentShip && this.currentShip.mesh) {
            const ship = this.currentShip.mesh;
            const startY = ship.position.y;
            const targetY = startY + 50;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease in
                const eased = progress * progress;
                ship.position.y = startY + (targetY - startY) * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (callback) callback();
                }
            };
            
            animate();
        } else {
            setTimeout(callback, duration);
        }
    }
    
    /**
     * UI Methods
     */
    showPrompt(message, autoHideMs = 0) {
        this.interactionPrompt.innerHTML = message;
        this.interactionPrompt.style.display = 'block';
        
        if (autoHideMs > 0) {
            setTimeout(() => this.hidePrompt(), autoHideMs);
        }
    }
    
    hidePrompt() {
        this.interactionPrompt.style.display = 'none';
    }
    
    showShipStatus() {
        if (!this.currentShip) return;
        
        this.updateShipStatus();
        this.shipStatusUI.style.display = 'block';
    }
    
    updateShipStatus() {
        if (!this.currentShip) return;
        
        const ship = this.currentShip;
        const statusIcon = this.isLanded ? '🛬 LANDED' : '🚀 IN FLIGHT';
        const locationText = this.isLanded ? this.landedPlanet : 'Deep Space';
        
        this.shipStatusUI.innerHTML = `
            <div style="font-size: 14px; color: #ffff00; margin-bottom: 10px;">
                ${ship.name}
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Status:</span> 
                <span style="color: ${this.isLanded ? '#00ff00' : '#00aaff'};">${statusIcon}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Location:</span> 
                <span style="color: #fff;">${locationText}</span>
            </div>
            <div style="margin-bottom: 5px;">
                <span style="color: #888;">Hull:</span> 
                <span style="color: #00ff00;">${ship.health}/${ship.maxHealth}</span>
            </div>
            <div style="margin-bottom: 10px;">
                <span style="color: #888;">Fuel:</span> 
                <span style="color: #ffaa00;">${ship.fuel}%</span>
            </div>
            <div style="font-size: 10px; color: #666; border-top: 1px solid #333; padding-top: 8px;">
                ${this.isLanded ? '[E] Disembark' : '[WASD] Fly [Enter near planet] Land'}
            </div>
        `;
    }
    
    hideShipStatus() {
        this.shipStatusUI.style.display = 'none';
    }
    
    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            isInShip: this.state === 'in_ship' || this.state === 'boarding',
            isLanded: this.isLanded,
            currentShip: this.currentShip,
            landedPlanet: this.landedPlanet,
            nearbyShip: this.nearbyShip
        };
    }
    
    /**
     * Update - call every frame
     */
    update(playerPosition) {
        if (this.state === 'on_foot' && playerPosition) {
            this.checkNearbyShips(playerPosition);
        }
        
        // Update ship status UI periodically
        if (this.state === 'in_ship' && this.currentShip) {
            this.updateShipStatus();
        }
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this.interactionPrompt && this.interactionPrompt.parentNode) {
            this.interactionPrompt.parentNode.removeChild(this.interactionPrompt);
        }
        if (this.shipStatusUI && this.shipStatusUI.parentNode) {
            this.shipStatusUI.parentNode.removeChild(this.shipStatusUI);
        }
        this.ships.clear();
    }
}

export default ShipInteractionSystem;

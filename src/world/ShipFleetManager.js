import * as THREE from 'three';
import { HDAssetLoader } from '../loaders/HDAssetLoader.js';

/**
 * Ship Fleet Manager
 * Handles different ship types with unique characteristics
 */
export class ShipFleetManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.hdLoader = new HDAssetLoader(renderer);
        
        // Ship registry
        this.ships = new Map();
        this.shipTypes = new Map();
        this.activeShip = null;
        
        this.initializeShipTypes();
        console.log('🚁 Ship Fleet Manager initialized');
    }

    initializeShipTypes() {
        // Define different ship classes
        this.shipTypes.set('fighter', {
            name: 'X-Wing Fighter',
            model: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Draco/FlightHelmet.gltf',
            scale: [3, 3, 3],
            maxSpeed: 80,
            acceleration: 3,
            maneuverability: 0.05,
            shields: 100,
            weapons: ['laser_cannon', 'proton_torpedo'],
            description: 'Fast and agile starfighter'
        });

        this.shipTypes.set('transport', {
            name: 'YT-1300 Freighter',
            model: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Draco/BoomBox.gltf',
            scale: [8, 8, 8],
            maxSpeed: 45,
            acceleration: 1.5,
            maneuverability: 0.02,
            shields: 200,
            cargo: 100,
            weapons: ['quad_laser'],
            description: 'Reliable cargo transport'
        });

        this.shipTypes.set('interceptor', {
            name: 'TIE Interceptor',
            model: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Draco/AntiqueCamera.gltf',
            scale: [4, 4, 4],
            maxSpeed: 100,
            acceleration: 4,
            maneuverability: 0.08,
            shields: 50,
            weapons: ['twin_laser'],
            description: 'Ultra-fast imperial fighter'
        });

        this.shipTypes.set('bomber', {
            name: 'Y-Wing Bomber',
            model: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Draco/WaterBottle.gltf',
            scale: [6, 6, 6],
            maxSpeed: 35,
            acceleration: 1,
            maneuverability: 0.015,
            shields: 150,
            weapons: ['ion_cannon', 'proton_bomb'],
            description: 'Heavy assault bomber'
        });

        console.log(`⚡ Initialized ${this.shipTypes.size} ship classes`);
    }

    /**
     * Spawn a ship of specified type
     */
    async spawnShip(shipId, shipType, position = [0, 0, 0]) {
        if (!this.shipTypes.has(shipType)) {
            console.error(`Unknown ship type: ${shipType}`);
            return null;
        }

        const shipData = this.shipTypes.get(shipType);
        console.log(`🚀 Spawning ${shipData.name}...`);

        try {
            const shipModel = await this.hdLoader.loadModel(shipData.model, {
                scale: shipData.scale,
                castShadow: true,
                receiveShadow: true
            });

            // Ship properties
            shipModel.shipData = { ...shipData };
            shipModel.shipId = shipId;
            shipModel.position.set(...position);
            shipModel.name = `${shipType}_${shipId}`;

            // Add ship systems
            this.addShipSystems(shipModel, shipData);

            this.ships.set(shipId, shipModel);
            this.scene.add(shipModel);

            console.log(`✅ ${shipData.name} spawned successfully`);
            return shipModel;

        } catch (error) {
            console.error(`Failed to spawn ${shipData.name}:`, error);
            return this.createFallbackShip(shipId, shipType, position);
        }
    }

    addShipSystems(ship, shipData) {
        // Engine systems
        this.addEngineSystem(ship, shipData);
        
        // Weapon systems
        this.addWeaponSystems(ship, shipData);
        
        // Shield system
        this.addShieldSystem(ship, shipData);
        
        // Navigation system
        this.addNavigationSystem(ship);
    }

    addEngineSystem(ship, shipData) {
        const engineGroup = new THREE.Group();
        engineGroup.name = 'EngineSystem';

        // Create engine effects based on ship type
        let engineCount = shipData.name.includes('TIE') ? 1 : 2;
        
        for (let i = 0; i < engineCount; i++) {
            const engineGeometry = new THREE.ConeGeometry(0.8, 4, 8);
            const engineMaterial = new THREE.MeshBasicMaterial({
                color: shipData.name.includes('TIE') ? 0x00ff00 : 0x00aaff,
                transparent: true,
                opacity: 0.8
            });

            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.rotation.x = Math.PI;
            
            if (engineCount === 1) {
                engine.position.set(0, 0, -6);
            } else {
                engine.position.set(i === 0 ? -3 : 3, -0.5, -6);
            }

            engineGroup.add(engine);
        }

        ship.add(engineGroup);
        ship.engineSystem = engineGroup;
    }

    addWeaponSystems(ship, shipData) {
        const weaponGroup = new THREE.Group();
        weaponGroup.name = 'WeaponSystem';

        shipData.weapons.forEach((weaponType, index) => {
            const weaponMount = this.createWeaponMount(weaponType, index);
            weaponGroup.add(weaponMount);
        });

        ship.add(weaponGroup);
        ship.weaponSystem = weaponGroup;
    }

    createWeaponMount(weaponType, index) {
        const mountGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        const mountMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const mount = new THREE.Mesh(mountGeometry, mountMaterial);

        // Position based on weapon type and index
        switch (weaponType) {
            case 'laser_cannon':
                mount.position.set(index % 2 === 0 ? -2 : 2, -0.5, 2);
                break;
            case 'quad_laser':
                mount.position.set(0, 1, 0);
                break;
            case 'twin_laser':
                mount.position.set(index % 2 === 0 ? -1 : 1, 0, 1);
                break;
            default:
                mount.position.set(0, 0, 0);
        }

        mount.weaponType = weaponType;
        return mount;
    }

    addShieldSystem(ship, shipData) {
        // Create shield bubble (invisible until hit)
        const shieldGeometry = new THREE.SphereGeometry(8, 16, 12);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.name = 'ShieldBubble';
        ship.add(shield);

        ship.shieldSystem = {
            bubble: shield,
            maxShields: shipData.shields,
            currentShields: shipData.shields,
            rechargeRate: 2
        };
    }

    addNavigationSystem(ship) {
        // Add navigation lights
        const navLights = new THREE.Group();
        
        // Red port light
        const portLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000 })
        );
        portLight.position.set(-4, 0, 0);
        
        // Green starboard light
        const starboardLight = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00ff00 })
        );
        starboardLight.position.set(4, 0, 0);
        
        navLights.add(portLight);
        navLights.add(starboardLight);
        navLights.name = 'NavigationLights';
        
        ship.add(navLights);
        ship.navigationSystem = navLights;
    }

    /**
     * Activate ship for player control
     */
    setActiveShip(shipId) {
        const ship = this.ships.get(shipId);
        if (!ship) {
            console.error(`Ship ${shipId} not found`);
            return false;
        }

        this.activeShip = ship;
        console.log(`🎮 Now piloting: ${ship.shipData.name}`);
        this.showShipInterface(ship);
        return true;
    }

    showShipInterface(ship) {
        // Remove existing interface
        const existingInterface = document.getElementById('ship-interface');
        if (existingInterface) {
            document.body.removeChild(existingInterface);
        }

        const shipInterface = document.createElement('div');
        shipInterface.id = 'ship-interface';
        shipInterface.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 20, 50, 0.9);
                color: #00ffff;
                padding: 20px;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border: 2px solid #00ffff;
                min-width: 250px;
            ">
                <h3 style="margin-top: 0; color: #ffff00;">🚀 ${ship.shipData.name}</h3>
                <div style="margin: 10px 0;">
                    <div>Shields: <span id="shield-bar" style="color: #00ff00;">${ship.shieldSystem.currentShields}/${ship.shieldSystem.maxShields}</span></div>
                    <div>Speed: <span id="speed-display">0</span>/${ship.shipData.maxSpeed}</div>
                    <div>Weapons: ${ship.shipData.weapons.join(', ')}</div>
                </div>
                <div style="font-size: 10px; opacity: 0.7; margin-top: 15px;">
                    <div>CONTROLS:</div>
                    <div>WASD - Movement</div>
                    <div>Q/E - Roll</div>
                    <div>SPACE - Fire weapons</div>
                    <div>TAB - Switch ships</div>
                </div>
            </div>
        `;

        document.body.appendChild(shipInterface);
    }

    /**
     * Update ship physics and systems
     */
    updateShip(ship, deltaTime, inputKeys) {
        if (!ship || !ship.shipData) return;

        // Update shield recharge
        if (ship.shieldSystem.currentShields < ship.shieldSystem.maxShields) {
            ship.shieldSystem.currentShields += ship.shieldSystem.rechargeRate * deltaTime;
            ship.shieldSystem.currentShields = Math.min(
                ship.shieldSystem.currentShields, 
                ship.shieldSystem.maxShields
            );
        }

        // Update engine effects based on thrust
        if (ship.engineSystem) {
            ship.engineSystem.children.forEach(engine => {
                if (inputKeys.KeyW) {
                    engine.material.opacity = 0.9;
                    engine.scale.y = 1.5;
                } else {
                    engine.material.opacity = 0.3;
                    engine.scale.y = 1;
                }
            });
        }

        // Update navigation lights blinking
        if (ship.navigationSystem) {
            const time = Date.now() * 0.001;
            ship.navigationSystem.children.forEach((light, index) => {
                light.material.opacity = 0.5 + Math.sin(time * 3 + index) * 0.5;
            });
        }
    }

    /**
     * Fire weapons from active ship
     */
    fireWeapons() {
        if (!this.activeShip || !this.activeShip.weaponSystem) return;

        console.log('🔫 Firing weapons!');
        
        this.activeShip.weaponSystem.children.forEach(weapon => {
            this.createLaserBolt(weapon.getWorldPosition(new THREE.Vector3()), this.activeShip);
        });
    }

    createLaserBolt(startPosition, sourceShip) {
        const boltGeometry = new THREE.SphereGeometry(0.1, 6, 4);
        const boltMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000
        });

        const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
        bolt.position.copy(startPosition);

        // Set velocity in ship's forward direction
        const direction = sourceShip.getWorldDirection(new THREE.Vector3());
        bolt.velocity = direction.multiplyScalar(100);

        this.scene.add(bolt);

        // Remove bolt after 3 seconds
        setTimeout(() => {
            this.scene.remove(bolt);
            bolt.geometry.dispose();
            bolt.material.dispose();
        }, 3000);

        // Store for collision detection
        bolt.isLaserBolt = true;
        bolt.sourceShip = sourceShip;
    }

    /**
     * Get all available ships
     */
    getShipList() {
        const shipList = [];
        this.ships.forEach((ship, id) => {
            shipList.push({
                id: id,
                name: ship.shipData.name,
                type: ship.shipData.description,
                active: ship === this.activeShip
            });
        });
        return shipList;
    }

    /**
     * Switch to next ship
     */
    switchShip() {
        const shipIds = Array.from(this.ships.keys());
        if (shipIds.length === 0) return;

        const currentIndex = this.activeShip ? 
            shipIds.indexOf(this.activeShip.shipId) : -1;
        const nextIndex = (currentIndex + 1) % shipIds.length;
        
        this.setActiveShip(shipIds[nextIndex]);
    }

    createFallbackShip(shipId, shipType, position) {
        console.log(`🔧 Creating fallback ship for ${shipType}`);
        
        const ship = new THREE.Group();
        
        // Basic ship shape
        const bodyGeometry = new THREE.BoxGeometry(4, 1, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        ship.add(body);

        // Apply ship data
        const shipData = this.shipTypes.get(shipType);
        ship.shipData = { ...shipData };
        ship.shipId = shipId;
        ship.position.set(...position);

        this.addShipSystems(ship, shipData);
        this.ships.set(shipId, ship);
        this.scene.add(ship);

        return ship;
    }

    dispose() {
        this.ships.forEach(ship => {
            this.scene.remove(ship);
        });
        this.ships.clear();
        
        const shipInterface = document.getElementById('ship-interface');
        if (shipInterface) {
            document.body.removeChild(shipInterface);
        }
        
        console.log('🧹 Ship Fleet Manager disposed');
    }
}
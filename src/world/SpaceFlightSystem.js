import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Space Flight System - Epic space travel with multiple ships
 * Based on the Desert Dunes Explorer design
 */
export class SpaceFlightSystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // Flight data
        this.flightData = {
            speed: 0,
            altitude: 0,
            heading: 0,
            boostEnergy: 100,
            isBoosting: false,
            targetSpeed: 0,
            maxSpeed: 2000, // km/h
            boostMultiplier: 2.5
        };
        
        // Ship management - procedural ships, no broken URLs!
        this.currentShip = null;
        this.availableShips = [
            { id: 'fighter', name: 'Fighter', type: 'fighter', bodyColor: 0x4488ff, wingColor: 0x2266cc },
            { id: 'bomber', name: 'Bomber', type: 'bomber', bodyColor: 0x888888, wingColor: 0x666666 },
            { id: 'interceptor', name: 'Interceptor', type: 'interceptor', bodyColor: 0xff4444, wingColor: 0xcc2222 },
            { id: 'transport', name: 'Transport', type: 'transport', bodyColor: 0x44aa44, wingColor: 0x338833 }
        ];
        
        // Physics
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.maxAcceleration = 50;
        this.friction = 0.95;
        this.turnSpeed = 2.0;
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            boost: false
        };
        
        // Energy system
        this.boostRegenRate = 0.5; // per frame
        this.boostDrainRate = 2.0; // per frame when boosting
        
        // GLTF Loader
        this.loader = new GLTFLoader();
        
        // Particle effects
        this.engineParticles = null;
        this.createEngineEffects();
        
        console.log('🚀 Space Flight System initialized with', this.availableShips.length, 'ships');
    }
    
    /**
     * Create a procedural spaceship - no external URLs!
     */
    loadSpaceship(shipData) {
        console.log('🛸 Creating spaceship:', shipData.name);
        
        // Remove current ship
        if (this.currentShip) {
            this.camera.remove(this.currentShip);
        }
        
        this.currentShip = this.createProceduralShip(shipData);
        this.currentShip.name = shipData.id;
        this.currentShip.position.set(0, -2, -8);
        this.camera.add(this.currentShip);
        
        console.log('✅ Spaceship created:', shipData.name);
        return this.currentShip;
    }
    
    /**
     * Create a procedural ship mesh
     */
    createProceduralShip(shipData) {
        const ship = new THREE.Group();
        const bodyColor = shipData.bodyColor || 0x4488ff;
        const wingColor = shipData.wingColor || 0x2266cc;
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.2, 2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: bodyColor, metalness: 0.7, roughness: 0.3 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        ship.add(body);
        
        // Cockpit
        const cockpitGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const cockpitMat = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, metalness: 0.9, roughness: 0.1,
            emissive: 0x00ffff, emissiveIntensity: 0.2
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 0.2, -0.6);
        cockpit.scale.set(1, 0.6, 1);
        ship.add(cockpit);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(3, 0.05, 0.8);
        const wingMat = new THREE.MeshStandardMaterial({ color: wingColor, metalness: 0.6, roughness: 0.4 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.castShadow = true;
        ship.add(wings);
        
        // Engines
        const engineGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
        const engineMat = new THREE.MeshStandardMaterial({ 
            color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 0.6 
        });
        
        const leftEngine = new THREE.Mesh(engineGeo, engineMat);
        leftEngine.position.set(-0.5, -0.1, 0.8);
        leftEngine.rotation.x = Math.PI / 2;
        ship.add(leftEngine);
        
        const rightEngine = new THREE.Mesh(engineGeo, engineMat);
        rightEngine.position.set(0.5, -0.1, 0.8);
        rightEngine.rotation.x = Math.PI / 2;
        ship.add(rightEngine);
        
        return ship;
    }
    
    /**
     * Create engine particle effects
     */
    createEngineEffects() {
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            // Start behind ship
            positions[i] = (Math.random() - 0.5) * 2;     // x
            positions[i + 1] = (Math.random() - 0.5) * 2; // y
            positions[i + 2] = Math.random() * -20 - 5;    // z (behind ship)
            
            velocities[i] = 0;
            velocities[i + 1] = 0;
            velocities[i + 2] = -Math.random() * 5 - 2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x4af4ff,
            size: 0.3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.engineParticles = new THREE.Points(particles, material);
        this.camera.add(this.engineParticles);
        this.engineParticles.position.set(0, -2, -8);
    }
    
    /**
     * Update flight physics and movement
     */
    update(deltaTime, inputKeys = {}) {
        // Update key states
        this.keys = { ...this.keys, ...inputKeys };
        
        // Handle boost energy
        if (this.keys.boost && this.flightData.boostEnergy > 0) {
            this.flightData.isBoosting = true;
            this.flightData.boostEnergy -= this.boostDrainRate;
            if (this.flightData.boostEnergy < 0) this.flightData.boostEnergy = 0;
        } else {
            this.flightData.isBoosting = false;
            this.flightData.boostEnergy += this.boostRegenRate;
            if (this.flightData.boostEnergy > 100) this.flightData.boostEnergy = 100;
        }
        
        // Calculate target speed based on input
        let targetSpeed = 0;
        if (this.keys.forward) targetSpeed = this.flightData.maxSpeed;
        if (this.keys.backward) targetSpeed = -this.flightData.maxSpeed * 0.5;
        
        // Apply boost
        if (this.flightData.isBoosting) {
            targetSpeed *= this.flightData.boostMultiplier;
        }
        
        // Smooth speed interpolation
        this.flightData.targetSpeed = targetSpeed;
        this.flightData.speed += (targetSpeed - this.flightData.speed) * deltaTime * 3;
        
        // Convert speed to world units (simplified)
        const speedInUnits = this.flightData.speed * deltaTime * 0.01;
        
        // Movement vector
        const movement = new THREE.Vector3(0, 0, -speedInUnits);
        
        // Turning
        let turnAmount = 0;
        if (this.keys.left) turnAmount += this.turnSpeed * deltaTime;
        if (this.keys.right) turnAmount -= this.turnSpeed * deltaTime;
        
        // Vertical movement
        let pitchAmount = 0;
        if (this.keys.up) pitchAmount += this.turnSpeed * deltaTime * 0.5;
        if (this.keys.down) pitchAmount -= this.turnSpeed * deltaTime * 0.5;
        
        // Apply rotations to camera (first-person flight)
        this.camera.rotation.y += turnAmount;
        this.camera.rotation.x += pitchAmount;
        
        // Clamp pitch to prevent over-rotation
        this.camera.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.camera.rotation.x));
        
        // Move camera forward in its facing direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        forward.multiplyScalar(speedInUnits);
        this.camera.position.add(forward);
        
        // Update flight data
        this.flightData.altitude = this.camera.position.y;
        this.flightData.heading = (this.camera.rotation.y * 180 / Math.PI + 360) % 360;
        
        // Update engine particles
        this.updateEngineParticles(deltaTime);
        
        // Ship banking effect
        if (this.currentShip) {
            this.currentShip.rotation.z = -turnAmount * 3; // Bank into turns
            this.currentShip.rotation.x = -pitchAmount * 2; // Pitch with vertical movement
        }
    }
    
    /**
     * Update engine particle effects
     */
    updateEngineParticles(deltaTime) {
        if (!this.engineParticles) return;
        
        const positions = this.engineParticles.geometry.attributes.position.array;
        const velocities = this.engineParticles.geometry.attributes.velocity.array;
        
        const speedFactor = Math.abs(this.flightData.speed) / this.flightData.maxSpeed;
        const boostFactor = this.flightData.isBoosting ? 2.0 : 1.0;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Update positions
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime * speedFactor * boostFactor;
            
            // Reset particles that are too far
            if (positions[i + 2] < -30) {
                positions[i] = (Math.random() - 0.5) * 2;
                positions[i + 1] = (Math.random() - 0.5) * 2;
                positions[i + 2] = -5;
                
                velocities[i + 2] = -Math.random() * 5 - 2;
            }
        }
        
        this.engineParticles.geometry.attributes.position.needsUpdate = true;
        
        // Change particle color based on boost
        if (this.flightData.isBoosting) {
            this.engineParticles.material.color.setHex(0xff4444);
        } else {
            this.engineParticles.material.color.setHex(0x4af4ff);
        }
    }
    
    /**
     * Get flight data for UI
     */
    getFlightData() {
        return {
            speed: Math.abs(this.flightData.speed),
            altitude: this.flightData.altitude,
            heading: this.flightData.heading,
            boostEnergy: this.flightData.boostEnergy,
            isBoosting: this.flightData.isBoosting
        };
    }
    
    /**
     * Get available ships
     */
    getAvailableShips() {
        return this.availableShips;
    }
    
    /**
     * Change to a different ship
     */
    async changeShip(shipId) {
        const shipData = this.availableShips.find(ship => ship.id === shipId);
        if (shipData) {
            await this.loadSpaceship(shipData);
            console.log('🛸 Changed to ship:', shipData.name);
            return true;
        }
        return false;
    }
    
    /**
     * Initialize with first ship
     */
    async initialize() {
        if (this.availableShips.length > 0) {
            await this.loadSpaceship(this.availableShips[0]);
            console.log('🚀 Space Flight System ready!');
        }
    }
    
    /**
     * Cleanup
     */
    dispose() {
        if (this.currentShip) {
            this.scene.remove(this.currentShip);
        }
        if (this.engineParticles) {
            this.camera.remove(this.engineParticles);
            this.engineParticles.geometry.dispose();
            this.engineParticles.material.dispose();
        }
    }
}
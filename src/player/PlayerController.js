import * as THREE from 'three';

export class PlayerController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Player state
        this.position = new THREE.Vector3(0, 10, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        
        // Movement settings
        this.speed = 50;
        this.jumpForce = 10;
        this.gravity = -20;
        this.isGrounded = true;
        
        // SWG World Boundaries (16km x 16km total, 15km x 15km playable)
        this.worldBounds = {
            min: -7500, // -7.5km
            max: 7500,  // +7.5km
            warning: -7000 // Start warning at 7km from center
        };
        this.boundaryWarning = false;
        
        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        
        // Player mesh (visual representation)
        this.createPlayerMesh();
        
        // Setup controls
        this.setupControls();
    }
    
    createPlayerMesh() {
        // Simple capsule for player body
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x3388ff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }
    
    setupControls() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space' && this.isGrounded) {
                this.velocity.y = this.jumpForce;
                this.isGrounded = false;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse look
        window.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === document.body;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!this.mouse.locked) return;
            
            const sensitivity = 0.002;
            this.rotation.y -= e.movementX * sensitivity;
            this.rotation.x -= e.movementY * sensitivity;
            
            // Clamp vertical rotation
            this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        });
    }
    
    update(delta) {
        // Movement input
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        forward.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        right.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        const moveDir = new THREE.Vector3(0, 0, 0);
        
        if (this.keys['KeyW']) moveDir.add(forward);
        if (this.keys['KeyS']) moveDir.sub(forward);
        if (this.keys['KeyA']) moveDir.sub(right);
        if (this.keys['KeyD']) moveDir.add(right);
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            this.velocity.x = moveDir.x * this.speed;
            this.velocity.z = moveDir.z * this.speed;
        } else {
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * delta;
        }
        
        // Update position
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.position.z += this.velocity.z * delta;
        
        // Enforce world boundaries
        this.enforceBoundaries();
        
        // Ground collision (simplified)
        if (this.position.y < 10) {
            this.position.y = 10;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Update camera
        this.camera.position.copy(this.position);
        this.camera.rotation.copy(this.rotation);
        
        // Update player mesh (slightly behind camera for third-person view if needed)
        this.mesh.position.copy(this.position);
    }
    
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.camera.position.copy(this.position);
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    enforceBoundaries() {
        const { min, max, warning } = this.worldBounds;
        
        // Check if approaching boundary (for warning)
        const distX = Math.abs(this.position.x);
        const distZ = Math.abs(this.position.z);
        const atWarningZone = distX > Math.abs(warning) || distZ > Math.abs(warning);
        
        if (atWarningZone && !this.boundaryWarning) {
            console.warn('Approaching world boundary!');
            this.boundaryWarning = true;
        } else if (!atWarningZone && this.boundaryWarning) {
            this.boundaryWarning = false;
        }
        
        // Hard clamp at boundary
        if (this.position.x < min) {
            this.position.x = min;
            this.velocity.x = 0;
        } else if (this.position.x > max) {
            this.position.x = max;
            this.velocity.x = 0;
        }
        
        if (this.position.z < min) {
            this.position.z = min;
            this.velocity.z = 0;
        } else if (this.position.z > max) {
            this.position.z = max;
            this.velocity.z = 0;
        }
    }
    
    isNearBoundary() {
        return this.boundaryWarning;
    }
}

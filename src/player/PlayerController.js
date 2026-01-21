import * as THREE from 'three';

export class PlayerController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Player state
        this.position = new THREE.Vector3(0, 10, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.rotationSpeed = 8;
        
        // Third-person camera system
        this.cameraDistance = 8;
        this.cameraHeight = 4;
        this.cameraTargetHeight = 2;
        this.cameraTarget = new THREE.Vector3();
        this.cameraPosition = new THREE.Vector3();
        this.mouseSensitivity = 0.002;
        this.cameraRotation = { x: -0.3, y: 0 };
        
        // Movement settings - enhanced for smooth third-person
        this.speed = 25;
        this.runSpeed = 45;
        this.jumpForce = 12;
        this.gravity = -25;
        this.isGrounded = true;
        this.isRunning = false;
        this.acceleration = 8;
        this.deceleration = 12;
        
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
        // Create a more detailed player character
        const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 6, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a90e2,
            metalness: 0.2,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        body.receiveShadow = true;
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 12, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffdbac,
            metalness: 0.1,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        
        // Create player group
        this.mesh = new THREE.Group();
        this.mesh.add(body);
        this.mesh.add(head);
        
        // Add glow effect for visibility
        const glowGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.05;
        this.mesh.add(glow);
        
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
        
        // Third-person camera controls
        window.addEventListener('click', () => {
            document.body.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === document.body;
        });
        
        // Enhanced mouse controls for third-person camera
        window.addEventListener('mousemove', (e) => {
            if (!this.mouse.locked) return;
            
            this.cameraRotation.y -= e.movementX * this.mouseSensitivity;
            this.cameraRotation.x -= e.movementY * this.mouseSensitivity;
            
            // Clamp vertical rotation for third-person view
            this.cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, this.cameraRotation.x));
        });
        
        // Scroll wheel for camera distance
        window.addEventListener('wheel', (e) => {
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(3, Math.min(15, this.cameraDistance));
        });
    }
    
    update(delta) {
        // Enhanced third-person movement
        this.isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const currentSpeed = this.isRunning ? this.runSpeed : this.speed;
        
        // Calculate movement relative to camera direction
        const cameraForward = new THREE.Vector3(0, 0, -1);
        const cameraRight = new THREE.Vector3(1, 0, 0);
        
        cameraForward.applyEuler(new THREE.Euler(0, this.cameraRotation.y, 0));
        cameraRight.applyEuler(new THREE.Euler(0, this.cameraRotation.y, 0));
        
        const inputDir = new THREE.Vector3(0, 0, 0);
        
        if (this.keys['KeyW']) inputDir.add(cameraForward);
        if (this.keys['KeyS']) inputDir.sub(cameraForward);
        if (this.keys['KeyA']) inputDir.sub(cameraRight);
        if (this.keys['KeyD']) inputDir.add(cameraRight);
        
        // Smooth movement with acceleration/deceleration
        if (inputDir.length() > 0) {
            inputDir.normalize();
            
            // Update target rotation to face movement direction
            this.targetRotation = Math.atan2(inputDir.x, inputDir.z);
            
            // Accelerate velocity towards target
            const targetVelX = inputDir.x * currentSpeed;
            const targetVelZ = inputDir.z * currentSpeed;
            
            this.velocity.x += (targetVelX - this.velocity.x) * this.acceleration * delta;
            this.velocity.z += (targetVelZ - this.velocity.z) * this.acceleration * delta;
        } else {
            // Decelerate when no input
            this.velocity.x *= Math.pow(0.1, delta * this.deceleration);
            this.velocity.z *= Math.pow(0.1, delta * this.deceleration);
        }
        
        // Handle jumping
        if (this.keys['Space'] && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Apply gravity
        this.velocity.y += this.gravity * delta;
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Simple ground collision (improve with terrain later)
        if (this.position.y <= 1) {
            this.position.y = 1;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Smooth character rotation
        this.currentRotation += (this.targetRotation - this.currentRotation) * this.rotationSpeed * delta;
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.currentRotation;
        
        // Update third-person camera
        this.updateCamera();
        
    }
    
    updateCamera() {\n        // Calculate third-person camera position\n        this.cameraTarget.copy(this.position);\n        this.cameraTarget.y += this.cameraTargetHeight;\n        \n        // Position camera behind and above player\n        const cameraOffset = new THREE.Vector3(\n            Math.sin(this.cameraRotation.y) * this.cameraDistance,\n            this.cameraHeight + Math.sin(this.cameraRotation.x) * this.cameraDistance * 0.5,\n            Math.cos(this.cameraRotation.y) * this.cameraDistance\n        );\n        \n        this.cameraPosition.copy(this.cameraTarget).add(cameraOffset);\n        \n        // Smooth camera movement\n        this.camera.position.lerp(this.cameraPosition, 0.1);\n        this.camera.lookAt(this.cameraTarget);\n    }\n    \n    setPosition(x, y, z) {\n        this.position.set(x, y, z);\n        this.mesh.position.copy(this.position);\n    }\n    \n    getPosition() {\n        return this.position.clone();\n    }\n    \n    checkWorldBoundaries() {\n        const { min, max, warning } = this.worldBounds;\n        \n        // Check if approaching boundary (for warning)\n        const distX = Math.abs(this.position.x);\n        const distZ = Math.abs(this.position.z);\n        const atWarningZone = distX > Math.abs(warning) || distZ > Math.abs(warning);
        
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

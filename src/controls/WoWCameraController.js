import * as THREE from 'three';

/**
 * WoW-Style Camera Controller
 * 
 * Controls:
 * - LMB Hold: Rotate camera around player (freelook)
 * - A/D: Turn player left/right, camera follows behind
 * - Q/E: Strafe left/right
 * - W/S: Move forward/backward
 * - Tab: Cycle through hostile targets (WoW-style)
 * - Shift+Tab: Cycle backwards
 * - Mouse wheel: Zoom in/out
 */
export class WoWCameraController {
    constructor(camera, character, domElement, options = {}) {
        this.camera = camera;
        this.character = character;
        this.domElement = domElement;
        
        // Configuration
        this.config = {
            // Camera
            cameraDistance: options.cameraDistance || 8,
            cameraHeight: options.cameraHeight || 2.5,
            cameraMinDistance: options.cameraMinDistance || 2,
            cameraMaxDistance: options.cameraMaxDistance || 20,
            cameraSmoothness: options.cameraSmoothness || 0.12,
            cameraRotateSensitivity: options.cameraRotateSensitivity || 0.003,
            cameraPitchMin: options.cameraPitchMin || -0.5,
            cameraPitchMax: options.cameraPitchMax || 1.2,
            
            // Movement
            moveSpeed: options.moveSpeed || 6,
            runSpeed: options.runSpeed || 12,
            backpedalSpeed: options.backpedalSpeed || 3,
            strafeSpeed: options.strafeSpeed || 5,
            turnSpeed: options.turnSpeed || 3.0, // Radians per second
            
            // Physics
            jumpForce: options.jumpForce || 8,
            gravity: options.gravity || 20
        };
        
        // Camera state
        this.cameraYaw = 0; // Horizontal rotation around player
        this.cameraPitch = 0.3; // Vertical tilt
        this.cameraDistance = this.config.cameraDistance;
        this.cameraTargetPos = new THREE.Vector3();
        this.cameraCurrentPos = new THREE.Vector3();
        
        // Character state
        this.characterYaw = 0; // Character facing direction
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.isMoving = false;
        this.isRunning = false;
        
        // Input state
        this.input = {
            forward: false,
            backward: false,
            turnLeft: false,
            turnRight: false,
            strafeLeft: false,
            strafeRight: false,
            run: false,
            jump: false
        };
        
        // Mouse state
        this.mouse = {
            lmbDown: false,
            rmbDown: false,
            lastX: 0,
            lastY: 0
        };
        
        // Callbacks
        this.onTargetCycle = null; // Called when Tab is pressed
        this.onAnimationChange = null; // Called when movement state changes
        
        this._boundHandlers = {};
        this.setupInput();
        
        console.log('🎮 WoW Camera Controller initialized');
        console.log('   W/S - Forward/Back | A/D - Turn | Q/E - Strafe');
        console.log('   LMB Hold - Rotate Camera | Tab - Cycle Targets');
    }
    
    setupInput() {
        // Keyboard
        this._boundHandlers.keydown = this.onKeyDown.bind(this);
        this._boundHandlers.keyup = this.onKeyUp.bind(this);
        document.addEventListener('keydown', this._boundHandlers.keydown);
        document.addEventListener('keyup', this._boundHandlers.keyup);
        
        // Mouse
        this._boundHandlers.mousedown = this.onMouseDown.bind(this);
        this._boundHandlers.mouseup = this.onMouseUp.bind(this);
        this._boundHandlers.mousemove = this.onMouseMove.bind(this);
        this._boundHandlers.wheel = this.onWheel.bind(this);
        this._boundHandlers.contextmenu = (e) => e.preventDefault();
        
        this.domElement.addEventListener('mousedown', this._boundHandlers.mousedown);
        this.domElement.addEventListener('mouseup', this._boundHandlers.mouseup);
        this.domElement.addEventListener('mousemove', this._boundHandlers.mousemove);
        this.domElement.addEventListener('wheel', this._boundHandlers.wheel);
        this.domElement.addEventListener('contextmenu', this._boundHandlers.contextmenu);
        
        // Handle mouse leaving window
        document.addEventListener('mouseup', this._boundHandlers.mouseup);
    }
    
    onKeyDown(e) {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.code) {
            // Movement
            case 'KeyW':
            case 'ArrowUp':
                this.input.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.input.backward = true;
                break;
                
            // Turn (A/D)
            case 'KeyA':
            case 'ArrowLeft':
                this.input.turnLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.input.turnRight = true;
                break;
                
            // Strafe (Q/E)
            case 'KeyQ':
                this.input.strafeLeft = true;
                break;
            case 'KeyE':
                this.input.strafeRight = true;
                break;
                
            // Modifiers
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.run = true;
                break;
            case 'Space':
                if (!e.repeat) {
                    this.input.jump = true;
                }
                break;
                
            // Tab targeting
            case 'Tab':
                e.preventDefault();
                if (this.onTargetCycle) {
                    this.onTargetCycle(e.shiftKey ? -1 : 1);
                }
                break;
        }
    }
    
    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.input.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.input.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.input.turnLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.input.turnRight = false;
                break;
            case 'KeyQ':
                this.input.strafeLeft = false;
                break;
            case 'KeyE':
                this.input.strafeRight = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.run = false;
                break;
            case 'Space':
                this.input.jump = false;
                break;
        }
    }
    
    onMouseDown(e) {
        if (e.button === 0) { // LMB
            this.mouse.lmbDown = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        } else if (e.button === 2) { // RMB
            this.mouse.rmbDown = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        }
    }
    
    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.lmbDown = false;
        } else if (e.button === 2) {
            this.mouse.rmbDown = false;
        }
    }
    
    onMouseMove(e) {
        // LMB held = rotate camera around player (freelook)
        if (this.mouse.lmbDown) {
            const deltaX = e.clientX - this.mouse.lastX;
            const deltaY = e.clientY - this.mouse.lastY;
            
            // Rotate camera yaw (horizontal)
            this.cameraYaw -= deltaX * this.config.cameraRotateSensitivity;
            
            // Rotate camera pitch (vertical)
            this.cameraPitch += deltaY * this.config.cameraRotateSensitivity;
            this.cameraPitch = THREE.MathUtils.clamp(
                this.cameraPitch,
                this.config.cameraPitchMin,
                this.config.cameraPitchMax
            );
        }
        
        // RMB held = rotate both camera AND character
        if (this.mouse.rmbDown) {
            const deltaX = e.clientX - this.mouse.lastX;
            const deltaY = e.clientY - this.mouse.lastY;
            
            // Rotate both camera and character
            this.cameraYaw -= deltaX * this.config.cameraRotateSensitivity;
            this.characterYaw -= deltaX * this.config.cameraRotateSensitivity;
            
            // Pitch only affects camera
            this.cameraPitch += deltaY * this.config.cameraRotateSensitivity;
            this.cameraPitch = THREE.MathUtils.clamp(
                this.cameraPitch,
                this.config.cameraPitchMin,
                this.config.cameraPitchMax
            );
        }
        
        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
    }
    
    onWheel(e) {
        this.cameraDistance += e.deltaY * 0.01;
        this.cameraDistance = THREE.MathUtils.clamp(
            this.cameraDistance,
            this.config.cameraMinDistance,
            this.config.cameraMaxDistance
        );
    }
    
    /**
     * Update character movement
     */
    updateMovement(deltaTime) {
        const wasMoving = this.isMoving;
        const wasRunning = this.isRunning;
        
        // Handle turning with A/D keys
        if (this.input.turnLeft && !this.mouse.lmbDown) {
            this.characterYaw += this.config.turnSpeed * deltaTime;
        }
        if (this.input.turnRight && !this.mouse.lmbDown) {
            this.characterYaw -= this.config.turnSpeed * deltaTime;
        }
        
        // Calculate movement direction
        const moveDir = new THREE.Vector3();
        
        // Forward/Back relative to character facing
        if (this.input.forward) {
            moveDir.z = -1;
        }
        if (this.input.backward) {
            moveDir.z = 1;
        }
        
        // Strafe relative to character facing
        if (this.input.strafeLeft) {
            moveDir.x = -1;
        }
        if (this.input.strafeRight) {
            moveDir.x = 1;
        }
        
        // When moving with LMB camera rotation, auto-face camera direction
        if (this.mouse.lmbDown && (this.input.forward || this.input.strafeLeft || this.input.strafeRight)) {
            // Face camera direction while LMB moving
            const targetYaw = this.cameraYaw;
            this.characterYaw = THREE.MathUtils.lerp(
                this.characterYaw,
                targetYaw,
                10 * deltaTime
            );
        }
        
        // Apply movement
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            
            // Rotate movement by character yaw
            const rotatedDir = new THREE.Vector3(
                moveDir.x * Math.cos(this.characterYaw) - moveDir.z * Math.sin(this.characterYaw),
                0,
                moveDir.x * Math.sin(this.characterYaw) + moveDir.z * Math.cos(this.characterYaw)
            );
            
            // Determine speed
            let speed = this.config.moveSpeed;
            this.isRunning = this.input.run && this.input.forward;
            
            if (this.isRunning) {
                speed = this.config.runSpeed;
            } else if (this.input.backward && !this.input.forward) {
                speed = this.config.backpedalSpeed;
            } else if ((this.input.strafeLeft || this.input.strafeRight) && !this.input.forward) {
                speed = this.config.strafeSpeed;
            }
            
            // Apply velocity
            this.velocity.x = rotatedDir.x * speed;
            this.velocity.z = rotatedDir.z * speed;
            this.isMoving = true;
        } else {
            // Decelerate
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
            this.isMoving = false;
            this.isRunning = false;
        }
        
        // Jump
        if (this.input.jump && this.isGrounded) {
            this.velocity.y = this.config.jumpForce;
            this.isGrounded = false;
            this.input.jump = false;
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y -= this.config.gravity * deltaTime;
        }
        
        // Apply velocity to character
        this.character.position.x += this.velocity.x * deltaTime;
        this.character.position.y += this.velocity.y * deltaTime;
        this.character.position.z += this.velocity.z * deltaTime;
        
        // Update character rotation
        this.character.rotation.y = this.characterYaw;
        
        // Fire animation change callback if state changed
        if (this.onAnimationChange && (wasMoving !== this.isMoving || wasRunning !== this.isRunning)) {
            this.onAnimationChange(this.getMovementState());
        }
        
        return {
            position: this.character.position.clone(),
            velocity: this.velocity.clone(),
            isMoving: this.isMoving,
            isRunning: this.isRunning,
            isGrounded: this.isGrounded
        };
    }
    
    /**
     * Update camera position to follow behind character
     */
    updateCamera(deltaTime) {
        // When not holding LMB, camera snaps behind character
        if (!this.mouse.lmbDown && !this.mouse.rmbDown) {
            // Smoothly rotate camera yaw to match character facing
            const yawDiff = this.characterYaw - this.cameraYaw;
            
            // Normalize angle difference
            let normalizedDiff = yawDiff;
            while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
            while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
            
            // Lerp camera behind character
            if (this.isMoving || Math.abs(normalizedDiff) > 0.1) {
                this.cameraYaw += normalizedDiff * 5 * deltaTime;
            }
        }
        
        // Calculate camera look target (character's chest)
        const lookTarget = new THREE.Vector3(
            this.character.position.x,
            this.character.position.y + 1.5,
            this.character.position.z
        );
        
        // Calculate ideal camera position
        const cameraOffset = new THREE.Vector3(
            Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance,
            Math.sin(this.cameraPitch) * this.cameraDistance + this.config.cameraHeight,
            Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance
        );
        
        this.cameraTargetPos.copy(lookTarget).add(cameraOffset);
        
        // Smooth camera position
        this.cameraCurrentPos.lerp(this.cameraTargetPos, this.config.cameraSmoothness);
        
        this.camera.position.copy(this.cameraCurrentPos);
        this.camera.lookAt(lookTarget);
    }
    
    /**
     * Apply terrain height
     */
    setGroundHeight(height) {
        if (this.character.position.y <= height + 0.1) {
            this.character.position.y = height;
            this.velocity.y = Math.max(0, this.velocity.y);
            this.isGrounded = true;
        } else if (this.character.position.y > height + 0.5) {
            this.isGrounded = false;
        }
    }
    
    /**
     * Get current movement state for animation controller
     */
    getMovementState() {
        if (!this.isMoving) return 'idle';
        if (this.input.backward && !this.input.forward) return 'walkBack';
        if (this.isRunning) return 'run';
        if (this.input.strafeLeft) return 'strafeLeft';
        if (this.input.strafeRight) return 'strafeRight';
        return 'walk';
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, terrainHeightFn = null) {
        // Update movement
        const movementData = this.updateMovement(deltaTime);
        
        // Apply terrain height
        if (terrainHeightFn) {
            const groundY = terrainHeightFn(this.character.position.x, this.character.position.z);
            this.setGroundHeight(groundY);
        }
        
        // Update camera
        this.updateCamera(deltaTime);
        
        return movementData;
    }
    
    /**
     * Set character position
     */
    setPosition(x, y, z) {
        this.character.position.set(x, y, z);
        this.velocity.set(0, 0, 0);
        
        // Reset camera to behind character
        this.cameraCurrentPos.set(
            x + Math.sin(this.characterYaw) * this.cameraDistance,
            y + this.config.cameraHeight + 2,
            z + Math.cos(this.characterYaw) * this.cameraDistance
        );
    }
    
    /**
     * Set target cycling callback
     */
    setTargetCycleCallback(callback) {
        this.onTargetCycle = callback;
    }
    
    /**
     * Set animation change callback
     */
    setAnimationCallback(callback) {
        this.onAnimationChange = callback;
    }
    
    /**
     * Cleanup
     */
    dispose() {
        document.removeEventListener('keydown', this._boundHandlers.keydown);
        document.removeEventListener('keyup', this._boundHandlers.keyup);
        document.removeEventListener('mouseup', this._boundHandlers.mouseup);
        
        this.domElement.removeEventListener('mousedown', this._boundHandlers.mousedown);
        this.domElement.removeEventListener('mouseup', this._boundHandlers.mouseup);
        this.domElement.removeEventListener('mousemove', this._boundHandlers.mousemove);
        this.domElement.removeEventListener('wheel', this._boundHandlers.wheel);
        this.domElement.removeEventListener('contextmenu', this._boundHandlers.contextmenu);
    }
}

export default WoWCameraController;

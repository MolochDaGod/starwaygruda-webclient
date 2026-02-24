import * as THREE from 'three';

/**
 * MMO-Style Third Person Controller
 * 
 * Controls:
 * - W/S: Move forward/backward relative to camera
 * - A/D/Q/E: Strafe left/right
 * - RMB Hold: Rotate camera freely
 * - RMB Released: Camera auto-follows behind character
 * - LMB: Attack (melee or ranged)
 * - LMB+RMB: Auto-run forward
 * - Tab: Cycle through targets
 * - Shift: Run
 * - Space: Jump
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
            cameraHeight: options.cameraHeight || 2.0,
            cameraMinDistance: options.cameraMinDistance || 2,
            cameraMaxDistance: options.cameraMaxDistance || 20,
            cameraFollowSpeed: options.cameraFollowSpeed || 3.0,
            cameraRotateSensitivity: options.cameraRotateSensitivity || 0.004,
            cameraPitchMin: options.cameraPitchMin || -0.3,
            cameraPitchMax: options.cameraPitchMax || 1.0,
            
            // Movement
            moveSpeed: options.moveSpeed || 6,
            runSpeed: options.runSpeed || 12,
            backpedalSpeed: options.backpedalSpeed || 3,
            
            // Physics
            jumpForce: options.jumpForce || 8,
            gravity: options.gravity || 20
        };
        
        // Camera state
        this.cameraYaw = 0;
        this.cameraPitch = 0.3;
        this.cameraDistance = this.config.cameraDistance;
        this.cameraTargetPos = new THREE.Vector3();
        this.cameraCurrentPos = new THREE.Vector3();
        
        // Character state
        this.characterYaw = 0;
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.isMoving = false;
        this.isRunning = false;
        
        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            strafeLeft: false,
            strafeRight: false,
            run: false,
            jump: false,
            attack: false
        };
        
        // Mouse state
        this.mouse = {
            lmbDown: false,
            rmbDown: false,
            lastX: 0,
            lastY: 0,
            autoRun: false
        };
        
        // Combat state
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.weaponType = 'melee';
        
        // Callbacks
        this.onTargetCycle = null;
        this.onAnimationChange = null;
        this.onAttack = null;
        
        this._boundHandlers = {};
        this.setupInput();
        
        console.log('🎮 MMO Controller initialized');
        console.log('   W/S - Forward/Back | A/D/Q/E - Strafe');
        console.log('   RMB - Rotate Camera | LMB - Attack');
        console.log('   Tab - Cycle Targets | Shift - Run');
    }
    
    setupInput() {
        this._boundHandlers.keydown = this.onKeyDown.bind(this);
        this._boundHandlers.keyup = this.onKeyUp.bind(this);
        document.addEventListener('keydown', this._boundHandlers.keydown);
        document.addEventListener('keyup', this._boundHandlers.keyup);
        
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
        
        document.addEventListener('mouseup', this._boundHandlers.mouseup);
    }
    
    onKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.input.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.input.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.input.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.input.right = true;
                break;
            case 'KeyQ':
                this.input.strafeLeft = true;
                break;
            case 'KeyE':
                this.input.strafeRight = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.input.run = true;
                break;
            case 'Space':
                if (!e.repeat) this.input.jump = true;
                break;
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
                this.input.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.input.right = false;
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
        if (e.button === 0) {
            this.mouse.lmbDown = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
            
            if (this.mouse.rmbDown) {
                this.mouse.autoRun = true;
            } else {
                this.input.attack = true;
            }
        } else if (e.button === 2) {
            this.mouse.rmbDown = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
            
            if (this.mouse.lmbDown) {
                this.mouse.autoRun = true;
            }
        }
    }
    
    onMouseUp(e) {
        if (e.button === 0) {
            this.mouse.lmbDown = false;
            this.mouse.autoRun = false;
            this.input.attack = false;
        } else if (e.button === 2) {
            this.mouse.rmbDown = false;
            this.mouse.autoRun = false;
        }
    }
    
    onMouseMove(e) {
        const deltaX = e.clientX - this.mouse.lastX;
        const deltaY = e.clientY - this.mouse.lastY;
        
        // Only rotate camera when RMB is held (MMO-style)
        if (this.mouse.rmbDown) {
            const sensitivity = this.config.cameraRotateSensitivity;
            
            this.cameraYaw -= deltaX * sensitivity;
            this.cameraPitch += deltaY * sensitivity;
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
     * Movement is relative to camera direction
     */
    updateMovement(deltaTime) {
        const wasMoving = this.isMoving;
        const wasRunning = this.isRunning;
        
        // Build movement direction relative to camera
        const moveDir = new THREE.Vector3();
        
        // Forward/backward (W/S or auto-run)
        if (this.input.forward || this.mouse.autoRun) {
            moveDir.z = -1;
        }
        if (this.input.backward) {
            moveDir.z = 1;
        }
        
        // Strafe (A/D/Q/E)
        if (this.input.left || this.input.strafeLeft) {
            moveDir.x = -1;
        }
        if (this.input.right || this.input.strafeRight) {
            moveDir.x = 1;
        }
        
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            
            // Rotate movement by camera yaw
            const rotatedDir = new THREE.Vector3(
                moveDir.x * Math.cos(this.cameraYaw) - moveDir.z * Math.sin(this.cameraYaw),
                0,
                moveDir.x * Math.sin(this.cameraYaw) + moveDir.z * Math.cos(this.cameraYaw)
            );
            
            // Character faces movement direction
            const targetYaw = Math.atan2(rotatedDir.x, rotatedDir.z);
            
            let yawDiff = targetYaw - this.characterYaw;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            
            this.characterYaw += yawDiff * 15 * deltaTime;
            
            // Speed
            let speed = this.config.moveSpeed;
            this.isRunning = this.input.run && (this.input.forward || this.mouse.autoRun);
            
            if (this.isRunning) {
                speed = this.config.runSpeed;
            } else if (this.input.backward && !this.input.forward) {
                speed = this.config.backpedalSpeed;
            }
            
            this.velocity.x = rotatedDir.x * speed;
            this.velocity.z = rotatedDir.z * speed;
            this.isMoving = true;
        } else {
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
        
        // Gravity
        if (!this.isGrounded) {
            this.velocity.y -= this.config.gravity * deltaTime;
        }
        
        // Apply velocity
        this.character.position.x += this.velocity.x * deltaTime;
        this.character.position.y += this.velocity.y * deltaTime;
        this.character.position.z += this.velocity.z * deltaTime;
        
        // Update character rotation
        this.character.rotation.y = this.characterYaw;
        
        // Animation callback
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
     * Update camera (MMO-style over-shoulder)
     */
    updateCamera(deltaTime) {
        // Auto-follow behind character when not holding RMB
        if (!this.mouse.rmbDown && this.isMoving) {
            let targetCameraYaw = this.characterYaw + Math.PI;
            
            let yawDiff = targetCameraYaw - this.cameraYaw;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            
            const followSpeed = this.config.cameraFollowSpeed;
            this.cameraYaw += yawDiff * followSpeed * deltaTime;
        }
        
        // Over-shoulder offset
        const shoulderOffset = 0.6;
        
        const lookTarget = new THREE.Vector3(
            this.character.position.x + Math.cos(this.cameraYaw) * shoulderOffset,
            this.character.position.y + 1.6,
            this.character.position.z - Math.sin(this.cameraYaw) * shoulderOffset
        );
        
        // Camera position
        const horizontalDist = Math.cos(this.cameraPitch) * this.cameraDistance;
        const verticalDist = Math.sin(this.cameraPitch) * this.cameraDistance + this.config.cameraHeight;
        
        const cameraOffset = new THREE.Vector3(
            Math.sin(this.cameraYaw) * horizontalDist,
            verticalDist,
            Math.cos(this.cameraYaw) * horizontalDist
        );
        
        this.cameraTargetPos.copy(this.character.position).add(cameraOffset);
        
        // Smooth follow
        const smoothFactor = 1.0 - Math.exp(-8.0 * deltaTime);
        this.cameraCurrentPos.lerp(this.cameraTargetPos, smoothFactor);
        
        this.camera.position.copy(this.cameraCurrentPos);
        this.camera.lookAt(lookTarget);
    }
    
    /**
     * Trigger attack
     */
    triggerAttack() {
        this.isAttacking = true;
        
        const cooldowns = { melee: 0.6, ranged: 1.0 };
        this.attackCooldown = cooldowns[this.weaponType] || 0.6;
        
        // Get forward direction from character's actual rotation
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.character.quaternion);
        forward.y = 0;
        forward.normalize();
        
        if (this.onAttack) {
            this.onAttack({
                type: this.weaponType,
                position: this.character.position.clone(),
                direction: forward
            });
        }
        
        const attackDurations = { melee: 0.5, ranged: 0.8 };
        setTimeout(() => {
            this.isAttacking = false;
        }, (attackDurations[this.weaponType] || 0.5) * 1000);
    }
    
    /**
     * Set ground height
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
    
    getMovementState() {
        return {
            isMoving: this.isMoving,
            isRunning: this.isRunning,
            isGrounded: this.isGrounded
        };
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, terrainHeightFn = null) {
        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Attack input
        if (this.input.attack && this.attackCooldown <= 0 && !this.isAttacking) {
            this.triggerAttack();
        }
        
        const movementData = this.updateMovement(deltaTime);
        
        if (terrainHeightFn) {
            const groundY = terrainHeightFn(this.character.position.x, this.character.position.z);
            this.setGroundHeight(groundY);
        }
        
        this.updateCamera(deltaTime);
        
        return movementData;
    }
    
    setPosition(x, y, z) {
        this.character.position.set(x, y, z);
        this.velocity.set(0, 0, 0);
        
        this.cameraCurrentPos.set(
            x + Math.sin(this.characterYaw) * this.cameraDistance,
            y + this.config.cameraHeight + 2,
            z + Math.cos(this.characterYaw) * this.cameraDistance
        );
    }
    
    setWeaponType(type) {
        this.weaponType = type;
    }
    
    setTargetCycleCallback(callback) {
        this.onTargetCycle = callback;
    }
    
    setAnimationCallback(callback) {
        this.onAnimationChange = callback;
    }
    
    setAttackCallback(callback) {
        this.onAttack = callback;
    }
    
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

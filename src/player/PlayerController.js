import * as THREE from 'three';

/**
 * Animation states - inspired by annihilate/Maria.js state machine pattern
 */
const AnimState = {
    IDLE: 'idle',
    WALK: 'walk',
    RUN: 'run',
    JUMP: 'jump',
    FALL: 'fall'
};

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
        
        // Controller state
        this.enabled = true; // Can be disabled when in ship
        
        // Animation state (annihilate-style state machine)
        this.animState = AnimState.IDLE;
        this.animTime = 0;
        this.animBlend = 0; // 0-1 blend factor for transitions
        this.prevAnimState = AnimState.IDLE;
        this.animTransitionSpeed = 8; // crossfade speed (like annihilate fadeToAction)
        
        // Limb references for procedural animation
        this.limbs = {};
        
        // Player mesh (visual representation)
        this.createPlayerMesh();
        
        // Setup controls
        this.setupControls();
    }
    
    createPlayerMesh() {
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a90e2, metalness: 0.2, roughness: 0.8
        });
        const skinMat = new THREE.MeshStandardMaterial({ 
            color: 0xffdbac, metalness: 0.1, roughness: 0.9
        });
        const bootMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a, metalness: 0.3, roughness: 0.7
        });
        
        // --- Torso (capsule) ---
        const torso = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.3, 0.6, 6, 12), bodyMat
        );
        torso.position.y = 1.1;
        torso.castShadow = true;
        torso.receiveShadow = true;
        
        // --- Head ---
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 12, 8), skinMat
        );
        head.position.y = 1.75;
        head.castShadow = true;
        
        // --- Arms (pivot at shoulder, two segments each) ---
        const armGeo = new THREE.CapsuleGeometry(0.08, 0.3, 4, 8);
        
        // Left arm pivot (shoulder)
        const leftArmPivot = new THREE.Group();
        leftArmPivot.position.set(-0.4, 1.4, 0);
        const leftUpperArm = new THREE.Mesh(armGeo, bodyMat);
        leftUpperArm.position.y = -0.2;
        leftUpperArm.castShadow = true;
        leftArmPivot.add(leftUpperArm);
        // Left forearm
        const leftForearmPivot = new THREE.Group();
        leftForearmPivot.position.set(0, -0.4, 0);
        const leftForearm = new THREE.Mesh(armGeo, skinMat);
        leftForearm.position.y = -0.2;
        leftForearm.castShadow = true;
        leftForearmPivot.add(leftForearm);
        leftArmPivot.add(leftForearmPivot);
        
        // Right arm pivot (shoulder)
        const rightArmPivot = new THREE.Group();
        rightArmPivot.position.set(0.4, 1.4, 0);
        const rightUpperArm = new THREE.Mesh(armGeo, bodyMat);
        rightUpperArm.position.y = -0.2;
        rightUpperArm.castShadow = true;
        rightArmPivot.add(rightUpperArm);
        // Right forearm
        const rightForearmPivot = new THREE.Group();
        rightForearmPivot.position.set(0, -0.4, 0);
        const rightForearm = new THREE.Mesh(armGeo, skinMat);
        rightForearm.position.y = -0.2;
        rightForearm.castShadow = true;
        rightForearmPivot.add(rightForearm);
        rightArmPivot.add(rightForearmPivot);
        
        // --- Legs (pivot at hip, two segments each) ---
        const legGeo = new THREE.CapsuleGeometry(0.1, 0.3, 4, 8);
        
        // Left leg pivot (hip)
        const leftLegPivot = new THREE.Group();
        leftLegPivot.position.set(-0.15, 0.7, 0);
        const leftThigh = new THREE.Mesh(legGeo, bodyMat);
        leftThigh.position.y = -0.2;
        leftThigh.castShadow = true;
        leftLegPivot.add(leftThigh);
        // Left shin
        const leftShinPivot = new THREE.Group();
        leftShinPivot.position.set(0, -0.4, 0);
        const leftShin = new THREE.Mesh(legGeo, bootMat);
        leftShin.position.y = -0.2;
        leftShin.castShadow = true;
        leftShinPivot.add(leftShin);
        leftLegPivot.add(leftShinPivot);
        
        // Right leg pivot (hip)
        const rightLegPivot = new THREE.Group();
        rightLegPivot.position.set(0.15, 0.7, 0);
        const rightThigh = new THREE.Mesh(legGeo, bodyMat);
        rightThigh.position.y = -0.2;
        rightThigh.castShadow = true;
        rightLegPivot.add(rightThigh);
        // Right shin
        const rightShinPivot = new THREE.Group();
        rightShinPivot.position.set(0, -0.4, 0);
        const rightShin = new THREE.Mesh(legGeo, bootMat);
        rightShin.position.y = -0.2;
        rightShin.castShadow = true;
        rightShinPivot.add(rightShin);
        rightLegPivot.add(rightShinPivot);
        
        // --- Assemble ---
        this.mesh = new THREE.Group();
        this.mesh.add(torso);
        this.mesh.add(head);
        this.mesh.add(leftArmPivot);
        this.mesh.add(rightArmPivot);
        this.mesh.add(leftLegPivot);
        this.mesh.add(rightLegPivot);
        
        // Store limb pivots for animation
        this.limbs = {
            torso,
            head,
            leftArm: leftArmPivot,
            rightArm: rightArmPivot,
            leftForearm: leftForearmPivot,
            rightForearm: rightForearmPivot,
            leftLeg: leftLegPivot,
            rightLeg: rightLegPivot,
            leftShin: leftShinPivot,
            rightShin: rightShinPivot
        };
        
        // Ground glow marker
        const glowGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, transparent: true, opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 0.05;
        this.mesh.add(glow);
        
        this.scene.add(this.mesh);
        console.log('🎮 Animated player character created with limbs');
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
        // Skip if disabled (player in ship)
        if (!this.enabled) return;
        
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
        const isMoving = inputDir.length() > 0;
        if (isMoving) {
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
        
        // --- Animation state machine (annihilate-style) ---
        this.updateAnimationState(isMoving, delta);
        this.updateProceduralAnimation(delta);
        
        // Update third-person camera
        this.updateCamera();
    }
    
    /**
     * Determine animation state from movement (like annihilate Maria.js state transitions)
     */
    updateAnimationState(isMoving, delta) {
        let newState = this.animState;
        
        if (!this.isGrounded && this.velocity.y > 0) {
            newState = AnimState.JUMP;
        } else if (!this.isGrounded && this.velocity.y <= 0) {
            newState = AnimState.FALL;
        } else if (isMoving && this.isRunning) {
            newState = AnimState.RUN;
        } else if (isMoving) {
            newState = AnimState.WALK;
        } else {
            newState = AnimState.IDLE;
        }
        
        if (newState !== this.animState) {
            this.prevAnimState = this.animState;
            this.animState = newState;
            this.animBlend = 0; // start crossfade
        }
        
        // Advance blend (smooth crossfade like annihilate fadeToAction)
        if (this.animBlend < 1) {
            this.animBlend = Math.min(1, this.animBlend + delta * this.animTransitionSpeed);
        }
        
        this.animTime += delta;
    }
    
    /**
     * Procedural limb animation per state
     * Inspired by annihilate's approach of per-state animation actions
     */
    updateProceduralAnimation(delta) {
        const t = this.animTime;
        const blend = this.animBlend;
        const L = this.limbs;
        if (!L.leftArm) return;
        
        // Compute target poses per state
        let targetPose;
        switch (this.animState) {
            case AnimState.WALK:
                targetPose = this._poseWalk(t, 4.5, 0.45);
                break;
            case AnimState.RUN:
                targetPose = this._poseWalk(t, 8.0, 0.75);
                break;
            case AnimState.JUMP:
                targetPose = this._poseJump();
                break;
            case AnimState.FALL:
                targetPose = this._poseFall();
                break;
            case AnimState.IDLE:
            default:
                targetPose = this._poseIdle(t);
                break;
        }
        
        // Apply with lerp for smooth blending
        const lerpFactor = Math.min(1, delta * 12);
        this._applyPose(L, targetPose, lerpFactor);
    }
    
    /** Idle: subtle breathing/sway */
    _poseIdle(t) {
        const breathe = Math.sin(t * 1.5) * 0.02;
        const sway = Math.sin(t * 0.8) * 0.05;
        return {
            torsoY: 1.1 + breathe,
            leftArmX: sway, rightArmX: -sway,
            leftForearmX: -0.15, rightForearmX: -0.15,
            leftLegX: 0, rightLegX: 0,
            leftShinX: 0, rightShinX: 0,
            headY: 1.75 + breathe
        };
    }
    
    /** Walk/Run: alternating limb swing */
    _poseWalk(t, freq, amplitude) {
        const phase = t * freq;
        const armSwing = Math.sin(phase) * amplitude;
        const legSwing = Math.sin(phase) * amplitude * 0.8;
        const bob = Math.abs(Math.sin(phase)) * 0.04;
        const forearmBend = -0.2 - Math.max(0, -Math.sin(phase)) * 0.3;
        const shinBend = Math.max(0, Math.sin(phase + 0.5)) * 0.5;
        return {
            torsoY: 1.1 + bob,
            leftArmX: -armSwing, rightArmX: armSwing,
            leftForearmX: forearmBend, rightForearmX: -0.2 - Math.max(0, Math.sin(phase)) * 0.3,
            leftLegX: legSwing, rightLegX: -legSwing,
            leftShinX: Math.max(0, -Math.sin(phase + 0.5)) * 0.5,
            rightShinX: shinBend,
            headY: 1.75 + bob
        };
    }
    
    /** Jump: arms up, legs tucked */
    _poseJump() {
        return {
            torsoY: 1.1,
            leftArmX: -2.5, rightArmX: -2.5,
            leftForearmX: -0.6, rightForearmX: -0.6,
            leftLegX: 0.3, rightLegX: 0.3,
            leftShinX: 0.6, rightShinX: 0.6,
            headY: 1.75
        };
    }
    
    /** Fall: arms out, legs dangling */
    _poseFall() {
        return {
            torsoY: 1.1,
            leftArmX: -1.2, rightArmX: -1.2,
            leftForearmX: -0.3, rightForearmX: -0.3,
            leftLegX: -0.15, rightLegX: 0.15,
            leftShinX: 0.2, rightShinX: 0.2,
            headY: 1.75
        };
    }
    
    /** Apply target pose to limbs with lerp smoothing */
    _applyPose(L, pose, lerpFactor) {
        const lrp = (cur, tgt) => cur + (tgt - cur) * lerpFactor;
        
        L.torso.position.y = lrp(L.torso.position.y, pose.torsoY);
        L.head.position.y = lrp(L.head.position.y, pose.headY);
        L.leftArm.rotation.x = lrp(L.leftArm.rotation.x, pose.leftArmX);
        L.rightArm.rotation.x = lrp(L.rightArm.rotation.x, pose.rightArmX);
        L.leftForearm.rotation.x = lrp(L.leftForearm.rotation.x, pose.leftForearmX);
        L.rightForearm.rotation.x = lrp(L.rightForearm.rotation.x, pose.rightForearmX);
        L.leftLeg.rotation.x = lrp(L.leftLeg.rotation.x, pose.leftLegX);
        L.rightLeg.rotation.x = lrp(L.rightLeg.rotation.x, pose.rightLegX);
        L.leftShin.rotation.x = lrp(L.leftShin.rotation.x, pose.leftShinX);
        L.rightShin.rotation.x = lrp(L.rightShin.rotation.x, pose.rightShinX);
    }
    
    updateCamera() {
        // Calculate third-person camera position
        this.cameraTarget.copy(this.position);
        this.cameraTarget.y += this.cameraTargetHeight;
        
        // Position camera behind and above player
        const cameraOffset = new THREE.Vector3(
            Math.sin(this.cameraRotation.y) * this.cameraDistance,
            this.cameraHeight + Math.sin(this.cameraRotation.x) * this.cameraDistance * 0.5,
            Math.cos(this.cameraRotation.y) * this.cameraDistance
        );
        
        this.cameraPosition.copy(this.cameraTarget).add(cameraOffset);
        
        // Smooth camera movement
        this.camera.position.lerp(this.cameraPosition, 0.1);
        this.camera.lookAt(this.cameraTarget);
    }
    
    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.mesh.position.copy(this.position);
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    checkWorldBoundaries() {
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

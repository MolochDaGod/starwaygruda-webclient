import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';
import TWEEN from '@tweenjs/tween.js';

/**
 * MMOCharacterController - Optimized MMO-style character with:
 * - Physics-based movement (cannon-es)
 * - Smooth camera following with lag
 * - Animation blending with crossfade
 * - Tab targeting support
 * - Strafe/backpedal movement
 * - Combat animations with combos
 */
export class MMOCharacterController {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        
        // Configuration
        this.config = {
            // Movement
            walkSpeed: 4,
            runSpeed: 8,
            backpedalSpeed: 3,
            strafeSpeed: 5,
            turnSpeed: 5,
            jumpForce: 8,
            
            // Camera
            cameraDistance: 5,
            cameraHeight: 2.5,
            cameraMinDistance: 2,
            cameraMaxDistance: 15,
            cameraSmoothness: 0.08,
            cameraLookAhead: 0.5,
            cameraPitchMin: -0.3,
            cameraPitchMax: 0.8,
            
            // Animation
            crossFadeDuration: 0.2,
            idleVariationTime: 8,
            
            // Physics
            mass: 70,
            groundFriction: 0.3,
            airFriction: 0.02,
            
            ...options
        };
        
        // Character
        this.character = null;
        this.skeleton = null;
        this.mixer = null;
        
        // Physics
        this.world = null;
        this.body = null;
        
        // Animations - categorized
        this.animations = {
            // Locomotion
            idle: null,
            idleVariants: [],
            walkForward: null,
            walkBack: null,
            walkLeft: null,
            walkRight: null,
            runForward: null,
            runBack: null,
            jump: null,
            jumpRunning: null,
            
            // Combat - Armed
            attacks: [],
            combos: [],
            block: null,
            blockReact: null,
            
            // Combat - Reactions
            hitLeft: null,
            hitRight: null,
            hitGut: null,
            
            // Actions
            equipShoulder: null,
            equipUnderarm: null,
            disarmShoulder: null,
            disarmUnderarm: null,
            
            // Emotes
            tauntBattlecry: null,
            tauntChest: null,
            
            // Turns
            turnLeft: null,
            turnRight: null,
            
            // Crouch
            crouchIdle: null,
            crouchToStand: null
        };
        
        this.currentAction = null;
        this.previousAction = null;
        this.actionQueue = [];
        
        // State
        this.state = {
            isMoving: false,
            isRunning: false,
            isGrounded: true,
            isJumping: false,
            isCrouching: false,
            isBlocking: false,
            isAttacking: false,
            hasWeapon: true,
            comboCount: 0,
            comboWindow: 0,
            facingAngle: 0,
            moveAngle: 0,
            idleTimer: 0
        };
        
        // Input
        this.input = {
            forward: false,
            back: false,
            left: false,
            right: false,
            run: false,
            jump: false,
            attack: false,
            block: false,
            crouch: false
        };
        
        // Camera state
        this.cameraState = {
            yaw: 0,
            pitch: 0.3,
            distance: this.config.cameraDistance,
            targetPosition: new THREE.Vector3(),
            currentPosition: new THREE.Vector3(),
            velocity: new THREE.Vector3()
        };
        
        // Mouse
        this.mouse = {
            x: 0,
            y: 0,
            locked: false
        };
        
        this.assetPath = '/assets/melee-axe/';
        this.clock = new THREE.Clock();
        
        console.log('🎮 MMOCharacterController initializing...');
    }
    
    async init() {
        // Initialize physics world
        this.initPhysics();
        
        // Load character and animations
        await this.loadCharacter();
        await this.loadAnimations();
        
        // Setup animation controller
        this.setupAnimationController();
        
        // Setup input handlers
        this.setupInput();
        
        console.log('✅ MMOCharacterController ready');
        console.log('   WASD - Move | Shift - Run | Space - Jump');
        console.log('   LMB - Attack | RMB - Block | Tab - Target');
        
        return this.character;
    }
    
    initPhysics() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -20, 0)
        });
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0.3;
        
        // Ground plane (will be replaced by terrain)
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
        this.groundBody = groundBody;
    }
    
    async loadCharacter() {
        const loader = new FBXLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                this.assetPath + 'Meshy2_AI_Character_output.fbx',
                (fbx) => {
                    this.character = fbx;
                    this.character.scale.setScalar(0.01);
                    
                    // Setup materials and shadows
                    this.character.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.frustumCulled = false;
                            
                            // Improve material
                            if (child.material) {
                                child.material.side = THREE.FrontSide;
                                if (child.material.map) {
                                    child.material.map.anisotropy = 4;
                                }
                            }
                        }
                        if (child.isSkinnedMesh) {
                            this.skeleton = child.skeleton;
                        }
                    });
                    
                    // Create physics body
                    const capsuleShape = new CANNON.Cylinder(0.3, 0.3, 1.8, 8);
                    this.body = new CANNON.Body({
                        mass: this.config.mass,
                        position: new CANNON.Vec3(0, 5, 0),
                        fixedRotation: true,
                        linearDamping: 0.9
                    });
                    this.body.addShape(capsuleShape, new CANNON.Vec3(0, 0.9, 0));
                    this.world.addBody(this.body);
                    
                    // Create mixer
                    this.mixer = new THREE.AnimationMixer(this.character);
                    
                    this.scene.add(this.character);
                    resolve(this.character);
                },
                (progress) => {},
                (error) => reject(error)
            );
        });
    }
    
    async loadAnimations() {
        const loader = new FBXLoader();
        
        // Animation mapping with categories
        const animationMap = {
            // === LOCOMOTION ===
            'idle': 'standing idle.fbx',
            'idleVariant1': 'standing idle looking ver. 1.fbx',
            'idleVariant2': 'standing idle looking ver. 2.fbx',
            'walkForward': 'standing walk forward.fbx',
            'walkBack': 'standing walk back.fbx',
            'walkLeft': 'standing walk left.fbx',
            'walkRight': 'standing walk right.fbx',
            'runForward': 'standing run forward.fbx',
            'runBack': 'standing run back.fbx',
            'jump': 'standing jump.fbx',
            'jumpRunning': 'unarmed jump running.fbx',
            
            // === COMBAT ATTACKS ===
            'attack1': 'standing melee attack horizontal.fbx',
            'attack2': 'standing melee attack downward.fbx',
            'attack3': 'standing melee attack backhand.fbx',
            'attack360High': 'standing melee attack 360 high.fbx',
            'attack360Low': 'standing melee attack 360 low.fbx',
            'attackKick1': 'standing melee attack kick ver. 1.fbx',
            'attackKick2': 'standing melee attack kick ver. 2.fbx',
            'combo1': 'standing melee combo attack ver. 1.fbx',
            'combo2': 'standing melee combo attack ver. 2.fbx',
            'combo3': 'standing melee combo attack ver. 3.fbx',
            'jumpAttack': 'standing melee run jump attack.fbx',
            
            // === BLOCKING ===
            'block': 'standing block idle.fbx',
            'blockReact': 'standing block react large.fbx',
            
            // === HIT REACTIONS ===
            'hitLeft': 'standing react large from left.fbx',
            'hitRight': 'standing react large from right.fbx',
            'hitGut': 'standing react large gut.fbx',
            
            // === WEAPON HANDLING ===
            'equipShoulder': 'unarmed equip over shoulder.fbx',
            'equipUnderarm': 'unarmed equip underarm.fbx',
            'disarmShoulder': 'standing disarm over shoulder.fbx',
            'disarmUnderarm': 'standing disarm underarm.fbx',
            
            // === EMOTES ===
            'tauntBattlecry': 'standing taunt battlecry.fbx',
            'tauntChest': 'standing taunt chest thump.fbx',
            
            // === TURNS ===
            'turnLeft': 'standing turn left 90.fbx',
            'turnRight': 'standing turn right 90.fbx',
            
            // === CROUCH ===
            'crouchIdle': 'crouch idle.fbx',
            'crouchToStand': 'crouch to standing idle.fbx',
            
            // === UNARMED ===
            'idleUnarmed': 'unarmed idle.fbx',
            'walkForwardUnarmed': 'unarmed walk forward.fbx',
            'runForwardUnarmed': 'unarmed run forward.fbx'
        };
        
        // Load all animations
        const loadPromises = Object.entries(animationMap).map(async ([name, file]) => {
            try {
                const fbx = await this.loadFBX(loader, this.assetPath + file);
                if (fbx.animations && fbx.animations.length > 0) {
                    const clip = fbx.animations[0];
                    clip.name = name;
                    return { name, clip };
                }
            } catch (e) {
                console.warn(`Animation load failed: ${name}`);
            }
            return null;
        });
        
        const results = await Promise.all(loadPromises);
        
        // Organize animations
        results.forEach(result => {
            if (!result) return;
            const { name, clip } = result;
            
            // Categorize
            if (name === 'idle') {
                this.animations.idle = clip;
            } else if (name.startsWith('idleVariant')) {
                this.animations.idleVariants.push(clip);
            } else if (name.startsWith('attack') && !name.includes('jump')) {
                this.animations.attacks.push(clip);
            } else if (name.startsWith('combo')) {
                this.animations.combos.push(clip);
            } else {
                // Direct mapping
                this.animations[name] = clip;
            }
        });
        
        console.log(`📦 Loaded ${results.filter(r => r).length} animations`);
    }
    
    loadFBX(loader, path) {
        return new Promise((resolve, reject) => {
            loader.load(path, resolve, () => {}, reject);
        });
    }
    
    setupAnimationController() {
        // Create actions map for quick access
        this.actions = new Map();
        
        const createAction = (clip, loop = true) => {
            if (!clip) return null;
            const action = this.mixer.clipAction(clip);
            action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
            if (!loop) action.clampWhenFinished = true;
            this.actions.set(clip.name, action);
            return action;
        };
        
        // Create all actions
        createAction(this.animations.idle);
        this.animations.idleVariants.forEach(clip => createAction(clip));
        createAction(this.animations.walkForward);
        createAction(this.animations.walkBack);
        createAction(this.animations.walkLeft);
        createAction(this.animations.walkRight);
        createAction(this.animations.runForward);
        createAction(this.animations.runBack);
        createAction(this.animations.jump, false);
        createAction(this.animations.jumpRunning, false);
        
        // Combat
        this.animations.attacks.forEach(clip => createAction(clip, false));
        this.animations.combos.forEach(clip => createAction(clip, false));
        createAction(this.animations.block);
        createAction(this.animations.blockReact, false);
        
        // Reactions
        createAction(this.animations.hitLeft, false);
        createAction(this.animations.hitRight, false);
        createAction(this.animations.hitGut, false);
        
        // Emotes
        createAction(this.animations.tauntBattlecry, false);
        createAction(this.animations.tauntChest, false);
        
        // Start with idle
        this.playAnimation('idle');
        
        // Listen for animation finished
        this.mixer.addEventListener('finished', (e) => {
            this.onAnimationFinished(e.action);
        });
    }
    
    playAnimation(name, crossFade = true) {
        const action = this.actions.get(name);
        if (!action) return;
        
        if (this.currentAction === action) return;
        
        this.previousAction = this.currentAction;
        this.currentAction = action;
        
        if (this.previousAction && crossFade) {
            this.previousAction.fadeOut(this.config.crossFadeDuration);
        }
        
        action.reset();
        action.fadeIn(this.config.crossFadeDuration);
        action.play();
    }
    
    onAnimationFinished(action) {
        const name = action.getClip().name;
        
        // Handle attack animations ending
        if (name.startsWith('attack') || name.startsWith('combo')) {
            this.state.isAttacking = false;
            if (this.state.comboWindow > 0) {
                // Continue combo if queued
            } else {
                this.state.comboCount = 0;
            }
            this.updateLocomotion();
        }
        
        // Handle jump landing
        if (name === 'jump' || name === 'jumpRunning') {
            this.state.isJumping = false;
            this.updateLocomotion();
        }
        
        // Handle emotes
        if (name.startsWith('taunt')) {
            this.updateLocomotion();
        }
    }
    
    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Pointer lock
        window.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = !!document.pointerLockElement;
        });
        
        // Prevent context menu
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onKeyDown(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.input.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.input.back = true; break;
            case 'KeyA': case 'ArrowLeft': this.input.left = true; break;
            case 'KeyD': case 'ArrowRight': this.input.right = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.input.run = true; break;
            case 'Space': 
                if (!this.input.jump && this.state.isGrounded) {
                    this.input.jump = true;
                    this.jump();
                }
                break;
            case 'ControlLeft': this.input.crouch = true; this.setCrouch(true); break;
        }
    }
    
    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.input.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.input.back = false; break;
            case 'KeyA': case 'ArrowLeft': this.input.left = false; break;
            case 'KeyD': case 'ArrowRight': this.input.right = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.input.run = false; break;
            case 'Space': this.input.jump = false; break;
            case 'ControlLeft': this.input.crouch = false; this.setCrouch(false); break;
        }
    }
    
    onMouseMove(e) {
        if (!this.mouse.locked) return;
        
        const sensitivity = 0.002;
        this.cameraState.yaw -= e.movementX * sensitivity;
        this.cameraState.pitch += e.movementY * sensitivity;
        
        // Clamp pitch
        this.cameraState.pitch = THREE.MathUtils.clamp(
            this.cameraState.pitch,
            this.config.cameraPitchMin,
            this.config.cameraPitchMax
        );
    }
    
    onMouseDown(e) {
        if (e.button === 0) { // LMB - Attack
            if (this.mouse.locked) {
                this.attack();
            }
        } else if (e.button === 2) { // RMB - Block
            this.input.block = true;
            this.setBlocking(true);
        }
    }
    
    onMouseUp(e) {
        if (e.button === 2) {
            this.input.block = false;
            this.setBlocking(false);
        }
    }
    
    onWheel(e) {
        this.cameraState.distance += e.deltaY * 0.01;
        this.cameraState.distance = THREE.MathUtils.clamp(
            this.cameraState.distance,
            this.config.cameraMinDistance,
            this.config.cameraMaxDistance
        );
    }
    
    attack() {
        if (this.state.isBlocking || this.state.isJumping) return;
        
        // Combo system
        if (!this.state.isAttacking) {
            this.state.isAttacking = true;
            this.state.comboCount = 1;
            this.playAnimation('attack1', true);
        } else if (this.state.comboWindow > 0) {
            this.state.comboCount = Math.min(this.state.comboCount + 1, 3);
            
            if (this.state.comboCount === 2) {
                this.playAnimation('attack2', true);
            } else if (this.state.comboCount === 3) {
                this.playAnimation('combo3', true);
            }
        }
        
        this.state.comboWindow = 0.4;
    }
    
    setBlocking(blocking) {
        if (this.state.isAttacking) return;
        
        this.state.isBlocking = blocking;
        if (blocking) {
            this.playAnimation('block');
        } else {
            this.updateLocomotion();
        }
    }
    
    setCrouch(crouching) {
        if (this.state.isAttacking || this.state.isBlocking) return;
        
        this.state.isCrouching = crouching;
        if (crouching && this.animations.crouchIdle) {
            this.playAnimation('crouchIdle');
        } else {
            this.updateLocomotion();
        }
    }
    
    jump() {
        if (!this.state.isGrounded || this.state.isAttacking || this.state.isBlocking) return;
        
        this.state.isJumping = true;
        this.state.isGrounded = false;
        
        // Apply jump force
        this.body.velocity.y = this.config.jumpForce;
        
        // Play jump animation
        const jumpAnim = this.state.isRunning ? 'jumpRunning' : 'jump';
        this.playAnimation(jumpAnim, true);
    }
    
    updateLocomotion() {
        if (this.state.isAttacking || this.state.isBlocking || this.state.isJumping || this.state.isCrouching) {
            return;
        }
        
        const moving = this.input.forward || this.input.back || this.input.left || this.input.right;
        this.state.isMoving = moving;
        this.state.isRunning = this.input.run && moving;
        
        if (!moving) {
            this.playAnimation('idle');
            return;
        }
        
        // Determine animation based on direction
        if (this.input.forward) {
            this.playAnimation(this.state.isRunning ? 'runForward' : 'walkForward');
        } else if (this.input.back) {
            this.playAnimation(this.state.isRunning ? 'runBack' : 'walkBack');
        } else if (this.input.left) {
            this.playAnimation('walkLeft');
        } else if (this.input.right) {
            this.playAnimation('walkRight');
        }
    }
    
    update(deltaTime, terrainHeightFn = null) {
        if (!this.character || !this.body) return null;
        
        // Update physics
        this.world.step(1/60, deltaTime, 3);
        
        // Update timers
        if (this.state.comboWindow > 0) {
            this.state.comboWindow -= deltaTime;
        }
        
        // Idle variation timer
        if (!this.state.isMoving && !this.state.isAttacking) {
            this.state.idleTimer += deltaTime;
            if (this.state.idleTimer > this.config.idleVariationTime && this.animations.idleVariants.length > 0) {
                this.state.idleTimer = 0;
                const variant = this.animations.idleVariants[Math.floor(Math.random() * this.animations.idleVariants.length)];
                this.playAnimation(variant.name, true);
            }
        } else {
            this.state.idleTimer = 0;
        }
        
        // Process movement
        this.processMovement(deltaTime);
        
        // Ground check with terrain
        if (terrainHeightFn) {
            const groundY = terrainHeightFn(this.body.position.x, this.body.position.z);
            
            if (this.body.position.y <= groundY + 0.1) {
                this.body.position.y = groundY;
                this.body.velocity.y = Math.max(0, this.body.velocity.y);
                
                if (!this.state.isGrounded && !this.state.isJumping) {
                    this.state.isGrounded = true;
                    this.updateLocomotion();
                }
                this.state.isGrounded = true;
            } else {
                this.state.isGrounded = false;
            }
        }
        
        // Sync character mesh to physics body
        this.character.position.copy(this.body.position);
        this.character.rotation.y = this.state.facingAngle;
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Update animations
        this.mixer.update(deltaTime);
        
        // Update TWEEN
        TWEEN.update();
        
        return this.getCharacterData();
    }
    
    processMovement(deltaTime) {
        if (this.state.isAttacking && this.state.comboCount < 2) return;
        if (this.state.isBlocking) return;
        
        // Calculate movement direction relative to camera
        const moveDir = new THREE.Vector3();
        
        if (this.input.forward) moveDir.z -= 1;
        if (this.input.back) moveDir.z += 1;
        if (this.input.left) moveDir.x -= 1;
        if (this.input.right) moveDir.x += 1;
        
        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            
            // Rotate movement direction by camera yaw
            const cameraYaw = this.cameraState.yaw;
            const rotatedX = moveDir.x * Math.cos(cameraYaw) - moveDir.z * Math.sin(cameraYaw);
            const rotatedZ = moveDir.x * Math.sin(cameraYaw) + moveDir.z * Math.cos(cameraYaw);
            
            // Determine speed
            let speed = this.config.walkSpeed;
            if (this.state.isRunning) speed = this.config.runSpeed;
            if (this.input.back && !this.input.forward) speed = this.config.backpedalSpeed;
            if ((this.input.left || this.input.right) && !this.input.forward && !this.input.back) {
                speed = this.config.strafeSpeed;
            }
            
            // Apply velocity
            this.body.velocity.x = rotatedX * speed;
            this.body.velocity.z = rotatedZ * speed;
            
            // Face movement direction (or camera direction when running)
            if (this.input.forward || this.state.isRunning) {
                const targetAngle = Math.atan2(rotatedX, rotatedZ) + Math.PI;
                // Smooth angle interpolation (handle wrapping)
                let angleDiff = targetAngle - this.state.facingAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const rotSpeed = 1 - Math.exp(-this.config.turnSpeed * 2 * deltaTime);
                this.state.facingAngle += angleDiff * rotSpeed;
            }
            
            this.state.isMoving = true;
        } else {
            // Decelerate
            this.body.velocity.x *= 0.9;
            this.body.velocity.z *= 0.9;
            this.state.isMoving = false;
        }
        
        this.updateLocomotion();
    }
    
    updateCamera(deltaTime) {
        const target = this.character.position.clone();
        target.y += 1.5; // Look at chest height
        
        // Add look-ahead based on movement
        if (this.state.isMoving) {
            const lookAhead = new THREE.Vector3(
                Math.sin(this.state.facingAngle) * this.config.cameraLookAhead,
                0,
                Math.cos(this.state.facingAngle) * this.config.cameraLookAhead
            );
            target.add(lookAhead);
        }
        
        // Calculate ideal camera position
        const offset = new THREE.Vector3(
            Math.sin(this.cameraState.yaw) * Math.cos(this.cameraState.pitch) * this.cameraState.distance,
            Math.sin(this.cameraState.pitch) * this.cameraState.distance + this.config.cameraHeight,
            Math.cos(this.cameraState.yaw) * Math.cos(this.cameraState.pitch) * this.cameraState.distance
        );
        
        const idealPosition = target.clone().add(offset);
        
        // Smooth camera movement
        this.cameraState.currentPosition.lerp(idealPosition, this.config.cameraSmoothness);
        
        this.camera.position.copy(this.cameraState.currentPosition);
        this.camera.lookAt(target);
    }
    
    setPosition(x, y, z) {
        this.body.position.set(x, y, z);
        this.body.velocity.set(0, 0, 0);
        this.character.position.set(x, y, z);
        
        // Reset camera
        this.cameraState.currentPosition.set(x, y + 5, z + 5);
    }
    
    getPosition() {
        return this.character.position.clone();
    }
    
    getCharacterData() {
        return {
            position: this.character.position.clone(),
            velocity: new THREE.Vector3(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z),
            state: this.getCurrentStateName(),
            speed: Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.z ** 2),
            isGrounded: this.state.isGrounded,
            isRunning: this.state.isRunning,
            isAttacking: this.state.isAttacking,
            isBlocking: this.state.isBlocking,
            comboCount: this.state.comboCount
        };
    }
    
    getCurrentStateName() {
        if (this.state.isAttacking) return `attack${this.state.comboCount}`;
        if (this.state.isBlocking) return 'block';
        if (this.state.isJumping) return 'jump';
        if (this.state.isCrouching) return 'crouch';
        if (this.state.isRunning) return 'run';
        if (this.state.isMoving) return 'walk';
        return 'idle';
    }
    
    // Combat interface for targeting system
    takeDamage(amount, direction = 'front') {
        if (this.state.isBlocking) {
            this.playAnimation('blockReact', false);
            return amount * 0.2; // Reduced damage
        }
        
        // Play hit reaction
        if (direction === 'left') this.playAnimation('hitLeft', false);
        else if (direction === 'right') this.playAnimation('hitRight', false);
        else this.playAnimation('hitGut', false);
        
        return amount;
    }
    
    playEmote(emote) {
        if (emote === 'battlecry') this.playAnimation('tauntBattlecry', false);
        else if (emote === 'chest') this.playAnimation('tauntChest', false);
    }
    
    dispose() {
        if (this.character && this.scene) {
            this.scene.remove(this.character);
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        if (this.body && this.world) {
            this.world.removeBody(this.body);
        }
    }
}

export default MMOCharacterController;

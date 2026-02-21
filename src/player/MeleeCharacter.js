import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Import from Grudge Studio SDK
import { ThirdPersonController } from 'grudge-studio/controllers';
import { AnimationController, AnimationStateMachine, AnimationState } from 'grudge-studio/render';

/**
 * MeleeCharacter - Combat character with FBX model and melee animations
 * Uses Pro Melee Axe Pack assets
 */
export class MeleeCharacter {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.options = options;
        
        this.character = null;
        this.controller = null;
        this.animController = null;
        this.stateMachine = null;
        this.mixer = null;
        
        // Animation clips storage
        this.animations = new Map();
        
        // Input state
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
        this.mouseButtons = { left: false, right: false };
        
        // Combat state
        this.isAttacking = false;
        this.attackQueue = [];
        this.comboCount = 0;
        this.comboTimer = 0;
        this.maxCombo = 3;
        this.isBlocking = false;
        this.hasWeaponEquipped = true;
        
        // Asset paths
        this.assetPath = '/assets/melee-axe/';
        
        console.log('⚔️ MeleeCharacter initializing...');
    }
    
    async init() {
        const loader = new FBXLoader();
        
        // Load the character model
        try {
            this.character = await this.loadFBX(loader, this.assetPath + 'Meshy2_AI_Character_output.fbx');
            this.character.scale.setScalar(0.01); // FBX models are usually scaled 100x
            this.character.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(this.character);
            
            // Create mixer for animations
            this.mixer = new THREE.AnimationMixer(this.character);
            this.animController = new AnimationController(this.mixer);
            
            // Load all animations
            await this.loadAnimations(loader);
            
            // Create state machine
            this.createStateMachine();
            
            // Create third person controller
            this.controller = new ThirdPersonController(this.character, this.camera, {
                moveSpeed: 5,
                runSpeed: 10,
                jumpForce: 10,
                gravity: 25,
                cameraDistance: 6,
                cameraHeight: 3,
                cameraLookAtHeight: 1.5,
                shoulderOffset: 0.5,
                sensitivity: 0.003,
                minPitch: -0.6,
                maxPitch: 0.5
            });
            
            // Setup input
            this.setupInput();
            
            console.log('✅ MeleeCharacter loaded with', this.animations.size, 'animations');
            return this.character;
            
        } catch (error) {
            console.error('❌ Failed to load MeleeCharacter:', error);
            throw error;
        }
    }
    
    loadFBX(loader, path) {
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (fbx) => resolve(fbx),
                (progress) => {},
                (error) => reject(error)
            );
        });
    }
    
    async loadAnimations(loader) {
        // Animation file mappings
        const animFiles = {
            // Idle
            'idle': 'standing idle.fbx',
            'idle_look1': 'standing idle looking ver. 1.fbx',
            'idle_look2': 'standing idle looking ver. 2.fbx',
            'idle_unarmed': 'unarmed idle.fbx',
            'crouch_idle': 'crouch idle.fbx',
            
            // Movement - armed
            'walk_forward': 'standing walk forward.fbx',
            'walk_back': 'standing walk back.fbx',
            'walk_left': 'standing walk left.fbx',
            'walk_right': 'standing walk right.fbx',
            'run_forward': 'standing run forward.fbx',
            'run_back': 'standing run back.fbx',
            
            // Movement - unarmed
            'walk_forward_unarmed': 'unarmed walk forward.fbx',
            'walk_back_unarmed': 'unarmed walk back.fbx',
            'run_forward_unarmed': 'unarmed run forward.fbx',
            'run_back_unarmed': 'unarmed run back.fbx',
            
            // Jumping
            'jump': 'standing jump.fbx',
            'jump_unarmed': 'unarmed jump.fbx',
            'jump_running': 'unarmed jump running.fbx',
            'jump_attack': 'standing melee run jump attack.fbx',
            
            // Combat attacks
            'attack_horizontal': 'standing melee attack horizontal.fbx',
            'attack_downward': 'standing melee attack downward.fbx',
            'attack_backhand': 'standing melee attack backhand.fbx',
            'attack_360_high': 'standing melee attack 360 high.fbx',
            'attack_360_low': 'standing melee attack 360 low.fbx',
            'attack_kick1': 'standing melee attack kick ver. 1.fbx',
            'attack_kick2': 'standing melee attack kick ver. 2.fbx',
            'combo1': 'standing melee combo attack ver. 1.fbx',
            'combo2': 'standing melee combo attack ver. 2.fbx',
            'combo3': 'standing melee combo attack ver. 3.fbx',
            
            // Blocking and reactions
            'block_idle': 'standing block idle.fbx',
            'block_react': 'standing block react large.fbx',
            'react_left': 'standing react large from left.fbx',
            'react_right': 'standing react large from right.fbx',
            'react_gut': 'standing react large gut.fbx',
            
            // Taunts
            'taunt_battlecry': 'standing taunt battlecry.fbx',
            'taunt_chest': 'standing taunt chest thump.fbx',
            
            // Equip/Disarm
            'equip_shoulder': 'unarmed equip over shoulder.fbx',
            'equip_underarm': 'unarmed equip underarm.fbx',
            'disarm_shoulder': 'standing disarm over shoulder.fbx',
            'disarm_underarm': 'standing disarm underarm.fbx',
            
            // Turns
            'turn_left': 'standing turn left 90.fbx',
            'turn_right': 'standing turn right 90.fbx',
            
            // Crouch
            'crouch_to_stand': 'crouch to standing idle.fbx'
        };
        
        // Load animations in parallel batches
        const entries = Object.entries(animFiles);
        const batchSize = 5;
        
        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            await Promise.all(batch.map(async ([name, file]) => {
                try {
                    const fbx = await this.loadFBX(new FBXLoader(), this.assetPath + file);
                    if (fbx.animations && fbx.animations.length > 0) {
                        const clip = fbx.animations[0];
                        clip.name = name;
                        this.animations.set(name, clip);
                        this.animController.addClip(name, clip);
                    }
                } catch (e) {
                    console.warn(`Could not load animation: ${name}`, e.message);
                }
            }));
        }
    }
    
    createStateMachine() {
        this.stateMachine = new AnimationStateMachine(this.animController, {
            isMoving: false,
            isRunning: false,
            isGrounded: true,
            isAttacking: false,
            isBlocking: false,
            comboCount: 0,
            speed: 0
        });
        
        // Create states
        const idleState = new AnimationState('idle', 'idle', { loop: true, speed: 1 });
        const walkState = new AnimationState('walk', 'walk_forward', { loop: true, speed: 1 });
        const runState = new AnimationState('run', 'run_forward', { loop: true, speed: 1 });
        const jumpState = new AnimationState('jump', 'jump', { loop: false, speed: 1 });
        
        // Combat states
        const attack1State = new AnimationState('attack1', 'attack_horizontal', { loop: false, speed: 1.2 });
        const attack2State = new AnimationState('attack2', 'attack_downward', { loop: false, speed: 1.2 });
        const attack3State = new AnimationState('attack3', 'combo3', { loop: false, speed: 1.1 });
        const blockState = new AnimationState('block', 'block_idle', { loop: true, speed: 1 });
        
        // Transitions from idle
        idleState.addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning && ctx.isGrounded && !ctx.isAttacking);
        idleState.addTransition('run', ctx => ctx.isMoving && ctx.isRunning && ctx.isGrounded && !ctx.isAttacking);
        idleState.addTransition('jump', ctx => !ctx.isGrounded && !ctx.isAttacking);
        idleState.addTransition('attack1', ctx => ctx.isAttacking && ctx.comboCount === 1);
        idleState.addTransition('block', ctx => ctx.isBlocking);
        
        // Transitions from walk
        walkState.addTransition('idle', ctx => !ctx.isMoving && ctx.isGrounded && !ctx.isAttacking);
        walkState.addTransition('run', ctx => ctx.isRunning && ctx.isGrounded);
        walkState.addTransition('jump', ctx => !ctx.isGrounded);
        walkState.addTransition('attack1', ctx => ctx.isAttacking && ctx.comboCount === 1);
        
        // Transitions from run
        runState.addTransition('idle', ctx => !ctx.isMoving && ctx.isGrounded && !ctx.isAttacking);
        runState.addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning && ctx.isGrounded);
        runState.addTransition('jump', ctx => !ctx.isGrounded);
        runState.addTransition('attack1', ctx => ctx.isAttacking && ctx.comboCount === 1);
        
        // Transitions from jump
        jumpState.addTransition('idle', ctx => ctx.isGrounded && !ctx.isMoving);
        jumpState.addTransition('walk', ctx => ctx.isGrounded && ctx.isMoving && !ctx.isRunning);
        jumpState.addTransition('run', ctx => ctx.isGrounded && ctx.isMoving && ctx.isRunning);
        
        // Combat transitions
        attack1State.addTransition('attack2', ctx => ctx.isAttacking && ctx.comboCount === 2);
        attack1State.addTransition('idle', ctx => !ctx.isAttacking && ctx.isGrounded && !ctx.isMoving);
        attack1State.addTransition('walk', ctx => !ctx.isAttacking && ctx.isMoving && !ctx.isRunning);
        
        attack2State.addTransition('attack3', ctx => ctx.isAttacking && ctx.comboCount === 3);
        attack2State.addTransition('idle', ctx => !ctx.isAttacking && ctx.isGrounded && !ctx.isMoving);
        
        attack3State.addTransition('idle', ctx => !ctx.isAttacking && ctx.isGrounded);
        
        blockState.addTransition('idle', ctx => !ctx.isBlocking && !ctx.isMoving);
        blockState.addTransition('walk', ctx => !ctx.isBlocking && ctx.isMoving);
        
        this.stateMachine.addStates([
            idleState, walkState, runState, jumpState,
            attack1State, attack2State, attack3State, blockState
        ]);
        
        // Handle animation finished for attacks
        this.animController.onFinished((name) => {
            if (name.startsWith('attack') || name.startsWith('combo')) {
                this.isAttacking = false;
                this.stateMachine.setContext('isAttacking', false);
            }
        });
        
        this.stateMachine.start('idle');
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.mouseMovement.x = e.movementX;
                this.mouseMovement.y = e.movementY;
            }
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouseButtons.left = true;
                if (document.pointerLockElement) {
                    this.attack();
                } else {
                    document.body.requestPointerLock();
                }
            }
            if (e.button === 2) {
                this.mouseButtons.right = true;
                this.startBlock();
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseButtons.left = false;
            if (e.button === 2) {
                this.mouseButtons.right = false;
                this.stopBlock();
            }
        });
        
        window.addEventListener('wheel', (e) => {
            if (this.controller) {
                this.controller.zoom(e.deltaY * 0.01);
            }
        });
        
        // Prevent context menu
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    attack() {
        if (this.isBlocking) return;
        
        // Combo system
        if (!this.isAttacking || this.comboTimer > 0) {
            this.comboCount = Math.min(this.comboCount + 1, this.maxCombo);
            this.isAttacking = true;
            this.comboTimer = 0.5; // Window to continue combo
            
            this.stateMachine.setContext('isAttacking', true);
            this.stateMachine.setContext('comboCount', this.comboCount);
            
            console.log(`⚔️ Attack combo: ${this.comboCount}`);
        }
    }
    
    startBlock() {
        if (!this.isAttacking) {
            this.isBlocking = true;
            this.stateMachine.setContext('isBlocking', true);
        }
    }
    
    stopBlock() {
        this.isBlocking = false;
        this.stateMachine.setContext('isBlocking', false);
    }
    
    update(deltaTime, terrainHeightFn = null) {
        if (!this.controller) return;
        
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0 && !this.isAttacking) {
                this.comboCount = 0;
                this.stateMachine.setContext('comboCount', 0);
            }
        }
        
        // Process movement input
        let moveX = 0;
        let moveZ = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ = 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX = 1;
        
        const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const isJumping = this.keys['Space'];
        
        // Don't move while attacking (unless combo)
        if (!this.isAttacking || this.comboCount > 1) {
            this.controller.setMoveDirection(moveX, moveZ);
        } else {
            this.controller.setMoveDirection(0, 0);
        }
        
        this.controller.setRunning(isRunning);
        
        if (isJumping && !this.isAttacking) {
            this.controller.jump();
        }
        
        // Mouse look
        if (this.mouseMovement.x !== 0 || this.mouseMovement.y !== 0) {
            this.controller.look(this.mouseMovement.x, this.mouseMovement.y);
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }
        
        // Get terrain height before update
        let groundY = 0;
        if (terrainHeightFn) {
            const pos = this.character.position;
            groundY = terrainHeightFn(pos.x, pos.z);
        }
        
        // Update controller
        this.controller.update(deltaTime);
        
        // Sync with terrain
        if (terrainHeightFn) {
            const pos = this.character.position;
            groundY = terrainHeightFn(pos.x, pos.z);
            
            if (pos.y <= groundY + 0.1) {
                pos.y = groundY;
                this.controller.velocity.y = Math.max(0, this.controller.velocity.y);
                this.controller.isGrounded = true;
            }
        }
        
        // Update state machine
        const state = this.controller.getState();
        this.stateMachine.setContext('isMoving', state.isMoving);
        this.stateMachine.setContext('isRunning', state.isRunning);
        this.stateMachine.setContext('isGrounded', state.isGrounded);
        this.stateMachine.setContext('speed', state.speed);
        
        this.stateMachine.update(deltaTime);
        
        return {
            position: this.character.position.clone(),
            velocity: this.controller.getVelocity(),
            state: this.stateMachine.getCurrentStateName(),
            isGrounded: state.isGrounded,
            speed: state.speed,
            isAttacking: this.isAttacking,
            comboCount: this.comboCount
        };
    }
    
    setPosition(x, y, z) {
        this.controller.teleport(new THREE.Vector3(x, y, z));
    }
    
    getPosition() {
        return this.character.position.clone();
    }
    
    getCharacterData() {
        const state = this.controller.getState();
        return {
            position: this.character.position.clone(),
            velocity: this.controller.getVelocity(),
            state: this.stateMachine.getCurrentStateName(),
            speed: state.speed,
            isGrounded: state.isGrounded,
            isRunning: state.isRunning,
            isAttacking: this.isAttacking,
            comboCount: this.comboCount
        };
    }
    
    dispose() {
        if (this.character && this.scene) {
            this.scene.remove(this.character);
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
}

export default MeleeCharacter;

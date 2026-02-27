import * as THREE from 'three';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

/**
 * Animation states for the character
 */
export const AnimationState = {
    IDLE: 'idle',
    WALK: 'walk',
    RUN: 'run',
    JUMP: 'jump',
    FALL: 'fall',
    // Combat
    ATTACK_1: 'attack1',
    ATTACK_2: 'attack2',
    ATTACK_3: 'attack3',
    ATTACK_COMBO: 'attackCombo',
    BLOCK: 'block',
    DODGE: 'dodge',
    HIT: 'hit',
    DEATH: 'death',
    // Abilities/Magic
    CAST: 'cast',
    CAST_SPELL: 'castSpell',
    CAST_AOE: 'castAoe',
    CHANNEL: 'channel',
    // Ranged
    AIM: 'aim',
    SHOOT: 'shoot',
    THROW: 'throw'
};

/**
 * View modes
 */
export const ViewMode = {
    THIRD_PERSON: 'third',
    FIRST_PERSON: 'first'
};

/**
 * EnhancedCharacterController - Modern third-person controller with Mixamo support
 * Based on 3D-Game-Template-Ultimate patterns
 */
export class EnhancedCharacterController {
    constructor(scene, camera, domElement, config = {}) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;
        
        // Configuration
        this.config = {
            walkSpeed: config.walkSpeed || 18,
            runSpeed: config.runSpeed || 32,
            airSpeed: config.airSpeed || 6,
            jumpForce: config.jumpForce || 15,
            gravity: config.gravity || 30,
            
            // Camera settings
            cameraDistanceThird: config.cameraDistanceThird || 6,
            cameraHeightThird: config.cameraHeightThird || 2.8,
            cameraDistanceFirst: config.cameraDistanceFirst || 0.2,
            cameraHeightFirst: config.cameraHeightFirst || 1.0,
            cameraMinPitchThird: config.cameraMinPitchThird || -Math.PI / 3,
            cameraMaxPitchThird: config.cameraMaxPitchThird || Math.PI / 4,
            cameraMinPitchFirst: config.cameraMinPitchFirst || -Math.PI / 2 + 0.1,
            cameraMaxPitchFirst: config.cameraMaxPitchFirst || Math.PI / 2 - 0.1,
            cameraZoomMin: config.cameraZoomMin || 2.5,
            cameraZoomMax: config.cameraZoomMax || 12,
            cameraSensitivity: config.cameraSensitivity || 0.002,
            cameraLerpSpeed: config.cameraLerpSpeed || 8,
            
            // Animation
            animationFadeDuration: config.animationFadeDuration || 0.35,
            
            // Collision
            colliderRadius: config.colliderRadius || 0.35,
            colliderHeight: config.colliderHeight || 1.0,
            
            // Model
            modelScale: config.modelScale || 1.0,
            modelOffset: config.modelOffset || new THREE.Vector3(0, -1.0, 0)
        };
        
        // Player state
        this.collider = new Capsule(
            new THREE.Vector3(0, this.config.colliderRadius, 0),
            new THREE.Vector3(0, this.config.colliderHeight, 0),
            this.config.colliderRadius
        );
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.onFloor = false;
        this.isRunning = false;
        this.isDead = false;
        
        // Camera state
        this.viewMode = ViewMode.THIRD_PERSON;
        this.cameraYaw = 0;
        this.cameraPitch = 0.18;
        this.cameraDistance = this.config.cameraDistanceThird;
        this.cameraTarget = new THREE.Vector3();
        this.cameraOffset = new THREE.Vector3();
        
        // Input state
        this.keys = {};
        this.mouseTime = 0;
        this.pointerLocked = false;
        
        // Character model
        this.characterGroup = new THREE.Group();
        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.modelReady = false;
        
        // Combat state
        this.isAttacking = false;
        this.isCasting = false;
        this.attackCooldown = 0;
        this.abilityCooldown = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboWindow = 0.8; // seconds to chain combo
        
        // Mixamo animations registry
        this.mixamoAnimations = new Map();
        
        // Loaders
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader();
        
        // Callbacks
        this.onAttack = config.onAttack || null;
        this.onAbility = config.onAbility || null;
        this.onAnimationChange = config.onAnimationChange || null;
        this.onDamage = config.onDamage || null;
        
        // Temp vectors (reused for performance)
        this._tempVector = new THREE.Vector3();
        this._tempQuaternion = new THREE.Quaternion();
        this._horizontalVelocity = new THREE.Vector3();
        this._desiredForward = new THREE.Vector3();
        
        // Initialize
        this.scene.add(this.characterGroup);
        this.setupInputHandlers();
        
        console.log('🎮 EnhancedCharacterController initialized');
    }
    
    /**
     * Setup keyboard and mouse input handlers
     */
    setupInputHandlers() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === document.body;
        });
        
        // Scroll for zoom
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }
    
    onKeyDown(event) {
        if (event.repeat) return;
        this.keys[event.code] = true;
        
        // View toggle
        if (event.code === 'KeyV') {
            this.toggleViewMode();
        }
        
        // Ability keys (1-4)
        if (event.code === 'Digit1' || event.code === 'Numpad1') {
            this.castAbility(1);
        } else if (event.code === 'Digit2' || event.code === 'Numpad2') {
            this.castAbility(2);
        } else if (event.code === 'Digit3' || event.code === 'Numpad3') {
            this.castAbility(3);
        } else if (event.code === 'Digit4' || event.code === 'Numpad4') {
            this.castAbility(4);
        }
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseDown(event) {
        if (event.button === 0) { // LMB
            this.mouseTime = performance.now();
            
            // Attack on LMB
            if (this.pointerLocked && !this.isAttacking) {
                this.performAttack();
            }
        }
        
        if (event.button === 2) { // RMB - request pointer lock for camera
            document.body.requestPointerLock();
        }
    }
    
    onMouseUp(event) {
        // Could be used for charged attacks
    }
    
    onMouseMove(event) {
        if (this.pointerLocked) {
            this.cameraYaw -= event.movementX * this.config.cameraSensitivity;
            this.cameraPitch -= event.movementY * this.config.cameraSensitivity;
            this.clampCameraPitch();
        }
    }
    
    onWheel(event) {
        if (this.viewMode !== ViewMode.THIRD_PERSON) return;
        
        const zoomDelta = event.deltaY * 0.005;
        this.cameraDistance = THREE.MathUtils.clamp(
            this.cameraDistance + zoomDelta,
            this.config.cameraZoomMin,
            this.config.cameraZoomMax
        );
        event.preventDefault();
    }
    
    clampCameraPitch() {
        const limits = this.viewMode === ViewMode.FIRST_PERSON
            ? { min: this.config.cameraMinPitchFirst, max: this.config.cameraMaxPitchFirst }
            : { min: this.config.cameraMinPitchThird, max: this.config.cameraMaxPitchThird };
        
        this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch, limits.min, limits.max);
    }
    
    toggleViewMode() {
        this.viewMode = this.viewMode === ViewMode.THIRD_PERSON 
            ? ViewMode.FIRST_PERSON 
            : ViewMode.THIRD_PERSON;
        
        this.cameraPitch = this.viewMode === ViewMode.THIRD_PERSON ? 0.18 : 0;
        this.clampCameraPitch();
        
        if (this.modelReady) {
            this.characterGroup.visible = this.viewMode === ViewMode.THIRD_PERSON;
        }
        
        console.log(`📷 View mode: ${this.viewMode}`);
    }
    
    /**
     * Create a fallback placeholder character (capsule shape)
     */
    createPlaceholderCharacter() {
        const group = new THREE.Group();
        
        // Body (capsule-like)
        const bodyGeo = new THREE.CapsuleGeometry(0.35, 1.0, 8, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x4488ff, 
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.85;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 16, 12);
        const headMat = new THREE.MeshStandardMaterial({ 
            color: 0xffcc99, 
            roughness: 0.8 
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.65;
        head.castShadow = true;
        group.add(head);
        
        return group;
    }
    
    /**
     * Load a GLB/GLTF character model
     */
    async loadCharacterModel(modelPath, animationMap = {}) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                modelPath,
                (gltf) => {
                    // Remove any existing model
                    if (this.model) {
                        this.characterGroup.remove(this.model);
                    }
                    
                    this.model = gltf.scene;
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.model.scale.setScalar(this.config.modelScale);
                    this.model.rotation.y = Math.PI; // Face forward
                    
                    this.characterGroup.add(this.model);
                    this.characterGroup.visible = this.viewMode === ViewMode.THIRD_PERSON;
                    
                    // Setup animation mixer
                    this.mixer = new THREE.AnimationMixer(this.model);
                    
                    // Load embedded animations with fuzzy name matching
                    if (gltf.animations && gltf.animations.length > 0) {
                        console.log(`🎬 Found ${gltf.animations.length} animations:`, gltf.animations.map(c => c.name));
                        
                        gltf.animations.forEach((clip) => {
                            // Try exact mapping first
                            let name = animationMap[clip.name];
                            
                            // If no exact match, try fuzzy matching
                            if (!name) {
                                const clipLower = clip.name.toLowerCase();
                                // Check for common patterns
                                if (clipLower.includes('idle')) name = AnimationState.IDLE;
                                else if (clipLower.includes('walk')) name = AnimationState.WALK;
                                else if (clipLower.includes('run')) name = AnimationState.RUN;
                                else if (clipLower.includes('jump')) name = AnimationState.JUMP;
                                else if (clipLower.includes('fall')) name = AnimationState.FALL;
                                else if (clipLower.includes('attack') || clipLower.includes('slash')) name = AnimationState.ATTACK_1;
                                else name = clipLower.replace(/[^a-z0-9]/g, '_'); // fallback
                            }
                            
                            const action = this.mixer.clipAction(clip);
                            action.enabled = true;
                            action.setEffectiveTimeScale(1);
                            action.setEffectiveWeight(0);
                            this.actions[name] = action;
                            
                            // Also store by original name for debugging
                            if (clip.name !== name) {
                                this.actions[clip.name] = action;
                            }
                            
                            console.log(`   Mapped '${clip.name}' -> '${name}'`);
                        });
                    } else {
                        console.warn('⚠️ No animations found in GLB');
                    }
                    
                    this.modelReady = true;
                    
                    // Try to set idle, with fallback
                    if (!this.setAnimationState(AnimationState.IDLE)) {
                        // Try first available animation as fallback
                        const firstAnim = Object.keys(this.actions)[0];
                        if (firstAnim) {
                            console.log(`Using fallback animation: ${firstAnim}`);
                            this.setAnimationState(firstAnim);
                        }
                    }
                    
                    console.log(`✅ Character loaded: ${modelPath}`);
                    console.log(`   Available actions: ${Object.keys(this.actions).join(', ')}`);
                    resolve(this.model);
                },
                (progress) => {
                    // Loading progress
                    if (progress.total > 0) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        if (percent % 25 === 0) {
                            console.log(`Loading character: ${percent}%`);
                        }
                    }
                },
                (error) => {
                    console.warn(`⚠️ Failed to load character model: ${modelPath}`, error.message || error);
                    console.log('Using placeholder character instead');
                    
                    // Create placeholder
                    this.model = this.createPlaceholderCharacter();
                    this.characterGroup.add(this.model);
                    this.characterGroup.visible = this.viewMode === ViewMode.THIRD_PERSON;
                    this.modelReady = true;
                    
                    // No animations for placeholder
                    this.mixer = null;
                    
                    resolve(this.model); // Resolve instead of reject so game continues
                }
            );
        });
    }
    
    /**
     * Load KayKit animation packs (movement and general animations)
     * KayKit stores animations in separate GLB files, not embedded in character models
     */
    async loadKayKitAnimations(basePath = '/assets/characters/kaykit/') {
        if (!this.mixer) {
            console.warn('Cannot load animations - no mixer (model not loaded)');
            return [];
        }
        
        const animPacks = [
            'Rig_Medium_MovementBasic.glb',
            'Rig_Medium_General.glb'
        ];
        
        const animationMap = {
            // Movement
            'Idle_A': AnimationState.IDLE,
            'Idle_B': AnimationState.IDLE,
            'Walking_A': AnimationState.WALK,
            'Walking_B': AnimationState.WALK,
            'Running_A': AnimationState.RUN,
            'Running_B': AnimationState.RUN,
            'Jump_Full_Short': AnimationState.JUMP,
            'Jump_Full_Long': AnimationState.JUMP,
            'Jump_Idle': AnimationState.FALL,
            // Combat
            'Hit_A': AnimationState.HIT,
            'Death_A': AnimationState.DEATH,
            'Melee_Attack': AnimationState.ATTACK_1,
            '1H_Melee_Attack_Slice_Diagonal': AnimationState.ATTACK_1,
            '1H_Melee_Attack_Slice_Horizontal': AnimationState.ATTACK_2,
            '1H_Melee_Attack_Chop': AnimationState.ATTACK_3,
            '2H_Melee_Attack_Slice': AnimationState.ATTACK_1,
            '2H_Melee_Attack_Spin': AnimationState.ATTACK_COMBO,
            // Abilities/Magic
            'Spellcast_Shoot': AnimationState.CAST_SPELL,
            'Spellcast_Raise': AnimationState.CAST_AOE,
            'Spellcast_Long': AnimationState.CHANNEL,
            'Interact': AnimationState.CAST,
            // Ranged
            'Bow_Shoot': AnimationState.SHOOT,
            'Throw': AnimationState.THROW,
            // Defense
            'Blocking': AnimationState.BLOCK,
            'Dodge_Backward': AnimationState.DODGE
        };
        
        const loaded = [];
        
        for (const packFile of animPacks) {
            try {
                const gltf = await new Promise((resolve, reject) => {
                    this.gltfLoader.load(
                        basePath + packFile,
                        resolve,
                        undefined,
                        reject
                    );
                });
                
                if (gltf.animations && gltf.animations.length > 0) {
                    console.log(`🎬 Loading ${gltf.animations.length} animations from ${packFile}`);
                    
                    gltf.animations.forEach((clip) => {
                        // Map to standard name or keep original
                        const mappedName = animationMap[clip.name] || clip.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        
                        // Skip if we already have this animation (don't overwrite)
                        if (this.actions[mappedName] && mappedName !== clip.name) {
                            return;
                        }
                        
                        const action = this.mixer.clipAction(clip);
                        action.enabled = true;
                        action.setEffectiveTimeScale(1);
                        action.setEffectiveWeight(0);
                        
                        this.actions[mappedName] = action;
                        // Also store by original name
                        this.actions[clip.name] = action;
                        
                        loaded.push(mappedName);
                        console.log(`   ${clip.name} -> ${mappedName}`);
                    });
                }
            } catch (err) {
                console.warn(`⚠️ Could not load animation pack ${packFile}:`, err.message);
            }
        }
        
        console.log(`✅ Loaded ${loaded.length} KayKit animations`);
        
        // Now try to set idle animation
        if (this.actions[AnimationState.IDLE]) {
            this.setAnimationState(AnimationState.IDLE);
        }
        
        return loaded;
    }
    
    /**
     * Load a Mixamo FBX animation and add it to the character
     */
    async loadMixamoAnimation(animPath, animationName, options = {}) {
        return new Promise((resolve, reject) => {
            this.fbxLoader.load(
                animPath,
                (fbx) => {
                    if (fbx.animations && fbx.animations.length > 0) {
                        const clip = fbx.animations[0];
                        clip.name = animationName;
                        
                        // Retarget animation if needed
                        if (options.retarget && this.model) {
                            // Animation retargeting for Mixamo to custom skeleton
                            this.retargetMixamoAnimation(clip, options.retarget);
                        }
                        
                        const action = this.mixer.clipAction(clip);
                        action.enabled = true;
                        action.setEffectiveTimeScale(options.timeScale || 1);
                        action.setEffectiveWeight(0);
                        
                        // Configure loop mode
                        if (options.loop === false) {
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                        }
                        
                        this.actions[animationName] = action;
                        this.mixamoAnimations.set(animationName, {
                            clip,
                            action,
                            options
                        });
                        
                        console.log(`🎬 Mixamo animation loaded: ${animationName}`);
                        resolve(action);
                    } else {
                        reject(new Error('No animations found in FBX'));
                    }
                },
                undefined,
                (error) => {
                    console.error(`Failed to load Mixamo animation: ${animPath}`, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Load attack animations from Mixamo
     * Expected files in /assets/animations/mixamo/
     */
    async loadCombatAnimations(basePath = '/assets/animations/mixamo/') {
        const combatAnims = [
            { file: 'sword_slash_1.fbx', name: AnimationState.ATTACK_1, loop: false },
            { file: 'sword_slash_2.fbx', name: AnimationState.ATTACK_2, loop: false },
            { file: 'sword_slash_3.fbx', name: AnimationState.ATTACK_3, loop: false },
            { file: 'sword_combo.fbx', name: AnimationState.ATTACK_COMBO, loop: false },
            { file: 'block.fbx', name: AnimationState.BLOCK, loop: true },
            { file: 'dodge_roll.fbx', name: AnimationState.DODGE, loop: false },
            { file: 'hit_reaction.fbx', name: AnimationState.HIT, loop: false },
            { file: 'death.fbx', name: AnimationState.DEATH, loop: false },
            { file: 'spell_cast.fbx', name: AnimationState.CAST, loop: false }
        ];
        
        const loaded = [];
        
        for (const anim of combatAnims) {
            try {
                await this.loadMixamoAnimation(
                    basePath + anim.file,
                    anim.name,
                    { loop: anim.loop }
                );
                loaded.push(anim.name);
            } catch (err) {
                console.warn(`⚠️ Could not load ${anim.file}: ${err.message}`);
            }
        }
        
        console.log(`⚔️ Loaded ${loaded.length} combat animations`);
        return loaded;
    }
    
    /**
     * Retarget Mixamo animation to custom skeleton
     */
    retargetMixamoAnimation(clip, boneMapping) {
        // Mixamo bone name mapping to custom skeleton
        const defaultMapping = {
            'mixamorigHips': 'Hips',
            'mixamorigSpine': 'Spine',
            'mixamorigSpine1': 'Spine1',
            'mixamorigSpine2': 'Spine2',
            'mixamorigNeck': 'Neck',
            'mixamorigHead': 'Head',
            'mixamorigLeftShoulder': 'LeftShoulder',
            'mixamorigLeftArm': 'LeftArm',
            'mixamorigLeftForeArm': 'LeftForeArm',
            'mixamorigLeftHand': 'LeftHand',
            'mixamorigRightShoulder': 'RightShoulder',
            'mixamorigRightArm': 'RightArm',
            'mixamorigRightForeArm': 'RightForeArm',
            'mixamorigRightHand': 'RightHand',
            'mixamorigLeftUpLeg': 'LeftUpLeg',
            'mixamorigLeftLeg': 'LeftLeg',
            'mixamorigLeftFoot': 'LeftFoot',
            'mixamorigRightUpLeg': 'RightUpLeg',
            'mixamorigRightLeg': 'RightLeg',
            'mixamorigRightFoot': 'RightFoot'
        };
        
        const mapping = { ...defaultMapping, ...boneMapping };
        
        clip.tracks.forEach((track) => {
            // Extract bone name from track name (e.g., "mixamorigHips.position")
            const parts = track.name.split('.');
            const boneName = parts[0];
            
            if (mapping[boneName]) {
                parts[0] = mapping[boneName];
                track.name = parts.join('.');
            }
        });
    }
    
    /**
     * Set animation state with crossfade
     * @returns {boolean} true if animation was set successfully
     */
    setAnimationState(stateName) {
        if (!this.mixer) {
            return false;
        }
        
        if (!this.actions[stateName]) {
            // Try to find a similar animation
            const available = Object.keys(this.actions);
            const match = available.find(a => a.toLowerCase().includes(stateName.toLowerCase()));
            if (match) {
                stateName = match;
            } else {
                console.warn(`Animation '${stateName}' not found. Available: ${available.join(', ')}`);
                return false;
            }
        }
        
        if (this.currentAction === stateName) return true;
        
        const prevAction = this.currentAction ? this.actions[this.currentAction] : null;
        const nextAction = this.actions[stateName];
        
        this.currentAction = stateName;
        
        nextAction.enabled = true;
        nextAction.setEffectiveTimeScale(1);
        nextAction.setEffectiveWeight(1);
        nextAction.play();
        
        if (prevAction && prevAction !== nextAction) {
            // Sync timing for walk/run transitions
            if ((this.currentAction === AnimationState.WALK && stateName === AnimationState.RUN) ||
                (this.currentAction === AnimationState.RUN && stateName === AnimationState.WALK)) {
                const prevDuration = prevAction.getClip().duration || 1;
                const nextDuration = nextAction.getClip().duration || prevDuration;
                nextAction.time = (prevAction.time || 0) * (nextDuration / prevDuration);
            } else {
                nextAction.reset();
            }
            
            prevAction.crossFadeTo(nextAction, this.config.animationFadeDuration, true);
        } else {
            nextAction.reset();
            nextAction.fadeIn(this.config.animationFadeDuration);
        }
        
        // Callback
        if (this.onAnimationChange) {
            this.onAnimationChange(stateName);
        }
        
        return true;
    }
    
    /**
     * Perform attack
     */
    performAttack() {
        if (this.isAttacking || this.isCasting || this.isDead) return;
        
        this.isAttacking = true;
        
        // Combo system
        if (this.comboTimer > 0 && this.comboCount < 3) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        
        // Select attack animation based on combo
        let attackAnim = AnimationState.ATTACK_1;
        if (this.comboCount === 2 && this.actions[AnimationState.ATTACK_2]) {
            attackAnim = AnimationState.ATTACK_2;
        } else if (this.comboCount === 3 && this.actions[AnimationState.ATTACK_3]) {
            attackAnim = AnimationState.ATTACK_3;
        }
        
        this.setAnimationState(attackAnim);
        this.comboTimer = this.comboWindow;
        
        // Attack cooldown based on animation length
        const attackAction = this.actions[attackAnim];
        const attackDuration = attackAction ? attackAction.getClip().duration : 0.5;
        this.attackCooldown = attackDuration * 0.7; // Can start next attack at 70%
        
        // Callback
        if (this.onAttack) {
            this.onAttack({
                type: 'melee',
                comboCount: this.comboCount,
                position: this.getPosition(),
                direction: this.getForwardDirection()
            });
        }
        
        // Listen for animation end
        if (attackAction) {
            const onFinish = () => {
                this.isAttacking = false;
                this.mixer.removeEventListener('finished', onFinish);
            };
            this.mixer.addEventListener('finished', onFinish);
        } else {
            setTimeout(() => { this.isAttacking = false; }, 500);
        }
    }
    
    /**
     * Cast an ability (1-4 keys)
     * @param {number} slotNumber - Ability slot 1-4
     */
    castAbility(slotNumber) {
        if (this.isAttacking || this.isCasting || this.isDead) return;
        if (this.abilityCooldown > 0) return;
        
        this.isCasting = true;
        
        // Select ability animation based on slot
        let abilityAnim;
        let abilityType;
        
        switch (slotNumber) {
            case 1:
                abilityAnim = this.actions[AnimationState.CAST_SPELL] ? AnimationState.CAST_SPELL : AnimationState.CAST;
                abilityType = 'spell';
                break;
            case 2:
                abilityAnim = this.actions[AnimationState.CAST_AOE] ? AnimationState.CAST_AOE : AnimationState.CAST;
                abilityType = 'aoe';
                break;
            case 3:
                abilityAnim = this.actions[AnimationState.SHOOT] ? AnimationState.SHOOT : AnimationState.THROW;
                abilityType = 'ranged';
                break;
            case 4:
                abilityAnim = this.actions[AnimationState.CHANNEL] ? AnimationState.CHANNEL : AnimationState.CAST;
                abilityType = 'channel';
                break;
            default:
                abilityAnim = AnimationState.CAST;
                abilityType = 'generic';
        }
        
        // Fallback to attack if no ability animation
        if (!this.actions[abilityAnim]) {
            abilityAnim = AnimationState.ATTACK_1;
        }
        
        this.setAnimationState(abilityAnim);
        
        // Ability cooldown
        const abilityAction = this.actions[abilityAnim];
        const abilityDuration = abilityAction ? abilityAction.getClip().duration : 0.8;
        this.abilityCooldown = abilityDuration + 0.5; // Add extra cooldown
        
        // Callback
        if (this.onAbility) {
            this.onAbility({
                slot: slotNumber,
                type: abilityType,
                position: this.getPosition(),
                direction: this.getForwardDirection()
            });
        }
        
        console.log(`✨ Ability ${slotNumber} cast (${abilityType})`);
        
        // Listen for animation end
        if (abilityAction) {
            const onFinish = () => {
                this.isCasting = false;
                this.mixer.removeEventListener('finished', onFinish);
            };
            this.mixer.addEventListener('finished', onFinish);
        } else {
            setTimeout(() => { this.isCasting = false; }, 800);
        }
    }
    
    /**
     * Get forward vector based on camera
     */
    getForwardVector() {
        this.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();
        return this.direction;
    }
    
    /**
     * Get side vector based on camera
     */
    getSideVector() {
        this.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();
        this.direction.cross(this.camera.up);
        return this.direction;
    }
    
    /**
     * Get forward direction the character is facing
     */
    getForwardDirection() {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.characterGroup.quaternion);
        return forward;
    }
    
    /**
     * Check if movement keys are pressed
     */
    isMovementActive() {
        return !!(
            this.keys['KeyW'] || this.keys['ArrowUp'] ||
            this.keys['KeyS'] || this.keys['ArrowDown'] ||
            this.keys['KeyA'] || this.keys['ArrowLeft'] ||
            this.keys['KeyD'] || this.keys['ArrowRight']
        );
    }
    
    /**
     * Process movement controls
     */
    processControls(deltaTime) {
        if (this.isDead) return;
        
        const runKey = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const movementActive = this.isMovementActive();
        this.isRunning = !!(runKey && movementActive);
        
        const baseSpeed = this.onFloor 
            ? (this.isRunning ? this.config.runSpeed : this.config.walkSpeed)
            : this.config.airSpeed;
        const speedDelta = deltaTime * baseSpeed;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
        }
        
        // Jump
        if (this.onFloor && (this.keys['Space'] || this.keys['KeyX'])) {
            this.velocity.y = this.config.jumpForce;
        }
    }
    
    /**
     * Update player physics and position
     */
    updatePhysics(deltaTime, worldOctree = null) {
        // Apply gravity
        if (!this.onFloor) {
            this.velocity.y -= this.config.gravity * deltaTime;
        }
        
        // Apply damping
        let damping = Math.exp(-4 * deltaTime) - 1;
        if (!this.onFloor) {
            damping *= 0.1;
        }
        this.velocity.addScaledVector(this.velocity, damping);
        
        // Move collider
        const deltaPosition = this._tempVector.copy(this.velocity).multiplyScalar(deltaTime);
        this.collider.translate(deltaPosition);
        
        // World collision
        this.onFloor = false;
        if (worldOctree) {
            const result = worldOctree.capsuleIntersect(this.collider);
            if (result) {
                this.onFloor = result.normal.y > 0;
                
                if (!this.onFloor) {
                    this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
                }
                
                if (result.depth >= 1e-10) {
                    this.collider.translate(result.normal.multiplyScalar(result.depth));
                }
            }
        }
    }
    
    /**
     * Update character model position and rotation
     */
    updateCharacterModel(deltaTime = 0.016) {
        if (!this.modelReady) return;
        
        // Position at collider base - snap directly to avoid jitter
        const colliderBase = this._tempVector.copy(this.collider.start);
        colliderBase.y -= this.config.colliderRadius;
        
        // Use direct positioning for stability (no lerp = no jitter)
        this.characterGroup.position.copy(colliderBase);
        
        // Rotate toward velocity direction
        this._horizontalVelocity.copy(this.velocity);
        this._horizontalVelocity.y = 0;
        
        if (this._horizontalVelocity.lengthSq() > 0.5 && !this.isAttacking && !this.isCasting) {
            this._desiredForward.copy(this._horizontalVelocity).normalize();
            
            // Calculate target rotation angle from velocity direction
            // Add Math.PI because the model faces -Z by default (rotation.y = Math.PI in loadCharacterModel)
            const targetAngle = Math.atan2(this._desiredForward.x, this._desiredForward.z);
            
            // Create quaternion from euler angle
            this._tempQuaternion.setFromEuler(new THREE.Euler(0, targetAngle, 0));
            
            // Smooth rotation based on delta time
            const rotationSpeed = Math.min(1, deltaTime * 10);
            this.characterGroup.quaternion.slerp(this._tempQuaternion, rotationSpeed);
        }
    }
    
    /**
     * Update camera position
     */
    updateCamera(deltaTime) {
        // Camera target (above player)
        this.cameraTarget.copy(this.collider.end);
        this.cameraTarget.y += 0.2;
        
        const isThirdPerson = this.viewMode === ViewMode.THIRD_PERSON;
        const targetHeight = isThirdPerson ? this.config.cameraHeightThird : this.config.cameraHeightFirst;
        const targetDistance = isThirdPerson ? this.cameraDistance : this.config.cameraDistanceFirst;
        
        this.clampCameraPitch();
        
        // Calculate camera offset
        this.cameraOffset.set(0, targetHeight, targetDistance);
        const offsetEuler = new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, 'YXZ');
        this.cameraOffset.applyEuler(offsetEuler);
        
        // Lerp camera to desired position
        const desiredCameraPos = this.cameraTarget.clone().add(this.cameraOffset);
        this.camera.position.lerp(
            desiredCameraPos,
            THREE.MathUtils.clamp(deltaTime * this.config.cameraLerpSpeed, 0, 1)
        );
        this.camera.lookAt(this.cameraTarget);
        
        // Model visibility
        if (this.modelReady) {
            this.characterGroup.visible = isThirdPerson;
        }
    }
    
    /**
     * Update animations based on state
     */
    updateAnimations(deltaTime) {
        if (!this.modelReady || !this.mixer) return;
        
        this.mixer.update(deltaTime);
        
        // Update timers
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        if (this.abilityCooldown > 0) {
            this.abilityCooldown -= deltaTime;
        }
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
        
        // Don't change animation while attacking or casting
        if (this.isAttacking || this.isCasting) return;
        
        // Select animation based on state
        if (this.isDead) {
            this.setAnimationState(AnimationState.DEATH);
            return;
        }
        
        if (!this.onFloor) {
            if (this.velocity.y > 0) {
                this.setAnimationState(AnimationState.JUMP);
            } else {
                this.setAnimationState(AnimationState.FALL);
            }
            return;
        }
        
        const moving = this.isMovementActive();
        if (!moving) {
            this.setAnimationState(AnimationState.IDLE);
        } else {
            this.setAnimationState(this.isRunning ? AnimationState.RUN : AnimationState.WALK);
        }
    }
    
    /**
     * Main update - call every frame
     */
    update(deltaTime, worldOctree = null, getTerrainHeight = null) {
        this.processControls(deltaTime);
        this.updatePhysics(deltaTime, worldOctree);
        
        // Terrain height fallback (if no octree)
        if (!worldOctree && getTerrainHeight) {
            const pos = this.collider.end;
            const terrainY = getTerrainHeight(pos.x, pos.z);
            const groundLevel = terrainY + this.config.colliderRadius;
            
            // Check if we're at or below ground level
            if (this.collider.start.y <= groundLevel + 0.05) {
                // Snap to ground to prevent jitter
                this.collider.start.y = groundLevel;
                this.collider.end.y = terrainY + this.config.colliderHeight;
                
                // Only zero velocity if we were falling
                if (this.velocity.y < 0) {
                    this.velocity.y = 0;
                }
                this.onFloor = true;
            } else {
                this.onFloor = false;
            }
        }
        
        this.updateCharacterModel(deltaTime);
        this.updateCamera(deltaTime);
        this.updateAnimations(deltaTime);
    }
    
    /**
     * Get player position
     */
    getPosition() {
        return this.collider.end.clone();
    }
    
    /**
     * Set player position
     */
    setPosition(x, y, z) {
        const height = this.config.colliderHeight - this.config.colliderRadius;
        this.collider.start.set(x, y + this.config.colliderRadius, z);
        this.collider.end.set(x, y + this.config.colliderHeight, z);
        this.velocity.set(0, 0, 0);
    }
    
    /**
     * Take damage
     */
    takeDamage(amount, attacker = null) {
        if (this.isDead) return;
        
        // Play hit animation
        if (this.actions[AnimationState.HIT]) {
            this.setAnimationState(AnimationState.HIT);
        }
        
        if (this.onDamage) {
            this.onDamage({ amount, attacker });
        }
    }
    
    /**
     * Die
     */
    die() {
        this.isDead = true;
        this.setAnimationState(AnimationState.DEATH);
    }
    
    /**
     * Respawn
     */
    respawn(position = new THREE.Vector3(0, 5, 0)) {
        this.isDead = false;
        this.setPosition(position.x, position.y, position.z);
        this.setAnimationState(AnimationState.IDLE);
    }
    
    /**
     * Dispose
     */
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        if (this.characterGroup.parent) {
            this.characterGroup.parent.remove(this.characterGroup);
        }
        
        console.log('🧹 EnhancedCharacterController disposed');
    }
}

export default EnhancedCharacterController;

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WeaponAnimationController, WeaponType } from './WeaponAnimationController.js';
import { WeaponAttachmentSystem } from './WeaponAttachmentSystem.js';

export { WeaponType };

/**
 * KayKitCharacterSystem
 * 
 * Optimized character system using KayKit GLB models with GLTF loader.
 * KayKit characters are low-poly, optimized for web/mobile, CC0 licensed.
 * 
 * Features:
 * - GLTF/GLB loading (faster, smaller than FBX)
 * - Shared animation clips across all characters
 * - Automatic skeleton matching
 * - Smooth animation blending
 * - Movement state machine
 */

// Available KayKit character classes
export const KayKitCharacter = {
    BARBARIAN: { id: 'barbarian', file: 'Barbarian.glb', name: 'Barbarian', class: 'warrior' },
    KNIGHT: { id: 'knight', file: 'Knight.glb', name: 'Knight', class: 'warrior' },
    MAGE: { id: 'mage', file: 'Mage.glb', name: 'Mage', class: 'mage' },
    RANGER: { id: 'ranger', file: 'Ranger.glb', name: 'Ranger', class: 'ranger' },
    ROGUE: { id: 'rogue', file: 'Rogue.glb', name: 'Rogue', class: 'rogue' },
    ROGUE_HOODED: { id: 'rogue_hooded', file: 'Rogue_Hooded.glb', name: 'Rogue (Hooded)', class: 'rogue' }
};

// Animation packs
const ANIMATION_PACKS = {
    movement: 'Rig_Medium_MovementBasic.glb',
    general: 'Rig_Medium_General.glb'
};

// Movement states - mapped to actual KayKit animation names
export const KayKitMovementState = {
    IDLE: 'Idle_A',
    WALK: 'Walking_A',
    RUN: 'Running_A',
    JUMP: 'Jump_Full_Short'
};

// Combat animation states
export const KayKitCombatState = {
    MELEE_ATTACK: 'Melee_Attack',
    RANGED_ATTACK: 'Ranged_Attack',
    HIT: 'Hit_A',
    DEATH: 'Death_A'
};

/**
 * KayKitCharacterSystem
 */
export class KayKitCharacterSystem {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        
        // Configuration
        this.config = {
            basePath: options.basePath || '/assets/characters/kaykit/',
            scale: options.scale || 1.0,
            crossFadeDuration: options.crossFadeDuration || 0.2
        };
        
        // Loaders
        this.loader = new GLTFLoader();
        
        // State
        this.currentCharacter = null;
        this.currentModel = null;
        this.mixer = null;
        this.actions = new Map();
        this.currentAction = null;
        this.currentState = KayKitMovementState.IDLE;
        
        // Animation clips (shared across characters)
        this.animationClips = new Map();
        this.animationsLoaded = false;
        
        // Character cache
        this.characterCache = new Map();
        
        // Tracking
        this.followTarget = null;
        this.followOffset = new THREE.Vector3(0, 0, 0);
        
        // Movement input
        this.movementInput = {
            forward: 0,
            right: 0,
            isRunning: false,
            isJumping: false
        };
        
        // Combat state
        this.isAttacking = false;
        this.weaponType = 'melee'; // 'melee' or 'ranged'

        // ── Weapon systems (opt-in via initWeaponSystems()) ──
        /** @type {WeaponAnimationController|null} */
        this.weaponAnim   = null;
        /** @type {WeaponAttachmentSystem|null} */
        this.weaponAttach = null;
        
        console.log('🎮 KayKitCharacterSystem initialized');
    }
    
    /**
     * Initialize with a character
     */
    async init(characterId = 'knight') {
        // Load animations first
        await this.loadAnimations();
        
        // Load character
        await this.loadCharacter(characterId);
        
        // Start with idle
        this.playAnimation(KayKitMovementState.IDLE);
        
        return this.currentModel;
    }
    
    /**
     * Load animation packs
     */
    async loadAnimations() {
        if (this.animationsLoaded) return;
        
        console.log('[KayKit] Loading animation packs...');
        
        try {
            // Load movement animations
            const movementGltf = await this.loadGLTF(this.config.basePath + ANIMATION_PACKS.movement);
            if (movementGltf.animations) {
                movementGltf.animations.forEach(clip => {
                    this.animationClips.set(clip.name, clip);
                    console.log(`[KayKit] Loaded animation: ${clip.name}`);
                });
            }
            
            // Load general animations
            const generalGltf = await this.loadGLTF(this.config.basePath + ANIMATION_PACKS.general);
            if (generalGltf.animations) {
                generalGltf.animations.forEach(clip => {
                    if (!this.animationClips.has(clip.name)) {
                        this.animationClips.set(clip.name, clip);
                        console.log(`[KayKit] Loaded animation: ${clip.name}`);
                    }
                });
            }
            
            this.animationsLoaded = true;
            console.log(`[KayKit] Loaded ${this.animationClips.size} animations`);
        } catch (error) {
            console.error('[KayKit] Failed to load animations:', error);
        }
    }
    
    /**
     * Load GLTF file
     */
    loadGLTF(path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => resolve(gltf),
                (progress) => {
                    if (progress.total > 0) {
                        const pct = Math.round((progress.loaded / progress.total) * 100);
                        if (pct % 25 === 0) console.log(`[KayKit] Loading: ${pct}%`);
                    }
                },
                (error) => reject(error)
            );
        });
    }
    
    /**
     * Load a character by ID
     */
    async loadCharacter(characterId) {
        const charDef = Object.values(KayKitCharacter).find(c => c.id === characterId);
        if (!charDef) {
            console.warn(`[KayKit] Unknown character: ${characterId}`);
            return null;
        }
        
        // Check cache
        if (this.characterCache.has(characterId)) {
            return this.switchToCharacter(characterId);
        }
        
        console.log(`[KayKit] Loading character: ${charDef.name}`);
        
        try {
            const gltf = await this.loadGLTF(this.config.basePath + charDef.file);
            const model = gltf.scene;
            
            // Setup model
            model.scale.setScalar(this.config.scale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                }
            });
            
            // Cache character
            this.characterCache.set(characterId, {
                definition: charDef,
                model: model,
                animations: gltf.animations || []
            });
            
        // Switch to this character
        const model = await this.switchToCharacter(characterId);

        // Re-wire WeaponAnimationController to the new mixer if it exists
        if (this.weaponAnim && this.mixer) {
            this.weaponAnim.attachMixer(this.mixer, this.actions);
        }

        return model;
            
        } catch (error) {
            console.error(`[KayKit] Failed to load ${charDef.name}:`, error);
            return null;
        }
    }
    
    /**
     * Switch to a cached character
     */
    switchToCharacter(characterId) {
        const cached = this.characterCache.get(characterId);
        if (!cached) return null;
        
        // Remove current model
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        // Stop current mixer
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        // Add new model
        this.currentModel = cached.model;
        this.currentCharacter = cached.definition;
        this.scene.add(this.currentModel);
        
        // Create new mixer
        this.mixer = new THREE.AnimationMixer(this.currentModel);
        
        // Create actions from shared animation clips
        this.actions.clear();
        this.animationClips.forEach((clip, name) => {
            const action = this.mixer.clipAction(clip);
            this.actions.set(name, action);
        });
        
        // Also add character-specific animations if any
        cached.animations.forEach(clip => {
            if (!this.actions.has(clip.name)) {
                const action = this.mixer.clipAction(clip);
                this.actions.set(clip.name, action);
            }
        });
        
        // Play current state
        this.playAnimation(this.currentState);
        
        console.log(`[KayKit] Switched to: ${cached.definition.name}`);
        return this.currentModel;
    }
    
    /**
     * Play animation by name with crossfade
     */
    playAnimation(name, options = {}) {
        let action = this.actions.get(name);
        
        // Try alternate names if not found
        if (!action) {
            const alternateName = this.findAlternateAnimation(name);
            if (alternateName) {
                action = this.actions.get(alternateName);
            }
        }
        
        if (!action) {
            console.warn(`[KayKit] Animation not found: ${name}, available:`, Array.from(this.actions.keys()).join(', '));
            return false;
        }
        
        // Same animation
        if (this.currentAction === action && action.isRunning()) {
            return true;
        }
        
        const fadeDuration = options.immediate ? 0 : this.config.crossFadeDuration;
        
        // Crossfade from previous
        if (this.currentAction && this.currentAction !== action) {
            if (fadeDuration > 0) {
                this.currentAction.fadeOut(fadeDuration);
            } else {
                this.currentAction.stop();
            }
        }
        
        // Play new action
        action.reset();
        action.setEffectiveWeight(1);
        
        // Configure looping
        if (options.loop === false) {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        } else {
            action.setLoop(THREE.LoopRepeat);
        }
        
        if (fadeDuration > 0) {
            action.fadeIn(fadeDuration);
        }
        
        action.play();
        this.currentAction = action;
        
        return true;
    }
    
    /**
     * Find alternate animation name
     */
    findAlternateAnimation(name) {
        // Map common names to actual KayKit animation names
        const nameMap = {
            // Idle variations
            'idle': 'Idle_A',
            'Idle': 'Idle_A',
            'Idle_A': 'Idle_A',
            'Idle_B': 'Idle_B',
            
            // Walk variations
            'walk': 'Walking_A',
            'Walk': 'Walking_A',
            'Walking_A': 'Walking_A',
            'Walking_B': 'Walking_B',
            
            // Run variations
            'run': 'Running_A',
            'Run': 'Running_A',
            'Running_A': 'Running_A',
            'Running_B': 'Running_B',
            
            // Jump variations
            'jump': 'Jump_Full_Short',
            'Jump': 'Jump_Full_Short',
            'Jump_Full_Short': 'Jump_Full_Short',
            'Jump_Full_Long': 'Jump_Full_Long',
            'Jump_Start': 'Jump_Start',
            'Jump_Land': 'Jump_Land',
            
            // Combat/misc
            'death': 'Death_A',
            'Death': 'Death_A',
            'hit': 'Hit_A',
            'Hit': 'Hit_A',
            'interact': 'Interact',
            'pickup': 'PickUp',
            'throw': 'Throw',
            
            // Attack animations - map to best available
            'Melee_Attack': '1H_Melee_Attack_Slice_Diagonal',
            'melee_attack': '1H_Melee_Attack_Slice_Diagonal',
            'melee': '1H_Melee_Attack_Slice_Diagonal',
            'attack': '1H_Melee_Attack_Slice_Diagonal',
            'Ranged_Attack': '1H_Ranged_Shoot',
            'ranged_attack': '1H_Ranged_Shoot',
            'ranged': '1H_Ranged_Shoot',
            'shoot': '1H_Ranged_Shoot'
        };
        
        if (nameMap[name] && this.actions.has(nameMap[name])) {
            return nameMap[name];
        }
        
        // Try partial match (e.g., 'Idle' matches 'Idle_A')
        const nameLower = name.toLowerCase();
        for (const [key, action] of this.actions) {
            if (key.toLowerCase().startsWith(nameLower) || 
                key.toLowerCase().includes(nameLower)) {
                return key;
            }
        }
        
        return null;
    }
    
    /**
     * Set movement input and update animation
     */
    setMovementInput(forward, right, isRunning = false, isJumping = false) {
        this.movementInput = { forward, right, isRunning, isJumping };
        if (this.weaponAnim) {
            this.weaponAnim.setMovementInput(forward, right, isRunning, isJumping);
        } else {
            this.updateMovementAnimation();
        }
    }
    
    /**
     * Update animation based on movement
     */
    updateMovementAnimation() {
        const { forward, right, isRunning, isJumping } = this.movementInput;
        
        let newState = KayKitMovementState.IDLE;
        
        // Priority: Jump > Run > Walk > Idle
        if (isJumping) {
            newState = KayKitMovementState.JUMP;
        } else if (Math.abs(forward) > 0.1 || Math.abs(right) > 0.1) {
            newState = isRunning ? KayKitMovementState.RUN : KayKitMovementState.WALK;
        }
        
        if (newState !== this.currentState) {
            console.log(`[KayKit] Animation: ${this.currentState} -> ${newState}`);
            this.currentState = newState;
            this.playAnimation(newState);
        }
    }
    
    /**
     * Play attack animation (melee or ranged).
     * Delegates to WeaponAnimationController when active.
     */
    playAttackAnimation(type = 'melee') {
        if (this.weaponAnim) {
            return this.weaponAnim.attack();
        }
        if (this.isAttacking) return false;
        
        this.isAttacking = true;
        this.weaponType = type;
        
        // Choose animation based on weapon type
        const attackAnims = {
            melee: ['1H_Melee_Attack_Slice_Diagonal', '1H_Melee_Attack_Slice_Horizontal', '1H_Melee_Attack_Stab', 'Melee_Attack'],
            ranged: ['1H_Ranged_Shoot', '2H_Ranged_Shoot', 'Ranged_Attack', 'Throw']
        };
        
        const anims = attackAnims[type] || attackAnims.melee;
        let animName = null;
        
        // Find first available animation
        for (const anim of anims) {
            if (this.actions.has(anim) || this.animationClips.has(anim)) {
                animName = anim;
                break;
            }
            // Try alternate names
            const alt = this.findAlternateAnimation(anim);
            if (alt) {
                animName = alt;
                break;
            }
        }
        
        if (animName) {
            console.log(`[KayKit] Attack animation: ${animName}`);
            this.playAnimation(animName, { loop: false });
            
            // Return to idle/movement after attack
            const attackDuration = type === 'melee' ? 500 : 800;
            setTimeout(() => {
                this.isAttacking = false;
                this.updateMovementAnimation();
            }, attackDuration);
            
            return true;
        } else {
            console.warn(`[KayKit] No attack animation found for type: ${type}`);
            this.isAttacking = false;
            return false;
        }
    }
    
    /**
     * Initialise the WeaponAnimationController + WeaponAttachmentSystem.
     * Call once after init(), then optionally call equipWeapon() to attach meshes.
     *
     * @param {string} [weaponType] - Initial WeaponType (default: WeaponType.NONE)
     * @returns {Promise<{weaponAnim: WeaponAnimationController, weaponAttach: WeaponAttachmentSystem}>}
     */
    async initWeaponSystems(weaponType = WeaponType.NONE) {
        if (!this.mixer) {
            console.warn('[KayKit] initWeaponSystems() called before character loaded — call init() first');
            return null;
        }

        this.weaponAnim = new WeaponAnimationController({
            mixer:         this.mixer,
            kayKitActions: this.actions,
        });

        this.weaponAttach = new WeaponAttachmentSystem();

        // Load base (weapon-agnostic) FBX animations; falls back to KayKit clips silently
        await this.weaponAnim.loadBaseAnimations();
        await this.weaponAnim.setWeaponType(weaponType);

        console.log('[KayKit] Weapon systems ready — type:', weaponType);
        return { weaponAnim: this.weaponAnim, weaponAttach: this.weaponAttach };
    }

    /**
     * Equip a weapon on the current character.
     * Requires initWeaponSystems() to have been called first.
     *
     * @param {string} weaponType     - WeaponType constant
     * @param {string} [meshPath]     - Path to weapon GLB/FBX
     * @param {string} [secondaryPath]- Path to shield / off-hand weapon
     * @returns {Promise<void>}
     */
    async equipWeapon(weaponType, meshPath = null, secondaryPath = null) {
        if (!this.weaponAnim || !this.weaponAttach) {
            console.warn('[KayKit] Call initWeaponSystems() before equipWeapon()');
            return;
        }

        // Switch animation set
        await this.weaponAnim.setWeaponType(weaponType);

        // Attach weapon mesh(es) to bones
        if (meshPath && this.currentModel) {
            await this.weaponAttach.equip(this.currentModel, weaponType, meshPath, secondaryPath);
        }
    }

    /**
     * Set weapon type
     */
    setWeaponType(type) {
        this.weaponType = type;
        if (this.weaponAnim) {
            this.weaponAnim.setWeaponType(type);
        }
    }
    
    /**
     * Set follow target
     */
    setFollowTarget(target, offset = null) {
        this.followTarget = target;
        if (offset) {
            this.followOffset.copy(offset);
        }
    }
    
    /**
     * Set position
     */
    setPosition(x, y, z) {
        if (this.currentModel) {
            this.currentModel.position.set(x, y, z);
        }
    }
    
    /**
     * Get position
     */
    getPosition() {
        return this.currentModel ? this.currentModel.position.clone() : new THREE.Vector3();
    }
    
    /**
     * Set rotation
     */
    setRotation(y) {
        if (this.currentModel) {
            this.currentModel.rotation.y = y;
        }
    }
    
    /**
     * Update (call each frame)
     */
    update(deltaTime) {
        // Update mixer — always owned here; WeaponAnimationController does NOT call mixer.update
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Weapon animation timer logic (combo windows, stun timers)
        if (this.weaponAnim) {
            this.weaponAnim.update(deltaTime);
        }
        
        // Follow target
        if (this.followTarget && this.currentModel) {
            let targetPos;
            if (this.followTarget.position) {
                targetPos = this.followTarget.position;
            } else if (typeof this.followTarget === 'function') {
                targetPos = this.followTarget();
            }
            
            if (targetPos) {
                this.currentModel.position.copy(targetPos).add(this.followOffset);
            }
            
            // Copy rotation directly - WoWCameraController already calculates the correct facing direction
            if (this.followTarget.rotation) {
                this.currentModel.rotation.y = this.followTarget.rotation.y;
            }
        }
    }
    
    /**
     * Get all available characters
     */
    getAvailableCharacters() {
        return Object.values(KayKitCharacter);
    }
    
    /**
     * Get all loaded animation names
     */
    getAnimationNames() {
        return Array.from(this.animationClips.keys());
    }
    
    /**
     * Get current character info
     */
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    /**
     * Preload multiple characters
     */
    async preloadCharacters(characterIds) {
        const promises = characterIds.map(id => this.loadCharacter(id));
        await Promise.all(promises);
    }
    
    /**
     * Dispose
     */
    dispose() {
        if (this.weaponAnim)   this.weaponAnim.dispose();
        if (this.weaponAttach) this.weaponAttach.dispose();

        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        this.characterCache.forEach((cached) => {
            if (cached.model) {
                cached.model.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        });
        
        this.characterCache.clear();
        this.animationClips.clear();
        this.actions.clear();
    }
}

export default KayKitCharacterSystem;

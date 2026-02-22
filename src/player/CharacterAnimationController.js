import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * CharacterAnimationController
 * 
 * A modular animation system that can be attached to any character model.
 * Handles smooth blending, state machines, and optimal performance.
 * 
 * Features:
 * - Load animations once, apply to any compatible skeleton
 * - Smooth crossfade transitions
 * - Movement state machine (idle, walk, run, strafe)
 * - Combat state machine (attack combos, block, hit reactions)
 * - Additive animation layers for breathing, look-at
 * - Animation events and callbacks
 */

// Animation categories
export const AnimationCategory = {
    LOCOMOTION: 'locomotion',
    COMBAT: 'combat',
    ACTIONS: 'actions',
    EMOTES: 'emotes',
    REACTIONS: 'reactions'
};

// Movement states
export const MovementState = {
    IDLE: 'idle',
    WALK_FORWARD: 'walkForward',
    WALK_BACK: 'walkBack',
    WALK_LEFT: 'walkLeft',
    WALK_RIGHT: 'walkRight',
    RUN_FORWARD: 'runForward',
    RUN_BACK: 'runBack',
    JUMP: 'jump',
    FALL: 'fall',
    LAND: 'land',
    CROUCH_IDLE: 'crouchIdle',
    TURN_LEFT: 'turnLeft',
    TURN_RIGHT: 'turnRight'
};

// Combat states
export const CombatState = {
    NONE: 'none',
    ATTACK_1: 'attack1',
    ATTACK_2: 'attack2',
    ATTACK_3: 'attack3',
    COMBO_1: 'combo1',
    COMBO_2: 'combo2',
    COMBO_3: 'combo3',
    BLOCK: 'block',
    BLOCK_HIT: 'blockHit',
    HIT_LEFT: 'hitLeft',
    HIT_RIGHT: 'hitRight',
    HIT_GUT: 'hitGut'
};

// Animation definitions with file mappings
const ANIMATION_DEFINITIONS = {
    // === LOCOMOTION ===
    idle: { file: 'standing idle.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    idleVariant1: { file: 'standing idle looking ver. 1.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    idleVariant2: { file: 'standing idle looking ver. 2.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    walkForward: { file: 'standing walk forward.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    walkBack: { file: 'standing walk back.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    walkLeft: { file: 'standing walk left.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    walkRight: { file: 'standing walk right.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    runForward: { file: 'standing run forward.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    runBack: { file: 'standing run back.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    jump: { file: 'standing jump.fbx', loop: false, category: AnimationCategory.LOCOMOTION },
    jumpRunning: { file: 'unarmed jump running.fbx', loop: false, category: AnimationCategory.LOCOMOTION },
    turnLeft: { file: 'standing turn left 90.fbx', loop: false, category: AnimationCategory.LOCOMOTION },
    turnRight: { file: 'standing turn right 90.fbx', loop: false, category: AnimationCategory.LOCOMOTION },
    crouchIdle: { file: 'crouch idle.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    crouchToStand: { file: 'crouch to standing idle.fbx', loop: false, category: AnimationCategory.LOCOMOTION },
    
    // === UNARMED LOCOMOTION ===
    idleUnarmed: { file: 'unarmed idle.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    walkForwardUnarmed: { file: 'unarmed walk forward.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    walkBackUnarmed: { file: 'unarmed walk back.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    runForwardUnarmed: { file: 'unarmed run forward.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    runBackUnarmed: { file: 'unarmed run back.fbx', loop: true, category: AnimationCategory.LOCOMOTION },
    jumpUnarmed: { file: 'unarmed jump.fbx', loop: false, category: AnimationCategory.LOCOMOTION },
    
    // === COMBAT ===
    attack1: { file: 'standing melee attack horizontal.fbx', loop: false, category: AnimationCategory.COMBAT },
    attack2: { file: 'standing melee attack downward.fbx', loop: false, category: AnimationCategory.COMBAT },
    attack3: { file: 'standing melee attack backhand.fbx', loop: false, category: AnimationCategory.COMBAT },
    attack360High: { file: 'standing melee attack 360 high.fbx', loop: false, category: AnimationCategory.COMBAT },
    attack360Low: { file: 'standing melee attack 360 low.fbx', loop: false, category: AnimationCategory.COMBAT },
    attackKick1: { file: 'standing melee attack kick ver. 1.fbx', loop: false, category: AnimationCategory.COMBAT },
    attackKick2: { file: 'standing melee attack kick ver. 2.fbx', loop: false, category: AnimationCategory.COMBAT },
    combo1: { file: 'standing melee combo attack ver. 1.fbx', loop: false, category: AnimationCategory.COMBAT },
    combo2: { file: 'standing melee combo attack ver. 2.fbx', loop: false, category: AnimationCategory.COMBAT },
    combo3: { file: 'standing melee combo attack ver. 3.fbx', loop: false, category: AnimationCategory.COMBAT },
    jumpAttack: { file: 'standing melee run jump attack.fbx', loop: false, category: AnimationCategory.COMBAT },
    block: { file: 'standing block idle.fbx', loop: true, category: AnimationCategory.COMBAT },
    blockHit: { file: 'standing block react large.fbx', loop: false, category: AnimationCategory.COMBAT },
    
    // === REACTIONS ===
    hitLeft: { file: 'standing react large from left.fbx', loop: false, category: AnimationCategory.REACTIONS },
    hitRight: { file: 'standing react large from right.fbx', loop: false, category: AnimationCategory.REACTIONS },
    hitGut: { file: 'standing react large gut.fbx', loop: false, category: AnimationCategory.REACTIONS },
    
    // === ACTIONS ===
    equipShoulder: { file: 'unarmed equip over shoulder.fbx', loop: false, category: AnimationCategory.ACTIONS },
    equipUnderarm: { file: 'unarmed equip underarm.fbx', loop: false, category: AnimationCategory.ACTIONS },
    disarmShoulder: { file: 'standing disarm over shoulder.fbx', loop: false, category: AnimationCategory.ACTIONS },
    disarmUnderarm: { file: 'standing disarm underarm.fbx', loop: false, category: AnimationCategory.ACTIONS },
    
    // === EMOTES ===
    tauntBattlecry: { file: 'standing taunt battlecry.fbx', loop: false, category: AnimationCategory.EMOTES },
    tauntChest: { file: 'standing taunt chest thump.fbx', loop: false, category: AnimationCategory.EMOTES }
};

/**
 * Animation clip cache - load once, use for all characters
 */
class AnimationCache {
    constructor() {
        this.clips = new Map();
        this.loading = new Map();
        this.loader = new FBXLoader();
        this.basePath = '/assets/melee-axe/';
    }
    
    async loadClip(name, definition) {
        // Already cached
        if (this.clips.has(name)) {
            return this.clips.get(name);
        }
        
        // Already loading
        if (this.loading.has(name)) {
            return this.loading.get(name);
        }
        
        // Start loading
        const loadPromise = new Promise((resolve, reject) => {
            this.loader.load(
                this.basePath + definition.file,
                (fbx) => {
                    if (fbx.animations && fbx.animations.length > 0) {
                        const clip = fbx.animations[0];
                        clip.name = name;
                        this.clips.set(name, clip);
                        resolve(clip);
                    } else {
                        resolve(null);
                    }
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load animation: ${name}`, error);
                    resolve(null);
                }
            );
        });
        
        this.loading.set(name, loadPromise);
        return loadPromise;
    }
    
    async loadAll() {
        const promises = Object.entries(ANIMATION_DEFINITIONS).map(
            ([name, def]) => this.loadClip(name, def)
        );
        await Promise.all(promises);
        console.log(`📦 Animation cache loaded: ${this.clips.size} animations`);
        return this.clips;
    }
    
    getClip(name) {
        return this.clips.get(name);
    }
}

// Global animation cache singleton
const animationCache = new AnimationCache();

/**
 * CharacterAnimationController
 */
export class CharacterAnimationController {
    constructor(character, options = {}) {
        this.character = character;
        this.mixer = null;
        this.actions = new Map();
        
        // Configuration
        this.config = {
            crossFadeDuration: options.crossFadeDuration || 0.2,
            fastCrossFade: options.fastCrossFade || 0.1,
            idleVariationInterval: options.idleVariationInterval || 8,
            useWeaponAnimations: options.useWeaponAnimations !== false,
            ...options
        };
        
        // State
        this.currentState = MovementState.IDLE;
        this.previousState = null;
        this.currentAction = null;
        this.previousAction = null;
        this.isLocked = false; // Lock during non-interruptible animations
        this.lockedUntil = 0;
        
        // Combat state
        this.combatState = CombatState.NONE;
        this.comboCount = 0;
        this.comboWindow = 0;
        this.lastAttackTime = 0;
        
        // Timers
        this.idleTimer = 0;
        this.stateTimer = 0;
        
        // Movement input for blending
        this.movementInput = {
            forward: 0,
            right: 0,
            isRunning: false,
            isJumping: false,
            isCrouching: false
        };
        
        // Callbacks
        this.onAnimationStart = null;
        this.onAnimationEnd = null;
        this.onComboWindow = null;
        
        // Initialize mixer
        if (character) {
            this.mixer = new THREE.AnimationMixer(character);
            this.mixer.addEventListener('finished', this.onActionFinished.bind(this));
        }
    }
    
    /**
     * Initialize - load all animations and create actions
     */
    async init() {
        // Load animation cache if not already loaded
        if (animationCache.clips.size === 0) {
            await animationCache.loadAll();
        }
        
        // Create actions for this character's mixer
        this.createActions();
        
        // Start with idle
        this.playAnimation('idle', { immediate: true });
        
        console.log('🎬 CharacterAnimationController ready');
        return this;
    }
    
    /**
     * Create animation actions from cached clips
     */
    createActions() {
        if (!this.mixer) return;
        
        animationCache.clips.forEach((clip, name) => {
            if (!clip) return;
            
            const action = this.mixer.clipAction(clip);
            const def = ANIMATION_DEFINITIONS[name];
            
            // Configure based on definition
            if (def) {
                action.setLoop(def.loop ? THREE.LoopRepeat : THREE.LoopOnce);
                if (!def.loop) {
                    action.clampWhenFinished = true;
                }
            }
            
            this.actions.set(name, action);
        });
    }
    
    /**
     * Play animation with smooth crossfade
     */
    playAnimation(name, options = {}) {
        const action = this.actions.get(name);
        if (!action) {
            console.warn(`Animation not found: ${name}`);
            return false;
        }
        
        // Check if locked (unless forced)
        if (this.isLocked && !options.force && Date.now() < this.lockedUntil) {
            return false;
        }
        
        // Same animation already playing
        if (this.currentAction === action && action.isRunning()) {
            return true;
        }
        
        const fadeDuration = options.immediate ? 0 : 
            (options.fast ? this.config.fastCrossFade : this.config.crossFadeDuration);
        
        // Crossfade from previous
        if (this.currentAction && this.currentAction !== action) {
            this.previousAction = this.currentAction;
            
            if (fadeDuration > 0) {
                this.currentAction.fadeOut(fadeDuration);
            } else {
                this.currentAction.stop();
            }
        }
        
        // Play new action
        action.reset();
        action.setEffectiveTimeScale(options.timeScale || 1);
        action.setEffectiveWeight(1);
        
        if (fadeDuration > 0) {
            action.fadeIn(fadeDuration);
        }
        
        action.play();
        this.currentAction = action;
        
        // Lock if specified
        if (options.lockDuration) {
            this.isLocked = true;
            this.lockedUntil = Date.now() + options.lockDuration;
        }
        
        // Callback
        if (this.onAnimationStart) {
            this.onAnimationStart(name);
        }
        
        return true;
    }
    
    /**
     * Handle animation finished event
     */
    onActionFinished(event) {
        const action = event.action;
        const name = this.getActionName(action);
        
        // Unlock
        this.isLocked = false;
        
        // Return to idle after one-shot animations
        const def = ANIMATION_DEFINITIONS[name];
        if (def && !def.loop) {
            // Combat animations return to idle or continue combo
            if (def.category === AnimationCategory.COMBAT) {
                if (this.comboWindow > 0) {
                    // Combo window still open - wait for input
                } else {
                    this.combatState = CombatState.NONE;
                    this.updateMovementAnimation();
                }
            } else {
                this.updateMovementAnimation();
            }
        }
        
        // Callback
        if (this.onAnimationEnd) {
            this.onAnimationEnd(name);
        }
    }
    
    /**
     * Get action name from action object
     */
    getActionName(action) {
        for (const [name, act] of this.actions) {
            if (act === action) return name;
        }
        return null;
    }
    
    /**
     * Update movement state from input
     */
    setMovementInput(forward, right, isRunning = false, isJumping = false, isCrouching = false) {
        this.movementInput = { forward, right, isRunning, isJumping, isCrouching };
        
        if (!this.isLocked) {
            this.updateMovementAnimation();
        }
    }
    
    /**
     * Determine and play appropriate movement animation
     */
    updateMovementAnimation() {
        const { forward, right, isRunning, isJumping, isCrouching } = this.movementInput;
        
        let newState = MovementState.IDLE;
        
        if (isJumping) {
            newState = isRunning ? MovementState.JUMP : MovementState.JUMP;
        } else if (isCrouching) {
            newState = MovementState.CROUCH_IDLE;
        } else if (Math.abs(forward) > 0.1 || Math.abs(right) > 0.1) {
            // Determine direction
            if (forward > 0.1) {
                newState = isRunning ? MovementState.RUN_FORWARD : MovementState.WALK_FORWARD;
            } else if (forward < -0.1) {
                newState = isRunning ? MovementState.RUN_BACK : MovementState.WALK_BACK;
            } else if (right > 0.1) {
                newState = MovementState.WALK_RIGHT;
            } else if (right < -0.1) {
                newState = MovementState.WALK_LEFT;
            }
        }
        
        // Only change if different
        if (newState !== this.currentState) {
            this.previousState = this.currentState;
            this.currentState = newState;
            this.stateTimer = 0;
            
            // Map state to animation name
            const animName = this.getAnimationForState(newState);
            this.playAnimation(animName);
        }
    }
    
    /**
     * Map movement state to animation name
     */
    getAnimationForState(state) {
        const armed = this.config.useWeaponAnimations;
        
        switch (state) {
            case MovementState.IDLE:
                return armed ? 'idle' : 'idleUnarmed';
            case MovementState.WALK_FORWARD:
                return armed ? 'walkForward' : 'walkForwardUnarmed';
            case MovementState.WALK_BACK:
                return armed ? 'walkBack' : 'walkBackUnarmed';
            case MovementState.WALK_LEFT:
                return 'walkLeft';
            case MovementState.WALK_RIGHT:
                return 'walkRight';
            case MovementState.RUN_FORWARD:
                return armed ? 'runForward' : 'runForwardUnarmed';
            case MovementState.RUN_BACK:
                return armed ? 'runBack' : 'runBackUnarmed';
            case MovementState.JUMP:
                return armed ? 'jump' : 'jumpUnarmed';
            case MovementState.CROUCH_IDLE:
                return 'crouchIdle';
            case MovementState.TURN_LEFT:
                return 'turnLeft';
            case MovementState.TURN_RIGHT:
                return 'turnRight';
            default:
                return 'idle';
        }
    }
    
    /**
     * Trigger attack animation
     */
    attack() {
        if (this.isLocked) return false;
        
        const now = Date.now();
        
        // Check for combo
        if (this.comboWindow > 0 && now < this.comboWindow) {
            this.comboCount = Math.min(this.comboCount + 1, 3);
        } else {
            this.comboCount = 1;
        }
        
        // Select attack animation based on combo
        let attackAnim;
        switch (this.comboCount) {
            case 1:
                attackAnim = 'attack1';
                break;
            case 2:
                attackAnim = 'attack2';
                break;
            case 3:
                attackAnim = 'combo1'; // Full combo finisher
                this.comboCount = 0;
                break;
            default:
                attackAnim = 'attack1';
        }
        
        this.playAnimation(attackAnim, { 
            lockDuration: 500,
            fast: true 
        });
        
        this.lastAttackTime = now;
        this.comboWindow = now + 800; // 800ms window for next combo hit
        this.combatState = CombatState.ATTACK_1;
        
        // Callback for combo window
        if (this.onComboWindow) {
            this.onComboWindow(this.comboCount, this.comboWindow);
        }
        
        return true;
    }
    
    /**
     * Trigger block
     */
    block(active) {
        if (active) {
            this.playAnimation('block');
            this.combatState = CombatState.BLOCK;
        } else {
            this.combatState = CombatState.NONE;
            this.updateMovementAnimation();
        }
    }
    
    /**
     * Play hit reaction
     */
    playHitReaction(direction = 'front') {
        let anim;
        switch (direction) {
            case 'left':
                anim = 'hitLeft';
                break;
            case 'right':
                anim = 'hitRight';
                break;
            default:
                anim = 'hitGut';
        }
        
        this.playAnimation(anim, { lockDuration: 400, fast: true });
    }
    
    /**
     * Play emote
     */
    playEmote(emote) {
        const emoteAnims = {
            battlecry: 'tauntBattlecry',
            chest: 'tauntChest'
        };
        
        const anim = emoteAnims[emote];
        if (anim) {
            this.playAnimation(anim, { lockDuration: 1000 });
        }
    }
    
    /**
     * Play jump animation
     */
    jump(isRunning = false) {
        const anim = isRunning ? 'jumpRunning' : 'jump';
        this.playAnimation(anim, { lockDuration: 300 });
    }
    
    /**
     * Update loop - call each frame
     */
    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        // Update timers
        this.stateTimer += deltaTime;
        this.idleTimer += deltaTime;
        
        // Combo window timeout
        if (this.comboWindow > 0 && Date.now() > this.comboWindow) {
            this.comboWindow = 0;
            this.comboCount = 0;
        }
        
        // Idle variation
        if (this.currentState === MovementState.IDLE && 
            this.idleTimer > this.config.idleVariationInterval) {
            this.idleTimer = 0;
            
            // Random chance to play idle variant
            if (Math.random() < 0.3) {
                const variant = Math.random() < 0.5 ? 'idleVariant1' : 'idleVariant2';
                this.playAnimation(variant);
            }
        }
        
        // Reset idle timer when not idle
        if (this.currentState !== MovementState.IDLE) {
            this.idleTimer = 0;
        }
    }
    
    /**
     * Get current animation state info
     */
    getState() {
        return {
            movement: this.currentState,
            combat: this.combatState,
            isLocked: this.isLocked,
            comboCount: this.comboCount,
            comboWindow: this.comboWindow
        };
    }
    
    /**
     * Set armed/unarmed mode
     */
    setArmed(armed) {
        this.config.useWeaponAnimations = armed;
        if (!this.isLocked) {
            this.updateMovementAnimation();
        }
    }
    
    /**
     * Attach to a new character model
     */
    attachToCharacter(character) {
        // Dispose old mixer
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        this.character = character;
        this.mixer = new THREE.AnimationMixer(character);
        this.mixer.addEventListener('finished', this.onActionFinished.bind(this));
        this.actions.clear();
        
        // Recreate actions
        this.createActions();
        
        // Play current state
        const animName = this.getAnimationForState(this.currentState);
        this.playAnimation(animName, { immediate: true });
    }
    
    /**
     * Dispose
     */
    dispose() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        this.actions.clear();
    }
}

// Export cache for preloading
export { animationCache };

export default CharacterAnimationController;

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * WeaponAnimationController
 *
 * Weapon-type-aware animation state machine for GRUDA Wars characters.
 * Layers Mixamo FBX weapon-specific animations over KayKit GLB base animations.
 * Falls back to KayKit clips automatically when Mixamo FBX files are not yet placed.
 *
 * Weapon types map to GRUDA Wars classes:
 *   greatsword    → Warrior (2H DPS)
 *   sword_shield  → Warrior (tank)
 *   melee_1h      → General (daggers, maces, short swords)
 *   dual_wield    → Rogue
 *   spear         → Worge / Ranger
 *   longbow       → Ranger
 *   pistol        → Ranger (gunslinger)
 *   rifle         → Ranger (sniper)
 *   magic_staff   → Mage / Worge caster
 *
 * Usage:
 *   const weaponAnim = new WeaponAnimationController({
 *     mixer: kayKitSystem.mixer,
 *     kayKitActions: kayKitSystem.actions,
 *   });
 *   await weaponAnim.loadBaseAnimations();
 *   await weaponAnim.setWeaponType(WeaponType.GREATSWORD);
 *
 *   // Each frame (after kayKitSystem.update which calls mixer.update):
 *   weaponAnim.update(deltaTime);  // timer logic only — does NOT call mixer.update
 *
 *   // Input events:
 *   weaponAnim.setMovementInput(forward, right, isRunning, isJumping);
 *   weaponAnim.attack();
 *   weaponAnim.block(true/false);
 *   weaponAnim.dodge();
 *   weaponAnim.cast();
 */

// ─── Weapon Types ─────────────────────────────────────────────────────────────
export const WeaponType = {
    NONE:         'none',
    MELEE_1H:     'melee_1h',
    SWORD_SHIELD: 'sword_shield',
    GREATSWORD:   'greatsword',
    DUAL_WIELD:   'dual_wield',
    SPEAR:        'spear',
    LONGBOW:      'longbow',
    PISTOL:       'pistol',
    RIFLE:        'rifle',
    MAGIC_STAFF:  'magic_staff',
};

// ─── Animation States ─────────────────────────────────────────────────────────
export const AnimState = {
    // Locomotion
    IDLE:       'idle',
    WALK:       'walk',
    RUN:        'run',
    JUMP:       'jump',
    FALL:       'fall',
    LAND:       'land',
    DODGE:      'dodge',
    SWIM:       'swim',
    SWIM_IDLE:  'swim_idle',
    CLIMB:      'climb',
    // Combat
    ATTACK_1:   'attack_1',
    ATTACK_2:   'attack_2',
    ATTACK_3:   'attack_3',
    BLOCK:      'block',
    BLOCK_HIT:  'block_hit',
    CAST:       'cast',
    // Reactions
    HIT_FRONT:  'hit_front',
    HIT_BACK:   'hit_back',
    STUNNED:    'stunned',
    DEATH:      'death',
};

// ─── Weapon Animation Sets (Mixamo FBX folder + file map) ─────────────────────
// Each folder lives under /assets/animations/mixamo/<folder>/
const WEAPON_SETS = {
    [WeaponType.NONE]: {
        folder: 'base',
        files: {
            [AnimState.IDLE]: 'idle.fbx',
            [AnimState.WALK]: 'walk_forward.fbx',
            [AnimState.RUN]:  'run_forward.fbx',
        },
    },
    [WeaponType.MELEE_1H]: {
        folder: 'melee-1h',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
            [AnimState.ATTACK_3]: 'attack_3.fbx',
            [AnimState.BLOCK]:    'block.fbx',
        },
    },
    [WeaponType.SWORD_SHIELD]: {
        folder: 'sword-shield',
        files: {
            [AnimState.IDLE]:      'idle.fbx',
            [AnimState.WALK]:      'walk.fbx',
            [AnimState.RUN]:       'run.fbx',
            [AnimState.ATTACK_1]:  'attack_1.fbx',
            [AnimState.ATTACK_2]:  'attack_2.fbx',
            [AnimState.ATTACK_3]:  'attack_3.fbx',
            [AnimState.BLOCK]:     'block.fbx',
            [AnimState.BLOCK_HIT]: 'block_hit.fbx',
        },
    },
    [WeaponType.GREATSWORD]: {
        folder: 'greatsword',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
            [AnimState.ATTACK_3]: 'attack_3.fbx',
        },
    },
    [WeaponType.DUAL_WIELD]: {
        folder: 'dual-wield',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
            [AnimState.ATTACK_3]: 'attack_3.fbx',
        },
    },
    [WeaponType.SPEAR]: {
        folder: 'spear',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
            [AnimState.ATTACK_3]: 'attack_3.fbx',
        },
    },
    [WeaponType.LONGBOW]: {
        folder: 'longbow',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
        },
    },
    [WeaponType.PISTOL]: {
        folder: 'pistol',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
        },
    },
    [WeaponType.RIFLE]: {
        folder: 'rifle',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
        },
    },
    [WeaponType.MAGIC_STAFF]: {
        folder: 'magic',
        files: {
            [AnimState.IDLE]:     'idle.fbx',
            [AnimState.WALK]:     'walk.fbx',
            [AnimState.RUN]:      'run.fbx',
            [AnimState.ATTACK_1]: 'attack_1.fbx',
            [AnimState.ATTACK_2]: 'attack_2.fbx',
            [AnimState.CAST]:     'skill_cast.fbx',
        },
    },
};

// ─── Base (weapon-agnostic) locomotion + reaction FBX files ───────────────────
// All live under /assets/animations/mixamo/base/
const BASE_ANIM_FILES = {
    [AnimState.JUMP]:      'jump.fbx',
    [AnimState.FALL]:      'fall.fbx',
    [AnimState.LAND]:      'land.fbx',
    [AnimState.DODGE]:     'dodge_roll.fbx',
    [AnimState.SWIM]:      'swim.fbx',
    [AnimState.SWIM_IDLE]: 'swim_idle.fbx',
    [AnimState.CLIMB]:     'climb.fbx',
    [AnimState.HIT_FRONT]: 'take_hit_front.fbx',
    [AnimState.HIT_BACK]:  'take_hit_back.fbx',
    [AnimState.STUNNED]:   'stunned.fbx',
    [AnimState.DEATH]:     'death.fbx',
};

// ─── KayKit GLB animation name fallbacks (tried in order) ─────────────────────
// Used when Mixamo FBX files are not yet placed on disk
const KAYKIT_FALLBACKS = {
    [AnimState.IDLE]:      ['Idle_A', 'Idle_B', 'Idle'],
    [AnimState.WALK]:      ['Walking_A', 'Walking_B', 'Walking'],
    [AnimState.RUN]:       ['Running_A', 'Running_B', 'Running'],
    [AnimState.JUMP]:      ['Jump_Full_Short', 'Jump_Start', 'Jump'],
    [AnimState.FALL]:      ['Jump_Full_Long', 'Falling_Idle', 'Jump_Full_Short'],
    [AnimState.LAND]:      ['Jump_Land', 'Jump_Full_Short'],
    [AnimState.DODGE]:     ['Roll', 'Dodge', 'Running_A'],
    [AnimState.SWIM]:      ['Swim', 'Swimming', 'Walking_A'],
    [AnimState.SWIM_IDLE]: ['Swim_Idle', 'Swim', 'Idle_A'],
    [AnimState.CLIMB]:     ['Climbing', 'Climb', 'Walking_A'],
    [AnimState.HIT_FRONT]: ['Hit_A', 'Hit_B', 'Stunned'],
    [AnimState.HIT_BACK]:  ['Hit_A', 'Hit_B'],
    [AnimState.STUNNED]:   ['Stunned', 'Hit_A'],
    [AnimState.DEATH]:     ['Death_A', 'Death_B'],
    [AnimState.ATTACK_1]:  ['1H_Melee_Attack_Slice_Diagonal', 'Melee_Attack', '1H_Melee_Attack_Slice_Horizontal'],
    [AnimState.ATTACK_2]:  ['1H_Melee_Attack_Slice_Horizontal', '1H_Melee_Attack_Stab', 'Melee_Attack'],
    [AnimState.ATTACK_3]:  ['1H_Melee_Attack_Chop', '1H_Melee_Attack_Slice_Diagonal'],
    [AnimState.BLOCK]:     ['1H_Melee_Attack_Stab', 'Idle_A'],
    [AnimState.BLOCK_HIT]: ['Hit_A', 'Stunned'],
    [AnimState.CAST]:      ['Interact', '1H_Ranged_Shoot', 'Throw'],
};

// States that play once (LoopOnce, clamp when finished)
const ONE_SHOT_STATES = new Set([
    AnimState.JUMP,      AnimState.FALL,      AnimState.LAND,
    AnimState.DODGE,
    AnimState.ATTACK_1,  AnimState.ATTACK_2,  AnimState.ATTACK_3,
    AnimState.BLOCK_HIT, AnimState.CAST,
    AnimState.HIT_FRONT, AnimState.HIT_BACK,  AnimState.STUNNED,
    AnimState.DEATH,
]);

// States that interrupt everything immediately (hit reactions, death)
const INTERRUPT_STATES = new Set([
    AnimState.HIT_FRONT, AnimState.HIT_BACK,
    AnimState.STUNNED,   AnimState.DEATH,
    AnimState.DODGE,
]);

// Combat-category states
const COMBAT_STATES = new Set([
    AnimState.ATTACK_1, AnimState.ATTACK_2, AnimState.ATTACK_3,
    AnimState.BLOCK,    AnimState.BLOCK_HIT, AnimState.CAST,
]);

// ─── WeaponAnimationController ────────────────────────────────────────────────
export class WeaponAnimationController {
    /**
     * @param {Object} options
     * @param {THREE.AnimationMixer}          options.mixer          - Character's AnimationMixer
     * @param {Map<string,AnimationAction>}   options.kayKitActions  - Actions already built by KayKitCharacterSystem
     * @param {string}                        [options.basePath]     - Mixamo FBX root path
     * @param {number}                        [options.crossFadeDuration]
     */
    constructor(options = {}) {
        this.mixer           = options.mixer           || null;
        this.kayKitActions   = options.kayKitActions   || new Map();
        this.basePath        = options.basePath        || '/assets/animations/mixamo/';
        this.crossFadeDuration = options.crossFadeDuration ?? 0.2;
        this.fastFadeDuration  = 0.08;

        this.fbxLoader = new FBXLoader();

        // Cached clips:  `${weaponType}_${state}` → AnimationClip  (weapon-specific Mixamo)
        this.mixamoClips = new Map();
        //                 state              → AnimationClip  (base/shared Mixamo)
        this.baseClips   = new Map();

        // Actions built from this.mixer for Mixamo clips
        this.ownActions  = new Map();   // same keys as above maps

        // Current state
        this.weaponType    = WeaponType.NONE;
        this.currentState  = AnimState.IDLE;
        this.currentAction = null;
        this.isLocked      = false;

        // Combo system
        this.comboCount     = 0;
        this.comboWindowEnd = 0;
        this.comboWindowMs  = 900;
        this.maxCombo       = 3;

        // Block flag
        this.isBlocking = false;

        // Movement input snapshot
        this.movement = { forward: 0, right: 0, isRunning: false, isJumping: false };

        // Loading state tracking
        this.loadedWeaponSets  = new Set();
        this.loadingWeaponSets = new Map(); // type → Promise

        // ── Callbacks ──
        /** (prevState: string, nextState: string) => void */
        this.onStateChange   = null;
        /** (comboCount: number) => void  — fired when combo window opens */
        this.onComboWindow   = null;
        /** (state: string) => void  — fired when a one-shot animation ends */
        this.onAnimationEnd  = null;

        // Bind finished handler so we can add/remove correctly
        this._boundFinished = this._onActionFinished.bind(this);
        if (this.mixer) {
            this.mixer.addEventListener('finished', this._boundFinished);
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Attach to a new mixer (called when KayKit switches character models).
     * @param {THREE.AnimationMixer} mixer
     * @param {Map} [kayKitActions]
     */
    attachMixer(mixer, kayKitActions = null) {
        if (this.mixer) {
            this.mixer.removeEventListener('finished', this._boundFinished);
        }
        this.mixer = mixer;
        this.ownActions.clear();
        if (kayKitActions) this.kayKitActions = kayKitActions;

        // Rebuild actions from cached clips for the new mixer
        this.mixamoClips.forEach((clip, key) => {
            this.ownActions.set(key, this.mixer.clipAction(clip));
        });
        this.baseClips.forEach((clip, state) => {
            const key = `base_${state}`;
            if (!this.ownActions.has(key)) {
                this.ownActions.set(key, this.mixer.clipAction(clip));
            }
        });

        this.mixer.addEventListener('finished', this._boundFinished);
        this.currentAction = null;
        this._playState(this.currentState, { immediate: true });
    }

    /**
     * Switch equipped weapon type. Loads Mixamo FBX set if not cached yet.
     * @param {string} type  WeaponType constant
     */
    async setWeaponType(type) {
        if (this.weaponType === type) return;
        this.weaponType = type;

        await this.loadWeaponSet(type);

        // Refresh locomotion animation to weapon-specific one if not in combat
        if (!COMBAT_STATES.has(this.currentState) && !this.isLocked) {
            this._playState(this.currentState, { fast: true });
        }
    }

    /**
     * Load base (weapon-agnostic) Mixamo animations once.
     * Falls back gracefully if files don't exist yet.
     */
    async loadBaseAnimations() {
        const folder   = this.basePath + 'base/';
        const promises = Object.entries(BASE_ANIM_FILES).map(async ([state, file]) => {
            const clip = await this._loadFBXClip(folder + file, `base_${state}`);
            if (clip) {
                this.baseClips.set(state, clip);
                if (this.mixer) {
                    this.ownActions.set(`base_${state}`, this.mixer.clipAction(clip));
                }
            }
        });
        await Promise.all(promises);
        console.log(`[WeaponAnim] Base animations loaded: ${this.baseClips.size}`);
    }

    /**
     * Load Mixamo FBX animation set for a specific weapon type.
     * @param {string} type  WeaponType constant
     */
    async loadWeaponSet(type) {
        if (this.loadedWeaponSets.has(type)) return;
        if (this.loadingWeaponSets.has(type)) return this.loadingWeaponSets.get(type);

        const weaponSet = WEAPON_SETS[type];
        if (!weaponSet) {
            console.warn(`[WeaponAnim] No FBX set defined for weapon type: ${type}`);
            return;
        }

        const loadPromise = (async () => {
            const folder   = this.basePath + weaponSet.folder + '/';
            const promises = Object.entries(weaponSet.files).map(async ([state, file]) => {
                const key  = `${type}_${state}`;
                const clip = await this._loadFBXClip(folder + file, key);
                if (clip) {
                    this.mixamoClips.set(key, clip);
                    if (this.mixer) {
                        this.ownActions.set(key, this.mixer.clipAction(clip));
                    }
                }
            });
            await Promise.all(promises);
            this.loadedWeaponSets.add(type);
            this.loadingWeaponSets.delete(type);
            console.log(`[WeaponAnim] Loaded weapon set: ${type}`);
        })();

        this.loadingWeaponSets.set(type, loadPromise);
        return loadPromise;
    }

    /**
     * Update movement input — drives locomotion animation.
     * @param {number}  forward   -1..1
     * @param {number}  right     -1..1
     * @param {boolean} isRunning
     * @param {boolean} isJumping
     */
    setMovementInput(forward, right, isRunning = false, isJumping = false) {
        this.movement = { forward, right, isRunning, isJumping };
        if (this.isLocked || COMBAT_STATES.has(this.currentState) || this.isBlocking) return;
        this._updateLocomotion();
    }

    /**
     * Trigger attack — auto-advances combo chain.
     * @returns {boolean} true if attack was triggered
     */
    attack() {
        if (this.currentState === AnimState.DEATH) return false;
        // Allow combo chaining even while locked (within window)
        if (this.isLocked && !this._inComboWindow()) return false;

        const now = Date.now();
        if (this._inComboWindow() && this.comboCount < this.maxCombo) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }

        const state = this._comboStateForCount(this.comboCount);
        this._playState(state, { lock: true, fast: true });

        this.comboWindowEnd = now + this.comboWindowMs;
        if (this.onComboWindow) this.onComboWindow(this.comboCount);

        return true;
    }

    /**
     * Activate or deactivate blocking stance.
     * @param {boolean} active
     */
    block(active) {
        if (this.currentState === AnimState.DEATH) return;
        this.isBlocking = active;
        if (active) {
            this._playState(AnimState.BLOCK);
        } else {
            this._updateLocomotion();
        }
    }

    /** Trigger a dodge roll. */
    dodge() {
        if (this.currentState === AnimState.DEATH) return;
        this._playState(AnimState.DODGE, { lock: true, fast: true, forceInterrupt: true });
    }

    /** Trigger a spell / skill cast (Mage, Worge). */
    cast() {
        if (this.currentState === AnimState.DEATH) return;
        this._playState(AnimState.CAST, { lock: true });
    }

    /**
     * Play hit reaction.
     * @param {'front'|'back'} direction
     */
    playHitReaction(direction = 'front') {
        if (this.currentState === AnimState.DEATH) return;
        const state = direction === 'back' ? AnimState.HIT_BACK : AnimState.HIT_FRONT;
        this._playState(state, { lock: true, fast: true, forceInterrupt: true });
    }

    /**
     * Trigger block-hit reaction (shield impact).
     */
    blockHit() {
        if (!this.isBlocking) return;
        this._playState(AnimState.BLOCK_HIT, { lock: true, fast: true, forceInterrupt: true });
    }

    /** Play stun animation and lock for a duration. */
    stun(durationMs = 2000) {
        this._playState(AnimState.STUNNED, { forceInterrupt: true });
        this.isLocked = true;
        // Will unlock in update() after duration
        this._stunUntil = Date.now() + durationMs;
    }

    /** Play death animation — character stays dead. */
    die() {
        this._playState(AnimState.DEATH, { forceInterrupt: true });
        this.isLocked = true;
        this._stunUntil = Infinity;
    }

    /** Trigger jump. */
    jump() {
        if (this.currentState === AnimState.DEATH) return;
        this._playState(AnimState.JUMP, { lock: true });
    }

    /** Enter or exit swimming mode. */
    swim(isMoving = false) {
        this._playState(isMoving ? AnimState.SWIM : AnimState.SWIM_IDLE);
    }

    /** Enter climbing mode. */
    climb() {
        this._playState(AnimState.CLIMB);
    }

    /** @returns {string} Current AnimState */
    getCurrentState() { return this.currentState; }

    /** @returns {string} Current WeaponType */
    getWeaponType() { return this.weaponType; }

    /** @returns {boolean} */
    isLockedState() { return this.isLocked; }

    /**
     * Per-frame update — handles timer logic only.
     * NOTE: Does NOT call mixer.update(). KayKitCharacterSystem owns the mixer update.
     * @param {number} deltaTime  seconds
     */
    update(deltaTime) {
        // Time-based unlock (stun / death overrides _onActionFinished unlocking)
        if (this.isLocked && this._stunUntil && Date.now() > this._stunUntil) {
            this._stunUntil = null;
            this.isLocked = false;
            this._updateLocomotion();
        }

        // Combo window expiry
        if (this.comboWindowEnd > 0 && Date.now() > this.comboWindowEnd) {
            this.comboWindowEnd = 0;
            this.comboCount = 0;
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Load one Mixamo FBX and extract its first animation clip.
     * Resolves null silently when file doesn't exist yet.
     */
    async _loadFBXClip(path, clipName) {
        return new Promise((resolve) => {
            this.fbxLoader.load(
                path,
                (fbx) => {
                    if (fbx.animations && fbx.animations.length > 0) {
                        const clip = fbx.animations[0];
                        clip.name  = clipName;
                        resolve(clip);
                    } else {
                        resolve(null);
                    }
                },
                undefined,
                () => resolve(null), // 404 → silent fallback
            );
        });
    }

    /**
     * Resolve an AnimState to a playable THREE.AnimationAction.
     * Priority chain:
     *   1. Weapon-specific Mixamo action  (`${weaponType}_${state}`)
     *   2. Base Mixamo action             (`base_${state}`)
     *   3. KayKit GLB fallback            (by name list)
     */
    _resolveAction(state) {
        // 1. Weapon-specific
        const wKey = `${this.weaponType}_${state}`;
        if (this.ownActions.has(wKey)) return this.ownActions.get(wKey);

        // 2. Base Mixamo
        const bKey = `base_${state}`;
        if (this.ownActions.has(bKey)) return this.ownActions.get(bKey);

        // 3. KayKit fallback
        const fallbacks = KAYKIT_FALLBACKS[state] || [];
        for (const name of fallbacks) {
            if (this.kayKitActions.has(name)) return this.kayKitActions.get(name);
        }

        return null;
    }

    /**
     * Play an animation state with crossfade.
     * @param {string}  state
     * @param {Object}  [opts]
     * @param {boolean} [opts.immediate]      - Skip crossfade
     * @param {boolean} [opts.fast]           - Use fastFadeDuration
     * @param {boolean} [opts.lock]           - Lock until animation finishes
     * @param {boolean} [opts.forceInterrupt] - Bypass lock guard
     * @returns {boolean} true if played
     */
    _playState(state, opts = {}) {
        const { immediate = false, fast = false, lock = false, forceInterrupt = false } = opts;

        // Guard: locked states cannot be interrupted (except high-priority ones)
        if (this.isLocked && !forceInterrupt && !INTERRUPT_STATES.has(state)) {
            // Allow combo chains during attack lock
            if (!this._inComboWindow() || !COMBAT_STATES.has(state)) return false;
        }

        const action = this._resolveAction(state);
        if (!action) {
            console.warn(`[WeaponAnim] No action found for: ${state} (weapon: ${this.weaponType})`);
            return false;
        }

        // Skip if already playing this exact action (unless forced)
        if (this.currentAction === action && action.isRunning() && !forceInterrupt) return true;

        const fade = immediate ? 0 : (fast ? this.fastFadeDuration : this.crossFadeDuration);

        // Fade out previous
        if (this.currentAction && this.currentAction !== action) {
            if (fade > 0) {
                this.currentAction.fadeOut(fade);
            } else {
                this.currentAction.stop();
            }
        }

        // Configure looping
        const isLoop = !ONE_SHOT_STATES.has(state);
        action.reset();
        action.setEffectiveWeight(1);
        action.setLoop(isLoop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.clampWhenFinished = !isLoop;
        if (fade > 0) action.fadeIn(fade);
        action.play();

        const prevState    = this.currentState;
        this.currentState  = state;
        this.currentAction = action;

        // Lock until _onActionFinished clears it
        if (lock) this.isLocked = true;

        if (this.onStateChange) this.onStateChange(prevState, state);
        return true;
    }

    /** Drive locomotion state from movement snapshot. */
    _updateLocomotion() {
        const { forward, right, isRunning, isJumping } = this.movement;

        let state = AnimState.IDLE;
        if (isJumping) {
            state = AnimState.JUMP;
        } else if (Math.abs(forward) > 0.05 || Math.abs(right) > 0.05) {
            state = isRunning ? AnimState.RUN : AnimState.WALK;
        }

        if (state !== this.currentState) {
            this._playState(state);
        }
    }

    /** Map combo count to the corresponding attack state. */
    _comboStateForCount(count) {
        if (count <= 1) return AnimState.ATTACK_1;
        if (count === 2) return AnimState.ATTACK_2;
        return AnimState.ATTACK_3;
    }

    /** True if still inside the combo chaining window. */
    _inComboWindow() {
        return this.comboWindowEnd > 0 && Date.now() < this.comboWindowEnd;
    }

    /** THREE.AnimationMixer 'finished' handler — clears lock and advances state machine. */
    _onActionFinished(event) {
        if (event.action !== this.currentAction) return;

        const state = this.currentState;

        // Fire callback
        if (this.onAnimationEnd) this.onAnimationEnd(state);

        // Clear attack lock
        this.isLocked = false;

        // Stay frozen in death / stun (stun has timer-based unlock in update())
        if (state === AnimState.DEATH)    return;
        if (state === AnimState.STUNNED)  return; // timer unlock handles this

        if (COMBAT_STATES.has(state)) {
            if (state === AnimState.ATTACK_1 || state === AnimState.ATTACK_2 || state === AnimState.ATTACK_3) {
                // Combo window still open → idle-wait for next input
                if (this._inComboWindow()) {
                    this._playState(AnimState.IDLE, { immediate: true });
                } else {
                    this.comboCount = 0;
                    this._updateLocomotion();
                }
            } else if (state === AnimState.BLOCK_HIT) {
                this._playState(AnimState.BLOCK); // return to block stance
            } else if (state === AnimState.CAST) {
                this._updateLocomotion();
            }
        } else {
            // Jump chain: jump → fall → land → locomotion
            if (state === AnimState.JUMP) {
                this._playState(AnimState.FALL);
            } else if (state === AnimState.FALL) {
                this._playState(AnimState.LAND, { lock: true });
            } else {
                this._updateLocomotion();
            }
        }
    }

    dispose() {
        if (this.mixer) {
            this.mixer.removeEventListener('finished', this._boundFinished);
        }
        this.ownActions.clear();
        this.mixamoClips.clear();
        this.baseClips.clear();
    }
}

export default WeaponAnimationController;

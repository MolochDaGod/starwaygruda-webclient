import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
    SHARED_ANIMATION_PACKS,
    getNPCModelConfig,
} from '../player/ClassAnimationRegistry.js';

/**
 * AnimatedNPCSystem
 *
 * Loads KayKit GLB models for NPCs/enemies, creates AnimationMixers,
 * and wires animations into the EnemyEntity animation hooks.
 *
 * Key features:
 * - Shared GLB model cache (clone SkeletonUtils for instancing)
 * - Shared animation clip cache (loaded once from Rig_Medium packs)
 * - Per-enemy AnimationMixer with actions mapped by clip name
 * - Optional tint for re-using player models as NPC variants (goblin = green Rogue)
 */
export class AnimatedNPCSystem {
    constructor(options = {}) {
        this.basePath = options.basePath || '/assets/characters/kaykit/';
        this.loader = new GLTFLoader();

        // ── Caches ──────────────────────────────────────────────────────────
        /** @type {Map<string, {scene: THREE.Group, animations: THREE.AnimationClip[]}>} */
        this.modelCache = new Map();

        /** @type {Map<string, THREE.AnimationClip>} shared clips from Rig_Medium packs */
        this.sharedClips = new Map();

        this.sharedClipsLoaded = false;
        this._loadingShared = null;  // promise dedup

        console.log('🎭 AnimatedNPCSystem initialized');
    }

    // ─── GLTF Loader ────────────────────────────────────────────────────────

    /** Load a GLTF/GLB and return the full gltf object. */
    _loadGLTF(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(url, resolve, undefined, reject);
        });
    }

    // ─── Shared Animation Clips ─────────────────────────────────────────────

    /**
     * Load the shared KayKit animation packs (Rig_Medium_MovementBasic + General).
     * These clips are applied to every NPC via their mixer.
     */
    async loadSharedAnimations() {
        if (this.sharedClipsLoaded) return;
        if (this._loadingShared) return this._loadingShared;

        this._loadingShared = (async () => {
            for (const [, file] of Object.entries(SHARED_ANIMATION_PACKS)) {
                try {
                    const gltf = await this._loadGLTF(this.basePath + file);
                    if (gltf.animations) {
                        for (const clip of gltf.animations) {
                            if (!this.sharedClips.has(clip.name)) {
                                this.sharedClips.set(clip.name, clip);
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`[AnimatedNPC] Failed to load anim pack ${file}:`, err.message);
                }
            }
            this.sharedClipsLoaded = true;
            console.log(`[AnimatedNPC] Shared clips loaded: ${this.sharedClips.size}`);
        })();

        return this._loadingShared;
    }

    // ─── Model Loading ──────────────────────────────────────────────────────

    /**
     * Load and cache a GLB model. Returns { scene, animations }.
     * Subsequent calls for the same file return a deep clone of the cached scene.
     */
    async loadModel(file) {
        await this.loadSharedAnimations();

        if (this.modelCache.has(file)) {
            const cached = this.modelCache.get(file);
            return {
                scene: this._cloneModel(cached.scene),
                animations: cached.animations,
            };
        }

        try {
            const gltf = await this._loadGLTF(this.basePath + file);
            const scene = gltf.scene;
            const animations = gltf.animations || [];

            // Setup shadows
            scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                }
            });

            this.modelCache.set(file, { scene, animations });
            console.log(`[AnimatedNPC] Cached model: ${file} (${animations.length} embedded anims)`);

            return {
                scene: this._cloneModel(scene),
                animations,
            };
        } catch (err) {
            console.error(`[AnimatedNPC] Failed to load model ${file}:`, err);
            return null;
        }
    }

    /**
     * Deep-clone a model scene so each NPC gets its own skeleton + mesh instances.
     * Uses SkeletonUtils.clone if available, otherwise THREE.Object3D.clone + rebind.
     */
    _cloneModel(source) {
        // THREE r152+ includes SkeletonUtils on the main build; older bundles
        // may not. Fall back to a manual recursive clone.
        try {
            // Try importing SkeletonUtils (works with three >= 0.149)
            const clone = source.clone(true);
            // Rebind skeletons so each clone has independent bone transforms
            this._rebindSkeletons(clone, source);
            return clone;
        } catch {
            return source.clone(true);
        }
    }

    /** Rebind each SkinnedMesh in `clone` to its own skeleton copy. */
    _rebindSkeletons(clone, source) {
        const sourceSkinned = [];
        source.traverse(n => { if (n.isSkinnedMesh) sourceSkinned.push(n); });

        const cloneSkinned = [];
        clone.traverse(n => { if (n.isSkinnedMesh) cloneSkinned.push(n); });

        for (let i = 0; i < cloneSkinned.length; i++) {
            const srcMesh = sourceSkinned[i];
            const dstMesh = cloneSkinned[i];
            if (!srcMesh || !dstMesh) continue;

            // Build a map from source bone names to clone bones
            const boneMap = {};
            clone.traverse(n => { if (n.isBone) boneMap[n.name] = n; });

            const newBones = srcMesh.skeleton.bones.map(b => boneMap[b.name] || b);
            const newSkeleton = new THREE.Skeleton(newBones, srcMesh.skeleton.boneInverses.map(bi => bi.clone()));
            dstMesh.bind(newSkeleton);
        }
    }

    // ─── Wire Enemy ─────────────────────────────────────────────────────────

    /**
     * Prepare an EnemyEntity with a real animated model.
     *
     * @param {EnemyEntity} enemy  – the entity to wire up
     * @param {string} archetype   – NPCArchetype key (e.g. 'skeleton_warrior')
     * @returns {THREE.Group|null} the model added to the scene
     */
    async prepareEnemy(enemy, archetype) {
        const config = getNPCModelConfig(archetype);
        if (!config) {
            console.warn(`[AnimatedNPC] Unknown archetype: ${archetype}`);
            return null;
        }

        const result = await this.loadModel(config.file);
        if (!result) return null;

        const model = result.scene;
        model.scale.setScalar(config.scale);

        // Optional tint (e.g. goblin = green Rogue)
        if (config.tint != null) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Clone material so we don't tint the cached original
                    child.material = child.material.clone();
                    child.material.color.lerp(new THREE.Color(config.tint), 0.5);
                }
            });
        }

        // Create mixer for this specific enemy
        const mixer = new THREE.AnimationMixer(model);
        const actions = new Map();

        // Register shared clips as actions on this mixer
        for (const [name, clip] of this.sharedClips) {
            const action = mixer.clipAction(clip);
            actions.set(name, action);
        }

        // Register model-embedded clips (skeleton characters have their own anims)
        for (const clip of result.animations) {
            if (!actions.has(clip.name)) {
                const action = mixer.clipAction(clip);
                actions.set(clip.name, action);
            }
        }

        // Set mesh on entity (also creates health bar)
        enemy.setMesh(model);

        // Wire animation system
        enemy.initAnimations(mixer, actions, config.animSet);

        return model;
    }

    // ─── Dispose ─────────────────────────────────────────────────────────────

    dispose() {
        this.modelCache.clear();
        this.sharedClips.clear();
        this.sharedClipsLoaded = false;
        this._loadingShared = null;
    }
}

export default AnimatedNPCSystem;

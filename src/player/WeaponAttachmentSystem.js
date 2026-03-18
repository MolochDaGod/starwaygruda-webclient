import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * WeaponAttachmentSystem
 *
 * Loads weapon meshes (GLB or FBX) and parents them to character hand bones.
 * Supports KayKit Dungeon pack weapons, custom weapon models, and the full
 * GRUDA Wars weapon roster.
 *
 * Bone naming — tried in priority order for each side:
 *   mixamorigRightHand  (Mixamo standard / KayKit default)
 *   RightHand           (cleaned Mixamo export)
 *   Hand_R              (Unreal Engine style)
 *   hand_r              (lowercase UE)
 *   Bip01_R_Hand        (3ds Max Biped)
 *   R_Hand
 *
 * Usage:
 *   const attachment = new WeaponAttachmentSystem();
 *   await attachment.equip(characterModel, 'sword_shield', '/assets/weapons/sword.glb', '/assets/weapons/shield.glb');
 *   // Later:
 *   attachment.unequipAll(characterModel);
 *
 * Weapon mesh source — KayKit Dungeon Pack includes:
 *   Sword_1H.glb, Shield_Round.glb, Bow.glb, Crossbow.glb,
 *   Staff.glb, Dagger.glb, Axe_1H.glb, Spear.glb, Mace.glb, etc.
 * Place these in /public/assets/weapons/
 */

// ─── Bone name candidates per hand side ───────────────────────────────────────
const HAND_BONE_NAMES = {
    right: [
        'mixamorigRightHand',
        'RightHand',
        'Hand_R',
        'hand_r',
        'Bip01_R_Hand',
        'R_Hand',
        'RightHandIndex1',    // fallback finger root
    ],
    left: [
        'mixamorigLeftHand',
        'LeftHand',
        'Hand_L',
        'hand_l',
        'Bip01_L_Hand',
        'L_Hand',
        'LeftHandIndex1',
    ],
};

// Forearm bone candidates — preferred for shield (prevents shield rotating with wrist)
const FOREARM_BONE_NAMES = {
    left: [
        'mixamorigLeftForeArm',
        'LeftForeArm',
        'ForeArm_L',
        'forearm_l',
        'Bip01_L_Forearm',
        'L_ForeArm',
    ],
};

// ─── Per-weapon-type attachment offsets ───────────────────────────────────────
// All values are in the LOCAL space of the hand bone.
// Adjust position/rotation until the weapon sits correctly in the grip.
// Scale is typically 1 unless the weapon model needs resizing.
const WEAPON_OFFSETS = {
    none: {},

    melee_1h: {
        right: {
            position: new THREE.Vector3(0, 0.06, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    sword_shield: {
        right: {
            position: new THREE.Vector3(0, 0.06, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
        left: {
            // Shield on forearm — faces outward
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, Math.PI, Math.PI / 2),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    greatsword: {
        right: {
            position: new THREE.Vector3(0, 0.12, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    dual_wield: {
        right: {
            position: new THREE.Vector3(0, 0.06, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale:    new THREE.Vector3(0.85, 0.85, 0.85),
        },
        left: {
            position: new THREE.Vector3(0, 0.06, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, Math.PI), // mirrored
            scale:    new THREE.Vector3(0.85, 0.85, 0.85),
        },
    },

    spear: {
        right: {
            position: new THREE.Vector3(0, 0.25, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    // Bow held in left hand, arrow drawn with right
    longbow: {
        left: {
            position: new THREE.Vector3(0, 0.05, 0),
            rotation: new THREE.Euler(-Math.PI / 4, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    pistol: {
        right: {
            position: new THREE.Vector3(0, 0.03, 0.02),
            rotation: new THREE.Euler(0, Math.PI / 2, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    rifle: {
        right: {
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },

    magic_staff: {
        right: {
            position: new THREE.Vector3(0, 0.12, 0),
            rotation: new THREE.Euler(0, 0, 0),
            scale:    new THREE.Vector3(1, 1, 1),
        },
    },
};

// ─── WeaponAttachmentSystem ───────────────────────────────────────────────────
export class WeaponAttachmentSystem {
    /**
     * @param {Object} [options]
     * @param {string} [options.basePath] - Base URL for weapon model files (default: '/assets/weapons/')
     */
    constructor(options = {}) {
        this.basePath   = options.basePath || '/assets/weapons/';
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader  = new FBXLoader();

        // Currently attached weapons: Map<'right'|'left', THREE.Object3D>
        this.attachedWeapons = new Map();

        // Model cache: Map<url, THREE.Object3D>  — caches originals for cloning
        this.modelCache = new Map();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * High-level equip: load + attach main weapon (and optional shield).
     *
     * @param {THREE.Object3D} character       - Character model root
     * @param {string}         weaponType      - WeaponType constant (e.g. 'sword_shield')
     * @param {string}         [weaponPath]    - URL/path to main weapon GLB/FBX
     * @param {string}         [secondaryPath] - URL/path to shield GLB/FBX (sword_shield only)
     *                                           OR off-hand weapon (dual_wield)
     * @returns {Promise<{right?: THREE.Object3D, left?: THREE.Object3D}>}
     */
    async equip(character, weaponType, weaponPath = null, secondaryPath = null) {
        this.unequipAll(character);

        const offsets = WEAPON_OFFSETS[weaponType] || {};
        const result  = {};

        // ── Main weapon ──
        if (weaponPath) {
            // Bows are held in the left hand; everything else defaults to right
            const mainSide   = weaponType === 'longbow' ? 'left' : 'right';
            const mainOffset = offsets[mainSide] || {};
            const mesh       = await this.loadModel(weaponPath);
            if (mesh) {
                const attached = this._attachToBoneByNames(
                    character,
                    HAND_BONE_NAMES[mainSide],
                    mesh,
                    mainOffset,
                    mainSide,
                );
                if (attached) result[mainSide] = attached;
            }
        }

        // ── Shield (sword_shield) — attach to forearm for better look ──
        if (weaponType === 'sword_shield' && secondaryPath) {
            const shieldMesh = await this.loadModel(secondaryPath);
            if (shieldMesh) {
                const shieldOffset = offsets.left || {};
                // Try forearm first, then hand
                const boneNames = [
                    ...FOREARM_BONE_NAMES.left,
                    ...HAND_BONE_NAMES.left,
                ];
                const attached = this._attachToBoneByNames(
                    character, boneNames, shieldMesh, shieldOffset, 'left',
                );
                if (attached) result.left = attached;
            }
        }

        // ── Off-hand weapon (dual_wield) ──
        if (weaponType === 'dual_wield' && secondaryPath) {
            const offhandMesh = await this.loadModel(secondaryPath);
            if (offhandMesh) {
                const offhandOffset = offsets.left || {};
                const attached = this._attachToBoneByNames(
                    character,
                    HAND_BONE_NAMES.left,
                    offhandMesh,
                    offhandOffset,
                    'left',
                );
                if (attached) result.left = attached;
            }
        }

        return result;
    }

    /**
     * Low-level: attach a pre-loaded mesh to a hand bone by side.
     *
     * @param {THREE.Object3D} character
     * @param {'right'|'left'} side
     * @param {THREE.Object3D} mesh
     * @param {Object}         [offset]  - { position?, rotation?, scale? }
     * @returns {THREE.Object3D|null}
     */
    attachToHand(character, side, mesh, offset = {}) {
        return this._attachToBoneByNames(
            character,
            HAND_BONE_NAMES[side] || HAND_BONE_NAMES.right,
            mesh,
            offset,
            side,
        );
    }

    /**
     * Remove a weapon from one side.
     * @param {THREE.Object3D} character  (unused but kept for API symmetry)
     * @param {'right'|'left'} side
     */
    unequip(character, side) {
        const weapon = this.attachedWeapons.get(side);
        if (weapon && weapon.parent) {
            weapon.parent.remove(weapon);
            weapon.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material])
                        .forEach(m => m.dispose());
                }
            });
        }
        this.attachedWeapons.delete(side);
    }

    /** Remove all attached weapons. */
    unequipAll(character) {
        ['right', 'left'].forEach(side => this.unequip(character, side));
    }

    /**
     * Find a hand bone by side.
     * @param {THREE.Object3D} character
     * @param {'right'|'left'} side
     * @returns {THREE.Object3D|null}
     */
    findHandBone(character, side) {
        return this.findBoneByNames(character, HAND_BONE_NAMES[side] || []);
    }

    /**
     * Find a bone by trying candidate names (exact first, then partial).
     * @param {THREE.Object3D} root
     * @param {string[]}       names
     * @returns {THREE.Object3D|null}
     */
    findBoneByNames(root, names) {
        // Fast path — Three.js name lookup
        for (const name of names) {
            const found = root.getObjectByName(name);
            if (found) return found;
        }

        // Slow path — case-insensitive partial traversal
        const lower = names.map(n => n.toLowerCase());
        let result  = null;

        root.traverse((obj) => {
            if (result || !obj.name) return;
            const objLower = obj.name.toLowerCase();
            for (const nl of lower) {
                if (objLower === nl) {
                    result = obj;
                    return;
                }
            }
        });

        return result;
    }

    /**
     * Load a weapon model (GLB/GLTF or FBX) with result caching.
     * @param {string} path
     * @returns {Promise<THREE.Object3D|null>}
     */
    async loadModel(path) {
        // Return clone of cached original
        if (this.modelCache.has(path)) {
            return this.modelCache.get(path).clone();
        }

        const ext = path.split('.').pop().toLowerCase();
        try {
            let model = null;

            if (ext === 'glb' || ext === 'gltf') {
                model = await new Promise((resolve, reject) => {
                    this.gltfLoader.load(path, gltf => resolve(gltf.scene), undefined, reject);
                });
            } else if (ext === 'fbx') {
                model = await new Promise((resolve, reject) => {
                    this.fbxLoader.load(path, fbx => resolve(fbx), undefined, reject);
                });
            } else {
                console.warn(`[WeaponAttach] Unsupported format: .${ext} (${path})`);
                return null;
            }

            if (model) {
                this.modelCache.set(path, model);  // cache original
                return model.clone();
            }
        } catch (err) {
            console.warn(`[WeaponAttach] Failed to load: ${path}`, err);
        }

        return null;
    }

    /**
     * List all named objects on a character — useful for debugging bone names.
     * @param {THREE.Object3D} character
     * @returns {string[]}
     */
    listBoneNames(character) {
        const names = [];
        character.traverse((obj) => {
            if (obj.name) names.push(`${obj.type}:${obj.name}`);
        });
        return names;
    }

    /** @returns {THREE.Object3D|null} */
    getAttachedWeapon(side) {
        return this.attachedWeapons.get(side) || null;
    }

    dispose() {
        this.attachedWeapons.clear();
        this.modelCache.clear();
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    /**
     * Find bone from a candidate name list, attach mesh, store reference.
     */
    _attachToBoneByNames(character, boneNames, mesh, offset, side) {
        const bone = this.findBoneByNames(character, boneNames);
        if (!bone) {
            console.warn(`[WeaponAttach] Hand bone not found for side="${side}". Tried:`, boneNames);
            console.info('[WeaponAttach] Available bones:', this.listBoneNames(character).slice(0, 40));
            return null;
        }

        // Remove existing attachment on this side
        this.unequip(character, side);

        const clone = mesh.clone();
        this._applyOffset(clone, offset);

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow    = true;
                child.frustumCulled = false;
            }
        });

        bone.add(clone);
        this.attachedWeapons.set(side, clone);

        console.log(`[WeaponAttach] ✓ Attached weapon to bone "${bone.name}" (${side})`);
        return clone;
    }

    /** Apply position / rotation / scale offset to a mesh in-place. */
    _applyOffset(mesh, offset = {}) {
        if (offset.position) mesh.position.copy(offset.position);
        if (offset.rotation) mesh.rotation.copy(offset.rotation);
        if (offset.scale)    mesh.scale.copy(offset.scale);
    }
}

export default WeaponAttachmentSystem;

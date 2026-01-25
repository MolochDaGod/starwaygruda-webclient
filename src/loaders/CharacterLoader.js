import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * Character asset loader for FBX models and animations
 * Handles Barbarian race characters with customization and equipment
 */
export class CharacterLoader {
    constructor() {
        this.loader = new FBXLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.loadedModels = new Map();
        this.loadedAnimations = new Map();
        this.loadedTextures = new Map();
    }

    /**
     * Load a character model with customization options
     * @param {string} modelPath - Path to FBX model
     * @param {Object} options - Customization options
     * @returns {Promise<THREE.Group>}
     */
    async loadCharacter(modelPath, options = {}) {
        try {
            // Check cache
            const cacheKey = `${modelPath}_${JSON.stringify(options)}`;
            if (this.loadedModels.has(cacheKey)) {
                return this.loadedModels.get(cacheKey).clone();
            }

            // Load FBX model
            const model = await new Promise((resolve, reject) => {
                this.loader.load(
                    modelPath,
                    (object) => resolve(object),
                    undefined,
                    (error) => reject(error)
                );
            });

            // Apply customization
            if (options.color) {
                this.applyColorCustomization(model, options.color);
            }

            if (options.texture) {
                await this.applyTextureCustomization(model, options.texture);
            }

            // Setup for animation
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                }
            });

            // Cache and return
            this.loadedModels.set(cacheKey, model);
            return model.clone();
        } catch (error) {
            console.error('Error loading character:', error);
            throw error;
        }
    }

    /**
     * Load animation clips from FBX
     * @param {string} animPath - Path to animation FBX
     * @param {string} animName - Name for the animation
     * @returns {Promise<THREE.AnimationClip>}
     */
    async loadAnimation(animPath, animName) {
        try {
            // Check cache
            if (this.loadedAnimations.has(animName)) {
                return this.loadedAnimations.get(animName);
            }

            const anim = await new Promise((resolve, reject) => {
                this.loader.load(
                    animPath,
                    (object) => {
                        if (object.animations && object.animations.length > 0) {
                            resolve(object.animations[0]);
                        } else {
                            reject(new Error('No animations found in FBX'));
                        }
                    },
                    undefined,
                    (error) => reject(error)
                );
            });

            // Cache animation
            this.loadedAnimations.set(animName, anim);
            return anim;
        } catch (error) {
            console.error(`Error loading animation ${animName}:`, error);
            throw error;
        }
    }

    /**
     * Load equipment (weapons, armor, accessories)
     * @param {string} equipmentPath - Path to equipment FBX
     * @returns {Promise<THREE.Group>}
     */
    async loadEquipment(equipmentPath) {
        try {
            const equipment = await new Promise((resolve, reject) => {
                this.loader.load(
                    equipmentPath,
                    (object) => resolve(object),
                    undefined,
                    (error) => reject(error)
                );
            });

            equipment.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                }
            });

            return equipment;
        } catch (error) {
            console.error('Error loading equipment:', error);
            throw error;
        }
    }

    /**
     * Apply color customization to model
     * @param {THREE.Group} model 
     * @param {string} colorName 
     */
    applyColorCustomization(model, colorName) {
        const colorMap = {
            'brown': 0x8B4513,
            'black': 0x1a1a1a,
            'white': 0xf0f0f0,
            'red': 0x8B0000,
            'blue': 0x191970,
            'green': 0x2F4F2F
        };

        const color = new THREE.Color(colorMap[colorName] || colorMap['brown']);

        model.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color.copy(color);
                    });
                } else {
                    child.material.color.copy(color);
                }
            }
        });
    }

    /**
     * Apply texture customization
     * @param {THREE.Group} model 
     * @param {string} texturePath 
     */
    async applyTextureCustomization(model, texturePath) {
        try {
            let texture;
            
            // Check cache
            if (this.loadedTextures.has(texturePath)) {
                texture = this.loadedTextures.get(texturePath);
            } else {
                texture = await new Promise((resolve, reject) => {
                    this.textureLoader.load(
                        texturePath,
                        (tex) => resolve(tex),
                        undefined,
                        (error) => reject(error)
                    );
                });
                this.loadedTextures.set(texturePath, texture);
            }

            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) 
                        ? child.material 
                        : [child.material];
                    
                    materials.forEach(mat => {
                        mat.map = texture;
                        mat.needsUpdate = true;
                    });
                }
            });
        } catch (error) {
            console.error('Error applying texture:', error);
        }
    }

    /**
     * Create an animated character with all components
     * @param {Object} config - Character configuration
     * @returns {Promise<Object>} Character object with model, mixer, and animations
     */
    async createAnimatedCharacter(config) {
        const {
            modelPath,
            animations = {},
            equipment = [],
            customization = {}
        } = config;

        try {
            // Load base model
            const model = await this.loadCharacter(modelPath, customization);

            // Create animation mixer
            const mixer = new THREE.AnimationMixer(model);

            // Load animations
            const animClips = {};
            for (const [name, path] of Object.entries(animations)) {
                try {
                    const clip = await this.loadAnimation(path, name);
                    animClips[name] = mixer.clipAction(clip);
                } catch (error) {
                    console.warn(`Failed to load animation ${name}:`, error);
                }
            }

            // Load and attach equipment
            const equippedItems = [];
            for (const equipPath of equipment) {
                try {
                    const item = await this.loadEquipment(equipPath);
                    model.add(item);
                    equippedItems.push(item);
                } catch (error) {
                    console.warn(`Failed to load equipment ${equipPath}:`, error);
                }
            }

            return {
                model,
                mixer,
                animations: animClips,
                equipment: equippedItems,
                currentAnimation: null,
                
                // Helper methods
                playAnimation(name, loop = true) {
                    if (this.currentAnimation) {
                        this.currentAnimation.fadeOut(0.3);
                    }
                    
                    const action = this.animations[name];
                    if (action) {
                        action.reset();
                        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
                        action.fadeIn(0.3);
                        action.play();
                        this.currentAnimation = action;
                    }
                },
                
                stopAnimation() {
                    if (this.currentAnimation) {
                        this.currentAnimation.fadeOut(0.3);
                        this.currentAnimation = null;
                    }
                },
                
                update(deltaTime) {
                    this.mixer.update(deltaTime);
                }
            };
        } catch (error) {
            console.error('Error creating animated character:', error);
            throw error;
        }
    }

    /**
     * Dispose of cached resources
     */
    dispose() {
        this.loadedModels.clear();
        this.loadedAnimations.clear();
        
        // Dispose textures
        this.loadedTextures.forEach(texture => texture.dispose());
        this.loadedTextures.clear();
    }
}

/**
 * Barbarian character presets
 */
export const BarbarianPresets = {
    // Character models
    models: {
        standard: '/Barbarians/models/BRB_Characters_customizable.FBX',
        cavalry: '/Barbarians/models/BRB_Cavalry_customizable.FBX'
    },
    
    // Animations
    animations: {
        mage: {
            cast: '/Barbarians/animation/Mage/BRB_mage_11_cast_B.FBX'
        },
        spearman: {
            attack: '/Barbarians/animation/Spearman/BRB_spearman_07_attack.FBX'
        }
    },
    
    // Equipment
    equipment: {
        weapons: {
            sword: '/Barbarians/models/extra models/Equipment/BRB_weapon_sword_B.FBX',
            spear: '/Barbarians/models/extra models/Equipment/BRB_weapon_spear.FBX',
            hammer: '/Barbarians/models/extra models/Equipment/BRB_weapon_hammer_B.FBX',
            staff: '/Barbarians/models/extra models/Equipment/BRB_weapon_staff_B.FBX'
        },
        accessories: {
            bag: '/Barbarians/models/extra models/BRB_bag.FBX'
        }
    },
    
    // Color variants
    colors: ['brown', 'black', 'white', 'red', 'blue', 'green'],
    
    // Texture paths
    textures: {
        standard: '/Barbarians/models/Materials/BRB_StandardUnits_texture.tga',
        brown: '/Barbarians/models/Materials/Color/textures/BRB_Standard_Units_brown.tga'
    }
};

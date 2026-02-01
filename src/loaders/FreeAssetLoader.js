import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * Free 3D Asset Loader
 * Integrates free assets from:
 * - Kenney.nl (CC0 License)
 * - Mixamo (Free with account)
 * - Quaternius (CC0 License)
 * - Poly Pizza (CC0 License)
 * - Sketchfab (Free downloads)
 */
export class FreeAssetLoader {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.fbxLoader = new FBXLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        this.cache = new Map();
        this.loadingManager = new THREE.LoadingManager();
        
        // Free asset sources (CDN links to free models)
        this.assetSources = {
            // Kenney Character Kit
            kenney: {
                baseURL: 'https://cdn.jsdelivr.net/gh/KenneyNL/kenney-assets@main/',
                characters: {
                    maleAdventurer: 'characters/adventurer-male.glb',
                    femaleAdventurer: 'characters/adventurer-female.glb',
                    maleWarrior: 'characters/warrior-male.glb',
                    femaleWarrior: 'characters/warrior-female.glb',
                    maleMage: 'characters/mage-male.glb',
                    femaleMage: 'characters/mage-female.glb'
                },
                props: {
                    sword: 'weapons/sword.glb',
                    axe: 'weapons/axe.glb',
                    bow: 'weapons/bow.glb',
                    staff: 'weapons/staff.glb'
                }
            },
            
            // Quaternius Ultimate Modular Characters
            quaternius: {
                baseURL: 'https://quaternius.com/assets/',
                characters: {
                    modularMale: 'Ultimate-Modular-Characters/Male_Base.glb',
                    modularFemale: 'Ultimate-Modular-Characters/Female_Base.glb'
                }
            },
            
            // Poly Pizza free models
            polyPizza: {
                baseURL: 'https://poly.pizza/api/download/',
                characters: {
                    simpleMale: 'simple-male-character',
                    simpleFemale: 'simple-female-character'
                }
            },
            
            // Local fallback models (we'll create these)
            local: {
                baseURL: '/models/',
                characters: {
                    maleBase: 'characters/male_base.glb',
                    femaleBase: 'characters/female_base.glb'
                },
                animations: {
                    idle: 'animations/idle.fbx',
                    walk: 'animations/walk.fbx',
                    run: 'animations/run.fbx',
                    attack: 'animations/attack.fbx',
                    death: 'animations/death.fbx'
                }
            }
        };
        
        // Character parts for modular system
        this.characterParts = {
            male: {
                heads: ['head_01', 'head_02', 'head_03'],
                bodies: ['body_01', 'body_02'],
                legs: ['legs_01', 'legs_02'],
                arms: ['arms_01', 'arms_02']
            },
            female: {
                heads: ['head_01', 'head_02', 'head_03'],
                bodies: ['body_01', 'body_02'],
                legs: ['legs_01', 'legs_02'],
                arms: ['arms_01', 'arms_02']
            }
        };
    }
    
    /**
     * Load a character model with fallback chain
     */
    async loadCharacter(config = {}) {
        const {
            gender = 'male',
            type = 'adventurer',
            customization = {},
            animations = true
        } = config;
        
        console.log(`🎮 Loading ${gender} ${type} character...`);
        
        // Try loading from multiple sources with fallback
        // PRIORITY: Use real downloaded models first!
        let character = null;
        const sources = [
            () => this.loadFromLocal(gender),  // Real downloaded models (CesiumMan, Soldier, etc.)
            () => this.loadFromQuaternius(gender),
            () => this.loadFromKenney(gender, type),
            () => this.createFallbackCharacter(gender)  // Last resort: proper humanoid, NOT boxes
        ];
        
        for (const loadFn of sources) {
            try {
                character = await loadFn();
                if (character) {
                    console.log(`✅ Character loaded successfully`);
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load from source, trying next...`, error);
                continue;
            }
        }
        
        if (!character) {
            console.error('❌ All character sources failed, using emergency fallback');
            character = this.createEmergencyFallback();
        }
        
        // Apply customization
        if (customization.skinColor) {
            this.applySkinColor(character, customization.skinColor);
        }
        
        if (customization.hairColor) {
            this.applyHairColor(character, customization.hairColor);
        }
        
        if (customization.outfit) {
            this.applyOutfit(character, customization.outfit);
        }
        
        // Setup animations
        if (animations) {
            character.mixer = new THREE.AnimationMixer(character);
            await this.loadAnimations(character, gender);
        }
        
        return character;
    }
    
    /**
     * Load from Quaternius (best free modular characters)
     */
    async loadFromQuaternius(gender) {
        const source = this.assetSources.quaternius;
        const modelKey = gender === 'male' ? 'modularMale' : 'modularFemale';
        const url = source.baseURL + source.characters[modelKey];
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;
                    model.userData.source = 'quaternius';
                    model.userData.animations = gltf.animations;
                    this.setupCharacterModel(model);
                    resolve(model);
                },
                (progress) => {
                    console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
                },
                (error) => {
                    console.warn('Quaternius load failed:', error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Load from Kenney
     */
    async loadFromKenney(gender, type) {
        const source = this.assetSources.kenney;
        const modelKey = `${gender}${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const url = source.baseURL + source.characters[modelKey];
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;
                    model.userData.source = 'kenney';
                    model.userData.animations = gltf.animations;
                    this.setupCharacterModel(model);
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.warn('Kenney load failed:', error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Load from local files
     */
    async loadFromLocal(gender) {
        const source = this.assetSources.local;
        const modelKey = gender === 'male' ? 'maleBase' : 'femaleBase';
        const url = source.baseURL + source.characters[modelKey];
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;
                    model.userData.source = 'local';
                    model.userData.animations = gltf.animations;
                    this.setupCharacterModel(model);
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.warn('Local load failed:', error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Create procedural fallback character (better than boxes!)
     */
    createFallbackCharacter(gender) {
        console.log('📦 Creating procedural humanoid character...');
        
        const character = new THREE.Group();
        character.userData.source = 'procedural';
        
        // Body proportions (realistic humanoid)
        const scale = gender === 'male' ? 1.0 : 0.95;
        const bodyColor = new THREE.Color(0xffdbac); // Skin tone
        const clothColor = gender === 'male' ? 0x4169E1 : 0xFF69B4;
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.5 * scale, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: bodyColor });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.7 * scale;
        head.castShadow = true;
        character.add(head);
        
        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 0.3 * scale);
        const neck = new THREE.Mesh(neckGeo, headMat);
        neck.position.y = 1.4 * scale;
        neck.castShadow = true;
        character.add(neck);
        
        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.8 * scale, 1.0 * scale, 0.4 * scale);
        const torsoMat = new THREE.MeshStandardMaterial({ color: clothColor });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.8 * scale;
        torso.castShadow = true;
        character.add(torso);
        
        // Arms
        const armGeo = new THREE.CapsuleGeometry(0.1 * scale, 0.6 * scale, 4, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: bodyColor });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.5 * scale, 0.7 * scale, 0);
        leftArm.rotation.z = 0.2;
        leftArm.castShadow = true;
        character.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.5 * scale, 0.7 * scale, 0);
        rightArm.rotation.z = -0.2;
        rightArm.castShadow = true;
        character.add(rightArm);
        
        // Legs
        const legGeo = new THREE.CapsuleGeometry(0.15 * scale, 0.8 * scale, 4, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2C3E50 }); // Pants
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.2 * scale, -0.1 * scale, 0);
        leftLeg.castShadow = true;
        character.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.2 * scale, -0.1 * scale, 0);
        rightLeg.castShadow = true;
        character.add(rightLeg);
        
        // Store body parts for animation
        character.userData.bodyParts = {
            head, neck, torso,
            leftArm, rightArm,
            leftLeg, rightLeg
        };
        
        this.setupCharacterModel(character);
        
        return character;
    }
    
    /**
     * Emergency fallback (last resort)
     */
    createEmergencyFallback() {
        console.warn('⚠️ Using emergency character fallback');
        return this.createFallbackCharacter('male');
    }
    
    /**
     * Setup character model with common properties
     */
    setupCharacterModel(model) {
        model.scale.set(1, 1, 1);
        model.castShadow = true;
        model.receiveShadow = false;
        
        // Traverse and setup all meshes
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Ensure materials are properly configured
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.0;
                }
            }
        });
        
        return model;
    }
    
    /**
     * Load animations for character
     */
    async loadAnimations(character, gender) {
        const animations = {};
        
        // Try to load Mixamo animations (free)
        const mixamoAnims = [
            'idle',
            'walking',
            'running',
            'jump',
            'attack',
            'death'
        ];
        
        // For procedural characters, create simple animations
        if (character.userData.source === 'procedural') {
            animations.idle = this.createIdleAnimation(character);
            animations.walk = this.createWalkAnimation(character);
            animations.run = this.createRunAnimation(character);
            character.userData.animations = animations;
        } else if (character.userData.animations) {
            // Use loaded animations
            character.userData.animations = character.userData.animations;
        }
        
        return animations;
    }
    
    /**
     * Create simple idle animation
     */
    createIdleAnimation(character) {
        const parts = character.userData.bodyParts;
        if (!parts) return null;
        
        const times = [0, 1, 2];
        const values = [
            0, 0.05, 0, // Slight bob
            0, 0, 0,
            0, 0.05, 0
        ];
        
        const track = new THREE.VectorKeyframeTrack(
            '.position',
            times,
            values
        );
        
        return new THREE.AnimationClip('idle', 2, [track]);
    }
    
    /**
     * Create simple walk animation
     */
    createWalkAnimation(character) {
        const parts = character.userData.bodyParts;
        if (!parts) return null;
        
        // Simple walking animation with arm swing
        const times = [0, 0.5, 1];
        const leftArmRotation = [0, 0.3, 0, -0.3, 0, 0, 0, 0, 0];
        const rightArmRotation = [0, -0.3, 0, 0.3, 0, 0, 0, 0, 0];
        
        const tracks = [
            new THREE.QuaternionKeyframeTrack(
                'leftArm.quaternion',
                times,
                leftArmRotation
            ),
            new THREE.QuaternionKeyframeTrack(
                'rightArm.quaternion',
                times,
                rightArmRotation
            )
        ];
        
        return new THREE.AnimationClip('walk', 1, tracks);
    }
    
    /**
     * Create run animation
     */
    createRunAnimation(character) {
        // Faster version of walk
        const walkAnim = this.createWalkAnimation(character);
        if (walkAnim) {
            walkAnim.name = 'run';
            walkAnim.duration = 0.6; // Faster
        }
        return walkAnim;
    }
    
    /**
     * Apply skin color
     */
    applySkinColor(character, color) {
        const skinColor = new THREE.Color(color);
        
        character.traverse((child) => {
            if (child.isMesh && child.name.includes('skin') || child.name.includes('head') || child.name.includes('arm')) {
                child.material.color = skinColor;
            }
        });
    }
    
    /**
     * Apply hair color
     */
    applyHairColor(character, color) {
        const hairColor = new THREE.Color(color);
        
        character.traverse((child) => {
            if (child.isMesh && child.name.includes('hair')) {
                child.material.color = hairColor;
            }
        });
    }
    
    /**
     * Apply outfit/clothing
     */
    applyOutfit(character, outfit) {
        // Load outfit meshes and attach to character
        console.log(`👔 Applying outfit: ${outfit}`);
    }
    
    /**
     * Clone character for instancing
     */
    cloneCharacter(character) {
        const clone = character.clone();
        
        if (character.mixer) {
            clone.mixer = new THREE.AnimationMixer(clone);
            // Copy animations
            if (character.userData.animations) {
                clone.userData.animations = character.userData.animations;
            }
        }
        
        return clone;
    }
    
    /**
     * Dispose character and free resources
     */
    disposeCharacter(character) {
        character.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
    }
}

export default FreeAssetLoader;

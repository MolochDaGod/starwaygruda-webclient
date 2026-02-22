import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * ModularCharacterSystem
 * 
 * Manages modular character models that change based on equipped items
 * Uses the Ultimate Modular Men Pack with 11 outfit types
 * 
 * Outfit Types (mapped to armor/class):
 * - Adventurer: Light armor / Scout / Ranger
 * - Astronaut: Tech armor / Engineer
 * - Beach: No armor / Civilian
 * - Suit: Cloth / Merchant / Diplomat
 * - Casual: No armor / Starting gear
 * - Farmer: Cloth / Artisan / Crafter
 * - Hoodie: Cloth / Rogue / Street
 * - King: Heavy armor / Noble / Commander
 * - Punk: Light armor / Rebel / Outlaw
 * - Swat: Medium armor / Soldier / Commando
 * - Worker: Medium armor / Laborer / Miner
 */

// Character outfit definitions
export const CharacterOutfits = {
    ADVENTURER: {
        id: 'adventurer',
        name: 'Adventurer',
        file: 'Adventurer/Adventurer.fbx',
        armorClass: 'light',
        professions: ['scout', 'ranger', 'bountyHunter'],
        description: 'Rugged explorer gear'
    },
    ASTRONAUT: {
        id: 'astronaut',
        name: 'Astronaut',
        file: 'Astronaut/Spacesuit.fbx',
        armorClass: 'tech',
        professions: ['engineer', 'pilot', 'spacer'],
        description: 'Advanced spacesuit'
    },
    BEACH: {
        id: 'beach',
        name: 'Beach',
        file: 'Beach Character/Beach.fbx',
        armorClass: 'none',
        professions: ['entertainer', 'civilian'],
        description: 'Casual beach wear'
    },
    SUIT: {
        id: 'suit',
        name: 'Business Suit',
        file: 'Business Man/Suit.fbx',
        armorClass: 'cloth',
        professions: ['merchant', 'politician', 'smuggler'],
        description: 'Professional attire'
    },
    CASUAL: {
        id: 'casual',
        name: 'Casual',
        file: 'Casual Character/Casual_2.fbx',
        armorClass: 'none',
        professions: ['all'], // Starting gear for any class
        description: 'Standard civilian clothes'
    },
    FARMER: {
        id: 'farmer',
        name: 'Farmer',
        file: 'Farmer/Farmer.fbx',
        armorClass: 'cloth',
        professions: ['artisan', 'architect', 'chef'],
        description: 'Working clothes for crafters'
    },
    HOODIE: {
        id: 'hoodie',
        name: 'Hoodie',
        file: 'Hoodie Character/Casual_Hoodie.fbx',
        armorClass: 'cloth',
        professions: ['smuggler', 'spy', 'slicer'],
        description: 'Urban street wear'
    },
    KING: {
        id: 'king',
        name: 'King',
        file: 'King/King.fbx',
        armorClass: 'heavy',
        professions: ['fencer', 'noble', 'jedi'],
        description: 'Royal ceremonial armor'
    },
    PUNK: {
        id: 'punk',
        name: 'Punk',
        file: 'Punk/Punk.fbx',
        armorClass: 'light',
        professions: ['brawler', 'pikeman', 'rebel'],
        description: 'Rebellious combat gear'
    },
    SWAT: {
        id: 'swat',
        name: 'SWAT',
        file: 'Swat/Swat.fbx',
        armorClass: 'medium',
        professions: ['commando', 'rifleman', 'carbineer'],
        description: 'Tactical combat armor'
    },
    WORKER: {
        id: 'worker',
        name: 'Worker',
        file: 'Worker/Worker.fbx',
        armorClass: 'medium',
        professions: ['miner', 'weaponsmith', 'armorsmith'],
        description: 'Industrial work gear'
    }
};

// Armor class to outfit mapping
export const ArmorClassOutfits = {
    none: ['beach', 'casual'],
    cloth: ['suit', 'farmer', 'hoodie'],
    light: ['adventurer', 'punk'],
    medium: ['swat', 'worker'],
    heavy: ['king'],
    tech: ['astronaut']
};

// Profession to recommended outfit
export const ProfessionOutfits = {
    // Combat
    brawler: 'punk',
    marksman: 'swat',
    scout: 'adventurer',
    rifleman: 'swat',
    carbineer: 'swat',
    pistoleer: 'adventurer',
    commando: 'swat',
    fencer: 'king',
    pikeman: 'punk',
    swordsman: 'adventurer',
    bountyHunter: 'adventurer',
    
    // Crafting
    artisan: 'farmer',
    weaponsmith: 'worker',
    armorsmith: 'worker',
    architect: 'farmer',
    chef: 'farmer',
    tailor: 'suit',
    droidEngineer: 'astronaut',
    
    // Entertainment
    entertainer: 'beach',
    dancer: 'beach',
    musician: 'casual',
    imageDesigner: 'suit',
    
    // Medical
    medic: 'casual',
    doctor: 'suit',
    combatMedic: 'swat',
    
    // Other
    smuggler: 'hoodie',
    spy: 'hoodie',
    slicer: 'hoodie',
    politician: 'suit',
    merchant: 'suit',
    ranger: 'adventurer',
    creatureHandler: 'farmer',
    bioEngineer: 'astronaut',
    squadLeader: 'swat',
    
    // Jedi
    jedi: 'king',
    forceSensitive: 'hoodie',
    
    // Default
    default: 'casual'
};

/**
 * Main Modular Character System
 */
export class ModularCharacterSystem {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        
        // Configuration
        this.config = {
            basePath: options.basePath || '/assets/characters/ModularMenPack/',
            defaultOutfit: options.defaultOutfit || 'casual',
            scale: options.scale || 0.01, // FBX files are usually large
            animationPath: options.animationPath || '/assets/melee-axe/'
        };
        
        // State
        this.currentOutfit = null;
        this.currentModel = null;
        this.loadedOutfits = new Map(); // Cache loaded models
        this.mixer = null;
        this.animations = new Map();
        this.currentAction = null;
        
        // Equipment state
        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            feet: null,
            hands: null,
            weapon: null,
            offhand: null
        };
        
        // Loader
        this.loader = new FBXLoader();
        
        console.log('👔 ModularCharacterSystem initialized');
    }
    
    /**
     * Initialize with default outfit
     */
    async init(outfitId = null) {
        const outfit = outfitId || this.config.defaultOutfit;
        await this.loadOutfit(outfit);
        return this.currentModel;
    }
    
    /**
     * Load an outfit by ID
     */
    async loadOutfit(outfitId) {
        const outfitDef = Object.values(CharacterOutfits).find(o => o.id === outfitId);
        if (!outfitDef) {
            console.warn(`[ModularChar] Unknown outfit: ${outfitId}`);
            return null;
        }
        
        // Check cache
        if (this.loadedOutfits.has(outfitId)) {
            return this.switchToOutfit(outfitId);
        }
        
        console.log(`[ModularChar] Loading outfit: ${outfitDef.name}`);
        
        try {
            const model = await this.loadFBX(this.config.basePath + outfitDef.file);
            
            // Setup model
            model.scale.setScalar(this.config.scale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Cache it
            this.loadedOutfits.set(outfitId, {
                definition: outfitDef,
                model: model,
                animations: model.animations || []
            });
            
            // Switch to it
            return this.switchToOutfit(outfitId);
            
        } catch (error) {
            console.error(`[ModularChar] Failed to load ${outfitDef.name}:`, error);
            return null;
        }
    }
    
    /**
     * Load FBX file
     */
    loadFBX(path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (fbx) => resolve(fbx),
                (progress) => {
                    if (progress.total > 0) {
                        const pct = Math.round((progress.loaded / progress.total) * 100);
                        console.log(`[ModularChar] Loading: ${pct}%`);
                    }
                },
                (error) => reject(error)
            );
        });
    }
    
    /**
     * Switch to a cached outfit
     */
    switchToOutfit(outfitId) {
        const cached = this.loadedOutfits.get(outfitId);
        if (!cached) return null;
        
        // Remove current model
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        // Add new model
        this.currentModel = cached.model;
        this.currentOutfit = cached.definition;
        this.scene.add(this.currentModel);
        
        // Setup animation mixer
        this.mixer = new THREE.AnimationMixer(this.currentModel);
        
        // Load animations if any
        if (cached.animations.length > 0) {
            cached.animations.forEach((clip, index) => {
                this.animations.set(clip.name || `anim_${index}`, clip);
            });
        }
        
        console.log(`[ModularChar] Switched to: ${cached.definition.name}`);
        return this.currentModel;
    }
    
    /**
     * Get outfit for a profession
     */
    getOutfitForProfession(profession) {
        const outfitId = ProfessionOutfits[profession] || ProfessionOutfits.default;
        return outfitId;
    }
    
    /**
     * Get outfit for armor class
     */
    getOutfitForArmorClass(armorClass) {
        const outfits = ArmorClassOutfits[armorClass] || ArmorClassOutfits.none;
        return outfits[0]; // Return first matching outfit
    }
    
    /**
     * Update outfit based on equipped armor
     */
    async updateFromEquipment(equipmentData) {
        // Determine armor class from chest piece (primary)
        const chestArmor = equipmentData.chest;
        let targetOutfit = this.config.defaultOutfit;
        
        if (chestArmor) {
            const armorClass = chestArmor.armorClass || 'none';
            targetOutfit = this.getOutfitForArmorClass(armorClass);
            
            // Override with profession-specific if defined
            if (chestArmor.profession) {
                const profOutfit = this.getOutfitForProfession(chestArmor.profession);
                if (profOutfit) targetOutfit = profOutfit;
            }
        }
        
        // Only switch if different
        if (!this.currentOutfit || this.currentOutfit.id !== targetOutfit) {
            await this.loadOutfit(targetOutfit);
        }
        
        // Update equipment state
        this.equipment = { ...this.equipment, ...equipmentData };
        
        return this.currentOutfit;
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
     * Play animation by name
     */
    playAnimation(name, options = {}) {
        if (!this.mixer) return;
        
        const clip = this.animations.get(name);
        if (!clip) {
            console.warn(`[ModularChar] Animation not found: ${name}`);
            return;
        }
        
        const action = this.mixer.clipAction(clip);
        
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(options.fadeTime || 0.2);
        }
        
        action.reset();
        action.fadeIn(options.fadeTime || 0.2);
        action.setLoop(options.loop !== false ? THREE.LoopRepeat : THREE.LoopOnce);
        action.play();
        
        this.currentAction = action;
    }
    
    /**
     * Update (call each frame)
     */
    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
    
    /**
     * Get all available outfits
     */
    getAvailableOutfits() {
        return Object.values(CharacterOutfits);
    }
    
    /**
     * Get outfits for a specific armor class
     */
    getOutfitsForArmorClass(armorClass) {
        const outfitIds = ArmorClassOutfits[armorClass] || [];
        return outfitIds.map(id => 
            Object.values(CharacterOutfits).find(o => o.id === id)
        ).filter(Boolean);
    }
    
    /**
     * Preload multiple outfits
     */
    async preloadOutfits(outfitIds) {
        const promises = outfitIds.map(id => this.loadOutfit(id));
        await Promise.all(promises);
        console.log(`[ModularChar] Preloaded ${outfitIds.length} outfits`);
    }
    
    /**
     * Get current outfit info
     */
    getCurrentOutfit() {
        return this.currentOutfit;
    }
    
    /**
     * Dispose
     */
    dispose() {
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        this.loadedOutfits.forEach((cached) => {
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
        
        this.loadedOutfits.clear();
        this.animations.clear();
    }
}

export default ModularCharacterSystem;

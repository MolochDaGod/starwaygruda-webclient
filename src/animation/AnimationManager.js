import * as THREE from 'three';

/**
 * Optimal Animation Manager
 * Handles character animations with performance optimization
 * - Animation blending
 * - State management
 * - Performance pooling
 * - LOD-based animation updates
 */
export class AnimationManager {
    constructor() {
        this.characters = new Map();
        this.animationStates = new Map();
        this.mixers = [];
        
        // Performance settings
        this.updateDistance = {
            high: 50,    // Full update
            medium: 100, // Reduced update rate
            low: 200,    // Minimal updates
            cull: 500    // No updates
        };
        
        this.updateRates = {
            high: 1,     // Every frame
            medium: 2,   // Every 2 frames
            low: 4,      // Every 4 frames
            cull: 0      // No updates
        };
        
        this.frameCounter = 0;
        
        // Animation presets
        this.animations = {
            idle: { loop: THREE.LoopRepeat, timeScale: 1.0 },
            walk: { loop: THREE.LoopRepeat, timeScale: 1.0 },
            run: { loop: THREE.LoopRepeat, timeScale: 1.2 },
            jump: { loop: THREE.LoopOnce, timeScale: 1.0 },
            attack: { loop: THREE.LoopOnce, timeScale: 1.5 },
            death: { loop: THREE.LoopOnce, timeScale: 1.0, clampWhenFinished: true }
        };
    }
    
    /**
     * Register a character with its mixer and animations
     */
    registerCharacter(id, character, mixer, animations) {
        if (!mixer || !animations || animations.length === 0) {
            console.warn(`Character ${id} has no animations`);
            return false;
        }
        
        this.characters.set(id, {
            character,
            mixer,
            animations: this.indexAnimations(animations),
            currentAction: null,
            previousAction: null,
            state: 'idle',
            updateLevel: 'high'
        });
        
        if (!this.mixers.includes(mixer)) {
            this.mixers.push(mixer);
        }
        
        // Play idle by default
        this.playAnimation(id, 'idle');
        
        console.log(`✅ Registered character ${id} with ${animations.length} animations`);
        return true;
    }
    
    /**
     * Index animations by name for quick lookup
     */
    indexAnimations(animations) {
        const indexed = {};
        
        animations.forEach(clip => {
            const name = this.normalizeAnimationName(clip.name);
            indexed[name] = clip;
        });
        
        return indexed;
    }
    
    /**
     * Normalize animation names (Running -> run, Walk -> walk, etc.)
     */
    normalizeAnimationName(name) {
        const lower = name.toLowerCase();
        
        // Common animation name mappings
        const mappings = {
            'walking': 'walk',
            'running': 'run',
            'jumping': 'jump',
            'attacking': 'attack',
            'dying': 'death',
            'standing': 'idle',
            'idle': 'idle'
        };
        
        for (const [key, value] of Object.entries(mappings)) {
            if (lower.includes(key)) {
                return value;
            }
        }
        
        return lower;
    }
    
    /**
     * Play animation with smooth blending
     */
    playAnimation(id, animationName, blendDuration = 0.3) {
        const charData = this.characters.get(id);
        if (!charData) {
            console.warn(`Character ${id} not registered`);
            return false;
        }
        
        const { mixer, animations } = charData;
        const clip = animations[animationName] || animations[Object.keys(animations)[0]];
        
        if (!clip) {
            console.warn(`Animation ${animationName} not found for ${id}`);
            return false;
        }
        
        const newAction = mixer.clipAction(clip);
        const preset = this.animations[animationName] || {};
        
        // Configure action
        newAction.loop = preset.loop !== undefined ? preset.loop : THREE.LoopRepeat;
        newAction.timeScale = preset.timeScale || 1.0;
        newAction.clampWhenFinished = preset.clampWhenFinished || false;
        
        // Blend from previous animation
        if (charData.currentAction && charData.currentAction !== newAction) {
            charData.previousAction = charData.currentAction;
            
            // Crossfade
            charData.previousAction.fadeOut(blendDuration);
            newAction.reset().fadeIn(blendDuration).play();
        } else {
            newAction.reset().play();
        }
        
        charData.currentAction = newAction;
        charData.state = animationName;
        
        return true;
    }
    
    /**
     * Update all character animations with LOD
     */
    update(delta, cameraPosition = null) {
        this.frameCounter++;
        
        // Update each character based on distance LOD
        this.characters.forEach((charData, id) => {
            if (!charData.character || !charData.mixer) return;
            
            // Calculate update level based on distance
            if (cameraPosition) {
                const distance = cameraPosition.distanceTo(charData.character.position);
                charData.updateLevel = this.getUpdateLevel(distance);
            }
            
            // Apply LOD-based update rate
            const updateRate = this.updateRates[charData.updateLevel];
            
            if (updateRate === 0) {
                // Culled - don't update
                return;
            }
            
            if (this.frameCounter % updateRate === 0) {
                charData.mixer.update(delta * updateRate);
            }
        });
    }
    
    /**
     * Determine update level based on distance
     */
    getUpdateLevel(distance) {
        if (distance < this.updateDistance.high) return 'high';
        if (distance < this.updateDistance.medium) return 'medium';
        if (distance < this.updateDistance.low) return 'low';
        return 'cull';
    }
    
    /**
     * Get current animation state
     */
    getState(id) {
        const charData = this.characters.get(id);
        return charData ? charData.state : null;
    }
    
    /**
     * Check if animation is playing
     */
    isPlaying(id, animationName) {
        const charData = this.characters.get(id);
        return charData && charData.state === animationName;
    }
    
    /**
     * Stop all animations for character
     */
    stopAllAnimations(id) {
        const charData = this.characters.get(id);
        if (charData && charData.mixer) {
            charData.mixer.stopAllAction();
            charData.currentAction = null;
            charData.previousAction = null;
            charData.state = null;
        }
    }
    
    /**
     * Set animation speed
     */
    setTimeScale(id, scale) {
        const charData = this.characters.get(id);
        if (charData && charData.currentAction) {
            charData.currentAction.timeScale = scale;
        }
    }
    
    /**
     * Unregister character and cleanup
     */
    unregisterCharacter(id) {
        const charData = this.characters.get(id);
        if (charData) {
            this.stopAllAnimations(id);
            
            const mixerIndex = this.mixers.indexOf(charData.mixer);
            if (mixerIndex > -1) {
                this.mixers.splice(mixerIndex, 1);
            }
            
            this.characters.delete(id);
        }
    }
    
    /**
     * Get performance stats
     */
    getStats() {
        const stats = {
            total: this.characters.size,
            byLevel: { high: 0, medium: 0, low: 0, cull: 0 },
            totalMixers: this.mixers.length
        };
        
        this.characters.forEach(charData => {
            stats.byLevel[charData.updateLevel]++;
        });
        
        return stats;
    }
    
    /**
     * Dispose all resources
     */
    dispose() {
        this.characters.forEach((charData, id) => {
            this.unregisterCharacter(id);
        });
        
        this.characters.clear();
        this.mixers = [];
    }
}

export default AnimationManager;

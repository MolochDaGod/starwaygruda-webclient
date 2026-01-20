import * as THREE from 'three';

/**
 * Crystal System - Collectible crystals scattered across the terrain
 */
export class CrystalSystem {
    constructor(scene) {
        this.scene = scene;
        this.crystals = [];
        this.maxCrystals = 50;
        this.crystalHitbox = 8; // Collection distance
        
        // Crystal types with different values and colors
        this.crystalTypes = [
            { name: 'Blue', color: 0x4444ff, value: 10, emissive: 0x2222aa },
            { name: 'Green', color: 0x44ff44, value: 15, emissive: 0x22aa22 },
            { name: 'Red', color: 0xff4444, value: 20, emissive: 0xaa2222 },
            { name: 'Purple', color: 0xff44ff, value: 25, emissive: 0xaa22aa },
            { name: 'Gold', color: 0xffff44, value: 50, emissive: 0xaaaa22 }
        ];
        
        console.log('💎 Crystal system initialized');
    }
    
    createCrystal(position) {
        // Choose random crystal type
        const type = this.crystalTypes[Math.floor(Math.random() * this.crystalTypes.length)];
        
        // Create crystal geometry
        const geometry = new THREE.OctahedronGeometry(1 + Math.random() * 0.5, 0);
        
        // Create crystal material with glow
        const material = new THREE.MeshStandardMaterial({
            color: type.color,
            emissive: type.emissive,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9,
            roughness: 0.1,
            metalness: 0.1
        });
        
        const crystal = new THREE.Mesh(geometry, material);
        crystal.position.copy(position);
        
        // Add crystal data
        crystal.userData = {
            type: type.name,
            value: type.value,
            collected: false,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            floatOffset: Math.random() * Math.PI * 2
        };
        
        // Add to scene and track
        this.scene.add(crystal);
        this.crystals.push(crystal);
        
        return crystal;
    }
    
    update(time) {
        // Update crystal animations
        this.crystals.forEach((crystal, index) => {
            if (crystal.userData.collected) {
                // Handle collection animation
                this.updateCollectionAnimation(crystal, time);
                return;
            }
            
            // Floating animation
            const floatHeight = Math.sin(time * 2 + crystal.userData.floatOffset) * 0.5;
            if (crystal.userData.originalY !== undefined) {
                crystal.position.y = crystal.userData.originalY + floatHeight;
            }
            
            // Rotation animation
            crystal.rotation.y += crystal.userData.rotationSpeed;
            crystal.rotation.x += crystal.userData.rotationSpeed * 0.5;
            
            // Pulsing glow effect
            const pulseIntensity = 0.3 + Math.sin(time * 3 + crystal.userData.floatOffset) * 0.2;
            crystal.material.emissiveIntensity = pulseIntensity;
        });
    }
    
    updateCollectionAnimation(crystal, time) {
        if (!crystal.userData.collectionAnimation) return;
        
        const anim = crystal.userData.collectionAnimation;
        const elapsed = time - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);
        
        if (progress >= 1) {
            // Animation complete, remove crystal
            this.removeCrystal(crystal);
            return;
        }
        
        // Scale animation (grow then shrink)
        const scale = anim.startScale.x * (1 + progress * 0.5) * (1 - progress);
        crystal.scale.setScalar(scale);
        
        // Float upward
        crystal.position.y = anim.startPosition.y + progress * 10;
        
        // Fade out
        crystal.material.opacity = 1 - progress;
        
        // Increase glow
        crystal.material.emissiveIntensity = 0.3 + progress * 2;
    }
    
    removeCrystal(crystal) {
        const index = this.crystals.indexOf(crystal);
        if (index > -1) {
            this.crystals.splice(index, 1);
            this.scene.remove(crystal);
            crystal.geometry.dispose();
            crystal.material.dispose();
        }
    }
    
    dispose() {
        this.crystals.forEach(crystal => {
            this.scene.remove(crystal);
            crystal.geometry.dispose();
            crystal.material.dispose();
        });
        this.crystals = [];
    }
}
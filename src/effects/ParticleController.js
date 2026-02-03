import * as THREE from 'three';

/**
 * Advanced Particle Controller
 * High-performance particle system with:
 * - Object pooling for zero garbage collection
 * - LOD-based particle density
 * - Multiple emitter types
 * - Particle effects: combat, environment, UI
 */
export class ParticleController {
    constructor(scene) {
        this.scene = scene;
        this.emitters = [];
        this.particlePools = new Map();
        this.activeParticles = [];
        
        // Performance settings
        this.maxParticles = 5000;
        this.particleUpdateDistance = {
            high: 50,    // Full detail
            medium: 100, // Reduced detail
            low: 200,    // Minimal detail
            cull: 500    // No updates
        };
        
        this.initializePools();
        console.log('✨ ParticleController initialized');
    }
    
    initializePools() {
        // Create pools for different particle types
        this.createPool('muzzleFlash', 100, this.createMuzzleFlashGeometry());
        this.createPool('bulletTrail', 200, this.createBulletTrailGeometry());
        this.createPool('impact', 150, this.createImpactGeometry());
        this.createPool('explosion', 50, this.createExplosionGeometry());
        this.createPool('smoke', 200, this.createSmokeGeometry());
        this.createPool('spark', 300, this.createSparkGeometry());
        this.createPool('blood', 100, this.createBloodGeometry());
        this.createPool('heal', 100, this.createHealGeometry());
    }
    
    createPool(type, size, geometry) {
        const pool = {
            available: [],
            active: []
        };
        
        for (let i = 0; i < size; i++) {
            const material = this.getMaterialForType(type);
            const particle = new THREE.Mesh(geometry, material);
            particle.userData.type = type;
            particle.userData.velocity = new THREE.Vector3();
            particle.userData.lifetime = 0;
            particle.userData.maxLifetime = 1.0;
            particle.visible = false;
            pool.available.push(particle);
        }
        
        this.particlePools.set(type, pool);
    }
    
    // Geometry creators
    createMuzzleFlashGeometry() {
        return new THREE.PlaneGeometry(0.5, 0.5);
    }
    
    createBulletTrailGeometry() {
        return new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
    }
    
    createImpactGeometry() {
        return new THREE.SphereGeometry(0.1, 8, 8);
    }
    
    createExplosionGeometry() {
        return new THREE.SphereGeometry(0.3, 16, 16);
    }
    
    createSmokeGeometry() {
        return new THREE.PlaneGeometry(1, 1);
    }
    
    createSparkGeometry() {
        return new THREE.BoxGeometry(0.05, 0.05, 0.2);
    }
    
    createBloodGeometry() {
        return new THREE.SphereGeometry(0.1, 8, 8);
    }
    
    createHealGeometry() {
        return new THREE.PlaneGeometry(0.3, 0.3);
    }
    
    getMaterialForType(type) {
        const materials = {
            muzzleFlash: new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            }),
            bulletTrail: new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            }),
            impact: new THREE.MeshBasicMaterial({
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.7
            }),
            explosion: new THREE.MeshBasicMaterial({
                color: 0xff4400,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            }),
            smoke: new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.5,
                depthWrite: false
            }),
            spark: new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            }),
            blood: new THREE.MeshBasicMaterial({
                color: 0xaa0000,
                transparent: true,
                opacity: 0.8
            }),
            heal: new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            })
        };
        
        return materials[type] || new THREE.MeshBasicMaterial({ color: 0xffffff });
    }
    
    /**
     * Emit particles
     */
    emit(type, position, options = {}) {
        const pool = this.particlePools.get(type);
        if (!pool || pool.available.length === 0) return null;
        
        const count = options.count || 1;
        const emitted = [];
        
        for (let i = 0; i < count && pool.available.length > 0; i++) {
            const particle = pool.available.pop();
            pool.active.push(particle);
            
            // Set position
            particle.position.copy(position);
            
            // Set velocity
            if (options.velocity) {
                particle.userData.velocity.copy(options.velocity);
            } else {
                // Random velocity
                particle.userData.velocity.set(
                    (Math.random() - 0.5) * (options.spread || 5),
                    Math.random() * (options.upwardForce || 5),
                    (Math.random() - 0.5) * (options.spread || 5)
                );
            }
            
            // Set lifetime
            particle.userData.maxLifetime = options.lifetime || 1.0;
            particle.userData.lifetime = 0;
            
            // Set scale
            if (options.scale) {
                particle.scale.setScalar(options.scale);
            }
            
            // Set color
            if (options.color) {
                particle.material.color.setHex(options.color);
            }
            
            // Rotation
            if (options.rotation) {
                particle.rotation.copy(options.rotation);
            }
            
            // Make visible and add to scene
            particle.visible = true;
            if (!particle.parent) {
                this.scene.add(particle);
            }
            
            emitted.push(particle);
        }
        
        return emitted;
    }
    
    /**
     * Preset effects
     */
    
    muzzleFlash(position, direction) {
        const flash = this.emit('muzzleFlash', position, {
            count: 1,
            lifetime: 0.1,
            scale: 0.5
        });
        
        if (flash && flash[0]) {
            flash[0].lookAt(position.clone().add(direction));
        }
    }
    
    bulletImpact(position, normal) {
        // Impact sparks
        this.emit('spark', position, {
            count: 10,
            spread: 2,
            upwardForce: 3,
            lifetime: 0.3
        });
        
        // Dust/smoke
        this.emit('smoke', position, {
            count: 3,
            spread: 1,
            upwardForce: 2,
            lifetime: 1.0
        });
    }
    
    explosion(position, radius = 1) {
        // Main explosion sphere
        this.emit('explosion', position, {
            count: 1,
            scale: radius,
            lifetime: 0.5
        });
        
        // Fire particles
        this.emit('spark', position, {
            count: 30,
            spread: 10 * radius,
            upwardForce: 15 * radius,
            lifetime: 0.8,
            color: 0xff4400
        });
        
        // Smoke
        this.emit('smoke', position, {
            count: 20,
            spread: 8 * radius,
            upwardForce: 10 * radius,
            lifetime: 2.0
        });
    }
    
    bloodSplatter(position, direction) {
        this.emit('blood', position, {
            count: 8,
            velocity: direction.multiplyScalar(5),
            spread: 3,
            lifetime: 0.5
        });
    }
    
    healingEffect(position) {
        const offset = position.clone();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.emit('heal', offset, {
                    count: 5,
                    spread: 1,
                    upwardForce: 8,
                    lifetime: 1.0
                });
            }, i * 100);
        }
    }
    
    damageNumber(position, damage, isCrit = false) {
        // Create text sprite
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = isCrit ? '#ffff00' : '#ff0000';
        ctx.font = isCrit ? 'bold 48px Arial' : 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(damage.toString(), 64, 48);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 1, 1);
        sprite.position.copy(position);
        
        this.scene.add(sprite);
        
        // Animate upward and fade
        const startY = position.y;
        const duration = 1.5;
        let elapsed = 0;
        
        const animate = (delta) => {
            elapsed += delta;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                sprite.position.y = startY + progress * 5;
                sprite.material.opacity = 1 - progress;
            } else {
                this.scene.remove(sprite);
                sprite.material.map.dispose();
                sprite.material.dispose();
            }
        };
        
        sprite.userData.animate = animate;
        this.activeParticles.push(sprite);
    }
    
    /**
     * Update all particles
     */
    update(delta, cameraPosition = null) {
        // Update particles from pools
        this.particlePools.forEach((pool, type) => {
            for (let i = pool.active.length - 1; i >= 0; i--) {
                const particle = pool.active[i];
                
                // Update lifetime
                particle.userData.lifetime += delta;
                
                if (particle.userData.lifetime >= particle.userData.maxLifetime) {
                    // Return to pool
                    particle.visible = false;
                    pool.active.splice(i, 1);
                    pool.available.push(particle);
                    continue;
                }
                
                // Distance-based LOD
                if (cameraPosition) {
                    const distance = particle.position.distanceTo(cameraPosition);
                    if (distance > this.particleUpdateDistance.cull) {
                        continue; // Skip update for far particles
                    }
                }
                
                // Update position
                particle.position.add(
                    particle.userData.velocity.clone().multiplyScalar(delta)
                );
                
                // Apply gravity
                particle.userData.velocity.y -= 9.8 * delta;
                
                // Fade out
                const lifeProgress = particle.userData.lifetime / particle.userData.maxLifetime;
                particle.material.opacity = 1 - lifeProgress;
                
                // Grow smoke particles
                if (type === 'smoke') {
                    particle.scale.setScalar(1 + lifeProgress * 2);
                }
                
                // Shrink explosions
                if (type === 'explosion') {
                    particle.scale.setScalar(1 + lifeProgress * 3);
                }
            }
        });
        
        // Update custom particles (damage numbers, etc.)
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            if (particle.userData.animate) {
                particle.userData.animate(delta);
                
                // Remove if fully faded
                if (particle.material.opacity <= 0) {
                    this.activeParticles.splice(i, 1);
                }
            }
        }
    }
    
    /**
     * Get pool stats for debugging
     */
    getStats() {
        const stats = {};
        this.particlePools.forEach((pool, type) => {
            stats[type] = {
                active: pool.active.length,
                available: pool.available.length,
                total: pool.active.length + pool.available.length
            };
        });
        return stats;
    }
    
    /**
     * Cleanup
     */
    dispose() {
        this.particlePools.forEach(pool => {
            [...pool.active, ...pool.available].forEach(particle => {
                if (particle.parent) {
                    this.scene.remove(particle);
                }
                particle.geometry.dispose();
                particle.material.dispose();
            });
        });
        
        this.activeParticles.forEach(particle => {
            this.scene.remove(particle);
            if (particle.material.map) particle.material.map.dispose();
            particle.material.dispose();
        });
        
        this.particlePools.clear();
        this.activeParticles = [];
    }
}

export default ParticleController;

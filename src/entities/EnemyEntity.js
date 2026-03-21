import * as THREE from 'three';
import { AnimState, getClipFallbackChain } from '../player/ClassAnimationRegistry.js';

/**
 * AI States for enemies
 */
export const EnemyState = {
    IDLE: 'idle',
    PATROL: 'patrol',
    CHASE: 'chase',
    ATTACK: 'attack',
    FLEE: 'flee',
    STUNNED: 'stunned',
    DEATH: 'death'
};

/** Map EnemyState → AnimState so the AI drives animations automatically */
const STATE_TO_ANIM = {
    [EnemyState.IDLE]:    AnimState.IDLE,
    [EnemyState.PATROL]:  AnimState.WALK,
    [EnemyState.CHASE]:   AnimState.RUN,
    [EnemyState.ATTACK]:  AnimState.ATTACK_1,  // overridden per-attack
    [EnemyState.FLEE]:    AnimState.RUN,
    [EnemyState.STUNNED]: AnimState.STUNNED,
    [EnemyState.DEATH]:   AnimState.DEATH,
};

/**
 * Enemy types
 */
export const EnemyType = {
    MINION: 'minion',       // Basic enemy
    ELITE: 'elite',         // Stronger variant
    BOSS: 'boss',           // World boss
    RANGED: 'ranged',       // Ranged attacker
    HEALER: 'healer'        // Heals other enemies
};

/**
 * EnemyEntity - Base class for all enemies
 */
export class EnemyEntity {
    constructor(config = {}) {
        // Identity
        this.id = config.id || `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = config.name || 'Enemy';
        this.type = config.type || EnemyType.MINION;
        this.level = config.level || 1;
        
        // Stats
        this.maxHealth = config.maxHealth || 100 + (this.level * 20);
        this.health = this.maxHealth;
        this.damage = config.damage || 10 + (this.level * 2);
        this.defense = config.defense || 5 + this.level;
        this.attackSpeed = config.attackSpeed || 1.0; // attacks per second
        this.moveSpeed = config.moveSpeed || 3.0;
        
        // Combat ranges
        this.attackRange = config.attackRange || 2.5;
        this.aggroRange = config.aggroRange || 15;
        this.leashRange = config.leashRange || 30; // Max distance from spawn
        
        // AI State
        this.state = EnemyState.IDLE;
        this.previousState = null;
        this.stateTime = 0;
        this.target = null;
        
        // Position and movement
        this.position = new THREE.Vector3();
        this.rotation = 0;
        this.velocity = new THREE.Vector3();
        this.spawnPosition = new THREE.Vector3();
        
        // Patrol
        this.patrolPoints = config.patrolPoints || [];
        this.currentPatrolIndex = 0;
        this.patrolWaitTime = 2.0;
        this.patrolTimer = 0;
        
        // Combat
        this.attackCooldown = 0;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.attackAnimDuration = 0.5;
        
        // Visual
        this.mesh = null;
        this.healthBar = null;
        this.scale = config.scale || 1.0;
        
        // Animation system
        this.mixer = null;
        this.actions = new Map();        // clipName → THREE.AnimationAction
        this.currentAction = null;
        this.animSetKey = config.animSet || 'unarmed';  // ClassAnimationRegistry set key
        this.crossFadeDuration = 0.2;
        this.attackComboIndex = 0;       // cycles attack_1 → attack_2 → attack_3
        
        // Callbacks
        this.onDeath = config.onDeath || null;
        this.onDamage = config.onDamage || null;
        this.onAttack = config.onAttack || null;
        
        // Loot
        this.lootTable = config.lootTable || [];
        this.expReward = config.expReward || this.level * 10;
        
        console.log(`👹 Enemy created: ${this.name} (Level ${this.level})`);
    }
    
    /**
     * Set the 3D mesh for this enemy
     */
    setMesh(mesh) {
        this.mesh = mesh;
        this.mesh.userData.entityId = this.id;
        this.mesh.userData.entityType = 'enemy';
        this.mesh.userData.entity = this;
        this.mesh.scale.setScalar(this.scale);
        
        // Create health bar
        this.createHealthBar();
    }
    
    /**
     * Initialize the animation system after the model + shared clips are ready.
     * @param {THREE.AnimationMixer} mixer  – created by AnimatedNPCSystem
     * @param {Map<string, THREE.AnimationAction>} actions – clipName → action
     * @param {string} animSetKey – key into ClassAnimationRegistry.ANIMATION_SETS
     */
    initAnimations(mixer, actions, animSetKey) {
        this.mixer = mixer;
        this.actions = actions;
        this.animSetKey = animSetKey || this.animSetKey;
        
        // Start idle animation
        this.playAnimState(AnimState.IDLE);
    }
    
    /**
     * Play an animation state using the ClassAnimationRegistry fallback chain.
     * @param {string} animState – one of AnimState.*
     * @param {object} opts – { loop, clamp, speed }
     */
    playAnimState(animState, opts = {}) {
        if (!this.mixer) return false;
        
        const chain = getClipFallbackChain(this.animSetKey, animState);
        let action = null;
        
        for (const clipName of chain) {
            if (this.actions.has(clipName)) {
                action = this.actions.get(clipName);
                break;
            }
        }
        
        if (!action) return false;
        if (this.currentAction === action && action.isRunning()) return true;
        
        // Crossfade
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(this.crossFadeDuration);
        }
        
        action.reset();
        action.setEffectiveWeight(1);
        action.setEffectiveTimeScale(opts.speed || 1);
        
        if (opts.loop === false || opts.clamp) {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        } else {
            action.setLoop(THREE.LoopRepeat);
        }
        
        action.fadeIn(this.crossFadeDuration);
        action.play();
        this.currentAction = action;
        return true;
    }
    
    /**
     * Create floating health bar
     */
    createHealthBar() {
        const barWidth = 2;
        const barHeight = 0.2;
        
        // Background
        const bgGeom = new THREE.PlaneGeometry(barWidth, barHeight);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
        const bg = new THREE.Mesh(bgGeom, bgMat);
        
        // Health fill
        const fillGeom = new THREE.PlaneGeometry(barWidth * 0.98, barHeight * 0.8);
        const fillMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        this.healthBarFill = new THREE.Mesh(fillGeom, fillMat);
        this.healthBarFill.position.z = 0.01;
        
        // Container
        this.healthBar = new THREE.Group();
        this.healthBar.add(bg);
        this.healthBar.add(this.healthBarFill);
        this.healthBar.position.y = 3;
        
        if (this.mesh) {
            this.mesh.add(this.healthBar);
        }
    }
    
    /**
     * Update health bar display
     */
    updateHealthBar() {
        if (!this.healthBarFill) return;
        
        const healthPercent = this.health / this.maxHealth;
        this.healthBarFill.scale.x = Math.max(0.01, healthPercent);
        this.healthBarFill.position.x = -(1 - healthPercent);
        
        // Color based on health
        if (healthPercent > 0.5) {
            this.healthBarFill.material.color.setHex(0x00ff00);
        } else if (healthPercent > 0.25) {
            this.healthBarFill.material.color.setHex(0xffff00);
        } else {
            this.healthBarFill.material.color.setHex(0xff0000);
        }
    }
    
    /**
     * Set spawn position
     */
    setSpawnPosition(x, y, z) {
        this.spawnPosition.set(x, y, z);
        this.position.copy(this.spawnPosition);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount, attacker = null) {
        if (this.state === EnemyState.DEATH) return 0;
        
        // Apply defense reduction
        const actualDamage = Math.max(1, amount - this.defense * 0.5);
        this.health = Math.max(0, this.health - actualDamage);
        
        this.updateHealthBar();
        
        // Play hit reaction animation (brief, then resume)
        if (this.mixer && this.state !== EnemyState.ATTACK) {
            this.playAnimState(AnimState.HIT, { loop: false, speed: 1.5 });
            // Return to current state animation after hit
            setTimeout(() => {
                if (this.state !== EnemyState.DEATH) {
                    const stateAnim = STATE_TO_ANIM[this.state] || AnimState.IDLE;
                    this.playAnimState(stateAnim);
                }
            }, 400);
        }
        
        // Aggro on attacker
        if (attacker && this.state !== EnemyState.ATTACK) {
            this.target = attacker;
            this.changeState(EnemyState.CHASE);
        }
        
        // Damage callback
        if (this.onDamage) {
            this.onDamage({
                enemy: this,
                damage: actualDamage,
                attacker: attacker,
                remainingHealth: this.health
            });
        }
        
        // Check death
        if (this.health <= 0) {
            this.die();
        }
        
        return actualDamage;
    }
    
    /**
     * Heal
     */
    heal(amount) {
        if (this.state === EnemyState.DEATH) return 0;
        
        const actualHeal = Math.min(amount, this.maxHealth - this.health);
        this.health += actualHeal;
        this.updateHealthBar();
        
        return actualHeal;
    }
    
    /**
     * Perform attack
     */
    performAttack() {
        if (this.attackCooldown > 0 || !this.target) return false;
        
        this.isAttacking = true;
        this.attackCooldown = 1.0 / this.attackSpeed;
        
        // Cycle through attack animations (attack_1 → attack_2 → attack_3)
        const attackAnims = [AnimState.ATTACK_1, AnimState.ATTACK_2, AnimState.ATTACK_3];
        const attackAnim = attackAnims[this.attackComboIndex % attackAnims.length];
        this.attackComboIndex++;
        this.playAnimState(attackAnim, { loop: false });
        
        // Calculate damage
        const damage = this.damage * (0.9 + Math.random() * 0.2); // 90-110% variance
        
        // Attack callback
        if (this.onAttack) {
            this.onAttack({
                enemy: this,
                target: this.target,
                damage: damage,
                position: this.position.clone()
            });
        }
        
        // Reset attack animation after duration, return to idle/chase
        setTimeout(() => {
            this.isAttacking = false;
            if (this.state !== EnemyState.DEATH) {
                const stateAnim = STATE_TO_ANIM[this.state] || AnimState.IDLE;
                this.playAnimState(stateAnim);
            }
        }, this.attackAnimDuration * 1000);
        
        return true;
    }
    
    /**
     * Die
     */
    die() {
        this.changeState(EnemyState.DEATH);
        this.health = 0;
        
        // Play death animation (clamped at end)
        this.playAnimState(AnimState.DEATH, { loop: false, clamp: true });
        
        // Death callback
        if (this.onDeath) {
            this.onDeath({
                enemy: this,
                position: this.position.clone(),
                loot: this.generateLoot(),
                expReward: this.expReward
            });
        }
        
        console.log(`💀 ${this.name} died!`);
    }
    
    /**
     * Generate loot on death
     */
    generateLoot() {
        const loot = [];
        for (const item of this.lootTable) {
            if (Math.random() < (item.dropChance || 0.1)) {
                loot.push({ ...item });
            }
        }
        return loot;
    }
    
    /**
     * Change AI state
     */
    changeState(newState) {
        if (this.state === newState) return;
        
        this.previousState = this.state;
        this.state = newState;
        this.stateTime = 0;
        
        // Auto-play animation for the new state
        const animState = STATE_TO_ANIM[newState];
        if (animState && newState !== EnemyState.ATTACK) {
            // Attack animations are handled in performAttack()
            const isOneShot = (newState === EnemyState.DEATH || newState === EnemyState.STUNNED);
            this.playAnimState(animState, {
                loop: !isOneShot,
                clamp: newState === EnemyState.DEATH,
            });
        }
    }
    
    /**
     * Get distance to target
     */
    distanceToTarget() {
        if (!this.target || !this.target.position) return Infinity;
        return this.position.distanceTo(this.target.position);
    }
    
    /**
     * Get distance to spawn
     */
    distanceToSpawn() {
        return this.position.distanceTo(this.spawnPosition);
    }
    
    /**
     * Look at target
     */
    lookAtTarget() {
        if (!this.target || !this.target.position) return;
        
        const direction = new THREE.Vector3()
            .subVectors(this.target.position, this.position)
            .normalize();
        
        this.rotation = Math.atan2(direction.x, direction.z);
        
        if (this.mesh) {
            this.mesh.rotation.y = this.rotation;
        }
    }
    
    /**
     * Move towards position
     */
    moveTowards(targetPos, deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(targetPos, this.position)
            .normalize();
        
        const movement = direction.multiplyScalar(this.moveSpeed * deltaTime);
        this.position.add(movement);
        
        // Update rotation
        this.rotation = Math.atan2(direction.x, direction.z);
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = this.rotation;
        }
    }
    
    /**
     * Update AI behavior
     */
    update(deltaTime, playerPosition = null) {
        // Always update animation mixer (even during death for death anim)
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        if (this.state === EnemyState.DEATH) return;
        
        this.stateTime += deltaTime;
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Make health bar face camera (billboard)
        if (this.healthBar) {
            this.healthBar.lookAt(
                this.position.x,
                this.position.y + 10,
                this.position.z + 10
            );
        }
        
        // AI State machine
        switch (this.state) {
            case EnemyState.IDLE:
                this.updateIdle(deltaTime, playerPosition);
                break;
            case EnemyState.PATROL:
                this.updatePatrol(deltaTime, playerPosition);
                break;
            case EnemyState.CHASE:
                this.updateChase(deltaTime);
                break;
            case EnemyState.ATTACK:
                this.updateAttack(deltaTime);
                break;
            case EnemyState.FLEE:
                this.updateFlee(deltaTime);
                break;
            case EnemyState.STUNNED:
                this.updateStunned(deltaTime);
                break;
        }
    }
    
    /**
     * Idle state - check for targets
     */
    updateIdle(deltaTime, playerPosition) {
        // Check for player in aggro range
        if (playerPosition) {
            const distToPlayer = this.position.distanceTo(playerPosition);
            if (distToPlayer <= this.aggroRange) {
                this.target = { position: playerPosition };
                this.changeState(EnemyState.CHASE);
                return;
            }
        }
        
        // Start patrolling if we have patrol points
        if (this.patrolPoints.length > 0 && this.stateTime > 2) {
            this.changeState(EnemyState.PATROL);
        }
    }
    
    /**
     * Patrol state - move between patrol points
     */
    updatePatrol(deltaTime, playerPosition) {
        // Check for player
        if (playerPosition) {
            const distToPlayer = this.position.distanceTo(playerPosition);
            if (distToPlayer <= this.aggroRange) {
                this.target = { position: playerPosition };
                this.changeState(EnemyState.CHASE);
                return;
            }
        }
        
        if (this.patrolPoints.length === 0) {
            this.changeState(EnemyState.IDLE);
            return;
        }
        
        const currentPoint = this.patrolPoints[this.currentPatrolIndex];
        const distToPoint = this.position.distanceTo(currentPoint);
        
        if (distToPoint < 1) {
            // Reached patrol point, wait
            this.patrolTimer += deltaTime;
            if (this.patrolTimer >= this.patrolWaitTime) {
                this.patrolTimer = 0;
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            }
        } else {
            // Move to patrol point
            this.moveTowards(currentPoint, deltaTime);
        }
    }
    
    /**
     * Chase state - pursue target
     */
    updateChase(deltaTime) {
        if (!this.target || !this.target.position) {
            this.changeState(EnemyState.IDLE);
            return;
        }
        
        const distToTarget = this.distanceToTarget();
        const distToSpawn = this.distanceToSpawn();
        
        // Leash check - return to spawn if too far
        if (distToSpawn > this.leashRange) {
            this.target = null;
            this.health = this.maxHealth; // Reset health on leash
            this.updateHealthBar();
            this.changeState(EnemyState.IDLE);
            this.moveTowards(this.spawnPosition, deltaTime);
            return;
        }
        
        // In attack range
        if (distToTarget <= this.attackRange) {
            this.changeState(EnemyState.ATTACK);
            return;
        }
        
        // Chase
        this.moveTowards(this.target.position, deltaTime);
        this.lookAtTarget();
    }
    
    /**
     * Attack state - attack the target
     */
    updateAttack(deltaTime) {
        if (!this.target || !this.target.position) {
            this.changeState(EnemyState.IDLE);
            return;
        }
        
        const distToTarget = this.distanceToTarget();
        
        // Target moved out of range
        if (distToTarget > this.attackRange * 1.2) {
            this.changeState(EnemyState.CHASE);
            return;
        }
        
        // Face target
        this.lookAtTarget();
        
        // Attack if cooldown ready
        if (this.attackCooldown <= 0) {
            this.performAttack();
        }
    }
    
    /**
     * Flee state - run away
     */
    updateFlee(deltaTime) {
        if (!this.target || !this.target.position) {
            this.changeState(EnemyState.IDLE);
            return;
        }
        
        // Run away from target
        const direction = new THREE.Vector3()
            .subVectors(this.position, this.target.position)
            .normalize();
        
        const fleePos = this.position.clone().add(direction.multiplyScalar(10));
        this.moveTowards(fleePos, deltaTime);
        
        // Stop fleeing after some time
        if (this.stateTime > 5) {
            this.changeState(EnemyState.IDLE);
        }
    }
    
    /**
     * Stunned state - can't move or attack
     */
    updateStunned(deltaTime) {
        // Do nothing while stunned
        if (this.stateTime > 2) { // 2 second stun
            this.changeState(this.previousState || EnemyState.IDLE);
        }
    }
    
    /**
     * Dispose
     */
    dispose() {
        // Stop mixer
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }
        this.actions.clear();
        this.currentAction = null;
        
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            // For GLB models, traverse and dispose all geometries/materials
            this.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
    }
}

export default EnemyEntity;

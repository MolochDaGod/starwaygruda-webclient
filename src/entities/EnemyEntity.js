import * as THREE from 'three';

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
        
        // Reset attack animation after duration
        setTimeout(() => {
            this.isAttacking = false;
        }, this.attackAnimDuration * 1000);
        
        return true;
    }
    
    /**
     * Die
     */
    die() {
        this.changeState(EnemyState.DEATH);
        this.health = 0;
        
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
        
        console.log(`[${this.name}] State: ${this.previousState} -> ${newState}`);
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
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(m => m.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
    }
}

export default EnemyEntity;

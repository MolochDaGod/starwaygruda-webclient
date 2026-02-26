import * as THREE from 'three';
import { EnemyState } from '../entities/EnemyEntity.js';

/**
 * Damage types
 */
export const DamageType = {
    PHYSICAL: 'physical',
    FIRE: 'fire',
    ICE: 'ice',
    LIGHTNING: 'lightning',
    HOLY: 'holy',
    SHADOW: 'shadow'
};

/**
 * Attack shapes
 */
export const AttackShape = {
    SINGLE: 'single',      // Single target
    CONE: 'cone',          // Frontal cone
    AOE: 'aoe',            // Circle around origin
    LINE: 'line',          // Line/beam
    PROJECTILE: 'projectile'
};

/**
 * CombatSystem - Handles all combat interactions
 */
export class CombatSystem {
    constructor(config = {}) {
        // References
        this.enemyManager = config.enemyManager || null;
        this.player = config.player || null;
        
        // Combat log
        this.combatLog = [];
        this.maxLogEntries = config.maxLogEntries || 100;
        
        // Damage numbers (floating combat text)
        this.damageNumbers = [];
        
        // Stats tracking
        this.stats = {
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0,
            criticalHits: 0,
            misses: 0,
            kills: 0,
            deaths: 0
        };
        
        // Combat settings
        this.critChance = config.critChance || 0.1;      // 10% base crit
        this.critMultiplier = config.critMultiplier || 2.0;
        this.missChance = config.missChance || 0.05;     // 5% miss chance
        this.blockChance = config.blockChance || 0;      // From gear
        
        // Callbacks
        this.onDamageDealt = config.onDamageDealt || null;
        this.onDamageTaken = config.onDamageTaken || null;
        this.onKill = config.onKill || null;
        this.onDeath = config.onDeath || null;
        
        console.log('⚔️ CombatSystem initialized');
    }
    
    /**
     * Set enemy manager reference
     */
    setEnemyManager(enemyManager) {
        this.enemyManager = enemyManager;
    }
    
    /**
     * Set player reference
     */
    setPlayer(player) {
        this.player = player;
    }
    
    /**
     * Calculate damage with modifiers
     */
    calculateDamage(baseDamage, attacker, defender, damageType = DamageType.PHYSICAL) {
        let damage = baseDamage;
        
        // Apply attacker's damage bonus (if any)
        if (attacker.damageBonus) {
            damage *= (1 + attacker.damageBonus);
        }
        
        // Check for miss
        const missRoll = Math.random();
        if (missRoll < this.missChance) {
            return { damage: 0, isMiss: true, isCrit: false, isBlocked: false };
        }
        
        // Check for block (if defender has defense)
        if (defender.defense) {
            const effectiveBlockChance = Math.min(0.5, defender.defense / 200);
            if (Math.random() < effectiveBlockChance) {
                damage *= 0.5; // 50% damage reduction on block
                return { damage: Math.floor(damage), isMiss: false, isCrit: false, isBlocked: true };
            }
        }
        
        // Check for crit
        let critChance = this.critChance;
        if (attacker.critChance) {
            critChance += attacker.critChance;
        }
        
        const isCrit = Math.random() < critChance;
        if (isCrit) {
            let multiplier = this.critMultiplier;
            if (attacker.critMultiplier) {
                multiplier = attacker.critMultiplier;
            }
            damage *= multiplier;
        }
        
        // Apply defense reduction
        if (defender.defense) {
            const damageReduction = defender.defense / (defender.defense + 100);
            damage *= (1 - damageReduction);
        }
        
        // Apply damage type resistances (if defender has them)
        if (defender.resistances && defender.resistances[damageType]) {
            damage *= (1 - defender.resistances[damageType]);
        }
        
        // Minimum damage of 1
        damage = Math.max(1, Math.floor(damage));
        
        return { damage, isMiss: false, isCrit, isBlocked: false };
    }
    
    /**
     * Process a player attack on enemies
     */
    playerAttack(attackConfig) {
        if (!this.enemyManager || !this.player) return [];
        
        const {
            damage = 10,
            range = 3,
            shape = AttackShape.SINGLE,
            angle = Math.PI / 2,
            direction = 0,
            position = null,
            damageType = DamageType.PHYSICAL
        } = attackConfig;
        
        const attackOrigin = position || (this.player.position ? this.player.position.clone() : new THREE.Vector3());
        const results = [];
        
        // Get enemies in range
        const nearbyEnemies = this.enemyManager.getEnemiesInRange(attackOrigin, range * 2);
        
        for (const { enemy, distance } of nearbyEnemies) {
            // Skip dead enemies
            if (enemy.state === EnemyState.DEATH) continue;
            
            // Check if enemy is hit based on attack shape
            const isHit = this.checkAttackHit(
                shape, attackOrigin, direction, angle, range, enemy.position
            );
            
            if (isHit) {
                // Calculate and apply damage
                const damageResult = this.calculateDamage(damage, this.player, enemy, damageType);
                
                if (damageResult.damage > 0) {
                    const actualDamage = enemy.takeDamage(damageResult.damage, this.player);
                    
                    // Track stats
                    this.stats.damageDealt += actualDamage;
                    if (damageResult.isCrit) this.stats.criticalHits++;
                    if (enemy.state === EnemyState.DEATH) this.stats.kills++;
                    
                    results.push({
                        enemy,
                        damage: actualDamage,
                        isCrit: damageResult.isCrit,
                        isBlocked: damageResult.isBlocked,
                        killed: enemy.state === EnemyState.DEATH
                    });
                    
                    // Add damage number
                    this.addDamageNumber(enemy.position.clone(), actualDamage, damageResult.isCrit);
                    
                    // Log
                    this.addCombatLog(`Player dealt ${actualDamage}${damageResult.isCrit ? ' CRIT' : ''} to ${enemy.name}`);
                    
                    // Callback
                    if (this.onDamageDealt) {
                        this.onDamageDealt({
                            attacker: this.player,
                            defender: enemy,
                            damage: actualDamage,
                            isCrit: damageResult.isCrit,
                            damageType
                        });
                    }
                    
                    // Kill callback
                    if (enemy.state === EnemyState.DEATH && this.onKill) {
                        this.onKill({
                            killer: this.player,
                            victim: enemy,
                            loot: enemy.dropLoot(),
                            exp: enemy.expReward
                        });
                    }
                } else if (damageResult.isMiss) {
                    this.stats.misses++;
                    this.addDamageNumber(enemy.position.clone(), 'MISS', false, true);
                    this.addCombatLog(`Player missed ${enemy.name}`);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Process an enemy attack on the player
     */
    enemyAttack(enemy, attackConfig = {}) {
        if (!this.player) return null;
        
        const {
            damage = enemy.damage || 10,
            damageType = DamageType.PHYSICAL
        } = attackConfig;
        
        // Check if player is in range
        if (!this.player.position) return null;
        
        const distance = enemy.position.distanceTo(this.player.position);
        if (distance > enemy.attackRange * 1.5) return null;
        
        // Calculate damage
        const damageResult = this.calculateDamage(damage, enemy, this.player, damageType);
        
        if (damageResult.damage > 0) {
            // Apply damage to player
            let actualDamage = damageResult.damage;
            
            if (this.player.takeDamage) {
                actualDamage = this.player.takeDamage(damageResult.damage, enemy);
            } else if (this.player.health !== undefined) {
                this.player.health = Math.max(0, this.player.health - damageResult.damage);
                actualDamage = damageResult.damage;
            }
            
            // Track stats
            this.stats.damageTaken += actualDamage;
            
            // Add damage number above player
            if (this.player.position) {
                this.addDamageNumber(
                    this.player.position.clone().add(new THREE.Vector3(0, 2, 0)),
                    actualDamage,
                    damageResult.isCrit,
                    false,
                    true // isPlayerDamage
                );
            }
            
            // Log
            this.addCombatLog(`${enemy.name} dealt ${actualDamage}${damageResult.isCrit ? ' CRIT' : ''} to Player`);
            
            // Callback
            if (this.onDamageTaken) {
                this.onDamageTaken({
                    attacker: enemy,
                    defender: this.player,
                    damage: actualDamage,
                    isCrit: damageResult.isCrit,
                    damageType
                });
            }
            
            // Check player death
            if (this.player.health !== undefined && this.player.health <= 0) {
                this.stats.deaths++;
                if (this.onDeath) {
                    this.onDeath({
                        killer: enemy,
                        victim: this.player
                    });
                }
            }
            
            return {
                damage: actualDamage,
                isCrit: damageResult.isCrit,
                isBlocked: damageResult.isBlocked
            };
        } else if (damageResult.isMiss) {
            this.addCombatLog(`${enemy.name} missed Player`);
            return { damage: 0, isMiss: true };
        }
        
        return null;
    }
    
    /**
     * Check if an attack hits a target position
     */
    checkAttackHit(shape, origin, direction, angle, range, targetPos) {
        const toTarget = new THREE.Vector3().subVectors(targetPos, origin);
        toTarget.y = 0; // Ignore Y for 2D calculations
        const distance = toTarget.length();
        
        // Out of range
        if (distance > range) return false;
        
        switch (shape) {
            case AttackShape.SINGLE:
                return distance <= range;
                
            case AttackShape.CONE:
                // Check if target is within cone angle
                const targetAngle = Math.atan2(toTarget.x, toTarget.z);
                let angleDiff = targetAngle - direction;
                // Normalize angle difference
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                return Math.abs(angleDiff) <= angle / 2;
                
            case AttackShape.AOE:
                return distance <= range;
                
            case AttackShape.LINE:
                // Check if target is close to the line
                const lineDir = new THREE.Vector3(Math.sin(direction), 0, Math.cos(direction));
                const perpDist = Math.abs(toTarget.dot(new THREE.Vector3(-lineDir.z, 0, lineDir.x)));
                const lineWidth = 1; // Line width
                return perpDist <= lineWidth && distance <= range;
                
            default:
                return distance <= range;
        }
    }
    
    /**
     * Process special attack from boss
     */
    processBossSpecialAttack(boss, attackData) {
        if (!this.player || !this.player.position) return [];
        
        const results = [];
        const playerPos = this.player.position.clone();
        
        switch (attackData.type) {
            case 'cone':
            case 'breath':
                if (this.checkAttackHit(
                    AttackShape.CONE,
                    attackData.origin,
                    attackData.direction,
                    attackData.angle,
                    attackData.range,
                    playerPos
                )) {
                    const result = this.enemyAttack(boss, { damage: attackData.damage });
                    if (result) results.push({ target: 'player', ...result });
                }
                break;
                
            case 'aoe':
                if (this.checkAttackHit(
                    AttackShape.AOE,
                    attackData.origin,
                    0,
                    0,
                    attackData.range,
                    playerPos
                )) {
                    const result = this.enemyAttack(boss, { damage: attackData.damage });
                    if (result) results.push({ target: 'player', ...result });
                }
                break;
                
            case 'charge':
                // Line from start to end
                const chargeDir = Math.atan2(
                    attackData.endPos.x - attackData.startPos.x,
                    attackData.endPos.z - attackData.startPos.z
                );
                const chargeRange = attackData.startPos.distanceTo(attackData.endPos);
                if (this.checkAttackHit(
                    AttackShape.LINE,
                    attackData.startPos,
                    chargeDir,
                    0,
                    chargeRange,
                    playerPos
                )) {
                    const result = this.enemyAttack(boss, { damage: attackData.damage });
                    if (result) results.push({ target: 'player', ...result });
                }
                break;
                
            case 'projectile':
                // Will be handled by projectile system
                break;
        }
        
        return results;
    }
    
    /**
     * Add floating damage number
     */
    addDamageNumber(position, value, isCrit = false, isMiss = false, isPlayerDamage = false) {
        this.damageNumbers.push({
            position: position.clone(),
            value: value,
            isCrit,
            isMiss,
            isPlayerDamage,
            lifetime: 0,
            maxLifetime: 1.5
        });
    }
    
    /**
     * Update damage numbers
     */
    updateDamageNumbers(deltaTime) {
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const num = this.damageNumbers[i];
            num.lifetime += deltaTime;
            num.position.y += deltaTime * 2; // Float upward
            
            if (num.lifetime >= num.maxLifetime) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    /**
     * Get active damage numbers for rendering
     */
    getDamageNumbers() {
        return this.damageNumbers.map(num => ({
            ...num,
            alpha: 1 - (num.lifetime / num.maxLifetime)
        }));
    }
    
    /**
     * Add entry to combat log
     */
    addCombatLog(message) {
        const entry = {
            time: Date.now(),
            message
        };
        
        this.combatLog.push(entry);
        
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.shift();
        }
        
        console.log(`⚔️ ${message}`);
    }
    
    /**
     * Get recent combat log entries
     */
    getCombatLog(count = 10) {
        return this.combatLog.slice(-count);
    }
    
    /**
     * Update combat system
     */
    update(deltaTime) {
        this.updateDamageNumbers(deltaTime);
    }
    
    /**
     * Get combat stats
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Reset stats
     */
    resetStats() {
        this.stats = {
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0,
            criticalHits: 0,
            misses: 0,
            kills: 0,
            deaths: 0
        };
    }
}

export default CombatSystem;

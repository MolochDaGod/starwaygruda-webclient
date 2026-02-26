import * as THREE from 'three';
import { EnemyEntity, EnemyState, EnemyType } from './EnemyEntity.js';

/**
 * Boss phases
 */
export const BossPhase = {
    PHASE_1: 1,
    PHASE_2: 2,
    PHASE_3: 3,
    ENRAGED: 4
};

/**
 * Special attack types
 */
export const SpecialAttack = {
    CLEAVE: 'cleave',           // Wide frontal cone
    GROUND_SLAM: 'ground_slam', // AoE around boss
    CHARGE: 'charge',           // Rush at target
    SUMMON: 'summon',           // Spawn adds
    BREATH: 'breath',           // Cone breath attack
    PROJECTILE: 'projectile'    // Ranged attack
};

/**
 * WorldBoss - Epic boss encounters with phases and special mechanics
 */
export class WorldBoss extends EnemyEntity {
    constructor(config = {}) {
        // Apply boss-specific defaults
        const bossConfig = {
            ...config,
            type: EnemyType.BOSS,
            maxHealth: config.maxHealth || 5000 + (config.level || 1) * 500,
            damage: config.damage || 50 + (config.level || 1) * 5,
            defense: config.defense || 20 + (config.level || 1) * 2,
            attackSpeed: config.attackSpeed || 0.8,
            moveSpeed: config.moveSpeed || 2.5,
            attackRange: config.attackRange || 4,
            aggroRange: config.aggroRange || 30,
            leashRange: config.leashRange || 50,
            scale: config.scale || 2.0
        };
        
        super(bossConfig);
        
        // Boss-specific properties
        this.phase = BossPhase.PHASE_1;
        this.phaseThresholds = config.phaseThresholds || {
            [BossPhase.PHASE_2]: 0.7,  // 70% health
            [BossPhase.PHASE_3]: 0.4,  // 40% health
            [BossPhase.ENRAGED]: 0.15  // 15% health - enrage
        };
        
        // Special attacks
        this.specialAttacks = config.specialAttacks || [
            { type: SpecialAttack.CLEAVE, cooldown: 8, damage: 1.5 },
            { type: SpecialAttack.GROUND_SLAM, cooldown: 15, damage: 2.0, range: 8 },
            { type: SpecialAttack.SUMMON, cooldown: 30, count: 3 }
        ];
        this.specialCooldowns = {};
        this.specialAttacks.forEach(atk => {
            this.specialCooldowns[atk.type] = 0;
        });
        
        // Enrage
        this.isEnraged = false;
        this.enrageMultiplier = config.enrageMultiplier || 1.5;
        this.enrageTimer = 0;
        this.softEnrageTime = config.softEnrageTime || 300; // 5 minutes
        
        // Summoned adds
        this.summonedAdds = [];
        this.maxAdds = config.maxAdds || 5;
        
        // Boss mechanics
        this.mechanicTimer = 0;
        this.mechanicInterval = 10; // Check mechanics every 10 seconds
        
        // Loot
        this.lootTable = config.lootTable || [
            { id: 'epic_weapon', name: 'Epic Weapon', dropChance: 0.3 },
            { id: 'boss_trophy', name: 'Boss Trophy', dropChance: 1.0 },
            { id: 'rare_material', name: 'Rare Material', dropChance: 0.5 }
        ];
        this.expReward = config.expReward || this.level * 500;
        
        // Callbacks
        this.onPhaseChange = config.onPhaseChange || null;
        this.onSpecialAttack = config.onSpecialAttack || null;
        this.onSummonAdds = config.onSummonAdds || null;
        
        console.log(`👑 World Boss created: ${this.name} (Level ${this.level}, HP: ${this.maxHealth})`);
    }
    
    /**
     * Override takeDamage to check phase transitions
     */
    takeDamage(amount, attacker = null) {
        const actualDamage = super.takeDamage(amount, attacker);
        
        if (this.state !== EnemyState.DEATH) {
            this.checkPhaseTransition();
        }
        
        return actualDamage;
    }
    
    /**
     * Check and handle phase transitions
     */
    checkPhaseTransition() {
        const healthPercent = this.health / this.maxHealth;
        
        // Check each phase threshold
        for (const [phase, threshold] of Object.entries(this.phaseThresholds)) {
            const phaseNum = parseInt(phase);
            if (healthPercent <= threshold && this.phase < phaseNum) {
                this.transitionToPhase(phaseNum);
                break;
            }
        }
    }
    
    /**
     * Transition to a new phase
     */
    transitionToPhase(newPhase) {
        const oldPhase = this.phase;
        this.phase = newPhase;
        
        console.log(`👑 [${this.name}] Phase transition: ${oldPhase} -> ${newPhase}`);
        
        // Apply phase-specific buffs
        switch (newPhase) {
            case BossPhase.PHASE_2:
                this.attackSpeed *= 1.2;
                break;
            case BossPhase.PHASE_3:
                this.damage *= 1.3;
                this.moveSpeed *= 1.2;
                break;
            case BossPhase.ENRAGED:
                this.triggerEnrage();
                break;
        }
        
        // Phase change callback
        if (this.onPhaseChange) {
            this.onPhaseChange({
                boss: this,
                oldPhase: oldPhase,
                newPhase: newPhase,
                healthPercent: this.health / this.maxHealth
            });
        }
        
        // Often bosses do a special attack on phase change
        this.useRandomSpecialAttack();
    }
    
    /**
     * Trigger enrage mode
     */
    triggerEnrage() {
        if (this.isEnraged) return;
        
        this.isEnraged = true;
        this.damage *= this.enrageMultiplier;
        this.attackSpeed *= this.enrageMultiplier;
        this.moveSpeed *= 1.3;
        
        // Visual indicator - make mesh red/glowing
        if (this.mesh && this.mesh.material) {
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.emissive?.setHex(0xff0000));
            } else if (this.mesh.material.emissive) {
                this.mesh.material.emissive.setHex(0xff0000);
            }
        }
        
        console.log(`🔥 [${this.name}] ENRAGED!`);
    }
    
    /**
     * Use a special attack
     */
    useSpecialAttack(attackType) {
        const attack = this.specialAttacks.find(a => a.type === attackType);
        if (!attack || this.specialCooldowns[attackType] > 0) return false;
        
        this.specialCooldowns[attackType] = attack.cooldown;
        
        console.log(`⚡ [${this.name}] Special Attack: ${attackType}`);
        
        // Execute special attack
        switch (attackType) {
            case SpecialAttack.CLEAVE:
                this.executeCleave(attack);
                break;
            case SpecialAttack.GROUND_SLAM:
                this.executeGroundSlam(attack);
                break;
            case SpecialAttack.CHARGE:
                this.executeCharge(attack);
                break;
            case SpecialAttack.SUMMON:
                this.executeSummon(attack);
                break;
            case SpecialAttack.BREATH:
                this.executeBreath(attack);
                break;
            case SpecialAttack.PROJECTILE:
                this.executeProjectile(attack);
                break;
        }
        
        // Callback
        if (this.onSpecialAttack) {
            this.onSpecialAttack({
                boss: this,
                attack: attack,
                position: this.position.clone(),
                target: this.target
            });
        }
        
        return true;
    }
    
    /**
     * Use a random available special attack
     */
    useRandomSpecialAttack() {
        const availableAttacks = this.specialAttacks.filter(
            atk => this.specialCooldowns[atk.type] <= 0
        );
        
        if (availableAttacks.length === 0) return false;
        
        const randomAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
        return this.useSpecialAttack(randomAttack.type);
    }
    
    /**
     * Cleave - wide frontal attack
     */
    executeCleave(attack) {
        const damage = this.damage * (attack.damage || 1.5);
        const angle = attack.angle || Math.PI / 2; // 90 degree cone
        const range = attack.range || this.attackRange * 1.5;
        
        // Attack info for combat system to process
        return {
            type: 'cone',
            damage: damage,
            angle: angle,
            range: range,
            origin: this.position.clone(),
            direction: this.rotation
        };
    }
    
    /**
     * Ground Slam - AoE around boss
     */
    executeGroundSlam(attack) {
        const damage = this.damage * (attack.damage || 2.0);
        const range = attack.range || 8;
        
        return {
            type: 'aoe',
            damage: damage,
            range: range,
            origin: this.position.clone()
        };
    }
    
    /**
     * Charge - rush at target
     */
    executeCharge(attack) {
        if (!this.target || !this.target.position) return null;
        
        const damage = this.damage * (attack.damage || 2.0);
        const targetPos = this.target.position.clone();
        
        // Will be animated by the game
        return {
            type: 'charge',
            damage: damage,
            startPos: this.position.clone(),
            endPos: targetPos,
            speed: this.moveSpeed * 3
        };
    }
    
    /**
     * Summon - spawn add enemies
     */
    executeSummon(attack) {
        const count = Math.min(attack.count || 2, this.maxAdds - this.summonedAdds.length);
        
        if (count <= 0) return null;
        
        // Callback to spawn adds
        if (this.onSummonAdds) {
            this.onSummonAdds({
                boss: this,
                count: count,
                position: this.position.clone(),
                level: Math.max(1, this.level - 5)
            });
        }
        
        return {
            type: 'summon',
            count: count,
            position: this.position.clone()
        };
    }
    
    /**
     * Breath - cone breath attack
     */
    executeBreath(attack) {
        const damage = this.damage * (attack.damage || 1.2);
        const angle = attack.angle || Math.PI / 4; // 45 degree cone
        const range = attack.range || 10;
        
        return {
            type: 'breath',
            damage: damage,
            angle: angle,
            range: range,
            origin: this.position.clone(),
            direction: this.rotation,
            duration: attack.duration || 3
        };
    }
    
    /**
     * Projectile - ranged attack
     */
    executeProjectile(attack) {
        if (!this.target || !this.target.position) return null;
        
        const damage = this.damage * (attack.damage || 1.0);
        
        return {
            type: 'projectile',
            damage: damage,
            origin: this.position.clone(),
            target: this.target.position.clone(),
            speed: attack.speed || 15
        };
    }
    
    /**
     * Override update for boss-specific behavior
     */
    update(deltaTime, playerPosition = null) {
        // Update soft enrage timer
        if (!this.isEnraged && this.state !== EnemyState.DEATH && this.state !== EnemyState.IDLE) {
            this.enrageTimer += deltaTime;
            if (this.enrageTimer >= this.softEnrageTime) {
                this.triggerEnrage();
            }
        }
        
        // Update special attack cooldowns
        for (const type of Object.keys(this.specialCooldowns)) {
            if (this.specialCooldowns[type] > 0) {
                this.specialCooldowns[type] -= deltaTime;
            }
        }
        
        // Mechanic timer
        this.mechanicTimer += deltaTime;
        if (this.mechanicTimer >= this.mechanicInterval) {
            this.mechanicTimer = 0;
            this.checkBossMechanics();
        }
        
        // Parent update
        super.update(deltaTime, playerPosition);
    }
    
    /**
     * Check and execute boss mechanics
     */
    checkBossMechanics() {
        if (this.state === EnemyState.ATTACK || this.state === EnemyState.CHASE) {
            // Higher chance to use special attack based on phase
            const specialChance = 0.2 + (this.phase * 0.1);
            if (Math.random() < specialChance) {
                this.useRandomSpecialAttack();
            }
        }
    }
    
    /**
     * Override attack state for boss
     */
    updateAttack(deltaTime) {
        if (!this.target || !this.target.position) {
            this.changeState(EnemyState.IDLE);
            return;
        }
        
        const distToTarget = this.distanceToTarget();
        
        // Target moved out of range
        if (distToTarget > this.attackRange * 1.5) {
            this.changeState(EnemyState.CHASE);
            return;
        }
        
        // Face target
        this.lookAtTarget();
        
        // Try special attack first (20% chance when available)
        if (Math.random() < 0.2) {
            const usedSpecial = this.useRandomSpecialAttack();
            if (usedSpecial) return;
        }
        
        // Normal attack
        if (this.attackCooldown <= 0) {
            this.performAttack();
        }
    }
    
    /**
     * Register a summoned add
     */
    registerAdd(addEnemy) {
        this.summonedAdds.push(addEnemy);
        
        // Remove from list when add dies
        addEnemy.onDeath = (data) => {
            const idx = this.summonedAdds.indexOf(addEnemy);
            if (idx >= 0) {
                this.summonedAdds.splice(idx, 1);
            }
        };
    }
    
    /**
     * Get boss status for UI
     */
    getStatus() {
        return {
            name: this.name,
            level: this.level,
            health: this.health,
            maxHealth: this.maxHealth,
            healthPercent: this.health / this.maxHealth,
            phase: this.phase,
            isEnraged: this.isEnraged,
            enrageTimer: this.enrageTimer,
            softEnrageTime: this.softEnrageTime,
            addCount: this.summonedAdds.length
        };
    }
}

export default WorldBoss;

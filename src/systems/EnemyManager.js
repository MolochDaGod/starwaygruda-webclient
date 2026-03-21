import * as THREE from 'three';
import { EnemyEntity, EnemyState, EnemyType } from '../entities/EnemyEntity.js';
import { WorldBoss, BossPhase, SpecialAttack } from '../entities/WorldBoss.js';
import { AnimatedNPCSystem } from '../entities/AnimatedNPCSystem.js';

/**
 * Spawn point configuration
 */
export class SpawnPoint {
    constructor(config = {}) {
        this.id = config.id || `spawn_${Date.now()}`;
        this.position = config.position || new THREE.Vector3();
        this.radius = config.radius || 5;
        this.enemyTypes = config.enemyTypes || ['minion'];
        this.maxEnemies = config.maxEnemies || 3;
        this.respawnTime = config.respawnTime || 30;
        this.levelRange = config.levelRange || [1, 5];
        this.active = config.active !== false;
        
        this.currentEnemies = [];
        this.respawnTimer = 0;
    }
}

/**
 * EnemyManager - Handles spawning, updating, and managing all enemies
 */
export class EnemyManager {
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Enemy collections
        this.enemies = new Map();
        this.bosses = new Map();
        this.spawnPoints = new Map();
        
        // Animated NPC system (replaces old VOXLoader)
        this.npcSystem = new AnimatedNPCSystem({
            basePath: config.basePath || '/assets/characters/kaykit/'
        });
        this.modelCache = new Map();
        
        // Configuration
        this.maxEnemies = config.maxEnemies || 50;
        this.updateRadius = config.updateRadius || 100;
        this.despawnRadius = config.despawnRadius || 150;
        
        // Enemy templates
        this.enemyTemplates = new Map();
        this.bossTemplates = new Map();
        
        // Stats
        this.stats = {
            totalSpawned: 0,
            totalKilled: 0,
            activeBosses: 0
        };
        
        // Callbacks
        this.onEnemySpawn = config.onEnemySpawn || null;
        this.onEnemyDeath = config.onEnemyDeath || null;
        this.onBossSpawn = config.onBossSpawn || null;
        this.onBossDeath = config.onBossDeath || null;
        
        console.log('⚔️ EnemyManager initialized');
    }
    
    /**
     * Register an enemy template
     */
    registerEnemyTemplate(id, template) {
        this.enemyTemplates.set(id, {
            name: template.name || id,
            modelPath: template.modelPath,
            archetype: template.archetype || id,   // NPCArchetype key for AnimatedNPCSystem
            animSet: template.animSet || 'unarmed', // ClassAnimationRegistry set key
            level: template.level || 1,
            health: template.health || 100,
            damage: template.damage || 10,
            defense: template.defense || 5,
            attackSpeed: template.attackSpeed || 1,
            moveSpeed: template.moveSpeed || 3,
            attackRange: template.attackRange || 2,
            aggroRange: template.aggroRange || 10,
            type: template.type || EnemyType.MINION,
            scale: template.scale || 1,
            lootTable: template.lootTable || [],
            expReward: template.expReward || 50
        });
        console.log(`📋 Registered enemy template: ${id}`);
    }
    
    /**
     * Register a boss template
     */
    registerBossTemplate(id, template) {
        this.bossTemplates.set(id, {
            name: template.name || id,
            modelPath: template.modelPath,
            level: template.level || 10,
            maxHealth: template.maxHealth || 5000,
            damage: template.damage || 50,
            defense: template.defense || 20,
            specialAttacks: template.specialAttacks || [
                { type: SpecialAttack.CLEAVE, cooldown: 8, damage: 1.5 },
                { type: SpecialAttack.GROUND_SLAM, cooldown: 15, damage: 2.0 }
            ],
            phaseThresholds: template.phaseThresholds,
            scale: template.scale || 2,
            lootTable: template.lootTable || [],
            expReward: template.expReward || 500
        });
        console.log(`👑 Registered boss template: ${id}`);
    }
    
    /**
     * Add a spawn point
     */
    addSpawnPoint(config) {
        const spawnPoint = new SpawnPoint(config);
        this.spawnPoints.set(spawnPoint.id, spawnPoint);
        console.log(`📍 Added spawn point: ${spawnPoint.id} at`, spawnPoint.position);
        return spawnPoint;
    }
    
    /**
     * Load a model via AnimatedNPCSystem (GLB with animations).
     * Legacy VOX paths are ignored — the archetype drives the model choice.
     */
    async loadModel(modelPath) {
        // Kept for backward compat; actual model loading is via npcSystem.prepareEnemy()
        return null;
    }
    
    /**
     * Spawn an enemy from a template
     */
    async spawnEnemy(templateId, position, config = {}) {
        if (this.enemies.size >= this.maxEnemies) {
            console.warn('Max enemies reached');
            return null;
        }
        
        const template = this.enemyTemplates.get(templateId);
        if (!template) {
            console.error(`Unknown enemy template: ${templateId}`);
            return null;
        }
        
        // Create enemy
        const enemy = new EnemyEntity({
            ...template,
            ...config,
            position: position.clone()
        });
        
        // Load animated GLB model via AnimatedNPCSystem
        const archetype = config.archetype || template.archetype || templateId;
        try {
            await this.npcSystem.prepareEnemy(enemy, archetype);
        } catch (err) {
            console.warn(`[EnemyManager] Failed to prepare animated model for ${templateId}:`, err.message);
        }
        
        // Set callbacks
        enemy.onDeath = (data) => this.handleEnemyDeath(enemy, data);
        enemy.onAttack = (data) => this.handleEnemyAttack(enemy, data);
        
        // Add to scene and tracking
        if (enemy.mesh) {
            this.scene.add(enemy.mesh);
        }
        this.enemies.set(enemy.id, enemy);
        this.stats.totalSpawned++;
        
        console.log(`👹 Spawned ${template.name} at`, position);
        
        // Callback
        if (this.onEnemySpawn) {
            this.onEnemySpawn(enemy);
        }
        
        return enemy;
    }
    
    /**
     * Spawn a world boss
     */
    async spawnBoss(templateId, position, config = {}) {
        const template = this.bossTemplates.get(templateId);
        if (!template) {
            console.error(`Unknown boss template: ${templateId}`);
            return null;
        }
        
        // Create boss
        const boss = new WorldBoss({
            ...template,
            ...config,
            position: position.clone()
        });
        
        // Load animated GLB model via AnimatedNPCSystem
        const archetype = config.archetype || template.archetype || 'boss_melee';
        try {
            await this.npcSystem.prepareEnemy(boss, archetype);
        } catch (err) {
            console.warn(`[EnemyManager] Failed to prepare boss model:`, err.message);
        }
        
        // Set callbacks
        boss.onDeath = (data) => this.handleBossDeath(boss, data);
        boss.onAttack = (data) => this.handleEnemyAttack(boss, data);
        boss.onPhaseChange = (data) => this.handleBossPhaseChange(boss, data);
        boss.onSummonAdds = (data) => this.handleBossSummon(boss, data);
        
        // Add to scene and tracking
        if (boss.mesh) {
            this.scene.add(boss.mesh);
        }
        this.bosses.set(boss.id, boss);
        this.stats.activeBosses++;
        
        console.log(`👑 Spawned BOSS ${template.name} at`, position);
        
        // Callback
        if (this.onBossSpawn) {
            this.onBossSpawn(boss);
        }
        
        return boss;
    }
    
    /**
     * Spawn enemy at a spawn point
     */
    async spawnAtPoint(spawnPointId) {
        const spawnPoint = this.spawnPoints.get(spawnPointId);
        if (!spawnPoint || !spawnPoint.active) return null;
        
        if (spawnPoint.currentEnemies.length >= spawnPoint.maxEnemies) return null;
        
        // Random position within radius
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spawnPoint.radius;
        const position = new THREE.Vector3(
            spawnPoint.position.x + Math.cos(angle) * dist,
            spawnPoint.position.y,
            spawnPoint.position.z + Math.sin(angle) * dist
        );
        
        // Random enemy type from spawn point
        const templateId = spawnPoint.enemyTypes[
            Math.floor(Math.random() * spawnPoint.enemyTypes.length)
        ];
        
        // Random level within range
        const level = Math.floor(
            spawnPoint.levelRange[0] + 
            Math.random() * (spawnPoint.levelRange[1] - spawnPoint.levelRange[0] + 1)
        );
        
        const enemy = await this.spawnEnemy(templateId, position, { level });
        if (enemy) {
            spawnPoint.currentEnemies.push(enemy.id);
            enemy.spawnPointId = spawnPointId;
        }
        
        return enemy;
    }
    
    /**
     * Handle enemy death
     */
    handleEnemyDeath(enemy, data) {
        console.log(`💀 Enemy died: ${enemy.name}`);
        this.stats.totalKilled++;
        
        // Remove from spawn point tracking
        if (enemy.spawnPointId) {
            const spawnPoint = this.spawnPoints.get(enemy.spawnPointId);
            if (spawnPoint) {
                const idx = spawnPoint.currentEnemies.indexOf(enemy.id);
                if (idx >= 0) {
                    spawnPoint.currentEnemies.splice(idx, 1);
                }
            }
        }
        
        // Schedule removal
        setTimeout(() => {
            this.removeEnemy(enemy.id);
        }, 5000); // Remove after 5 seconds (for death animation/loot)
        
        // Callback
        if (this.onEnemyDeath) {
            this.onEnemyDeath(enemy, data);
        }
    }
    
    /**
     * Handle boss death
     */
    handleBossDeath(boss, data) {
        console.log(`👑💀 BOSS DEFEATED: ${boss.name}`);
        this.stats.activeBosses--;
        
        // Schedule removal
        setTimeout(() => {
            this.removeBoss(boss.id);
        }, 10000); // Longer delay for boss death
        
        // Callback
        if (this.onBossDeath) {
            this.onBossDeath(boss, data);
        }
    }
    
    /**
     * Handle enemy attack
     */
    handleEnemyAttack(enemy, data) {
        // This will be handled by the CombatSystem
        console.log(`⚔️ ${enemy.name} attacks!`);
    }
    
    /**
     * Handle boss phase change
     */
    handleBossPhaseChange(boss, data) {
        console.log(`👑 ${boss.name} enters phase ${data.newPhase}!`);
    }
    
    /**
     * Handle boss summoning adds
     */
    async handleBossSummon(boss, data) {
        console.log(`👑 ${boss.name} summons ${data.count} adds!`);
        
        // Spawn minions around boss
        const minionTemplate = this.enemyTemplates.keys().next().value;
        if (!minionTemplate) return;
        
        for (let i = 0; i < data.count; i++) {
            const angle = (i / data.count) * Math.PI * 2;
            const dist = 5;
            const position = new THREE.Vector3(
                data.position.x + Math.cos(angle) * dist,
                data.position.y,
                data.position.z + Math.sin(angle) * dist
            );
            
            const add = await this.spawnEnemy(minionTemplate, position, {
                level: data.level
            });
            
            if (add) {
                boss.registerAdd(add);
            }
        }
    }
    
    /**
     * Remove an enemy
     */
    removeEnemy(enemyId) {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        enemy.dispose();
        if (enemy.mesh && enemy.mesh.parent) {
            enemy.mesh.parent.remove(enemy.mesh);
        }
        this.enemies.delete(enemyId);
    }
    
    /**
     * Remove a boss
     */
    removeBoss(bossId) {
        const boss = this.bosses.get(bossId);
        if (!boss) return;
        
        boss.dispose();
        if (boss.mesh && boss.mesh.parent) {
            boss.mesh.parent.remove(boss.mesh);
        }
        this.bosses.delete(bossId);
    }
    
    /**
     * Get enemy by ID
     */
    getEnemy(enemyId) {
        return this.enemies.get(enemyId) || this.bosses.get(enemyId);
    }
    
    /**
     * Get all enemies within range of a position
     */
    getEnemiesInRange(position, range) {
        const result = [];
        
        for (const enemy of this.enemies.values()) {
            if (enemy.state === EnemyState.DEATH) continue;
            const dist = enemy.position.distanceTo(position);
            if (dist <= range) {
                result.push({ enemy, distance: dist });
            }
        }
        
        for (const boss of this.bosses.values()) {
            if (boss.state === EnemyState.DEATH) continue;
            const dist = boss.position.distanceTo(position);
            if (dist <= range) {
                result.push({ enemy: boss, distance: dist });
            }
        }
        
        return result.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * Get closest enemy to position
     */
    getClosestEnemy(position, maxRange = Infinity) {
        const enemies = this.getEnemiesInRange(position, maxRange);
        return enemies.length > 0 ? enemies[0].enemy : null;
    }
    
    /**
     * Update all enemies
     */
    update(deltaTime, playerPosition) {
        // Update spawn points
        for (const spawnPoint of this.spawnPoints.values()) {
            if (!spawnPoint.active) continue;
            
            // Check if player is near enough
            if (playerPosition) {
                const dist = spawnPoint.position.distanceTo(playerPosition);
                if (dist > this.updateRadius) continue;
            }
            
            // Respawn timer
            if (spawnPoint.currentEnemies.length < spawnPoint.maxEnemies) {
                spawnPoint.respawnTimer += deltaTime;
                if (spawnPoint.respawnTimer >= spawnPoint.respawnTime) {
                    spawnPoint.respawnTimer = 0;
                    this.spawnAtPoint(spawnPoint.id);
                }
            }
        }
        
        // Update enemies
        for (const enemy of this.enemies.values()) {
            // Skip if too far from player
            if (playerPosition) {
                const dist = enemy.position.distanceTo(playerPosition);
                
                // Despawn if too far
                if (dist > this.despawnRadius && enemy.state === EnemyState.IDLE) {
                    this.removeEnemy(enemy.id);
                    continue;
                }
                
                // Only update if close enough
                if (dist <= this.updateRadius) {
                    enemy.update(deltaTime, playerPosition);
                }
            } else {
                enemy.update(deltaTime);
            }
        }
        
        // Update bosses (always update, they're important)
        for (const boss of this.bosses.values()) {
            boss.update(deltaTime, playerPosition);
        }
    }
    
    /**
     * Get stats
     */
    getStats() {
        return {
            ...this.stats,
            activeEnemies: this.enemies.size,
            activeBosses: this.bosses.size,
            spawnPoints: this.spawnPoints.size
        };
    }
    
    /**
     * Clear all enemies
     */
    clearAll() {
        for (const enemy of this.enemies.values()) {
            enemy.dispose();
            if (enemy.mesh && enemy.mesh.parent) {
                enemy.mesh.parent.remove(enemy.mesh);
            }
        }
        this.enemies.clear();
        
        for (const boss of this.bosses.values()) {
            boss.dispose();
            if (boss.mesh && boss.mesh.parent) {
                boss.mesh.parent.remove(boss.mesh);
            }
        }
        this.bosses.clear();
        
        console.log('🧹 Cleared all enemies');
    }
    
    /**
     * Dispose
     */
    dispose() {
        this.clearAll();
        this.spawnPoints.clear();
        this.enemyTemplates.clear();
        this.bossTemplates.clear();
        this.modelCache.clear();
        if (this.npcSystem) this.npcSystem.dispose();
    }
}

export default EnemyManager;

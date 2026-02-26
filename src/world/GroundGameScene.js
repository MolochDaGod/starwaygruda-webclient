import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Import game systems
import { gameState } from '../systems/GameStateManager.js';
import { TargetingSystem } from '../systems/TargetingSystem.js';
import { WoWTargetingSystem } from '../systems/WoWTargetingSystem.js';
import { WoWCameraController } from '../controls/WoWCameraController.js';
import { EnhancedCharacterController, AnimationState, ViewMode } from '../player/EnhancedCharacterController.js';
import { professionSystem } from '../systems/ProfessionSystem.js';
import { HarvestingSystem } from '../systems/HarvestingSystem.js';
import { equipmentSystem } from '../systems/EquipmentSystem.js';
import { aiDialogueSystem } from '../systems/AIDialogueSystem.js';
import { missionSystem } from '../systems/MissionSystem.js';

// Enemy and Combat systems
import { EnemyManager } from '../systems/EnemyManager.js';
import { CombatSystem, AttackShape, DamageType as CombatDamageType } from '../systems/CombatSystem.js';
import { EnemyType } from '../entities/EnemyEntity.js';
import { SpecialAttack } from '../entities/WorldBoss.js';

// Import UI components
import { RadialMenu } from '../ui/swg/RadialMenu.js';
import { TargetFrame } from '../ui/swg/TargetFrame.js';
import { WoWTargetFrame } from '../ui/target/WoWTargetFrame.js';
import { SkillBar } from '../ui/swg/SkillBar.js';
import { ChatUI } from '../ui/swg/ChatUI.js';
import { QuestTracker } from '../ui/swg/QuestTracker.js';

// Character systems
import { KayKitCharacterSystem, KayKitCharacter } from '../player/KayKitCharacterSystem.js';
import { CharacterModelSelector } from '../ui/CharacterModelSelector.js';

// Import Phase 1 UX systems
import { UIManager } from '../ui/UIManager.js';
import { eventBus, GameEvents } from '../core/EventBus.js';
import { EntityType, FactionRelation, DamageType } from '../core/Constants.js';

/**
 * GroundGameScene - Ground-based MMO gameplay
 * Features: Terrain, third-person character, animations, NPCs
 * Integrated with SWG-style game systems
 */
export class GroundGameScene {
    constructor(mountRef) {
        this.mountRef = mountRef;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        
        // Core systems
        this.targetingSystem = null;
        this.harvestingSystem = null;
        this.clock = new THREE.Clock();
        
        // WoW-style systems
        this.wowCameraController = null;
        this.wowTargetingSystem = null;
        this.wowTargetFrame = null;
        this.useWoWControls = true; // Use WoW-style camera/targeting
        
        // Enhanced character controller (new system)
        this.characterController = null;
        this.useEnhancedController = true; // Use new 3D-Game-Template style controller
        
        // Player collision mesh (invisible, controlled by WoWCameraController - legacy)
        this.playerCollisionMesh = null;
        
        // KayKit character system (primary visual character - legacy, now in EnhancedCharacterController)
        this.kayKitCharacter = null;
        this.characterModelSelector = null;
        this.currentCharacterModel = 'Knight'; // Default character (capitalized to match filename)
        
        // UI components
        this.radialMenu = null;
        this.targetFrame = null;
        this.skillBar = null;
        this.chatUI = null;
        this.questTracker = null;
        this.uiManager = null; // Phase 1 UX systems
        
        // Terrain
        this.terrain = null;
        this.terrainChunks = [];
        this.chunkSize = 100;
        this.chunksVisible = 3;
        
        // Entities
        this.npcs = [];
        this.creatures = [];
        this.resourceNodes = [];
        this.targetableEntities = [];
        
        // Enemy and Combat systems
        this.enemyManager = null;
        this.combatSystem = null;
        
        // Score
        this.score = 0;
        
        // Callbacks
        this.updateCallback = null;
        
        console.log('🌍 GroundGameScene initialized with SWG systems');
    }
    
    /**
     * Initialize the scene
     */
    async init(updateCallback) {
        this.updateCallback = updateCallback;
        
        // Renderer setup
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.mountRef.current.appendChild(this.renderer.domElement);
        
        // Setup scene
        this.setupSky();
        this.setupLighting();
        this.setupTerrain();
        
        // Initialize player collision mesh and WoW camera controller
        await this.initializePlayerController();
        
        // Spawn NPCs and creatures
        this.spawnNPCs();
        this.spawnCreatures();
        this.spawnResourceNodes();
        
        // Setup environment objects
        this.setupEnvironment();
        
        // Initialize game systems
        this.initializeGameSystems();
        
        // Initialize UI
        this.initializeUI();
        
        // Initialize Phase 1 UX systems (floating text, nameplates, buffs, settings)
        this.initializeUIManager();
        
        // Setup event handlers
        this.setupGameEventHandlers();
        
        // KayKit is initialized in initializePlayerController
        
        // Event listeners - store bound reference for cleanup
        this._resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this._resizeHandler);
        
        // Connect WoW Tab targeting
        if (this.useWoWControls && this.wowTargetingSystem) {
            // Setup Tab key handler for WoW targeting
            this._wowTabHandler = (e) => {
                if (e.code === 'Tab') {
                    e.preventDefault();
                    this.wowTargetingSystem.cycleTarget(e.shiftKey ? -1 : 1);
                    
                    // Update target frame
                    const targetData = this.wowTargetingSystem.getTargetData();
                    if (this.wowTargetFrame) {
                        this.wowTargetFrame.setTarget(targetData);
                    }
                }
            };
            document.addEventListener('keydown', this._wowTabHandler);
        }
        
        // Start animation loop
        this.animate();
        
        console.log('✅ GroundGameScene ready!');
        console.log('🎮 Movement: W/S forward/back, A/D/Q/E strafe, SHIFT run, SPACE jump');
        console.log('🎮 Camera: Hold RMB to rotate camera, auto-follows when released');
        console.log('🎮 Combat: LMB to attack, Tab to cycle targets');
        console.log('🎮 Press C for character selection');
        
        return () => this.cleanup();
    }
    
    /**
     * Initialize player controller with Enhanced Character Controller or legacy WoW-style
     */
    async initializePlayerController() {
        if (this.useEnhancedController) {
            // NEW: Enhanced Character Controller (based on 3D-Game-Template-Ultimate)
            this.characterController = new EnhancedCharacterController(
                this.scene,
                this.camera,
                this.renderer.domElement,
                {
                    walkSpeed: 18,
                    runSpeed: 32,
                    jumpForce: 15,
                    gravity: 30,
                    cameraDistanceThird: 6,
                    cameraHeightThird: 2.8,
                    cameraSensitivity: 0.002,
                    modelScale: 1.0,
                    onAttack: (attackData) => this.handlePlayerAttack(attackData),
                    onAnimationChange: (state) => this.handleAnimationStateChange(state)
                }
            );
            
            // Set initial position
            this.characterController.setPosition(0, 5, 0);
            
            // Load character model (KayKit GLB with embedded animations)
            try {
                // Capitalize first letter to match KayKit filename convention
                const modelName = this.currentCharacterModel.charAt(0).toUpperCase() + this.currentCharacterModel.slice(1);
                const modelPath = `/assets/characters/kaykit/${modelName}.glb`;
                console.log(`Loading character model: ${modelPath}`);
                await this.characterController.loadCharacterModel(modelPath, {
                    'Idle_A': 'idle',
                    'Walking_A': 'walk', 
                    'Running_A': 'run',
                    'Jump_Full_Short': 'jump'
                });
                
                // Try to load Mixamo combat animations
                await this.characterController.loadCombatAnimations('/assets/animations/mixamo/');
                
                console.log('🎮 Enhanced Character Controller initialized with KayKit model');
            } catch (err) {
                console.warn('⚠️ Failed to load character model:', err.message);
            }
            
            // For backwards compatibility, create a dummy collision mesh reference
            this.playerCollisionMesh = { 
                position: this.characterController.collider.end,
                get quaternion() { return new THREE.Quaternion(); }
            };
            
            console.log('🎮 Controls: WASD move, SHIFT run, SPACE jump, V toggle view');
            console.log('🎮 Camera: RMB to lock and rotate, scroll to zoom');
            console.log('🎮 Combat: LMB to attack (when pointer locked)');
            
        } else {
            // LEGACY: WoW Camera Controller + separate KayKit system
            // Create invisible collision mesh for player
            const capsuleGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
            const capsuleMaterial = new THREE.MeshBasicMaterial({ visible: false });
            this.playerCollisionMesh = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
            this.playerCollisionMesh.position.set(0, 5, 0);
            this.scene.add(this.playerCollisionMesh);
            
            // Initialize WoW Camera Controller
            if (this.useWoWControls) {
                this.wowCameraController = new WoWCameraController(
                    this.camera,
                    this.playerCollisionMesh,
                    this.renderer.domElement,
                    {
                        cameraDistance: 8,
                        cameraHeight: 2.5,
                        moveSpeed: 6,
                        runSpeed: 12,
                        turnSpeed: 3.0,
                        jumpForce: 8,
                        gravity: 20
                    }
                );
                
                // Connect animation callback to KayKit
                this.wowCameraController.onAnimationChange = (state) => {
                    this.updateKayKitAnimation(state);
                };
                
                // Connect attack callback
                this.wowCameraController.setAttackCallback((attackData) => {
                    this.handlePlayerAttack(attackData);
                });
                
                console.log('🎮 WoW Camera Controller initialized');
            }
            
            // Initialize KayKit character system
            try {
                this.kayKitCharacter = new KayKitCharacterSystem(this.scene, this.camera, {
                    basePath: '/assets/characters/kaykit/',
                    scale: 1.0,
                    crossFadeDuration: 0.2
                });
                
                await this.kayKitCharacter.init(this.currentCharacterModel);
                this.kayKitCharacter.setFollowTarget(this.playerCollisionMesh);
                
                console.log('🎮 KayKit character system initialized');
            } catch (err) {
                console.warn('⚠️ KayKit failed to initialize:', err.message);
            }
        }
        
        // Initialize character model selector UI
        this.characterModelSelector = new CharacterModelSelector({
            defaultModel: this.currentCharacterModel,
            onSelect: (modelId) => {
                // Preview the model immediately
                if (this.useEnhancedController && this.characterController) {
                    const modelName = modelId.charAt(0).toUpperCase() + modelId.slice(1);
                    const modelPath = `/assets/characters/kaykit/${modelName}.glb`;
                    this.characterController.loadCharacterModel(modelPath, {
                        'Idle_A': 'idle',
                        'Walking_A': 'walk',
                        'Running_A': 'run',
                        'Jump_Full_Short': 'jump'
                    });
                } else if (this.kayKitCharacter) {
                    this.kayKitCharacter.loadCharacter(modelId);
                }
            },
            onConfirm: (modelId) => {
                this.currentCharacterModel = modelId;
                console.log(`🎮 Character confirmed: ${modelId}`);
            }
        });
        
        // Keybind: C to open character selector
        this._characterCycleHandler = (e) => {
            if (e.code === 'KeyC' && !e.ctrlKey && !e.altKey && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (this.characterModelSelector.isOpen) {
                    this.characterModelSelector.close();
                } else {
                    this.characterModelSelector.open(this.currentCharacterModel);
                }
            }
        };
        document.addEventListener('keydown', this._characterCycleHandler);
        
        console.log('🎮 Press C to open character selector');
    }
    
    /**
     * Handle animation state change from EnhancedCharacterController
     */
    handleAnimationStateChange(state) {
        // Can be used for sound effects, particle effects, etc.
        // console.log(`Animation state: ${state}`);
    }
    
    /**
     * Update KayKit animation based on movement state
     */
    updateKayKitAnimation(state) {
        if (!this.kayKitCharacter) return;
        
        this.kayKitCharacter.setMovementInput(
            state.isMoving ? 1 : 0,
            0,
            state.isRunning,
            !state.isGrounded
        );
    }
    
    /**
     * Handle player attack (LMB)
     */
    handlePlayerAttack(attackData) {
        // Play attack animation (handled by EnhancedCharacterController if using it)
        if (!this.useEnhancedController && this.kayKitCharacter) {
            this.kayKitCharacter.playAttackAnimation(attackData.type);
        }
        
        // Use CombatSystem for damage
        if (this.combatSystem) {
            const attackRange = attackData.type === 'melee' ? 3 : 20;
            const baseDamage = attackData.type === 'melee' ? 25 : 15;
            
            // Set player reference for combat
            this.combatSystem.setPlayer({
                position: attackData.position.clone(),
                damage: baseDamage,
                critChance: 0.1,
                defense: 10
            });
            
            // Process attack through combat system
            const results = this.combatSystem.playerAttack({
                damage: baseDamage,
                range: attackRange,
                shape: attackData.type === 'melee' ? AttackShape.CONE : AttackShape.SINGLE,
                angle: Math.PI / 2, // 90 degree cone for melee
                direction: attackData.direction,
                position: attackData.position,
                damageType: CombatDamageType.PHYSICAL
            });
            
            // Emit damage events for UI feedback
            for (const result of results) {
                eventBus.emit(GameEvents.COMBAT.DAMAGE_DEALT, {
                    sourceId: 'player',
                    targetId: result.enemy.id,
                    damage: result.damage,
                    damageType: DamageType.PHYSICAL,
                    isCritical: result.isCrit,
                    position: result.enemy.position.clone()
                });
            }
        }
        
        // Also check old targeting system for legacy entities
        let target = null;
        if (this.wowTargetingSystem) {
            target = this.wowTargetingSystem.getTargetData();
        }
        
        if (target && target.object3D?.userData?.type !== 'enemy') {
            const playerPos = attackData.position;
            const targetPos = target.object3D?.position;
            
            if (targetPos) {
                const distance = playerPos.distanceTo(targetPos);
                const attackRange = attackData.type === 'melee' ? 3 : 20;
                
                if (distance <= attackRange) {
                    console.log(`⚔️ ${attackData.type.toUpperCase()} attack hit ${target.name}!`);
                    
                    eventBus.emit(GameEvents.COMBAT.DAMAGE_DEALT, {
                        sourceId: 'player',
                        targetId: target.id,
                        damage: Math.floor(Math.random() * 20) + 10,
                        damageType: attackData.type === 'melee' ? DamageType.PHYSICAL : DamageType.KINETIC,
                        isCritical: Math.random() < 0.1,
                        position: targetPos.clone()
                    });
                }
            }
        }
    }
    
    /**
     * Get the player character mesh/object (collision mesh)
     */
    getPlayerCharacterMesh() {
        return this.playerCollisionMesh;
    }
    
    /**
     * Set player mesh visibility
     */
    setPlayerMeshVisibility(visible) {
        // KayKit is the visual - collision mesh is always invisible
        if (this.kayKitCharacter && this.kayKitCharacter.currentModel) {
            this.kayKitCharacter.currentModel.visible = visible;
        }
    }
    
    /**
     * Initialize game systems
     */
    initializeGameSystems() {
        // Initialize targeting system (legacy)
        this.targetingSystem = new TargetingSystem(
            this.scene,
            this.camera,
            this.renderer
        );
        
        // Initialize WoW-style targeting system
        if (this.useWoWControls) {
            this.wowTargetingSystem = new WoWTargetingSystem(this.scene, this.camera, {
                maxRange: 50,
                tabPrioritizeHostile: true
            });
        }
        
        // Initialize harvesting system
        this.harvestingSystem = new HarvestingSystem(this.scene);
        
        // Initialize Enemy Manager
        this.enemyManager = new EnemyManager(this.scene, {
            maxEnemies: 50,
            updateRadius: 100,
            despawnRadius: 150,
            onEnemyDeath: (enemy, data) => this.handleEnemyDeathFromManager(enemy, data),
            onBossDeath: (boss, data) => this.handleBossDeathFromManager(boss, data)
        });
        
        // Initialize Combat System
        this.combatSystem = new CombatSystem({
            onDamageDealt: (data) => this.handleCombatDamageDealt(data),
            onKill: (data) => this.handleCombatKill(data)
        });
        this.combatSystem.setEnemyManager(this.enemyManager);
        
        // Register enemy templates
        this.registerEnemyTemplates();
        
        // Spawn test enemies
        this.spawnTestEnemies();
        
        // Build list of targetable entities
        this.updateTargetableEntities();
        
        // Initialize player state
        gameState.updateState(draft => {
            draft.player.name = 'Player';
            draft.player.level = 1;
            draft.player.position = { x: 0, y: 5, z: 0 };
        });
        
        // Give player novice professions
        professionSystem.learnNovice('marksman');
        professionSystem.learnNovice('scout');
        
        console.log('⚙️ Game systems initialized');
    }
    
    /**
     * Initialize UI components
     */
    initializeUI() {
        this.radialMenu = new RadialMenu();
        this.targetFrame = new TargetFrame();
        this.skillBar = new SkillBar();
        this.chatUI = new ChatUI();
        this.questTracker = new QuestTracker();
        
        // Initialize WoW-style target frame
        if (this.useWoWControls) {
            this.wowTargetFrame = new WoWTargetFrame({
                container: this.mountRef.current
            });
        }
        
        console.log('📺 UI components initialized');
    }
    
    /**
     * Initialize Phase 1 UX systems (UIManager)
     */
    initializeUIManager() {
        this.uiManager = new UIManager({
            container: this.mountRef.current,
            camera: this.camera,
            scene: this.scene
        });
        this.uiManager.init();
        
        // Register existing NPCs and creatures with nameplate system
        this.npcs.forEach(npc => {
            this.uiManager.registerEntity({
                id: npc.userData.entityId,
                name: npc.userData.name,
                level: npc.userData.level || 1,
                health: npc.userData.health?.current || 100,
                maxHealth: npc.userData.health?.max || 100,
                object3D: npc,
                entityType: EntityType.NPC,
                faction: FactionRelation.FRIENDLY
            });
        });
        
        this.creatures.forEach(creature => {
            this.uiManager.registerEntity({
                id: creature.userData.entityId,
                name: creature.userData.name,
                level: creature.userData.level || 1,
                health: creature.userData.health?.current || 100,
                maxHealth: creature.userData.health?.max || 100,
                object3D: creature,
                entityType: EntityType.ENEMY,
                faction: FactionRelation.HOSTILE,
                isElite: creature.userData.isElite || false
            });
        });
        
        // Register entities with WoW targeting system
        if (this.useWoWControls && this.wowTargetingSystem) {
            this.npcs.forEach(npc => {
                this.wowTargetingSystem.registerEntity({
                    id: npc.userData.entityId,
                    name: npc.userData.name,
                    level: npc.userData.level || 1,
                    type: 'npc',
                    hostile: false,
                    friendly: true,
                    currentHealth: npc.userData.health?.current || 100,
                    maxHealth: npc.userData.health?.max || 100,
                    mesh: npc,
                    position: npc.position
                });
            });
            
            this.creatures.forEach(creature => {
                this.wowTargetingSystem.registerEntity({
                    id: creature.userData.entityId,
                    name: creature.userData.name,
                    level: creature.userData.level || 1,
                    type: 'creature',
                    hostile: true,
                    friendly: false,
                    currentHealth: creature.userData.health?.current || 100,
                    maxHealth: creature.userData.health?.max || 100,
                    mesh: creature,
                    position: creature.position,
                    height: 2.5
                });
            });
            
            console.log('🎯 WoW targeting: registered', this.npcs.length, 'NPCs and', this.creatures.length, 'creatures');
        }
        
        console.log('🎨 Phase 1 UX systems initialized');
    }
    
    /**
     * Setup game event handlers
     */
    setupGameEventHandlers() {
        // Handle ability usage
        gameState.on('abilityUsed', (data) => {
            this.handleAbilityUsed(data);
        });
        
        // Handle attack command
        gameState.on('attack', (data) => {
            this.handleAttack(data);
        });
        
        // Handle survey
        gameState.on('survey', () => {
            const pos = this.getPlayerPosition();
            this.harvestingSystem.survey({ x: pos.x, y: pos.y, z: pos.z });
        });
        
        // Handle harvest
        gameState.on('harvestResource', (data) => {
            this.harvestingSystem.startHarvest(data.target.id);
        });
        
        // Handle harvest creature
        gameState.on('harvestCreature', (data) => {
            this.harvestingSystem.harvestCreature(data.target.id, data.type);
        });
    }
    
    /**
     * Handle ability usage
     */
    handleAbilityUsed(data) {
        const { ability, targetId } = data;
        
        if (ability.damage && targetId) {
            // Deal damage to target
            const target = this.targetableEntities.find(e => e.userData.entityId === targetId);
            if (target) {
                const damage = ability.damage.min + Math.random() * (ability.damage.max - ability.damage.min);
                this.dealDamageToEntity(target, damage);
                
                // Award combat XP
                professionSystem.awardXP('combat', Math.floor(damage / 2));
            }
        }
        
        if (ability.heal) {
            const heal = ability.heal.min + Math.random() * (ability.heal.max - ability.heal.min);
            gameState.modifyHAM('health', heal);
            console.log(`Healed for ${Math.floor(heal)}`);
        }
    }
    
    /**
     * Handle attack command
     */
    handleAttack(data) {
        const targetId = data.targetId || gameState.getState().target;
        if (!targetId) return;
        
        gameState.enterCombat(targetId);
        
        // Auto-attack would go here
        console.log('Entering combat with target:', targetId);
    }
    
    /**
     * Deal damage to an entity
     */
    dealDamageToEntity(entity, damage, isCrit = false) {
        if (!entity.userData.health) return;
        
        entity.userData.health.current -= damage;
        console.log(`Dealt ${Math.floor(damage)} damage to ${entity.userData.name}`);
        
        // Show floating damage number
        if (this.uiManager) {
            const position = entity.position.clone();
            position.y += 2; // Above the entity
            this.uiManager.showDamage({
                amount: Math.floor(damage),
                damageType: DamageType.PHYSICAL,
                position: position,
                isCrit: isCrit
            });
        }
        
        // Update nameplate health
        if (this.uiManager) {
            this.uiManager.nameplates?.updateEntity(entity.userData.entityId, {
                health: entity.userData.health.current,
                maxHealth: entity.userData.health.max
            });
        }
        
        // Update entity in game state
        gameState.updateEntity(entity.userData.entityId, {
            health: { ...entity.userData.health }
        });
        
        // Check if dead
        if (entity.userData.health.current <= 0) {
            entity.userData.health.current = 0;
            entity.userData.dead = true;
            this.handleEntityDeath(entity);
        }
    }
    
    /**
     * Handle entity death
     */
    handleEntityDeath(entity) {
        console.log(`${entity.userData.name} has been defeated!`);
        
        // Award XP
        const xpReward = entity.userData.level * 50;
        professionSystem.awardXP('combat', xpReward);
        
        // Update game state
        gameState.updateEntity(entity.userData.entityId, { dead: true });
        
        // Visual feedback - make corpse
        if (entity.children) {
            entity.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0x444444);
                }
            });
        }
        entity.rotation.z = Math.PI / 2; // Fall over
    }
    
    /**
     * Register enemy templates with EnemyManager
     */
    registerEnemyTemplates() {
        if (!this.enemyManager) return;
        
        // Goblin - weak melee enemy
        this.enemyManager.registerEnemyTemplate('goblin', {
            name: 'Goblin',
            modelPath: '/assets/voxel/goblin.vox',
            level: 1,
            health: 80,
            damage: 8,
            defense: 2,
            attackSpeed: 1.2,
            moveSpeed: 4,
            attackRange: 2,
            aggroRange: 10,
            type: EnemyType.MINION,
            scale: 0.05, // VOX models are usually large, scale down
            expReward: 25
        });
        
        // Orc - stronger melee enemy
        this.enemyManager.registerEnemyTemplate('orc', {
            name: 'Orc Warrior',
            modelPath: '/assets/voxel/orc.vox',
            level: 3,
            health: 200,
            damage: 20,
            defense: 8,
            attackSpeed: 0.8,
            moveSpeed: 3,
            attackRange: 2.5,
            aggroRange: 12,
            type: EnemyType.ELITE,
            scale: 0.06, // VOX models are usually large, scale down
            expReward: 75
        });
        
        // Skeleton Archer - ranged enemy
        this.enemyManager.registerEnemyTemplate('skeleton_archer', {
            name: 'Skeleton Archer',
            level: 2,
            health: 60,
            damage: 15,
            defense: 3,
            attackSpeed: 1.5,
            moveSpeed: 2.5,
            attackRange: 15,
            aggroRange: 18,
            type: EnemyType.RANGED,
            scale: 1.0,
            expReward: 40
        });
        
        // Register a boss template
        this.enemyManager.registerBossTemplate('giant_troll', {
            name: 'Grothak the Destroyer',
            modelPath: '/assets/voxel/boss.vox',
            level: 10,
            maxHealth: 5000,
            damage: 50,
            defense: 25,
            specialAttacks: [
                { type: SpecialAttack.CLEAVE, cooldown: 8, damage: 1.5 },
                { type: SpecialAttack.GROUND_SLAM, cooldown: 15, damage: 2.0, range: 8 },
                { type: SpecialAttack.SUMMON, cooldown: 45, count: 2 }
            ],
            scale: 0.15, // Boss is bigger
            expReward: 1000
        });
        
        console.log('📋 Enemy templates registered');
    }
    
    /**
     * Spawn test enemies
     */
    async spawnTestEnemies() {
        if (!this.enemyManager) return;
        
        // Add spawn points around the map
        this.enemyManager.addSpawnPoint({
            id: 'goblin_camp_1',
            position: new THREE.Vector3(30, 0, 30),
            radius: 10,
            enemyTypes: ['goblin'],
            maxEnemies: 3,
            respawnTime: 30,
            levelRange: [1, 2]
        });
        
        this.enemyManager.addSpawnPoint({
            id: 'orc_patrol',
            position: new THREE.Vector3(-50, 0, 40),
            radius: 15,
            enemyTypes: ['orc'],
            maxEnemies: 2,
            respawnTime: 60,
            levelRange: [3, 5]
        });
        
        this.enemyManager.addSpawnPoint({
            id: 'skeleton_ruins',
            position: new THREE.Vector3(60, 0, -40),
            radius: 12,
            enemyTypes: ['skeleton_archer', 'goblin'],
            maxEnemies: 4,
            respawnTime: 45,
            levelRange: [2, 4]
        });
        
        // Spawn some immediate enemies for testing
        const goblin1Pos = new THREE.Vector3(25, this.getTerrainHeight(25, 25), 25);
        const goblin2Pos = new THREE.Vector3(28, this.getTerrainHeight(28, 30), 30);
        const orcPos = new THREE.Vector3(-45, this.getTerrainHeight(-45, 35), 35);
        
        await this.enemyManager.spawnEnemy('goblin', goblin1Pos, { level: 1 });
        await this.enemyManager.spawnEnemy('goblin', goblin2Pos, { level: 2 });
        await this.enemyManager.spawnEnemy('orc', orcPos, { level: 3 });
        
        console.log('👹 Test enemies spawned');
        console.log('   Goblin camp at (30, 30)');
        console.log('   Orc patrol at (-50, 40)');
        console.log('   Skeleton ruins at (60, -40)');
    }
    
    /**
     * Handle enemy death from EnemyManager
     */
    handleEnemyDeathFromManager(enemy, data) {
        console.log(`👹 ${enemy.name} defeated!`);
        
        // Award XP
        professionSystem.awardXP('combat', enemy.expReward || 25);
        
        // Show floating text
        if (this.uiManager) {
            const position = enemy.position.clone();
            position.y += 2;
            this.uiManager.showDamage({
                amount: `+${enemy.expReward} XP`,
                damageType: 'heal',
                position: position,
                isCrit: false
            });
        }
    }
    
    /**
     * Handle boss death from EnemyManager
     */
    handleBossDeathFromManager(boss, data) {
        console.log(`👑 BOSS ${boss.name} DEFEATED!`);
        
        // Award bonus XP
        professionSystem.awardXP('combat', boss.expReward || 500);
        
        // TODO: Spawn loot, show victory screen, etc.
    }
    
    /**
     * Handle damage dealt via CombatSystem
     */
    handleCombatDamageDealt(data) {
        // Show floating damage numbers
        if (this.uiManager && data.defender.position) {
            const position = data.defender.position.clone();
            position.y += 2;
            this.uiManager.showDamage({
                amount: data.damage,
                damageType: data.damageType,
                position: position,
                isCrit: data.isCrit
            });
        }
    }
    
    /**
     * Handle kill via CombatSystem
     */
    handleCombatKill(data) {
        console.log(`⚔️ Killed ${data.victim.name}!`);
        console.log(`   Loot: ${data.loot?.length || 0} items`);
        console.log(`   EXP: ${data.exp}`);
    }
    
    /**
     * Update list of targetable entities
     */
    updateTargetableEntities() {
        this.targetableEntities = [];
        
        // Add NPCs
        this.npcs.forEach(npc => {
            this.targetableEntities.push(npc);
        });
        
        // Add creatures
        this.creatures.forEach(creature => {
            this.targetableEntities.push(creature);
        });
        
        // Add resource nodes
        this.resourceNodes.forEach(node => {
            this.targetableEntities.push(node);
        });
        
        // Update targeting system
        if (this.targetingSystem) {
            this.targetingSystem.setTargetableEntities(this.targetableEntities);
        }
        
        // Update WoW targeting system
        if (this.wowTargetingSystem) {
            // Re-register all entities
            this.creatures.forEach(creature => {
                this.wowTargetingSystem.updateEntity(creature.userData.entityId, {
                    currentHealth: creature.userData.health?.current || 100,
                    position: creature.position
                });
            });
        }
    }
    
    /**
     * Setup sky with realistic atmosphere
     */
    setupSky() {
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);
        
        const sunPosition = new THREE.Vector3().setFromSphericalCoords(
            1, 
            THREE.MathUtils.degToRad(60), 
            THREE.MathUtils.degToRad(180)
        );
        
        const uniforms = this.sky.material.uniforms;
        uniforms.sunPosition.value.copy(sunPosition);
        uniforms.turbidity.value = 4;
        uniforms.rayleigh.value = 1.5;
        uniforms.mieCoefficient.value = 0.005;
        uniforms.mieDirectionalG.value = 0.8;
        
        // Fog for depth
        this.scene.fog = new THREE.FogExp2(0x88bbff, 0.0008);
    }
    
    /**
     * Setup lighting
     */
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xc8d8ff, 0.6);
        this.scene.add(ambient);
        
        // Hemisphere light for sky/ground color
        const hemi = new THREE.HemisphereLight(0x88ccff, 0x886644, 0.5);
        this.scene.add(hemi);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffeedd, 2.0);
        this.sunLight.position.set(100, 150, 100);
        this.sunLight.castShadow = true;
        
        // Shadow settings
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -150;
        this.sunLight.shadow.camera.right = 150;
        this.sunLight.shadow.camera.top = 150;
        this.sunLight.shadow.camera.bottom = -150;
        this.sunLight.shadow.bias = -0.0003;
        
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);
    }
    
    /**
     * Setup terrain with procedural heightmap
     */
    setupTerrain() {
        this.updateTerrainChunks(new THREE.Vector3(0, 0, 0));
    }
    
    /**
     * Create a terrain chunk at grid position
     */
    createTerrainChunk(gridX, gridZ) {
        const segments = 64;
        const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, segments, segments);
        geometry.rotateX(-Math.PI / 2);
        
        // Apply heightmap
        const vertices = geometry.attributes.position.array;
        const colors = [];
        
        for (let i = 0; i < vertices.length; i += 3) {
            const worldX = vertices[i] + gridX * this.chunkSize;
            const worldZ = vertices[i + 2] + gridZ * this.chunkSize;
            
            // Generate height using noise
            const height = this.getTerrainHeight(worldX, worldZ);
            vertices[i + 1] = height;
            
            // Color based on height
            const color = this.getTerrainColor(height);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(gridX * this.chunkSize, 0, gridZ * this.chunkSize);
        mesh.receiveShadow = true;
        mesh.userData = { gridX, gridZ, type: 'terrain' };
        
        this.scene.add(mesh);
        this.terrainChunks.push(mesh);
        
        return mesh;
    }
    
    /**
     * Get terrain height at position
     */
    getTerrainHeight(x, z) {
        // Multi-octave noise for natural terrain
        let height = 0;
        
        // Large rolling hills
        height += Math.sin(x * 0.008) * Math.cos(z * 0.008) * 15;
        height += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 6;
        
        // Medium features
        height += Math.sin(x * 0.05 + 1.5) * Math.sin(z * 0.05 + 0.5) * 3;
        
        // Small details
        height += Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1;
        
        // Flatten area around spawn
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 50) {
            const flattenFactor = 1 - (distFromCenter / 50);
            height *= (1 - flattenFactor * 0.8);
        }
        
        return height;
    }
    
    /**
     * Get terrain color based on height
     */
    getTerrainColor(height) {
        const color = new THREE.Color();
        
        if (height < -2) {
            // Water/mud
            color.setHex(0x4a6741);
        } else if (height < 3) {
            // Grass
            color.setHex(0x5a7a4a);
        } else if (height < 8) {
            // Light grass/dirt
            color.setHex(0x7a8a5a);
        } else if (height < 15) {
            // Rocky/sandy
            color.setHex(0x9a8a6a);
        } else {
            // Snow/peaks
            color.setHex(0xaaaaaa);
        }
        
        // Add variation
        const variation = (Math.random() - 0.5) * 0.1;
        color.r = Math.max(0, Math.min(1, color.r + variation));
        color.g = Math.max(0, Math.min(1, color.g + variation));
        color.b = Math.max(0, Math.min(1, color.b + variation));
        
        return color;
    }
    
    /**
     * Update terrain chunks based on player position
     */
    updateTerrainChunks(playerPos) {
        const playerChunkX = Math.round(playerPos.x / this.chunkSize);
        const playerChunkZ = Math.round(playerPos.z / this.chunkSize);
        
        // Track which chunks we need
        const neededChunks = new Set();
        for (let x = playerChunkX - this.chunksVisible; x <= playerChunkX + this.chunksVisible; x++) {
            for (let z = playerChunkZ - this.chunksVisible; z <= playerChunkZ + this.chunksVisible; z++) {
                neededChunks.add(`${x},${z}`);
            }
        }
        
        // Remove chunks that are too far
        const keepChunks = [];
        for (const chunk of this.terrainChunks) {
            const key = `${chunk.userData.gridX},${chunk.userData.gridZ}`;
            if (neededChunks.has(key)) {
                keepChunks.push(chunk);
                neededChunks.delete(key);
            } else {
                this.scene.remove(chunk);
                chunk.geometry.dispose();
                chunk.material.dispose();
            }
        }
        this.terrainChunks = keepChunks;
        
        // Create new chunks
        neededChunks.forEach(key => {
            const [x, z] = key.split(',').map(Number);
            this.createTerrainChunk(x, z);
        });
    }
    
    /**
     * Setup environment objects (trees, rocks, etc.)
     */
    setupEnvironment() {
        // Add some decorative objects
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 200;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = this.getTerrainHeight(x, z);
            
            if (Math.random() > 0.5) {
                this.createTree(x, height, z);
            } else {
                this.createRock(x, height, z);
            }
        }
        
        // Add crystals for collection
        this.createCollectibles();
    }
    
    /**
     * Create a simple tree
     */
    createTree(x, y, z) {
        const tree = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        trunk.castShadow = true;
        tree.add(trunk);
        
        // Foliage
        const foliageGeo = new THREE.ConeGeometry(2.5, 5, 8);
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.8 });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 6;
        foliage.castShadow = true;
        tree.add(foliage);
        
        tree.position.set(x, y, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        this.scene.add(tree);
    }
    
    /**
     * Create a rock
     */
    createRock(x, y, z) {
        const rockGeo = new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x6a6a6a, 
            roughness: 0.95,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, y + 0.5, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.scale.y = 0.6 + Math.random() * 0.4;
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        this.scene.add(rock);
    }
    
    /**
     * Create collectible crystals
     */
    createCollectibles() {
        this.collectibles = [];
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 150;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = this.getTerrainHeight(x, z) + 1.5;
            
            const crystal = this.createCrystal(x, height, z);
            this.collectibles.push(crystal);
        }
    }
    
    /**
     * Create a glowing crystal
     */
    createCrystal(x, y, z) {
        const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9,
            roughness: 0.2,
            metalness: 0.8
        });
        
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(x, y, z);
        crystal.userData = { 
            type: 'collectible', 
            value: 10,
            collected: false,
            originalY: y
        };
        
        // Add glow light
        const light = new THREE.PointLight(0x00ffff, 1, 5);
        light.position.copy(crystal.position);
        crystal.userData.light = light;
        
        this.scene.add(crystal);
        this.scene.add(light);
        
        return crystal;
    }
    
    /**
     * Spawn NPCs
     */
    spawnNPCs() {
        const npcTypes = [
            { name: 'Villager', color: 0x4466ff, friendly: true, vendor: false, trainer: false },
            { name: 'Trader', color: 0xffaa00, friendly: true, vendor: true, trainer: false },
            { name: 'Guard', color: 0x88ff88, friendly: true, vendor: false, trainer: false },
            { name: 'Marksman Trainer', color: 0x00ff88, friendly: true, vendor: false, trainer: true },
            { name: 'Bandit', color: 0xff4444, friendly: false, vendor: false, trainer: false }
        ];
        
        for (let i = 0; i < 15; i++) {
            const type = npcTypes[Math.floor(Math.random() * npcTypes.length)];
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 100;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = this.getTerrainHeight(x, z);
            
            const npc = this.createNPC(type, x, height, z, i);
            this.npcs.push(npc);
        }
    }
    
    /**
     * Spawn creatures
     */
    spawnCreatures() {
        const creatureTypes = [
            { name: 'Womp Rat', color: 0x8B4513, level: 1, hostile: true, health: 100 },
            { name: 'Dewback', color: 0x556B2F, level: 3, hostile: false, health: 300 },
            { name: 'Ronto', color: 0x8B7355, level: 5, hostile: false, health: 500 },
            { name: 'Tusken Raider', color: 0xC4A484, level: 4, hostile: true, health: 250 }
        ];
        
        for (let i = 0; i < 20; i++) {
            const type = creatureTypes[Math.floor(Math.random() * creatureTypes.length)];
            const angle = Math.random() * Math.PI * 2;
            const radius = 50 + Math.random() * 150;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = this.getTerrainHeight(x, z);
            
            const creature = this.createCreature(type, x, height, z, i);
            this.creatures.push(creature);
        }
    }
    
    /**
     * Create a creature
     */
    createCreature(type, x, y, z, index) {
        const creature = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CapsuleGeometry(0.5, 0.8, 6, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        body.rotation.x = Math.PI / 2;
        body.castShadow = true;
        creature.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 12, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0.7, 0.6);
        head.castShadow = true;
        creature.add(head);
        
        creature.position.set(x, y, z);
        
        const entityId = `creature_${index}_${Date.now()}`;
        creature.userData = {
            entityId,
            type: 'creature',
            name: type.name,
            level: type.level,
            hostile: type.hostile,
            health: { current: type.health, max: type.health },
            dead: false,
            position: { x, y, z },
            wanderAngle: Math.random() * Math.PI * 2,
            wanderTimer: 0
        };
        
        // Register with game state
        gameState.registerEntity(entityId, {
            ...creature.userData,
            mesh: creature
        });
        
        this.scene.add(creature);
        return creature;
    }
    
    /**
     * Spawn resource nodes
     */
    spawnResourceNodes() {
        const nodeTypes = [
            { name: 'Iron Deposit', color: 0x708090, resourceType: 'mineral', icon: '⛏️' },
            { name: 'Crystal Formation', color: 0x00CED1, resourceType: 'mineral', icon: '💎' },
            { name: 'Flora Sample', color: 0x228B22, resourceType: 'organic', icon: '🌿' },
            { name: 'Energy Node', color: 0xFFD700, resourceType: 'energy', icon: '⚡' }
        ];
        
        for (let i = 0; i < 15; i++) {
            const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 180;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const height = this.getTerrainHeight(x, z);
            
            const node = this.createResourceNode(type, x, height, z, i);
            this.resourceNodes.push(node);
        }
    }
    
    /**
     * Create a resource node
     */
    createResourceNode(type, x, y, z, index) {
        const node = new THREE.Group();
        
        // Main rock/crystal
        const geo = type.resourceType === 'mineral' 
            ? new THREE.DodecahedronGeometry(0.8, 0)
            : new THREE.OctahedronGeometry(0.6, 0);
        const mat = new THREE.MeshStandardMaterial({ 
            color: type.color, 
            roughness: 0.4,
            metalness: type.resourceType === 'mineral' ? 0.6 : 0.2,
            emissive: type.color,
            emissiveIntensity: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.5;
        mesh.castShadow = true;
        node.add(mesh);
        
        node.position.set(x, y, z);
        
        const entityId = `resource_${index}_${Date.now()}`;
        node.userData = {
            entityId,
            type: 'resource',
            name: type.name,
            resourceType: type.resourceType,
            position: { x, y, z },
            depleted: false
        };
        
        // Register with game state
        gameState.registerEntity(entityId, {
            ...node.userData,
            mesh: node
        });
        
        this.scene.add(node);
        return node;
    }
    
    /**
     * Create an NPC
     */
    createNPC(type, x, y, z, index) {
        const npc = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.0, 6, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        body.castShadow = true;
        npc.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 12, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.8;
        head.castShadow = true;
        npc.add(head);
        
        npc.position.set(x, y, z);
        
        const entityId = `npc_${index}_${Date.now()}`;
        npc.userData = {
            entityId,
            type: 'npc',
            name: type.name,
            friendly: type.friendly,
            hostile: !type.friendly,
            vendor: type.vendor,
            trainer: type.trainer,
            level: 1 + Math.floor(Math.random() * 5),
            health: { current: 200, max: 200 },
            position: { x, y, z },
            wanderAngle: Math.random() * Math.PI * 2,
            wanderTimer: 0
        };
        
        // Register with game state
        gameState.registerEntity(entityId, {
            ...npc.userData,
            mesh: npc
        });
        
        this.scene.add(npc);
        return npc;
    }
    
    /**
     * Update NPCs
     */
    updateNPCs(delta) {
        const time = performance.now() / 1000;
        
        for (const npc of this.npcs) {
            if (npc.userData.dead) continue;
            
            // Wandering behavior
            npc.userData.wanderTimer += delta;
            
            if (npc.userData.wanderTimer > 3 + Math.random() * 2) {
                npc.userData.wanderTimer = 0;
                npc.userData.wanderAngle += (Math.random() - 0.5) * Math.PI;
            }
            
            // Move in wander direction
            const speed = 0.5;
            const newX = npc.position.x + Math.cos(npc.userData.wanderAngle) * speed * delta;
            const newZ = npc.position.z + Math.sin(npc.userData.wanderAngle) * speed * delta;
            
            // Get terrain height
            const height = this.getTerrainHeight(newX, newZ);
            
            npc.position.x = newX;
            npc.position.z = newZ;
            npc.position.y = height;
            
            // Update position in userData
            npc.userData.position = { x: newX, y: height, z: newZ };
            
            // Face movement direction
            npc.rotation.y = npc.userData.wanderAngle + Math.PI / 2;
            
            // Idle animation (subtle bob)
            npc.children[0].position.y = 1 + Math.sin(time * 3 + npc.position.x) * 0.02;
        }
    }
    
    /**
     * Update creatures
     */
    updateCreatures(delta) {
        const time = performance.now() / 1000;
        
        for (const creature of this.creatures) {
            if (creature.userData.dead) continue;
            
            // Wandering behavior
            creature.userData.wanderTimer += delta;
            
            if (creature.userData.wanderTimer > 4 + Math.random() * 3) {
                creature.userData.wanderTimer = 0;
                creature.userData.wanderAngle += (Math.random() - 0.5) * Math.PI;
            }
            
            // Move in wander direction
            const speed = 0.8;
            const newX = creature.position.x + Math.cos(creature.userData.wanderAngle) * speed * delta;
            const newZ = creature.position.z + Math.sin(creature.userData.wanderAngle) * speed * delta;
            
            // Get terrain height
            const height = this.getTerrainHeight(newX, newZ);
            
            creature.position.x = newX;
            creature.position.z = newZ;
            creature.position.y = height;
            
            // Update position in userData
            creature.userData.position = { x: newX, y: height, z: newZ };
            
            // Face movement direction
            creature.rotation.y = creature.userData.wanderAngle;
            
            // Idle animation (subtle movement)
            creature.children[0].position.y = 0.8 + Math.sin(time * 2 + creature.position.x) * 0.03;
        }
    }
    
    /**
     * Get player position
     */
    getPlayerPosition() {
        if (this.useEnhancedController && this.characterController) {
            return this.characterController.getPosition();
        }
        if (this.playerCollisionMesh) {
            return this.playerCollisionMesh.position.clone();
        }
        return new THREE.Vector3(0, 0, 0);
    }
    
    /**
     * Check collectible collisions
     */
    checkCollectibles() {
        if (!this.collectibles) return;
        if (!this.playerCollisionMesh) return;
        
        const playerPos = this.getPlayerPosition();
        const collectDistance = 2;
        
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const crystal = this.collectibles[i];
            if (crystal.userData.collected) continue;
            
            const dist = playerPos.distanceTo(crystal.position);
            
            if (dist < collectDistance) {
                // Collect!
                crystal.userData.collected = true;
                this.score += crystal.userData.value;
                
                // Remove crystal
                this.scene.remove(crystal);
                if (crystal.userData.light) {
                    this.scene.remove(crystal.userData.light);
                }
                this.collectibles.splice(i, 1);
                
                console.log(`💎 Crystal collected! Score: ${this.score}`);
            }
        }
    }
    
    /**
     * Update collectibles animation
     */
    updateCollectibles(delta) {
        const time = performance.now() / 1000;
        
        for (const crystal of this.collectibles) {
            if (crystal.userData.collected) continue;
            
            // Float animation
            crystal.position.y = crystal.userData.originalY + Math.sin(time * 2 + crystal.position.x) * 0.3;
            crystal.rotation.y += delta * 2;
            
            // Pulse light
            if (crystal.userData.light) {
                crystal.userData.light.intensity = 1 + Math.sin(time * 4) * 0.3;
            }
        }
    }
    
    /**
     * Get player movement input for animation sync
     */
    getPlayerMovementInput() {
        if (this.wowCameraController) {
            return {
                forward: this.wowCameraController.isMoving ? 1 : 0,
                right: 0,
                isRunning: this.wowCameraController.isRunning,
                isJumping: !this.wowCameraController.isGrounded
            };
        }
        return null;
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        
        // Update Enhanced Character Controller (new system)
        if (this.useEnhancedController && this.characterController) {
            // Update controller with terrain height callback
            this.characterController.update(delta, null, (x, z) => this.getTerrainHeight(x, z));
            
            // Get player position
            const playerPos = this.characterController.getPosition();
            
            // Update terrain chunks
            this.updateTerrainChunks(playerPos);
            
            // Update sun position to follow player
            if (this.sunLight) {
                this.sunLight.target.position.copy(playerPos);
            }
            
            // Sync player position to game state
            gameState.updateState(draft => {
                draft.player.position = {
                    x: playerPos.x,
                    y: playerPos.y,
                    z: playerPos.z
                };
            });
        }
        // LEGACY: Update WoW Camera Controller
        else if (this.wowCameraController) {
            // Update movement with terrain height callback
            const movementData = this.wowCameraController.updateMovement(delta);
            
            // Apply terrain height to player
            const terrainHeight = this.getTerrainHeight(
                this.playerCollisionMesh.position.x,
                this.playerCollisionMesh.position.z
            );
            
            // Ground check and positioning
            if (this.playerCollisionMesh.position.y <= terrainHeight + 0.1) {
                this.playerCollisionMesh.position.y = terrainHeight;
                this.wowCameraController.isGrounded = true;
                this.wowCameraController.velocity.y = Math.max(0, this.wowCameraController.velocity.y);
            }
            
            // Update camera
            this.wowCameraController.updateCamera(delta);
            
            // Update terrain chunks
            this.updateTerrainChunks(this.playerCollisionMesh.position);
            
            // Update sun position to follow player
            if (this.sunLight) {
                this.sunLight.target.position.copy(this.playerCollisionMesh.position);
            }
            
            // Sync player position to game state
            gameState.updateState(draft => {
                draft.player.position = {
                    x: this.playerCollisionMesh.position.x,
                    y: this.playerCollisionMesh.position.y,
                    z: this.playerCollisionMesh.position.z
                };
            });
        }
        
        // Update NPCs
        this.updateNPCs(delta);
        
        // Update creatures
        this.updateCreatures(delta);
        
        // Update targeting system
        if (this.targetingSystem) {
            const playerPos = this.getPlayerPosition();
            this.targetingSystem.update(playerPos);
        }
        
        // Update WoW targeting system
        if (this.useWoWControls && this.wowTargetingSystem) {
            const playerPos = this.getPlayerPosition();
            this.wowTargetingSystem.setPlayerPosition(playerPos);
            this.wowTargetingSystem.update(delta);
        }
        
        // Update collectibles
        this.updateCollectibles(delta);
        this.checkCollectibles();
        
        // Update Phase 1 UX systems (floating text, nameplates)
        if (this.uiManager) {
            const playerPos = this.getPlayerPosition();
            this.uiManager.update(delta, playerPos);
        }
        
        // Update Enemy Manager
        if (this.enemyManager) {
            const playerPos = this.getPlayerPosition();
            this.enemyManager.update(delta, playerPos);
        }
        
        // Update Combat System (for damage numbers)
        if (this.combatSystem) {
            this.combatSystem.update(delta);
        }
        
        // Update KayKit character system (legacy, only if not using EnhancedController)
        if (!this.useEnhancedController && this.kayKitCharacter) {
            // Get movement state from WoW controller
            const movementInput = this.getPlayerMovementInput();
            if (movementInput) {
                this.kayKitCharacter.setMovementInput(
                    movementInput.forward,
                    movementInput.right,
                    movementInput.isRunning,
                    movementInput.isJumping
                );
            }
            this.kayKitCharacter.update(delta);
        }
        
        // Send data to callback
        if (this.updateCallback) {
            let callbackData = null;
            
            if (this.useEnhancedController && this.characterController) {
                const pos = this.characterController.getPosition();
                const velocity = this.characterController.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                
                let state = 'idle';
                if (this.characterController.isMovementActive()) {
                    state = this.characterController.isRunning ? 'running' : 'walking';
                }
                if (!this.characterController.onFloor) {
                    state = 'jumping';
                }
                if (this.characterController.isAttacking) {
                    state = 'attacking';
                }
                
                callbackData = {
                    speed: speed * 3.6, // Convert to km/h
                    altitude: pos.y,
                    heading: THREE.MathUtils.radToDeg(this.characterController.cameraYaw) % 360,
                    state: state,
                    score: this.score,
                    isGrounded: this.characterController.onFloor,
                    isRunning: this.characterController.isRunning,
                    character: this.currentCharacterModel,
                    viewMode: this.characterController.viewMode,
                    sdk: 'enhanced-controller'
                };
            } else if (this.wowCameraController) {
                const pos = this.playerCollisionMesh.position;
                const velocity = this.wowCameraController.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                
                let state = 'idle';
                if (this.wowCameraController.isMoving) {
                    state = this.wowCameraController.isRunning ? 'running' : 'walking';
                }
                if (!this.wowCameraController.isGrounded) {
                    state = 'jumping';
                }
                
                callbackData = {
                    speed: speed * 3.6, // Convert to km/h
                    altitude: pos.y,
                    heading: THREE.MathUtils.radToDeg(this.wowCameraController.characterYaw) % 360,
                    state: state,
                    score: this.score,
                    isGrounded: this.wowCameraController.isGrounded,
                    isRunning: this.wowCameraController.isRunning,
                    character: this.currentCharacterModel,
                    sdk: 'wow-kaykit'
                };
            }
            
            if (callbackData) {
                this.updateCallback(callbackData);
            }
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        
        // Clean up WoW Tab handler
        if (this._wowTabHandler) {
            document.removeEventListener('keydown', this._wowTabHandler);
        }
        
        // Clean up KayKit character cycle key handler
        if (this._characterCycleHandler) {
            document.removeEventListener('keydown', this._characterCycleHandler);
        }
        
        // Clean up UI components
        if (this.radialMenu) this.radialMenu.dispose();
        if (this.targetFrame) this.targetFrame.dispose();
        if (this.skillBar) this.skillBar.dispose();
        if (this.chatUI) this.chatUI.dispose();
        if (this.questTracker) this.questTracker.dispose();
        
        // Clean up Phase 1 UX systems
        if (this.uiManager) {
            this.uiManager.destroy();
            this.uiManager = null;
        }
        
        // Clean up Enhanced Character Controller
        if (this.characterController) {
            this.characterController.dispose();
        }
        
        // Clean up KayKit character system (legacy)
        if (this.kayKitCharacter) {
            this.kayKitCharacter.dispose();
        }
        
        // Clean up character model selector
        if (this.characterModelSelector) {
            this.characterModelSelector.dispose();
        }
        
        // Clean up WoW camera controller (legacy)
        if (this.wowCameraController) {
            this.wowCameraController.dispose();
        }
        
        // Clean up player collision mesh (legacy)
        if (this.playerCollisionMesh && this.playerCollisionMesh.geometry) {
            this.scene.remove(this.playerCollisionMesh);
            this.playerCollisionMesh.geometry.dispose();
            this.playerCollisionMesh.material.dispose();
        }
        
        // Clean up targeting system
        if (this.targetingSystem) this.targetingSystem.dispose();
        if (this.wowTargetingSystem) this.wowTargetingSystem.dispose();
        if (this.wowTargetFrame) this.wowTargetFrame.dispose();
        
        // Clean up harvesting system
        if (this.harvestingSystem) this.harvestingSystem.dispose();
        
        // Clean up enemy/combat systems
        if (this.enemyManager) this.enemyManager.dispose();
        if (this.combatSystem) this.combatSystem = null;
        
        // Clean up terrain
        for (const chunk of this.terrainChunks) {
            this.scene.remove(chunk);
            chunk.geometry.dispose();
            chunk.material.dispose();
        }
        
        // Clean up NPCs
        for (const npc of this.npcs) {
            this.scene.remove(npc);
        }
        
        // Clean up creatures
        for (const creature of this.creatures) {
            this.scene.remove(creature);
        }
        
        // Clean up resource nodes
        for (const node of this.resourceNodes) {
            this.scene.remove(node);
        }
        
        // Clean up collectibles
        if (this.collectibles) {
            for (const crystal of this.collectibles) {
                this.scene.remove(crystal);
                if (crystal.userData.light) {
                    this.scene.remove(crystal.userData.light);
                }
            }
        }
        
        // Clean up renderer
        if (this.mountRef.current && this.renderer.domElement && this.renderer.domElement.parentNode === this.mountRef.current) {
            this.mountRef.current.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
        
        console.log('🧹 GroundGameScene cleaned up');
    }
}

export default GroundGameScene;

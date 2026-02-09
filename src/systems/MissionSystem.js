import { gameState } from './GameStateManager.js';
import { professionSystem } from './ProfessionSystem.js';

/**
 * Mission/Quest System
 * Manages active quests, objectives, progress tracking, and rewards
 */
export class MissionSystem {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.failedQuests = [];
        this.maxActiveQuests = 10;
        
        this.setupEventHandlers();
        
        console.log('📜 MissionSystem initialized');
    }
    
    setupEventHandlers() {
        // Quest accepted from dialogue
        gameState.on('questAccepted', (data) => this.addQuest(data.quest));
        
        // Track kills for combat quests
        gameState.on('entityKilled', (data) => this.onEntityKilled(data));
        
        // Track resource gathering
        gameState.on('resourceGathered', (data) => this.onResourceGathered(data));
        
        // Track exploration/discovery
        gameState.on('areaDiscovered', (data) => this.onAreaDiscovered(data));
        
        // Track deliveries
        gameState.on('itemDelivered', (data) => this.onItemDelivered(data));
    }
    
    /**
     * Add a new quest
     */
    addQuest(quest) {
        if (this.activeQuests.length >= this.maxActiveQuests) {
            gameState.emit('chatMessage', {
                type: 'system',
                message: 'Quest log full! Complete some quests first.'
            });
            return false;
        }
        
        // Check if already have this quest
        if (this.activeQuests.find(q => q.id === quest.id)) {
            gameState.emit('chatMessage', {
                type: 'system',
                message: 'You already have this quest.'
            });
            return false;
        }
        
        quest.status = 'active';
        quest.startTime = Date.now();
        quest.progress = 0;
        
        this.activeQuests.push(quest);
        
        // Update game state
        this.syncToGameState();
        
        gameState.emit('questAdded', { quest });
        
        console.log('📜 Quest added:', quest.title);
        return true;
    }
    
    /**
     * Update quest progress
     */
    updateQuestProgress(questId, objectiveIndex, amount) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return;
        
        const objective = quest.objectives[objectiveIndex];
        if (!objective) return;
        
        if (objective.count !== undefined) {
            objective.current = Math.min(objective.current + amount, objective.count);
        } else {
            objective.completed = true;
        }
        
        // Calculate overall progress
        quest.progress = this.calculateQuestProgress(quest);
        
        gameState.emit('questProgress', { 
            quest, 
            objective, 
            objectiveIndex,
            progress: quest.progress 
        });
        
        // Check completion
        if (this.isQuestComplete(quest)) {
            this.completeQuest(quest);
        }
        
        this.syncToGameState();
    }
    
    /**
     * Calculate overall quest progress (0-100)
     */
    calculateQuestProgress(quest) {
        let totalProgress = 0;
        
        quest.objectives.forEach(obj => {
            if (obj.count !== undefined) {
                totalProgress += (obj.current / obj.count) * 100;
            } else {
                totalProgress += obj.completed ? 100 : 0;
            }
        });
        
        return Math.floor(totalProgress / quest.objectives.length);
    }
    
    /**
     * Check if quest is complete
     */
    isQuestComplete(quest) {
        return quest.objectives.every(obj => {
            if (obj.count !== undefined) {
                return obj.current >= obj.count;
            }
            return obj.completed;
        });
    }
    
    /**
     * Complete a quest
     */
    completeQuest(quest) {
        quest.status = 'completed';
        quest.completedTime = Date.now();
        
        // Remove from active
        this.activeQuests = this.activeQuests.filter(q => q.id !== quest.id);
        this.completedQuests.push(quest);
        
        // Give rewards
        this.giveRewards(quest);
        
        gameState.emit('questCompleted', { quest });
        gameState.emit('chatMessage', {
            type: 'system',
            message: `🎉 Quest Complete: ${quest.title}!`
        });
        
        this.syncToGameState();
        
        console.log('✅ Quest completed:', quest.title);
    }
    
    /**
     * Fail a quest
     */
    failQuest(questId, reason = 'Quest failed') {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return;
        
        quest.status = 'failed';
        quest.failedTime = Date.now();
        quest.failReason = reason;
        
        this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
        this.failedQuests.push(quest);
        
        gameState.emit('questFailed', { quest, reason });
        gameState.emit('chatMessage', {
            type: 'system',
            message: `❌ Quest Failed: ${quest.title} - ${reason}`
        });
        
        this.syncToGameState();
    }
    
    /**
     * Abandon a quest
     */
    abandonQuest(questId) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return;
        
        this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
        
        gameState.emit('questAbandoned', { quest });
        gameState.emit('chatMessage', {
            type: 'system',
            message: `Quest abandoned: ${quest.title}`
        });
        
        this.syncToGameState();
    }
    
    /**
     * Give quest rewards
     */
    giveRewards(quest) {
        const rewards = quest.rewards;
        if (!rewards) return;
        
        // Credits
        if (rewards.credits) {
            gameState.updateState(draft => {
                draft.player.credits = (draft.player.credits || 0) + rewards.credits;
            });
            gameState.emit('chatMessage', {
                type: 'system',
                message: `+${rewards.credits} credits`
            });
        }
        
        // XP
        if (rewards.xp) {
            professionSystem.awardXP(rewards.xp.type, rewards.xp.amount);
            gameState.emit('xpGained', rewards.xp);
        }
        
        // Items (future)
        if (rewards.items) {
            rewards.items.forEach(item => {
                gameState.emit('itemReceived', { item });
            });
        }
        
        // Reputation
        if (rewards.reputation && quest.giver) {
            // Would update NPC relationship
        }
    }
    
    /**
     * Handle entity killed (for combat quests)
     */
    onEntityKilled(data) {
        const { entity } = data;
        
        this.activeQuests.forEach((quest, qi) => {
            quest.objectives.forEach((obj, oi) => {
                if (obj.type === 'kill') {
                    // Check if target matches
                    const targetName = obj.target.toLowerCase();
                    const entityName = (entity.name || entity.type || '').toLowerCase();
                    
                    if (entityName.includes(targetName) || targetName.includes(entityName)) {
                        this.updateQuestProgress(quest.id, oi, 1);
                    }
                }
            });
        });
    }
    
    /**
     * Handle resource gathered (for gather quests)
     */
    onResourceGathered(data) {
        const { resourceType, amount } = data;
        
        this.activeQuests.forEach((quest, qi) => {
            quest.objectives.forEach((obj, oi) => {
                if (obj.type === 'gather') {
                    const targetResource = obj.resource.toLowerCase();
                    const gatheredResource = resourceType.toLowerCase();
                    
                    if (gatheredResource.includes(targetResource) || targetResource.includes(gatheredResource)) {
                        this.updateQuestProgress(quest.id, oi, amount);
                    }
                }
            });
        });
    }
    
    /**
     * Handle area discovered (for explore quests)
     */
    onAreaDiscovered(data) {
        const { location } = data;
        
        this.activeQuests.forEach((quest, qi) => {
            quest.objectives.forEach((obj, oi) => {
                if (obj.type === 'discover') {
                    const targetLocation = obj.location.toLowerCase();
                    const discoveredLocation = location.toLowerCase();
                    
                    if (discoveredLocation.includes(targetLocation) || targetLocation.includes(discoveredLocation)) {
                        obj.completed = true;
                        this.updateQuestProgress(quest.id, oi, 1);
                    }
                }
            });
        });
    }
    
    /**
     * Handle item delivered (for delivery quests)
     */
    onItemDelivered(data) {
        const { item, recipient } = data;
        
        this.activeQuests.forEach((quest, qi) => {
            quest.objectives.forEach((obj, oi) => {
                if (obj.type === 'deliver') {
                    const targetRecipient = obj.destination.toLowerCase();
                    const actualRecipient = recipient.toLowerCase();
                    
                    if (actualRecipient.includes(targetRecipient) || targetRecipient.includes(actualRecipient)) {
                        obj.completed = true;
                        this.updateQuestProgress(quest.id, oi, 1);
                    }
                }
            });
        });
    }
    
    /**
     * Check time-limited quests
     */
    checkTimeLimits() {
        const now = Date.now();
        
        this.activeQuests.forEach(quest => {
            if (quest.timeLimit && quest.startTime) {
                const elapsed = (now - quest.startTime) / 1000;
                if (elapsed >= quest.timeLimit) {
                    this.failQuest(quest.id, 'Time limit exceeded');
                }
            }
        });
    }
    
    /**
     * Get active quests
     */
    getActiveQuests() {
        return [...this.activeQuests];
    }
    
    /**
     * Get quest by ID
     */
    getQuest(questId) {
        return this.activeQuests.find(q => q.id === questId) ||
               this.completedQuests.find(q => q.id === questId);
    }
    
    /**
     * Sync to game state
     */
    syncToGameState() {
        gameState.updateState(draft => {
            draft.quests = {
                active: this.activeQuests,
                completed: this.completedQuests,
                failed: this.failedQuests
            };
        });
    }
    
    /**
     * Update (called from game loop)
     */
    update(delta) {
        this.checkTimeLimits();
    }
}

// Singleton
export const missionSystem = new MissionSystem();
export default missionSystem;

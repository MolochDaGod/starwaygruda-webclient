import { gameState } from '../../systems/GameStateManager.js';

/**
 * Quest Tracker UI
 * Shows active quests with progress tracking
 */
export class QuestTracker {
    constructor() {
        this.container = null;
        this.isMinimized = false;
        this.selectedQuest = null;
        
        this.createElements();
        this.setupEventListeners();
        
        console.log('📋 QuestTracker UI initialized');
    }
    
    createElements() {
        this.container = document.createElement('div');
        this.container.id = 'quest-tracker';
        this.container.innerHTML = `
            <style>
                #quest-tracker {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 280px;
                    background: rgba(0, 15, 30, 0.9);
                    border: 2px solid #aa8800;
                    border-radius: 8px;
                    z-index: 950;
                    font-family: 'Arial', sans-serif;
                    box-shadow: 0 0 20px rgba(170, 136, 0, 0.3);
                    transition: all 0.3s;
                }
                
                #quest-tracker.minimized {
                    width: 180px;
                }
                
                #quest-tracker.minimized .quest-list,
                #quest-tracker.minimized .quest-details {
                    display: none;
                }
                
                .quest-tracker-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px;
                    background: rgba(50, 40, 0, 0.8);
                    border-bottom: 1px solid #aa8800;
                    border-radius: 6px 6px 0 0;
                }
                
                .quest-tracker-title {
                    color: #ffcc00;
                    font-weight: bold;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .quest-count {
                    background: rgba(170, 136, 0, 0.3);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                }
                
                .quest-tracker-controls {
                    display: flex;
                    gap: 6px;
                }
                
                .tracker-btn {
                    background: none;
                    border: none;
                    color: #aa8800;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 2px 6px;
                    transition: color 0.2s;
                }
                
                .tracker-btn:hover {
                    color: #ffcc00;
                }
                
                .quest-list {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 8px;
                }
                
                .quest-list::-webkit-scrollbar {
                    width: 5px;
                }
                
                .quest-list::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }
                
                .quest-list::-webkit-scrollbar-thumb {
                    background: #aa8800;
                    border-radius: 3px;
                }
                
                .quest-item {
                    background: rgba(40, 30, 0, 0.5);
                    border: 1px solid #665500;
                    border-radius: 6px;
                    padding: 10px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .quest-item:hover {
                    background: rgba(60, 45, 0, 0.5);
                    border-color: #aa8800;
                }
                
                .quest-item.selected {
                    background: rgba(80, 60, 0, 0.5);
                    border-color: #ffcc00;
                }
                
                .quest-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }
                
                .quest-title {
                    color: #ffcc00;
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .quest-type {
                    background: rgba(0, 0, 0, 0.4);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 9px;
                    color: #888;
                    text-transform: uppercase;
                }
                
                .quest-objective {
                    color: #ccaa66;
                    font-size: 11px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .objective-icon {
                    font-size: 12px;
                }
                
                .quest-progress-bar {
                    height: 6px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                .quest-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #aa8800, #ffcc00);
                    transition: width 0.3s;
                }
                
                .quest-progress-text {
                    color: #888;
                    font-size: 10px;
                    text-align: right;
                    margin-top: 3px;
                }
                
                .no-quests {
                    color: #666;
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                    font-style: italic;
                }
                
                .quest-details {
                    border-top: 1px solid #665500;
                    padding: 10px;
                    background: rgba(30, 20, 0, 0.5);
                    display: none;
                }
                
                .quest-details.visible {
                    display: block;
                }
                
                .quest-details-title {
                    color: #ffcc00;
                    font-weight: bold;
                    font-size: 13px;
                    margin-bottom: 8px;
                }
                
                .quest-details-desc {
                    color: #aa9966;
                    font-size: 11px;
                    line-height: 1.4;
                    margin-bottom: 10px;
                }
                
                .quest-details-section {
                    margin-bottom: 8px;
                }
                
                .quest-details-label {
                    color: #888;
                    font-size: 10px;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                
                .quest-reward {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #88cc88;
                    font-size: 11px;
                }
                
                .quest-reward-icon {
                    font-size: 12px;
                }
                
                .quest-giver {
                    color: #88aacc;
                    font-size: 11px;
                }
                
                .quest-actions {
                    display: flex;
                    gap: 6px;
                    margin-top: 10px;
                }
                
                .quest-action-btn {
                    flex: 1;
                    padding: 6px;
                    border: 1px solid #665500;
                    border-radius: 4px;
                    background: rgba(50, 40, 0, 0.8);
                    color: #ccaa66;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .quest-action-btn:hover {
                    background: rgba(80, 60, 0, 0.8);
                    border-color: #aa8800;
                    color: #ffcc00;
                }
                
                .quest-action-btn.abandon {
                    border-color: #663333;
                    color: #cc6666;
                }
                
                .quest-action-btn.abandon:hover {
                    background: rgba(80, 20, 20, 0.8);
                    border-color: #aa4444;
                    color: #ff6666;
                }
                
                .time-remaining {
                    color: #ff6666;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 4px;
                }
            </style>
            
            <div class="quest-tracker-header">
                <div class="quest-tracker-title">
                    📋 Quests <span class="quest-count" id="quest-count">0</span>
                </div>
                <div class="quest-tracker-controls">
                    <button class="tracker-btn" id="tracker-minimize" title="Minimize">−</button>
                </div>
            </div>
            
            <div class="quest-list" id="quest-list">
                <div class="no-quests">No active quests</div>
            </div>
            
            <div class="quest-details" id="quest-details">
                <div class="quest-details-title" id="detail-title">Quest Title</div>
                <div class="quest-details-desc" id="detail-desc">Description...</div>
                
                <div class="quest-details-section">
                    <div class="quest-details-label">Objectives</div>
                    <div id="detail-objectives"></div>
                </div>
                
                <div class="quest-details-section">
                    <div class="quest-details-label">Rewards</div>
                    <div id="detail-rewards"></div>
                </div>
                
                <div class="quest-details-section">
                    <div class="quest-details-label">Quest Giver</div>
                    <div class="quest-giver" id="detail-giver">Unknown</div>
                </div>
                
                <div class="quest-actions">
                    <button class="quest-action-btn" id="btn-track">Track</button>
                    <button class="quest-action-btn abandon" id="btn-abandon">Abandon</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache elements
        this.questList = this.container.querySelector('#quest-list');
        this.questCount = this.container.querySelector('#quest-count');
        this.questDetails = this.container.querySelector('#quest-details');
    }
    
    setupEventListeners() {
        // Minimize button
        this.container.querySelector('#tracker-minimize').addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // Track button
        this.container.querySelector('#btn-track').addEventListener('click', () => {
            if (this.selectedQuest) {
                this.trackQuest(this.selectedQuest);
            }
        });
        
        // Abandon button
        this.container.querySelector('#btn-abandon').addEventListener('click', () => {
            if (this.selectedQuest) {
                this.abandonQuest(this.selectedQuest);
            }
        });
        
        // Game events
        gameState.on('questAdded', () => this.refresh());
        gameState.on('questProgress', () => this.refresh());
        gameState.on('questCompleted', () => this.refresh());
        gameState.on('questFailed', () => this.refresh());
        gameState.on('questAbandoned', () => this.refresh());
        
        // Initial refresh
        this.refresh();
    }
    
    /**
     * Refresh quest list
     */
    refresh() {
        const state = gameState.getState();
        const quests = state.quests?.active || [];
        
        this.questCount.textContent = quests.length;
        
        if (quests.length === 0) {
            this.questList.innerHTML = '<div class="no-quests">No active quests</div>';
            this.questDetails.classList.remove('visible');
            return;
        }
        
        this.questList.innerHTML = '';
        
        quests.forEach(quest => {
            const item = this.createQuestItem(quest);
            this.questList.appendChild(item);
        });
        
        // Update selected quest details
        if (this.selectedQuest) {
            const updatedQuest = quests.find(q => q.id === this.selectedQuest.id);
            if (updatedQuest) {
                this.showQuestDetails(updatedQuest);
            } else {
                this.selectedQuest = null;
                this.questDetails.classList.remove('visible');
            }
        }
    }
    
    /**
     * Create quest item element
     */
    createQuestItem(quest) {
        const item = document.createElement('div');
        item.className = `quest-item ${this.selectedQuest?.id === quest.id ? 'selected' : ''}`;
        item.dataset.questId = quest.id;
        
        const objective = quest.objectives[0];
        const objText = this.getObjectiveText(objective);
        const objIcon = this.getObjectiveIcon(objective);
        
        item.innerHTML = `
            <div class="quest-item-header">
                <div class="quest-title">${quest.title}</div>
                <div class="quest-type">${quest.type}</div>
            </div>
            <div class="quest-objective">
                <span class="objective-icon">${objIcon}</span>
                ${objText}
            </div>
            <div class="quest-progress-bar">
                <div class="quest-progress-fill" style="width: ${quest.progress || 0}%"></div>
            </div>
            <div class="quest-progress-text">${quest.progress || 0}%</div>
            ${quest.timeLimit ? this.getTimeRemainingHTML(quest) : ''}
        `;
        
        item.addEventListener('click', () => {
            this.selectQuest(quest);
        });
        
        return item;
    }
    
    /**
     * Get objective text
     */
    getObjectiveText(objective) {
        if (!objective) return 'Complete objectives';
        
        switch (objective.type) {
            case 'kill':
                return `Kill ${objective.target}: ${objective.current || 0}/${objective.count}`;
            case 'gather':
                return `Gather ${objective.resource}: ${objective.current || 0}/${objective.count}`;
            case 'deliver':
                return `Deliver to ${objective.destination}`;
            case 'discover':
                return `Discover ${objective.location}`;
            default:
                return 'Complete objective';
        }
    }
    
    /**
     * Get objective icon
     */
    getObjectiveIcon(objective) {
        if (!objective) return '📌';
        
        switch (objective.type) {
            case 'kill': return '⚔️';
            case 'gather': return '🎒';
            case 'deliver': return '📦';
            case 'discover': return '🔍';
            default: return '📌';
        }
    }
    
    /**
     * Get time remaining HTML
     */
    getTimeRemainingHTML(quest) {
        const elapsed = (Date.now() - quest.startTime) / 1000;
        const remaining = Math.max(0, quest.timeLimit - elapsed);
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        
        return `<div class="time-remaining">⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}</div>`;
    }
    
    /**
     * Select a quest
     */
    selectQuest(quest) {
        this.selectedQuest = quest;
        this.refresh();
        this.showQuestDetails(quest);
    }
    
    /**
     * Show quest details
     */
    showQuestDetails(quest) {
        this.container.querySelector('#detail-title').textContent = quest.title;
        this.container.querySelector('#detail-desc').textContent = quest.description;
        this.container.querySelector('#detail-giver').textContent = quest.giver || 'Unknown';
        
        // Objectives
        const objContainer = this.container.querySelector('#detail-objectives');
        objContainer.innerHTML = '';
        quest.objectives.forEach(obj => {
            const objEl = document.createElement('div');
            objEl.className = 'quest-objective';
            objEl.innerHTML = `
                <span class="objective-icon">${this.getObjectiveIcon(obj)}</span>
                ${this.getObjectiveText(obj)}
            `;
            objContainer.appendChild(objEl);
        });
        
        // Rewards
        const rewardContainer = this.container.querySelector('#detail-rewards');
        rewardContainer.innerHTML = '';
        if (quest.rewards) {
            if (quest.rewards.credits) {
                rewardContainer.innerHTML += `
                    <div class="quest-reward">
                        <span class="quest-reward-icon">💰</span>
                        ${quest.rewards.credits} credits
                    </div>
                `;
            }
            if (quest.rewards.xp) {
                rewardContainer.innerHTML += `
                    <div class="quest-reward">
                        <span class="quest-reward-icon">⭐</span>
                        ${quest.rewards.xp.amount} ${quest.rewards.xp.type} XP
                    </div>
                `;
            }
        }
        
        this.questDetails.classList.add('visible');
    }
    
    /**
     * Track quest (set as primary)
     */
    trackQuest(quest) {
        gameState.emit('chatMessage', {
            type: 'system',
            message: `Now tracking: ${quest.title}`
        });
    }
    
    /**
     * Abandon quest
     */
    abandonQuest(quest) {
        if (confirm(`Abandon quest "${quest.title}"?`)) {
            gameState.emit('questAbandoned', { quest });
            this.selectedQuest = null;
            this.questDetails.classList.remove('visible');
        }
    }
    
    /**
     * Toggle minimize
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized', this.isMinimized);
    }
    
    /**
     * Dispose
     */
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default QuestTracker;

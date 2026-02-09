import { gameState } from '../../systems/GameStateManager.js';

/**
 * SWG-Style Target Frame UI
 * Shows player and target health/action/mind bars
 */
export class TargetFrame {
    constructor() {
        this.container = null;
        this.playerFrame = null;
        this.targetFrame = null;
        
        // Colors matching SWG
        this.barColors = {
            health: { fill: '#cc2222', bg: '#441111' },
            action: { fill: '#22cc22', bg: '#114411' },
            mind: { fill: '#2222cc', bg: '#111144' }
        };
        
        this.createElements();
        this.setupEventListeners();
        
        console.log('🎯 TargetFrame UI initialized');
    }
    
    createElements() {
        this.container = document.createElement('div');
        this.container.id = 'target-frames';
        this.container.innerHTML = `
            <style>
                #target-frames {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 1000;
                    font-family: 'Arial', sans-serif;
                }
                
                .unit-frame {
                    background: linear-gradient(180deg, rgba(0,30,60,0.95) 0%, rgba(0,15,30,0.95) 100%);
                    border: 2px solid #00aaaa;
                    border-radius: 5px;
                    padding: 8px;
                    min-width: 220px;
                    box-shadow: 0 0 15px rgba(0,150,150,0.3), inset 0 0 10px rgba(0,0,0,0.5);
                }
                
                .unit-frame.target-frame {
                    border-color: #aa6600;
                    box-shadow: 0 0 15px rgba(150,100,0,0.3), inset 0 0 10px rgba(0,0,0,0.5);
                }
                
                .unit-frame.hostile {
                    border-color: #cc2222;
                    box-shadow: 0 0 15px rgba(200,0,0,0.4), inset 0 0 10px rgba(0,0,0,0.5);
                }
                
                .unit-frame-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }
                
                .unit-name {
                    color: #00ffff;
                    font-size: 13px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                }
                
                .target-frame .unit-name {
                    color: #ffaa00;
                }
                
                .hostile .unit-name {
                    color: #ff4444;
                }
                
                .unit-level {
                    color: #aaaaaa;
                    font-size: 11px;
                }
                
                .ham-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                
                .ham-bar {
                    height: 14px;
                    background: #111;
                    border: 1px solid #333;
                    border-radius: 2px;
                    overflow: hidden;
                    position: relative;
                }
                
                .ham-bar-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                
                .ham-bar-health .ham-bar-fill {
                    background: linear-gradient(180deg, #ff4444 0%, #cc2222 50%, #991111 100%);
                }
                
                .ham-bar-action .ham-bar-fill {
                    background: linear-gradient(180deg, #44ff44 0%, #22cc22 50%, #119911 100%);
                }
                
                .ham-bar-mind .ham-bar-fill {
                    background: linear-gradient(180deg, #4444ff 0%, #2222cc 50%, #111199 100%);
                }
                
                .ham-bar-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #ffffff;
                    font-size: 9px;
                    font-weight: bold;
                    text-shadow: 1px 1px 1px rgba(0,0,0,0.9);
                }
                
                .target-actions {
                    display: flex;
                    gap: 5px;
                    margin-top: 6px;
                }
                
                .target-action-btn {
                    padding: 3px 8px;
                    background: rgba(0,100,100,0.5);
                    border: 1px solid #00aaaa;
                    border-radius: 3px;
                    color: #00ffff;
                    font-size: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .target-action-btn:hover {
                    background: rgba(0,150,150,0.5);
                }
                
                .target-action-btn.attack {
                    border-color: #cc2222;
                    color: #ff4444;
                }
                
                .target-action-btn.attack:hover {
                    background: rgba(150,0,0,0.5);
                }
                
                .target-distance {
                    color: #888;
                    font-size: 10px;
                    margin-top: 4px;
                }
                
                .combat-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #ff4444;
                    border-radius: 50%;
                    margin-right: 5px;
                    animation: pulse 1s ease infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                #target-unit-frame {
                    display: none;
                }
                
                #target-unit-frame.visible {
                    display: block;
                }
            </style>
            
            <!-- Player Frame -->
            <div id="player-unit-frame" class="unit-frame">
                <div class="unit-frame-header">
                    <span class="unit-name"><span id="player-combat-indicator" class="combat-indicator" style="display:none;"></span><span id="player-name">Player</span></span>
                    <span class="unit-level">Lv <span id="player-level">1</span></span>
                </div>
                <div class="ham-bars">
                    <div class="ham-bar ham-bar-health">
                        <div class="ham-bar-fill" id="player-health-bar" style="width: 100%"></div>
                        <span class="ham-bar-text" id="player-health-text">1000/1000</span>
                    </div>
                    <div class="ham-bar ham-bar-action">
                        <div class="ham-bar-fill" id="player-action-bar" style="width: 100%"></div>
                        <span class="ham-bar-text" id="player-action-text">1000/1000</span>
                    </div>
                    <div class="ham-bar ham-bar-mind">
                        <div class="ham-bar-fill" id="player-mind-bar" style="width: 100%"></div>
                        <span class="ham-bar-text" id="player-mind-text">1000/1000</span>
                    </div>
                </div>
            </div>
            
            <!-- Target Frame -->
            <div id="target-unit-frame" class="unit-frame target-frame">
                <div class="unit-frame-header">
                    <span class="unit-name"><span id="target-name">Target</span></span>
                    <span class="unit-level">Lv <span id="target-level">1</span></span>
                </div>
                <div class="ham-bars">
                    <div class="ham-bar ham-bar-health">
                        <div class="ham-bar-fill" id="target-health-bar" style="width: 100%"></div>
                        <span class="ham-bar-text" id="target-health-text">???/???</span>
                    </div>
                </div>
                <div class="target-distance" id="target-distance">Distance: --m</div>
                <div class="target-actions">
                    <button class="target-action-btn attack" id="btn-attack">Attack</button>
                    <button class="target-action-btn" id="btn-examine">Examine</button>
                    <button class="target-action-btn" id="btn-clear">Clear</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache DOM references
        this.playerFrame = document.getElementById('player-unit-frame');
        this.targetFrame = document.getElementById('target-unit-frame');
        
        // Setup button handlers
        document.getElementById('btn-attack').addEventListener('click', () => this.attackTarget());
        document.getElementById('btn-examine').addEventListener('click', () => this.examineTarget());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearTarget());
    }
    
    setupEventListeners() {
        // Update player stats
        gameState.on('playerUpdate', (player) => this.updatePlayerFrame(player));
        gameState.on('stateChange', () => this.updateFromState());
        
        // Update target
        gameState.on('targetChange', (data) => this.updateTargetFrame(data));
        gameState.on('targetCleared', () => this.hideTargetFrame());
        
        // Combat state
        gameState.on('combatEnter', () => this.showCombatIndicator(true));
        gameState.on('combatExit', () => this.showCombatIndicator(false));
        
        // Initial update
        this.updateFromState();
    }
    
    updateFromState() {
        const state = gameState.getState();
        
        // Update player
        if (state.player) {
            this.updatePlayerFrame(state.player);
        }
        
        // Update target
        if (state.target) {
            const target = gameState.getEntity(state.target);
            if (target) {
                this.updateTargetFrame({ target });
            }
        } else {
            this.hideTargetFrame();
        }
        
        // Combat indicator
        this.showCombatIndicator(state.combat?.inCombat || false);
    }
    
    updatePlayerFrame(player) {
        if (!player) return;
        
        const ham = player.ham || { health: { current: 1000, max: 1000 }, action: { current: 1000, max: 1000 }, mind: { current: 1000, max: 1000 } };
        
        // Update name/level
        const nameEl = document.getElementById('player-name');
        const levelEl = document.getElementById('player-level');
        if (nameEl) nameEl.textContent = player.name || 'Player';
        if (levelEl) levelEl.textContent = player.level || 1;
        
        // Update health bar
        this.updateBar('player-health', ham.health.current, ham.health.max);
        this.updateBar('player-action', ham.action.current, ham.action.max);
        this.updateBar('player-mind', ham.mind.current, ham.mind.max);
    }
    
    updateTargetFrame(data) {
        const target = data.target;
        if (!target) {
            this.hideTargetFrame();
            return;
        }
        
        // Show frame
        this.targetFrame.classList.add('visible');
        
        // Check if hostile
        if (target.hostile || target.faction === 'enemy') {
            this.targetFrame.classList.add('hostile');
        } else {
            this.targetFrame.classList.remove('hostile');
        }
        
        // Update name/level
        document.getElementById('target-name').textContent = target.name || 'Unknown';
        document.getElementById('target-level').textContent = target.level || '?';
        
        // Update health
        const health = target.health || target.ham?.health || { current: 100, max: 100 };
        this.updateBar('target-health', health.current, health.max);
        
        // Update distance
        const distance = data.distance || this.calculateDistance(target);
        document.getElementById('target-distance').textContent = `Distance: ${Math.round(distance)}m`;
    }
    
    hideTargetFrame() {
        this.targetFrame.classList.remove('visible');
        this.targetFrame.classList.remove('hostile');
    }
    
    updateBar(prefix, current, max) {
        const barEl = document.getElementById(`${prefix}-bar`);
        const textEl = document.getElementById(`${prefix}-text`);
        
        if (barEl) {
            const percent = Math.max(0, Math.min(100, (current / max) * 100));
            barEl.style.width = `${percent}%`;
        }
        
        if (textEl) {
            textEl.textContent = `${Math.round(current)}/${Math.round(max)}`;
        }
    }
    
    showCombatIndicator(show) {
        const indicator = document.getElementById('player-combat-indicator');
        if (indicator) {
            indicator.style.display = show ? 'inline-block' : 'none';
        }
    }
    
    calculateDistance(target) {
        // Get player position from state if available
        const state = gameState.getState();
        if (state.player?.position && target.position) {
            const dx = target.position.x - state.player.position.x;
            const dy = target.position.y - state.player.position.y;
            const dz = target.position.z - state.player.position.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        return 0;
    }
    
    attackTarget() {
        const state = gameState.getState();
        if (state.target) {
            gameState.emit('attack', { targetId: state.target });
        }
    }
    
    examineTarget() {
        const state = gameState.getState();
        if (state.target) {
            const target = gameState.getEntity(state.target);
            gameState.emit('examine', { target });
        }
    }
    
    clearTarget() {
        gameState.clearTarget();
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default TargetFrame;

import { gameState } from '../../systems/GameStateManager.js';

/**
 * MMO-Style Chat UI
 * Features: Multiple channels, emotes, NPC dialogue, system messages
 */

// Chat channels
const CHANNELS = {
    general: { name: 'General', color: '#ffffff', prefix: '[General]' },
    local: { name: 'Local', color: '#aaddff', prefix: '[Local]' },
    combat: { name: 'Combat', color: '#ff6666', prefix: '[Combat]' },
    system: { name: 'System', color: '#ffcc00', prefix: '[System]' },
    npc: { name: 'NPC', color: '#88ff88', prefix: '' },
    emote: { name: 'Emote', color: '#ff88ff', prefix: '' },
    group: { name: 'Group', color: '#66ccff', prefix: '[Group]' },
    whisper: { name: 'Whisper', color: '#cc88ff', prefix: '[Whisper]' }
};

// Emote commands
const EMOTES = {
    '/wave': '{player} waves.',
    '/bow': '{player} bows respectfully.',
    '/dance': '{player} starts dancing!',
    '/cheer': '{player} cheers enthusiastically!',
    '/laugh': '{player} laughs heartily.',
    '/cry': '{player} cries.',
    '/salute': '{player} salutes.',
    '/sit': '{player} sits down.',
    '/stand': '{player} stands up.',
    '/clap': '{player} claps.',
    '/point': '{player} points.',
    '/shrug': '{player} shrugs.',
    '/nod': '{player} nods.',
    '/shake': '{player} shakes their head.',
    '/think': '{player} appears lost in thought.',
    '/flex': '{player} flexes their muscles!',
    '/meditate': '{player} begins meditating...'
};

export class ChatUI {
    constructor() {
        this.container = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.isOpen = true;
        this.isMinimized = false;
        this.messages = [];
        this.maxMessages = 100;
        this.activeChannel = 'general';
        this.channelFilters = new Set(['general', 'local', 'combat', 'system', 'npc', 'emote']);
        
        this.createElements();
        this.setupEventListeners();
        this.setupGameEvents();
        
        // Welcome message
        this.addMessage('system', 'Welcome to StarWayGRUDA! Press Enter to chat.');
        this.addMessage('system', 'Type /help for commands.');
        
        console.log('💬 ChatUI initialized');
    }
    
    createElements() {
        this.container = document.createElement('div');
        this.container.id = 'chat-ui';
        this.container.innerHTML = `
            <style>
                #chat-ui {
                    position: fixed;
                    bottom: 90px;
                    left: 10px;
                    width: 400px;
                    height: 300px;
                    background: rgba(0, 15, 30, 0.9);
                    border: 2px solid #00aaaa;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    z-index: 900;
                    font-family: 'Arial', sans-serif;
                    transition: all 0.3s;
                    box-shadow: 0 0 20px rgba(0, 150, 150, 0.3);
                }
                
                #chat-ui.minimized {
                    height: 40px;
                    overflow: hidden;
                }
                
                #chat-ui.focused {
                    border-color: #00ffff;
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
                }
                
                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: rgba(0, 50, 80, 0.8);
                    border-bottom: 1px solid #00aaaa;
                    border-radius: 6px 6px 0 0;
                    cursor: move;
                }
                
                .chat-title {
                    color: #00ffff;
                    font-weight: bold;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .chat-title-icon {
                    font-size: 14px;
                }
                
                .chat-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .chat-control-btn {
                    background: none;
                    border: none;
                    color: #00aaaa;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 2px 6px;
                    transition: color 0.2s;
                }
                
                .chat-control-btn:hover {
                    color: #00ffff;
                }
                
                .chat-channels {
                    display: flex;
                    gap: 4px;
                    padding: 6px 8px;
                    background: rgba(0, 30, 50, 0.5);
                    border-bottom: 1px solid #1a3a4a;
                    flex-wrap: wrap;
                }
                
                .channel-tab {
                    padding: 3px 8px;
                    background: rgba(0, 50, 80, 0.5);
                    border: 1px solid #1a4a5a;
                    border-radius: 4px;
                    color: #88aacc;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .channel-tab:hover {
                    background: rgba(0, 100, 120, 0.5);
                    color: #aaccee;
                }
                
                .channel-tab.active {
                    background: rgba(0, 150, 150, 0.5);
                    border-color: #00aaaa;
                    color: #00ffff;
                }
                
                .channel-tab.filtered-out {
                    opacity: 0.4;
                }
                
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .chat-messages::-webkit-scrollbar {
                    width: 6px;
                }
                
                .chat-messages::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }
                
                .chat-messages::-webkit-scrollbar-thumb {
                    background: #00aaaa;
                    border-radius: 3px;
                }
                
                .chat-message {
                    font-size: 12px;
                    line-height: 1.4;
                    padding: 3px 0;
                    word-wrap: break-word;
                }
                
                .chat-message .timestamp {
                    color: #666;
                    font-size: 10px;
                    margin-right: 6px;
                }
                
                .chat-message .prefix {
                    font-weight: bold;
                    margin-right: 4px;
                }
                
                .chat-message .sender {
                    font-weight: bold;
                    margin-right: 4px;
                }
                
                .chat-message.system {
                    color: #ffcc00;
                    font-style: italic;
                }
                
                .chat-message.combat {
                    color: #ff6666;
                }
                
                .chat-message.npc {
                    color: #88ff88;
                    background: rgba(0, 80, 0, 0.2);
                    padding: 4px 8px;
                    border-radius: 4px;
                    border-left: 3px solid #44aa44;
                }
                
                .chat-message.emote {
                    color: #ff88ff;
                    font-style: italic;
                }
                
                .chat-message.whisper {
                    color: #cc88ff;
                    background: rgba(80, 0, 80, 0.2);
                    padding: 2px 6px;
                    border-radius: 3px;
                }
                
                .chat-input-area {
                    display: flex;
                    gap: 8px;
                    padding: 8px;
                    background: rgba(0, 30, 50, 0.5);
                    border-top: 1px solid #1a3a4a;
                    border-radius: 0 0 6px 6px;
                }
                
                .chat-channel-select {
                    background: rgba(0, 50, 80, 0.8);
                    border: 1px solid #00aaaa;
                    border-radius: 4px;
                    color: #00ffff;
                    padding: 6px 10px;
                    font-size: 11px;
                    cursor: pointer;
                    min-width: 80px;
                }
                
                .chat-input {
                    flex: 1;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid #1a4a5a;
                    border-radius: 4px;
                    color: #ffffff;
                    padding: 6px 10px;
                    font-size: 12px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                .chat-input:focus {
                    border-color: #00ffff;
                }
                
                .chat-input::placeholder {
                    color: #446688;
                }
                
                .chat-send-btn {
                    background: linear-gradient(180deg, #00aaaa, #006666);
                    border: 1px solid #00cccc;
                    border-radius: 4px;
                    color: white;
                    padding: 6px 15px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .chat-send-btn:hover {
                    background: linear-gradient(180deg, #00cccc, #008888);
                }
                
                /* NPC Dialogue overlay */
                .npc-dialogue-bubble {
                    position: absolute;
                    bottom: 100%;
                    left: 10px;
                    right: 10px;
                    background: rgba(0, 40, 20, 0.95);
                    border: 2px solid #44aa44;
                    border-radius: 12px;
                    padding: 15px;
                    margin-bottom: 10px;
                    display: none;
                    box-shadow: 0 0 20px rgba(68, 170, 68, 0.4);
                }
                
                .npc-dialogue-bubble.visible {
                    display: block;
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .npc-dialogue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .npc-dialogue-name {
                    color: #88ff88;
                    font-weight: bold;
                    font-size: 14px;
                }
                
                .npc-dialogue-personality {
                    color: #668866;
                    font-size: 11px;
                    font-style: italic;
                }
                
                .npc-dialogue-text {
                    color: #ccffcc;
                    font-size: 13px;
                    line-height: 1.5;
                    margin-bottom: 12px;
                }
                
                .npc-dialogue-options {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .dialogue-option {
                    background: rgba(0, 60, 30, 0.8);
                    border: 1px solid #44aa44;
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: #aaffaa;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }
                
                .dialogue-option:hover {
                    background: rgba(0, 100, 50, 0.8);
                    border-color: #66cc66;
                    color: #ffffff;
                }
                
                .dialogue-option::before {
                    content: '▸ ';
                    color: #44aa44;
                }
            </style>
            
            <div class="npc-dialogue-bubble" id="npc-dialogue">
                <div class="npc-dialogue-header">
                    <span class="npc-dialogue-name" id="dialogue-npc-name">NPC Name</span>
                    <span class="npc-dialogue-personality" id="dialogue-personality">friendly</span>
                </div>
                <div class="npc-dialogue-text" id="dialogue-text">Dialogue text here...</div>
                <div class="npc-dialogue-options" id="dialogue-options"></div>
            </div>
            
            <div class="chat-header">
                <div class="chat-title">
                    <span class="chat-title-icon">💬</span>
                    Chat
                </div>
                <div class="chat-controls">
                    <button class="chat-control-btn" id="chat-minimize" title="Minimize">−</button>
                    <button class="chat-control-btn" id="chat-settings" title="Settings">⚙</button>
                </div>
            </div>
            
            <div class="chat-channels" id="chat-channels"></div>
            
            <div class="chat-messages" id="chat-messages"></div>
            
            <div class="chat-input-area">
                <select class="chat-channel-select" id="channel-select">
                    <option value="general">General</option>
                    <option value="local">Local</option>
                    <option value="group">Group</option>
                </select>
                <input type="text" class="chat-input" id="chat-input" placeholder="Press Enter to chat..." maxlength="200">
                <button class="chat-send-btn" id="chat-send">Send</button>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache elements
        this.messagesContainer = this.container.querySelector('#chat-messages');
        this.inputField = this.container.querySelector('#chat-input');
        this.channelSelect = this.container.querySelector('#channel-select');
        this.dialogueBubble = this.container.querySelector('#npc-dialogue');
        
        // Build channel tabs
        this.buildChannelTabs();
    }
    
    buildChannelTabs() {
        const channelsContainer = this.container.querySelector('#chat-channels');
        channelsContainer.innerHTML = '';
        
        Object.entries(CHANNELS).forEach(([key, channel]) => {
            const tab = document.createElement('div');
            tab.className = `channel-tab ${this.channelFilters.has(key) ? '' : 'filtered-out'} ${this.activeChannel === key ? 'active' : ''}`;
            tab.textContent = channel.name;
            tab.dataset.channel = key;
            
            tab.addEventListener('click', () => this.toggleChannelFilter(key));
            tab.addEventListener('dblclick', () => this.setActiveChannel(key));
            
            channelsContainer.appendChild(tab);
        });
    }
    
    setupEventListeners() {
        // Input field
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
            e.stopPropagation(); // Prevent game controls
        });
        
        this.inputField.addEventListener('focus', () => {
            this.container.classList.add('focused');
        });
        
        this.inputField.addEventListener('blur', () => {
            this.container.classList.remove('focused');
        });
        
        // Send button
        this.container.querySelector('#chat-send').addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Minimize button
        this.container.querySelector('#chat-minimize').addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // Channel select
        this.channelSelect.addEventListener('change', (e) => {
            this.activeChannel = e.target.value;
        });
        
        // Global enter key to focus chat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement !== this.inputField) {
                if (!this.isMinimized) {
                    this.inputField.focus();
                }
            }
        });
    }
    
    setupGameEvents() {
        // System messages
        gameState.on('chatMessage', (data) => {
            this.addMessage(data.type || 'system', data.message, data.sender);
        });
        
        // Quest events
        gameState.on('questAccepted', (data) => {
            this.addMessage('system', `Quest accepted: ${data.quest.title}`);
        });
        
        gameState.on('questCompleted', (data) => {
            this.addMessage('system', `Quest completed: ${data.quest.title}! Rewards received.`);
        });
        
        // Combat messages
        gameState.on('abilityUsed', (data) => {
            this.addMessage('combat', `You use ${data.ability.name}!`);
        });
        
        // Dialogue events
        gameState.on('dialogueStart', (data) => {
            this.showDialogue(data);
        });
        
        gameState.on('dialogueResponse', (data) => {
            this.updateDialogue(data);
        });
        
        gameState.on('dialogueEnd', () => {
            this.hideDialogue();
        });
        
        // Emotes
        gameState.on('emote', (data) => {
            this.performEmote(data.emote);
        });
        
        // Level up
        gameState.on('levelUp', (data) => {
            this.addMessage('system', `🎉 Congratulations! You reached level ${data.newLevel}!`);
        });
        
        // XP gain
        gameState.on('xpGained', (data) => {
            this.addMessage('system', `+${data.amount} ${data.type} XP`);
        });
    }
    
    /**
     * Add a message to chat
     */
    addMessage(channel, text, sender = null) {
        // Check if channel is filtered
        if (!this.channelFilters.has(channel) && channel !== 'system') {
            return;
        }
        
        const channelInfo = CHANNELS[channel] || CHANNELS.general;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const message = {
            channel,
            text,
            sender,
            timestamp,
            id: Date.now()
        };
        
        this.messages.push(message);
        
        // Trim old messages
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }
        
        // Create message element
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${channel}`;
        
        let html = `<span class="timestamp">${timestamp}</span>`;
        
        if (channelInfo.prefix) {
            html += `<span class="prefix" style="color: ${channelInfo.color}">${channelInfo.prefix}</span>`;
        }
        
        if (sender) {
            html += `<span class="sender" style="color: ${channelInfo.color}">${sender}:</span>`;
        }
        
        html += `<span class="text" style="color: ${channelInfo.color}">${this.formatMessage(text)}</span>`;
        
        msgEl.innerHTML = html;
        this.messagesContainer.appendChild(msgEl);
        
        // Auto-scroll
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        return message;
    }
    
    /**
     * Format message with links, emotes, etc.
     */
    formatMessage(text) {
        // Escape HTML
        text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Bold text **text**
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Item links [Item Name]
        text = text.replace(/\[(.+?)\]/g, '<span style="color: #00ff00; cursor: pointer;">[$1]</span>');
        
        return text;
    }
    
    /**
     * Send a message
     */
    sendMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;
        
        this.inputField.value = '';
        
        // Check for commands
        if (text.startsWith('/')) {
            this.handleCommand(text);
            return;
        }
        
        // Send to appropriate channel
        const playerName = gameState.getState().player?.name || 'Player';
        this.addMessage(this.activeChannel, text, playerName);
        
        // Emit for multiplayer (future)
        gameState.emit('playerChat', {
            channel: this.activeChannel,
            message: text
        });
    }
    
    /**
     * Handle chat commands
     */
    handleCommand(text) {
        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Check emotes
        if (EMOTES[command]) {
            this.performEmote(command.substring(1));
            return;
        }
        
        switch (command) {
            case '/help':
                this.showHelp();
                break;
                
            case '/say':
            case '/s':
                this.addMessage('local', args.join(' '), gameState.getState().player?.name || 'Player');
                break;
                
            case '/yell':
            case '/y':
                this.addMessage('general', args.join(' ').toUpperCase(), gameState.getState().player?.name || 'Player');
                break;
                
            case '/whisper':
            case '/w':
            case '/tell':
                const target = args[0];
                const msg = args.slice(1).join(' ');
                this.addMessage('whisper', `To ${target}: ${msg}`);
                break;
                
            case '/clear':
                this.clearChat();
                break;
                
            case '/time':
                this.addMessage('system', `Current time: ${new Date().toLocaleString()}`);
                break;
                
            case '/pos':
            case '/loc':
                const pos = gameState.getState().player?.position;
                if (pos) {
                    this.addMessage('system', `Location: X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`);
                }
                break;
                
            case '/stats':
                this.showStats();
                break;
                
            case '/quests':
                this.showQuests();
                break;
                
            default:
                this.addMessage('system', `Unknown command: ${command}. Type /help for commands.`);
        }
    }
    
    /**
     * Show help
     */
    showHelp() {
        this.addMessage('system', '=== Chat Commands ===');
        this.addMessage('system', '/help - Show this help');
        this.addMessage('system', '/say, /s - Local chat');
        this.addMessage('system', '/yell, /y - Yell (caps)');
        this.addMessage('system', '/whisper, /w [name] - Private message');
        this.addMessage('system', '/clear - Clear chat');
        this.addMessage('system', '/pos, /loc - Show position');
        this.addMessage('system', '/stats - Show your stats');
        this.addMessage('system', '/quests - List active quests');
        this.addMessage('system', '=== Emotes ===');
        this.addMessage('system', '/wave, /bow, /dance, /cheer, /laugh, /salute, /sit, /meditate');
    }
    
    /**
     * Perform an emote
     */
    performEmote(emoteName) {
        const emoteKey = `/${emoteName}`;
        const template = EMOTES[emoteKey];
        
        if (template) {
            const playerName = gameState.getState().player?.name || 'Player';
            const text = template.replace('{player}', playerName);
            this.addMessage('emote', text);
            
            // Trigger emote animation
            gameState.emit('playerAction', { action: emoteName });
        } else {
            this.addMessage('system', `Unknown emote: ${emoteName}`);
        }
    }
    
    /**
     * Show player stats
     */
    showStats() {
        const state = gameState.getState();
        const player = state.player;
        
        this.addMessage('system', '=== Your Stats ===');
        this.addMessage('system', `Level: ${player?.level || 1}`);
        this.addMessage('system', `Health: ${player?.ham?.health?.current || 0}/${player?.ham?.health?.max || 0}`);
        this.addMessage('system', `Action: ${player?.ham?.action?.current || 0}/${player?.ham?.action?.max || 0}`);
        this.addMessage('system', `Mind: ${player?.ham?.mind?.current || 0}/${player?.ham?.mind?.max || 0}`);
    }
    
    /**
     * Show active quests
     */
    showQuests() {
        const quests = gameState.getState().quests?.active || [];
        
        if (quests.length === 0) {
            this.addMessage('system', 'No active quests.');
            return;
        }
        
        this.addMessage('system', '=== Active Quests ===');
        quests.forEach((quest, i) => {
            this.addMessage('system', `${i + 1}. ${quest.title} - ${quest.objectives[0]?.current || 0}/${quest.objectives[0]?.count || 1}`);
        });
    }
    
    /**
     * Clear chat
     */
    clearChat() {
        this.messages = [];
        this.messagesContainer.innerHTML = '';
        this.addMessage('system', 'Chat cleared.');
    }
    
    /**
     * Toggle channel filter
     */
    toggleChannelFilter(channel) {
        if (this.channelFilters.has(channel)) {
            this.channelFilters.delete(channel);
        } else {
            this.channelFilters.add(channel);
        }
        this.buildChannelTabs();
    }
    
    /**
     * Set active channel
     */
    setActiveChannel(channel) {
        this.activeChannel = channel;
        this.channelSelect.value = channel;
        this.buildChannelTabs();
    }
    
    /**
     * Toggle minimize
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.container.classList.toggle('minimized', this.isMinimized);
    }
    
    /**
     * Show NPC dialogue
     */
    showDialogue(data) {
        const { npc, greeting, options, personality } = data;
        
        this.dialogueBubble.querySelector('#dialogue-npc-name').textContent = npc.name;
        this.dialogueBubble.querySelector('#dialogue-personality').textContent = personality;
        this.dialogueBubble.querySelector('#dialogue-text').textContent = greeting;
        
        this.renderDialogueOptions(options);
        
        this.dialogueBubble.classList.add('visible');
        
        // Also add to chat
        this.addMessage('npc', greeting, npc.name);
    }
    
    /**
     * Update dialogue
     */
    updateDialogue(data) {
        const { npc, response, options, endConversation } = data;
        
        if (endConversation) {
            this.hideDialogue();
            this.addMessage('npc', response, npc.name);
            return;
        }
        
        this.dialogueBubble.querySelector('#dialogue-text').textContent = response;
        this.renderDialogueOptions(options);
        
        this.addMessage('npc', response, npc.name);
    }
    
    /**
     * Render dialogue options
     */
    renderDialogueOptions(options) {
        const container = this.dialogueBubble.querySelector('#dialogue-options');
        container.innerHTML = '';
        
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'dialogue-option';
            btn.textContent = option.text;
            btn.addEventListener('click', () => {
                gameState.emit('dialogueChoice', {
                    choiceId: option.id,
                    choiceType: option.type,
                    choiceText: option.text,
                    questData: option.questData
                });
            });
            container.appendChild(btn);
        });
    }
    
    /**
     * Hide dialogue
     */
    hideDialogue() {
        this.dialogueBubble.classList.remove('visible');
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

export default ChatUI;

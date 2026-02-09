import { gameState } from './GameStateManager.js';

/**
 * AI Dialogue System
 * Procedural narrative generation with NPC personalities and context-aware responses
 */

// NPC Personality Traits
export const PERSONALITY_TRAITS = {
    friendly: { greetMod: 1.5, helpMod: 1.3, priceMod: 0.9 },
    grumpy: { greetMod: 0.5, helpMod: 0.7, priceMod: 1.2 },
    mysterious: { greetMod: 0.8, helpMod: 1.0, priceMod: 1.0 },
    enthusiastic: { greetMod: 2.0, helpMod: 1.5, priceMod: 0.85 },
    suspicious: { greetMod: 0.4, helpMod: 0.5, priceMod: 1.3 },
    wise: { greetMod: 1.0, helpMod: 1.4, priceMod: 1.0 },
    aggressive: { greetMod: 0.3, helpMod: 0.4, priceMod: 1.5 },
    merchant: { greetMod: 1.2, helpMod: 1.0, priceMod: 1.0 }
};

// Dialogue templates by NPC type and mood
const DIALOGUE_TEMPLATES = {
    greetings: {
        friendly: [
            "Welcome, traveler! It's wonderful to see a new face around here.",
            "Ah, hello there! How can I brighten your day?",
            "Greetings, friend! The Force smiles upon our meeting.",
            "Well met! What brings you to these parts?"
        ],
        grumpy: [
            "What do you want? Make it quick.",
            "*sighs* Another one... State your business.",
            "I don't have time for idle chatter. Speak.",
            "You again? Fine, what is it?"
        ],
        mysterious: [
            "The winds whisper of your arrival...",
            "I've been expecting someone like you.",
            "Interesting... very interesting indeed.",
            "The stars aligned for this meeting, perhaps."
        ],
        enthusiastic: [
            "OH! A visitor! This is AMAZING!",
            "Welcome, welcome, WELCOME! I'm SO glad you're here!",
            "Finally! Someone to talk to! I have SO much to share!",
            "You won't BELIEVE what I just discovered!"
        ],
        suspicious: [
            "Who sent you? What do you really want?",
            "*narrows eyes* I'm watching you, stranger.",
            "Don't try anything funny. I've got my eye on you.",
            "State your business. Slowly."
        ],
        wise: [
            "Ah, young one. The path has led you here for a reason.",
            "I sense great potential within you, traveler.",
            "Knowledge is the greatest treasure. How may I share mine?",
            "The universe works in mysterious ways. Welcome."
        ],
        aggressive: [
            "You've got some nerve showing up here!",
            "I don't like the look of you. Watch yourself.",
            "Make one wrong move and you'll regret it.",
            "What's your angle? Nobody comes here without a reason."
        ],
        merchant: [
            "Welcome to my shop! Looking for something special?",
            "Finest goods in the sector, right here!",
            "A customer! Let me show you my wares.",
            "Looking to buy or sell? I deal in both!"
        ]
    },
    
    questHooks: {
        combat: [
            "There's been trouble with {enemy_type} lately. They've been attacking travelers on the {location}.",
            "I need someone to deal with a {enemy_type} problem. They've been terrorizing the area.",
            "Word is there's a dangerous {enemy_type} camp nearby. Someone needs to clear it out.",
            "My {relative} was attacked by {enemy_type}. I need someone to get revenge."
        ],
        delivery: [
            "I need this package delivered to {npc_name} in {location}. Can you help?",
            "There's an urgent message that needs to reach {npc_name}. Time is of the essence.",
            "I have supplies that must get to {location} before nightfall.",
            "This artifact belongs to {npc_name}. Return it safely and you'll be rewarded."
        ],
        gather: [
            "I'm working on something special but need {item_count} units of {resource_type}.",
            "The local wildlife has {resource_type} I need. Can you gather some?",
            "For my research, I require {item_count} samples of {resource_type}.",
            "Collect {item_count} {resource_type} and I'll make it worth your while."
        ],
        explore: [
            "There's an uncharted area to the {direction}. I need someone to scout it.",
            "Legend speaks of ancient ruins in {location}. Find them for me.",
            "Map the terrain around {location} and report back.",
            "I've lost something valuable near {location}. Search the area."
        ],
        escort: [
            "I need safe passage to {location}. Will you accompany me?",
            "My {relative} needs an escort to reach {npc_name} safely.",
            "There's a caravan leaving for {location}. They need protection.",
            "Guide me through {enemy_type} territory to {location}."
        ]
    },
    
    responses: {
        accept: [
            "Excellent! I knew I could count on you.",
            "Thank you! This means more than you know.",
            "You won't regret this decision.",
            "May the Force guide your steps."
        ],
        decline: [
            "I understand. Perhaps another time.",
            "Very well. The offer stands if you change your mind.",
            "A pity. I hope you reconsider.",
            "No? Then be on your way."
        ],
        complete: [
            "You've done it! I can hardly believe it!",
            "Incredible work! Here's your reward as promised.",
            "The task is complete. You have my eternal gratitude.",
            "Well done! You've proven yourself worthy."
        ],
        fail: [
            "This is... unfortunate. But don't lose hope.",
            "Perhaps this task was too difficult. No shame in that.",
            "A setback, nothing more. Try again when you're ready.",
            "The mission failed, but you survived. That counts for something."
        ]
    },
    
    smallTalk: {
        weather: [
            "Fine weather we're having, wouldn't you say?",
            "Storm's coming. I can feel it in my bones.",
            "The twin suns are especially bright today.",
            "This humidity is unbearable. Reminds me of Dagobah."
        ],
        rumors: [
            "Have you heard about the strange lights in the sky?",
            "They say there's treasure hidden in the old ruins.",
            "Word is the Empire is increasing patrols nearby.",
            "A ship crashed in the desert last week. Nobody knows what happened."
        ],
        advice: [
            "If you're heading out, bring plenty of water.",
            "Watch out for Tusken Raiders after dark.",
            "The merchant in town has the best prices, trust me.",
            "Learn to read the terrain. It could save your life."
        ],
        lore: [
            "This place has a long history. The ancients built these structures.",
            "They say a Jedi once walked these lands.",
            "Before the Empire, this was a thriving trade hub.",
            "The old stories speak of a hidden cave system beneath us."
        ]
    },
    
    farewells: {
        friendly: [
            "Safe travels, friend! Come back anytime!",
            "May the Force be with you!",
            "Until we meet again!",
            "Take care out there!"
        ],
        grumpy: [
            "Finally. Goodbye.",
            "Don't let the door hit you.",
            "Yeah, yeah. Be gone.",
            "*waves dismissively*"
        ],
        mysterious: [
            "Our paths will cross again... in time.",
            "The universe has plans for you. Go.",
            "Until the stars align once more...",
            "Farewell, traveler. Destiny awaits."
        ],
        default: [
            "Goodbye.",
            "Safe travels.",
            "Until next time.",
            "Farewell."
        ]
    }
};

// Narrative elements for procedural generation
const NARRATIVE_ELEMENTS = {
    enemy_types: ['Womp Rats', 'Tusken Raiders', 'Pirates', 'Bandits', 'Droids', 'Mercenaries', 'Creatures'],
    locations: ['northern plains', 'eastern canyon', 'abandoned outpost', 'ancient ruins', 'desert wastes', 'mountain pass', 'swamp lands'],
    npc_names: ['Jira', 'Watto', 'Dexter', 'Beru', 'Owen', 'Shmi', 'Cliegg', 'Kitster'],
    relatives: ['brother', 'sister', 'cousin', 'friend', 'partner', 'mentor', 'apprentice'],
    resource_types: ['Iron Ore', 'Crystal Fragments', 'Organic Compounds', 'Energy Cells', 'Rare Minerals', 'Flora Samples'],
    directions: ['north', 'south', 'east', 'west', 'northeast', 'northwest']
};

export class AIDialogueSystem {
    constructor() {
        this.activeDialogue = null;
        this.dialogueHistory = new Map(); // Track player-NPC relationship
        this.currentConversation = [];
        
        this.setupEventHandlers();
        
        console.log('💬 AIDialogueSystem initialized');
    }
    
    setupEventHandlers() {
        gameState.on('converse', (data) => this.startConversation(data.target));
        gameState.on('dialogueChoice', (data) => this.handleChoice(data));
    }
    
    /**
     * Start a conversation with an NPC
     */
    startConversation(npc) {
        if (!npc) return;
        
        const personality = this.getNPCPersonality(npc);
        const relationship = this.getRelationship(npc);
        const context = this.buildContext(npc, relationship);
        
        // Generate greeting based on personality and relationship
        const greeting = this.generateGreeting(personality, relationship);
        
        // Build conversation options
        const options = this.generateOptions(npc, personality, context);
        
        this.activeDialogue = {
            npc,
            personality,
            relationship,
            context
        };
        
        // Emit dialogue event
        gameState.emit('dialogueStart', {
            npc,
            greeting,
            options,
            personality: personality.type
        });
        
        // Add to conversation history
        this.currentConversation.push({
            speaker: npc.name,
            text: greeting,
            timestamp: Date.now()
        });
        
        return { greeting, options };
    }
    
    /**
     * Get or generate NPC personality
     */
    getNPCPersonality(npc) {
        // Check if NPC has predefined personality
        if (npc.personality) {
            return {
                type: npc.personality,
                ...PERSONALITY_TRAITS[npc.personality]
            };
        }
        
        // Generate based on NPC type
        let type = 'friendly';
        
        if (npc.vendor) type = 'merchant';
        else if (npc.trainer) type = 'wise';
        else if (npc.hostile) type = 'aggressive';
        else if (npc.name?.includes('Guard')) type = 'suspicious';
        else if (npc.name?.includes('Trader')) type = 'merchant';
        else {
            // Random personality for generic NPCs
            const types = Object.keys(PERSONALITY_TRAITS);
            type = types[Math.floor(Math.random() * types.length)];
        }
        
        // Cache on NPC
        npc.personality = type;
        
        return {
            type,
            ...PERSONALITY_TRAITS[type]
        };
    }
    
    /**
     * Get relationship level with NPC
     */
    getRelationship(npc) {
        const key = npc.entityId || npc.name;
        const history = this.dialogueHistory.get(key) || {
            interactions: 0,
            questsCompleted: 0,
            questsFailed: 0,
            reputation: 0
        };
        
        return history;
    }
    
    /**
     * Update relationship with NPC
     */
    updateRelationship(npc, changes) {
        const key = npc.entityId || npc.name;
        const current = this.getRelationship(npc);
        
        const updated = {
            ...current,
            interactions: current.interactions + 1,
            ...changes,
            reputation: Math.max(-100, Math.min(100, current.reputation + (changes.reputation || 0)))
        };
        
        this.dialogueHistory.set(key, updated);
        return updated;
    }
    
    /**
     * Build conversation context
     */
    buildContext(npc, relationship) {
        const state = gameState.getState();
        
        return {
            playerLevel: state.player?.level || 1,
            timeOfDay: this.getTimeOfDay(),
            playerProfessions: state.professions?.learned || [],
            activeQuests: state.quests?.active || [],
            completedQuests: state.quests?.completed || [],
            inCombat: state.combat?.inCombat || false,
            relationshipLevel: this.getRelationshipLevel(relationship)
        };
    }
    
    /**
     * Get time of day for context
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }
    
    /**
     * Get relationship level string
     */
    getRelationshipLevel(relationship) {
        const rep = relationship.reputation;
        if (rep >= 80) return 'trusted';
        if (rep >= 50) return 'friendly';
        if (rep >= 20) return 'acquaintance';
        if (rep >= -20) return 'neutral';
        if (rep >= -50) return 'unfriendly';
        return 'hostile';
    }
    
    /**
     * Generate greeting based on personality and relationship
     */
    generateGreeting(personality, relationship) {
        const templates = DIALOGUE_TEMPLATES.greetings[personality.type] || 
                          DIALOGUE_TEMPLATES.greetings.friendly;
        
        let greeting = this.pickRandom(templates);
        
        // Modify based on relationship
        const level = this.getRelationshipLevel(relationship);
        if (level === 'trusted') {
            greeting = `Ah, my dear friend! ${greeting}`;
        } else if (level === 'hostile') {
            greeting = `*looks at you coldly* ${greeting}`;
        }
        
        // Add time context sometimes
        if (Math.random() > 0.7) {
            const timeGreeting = this.getTimeGreeting();
            greeting = `${timeGreeting} ${greeting}`;
        }
        
        return greeting;
    }
    
    /**
     * Get time-appropriate greeting prefix
     */
    getTimeGreeting() {
        const time = this.getTimeOfDay();
        const greetings = {
            morning: 'Good morning!',
            afternoon: 'Good afternoon.',
            evening: 'Good evening.',
            night: 'Working late, I see.'
        };
        return greetings[time];
    }
    
    /**
     * Generate conversation options
     */
    generateOptions(npc, personality, context) {
        const options = [];
        
        // Always have small talk option
        options.push({
            id: 'smalltalk',
            text: 'What news do you have?',
            type: 'smalltalk'
        });
        
        // Quest options if NPC can give quests
        if (!npc.hostile && Math.random() > 0.3) {
            options.push({
                id: 'quest',
                text: 'Do you have any work for me?',
                type: 'quest'
            });
        }
        
        // Vendor options
        if (npc.vendor) {
            options.push({
                id: 'trade',
                text: 'Show me your wares.',
                type: 'trade'
            });
        }
        
        // Trainer options
        if (npc.trainer) {
            options.push({
                id: 'train',
                text: 'I wish to learn from you.',
                type: 'train'
            });
        }
        
        // Information options
        options.push({
            id: 'info',
            text: 'Tell me about this place.',
            type: 'info'
        });
        
        // Goodbye
        options.push({
            id: 'goodbye',
            text: 'I should go.',
            type: 'goodbye'
        });
        
        return options;
    }
    
    /**
     * Handle player dialogue choice
     */
    handleChoice(data) {
        if (!this.activeDialogue) return;
        
        const { choiceId, choiceType } = data;
        const { npc, personality, context } = this.activeDialogue;
        
        let response;
        let newOptions = [];
        let endConversation = false;
        
        switch (choiceType) {
            case 'smalltalk':
                response = this.generateSmallTalk(personality);
                newOptions = this.generateFollowUpOptions(npc, personality);
                break;
                
            case 'quest':
                const quest = this.generateQuest(npc, context);
                response = quest.dialogue;
                newOptions = [
                    { id: 'accept_quest', text: 'I accept this task.', type: 'accept_quest', questData: quest },
                    { id: 'decline_quest', text: 'Not interested right now.', type: 'decline_quest' },
                    { id: 'more_info', text: 'Tell me more about this.', type: 'quest_info', questData: quest }
                ];
                break;
                
            case 'accept_quest':
                response = this.pickRandom(DIALOGUE_TEMPLATES.responses.accept);
                this.acceptQuest(data.questData);
                this.updateRelationship(npc, { reputation: 5 });
                newOptions = this.generateOptions(npc, personality, context);
                break;
                
            case 'decline_quest':
                response = this.pickRandom(DIALOGUE_TEMPLATES.responses.decline);
                newOptions = this.generateOptions(npc, personality, context);
                break;
                
            case 'trade':
                response = "Let me show you what I have...";
                gameState.emit('openTrade', { npc });
                newOptions = this.generateOptions(npc, personality, context);
                break;
                
            case 'train':
                response = this.generateTrainingDialogue(npc, context);
                gameState.emit('openTraining', { npc });
                newOptions = this.generateOptions(npc, personality, context);
                break;
                
            case 'info':
                response = this.generateLocationInfo(personality);
                newOptions = this.generateFollowUpOptions(npc, personality);
                break;
                
            case 'goodbye':
                response = this.generateFarewell(personality);
                endConversation = true;
                break;
                
            default:
                response = "I'm not sure what you mean.";
                newOptions = this.generateOptions(npc, personality, context);
        }
        
        // Track conversation
        this.currentConversation.push({
            speaker: 'Player',
            text: data.choiceText,
            timestamp: Date.now()
        });
        
        this.currentConversation.push({
            speaker: npc.name,
            text: response,
            timestamp: Date.now()
        });
        
        // Update relationship for interaction
        this.updateRelationship(npc, { reputation: 1 });
        
        // Emit response
        gameState.emit('dialogueResponse', {
            npc,
            response,
            options: newOptions,
            endConversation
        });
        
        if (endConversation) {
            this.endConversation();
        }
        
        return { response, options: newOptions, endConversation };
    }
    
    /**
     * Generate small talk response
     */
    generateSmallTalk(personality) {
        const categories = ['weather', 'rumors', 'advice', 'lore'];
        const category = this.pickRandom(categories);
        const templates = DIALOGUE_TEMPLATES.smallTalk[category];
        
        return this.pickRandom(templates);
    }
    
    /**
     * Generate a procedural quest
     */
    generateQuest(npc, context) {
        const questTypes = ['combat', 'delivery', 'gather', 'explore'];
        const type = this.pickRandom(questTypes);
        
        const templates = DIALOGUE_TEMPLATES.questHooks[type];
        let dialogue = this.pickRandom(templates);
        
        // Fill in template variables
        dialogue = this.fillTemplate(dialogue, context);
        
        // Generate quest data
        const quest = {
            id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            giver: npc.name,
            giverId: npc.entityId,
            title: this.generateQuestTitle(type),
            description: dialogue,
            objectives: this.generateObjectives(type, context),
            rewards: this.generateRewards(context.playerLevel),
            timeLimit: type === 'delivery' ? 300 : null, // 5 min for delivery
            status: 'available'
        };
        
        return {
            ...quest,
            dialogue
        };
    }
    
    /**
     * Fill template with random narrative elements
     */
    fillTemplate(template, context) {
        return template
            .replace('{enemy_type}', this.pickRandom(NARRATIVE_ELEMENTS.enemy_types))
            .replace('{location}', this.pickRandom(NARRATIVE_ELEMENTS.locations))
            .replace('{npc_name}', this.pickRandom(NARRATIVE_ELEMENTS.npc_names))
            .replace('{relative}', this.pickRandom(NARRATIVE_ELEMENTS.relatives))
            .replace('{resource_type}', this.pickRandom(NARRATIVE_ELEMENTS.resource_types))
            .replace('{direction}', this.pickRandom(NARRATIVE_ELEMENTS.directions))
            .replace('{item_count}', Math.floor(Math.random() * 10 + 5).toString());
    }
    
    /**
     * Generate quest title
     */
    generateQuestTitle(type) {
        const titles = {
            combat: ['Eliminate the Threat', 'Pest Control', 'Clear the Area', 'Defend the Settlement'],
            delivery: ['Special Delivery', 'Urgent Package', 'Message Courier', 'Supply Run'],
            gather: ['Resource Collection', 'Gathering Mission', 'Material Hunt', 'Supply the Effort'],
            explore: ['Scout Mission', 'Map the Unknown', 'Discovery', 'Lost and Found']
        };
        
        return this.pickRandom(titles[type]);
    }
    
    /**
     * Generate quest objectives
     */
    generateObjectives(type, context) {
        const baseCount = 3 + Math.floor(context.playerLevel / 2);
        
        switch (type) {
            case 'combat':
                return [{
                    type: 'kill',
                    target: this.pickRandom(NARRATIVE_ELEMENTS.enemy_types),
                    count: baseCount,
                    current: 0
                }];
            case 'delivery':
                return [{
                    type: 'deliver',
                    item: 'Package',
                    destination: this.pickRandom(NARRATIVE_ELEMENTS.npc_names),
                    completed: false
                }];
            case 'gather':
                return [{
                    type: 'gather',
                    resource: this.pickRandom(NARRATIVE_ELEMENTS.resource_types),
                    count: baseCount + 2,
                    current: 0
                }];
            case 'explore':
                return [{
                    type: 'discover',
                    location: this.pickRandom(NARRATIVE_ELEMENTS.locations),
                    completed: false
                }];
            default:
                return [];
        }
    }
    
    /**
     * Generate quest rewards
     */
    generateRewards(playerLevel) {
        const baseCredits = 100 * playerLevel;
        const baseXP = 50 * playerLevel;
        
        return {
            credits: baseCredits + Math.floor(Math.random() * baseCredits * 0.5),
            xp: {
                type: 'combat',
                amount: baseXP + Math.floor(Math.random() * baseXP * 0.3)
            },
            reputation: 10 + Math.floor(Math.random() * 10)
        };
    }
    
    /**
     * Accept a quest
     */
    acceptQuest(quest) {
        quest.status = 'active';
        quest.startTime = Date.now();
        
        gameState.emit('questAccepted', { quest });
        gameState.emit('chatMessage', {
            type: 'system',
            message: `Quest accepted: ${quest.title}`
        });
        
        console.log('📜 Quest accepted:', quest.title);
    }
    
    /**
     * Generate training dialogue
     */
    generateTrainingDialogue(npc, context) {
        const responses = [
            "The path to mastery is long, but I can guide your first steps.",
            "Training requires dedication. Are you prepared to learn?",
            "I see potential in you. Let us begin your instruction.",
            "Knowledge is power. Allow me to share what I know."
        ];
        
        return this.pickRandom(responses);
    }
    
    /**
     * Generate location info
     */
    generateLocationInfo(personality) {
        const lore = DIALOGUE_TEMPLATES.smallTalk.lore;
        return this.pickRandom(lore);
    }
    
    /**
     * Generate farewell
     */
    generateFarewell(personality) {
        const templates = DIALOGUE_TEMPLATES.farewells[personality.type] || 
                          DIALOGUE_TEMPLATES.farewells.default;
        return this.pickRandom(templates);
    }
    
    /**
     * Generate follow-up options
     */
    generateFollowUpOptions(npc, personality) {
        return [
            { id: 'smalltalk', text: 'Tell me more.', type: 'smalltalk' },
            { id: 'quest', text: 'Any work available?', type: 'quest' },
            { id: 'goodbye', text: 'I should go.', type: 'goodbye' }
        ];
    }
    
    /**
     * End current conversation
     */
    endConversation() {
        this.activeDialogue = null;
        this.currentConversation = [];
        
        gameState.emit('dialogueEnd');
    }
    
    /**
     * Utility: pick random from array
     */
    pickRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

// Singleton
export const aiDialogueSystem = new AIDialogueSystem();
export default aiDialogueSystem;

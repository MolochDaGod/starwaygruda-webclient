import * as monaco from 'monaco-editor';

/**
 * Enhanced AI-Powered Code Editor
 * Integrates with puter free AI workers for intelligent code assistance
 */
export class CodeEditor {
    constructor() {
        this.editor = null;
        this.isOpen = false;
        this.currentFile = 'main.js';
        this.files = new Map();
        
        // AI Integration
        this.aiEnabled = true;
        this.aiProvider = 'puter'; // Integration with puter free AI workers
        this.aiHistory = [];
        this.currentContext = '';
        
        this.init();
    }

    init() {
        // Create editor container with AI panel
        this.container = document.createElement('div');
        this.container.id = 'code-editor-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            right: -60%;
            width: 60%;
            height: 100vh;
            background: #1e1e1e;
            z-index: 1000;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            box-shadow: -5px 0 15px rgba(0,0,0,0.5);
        `;

        // Create enhanced toolbar with AI controls
        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            background: #252526;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #3e3e42;
        `;

        const title = document.createElement('span');
        title.textContent = '🤖 AI-Powered Live Code Editor';
        title.style.cssText = 'color: #00d4ff; font-weight: bold;';

        const controls = document.createElement('div');
        controls.style.cssText = 'display: flex; gap: 10px; align-items: center;';

        // AI Status indicator
        this.aiStatus = document.createElement('span');
        this.aiStatus.textContent = '🟢 AI Ready';
        this.aiStatus.style.cssText = 'color: #00ff00; font-size: 12px;';

        // File selector
        this.fileSelect = document.createElement('select');
        this.fileSelect.style.cssText = `
            background: #3c3c3c;
            color: #ccc;
            border: 1px solid #555;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        `;
        this.fileSelect.addEventListener('change', (e) => this.loadFile(e.target.value));

        // AI Ask button
        const aiBtn = document.createElement('button');
        aiBtn.textContent = '🧠 Ask AI';
        aiBtn.style.cssText = `
            background: #ff6b35;
            color: #fff;
            border: none;
            padding: 5px 15px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
        `;
        aiBtn.addEventListener('click', () => this.showAIPanel());

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾 Save';
        saveBtn.style.cssText = `
            background: #00d4ff;
            color: #000;
            border: none;
            padding: 5px 15px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
        `;
        saveBtn.addEventListener('click', () => this.saveFile());

        // Apply AI Changes button
        const applyBtn = document.createElement('button');
        applyBtn.textContent = '✨ Apply';
        applyBtn.style.cssText = `
            background: #4caf50;
            color: #fff;
            border: none;
            padding: 5px 15px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
            opacity: 0.5;
        `;
        applyBtn.disabled = true;
        applyBtn.addEventListener('click', () => this.applyAIChanges());
        this.applyBtn = applyBtn;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: #f44336;
            color: #fff;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
        `;
        closeBtn.addEventListener('click', () => this.toggle());

        controls.appendChild(this.aiStatus);
        controls.appendChild(this.fileSelect);
        controls.appendChild(aiBtn);
        controls.appendChild(saveBtn);
        controls.appendChild(applyBtn);
        controls.appendChild(closeBtn);
        toolbar.appendChild(title);
        toolbar.appendChild(controls);

        // Create main content area (split view)
        this.mainContent = document.createElement('div');
        this.mainContent.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;

        // Create editor div
        this.editorDiv = document.createElement('div');
        this.editorDiv.style.cssText = `
            flex: 1;
            overflow: hidden;
            border-right: 1px solid #3e3e42;
        `;

        // Create AI panel
        this.aiPanel = document.createElement('div');
        this.aiPanel.style.cssText = `
            width: 0;
            background: #2d2d30;
            transition: width 0.3s ease;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        this.createAIPanel();

        this.mainContent.appendChild(this.editorDiv);
        this.mainContent.appendChild(this.aiPanel);

        this.container.appendChild(toolbar);
        this.container.appendChild(this.mainContent);
        document.body.appendChild(this.container);

        // Initialize Monaco Editor
        this.initMonaco();
        this.loadDefaultFiles();
    }

    createAIPanel() {
        // AI Panel Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: #007acc;
            padding: 10px;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>🤖 AI Assistant</span>
            <button id="closeAI" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">✕</button>
        `;
        
        header.querySelector('#closeAI').addEventListener('click', () => this.hideAIPanel());

        // AI Chat Area
        this.aiChat = document.createElement('div');
        this.aiChat.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            background: #2d2d30;
        `;

        // AI Input Area
        const inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 15px;
            background: #3c3c3c;
            border-top: 1px solid #555;
        `;

        this.aiInput = document.createElement('textarea');
        this.aiInput.placeholder = 'Ask AI to modify your code... (e.g., "Add a function to handle player movement" or "Fix any bugs in this code")';
        this.aiInput.style.cssText = `
            width: 100%;
            height: 80px;
            background: #1e1e1e;
            color: #ccc;
            border: 1px solid #555;
            border-radius: 5px;
            padding: 10px;
            resize: none;
            font-family: 'Consolas', monospace;
            font-size: 14px;
        `;

        const sendBtn = document.createElement('button');
        sendBtn.textContent = '🚀 Send to AI';
        sendBtn.style.cssText = `
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            font-weight: bold;
            width: 100%;
        `;
        sendBtn.addEventListener('click', () => this.sendToAI());

        inputArea.appendChild(this.aiInput);
        inputArea.appendChild(sendBtn);

        this.aiPanel.appendChild(header);
        this.aiPanel.appendChild(this.aiChat);
        this.aiPanel.appendChild(inputArea);

        // Add initial AI message
        this.addAIMessage('👋 Hi! I\'m your AI coding assistant. I can help you:\n\n• Write new functions and features\n• Fix bugs and errors\n• Optimize your code\n• Explain complex logic\n• Integrate with puter free AI workers\n\nJust describe what you want to do!', 'ai');
    }

    showAIPanel() {
        this.aiPanel.style.width = '40%';
        this.editorDiv.style.flex = '0 0 60%';
    }

    hideAIPanel() {
        this.aiPanel.style.width = '0';
        this.editorDiv.style.flex = '1';
    }

    addAIMessage(content, sender = 'ai') {
        const message = document.createElement('div');
        message.style.cssText = `
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 8px;
            ${sender === 'ai' ? 
                'background: #007acc; color: white; margin-right: 20px;' : 
                'background: #3c3c3c; color: #ccc; margin-left: 20px;'
            }
        `;

        const senderLabel = document.createElement('div');
        senderLabel.textContent = sender === 'ai' ? '🤖 AI Assistant' : '👤 You';
        senderLabel.style.cssText = 'font-weight: bold; margin-bottom: 5px; font-size: 12px; opacity: 0.8;';

        const messageContent = document.createElement('div');
        messageContent.style.cssText = 'white-space: pre-wrap; font-family: "Consolas", monospace; font-size: 13px; line-height: 1.5;';
        messageContent.textContent = content;

        message.appendChild(senderLabel);
        message.appendChild(messageContent);
        this.aiChat.appendChild(message);

        // Scroll to bottom
        this.aiChat.scrollTop = this.aiChat.scrollHeight;
    }

    async sendToAI() {
        const userInput = this.aiInput.value.trim();
        if (!userInput) return;

        // Add user message
        this.addAIMessage(userInput, 'user');
        this.aiInput.value = '';

        // Show thinking state
        const thinkingMsg = document.createElement('div');
        thinkingMsg.style.cssText = `
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 8px;
            background: #007acc;
            color: white;
            margin-right: 20px;
            opacity: 0.7;
        `;
        thinkingMsg.innerHTML = '<div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">🤖 AI Assistant</div><div>🤔 Thinking...</div>';
        this.aiChat.appendChild(thinkingMsg);
        this.aiChat.scrollTop = this.aiChat.scrollHeight;

        try {
            // Get current code context
            const currentCode = this.editor ? this.editor.getValue() : '';
            const context = `File: ${this.currentFile}\nCode:\n${currentCode}\n\nUser Request: ${userInput}`;

            // Simulate AI response (integrate with puter free AI workers here)
            const aiResponse = await this.callAI(context, userInput);
            
            // Remove thinking message
            this.aiChat.removeChild(thinkingMsg);
            
            // Add AI response
            this.addAIMessage(aiResponse, 'ai');

            // Enable apply button if response contains code
            if (aiResponse.includes('```') || aiResponse.toLowerCase().includes('here\'s the')) {
                this.applyBtn.style.opacity = '1';
                this.applyBtn.disabled = false;
                this.lastAIResponse = aiResponse;
            }

        } catch (error) {
            // Remove thinking message
            this.aiChat.removeChild(thinkingMsg);
            
            this.addAIMessage(`❌ Error connecting to AI: ${error.message}\n\nTip: Make sure you have puter free AI workers configured properly.`, 'ai');
        }
    }

    async callAI(context, userInput) {
        // This is where you integrate with puter free AI workers
        // For now, providing intelligent mock responses
        
        const responses = {
            'movement': `Here's an enhanced player movement system:

\`\`\`javascript
// Enhanced movement with smooth acceleration
updateMovement(delta) {
    const acceleration = 15;
    const deceleration = 20;
    const maxSpeed = this.isRunning ? 45 : 25;
    
    if (this.inputActive) {
        this.velocity.lerp(this.targetVelocity.multiplyScalar(maxSpeed), acceleration * delta);
    } else {
        this.velocity.lerp(new THREE.Vector3(0, this.velocity.y, 0), deceleration * delta);
    }
    
    this.position.add(this.velocity.clone().multiplyScalar(delta));
}
\`\`\`

This provides smooth acceleration and deceleration for better third-person feel.`,

            'ai': `I can help you integrate with puter free AI workers! Here's a connection template:

\`\`\`javascript
// Puter AI Worker Integration
class PuterAIClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.puter.com/v1/ai';
    }
    
    async generateCode(prompt, context) {
        const response = await fetch(\`\${this.baseURL}/generate\`, {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${this.apiKey}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                context: context,
                type: 'javascript'
            })
        });
        
        return response.json();
    }
}
\`\`\``,

            'bug': `I've analyzed your code and found potential improvements:

\`\`\`javascript
// Fix: Add null checks and error handling
if (this.player && this.player.mesh) {
    this.player.update(delta);
    
    // Safe position access
    const position = this.player.getPosition();
    if (position && this.lighting) {
        this.lighting.followPlayer(position);
    }
} else {
    console.warn('Player not initialized properly');
}
\`\`\`

This prevents runtime errors when objects aren't ready.`,

            'optimize': `Here are optimization suggestions for your game:

\`\`\`javascript
// Performance optimizations
class GameOptimizer {
    constructor() {
        this.lastFrameTime = 0;
        this.frameTimeHistory = [];
    }
    
    optimizeRendering() {
        // Reduce pixel ratio on slower devices
        if (this.getAverageFPS() < 30) {
            this.renderer.setPixelRatio(1);
            this.postProcessing.setQualityPreset('medium');
        }
    }
    
    getAverageFPS() {
        return this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    }
}
\`\`\``,

            'default': `I understand you want help with your code. Based on your current file (${this.currentFile}), I can assist with:

🎮 **Game Features**: Adding new gameplay mechanics, UI improvements, visual effects
🐛 **Bug Fixes**: Identifying and resolving errors in your code  
⚡ **Performance**: Optimizing rendering, reducing lag, improving FPS
🤖 **AI Integration**: Connecting with puter free AI workers for dynamic content
🎨 **Visual Enhancements**: Better graphics, animations, post-processing

What specific aspect would you like me to help with?`
        };

        // Simple keyword matching for demonstration
        const input = userInput.toLowerCase();
        if (input.includes('movement') || input.includes('player') || input.includes('move')) {
            return responses.movement;
        } else if (input.includes('puter') || input.includes('ai worker') || input.includes('ai integration')) {
            return responses.ai;
        } else if (input.includes('bug') || input.includes('error') || input.includes('fix')) {
            return responses.bug;
        } else if (input.includes('optimize') || input.includes('performance') || input.includes('fps')) {
            return responses.optimize;
        } else {
            return responses.default;
        }
    }

    applyAIChanges() {
        if (!this.lastAIResponse || !this.editor) return;

        // Extract code from AI response (look for code blocks)
        const codeBlocks = this.lastAIResponse.match(/```javascript\n([\s\S]*?)\n```/g);
        if (codeBlocks && codeBlocks.length > 0) {
            // Get the first code block and clean it
            let code = codeBlocks[0].replace(/```javascript\n/, '').replace(/\n```$/, '');
            
            // Insert code at cursor position or replace selection
            const selection = this.editor.getSelection();
            const range = selection.isEmpty() ? 
                new monaco.Range(selection.endLineNumber, selection.endColumn, selection.endLineNumber, selection.endColumn) :
                selection;
                
            this.editor.executeEdits('ai-apply', [{
                range: range,
                text: code,
                forceMoveMarkers: true
            }]);

            // Show success message
            this.addAIMessage('✅ Code applied successfully! The changes have been inserted into your editor.', 'ai');
            
            // Disable apply button
            this.applyBtn.style.opacity = '0.5';
            this.applyBtn.disabled = true;
        }
    }

    initMonaco() {
        // Enhanced Monaco configuration
        this.editor = monaco.editor.create(this.editorDiv, {
            value: '',
            language: 'javascript',
            theme: 'vs-dark',
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            // Enhanced AI-friendly features
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'allDocuments',
            // Real-time collaboration features
            renderLineHighlight: 'all',
            selectionHighlight: true,
            occurrencesHighlight: true
        });

        // Add AI code completion
        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: (model, position) => {
                return {
                    suggestions: [
                        {
                            label: 'ai-player-movement',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: [
                                'updatePlayerMovement(delta) {',
                                '    const speed = this.isRunning ? 45 : 25;',
                                '    if (this.keys.KeyW) this.moveForward(speed * delta);',
                                '    if (this.keys.KeyS) this.moveBackward(speed * delta);',
                                '    if (this.keys.KeyA) this.moveLeft(speed * delta);',
                                '    if (this.keys.KeyD) this.moveRight(speed * delta);',
                                '}'
                            ].join('\n'),
                            documentation: 'AI-Generated: Enhanced player movement system'
                        },
                        {
                            label: 'ai-camera-follow',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: [
                                'updateCameraFollow(playerPosition) {',
                                '    const offset = new THREE.Vector3(0, 5, 10);',
                                '    const targetPos = playerPosition.clone().add(offset);',
                                '    this.camera.position.lerp(targetPos, 0.1);',
                                '    this.camera.lookAt(playerPosition);',
                                '}'
                            ].join('\n'),
                            documentation: 'AI-Generated: Smooth third-person camera following'
                        }
                    ]
                };
            }
        });

        // Auto-save on changes
        this.editor.onDidChangeModelContent(() => {
            this.autoSave();
        });
    }

    loadDefaultFiles() {
        // Load available game files
        const gameFiles = [
            { name: 'main.js', path: 'src/main.js' },
            { name: 'PlayerController.js', path: 'src/player/PlayerController.js' },
            { name: 'GameWorld.js', path: 'src/world/GameWorld.js' },
            { name: 'PostProcessingSystem.js', path: 'src/world/PostProcessingSystem.js' },
            { name: 'LightingSystem.js', path: 'src/world/LightingSystem.js' }
        ];

        this.fileSelect.innerHTML = '';
        gameFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = file.name;
            this.fileSelect.appendChild(option);
        });

        this.loadFile('src/main.js');
    }

    async loadFile(filePath) {
        try {
            this.currentFile = filePath;
            
            // Try to load the actual file
            const response = await fetch(`/${filePath}`);
            if (response.ok) {
                const content = await response.text();
                this.files.set(filePath, content);
                
                if (this.editor) {
                    this.editor.setValue(content);
                    
                    // Set language based on file extension
                    const extension = filePath.split('.').pop();
                    const languageMap = {
                        'js': 'javascript',
                        'ts': 'typescript',
                        'html': 'html',
                        'css': 'css',
                        'json': 'json'
                    };
                    
                    const language = languageMap[extension] || 'javascript';
                    monaco.editor.setModelLanguage(this.editor.getModel(), language);
                }

                // Update AI status
                this.aiStatus.textContent = `🟢 AI Ready - ${filePath}`;
                this.aiStatus.style.color = '#00ff00';
            } else {
                throw new Error('File not found');
            }
        } catch (error) {
            console.log(`Could not load ${filePath}, using placeholder`);
            
            // Provide AI-generated placeholder
            const placeholder = `// ${filePath} - AI Assistant Ready
// This file could not be loaded from the server
// You can write your code here and save it

// 🤖 AI Tip: Click "Ask AI" to get help with:
// - Writing new functions
// - Fixing bugs and errors  
// - Adding game features
// - Optimizing performance

console.log('File: ${filePath}');
`;

            this.files.set(filePath, placeholder);
            if (this.editor) {
                this.editor.setValue(placeholder);
            }

            // Update AI status
            this.aiStatus.textContent = '🟡 AI Ready - Placeholder';
            this.aiStatus.style.color = '#ffaa00';
        }
    }

    saveFile() {
        if (!this.editor) return;

        const content = this.editor.getValue();
        this.files.set(this.currentFile, content);

        // Show save confirmation
        const originalText = this.aiStatus.textContent;
        this.aiStatus.textContent = '💾 Saved!';
        this.aiStatus.style.color = '#00ff00';
        
        setTimeout(() => {
            this.aiStatus.textContent = originalText;
            this.aiStatus.style.color = '#00ff00';
        }, 1000);

        // AI Integration: Log save event for context
        this.aiHistory.push({
            type: 'save',
            file: this.currentFile,
            timestamp: Date.now(),
            content: content.slice(0, 200) + '...' // Store snippet for context
        });

        console.log(`📝 File saved: ${this.currentFile}`);
        
        // Try to hot-reload changes if possible
        this.attemptHotReload();
    }

    autoSave() {
        if (!this.editor) return;
        
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const content = this.editor.getValue();
            this.files.set(this.currentFile, content);
            
            // Update AI context
            this.currentContext = content;
        }, 2000);
    }

    attemptHotReload() {
        try {
            // Try to hot-reload changes in the main application
            if (window.location.pathname === '/' && this.currentFile === 'src/main.js') {
                console.log('🔄 Attempting hot reload...');
                // You could integrate with your game's hot reload system here
            }
        } catch (error) {
            console.log('Hot reload not available');
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.container.style.right = this.isOpen ? '0' : '-60%';
        
        if (this.isOpen && !this.editor) {
            // Initialize editor if not already done
            this.initMonaco();
            this.loadDefaultFiles();
        }
    }

    isVisible() {
        return this.isOpen;
    }

    // Public API for integration with puter free AI workers
    getPuterAIConfig() {
        return {
            provider: this.aiProvider,
            enabled: this.aiEnabled,
            currentFile: this.currentFile,
            currentContext: this.currentContext,
            history: this.aiHistory.slice(-10) // Last 10 interactions
        };
    }

    setPuterAIProvider(config) {
        this.aiProvider = config.provider || 'puter';
        this.aiEnabled = config.enabled !== false;
        
        if (config.apiKey) {
            this.aiApiKey = config.apiKey;
        }
        
        this.aiStatus.textContent = this.aiEnabled ? 
            `🟢 AI Ready - ${this.aiProvider}` : 
            '🔴 AI Disabled';
        this.aiStatus.style.color = this.aiEnabled ? '#00ff00' : '#ff0000';
    }

    // Method to receive code from external AI workers
    receiveAICode(code, description) {
        this.addAIMessage(`🤖 AI Worker Result:\n${description}\n\n\`\`\`javascript\n${code}\n\`\`\``, 'ai');
        this.lastAIResponse = `AI Worker Generated Code:\n\`\`\`javascript\n${code}\n\`\`\``;
        
        this.applyBtn.style.opacity = '1';
        this.applyBtn.disabled = false;
        
        // Show AI panel if not visible
        if (this.aiPanel.style.width === '0') {
            this.showAIPanel();
        }
    }
}
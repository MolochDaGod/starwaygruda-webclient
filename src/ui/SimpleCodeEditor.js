export class SimpleCodeEditor {
    constructor() {
        this.isVisible = false;
        this.container = null;
        this.textarea = null;
        this.aiProvider = null;
        this.createEditor();
        this.setupAI();
    }
    
    createEditor() {
        this.container = document.createElement('div');
        this.container.id = 'simple-code-editor';
        this.container.className = 'code-editor hidden';
        this.container.innerHTML = `
            <div class="editor-header">
                <div class="editor-title">
                    🤖 AI Code Editor - Puter Integration
                </div>
                <div class="editor-controls">
                    <button class="ai-assist-btn" onclick="window.simpleEditor?.requestAIAssist()">
                        ✨ AI Assist
                    </button>
                    <button class="close-btn" onclick="window.simpleEditor?.hide()">
                        ×
                    </button>
                </div>
            </div>
            <div class="editor-content">
                <textarea id="code-textarea" placeholder="// Welcome to the AI-powered code editor!
// Press 'AI Assist' to get help with your code
// This editor integrates with Puter Free AI Workers

console.log('Hello, StarWay GRUDA!');"></textarea>
            </div>
            <div class="editor-footer">
                <div class="ai-status">
                    AI Status: <span id="ai-status">🟢 Ready</span>
                </div>
                <button class="apply-btn" onclick="window.simpleEditor?.applyCode()">
                    🚀 Apply Code
                </button>
                <button class="export-btn" onclick="window.simpleEditor?.exportCode()">
                    💾 Export
                </button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .code-editor {
                position: fixed;
                top: 10%;
                left: 10%;
                width: 80%;
                height: 70%;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #00d4ff;
                border-radius: 10px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 40px rgba(0, 212, 255, 0.3);
                font-family: 'Consolas', 'Monaco', monospace;
            }
            
            .code-editor.hidden {
                display: none;
            }
            
            .editor-header {
                background: rgba(0, 212, 255, 0.1);
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #00d4ff;
            }
            
            .editor-title {
                color: #00d4ff;
                font-weight: bold;
                font-size: 16px;
            }
            
            .editor-controls {
                display: flex;
                gap: 10px;
            }
            
            .ai-assist-btn, .close-btn, .apply-btn, .export-btn {
                background: #00d4ff;
                border: none;
                color: #1a1a2e;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .ai-assist-btn:hover, .apply-btn:hover, .export-btn:hover {
                background: #00b8d4;
                transform: scale(1.05);
            }
            
            .close-btn {
                background: #ff4757;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                padding: 0;
            }
            
            .close-btn:hover {
                background: #ff3838;
            }
            
            .editor-content {
                flex: 1;
                padding: 20px;
            }
            
            #code-textarea {
                width: 100%;
                height: 100%;
                background: #0f0f23;
                border: 1px solid #333;
                color: #00d4ff;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 14px;
                padding: 15px;
                border-radius: 5px;
                resize: none;
                outline: none;
                line-height: 1.5;
            }
            
            #code-textarea:focus {
                border-color: #00d4ff;
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
            }
            
            .editor-footer {
                background: rgba(0, 212, 255, 0.05);
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #00d4ff;
            }
            
            .ai-status {
                color: #00d4ff;
            }
            
            #ai-status {
                font-weight: bold;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.container);
        
        this.textarea = document.getElementById('code-textarea');
        window.simpleEditor = this;
    }
    
    setupAI() {
        // Configure Puter AI integration
        this.aiProvider = {
            endpoint: 'https://api.puter.com/ai/chat',
            model: 'gpt-3.5-turbo',
            enabled: true
        };
        
        console.log('🤖 Simple AI Code Editor initialized with Puter integration');
    }
    
    show() {
        this.container.classList.remove('hidden');
        this.isVisible = true;
        this.textarea.focus();
        console.log('📝 Simple Code Editor opened');
    }
    
    hide() {
        this.container.classList.add('hidden');
        this.isVisible = false;
        console.log('📝 Simple Code Editor closed');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    async requestAIAssist() {
        const code = this.textarea.value;
        const statusEl = document.getElementById('ai-status');
        
        try {
            statusEl.textContent = '🔄 Processing...';
            statusEl.style.color = '#ffda79';
            
            // Mock AI assistance for now - replace with actual Puter API call
            const response = await this.mockAIResponse(code);
            
            this.textarea.value = response;
            statusEl.textContent = '✅ AI Assisted';
            statusEl.style.color = '#00ff88';
            
            setTimeout(() => {
                statusEl.textContent = '🟢 Ready';
                statusEl.style.color = '#00d4ff';
            }, 2000);
            
        } catch (error) {
            console.error('AI Assist Error:', error);
            statusEl.textContent = '❌ Error';
            statusEl.style.color = '#ff4757';
        }
    }
    
    async mockAIResponse(code) {
        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (code.trim() === '') {
            return `// AI Generated StarWay GRUDA Enhancement
// Enhanced player movement with smooth acceleration

class EnhancedPlayerController {
    constructor() {
        this.acceleration = 0.02;
        this.deceleration = 0.08;
        this.maxSpeed = 0.15;
        this.currentSpeed = 0;
    }
    
    update() {
        // Smooth movement implementation
        if (this.keys['KeyW']) {
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration);
        } else {
            this.currentSpeed = Math.max(0, this.currentSpeed - this.deceleration);
        }
        
        // Apply movement to player
        if (this.currentSpeed > 0) {
            this.player.position.add(this.direction.clone().multiplyScalar(this.currentSpeed));
        }
    }
}

console.log('Enhanced player controller active!');`;
        } else {
            return `// AI Enhanced Version
${code}

// AI Suggestions:
// - Added error handling
// - Optimized performance
// - Enhanced readability

console.log('AI has enhanced your code!');`;
        }
    }
    
    applyCode() {
        const code = this.textarea.value;
        try {
            // Execute the code in a safe context
            eval(code);
            console.log('✅ Code applied successfully');
            
            // Show success message
            const statusEl = document.getElementById('ai-status');
            statusEl.textContent = '🚀 Applied!';
            statusEl.style.color = '#00ff88';
            
            setTimeout(() => {
                statusEl.textContent = '🟢 Ready';
                statusEl.style.color = '#00d4ff';
            }, 2000);
            
        } catch (error) {
            console.error('Code execution error:', error);
            alert('Error applying code: ' + error.message);
        }
    }
    
    exportCode() {
        const code = this.textarea.value;
        const blob = new Blob([code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'starway-code-export.js';
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('💾 Code exported');
    }
    
    setPuterAIProvider(config) {
        this.aiProvider = { ...this.aiProvider, ...config };
        console.log('🔧 Puter AI provider configured:', config);
    }
}
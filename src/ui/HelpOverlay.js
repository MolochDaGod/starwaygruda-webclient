export class HelpOverlay {
    constructor() {
        this.overlay = null;
        this.isVisible = false;
        this.createHelpOverlay();
        this.setupKeyboardShortcuts();
    }
    
    createHelpOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'help-overlay';
        this.overlay.className = 'help-overlay hidden';
        this.overlay.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h2>🎮 StarWay GRUDA - Controls & Features</h2>
                    <button class="close-help" onclick="window.helpOverlay?.hide()">×</button>
                </div>
                
                <div class="help-sections">
                    <div class="help-section">
                        <h3>🎯 Game Controls</h3>
                        <div class="help-item">
                            <strong>WASD</strong> - Move character
                        </div>
                        <div class="help-item">
                            <strong>Mouse</strong> - Look around (click to lock cursor)
                        </div>
                        <div class="help-item">
                            <strong>Space</strong> - Jump / Ascend (space flight)
                        </div>
                        <div class="help-item">
                            <strong>Shift</strong> - Run / Descend (space flight)
                        </div>
                        <div class="help-item">
                            <strong>Tab</strong> - Toggle HUD
                        </div>
                    </div>
                    
                    <div class="help-section ai-section">
                        <h3>🤖 AI Code Editor</h3>
                        <div class="help-item">
                            <strong>F1</strong> or <strong>Ctrl+I</strong> - Open AI Code Editor
                        </div>
                        <div class="help-item">
                            <strong>Features:</strong>
                            <ul>
                                <li>Live code editing with syntax highlighting</li>
                                <li>AI-powered code assistance</li>
                                <li>Puter Free AI Workers integration</li>
                                <li>Real-time game modification</li>
                                <li>Export/Import code changes</li>
                            </ul>
                        </div>
                        <div class="help-item ai-status">
                            <strong>AI Status:</strong> <span id="ai-status-indicator">🟢 Ready</span>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h3>🌍 World Features</h3>
                        <div class="help-item">
                            <strong>Multiple Planets:</strong> Tatooine, Naboo, Corellia, Dathomir, Rori, Yavin 4
                        </div>
                        <div class="help-item">
                            <strong>Dynamic Lighting:</strong> Time of day progression
                        </div>
                        <div class="help-item">
                            <strong>Post-Processing:</strong> Bloom, film grain, anti-aliasing
                        </div>
                        <div class="help-item">
                            <strong>Third-Person Camera:</strong> Smooth following with mouse look
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h3>⚙️ Developer Features</h3>
                        <div class="help-item">
                            <strong>Live Coding:</strong> Modify game behavior in real-time
                        </div>
                        <div class="help-item">
                            <strong>Asset Loading:</strong> Automatic fallbacks for missing assets
                        </div>
                        <div class="help-item">
                            <strong>Offline Mode:</strong> Works without API server
                        </div>
                        <div class="help-item">
                            <strong>Hot Reload:</strong> Instant updates during development
                        </div>
                    </div>
                </div>
                
                <div class="help-footer">
                    <p>Press <strong>F1</strong> again to close this help, or click outside to dismiss.</p>
                    <p class="version-info">StarWay GRUDA v2.0 - Enhanced Third-Person Edition</p>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .help-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .help-overlay.hidden {
                display: none;
            }
            
            .help-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 30px;
                max-width: 900px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 212, 255, 0.3);
                color: white;
                position: relative;
            }
            
            .help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
                border-bottom: 2px solid #00d4ff;
                padding-bottom: 15px;
            }
            
            .help-header h2 {
                margin: 0;
                color: #00d4ff;
                text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            }
            
            .close-help {
                background: #ff4757;
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .close-help:hover {
                background: #ff3838;
                transform: scale(1.1);
            }
            
            .help-sections {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 25px;
                margin-bottom: 20px;
            }
            
            .help-section {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 20px;
                border: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .help-section.ai-section {
                border-color: #00ff88;
                background: rgba(0, 255, 136, 0.05);
            }
            
            .help-section h3 {
                margin-top: 0;
                color: #00d4ff;
                font-size: 18px;
                margin-bottom: 15px;
            }
            
            .ai-section h3 {
                color: #00ff88;
            }
            
            .help-item {
                margin-bottom: 12px;
                padding: 8px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 5px;
                border-left: 3px solid #00d4ff;
            }
            
            .ai-section .help-item {
                border-left-color: #00ff88;
            }
            
            .help-item strong {
                color: #ffda79;
            }
            
            .help-item ul {
                margin: 8px 0 0 0;
                padding-left: 20px;
            }
            
            .help-item li {
                margin-bottom: 4px;
            }
            
            .ai-status-indicator {
                color: #00ff88;
            }
            
            .help-footer {
                text-align: center;
                border-top: 1px solid rgba(0, 212, 255, 0.3);
                padding-top: 15px;
                color: #ccc;
            }
            
            .version-info {
                font-size: 12px;
                opacity: 0.7;
                margin-top: 10px;
            }
            
            @media (max-width: 768px) {
                .help-sections {
                    grid-template-columns: 1fr;
                }
                
                .help-content {
                    margin: 20px;
                    padding: 20px;
                    max-width: none;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.overlay);
        
        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    show() {
        this.overlay.classList.remove('hidden');
        this.isVisible = true;
        
        // Update AI status
        this.updateAIStatus();
        
        console.log('📖 Help overlay shown');
    }
    
    hide() {
        this.overlay.classList.add('hidden');
        this.isVisible = false;
        console.log('📖 Help overlay hidden');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    updateAIStatus() {
        const statusIndicator = document.getElementById('ai-status-indicator');
        if (statusIndicator) {
            if (window.game?.codeEditor?.aiProvider) {
                statusIndicator.textContent = '🟢 AI Ready';
                statusIndicator.style.color = '#00ff88';
            } else if (window.game?.offlineMode) {
                statusIndicator.textContent = '🟡 Offline Mode';
                statusIndicator.style.color = '#ffda79';
            } else {
                statusIndicator.textContent = '🔴 Not Connected';
                statusIndicator.style.color = '#ff4757';
            }
        }
    }
}
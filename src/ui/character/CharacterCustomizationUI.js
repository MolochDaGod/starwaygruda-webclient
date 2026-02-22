import { CharacterOutfits, ArmorClassOutfits } from '../../player/ModularCharacterSystem.js';

/**
 * CharacterCustomizationUI
 * 
 * UI panel for selecting character outfits during character creation
 * or at appearance modification stations
 */
export class CharacterCustomizationUI {
    constructor(modularCharacterSystem, options = {}) {
        this.characterSystem = modularCharacterSystem;
        
        this.config = {
            containerId: options.containerId || 'character-customization',
            onOutfitChange: options.onOutfitChange || null,
            onConfirm: options.onConfirm || null,
            showArmorClass: options.showArmorClass !== false
        };
        
        this.container = null;
        this.selectedOutfit = null;
        this.isVisible = false;
        
        this.init();
    }
    
    init() {
        this.createStyles();
        this.createContainer();
    }
    
    createStyles() {
        if (document.getElementById('character-customization-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'character-customization-styles';
        style.textContent = `
            .char-customization-panel {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 320px;
                max-height: 80vh;
                background: linear-gradient(180deg, rgba(20, 25, 35, 0.95) 0%, rgba(15, 20, 30, 0.98) 100%);
                border: 1px solid rgba(100, 150, 200, 0.3);
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #e0e5eb;
                z-index: 1000;
                overflow: hidden;
                display: none;
            }
            
            .char-customization-panel.visible {
                display: block;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-50%) translateX(20px); }
                to { opacity: 1; transform: translateY(-50%) translateX(0); }
            }
            
            .char-panel-header {
                padding: 15px 20px;
                background: linear-gradient(90deg, rgba(60, 100, 150, 0.3) 0%, transparent 100%);
                border-bottom: 1px solid rgba(100, 150, 200, 0.2);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .char-panel-title {
                font-size: 18px;
                font-weight: 600;
                color: #fff;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .char-panel-close {
                width: 28px;
                height: 28px;
                background: rgba(255, 100, 100, 0.2);
                border: 1px solid rgba(255, 100, 100, 0.3);
                border-radius: 4px;
                color: #ff8080;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.2s;
            }
            
            .char-panel-close:hover {
                background: rgba(255, 100, 100, 0.4);
                color: #fff;
            }
            
            .char-panel-content {
                padding: 15px;
                max-height: calc(80vh - 120px);
                overflow-y: auto;
            }
            
            .char-panel-content::-webkit-scrollbar {
                width: 6px;
            }
            
            .char-panel-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
            }
            
            .char-panel-content::-webkit-scrollbar-thumb {
                background: rgba(100, 150, 200, 0.4);
                border-radius: 3px;
            }
            
            .char-armor-filter {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 15px;
            }
            
            .char-filter-btn {
                padding: 6px 12px;
                background: rgba(40, 50, 70, 0.6);
                border: 1px solid rgba(100, 150, 200, 0.2);
                border-radius: 4px;
                color: #a0a8b0;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }
            
            .char-filter-btn:hover {
                background: rgba(60, 80, 120, 0.6);
                color: #fff;
            }
            
            .char-filter-btn.active {
                background: rgba(80, 140, 200, 0.4);
                border-color: rgba(100, 180, 255, 0.5);
                color: #80c0ff;
            }
            
            .char-outfit-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .char-outfit-card {
                background: rgba(30, 40, 55, 0.6);
                border: 2px solid rgba(80, 100, 130, 0.3);
                border-radius: 6px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }
            
            .char-outfit-card:hover {
                background: rgba(40, 55, 75, 0.8);
                border-color: rgba(100, 150, 200, 0.5);
                transform: translateY(-2px);
            }
            
            .char-outfit-card.selected {
                background: rgba(60, 100, 150, 0.4);
                border-color: rgba(100, 180, 255, 0.7);
                box-shadow: 0 0 15px rgba(80, 150, 255, 0.3);
            }
            
            .char-outfit-icon {
                width: 60px;
                height: 60px;
                margin: 0 auto 8px;
                background: rgba(20, 30, 45, 0.8);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
            }
            
            .char-outfit-name {
                font-size: 13px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 4px;
            }
            
            .char-outfit-class {
                font-size: 10px;
                color: #80a0c0;
                text-transform: uppercase;
            }
            
            .char-outfit-desc {
                font-size: 11px;
                color: #8090a0;
                margin-top: 4px;
            }
            
            .char-panel-footer {
                padding: 15px;
                border-top: 1px solid rgba(100, 150, 200, 0.2);
                display: flex;
                gap: 10px;
            }
            
            .char-btn {
                flex: 1;
                padding: 10px 15px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .char-btn-confirm {
                background: linear-gradient(180deg, #4a8c4a 0%, #3a6c3a 100%);
                color: #fff;
            }
            
            .char-btn-confirm:hover {
                background: linear-gradient(180deg, #5aa05a 0%, #4a8c4a 100%);
            }
            
            .char-btn-cancel {
                background: rgba(60, 70, 90, 0.8);
                color: #c0c5cc;
            }
            
            .char-btn-cancel:hover {
                background: rgba(80, 90, 110, 0.8);
            }
            
            .char-current-outfit {
                background: rgba(30, 50, 70, 0.5);
                border: 1px solid rgba(100, 150, 200, 0.2);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .char-current-icon {
                width: 48px;
                height: 48px;
                background: rgba(20, 30, 45, 0.8);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .char-current-info h4 {
                margin: 0 0 4px 0;
                font-size: 14px;
                color: #fff;
            }
            
            .char-current-info p {
                margin: 0;
                font-size: 11px;
                color: #80a0c0;
            }
        `;
        document.head.appendChild(style);
    }
    
    getOutfitIcon(outfitId) {
        const icons = {
            adventurer: '🗺️',
            astronaut: '🚀',
            beach: '🏖️',
            suit: '💼',
            casual: '👕',
            farmer: '🌾',
            hoodie: '🎭',
            king: '👑',
            punk: '🎸',
            swat: '🎯',
            worker: '🔧'
        };
        return icons[outfitId] || '👤';
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = this.config.containerId;
        this.container.className = 'char-customization-panel';
        
        this.container.innerHTML = `
            <div class="char-panel-header">
                <span class="char-panel-title">Character Appearance</span>
                <button class="char-panel-close">✕</button>
            </div>
            <div class="char-panel-content">
                <div class="char-current-outfit">
                    <div class="char-current-icon">👤</div>
                    <div class="char-current-info">
                        <h4>Current: None</h4>
                        <p>Select an outfit below</p>
                    </div>
                </div>
                ${this.config.showArmorClass ? `
                <div class="char-armor-filter">
                    <button class="char-filter-btn active" data-filter="all">All</button>
                    <button class="char-filter-btn" data-filter="none">None</button>
                    <button class="char-filter-btn" data-filter="cloth">Cloth</button>
                    <button class="char-filter-btn" data-filter="light">Light</button>
                    <button class="char-filter-btn" data-filter="medium">Medium</button>
                    <button class="char-filter-btn" data-filter="heavy">Heavy</button>
                    <button class="char-filter-btn" data-filter="tech">Tech</button>
                </div>
                ` : ''}
                <div class="char-outfit-grid">
                    ${this.renderOutfitCards()}
                </div>
            </div>
            <div class="char-panel-footer">
                <button class="char-btn char-btn-cancel">Cancel</button>
                <button class="char-btn char-btn-confirm">Confirm</button>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.bindEvents();
    }
    
    renderOutfitCards(filter = 'all') {
        const outfits = Object.values(CharacterOutfits);
        
        return outfits
            .filter(outfit => filter === 'all' || outfit.armorClass === filter)
            .map(outfit => `
                <div class="char-outfit-card" data-outfit="${outfit.id}">
                    <div class="char-outfit-icon">${this.getOutfitIcon(outfit.id)}</div>
                    <div class="char-outfit-name">${outfit.name}</div>
                    <div class="char-outfit-class">${outfit.armorClass} Armor</div>
                </div>
            `).join('');
    }
    
    bindEvents() {
        // Close button
        this.container.querySelector('.char-panel-close').addEventListener('click', () => {
            this.hide();
        });
        
        // Filter buttons
        this.container.querySelectorAll('.char-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.container.querySelectorAll('.char-filter-btn').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                const grid = this.container.querySelector('.char-outfit-grid');
                grid.innerHTML = this.renderOutfitCards(filter);
                this.bindOutfitCards();
                
                // Re-select if still visible
                if (this.selectedOutfit) {
                    const card = grid.querySelector(`[data-outfit="${this.selectedOutfit}"]`);
                    if (card) card.classList.add('selected');
                }
            });
        });
        
        // Outfit cards
        this.bindOutfitCards();
        
        // Cancel button
        this.container.querySelector('.char-btn-cancel').addEventListener('click', () => {
            this.hide();
        });
        
        // Confirm button
        this.container.querySelector('.char-btn-confirm').addEventListener('click', () => {
            if (this.selectedOutfit && this.config.onConfirm) {
                this.config.onConfirm(this.selectedOutfit);
            }
            this.hide();
        });
    }
    
    bindOutfitCards() {
        this.container.querySelectorAll('.char-outfit-card').forEach(card => {
            card.addEventListener('click', async () => {
                const outfitId = card.dataset.outfit;
                
                // Update selection UI
                this.container.querySelectorAll('.char-outfit-card').forEach(c => 
                    c.classList.remove('selected')
                );
                card.classList.add('selected');
                
                this.selectedOutfit = outfitId;
                
                // Update current outfit display
                const outfit = Object.values(CharacterOutfits).find(o => o.id === outfitId);
                if (outfit) {
                    const currentIcon = this.container.querySelector('.char-current-icon');
                    const currentInfo = this.container.querySelector('.char-current-info');
                    currentIcon.textContent = this.getOutfitIcon(outfitId);
                    currentInfo.innerHTML = `
                        <h4>Current: ${outfit.name}</h4>
                        <p>${outfit.description}</p>
                    `;
                }
                
                // Load outfit on character
                if (this.characterSystem) {
                    await this.characterSystem.loadOutfit(outfitId);
                }
                
                // Callback
                if (this.config.onOutfitChange) {
                    this.config.onOutfitChange(outfitId);
                }
            });
        });
    }
    
    show() {
        this.container.classList.add('visible');
        this.isVisible = true;
        
        // Update current outfit display
        if (this.characterSystem && this.characterSystem.currentOutfit) {
            const outfit = this.characterSystem.currentOutfit;
            const currentIcon = this.container.querySelector('.char-current-icon');
            const currentInfo = this.container.querySelector('.char-current-info');
            currentIcon.textContent = this.getOutfitIcon(outfit.id);
            currentInfo.innerHTML = `
                <h4>Current: ${outfit.name}</h4>
                <p>${outfit.description}</p>
            `;
            
            // Highlight current in grid
            this.selectedOutfit = outfit.id;
            const card = this.container.querySelector(`[data-outfit="${outfit.id}"]`);
            if (card) card.classList.add('selected');
        }
    }
    
    hide() {
        this.container.classList.remove('visible');
        this.isVisible = false;
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default CharacterCustomizationUI;

/**
 * CharacterModelSelector
 * 
 * UI for selecting character model/class using KayKit characters.
 * Shows available character models with preview and class info.
 */

import { KayKitCharacter } from '../player/KayKitCharacterSystem.js';

export class CharacterModelSelector {
    constructor(options = {}) {
        this.onSelect = options.onSelect || null;
        this.onConfirm = options.onConfirm || null;
        this.selectedModel = options.defaultModel || 'knight';
        this.isOpen = false;
        this.container = null;
        
        // Character class descriptions
        this.classInfo = {
            knight: {
                name: 'Knight',
                class: 'Warrior',
                description: 'A stalwart defender clad in heavy armor. Masters of sword and shield.',
                color: '#4a90d9'
            },
            barbarian: {
                name: 'Barbarian',
                class: 'Warrior',
                description: 'A fierce berserker who overwhelms foes with raw power and fury.',
                color: '#d94a4a'
            },
            mage: {
                name: 'Mage',
                class: 'Mage',
                description: 'A wielder of arcane arts, commanding the elements with devastating spells.',
                color: '#9b4ad9'
            },
            ranger: {
                name: 'Ranger',
                class: 'Ranger',
                description: 'A skilled marksman and tracker, deadly at range and swift on foot.',
                color: '#4ad94a'
            },
            rogue: {
                name: 'Rogue',
                class: 'Rogue',
                description: 'A cunning assassin who strikes from the shadows with lethal precision.',
                color: '#d9d94a'
            },
            rogue_hooded: {
                name: 'Rogue (Hooded)',
                class: 'Rogue',
                description: 'A mysterious figure cloaked in darkness, master of stealth and subterfuge.',
                color: '#8a8a8a'
            }
        };
        
        this.createUI();
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'character-model-selector';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 3000;
            font-family: 'Segoe UI', Arial, sans-serif;
        `;
        
        this.container.innerHTML = `
            <div class="selector-panel" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                padding: 30px;
                max-width: 900px;
                width: 90%;
                box-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
            ">
                <h2 style="
                    text-align: center;
                    color: #00d4ff;
                    margin: 0 0 25px 0;
                    font-size: 28px;
                    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
                ">Choose Your Character</h2>
                
                <div id="model-grid" style="
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                "></div>
                
                <div id="selected-info" style="
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                    min-height: 80px;
                ">
                    <h3 id="selected-name" style="color: #00d4ff; margin: 0 0 5px 0;">Knight</h3>
                    <p id="selected-class" style="color: #888; margin: 0 0 10px 0; font-size: 14px;">Warrior</p>
                    <p id="selected-desc" style="color: #ccc; margin: 0; font-size: 14px;">A stalwart defender clad in heavy armor.</p>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="cancel-model-btn" style="
                        padding: 12px 30px;
                        font-size: 16px;
                        background: #2a2a3e;
                        color: #888;
                        border: 2px solid #444;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">Cancel</button>
                    <button id="confirm-model-btn" style="
                        padding: 12px 40px;
                        font-size: 16px;
                        background: linear-gradient(90deg, #00d4ff 0%, #00ffaa 100%);
                        color: #000;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.2s;
                    ">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        this.populateGrid();
        this.setupEvents();
        this.updateSelectedInfo(this.selectedModel);
    }
    
    populateGrid() {
        const grid = this.container.querySelector('#model-grid');
        const characters = Object.values(KayKitCharacter);
        
        characters.forEach(char => {
            const info = this.classInfo[char.id] || { name: char.name, class: char.class, description: '', color: '#666' };
            
            const card = document.createElement('div');
            card.className = 'model-card';
            card.dataset.modelId = char.id;
            card.style.cssText = `
                background: rgba(40, 40, 60, 0.8);
                border: 2px solid #333;
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            `;
            
            card.innerHTML = `
                <div style="
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 10px;
                    background: linear-gradient(135deg, ${info.color}44 0%, ${info.color}22 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    border: 2px solid ${info.color};
                ">${this.getClassIcon(char.class)}</div>
                <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 16px;">${info.name}</h4>
                <p style="color: ${info.color}; margin: 0; font-size: 12px;">${info.class}</p>
            `;
            
            card.addEventListener('click', () => this.selectModel(char.id));
            card.addEventListener('mouseenter', () => {
                if (this.selectedModel !== char.id) {
                    card.style.borderColor = info.color;
                    card.style.transform = 'translateY(-3px)';
                }
            });
            card.addEventListener('mouseleave', () => {
                if (this.selectedModel !== char.id) {
                    card.style.borderColor = '#333';
                    card.style.transform = 'translateY(0)';
                }
            });
            
            grid.appendChild(card);
        });
    }
    
    getClassIcon(className) {
        const icons = {
            warrior: '⚔️',
            mage: '🔮',
            ranger: '🏹',
            rogue: '🗡️'
        };
        return icons[className] || '👤';
    }
    
    setupEvents() {
        // Cancel button
        this.container.querySelector('#cancel-model-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Confirm button
        this.container.querySelector('#confirm-model-btn').addEventListener('click', () => {
            if (this.onConfirm) {
                this.onConfirm(this.selectedModel);
            }
            this.close();
        });
        
        // ESC to close
        this._escHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', this._escHandler);
    }
    
    selectModel(modelId) {
        this.selectedModel = modelId;
        this.updateSelectedInfo(modelId);
        this.updateCardSelection(modelId);
        
        if (this.onSelect) {
            this.onSelect(modelId);
        }
    }
    
    updateSelectedInfo(modelId) {
        const info = this.classInfo[modelId] || { name: modelId, class: 'Unknown', description: '' };
        
        this.container.querySelector('#selected-name').textContent = info.name;
        this.container.querySelector('#selected-name').style.color = info.color || '#00d4ff';
        this.container.querySelector('#selected-class').textContent = info.class;
        this.container.querySelector('#selected-desc').textContent = info.description;
    }
    
    updateCardSelection(modelId) {
        const cards = this.container.querySelectorAll('.model-card');
        cards.forEach(card => {
            const info = this.classInfo[card.dataset.modelId] || { color: '#666' };
            if (card.dataset.modelId === modelId) {
                card.style.borderColor = '#00ffaa';
                card.style.background = 'rgba(0, 255, 170, 0.15)';
                card.style.transform = 'translateY(-3px)';
            } else {
                card.style.borderColor = '#333';
                card.style.background = 'rgba(40, 40, 60, 0.8)';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    open(currentModel = null) {
        if (currentModel) {
            this.selectedModel = currentModel;
            this.updateSelectedInfo(currentModel);
            this.updateCardSelection(currentModel);
        }
        
        this.container.style.display = 'flex';
        this.isOpen = true;
    }
    
    close() {
        this.container.style.display = 'none';
        this.isOpen = false;
    }
    
    getSelectedModel() {
        return this.selectedModel;
    }
    
    dispose() {
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

export default CharacterModelSelector;

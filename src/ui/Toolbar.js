export class Toolbar {
    constructor() {
        this.slots = 24; // 2 rows of 12
        this.currentToolbar = 0; // 0-5 for 6 swappable toolbars
        this.toolbars = Array(6).fill(null).map(() => Array(24).fill(null));
        this.container = null;
        
        this.create();
        this.setupKeyboardShortcuts();
    }
    
    create() {
        // Create toolbar container
        this.container = document.createElement('div');
        this.container.id = 'toolbar';
        this.container.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            display: grid;
            grid-template-columns: repeat(12, 42px);
            grid-template-rows: repeat(2, 42px);
            gap: 4px;
            background: rgba(0, 0, 0, 0.8);
            padding: 8px;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            z-index: 200;
        `;
        
        // Create slots
        for (let i = 0; i < this.slots; i++) {
            const slot = document.createElement('div');
            slot.className = 'toolbar-slot';
            slot.dataset.index = i;
            slot.style.cssText = `
                width: 42px;
                height: 42px;
                background: rgba(40, 40, 40, 0.9);
                border: 2px solid rgba(80, 80, 80, 0.8);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                position: relative;
                transition: all 0.2s;
            `;
            
            // Add keybind label
            const keybind = this.getKeybindLabel(i);
            const label = document.createElement('span');
            label.textContent = keybind;
            label.style.cssText = `
                position: absolute;
                top: 2px;
                left: 3px;
                font-size: 10px;
                color: #888;
                font-weight: bold;
            `;
            slot.appendChild(label);
            
            // Click handler
            slot.addEventListener('click', () => this.useSlot(i));
            
            // Hover effect
            slot.addEventListener('mouseenter', () => {
                slot.style.border = '2px solid rgba(255, 200, 0, 0.8)';
                slot.style.background = 'rgba(60, 60, 40, 0.9)';
            });
            slot.addEventListener('mouseleave', () => {
                slot.style.border = '2px solid rgba(80, 80, 80, 0.8)';
                slot.style.background = 'rgba(40, 40, 40, 0.9)';
            });
            
            this.container.appendChild(slot);
        }
        
        // Add toolbar indicator
        const indicator = document.createElement('div');
        indicator.id = 'toolbar-indicator';
        indicator.textContent = `Toolbar ${this.currentToolbar + 1}`;
        indicator.style.cssText = `
            position: absolute;
            top: -25px;
            left: 8px;
            font-size: 12px;
            color: #ffaa00;
            font-weight: bold;
        `;
        this.container.appendChild(indicator);
        
        document.body.appendChild(this.container);
    }
    
    getKeybindLabel(index) {
        if (index < 10) return (index + 1) % 10; // 1-9, 0
        if (index === 10) return '-';
        if (index === 11) return '=';
        if (index < 22) return 'S' + ((index - 12 + 1) % 10); // Shift+1-9,0
        if (index === 22) return 'S-';
        if (index === 23) return 'S=';
        return '';
    }
    
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Don't trigger if typing in chat
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            let slotIndex = -1;
            
            // Top row: 1-0, -, =
            if (e.key >= '1' && e.key <= '9' && !e.shiftKey && !e.ctrlKey) {
                slotIndex = parseInt(e.key) - 1;
            } else if (e.key === '0' && !e.shiftKey && !e.ctrlKey) {
                slotIndex = 9;
            } else if (e.key === '-' && !e.shiftKey && !e.ctrlKey) {
                slotIndex = 10;
            } else if (e.key === '=' && !e.shiftKey && !e.ctrlKey) {
                slotIndex = 11;
            }
            // Bottom row: Shift+1-0, -, =
            else if (e.key >= '1' && e.key <= '9' && e.shiftKey && !e.ctrlKey) {
                slotIndex = 12 + parseInt(e.key) - 1;
            } else if (e.key === '0' && e.shiftKey && !e.ctrlKey) {
                slotIndex = 21;
            } else if (e.key === '-' && e.shiftKey && !e.ctrlKey) {
                slotIndex = 22;
            } else if (e.key === '=' && e.shiftKey && !e.ctrlKey) {
                slotIndex = 23;
            }
            // Switch toolbars: Ctrl+1-6
            else if (e.key >= '1' && e.key <= '6' && e.ctrlKey) {
                this.switchToolbar(parseInt(e.key) - 1);
                e.preventDefault();
                return;
            }
            
            if (slotIndex >= 0) {
                this.useSlot(slotIndex);
                e.preventDefault();
            }
        });
    }
    
    useSlot(index) {
        const item = this.toolbars[this.currentToolbar][index];
        if (item) {
            console.log(`Using toolbar slot ${index}:`, item);
            // TODO: Trigger ability/item use
        } else {
            console.log(`Toolbar slot ${index} is empty`);
        }
        
        // Visual feedback
        const slot = this.container.children[index];
        slot.style.transform = 'scale(0.9)';
        setTimeout(() => {
            slot.style.transform = 'scale(1)';
        }, 100);
    }
    
    switchToolbar(toolbarIndex) {
        if (toolbarIndex < 0 || toolbarIndex >= 6) return;
        
        this.currentToolbar = toolbarIndex;
        const indicator = document.getElementById('toolbar-indicator');
        if (indicator) {
            indicator.textContent = `Toolbar ${toolbarIndex + 1}`;
        }
        
        // TODO: Update slot displays
        console.log(`Switched to toolbar ${toolbarIndex + 1}`);
    }
    
    setSlotItem(toolbarIndex, slotIndex, item) {
        if (toolbarIndex >= 0 && toolbarIndex < 6 && slotIndex >= 0 && slotIndex < 24) {
            this.toolbars[toolbarIndex][slotIndex] = item;
        }
    }
    
    getSlotItem(toolbarIndex, slotIndex) {
        return this.toolbars[toolbarIndex]?.[slotIndex] || null;
    }
}

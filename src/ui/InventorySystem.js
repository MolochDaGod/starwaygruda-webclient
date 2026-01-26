export class InventorySystem {
    constructor() {
        this.isVisible = false;
        this.selectedItem = null;
        this.draggedItem = null;
        this.inventory = {
            slots: Array(80).fill(null), // 8x10 grid
            credits: 0,
            bank: 0
        };
        this.containers = new Map();
        this.filters = {
            type: 'all',
            quality: 'all',
            search: ''
        };
        
        this.createUI();
        this.setupEventListeners();
        this.loadInventoryData();
    }
    
    createUI() {
        // Main inventory window
        this.window = document.createElement('div');
        this.window.id = 'inventory-window';
        this.window.className = 'game-window inventory-window hidden';
        
        this.window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="fas fa-backpack"></i>
                    Inventory
                </div>
                <div class="window-controls">
                    <button class="minimize-btn"><i class="fas fa-minus"></i></button>
                    <button class="close-btn" onclick="window.inventorySystem?.hide()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            
            <div class="window-content">
                <div class="inventory-header">
                    <div class="credits-info">
                        <div class="credit-item">
                            <i class="fas fa-coins"></i>
                            Cash: <span id="cash-credits">0</span>
                        </div>
                        <div class="credit-item">
                            <i class="fas fa-university"></i>
                            Bank: <span id="bank-credits">0</span>
                        </div>
                    </div>
                    
                    <div class="inventory-filters">
                        <select id="type-filter">
                            <option value="all">All Items</option>
                            <option value="weapons">Weapons</option>
                            <option value="armor">Armor</option>
                            <option value="resources">Resources</option>
                            <option value="components">Components</option>
                            <option value="consumables">Consumables</option>
                            <option value="misc">Miscellaneous</option>
                        </select>
                        
                        <select id="quality-filter">
                            <option value="all">Any Quality</option>
                            <option value="poor">Poor</option>
                            <option value="normal">Normal</option>
                            <option value="good">Good</option>
                            <option value="exceptional">Exceptional</option>
                            <option value="legendary">Legendary</option>
                        </select>
                        
                        <input type="text" id="search-filter" placeholder="Search items...">
                    </div>
                </div>
                
                <div class="inventory-main">
                    <div class="inventory-grid" id="inventory-grid">
                        <!-- Generated dynamically -->
                    </div>
                    
                    <div class="item-details" id="item-details">
                        <div class="no-item-selected">
                            <i class="fas fa-mouse-pointer"></i>
                            <p>Select an item to view details</p>
                        </div>
                    </div>
                </div>
                
                <div class="inventory-actions">
                    <button id="sort-btn" class="action-btn">
                        <i class="fas fa-sort"></i> Sort
                    </button>
                    <button id="stack-btn" class="action-btn">
                        <i class="fas fa-layer-group"></i> Stack
                    </button>
                    <button id="repair-btn" class="action-btn">
                        <i class="fas fa-tools"></i> Repair All
                    </button>
                    <button id="destroy-btn" class="action-btn danger">
                        <i class="fas fa-trash"></i> Destroy
                    </button>
                </div>
                
                <div class="container-tabs" id="container-tabs">
                    <div class="tab active" data-container="inventory">
                        <i class="fas fa-backpack"></i> Inventory
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .inventory-window {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                height: 600px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #00d4ff;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0, 212, 255, 0.3);
                z-index: 1001;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
            }
            
            .inventory-window.hidden {
                display: none;
            }
            
            .window-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: rgba(0, 212, 255, 0.1);
                border-bottom: 1px solid #00d4ff;
                border-radius: 13px 13px 0 0;
            }
            
            .window-title {
                font-size: 18px;
                font-weight: bold;
                color: #00d4ff;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .window-controls {
                display: flex;
                gap: 5px;
            }
            
            .window-controls button {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 5px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .window-controls button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }
            
            .window-content {
                flex: 1;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .inventory-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .credits-info {
                display: flex;
                gap: 20px;
            }
            
            .credit-item {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(0, 0, 0, 0.3);
                padding: 8px 12px;
                border-radius: 8px;
                border: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .credit-item i {
                color: #ffda79;
            }
            
            .inventory-filters {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .inventory-filters select,
            .inventory-filters input {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(0, 212, 255, 0.5);
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 12px;
            }
            
            .inventory-filters select:focus,
            .inventory-filters input:focus {
                outline: none;
                border-color: #00d4ff;
                box-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
            }
            
            .inventory-main {
                flex: 1;
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 20px;
            }
            
            .inventory-grid {
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                grid-template-rows: repeat(10, 1fr);
                gap: 3px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                height: 400px;
            }
            
            .inventory-slot {
                aspect-ratio: 1;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
                overflow: hidden;
            }
            
            .inventory-slot:hover {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.1);
            }
            
            .inventory-slot.occupied {
                background: rgba(0, 100, 200, 0.2);
                border-color: #00d4ff;
            }
            
            .inventory-slot.selected {
                background: rgba(0, 255, 136, 0.2);
                border-color: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            }
            
            .inventory-slot.drag-over {
                background: rgba(255, 215, 0, 0.3);
                border-color: #ffda79;
            }
            
            .item-icon {
                width: 32px;
                height: 32px;
                background: #666;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .item-quantity {
                position: absolute;
                bottom: 2px;
                right: 2px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                font-size: 10px;
                padding: 1px 3px;
                border-radius: 2px;
                min-width: 12px;
                text-align: center;
            }
            
            .item-quality {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .quality-poor { background: #666; }
            .quality-normal { background: #fff; }
            .quality-good { background: #1eff00; }
            .quality-exceptional { background: #0070dd; }
            .quality-legendary { background: #a335ee; }
            
            .item-details {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 10px;
                padding: 15px;
                height: 400px;
                overflow-y: auto;
            }
            
            .no-item-selected {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
                text-align: center;
            }
            
            .no-item-selected i {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .item-detail-card {
                display: none;
            }
            
            .item-detail-card.active {
                display: block;
            }
            
            .item-detail-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .item-detail-icon {
                width: 48px;
                height: 48px;
                background: #666;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .item-detail-info h3 {
                margin: 0 0 5px 0;
                color: #00d4ff;
            }
            
            .item-detail-info .item-type {
                color: #ccc;
                font-size: 12px;
            }
            
            .item-stats {
                margin-top: 15px;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .stat-item:last-child {
                border-bottom: none;
            }
            
            .stat-name {
                color: #ccc;
            }
            
            .stat-value {
                color: white;
                font-weight: bold;
            }
            
            .inventory-actions {
                display: flex;
                gap: 10px;
                padding-top: 15px;
                border-top: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .action-btn {
                flex: 1;
                padding: 12px;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid #00d4ff;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 12px;
            }
            
            .action-btn:hover {
                background: rgba(0, 212, 255, 0.2);
                transform: translateY(-2px);
            }
            
            .action-btn.danger {
                border-color: #ff4757;
                background: rgba(255, 71, 87, 0.1);
            }
            
            .action-btn.danger:hover {
                background: rgba(255, 71, 87, 0.2);
            }
            
            .container-tabs {
                display: flex;
                gap: 5px;
                margin-top: 10px;
            }
            
            .tab {
                padding: 8px 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 8px 8px 0 0;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                transition: all 0.3s;
            }
            
            .tab:hover {
                background: rgba(0, 212, 255, 0.1);
            }
            
            .tab.active {
                background: rgba(0, 212, 255, 0.2);
                border-color: #00d4ff;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #00d4ff;
                border-radius: 5px;
                padding: 10px;
                color: white;
                font-size: 12px;
                z-index: 10000;
                max-width: 250px;
                pointer-events: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
            
            .tooltip h4 {
                margin: 0 0 5px 0;
                color: #00d4ff;
            }
            
            .tooltip .item-type {
                color: #ccc;
                font-style: italic;
                margin-bottom: 8px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.window);
        
        this.generateInventoryGrid();
    }
    
    generateInventoryGrid() {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';
        
        for (let i = 0; i < 80; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            // Add item if exists
            if (this.inventory.slots[i]) {
                this.renderItemInSlot(slot, this.inventory.slots[i], i);
            }
            
            grid.appendChild(slot);
        }
    }
    
    renderItemInSlot(slot, item, slotIndex) {
        slot.classList.add('occupied');
        slot.innerHTML = `
            <div class="item-icon" style="background: ${item.color || '#666'}">
                <i class="${item.icon || 'fas fa-cube'}"></i>
            </div>
            ${item.quantity > 1 ? `<div class="item-quantity">${item.quantity}</div>` : ''}
            <div class="item-quality quality-${item.quality || 'normal'}"></div>
        `;
        
        // Add tooltip
        slot.addEventListener('mouseenter', (e) => this.showTooltip(e, item));
        slot.addEventListener('mouseleave', () => this.hideTooltip());
        slot.addEventListener('click', () => this.selectItem(slotIndex));
    }
    
    setupEventListeners() {
        // Window dragging
        const header = this.window.querySelector('.window-header');
        this.setupWindowDragging(header);
        
        // Filters
        document.getElementById('type-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('quality-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('search-filter').addEventListener('input', () => this.applyFilters());
        
        // Actions
        document.getElementById('sort-btn').addEventListener('click', () => this.sortInventory());
        document.getElementById('stack-btn').addEventListener('click', () => this.stackItems());
        document.getElementById('repair-btn').addEventListener('click', () => this.repairAll());
        document.getElementById('destroy-btn').addEventListener('click', () => this.destroySelected());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'I' || e.key === 'i') {
                if (!e.ctrlKey && !e.altKey) {
                    this.toggle();
                }
            }
        });
    }
    
    setupWindowDragging(header) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = this.window.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault();
        });
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            this.window.style.left = (startLeft + deltaX) + 'px';
            this.window.style.top = (startTop + deltaY) + 'px';
            this.window.style.transform = 'none';
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }
    
    showTooltip(event, item) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <h4>${item.name}</h4>
            <div class="item-type">${item.type || 'Unknown'}</div>
            <div><strong>Quality:</strong> ${item.quality || 'Normal'}</div>
            ${item.damage ? `<div><strong>Damage:</strong> ${item.damage}</div>` : ''}
            ${item.armor ? `<div><strong>Armor:</strong> ${item.armor}</div>` : ''}
            ${item.durability ? `<div><strong>Durability:</strong> ${item.durability}/${item.maxDurability}</div>` : ''}
            ${item.description ? `<div style="margin-top: 8px; font-style: italic;">${item.description}</div>` : ''}
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = (rect.right + 10) + 'px';
        tooltip.style.top = rect.top + 'px';
        
        // Adjust if off-screen
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = (window.innerHeight - tooltipRect.height - 10) + 'px';
        }
        
        this.currentTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
    
    selectItem(slotIndex) {
        // Clear previous selection
        document.querySelectorAll('.inventory-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Select new item
        const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
        if (slot && this.inventory.slots[slotIndex]) {
            slot.classList.add('selected');
            this.selectedItem = slotIndex;
            this.showItemDetails(this.inventory.slots[slotIndex]);
        }
    }
    
    showItemDetails(item) {
        const detailsPanel = document.getElementById('item-details');
        detailsPanel.innerHTML = `
            <div class="item-detail-card active">
                <div class="item-detail-header">
                    <div class="item-detail-icon" style="background: ${item.color || '#666'}">
                        <i class="${item.icon || 'fas fa-cube'}"></i>
                    </div>
                    <div class="item-detail-info">
                        <h3>${item.name}</h3>
                        <div class="item-type">${item.type || 'Unknown Item'}</div>
                    </div>
                </div>
                
                <div class="item-stats">
                    <div class="stat-item">
                        <span class="stat-name">Quality:</span>
                        <span class="stat-value">${item.quality || 'Normal'}</span>
                    </div>
                    ${item.quantity > 1 ? `
                        <div class="stat-item">
                            <span class="stat-name">Quantity:</span>
                            <span class="stat-value">${item.quantity}</span>
                        </div>
                    ` : ''}
                    ${item.damage ? `
                        <div class="stat-item">
                            <span class="stat-name">Damage:</span>
                            <span class="stat-value">${item.damage}</span>
                        </div>
                    ` : ''}
                    ${item.armor ? `
                        <div class="stat-item">
                            <span class="stat-name">Armor:</span>
                            <span class="stat-value">${item.armor}</span>
                        </div>
                    ` : ''}
                    ${item.durability ? `
                        <div class="stat-item">
                            <span class="stat-name">Durability:</span>
                            <span class="stat-value">${item.durability}/${item.maxDurability}</span>
                        </div>
                    ` : ''}
                    ${item.weight ? `
                        <div class="stat-item">
                            <span class="stat-name">Weight:</span>
                            <span class="stat-value">${item.weight} kg</span>
                        </div>
                    ` : ''}
                </div>
                
                ${item.description ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0, 212, 255, 0.3);">
                        <p style="font-style: italic; color: #ccc; margin: 0;">${item.description}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    applyFilters() {
        const typeFilter = document.getElementById('type-filter').value;
        const qualityFilter = document.getElementById('quality-filter').value;
        const searchFilter = document.getElementById('search-filter').value.toLowerCase();
        
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            const item = this.inventory.slots[index];
            let visible = true;
            
            if (item) {
                if (typeFilter !== 'all' && item.type !== typeFilter) visible = false;
                if (qualityFilter !== 'all' && item.quality !== qualityFilter) visible = false;
                if (searchFilter && !item.name.toLowerCase().includes(searchFilter)) visible = false;
            }
            
            slot.style.display = visible ? 'flex' : 'none';
        });
    }
    
    sortInventory() {
        // Sort by type, then quality, then name
        const items = this.inventory.slots.filter(item => item !== null);
        const typeOrder = ['weapons', 'armor', 'resources', 'components', 'consumables', 'misc'];
        const qualityOrder = ['poor', 'normal', 'good', 'exceptional', 'legendary'];
        
        items.sort((a, b) => {
            const typeA = typeOrder.indexOf(a.type) !== -1 ? typeOrder.indexOf(a.type) : 999;
            const typeB = typeOrder.indexOf(b.type) !== -1 ? typeOrder.indexOf(b.type) : 999;
            
            if (typeA !== typeB) return typeA - typeB;
            
            const qualityA = qualityOrder.indexOf(a.quality) !== -1 ? qualityOrder.indexOf(a.quality) : 999;
            const qualityB = qualityOrder.indexOf(b.quality) !== -1 ? qualityOrder.indexOf(b.quality) : 999;
            
            if (qualityA !== qualityB) return qualityB - qualityA; // Higher quality first
            
            return a.name.localeCompare(b.name);
        });
        
        // Clear inventory and refill
        this.inventory.slots.fill(null);
        items.forEach((item, index) => {
            if (index < 80) {
                this.inventory.slots[index] = item;
            }
        });
        
        this.generateInventoryGrid();
        console.log('📦 Inventory sorted');
    }
    
    stackItems() {
        const stackableItems = new Map();
        
        // Group stackable items
        this.inventory.slots.forEach((item, index) => {
            if (item && item.stackable) {
                const key = `${item.name}_${item.quality}`;
                if (!stackableItems.has(key)) {
                    stackableItems.set(key, []);
                }
                stackableItems.get(key).push({ item, index });
            }
        });
        
        // Stack them
        stackableItems.forEach((items) => {
            if (items.length > 1) {
                const totalQuantity = items.reduce((sum, { item }) => sum + item.quantity, 0);
                const maxStack = items[0].item.maxStack || 100;
                
                // Keep first item with full quantity
                this.inventory.slots[items[0].index].quantity = Math.min(totalQuantity, maxStack);
                
                // Remove other stacks
                for (let i = 1; i < items.length; i++) {
                    this.inventory.slots[items[i].index] = null;
                }
                
                // If overflow, create new stacks
                let remaining = totalQuantity - maxStack;
                let slotIndex = 1;
                while (remaining > 0 && slotIndex < items.length) {
                    const stackSize = Math.min(remaining, maxStack);
                    this.inventory.slots[items[slotIndex].index] = {
                        ...items[0].item,
                        quantity: stackSize
                    };
                    remaining -= stackSize;
                    slotIndex++;
                }
            }
        });
        
        this.generateInventoryGrid();
        console.log('📦 Items stacked');
    }
    
    repairAll() {
        let repairCount = 0;
        this.inventory.slots.forEach(item => {
            if (item && item.durability && item.durability < item.maxDurability) {
                item.durability = item.maxDurability;
                repairCount++;
            }
        });
        
        this.generateInventoryGrid();
        console.log(`🔧 Repaired ${repairCount} items`);
    }
    
    destroySelected() {
        if (this.selectedItem !== null) {
            const item = this.inventory.slots[this.selectedItem];
            if (item && confirm(`Are you sure you want to destroy ${item.name}?`)) {
                this.inventory.slots[this.selectedItem] = null;
                this.selectedItem = null;
                
                // Clear details panel
                const detailsPanel = document.getElementById('item-details');
                detailsPanel.innerHTML = `
                    <div class="no-item-selected">
                        <i class="fas fa-mouse-pointer"></i>
                        <p>Select an item to view details</p>
                    </div>
                `;
                
                this.generateInventoryGrid();
                console.log('🗑️ Item destroyed');
            }
        }
    }
    
    loadInventoryData() {
        // Sample inventory data
        const sampleItems = [
            { name: 'Vibrosword', type: 'weapons', quality: 'good', damage: 45, durability: 80, maxDurability: 100, icon: 'fas fa-sword', color: '#4A90E2' },
            { name: 'Composite Armor', type: 'armor', quality: 'exceptional', armor: 120, durability: 95, maxDurability: 100, icon: 'fas fa-shield-alt', color: '#7B68EE' },
            { name: 'Iron Ore', type: 'resources', quality: 'normal', quantity: 50, stackable: true, maxStack: 100, icon: 'fas fa-gem', color: '#8B4513' },
            { name: 'Stimpack', type: 'consumables', quality: 'normal', quantity: 5, stackable: true, maxStack: 10, icon: 'fas fa-syringe', color: '#32CD32' },
            { name: 'Circuit Board', type: 'components', quality: 'good', icon: 'fas fa-microchip', color: '#FFD700' },
            { name: 'Krayt Dragon Scale', type: 'misc', quality: 'legendary', description: 'A rare scale from the mighty Krayt Dragon of Tatooine', icon: 'fas fa-dragon', color: '#FF6347' }
        ];
        
        // Place items in random slots
        sampleItems.forEach((item, index) => {
            const slot = index * 5; // Spread them out
            if (slot < 80) {
                this.inventory.slots[slot] = item;
            }
        });
        
        // Set credits
        this.inventory.credits = 15000;
        this.inventory.bank = 250000;
        
        this.updateCreditsDisplay();
        this.generateInventoryGrid();
    }
    
    updateCreditsDisplay() {
        const cashElement = document.getElementById('cash-credits');
        const bankElement = document.getElementById('bank-credits');
        
        if (cashElement) cashElement.textContent = this.inventory.credits.toLocaleString();
        if (bankElement) bankElement.textContent = this.inventory.bank.toLocaleString();
    }
    
    show() {
        this.window.classList.remove('hidden');
        this.isVisible = true;
        window.inventorySystem = this; // Global access for HTML onclick
        console.log('📦 Inventory window opened');
    }
    
    hide() {
        this.window.classList.add('hidden');
        this.isVisible = false;
        console.log('📦 Inventory window closed');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    addItem(item) {
        // Find first empty slot
        const emptySlot = this.inventory.slots.findIndex(slot => slot === null);
        if (emptySlot !== -1) {
            this.inventory.slots[emptySlot] = item;
            this.generateInventoryGrid();
            return true;
        }
        return false; // Inventory full
    }
    
    removeItem(slotIndex) {
        if (this.inventory.slots[slotIndex]) {
            const item = this.inventory.slots[slotIndex];
            this.inventory.slots[slotIndex] = null;
            this.generateInventoryGrid();
            return item;
        }
        return null;
    }
}
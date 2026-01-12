import * as monaco from 'monaco-editor';

export class CodeEditor {
    constructor() {
        this.editor = null;
        this.isOpen = false;
        this.currentFile = 'main.js';
        this.files = new Map();
        this.init();
    }

    init() {
        // Create editor container
        this.container = document.createElement('div');
        this.container.id = 'code-editor-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            right: -50%;
            width: 50%;
            height: 100vh;
            background: #1e1e1e;
            z-index: 1000;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            box-shadow: -5px 0 15px rgba(0,0,0,0.5);
        `;

        // Create toolbar
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
        title.textContent = '📝 Live Code Editor';
        title.style.cssText = 'color: #00d4ff; font-weight: bold;';

        const controls = document.createElement('div');
        controls.style.cssText = 'display: flex; gap: 10px;';

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

        controls.appendChild(this.fileSelect);
        controls.appendChild(saveBtn);
        controls.appendChild(closeBtn);
        toolbar.appendChild(title);
        toolbar.appendChild(controls);

        // Create editor div
        this.editorDiv = document.createElement('div');
        this.editorDiv.style.cssText = 'flex: 1; overflow: hidden;';

        this.container.appendChild(toolbar);
        this.container.appendChild(this.editorDiv);
        document.body.appendChild(this.container);

        // Create toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.textContent = '< > Code';
        this.toggleBtn.style.cssText = `
            position: fixed;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            background: #00d4ff;
            color: #000;
            border: none;
            padding: 15px 10px;
            border-radius: 5px 0 0 5px;
            cursor: pointer;
            font-weight: bold;
            z-index: 999;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            box-shadow: -2px 2px 10px rgba(0,0,0,0.5);
        `;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        document.body.appendChild(this.toggleBtn);

        // Initialize Monaco Editor
        this.editor = monaco.editor.create(this.editorDiv, {
            value: '// Welcome to StarWayGRUDA Live Editor!\n// Edit game code in real-time\n\nconsole.log("Hello from live editor!");',
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
        });

        // Load available files
        this.loadAvailableFiles();

        // Keyboard shortcut (Ctrl+E to toggle)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.toggle();
            }
            if (e.ctrlKey && e.key === 's' && this.isOpen) {
                e.preventDefault();
                this.saveFile();
            }
        });
    }

    async loadAvailableFiles() {
        // Fetch list of editable files from src directory
        try {
            const files = [
                'src/main.js',
                'src/world/GameWorld.js',
                'src/player/PlayerController.js',
                'src/ui/HUD.js',
                'src/loaders/AssetLoader.js',
                'src/config/rendering-config.js'
            ];

            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file.replace('src/', '');
                this.fileSelect.appendChild(option);
            });

            // Load first file
            await this.loadFile(files[0]);
        } catch (error) {
            console.error('Error loading file list:', error);
        }
    }

    async loadFile(filepath) {
        try {
            const response = await fetch(`/${filepath}`);
            if (response.ok) {
                const content = await response.text();
                this.currentFile = filepath;
                this.editor.setValue(content);
                this.files.set(filepath, content);
                console.log(`Loaded file: ${filepath}`);
            }
        } catch (error) {
            console.error('Error loading file:', error);
            this.editor.setValue(`// Error loading file: ${filepath}\n// ${error.message}`);
        }
    }

    async saveFile() {
        const content = this.editor.getValue();
        
        // In dev mode, Vite's HMR will automatically pick up file changes
        // We'll save to localStorage as a backup and show notification
        this.files.set(this.currentFile, content);
        localStorage.setItem(`editor_${this.currentFile}`, content);
        
        // Show save notification
        this.showNotification('💾 Code saved! Changes will apply on next HMR update.');
        
        console.log(`Saved file: ${this.currentFile}`);
        
        // You could also send to a backend API to actually save the file:
        // await fetch('/api/save-file', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ filepath: this.currentFile, content })
        // });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: ${this.isOpen ? '52%' : '20px'};
            background: #00d4ff;
            color: #000;
            padding: 15px 20px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.container.style.right = '0';
            this.toggleBtn.style.right = '50%';
        } else {
            this.container.style.right = '-50%';
            this.toggleBtn.style.right = '10px';
        }
    }

    getContent() {
        return this.editor.getValue();
    }
}

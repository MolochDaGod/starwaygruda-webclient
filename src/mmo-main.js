import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { createNoise2D } from 'simplex-noise';
import { ProceduralArchitect } from './world/ProceduralArchitect.js';

// === GLOBAL STATE ===
const GAME = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    player: {
        velocity: new THREE.Vector3(),
        speed: 50,
        sprintMultiplier: 2,
        jumpForce: 20,
        isOnGround: false,
        health: 1000,
        maxHealth: 1000,
        level: 1,
        credits: 0,
        character: null,
        name: 'Wanderer',
        profession: 'Brawler',
        race: 'barbarian',
        color: 'brown',
        mesh: null
    },
    keyboard: {},
    clock: new THREE.Clock(),
    terrain: null,
    npcs: [],
    buildings: [],
    quests: [],
    architect: null,
    loadingManager: null,
    fbxLoader: null,
    characterMixer: null,
    characterAnimations: {}
};

const MOVEMENT_KEYS = {
    forward: ['KeyW', 'ArrowUp'],
    backward: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['Space'],
    sprint: ['ShiftLeft', 'ShiftRight']
};

// === CHARACTER CREATION ===
window.selectRace = function(race) {
    GAME.player.race = race;
    document.querySelectorAll('.option-grid .option-btn').forEach(btn => {
        if (btn.textContent.toLowerCase() === race) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    updateCharacterPreview();
};

window.selectProfession = function(prof) {
    GAME.player.profession = prof.charAt(0).toUpperCase() + prof.slice(1);
    document.querySelectorAll('.profession-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.profession-card').classList.add('selected');
};

window.selectColor = function(color) {
    GAME.player.color = color;
    document.querySelectorAll('.char-section .option-grid .option-btn').forEach(btn => {
        if (btn.textContent.toLowerCase() === color) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    updateCharacterPreview();
};

window.createCharacter = function() {
    const name = document.getElementById('char-name').value.trim();
    if (!name) {
        alert('Please enter a character name!');
        return;
    }
    
    GAME.player.name = name;
    document.getElementById('player-name').textContent = name;
    document.getElementById('player-profession').textContent = GAME.player.profession;
    
    // Hide character creation, show game
    document.getElementById('character-creation').style.display = 'none';
    
    // Lock pointer
    GAME.controls.lock();
    
    // Add chat message
    addChatMessage('system', `Welcome ${name}, the ${GAME.player.profession}!`);
    addChatMessage('system', 'Your adventure begins now...');
    
    // Update quest
    updateQuest('Welcome to StarWayGRUDA', 0, true);
    updateQuest('Welcome to StarWayGRUDA', 1, false);
};

function updateCharacterPreview() {
    // TODO: Load and display 3D character in preview pane
    // For now this is called when options change
}

// === INITIALIZATION ===
async function init() {
    updateLoadingProgress(10, 'Initializing Three.js...');
    
    // Scene
    GAME.scene = new THREE.Scene();
    GAME.scene.fog = new THREE.FogExp2(0x87CEEB, 0.001);
    GAME.scene.background = new THREE.Color(0x87CEEB);
    
    // Camera
    GAME.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    GAME.camera.position.set(0, 30, 100);
    
    // Renderer
    GAME.renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('game-canvas'),
        antialias: true 
    });
    GAME.renderer.setSize(window.innerWidth, window.innerHeight);
    GAME.renderer.shadowMap.enabled = true;
    GAME.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Controls
    GAME.controls = new PointerLockControls(GAME.camera, document.body);
    
    // Loading Manager
    GAME.loadingManager = new THREE.LoadingManager();
    GAME.fbxLoader = new FBXLoader(GAME.loadingManager);
    
    updateLoadingProgress(20, 'Creating terrain...');
    await createTerrain();
    
    updateLoadingProgress(40, 'Building massive cities...');
    await createMassiveBuildings();
    
    updateLoadingProgress(60, 'Spawning NPCs...');
    await createNPCs();
    
    updateLoadingProgress(70, 'Adding lighting...');
    createLighting();
    
    updateLoadingProgress(80, 'Creating player character...');
    await createPlayerCharacter();
    
    updateLoadingProgress(90, 'Initializing quests...');
    initializeQuests();
    
    updateLoadingProgress(95, 'Setting up controls...');
    setupControls();
    setupUI();
    
    updateLoadingProgress(100, 'Ready!');
    
    // Hide loading, show character creation
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('character-creation').style.display = 'block';
    }, 500);
    
    // Start render loop
    animate();
}

// === TERRAIN ===
async function createTerrain() {
    const size = 500;
    const segments = 200;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    
    // Heightmap with noise
    const noise2D = createNoise2D();
    const vertices = geometry.attributes.position.array;
    const colors = [];
    
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        
        // Multi-octave heightmap
        let height = 0;
        height += noise2D(x * 0.01, y * 0.01) * 15;
        height += noise2D(x * 0.05, y * 0.05) * 5;
        height += noise2D(x * 0.1, y * 0.1) * 2;
        
        // Flatten town center (100 unit radius)
        const distFromCenter = Math.sqrt(x * x + y * y);
        if (distFromCenter < 100) {
            const flattenFactor = 1 - (distFromCenter / 100);
            height *= (1 - flattenFactor);
        }
        
        vertices[i + 2] = height;
        
        // Vertex colors (sand gradient)
        const brightness = 0.6 + (height / 30) * 0.4;
        colors.push(brightness * 0.9, brightness * 0.8, brightness * 0.6);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    
    // Terrain texture
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Sand base
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, 512, 512);
    
    // Rocky patches
    for (let i = 0; i < 300; i++) {
        ctx.fillStyle = `rgba(${160 + Math.random() * 40}, ${140 + Math.random() * 30}, 100, 0.3)`;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.1
    });
    
    GAME.terrain = new THREE.Mesh(geometry, material);
    GAME.terrain.rotation.x = -Math.PI / 2;
    GAME.terrain.receiveShadow = true;
    GAME.scene.add(GAME.terrain);
}

// === MASSIVE BUILDINGS (10X SCALE WITH INTERIORS) ===
async function createMassiveBuildings() {
    GAME.architect = new ProceduralArchitect();
    
    const buildingPlacements = [
        // Town Center - Massive structures
        { type: 'townhall', x: 0, z: 0, rotation: 0, scale: 2.5 },
        
        // North District
        { type: 'cantina', x: -80, z: -80, rotation: Math.PI / 4, scale: 2 },
        { type: 'starport', x: 80, z: -80, rotation: -Math.PI / 4, scale: 2 },
        { type: 'hospital', x: 0, z: -120, rotation: 0, scale: 2 },
        
        // East District
        { type: 'cantina', x: 100, z: 0, rotation: Math.PI / 2, scale: 1.8 },
        { type: 'house', x: 120, z: 40, rotation: 0, scale: 1.5 },
        { type: 'house', x: 120, z: -40, rotation: 0, scale: 1.5 },
        
        // West District
        { type: 'hospital', x: -100, z: 0, rotation: -Math.PI / 2, scale: 1.8 },
        { type: 'house', x: -120, z: 40, rotation: Math.PI, scale: 1.5 },
        { type: 'house', x: -120, z: -40, rotation: Math.PI, scale: 1.5 },
        
        // South District
        { type: 'starport', x: -60, z: 80, rotation: Math.PI / 3, scale: 2 },
        { type: 'cantina', x: 60, z: 80, rotation: -Math.PI / 3, scale: 1.8 },
        
        // Outer Ring - Smaller houses
        { type: 'house', x: 140, z: 80, rotation: 0, scale: 1.2 },
        { type: 'house', x: 140, z: -80, rotation: 0, scale: 1.2 },
        { type: 'house', x: -140, z: 80, rotation: Math.PI, scale: 1.2 },
        { type: 'house', x: -140, z: -80, rotation: Math.PI, scale: 1.2 },
        
        // Additional structures for immersion
        { type: 'house', x: 0, z: 120, rotation: 0, scale: 1.3 },
        { type: 'house', x: 80, z: 120, rotation: -Math.PI / 6, scale: 1.3 },
        { type: 'house', x: -80, z: 120, rotation: Math.PI / 6, scale: 1.3 }
    ];
    
    for (const placement of buildingPlacements) {
        const building = GAME.architect.generateBuilding({
            type: placement.type,
            style: 'tatooine',
            hasInterior: true,
            floors: placement.type === 'townhall' ? 4 : placement.type === 'starport' ? 3 : placement.type === 'hospital' ? 3 : placement.type === 'cantina' ? 2 : 1
        });
        
        // 10X SCALE - Buildings are MASSIVE now
        const finalScale = placement.scale * 10;
        building.scale.set(finalScale, finalScale, finalScale);
        building.position.set(placement.x, 0, placement.z);
        building.rotation.y = placement.rotation;
        building.castShadow = true;
        building.receiveShadow = true;
        
        GAME.scene.add(building);
        GAME.buildings.push({
            mesh: building,
            type: placement.type,
            position: new THREE.Vector3(placement.x, 0, placement.z),
            interactable: true
        });
    }
}

// === NPCs WITH ANIMATIONS ===
async function createNPCs() {
    const npcPlacements = [
        // Town center NPCs
        { x: -20, z: 20, name: 'Quest Giver Aldric', type: 'quest', profession: 'brawler' },
        { x: 20, z: 20, name: 'Merchant Kara', type: 'vendor', profession: 'artisan' },
        { x: 0, z: 40, name: 'Healer Theron', type: 'healer', profession: 'medic' },
        
        // Cantina NPCs
        { x: -80, z: -70, name: 'Bartender Zyx', type: 'vendor', profession: 'entertainer' },
        { x: -75, z: -85, name: 'Musician Lyra', type: 'entertainer', profession: 'entertainer' },
        
        // Starport NPCs
        { x: 80, z: -70, name: 'Pilot Vance', type: 'transport', profession: 'scout' },
        { x: 85, z: -85, name: 'Engineer Mira', type: 'vendor', profession: 'artisan' },
        
        // Hospital NPCs
        { x: 0, z: -110, name: 'Doctor Reeves', type: 'healer', profession: 'medic' },
        { x: 10, z: -115, name: 'Nurse Elara', type: 'healer', profession: 'medic' },
        
        // Wandering NPCs
        { x: 50, z: 0, name: 'Guard Marcus', type: 'guard', profession: 'marksman' },
        { x: -50, z: 0, name: 'Guard Helena', type: 'guard', profession: 'marksman' },
        { x: 0, z: 60, name: 'Wanderer Kael', type: 'quest', profession: 'scout' },
        { x: 100, z: 40, name: 'Farmer Jorin', type: 'vendor', profession: 'artisan' },
        { x: -100, z: 40, name: 'Smith Garret', type: 'vendor', profession: 'artisan' },
        
        // More life in the city
        { x: 30, z: -30, name: 'Citizen Aria', type: 'civilian', profession: 'entertainer' },
        { x: -30, z: -30, name: 'Citizen Borin', type: 'civilian', profession: 'brawler' },
        { x: 60, z: 60, name: 'Citizen Celia', type: 'civilian', profession: 'scout' },
        { x: -60, z: 60, name: 'Citizen Drake', type: 'civilian', profession: 'marksman' }
    ];
    
    for (const npc of npcPlacements) {
        const npcMesh = createNPCMesh(npc.profession);
        npcMesh.position.set(npc.x, getTerrainHeight(npc.x, npc.z) + 5, npc.z);
        npcMesh.castShadow = true;
        GAME.scene.add(npcMesh);
        
        GAME.npcs.push({
            mesh: npcMesh,
            name: npc.name,
            type: npc.type,
            profession: npc.profession,
            position: npcMesh.position.clone(),
            dialogue: generateDialogue(npc.type, npc.name),
            questGiver: npc.type === 'quest',
            hasQuest: npc.type === 'quest',
            mixer: null,
            currentAnimation: 'idle'
        });
    }
}

function createNPCMesh(profession) {
    // Color coded by profession
    const professionColors = {
        brawler: 0xff4444,
        marksman: 0x44ff44,
        medic: 0x4444ff,
        artisan: 0xffaa44,
        scout: 0x44ffaa,
        entertainer: 0xff44ff
    };
    
    const group = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.CapsuleGeometry(2, 6, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: professionColors[profession] || 0x888888,
        roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 4;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const headGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 8.5;
    head.castShadow = true;
    group.add(head);
    
    // Name tag (sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#00ffaa';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(profession.toUpperCase(), 128, 40);
    
    const nameTexture = new THREE.CanvasTexture(canvas);
    const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
    const nameSprite = new THREE.Sprite(nameMaterial);
    nameSprite.scale.set(8, 2, 1);
    nameSprite.position.y = 12;
    group.add(nameSprite);
    
    return group;
}

function generateDialogue(type, name) {
    const dialogues = {
        quest: [
            `Greetings, traveler! I am ${name}. I have a task that requires someone of your skills.`,
            `The galaxy is in turmoil. Will you help us restore peace?`,
            `I've heard tales of your exploits. Are you ready for a real challenge?`
        ],
        vendor: [
            `Welcome to my shop! Looking to buy or sell?`,
            `I've got the finest goods in the sector. Take a look!`,
            `Credits talk, friend. What are you interested in?`
        ],
        healer: [
            `You look wounded. Let me help you.`,
            `Medical assistance available here. Stay safe out there.`,
            `Health is wealth, traveler. Don't neglect it.`
        ],
        transport: [
            `Need a ride? I can take you anywhere in the system.`,
            `Fast travel services available. Where do you need to go?`,
            `My ship is the fastest in the fleet. Hop aboard!`
        ],
        guard: [
            `Stay vigilant, citizen. Danger lurks everywhere.`,
            `This sector is under protection. Move along.`,
            `Report any suspicious activity to the authorities.`
        ],
        entertainer: [
            `Life is too short to be serious all the time!`,
            `Care for some music or a story?`,
            `Let me lift your spirits with a performance!`
        ],
        civilian: [
            `Hello there! Nice day, isn't it?`,
            `Have you explored the city yet? It's quite something.`,
            `I've lived here all my life. Feel free to ask me anything!`
        ]
    };
    
    const lines = dialogues[type] || dialogues.civilian;
    return lines[Math.floor(Math.random() * lines.length)];
}

// === PLAYER CHARACTER ===
async function createPlayerCharacter() {
    // Create a simple player representation for now
    // In full version, this would load actual Barbarian FBX
    const playerGeo = new THREE.CapsuleGeometry(1.5, 5, 8, 16);
    const playerMat = new THREE.MeshStandardMaterial({ 
        color: 0x0088ff,
        emissive: 0x004488,
        roughness: 0.5
    });
    
    GAME.player.mesh = new THREE.Mesh(playerGeo, playerMat);
    GAME.player.mesh.position.copy(GAME.camera.position);
    GAME.player.mesh.castShadow = true;
    // Don't add to scene - first person view
}

// === LIGHTING ===
function createLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    GAME.scene.add(ambient);
    
    // Sun
    const sun = new THREE.DirectionalLight(0xffffee, 1.2);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.camera.far = 500;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    GAME.scene.add(sun);
    
    // Hemisphere light for better ambience
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xD2B48C, 0.6);
    GAME.scene.add(hemiLight);
}

// === QUESTS ===
function initializeQuests() {
    GAME.quests = [
        {
            id: 'welcome',
            title: 'Welcome to StarWayGRUDA',
            objectives: [
                { text: 'Create your character', completed: false },
                { text: 'Explore the starting city', completed: false },
                { text: 'Talk to 3 NPCs', completed: false }
            ],
            reward: { credits: 100, exp: 50 },
            active: true
        },
        {
            id: 'first_mission',
            title: 'The Merchant\'s Request',
            objectives: [
                { text: 'Find 5 scrap metal pieces', completed: false },
                { text: 'Return to Merchant Kara', completed: false }
            ],
            reward: { credits: 250, exp: 100 },
            active: false
        }
    ];
}

function updateQuest(title, objectiveIndex, completed) {
    const quest = GAME.quests.find(q => q.title === title);
    if (quest && quest.objectives[objectiveIndex]) {
        quest.objectives[objectiveIndex].completed = completed;
        renderQuests();
    }
}

function renderQuests() {
    const questList = document.getElementById('quest-list');
    questList.innerHTML = '';
    
    GAME.quests.filter(q => q.active).forEach(quest => {
        const questDiv = document.createElement('div');
        questDiv.className = 'quest-item';
        
        let html = `<div class="quest-title">${quest.title}</div>`;
        quest.objectives.forEach(obj => {
            const icon = obj.completed ? '✓' : '▶';
            html += `<div class="quest-objective">${icon} ${obj.text}</div>`;
        });
        
        questDiv.innerHTML = html;
        questList.appendChild(questDiv);
    });
}

// === CONTROLS ===
function setupControls() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        GAME.keyboard[e.code] = true;
        
        // Hotkeys
        if (e.code === 'KeyH') toggleHelp();
        if (e.code === 'KeyT') showFastTravel();
        if (e.code === 'KeyE') interactWithNPC();
        if (e.code === 'Escape') {
            if (document.getElementById('hotkeys').style.display === 'block') {
                toggleHelp();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        GAME.keyboard[e.code] = false;
    });
    
    // Pointer lock
    GAME.controls.addEventListener('lock', () => {
        document.getElementById('crosshair').style.display = 'block';
    });
    
    GAME.controls.addEventListener('unlock', () => {
        document.getElementById('crosshair').style.display = 'none';
    });
    
    // Click to lock
    document.getElementById('game-canvas').addEventListener('click', () => {
        if (!GAME.controls.isLocked) {
            GAME.controls.lock();
        }
    });
    
    // Chat input
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const msg = e.target.value.trim();
            if (msg) {
                handleChatCommand(msg);
                e.target.value = '';
            }
        }
    });
}

function setupUI() {
    // Initialize minimap
    const minimap = document.getElementById('minimap');
    minimap.width = 250;
    minimap.height = 250;
    
    // Render initial quests
    renderQuests();
}

// === HELPERS ===
function updateLoadingProgress(percent, text) {
    document.getElementById('progress-bar').style.width = percent + '%';
    document.getElementById('loading-text').textContent = text;
}

function getTerrainHeight(x, z) {
    if (!GAME.terrain) return 0;
    
    const noise2D = createNoise2D();
    let height = 0;
    height += noise2D(x * 0.01, z * 0.01) * 15;
    height += noise2D(x * 0.05, z * 0.05) * 5;
    height += noise2D(x * 0.1, z * 0.1) * 2;
    
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 100) {
        const flattenFactor = 1 - (distFromCenter / 100);
        height *= (1 - flattenFactor);
    }
    
    return height;
}

window.toggleHelp = function() {
    const help = document.getElementById('hotkeys');
    help.style.display = help.style.display === 'block' ? 'none' : 'block';
};

function showFastTravel() {
    addChatMessage('system', 'Fast travel: /tp <x> <y> <z>');
}

function interactWithNPC() {
    // Find closest NPC
    const playerPos = GAME.camera.position;
    let closestNPC = null;
    let closestDist = Infinity;
    
    GAME.npcs.forEach(npc => {
        const dist = playerPos.distanceTo(npc.position);
        if (dist < closestDist && dist < 30) {
            closestDist = dist;
            closestNPC = npc;
        }
    });
    
    if (closestNPC) {
        addChatMessage('npc', `[${closestNPC.name}]: ${closestNPC.dialogue}`);
        
        if (closestNPC.hasQuest) {
            addChatMessage('system', 'Quest available! Check your quest log.');
            GAME.quests[1].active = true;
            renderQuests();
        }
    } else {
        addChatMessage('system', 'No one nearby to interact with.');
    }
}

function addChatMessage(type, text) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg chat-${type}`;
    msgDiv.textContent = type === 'system' ? `[System] ${text}` : text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatCommand(msg) {
    if (msg.startsWith('/tp ')) {
        const parts = msg.split(' ');
        if (parts.length === 4) {
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            GAME.camera.position.set(x, y, z);
            GAME.player.velocity.set(0, 0, 0);
            addChatMessage('system', `Teleported to ${x}, ${y}, ${z}`);
        }
    } else {
        addChatMessage('player', `You: ${msg}`);
    }
}

// === GAME LOOP ===
function animate() {
    requestAnimationFrame(animate);
    
    const delta = GAME.clock.getDelta();
    
    updatePlayer(delta);
    updateNPCs(delta);
    updateMinimap();
    updateHUD();
    
    GAME.renderer.render(GAME.scene, GAME.camera);
}

function updatePlayer(delta) {
    if (!GAME.controls.isLocked) return;
    
    const speed = GAME.player.speed * (GAME.keyboard.ShiftLeft || GAME.keyboard.ShiftRight ? GAME.player.sprintMultiplier : 1);
    
    // Movement
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    GAME.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    const moveDir = new THREE.Vector3();
    
    if (GAME.keyboard.KeyW || GAME.keyboard.ArrowUp) moveDir.add(forward);
    if (GAME.keyboard.KeyS || GAME.keyboard.ArrowDown) moveDir.sub(forward);
    if (GAME.keyboard.KeyA || GAME.keyboard.ArrowLeft) moveDir.sub(right);
    if (GAME.keyboard.KeyD || GAME.keyboard.ArrowRight) moveDir.add(right);
    
    moveDir.normalize().multiplyScalar(speed * delta);
    
    // Apply gravity
    GAME.player.velocity.y -= 40 * delta;
    
    // Jump
    if ((GAME.keyboard.Space) && GAME.player.isOnGround) {
        GAME.player.velocity.y = GAME.player.jumpForce;
        GAME.player.isOnGround = false;
    }
    
    // Apply velocity
    GAME.camera.position.x += moveDir.x + GAME.player.velocity.x * delta;
    GAME.camera.position.y += GAME.player.velocity.y * delta;
    GAME.camera.position.z += moveDir.z + GAME.player.velocity.z * delta;
    
    // Terrain collision
    const terrainHeight = getTerrainHeight(GAME.camera.position.x, GAME.camera.position.z);
    if (GAME.camera.position.y < terrainHeight + 10) {
        GAME.camera.position.y = terrainHeight + 10;
        GAME.player.velocity.y = 0;
        GAME.player.isOnGround = true;
    } else {
        GAME.player.isOnGround = false;
    }
}

function updateNPCs(delta) {
    // Idle animations, random movements, etc.
    GAME.npcs.forEach(npc => {
        // Make NPCs face player when nearby
        const dist = GAME.camera.position.distanceTo(npc.position);
        if (dist < 20) {
            npc.mesh.lookAt(GAME.camera.position);
        }
    });
}

function updateMinimap() {
    const minimap = document.getElementById('minimap');
    const ctx = minimap.getContext('2d');
    
    ctx.fillStyle = '#001a1a';
    ctx.fillRect(0, 0, 250, 250);
    
    const scale = 0.5;
    const centerX = 125;
    const centerY = 125;
    
    // Draw buildings
    ctx.fillStyle = '#444';
    GAME.buildings.forEach(building => {
        const x = centerX + (building.position.x - GAME.camera.position.x) * scale;
        const y = centerY + (building.position.z - GAME.camera.position.z) * scale;
        ctx.fillRect(x - 4, y - 4, 8, 8);
    });
    
    // Draw NPCs
    GAME.npcs.forEach(npc => {
        const x = centerX + (npc.position.x - GAME.camera.position.x) * scale;
        const y = centerY + (npc.position.z - GAME.camera.position.z) * scale;
        
        ctx.fillStyle = npc.questGiver ? '#ffaa00' : '#00ff00';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw player
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Direction indicator
    const forward = new THREE.Vector3();
    GAME.camera.getWorldDirection(forward);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + forward.x * 15, centerY + forward.z * 15);
    ctx.stroke();
}

function updateHUD() {
    // Update position
    const pos = GAME.camera.position;
    document.getElementById('player-pos').textContent = `${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`;
    
    // Update FPS (approximate)
    const fps = Math.round(1 / GAME.clock.getDelta());
    document.getElementById('fps').textContent = fps;
    
    // Health bar
    const healthPercent = (GAME.player.health / GAME.player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('health-current').textContent = GAME.player.health;
    document.getElementById('health-max').textContent = GAME.player.maxHealth;
    
    document.getElementById('player-level').textContent = GAME.player.level;
    document.getElementById('player-credits').textContent = GAME.player.credits;
}

// === START ===
init();

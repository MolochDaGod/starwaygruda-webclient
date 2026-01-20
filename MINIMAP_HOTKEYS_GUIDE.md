# 🗺️ Minimap, Hotkeys & Admin Fast Travel - Integration Guide

## ✨ New Features Added

### 1. 🗺️ Minimap System
- Real-time player position tracking
- Shows cities, POIs, and NPCs
- Zoom in/out controls
- Toggle visibility with **M** key
- Player direction indicator
- Grid overlay with coordinates

### 2. ⌨️ Hotkey Manager
- Help overlay (**H** key)
- Comprehensive keyboard shortcuts
- Context-aware (doesn't trigger in input fields)
- ESC to close all menus

### 3. 👑 Admin Fast Travel
- **T** key to open travel menu
- Teleport to any city, POI, or NPC spawn
- Visual teleport effects
- On-screen notifications
- Color-coded locations by type

---

## 🚀 Quick Integration

### Add to `test-population.html` or `index.html`:

```javascript
import { Minimap } from './src/ui/Minimap.js';
import { HotkeyManager } from './src/ui/HotkeyManager.js';

// After scene and camera creation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

// Initialize minimap
const minimap = new Minimap(camera, 'tatooine');

// Initialize hotkeys (with admin mode)
const hotkeyManager = new HotkeyManager(camera, {
    adminMode: true,  // Set to false for regular players
    planetName: 'tatooine'
});

// In your render loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update minimap each frame
    minimap.update(npcsArray); // Pass NPC array if available
    
    renderer.render(scene, camera);
}
```

---

## 🎮 Hotkeys Reference

### Basic Movement
| Key | Action |
|-----|--------|
| `WASD` | Move |
| `Space` | Jump |
| `Shift` | Sprint |
| `Mouse` | Look around |
| `E` | Interact |

### UI Controls
| Key | Action |
|-----|--------|
| `M` | Toggle Minimap |
| `H` | Show Help Overlay |
| `I` | Inventory (not yet implemented) |
| `Tab` | Stats (not yet implemented) |
| `Esc` | Close all menus |

### Admin Controls (requires adminMode: true)
| Key | Action |
|-----|--------|
| `T` | **Open Fast Travel Menu** |
| `G` | God Mode (not yet implemented) |
| `F` | Fly Mode (not yet implemented) |
| `N` | Noclip (not yet implemented) |
| `~` | Console (not yet implemented) |

### Space Flight
| Key | Action |
|-----|--------|
| `WASD` | Thrust |
| `Q` / `E` | Vertical movement |
| `Shift` | Boost |
| `C` | Change ship |
| `V` | Cycle camera views |

---

## 🗺️ Minimap Features

### Controls
- **M key**: Toggle minimap visibility
- **+ button**: Zoom in
- **− button**: Zoom out
- **− in top-right**: Minimize/maximize

### What It Shows
- **Blue arrow**: Player position and facing direction
- **Orange circles**: Cities with radius
- **Colored dots**: POIs (color-coded by type)
- **Green/Red squares**: Friendly/hostile NPCs
- **Grid overlay**: For navigation reference
- **Coordinates**: Current X/Z position

### POI Color Codes
- **🟫 Brown**: Ruins
- **🟦 Cyan**: Landmarks
- **🟥 Red**: Dungeons
- **🟩 Green**: Imperial locations
- **🟧 Orange**: Rebel locations
- **🟨 Yellow**: Villages
- **🟪 Purple**: Spawn points

---

## 👑 Admin Fast Travel

### How to Use
1. Press **T** key (admin mode must be enabled)
2. Browse locations by category:
   - 🏙️ **Cities** - All major settlements
   - 📍 **POIs** - Points of Interest
   - 👥 **NPC Spawns** - Creature locations
3. Click any location to teleport instantly
4. Enjoy the teleport flash effect!

### Features
- **Instant teleportation** to any location
- **Visual feedback** with blue flash effect
- **Notification** showing destination
- **Auto-height adjustment** spawns you 50m above ground
- **Organized by category** for easy browsing
- **Shows coordinates** for each location

### Example Locations (Tatooine)

**Cities**:
- Mos Eisley (3528, 5, -4804)
- Mos Espa (-2902, 5, 2130)
- Bestine (-1290, 12, -3590)

**POIs**:
- Jabba's Palace (-5850, 60, -6200)
- Krayt Graveyard (7300, 40, 4500)
- Ben Kenobi's Hut (-4512, 60, -2270)
- Sarlacc Pit (-6176, 46, -3372)

**NPCs**:
- Tusken Raiders (-4000, 30, 3000) - Level 25
- Krayt Dragon (7300, 40, 4500) - Level 275
- Jawas (2000, 10, -3000) - Level 5

---

## 🔧 Configuration Options

### Minimap Configuration

```javascript
const minimap = new Minimap(camera, planetName);

// Change planet
minimap.setPlanet('naboo');

// Update with NPCs
minimap.update(npcArray);

// Cleanup
minimap.dispose();
```

### Hotkey Manager Configuration

```javascript
const hotkeyManager = new HotkeyManager(camera, {
    adminMode: true,        // Enable admin features
    planetName: 'tatooine', // Starting planet
    onPlanetChange: (newPlanet) => {
        // Optional callback when planet changes
        console.log('Changed to:', newPlanet);
    }
});

// Change planet
hotkeyManager.setPlanet('naboo');

// Toggle admin mode
hotkeyManager.setAdminMode(true);

// Cleanup
hotkeyManager.dispose();
```

---

## 📝 Integration Checklist

- [ ] Import `Minimap.js` and `HotkeyManager.js`
- [ ] Initialize after scene/camera creation
- [ ] Call `minimap.update()` in render loop
- [ ] Set `adminMode: true` for testing
- [ ] Pass NPC array to minimap if available
- [ ] Test hotkeys (H for help, T for travel)
- [ ] Update planet name when changing planets
- [ ] Call dispose() when cleaning up

---

## 🎯 Full Integration Example

```javascript
// main.js or test-population.html
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { WorldPopulator } from './src/world/WorldPopulator.js';
import { Minimap } from './src/ui/Minimap.js';
import { HotkeyManager } from './src/ui/HotkeyManager.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(3528, 100, -4804); // Mos Eisley

// Lighting
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(500, 1000, 500);
scene.add(sun);

// World population
const populator = new WorldPopulator(scene, 'tatooine');
await populator.populate();

// ⭐ Add minimap
const minimap = new Minimap(camera, 'tatooine');

// ⭐ Add hotkeys with admin mode
const hotkeyManager = new HotkeyManager(camera, {
    adminMode: true,
    planetName: 'tatooine'
});

// Render loop
function animate() {
    requestAnimationFrame(animate);
    
    // ⭐ Update minimap with NPCs
    minimap.update(populator.spawnedNPCs);
    
    renderer.render(scene, camera);
}

animate();

// Planet switching
window.loadPlanet = function(planetName) {
    populator.dispose();
    populator = new WorldPopulator(scene, planetName);
    await populator.populate();
    
    // ⭐ Update minimap and hotkeys
    minimap.setPlanet(planetName);
    hotkeyManager.setPlanet(planetName);
};

console.log('🎮 Game loaded! Press H for help, M for map, T for fast travel');
```

---

## 🌟 Features Summary

```
Minimap:
├── ✅ Real-time player tracking
├── ✅ Shows cities, POIs, NPCs
├── ✅ Zoom controls
├── ✅ Toggle with M key
└── ✅ Direction indicator

Hotkey Manager:
├── ✅ Help overlay (H key)
├── ✅ Comprehensive shortcuts
├── ✅ Admin mode support
└── ✅ Context-aware inputs

Admin Fast Travel:
├── ✅ Teleport to 50+ cities
├── ✅ Visit 30+ POIs
├── ✅ Jump to 130+ NPC spawns
├── ✅ Visual effects
└── ✅ On-screen notifications
```

---

## 🐛 Troubleshooting

**Minimap not showing?**
- Check that `getPlanetPOIs` is imported correctly
- Verify planet name is valid
- Press M to toggle visibility

**Hotkeys not working?**
- Make sure you're not typing in an input field
- Check browser console for errors
- Verify HotkeyManager is initialized

**Fast travel menu empty?**
- Ensure `adminMode: true` is set
- Check planet data exists
- Verify imports from `poi-database.js` and `npc-spawns.js`

**Teleport not working?**
- Make sure camera object is passed correctly
- Check console for error messages
- Verify coordinates are valid

---

**Status**: ✅ Ready to use! Press H in-game for hotkey help.

# StarWayGRUDA UI and Terrain Improvements

## What's Been Done

### 1. Terrain Boundaries ✅
**Problem:** Infinite ugly procedural terrain
**Solution:**
- Updated `GameWorld.js` to use proper 16km x 16km world size (SWG specification)
- Added boundary enforcement in `PlayerController.js`
- Player movement clamped to 15km x 15km playable area (-7500m to +7500m)
- Boundary warning system at 7km from center
- Hard stop at edges with velocity reset

### 2. Action Bar / Toolbar ✅  
**Created:** `src/ui/Toolbar.js`
**Features:**
- 24 slots (2 rows × 12 columns)
- Positioned bottom-right
- Keyboard shortcuts:
  - Top row: 1-0, -, =
  - Bottom row: Shift+1-0, Shift+-, Shift+=
  - Switch toolbars: Ctrl+1 through Ctrl+6
- 6 swappable toolbars
- Visual feedback on key press
- Integrated into `main.js`

### 3. Asset Discovery
**Found in `/public/assets/`:**
- `texture/` - Thousands of .dds texture files (armor, weapons, terrain, UI)
- `object/building/` - Building models (.iff format)
- `object/tangible/` - Items, weapons, equipment
- `object/static/` - Trees, rocks, decorations
- `appearance/` - Character models
- `datatables/` - POI data, terrain configs, item stats
- `clientdata/` - Player, NPC, ship data

### 4. SWG World Specifications (Researched)
- **Planet size:** 16km × 16km total (16,384m × 16,384m)
- **Playable area:** 15km × 15km
- **Boundary walls:** 500m invisible border
- **Coordinate system:** Center at (0,0), ranges from -8192 to +8192
- **Tile size:** 1 meter per tile
- **Source:** Raph Koster's blog (SWG lead designer)

## What's Next

### High Priority UI Components (Still TODO)
1. **Planet Map (M key)** - Full-screen map showing cities, landmarks, player position, waypoints
2. **Inventory (I key)** - 8×10 grid-based item storage with drag-and-drop
3. **Radar/Minimap** - Circular minimap in top-right (128m range)
4. **HAM Bars** - Replace text display with 3-bar system (Health/Action/Mind)

### Asset Integration Tasks
1. **DDS Texture Loading** - Already installed `three-stdlib`, need to implement loader
2. **IFF File Parsing** - Buildings and objects use .iff format (need parser)
3. **Replace Placeholder Buildings** - Use real models from `/assets/object/building/`
4. **Terrain Textures** - Apply real .dds textures to terrain based on biome

### Terrain Improvements
1. **Better Heightmap** - Current procedural generation looks bad, need real data
2. **Texture Splatting** - Blend multiple textures based on terrain type
3. **LOD System** - Level of detail for performance at 16km view distance
4. **Boundary Fog** - Hide terrain edges with atmospheric fog

## How to Test Current Changes

1. Start the game:
   ```
   START-GAME.bat
   ```

2. **Test Boundaries:**
   - Walk towards map edge (you'll hit invisible wall at 7500m)
   - Check console for "Approaching world boundary!" warning

3. **Test Toolbar:**
   - Press 1-9, 0, -, = to activate slots
   - Hold Shift and press 1-9, 0, -, = for bottom row
   - Press Ctrl+1 through Ctrl+6 to switch toolbars
   - Click slots with mouse

4. **Check Terrain Size:**
   - Terrain should be 16km × 16km (visible from high altitude)
   - No more infinite procedural terrain

## Technical Notes

### Coordinate System
- **SWG:** Z-up coordinate system
- **THREE.js:** Y-up coordinate system
- **Conversion needed:** SWG (x, y, z) → THREE.js (x, z, -y)

### File Formats
- **.trn files** - Terrain heightmaps (in `/assets/terrain/`)
- **.dds files** - DirectDraw Surface textures (need DDSLoader from three-stdlib)
- **.iff files** - Interchange File Format (SWG's custom format, needs parser)

### Keybinds Summary
| Key | Action |
|-----|--------|
| 1-0, -, = | Toolbar row 1 |
| Shift+1-0, Shift+-, Shift+= | Toolbar row 2 |
| Ctrl+1-6 | Switch toolbars |
| M | Open map (TODO) |
| I | Open inventory (TODO) |
| WASD | Move |
| Space | Jump |
| Mouse | Look around |

## Architecture Overview

```
src/
├── main.js                 - Game entry point, now includes Toolbar
├── world/
│   └── GameWorld.js       - Updated to 16km terrain + boundaries
├── player/
│   └── PlayerController.js - Added boundary enforcement
├── ui/
│   ├── HUD.js             - Basic HUD (FPS, position, POI)
│   ├── Toolbar.js         - NEW: Action bar (24 slots, keybinds)
│   ├── PlanetMap.js       - TODO: Full-screen map
│   ├── Inventory.js       - TODO: Item grid
│   └── Radar.js           - TODO: Circular minimap
├── data/
│   └── poi-database.js    - Real SWG coordinates
└── loaders/
    └── AssetLoader.js     - Currently loads placeholder data
```

## Next Steps Recommendation

**For immediate visual improvement:**
1. Create PlanetMap.js (M key) - Shows where player is in the 16km world
2. Add HAM bars - Makes it feel more like SWG
3. Implement DDS texture loading - Use real SWG textures

**For authenticity:**
1. Parse .iff building files
2. Replace placeholder buildings with real models
3. Add proper terrain textures from extracted .dds files

## Performance Targets
- **FPS:** 60 FPS target
- **View Distance:** Full 16km world visible
- **Optimizations:** LOD, frustum culling, texture compression, object pooling

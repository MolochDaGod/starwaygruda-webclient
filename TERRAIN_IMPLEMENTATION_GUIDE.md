# SWG Terrain Implementation Guide

## Current Status

### ✅ What You Have
Your `SWGTERRAIN` directory contains **EXTRACTED CLIENT FILES** from the official SWG client. This includes:

#### 📦 Available Resources
- **6 Planet Snapshots** (`snapshot/*.ws`):
  - `tatooine.ws` (1.4 MB - largest, most objects)
  - `corellia.ws` (628 KB)
  - `naboo.ws` (602 KB)
  - `rori.ws` (279 KB)
  - `dathomir.ws` (261 KB)
  - `yavin4.ws` (148 KB)

- **Object Templates** (`object/`):
  - Buildings (`object/building/`)
  - Creatures (`object/creature/`)
  - Ships (`object/ship/` - 298 ships)
  - Static objects (`object/static/`)
  - Tangible items

- **Appearance Data** (`appearance/`):
  - Mesh templates (`.msh`, `.lod`)
  - Skeletal data (`.skt`)
  - Appearance templates (`.apt`)

- **Effects** (`effect/`):
  - 161 `.eft` shader files
  - Particle effects
  - Water/terrain shaders

- **Textures** (`texture/`):
  - `.dds` texture files
  - Normal maps
  - Terrain textures

- **Datatables** (`datatables/`):
  - Profession data
  - Stats/attributes
  - Creation templates

### ❌ Current Problem

**Your game is rendering PROCEDURAL FAKE TERRAIN**, not real SWG planets!

Location: `src/world/GameWorld.js`
- Uses generic heightmap (noise-based)
- Placeholder boxes for buildings
- No actual SWG object placement

## Solution: Extract & Render Real Planet Data

### Step 1: Parse World Snapshot Files

The `.ws` (World Snapshot) files contain **EVERY OBJECT** placed on each planet:
- Buildings (starports, cantinas, houses)
- NPCs and creatures
- Trees and foliage
- Static decorations
- Spawn points

**Format**: IFF (Interchange File Format)
- Header: `FORM`
- Chunks: `OOBJ` (objects), `SCOT` (scene objects), `XFRM` (transforms)

### Step 2: Terrain Data Sources

SWG terrain is stored in **terrain/*.trn files** inside the TRE archives:

#### From Your SWGEmu Installation
Location: `C:\Program Files (x86)\SWGEmu\SWGEmu Launchpad\SWGEmu\`

**TRE Archives** (2+ GB):
- `data_sku1_*.tre` - Main game data
- `data_static_mesh_*.tre` - 3D models  
- `data_texture_*.tre` - Textures
- `patch_*.tre` - Updates

**Terrain files are INSIDE these TREs**, not extracted yet.

### Step 3: TRE Extraction Tools

#### Option A: Use Existing Tools
- **TRE Explorer** (Windows GUI)
- **SWGEmu TRE Tools** (Python/C++)
- **SIE** (SOE Interchange Editor)

#### Option B: Write Custom Extractor
The TRE format is documented in SWGEmu Core3 source:
```
TRE File Structure:
- Header (12 bytes)
  - Magic: "EERT" (reverse of "TREE")
  - Version: uint32
  - File count: uint32
- File Records (variable)
  - Checksum: uint32
  - Offset: uint32
  - Compressed size: uint32
  - Uncompressed size: uint32
  - Compression method: uint32 (0=none, 2=zlib)
  - Name length: uint32
  - Filename: string
- File Data (compressed)
```

### Step 4: Terrain File Format (.trn)

SWG `.trn` files contain:
- **Heightmap** (16km x 16km, typically 2048x2048 resolution)
- **Texture layers** (blend maps for different terrain types)
- **Water data** (lakes, rivers, oceans)
- **Environment settings** (fog, sky color)
- **Flora rules** (tree/plant placement algorithms)

**Format**: IFF with chunks:
- `MHGT` - Main heightmap
- `WMAP` - Water map  
- `FMLY` - Texture families
- `FLOR` - Flora layers
- `ENV` - Environment data

### Step 5: Implementation Plan

#### Phase 1: World Snapshot Parser ✅ (Already have basic version)
```javascript
// parse-swg-world.cjs
class WorldSnapshotParser {
    parseSnapshot(wsFile) {
        // Parse IFF structure
        // Extract object placements with:
        //   - Template path (e.g., "object/building/corellia/starport_corellia.iff")
        //   - Position (x, y, z)
        //   - Rotation (quaternion or euler)
        //   - Scale
        //   - Cell info (for interior objects)
    }
}
```

#### Phase 2: TRE Terrain Extractor
```javascript
// extract-terrain-from-tre.cjs
class TRETerrainExtractor {
    extractPlanetTerrain(planetName) {
        // Open relevant TREs
        // Find "terrain/{planet}.trn"
        // Extract and parse heightmap
        // Extract texture references
        // Generate Three.js compatible terrain data
    }
}
```

#### Phase 3: Real Terrain Renderer
```javascript
// src/world/SWGTerrain.js
import * as THREE from 'three';

export class SWGTerrain {
    constructor(trn Data) {
        // Parse .trn heightmap (2048x2048)
        // Generate LOD terrain chunks
        // Apply multi-layer textures
        // Add water planes
        // Place flora (trees/bushes)
    }
    
    loadFromTRN(trnBuffer) {
        // Parse IFF chunks
        const heightmap = this.parseHeightmap(trnBuffer);
        const textures = this.parseTextureLayers(trnBuffer);
        const water = this.parseWaterData(trnBuffer);
        
        // Create THREE.js terrain mesh
        this.generateTerrainMesh(heightmap, textures);
    }
}
```

#### Phase 4: Object Placement System
```javascript
// src/world/ObjectPlacer.js
export class ObjectPlacer {
    placeWorldObjects(snapshot, scene) {
        snapshot.objects.forEach(obj => {
            // Load 3D model for obj.template
            // Position at obj.position
            // Apply obj.rotation
            // Add to scene
        });
    }
}
```

### Step 6: Quick Win - Use Snapshot Data NOW

**You don't need terrain to get started!** You can:

1. **Parse the 6 `.ws` snapshot files** ✅
2. **Place objects at correct coordinates** (even on flat ground)
3. **Load real building models** from `object/building/`
4. **See authentic SWG city layouts immediately**

This gives you REAL SWG cities/POIs while you work on terrain.

## Recommended Next Steps

### 🚀 Immediate (Today)
1. ✅ Fix snapshot parser to actually read object data from `.ws` files
2. Create object manifest from `object/building/` directory
3. Place placeholder boxes at REAL coordinates from snapshots
4. Test with Tatooine (Mos Eisley has tons of objects)

### 📅 Short Term (This Week)
1. Extract `.trn` files from TRE archives using existing tools
2. Parse heightmap data from one `.trn` file (start with Tatooine)
3. Render real heightmap in Three.js
4. Compare with fake procedural terrain

### 📈 Medium Term (Next Week)
1. Build complete TRE extractor
2. Extract all 12 planet terrains
3. Parse texture layers
4. Implement LOD system for performance

### 🎯 Long Term (Month)
1. Load actual 3D models (`.msh` files)
2. Convert to GLTF for Three.js
3. Full object placement from snapshots
4. Flora generation
5. Interior cells

## Technical References

### SWGEmu Core3 Source
- Terrain generator: `MMOCoreORB/src/server/zone/managers/terrain/`
- TRE reader: `MMOCoreORB/utils/tre/`
- IFF parser: `MMOCoreORB/utils/iff/`

### File Locations
- **Your extracted data**: `C:\Users\david\OneDrive\Desktop\SWGTERRAIN`
- **TRE archives**: `C:\Program Files (x86)\SWGEmu\SWGEmu Launchpad\SWGEmu\`
- **Web client**: `C:\Users\david\Desktop\StarWayGRUDA-WebClient`

### Key Files to Parse First
1. `snapshot/tatooine.ws` - Most objects (1.4 MB)
2. TRE: `terrain/tatooine.trn` - Desert heightmap
3. `object/building/tatooine/` - All Tatooine buildings

## Why This Matters

**Current**: Procedural noise terrain + random boxes = NOT Star Wars Galaxies

**After**: Real heightmaps + authentic object placement + actual SWG buildings = **REAL SWG EXPERIENCE**

Players will spawn in Mos Eisley and see:
- ✅ Correct starport layout
- ✅ Real cantina locations
- ✅ Proper city streets
- ✅ Authentic building styles
- ✅ Actual terrain features (dunes, valleys)

This is the difference between "a space game" and "Star Wars Galaxies".

## Tools You Need

### For TRE Extraction
- TRE Explorer (GUI, easiest)
- OR: Node.js TRE library (custom)
- OR: Python with `struct` module

### For 3D Model Conversion
- `.msh` to GLTF converter
- Three.js loaders
- Texture format converters (`.dds` to `.png`)

### For IFF Parsing
- Binary file reader
- Chunk parser (recursive IFF structure)
- Template system for different IFF types

## Summary

You have ALL the data you need for authentic SWG planets:
- ✅ 6 planet snapshots with complete object placements
- ✅ All building/object templates
- ✅ Effects and shaders
- ✅ TRE archives with terrain heightmaps

**Next action**: Parse `tatooine.ws` to extract real building coordinates, then place them in your Three.js scene!

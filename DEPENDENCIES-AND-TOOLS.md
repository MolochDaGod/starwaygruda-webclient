# StarWayGRUDA Dependencies & Tools

## ✅ Installed Packages

### Core 3D & Game Engine
```json
{
  "three": "^0.x.x",           // THREE.js 3D engine
  "vite": "^5.x.x",             // Build tool & dev server
  "cannon-es": "^0.x.x",        // Physics engine
  "three-mesh-bvh": "^0.x.x",   // Raycasting optimization
  "@tweenjs/tween.js": "^23.x", // Animation tweening
  "stats.js": "^0.x.x"          // FPS performance monitor
}
```

### File Format Parsers
```json
{
  "three-stdlib": "^2.x.x",     // DDS texture loader
  "binary-parser": "^2.x.x",    // Binary file parsing
  "buffer": "^6.x.x",           // Node.js Buffer for browsers
  "jszip": "^3.x.x",            // ZIP compression (for TRE archives)
  "pako": "^2.x.x"              // zlib compression
}
```

### UI & Development
```json
{
  "lil-gui": "^0.x.x",          // Debug UI controls
  "axios": "^1.x.x",            // HTTP requests
  "socket.io-client": "^4.x.x"  // WebSocket for multiplayer
}
```

## 📦 What Each Package Does

### **three-stdlib** (DDS Loader)
- Loads `.dds` (DirectDraw Surface) texture files
- Essential for SWG textures (all terrain/item textures are .dds)
- Usage:
```javascript
import { DDSLoader } from 'three-stdlib';
const loader = new DDSLoader();
const texture = loader.load('/assets/texture/terrain_grass.dds');
```

### **binary-parser**
- Parses complex binary file formats
- Used for `.iff` and `.trn` file parsing
- Declarative syntax for binary structures
```javascript
import { Parser } from 'binary-parser';
const parser = new Parser()
  .string('type', { length: 4 })
  .uint32be('size');
```

### **cannon-es**
- Physics simulation (gravity, collisions, forces)
- Player movement physics
- Building/object collision detection
```javascript
import * as CANNON from 'cannon-es';
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
```

### **three-mesh-bvh**
- Bounding Volume Hierarchy for fast raycasting
- Optimizes collision detection
- Essential for large worlds
```javascript
import { MeshBVH } from 'three-mesh-bvh';
mesh.geometry.boundsTree = new MeshBVH(mesh.geometry);
```

### **@tweenjs/tween.js**
- Smooth animations for camera, objects, UI
```javascript
import * as TWEEN from '@tweenjs/tween.js';
new TWEEN.Tween(camera.position)
  .to({ y: 100 }, 1000)
  .start();
```

### **lil-gui**
- Debug UI for tweaking values in real-time
- Great for testing render distances, colors, etc.
```javascript
import GUI from 'lil-gui';
const gui = new GUI();
gui.add(config, 'viewDistance', 1000, 10000);
```

## 🔧 Custom Parsers Created

### IFFLoader (`src/loaders/IFFLoader.js`)
- Parses SWG `.iff` files (Interchange File Format)
- Handles FORM chunks, nested structures
- Extracts mesh data from building files
```javascript
import { IFFLoader } from './loaders/IFFLoader.js';
const loader = new IFFLoader();
const data = await loader.load('/assets/object/building/naboo_theed.iff');
```

### TRNLoader (`src/loaders/TRNLoader.js`)
- Parses SWG `.trn` terrain files
- Extracts heightmap data
- Falls back to procedural generation if parse fails
```javascript
import { TRNLoader } from './loaders/TRNLoader.js';
const loader = new TRNLoader();
const terrain = await loader.load('/assets/terrain/naboo.trn');
```

## 📁 SWG File Formats Reference

### File Types in `/public/assets/`

| Extension | Description | Tool | Status |
|-----------|-------------|------|--------|
| `.dds` | DirectDraw Surface textures | DDSLoader (three-stdlib) | ✅ Ready |
| `.iff` | Interchange Format (meshes, objects) | IFFLoader (custom) | ⚠️ Basic parsing |
| `.trn` | Terrain generation rules | TRNLoader (custom) | ⚠️ Fallback only |
| `.tre` | Archive files (container) | JSZip / custom | ❌ Not implemented |
| `.msh` | Mesh files | THREE.js loaders | ❌ Need converter |
| `.skt` | Skeleton animations | Custom parser | ❌ Not implemented |
| `.stf` | String tables (text) | Text parser | ❌ Not implemented |
| `.ws` | World snapshot (object placement) | Binary parser | ❌ Not implemented |

## 🛠️ Useful Tools & Libraries to Add

### Recommended Next Installs

#### For Better Asset Loading
```bash
npm install gltf-transform      # Convert meshes to glTF
npm install @loaders.gl/core    # Universal file loader
npm install draco3d             # Mesh compression
```

#### For UI Polish
```bash
npm install gsap                # Advanced animations
npm install chart.js            # Stats/graphs
npm install howler              # Audio engine
```

#### For Multiplayer (Future)
```bash
npm install colyseus            # Multiplayer framework
npm install peer                # WebRTC P2P
```

## 📖 External Resources

### SWG File Format Documentation
- **SWGANH Wiki**: http://wiki.swganh.org/
  - TRN format: http://wiki.swganh.org/index.php/TRN_(FileFormat)
  - TRE breakdown: http://wiki.swganh.org/index.php/TRE:TRE_Breakdown
  
- **Mod the Galaxy**: https://modthegalaxy.com/
  - Tools, guides, community mods

- **Raph Koster's Blog**: https://www.raphkoster.com/
  - SWG technical design posts by lead designer

### GitHub Resources
- **Swg.Explorer**: https://github.com/wverkley/Swg.Explorer
  - C# TRE viewer/extractor (reference implementation)
  
- **Blender SWG Plugin**: https://github.com/nostyleguy/io_scene_swg_msh
  - Shows how to parse .msh, .skt, .iff files

## ⚙️ Build & Development Commands

```bash
# Start dev server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check dependencies
npm list

# Update all packages
npm update

# Audit security vulnerabilities
npm audit
npm audit fix
```

## 🎯 Performance Optimization

### Current Settings
- **View Distance**: 2km full detail, 5km terrain only
- **Chunk Size**: 256m
- **LOD Levels**: 3 (high/medium/low)
- **Target FPS**: 60

### Optimization Tips
1. **Texture atlasing** - Combine small textures into atlas
2. **Instancing** - Reuse meshes for trees/rocks
3. **Frustum culling** - Don't render off-screen objects
4. **Lazy loading** - Load assets on demand
5. **Web Workers** - Parse files in background thread

## 🚀 Next Steps

### Priority 1: Asset Parsing
- [ ] Improve IFF parser to extract actual mesh geometry
- [ ] Parse .ws files for proper building placement
- [ ] Convert SWG meshes to glTF format

### Priority 2: UI Components
- [ ] Create PlanetMap.js (M key)
- [ ] Create Inventory.js (I key)
- [ ] Create Radar.js (minimap)
- [ ] Create HAMBars.js (health/action/mind)

### Priority 3: Rendering
- [ ] Implement chunk streaming system
- [ ] Add LOD terrain generation
- [ ] Apply real DDS textures to terrain
- [ ] Add fog system for view distance

## 💡 Development Tips

### Debugging
- Press F12 for browser console
- Use `lil-gui` to tweak values live
- Check `stats.js` FPS counter
- Use Chrome DevTools Performance profiler

### Testing Assets
```javascript
// Test loading a DDS texture
import { DDSLoader } from 'three-stdlib';
const loader = new DDSLoader();
loader.load('/assets/texture/test.dds', (texture) => {
  console.log('Loaded:', texture);
});

// Test parsing an IFF file
import { IFFLoader } from './loaders/IFFLoader.js';
const iff = new IFFLoader();
iff.load('/assets/object/building/test.iff').then(data => {
  console.log('IFF chunks:', data.chunks);
});
```

### Common Issues
1. **CORS errors**: Assets must be served from same origin or use CORS headers
2. **Buffer not defined**: Import from 'buffer' package
3. **Large file loading**: Use streaming/chunking for files >10MB
4. **Memory leaks**: Dispose THREE.js geometries/materials when done

## 📚 Learning Resources

- **THREE.js Docs**: https://threejs.org/docs/
- **Vite Guide**: https://vitejs.dev/guide/
- **Game Dev Patterns**: https://gameprogrammingpatterns.com/
- **WebGL Fundamentals**: https://webglfundamentals.org/

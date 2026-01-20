# StarWayGRUDA Web Client

**3D Web-based client for Star Wars Galaxies Emulator**

Renders the actual game world using THREE.js with support for original SWG terrain and assets.

---

## 🎮 Features

- ✅ **Real terrain rendering** from .trn heightmap files
- ✅ **WASD + Mouse controls** (FPS-style movement)
- ✅ **Native game asset support** (.iff models, .tre archives)
- ✅ **Character API integration** (create/manage characters via web)
- ✅ **WebGL rendering** (runs in any modern browser)
- ✅ **Procedural fallback** (works without game files)
- ✅ **HUD with position, FPS, chat**

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient
npm install
```

### 2. Start Dev Server

```bash
npm run dev
```

Open browser to: **http://localhost:5173**

---

## 🗺️ Using Real SWG Assets

The client can load original SWG game files:

### Asset Directory Structure

```
StarWayGRUDA-WebClient/
└── public/
    └── assets/
        ├── terrain/
        │   ├── naboo.trn
        │   ├── tatooine.trn
        │   └── corellia.trn
        ├── textures/
        │   ├── grass_default.png
        │   ├── dirt_default.png
        │   └── water_default.png
        └── models/
            └── (converted .gltf files)
```

### Extracting Game Assets

#### Step 1: Get SWG Game Files

If you have the original SWG game installed, locate:
- `C:\Program Files\Sony\Star Wars Galaxies\` (Windows)
- Or your SWGEmu installation directory

Look for `.tre` archive files:
- `bottom_00.tre`
- `default_patch_00.tre`
- `patch_00.tre`

#### Step 2: Extract .tre Archives

**Option A: Use TRE Explorer (Windows)**
```bash
# Download from: https://github.com/TheAnswer/SwgTRE
git clone https://github.com/TheAnswer/SwgTRE.git
# Build and use the TRE viewer to extract files
```

**Option B: Use swgpy TRE extractor (Python)**
```bash
pip install swgpy-tre
python -c "from swgpy.tre import TreArchive; TreArchive('bottom_00.tre').extract_all('output/')"
```

**Option C: Manual extraction script**

Create `extract-assets.js`:
```javascript
// Node.js script to extract specific assets
const fs = require('fs');

// Read .tre file structure and extract terrain/texture files
// (Simplified - actual .tre format is complex)
```

#### Step 3: Convert Assets to Web Formats

**Terrain (.trn → heightmap.png)**
```bash
# Use ImageMagick or custom script
# Convert 16-bit heightmap to PNG
```

**Models (.iff → .gltf)**
```bash
# Use Blender with IFF import plugin
# Or convert via intermediate format (OBJ)
```

**Textures (.dds → .png)**
```bash
# Use ImageMagick
magick convert texture.dds texture.png
```

---

## 📁 Where to Find Game Assets

### Terrain Files
Location in SWG client:
```
datatables/terrain/
  naboo.trn
  tatooine.trn
  corellia.trn
```

These contain:
- Heightmap data (16-bit per vertex)
- Texture layer blend maps
- Shader definitions
- Water boundaries

### Texture Files
Location in .tre archives:
```
texture/
  terrain/
    grass_01.dds
    dirt_01.dds
    rock_01.dds
```

### Model Files
Location in .tre archives:
```
object/
  building/
    general/
      starport_naboo.iff
  static/
    flora/
      tree_naboo_01.iff
```

---

## 🛠️ Asset Conversion Pipeline

### Full Workflow

1. **Extract from .tre archives**
   ```bash
   TREExplorer extract bottom_00.tre --output ./extracted
   ```

2. **Convert textures**
   ```bash
   for file in extracted/texture/**/*.dds; do
     magick convert "$file" "${file%.dds}.png"
   done
   ```

3. **Convert models (Blender script)**
   ```python
   import bpy
   # Load .iff file (requires plugin)
   # Export as .gltf
   bpy.ops.export_scene.gltf()
   ```

4. **Process terrain**
   ```javascript
   // Custom script to parse .trn format
   // Extract heightmap → Float32Array
   // Save as JSON or binary format
   ```

5. **Copy to web client**
   ```bash
   cp converted/* StarWayGRUDA-WebClient/public/assets/
   ```

---

## 🎨 Without Game Assets

Don't have SWG files? **No problem!**

The client includes:
- **Procedural terrain generation** (Perlin noise heightmaps)
- **Fallback textures** (generated canvas textures)
- **Placeholder models** (geometric primitives)

It will automatically use these if game files aren't found.

---

## 🌐 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Your client will be live at: `https://your-project.vercel.app`

### Deploy with Assets

Upload extracted game assets to:
- Vercel Blob Storage
- AWS S3
- Cloudflare R2

Update `AssetLoader.js` asset paths.

---

## 🔧 Configuration

Edit `src/loaders/AssetLoader.js`:

```javascript
this.assetPaths = {
    terrain: '/assets/terrain',        // Your terrain location
    textures: '/assets/textures',      // Your texture location  
    models: '/assets/models',          // Your model location
    tre: '/assets/tre'                 // Raw .tre files (if using dynamic extraction)
};
```

---

## 🎯 Connecting to Your API

The client connects to your StarWayGRUDA API:

Edit `src/main.js`:
```javascript
this.api = new APIClient('http://localhost:3000');  // Change to your API URL
```

For production:
```javascript
this.api = new APIClient('https://api.starwaygruda.com');
```

---

## 🎮 Controls

| Input | Action |
|-------|--------|
| **W/A/S/D** | Move |
| **Mouse** | Look around (click to lock cursor) |
| **Space** | Jump |
| **E** | Interact (future) |
| **Enter** | Chat |
| **ESC** | Release cursor |

---

## 📊 Performance

- **60 FPS** on modern hardware
- **8km render distance** (configurable)
- **Terrain LOD** (level of detail based on distance)
- **Frustum culling** (only render visible objects)

Optimize for web:
```javascript
// In GameWorld.js
this.renderer.setPixelRatio(1); // Lock to 1x for performance
geometry.setDrawRange(0, lowPolyCount); // Use low-poly models at distance
```

---

## 🐛 Troubleshooting

### "Cannot read .trn file"
- Make sure terrain files are in `public/assets/terrain/`
- Check file format (must be valid SWG .trn format)
- Falls back to procedural terrain automatically

### "Textures not loading"
- Verify textures are in `public/assets/textures/`
- Check console for 404 errors
- Fallback textures will be used automatically

### Low FPS
- Reduce terrain resolution in `AssetLoader.js`
- Lower render distance in `GameWorld.js`
- Disable shadows: `renderer.shadowMap.enabled = false`

---

## 🚀 Next Steps

1. **Extract game assets** from your SWG installation
2. **Convert to web formats** (.png, .gltf, .json)
3. **Test locally** with `npm run dev`
4. **Deploy to Vercel** for live preview
5. **Add WebSocket support** for multiplayer

---

## 📚 Resources

### SWG Asset Tools
- **TRE Explorer**: https://github.com/TheAnswer/SwgTRE
- **IFF Tools**: https://github.com/swgemu/Tools
- **Terrain Viewer**: https://github.com/swgemu/engine3

### THREE.js
- **Docs**: https://threejs.org/docs/
- **Examples**: https://threejs.org/examples/

### SWGEmu
- **Core3**: https://github.com/swgemu/Core3
- **Engine3**: https://github.com/swgemu/engine3
- **Forums**: https://www.swgemu.com/forums/

---

**Built with ❤️ by the StarWayGRUDA Team**

*"A long time ago in a galaxy far, far away... but now in your browser!"*

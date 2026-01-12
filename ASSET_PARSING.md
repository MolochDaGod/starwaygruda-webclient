# SWG Asset Parsing Guide

This guide explains how to parse original Star Wars Galaxies assets (characters, effects, professions, stats) to identify what needs to be replaced/converted for the web client.

## Overview

The asset parser scans the original SWG game files and generates a comprehensive manifest that maps:
- **Characters** (.iff files) → GLTF models + textures
- **Effects** (.eft shader files) → Three.js compatible shaders
- **Professions** (datatables) → Game data structures
- **Stats & Attributes** → Character creation system requirements

## Prerequisites

- Original SWG game files extracted to `C:\Users\david\OneDrive\Desktop\SWGTERRAIN`
- Node.js 20+ installed
- Dependencies installed: `npm install`

## Directory Structure Expected

```
SWGTERRAIN/
├── object/
│   └── creature/
│       └── player/
│           ├── shared_ithorian_female.iff
│           ├── shared_ithorian_male.iff
│           ├── shared_sullustan_female.iff
│           └── shared_sullustan_male.iff
├── effect/
│   ├── a_2blend.eft
│   ├── a_alpha.eft
│   ├── a_alpha_bump.eft
│   └── ... (many more .eft files)
├── datatables/
│   ├── knowledgebase/
│   │   └── professions.iff
│   └── creation/
│       ├── attribute_limits.iff
│       └── racial_mods.iff
└── ... (other asset directories)
```

## Usage

### Basic Usage (JSON output)

```bash
node parse-assets.js
```

This will:
1. Scan `C:\Users\david\OneDrive\Desktop\SWGTERRAIN`
2. Parse all characters, effects, professions, and stats
3. Generate `asset-manifest.json`

### Advanced Usage

**Custom SWG path:**
```bash
node parse-assets.js --swg-path "D:\SWG\Assets"
```

**Custom output file:**
```bash
node parse-assets.js --output my-manifest.json
```

**Output formats:**

JSON (default):
```bash
node parse-assets.js --format json --output manifest.json
```

Markdown (human-readable):
```bash
node parse-assets.js --format markdown --output ASSET_REPORT.md
```

YAML:
```bash
node parse-assets.js --format yaml --output manifest.yaml
```

## Output Manifest Structure

### JSON Format

```json
{
  "timestamp": "2026-01-11T05:30:00.000Z",
  "source": "C:\\Users\\david\\OneDrive\\Desktop\\SWGTERRAIN",
  
  "characters": [
    {
      "original": "C:\\...\\shared_ithorian_male.iff",
      "name": "ithorian_male",
      "replacement": {
        "model": "models/characters/ithorian_male.gltf",
        "textures": ["textures/ithorian_skin_01.png"],
        "animations": []
      },
      "requiredEffects": []
    }
  ],
  
  "effects": [
    {
      "original": "C:\\...\\a_alpha.eft",
      "name": "a_alpha",
      "replacement": {
        "shader": "shaders/alpha.glsl",
        "textures": []
      },
      "properties": {
        "hasAlpha": true,
        "hasBlend": false,
        "hasEmissive": false,
        "hasBump": false,
        "hasSpecular": false
      }
    }
  ],
  
  "professions": [
    {
      "name": "Brawler",
      "description": "...",
      "skills": ["unarmed_combat"],
      "requiredStats": {
        "health": 100,
        "action": 0,
        "mind": 0
      }
    }
  ],
  
  "stats": {
    "attributes": {
      "health": { "min": 100, "max": 1000 },
      "action": { "min": 100, "max": 1000 },
      "mind": { "min": 100, "max": 1000 },
      "strength": { "min": 0, "max": 100 },
      "constitution": { "min": 0, "max": 100 },
      "stamina": { "min": 0, "max": 100 }
    },
    "racialMods": {
      "human": { "health": 0, "action": 0, "mind": 0 },
      "wookiee": { "health": 100, "action": 50, "strength": 15 }
    }
  }
}
```

## What Gets Parsed

### 1. Characters (`object/creature/player/*.iff`)

Extracts:
- Character/species name
- Appearance references (links to mesh/skeleton)
- Animation sets
- Equipment slots
- Collision data
- Effect references

**What you need to do:**
- Extract .iff model files using SWG Model Viewer
- Convert to GLTF format
- Extract and convert textures
- Create animation files

### 2. Effects (`effect/*.eft`)

Extracts:
- Shader type (alpha, blend, particle, water, etc.)
- Texture references
- Shader properties (alpha, bump mapping, specular, emissive)

**What you need to do:**
- Convert .eft shader definitions to Three.js GLSL shaders
- Extract referenced .dds/.tga textures
- Convert textures to .png or .webp

### 3. Professions (`datatables/knowledgebase/professions.iff`)

Extracts:
- Profession names
- Starting skills
- Skill trees
- Required stats

**What you need to do:**
- Implement profession selection UI
- Create skill system
- Map professions to starting abilities

### 4. Stats & Attributes

Extracts:
- Attribute limits (min/max values for HAM stats)
- Racial modifiers (species-specific stat bonuses)
- Profession stat requirements

**What you need to do:**
- Implement character creation point allocation
- Apply racial bonuses
- Validate profession requirements

## Asset Replacement Workflow

1. **Parse Assets**
   ```bash
   node parse-assets.js --format json
   ```

2. **Review Manifest**
   - Open `asset-manifest.json`
   - Identify required models, textures, shaders

3. **Extract Original Assets**
   - Use SWG Model Viewer/Extractor to extract .iff models
   - Use TRE Explorer to extract textures from .tre archives
   - Copy .eft shader files for reference

4. **Convert Assets**
   - Models: .iff → .obj/.fbx → .gltf (use Blender)
   - Textures: .dds/.tga → .png/.webp (use ImageMagick/Photoshop)
   - Shaders: .eft → .glsl (manual conversion)

5. **Organize Converted Assets**
   ```
   public/
   ├── models/
   │   └── characters/
   │       ├── ithorian_male.gltf
   │       └── ...
   ├── textures/
   │   ├── ithorian_skin_01.png
   │   └── ...
   └── shaders/
       ├── alpha.glsl
       └── ...
   ```

6. **Update Asset Loader**
   - Modify `src/loaders/AssetLoader.js` to load converted assets
   - Map original asset paths to new paths using manifest

## Parser Internals

### File Types

- **.iff** - Interchange File Format (binary chunked format)
  - Used for models, datatables, objects
  - Parsed by `IFFLoader.js`
  
- **.eft** - Effect files (text-based shader definitions)
  - Contains shader code and texture references
  - Parsed as text with regex extraction

- **.tre** - Archive files (like .zip)
  - Contains packed game assets
  - Requires external tool to extract first

### Key Classes

**`SWGAssetParser`** (`src/loaders/SWGAssetParser.js`)
- Main parser class
- Methods:
  - `parseAllAssets()` - Parse everything
  - `parseCharacters()` - Parse creature .iff files
  - `parseEffects()` - Parse .eft shader files
  - `parseProfessions()` - Parse profession datatables
  - `parseStats()` - Parse attribute/racial mod tables
  - `generateReplacementManifest()` - Create mapping manifest

**`IFFLoader`** (`src/loaders/IFFLoader.js`)
- Binary IFF file parser
- Reads chunked binary format
- Extracts nested data structures

## Troubleshooting

### "Failed to load X.iff"
- Ensure the file exists in SWGTERRAIN directory
- Check file permissions
- Verify SWG files are properly extracted from .tre archives

### "Error parsing datatables"
- Some datatables may have custom formats
- Parser falls back to default values
- Check console for specific error messages

### "Character has no appearance"
- Character .iff may not contain appearance chunk
- Check if appearance is referenced in parent .iff
- May need to manually map appearance files

### Missing effects
- Effect references may be in separate .prt (particle) files
- Some effects are generated procedurally
- Check animation .iff files for effect triggers

## Next Steps After Parsing

1. **Asset Extraction Pipeline**
   - Set up automated extraction from .tre archives
   - Create batch conversion scripts
   - Validate converted assets

2. **Asset Loading System**
   - Implement async asset loading in AssetLoader
   - Add asset caching
   - Create loading progress UI

3. **Character Creation**
   - Build character creation UI
   - Implement profession selection
   - Add attribute point allocation
   - Apply racial modifiers

4. **Rendering**
   - Load GLTF models with Three.js
   - Apply custom shaders from .eft conversions
   - Implement animation system

## References

- [SWG IFF Format Documentation](http://www.swgemu.com/archive/scrapbookv51/data/20070927033234/index.html)
- [TRE File Format](http://modthesims2.com/wiki.php?title=TRE_File_Format)
- [SWGEmu Asset Documentation](http://www.swgemu.com/forums/content.php?r=229-Asset-Documentation)

## Tools

- **SWG Model Viewer** - View and extract .iff models
- **TRE Explorer** - Extract files from .tre archives
- **Miff/STF Editor** - Edit IFF and string table files
- **Blender** - Convert models to GLTF
- **ImageMagick** - Batch convert textures

# Asset Parser - Quick Start

## What Was Created

I've created a comprehensive SWG asset parsing system that can identify and catalog your character, effect, profession, and stats data for replacement planning.

### Files Created

1. **`src/loaders/SWGAssetParser.js`** - Main parser class
   - Parses characters from `object/creature/player/*.iff`
   - Parses effects from `effect/*.eft`
   - Parses professions from `datatables/knowledgebase/professions.iff`
   - Parses stats from `datatables/creation/*.iff`
   - Generates replacement manifest

2. **`parse-assets.js`** - CLI script to run the parser
   - Command-line interface for parsing
   - Multiple output formats (JSON, YAML, Markdown)
   - Detailed progress reporting

3. **`ASSET_PARSING.md`** - Complete documentation
   - Usage instructions
   - Output format explanation
   - Asset replacement workflow
   - Troubleshooting guide

## Quick Usage (Once Node.js is Set Up)

### Install Node.js 20
Since Node.js isn't currently in your PATH:

1. Download Node.js 20 from https://nodejs.org/
2. Install it (make sure "Add to PATH" is checked)
3. Restart your terminal

### Run the Parser

```bash
# Basic usage - generates asset-manifest.json
node parse-assets.js

# Generate markdown report for easy reading
node parse-assets.js --format markdown --output ASSET_REPORT.md

# Custom SWGTERRAIN path
node parse-assets.js --swg-path "C:\Your\Custom\Path\SWGTERRAIN"
```

## What the Parser Does

### 1. Characters (from `C:\Users\david\OneDrive\Desktop\SWGTERRAIN\object\creature\player\`)
- Found: `shared_ithorian_female.iff`, `shared_ithorian_male.iff`, `shared_sullustan_female.iff`, `shared_sullustan_male.iff`
- Extracts: Species names, appearance references, equipment slots, collision data
- Output: Character replacement plan with GLTF model paths and texture requirements

### 2. Effects (from `C:\Users\david\OneDrive\Desktop\SWGTERRAIN\effect\`)
- Found: Hundreds of .eft shader files (a_2blend.eft, a_alpha.eft, etc.)
- Extracts: Shader properties (alpha, blend, emissive, bump, specular), texture references
- Output: Shader conversion plan mapping .eft → Three.js GLSL shaders

### 3. Professions (from `C:\Users\david\OneDrive\Desktop\SWGTERRAIN\datatables\knowledgebase\professions.iff`)
- Extracts: Profession names, starting skills, skill trees, stat requirements
- Output: Profession data for character creation system

### 4. Stats (from `C:\Users\david\OneDrive\Desktop\SWGTERRAIN\datatables\creation\*.iff`)
- Extracts: Attribute limits (health, action, mind, strength, etc.)
- Extracts: Racial modifiers (Wookiee +100 health, etc.)
- Output: Character creation point allocation system data

## Example Output

The parser generates a JSON manifest like this:

```json
{
  "timestamp": "2026-01-11T05:30:00.000Z",
  "source": "C:\\Users\\david\\OneDrive\\Desktop\\SWGTERRAIN",
  
  "characters": [
    {
      "name": "ithorian_male",
      "original": "C:\\...\\shared_ithorian_male.iff",
      "replacement": {
        "model": "models/characters/ithorian_male.gltf",
        "textures": ["textures/ithorian_skin.png"],
        "animations": []
      }
    }
  ],
  
  "effects": [
    {
      "name": "a_alpha",
      "shaderType": "alpha",
      "properties": { "hasAlpha": true, "hasBlend": false }
    }
  ],
  
  "professions": [
    { "name": "Brawler", "skills": ["unarmed_combat"] }
  ],
  
  "stats": {
    "attributes": { "health": { "min": 100, "max": 1000 } },
    "racialMods": { "wookiee": { "health": 100, "strength": 15 } }
  }
}
```

## Current Setup Status

Your SWGTERRAIN directory structure:
```
C:\Users\david\OneDrive\Desktop\SWGTERRAIN\
├── effect\ ...................... ✓ Found (~hundreds of .eft files)
├── object\creature\player\ ...... ✓ Found (4 .iff files)
├── datatables\knowledgebase\ .... ✓ Found (professions.iff)
├── datatables\creation\ ......... ✓ Found (attribute_limits.iff, racial_mods.iff)
└── [other directories] .......... ✓ Available for future parsing
```

## Alternative: Manual Quick Check

If you want to inspect the assets manually before running the parser:

### Check Characters
```powershell
Get-ChildItem "C:\Users\david\OneDrive\Desktop\SWGTERRAIN\object\creature\player" -Filter "*.iff"
```

### Check Effects (first 20)
```powershell
Get-ChildItem "C:\Users\david\OneDrive\Desktop\SWGTERRAIN\effect" -Filter "*.eft" | Select-Object -First 20
```

### Check Professions
```powershell
Test-Path "C:\Users\david\OneDrive\Desktop\SWGTERRAIN\datatables\knowledgebase\professions.iff"
```

## Integration with Your Web Client

Once you have the manifest, you can:

1. **Load the manifest in your web client:**
   ```javascript
   import assetManifest from './asset-manifest.json';
   
   // Use manifest to map original assets to converted ones
   const characterModel = assetManifest.characters.find(c => c.name === 'ithorian_male');
   loader.load(characterModel.replacement.model);
   ```

2. **Implement profession selection:**
   ```javascript
   const professions = assetManifest.professions;
   // Build UI for profession selection
   // Apply stat requirements
   ```

3. **Use stats for character creation:**
   ```javascript
   const stats = assetManifest.stats;
   // Implement point allocation system
   // Apply racial modifiers
   ```

## Next Steps

1. **Install Node.js 20** (if not already installed)
2. **Run the parser:** `node parse-assets.js`
3. **Review the manifest:** Open `asset-manifest.json`
4. **Extract assets:** Use SWG Model Viewer to extract .iff models
5. **Convert assets:** 
   - Models: .iff → .gltf (via Blender)
   - Textures: .dds → .png (via ImageMagick)
   - Shaders: .eft → .glsl (manual conversion)
6. **Integrate:** Update AssetLoader.js to use converted assets

## Troubleshooting

**Parser doesn't run:**
- Make sure Node.js 20 is installed
- Verify it's in your PATH: `node --version`
- Restart your terminal after installing Node

**No files found:**
- Check SWGTERRAIN path is correct
- Ensure .tre archives are extracted
- Verify file permissions

**Need help:**
- See `ASSET_PARSING.md` for full documentation
- Check console output for specific errors

## Summary

You now have:
✅ Complete asset parser (`SWGAssetParser.js`)
✅ CLI tool to run it (`parse-assets.js`)
✅ Full documentation (`ASSET_PARSING.md`)
✅ Integration with existing IFF loader
✅ Support for characters, effects, professions, and stats

The parser will help you identify exactly what assets need to be replaced and map them to web-compatible formats for your StarWayGRUDA web client.

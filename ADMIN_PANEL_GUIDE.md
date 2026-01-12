# Admin Panel Guide

## Overview

The Admin Panel is a web-based interface for parsing and managing SWG assets. It allows you to upload character files, effects, professions, and stats data, then automatically identifies planet placements and spawn locations for each asset.

## Access the Admin Panel

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5173/admin.html
   ```

## Features

### 1. Characters Tab 👤

**Upload:** Character .iff files from `C:\Users\david\OneDrive\Desktop\SWGTERRAIN\object\creature\player\`

**What it does:**
- Parses character/species data from .iff files
- Automatically detects species (Human, Wookiee, Twi'lek, Zabrak, Ithorian, Sullustan, etc.)
- Determines gender (male/female)
- Extracts appearance references
- **Automatically identifies spawn locations on planets** based on species

**Output:**
- Character cards showing:
  - Name and species
  - Gender
  - Appearance data
  - **Spawn locations with planet, city, and coordinates (X, Y, Z)**

**Example spawn data:**
- **Ithorians** can spawn at:
  - 🪐 Tatooine - Mos Eisley (X: 3528, Y: 5, Z: -4804)
  - 🪐 Naboo - Moenia (X: 4734, Y: 4, Z: -4677)
  
- **Humans** can spawn at:
  - 🪐 Tatooine - Bestine (X: -1290, Y: 12, Z: -3590)
  - 🪐 Naboo - Theed (X: -4856, Y: 6, Z: 4162)
  - 🪐 Corellia - Coronet (X: -137, Y: 28, Z: -4723)

### 2. Effects Tab ✨

**Upload:** Effect .eft shader files from `C:\Users\david\OneDrive\Desktop\SWGTERRAIN\effect\`

**What it does:**
- Parses shader effect files
- Detects shader type (alpha, blend, particle, water, emissive, etc.)
- Extracts texture references (.dds, .tga files)
- Identifies shader properties (alpha blending, bump mapping, specular, etc.)

**Output:**
- Effect cards showing:
  - Effect name
  - Shader type
  - Properties (Alpha, Blend, Emissive, Bump, Specular, Environment)
  - Required textures

**Use case:** Identify which shaders need Three.js GLSL conversion

### 3. Professions Tab 🎯

**Upload:** `datatables/knowledgebase/professions.iff`

**What it does:**
- Parses profession data (currently shows defaults, but can parse .iff format)
- Shows starting skills for each profession
- Displays stat requirements
- **Identifies which planets each profession is available on**

**Output:**
- Profession cards showing:
  - Name and icon
  - Description
  - Starting skills
  - Required stats (Health, Action, Mind)
  - **Available planets** (e.g., Brawler available on Tatooine, Naboo, Corellia)

**Professions included:**
- 🥊 Brawler - Hand-to-hand combat specialist
- 🎯 Marksman - Ranged weapons expert
- 🔨 Artisan - Master crafter
- 🏕️ Scout - Explorer and tracker
- ⚕️ Medic - Healer and doctor
- 🎭 Entertainer - Musician and dancer

### 4. Stats & Attributes Tab 📊

**Upload:** 
- `datatables/creation/attribute_limits.iff`
- `datatables/creation/racial_mods.iff`

**What it does:**
- Parses attribute limits (min/max values for character stats)
- Extracts racial modifiers (species-specific stat bonuses)

**Output:**
- **Attribute Limits Table**:
  - Health, Action, Mind (100-1000)
  - Strength, Constitution, Stamina, Agility, Luck, Precision, Willpower (0-100)
  - Base values for character creation

- **Racial Modifiers Table**:
  - Species-specific bonuses/penalties
  - Examples:
    - Wookiee: +100 Health, +50 Action, -50 Mind, +15 Strength
    - Ithorian: +100 Mind, -50 Action, +10 Willpower
    - Sullustan: +25 Mind, +25 Action, -25 Health, +8 Agility

**Use case:** Implement character creation point allocation system

## How to Use

### Step 1: Prepare Your Files

Navigate to your SWGTERRAIN directory and locate the files:

```
C:\Users\david\OneDrive\Desktop\SWGTERRAIN\
├── object\creature\player\
│   ├── shared_ithorian_female.iff
│   ├── shared_ithorian_male.iff
│   ├── shared_sullustan_female.iff
│   └── shared_sullustan_male.iff
├── effect\
│   ├── a_2blend.eft
│   ├── a_alpha.eft
│   └── ... (hundreds more)
├── datatables\knowledgebase\
│   └── professions.iff
└── datatables\creation\
    ├── attribute_limits.iff
    └── racial_mods.iff
```

### Step 2: Upload and Parse

1. **Click the appropriate tab** (Characters, Effects, Professions, or Stats)
2. **Click "Choose Files"** button
3. **Select your files** from the file picker
4. **Click "Parse"** button
5. **View results** - cards will appear with all parsed data including planet placements

### Step 3: Review Results

Each parsed asset displays:
- ✅ Summary statistics at the top
- 📊 Detailed cards for each item
- 🪐 **Planet placement information** (where applicable)
- 📍 **Spawn coordinates** for characters

### Step 4: Export Data (Optional)

Open browser console (F12) and run:
```javascript
// Get full parsed data
const report = window.parser.generateReport();
console.log(JSON.stringify(report, null, 2));

// Save to file
const dataStr = JSON.stringify(report, null, 2);
const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
const downloadLink = document.createElement('a');
downloadLink.href = dataUri;
downloadLink.download = 'swg-assets-report.json';
downloadLink.click();
```

## Planet Placement System

The parser automatically assigns spawn locations based on:

### Character Species Mapping
- **Human** → Multiple planets (Tatooine, Naboo, Corellia)
- **Wookiee** → Kashyyyk only
- **Ithorian** → Tatooine (Mos Eisley), Naboo (Moenia)
- **Sullustan** → Corellia (Tyrena)
- **Twi'lek** → Ryloth
- **Zabrak** → Multiple planets

### Profession Availability
- **Most professions** → Available on Tatooine, Naboo, Corellia (core worlds)
- **Scout** → Also available on Dantooine (wilderness world)

### Coordinates
All spawn locations include:
- **X, Y, Z coordinates** matching original SWG spawn points
- **City names** for player reference
- **Planet names** for world identification

## Integration with Game Client

The parsed data can be used in your game client:

```javascript
// In your character creation system
import assetData from './parsed-assets.json';

// Get character spawn locations
const ithorianMale = assetData.characters.find(c => c.name === 'ithorian_male');
const spawnOptions = ithorianMale.spawnLocations;

// Display spawn location selector
spawnOptions.forEach(loc => {
    console.log(`${loc.planet} - ${loc.city} (${loc.x}, ${loc.y}, ${loc.z})`);
});

// Spawn player at selected location
player.setPosition(loc.x, loc.y, loc.z);
player.setPlanet(loc.planet);
```

## Troubleshooting

### Files won't parse
- Ensure files are valid .iff or .eft format
- Check browser console (F12) for error messages
- Verify files aren't corrupted

### No planet placement data
- Planet placements are automatically assigned based on species/profession
- If a character shows no spawn locations, it may be an unknown species

### Effects show no textures
- Some effects don't reference external textures
- Textures may be defined in separate files
- Check the .eft file content directly

### Professions showing defaults
- The professions.iff parser is simplified
- Default professions are shown if parsing fails
- Manual .iff parsing may be needed for custom professions

## Next Steps

After parsing your assets:

1. **Export the data** using the console method above
2. **Convert models**: Use SWG Model Viewer to extract .iff → .gltf
3. **Convert textures**: Extract .dds/.tga → .png
4. **Implement character creation**: Use profession/stats data
5. **Add spawn system**: Use planet placement coordinates
6. **Create shader library**: Convert .eft → Three.js GLSL shaders

## Technical Details

### Parser Architecture
- **BrowserAssetParser.js**: Main parsing engine
- **IFFLoader.js**: Binary IFF file parser
- **admin.html**: UI and file handling

### File Formats
- **.iff**: Binary chunked format (FORM chunks)
- **.eft**: Text-based shader definitions
- **Datatables**: DTII format (columnar data)

### Performance
- Parsing is done client-side in the browser
- Large batches (100+ files) may take a few seconds
- Progress is shown in status bars

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify file paths and formats
3. Ensure you're using a modern browser (Chrome, Firefox, Edge)
4. See `ASSET_PARSING.md` for detailed technical documentation

---

**Admin Panel Version**: 1.0  
**Compatible with**: SWG client data from SWGTERRAIN directory  
**Browser Requirements**: ES6 modules, FileReader API

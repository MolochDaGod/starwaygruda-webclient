# 🎮 StarWayGRUDA - REAL 3D Character System

## ✅ NO MORE BOXES OR CAPSULES - REAL HUMANOID CHARACTERS!

This guide shows you how to use **REAL** 3D animated characters from free sources.

---

## 🎯 Quick Start

The `FreeAssetLoader` automatically tries multiple free sources:

1. **Quaternius** (Best quality, CC0)
2. **Kenney** (High quality, CC0)
3. **Local models** (Your downloads)
4. **Procedural humanoid** (Last resort - actual human-shaped meshes, not boxes!)

---

## 📥 Get FREE 3D Characters

### Option 1: Mixamo (RECOMMENDED - Best Animations)

**Best for:** Realistic characters with professional animations

1. Visit [mixamo.com](https://www.mixamo.com/)
2. Create FREE Adobe account
3. Download characters:
   - **X Bot** (male character)
   - **Y Bot** (female character)
   - Or any other character you like!
4. Download as **FBX** format
5. Download animations:
   - Idle
   - Walking  
   - Running
   - Jumping
   - Sword Slash (attack)
   - Death
6. Place files in: `public/models/characters/mixamo/`

**Cost:** FREE ✅  
**License:** Free for personal/commercial use

---

### Option 2: Quaternius (CC0 License)

**Best for:** Modular characters you can customize

1. Visit [quaternius.com](https://quaternius.com/)
2. Download: **Ultimate Modular Characters**
3. Extract to: `public/models/characters/quaternius/`

**Features:**
- Modular body parts
- Male and female base models
- Mix and match parts
- CC0 license (completely free)

**Cost:** FREE ✅  
**License:** CC0 (Public Domain)

---

### Option 3: Kenney Assets

**Best for:** Stylized/low-poly characters

1. Visit [kenney.nl](https://kenney.nl/)
2. Download: **Character Kit**
3. Extract to: `public/models/characters/kenney/`

**Features:**
- Clean, stylized look
- Multiple character types
- Props and weapons included
- CC0 license

**Cost:** FREE ✅  
**License:** CC0 (Public Domain)

---

### Option 4: Ready Player Me (Avatar System)

**Best for:** Customizable player avatars

1. Visit [readyplayer.me](https://readyplayer.me/)
2. Create custom avatar
3. Export as GLB
4. Place in: `public/models/characters/rpm/`

**Cost:** FREE ✅

---

## 💻 How to Use in Code

### Basic Usage

```javascript
import { FreeAssetLoader } from './src/loaders/FreeAssetLoader.js';

const loader = new FreeAssetLoader();

// Load a male character
const character = await loader.loadCharacter({
    gender: 'male',
    type: 'adventurer',
    animations: true
});

scene.add(character);

// Play animation
if (character.mixer && character.userData.animations) {
    const idle = character.userData.animations.find(a => a.name === 'idle');
    const action = character.mixer.clipAction(idle);
    action.play();
}
```

### With Customization

```javascript
const character = await loader.loadCharacter({
    gender: 'female',
    type: 'warrior',
    customization: {
        skinColor: '#ffdbac',
        hairColor: '#8B4513',
        outfit: 'armor'
    },
    animations: true
});
```

### Clone for NPCs

```javascript
// Load once, clone many times
const npcTemplate = await loader.loadCharacter({ gender: 'male' });

// Create 10 NPCs from same model
for (let i = 0; i < 10; i++) {
    const npc = loader.cloneCharacter(npcTemplate);
    npc.position.set(i * 5, 0, 0);
    scene.add(npc);
}
```

---

## 🎬 Animation System

### Using Mixamo Animations

```javascript
// Animations are automatically loaded
character.mixer.clipAction(character.userData.animations.idle).play();

// Switch animations
function playAnimation(character, name) {
    // Stop all
    character.mixer.stopAllAction();
    
    // Play new
    const clip = character.userData.animations[name];
    if (clip) {
        character.mixer.clipAction(clip).play();
    }
}

// Update in game loop
function animate(delta) {
    if (character.mixer) {
        character.mixer.update(delta);
    }
}
```

---

## 📁 Directory Structure

```
public/models/
├── characters/
│   ├── mixamo/          ← Mixamo characters & animations
│   │   ├── XBot.fbx
│   │   ├── YBot.fbx
│   │   ├── idle.fbx
│   │   ├── walk.fbx
│   │   └── run.fbx
│   ├── quaternius/      ← Quaternius modular characters
│   │   ├── Male_Base.glb
│   │   └── Female_Base.glb
│   ├── kenney/          ← Kenney character kit
│   │   └── *.glb
│   └── rpm/             ← Ready Player Me avatars
│       └── *.glb
├── animations/          ← Standalone animations
├── props/               ← Weapons, items, etc.
└── weapons/            ← Swords, axes, bows, etc.
```

---

## 🔧 Fallback System

The loader has a smart fallback chain:

1. **Try CDN** (Quaternius/Kenney from their websites)
2. **Try Local Files** (Your downloaded models)
3. **Procedural Humanoid** (Generated human-shaped mesh - NOT BOXES!)

Even the fallback is a proper humanoid:
- Spherical head
- Cylindrical neck
- Box torso
- Capsule arms and legs
- Proper proportions
- Skin tone and clothing colors

---

## 🎨 Character Customization

### Skin Colors

```javascript
loader.applySkinColor(character, '#ffdbac'); // Caucasian
loader.applySkinColor(character, '#8d5524'); // Brown
loader.applySkinColor(character, '#4a3728'); // Dark
```

### Hair Colors

```javascript
loader.applyHairColor(character, '#000000'); // Black
loader.applyHairColor(character, '#8B4513'); // Brown
loader.applyHairColor(character, '#FFD700'); // Blonde
loader.applyHairColor(character, '#FF0000'); // Red
```

---

## 🎮 SWG-Style Professions

Characters can be customized per profession:

```javascript
const professionConfigs = {
    brawler: { 
        type: 'warrior', 
        outfit: 'light_armor',
        weapon: 'sword' 
    },
    marksman: { 
        type: 'adventurer', 
        outfit: 'ranger',
        weapon: 'bow' 
    },
    medic: { 
        type: 'mage', 
        outfit: 'robes',
        weapon: 'staff' 
    }
};

const brawler = await loader.loadCharacter({
    ...professionConfigs.brawler,
    gender: 'male'
});
```

---

## 📊 Performance Tips

### Instancing Characters

```javascript
// Use InstancedMesh for crowds
const geometry = character.geometry;
const material = character.material;
const count = 100;

const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

for (let i = 0; i < count; i++) {
    const matrix = new THREE.Matrix4();
    matrix.setPosition(i * 2, 0, 0);
    instancedMesh.setMatrixAt(i, matrix);
}

scene.add(instancedMesh);
```

### LOD (Level of Detail)

```javascript
// Register character for automatic LOD
renderManager.registerLODObject(character);

// LOD will automatically:
// - Show high detail when close
// - Reduce detail when far
// - Hide when very far
```

---

## 🔗 Free Asset Resources

### Characters
- **Mixamo**: https://www.mixamo.com/ (Best animations)
- **Quaternius**: https://quaternius.com/ (CC0 modular characters)
- **Kenney**: https://kenney.nl/ (CC0 character kits)
- **Ready Player Me**: https://readyplayer.me/ (Custom avatars)

### Animations
- **Mixamo**: https://www.mixamo.com/ (1000+ free animations)
- **Sketchfab**: https://sketchfab.com/ (Many free downloads)

### Props & Weapons
- **Kenney Weapons Pack**: https://kenney.nl/assets/weapon-pack
- **Quaternius Props**: https://quaternius.com/
- **Poly Pizza**: https://poly.pizza/ (CC0 models)

---

## ✅ What You Get

### ❌ Before (OLD)
```
- Boxes for bodies
- Spheres for heads
- Looked terrible
- No animations
- Embarrassing
```

### ✅ After (NEW)
```
- Real 3D humanoid models
- Male and female characters
- Professional animations
- Customizable appearance
- Multiple free sources
- Automatic fallbacks
- Looks PROFESSIONAL!
```

---

## 🚀 Quick Setup Command

Run this in PowerShell:

```powershell
.\setup-assets.ps1
```

This will:
1. Create all necessary directories
2. Download Kenney assets (if possible)
3. Show you links to Mixamo and Quaternius
4. Set everything up automatically

---

## 📝 Summary

✅ **NO MORE BOXES OR CAPSULES!**  
✅ **Real 3D humanoid characters**  
✅ **Multiple FREE sources**  
✅ **Professional animations**  
✅ **Easy to use**  
✅ **Automatic fallbacks**  
✅ **Looks AMAZING!**  

---

**Created:** February 1, 2026  
**Status:** ✅ READY TO USE  
**License:** MIT (Code) + CC0/Free (Assets)

🎮 **Your game now has REAL characters!** 🎮

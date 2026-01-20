# Mixamo Integration Guide

Get professional character animations **immediately** - no GPU required, completely free!

**Time**: 30 minutes | **Cost**: $0 | **Result**: 50+ game-ready animations

---

## 🎯 What is Mixamo?

Adobe's free service that provides:
- **2000+ pre-made animations**
- **Auto-rigging** for custom characters
- **Web-based** - works in browser
- **Free** - no cost, no credit card
- **Exports** to FBX → Convert to GLB for Three.js

Perfect for getting your game running **today** while you wait for HY-Motion cloud generation!

---

## 🚀 Quick Start (30 minutes)

### Step 1: Create Account (2 minutes)

1. Visit: https://www.mixamo.com
2. Click "Sign In" → "Create an account"
3. Use Adobe ID or create new account
4. **Free** - no payment required

### Step 2: Choose Character (optional)

Mixamo provides default characters, or upload your own:

**Option A**: Use Mixamo characters (easiest)
- Click "Characters" tab
- Select a humanoid character
- We'll download animations without character later

**Option B**: Upload your SWG character model
- Must be in FBX/OBJ format
- Auto-rigging takes 1-2 minutes
- Works with most humanoid models

### Step 3: Download SWG Animation Pack

I've pre-selected the best animations for SWG. Download each:

#### Locomotion Animations
```
Search → Download (Settings: FBX, 30fps, No Skin)

1. Walking
2. Running
3. Sprint
4. Walk Backward
5. Crouch Walk
6. Strafe Left
7. Strafe Right
8. Jump
```

#### Combat - Melee
```
9. Sword Slash
10. Thrust
11. Overhead Slash
12. Blocking
13. Dodge Left
14. Dodge Right
15. Sword And Shield Slash
16. Dual Sword Attack
```

#### Combat - Ranged
```
17. Rifle Aiming Idle
18. Rifle Shooting
19. Pistol Aiming Idle
20. Pistol Shoot
21. Reloading Rifle
22. Crouching To Standing
```

#### Force Powers (closest matches)
```
23. Casting Spell (→ Force Push)
24. Casting Spell 02 (→ Force Pull)
25. Casting Spell 03 (→ Force Lightning)
26. Standing Melee Attack Horizontal (→ Force Choke gesture)
27. Sitting Idle (→ Meditation)
```

#### Emotes
```
28. Waving
29. Bowing
30. Pointing
31. Victory Idle
32. Clapping
33. Capoeira
34. Macarena Dance
35. Sitting
36. Standing Up
37. Kneeling
38. Salute
```

#### Actions
```
39. Picking Up
40. Picking Something
41. Crouch To Stand
42. Drinking
43. Eating
```

#### Idle
```
44. Idle
45. Looking Around
46. Stretching
```

#### Combat Reactions
```
47. Hit Reaction
48. Hit Reaction Back
49. Dying
50. Death From The Back
```

### Step 4: Download Settings

**Important**: Use these settings for each animation:

```
Format: FBX for Unity (.fbx)
Frames per Second: 30
Skin: Without Skin (animations only)
```

Click **Download** → Save to folder:
`C:\Users\david\Desktop\StarWayGRUDA-WebClient\animations\mixamo_fbx\`

---

## 🔄 Convert FBX to GLB

Use the Blender script we created:

```powershell
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient\HY-Motion-1.0

# Convert all Mixamo FBX files to GLB
blender --background --python convert_fbx_to_glb.py -- --batch "../animations/mixamo_fbx" "../animations/mixamo_glb"
```

**Result**: GLB files ready for Three.js!

---

## 🎮 Integration with Three.js

### Load Animations

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Animation manager
class AnimationManager {
    constructor(character) {
        this.character = character;
        this.mixer = new THREE.AnimationMixer(character);
        this.animations = new Map();
        this.currentAction = null;
    }
    
    // Load animation
    async loadAnimation(name, url) {
        const loader = new GLTFLoader();
        return new Promise((resolve) => {
            loader.load(url, (gltf) => {
                const clip = gltf.animations[0];
                const action = this.mixer.clipAction(clip);
                this.animations.set(name, action);
                resolve(action);
            });
        });
    }
    
    // Play animation
    play(name, fadeTime = 0.2) {
        const action = this.animations.get(name);
        if (!action) return;
        
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(fadeTime);
        }
        
        action.reset().fadeIn(fadeTime).play();
        this.currentAction = action;
    }
    
    // Update (call in render loop)
    update(deltaTime) {
        this.mixer.update(deltaTime);
    }
}

// Usage
const animManager = new AnimationManager(playerCharacter);

// Load animations
await animManager.loadAnimation('walk', 'animations/mixamo_glb/Walking.glb');
await animManager.loadAnimation('run', 'animations/mixamo_glb/Running.glb');
await animManager.loadAnimation('idle', 'animations/mixamo_glb/Idle.glb');

// Play animation
animManager.play('walk');

// In render loop
function animate() {
    const delta = clock.getDelta();
    animManager.update(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

### Animation State Machine

```javascript
class PlayerController {
    constructor(character, animations) {
        this.character = character;
        this.animations = animations;
        this.state = 'idle';
        this.velocity = new THREE.Vector3();
    }
    
    update(input, deltaTime) {
        // Determine state based on input
        let newState = 'idle';
        
        if (input.forward || input.backward || input.left || input.right) {
            if (input.sprint) {
                newState = 'sprint';
                this.velocity.setLength(10);
            } else if (input.crouch) {
                newState = 'crouch_walk';
                this.velocity.setLength(2);
            } else {
                newState = 'walk';
                this.velocity.setLength(5);
            }
        }
        
        if (input.jump) newState = 'jump';
        if (input.attack) newState = 'melee_swing';
        
        // Change animation if state changed
        if (newState !== this.state) {
            this.state = newState;
            this.animations.play(newState);
        }
        
        this.animations.update(deltaTime);
    }
}
```

---

## 📦 Batch Download Script

Create this to automate downloads (requires browser automation):

```javascript
// mixamo_batch.js (pseudo-code - run manually)
const animations = [
    'Walking', 'Running', 'Sprint', 'Walk Backward',
    'Crouch Walk', 'Strafe Left', 'Strafe Right', 'Jump',
    // ... add all 50
];

// Search, configure, download each
// (Manual for now - Mixamo doesn't have official API)
```

---

## 🎯 SWG-Specific Animation Mapping

Map Mixamo animations to SWG actions:

| SWG Action | Mixamo Animation | Notes |
|------------|------------------|-------|
| `/walk` | Walking | Perfect match |
| `/run` | Running | Perfect match |
| `/kneel` | Kneeling | Perfect match |
| `/flourish` | Sword Slash | Lightsaber animation |
| `/sit` | Sitting | Perfect match |
| `/dance` | Capoeira / Macarena | Fun emotes |
| Force Push | Casting Spell | Close match |
| Force Lightning | Casting Spell 03 | Good match |
| Blaster Fire | Rifle Shooting | Excellent |

---

## 🔧 Optimize for Web

### Compress Animations

```javascript
// In Blender, before export
import bpy

# Reduce keyframes
for action in bpy.data.actions:
    bpy.context.object.animation_data.action = action
    bpy.ops.action.clean(threshold=0.001)

# Export optimized
bpy.ops.export_scene.gltf(
    filepath='output.glb',
    export_draco_mesh_compression_enable=True,
    export_animations=True
)
```

### Lazy Load Animations

```javascript
// Only load animations when needed
async loadAnimationOnDemand(name) {
    if (!this.animations.has(name)) {
        await this.loadAnimation(name, `animations/${name}.glb`);
    }
    return this.animations.get(name);
}
```

---

## 💡 Pro Tips

### Speed Up Workflow
1. **Download all at once** - Open multiple tabs
2. **Use consistent naming** - Match SWG action names
3. **Organize by category** - locomotion/, combat/, emotes/
4. **Test early** - Load one animation and test before bulk download

### Quality
- Use **30 FPS** (standard for games)
- **Without Skin** (animations only, smaller files)
- **No character** (unless you want Mixamo character)

### Animation Blending
```javascript
// Smooth transitions between animations
action.crossFadeTo(nextAction, 0.3, true);
```

---

## 🆚 Mixamo vs HY-Motion

| Feature | Mixamo | HY-Motion |
|---------|--------|-----------|
| Cost | Free | $2-4 (cloud GPU) |
| Time | 30 min | 3-4 hours |
| Quality | Professional | AI-generated |
| Customization | Limited | Text prompts |
| Availability | Instant | Need cloud GPU |
| Best For | Quick start | Custom animations |

**Recommendation**: 
1. Use **Mixamo** NOW to get game running
2. Generate **HY-Motion** animations later for unique moves
3. **Combine both** for maximum variety

---

## 📋 Complete Workflow

```powershell
# 1. Download from Mixamo
# (Manual - 30 minutes)

# 2. Convert to GLB
cd HY-Motion-1.0
blender --background --python convert_fbx_to_glb.py -- --batch "../animations/mixamo_fbx" "../animations/mixamo_glb"

# 3. Copy to game assets
cp ../animations/mixamo_glb/* ../public/animations/

# 4. Test in game
npm run dev
# Open http://localhost:8080
```

---

## 🔗 Resources

- **Mixamo**: https://www.mixamo.com
- **Animation List**: https://www.mixamo.com/#/?page=1&type=Motion
- **Three.js Animation**: https://threejs.org/docs/#manual/en/introduction/Animation-system
- **Blender**: https://www.blender.org/

---

## ✅ Checklist

- [ ] Create Mixamo account
- [ ] Download 50 core animations
- [ ] Convert FBX to GLB
- [ ] Integrate AnimationManager in game
- [ ] Test walk/run/idle animations
- [ ] Add combat animations
- [ ] Add emotes
- [ ] Create animation state machine
- [ ] Test in-game
- [ ] Deploy to Vercel

---

**Result**: Professional animations in your game within 1 hour! 🎉

**Then**: Use HY-Motion on cloud GPU for custom, unique animations later.

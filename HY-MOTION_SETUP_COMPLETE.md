# ✅ HY-Motion 1.0 Setup Complete

**Status**: Repository cloned and ready for character animation generation

---

## 📁 What Was Installed

```
StarWayGRUDA-WebClient/
└── HY-Motion-1.0/          (Cloned from Tencent-Hunyuan)
    ├── STARWAY_INTEGRATION.md     ← Complete integration guide
    ├── generate_swg_animations.ps1 ← Batch animation generator
    ├── convert_fbx_to_glb.py      ← FBX to GLB converter
    ├── START_HERE.bat             ← Windows quick start menu
    ├── gradio_app.py              ← Web interface
    ├── local_infer.py             ← CLI batch generation
    ├── requirements.txt           ← Dependencies
    └── ckpts/                     ← Model weights (to download)
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

**Option A - Windows Menu:**
```cmd
cd HY-Motion-1.0
START_HERE.bat
# Choose option 1: Install dependencies
```

**Option B - Command Line:**
```powershell
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient\HY-Motion-1.0
pip install -r requirements.txt
```

### Step 2: Download Models

You need a GPU with **24GB+ VRAM**. Choose one:

**Lite Model (24GB VRAM)** - Faster, slightly lower quality:
```powershell
huggingface-cli download tencent/HY-Motion-1.0 --include "HY-Motion-1.0-Lite/*" --local-dir ckpts/tencent
huggingface-cli download openai/clip-vit-large-patch14 --local-dir ckpts/clip-vit-large-patch14/
huggingface-cli download Qwen/Qwen3-8B --local-dir ckpts/Qwen3-8B
```

**Standard Model (26GB VRAM)** - Best quality:
```powershell
huggingface-cli download tencent/HY-Motion-1.0 --include "HY-Motion-1.0/*" --local-dir ckpts/tencent
huggingface-cli download openai/clip-vit-large-patch14 --local-dir ckpts/clip-vit-large-patch14/
huggingface-cli download Qwen/Qwen3-8B --local-dir ckpts/Qwen3-8B
```

**Total download size**: ~15-20GB

### Step 3: Generate Animations

**Option A - Use the batch script (recommended for SWG):**
```powershell
.\generate_swg_animations.ps1
```

This generates **50+ pre-defined SWG animations** including:
- Locomotion (walk, run, sprint, crouch)
- Combat (melee, ranged, lightsaber)
- Force powers (push, pull, lightning, choke)
- Emotes (wave, bow, sit, dance, clap)
- Crafting & actions

**Option B - Web interface (for custom prompts):**
```powershell
python gradio_app.py
# Open browser to http://localhost:7860
```

---

## 📊 What Animations Will Be Generated

The `generate_swg_animations.ps1` script creates **50 animations**:

### Locomotion (8)
- walk_forward, walk_backward, run_forward, sprint
- walk_crouch, run_left_strafe, run_right_strafe, jump_forward

### Combat - Melee (8)
- melee_swing_horizontal, melee_swing_vertical, melee_stab_forward
- melee_block, melee_dodge_left, melee_dodge_right
- lightsaber_swing_1, lightsaber_swing_2

### Combat - Ranged (6)
- ranged_aim_rifle, ranged_fire_rifle
- ranged_draw_pistol, ranged_fire_pistol
- ranged_reload, ranged_take_cover

### Force Powers (5)
- force_push, force_pull, force_lightning
- force_choke, force_meditation

### Emotes (11)
- emote_wave, emote_bow, emote_point, emote_cheer
- emote_clap, emote_dance_1, emote_dance_2
- emote_sit, emote_stand, emote_kneel, emote_salute

### Crafting & Actions (6)
- craft_work, pickup_object, place_object
- examine_hands, drink, eat

### Idle States (3)
- idle_stand, idle_look_around, idle_stretch

### Combat Reactions (4)
- hit_react_front, hit_react_back
- death_fall_forward, death_fall_backward

---

## 📦 Output Files

Each animation generates 4 files:

1. **`.fbx`** - Autodesk format (for Blender/Unity/Unreal)
2. **`.bvh`** - Motion capture format
3. **`.npy`** - NumPy array (SMPL parameters)
4. **`.mp4`** - Video preview

**Location**: `output/swg_animations/`

---

## 🔄 Convert to Three.js Format

### Option 1: Single File
```powershell
blender --background --python convert_fbx_to_glb.py -- input.fbx output.glb
```

### Option 2: Batch Convert All
```powershell
blender --background --python convert_fbx_to_glb.py -- --batch "output/swg_animations" "animations_glb"
```

This converts all FBX files to GLB format for Three.js.

---

## 🎮 Use in Three.js

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Load animation
const loader = new GLTFLoader();
loader.load('animations/walk_forward.glb', (gltf) => {
    const animation = gltf.animations[0];
    const mixer = new THREE.AnimationMixer(characterModel);
    const action = mixer.clipAction(animation);
    action.play();
    
    // Update in animation loop
    function animate() {
        const delta = clock.getDelta();
        mixer.update(delta);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
});
```

---

## 🔗 Integration with Warp Worker

Generate animations from browser console:

```javascript
// From your StarWayGRUDA web client
const result = await WarpWorker.runCommand(
    'cd HY-Motion-1.0 && python local_infer.py --model_path ckpts/tencent/HY-Motion-1.0-Lite --input_text "A person performs a backflip"'
);

console.log('Animation generated!');
```

---

## ⚙️ System Requirements Check

Before starting, verify your system:

```powershell
# Check Python version (need 3.8+)
python --version

# Check GPU and VRAM
nvidia-smi

# Check if PyTorch sees CUDA
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

**Minimum Requirements:**
- Python 3.8+
- NVIDIA GPU with 24GB VRAM
- CUDA 11.8 or 12.1
- 32GB RAM
- ~25GB free disk space

---

## 📚 Documentation Files

1. **STARWAY_INTEGRATION.md** - Complete guide with all details
2. **generate_swg_animations.ps1** - Automated batch generator
3. **convert_fbx_to_glb.py** - Blender conversion script
4. **START_HERE.bat** - Windows menu system
5. **HY-Motion-1.0/README.md** - Original Tencent documentation

---

## 🎯 Recommended Workflow

### First Time Setup
1. Run `START_HERE.bat` → Choose option 1 (install)
2. Run `START_HERE.bat` → Choose option 2 (download Lite model)
3. Wait for models to download (~15GB, 10-30 min)

### Generate SWG Animations
1. Run `.\generate_swg_animations.ps1`
2. Wait for generation (~2-3 hours for 50 animations)
3. Check `output/swg_animations/` folder

### Convert to Web Format
1. Install Blender (https://www.blender.org/download/)
2. Run: `blender --background --python convert_fbx_to_glb.py -- --batch "output/swg_animations" "public/animations"`
3. Animations ready for Three.js!

### Integrate with Game
1. Copy GLB files to `public/animations/`
2. Update character controller to load animations
3. Create animation state machine
4. Test in-game!

---

## ⚡ Performance Tips

- **First run takes longer** - Models load into VRAM
- **Close other GPU apps** - Free up VRAM
- **Use Lite model** - If VRAM limited
- **Generate in batches** - Split into smaller groups
- **Use SSD** - Faster model loading

---

## 🐛 Common Issues

### "CUDA out of memory"
```powershell
# Use Lite model instead
# Or reduce batch size in generate_swg_animations.ps1
```

### "Module not found"
```powershell
pip install -r requirements.txt
```

### "Model not downloaded"
```powershell
# Download manually using huggingface-cli
# See Step 2 above
```

### "Blender not found"
```powershell
# Install Blender from https://www.blender.org/download/
# Add to PATH or use full path: "C:\Program Files\Blender Foundation\Blender 4.x\blender.exe"
```

---

## 🎉 Next Steps

1. ✅ **HY-Motion cloned** - You're here!
2. ⬜ Install dependencies
3. ⬜ Download models
4. ⬜ Generate animations
5. ⬜ Convert to GLB
6. ⬜ Integrate with Three.js
7. ⬜ Build animation state machine
8. ⬜ Add animation blending
9. ⬜ Test in StarWayGRUDA web client

---

## 🔗 Useful Links

- **HY-Motion Demo**: https://huggingface.co/spaces/tencent/HY-Motion-1.0
- **Models**: https://huggingface.co/tencent/HY-Motion-1.0
- **Documentation**: https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- **Three.js Animation**: https://threejs.org/docs/#manual/en/introduction/Animation-system
- **Blender**: https://www.blender.org/

---

## 📞 Get Help

- Check `STARWAY_INTEGRATION.md` for detailed instructions
- Run `START_HERE.bat` for guided menu
- Read HY-Motion's README.md for model info
- Check Warp Worker logs for generation progress

---

**Everything is ready! Start with `START_HERE.bat` or run `.\generate_swg_animations.ps1` to begin! 🚀**

**May the Force be with your animations! ⚔️✨**

# Mixamo Animations Setup

Download these animations from [Mixamo](https://www.mixamo.com/) and place them in this folder.

## Required Animations

### Movement (if not using embedded GLB animations)
- `idle.fbx` - Idle stance
- `walk.fbx` - Walking forward
- `run.fbx` - Running forward
- `jump.fbx` - Jump animation
- `fall.fbx` - Falling/airborne

### Combat - Sword/Melee
- `sword_slash_1.fbx` - First attack in combo (e.g., "Sword And Shield Slash")
- `sword_slash_2.fbx` - Second attack (e.g., "Sword And Shield Slash 2")
- `sword_slash_3.fbx` - Third/heavy attack (e.g., "Great Sword Slash")
- `sword_combo.fbx` - Full combo animation (optional)

### Combat - Defense
- `block.fbx` - Blocking stance (e.g., "Sword And Shield Block")
- `dodge_roll.fbx` - Dodge roll (e.g., "Combat Roll")
- `hit_reaction.fbx` - Getting hit (e.g., "Hit Reaction")
- `death.fbx` - Death animation (e.g., "Dying")

### Magic/Ranged
- `spell_cast.fbx` - Spell casting (e.g., "Standing Magic Attack")
- `bow_attack.fbx` - Bow shot (e.g., "Standing Aiming Recoil")

## Download Settings

When downloading from Mixamo:
1. Select **FBX for Unity (.fbx)** format
2. Set **Skin** to "Without Skin" (animation only)
3. **Keyframe Reduction**: None
4. **Frames per Second**: 30

## Recommended Mixamo Animations

### Sword Combat Pack
- "Sword And Shield Slash" → `sword_slash_1.fbx`
- "Sword And Shield Slash 2" → `sword_slash_2.fbx`
- "Great Sword Slash" → `sword_slash_3.fbx`
- "Sword And Shield Block" → `block.fbx`
- "Sword And Shield Block Impact" → `block_hit.fbx`

### Movement Pack
- "Idle" → `idle.fbx`
- "Walking" → `walk.fbx`
- "Running" → `run.fbx`
- "Jump" → `jump.fbx`
- "Falling Idle" → `fall.fbx`

### Reactions Pack
- "Hit Reaction" → `hit_reaction.fbx`
- "Dying" → `death.fbx`
- "Standing React Small From Front" → `stagger.fbx`

### Dodge/Roll Pack
- "Combat Roll" → `dodge_roll.fbx`
- "Dodge Backward" → `dodge_back.fbx`

## Alternative: Use GLB with Embedded Animations

The KayKit characters already include basic animations (Idle, Walk, Run, Jump).
You only need to download combat animations from Mixamo for attacks.

## Weapon-Specific Animation Sets

### Two-Handed Sword
- "Great Sword Slash"
- "Great Sword Idle"

### Dual Wield
- "Dual Weapon Combo"
- "Dual Sword Slash"

### Staff/Mage
- "Standing Magic Attack"
- "Standing Cast Spell 01"

### Bow
- "Standing Aiming Recoil"
- "Standing Draw Arrow"

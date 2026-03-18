# Mixamo Animations — GRUDA Wars

This folder holds Mixamo FBX animation files organized by weapon type.
They layer on top of the KayKit GLB base animations to give each class
their own distinct feel. Files are loaded by `WeaponAnimationController`.

> **All FBX files fall back gracefully to KayKit clips if not present.**
> You can add packs one at a time as you download them.

---

## Download Settings (Mixamo.com)

1. Select **FBX for Unity (.fbx)** format
2. Set **Skin** → **Without Skin** (animation only — no mesh needed)
3. **Keyframe Reduction** → None
4. **Frames per Second** → 30
5. Use any Mixamo character as preview; only the animation data is kept

---

## Directory Structure

```
public/assets/animations/mixamo/
├── base/             ← shared locomotion + reactions (all weapon types)
├── melee-1h/         ← 1H sword, dagger, mace (Warrior, Rogue)
├── sword-shield/     ← Warrior tank
├── greatsword/       ← Warrior 2H DPS
├── dual-wield/       ← Rogue
├── spear/            ← Worge, Ranger
├── longbow/          ← Ranger
├── pistol/           ← Ranger gunslinger
├── rifle/            ← Ranger sniper
└── magic/            ← Mage, Worge caster
```

---

## base/ — Shared (all weapons)

All characters share these. Download with unarmed/default Mixamo character.

| File | Mixamo search term | Notes |
|------|--------------------|-------|
| `jump.fbx` | "Jump" | Start-to-apex |
| `fall.fbx` | "Falling Idle" | Loop while airborne |
| `land.fbx` | "Hard Landing" | On touchdown |
| `dodge_roll.fbx` | "Combat Roll" | Full roll, one-shot |
| `swim.fbx` | "Swimming" | Looping |
| `swim_idle.fbx` | "Floating" | Idle in water |
| `climb.fbx` | "Climbing" | Wall/ladder |
| `take_hit_front.fbx` | "Hit Reaction" | Front impact |
| `take_hit_back.fbx` | "Standing React Large From Behind" | Back impact |
| `stunned.fbx` | "Stunned" | Loop while stunned |
| `death.fbx` | "Dying" | One-shot, clamped |

---

## melee-1h/ — 1H Melee (Warrior DPS, Rogue)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Sword And Shield Slash" |
| `attack_2.fbx` | "Sword And Shield Slash 2" |
| `attack_3.fbx` | "Standing Melee Attack Spinning" |
| `block.fbx` | "Sword And Shield Block" |

---

## sword-shield/ — Sword + Shield (Warrior tank)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Sword And Shield Slash" |
| `attack_2.fbx` | "Sword And Shield Slash 2" |
| `attack_3.fbx` | "Sword And Shield Attack" |
| `block.fbx` | "Sword And Shield Block" |
| `block_hit.fbx` | "Sword And Shield Block Impact" |

---

## greatsword/ — 2H Greatsword (Warrior 2H)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Great Sword Idle" |
| `walk.fbx` | "Great Sword Walk" |
| `run.fbx` | "Great Sword Run" |
| `attack_1.fbx` | "Great Sword Slash" |
| `attack_2.fbx` | "Great Sword Slash 2" |
| `attack_3.fbx` | "Standing Melee Attack Downward" |

---

## dual-wield/ — Dual Wield (Rogue)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Dual Sword Slash" |
| `attack_2.fbx` | "Dual Weapon Combo" |
| `attack_3.fbx` | "Spin Attack" |

---

## spear/ — Spear / Polearm (Worge, Ranger)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Standing Melee Attack Stab" |
| `attack_2.fbx` | "Standing Melee Attack Horizontal" |
| `attack_3.fbx` | "Standing Melee Attack Spinning" |

---

## longbow/ — Longbow (Ranger)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Aiming Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Standing Aiming Recoil" |
| `attack_2.fbx` | "Standing Draw Arrow" |

---

## pistol/ — Pistol (Ranger gunslinger)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Standing Shooting" |
| `attack_2.fbx` | "Pistol Shooting" |

---

## rifle/ — Rifle (Ranger sniper)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Rifle Aiming Idle" |
| `walk.fbx` | "Rifle Walk" |
| `run.fbx` | "Rifle Run" |
| `attack_1.fbx` | "Standing Rifle Shoot" |

---

## magic/ — Magic Staff (Mage, Worge caster)

| File | Mixamo search term |
|------|-----------------|
| `idle.fbx` | "Standing Idle" |
| `walk.fbx` | "Walking" |
| `run.fbx` | "Running" |
| `attack_1.fbx` | "Standing Magic Attack 01" |
| `attack_2.fbx` | "Standing Magic Attack 02" |
| `skill_cast.fbx` | "Standing Cast Spell 01" |

---

## KayKit Skeleton Bone Names

KayKit models export with Mixamo-compatible bone naming, so Mixamo FBX
clips retarget automatically via Three.js `AnimationMixer`.

**Hand attachment bones (used by WeaponAttachmentSystem):**
- Right hand: `mixamorigRightHand` → fallback `RightHand` → `Hand_R`
- Left hand:  `mixamorigLeftHand`  → fallback `LeftHand`  → `Hand_L`
- Left forearm (shield): `mixamorigLeftForeArm` → `LeftForeArm`

Run `weaponAttach.listBoneNames(characterModel)` in the browser console
to see all bone names on your loaded character.

---

## Quick Start Integration

```js
import KayKitCharacterSystem, { WeaponType } from './player/KayKitCharacterSystem.js';

const kayKit = new KayKitCharacterSystem(scene, camera);
await kayKit.init('knight');

// Enable weapon system (falls back to KayKit clips automatically)
await kayKit.initWeaponSystems(WeaponType.SWORD_SHIELD);

// Attach sword + shield meshes from KayKit Dungeon pack
await kayKit.equipWeapon(
  WeaponType.SWORD_SHIELD,
  '/assets/weapons/Sword_1H.glb',
  '/assets/weapons/Shield_Round.glb',
);

// In game loop:
kayKit.update(deltaTime);              // mixer + timer update
kayKit.setMovementInput(fwd, right, isRun, isJump);

// On attack input:
kayKit.weaponAnim.attack();

// On block held:
kayKit.weaponAnim.block(true);

// On dodge:
kayKit.weaponAnim.dodge();

// Swap weapon at runtime:
await kayKit.equipWeapon(WeaponType.GREATSWORD, '/assets/weapons/Greatsword.glb');
```

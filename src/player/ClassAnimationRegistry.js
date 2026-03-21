/**
 * ClassAnimationRegistry
 *
 * Central registry that maps (characterClass + weaponType) → animation clip names.
 * Used by both the player's WeaponAnimationController / KayKitCharacterSystem
 * and the NPC AnimatedNPCSystem so every character type plays unique animations.
 *
 * Clip names match those embedded in the KayKit GLB animation packs
 * (Rig_Medium_MovementBasic.glb, Rig_Medium_General.glb).
 */

// ─── Character Classes ────────────────────────────────────────────────────────
export const CharacterClass = {
    WARRIOR: 'warrior',
    MAGE:    'mage',
    RANGER:  'ranger',
    ROGUE:   'rogue',
    WORGE:   'worge',
};

// ─── NPC Archetypes (extend CharacterClass for AI-only types) ─────────────────
export const NPCArchetype = {
    SKELETON_WARRIOR: 'skeleton_warrior',
    SKELETON_MAGE:    'skeleton_mage',
    SKELETON_ROGUE:   'skeleton_rogue',
    SKELETON_MINION:  'skeleton_minion',
    GOBLIN:           'goblin',
    ORC:              'orc',
    BANDIT:           'bandit',
    BOSS_MELEE:       'boss_melee',
    BOSS_MAGIC:       'boss_magic',
};

// ─── Animation States ─────────────────────────────────────────────────────────
export const AnimState = {
    // Locomotion
    IDLE:       'idle',
    WALK:       'walk',
    RUN:        'run',
    JUMP:       'jump',
    FALL:       'fall',
    LAND:       'land',
    DODGE:      'dodge',

    // Combat
    ATTACK_1:   'attack_1',
    ATTACK_2:   'attack_2',
    ATTACK_3:   'attack_3',
    BLOCK:      'block',
    BLOCK_HIT:  'block_hit',
    CAST:       'cast',

    // Reactions
    HIT:        'hit',
    DEATH:      'death',
    STUNNED:    'stunned',
    SPAWN:      'spawn',

    // Emotes / misc
    INTERACT:   'interact',
    PICKUP:     'pickup',
    WAVE:       'wave',
    CHEER:      'cheer',
};

// ─── KayKit GLB clip names ────────────────────────────────────────────────────
// These are the actual clip names embedded inside the KayKit Rig_Medium GLBs.
const KK = {
    // General
    Idle_A:                    'Idle_A',
    Idle_B:                    'Idle_B',
    Walking_A:                 'Walking_A',
    Walking_B:                 'Walking_B',
    Running_A:                 'Running_A',
    Running_B:                 'Running_B',
    Jump_Full_Short:           'Jump_Full_Short',
    Jump_Full_Long:            'Jump_Full_Long',
    Death_A:                   'Death_A',
    Death_A_Pose:              'Death_A_Pose',
    Hit_A:                     'Hit_A',
    Interact:                  'Interact',
    PickUp:                    'PickUp',
    Spawn:                     'Spawn',
    Wave:                      'Wave',
    Cheer:                     'Cheer',
    Dodge_Right:               'Dodge_Right',
    Dodge_Left:                'Dodge_Left',
    Dodge_Backward:            'Dodge_Backward',
    Dodge_Forward:             'Dodge_Forward',

    // 1-Hand melee
    '1H_Melee_Attack_Slice_Diagonal':  '1H_Melee_Attack_Slice_Diagonal',
    '1H_Melee_Attack_Slice_Horizontal':'1H_Melee_Attack_Slice_Horizontal',
    '1H_Melee_Attack_Stab':            '1H_Melee_Attack_Stab',
    '1H_Melee_Attack_Chop':            '1H_Melee_Attack_Chop',

    // 2-Hand melee
    '2H_Melee_Attack_Slice':   '2H_Melee_Attack_Slice',
    '2H_Melee_Attack_Spin':    '2H_Melee_Attack_Spin',
    '2H_Melee_Attack_Chop':    '2H_Melee_Attack_Chop',

    // Dual wield
    Dual_Melee_Attack_Slice:   'Dual_Melee_Attack_Slice',
    Dual_Melee_Attack_Stab:    'Dual_Melee_Attack_Stab',
    Dual_Melee_Attack_Spin:    'Dual_Melee_Attack_Spin',

    // Ranged 1H (pistol)
    '1H_Ranged_Shoot':         '1H_Ranged_Shoot',
    '1H_Ranged_Aiming':        '1H_Ranged_Aiming',

    // Ranged 2H (bow / rifle)
    '2H_Ranged_Shoot':         '2H_Ranged_Shoot',
    '2H_Ranged_Aiming':        '2H_Ranged_Aiming',

    // Spell / magic
    Spellcast_Shoot:           'Spellcast_Shoot',
    Spellcast_Raise:           'Spellcast_Raise',
    Spellcast_Long:            'Spellcast_Long',

    // Block / shield
    Block:                     'Block',
    Block_Hit:                 'Block_Hit',
    Block_Attack:              'Block_Attack',

    // Unarmed
    Unarmed_Melee_Attack_Punch_A: 'Unarmed_Melee_Attack_Punch_A',
    Unarmed_Melee_Attack_Kick:    'Unarmed_Melee_Attack_Kick',
};

// ─── Base locomotion (shared by all) ──────────────────────────────────────────
const BASE_LOCOMOTION = {
    [AnimState.IDLE]:   KK.Idle_A,
    [AnimState.WALK]:   KK.Walking_A,
    [AnimState.RUN]:    KK.Running_A,
    [AnimState.JUMP]:   KK.Jump_Full_Short,
    [AnimState.DODGE]:  KK.Dodge_Right,
    [AnimState.HIT]:    KK.Hit_A,
    [AnimState.DEATH]:  KK.Death_A,
    [AnimState.STUNNED]: KK.Hit_A,       // re-use hit for stunned
    [AnimState.SPAWN]:  KK.Spawn,
    [AnimState.INTERACT]: KK.Interact,
    [AnimState.PICKUP]: KK.PickUp,
    [AnimState.WAVE]:   KK.Wave,
    [AnimState.CHEER]:  KK.Cheer,
};

// ─── Per-class combat animation sets ──────────────────────────────────────────

/** Warrior — Sword + Shield */
const WARRIOR_SWORD_SHIELD = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK['1H_Melee_Attack_Slice_Diagonal'],
    [AnimState.ATTACK_2]: KK['1H_Melee_Attack_Slice_Horizontal'],
    [AnimState.ATTACK_3]: KK['1H_Melee_Attack_Stab'],
    [AnimState.BLOCK]:    KK.Block,
    [AnimState.BLOCK_HIT]:KK.Block_Hit,
};

/** Warrior — 2H Greatsword */
const WARRIOR_GREATSWORD = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK['2H_Melee_Attack_Slice'],
    [AnimState.ATTACK_2]: KK['2H_Melee_Attack_Spin'],
    [AnimState.ATTACK_3]: KK['2H_Melee_Attack_Chop'],
    [AnimState.BLOCK]:    KK.Block,
};

/** Mage — Staff */
const MAGE_STAFF = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK.Spellcast_Shoot,
    [AnimState.ATTACK_2]: KK.Spellcast_Raise,
    [AnimState.ATTACK_3]: KK.Spellcast_Long,
    [AnimState.CAST]:     KK.Spellcast_Long,
    [AnimState.BLOCK]:    KK.Block,
};

/** Ranger — Longbow */
const RANGER_LONGBOW = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK['2H_Ranged_Shoot'],
    [AnimState.ATTACK_2]: KK['2H_Ranged_Aiming'],
    [AnimState.ATTACK_3]: KK['2H_Ranged_Shoot'],
    [AnimState.BLOCK]:    KK.Dodge_Backward,
};

/** Ranger — Pistol / Gun */
const RANGER_PISTOL = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK['1H_Ranged_Shoot'],
    [AnimState.ATTACK_2]: KK['1H_Ranged_Aiming'],
    [AnimState.ATTACK_3]: KK['1H_Ranged_Shoot'],
};

/** Rogue — Dual Wield */
const ROGUE_DUAL = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK.Dual_Melee_Attack_Slice,
    [AnimState.ATTACK_2]: KK.Dual_Melee_Attack_Stab,
    [AnimState.ATTACK_3]: KK.Dual_Melee_Attack_Spin,
    [AnimState.DODGE]:    KK.Dodge_Backward,
};

/** Rogue — 1H dagger */
const ROGUE_DAGGER = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK['1H_Melee_Attack_Stab'],
    [AnimState.ATTACK_2]: KK['1H_Melee_Attack_Slice_Diagonal'],
    [AnimState.ATTACK_3]: KK['1H_Melee_Attack_Slice_Horizontal'],
    [AnimState.DODGE]:    KK.Dodge_Backward,
};

/** Worge — Spear */
const WORGE_SPEAR = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK['2H_Melee_Attack_Slice'],
    [AnimState.ATTACK_2]: KK['2H_Melee_Attack_Chop'],
    [AnimState.ATTACK_3]: KK['2H_Melee_Attack_Spin'],
};

/** Worge — Magic (caster form) */
const WORGE_MAGIC = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK.Spellcast_Shoot,
    [AnimState.ATTACK_2]: KK.Spellcast_Raise,
    [AnimState.ATTACK_3]: KK.Spellcast_Long,
    [AnimState.CAST]:     KK.Spellcast_Long,
};

/** Unarmed fallback */
const UNARMED = {
    ...BASE_LOCOMOTION,
    [AnimState.ATTACK_1]: KK.Unarmed_Melee_Attack_Punch_A,
    [AnimState.ATTACK_2]: KK.Unarmed_Melee_Attack_Kick,
    [AnimState.ATTACK_3]: KK.Unarmed_Melee_Attack_Punch_A,
};

// ─── Main Registry ────────────────────────────────────────────────────────────

/**
 * ANIMATION_SETS
 *
 * Lookup: ANIMATION_SETS[setKey] → { [AnimState]: clipName }
 *
 * Set keys correspond to weapon-style identifiers used by both the
 * WeaponAnimationController (player) and AnimatedNPCSystem (enemies).
 */
export const ANIMATION_SETS = {
    // Player class sets
    sword_shield:  WARRIOR_SWORD_SHIELD,
    greatsword:    WARRIOR_GREATSWORD,
    melee_1h:      WARRIOR_SWORD_SHIELD,   // alias — same 1H swings
    magic_staff:   MAGE_STAFF,
    longbow:       RANGER_LONGBOW,
    pistol:        RANGER_PISTOL,
    rifle:         RANGER_PISTOL,           // re-uses pistol stance
    dual_wield:    ROGUE_DUAL,
    dagger:        ROGUE_DAGGER,
    spear:         WORGE_SPEAR,
    worge_magic:   WORGE_MAGIC,
    unarmed:       UNARMED,

    // NPC-specific aliases (may override in future)
    skeleton_warrior: WARRIOR_SWORD_SHIELD,
    skeleton_mage:    MAGE_STAFF,
    skeleton_rogue:   ROGUE_DAGGER,
    skeleton_minion:  UNARMED,
    goblin:           ROGUE_DAGGER,
    orc:              WARRIOR_GREATSWORD,
    bandit:           ROGUE_DUAL,
    boss_melee:       WARRIOR_GREATSWORD,
    boss_magic:       MAGE_STAFF,
};

// ─── Model Registry ───────────────────────────────────────────────────────────

/**
 * NPC_MODEL_MAP
 *
 * Maps NPC archetype → { file, scale, animSet, tint? }
 * `file` is relative to /assets/characters/kaykit/
 */
export const NPC_MODEL_MAP = {
    [NPCArchetype.SKELETON_WARRIOR]: {
        file: 'Skeleton_Warrior.glb',
        scale: 1.0,
        animSet: 'skeleton_warrior',
    },
    [NPCArchetype.SKELETON_MAGE]: {
        file: 'Skeleton_Mage.glb',
        scale: 1.0,
        animSet: 'skeleton_mage',
    },
    [NPCArchetype.SKELETON_ROGUE]: {
        file: 'Skeleton_Rogue.glb',
        scale: 1.0,
        animSet: 'skeleton_rogue',
    },
    [NPCArchetype.SKELETON_MINION]: {
        file: 'Skeleton_Minion.glb',
        scale: 0.9,
        animSet: 'skeleton_minion',
    },
    [NPCArchetype.GOBLIN]: {
        file: 'Rogue.glb',
        scale: 0.7,
        animSet: 'goblin',
        tint: 0x66aa44,  // greenish tint
    },
    [NPCArchetype.ORC]: {
        file: 'Barbarian.glb',
        scale: 1.2,
        animSet: 'orc',
        tint: 0x558833,  // dark green
    },
    [NPCArchetype.BANDIT]: {
        file: 'Rogue_Hooded.glb',
        scale: 1.0,
        animSet: 'bandit',
    },
    [NPCArchetype.BOSS_MELEE]: {
        file: 'Knight.glb',
        scale: 2.0,
        animSet: 'boss_melee',
    },
    [NPCArchetype.BOSS_MAGIC]: {
        file: 'Mage.glb',
        scale: 1.8,
        animSet: 'boss_magic',
    },
};

// ─── Shared Animation Packs (GLB files to load for clips) ─────────────────────
export const SHARED_ANIMATION_PACKS = {
    movement: 'Rig_Medium_MovementBasic.glb',
    general:  'Rig_Medium_General.glb',
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get the animation set for a given set key.
 * Falls back to 'unarmed' if not found.
 */
export function getAnimationSet(setKey) {
    return ANIMATION_SETS[setKey] || ANIMATION_SETS.unarmed;
}

/**
 * Get the KayKit clip name for a specific (setKey, animState) combo.
 * Returns null if not mapped.
 */
export function getClipName(setKey, animState) {
    const set = getAnimationSet(setKey);
    return set[animState] || null;
}

/**
 * Get the NPC model config for an archetype.
 */
export function getNPCModelConfig(archetype) {
    return NPC_MODEL_MAP[archetype] || NPC_MODEL_MAP[NPCArchetype.SKELETON_MINION];
}

/**
 * Resolve which animation clip to try first, with a chain of fallbacks.
 * Returns an array of clip names to try in order.
 */
export function getClipFallbackChain(setKey, animState) {
    const primary = getClipName(setKey, animState);
    const unarmedFallback = ANIMATION_SETS.unarmed[animState];
    const baseFallback = BASE_LOCOMOTION[animState];

    const chain = [];
    if (primary)         chain.push(primary);
    if (unarmedFallback && unarmedFallback !== primary) chain.push(unarmedFallback);
    if (baseFallback && !chain.includes(baseFallback))  chain.push(baseFallback);
    return chain;
}

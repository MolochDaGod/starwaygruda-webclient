/**
 * @fileoverview Game constants, enums, and configuration values
 * Centralized location for magic numbers and game configuration
 * @module core/Constants
 */

// ============================================================================
// COMBAT
// ============================================================================

export const DamageType = Object.freeze({
    PHYSICAL: 'physical',
    MAGIC: 'magic',
    FIRE: 'fire',
    ICE: 'ice',
    LIGHTNING: 'lightning',
    HOLY: 'holy',
    SHADOW: 'shadow',
    POISON: 'poison',
    BLEED: 'bleed',
    TRUE: 'true' // Ignores armor/resistance
});

export const CombatResult = Object.freeze({
    HIT: 'hit',
    CRIT: 'crit',
    MISS: 'miss',
    DODGE: 'dodge',
    PARRY: 'parry',
    BLOCK: 'block',
    ABSORB: 'absorb',
    IMMUNE: 'immune',
    RESIST: 'resist'
});

export const CombatColors = Object.freeze({
    DAMAGE_PHYSICAL: '#ffffff',
    DAMAGE_MAGIC: '#9966ff',
    DAMAGE_FIRE: '#ff6600',
    DAMAGE_ICE: '#66ccff',
    DAMAGE_LIGHTNING: '#ffff00',
    DAMAGE_HOLY: '#ffffcc',
    DAMAGE_SHADOW: '#660066',
    DAMAGE_POISON: '#00ff00',
    DAMAGE_BLEED: '#cc0000',
    HEAL: '#00ff00',
    CRIT: '#ffcc00',
    MISS: '#999999',
    DODGE: '#66ccff',
    PARRY: '#ff9900',
    BLOCK: '#cccccc',
    XP_GAIN: '#9933ff',
    BUFF: '#00ccff',
    DEBUFF: '#ff3300'
});

// ============================================================================
// BUFFS & DEBUFFS
// ============================================================================

export const BuffType = Object.freeze({
    BUFF: 'buff',
    DEBUFF: 'debuff',
    AURA: 'aura',
    PASSIVE: 'passive'
});

export const BuffCategory = Object.freeze({
    STAT: 'stat',           // Strength, agility, etc.
    COMBAT: 'combat',       // Attack power, crit, etc.
    DEFENSIVE: 'defensive', // Armor, resistance, etc.
    MOVEMENT: 'movement',   // Speed, slow, root, etc.
    HEALING: 'healing',     // HoT, regen, etc.
    DAMAGE: 'damage',       // DoT, bleed, etc.
    CROWD_CONTROL: 'cc',    // Stun, fear, silence, etc.
    UTILITY: 'utility'      // Various effects
});

export const CrowdControlType = Object.freeze({
    STUN: 'stun',
    ROOT: 'root',
    SILENCE: 'silence',
    SLOW: 'slow',
    FEAR: 'fear',
    CHARM: 'charm',
    SLEEP: 'sleep',
    KNOCKBACK: 'knockback',
    KNOCKDOWN: 'knockdown',
    BLIND: 'blind',
    DISARM: 'disarm'
});

// ============================================================================
// ENTITY TYPES
// ============================================================================

export const EntityType = Object.freeze({
    PLAYER: 'player',
    NPC: 'npc',
    ENEMY: 'enemy',
    BOSS: 'boss',
    ELITE: 'elite',
    GOULD: 'gould',         // AI companion
    PET: 'pet',
    MOUNT: 'mount',
    OBJECT: 'object',
    RESOURCE: 'resource'
});

export const FactionRelation = Object.freeze({
    FRIENDLY: 'friendly',
    NEUTRAL: 'neutral',
    HOSTILE: 'hostile',
    ALLY: 'ally'
});

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UILayer = Object.freeze({
    WORLD: 0,           // In-world UI (nameplates)
    HUD: 100,           // Always-visible HUD
    WINDOWS: 200,       // Game windows
    MODAL: 300,         // Modal dialogs
    TOOLTIP: 400,       // Tooltips
    NOTIFICATION: 500,  // Notifications
    LOADING: 1000       // Loading screens
});

export const UIDefaults = Object.freeze({
    FONT_FAMILY: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    FONT_SIZE_SMALL: '11px',
    FONT_SIZE_NORMAL: '13px',
    FONT_SIZE_LARGE: '16px',
    FONT_SIZE_TITLE: '20px',
    
    TRANSITION_FAST: '0.1s',
    TRANSITION_NORMAL: '0.2s',
    TRANSITION_SLOW: '0.3s',
    
    BORDER_RADIUS: '4px',
    WINDOW_BORDER: '2px solid #4a4a4a',
    WINDOW_BACKGROUND: 'rgba(20, 20, 30, 0.95)',
    WINDOW_HEADER_BG: 'linear-gradient(to bottom, #3a3a4a, #2a2a3a)',
    
    HEALTH_BAR_COLOR: '#22cc22',
    HEALTH_BAR_LOW: '#ffcc00',
    HEALTH_BAR_CRITICAL: '#ff3300',
    MANA_BAR_COLOR: '#3366ff',
    STAMINA_BAR_COLOR: '#ffcc00',
    XP_BAR_COLOR: '#9933ff',
    
    HEALTH_LOW_THRESHOLD: 0.35,
    HEALTH_CRITICAL_THRESHOLD: 0.15
});

export const NameplateConfig = Object.freeze({
    MAX_DISTANCE: 50,           // Max render distance
    FADE_START: 40,             // Start fading at this distance
    SCALE_MIN: 0.5,             // Minimum scale
    SCALE_MAX: 1.0,             // Maximum scale
    HEIGHT_OFFSET: 2.2,         // Height above entity
    BAR_WIDTH: 100,             // Health bar width in pixels
    BAR_HEIGHT: 8,              // Health bar height
    SHOW_LEVEL: true,
    SHOW_GUILD: true,
    SHOW_TITLE: false,
    
    COLORS: {
        FRIENDLY_NAME: '#00ff00',
        NEUTRAL_NAME: '#ffff00',
        HOSTILE_NAME: '#ff3300',
        PLAYER_NAME: '#00ccff',
        NPC_NAME: '#99ff99',
        ELITE_BORDER: '#ffcc00',
        BOSS_BORDER: '#ff6600'
    }
});

export const FloatingTextConfig = Object.freeze({
    POOL_SIZE: 50,              // Object pool size
    DURATION: 1.5,              // Seconds to display
    RISE_SPEED: 60,             // Pixels per second
    SPREAD: 30,                 // Horizontal spread
    FADE_START: 0.7,            // Start fading at 70% through
    SCALE_CRIT: 1.5,            // Scale multiplier for crits
    FONT_SIZE: 18,
    FONT_SIZE_CRIT: 24,
    FONT_WEIGHT: 'bold',
    STACK_DELAY: 0.1            // Delay between stacked numbers
});

// ============================================================================
// SETTINGS KEYS
// ============================================================================

export const SettingsKey = Object.freeze({
    // Graphics
    GRAPHICS_QUALITY: 'graphics.quality',
    SHADOW_QUALITY: 'graphics.shadows',
    DRAW_DISTANCE: 'graphics.drawDistance',
    PARTICLE_DENSITY: 'graphics.particles',
    ANTI_ALIASING: 'graphics.antiAliasing',
    VSYNC: 'graphics.vsync',
    FPS_LIMIT: 'graphics.fpsLimit',
    
    // Audio
    MASTER_VOLUME: 'audio.master',
    MUSIC_VOLUME: 'audio.music',
    SFX_VOLUME: 'audio.sfx',
    AMBIENT_VOLUME: 'audio.ambient',
    VOICE_VOLUME: 'audio.voice',
    
    // Interface
    UI_SCALE: 'interface.scale',
    SHOW_TOOLTIPS: 'interface.tooltips',
    SHOW_DAMAGE_NUMBERS: 'interface.damageNumbers',
    SHOW_NAMEPLATES: 'interface.nameplates',
    SHOW_FRIENDLY_NAMEPLATES: 'interface.friendlyNameplates',
    SHOW_ENEMY_NAMEPLATES: 'interface.enemyNameplates',
    NAMEPLATE_DISTANCE: 'interface.nameplateDistance',
    BUFF_ICON_SIZE: 'interface.buffIconSize',
    
    // Combat
    AUTO_TARGET: 'combat.autoTarget',
    TARGET_LOCK: 'combat.targetLock',
    SHOW_COMBAT_TEXT: 'combat.showCombatText',
    
    // Keybinds
    KEYBIND_MOVE_FORWARD: 'keybind.moveForward',
    KEYBIND_MOVE_BACK: 'keybind.moveBack',
    KEYBIND_STRAFE_LEFT: 'keybind.strafeLeft',
    KEYBIND_STRAFE_RIGHT: 'keybind.strafeRight',
    KEYBIND_JUMP: 'keybind.jump',
    KEYBIND_ATTACK: 'keybind.attack',
    KEYBIND_BLOCK: 'keybind.block',
    KEYBIND_INTERACT: 'keybind.interact',
    KEYBIND_INVENTORY: 'keybind.inventory',
    KEYBIND_CHARACTER: 'keybind.character',
    KEYBIND_SKILLS: 'keybind.skills',
    KEYBIND_MAP: 'keybind.map',
    KEYBIND_SETTINGS: 'keybind.settings'
});

export const DefaultSettings = Object.freeze({
    // Graphics
    [SettingsKey.GRAPHICS_QUALITY]: 'high',
    [SettingsKey.SHADOW_QUALITY]: 'medium',
    [SettingsKey.DRAW_DISTANCE]: 1000,
    [SettingsKey.PARTICLE_DENSITY]: 1.0,
    [SettingsKey.ANTI_ALIASING]: true,
    [SettingsKey.VSYNC]: true,
    [SettingsKey.FPS_LIMIT]: 60,
    
    // Audio
    [SettingsKey.MASTER_VOLUME]: 1.0,
    [SettingsKey.MUSIC_VOLUME]: 0.7,
    [SettingsKey.SFX_VOLUME]: 1.0,
    [SettingsKey.AMBIENT_VOLUME]: 0.5,
    [SettingsKey.VOICE_VOLUME]: 1.0,
    
    // Interface
    [SettingsKey.UI_SCALE]: 1.0,
    [SettingsKey.SHOW_TOOLTIPS]: true,
    [SettingsKey.SHOW_DAMAGE_NUMBERS]: true,
    [SettingsKey.SHOW_NAMEPLATES]: true,
    [SettingsKey.SHOW_FRIENDLY_NAMEPLATES]: true,
    [SettingsKey.SHOW_ENEMY_NAMEPLATES]: true,
    [SettingsKey.NAMEPLATE_DISTANCE]: 40,
    [SettingsKey.BUFF_ICON_SIZE]: 32,
    
    // Combat
    [SettingsKey.AUTO_TARGET]: true,
    [SettingsKey.TARGET_LOCK]: false,
    [SettingsKey.SHOW_COMBAT_TEXT]: true,
    
    // Keybinds
    [SettingsKey.KEYBIND_MOVE_FORWARD]: 'KeyW',
    [SettingsKey.KEYBIND_MOVE_BACK]: 'KeyS',
    [SettingsKey.KEYBIND_STRAFE_LEFT]: 'KeyA',
    [SettingsKey.KEYBIND_STRAFE_RIGHT]: 'KeyD',
    [SettingsKey.KEYBIND_JUMP]: 'Space',
    [SettingsKey.KEYBIND_ATTACK]: 'Mouse0',
    [SettingsKey.KEYBIND_BLOCK]: 'Mouse1',
    [SettingsKey.KEYBIND_INTERACT]: 'KeyE',
    [SettingsKey.KEYBIND_INVENTORY]: 'KeyI',
    [SettingsKey.KEYBIND_CHARACTER]: 'KeyC',
    [SettingsKey.KEYBIND_SKILLS]: 'KeyK',
    [SettingsKey.KEYBIND_MAP]: 'KeyM',
    [SettingsKey.KEYBIND_SETTINGS]: 'Escape'
});

// ============================================================================
// CLASSES & RACES (from game design rules)
// ============================================================================

export const PlayerClass = Object.freeze({
    WARRIOR: 'warrior',
    MAGE: 'mage',
    RANGER: 'ranger',
    WORGE: 'worge'
});

export const ClassWeapons = Object.freeze({
    [PlayerClass.WARRIOR]: ['shield', 'sword', '2h_sword', '2h_axe', '2h_hammer'],
    [PlayerClass.MAGE]: ['staff', 'tome', 'mace', 'offhand_relic', 'wand'],
    [PlayerClass.RANGER]: ['bow', 'crossbow', 'gun', 'dagger', '2h_sword', 'spear'],
    [PlayerClass.WORGE]: ['staff', 'spear', 'dagger', 'bow', 'hammer', 'mace', 'offhand_relic']
});

export const WorgeForm = Object.freeze({
    HUMANOID: 'humanoid',
    BEAR: 'bear',
    RAPTOR: 'raptor',
    BIRD: 'bird'
});

// ============================================================================
// TIMING & PERFORMANCE
// ============================================================================

export const Timing = Object.freeze({
    UI_UPDATE_RATE: 100,        // ms between UI updates
    NAMEPLATE_UPDATE_RATE: 50,  // ms between nameplate updates
    BUFF_TICK_RATE: 1000,       // ms between buff ticks
    AUTOSAVE_INTERVAL: 60000,   // ms between autosaves
    TOOLTIP_DELAY: 300,         // ms before showing tooltip
    DOUBLE_CLICK_WINDOW: 300    // ms for double-click detection
});

export default {
    DamageType,
    CombatResult,
    CombatColors,
    BuffType,
    BuffCategory,
    CrowdControlType,
    EntityType,
    FactionRelation,
    UILayer,
    UIDefaults,
    NameplateConfig,
    FloatingTextConfig,
    SettingsKey,
    DefaultSettings,
    PlayerClass,
    ClassWeapons,
    WorgeForm,
    Timing
};

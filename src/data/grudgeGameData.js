/**
 * GRUDGE Warlords - Game Data Definitions (Vanilla JS port)
 * Ported from Warlord-Crafting-Suite gameData.ts
 * 
 * Contains: Attributes, Races, Classes, Factions, stat calculations
 */

// ===== ATTRIBUTES =====
export const ATTRIBUTES = [
    { key: 'Strength',  name: 'Strength',  role: 'Tank / Melee DPS',           icon: '💪', color: '#e74c3c', primaryStats: ['Health +26', 'Damage +3', 'Defense +12', 'Block Chance', 'Critical'] },
    { key: 'Vitality',  name: 'Vitality',  role: 'Tank / Survivability',       icon: '❤️', color: '#27ae60', primaryStats: ['Health +25', 'Defense +12', 'Block Factor', 'Resistance'] },
    { key: 'Endurance', name: 'Endurance', role: 'Defensive Specialist',       icon: '🛡️', color: '#95a5a6', primaryStats: ['Defense +12', 'Block Chance', 'Resistance'] },
    { key: 'Intellect', name: 'Intellect', role: 'Mage / Caster',             icon: '🧠', color: '#3498db', primaryStats: ['Mana +5', 'Damage +4', 'Accuracy', 'Resistance'] },
    { key: 'Wisdom',    name: 'Wisdom',    role: 'Healer / Support',           icon: '🔮', color: '#9b59b6', primaryStats: ['Mana +20', 'Health +10', 'Critical Chance', 'Resistance'] },
    { key: 'Dexterity', name: 'Dexterity', role: 'Rogue / Precision Fighter',  icon: '🎯', color: '#f39c12', primaryStats: ['Damage +3', 'Defense +10', 'Critical Chance', 'Accuracy'] },
    { key: 'Agility',   name: 'Agility',   role: 'Mobile DPS / Dodge Tank',    icon: '⚡', color: '#1abc9c', primaryStats: ['Stamina +5', 'Damage +3', 'Defense +5', 'Critical Chance'] },
    { key: 'Tactics',   name: 'Tactics',   role: 'Strategic Fighter / Commander', icon: '🎲', color: '#34495e', primaryStats: ['Health +10', 'Damage +3', 'Defense +5', 'Block Chance'] },
];

// ===== RACES =====
export const RACES = [
    // Crusade Faction
    {
        id: 'human', name: 'Human', faction: 'Crusade',
        description: 'Versatile and adaptable, humans excel in any role',
        lore: 'The backbone of civilization, humans have built empires through sheer determination.',
        bonuses: { Strength: 2, Intellect: 2, Wisdom: 2, Tactics: 2, Dexterity: 1, Agility: 1 },
        traits: ['Adaptable (+5% XP gain)', 'Diplomatic (+10% gold from quests)'],
        icon: '👤', spriteSet: 'knight',
    },
    {
        id: 'barbarian', name: 'Barbarian', faction: 'Crusade',
        description: 'Savage warriors from the frozen north, barbarians fight with primal fury',
        lore: 'Hardened by the brutal wilderness, barbarians channel raw power and rage.',
        bonuses: { Strength: 4, Vitality: 3, Agility: 3 },
        traits: ['Berserker Rage (+30% damage, -15% defense)', 'Cold Resistance (+25%)'],
        icon: '🪓', spriteSet: 'orc-rider',
    },
    // Fabled Faction
    {
        id: 'elf', name: 'Elf', faction: 'Fabled',
        description: 'Ancient and wise, elves possess innate magical abilities',
        lore: 'Immortal guardians of the ancient forests, elves remember the world before the Grudge.',
        bonuses: { Intellect: 4, Wisdom: 3, Dexterity: 3 },
        traits: ['Keen Senses (+15% Accuracy)', 'Arcane Affinity (+10% Mana)'],
        icon: '🧝', spriteSet: 'archer',
    },
    {
        id: 'dwarf', name: 'Dwarf', faction: 'Fabled',
        description: 'Sturdy and resilient, dwarves are master craftsmen and warriors',
        lore: 'From the deepest mountain holds, dwarves forge weapons that can slay gods.',
        bonuses: { Strength: 3, Vitality: 3, Endurance: 4 },
        traits: ['Stoneborn (+20% Defense)', 'Master Craftsman (+1 crafting tier)'],
        icon: '⛏️', spriteSet: 'knight',
    },
    // Legion Faction
    {
        id: 'orc', name: 'Orc', faction: 'Legion',
        description: 'Brutal and fearless, orcs live for battle and glory',
        lore: 'Born from the blood of war itself, orcs know no fear and seek only conquest.',
        bonuses: { Strength: 5, Vitality: 3, Endurance: 2 },
        traits: ['Bloodrage (+25% damage when below 50% HP)', 'Warborn (+10% Critical)'],
        icon: '👹', spriteSet: 'orc',
    },
    {
        id: 'undead', name: 'Undead', faction: 'Legion',
        description: 'Neither living nor dead, undead persist through sheer will',
        lore: 'Raised by dark magic, the undead serve the endless hunger of their masters.',
        bonuses: { Vitality: 4, Endurance: 4, Wisdom: 2 },
        traits: ['Undying (+20% HP)', 'Fear Aura (-10% enemy accuracy)'],
        icon: '💀', spriteSet: 'skeleton',
    },
];

// ===== CLASSES =====
export const CLASSES = [
    {
        id: 'warrior', name: 'Warrior', archetype: 'Tank',
        description: 'Fearless fighters who charge into battle with sword and shield',
        primaryAttributes: ['Strength', 'Vitality', 'Endurance'],
        startingBonuses: { Strength: 4, Vitality: 3, Endurance: 3 },
        abilities: ['Shield Bash', 'Battle Cry', 'Charge', 'Last Stand'],
        icon: '⚔️', color: '#e74c3c',
    },
    {
        id: 'worge', name: 'Worge', archetype: 'DPS',
        description: 'Savage beast-warriors who unleash primal fury in combat',
        primaryAttributes: ['Strength', 'Agility', 'Vitality'],
        startingBonuses: { Strength: 3, Agility: 4, Vitality: 3 },
        abilities: ['Savage Bite', 'Howl', 'Pack Hunt', 'Feral Rage'],
        icon: '🐺', color: '#7f8c8d',
    },
    {
        id: 'mage', name: 'Mage', archetype: 'DPS',
        description: 'Wielders of arcane power who devastate enemies with elemental magic',
        primaryAttributes: ['Intellect', 'Wisdom', 'Tactics'],
        startingBonuses: { Intellect: 5, Wisdom: 3, Tactics: 2 },
        abilities: ['Fireball', 'Ice Storm', 'Arcane Blast', 'Meteor'],
        icon: '🔥', color: '#9b59b6',
    },
    {
        id: 'ranger', name: 'Ranger', archetype: 'DPS',
        description: 'Masters of the bow who excel at ranged combat and tracking',
        primaryAttributes: ['Dexterity', 'Agility', 'Wisdom'],
        startingBonuses: { Dexterity: 4, Agility: 4, Wisdom: 2 },
        abilities: ['Aimed Shot', 'Multi-Shot', 'Traps', 'Beast Companion'],
        icon: '🏹', color: '#27ae60',
    },
];

// ===== FACTION COLORS =====
export const FACTION_COLORS = {
    Crusade: {
        primary: '#3498db', secondary: '#2980b9', accent: '#00bcd4',
        border: '#3498db', glow: 'rgba(52,152,219,0.5)',
        bg: 'rgba(52,152,219,0.15)', text: '#7ec8e3',
        description: 'The holy alliance of Humans and Barbarians, united by faith and honor.',
    },
    Fabled: {
        primary: '#9b59b6', secondary: '#8e44ad', accent: '#e91e63',
        border: '#9b59b6', glow: 'rgba(142,68,173,0.5)',
        bg: 'rgba(142,68,173,0.15)', text: '#c39bd3',
        description: 'Ancient races of magic and mystery — Elves and Dwarves.',
    },
    Legion: {
        primary: '#e74c3c', secondary: '#c0392b', accent: '#ff9800',
        border: '#e74c3c', glow: 'rgba(231,76,60,0.5)',
        bg: 'rgba(231,76,60,0.15)', text: '#ec7063',
        description: 'The savage horde of Orcs and Undead, bound by blood and war.',
    },
};

// ===== HELPERS =====

export function getDefaultAttributes() {
    const attrs = {};
    ATTRIBUTES.forEach(a => { attrs[a.key] = 1; });
    return attrs;
}

export function calculateStartingAttributes(raceId, classId) {
    const race = RACES.find(r => r.id === raceId);
    const cls = CLASSES.find(c => c.id === classId);
    const base = getDefaultAttributes();

    if (race?.bonuses) {
        for (const [key, value] of Object.entries(race.bonuses)) {
            if (value && key in base) base[key] += value;
        }
    }
    if (cls?.startingBonuses) {
        for (const [key, value] of Object.entries(cls.startingBonuses)) {
            if (value && key in base) base[key] += value;
        }
    }
    return base;
}

export function getRaceById(id) { return RACES.find(r => r.id === id); }
export function getClassById(id) { return CLASSES.find(c => c.id === id); }

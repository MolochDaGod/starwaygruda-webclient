/**
 * @fileoverview GRUDA Wars — Main Panel [C]
 * Unified MMO character-management overlay with tabs for:
 *   Equipment · Attributes · Skills · Professions · Crafting
 *   Missions  · Crew      · GOULD (Gouldstone Companions)
 *
 * Toggle with [C] key.  Call mainPanel.update(playerData) to refresh live stats.
 * @module ui/MainPanel
 */

// ═══════════════════════════════════════════════════════
//  GAME DATA — classes, races, attributes, professions
// ═══════════════════════════════════════════════════════

const CLASSES = [
  {
    id: 'warrior', name: 'Warrior', icon: '⚔', color: '#ff7d87',
    archetype: 'Tank / Melee DPS',
    primaryStats: ['Strength', 'Vitality', 'Endurance'],
    weapons: ['Sword', 'Shield', '2H Sword', 'Hammer', 'Axe', 'Spear'],
    desc: 'Frontline tank. Stamina-powered skills, parry system, group invincibility.',
    skillTiers: [
      { name: 'Tier 1 — Foundation', skills: [
        { name:'Battle Hardened', icon:'💪', desc:'+5% max HP per point. Always active.', chips:['buff'] },
        { name:'Iron Stance', icon:'🛡', desc:'+3% incoming damage reduction. Passive.', chips:['buff'] },
        { name:'War Cry', icon:'📯', desc:'AoE taunt — forced targeting 4s, -10% enemy damage.', chips:['cc','cd'] },
      ]},
      { name: 'Tier 2 — Aggression', skills: [
        { name:'Berserker Rage', icon:'🔥', desc:'< 30% HP: +25% atk speed + 15% lifesteal.', chips:['dmg','buff'] },
        { name:'Cleaving Strikes', icon:'⚔', desc:'Melee hits +1 adjacent target.', chips:['dmg'] },
        { name:'Stunning Blow', icon:'💫', desc:'Heavy attack stuns 2s. 12s CD.', chips:['cc','cd'] },
      ]},
      { name: 'Tier 3 — Mastery', skills: [
        { name:'Shield Wall', icon:'🏰', desc:'Group invincibility 3s. 60s CD.', chips:['buff','cd','ult'] },
        { name:'Execute', icon:'💀', desc:'250% dmg to targets < 20% HP. Reset on kill.', chips:['dmg','ult'] },
      ]},
      { name: 'Tier 4 — Ultimate', skills: [
        { name:'Warlord Ascendancy', icon:'👑', desc:'+10% all stats 15s. All Warrior abilities enhanced.', chips:['ult','buff'] },
      ]},
    ]
  },
  {
    id: 'mage', name: 'Mage', icon: '🔮', color: '#b388ff',
    archetype: 'Ranged Magic DPS / Control',
    primaryStats: ['Intellect', 'Wisdom'],
    weapons: ['Staff', 'Tome', 'Mace', 'Wand', 'Off-Hand Relic'],
    desc: 'Spell caster with teleport blocks (max 10), mana management, and powerful AoE.',
    skillTiers: [
      { name: 'Tier 1 — Foundation', skills: [
        { name:'Arcane Intellect', icon:'🧠', desc:'+8% max Mana per point. Improves spell scaling.', chips:['buff'] },
        { name:'Mana Shield', icon:'🛡', desc:'30% damage taken → mana cost instead.', chips:['buff'] },
        { name:'Elemental Attunement', icon:'✨', desc:'+5% bonus to chosen element damage.', chips:['dmg'] },
      ]},
      { name: 'Tier 2 — Spellcraft', skills: [
        { name:'Spell Weaving', icon:'🌀', desc:'Chain-cast 2 spells; second costs 50% mana.', chips:['dmg','buff'] },
        { name:'Mana Surge', icon:'⚡', desc:'Restore 25% max mana instantly. 30s CD.', chips:['heal','cd'] },
        { name:'Frost Nova', icon:'❄', desc:'AoE freeze around caster. Roots 3s.', chips:['cc','cd'] },
      ]},
      { name: 'Tier 3 — Mastery', skills: [
        { name:'Teleport Block', icon:'🔷', desc:'Place particle teleport block (max 10). Enemy factions can destroy them.', chips:['buff','cd'] },
        { name:'Meteor Strike', icon:'☄', desc:'Massive AoE fire impact. 45s CD.', chips:['dmg','ult'] },
      ]},
      { name: 'Tier 4 — Ultimate', skills: [
        { name:'Archmage Ascendancy', icon:'👑', desc:'-30% mana cost. +15% spell power 20s.', chips:['ult','buff'] },
      ]},
    ]
  },
  {
    id: 'ranger', name: 'Ranger', icon: '🏹', color: '#06d6a0',
    archetype: 'Ranged Physical DPS',
    primaryStats: ['Dexterity', 'Agility', 'Tactics'],
    weapons: ['Bow', 'Crossbow', 'Gun', 'Dagger', '2H Sword', 'Spear'],
    desc: 'Precision striker. Parry-counter mechanic (RMB+LMB), stealth, traps.',
    skillTiers: [
      { name: 'Tier 1 — Foundation', skills: [
        { name:'Eagle Eye', icon:'🎯', desc:'+5% ranged accuracy, +10% crit range.', chips:['buff'] },
        { name:'Swift Feet', icon:'💨', desc:'+8% movement speed (bonus OOC).', chips:['buff'] },
        { name:'Trap Mastery', icon:'🪤', desc:'Traps +20% damage, +50% duration.', chips:['dmg'] },
      ]},
      { name: 'Tier 2 — Precision', skills: [
        { name:'Multi-Shot', icon:'🏹', desc:'3 arrows in cone, each = 60% weapon dmg.', chips:['dmg','cd'] },
        { name:'Counter Strike', icon:'🔄', desc:'RMB+LMB → parry attempt; perfect = dash + 0.5s stun.', chips:['dmg','cc','cd'] },
        { name:'Poison Arrow', icon:'☠', desc:'30% chance → 8s poison DoT on hit.', chips:['dmg','cc'] },
      ]},
      { name: 'Tier 3 — Mastery', skills: [
        { name:'Rain of Arrows', icon:'🌧', desc:'Barrage zone 4s. Heavy sustained AoE.', chips:['dmg','ult'] },
        { name:'Camouflage', icon:'🍃', desc:'Full stealth 10s. First attack from stealth always crits.', chips:['buff','cd'] },
      ]},
      { name: 'Tier 4 — Ultimate', skills: [
        { name:'Deadeye Ascendancy', icon:'👑', desc:'All ranged pierce. +20% crit damage 15s.', chips:['ult','dmg'] },
      ]},
    ]
  },
  {
    id: 'worge', name: 'Worge', icon: '🐺', color: '#ff9f1c',
    archetype: 'Shapeshifter Hybrid',
    primaryStats: ['Strength', 'Agility', 'Intellect'],
    weapons: ['Staff', 'Spear', 'Dagger', 'Bow', 'Hammer', 'Mace', 'Off-Hand Relic'],
    desc: 'Three forms: Bear (tank/powerful), Raptor (invisible rogue), Bird (fly + ally mountable).',
    skillTiers: [
      { name: 'Tier 1 — Foundation', skills: [
        { name:'Primal Shift', icon:'🐾', desc:'Shift: Bear (+20% HP/melee) · Raptor (stealth/+20% speed) · Bird (fly/mountable).', chips:['buff'] },
        { name:'Primal Instinct', icon:'👁', desc:'Reveal stealthed targets within 15m.', chips:['buff'] },
        { name:'Pack Bond', icon:'🤝', desc:'+5% dmg/def aura to nearby allies.', chips:['buff','heal'] },
      ]},
      { name: 'Tier 2 — Feral', skills: [
        { name:'Savage Leap', icon:'🦁', desc:'Leap to target, AoE landing stun 1s.', chips:['dmg','cc'] },
        { name:'Howl of Fury', icon:'🌙', desc:'Terrify cone of enemies — flee 3s.', chips:['cc','cd'] },
        { name:'Spirit Link', icon:'🔗', desc:'Bond with ally — share damage, both take -40%.', chips:['heal','buff'] },
      ]},
      { name: 'Tier 3 — Mastery', skills: [
        { name:'Alpha Strike', icon:'⚡', desc:'Rapid combo = 300% weapon dmg total.', chips:['dmg','ult'] },
        { name:'Nature Communion', icon:'🌿', desc:'Channel — heal self + allies over 8s.', chips:['heal','cd'] },
      ]},
      { name: 'Tier 4 — Ultimate', skills: [
        { name:'Apex Predator', icon:'👑', desc:'+20% all stats. Fear aura 20s. Full ascension.', chips:['ult','buff'] },
      ]},
    ]
  },
];

const RACES = [
  { id:'human',     name:'Human',    faction:'Crusade',     icon:'👤', color:'#e0e0e0', bonuses:{ Strength:2, Intellect:2, Wisdom:2, Tactics:2 } },
  { id:'barbarian', name:'Barbarian',faction:'Crusade',     icon:'⚔', color:'#cc4422', bonuses:{ Strength:5, Vitality:3, Endurance:2 } },
  { id:'elf',       name:'Elf',      faction:'Crusade',     icon:'🌿', color:'#44aa66', bonuses:{ Dexterity:4, Agility:3, Intellect:2 } },
  { id:'dwarf',     name:'Dwarf',    faction:'Stoneguard',  icon:'⛏', color:'#bb8833', bonuses:{ Vitality:4, Endurance:4, Strength:2 } },
  { id:'orc',       name:'Orc',      faction:'Iron Pact',   icon:'🪓', color:'#448833', bonuses:{ Strength:6, Endurance:3 } },
  { id:'undead',    name:'Undead',   faction:'Shadow Court',icon:'💀', color:'#9966cc', bonuses:{ Intellect:4, Wisdom:3 } },
];

const ATTRIBUTES = [
  { key:'Strength',  icon:'💪', col:'#ef476f', desc:'Melee damage, carry weight, block power' },
  { key:'Vitality',  icon:'❤',  col:'#ff9f1c', desc:'Max HP, HP regen rate' },
  { key:'Endurance', icon:'🛡',  col:'#ffd166', desc:'Defense, stamina, block/parry chance' },
  { key:'Intellect', icon:'🧠', col:'#b388ff', desc:'Spell damage, max mana, crafting power' },
  { key:'Wisdom',    icon:'🌙', col:'#7b9cff', desc:'Mana regen, magic resist, profession XP' },
  { key:'Dexterity', icon:'🎯', col:'#06d6a0', desc:'Accuracy, ranged damage, crafting speed' },
  { key:'Agility',   icon:'💨', col:'#00d4ff', desc:'Attack speed, dodge, movement speed' },
  { key:'Tactics',   icon:'♟',  col:'#ff7d87', desc:'Crit chance, mission rewards, group buffs' },
];

const HARVESTING_PROFESSIONS = [
  { id:'mining',    name:'Mining',    icon:'⛏', color:'#8b7355', resources:['Iron','Copper','Steel','Gems'],        milestones:[10,25,50,75,100] },
  { id:'foraging',  name:'Foraging',  icon:'🌿', color:'#228b22', resources:['Flora','Wood','Seeds','Bark'],         milestones:[10,25,50,75,100] },
  { id:'hunting',   name:'Hunting',   icon:'🏹', color:'#8b4513', resources:['Meat','Hide','Bone','Fang'],           milestones:[10,25,50,75,100] },
  { id:'fishing',   name:'Fishing',   icon:'🎣', color:'#0077b6', resources:['Fish','Pearl','Coral','Scale'],        milestones:[10,25,50,75,100] },
  { id:'surveying', name:'Surveying', icon:'🔭', color:'#6a5acd', resources:['Radioactive','Solar','Anomaly','Artifact'], milestones:[10,25,50,75,100] },
];

const CRAFTING_PROFESSIONS = [
  { id:'artisan',       name:'Artisan',       icon:'🔨', color:'#d4a017', branches:['Components','Tools','Basic Gear','Trade Goods'] },
  { id:'weaponsmith',   name:'Weaponsmith',   icon:'⚔',  color:'#ef476f', branches:['Blades','Blunt','Polearms','Ranged','Guns'] },
  { id:'armorsmith',    name:'Armorsmith',    icon:'🛡',  color:'#6c757d', branches:['Cloth Armor','Leather Armor','Metal Armor','Shields'] },
  { id:'chef',          name:'Chef',          icon:'🍖', color:'#ff9f1c', branches:['Battle Food','Drinks','Potions','Regen Items'] },
  { id:'tailor',        name:'Tailor',        icon:'🧵', color:'#e7b4c8', branches:['Cloth Armor','Capes','Cosmetics','Bags'] },
  { id:'architect',     name:'Architect',     icon:'🏗',  color:'#00b4d8', branches:['Structures','Bases','Claim Flags','Fortifications'] },
  { id:'droidengineer', name:'Droid Engineer',icon:'🤖', color:'#00d4ff', branches:['Utility Droids','Combat Droids','Mining Droids','Ships'] },
  { id:'shipwright',    name:'Shipwright',    icon:'⛵', color:'#0096c7', branches:['Sloops','Frigates','Galleons','Naval Guns'] },
];

const WEAPON_TREES = {
  Sword:  { icon:'⚔',  color:'#ef476f', skills:[{n:'Blade Mastery',d:'+5% damage/rank'},{n:'Swift Cuts',d:'+3% attack speed'},{n:'Parry Master',d:'+5% parry chance'},{n:'Counter Slash',d:'+15% counter dmg'},{n:'Blade Surge',d:'Ultimate sword combo',u:true}] },
  Shield: { icon:'🛡',  color:'#6c757d', skills:[{n:'Block Mastery',d:'+5% block chance'},{n:'Fortify',d:'+4% dmg reduction'},{n:'Shield Bash',d:'+6% bash/stun'},{n:'Reflect',d:'Reflect 10% blocked'},{n:'Iron Wall',d:'Group invincibility',u:true}] },
  Hammer: { icon:'🔨', color:'#bb8833', skills:[{n:'Heavy Blows',d:'+6% hammer dmg'},{n:'Concussive',d:'+4% stun chance'},{n:'Ground Slam',d:'+8% AoE dmg'},{n:'Armor Crush',d:'+6% armor pen'},{n:'Titan Slam',d:'Shockwave ultimate',u:true}] },
  Staff:  { icon:'🪄', color:'#b388ff', skills:[{n:'Arcane Power',d:'+5% spell dmg'},{n:'Mana Flow',d:'+8% mana regen'},{n:'Spell Crit',d:'+3% crit chance'},{n:'Chain Magic',d:'Spells chain +1'},{n:'Storm Staff',d:'Elemental AoE ultimate',u:true}] },
  Bow:    { icon:'🏹', color:'#06d6a0', skills:[{n:'Keen Eye',d:'+5% accuracy'},{n:'Strong Draw',d:'+4% charge speed'},{n:'Deadly Aim',d:'+8% crit damage'},{n:'Pierce Shot',d:'Arrows pierce +1'},{n:'Arrow Storm',d:'Rain of arrows ultimate',u:true}] },
  Dagger: { icon:'🗡',  color:'#00d4ff', skills:[{n:'Quick Hands',d:'+6% attack speed'},{n:'Vital Strike',d:'+4% crit chance'},{n:'Backstab',d:'+15% dmg from behind'},{n:'Poison Coat',d:'+5% poison on hit'},{n:'Death Mark',d:'Execute + bleed ultimate',u:true}] },
  Spear:  { icon:'🔱', color:'#ffd166', skills:[{n:'Extended Reach',d:'+10% range'},{n:'First Strike',d:'+8% opener dmg'},{n:'Pierce',d:'Hits +1 target'},{n:'Charge',d:'+12% charge attack'},{n:'Whirlwind Lance',d:'Spinning AoE ultimate',u:true}] },
  Gun:    { icon:'🔫', color:'#9ca3af', skills:[{n:'Trigger Discipline',d:'+5% accuracy'},{n:'Fast Reload',d:'-15% reload time'},{n:'Armor Pierce',d:'+6% armor pen'},{n:'Burst Fire',d:'3-round burst combo'},{n:'Overcharge',d:'Full auto ultimate',u:true}] },
};

const MISSIONS = [
  { title:'Iron Grudge Contracts',  faction:'Crusade',    type:'fighting',   desc:'Defeat 15 Ironclad Sentinels in the Forgespire Depths.', prog:60,  reward:'1,200 XP + Ironvow Blade' },
  { title:'Blood Tribute',          faction:'Crusade',    type:'harvesting', desc:'Collect 8 Blood Crystals from the Crimson Caverns.',     prog:37,  reward:'800 XP + 500 Gold' },
  { title:'Establish Forward Base', faction:'Crusade',    type:'sailing',    desc:'Crew sails to Uncharted Isle and plants a Pirate Claim flag.', prog:0, reward:'Base Territory + 2,000 XP' },
  { title:'Warlord\'s Trial',       faction:'Arena',      type:'competing',  desc:'Win 3 consecutive PvP arena matches without dying.',    prog:100, reward:'2,500 XP + Title: Grudgebearer' },
];

const CREW_EVENTS = [
  { icon:'⚔',  label:'Fighting',   desc:'11 crew battle events / day',  type:'fighting'   },
  { icon:'⛏',  label:'Harvesting', desc:'11 harvest runs / day',        type:'harvesting' },
  { icon:'⛵',  label:'Sailing',    desc:'11 sailing voyages / day',     type:'sailing'    },
  { icon:'🏆',  label:'Competing',  desc:'11 competitive events / day',  type:'competing'  },
];

// ═══════════════════════════════════════════════════════
//  CSS STYLES
// ═══════════════════════════════════════════════════════
const PANEL_CSS = `
#gruda-main-panel {
  --bg: #040810;
  --panel: #080f1e;
  --panel2: #0c1628;
  --panel3: #10203a;
  --border: #00c2d4;
  --border2: #006480;
  --border-dim: #0a2840;
  --text: #d0ecff;
  --muted: #4a7a9b;
  --dim: #1a4060;
  --gold: #ffd166;
  --gold-glow: rgba(255,209,102,.2);
  --green: #06d6a0;
  --red: #ef476f;
  --blue: #00b4d8;
  --purple: #b388ff;
  --orange: #ff9f1c;
  --cyan: #00d4ff;
  --slot: #07111f;
  --slot-b: #0e2540;
  --shadow: 0 8px 32px rgba(0,0,0,.8);
  --font-display: 'Cinzel', 'Segoe UI', serif;
  --font-body: 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
}
#gruda-main-panel {
  position: fixed; inset: 0; z-index: 10000;
  display: flex; flex-direction: column;
  background: radial-gradient(ellipse 1200px 500px at 15% 0%, rgba(0,180,216,.05), transparent),
              radial-gradient(ellipse 800px 600px at 85% 100%, rgba(120,50,200,.04), transparent),
              linear-gradient(170deg, #050b16 0%, #040810 50%, #03060c 100%);
  font-family: var(--font-body);
  color: var(--text);
  overflow: hidden;
  animation: panelFadeIn .18s ease;
}
@keyframes panelFadeIn { from { opacity:0; transform:scale(.98) } to { opacity:1; transform:scale(1) } }
#gruda-main-panel * { box-sizing: border-box; margin: 0; padding: 0; }
#gruda-main-panel ::-webkit-scrollbar { width: 5px; height: 5px; }
#gruda-main-panel ::-webkit-scrollbar-thumb { background: var(--border-dim); border-radius: 8px; }
#gruda-main-panel ::-webkit-scrollbar-track { background: transparent; }

/* TOP BAR */
#mp-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 14px;
  background: linear-gradient(90deg, #04101c, #061828, #04101c);
  border-bottom: 2px solid var(--border);
  box-shadow: 0 2px 16px rgba(0,0,0,.5);
  flex-shrink: 0; gap: 12px; flex-wrap: wrap;
}
.mp-logo { display:flex; align-items:center; gap:8px; }
.mp-logo h1 { font-family:var(--font-display); font-size:14px; color:var(--cyan); letter-spacing:2px; text-transform:uppercase; white-space:nowrap; }
.mp-logo .sub { font-size:10px; color:var(--muted); }
.mp-player { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.mp-name { color:var(--gold); font-family:var(--font-display); font-weight:700; font-size:13px; }
.mp-lvl { color:var(--muted); font-size:11px; }
.mp-bars { display:flex; gap:6px; }
.mp-bar { width:110px; height:13px; background:#050d1a; border:1px solid var(--border-dim); border-radius:3px; overflow:hidden; position:relative; }
.mp-bar .fill { height:100%; border-radius:2px; transition:width .4s; }
.mp-bar .fill.hp  { background:linear-gradient(90deg,#7b1111,#d43333); }
.mp-bar .fill.act { background:linear-gradient(90deg,#114a5a,#1ab4cc); }
.mp-bar .fill.mnd { background:linear-gradient(90deg,#2a1a5a,#7744cc); }
.mp-bar .lbl { position:absolute; inset:0; text-align:center; font-size:9px; font-family:var(--font-mono); line-height:13px; color:#fff; text-shadow:0 1px 3px #000; }
.mp-credits { font-family:var(--font-mono); font-size:12px; color:var(--gold); white-space:nowrap; }
#mp-close {
  background:none; border:1px solid var(--border-dim); border-radius:6px; color:var(--muted);
  width:28px; height:28px; cursor:pointer; font-size:14px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; transition:.15s;
}
#mp-close:hover { border-color:var(--red); color:var(--red); }

/* MAIN BODY */
#mp-body { display:flex; flex:1; min-height:0; }

/* LEFT COLUMN */
#mp-left {
  width:240px; flex-shrink:0;
  background:linear-gradient(180deg,var(--panel),var(--bg));
  border-right:2px solid var(--border-dim);
  display:flex; flex-direction:column; overflow-y:auto;
}
#mp-char-preview {
  height:190px;
  background:radial-gradient(circle at 50% 55%, rgba(0,180,216,.08), transparent 65%),
             linear-gradient(180deg,#060f1e,var(--panel));
  border-bottom:1px solid var(--border-dim);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
  position:relative; padding:12px;
}
.mp-char-silhouette {
  width:100px; height:140px;
  background:radial-gradient(ellipse at 50% 40%,rgba(0,200,230,.1),transparent 60%);
  border:2px dashed var(--border-dim); border-radius:10px;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  color:var(--dim); font-size:28px;
}
.mp-race-class {
  font-size:10px; color:var(--muted); text-align:center; font-family:var(--font-display);
  text-transform:uppercase; letter-spacing:1px;
}
.mp-xp-bar {
  width:100%; height:6px; background:var(--bg); border:1px solid var(--border-dim); border-radius:3px; overflow:hidden; margin-top:4px;
}
.mp-xp-bar .fill { height:100%; background:linear-gradient(90deg,var(--border2),var(--cyan)); border-radius:2px; width:71%; }
.mp-xp-lbl { font-size:9px; color:var(--muted); font-family:var(--font-mono); }
.mp-stat-section { padding:8px 10px; }
.mp-stat-section h3 {
  font-family:var(--font-display); font-size:10px; color:var(--cyan);
  text-transform:uppercase; letter-spacing:1.5px;
  border-bottom:1px solid var(--border-dim); padding-bottom:4px; margin-bottom:5px;
}
.mp-stat-row { display:flex; justify-content:space-between; padding:3px 0; font-size:11px; border-bottom:1px solid rgba(255,255,255,.02); }
.mp-stat-row .k { color:var(--muted); }
.mp-stat-row .v { color:var(--text); font-family:var(--font-mono); font-size:10px; }
.mp-stat-row .v.pos { color:var(--green); }
.mp-stat-row .v.neg { color:var(--red); }

/* CENTER */
#mp-center { flex:1; display:flex; flex-direction:column; min-width:0; }
#mp-tabs {
  display:flex; background:linear-gradient(90deg,#060f1c,#08162a,#060f1c);
  border-bottom:2px solid var(--border); flex-shrink:0; overflow-x:auto;
}
.mp-tab {
  border:0; background:transparent; color:var(--muted); cursor:pointer;
  padding:9px 13px; font-family:var(--font-display); font-size:10px;
  text-transform:uppercase; letter-spacing:1px; font-weight:700;
  border-bottom:2px solid transparent; white-space:nowrap; transition:.15s;
}
.mp-tab:hover { color:var(--text); background:rgba(0,180,216,.04); }
.mp-tab.active { color:var(--cyan); border-bottom-color:var(--cyan); background:rgba(0,180,216,.07); }
#mp-content { flex:1; overflow-y:auto; padding:14px; }
.mp-tab-panel { display:none; }
.mp-tab-panel.active { display:block; }

/* RIGHT COLUMN — INVENTORY */
#mp-right {
  width:270px; flex-shrink:0;
  background:linear-gradient(180deg,var(--panel),var(--bg));
  border-left:2px solid var(--border-dim);
  display:flex; flex-direction:column;
}
.mp-inv-header {
  padding:9px 11px; border-bottom:1px solid var(--border-dim);
  display:flex; justify-content:space-between; align-items:center;
}
.mp-inv-header h3 { font-family:var(--font-display); font-size:11px; color:var(--cyan); text-transform:uppercase; letter-spacing:1px; }
.mp-inv-header .creds { font-family:var(--font-mono); font-size:11px; color:var(--gold); }
.mp-inv-filters { display:flex; gap:4px; padding:5px 8px; border-bottom:1px solid var(--border-dim); flex-wrap:wrap; }
.mp-inv-filter { padding:2px 8px; border:1px solid var(--border-dim); border-radius:99px; font-size:9px; color:var(--muted); cursor:pointer; background:none; transition:.12s; }
.mp-inv-filter.active, .mp-inv-filter:hover { border-color:var(--cyan); color:var(--cyan); }
.mp-inv-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:3px; padding:6px; flex:1; overflow-y:auto; align-content:start; }
.mp-inv-cell {
  aspect-ratio:1; border:2px solid var(--border-dim); border-radius:5px;
  background:linear-gradient(135deg,var(--panel2),var(--slot));
  cursor:pointer; transition:.12s; position:relative; display:flex; align-items:center; justify-content:center;
}
.mp-inv-cell:hover { border-color:var(--cyan); box-shadow:0 0 8px rgba(0,210,255,.25); }
.mp-inv-cell.filled { border-color:#1a3a5a; }
.mp-inv-cell .item-emoji { font-size:15px; }
.mp-inv-cell .qty { position:absolute; bottom:1px; right:2px; font-size:8px; font-family:var(--font-mono); color:var(--gold); }
.mp-inv-cell .rarity-dot { position:absolute; top:1px; left:2px; width:5px; height:5px; border-radius:50%; }
.mp-trash {
  padding:7px 10px; border-top:1px solid var(--border-dim);
  display:flex; align-items:center; gap:8px;
}
.mp-trash-slot {
  width:36px; height:36px; border:2px dashed var(--red); border-radius:6px;
  background:rgba(239,71,111,.07); display:flex; align-items:center; justify-content:center;
  font-size:15px; color:var(--red); flex-shrink:0;
}
.mp-trash span { font-size:10px; color:var(--muted); }

/* BOTTOM — HOTBAR */
#mp-hotbar {
  display:flex; align-items:center; justify-content:center; gap:16px;
  padding:5px 14px;
  background:linear-gradient(90deg,#04101c,#060f1c,#04101c);
  border-top:2px solid var(--border); flex-shrink:0;
}
.mp-hotbar-group { display:flex; gap:3px; }
.mp-hb-slot {
  width:42px; height:42px; border:2px solid var(--border-dim); border-radius:6px;
  background:linear-gradient(135deg,var(--panel2),var(--slot));
  display:flex; align-items:center; justify-content:center;
  font-size:10px; color:var(--dim); cursor:pointer; transition:.15s; position:relative;
}
.mp-hb-slot:hover { border-color:var(--cyan); }
.mp-hb-slot .key { position:absolute; top:2px; left:3px; font-size:8px; color:var(--muted); font-family:var(--font-mono); }
.mp-hb-slot.skill-slot { border-color:var(--border2); }
.mp-hb-slot.item-slot { border-color:#1a3a28; }
.mp-hb-slot.empty-slot { border-style:dashed; opacity:.4; }
.mp-hb-sep { width:1px; background:var(--border-dim); height:30px; align-self:center; }

/* ── SHARED COMPONENTS ── */
.mp-section-title {
  display:flex; align-items:center; gap:8px;
  font-family:var(--font-display); font-size:11px; color:var(--cyan);
  text-transform:uppercase; letter-spacing:1.2px;
  margin:14px 0 9px;
}
.mp-section-title::before { content:''; width:3px; height:12px; background:var(--cyan); border-radius:3px; }
.mp-card {
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:9px;
  padding:11px; box-shadow:var(--shadow); transition:.15s;
}
.mp-card:hover { border-color:var(--border2); }

/* CLASS BADGE */
.class-badge {
  display:inline-flex; align-items:center; gap:3px;
  padding:1px 7px; border-radius:99px; font-size:9px; font-weight:800;
  text-transform:uppercase; letter-spacing:.5px; border:1px solid;
}
.class-badge.warrior { color:#ff7d87; border-color:#ff7d8740; background:#ff7d8710; }
.class-badge.mage    { color:#b388ff; border-color:#b388ff40; background:#b388ff10; }
.class-badge.ranger  { color:#06d6a0; border-color:#06d6a040; background:#06d6a010; }
.class-badge.worge   { color:#ff9f1c; border-color:#ff9f1c40; background:#ff9f1c10; }

/* CHIPS */
.chip { font-size:8px; font-weight:800; text-transform:uppercase; letter-spacing:.4px; border:1px solid; border-radius:99px; padding:1px 5px; }
.chip.dmg  { color:#ff8b95; border-color:#ff8b9540; background:#ff8b9510; }
.chip.cd   { color:#84b2ff; border-color:#84b2ff40; background:#84b2ff10; }
.chip.heal { color:#06d6a0; border-color:#06d6a040; background:#06d6a010; }
.chip.buff { color:#ffd56a; border-color:#ffd56a40; background:#ffd56a10; }
.chip.cc   { color:#b388ff; border-color:#b388ff40; background:#b388ff10; }
.chip.ult  { color:#ff9d4d; border-color:#ff9d4d40; background:#ff9d4d10; }

/* ── EQUIPMENT TAB ── */
.mp-equip-layout { display:grid; grid-template-columns:80px 1fr 80px; gap:14px; align-items:center; max-width:480px; margin:0 auto; }
.mp-equip-col { display:flex; flex-direction:column; gap:8px; align-items:center; }
.mp-eq-slot {
  width:74px; height:68px; border:2px solid var(--border); border-radius:8px;
  background:linear-gradient(135deg,var(--panel2),var(--slot));
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  cursor:pointer; transition:.15s;
}
.mp-eq-slot:hover { border-color:var(--cyan); box-shadow:0 0 14px rgba(0,210,255,.2); }
.mp-eq-slot .cat { font-size:8px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; font-family:var(--font-display); }
.mp-eq-slot .eq-icon { font-size:20px; }
.mp-eq-center { display:flex; flex-direction:column; align-items:center; gap:10px; }
.mp-eq-main {
  width:136px; height:136px; border:3px solid var(--border); border-radius:12px;
  background:radial-gradient(circle,rgba(0,180,216,.1),transparent 65%),linear-gradient(135deg,var(--panel2),var(--slot));
  display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-size:10px; color:var(--muted); text-transform:uppercase; text-align:center;
}
.mp-eq-offhand {
  width:90px; height:78px; border:2px solid var(--border); border-radius:9px;
  background:linear-gradient(135deg,var(--panel2),var(--slot));
  display:flex; align-items:center; justify-content:center;
  font-size:8px; color:var(--muted); font-family:var(--font-display); text-transform:uppercase;
}
.mp-set-bonus {
  margin-top:14px; padding:12px;
  background:rgba(0,180,216,.06); border:1px dashed var(--border-dim); border-radius:9px;
  font-size:11px; color:var(--muted); font-style:italic; text-align:center;
}

/* ── ATTRIBUTES TAB ── */
.mp-attr-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px; }
.mp-attr-card {
  display:flex; align-items:center; gap:9px; padding:9px 10px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:8px;
}
.mp-attr-icon {
  width:38px; height:38px; border-radius:8px; flex-shrink:0;
  background:radial-gradient(circle,rgba(0,180,216,.12),transparent);
  border:1px solid var(--border2);
  display:flex; align-items:center; justify-content:center; font-size:17px;
}
.mp-attr-info .name { font-size:11px; font-weight:700; color:var(--text); }
.mp-attr-info .val  { font-size:20px; font-family:var(--font-mono); color:var(--cyan); font-weight:700; }
.mp-attr-info .desc { font-size:9px; color:var(--muted); margin-top:2px; }
.mp-attr-btn {
  margin-left:auto; width:22px; height:22px; border-radius:4px;
  border:1px solid var(--green); background:rgba(6,214,160,.08);
  color:var(--green); cursor:pointer; font-size:13px; font-weight:700;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.mp-attr-btn:hover { background:rgba(6,214,160,.22); }

/* ── SKILLS TAB ── */
.mp-tree-selector { display:flex; gap:5px; margin-bottom:12px; flex-wrap:wrap; }
.mp-tree-btn {
  padding:5px 11px; border:1px solid var(--border-dim); border-radius:6px;
  background:var(--panel); color:var(--muted); cursor:pointer;
  font-family:var(--font-display); font-size:9px; text-transform:uppercase; letter-spacing:.5px; transition:.15s;
}
.mp-tree-btn:hover { border-color:var(--border2); color:var(--text); }
.mp-tree-btn.active { border-color:var(--cyan); color:var(--cyan); background:rgba(0,180,216,.1); }
.mp-skill-tier { margin-bottom:14px; }
.mp-tier-lbl { font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:1.2px; font-weight:700; margin-bottom:7px; font-family:var(--font-display); }
.mp-skill-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(195px,1fr)); gap:7px; }
.mp-skill-node {
  display:flex; gap:8px; padding:9px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:9px;
  cursor:pointer; transition:.15s;
}
.mp-skill-node:hover { border-color:var(--border2); transform:translateY(-1px); }
.mp-skill-node.unlocked { border-color:#1a4a2a; background:linear-gradient(135deg,#081a10,#050e08); }
.mp-skill-node .sk-icon {
  width:34px; height:34px; border-radius:7px; flex-shrink:0;
  background:radial-gradient(circle,rgba(0,180,216,.1),transparent);
  border:1px solid var(--border-dim);
  display:flex; align-items:center; justify-content:center; font-size:16px;
}
.mp-skill-node .sk-name { font-size:10px; font-weight:700; color:var(--text); }
.mp-skill-node .sk-desc { font-size:9px; color:var(--muted); line-height:1.3; margin-top:2px; }
.mp-skill-node .sk-chips { display:flex; gap:3px; margin-top:4px; flex-wrap:wrap; }

/* Weapon skill mini node */
.mp-weapon-skill {
  padding:8px 10px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:7px;
  display:flex; align-items:center; gap:10px; cursor:pointer; transition:.15s;
}
.mp-weapon-skill:hover { border-color:var(--border2); }
.mp-weapon-skill.mastered { border-color:var(--gold); }
.mp-weapon-skill .ws-name { font-size:11px; font-weight:700; }
.mp-weapon-skill .ws-desc { font-size:10px; color:var(--muted); }
.mp-weapon-skill .ws-bar { margin-top:4px; height:4px; background:var(--bg); border-radius:2px; overflow:hidden; }
.mp-weapon-skill .ws-bar .f { height:100%; background:var(--cyan); border-radius:2px; }

/* ── PROFESSIONS TAB ── */
.mp-prof-section { margin-bottom:18px; }
.mp-prof-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:8px; }
.mp-prof-card {
  padding:11px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:9px;
  cursor:pointer; transition:.15s;
}
.mp-prof-card:hover { border-color:var(--border2); transform:translateY(-1px); }
.mp-prof-card .pc-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.mp-prof-card .pc-icon { font-size:20px; }
.mp-prof-card .pc-name { font-family:var(--font-display); font-size:11px; color:var(--text); }
.mp-prof-card .pc-lvl { font-size:9px; color:var(--muted); font-family:var(--font-mono); }
.mp-prof-bar { height:6px; background:var(--bg); border-radius:3px; overflow:hidden; margin-bottom:6px; border:1px solid var(--border-dim); }
.mp-prof-bar .fill { height:100%; border-radius:2px; transition:width .4s; }
.mp-prof-resources { display:flex; flex-wrap:wrap; gap:3px; }
.mp-res-tag { font-size:8px; padding:1px 5px; border-radius:99px; border:1px solid var(--border-dim); color:var(--muted); background:var(--slot); }
.mp-prof-milestones { display:flex; gap:4px; margin-top:6px; }
.mp-milestone { width:14px; height:14px; border-radius:50%; border:1px solid var(--border-dim); font-size:7px; display:flex; align-items:center; justify-content:center; color:var(--dim); }
.mp-milestone.reached { background:var(--cyan); border-color:var(--cyan); color:#000; font-weight:900; }
.mp-prof-branches { display:flex; flex-wrap:wrap; gap:3px; margin-top:6px; }
.mp-branch-tag { font-size:8px; padding:1px 6px; border-radius:99px; border:1px solid var(--border-dim); color:var(--muted); }

/* ── CRAFTING TAB ── */
.mp-craft-layout { display:grid; grid-template-columns:1fr auto 1fr; gap:14px; align-items:start; max-width:580px; margin:0 auto; }
.mp-craft-slots { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
.mp-craft-slot {
  height:62px; border:2px solid var(--border-dim); border-radius:8px;
  background:linear-gradient(135deg,var(--panel2),var(--slot));
  display:flex; align-items:center; justify-content:center;
  font-size:8px; color:var(--dim); cursor:pointer; transition:.15s; text-align:center;
  padding:4px;
}
.mp-craft-slot:hover { border-color:var(--border2); }
.mp-craft-arrow { font-size:26px; color:var(--cyan); align-self:center; }
.mp-craft-result {
  width:78px; height:78px; border:3px solid var(--border); border-radius:10px;
  background:radial-gradient(circle,rgba(0,180,216,.1),transparent),linear-gradient(135deg,var(--panel2),var(--slot));
  display:flex; align-items:center; justify-content:center;
  font-size:10px; color:var(--muted); text-align:center;
}
.mp-craft-btn {
  grid-column:1/-1; margin:10px auto 0;
  padding:9px 26px; border:2px solid var(--cyan); border-radius:8px;
  background:linear-gradient(180deg,rgba(0,180,216,.2),rgba(0,180,216,.05));
  color:var(--cyan); font-family:var(--font-display); font-size:11px;
  text-transform:uppercase; letter-spacing:1px; cursor:pointer; transition:.15s;
}
.mp-craft-btn:hover { background:linear-gradient(180deg,rgba(0,180,216,.35),rgba(0,180,216,.1)); box-shadow:0 0 18px rgba(0,180,216,.3); }
.mp-recipe-list { display:flex; flex-direction:column; gap:5px; }
.mp-recipe-row {
  display:flex; align-items:center; justify-content:space-between; padding:7px 10px;
  background:var(--panel2); border:1px solid var(--border-dim); border-radius:7px;
  cursor:pointer; transition:.15s; font-size:11px;
}
.mp-recipe-row:hover { border-color:var(--border2); }
.mp-recipe-row .rn { color:var(--text); }
.mp-recipe-row .rr { font-size:9px; color:var(--muted); font-family:var(--font-mono); }
.mp-schematic-select {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:6px; margin-bottom:14px;
}
.mp-schematic {
  padding:8px 10px;
  background:var(--panel2); border:1px solid var(--border-dim); border-radius:7px;
  cursor:pointer; transition:.12s; font-size:10px;
}
.mp-schematic:hover { border-color:var(--cyan); }
.mp-schematic.active { border-color:var(--cyan); background:rgba(0,180,216,.07); }
.mp-schematic .sn { font-weight:700; color:var(--text); }
.mp-schematic .sc { color:var(--muted); font-size:9px; margin-top:2px; }

/* ── MISSIONS TAB ── */
.mp-mission-card {
  padding:11px; margin-bottom:7px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:9px;
}
.mp-mission-card.type-fighting   { border-left:3px solid var(--red); }
.mp-mission-card.type-harvesting { border-left:3px solid var(--green); }
.mp-mission-card.type-sailing    { border-left:3px solid var(--blue); }
.mp-mission-card.type-competing  { border-left:3px solid var(--gold); }
.mp-mission-card .m-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
.mp-mission-card .m-title { font-family:var(--font-display); font-size:12px; color:var(--text); }
.mp-mission-card .m-faction { font-size:9px; color:var(--muted); font-family:var(--font-mono); }
.mp-mission-card .m-desc { font-size:10px; color:var(--muted); line-height:1.4; margin-bottom:6px; }
.mp-mission-card .m-prog { height:5px; background:var(--bg); border-radius:3px; overflow:hidden; border:1px solid var(--border-dim); margin-bottom:5px; }
.mp-mission-card .m-fill { height:100%; border-radius:2px; transition:width .4s; }
.type-fighting   .m-fill { background:linear-gradient(90deg,var(--red),#ff9988); }
.type-harvesting .m-fill { background:linear-gradient(90deg,var(--green),#aaffdd); }
.type-sailing    .m-fill { background:linear-gradient(90deg,var(--blue),#88ddff); }
.type-competing  .m-fill { background:linear-gradient(90deg,var(--gold),#ffe89a); }
.mp-mission-card .m-reward { font-size:9px; color:var(--gold); font-family:var(--font-mono); }
.mp-event-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-bottom:14px; }
.mp-event-card {
  padding:10px; border:1px solid var(--border-dim); border-radius:8px;
  background:var(--panel2); text-align:center; cursor:pointer; transition:.15s;
}
.mp-event-card:hover { border-color:var(--border2); }
.mp-event-card .ev-icon { font-size:22px; }
.mp-event-card .ev-label { font-family:var(--font-display); font-size:11px; color:var(--text); margin-top:4px; }
.mp-event-card .ev-desc { font-size:9px; color:var(--muted); margin-top:2px; }
.mp-daily-bar { height:8px; background:var(--bg); border-radius:4px; overflow:hidden; border:1px solid var(--border-dim); margin-top:5px; }
.mp-daily-bar .fill { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--cyan),#88eeff); }

/* ── CREW TAB ── */
.mp-crew-header {
  display:flex; gap:14px; align-items:center; padding:12px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:9px; margin-bottom:12px;
}
.mp-crew-crest {
  width:60px; height:60px; border:2px solid var(--border); border-radius:9px;
  background:radial-gradient(circle,rgba(0,180,216,.15),transparent);
  display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0;
}
.mp-crew-info .cn { font-family:var(--font-display); font-size:16px; color:var(--cyan); }
.mp-crew-info .cf { font-size:11px; color:var(--muted); margin-top:2px; }
.mp-crew-info .cc { font-size:10px; color:var(--dim); margin-top:2px; font-family:var(--font-mono); }
.mp-crew-list { display:flex; flex-direction:column; gap:5px; }
.mp-crew-row {
  display:flex; align-items:center; gap:9px; padding:8px 10px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:7px;
}
.mp-crew-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.mp-crew-dot.online { background:var(--green); box-shadow:0 0 6px rgba(6,214,160,.5); }
.mp-crew-dot.offline { background:#333; }
.mp-crew-name { flex:1; font-size:12px; }
.mp-crew-lvl { font-size:10px; color:var(--muted); font-family:var(--font-mono); }
.mp-crew-role { font-size:9px; color:var(--cyan); font-family:var(--font-display); text-transform:uppercase; }
.mp-crew-contrib { font-size:10px; color:var(--gold); font-family:var(--font-mono); }
.mp-base-panel {
  margin-top:14px; padding:12px;
  background:rgba(0,180,216,.05); border:1px solid var(--border-dim); border-radius:9px;
}
.mp-base-panel h4 { font-family:var(--font-display); font-size:11px; color:var(--cyan); letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
.mp-base-stat { display:flex; justify-content:space-between; font-size:11px; padding:3px 0; border-bottom:1px solid rgba(255,255,255,.03); }
.mp-base-stat .bk { color:var(--muted); }
.mp-base-stat .bv { color:var(--text); font-family:var(--font-mono); font-size:10px; }

/* ── GOULD TAB ── */
.mp-gould-header {
  display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;
}
.mp-gould-count { font-size:11px; color:var(--muted); }
.mp-gould-count span { color:var(--gold); font-family:var(--font-mono); font-size:14px; }
.mp-gould-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; }
.mp-gould-card {
  padding:11px;
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border-dim); border-radius:9px;
  cursor:pointer; transition:.15s;
}
.mp-gould-card:hover { border-color:var(--border2); }
.mp-gould-card.active-gould { border-color:#1a5a30; background:linear-gradient(135deg,#071410,#040c08); }
.mp-gould-card .gc-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.mp-gould-card .gc-avatar { font-size:22px; }
.mp-gould-card .gc-name { font-family:var(--font-display); font-size:11px; color:var(--text); }
.mp-gould-card .gc-source { font-size:9px; color:var(--muted); }
.mp-gould-card .gc-task { font-size:10px; color:var(--cyan); margin-top:4px; }
.mp-gould-card .gc-status { display:flex; align-items:center; gap:5px; margin-top:6px; font-size:9px; color:var(--muted); }
.mp-gould-card .status-dot { width:6px; height:6px; border-radius:50%; background:var(--muted); }
.mp-gould-card.active-gould .status-dot { background:var(--green); box-shadow:0 0 5px rgba(6,214,160,.5); }
.mp-gould-add {
  padding:11px; border:2px dashed var(--border-dim); border-radius:9px;
  display:flex; align-items:center; justify-content:center; gap:8px;
  cursor:pointer; transition:.15s; color:var(--muted); font-size:11px;
}
.mp-gould-add:hover { border-color:var(--cyan); color:var(--cyan); }
.mp-gould-info {
  margin-top:14px; padding:12px;
  background:rgba(255,209,102,.05); border:1px solid rgba(255,209,102,.15); border-radius:9px;
  font-size:10px; color:var(--muted); line-height:1.5;
}
.mp-gould-info b { color:var(--gold); }

/* TOOLTIP */
#mp-tooltip {
  position:fixed; z-index:99999; pointer-events:none; display:none;
  width:240px; max-width:calc(100vw - 20px);
  background:linear-gradient(135deg,var(--panel2),var(--panel));
  border:1px solid var(--border); border-radius:9px;
  padding:10px; box-shadow:0 12px 36px rgba(0,0,0,.7);
}
#mp-tooltip.show { display:block; }
#mp-tooltip .tt-name { font-family:var(--font-display); font-size:12px; color:var(--cyan); }
#mp-tooltip .tt-type { font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:.8px; margin-top:2px; }
#mp-tooltip .tt-desc { font-size:10px; color:var(--text); line-height:1.4; margin-top:8px; padding-top:6px; border-top:1px solid var(--border-dim); }

@media(max-width:1100px) { #mp-left { display:none; } #mp-right { display:none; } }
@media(max-width:700px) { .mp-tab { padding:7px 7px; font-size:8px; letter-spacing:0; } }
`;

// ═══════════════════════════════════════════════════════
//  SAMPLE / DEFAULT STATE
// ═══════════════════════════════════════════════════════

const DEFAULT_STATE = {
  name: 'Commander',
  race: 'human',
  class: 'warrior',
  level: 42,
  experience: 42580,
  nextLevelXP: 60000,
  credits: 22578,
  faction: 'Crusade',
  factionRank: 'Lieutenant',
  health: 780, maxHealth: 1000,
  action: 220, maxAction: 300,
  mind: 310, maxMind: 500,
  attributePoints: 5,
  attributes: { Strength:28, Vitality:32, Endurance:22, Intellect:15, Wisdom:18, Dexterity:20, Agility:19, Tactics:14 },
  combatStats: {
    'Phys. Damage': '142', 'Magic Damage': '58', 'Defense': '88',
    'Crit %': '18%', 'Block %': '12%', 'Speed': '1.4',
    'Accuracy': '94%', 'Resistance': '35',
  },
  professions: {
    mining:    { level:24, xp:58, maxXp:100, milestonesDone:2 },
    foraging:  { level:10, xp:30, maxXp:100, milestonesDone:1 },
    hunting:   { level:18, xp:72, maxXp:100, milestonesDone:1 },
    fishing:   { level:6,  xp:15, maxXp:100, milestonesDone:0 },
    surveying: { level:3,  xp:5,  maxXp:100, milestonesDone:0 },
    artisan:      { level:8,  mastered:false },
    weaponsmith:  { level:12, mastered:false },
    armorsmith:   { level:5,  mastered:false },
    chef:         { level:3,  mastered:false },
    tailor:       { level:0,  mastered:false },
    architect:    { level:0,  mastered:false },
    droidengineer:{ level:0,  mastered:false },
    shipwright:   { level:0,  mastered:false },
  },
  hotbar: [
    { key:'1', type:'skill', label:'War Cry',      icon:'📯' },
    { key:'2', type:'skill', label:'Stun Blow',    icon:'💫' },
    { key:'3', type:'skill', label:'Berserker',    icon:'🔥' },
    { key:'4', type:'skill', label:'Execute',      icon:'💀' },
    { key:'5', type:'empty' },
    { key:'6', type:'item',  label:'Battle Steak', icon:'🍖' },
    { key:'7', type:'item',  label:'Stim Pack',    icon:'💉' },
    { key:'8', type:'item',  label:'Power Relic',  icon:'💎' },
  ],
  inventory: [
    { icon:'⚔',  name:'Iron Sword',     rarity:'common',   qty:1  },
    { icon:'🪨',  name:'Iron Ore',       rarity:'common',   qty:24 },
    { icon:'💎',  name:'Power Shard',    rarity:'rare',     qty:3  },
    { icon:'🍖',  name:'Battle Steak',   rarity:'common',   qty:8  },
    { icon:'🧪',  name:'Healing Draught',rarity:'uncommon', qty:5  },
    { icon:'🛡',  name:'Iron Shield',    rarity:'uncommon', qty:1  },
    { icon:'📜',  name:'Craft Schematic',rarity:'uncommon', qty:2  },
    { icon:'💉',  name:'Stim Pack',      rarity:'common',   qty:12 },
    { icon:'🔮',  name:'Arcane Tome',    rarity:'epic',     qty:1  },
    { icon:'🌿',  name:'Wild Flora',     rarity:'common',   qty:30 },
    { icon:'🦷',  name:'Beast Fang',     rarity:'uncommon', qty:7  },
    { icon:'🔱',  name:'Ancient Spear',  rarity:'rare',     qty:1  },
  ],
  crew: [
    { name:'Shadowfang', class:'ranger', race:'elf',       level:38, role:'Officer',  online:true,  contrib:92 },
    { name:'Ironmaul',   class:'warrior',race:'orc',       level:35, role:'Veteran',  online:false, contrib:78 },
    { name:'Emberclaw',  class:'worge',  race:'barbarian', level:31, role:'Member',   online:true,  contrib:65 },
    { name:'Voidwhisper',class:'mage',   race:'undead',    level:28, role:'Recruit',  online:true,  contrib:44 },
  ],
  gould: [
    { id:1, name:'GOULD-α', source:'Self Clone',    level:42, class:'warrior', active:true,  task:'Patrolling base perimeter'   },
    { id:2, name:'GOULD-β', source:'Boss Drop',     level:42, class:'warrior', active:true,  task:'Harvesting iron nodes'       },
    { id:3, name:'GOULD-γ', source:'Faction Vendor',level:40, class:'warrior', active:false, task:'Idle — awaiting orders'      },
  ],
};

// ═══════════════════════════════════════════════════════
//  MAIN PANEL CLASS
// ═══════════════════════════════════════════════════════

export class MainPanel {
  /**
   * @param {object} [options]
   * @param {object} [options.game]   - Game engine reference
   * @param {object} [options.player] - Player state object (live)
   */
  constructor(options = {}) {
    this.game = options.game || null;
    this.player = options.player || null;
    this.state = Object.assign({}, DEFAULT_STATE);

    this.visible = false;
    this._activeTab = 'equipment';
    this._activeSkillClass = 'warrior';
    this._activeWeapon = 'Sword';
    this._activeSchemProfession = 'weaponsmith';

    this._el = null;
    this._tooltip = null;
    this._keyListener = null;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._injectStyles();
    this._build();
    this._bindKeys();
    this._initialized = true;
    console.log('🗂 GRUDA MainPanel initialized — press [C] to open');
  }

  /** Toggle panel visibility */
  toggle() { this.visible ? this.hide() : this.show(); }
  show()   { if (!this._initialized) this.init(); this._el.style.display = 'flex'; this.visible = true; }
  hide()   { if (this._el) this._el.style.display = 'none'; this.visible = false; }

  /**
   * Push live player data into the panel
   * @param {object} playerData - Updated player state
   */
  update(playerData) {
    Object.assign(this.state, playerData);
    if (this.visible) this._refresh();
  }

  // ── PRIVATE ──────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('gruda-panel-styles')) return;
    const s = document.createElement('style');
    s.id = 'gruda-panel-styles';
    // Load Cinzel from Google Fonts if not already loaded
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);
    s.textContent = PANEL_CSS;
    document.head.appendChild(s);
  }

  _bindKeys() {
    this._keyListener = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        this.toggle();
      }
      if (e.key === 'Escape' && this.visible) this.hide();
    };
    window.addEventListener('keydown', this._keyListener);
  }

  _build() {
    const el = document.createElement('div');
    el.id = 'gruda-main-panel';
    el.style.display = 'none';
    el.innerHTML = this._buildHTML();
    document.body.appendChild(el);
    this._el = el;

    this._tooltip = document.createElement('div');
    this._tooltip.id = 'mp-tooltip';
    this._tooltip.innerHTML = '<div class="tt-name"></div><div class="tt-type"></div><div class="tt-desc"></div>';
    document.body.appendChild(this._tooltip);

    this._attachEvents();
    this._renderContent();
  }

  _buildHTML() {
    const s = this.state;
    const cls = CLASSES.find(c => c.id === s.class) || CLASSES[0];
    const race = RACES.find(r => r.id === s.race) || RACES[0];

    return `
    <!-- TOP BAR -->
    <header id="mp-topbar">
      <div class="mp-logo">
        <h1>⚡ GRUDA Wars</h1>
        <span class="sub">Main Panel [C]</span>
      </div>
      <div class="mp-player">
        <div class="mp-bars">
          <div class="mp-bar"><div class="fill hp" style="width:${(s.health/s.maxHealth*100).toFixed(0)}%"></div><span class="lbl">HP ${s.health}/${s.maxHealth}</span></div>
          <div class="mp-bar"><div class="fill act" style="width:${(s.action/s.maxAction*100).toFixed(0)}%"></div><span class="lbl">ACT ${s.action}/${s.maxAction}</span></div>
          <div class="mp-bar"><div class="fill mnd" style="width:${(s.mind/s.maxMind*100).toFixed(0)}%"></div><span class="lbl">MND ${s.mind}/${s.maxMind}</span></div>
        </div>
        <span class="mp-name">${s.name}</span>
        <span class="mp-lvl">Lv.${s.level} ${cls.name}</span>
        <span class="mp-credits">⚜ ${s.credits.toLocaleString()}</span>
      </div>
      <button id="mp-close" title="Close [C / Esc]">✕</button>
    </header>

    <!-- MAIN BODY -->
    <div id="mp-body">

      <!-- LEFT: STATS -->
      <aside id="mp-left">
        <div id="mp-char-preview">
          <div class="mp-char-silhouette">${cls.icon}</div>
          <div class="mp-race-class"><span class="class-badge ${s.class}">${cls.name}</span> ${race.name}</div>
          <div class="mp-xp-lbl">${s.experience.toLocaleString()} / ${s.nextLevelXP.toLocaleString()} XP</div>
          <div class="mp-xp-bar"><div class="fill" style="width:${(s.experience/s.nextLevelXP*100).toFixed(0)}%"></div></div>
          <div class="mp-xp-lbl" style="font-size:9px;color:#2a5a80">${s.faction} • ${s.factionRank}</div>
        </div>
        <div class="mp-stat-section">
          <h3>Combat Stats</h3>
          ${Object.entries(s.combatStats).map(([k,v]) =>
            `<div class="mp-stat-row"><span class="k">${k}</span><span class="v ${parseFloat(v)>100?'pos':''}">${v}</span></div>`
          ).join('')}
        </div>
        <div class="mp-stat-section">
          <h3>Progression</h3>
          <div class="mp-stat-row"><span class="k">Level</span><span class="v">${s.level}</span></div>
          <div class="mp-stat-row"><span class="k">Attr Pts</span><span class="v pos">${s.attributePoints}</span></div>
          <div class="mp-stat-row"><span class="k">Play Time</span><span class="v">127h</span></div>
          <div class="mp-stat-row"><span class="k">Faction</span><span class="v">${s.faction}</span></div>
        </div>
      </aside>

      <!-- CENTER: TABS -->
      <main id="mp-center">
        <nav id="mp-tabs">
          ${['equipment','attributes','skills','professions','crafting','missions','crew','gould'].map(t =>
            `<button class="mp-tab ${t===this._activeTab?'active':''}" data-tab="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`
          ).join('')}
        </nav>
        <div id="mp-content"></div>
      </main>

      <!-- RIGHT: INVENTORY -->
      <aside id="mp-right">
        <div class="mp-inv-header">
          <h3>Inventory</h3>
          <span class="creds">⚜ ${s.credits.toLocaleString()}</span>
        </div>
        <div class="mp-inv-filters">
          ${['All','Weapons','Armor','Consumables','Materials'].map((f,i) =>
            `<button class="mp-inv-filter ${i===0?'active':''}">${f}</button>`
          ).join('')}
        </div>
        <div class="mp-inv-grid" id="mp-inv-grid">
          ${this._buildInventoryGrid()}
        </div>
        <div class="mp-trash">
          <div class="mp-trash-slot">🗑</div>
          <span>Drag items here to destroy</span>
        </div>
      </aside>
    </div>

    <!-- BOTTOM: HOTBAR -->
    <footer id="mp-hotbar">
      ${this._buildHotbar()}
    </footer>
    `;
  }

  _buildInventoryGrid() {
    const s = this.state;
    const RARITY_COLORS = { common:'#5a6a4a', uncommon:'#2a6a88', rare:'#4a2a88', epic:'#882a6a', legendary:'#885a1a' };
    let html = '';
    for (let i = 0; i < 30; i++) {
      const item = s.inventory[i];
      if (item) {
        html += `<div class="mp-inv-cell filled" data-item-index="${i}">
          <div class="rarity-dot" style="background:${RARITY_COLORS[item.rarity]||'#333'}"></div>
          <span class="item-emoji">${item.icon}</span>
          ${item.qty > 1 ? `<span class="qty">${item.qty}</span>` : ''}
        </div>`;
      } else {
        html += `<div class="mp-inv-cell"></div>`;
      }
    }
    return html;
  }

  _buildHotbar() {
    const s = this.state;
    let html = '<div class="mp-hotbar-group">';
    s.hotbar.forEach((slot, i) => {
      const cls = slot.type === 'skill' ? 'skill-slot' : slot.type === 'item' ? 'item-slot' : 'empty-slot';
      html += `<div class="mp-hb-slot ${cls}" title="${slot.label||''}">
        <span class="key">${slot.key}</span>
        ${slot.icon ? `<span style="font-size:16px">${slot.icon}</span>` : ''}
      </div>`;
      if (i === 3) html += '</div><div class="mp-hb-sep"></div><div class="mp-hotbar-group">';
    });
    html += '</div>';
    return html;
  }

  _attachEvents() {
    const el = this._el;

    // Close button
    el.querySelector('#mp-close').onclick = () => this.hide();

    // Tab switching
    el.querySelectorAll('.mp-tab').forEach(btn => {
      btn.onclick = () => {
        this._activeTab = btn.dataset.tab;
        el.querySelectorAll('.mp-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderContent();
      };
    });

    // Inventory filter tabs
    el.querySelectorAll('.mp-inv-filter').forEach(btn => {
      btn.onclick = () => {
        el.querySelectorAll('.mp-inv-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    // Inventory tooltips
    el.addEventListener('mouseover', e => {
      const cell = e.target.closest('.mp-inv-cell');
      if (cell && cell.dataset.itemIndex !== undefined) {
        const item = this.state.inventory[+cell.dataset.itemIndex];
        if (item) this._showTooltip(e, item.name, item.rarity, `${item.icon} × ${item.qty}`);
      }
    });
    el.addEventListener('mouseout', e => {
      if (!e.target.closest('.mp-inv-cell')) this._hideTooltip();
    });
    el.addEventListener('mousemove', e => this._moveTooltip(e));

    // Click outside to close
    el.addEventListener('click', e => { if (e.target === el) this.hide(); });
  }

  _showTooltip(e, name, type, desc) {
    const t = this._tooltip;
    t.querySelector('.tt-name').textContent = name;
    t.querySelector('.tt-type').textContent = type;
    t.querySelector('.tt-desc').textContent = desc;
    t.classList.add('show');
    this._moveTooltip(e);
  }
  _hideTooltip() { this._tooltip.classList.remove('show'); }
  _moveTooltip(e) {
    const t = this._tooltip;
    const tw = t.offsetWidth || 240;
    const x = Math.min(e.clientX + 14, window.innerWidth - tw - 10);
    const y = Math.max(e.clientY - 14, 5);
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }

  _renderContent() {
    const area = this._el.querySelector('#mp-content');
    const map = {
      equipment:   () => this._tabEquipment(),
      attributes:  () => this._tabAttributes(),
      skills:      () => this._tabSkills(),
      professions: () => this._tabProfessions(),
      crafting:    () => this._tabCrafting(),
      missions:    () => this._tabMissions(),
      crew:        () => this._tabCrew(),
      gould:       () => this._tabGould(),
    };
    area.innerHTML = (map[this._activeTab] || (() => ''))();
    this._postRenderBind();
  }

  _refresh() {
    const hp = this._el.querySelector('.mp-bar .fill.hp');
    if (hp) hp.style.width = `${(this.state.health / this.state.maxHealth * 100).toFixed(0)}%`;
    this._renderContent();
  }

  _postRenderBind() {
    const area = this._el.querySelector('#mp-content');
    // Class skill selector
    area.querySelectorAll('.mp-tree-btn[data-class]').forEach(btn => {
      btn.onclick = () => {
        this._activeSkillClass = btn.dataset.class;
        area.querySelectorAll('.mp-tree-btn[data-class]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        area.querySelector('#mp-skill-trees').innerHTML = this._buildClassSkillTrees(this._activeSkillClass);
      };
    });
    // Weapon skill selector
    area.querySelectorAll('.mp-tree-btn[data-weapon]').forEach(btn => {
      btn.onclick = () => {
        this._activeWeapon = btn.dataset.weapon;
        area.querySelectorAll('.mp-tree-btn[data-weapon]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        area.querySelector('#mp-weapon-skills').innerHTML = this._buildWeaponSkills(this._activeWeapon);
      };
    });
    // Crafting schematic selector
    area.querySelectorAll('.mp-schematic').forEach(btn => {
      btn.onclick = () => {
        area.querySelectorAll('.mp-schematic').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
    // Attribute + button
    area.querySelectorAll('.mp-attr-btn').forEach(btn => {
      btn.onclick = () => {
        if (this.state.attributePoints > 0) {
          this.state.attributes[btn.dataset.attr]++;
          this.state.attributePoints--;
          this._renderContent();
        }
      };
    });
  }

  // ════════════════════════════════════════════
  //  TAB RENDERERS
  // ════════════════════════════════════════════

  _tabEquipment() {
    const cls = CLASSES.find(c => c.id === this.state.class) || CLASSES[0];
    return `
      <div class="mp-section-title">Equipment Loadout</div>
      <div class="mp-equip-layout">
        <div class="mp-equip-col">
          ${['Head','Chest','Legs','Boots','Cape'].map(s =>
            `<div class="mp-eq-slot"><span class="eq-icon">⬜</span><span class="cat">${s}</span></div>`
          ).join('')}
        </div>
        <div class="mp-eq-center">
          <div class="mp-eq-main">${cls.icon}<br><small>Main Hand</small></div>
          <div class="mp-eq-offhand">Off-Hand / Shield</div>
        </div>
        <div class="mp-equip-col">
          ${['Gloves','Belt','Ring','Amulet','Relic'].map(s =>
            `<div class="mp-eq-slot"><span class="eq-icon">⬜</span><span class="cat">${s}</span></div>`
          ).join('')}
        </div>
      </div>
      <div class="mp-section-title" style="margin-top:18px">Class Weapon Types</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">
        ${cls.weapons.map(w => `<span style="padding:3px 9px;border:1px solid var(--border-dim);border-radius:99px;font-size:10px;color:var(--muted)">${w}</span>`).join('')}
      </div>
      <div class="mp-set-bonus">Equip matching armor pieces to unlock set bonuses — e.g. 3-piece Ironclad: +8% defense</div>
    `;
  }

  _tabAttributes() {
    const s = this.state;
    return `
      <div class="mp-section-title">Character Attributes</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:12px">
        Available Points: <span style="color:var(--green);font-family:var(--font-mono);font-size:14px">${s.attributePoints}</span>
      </div>
      <div class="mp-attr-grid">
        ${ATTRIBUTES.map(a => `
          <div class="mp-attr-card">
            <div class="mp-attr-icon" style="border-color:${a.col}22">${a.icon}</div>
            <div class="mp-attr-info">
              <div class="name">${a.key}</div>
              <div class="val" style="color:${a.col}">${s.attributes[a.key] || 10}</div>
              <div class="desc">${a.desc}</div>
            </div>
            <button class="mp-attr-btn" data-attr="${a.key}" title="Spend attribute point" ${s.attributePoints<=0?'disabled style="opacity:.35"':''}>+</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  _tabSkills() {
    const cls = CLASSES.find(c => c.id === this._activeSkillClass) || CLASSES[0];
    return `
      <div class="mp-section-title">Class Skills</div>
      <div class="mp-tree-selector">
        ${CLASSES.map(c => `<button class="mp-tree-btn ${c.id===this._activeSkillClass?'active':''}" data-class="${c.id}">
          <span class="class-badge ${c.id}">${c.name}</span>
        </button>`).join('')}
      </div>
      <div id="mp-skill-trees">${this._buildClassSkillTrees(this._activeSkillClass)}</div>

      <div class="mp-section-title" style="margin-top:20px">Weapon Mastery</div>
      <div class="mp-tree-selector">
        ${Object.keys(WEAPON_TREES).map(w => `<button class="mp-tree-btn ${w===this._activeWeapon?'active':''}" data-weapon="${w}">
          ${WEAPON_TREES[w].icon} ${w}
        </button>`).join('')}
      </div>
      <div id="mp-weapon-skills">${this._buildWeaponSkills(this._activeWeapon)}</div>
    `;
  }

  _buildClassSkillTrees(classId) {
    const cls = CLASSES.find(c => c.id === classId) || CLASSES[0];
    return cls.skillTiers.map(tier => `
      <div class="mp-skill-tier">
        <div class="mp-tier-lbl">${tier.name}</div>
        <div class="mp-skill-grid">
          ${tier.skills.map(sk => {
            const unlocked = Math.random() > 0.45;
            return `<div class="mp-skill-node ${unlocked?'unlocked':''}">
              <div class="sk-icon">${sk.icon}</div>
              <div>
                <div class="sk-name">${sk.name}</div>
                <div class="sk-desc">${sk.desc}</div>
                <div class="sk-chips">${sk.chips.map(c=>`<span class="chip ${c}">${c}</span>`).join('')}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  _buildWeaponSkills(weaponName) {
    const tree = WEAPON_TREES[weaponName];
    if (!tree) return '<div style="color:var(--muted);font-size:11px">No data.</div>';
    return `
      <div style="display:flex;flex-direction:column;gap:6px">
        ${tree.skills.map((sk, i) => {
          const pct = Math.min(100, i * 22 + 5);
          return `<div class="mp-weapon-skill ${sk.u?'mastered':''}">
            <span style="font-size:18px">${tree.icon}</span>
            <div style="flex:1">
              <div class="ws-name" style="color:${tree.color}">${sk.n}</div>
              <div class="ws-desc">${sk.d}</div>
              <div class="ws-bar"><div class="f" style="width:${sk.u?100:pct}%;background:${tree.color}"></div></div>
            </div>
            ${sk.u ? '<span class="chip ult" style="flex-shrink:0">ULT</span>' : ''}
          </div>`;
        }).join('')}
      </div>
    `;
  }

  _tabProfessions() {
    const s = this.state;
    return `
      <div class="mp-section-title">Harvesting Professions</div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:10px">Complete 11 harvesting events / day. Higher levels unlock rarer resource tiers.</div>
      <div class="mp-prof-section">
        <div class="mp-prof-cards">
          ${HARVESTING_PROFESSIONS.map(p => {
            const prof = s.professions[p.id] || { level:0, xp:0, maxXp:100, milestonesDone:0 };
            const pct = (prof.xp / prof.maxXp * 100).toFixed(0);
            return `<div class="mp-prof-card">
              <div class="pc-header">
                <span class="pc-icon">${p.icon}</span>
                <div>
                  <div class="pc-name">${p.name}</div>
                  <div class="pc-lvl">Level ${prof.level} &nbsp;·&nbsp; ${prof.xp}/${prof.maxXp} XP</div>
                </div>
              </div>
              <div class="mp-prof-bar"><div class="fill" style="width:${pct}%;background:${p.color}"></div></div>
              <div class="mp-prof-milestones">
                ${p.milestones.map((m, i) => `<div class="mp-milestone ${i<prof.milestonesDone?'reached':''}" title="Milestone ${m}">${i<prof.milestonesDone?'✓':m}</div>`).join('')}
              </div>
              <div class="mp-prof-resources">
                ${p.resources.map(r => `<span class="mp-res-tag">${r}</span>`).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="mp-section-title">Crafting Professions</div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:10px">Master branches to unlock advanced schematics. Sell crafted items at player shops or auction.</div>
      <div class="mp-prof-section">
        <div class="mp-prof-cards">
          ${CRAFTING_PROFESSIONS.map(p => {
            const prof = s.professions[p.id] || { level:0, mastered:false };
            return `<div class="mp-prof-card">
              <div class="pc-header">
                <span class="pc-icon">${p.icon}</span>
                <div>
                  <div class="pc-name">${p.name}</div>
                  <div class="pc-lvl">Level ${prof.level}${prof.mastered?' &nbsp;★ MASTERED':''}</div>
                </div>
              </div>
              <div class="mp-prof-bar"><div class="fill" style="width:${Math.min(100,prof.level*8)}%;background:${p.color}"></div></div>
              <div class="mp-prof-branches">
                ${p.branches.map(b => `<span class="mp-branch-tag" style="border-color:${p.color}30;color:${p.color}">${b}</span>`).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  _tabCrafting() {
    return `
      <div class="mp-section-title">Crafting Station</div>
      <div class="mp-craft-layout">
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:7px">Ingredients (up to 9)</div>
          <div class="mp-craft-slots">
            ${Array(9).fill(0).map((_,i) => `<div class="mp-craft-slot">Slot ${i+1}</div>`).join('')}
          </div>
        </div>
        <div class="mp-craft-arrow">→</div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--muted);margin-bottom:7px">Result</div>
          <div class="mp-craft-result">?<br><small>Craft to discover</small></div>
        </div>
        <button class="mp-craft-btn">⚒ Craft Item</button>
      </div>

      <div class="mp-section-title" style="margin-top:20px">Known Schematics</div>
      <div class="mp-tree-selector">
        ${CRAFTING_PROFESSIONS.slice(0,5).map(p =>
          `<button class="mp-schematic mp-tree-btn ${p.id===this._activeSchemProfession?'active':''}" data-prof="${p.id}">${p.icon} ${p.name}</button>`
        ).join('')}
      </div>
      <div class="mp-recipe-list">
        ${[
          ['⚔ Iron Sword',    'Artisan', '2× Iron Ore, 1× Wood Handle'],
          ['🛡 Iron Shield',   'Armorsmith', '4× Iron Ore, 2× Leather'],
          ['🍖 Battle Steak',  'Chef', '2× Beast Meat, 1× Spice'],
          ['💉 Stim Pack',     'Artisan', '3× Flora, 1× Chemical'],
          ['🔮 Arcane Tome',   'Droid Engineer', '5× Crystal, 2× Arcane Dust'],
        ].map(([n,p,c]) => `
          <div class="mp-recipe-row">
            <span class="rn">${n}</span>
            <span class="rr">${p} &nbsp;|&nbsp; ${c}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  _tabMissions() {
    return `
      <div class="mp-section-title">Daily Crew Events</div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:10px">Each event type runs 11× / day. Surviving crews may establish a base after all events.</div>
      <div class="mp-event-grid">
        ${CREW_EVENTS.map(ev => `
          <div class="mp-event-card">
            <div class="ev-icon">${ev.icon}</div>
            <div class="ev-label">${ev.label}</div>
            <div class="ev-desc">${ev.desc}</div>
            <div class="mp-daily-bar"><div class="fill" style="width:${Math.floor(Math.random()*80+10)}%"></div></div>
          </div>
        `).join('')}
      </div>

      <div class="mp-section-title">Active Missions</div>
      ${MISSIONS.map(m => `
        <div class="mp-mission-card type-${m.type}">
          <div class="m-header">
            <span class="m-title">${m.title}</span>
            <span class="m-faction">${m.faction}</span>
          </div>
          <div class="m-desc">${m.desc}</div>
          <div class="m-prog"><div class="m-fill" style="width:${m.prog}%"></div></div>
          <div class="m-reward">⚜ Reward: ${m.reward}</div>
        </div>
      `).join('')}
    `;
  }

  _tabCrew() {
    const s = this.state;
    const online = s.crew.filter(c => c.online).length;
    return `
      <div class="mp-crew-header">
        <div class="mp-crew-crest">⚔</div>
        <div class="mp-crew-info">
          <div class="cn">${s.name}'s Crew</div>
          <div class="cf">Faction: ${s.faction} · ${s.factionRank}</div>
          <div class="cc">Members: ${s.crew.length} / 5 &nbsp;·&nbsp; Online: ${online}</div>
        </div>
      </div>

      <div class="mp-section-title">Crew Roster</div>
      <div class="mp-crew-list">
        ${s.crew.map(m => `
          <div class="mp-crew-row">
            <div class="mp-crew-dot ${m.online?'online':'offline'}"></div>
            <span class="mp-crew-name">${m.name}</span>
            <span class="class-badge ${m.class}">${m.class}</span>
            <span class="mp-crew-lvl">Lv.${m.level}</span>
            <span class="mp-crew-role">${m.role}</span>
            <span class="mp-crew-contrib" title="Daily contribution score">${m.contrib}%</span>
          </div>
        `).join('')}
      </div>

      <div class="mp-base-panel">
        <h4>⚑ Crew Base</h4>
        <div class="mp-base-stat"><span class="bk">Base Status</span><span class="bv">Established</span></div>
        <div class="mp-base-stat"><span class="bk">Location</span><span class="bv">Crusade Isle — Sector 7</span></div>
        <div class="mp-base-stat"><span class="bk">Claim Flag</span><span class="bv" style="color:var(--green)">Active</span></div>
        <div class="mp-base-stat"><span class="bk">Fortification</span><span class="bv">Level 2</span></div>
        <div class="mp-base-stat"><span class="bk">Next Rotation</span><span class="bv">11:00 PM CST</span></div>
        <div class="mp-base-stat"><span class="bk">Permadeath</span><span class="bv" style="color:var(--red)">Enabled</span></div>
      </div>
    `;
  }

  _tabGould() {
    const s = this.state;
    const cls = CLASSES.find(c => c.id === s.class) || CLASSES[0];
    const active = s.gould.filter(g => g.active).length;
    return `
      <div class="mp-gould-header">
        <div class="mp-section-title" style="margin:0">GOULD Companions</div>
        <div class="mp-gould-count">Deployed: <span>${active}</span> / 15</div>
      </div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:12px">
        Gouldstones clone you with your current stats, gear, and profession levels.
        Companions are AI-controlled and can be deployed as allies or assigned tasks.
      </div>

      <div class="mp-gould-grid">
        ${s.gould.map(g => {
          const gCls = CLASSES.find(c => c.id === g.class) || CLASSES[0];
          return `<div class="mp-gould-card ${g.active?'active-gould':''}">
            <div class="gc-header">
              <span class="gc-avatar">${gCls.icon}</span>
              <div>
                <div class="gc-name">${g.name}</div>
                <div class="gc-source">${g.source} — Lv.${g.level} <span class="class-badge ${g.class}">${g.class}</span></div>
              </div>
            </div>
            <div class="gc-task">📍 ${g.task}</div>
            <div class="gc-status">
              <div class="status-dot"></div>
              ${g.active ? 'Active — click to recall' : 'Inactive — click to deploy'}
            </div>
          </div>`;
        }).join('')}
        ${s.gould.length < 15 ? `<div class="mp-gould-add">⊕ Deploy New GOULD<br><small style="font-size:8px;color:var(--dim)">(Requires Gouldstone)</small></div>` : ''}
      </div>

      <div class="mp-gould-info">
        <b>How to obtain Gouldstones:</b> Drop from bosses (5–15% chance) or purchase from Faction Vendors for 5,000 Gold each.
        Each GOULD mirrors your <b>exact stats, gear, and profession levels</b> at the time of creation.
        GOULDs can ally with friendly factions or attack hostile ones based on your faction standing.
      </div>
    `;
  }

  /** Destroy the panel and clean up */
  destroy() {
    if (this._keyListener) window.removeEventListener('keydown', this._keyListener);
    if (this._el) this._el.remove();
    if (this._tooltip) this._tooltip.remove();
    const s = document.getElementById('gruda-panel-styles');
    if (s) s.remove();
    this._initialized = false;
  }
}

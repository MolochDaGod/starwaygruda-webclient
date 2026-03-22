# ⚡ StarWayGRUDA Web Client — GRUDA Wars MMO

> **Browser-Based 3D MMO** — GRUDA Wars · Islands · Conquest  
> Third-person MMO with KayKit characters, Mixamo animations, weapon systems, and Grudge Studio backend.

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel)](https://starwaygruda-webclient-as2n.vercel.app)
[![Node](https://img.shields.io/badge/Node-20%2B-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r160-orange?style=for-the-badge&logo=three.js)](https://threejs.org)
[![grudge-studio](https://img.shields.io/badge/grudge--studio-1.0.2-cyan?style=for-the-badge)](https://github.com/MolochDaGod/GrudgeStudioNPM)

---

## 🎮 Live URLs

| Route | URL | Description |
|-------|-----|-------------|
| `/` | [Play Now](https://starwaygruda-webclient-as2n.vercel.app) | GRUDA Wars MMO (primary) |
| `/game` `/play` | → redirects to `/` | Alias routes |
| `/crafting` | [Crafting Portal](https://starwaygruda-webclient-as2n.vercel.app/crafting) | Inventory · Crafting · Island |
| `/admin` | [Admin](https://starwaygruda-webclient-as2n.vercel.app/admin) | System monitoring |
| `index-space.html` | [Space Flight](https://starwaygruda-webclient-as2n.vercel.app/index-space.html) | 3D space travel |
| `index-landing.html` | [Landing](https://starwaygruda-webclient-as2n.vercel.app/index-landing.html) | Game mode selector |

> `test-population.html` is **dev-only** and excluded from the production build.

---

## ✨ Features

### 🧑‍🤝‍🧑 Character System
- **KayKit Characters** — GLB models with full skeleton rig, 3-tier fallback (Mixamo FBX → base FBX → KayKit GLB)
- **4 Races** — Human, Barbarian, Alien, Cyborg (+ Worge, Elf, Orc via GRUDA Wars data)
- **4 Classes** — Warrior, Mage, Ranger, Worge with unique mechanics
- **5-Step Character Creation** — Race → Class → Name → Avatar → Summary wizard
- **Race/Class stat bonuses** — starting attributes auto-calculated from grudgeGameData

### ⚔️ Weapon & Animation System
- **10 Weapon Types** — Sword, Axe, Bow, Crossbow, Staff, Dagger, Spear, Hammer, Gun, Unarmed
- **20-State Animation Machine** — Locomotion + combat + reaction states with 3-hit combos
- **WeaponAttachmentSystem** — Bone traversal with 7 naming conventions, per-weapon offsets, GLB/FBX clone cache
- **3-Tier Fallback** — Mixamo FBX packs → base FBX → KayKit GLB

### 🗂 GRUDA Wars Main Panel (`C` key)
- 8-tab MMO panel: Equipment · Attributes · Skills · Professions · Crafting · Missions · Crew · GOULD
- Dark sci-fi theme (Cinzel font, cyan/gold palette)
- Gouldstone companion system — deploy up to 15 AI-controlled clones with player stats
- Live stat bars (HP / ACT / MND), hotbar, faction rank display

### 🌐 Multiplayer & Backend
- **Grudge Studio Auth** — `id.grudge-studio.com` (login / register / guest / wallet)
- **Game API** — `api.grudge-studio.com` (characters, missions, inventory, professions)
- **WebSocketClient** — `socket.io-client` wrapper with auto-reconnect (5 attempts)
- **Offline fallbacks** — full gameplay without backend connectivity

### 🏝️ Crafting Portal (`/crafting`)
- Inventory, Crafting Interface, Island Manager
- AccountSync hydration from backend
- Island auto-tick for passive harvesting

### 🚀 Space Flight (`index-space.html`)
- Full 3D physics with momentum, fleet management
- WASD/Q/E controls, boost, planet jumping
- Post-processing, star fields, engine trails

### 🌍 World Population
- 10 planets, 50+ cities, 130+ NPCs, 30+ POIs
- Procedural terrain with simplex-noise heightmaps
- SWG-authentic coordinates (Tatooine, Naboo, Corellia, Dathomir…)

---

## 🚀 Quick Start

### ⚡ Online (Zero Setup)
**Play now**: [starwaygruda-webclient-as2n.vercel.app](https://starwaygruda-webclient-as2n.vercel.app)

### 💻 Local Development

```bash
git clone https://github.com/MolochDaGod/starwaygruda-webclient.git
cd starwaygruda-webclient
npm install
npm run dev
# Open http://localhost:8080
```

### 🏗️ Production Build

```bash
npm run build    # Output → dist/
npm run preview  # Preview at http://localhost:4173
```

### 🎯 All Services (Windows)

```bash
npm run start:full   # Warp worker + bridge + dev server
npm run warp         # Port 3333 — Warp AI Worker
npm run bridge       # Port 3001 — SWGEmu Bridge
npm run dev          # Port 8080 — Vite Dev Server
```

---

## 🎮 Controls

### Ground / MMO
| Key | Action |
|-----|--------|
| `W` | Forward (camera-relative, Fortnite style) |
| `A` / `D` | Turn with camera follow |
| `Q` / `E` | Strafe |
| `Space` | Jump (Warriors: double jump) |
| `Shift` | Sprint |
| `LMB` | Attack / combo |
| `RMB + LMB` | Parry attempt (Rangers: counter-dash) |
| `Tab` | Cycle targets (WoW-style) |
| `C` | Open GRUDA Main Panel |
| `Z` | Z-key combat mechanic (battle cry stacks) |
| `1–4` | Skills hotbar |
| `6–8` | Consumable items |
| `V` | Toggle first/third person |

### Space Flight
| Key | Action |
|-----|--------|
| `WASD` | Thrust |
| `Q` / `E` | Vertical |
| `Shift` | Boost |
| `C` | Change ship |
| `M` | Flight dashboard |
| `H` | Help |

---

## 📦 Project Structure

```
StarWayGRUDA-WebClient/
├── src/
│   ├── mmo-main.js              ⭐ Primary entry (/ route)
│   ├── main-advanced.js         Advanced space/ground hybrid
│   ├── crafting-main.js         Crafting portal entry
│   ├── UIManager.js             Inventory/Crafting/Map/DopeBudz hub
│   ├── api/
│   │   └── APIClient.js         Grudge Studio REST client (offline fallbacks)
│   ├── network/
│   │   └── WebSocketClient.js   socket.io-client multiplayer wrapper
│   ├── player/
│   │   ├── KayKitCharacterSystem.js     GLB character loader + weapon init
│   │   ├── WeaponAnimationController.js 20-state machine, 10 weapon types
│   │   ├── WeaponAttachmentSystem.js    Bone attachment, clone cache
│   │   └── EnhancedCharacterController.js  Capsule physics + Mixamo
│   ├── systems/
│   │   ├── GameStateManager.js  Immer-based central state (HAM, inventory…)
│   │   ├── CombatSystem.js      Damage calc, AoE shapes, crit/miss/block
│   │   ├── EnemyManager.js      Spawn, AI, aggro
│   │   ├── ProfessionSystem.js  5 harvesting professions + crafting trees
│   │   ├── MissionSystem.js     AI companion missions
│   │   ├── HarvestingSystem.js  Resource nodes
│   │   └── AccountSync.js       Backend hydration
│   ├── ui/
│   │   ├── MainPanel.js         ⭐ 8-tab GRUDA Wars panel (C key)
│   │   ├── GrudgeCharacterCreation.js  5-step creation wizard
│   │   ├── CharacterSelection.js       Login + char list
│   │   └── [30+ UI components]
│   ├── world/
│   │   ├── GroundGameScene.js   MMO scene (terrain, NPCs, systems)
│   │   ├── ProceduralArchitect.js
│   │   └── [More world systems]
│   └── data/
│       ├── grudgeGameData.js     Races, classes, factions, attributes
│       ├── poi-database.js       10 planets, 50+ cities
│       └── npc-spawns.js         130+ NPC definitions
├── index-mmo.html               ⭐ Primary HTML (/ route)
├── crafting.html                /crafting route
├── admin.html                   /admin route
├── index-landing.html           Game mode selector
├── index-space.html             Space flight
├── game.html                    Planetary ground
├── vercel.json                  Route config + cache headers
└── server/
    ├── swgemu-bridge.js         Express + Socket.io bridge
    └── db.js                    MySQL schema
```

---

## 🔧 Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Vanilla JavaScript ES6+ (no framework) |
| **3D Engine** | Three.js r160 |
| **Build Tool** | Vite 5.4 |
| **Game SDK** | grudge-studio 1.0.2 (controllers, render, terrain) |
| **State** | Immer 11 + EventEmitter3 |
| **Physics** | cannon-es 0.20 |
| **Multiplayer** | socket.io-client 4.6 |
| **Audio** | Howler.js 2.2 |
| **Auth** | Grudge Backend (`id.grudge-studio.com`) |
| **Game API** | `api.grudge-studio.com` |
| **Client Hosting** | Vercel (auto-deploy on push) |
| **Server** | Node.js 20+ / Express (Railway) |
| **Database** | MySQL (Railway) |
| **AI** | Warp Ambient Worker / @google/generative-ai |

---

## 💻 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start all services
npm run start:full

# Individual services
npm run warp    # Warp AI Worker
npm run bridge  # SWGEmu Bridge
```

---

## 🌟 Code Examples

### Populate a Planet
```javascript
import { WorldPopulator } from './src/world/WorldPopulator.js';

// Create populator for Tatooine
const populator = new WorldPopulator(scene, 'tatooine');

// Spawn everything
await populator.populate();

// Get statistics
const stats = populator.getStats();
console.log(`Spawned ${stats.npcs} NPCs, ${stats.objects} objects`);
```

### Find Nearby NPCs
```javascript
// Player position at Mos Eisley
const playerPos = new THREE.Vector3(3528, 5, -4804);

// Find NPCs within 100m
const nearby = populator.getNPCsNearPosition(playerPos, 100);

nearby.forEach(npc => {
    const data = npc.userData;
    console.log(`${data.name} (Lvl ${data.level}) - ${data.faction}`);
    
    // Show dialog if available
    if (data.dialog && data.dialog.length > 0) {
        console.log(`"${data.dialog[0]}"`);
    }
});
```

### Access POI Database
```javascript
import { getPlanetPOIs, findNearestPOI } from './src/data/poi-database.js';

// Get all data for a planet
const naboo = getPlanetPOIs('naboo');
console.log(`${naboo.cities.length} cities, ${naboo.pois.length} POIs`);

// Find nearest POI
const nearest = findNearestPOI('tatooine', { x: 0, z: 0 }, 5000);
console.log(`Nearest: ${nearest.name} at ${nearest.distance}m`);
```

---

## 📊 Build Stats

```
Build (vite build — March 2026):
├── 1,344 modules transformed
├── 7 HTML entry points
├── vendor-three:   759 KB  (Three.js)
├── vendor-monaco: 4,246 KB (TypeScript workers — inherent)
├── vendor-physics: cannon-es
├── vendor-misc:    socket.io-client, howler, simplex-noise, tween
└── Build time: ~52s

Systems:
├── ✅ GRUDA Wars MMO mode (primary /)
├── ✅ 8-tab MainPanel (Equipment/Attrs/Skills/Professions/Crafting/Missions/Crew/GOULD)
├── ✅ KayKit character + weapon animation (10 types, 20 states, 3-hit combo)
├── ✅ EnhancedCharacterController (capsule physics, Mixamo, first/third person)
├── ✅ Grudge Studio auth + game API (offline fallbacks throughout)
├── ✅ WebSocketClient multiplayer (socket.io-client, auto-reconnect)
├── ✅ Immer GameStateManager (HAM, inventory, equipment, professions)
├── ✅ CombatSystem (crit/miss/block, AoE shapes, damage types)
├── ✅ 5-step character creation wizard
├── ✅ Crafting Portal (/crafting route)
├── ✅ World population (10 planets, 130+ NPCs)
├── ✅ Space flight + fleet management
├── ✅ Admin dashboard
└── ✅ MySQL persistence (Railway)
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [LIVE-URLS.md](LIVE-URLS.md) | All production URLs + route map |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel + Railway deployment guide |
| [MIXAMO_INTEGRATION.md](MIXAMO_INTEGRATION.md) | Mixamo animation pack directory |
| [GAME-SYSTEMS-COMPLETE.md](GAME-SYSTEMS-COMPLETE.md) | Full system inventory |
| [POPULATION_GUIDE.md](POPULATION_GUIDE.md) | World population system |
| [SPACE-FLIGHT-README.md](SPACE-FLIGHT-README.md) | Space flight system |
| [WARP_WORKER.md](WARP_WORKER.md) | Warp AI worker integration |
| [ADMIN_PANEL_GUIDE.md](ADMIN_PANEL_GUIDE.md) | Admin dashboard guide |

---

## 🚀 Deployment

### Client — Vercel (Automatic)
Push to `main` → Vercel auto-deploys. Routes are defined in `vercel.json`:

```
/           → index-mmo.html   (primary MMO)
/game       → index-mmo.html
/play       → index-mmo.html
/crafting   → crafting.html
/admin      → admin.html
/mmo        → redirect to /
```

### Server — Railway
Deploy `server/` subdirectory. MySQL tables auto-create on first boot.

**Environment variables:**
```
MYSQL_URL        ← from Railway MySQL service
NODE_ENV         = production
GRUDGE_AUTH_URL  = https://id.grudge-studio.com
GRUDGE_API_URL   = https://api.grudge-studio.com
ALLOWED_ORIGINS  = https://starwaygruda-webclient-as2n.vercel.app
```

### Manual Build
```bash
npm run build   # → dist/
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📋 Changelog

### 2026-03-22
- **Fix: Combat crash** — Resolved `Cannot assign to read only property 'current'` error when using abilities. Immer was freezing shared health/position objects between Three.js meshes and GameStateManager. Entity registration now deep-copies nested objects, and `dealDamageToEntity` replaces the health object instead of mutating it.
- **Fix: Vercel headers** — Corrected `.glb`/`.fbx` cache header source patterns to use Vercel path syntax.

---

## 🗺️ Roadmap

- [x] GRUDA Wars MMO primary route
- [x] 8-tab MainPanel (C key)
- [x] KayKit character + Mixamo weapon animation system
- [x] EnhancedCharacterController (capsule physics, first/third person)
- [x] 5-step character creation wizard
- [x] Crafting portal (`/crafting`)
- [x] Grudge Studio auth + game API with offline fallbacks
- [x] WebSocketClient multiplayer (socket.io-client)
- [x] Immer state management + CombatSystem
- [x] World population (10 planets, 130+ NPCs)
- [x] Space flight + fleet management
- [x] MySQL persistence (Railway)
- [ ] Live multiplayer sessions (backend socket rooms)
- [ ] Real GLB model streaming from ObjectStore
- [ ] Full quest chain with AI mission generation
- [ ] Gouldstone companion deploy UI
- [ ] Island base claiming (Pirate Claim flag)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **SWGEmu** - Authentic game data and coordinates
- **Three.js** - Amazing 3D engine
- **Vercel** - Hosting and deployment
- **Star Wars Galaxies** - The original game

---

## 📧 Links

- **GitHub**: [github.com/MolochDaGod/starwaygruda-webclient](https://github.com/MolochDaGod/starwaygruda-webclient)
- **Live Demo**: [starwaygruda-webclient-as2n.vercel.app](https://starwaygruda-webclient-as2n.vercel.app)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

---

<p align="center">
  <strong>Made with ❤️ for Star Wars Galaxies fans everywhere</strong>
  <br>
  <em>May the Force be with you!</em>
</p>

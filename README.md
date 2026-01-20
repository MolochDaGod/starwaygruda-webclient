# 🌟 StarWayGRUDA Web Client

> **3D Browser-Based Star Wars Galaxies**  
> Complete recreation with authentic SWGEmu data, space flight, and a fully populated galaxy.

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel)](https://starwaygruda-webclient.vercel.app)
[![Node](https://img.shields.io/badge/Node-20%2B-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-r160-orange?style=for-the-badge&logo=three.js)](https://threejs.org)

---

## 🎮 Live Demo

| Page | URL | Description |
|------|-----|-------------|
| 🏠 **Main Game** | [Launch](https://starwaygruda-webclient.vercel.app) | Character selection & 3D world |
| 🚀 **Space Flight** | [Launch](https://starwaygruda-webclient.vercel.app/index-space.html) | 3D space travel with physics |
| 🌍 **Population Test** | [Launch](https://starwaygruda-webclient.vercel.app/test-population.html) | Interactive planet viewer |
| ⚙️ **Admin Dashboard** | [Launch](https://starwaygruda-webclient.vercel.app/admin.html) | System monitoring |

---

## ✨ Features

### 🌍 Complete World Population System
- **10 Planets** - Tatooine, Naboo, Corellia, Endor, Dathomir, Lok, Rori, Talus, Yavin 4, Tutorial
- **50+ Cities** - Mos Eisley, Theed, Coronet, and more with authentic coordinates
- **100+ Buildings** - Starports, cantinas, palaces, medical centers
- **130+ NPCs** - Spanning 9 planets with factions and levels (5-275)
- **30+ POIs** - Jabba's Palace, Krayt Graveyard, Massassi Temple, Death Star wreckage

### 🚀 Advanced Space Flight
- **Full 3D Physics** - Realistic space travel with momentum
- **Multiple Ships** - Fleet management system
- **WASD Controls** - Q/E vertical, SHIFT boost
- **Planet Travel** - Jump between systems
- **Visual Effects** - Post-processing, star fields, engine trails

### 👥 NPC & Faction System
```
11 Factions:
├── Imperial       - Gray uniforms, military
├── Rebel          - Orange, freedom fighters
├── Neutral        - Light blue, civilians
├── CorSec         - Blue, Corellian security
├── Naboo          - Gold, royal guards
├── Gungan         - Orange, amphibious
├── Ewok           - Brown, forest dwellers
├── Pirate         - Red, Nym's crew
├── Nightsister    - Purple, Dathomir witches
├── Jawa           - Tan, scavengers
└── Tusken         - Tan, sand people
```

### 🎨 Modern UI
- **Character Selection** - Full 3D preview
- **Flight Dashboard** - Real-time ship stats (M key)
- **Advanced HUD** - Health, position, FPS
- **Admin Dashboard** - Dark theme, real-time monitoring

---

## 🚀 Quick Start

### ⚡ Online (Zero Setup)
**Just click**: [starwaygruda-webclient.vercel.app](https://starwaygruda-webclient.vercel.app)

### 💻 Local Development

```bash
# 1. Clone repository
git clone https://github.com/MolochDaGod/starwaygruda-webclient.git
cd starwaygruda-webclient

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:8080
```

### 🎯 Start All Services (Windows)

```bash
# One command startup
START_ALL.bat

# Or individually
npm run warp    # Port 3333 - Warp AI Worker
npm run bridge  # Port 3001 - SWGEmu Bridge
npm run dev     # Port 8080 - Vite Dev Server
```

---

## 🗺️ Planets & Content

### 🏜️ Tatooine
```
Cities:  Mos Eisley, Mos Espa, Bestine, Mos Entha, Anchorhead
NPCs:    38 (Tusken Raiders, Jawas, Banthas, Dewbacks, Krayt Dragon)
POIs:    Jabba's Palace, Krayt Graveyard, Ben's Hut, Sarlacc Pit
Level:   5-275 (Krayt Dragon boss)
```

### 🌊 Naboo
```
Cities:  Theed, Moenia, Kaadara, Keren, Dee'ja Peak
NPCs:    20 (Security, Gungans, Kaadus, Fambaas, Motts)
POIs:    Gungan Sacred Place, Lake Retreat, Emperor's Retreat
Level:   5-45
```

### 🏭 Corellia
```
Cities:  Coronet, Tyrena, Kor Vella, Doaba Guerfel, Vreni Island
NPCs:    29 (CorSec, Citizens, Durnis, Slice Hounds)
POIs:    Rogue CorSec Base, Drall Cave
Level:   5-15
```

### 🌲 Endor
```
Cities:  Smuggler Outpost, Research Outpost
NPCs:    21 (Ewoks, Gorax, Bordoks)
POIs:    Ewok Village, Imperial Outpost, Death Star Wreckage
Level:   5-190 (Gorax boss)
```

### 🔮 Dathomir
```
Cities:  Science Outpost, Trade Outpost
NPCs:    9 (Nightsisters, Rancors, Brackasets)
POIs:    Nightsister Stronghold, Sarlacc, Crashed Ship
Level:   45-150 (High danger)
```

**Plus**: Lok, Rori, Talus, Yavin 4

---

## 🎮 Controls

### Ground Movement
| Key | Action |
|-----|--------|
| `WASD` | Move |
| `Space` | Jump |
| `Shift` | Sprint |
| `Mouse` | Look around |

### Space Flight
| Key | Action |
|-----|--------|
| `WASD` | Thrust (forward/back/strafe) |
| `Q / E` | Vertical movement |
| `Shift` | Boost |
| `C` | Change ship |
| `M` | Toggle flight dashboard |
| `V` | Cycle camera views |
| `H` | Show help |
| `R` | Reset position |

---

## 📦 Project Structure

```
StarWayGRUDA-WebClient/
├── src/
│   ├── data/
│   │   ├── poi-database.js          # 10 planets, 50+ cities
│   │   └── npc-spawns.js            # 130+ NPC definitions
│   ├── world/
│   │   ├── WorldPopulator.js        # ⭐ Main population system
│   │   ├── SpaceFlightSystem.js     # Space physics
│   │   ├── SpaceTravelSystem.js     # Planet jumping
│   │   ├── ShipFleetManager.js      # Fleet management
│   │   ├── EpicSpawnManager.js      # Boss spawns
│   │   ├── CrystalSystem.js         # Resource crystals
│   │   └── [More systems...]
│   ├── ui/
│   │   ├── CharacterSelection.js
│   │   ├── FlightDashboard.js
│   │   └── HUD-Advanced.js
│   └── loaders/
│       ├── AssetLoader.js
│       └── HDAssetLoader.js
├── server/
│   └── swgemu-bridge.js             # SWGEmu communication
├── index.html                        # Main game
├── index-space.html                  # Space flight
├── test-population.html              # Population viewer
├── admin.html                        # Admin dashboard
└── [30+ documentation files]
```

---

## 🔧 Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Vanilla JavaScript (ES6+) |
| **3D Engine** | Three.js r160 |
| **Build Tool** | Vite 5.4 |
| **Backend** | Node.js 20+ (optional) |
| **Deployment** | Vercel |
| **AI Integration** | Warp Ambient Worker |

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

## 📊 Statistics

```
Total Content:
├── 10 Planets
├── 50+ Cities
├── 100+ Buildings
├── 130+ NPCs/Creatures
├── 30+ Points of Interest
├── 11 Factions
└── 200+ Total Files

Systems Implemented:
├── ✅ World Population
├── ✅ Space Flight
├── ✅ NPC Spawning
├── ✅ Admin Dashboard
├── ✅ Asset Loading
├── ✅ Faction System
└── ✅ Warp AI Integration
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [POPULATION_GUIDE.md](POPULATION_GUIDE.md) | Complete world population system guide |
| [ASSET_MANIFEST.json](ASSET_MANIFEST.json) | Full inventory of all game assets |
| [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) | Deployment info and testing checklist |
| [SPACE-FLIGHT-README.md](SPACE-FLIGHT-README.md) | Space flight system documentation |
| [WARP_WORKER.md](WARP_WORKER.md) | Warp AI integration guide |
| [README_OLD.md](README_OLD.md) | Original README with asset extraction info |

---

## 🚀 Deployment

### Vercel (Automatic)
1. Push to GitHub → Vercel auto-deploys
2. Check: https://vercel.com/dashboard
3. Live at: https://starwaygruda-webclient.vercel.app

### Manual Build
```bash
npm run build
# Output: dist/ folder ready for any static host
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 🗺️ Roadmap

- [x] World population system
- [x] Space flight mechanics  
- [x] NPC spawning system
- [x] Admin dashboard
- [ ] Real SWG model loading
- [ ] NPC AI and pathfinding
- [ ] Combat system
- [ ] Quest system
- [ ] Multiplayer support
- [ ] Guild system
- [ ] Player housing

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
- **Live Demo**: [starwaygruda-webclient.vercel.app](https://starwaygruda-webclient.vercel.app)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

---

<p align="center">
  <strong>Made with ❤️ for Star Wars Galaxies fans everywhere</strong>
  <br>
  <em>May the Force be with you!</em>
</p>

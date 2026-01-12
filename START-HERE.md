# 🌟 StarWayGRUDA - Complete Setup Guide

## What This Is

A complete **Star Wars Galaxies** emulator with:
- ✅ **SWGEmu Core3 Server** (Pre-CU game server in WSL)
- ✅ **3D Web Client** (Three.js browser-based client)
- ✅ **Ready to Play** (Both server and client included)

---

## Quick Start (3 Steps)

### Step 1: Build the Server
```powershell
.\start-server.ps1
# Choose option 1 (Build server)
# Wait 10-20 minutes for compilation
```

### Step 2: Start the Server
```powershell
.\start-server.ps1
# Choose option 2 (Start server)
```

### Step 3: Launch the Client
```powershell
npm run dev
# Browser opens at http://localhost:8080
```

**That's it!** You're running your own Star Wars Galaxies server! 🎉

---

## What's Included

### 📦 Files & Scripts

| File | Purpose |
|------|---------|
| `start-server.ps1` | **Easy server management** - Build, start, stop server |
| `SERVER-TUTORIAL.md` | **Complete server guide** - Detailed setup and configuration |
| `DEPLOYMENT-INSTRUCTIONS.md` | **Cloud deployment** - Deploy to Vercel/VPS |
| `deploy.ps1` | **Quick GitHub deploy** - Push code to GitHub |
| `npm run dev` | **Start web client** - Launch 3D browser client |

### 🎮 The Server (SWGEmu Core3)

**Location:** WSL Debian at `~/workspace/Core3/MMOCoreORB`

**Features:**
- Pre-CU Star Wars Galaxies gameplay
- All professions (Jedi, Bounty Hunter, Medic, etc.)
- 10+ planets (Tatooine, Naboo, Corellia, etc.)
- Full crafting, combat, housing systems
- NPCs, creatures, quests

**Ports:**
- Login Server: `44453`
- Zone Server: `44455`
- MySQL Database: `3306`

### 🌐 The Web Client

**Location:** `C:\Users\david\Desktop\StarWayGRUDA-WebClient`

**Tech Stack:**
- Vite (build tool)
- Three.js (3D graphics)
- Socket.io (real-time connection)
- Monaco Editor (code editor)

**Features:**
- 3D terrain rendering
- WASD character movement
- Real-time server connection
- HUD (FPS, position, planet)
- Chat system

**URL:** `http://localhost:8080`

---

## Management Commands

### Server Management
```powershell
# Interactive menu
.\start-server.ps1

# Or use WSL directly:
wsl -d Debian

# Then inside WSL:
cd ~/workspace/Core3/MMOCoreORB/bin
./core3                    # Start server
killall core3              # Stop server
tail -f log/core3.log      # View logs
```

### Client Management
```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  YOU (Browser)                               │
│  http://localhost:8080                       │
└────────────┬─────────────────────────────────┘
             │ HTTP/WebSocket
             ▼
┌──────────────────────────────────────────────┐
│  Web Client (Vite + Three.js)                │
│  - 3D Rendering                              │
│  - Character Controller                      │
│  - Asset Loading                             │
└────────────┬─────────────────────────────────┘
             │ Socket.io
             ▼
┌──────────────────────────────────────────────┐
│  SWGEmu Server (WSL Debian)                  │
│  ├─ Login Server (Port 44453)                │
│  ├─ Zone Server (Port 44455)                 │
│  └─ MySQL Database                           │
│     └─ Accounts, Characters, World State     │
└──────────────────────────────────────────────┘
```

---

## Directory Structure

```
StarWayGRUDA-WebClient/
├── src/                          # Web client source
│   ├── main.js                   # Client entry point
│   ├── world/                    # 3D world rendering
│   ├── player/                   # Character controller
│   ├── api/                      # Server connection
│   └── ui/                       # HUD, chat, etc.
├── public/                       # Static assets
│   ├── assets/                   # SWG assets (.iff, .tre)
│   ├── models/                   # 3D models
│   ├── textures/                 # Textures
│   └── favicon.png               # Site icon
├── mtgserver/                    # SWGEmu server files
│   └── wsl2/                     # WSL setup scripts
├── index.html                    # Client HTML
├── package.json                  # Dependencies
├── vite.config.js                # Build config
├── start-server.ps1              # 🎯 SERVER MANAGER
├── SERVER-TUTORIAL.md            # 📚 DETAILED GUIDE
└── START-HERE.md                 # 👈 YOU ARE HERE
```

---

## Troubleshooting

### Server won't build
```powershell
# Check WSL is installed
wsl --list --verbose

# Should show Debian

# If not, reinstall WSL:
wsl --install -d Debian
```

### Client won't start
```powershell
# Reinstall dependencies
rm -rf node_modules
npm install

# Check Node version (should be 20+)
node --version
```

### Can't connect
```powershell
# Check server is running
wsl -d Debian -- bash -c "ps aux | grep core3"

# Check MySQL is running
wsl -d Debian -- bash -c "sudo service mysql status"

# Restart everything
.\start-server.ps1  # Choose 3 to stop
.\start-server.ps1  # Choose 2 to start
npm run dev         # Start client
```

---

## Next Steps

### For Development

1. **Customize the server:**
   - Edit `~/workspace/Core3/MMOCoreORB/bin/conf/config.lua`
   - Modify scripts in `bin/scripts/`
   - See `SERVER-TUTORIAL.md` for details

2. **Customize the client:**
   - Edit files in `src/`
   - Add models to `public/models/`
   - Modify UI in `src/ui/`

3. **Deploy online:**
   - See `DEPLOYMENT-INSTRUCTIONS.md`
   - Client: Deploy to Vercel (free)
   - Server: Deploy to VPS (~$24/mo)

### For Playing

1. **Create an account:**
```bash
# In WSL
mysql -u root -p swgemu
INSERT INTO accounts (username, password, admin_level) 
VALUES ('yourname', MD5('password'), 15);
```

2. **Start playing:**
   - Visit `http://localhost:8080`
   - Move with WASD
   - Look with mouse
   - Press E to interact

---

## Resources

- **SWGEmu Wiki:** https://www.swgemu.com/wiki
- **Three.js Docs:** https://threejs.org/docs
- **Vite Docs:** https://vitejs.dev

---

## Support

- **Server issues:** Check `SERVER-TUTORIAL.md`
- **Client issues:** Check browser console (F12)
- **Build issues:** Check `npm run dev` output

---

## Project Status

- ✅ WSL server installed
- ⚠️ Server needs building (run `start-server.ps1`)
- ✅ Web client ready
- ✅ Dependencies installed
- ✅ Scripts configured

---

## Quick Commands Cheatsheet

```powershell
# SERVER
.\start-server.ps1              # Interactive menu
wsl -d Debian                   # Open WSL

# CLIENT  
npm run dev                     # Start dev server
npm run build                   # Build for production

# DEPLOYMENT
.\deploy.ps1                    # Deploy to GitHub
vercel                          # Deploy to Vercel

# DEBUGGING
wsl -d Debian -- bash -c "tail -f ~/workspace/Core3/MMOCoreORB/bin/log/core3.log"
```

---

**Ready to start!** 🚀

Run: `.\start-server.ps1` and choose option 1 to build the server.

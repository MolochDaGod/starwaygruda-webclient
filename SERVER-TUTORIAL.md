# 🎮 StarWayGRUDA SWGEmu Server - Complete Tutorial

## What You Have

You have a **SWGEmu Core3 server** installed in WSL2 Debian. This is the Pre-CU (Pre-Combat Upgrade) Star Wars Galaxies emulator server.

### Current Status
- ✅ WSL2 Debian installed and configured
- ✅ Server code located at: `~/workspace/Core3/MMOCoreORB`
- ⚠️ Server needs to be built (compiled)
- ⚠️ MySQL database needs configuration
- ⚠️ TRE files need to be copied

---

## Step 1: Access Your Server

### Option A: Via Windows Terminal
```powershell
wsl -d Debian
```

### Option B: From Start Menu
1. Click Start
2. Search for "Debian"
3. Click to open

---

## Step 2: Build the Server

Once inside WSL, run these commands:

```bash
# Navigate to server directory
cd ~/workspace/Core3/MMOCoreORB

# Build the server (takes 10-20 minutes)
make -j$(nproc)
```

**What this does:**
- Compiles the C++ server code
- Creates the `core3` executable
- Sets up server binaries

---

## Step 3: Configure MySQL Database

The server needs a MySQL database to store character data, world state, etc.

```bash
# Check if MySQL is running
sudo service mysql status

# If not running, start it
sudo service mysql start

# Create the database
mysql -u root -p < ~/workspace/Core3/MMOCoreORB/sql/swgemu.sql
```

**Default MySQL credentials:**
- Username: `root`
- Password: (set during WSL setup, or blank)

---

## Step 4: Copy TRE Files

The server needs the original Star Wars Galaxies game files (TRE files).

### If you have SWG installed on Windows:

```bash
# From WSL, copy TRE files from Windows SWG install
# Example: C:\SWGEmu\tre
cp /mnt/c/SWGEmu/tre/*.tre ~/workspace/Core3/MMOCoreORB/bin/tre/
```

### Required TRE files:
```
bottom.tre
data_animation_00.tre
data_music_00.tre
data_other_00.tre
data_sample_00.tre - 04.tre
data_skeletal_mesh_00.tre - 01.tre
data_static_mesh_00.tre - 01.tre
data_texture_00.tre - 07.tre
default_patch.tre
patch_00.tre - 14.tre
```

---

## Step 5: Configure the Server

Edit the configuration file:

```bash
cd ~/workspace/Core3/MMOCoreORB/bin/conf
nano config.lua
```

### Key settings to change:

```lua
-- Server Name
ServerName = "StarWayGRUDA"

-- MySQL Database
DBHost = "localhost"
DBPort = 3306
DBName = "swgemu"
DBUser = "root"
DBPass = "your_mysql_password"

-- Server Ports
LoginPort = 44453
PingPort = 44462
StatusPort = 44455

-- Allow all IPs (for testing)
AllowedConnections = "*"
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## Step 6: Start the Server

### Development Mode (with debugging)
```bash
cd ~/workspace/Core3/MMOCoreORB/bin
./core3
```

### Background Mode (production)
```bash
cd ~/workspace/Core3/MMOCoreORB/bin
./core3 > server.log 2>&1 &
```

### Monitor server logs:
```bash
tail -f ~/workspace/Core3/MMOCoreORB/bin/log/core3.log
```

---

## Step 7: Create Admin Account

Once the server is running, create your admin character:

```bash
# In another terminal, connect to MySQL
mysql -u root -p swgemu

# Create admin account
INSERT INTO accounts (username, password, admin_level) 
VALUES ('admin', MD5('password'), 15);
```

---

## Step 8: Connect Your Client

### Web Client (Your StarWayGRUDA Client)

1. Make sure server is running in WSL
2. Start web client:
```powershell
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient
npm run dev
```

3. Browser opens at `http://localhost:8080`
4. Client connects to server at `localhost:44453`

### Original SWG Client (Optional)

Edit your `swgemu_login.cfg`:
```
[ClientGame]
loginServerAddress0=127.0.0.1
loginServerPort0=44453
```

---

## Troubleshooting

### Server won't start
```bash
# Check logs
tail -100 ~/workspace/Core3/MMOCoreORB/bin/log/core3.log

# Common issues:
# - MySQL not running: sudo service mysql start
# - Port already in use: killall core3
# - Missing TRE files: check bin/tre/ directory
```

### Database errors
```bash
# Reset database
mysql -u root -p -e "DROP DATABASE swgemu;"
mysql -u root -p < ~/workspace/Core3/MMOCoreORB/sql/swgemu.sql
```

### Can't connect
```bash
# Check server is listening
netstat -tlnp | grep 44453

# Check firewall (if accessing remotely)
sudo ufw allow 44453/tcp
sudo ufw allow 44455/tcp
```

---

## Quick Reference Commands

### Server Management
```bash
# Start server
cd ~/workspace/Core3/MMOCoreORB/bin && ./core3

# Stop server
killall core3

# Restart server
killall core3 && ./core3 &

# View logs
tail -f log/core3.log

# Check if running
ps aux | grep core3
```

### Database Management
```bash
# Connect to database
mysql -u root -p swgemu

# View tables
SHOW TABLES;

# View accounts
SELECT * FROM accounts;

# View characters
SELECT * FROM characters;

# Reset everything
DROP DATABASE swgemu;
CREATE DATABASE swgemu;
USE swgemu;
SOURCE ~/workspace/Core3/MMOCoreORB/sql/swgemu.sql;
```

---

## Server Architecture

```
┌─────────────────────────────────────┐
│  Web Client (Port 8080)             │
│  http://localhost:8080              │
└──────────────┬──────────────────────┘
               │ HTTP/WebSocket
               ▼
┌─────────────────────────────────────┐
│  Login Server (Port 44453)          │
│  - Authentication                   │
│  - Character Selection              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Zone Server (Port 44455)           │
│  - Game World                       │
│  - Player Movement                  │
│  - NPCs, Combat, etc.               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  MySQL Database                     │
│  - Accounts                         │
│  - Characters                       │
│  - Objects                          │
│  - World State                      │
└─────────────────────────────────────┘
```

---

## What's Included

### Server Features (SWGEmu Core3)
- ✅ Pre-CU game mechanics
- ✅ All professions (Jedi, Bounty Hunter, etc.)
- ✅ Tatooine, Naboo, Corellia, and other planets
- ✅ NPCs and creatures
- ✅ Combat system
- ✅ Crafting system
- ✅ Player housing
- ✅ Vehicles and mounts

### Your Web Client Features
- ✅ 3D terrain rendering (Three.js)
- ✅ Character movement (WASD controls)
- ✅ Real-time server connection
- ✅ HUD with FPS, position, planet info
- ✅ Chat system
- ✅ Asset loading (models, textures)

---

## Next Steps

1. **Build the server** (Step 2 above)
2. **Configure MySQL** (Step 3)
3. **Copy TRE files** (Step 4)
4. **Start the server** (Step 6)
5. **Test with web client** (Step 8)

---

## Advanced Configuration

### Multiple Planets
Enable additional planets in `config.lua`:
```lua
ZonesEnabled = {
    "tatooine",
    "naboo",
    "corellia",
    "dantooine",
    "dathomir",
    "endor",
    "lok",
    "rori",
    "talus",
    "yavin4"
}
```

### Custom Content
Add custom items, NPCs, and quests:
```bash
cd ~/workspace/Core3/MMOCoreORB/bin/scripts
# Edit .lua files in custom_scripts/
```

### Performance Tuning
```lua
-- In config.lua
MaximumPlayers = 100
DatabaseThreads = 4
LoginThreads = 2
```

---

## Support & Resources

- **Server Logs:** `~/workspace/Core3/MMOCoreORB/bin/log/core3.log`
- **Config:** `~/workspace/Core3/MMOCoreORB/bin/conf/config.lua`
- **Scripts:** `~/workspace/Core3/MMOCoreORB/bin/scripts/`
- **Database:** `mysql -u root -p swgemu`

---

## Quick Start Script

Save this as `start-server.sh` in your home directory:

```bash
#!/bin/bash
cd ~/workspace/Core3/MMOCoreORB/bin
sudo service mysql start
sleep 2
./core3 2>&1 | tee server.log
```

Make it executable:
```bash
chmod +x ~/start-server.sh
./start-server.sh
```

---

**Ready to start your server!** 🚀

Run: `wsl -d Debian` and follow Step 2 to begin building.

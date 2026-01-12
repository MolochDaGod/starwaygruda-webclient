# 🚀 StarWayGRUDA Complete Deployment Guide

## Quick Start (3 Steps)

### Step 1: Get GitHub Token
1. Browser should have opened to: https://github.com/settings/tokens/new
2. Click **"Generate token"**
3. Copy the token (starts with `ghp_` or `github_pat_`)

### Step 2: Save Token and Deploy
```powershell
# Run the setup script
.\setup-token.ps1

# Paste your token when prompted

# Then run deployment
.\deploy-all.ps1
```

### Step 3: Deploy to Vercel
1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select: **GrudgeDaDev/starwaygruda-webclient**
4. Click **"Deploy"** (Vercel auto-detects Vite)
5. Get your live URL! 🎉

---

## What Gets Deployed

### Web Client (Vercel)
- ✅ 3D Star Wars Galaxies web client
- ✅ Three.js rendering engine
- ✅ Interactive terrain and models
- ✅ Automatic global CDN deployment
- ✅ HTTPS enabled
- 🌐 Live URL: `https://starwaygruda-webclient.vercel.app`

### Game Server (Separate)
The SWGEmu Core3 server needs Linux hosting. Options:

#### Option A: Docker (Local/Testing)
```bash
cd mtgserver/docker
./build.sh
./run.sh
```

#### Option B: VPS (Production)
**Recommended Providers:**
- DigitalOcean ($24/mo for 4GB RAM)
- AWS EC2 (t3.medium)
- Linode ($24/mo for 4GB RAM)
- Vultr ($24/mo for 4GB RAM)

**Setup Commands:**
```bash
# SSH into your VPS
ssh root@your-server-ip

# Install server
git clone https://github.com/GrudgeDaDev/starwaygruda-webclient.git
cd starwaygruda-webclient/mtgserver/linux
sudo ./setup.sh

# Follow prompts for MySQL setup
```

#### Option C: WSL2 (Windows Local)
```bash
cd mtgserver/wsl2
./setup.sh
```

---

## Manual Deployment (No Token)

If you prefer to push manually:

```powershell
# 1. Create GitHub repo at https://github.com/new
#    Name: starwaygruda-webclient

# 2. Push code
git remote add origin https://github.com/GrudgeDaDev/starwaygruda-webclient.git
git branch -M main
git push -u origin main

# 3. Deploy to Vercel at https://vercel.com/new
```

---

## Environment Configuration

### Client Environment Variables (Optional)

Create `.env.production` for production settings:

```env
# Server API endpoint
VITE_API_URL=https://your-game-server.com:44453

# WebSocket endpoint
VITE_WS_URL=wss://your-game-server.com:44455
```

### Server Configuration

Edit `mtgserver/MMOCoreORB/bin/conf/config-local.lua`:

```lua
-- Server name
ServerName = "StarWayGRUDA"

-- Public IP (change to your VPS IP)
DBHost = "127.0.0.1"

-- Allow remote connections
BindPublic = true
```

---

## Connecting Client to Server

After both are deployed:

1. **Find your server IP:**
   ```bash
   # On your VPS
   curl ifconfig.me
   ```

2. **Update client code:**
   
   Edit `src/main.js`:
   ```javascript
   const API_URL = 'https://your-server-ip:44453';
   const WS_URL = 'wss://your-server-ip:44455';
   ```

3. **Rebuild and redeploy:**
   ```powershell
   git add src/main.js
   git commit -m "Update server endpoints"
   git push
   ```
   
   Vercel will auto-deploy the update!

---

## Troubleshooting

### Build Fails on Vercel
- Check build logs in Vercel dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version compatibility

### Server Won't Start
```bash
# Check logs
cd mtgserver/MMOCoreORB/bin
tail -f log/core3.log

# Check database
mysql -u root -p
SHOW DATABASES;
USE swgemu;
SHOW TABLES;
```

### Client Can't Connect to Server
1. Check firewall rules on VPS:
   ```bash
   sudo ufw allow 44453/tcp
   sudo ufw allow 44455/tcp
   ```

2. Verify server is running:
   ```bash
   netstat -tlnp | grep 44453
   ```

3. Update CORS settings in server config

---

## Deployment Checklist

### Client
- [ ] GitHub token generated
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Build succeeds
- [ ] Live URL works
- [ ] Assets load correctly

### Server
- [ ] VPS provisioned (or Docker running)
- [ ] SWGEmu server installed
- [ ] TRE files copied
- [ ] Database setup complete
- [ ] Server starts without errors
- [ ] Ports opened in firewall

### Integration
- [ ] Client API endpoints updated
- [ ] Server allows remote connections
- [ ] CORS configured
- [ ] Login flow works
- [ ] Character creation works

---

## Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Vercel (Client) | **FREE** | Hobby plan includes 100GB bandwidth |
| GitHub | **FREE** | Public repos unlimited |
| DigitalOcean (Server) | **$24/mo** | 4GB RAM droplet |
| Domain (Optional) | **$12/yr** | Custom domain for client |

**Total: ~$24/month** (Server only, client is free!)

---

## Next Steps After Deployment

1. **Test the client:**
   - Visit your Vercel URL
   - Check 3D rendering works
   - Test WASD controls
   - Verify FPS counter

2. **Test the server:**
   - Connect via SWG client
   - Create test character
   - Verify login server responds
   - Check database connections

3. **Share your game:**
   - Send Vercel URL to friends
   - They can play instantly (no install)
   - Set up Discord for community

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `setup-token.ps1` | Interactive GitHub token setup |
| `deploy-all.ps1` | Complete deployment automation |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `vercel` | Deploy to Vercel directly |

---

## Support

- **Client Issues:** Check browser console (F12)
- **Server Issues:** Check `mtgserver/MMOCoreORB/bin/log/core3.log`
- **Deployment Issues:** Check Vercel dashboard logs

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Users (Web Browser)                        │
│  https://starwaygruda-webclient.vercel.app  │
└────────────────┬────────────────────────────┘
                 │ HTTPS/WSS
                 ▼
┌─────────────────────────────────────────────┐
│  Vercel CDN (Global)                        │
│  - Static web client                        │
│  - Three.js 3D renderer                     │
│  - Asset delivery                           │
└────────────────┬────────────────────────────┘
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────┐
│  Game Server (VPS/Docker)                   │
│  - SWGEmu Core3 Engine                      │
│  - Login Server (Port 44453)                │
│  - Zone Server (Port 44455)                 │
│  - MySQL Database                           │
└─────────────────────────────────────────────┘
```

---

**Ready to deploy!** 🚀

Run `.\deploy-all.ps1` to get started.

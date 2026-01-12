# 🚀 StarWayGRUDA Web Client - Deployment Guide

## ⚠️ First: Install Node.js

Node.js installation needs to complete. Follow these steps:

### Option 1: Manual Download (Recommended)
1. Download: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
2. Run the installer
3. **IMPORTANT:** Close and reopen PowerShell after installation
4. Test: `node --version` (should show v20.x.x)

### Option 2: Chocolatey (if you have it)
```powershell
choco install nodejs-lts
```

---

## 📦 Step 1: Install Dependencies

Once Node.js is installed:

```powershell
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient
npm install
```

This installs:
- `three` - 3D graphics engine
- `vite` - Development server
- `axios` - HTTP client
- `socket.io-client` - Real-time communication

---

## 🧪 Step 2: Test Locally

Start the development server:

```powershell
npm run dev
```

You'll see:
```
  VITE v5.0.11  ready in 543 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Browser will open automatically!**

### What You'll See:
1. **Loading screen** with progress bar
2. **Procedural Naboo terrain** (green rolling hills)
3. **HUD** showing FPS, position, planet
4. **Click anywhere** to lock mouse cursor
5. **WASD to fly around!**

---

## 🌐 Step 3: Deploy to Vercel

### 3.1: Build for Production

```powershell
npm run build
```

Creates optimized build in `dist/` folder:
- Minified JavaScript
- Optimized assets
- Ready for deployment

### 3.2: Install Vercel CLI

```powershell
npm install -g vercel
```

### 3.3: Login to Vercel

```powershell
vercel login
```

Choose login method (GitHub, email, etc.)

### 3.4: Deploy!

```powershell
vercel
```

Follow the prompts:
```
? Set up and deploy "StarWayGRUDA-WebClient"? [Y/n] Y
? Which scope? Your Account
? Link to existing project? [y/N] N
? What's your project's name? starwaygruda-client
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

**Your site will be live in ~30 seconds!**

You'll get a URL like: `https://starwaygruda-client.vercel.app`

---

## 🎯 Deploy with Real Assets

If you extracted SWG assets:

### Include Assets in Deployment

```powershell
# Make sure assets are in public folder
ls C:\Users\david\Desktop\StarWayGRUDA-WebClient\public\assets\

# Build includes everything in public/
npm run build

# Deploy
vercel --prod
```

Vercel will upload:
- Your code
- Assets in `public/`
- Everything needed to run

---

## 🔧 Vercel Configuration

Already created: `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ]
}
```

---

## 📊 Post-Deployment

### Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project
2. Settings > Domains
3. Add custom domain
4. Follow DNS instructions

### Environment Variables (If needed)

For API URL:

```powershell
# In project root
echo "VITE_API_URL=https://your-api.com" > .env.production
```

Then in `src/main.js`:
```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
this.api = new APIClient(apiUrl);
```

---

## 🚀 Complete Deployment Commands

### Full Flow (After Node.js is installed):

```powershell
# 1. Navigate to project
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient

# 2. Install dependencies
npm install

# 3. Test locally
npm run dev
# (Test in browser, then Ctrl+C to stop)

# 4. Build for production
npm run build

# 5. Deploy to Vercel
vercel --prod
```

---

## 📱 What Gets Deployed

```
Deployed Files:
├── index.html (Entry point)
├── assets/
│   ├── main-[hash].js (Your game code)
│   ├── vendor-[hash].js (THREE.js, etc.)
│   └── main-[hash].css (Styles)
└── assets/ (Your SWG assets if extracted)
    ├── terrain/
    ├── textures/
    └── models/
```

Total size: ~2-5MB (without SWG assets)

---

## 🌟 Alternative Deployment Options

### Netlify

```powershell
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages

```powershell
npm install -g gh-pages
npm run build
gh-pages -d dist
```

### Cloudflare Pages

1. Push to GitHub
2. Connect repo in Cloudflare dashboard
3. Build command: `npm run build`
4. Output directory: `dist`

---

## 🐛 Deployment Troubleshooting

### Build fails
```powershell
# Clear cache and rebuild
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Assets not loading
- Check `public/assets/` folder exists
- Verify paths in `AssetLoader.js` start with `/assets/`
- Check browser console (F12) for 404 errors

### Slow load times
```javascript
// In vite.config.js, add chunk splitting
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'three': ['three']
      }
    }
  }
}
```

---

## 📊 Performance Optimization

### For Production Deploy:

1. **Compress Assets**
```powershell
# Convert large textures to smaller formats
# Use tools like TinyPNG, ImageOptim
```

2. **Enable Vercel CDN**
- Automatically enabled
- Assets served from edge network
- Fast loading worldwide

3. **Add Loading Optimization**
```javascript
// In main.js
import * as THREE from 'three';

// Lazy load heavy assets
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';
```

---

## 🎮 Share Your Game!

Once deployed, share the link:

**Example:** `https://starwaygruda-client.vercel.app`

Anyone can:
- Visit the URL
- Play immediately (no install)
- Create characters (if API connected)
- Explore Naboo in 3D

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `vercel` | Deploy to Vercel (preview) |
| `vercel --prod` | Deploy to production |
| `npm run preview` | Preview production build locally |

---

## ✅ Deployment Checklist

- [ ] Node.js 20 installed
- [ ] Dependencies installed (`npm install`)
- [ ] Tested locally (`npm run dev`)
- [ ] Build succeeds (`npm run build`)
- [ ] Vercel CLI installed
- [ ] Deployed to Vercel
- [ ] Tested live URL
- [ ] Shared with friends! 🎉

---

**Ready to deploy!** Just waiting for Node.js installation to complete.

Then run:
```powershell
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient
npm install
npm run dev
```

🚀

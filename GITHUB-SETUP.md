# 📚 GitHub Repository Setup Guide

## Current Situation

You have **TWO** projects that need proper GitHub setup:

### 1. **StarWayGRUDA** (Server)
- **URL**: https://github.com/GrudgeDaDev/StarWayGRUDA
- **Contains**: SWGEmu Core3 server code
- **Folders**: build, cmake, docker, linux, wsl2
- **Status**: ✅ Already on GitHub

### 2. **StarWayGRUDA-WebClient** (Client)
- **Local Path**: `C:\Users\david\Desktop\StarWayGRUDA-WebClient`
- **Contains**: Web-based 3D game client
- **Status**: ❌ NOT on GitHub yet (repo doesn't exist)

---

## 🎯 What Needs To Be Done

### Option 1: Create Separate Client Repository (Recommended)

**Benefits:**
- Clean separation of concerns
- Server and client can be developed independently
- Easier to deploy separately
- Better for collaboration

**Steps:**

1. **Create new GitHub repository:**
   - Go to: https://github.com/new
   - Name: `StarWayGRUDA-WebClient`
   - Description: "Web-based 3D client for StarWayGRUDA MMO"
   - Public or Private (your choice)
   - Don't initialize with README (we have code already)

2. **Update git remote:**
```powershell
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient
git remote remove origin
git remote add origin https://github.com/GrudgeDaDev/StarWayGRUDA-WebClient.git
git branch -M main
git push -u origin main
```

### Option 2: Add Client to Existing Repository

**Benefits:**
- Everything in one place
- Single repository to manage
- Easier for users to find everything

**Steps:**

1. **Move webclient into server repo:**
```powershell
# Clone the server repo
cd C:\Users\david\Desktop
git clone https://github.com/GrudgeDaDev/StarWayGRUDA.git StarWayGRUDA-Full

# Copy webclient files
xcopy /E /I StarWayGRUDA-WebClient StarWayGRUDA-Full\webclient

# Commit and push
cd StarWayGRUDA-Full
git add webclient
git commit -m "Add web client

Co-Authored-By: Warp <agent@warp.dev>"
git push origin main
```

---

## 📂 Recommended Project Structure

### Option 1 (Separate Repos):
```
GitHub:
├── StarWayGRUDA (Server repo)
│   ├── build/
│   ├── cmake/
│   ├── docker/
│   ├── linux/
│   ├── wsl2/
│   └── README.md
│
└── StarWayGRUDA-WebClient (Client repo)
    ├── src/
    ├── public/
    ├── launcher.html
    ├── game-vision-agent.js
    └── README.md
```

### Option 2 (Single Repo):
```
StarWayGRUDA:
├── server/           # Core3 server
│   ├── build/
│   ├── cmake/
│   ├── docker/
│   └── linux/
├── webclient/        # Web client
│   ├── src/
│   ├── public/
│   ├── launcher.html
│   └── game-vision-agent.js
├── docs/             # Documentation
└── README.md         # Main readme
```

---

## 🚀 Quick Setup (Recommended)

Run this script to set up Option 1:

```powershell
# 1. Create the repo on GitHub first at:
# https://github.com/new
# Name it: StarWayGRUDA-WebClient

# 2. Then run:
cd C:\Users\david\Desktop\StarWayGRUDA-WebClient

# Remove old remote
git remote remove origin

# Add new remote (replace YOUR_GITHUB_TOKEN if needed)
git remote add origin https://github.com/GrudgeDaDev/StarWayGRUDA-WebClient.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 📋 What You've Created Locally

All of these need to be pushed to GitHub:

### Documentation:
- ✅ START-HERE.md
- ✅ SERVER-TUTORIAL.md  
- ✅ VISION-AGENT-README.md
- ✅ PORT-ALLOCATION.md
- ✅ DEPLOYMENT-INSTRUCTIONS.md

### Features:
- ✅ Character selection screen
- ✅ 3D game client (Three.js)
- ✅ Vision AI agent
- ✅ Web launcher
- ✅ Server management scripts

### Assets:
- ✅ Favicon
- ✅ Public assets
- ✅ Screenshots

---

## ⚠️ Important Notes

### 1. **Remove Screenshots Before Pushing**
Screenshots contain your screen and may have sensitive info:
```powershell
git rm current-screen.png game-screenshot.png game-state.png
git commit -m "Remove screenshots"
```

### 2. **Add .gitignore for Future**
Make sure `.gitignore` includes:
```
*.png
*.jpg
*.jpeg
!public/favicon.png
.env
node_modules
dist
```

### 3. **Update README.md**
Create a comprehensive README for the webclient repo explaining:
- How to install
- How to run
- How to connect to server
- Requirements
- Screenshots (can add back later, edited)

---

## 🔧 After GitHub Setup

### Update Launcher
Once repos are set up, update the launcher to point to correct GitHub URLs:

In `launcher.html`, line 420:
```javascript
function openWebsite() {
    window.open('https://github.com/GrudgeDaDev/StarWayGRUDA-WebClient', '_blank');
}
```

### Update Documentation
Add GitHub links to all documentation files.

---

## ✅ Checklist

- [ ] Decide on Option 1 or Option 2
- [ ] Create GitHub repository (if Option 1)
- [ ] Remove sensitive screenshots
- [ ] Update .gitignore
- [ ] Push code to GitHub
- [ ] Update README.md
- [ ] Test clone from GitHub
- [ ] Update launcher with correct URLs
- [ ] Add GitHub link to docs

---

## 🆘 Need Help?

Run this to auto-create the repository and push:
```powershell
.\deploy.ps1
```

This will:
1. Create GitHub repo via API
2. Push all code
3. Set up everything automatically

---

**Recommendation: Go with Option 1 (Separate Repos)**

It's cleaner and more professional to have:
- `StarWayGRUDA` → Server
- `StarWayGRUDA-WebClient` → Client

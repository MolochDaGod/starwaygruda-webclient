# 🛠️ Project Maintenance Guide

> Best practices for keeping StarWayGRUDA-WebClient clean and optimized

Last Updated: 2026-02-03

---

## 🧹 Recent Cleanup (2026-02-03)

### Space Freed: ~233 MB

**Removed/Archived:**
- ✅ Duplicate virtual environment (`.venv-1`) - 14.13 MB
- ✅ Build outputs (`dist/`, `output/`) - 216.2 MB  
- ✅ Temporary extracted data (`extracted_world_data/`) - 3.21 MB
- ✅ Old log files (archived)

**Kept:**
- ✅ Source code (`src/`)
- ✅ Public assets (`public/`)
- ✅ Node modules (for development)
- ✅ Active virtual environment (`.venv`)
- ✅ Configuration files

**Backup Location:**
```
C:\Users\david\Desktop\Backups\StarWayGRUDA-WebClient-Backup-2026-02-03-170159\
```

---

## 🔄 Regular Maintenance

### Weekly Tasks

```bash
# 1. Check for large files
Get-ChildItem -Recurse -File | 
  Where-Object { $_.Length -gt 5MB } | 
  Select-Object FullName, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}}

# 2. Clean old logs
Remove-Item logs\*.log -Force

# 3. Check git status
git status
```

### Monthly Tasks

```bash
# 1. Clear old backups (keep last 2)
Get-ChildItem C:\Users\david\Desktop\Backups | 
  Sort-Object CreationTime -Descending | 
  Select-Object -Skip 2 | 
  Remove-Item -Recurse -Force

# 2. Rebuild dependencies
npm ci

# 3. Rebuild production build
npm run build
```

---

## 📁 Directory Structure

### Keep These
```
StarWayGRUDA-WebClient/
├── src/                    # Source code
├── public/                 # Static assets
├── server/                 # Backend services
├── node_modules/           # Dependencies
├── .venv/                  # Python virtual environment
├── .vercel/                # Vercel config
├── .vscode/                # VS Code settings
└── [config files]          # package.json, vite.config.js, etc.
```

### Safe to Remove

```
Can Be Regenerated:
├── dist/                   # npm run build
├── output/                 # Build outputs
└── .next/                  # Next.js cache

Can Be Archived:
├── logs/                   # Log files (keep recent)
├── extracted_*/            # Temporary extraction folders
└── *_backup/               # Old backup folders
```

---

## 🔧 Cleanup Script Usage

### Automated Cleanup

The project includes a cleanup script at:
```
C:\Users\david\Desktop\cleanup-backup.ps1
```

**Features:**
- ✅ Creates timestamped backups
- ✅ Moves (doesn't delete) files
- ✅ Generates restore scripts
- ✅ Shows space freed
- ✅ Safe and reversible

**Run it:**
```powershell
C:\Users\david\Desktop\cleanup-backup.ps1
```

### Restore from Backup

If you need something back:
```powershell
# View available backups
Get-ChildItem C:\Users\david\Desktop\Backups

# Restore specific item
Copy-Item 'C:\Users\david\Desktop\Backups\[backup-folder]\[category]\*' `
  'C:\Users\david\Desktop\StarWayGRUDA-WebClient' -Recurse -Force
```

---

## 🚀 Build Management

### Development Build
```bash
npm run dev              # Start dev server (no dist/ created)
```

### Production Build
```bash
npm run build            # Creates dist/ folder
npm run preview          # Test production build locally
```

### Build Artifacts
The `dist/` folder is created by `npm run build` and contains:
- Optimized JavaScript bundles
- Processed CSS
- Copied public assets
- HTML files

**You can safely delete `dist/` at any time** - just rebuild with `npm run build`

---

## 📊 Monitoring Project Size

### Check Total Size
```powershell
# Total project size
$size = (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum
[math]::Round($size / 1GB, 2)
```

### Check Specific Folders
```powershell
# Check each major folder
@('src', 'public', 'node_modules', 'dist') | ForEach-Object {
    $path = "C:\Users\david\Desktop\StarWayGRUDA-WebClient\$_"
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum).Sum / 1MB
        "$_ : $([math]::Round($size, 2)) MB"
    }
}
```

### Find Large Files
```powershell
# Find files over 5MB
Get-ChildItem -Recurse -File | 
  Where-Object { $_.Length -gt 5MB } | 
  Sort-Object Length -Descending | 
  Select-Object @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB,2)}}, FullName
```

---

## 🗂️ Git Best Practices

### .gitignore
Ensure these are ignored:
```gitignore
# Build outputs
dist/
output/
.next/

# Dependencies
node_modules/
.venv/
.venv-*/

# Logs
logs/
*.log

# Temporary files
extracted_*/
*_backup/
*.tmp

# IDE
.vscode/
.idea/
```

### Committing
```bash
# Check what's changed
git status

# Review changes
git diff

# Add files
git add .

# Commit with co-author
git commit -m "Your message

Co-Authored-By: Warp <agent@warp.dev>"

# Push
git push origin main
```

---

## 🎯 Quick Reference

### Common Commands

| Task | Command |
|------|---------|
| **Start dev server** | `npm run dev` |
| **Build for production** | `npm run build` |
| **Clean node_modules** | `Remove-Item node_modules -Recurse -Force; npm install` |
| **Reset git state** | `git reset --hard HEAD` |
| **Check disk usage** | `Get-ChildItem -Recurse \| Measure-Object -Property Length -Sum` |
| **Clean logs** | `Remove-Item logs\* -Force` |

### File Size Guidelines

| Category | Expected Size | Alert If Over |
|----------|---------------|---------------|
| **src/** | ~5-10 MB | 20 MB |
| **public/** | ~50-100 MB | 200 MB |
| **node_modules/** | ~200-300 MB | 500 MB |
| **dist/** | ~50-100 MB | 300 MB |

---

## 🔍 Troubleshooting

### "Out of disk space"
1. Run cleanup script
2. Delete old backups
3. Clear `node_modules` and reinstall
4. Clear `dist` folder

### "Build failing"
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run build`

### "Git conflicts"
1. Create backup of local changes
2. Run `git stash`
3. Pull latest: `git pull`
4. Apply changes: `git stash pop`

---

## 📝 Changelog

### 2026-02-03
- Initial cleanup: freed 233 MB
- Removed duplicate `.venv-1`
- Archived old build outputs
- Created maintenance documentation
- Created automated cleanup script

---

## 🔗 Related Documentation

- [README.md](README.md) - Project overview
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - Deployment guide
- [POPULATION_GUIDE.md](POPULATION_GUIDE.md) - World population system

---

<p align="center">
  <em>Keep it clean, keep it fast! 🚀</em>
</p>

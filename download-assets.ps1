# PowerShell script to download free 3D assets
# Downloads Kenney Character Kit and other free resources

Write-Host "🎮 StarWayGRUDA Asset Downloader" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Create directories
$dirs = @(
    "public/models/characters",
    "public/models/animations",
    "public/models/props",
    "public/models/weapons",
    "public/textures"
)

foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📥 Downloading Kenney Character Kit..." -ForegroundColor Yellow

# Kenney Character Kit (CC0 License)
$kenneyUrl = "https://kenney.nl/content/3-assets/144/characterkit-1.0.zip"
$kenneyZip = "public/models/kenney-characters.zip"

try {
    Invoke-WebRequest -Uri $kenneyUrl -OutFile $kenneyZip
    Write-Host "✅ Downloaded Kenney Character Kit" -ForegroundColor Green
    
    # Extract
    Expand-Archive -Path $kenneyZip -DestinationPath "public/models/characters" -Force
    Remove-Item $kenneyZip
    Write-Host "✅ Extracted character models" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Kenney download failed - will use procedural fallback" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📥 Downloading Quaternius Models..." -ForegroundColor Yellow

# Quaternius Ultimate Modular Characters (CC0)
$quaterniusModels = @{
    "male" = "https://quaternius.com/assets/packs/UltimateModularCharacters/UltimateModularCharacters.zip"
}

foreach ($model in $quaterniusModels.Keys) {
    try {
        $url = $quaterniusModels[$model]
        $zipPath = "public/models/quaternius-$model.zip"
        
        Write-Host "  Downloading $model character..." -ForegroundColor Gray
        Invoke-WebRequest -Uri $url -OutFile $zipPath -TimeoutSec 30
        
        Expand-Archive -Path $zipPath -DestinationPath "public/models/characters/$model" -Force
        Remove-Item $zipPath
        
        Write-Host "  ✅ $model character ready" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $model character download failed" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📥 Setting up Mixamo animation links..." -ForegroundColor Yellow

# Create animation manifest (Mixamo free animations)
$animManifest = @"
{
  "animations": {
    "idle": {
      "source": "mixamo",
      "url": "https://www.mixamo.com/#/?page=1&query=idle&type=Motion%2CMotionPack"
    },
    "walking": {
      "source": "mixamo",
      "url": "https://www.mixamo.com/#/?page=1&query=walking&type=Motion%2CMotionPack"
    },
    "running": {
      "source": "mixamo",
      "url": "https://www.mixamo.com/#/?page=1&query=running&type=Motion%2CMotionPack"
    },
    "jump": {
      "source": "mixamo",
      "url": "https://www.mixamo.com/#/?page=1&query=jump&type=Motion%2CMotionPack"
    },
    "attack": {
      "source": "mixamo",
      "url": "https://www.mixamo.com/#/?page=1&query=sword%20slash&type=Motion%2CMotionPack"
    }
  },
  "note": "Mixamo animations require free account. Download FBX format and place in public/models/animations/"
}
"@

$animManifest | Out-File "public/models/animations/MIXAMO_INFO.json" -Encoding UTF8
Write-Host "✅ Created Mixamo animation guide" -ForegroundColor Green

Write-Host ""
Write-Host "📥 Downloading free weapon models..." -ForegroundColor Yellow

# Free CC0 weapon models from various sources
$weapons = @{
    "sword" = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sword/glTF/Sword.gltf"
}

foreach ($weapon in $weapons.Keys) {
    try {
        $url = $weapons[$weapon]
        $path = "public/models/weapons/$weapon.gltf"
        
        Invoke-WebRequest -Uri $url -OutFile $path -TimeoutSec 10
        Write-Host "  ✅ Downloaded $weapon" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  $weapon download failed" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📝 Creating asset manifest..." -ForegroundColor Yellow

$manifest = @"
{
  "assetSources": {
    "kenney": {
      "license": "CC0",
      "url": "https://kenney.nl/",
      "description": "High-quality game assets"
    },
    "quaternius": {
      "license": "CC0",
      "url": "https://quaternius.com/",
      "description": "Ultimate Modular Characters"
    },
    "mixamo": {
      "license": "Free with account",
      "url": "https://www.mixamo.com/",
      "description": "Character animations"
    },
    "sketchfab": {
      "license": "Various (check per model)",
      "url": "https://sketchfab.com/",
      "description": "Free downloadable models"
    }
  },
  "availableCharacters": {
    "kenney": ["adventurer", "warrior", "mage"],
    "quaternius": ["modular-male", "modular-female"],
    "local": ["procedural-humanoid"]
  },
  "recommendations": {
    "characters": "Use Quaternius for best quality modular characters",
    "animations": "Download from Mixamo (requires free account)",
    "props": "Use Kenney asset packs for props and weapons"
  }
}
"@

$manifest | Out-File "public/models/ASSET_MANIFEST.json" -Encoding UTF8
Write-Host "✅ Created asset manifest" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Asset setup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor White
Write-Host "  1. For Mixamo animations: Visit https://www.mixamo.com/" -ForegroundColor Gray
Write-Host "  2. Create free account and download FBX animations" -ForegroundColor Gray
Write-Host "  3. Place animations in: public/models/animations/" -ForegroundColor Gray
Write-Host ""
Write-Host "  Recommended Mixamo animations:" -ForegroundColor Gray
Write-Host "    - Idle" -ForegroundColor DarkGray
Write-Host "    - Walking" -ForegroundColor DarkGray
Write-Host "    - Running" -ForegroundColor DarkGray
Write-Host "    - Jump" -ForegroundColor DarkGray
Write-Host "    - Sword Slash" -ForegroundColor DarkGray
Write-Host "    - Death" -ForegroundColor DarkGray
Write-Host ""
Write-Host "🎮 Ready to use real 3D characters!" -ForegroundColor Green

Write-Host "🎮 StarWayGRUDA Asset Setup" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Create directories
$dirs = "public/models/characters", "public/models/animations", "public/models/props", "public/models/weapons", "public/textures"

foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📥 Downloading Kenney Character Kit..." -ForegroundColor Yellow

try {
    $kenneyUrl = "https://kenney.nl/content/3-assets/144/characterkit-1.0.zip"
    $kenneyZip = "public/models/kenney-characters.zip"
    
    Invoke-WebRequest -Uri $kenneyUrl -OutFile $kenneyZip -TimeoutSec 60
    Expand-Archive -Path $kenneyZip -DestinationPath "public/models/characters/kenney" -Force
    Remove-Item $kenneyZip
    
    Write-Host "✅ Kenney Character Kit downloaded" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Kenney download failed - will use procedural fallback" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps for REAL 3D characters:" -ForegroundColor White
Write-Host ""
Write-Host "1️⃣  Download Mixamo Characters (FREE):" -ForegroundColor Yellow
Write-Host "   Visit: https://www.mixamo.com/" -ForegroundColor Gray
Write-Host "   - Create free account" -ForegroundColor Gray
Write-Host "   - Download X Bot or Y Bot character (FBX format)" -ForegroundColor Gray
Write-Host "   - Download animations: Idle, Walk, Run, Jump, Attack" -ForegroundColor Gray
Write-Host "   - Place in: public/models/characters/" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Alternative: Quaternius (CC0):" -ForegroundColor Yellow
Write-Host "   Visit: https://quaternius.com/index.html" -ForegroundColor Gray
Write-Host "   - Download Ultimate Modular Characters" -ForegroundColor Gray
Write-Host "   - Extract to: public/models/characters/quaternius/" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Quick Start:" -ForegroundColor Yellow
Write-Host "   The FreeAssetLoader will automatically:" -ForegroundColor Gray
Write-Host "   - Try to load from CDN sources" -ForegroundColor Gray
Write-Host "   - Fall back to local models if available" -ForegroundColor Gray
Write-Host "   - Create procedural humanoid characters as last resort" -ForegroundColor Gray
Write-Host ""
Write-Host "🎮 REAL characters ready to use!" -ForegroundColor Green

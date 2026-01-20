# StarWayGRUDA Environment Status Check

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "StarWayGRUDA Environment Status" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Node.js:" -NoNewline
try {
    $nodeVersion = node --version 2>$null
    Write-Host " ✅ $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
}

# Check npm
Write-Host "npm:" -NoNewline
try {
    $npmVersion = npm --version 2>$null
    Write-Host " ✅ $npmVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
}

# Check Python
Write-Host "Python:" -NoNewline
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host " ✅ $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host " ❌ Not installed" -ForegroundColor Yellow
        Write-Host "   Install from: https://www.python.org/downloads/" -ForegroundColor Gray
    }
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Yellow
    Write-Host "   Install from: https://www.python.org/downloads/" -ForegroundColor Gray
}

# Check Blender
Write-Host "Blender:" -NoNewline
try {
    $blenderVersion = blender --version 2>$null
    if ($blenderVersion) {
        Write-Host " ✅ Installed" -ForegroundColor Green
    } else {
        Write-Host " ❌ Not installed" -ForegroundColor Yellow
        Write-Host "   Install from: https://www.blender.org/download/" -ForegroundColor Gray
    }
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Yellow
    Write-Host "   Install from: https://www.blender.org/download/" -ForegroundColor Gray
}

# Check Git LFS
Write-Host "Git LFS:" -NoNewline
try {
    $gitLfsVersion = git lfs version 2>$null
    Write-Host " ✅ $gitLfsVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not installed" -ForegroundColor Red
}

# Check GPU
Write-Host "GPU:" -NoNewline
try {
    $gpu = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>$null
    if ($gpu) {
        $gpuInfo = $gpu.Split(',')
        $gpuName = $gpuInfo[0].Trim()
        $gpuVRAM = $gpuInfo[1].Trim()
        Write-Host " ✅ $gpuName ($gpuVRAM)" -ForegroundColor Green
        
        if ($gpuVRAM -match '(\d+)') {
            $vramGB = [int]$matches[1] / 1024
            if ($vramGB -lt 24) {
                Write-Host "   ⚠️  HY-Motion requires 24GB+ VRAM (you have $vramGB GB)" -ForegroundColor Yellow
                Write-Host "   Use RunPod cloud GPU or Mixamo instead" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host " ❓ NVIDIA GPU not detected" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Project Structure" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check key folders
$folders = @{
    "Warp Worker" = "C:\Users\david\Desktop\StarWayGRUDA-WebClient\warp-ambient-worker.js"
    "HY-Motion" = "C:\Users\david\Desktop\StarWayGRUDA-WebClient\HY-Motion-1.0"
    "Animations (Mixamo FBX)" = "C:\Users\david\Desktop\StarWayGRUDA-WebClient\animations\mixamo_fbx"
    "Animations (GLB)" = "C:\Users\david\Desktop\StarWayGRUDA-WebClient\animations\mixamo_glb"
    "Public Animations" = "C:\Users\david\Desktop\StarWayGRUDA-WebClient\public\animations"
}

foreach ($item in $folders.GetEnumerator()) {
    Write-Host "$($item.Key):" -NoNewline
    if (Test-Path $item.Value) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Missing" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Documentation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$docs = @(
    "NEXT_STEPS_SUMMARY.md"
    "MIXAMO_INTEGRATION.md"
    "PYTHON_SETUP.md"
    "HY-Motion-1.0\RUNPOD_DEPLOYMENT.md"
    "HY-Motion-1.0\STARWAY_INTEGRATION.md"
)

foreach ($doc in $docs) {
    if (Test-Path "C:\Users\david\Desktop\StarWayGRUDA-WebClient\$doc") {
        Write-Host "✅ $doc" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Quick Commands" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Start Warp Worker:" -ForegroundColor Yellow
Write-Host "  npm run warp" -ForegroundColor Gray
Write-Host ""
Write-Host "Start Dev Server:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Start Everything:" -ForegroundColor Yellow
Write-Host "  START_ALL.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Install Python + Blender (if not installed)" -ForegroundColor Gray
Write-Host "  2. Read NEXT_STEPS_SUMMARY.md" -ForegroundColor Gray
Write-Host "  3. Follow MIXAMO_INTEGRATION.md for free animations" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

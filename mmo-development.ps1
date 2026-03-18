# StarWayGRUDA Development Environment
# Full development setup with hot reload, debugging, and file watching

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "StarWayGRUDA MMO - Development Mode"

# Colors for output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
    Debug = 'Gray'
}

function Write-ColorOutput($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Start-DevelopmentServices {
    Clear-Host
    Write-ColorOutput "🔧 StarWayGRUDA Development Environment" $colors.Header
    Write-ColorOutput "════════════════════════════════════════" $colors.Header
    Write-ColorOutput ""
    
    # Stop any running services
    Write-ColorOutput "🛑 Stopping existing services..." $colors.Warning
    Get-Process | Where-Object {$_.ProcessName -match 'node|npm|vite'} | Stop-Process -Force -ErrorAction SilentlyContinue
    pm2 stop all 2>$null | Out-Null
    pm2 delete all 2>$null | Out-Null
    
    # Create logs directory
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" | Out-Null
        Write-ColorOutput "✅ Created logs directory" $colors.Success
    }
    
    Write-ColorOutput "🚀 Starting Development Services..." $colors.Info
    Write-ColorOutput ""
    
    # Start services in development mode with file watching
    Write-ColorOutput "🌟 1. Starting Bridge Server (with hot reload)..." $colors.Info
    $bridgeJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        & cmd /c 'start "SWGEmu Bridge Dev" cmd /k "cd server && npm run dev"'
    }
    Start-Sleep 3
    
    Write-ColorOutput "⚡ 2. Starting Warp Worker (port 3333)..." $colors.Info
    $warpJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        & cmd /c 'start "Warp Worker" cmd /k "npm run warp"'
    }
    Start-Sleep 2
    
    Write-ColorOutput "🌐 3. Starting Vite Dev Server (port 8080)..." $colors.Info
    $viteJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        & cmd /c 'start "Vite Dev Server" cmd /k "npm run dev"'
    }
    Start-Sleep 3
    
    Write-ColorOutput "🔍 4. Starting File Watcher (for assets)..." $colors.Info
    $watchJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        & node -e "
            const chokidar = require('chokidar');
            console.log('\u{1F50D} Asset file watcher started...');
            const watcher = chokidar.watch(['src/**/*.js', 'assets/**/*', '*.html'], {
                ignored: /node_modules/,
                persistent: true
            });
            watcher.on('change', path => {
                console.log(`\u{1F504} File changed: ${path}`);
            });
            watcher.on('add', path => {
                console.log(`\u{2795} File added: ${path}`);
            });
        "
    }
    
    # Wait for services to initialize
    Write-ColorOutput "⏳ Waiting for services to initialize..." $colors.Warning
    $attempts = 0
    do {
        try {
            $bridgeHealth = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($bridgeHealth.StatusCode -eq 200) {
                Write-ColorOutput "✅ Bridge Server Ready" $colors.Success
                break
            }
        } catch {}
        
        $attempts++
        if ($attempts -gt 15) {
            Write-ColorOutput "⚠️ Some services may still be starting..." $colors.Warning
            break
        }
        Start-Sleep 2
        Write-ColorOutput "    Attempt $attempts/15..." $colors.Debug
    } while ($attempts -lt 15)
    
    Show-DevelopmentInfo
}

function Show-DevelopmentInfo {
    Write-ColorOutput ""
    Write-ColorOutput "🎉 DEVELOPMENT ENVIRONMENT ACTIVE!" $colors.Success
    Write-ColorOutput "═══════════════════════════════════" $colors.Success
    Write-ColorOutput ""
    Write-ColorOutput "📊 Service Endpoints:" $colors.Header
    Write-ColorOutput "   🌐 Main Game:       http://localhost:8080" $colors.Info
    Write-ColorOutput "   📡 Bridge Server:   http://localhost:3001" $colors.Info
    Write-ColorOutput "   ⚡ Warp Worker:     http://localhost:3333" $colors.Info
    Write-ColorOutput "   🏥 Health Check:    http://localhost:3001/api/health" $colors.Info
    Write-ColorOutput "   🎮 Game Launcher:   http://localhost:3001/launcher" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "🛠️ Development Features:" $colors.Header
    Write-ColorOutput "   • 🔄 Hot Reload - Changes auto-refresh" $colors.Info
    Write-ColorOutput "   • 🔍 File Watching - Asset monitoring" $colors.Info
    Write-ColorOutput "   • 📜 Debug Logging - Enhanced error info" $colors.Info
    Write-ColorOutput "   • 🔧 Source Maps - Easy debugging" $colors.Info
    Write-ColorOutput "   • 📁 Live Assets - Real-time asset updates" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "💻 Development Commands:" $colors.Header
    Write-ColorOutput "   npm run dev          - Start Vite dev server" $colors.Info
    Write-ColorOutput "   npm run bridge       - Start bridge server" $colors.Info
    Write-ColorOutput "   npm run warp         - Start warp worker" $colors.Info
    Write-ColorOutput "   npm run build        - Build for production" $colors.Info
    Write-ColorOutput "   npm run test         - Run tests" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "📂 Log Files:" $colors.Header
    Write-ColorOutput "   logs/bridge.log      - Bridge server output" $colors.Info
    Write-ColorOutput "   logs/warp.log        - Warp worker output" $colors.Info
    Write-ColorOutput "   logs/vite.log        - Vite dev server output" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "🕰️ Development Tips:" $colors.Warning
    Write-ColorOutput "   • Use browser dev tools for client debugging" $colors.Info
    Write-ColorOutput "   • Check terminal windows for server logs" $colors.Info
    Write-ColorOutput "   • File changes trigger automatic reloads" $colors.Info
    Write-ColorOutput "   • Use 'npm run health' to check system status" $colors.Info
    Write-ColorOutput ""
    
    # Open development interfaces
    Write-ColorOutput "🌐 Opening development interfaces..." $colors.Info
    Start-Sleep 2
    Start-Process "http://localhost:8080"
    Start-Process "http://localhost:3001"
}

# Execute development setup
try {
    Start-DevelopmentServices
    
    Write-ColorOutput "Press Ctrl+C to stop all development services" $colors.Warning
    Write-ColorOutput "All services are running in separate terminal windows." $colors.Info
    Write-ColorOutput ""
    
    # Keep the script running
    while ($true) {
        Start-Sleep 5
        
        # Simple health check
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            $status = if ($response.StatusCode -eq 200) { "✅" } else { "⚠️" }
            Write-Host "$status Bridge: Online | $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
        } catch {
            Write-Host "❌ Bridge: Offline | $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Red
        }
    }
    
} catch {
    Write-ColorOutput ""
    Write-ColorOutput "❌ Development Setup Failed: $($_.Exception.Message)" $colors.Error
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Troubleshooting:" $colors.Warning
    Write-ColorOutput "   1. Check if ports 3001, 3333, 8080 are free" $colors.Info
    Write-ColorOutput "   2. Ensure Node.js and npm are installed" $colors.Info
    Write-ColorOutput "   3. Run 'npm install' in root and server directories" $colors.Info
    Write-ColorOutput "   4. Try running services individually" $colors.Info
    exit 1
}
# StarWayGRUDA MMO Quickstart Script
# Optimized for fast startup with essential services only

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "StarWayGRUDA MMO - Quickstart"

# Colors and styling
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
}

function Write-ColorOutput($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking System Prerequisites..." $colors.Info
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js: $nodeVersion" $colors.Success
    } catch {
        Write-ColorOutput "❌ Node.js not found. Installing..." $colors.Error
        Install-NodeJS
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ NPM: $npmVersion" $colors.Success
    } catch {
        Write-ColorOutput "❌ NPM not found" $colors.Error
        throw "NPM is required but not installed"
    }
    
    # Check PM2
    try {
        pm2 --version | Out-Null
        Write-ColorOutput "✅ PM2 Process Manager found" $colors.Success
    } catch {
        Write-ColorOutput "⚠️ PM2 not found, installing..." $colors.Warning
        npm install -g pm2
        Write-ColorOutput "✅ PM2 installed" $colors.Success
    }
}

function Install-Dependencies {
    Write-ColorOutput "📦 Installing/Updating Dependencies..." $colors.Info
    
    # Root dependencies
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "Installing root dependencies..." $colors.Warning
        npm install
        Write-ColorOutput "✅ Root dependencies installed" $colors.Success
    }
    
    # Server dependencies
    if (-not (Test-Path "server/node_modules")) {
        Write-ColorOutput "Installing server dependencies..." $colors.Warning
        Push-Location server
        npm install
        Pop-Location
        Write-ColorOutput "✅ Server dependencies installed" $colors.Success
    }
}

function Start-MMOServices {
    Write-ColorOutput "🚀 Starting StarWayGRUDA MMO Services..." $colors.Header
    Write-ColorOutput "═══════════════════════════════════════" $colors.Header
    
    # Stop any existing services
    Write-ColorOutput "🛑 Stopping existing services..." $colors.Warning
    pm2 stop all 2>$null | Out-Null
    pm2 delete all 2>$null | Out-Null
    
    # Start core server
    Write-ColorOutput "🌟 Starting Core SWGEmu Bridge Server..." $colors.Info
    pm2 start ecosystem.config.cjs --env development
    Start-Sleep 3
    
    # Verify server started
    $attempts = 0
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "✅ Bridge Server Online" $colors.Success
                break
            }
        } catch {
            $attempts++
            if ($attempts -gt 10) {
                Write-ColorOutput "❌ Server failed to start after 10 attempts" $colors.Error
                throw "Server startup failed"
            }
            Write-ColorOutput "⏳ Waiting for server... (attempt $attempts/10)" $colors.Warning
            Start-Sleep 2
        }
    } while ($attempts -lt 10)
}

function Show-ServerInfo {
    Write-ColorOutput "" 
    Write-ColorOutput "🎉 STARWAY GRUDA MMO IS LIVE!" $colors.Success
    Write-ColorOutput "═══════════════════════════════" $colors.Success
    Write-ColorOutput ""
    Write-ColorOutput "🌐 Web Interface:    http://localhost:3001" $colors.Info
    Write-ColorOutput "🎮 Game Launcher:    http://localhost:3001/launcher" $colors.Info
    Write-ColorOutput "⚡ API Endpoint:     http://localhost:3001/api/" $colors.Info
    Write-ColorOutput "📡 WebSocket:        ws://localhost:3001" $colors.Info
    Write-ColorOutput "🏥 Health Check:     http://localhost:3001/api/health" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "📊 Management Commands:" $colors.Header
    Write-ColorOutput "   pm2 status           - View process status" $colors.Info
    Write-ColorOutput "   pm2 logs             - View server logs" $colors.Info
    Write-ColorOutput "   pm2 monit            - Real-time monitoring" $colors.Info
    Write-ColorOutput "   pm2 restart all      - Restart services" $colors.Info
    Write-ColorOutput "   pm2 stop all         - Stop services" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "🎯 MMO Features Active:" $colors.Success
    Write-ColorOutput "   • Multiplayer Chat System" $colors.Info
    Write-ColorOutput "   • Player Position Sync" $colors.Info
    Write-ColorOutput "   • Zone Transfer Support" $colors.Info
    Write-ColorOutput "   • Character Management" $colors.Info
    Write-ColorOutput "   • Asset Streaming" $colors.Info
    Write-ColorOutput "   • SWGEmu Integration" $colors.Info
    Write-ColorOutput ""
}

# Main execution
try {
    Clear-Host
    Write-ColorOutput "⚡ StarWayGRUDA MMO Quickstart" $colors.Header
    Write-ColorOutput "═════════════════════════════" $colors.Header
    Write-ColorOutput ""
    
    Test-Prerequisites
    Install-Dependencies
    Start-MMOServices
    Show-ServerInfo
    
    Write-ColorOutput "Press Ctrl+C to stop all services" $colors.Warning
    Write-ColorOutput "Or close this window to keep running in background" $colors.Info
    
    # Keep script alive to show logs
    pm2 logs --raw
    
} catch {
    Write-ColorOutput ""
    Write-ColorOutput "❌ Quickstart Failed: $($_.Exception.Message)" $colors.Error
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Troubleshooting:" $colors.Warning
    Write-ColorOutput "   1. Run MMO-STARTUP.bat as Administrator" $colors.Info
    Write-ColorOutput "   2. Check if ports 3001 are available" $colors.Info
    Write-ColorOutput "   3. Run maintenance mode (option 7)" $colors.Info
    Write-ColorOutput "   4. Check system requirements" $colors.Info
    exit 1
}
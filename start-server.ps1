# StarWayGRUDA Server Management Script

Write-Host "🎮 StarWayGRUDA Server Manager" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. Start web client bridge server" -ForegroundColor White
Write-Host "2. Start development server (with auto-reload)" -ForegroundColor White
Write-Host "3. Run server tests" -ForegroundColor White
Write-Host "4. Install server dependencies" -ForegroundColor White
Write-Host "5. Build SWGEmu server (first time)" -ForegroundColor White
Write-Host "6. Start SWGEmu server" -ForegroundColor White
Write-Host "7. Stop all servers" -ForegroundColor White
Write-Host "8. View server status" -ForegroundColor White
Write-Host "9. Deploy to production" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-9)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting StarWayGRUDA Bridge Server..." -ForegroundColor Yellow
        Write-Host "Server will be available at: http://localhost:3001" -ForegroundColor Gray
        Write-Host "WebSocket endpoint: ws://localhost:3001" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
        Write-Host ""
        
        # Check if dependencies are installed
        if (-not (Test-Path "server/node_modules")) {
            Write-Host "Installing server dependencies..." -ForegroundColor Yellow
            Set-Location server
            npm install
            Set-Location ..
        }
        
        node server/swgemu-bridge.js
    }
    
    "2" {
        Write-Host ""
        Write-Host "Starting development server with auto-reload..." -ForegroundColor Yellow
        Write-Host "Server will restart automatically when files change" -ForegroundColor Gray
        Write-Host ""
        
        if (-not (Test-Path "server/node_modules")) {
            Write-Host "Installing server dependencies..." -ForegroundColor Yellow
            Set-Location server
            npm install
            Set-Location ..
        }
        
        Set-Location server
        npm run dev
        Set-Location ..
    }
    
    "3" {
        Write-Host ""
        Write-Host "Running server tests..." -ForegroundColor Yellow
        Write-Host ""
        
        # Start server in background for testing
        $serverJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            node server/swgemu-bridge.js
        }
        
        # Wait for server to start
        Start-Sleep -Seconds 3
        
        # Run tests
        node server/test-server.js
        
        # Stop test server
        Stop-Job $serverJob
        Remove-Job $serverJob
    }
    
    "4" {
        Write-Host ""
        Write-Host "Installing server dependencies..." -ForegroundColor Yellow
        
        # Install main dependencies
        Write-Host "Installing main project dependencies..." -ForegroundColor Gray
        npm install
        
        # Install server dependencies
        Write-Host "Installing server dependencies..." -ForegroundColor Gray
        Set-Location server
        npm install
        Set-Location ..
        
        Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    }
        
        Start-Process wsl -ArgumentList "-d Debian -- bash -c 'cd ~/workspace/Core3/MMOCoreORB/bin && ./core3'" -WindowStyle Normal
        
        Start-Sleep -Seconds 2
        
        Write-Host "✓ Server starting!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Server status:" -ForegroundColor Cyan
        Write-Host "- Login Server: localhost:44453" -ForegroundColor White
        Write-Host "- Zone Server: localhost:44455" -ForegroundColor White
        Write-Host ""
        Write-Host "Start the web client:" -ForegroundColor Yellow
        Write-Host "  cd C:\Users\david\Desktop\StarWayGRUDA-WebClient" -ForegroundColor White
        Write-Host "  npm run dev" -ForegroundColor White
    }
    
    "3" {
        Write-Host ""
        Write-Host "Stopping server..." -ForegroundColor Yellow
        wsl -d Debian -- bash -c "killall core3"
        Write-Host "✓ Server stopped" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "Server logs (Ctrl+C to exit):" -ForegroundColor Yellow
        Write-Host ""
        wsl -d Debian -- bash -c "tail -f ~/workspace/Core3/MMOCoreORB/bin/log/core3.log"
    }
    
    "5" {
        Write-Host ""
        Write-Host "Opening tutorial..." -ForegroundColor Yellow
        Start-Process "SERVER-TUTORIAL.md"
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid choice. Please run again and choose 1-5." -ForegroundColor Red
    }
}

Write-Host ""

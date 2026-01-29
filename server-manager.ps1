# StarWayGRUDA Server Management Script

Write-Host "🎮 StarWayGRUDA Server Manager" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-CommandExists([string]$command) {
    return [bool](Get-Command $command -ErrorAction SilentlyContinue)
}

# Function to handle errors
function Stop-OnError([string]$message) {
    Write-Host "❌ $message" -ForegroundColor Red
    Write-Host "Operation failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

# Function to check server health
function Test-ServerHealth([string]$url, [int]$port, [string]$name) {
    try {
        if ($url) {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $name: Online" -ForegroundColor Green
                return $true
            }
        } else {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                Write-Host "✅ $name: Online (port $port)" -ForegroundColor Green
                return $true
            }
        }
    } catch {
        # Silently handle connection errors
    }
    Write-Host "❌ $name: Offline" -ForegroundColor Red
    return $false
}

# Verify prerequisites
Write-Host "Checking system prerequisites..." -ForegroundColor Yellow

if (-not (Test-CommandExists "node")) {
    Stop-OnError "Node.js is not installed. Please install from https://nodejs.org/"
}

if (-not (Test-CommandExists "npm")) {
    Stop-OnError "NPM is not installed. Please install Node.js with NPM."
}

$nodeVersion = node --version
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

Write-Host ""
Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. 🚀 Start bridge server (development)" -ForegroundColor White
Write-Host "2. 🔄 Start with auto-reload (development)" -ForegroundColor White
Write-Host "3. 🧪 Run server tests" -ForegroundColor White
Write-Host "4. 📦 Install/update dependencies" -ForegroundColor White
Write-Host "5. 🏭 Deploy to production (PM2)" -ForegroundColor White
Write-Host "6. 📊 Check server status" -ForegroundColor White
Write-Host "7. 📝 View server logs" -ForegroundColor White
Write-Host "8. 🛑 Stop all servers" -ForegroundColor White
Write-Host "9. 🔧 Server configuration" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-9)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Starting StarWayGRUDA Bridge Server..." -ForegroundColor Yellow
        Write-Host "Server will be available at: http://localhost:3001" -ForegroundColor Gray
        Write-Host "WebSocket endpoint: ws://localhost:3001" -ForegroundColor Gray
        Write-Host "API endpoints: http://localhost:3001/api/" -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
        Write-Host ""
        
        # Check if dependencies are installed
        if (-not (Test-Path "server/node_modules")) {
            Write-Host "Installing server dependencies..." -ForegroundColor Yellow
            Set-Location server
            npm install
            if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install server dependencies" }
            Set-Location ..
        }
        
        # Start the server
        node server/swgemu-bridge.js
    }
    
    "2" {
        Write-Host ""
        Write-Host "🔄 Starting development server with auto-reload..." -ForegroundColor Yellow
        Write-Host "Server will restart automatically when files change" -ForegroundColor Gray
        Write-Host "Perfect for development and testing" -ForegroundColor Gray
        Write-Host ""
        
        if (-not (Test-Path "server/node_modules")) {
            Write-Host "Installing server dependencies..." -ForegroundColor Yellow
            Set-Location server
            npm install
            if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install server dependencies" }
            Set-Location ..
        }
        
        # Check if nodemon is available
        Set-Location server
        $hasNodemon = npm list nodemon --depth=0 2>$null
        if (-not $hasNodemon) {
            Write-Host "Installing nodemon for auto-reload..." -ForegroundColor Gray
            npm install --save-dev nodemon
        }
        
        Write-Host "Starting with auto-reload (Ctrl+C to stop)..." -ForegroundColor Green
        npm run dev
        Set-Location ..
    }
    
    "3" {
        Write-Host ""
        Write-Host "🧪 Running server tests..." -ForegroundColor Yellow
        Write-Host "This will test all server functionality" -ForegroundColor Gray
        Write-Host ""
        
        # Install dependencies if needed
        if (-not (Test-Path "server/node_modules")) {
            Write-Host "Installing server dependencies..." -ForegroundColor Gray
            Set-Location server
            npm install
            if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install server dependencies" }
            Set-Location ..
        }
        
        # Start server in background for testing
        Write-Host "Starting test server..." -ForegroundColor Gray
        $serverJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            node server/swgemu-bridge.js
        }
        
        # Wait for server to start
        Start-Sleep -Seconds 3
        
        # Run tests
        Write-Host "Executing tests..." -ForegroundColor Gray
        node server/test-server.js
        
        # Stop test server
        Write-Host "Cleaning up test server..." -ForegroundColor Gray
        Stop-Job $serverJob -ErrorAction SilentlyContinue
        Remove-Job $serverJob -ErrorAction SilentlyContinue
        
        Write-Host ""
        Write-Host "✅ Tests completed!" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "📦 Installing/updating dependencies..." -ForegroundColor Yellow
        Write-Host ""
        
        # Install main dependencies
        Write-Host "Installing main project dependencies..." -ForegroundColor Gray
        npm install
        if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install main dependencies" }
        
        # Install server dependencies
        Write-Host "Installing server dependencies..." -ForegroundColor Gray
        Set-Location server
        npm install
        if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install server dependencies" }
        Set-Location ..
        
        Write-Host ""
        Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
    }
    
    "5" {
        Write-Host ""
        Write-Host "🏭 Deploying to production..." -ForegroundColor Yellow
        Write-Host "This will start the server with PM2 process manager" -ForegroundColor Gray
        Write-Host ""
        
        # Check for PM2
        if (-not (Test-CommandExists "pm2")) {
            Write-Host "Installing PM2 globally..." -ForegroundColor Gray
            npm install -g pm2
            if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install PM2" }
        }
        
        # Install dependencies
        Write-Host "Installing production dependencies..." -ForegroundColor Gray
        Set-Location server
        npm install --production
        if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to install server dependencies" }
        Set-Location ..
        
        # Stop any existing PM2 processes
        pm2 delete starway-bridge 2>$null
        
        # Start with PM2
        Write-Host "Starting server with PM2..." -ForegroundColor Gray
        if (Test-Path "ecosystem.config.cjs") {
            pm2 start ecosystem.config.cjs --env production
        } else {
            pm2 start server/swgemu-bridge.js --name "starway-bridge" --env production
        }
        
        if ($LASTEXITCODE -ne 0) { Stop-OnError "Failed to start PM2 processes" }
        
        # Save PM2 configuration
        pm2 save
        pm2 startup
        
        Write-Host ""
        Write-Host "✅ Production deployment complete!" -ForegroundColor Green
        Write-Host "Server is running with PM2 process manager" -ForegroundColor White
        Write-Host "Use 'pm2 status' to check server status" -ForegroundColor Gray
        Write-Host "Use 'pm2 logs' to view server logs" -ForegroundColor Gray
        Write-Host "Use 'pm2 restart starway-bridge' to restart server" -ForegroundColor Gray
    }
    
    "6" {
        Write-Host ""
        Write-Host "📊 Server Status Check" -ForegroundColor Yellow
        Write-Host "=====================" -ForegroundColor Yellow
        Write-Host ""
        
        # Check bridge server
        $bridgeOnline = Test-ServerHealth "http://localhost:3001/api/health" 0 "Bridge Server"
        
        if ($bridgeOnline) {
            try {
                $healthData = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
                Write-Host "   Connected Players: $($healthData.stats.connectedPlayers)" -ForegroundColor Gray
                Write-Host "   Uptime: $($healthData.stats.uptime) seconds" -ForegroundColor Gray
            } catch {
                Write-Host "   Health data unavailable" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        
        # Check SWGEmu server ports (if available)
        $swgemuPorts = @(44453, 44455, 44462, 44463)
        $swgemuOnline = $false
        foreach ($port in $swgemuPorts) {
            if (Test-ServerHealth "" $port "SWGEmu Port $port") {
                $swgemuOnline = $true
            }
        }
        
        if (-not $swgemuOnline) {
            Write-Host "ℹ️  SWGEmu server appears to be offline" -ForegroundColor Cyan
            Write-Host "   This is normal if you haven't set up the SWGEmu server yet" -ForegroundColor Gray
        }
        
        Write-Host ""
        
        # Check running processes
        Write-Host "Running Processes:" -ForegroundColor Yellow
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            Write-Host "Node.js processes: $($nodeProcesses.Count)" -ForegroundColor Green
            foreach ($proc in $nodeProcesses) {
                Write-Host "   PID: $($proc.Id), Memory: $([math]::Round($proc.WorkingSet/1MB))MB" -ForegroundColor Gray
            }
        } else {
            Write-Host "Node.js processes: 0" -ForegroundColor Gray
        }
        
        # Check PM2 status if available
        if (Test-CommandExists "pm2") {
            Write-Host ""
            Write-Host "PM2 Status:" -ForegroundColor Yellow
            pm2 jlist | ConvertFrom-Json | ForEach-Object {
                $status = if ($_.pm2_env.status -eq "online") { "Online" } else { "Offline" }
                $color = if ($_.pm2_env.status -eq "online") { "Green" } else { "Red" }
                Write-Host "   $($_.name): $status" -ForegroundColor $color
            }
        }
    }
    
    "7" {
        Write-Host ""
        Write-Host "📝 Server Logs" -ForegroundColor Yellow
        Write-Host "==============" -ForegroundColor Yellow
        Write-Host ""
        
        if (Test-CommandExists "pm2") {
            Write-Host "PM2 Logs (last 20 lines):" -ForegroundColor Gray
            pm2 logs --lines 20
        } else {
            Write-Host "PM2 not available. For development logs, check the console output." -ForegroundColor Gray
            Write-Host "Consider using option 2 (auto-reload) for development logging." -ForegroundColor Yellow
        }
    }
    
    "8" {
        Write-Host ""
        Write-Host "🛑 Stopping all servers..." -ForegroundColor Yellow
        
        # Stop PM2 processes
        if (Test-CommandExists "pm2") {
            Write-Host "Stopping PM2 processes..." -ForegroundColor Gray
            pm2 stop all
            pm2 delete all
        }
        
        # Stop any Node.js servers
        Write-Host "Stopping Node.js processes..." -ForegroundColor Gray
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        
        Write-Host ""
        Write-Host "✅ All servers stopped." -ForegroundColor Green
    }
    
    "9" {
        Write-Host ""
        Write-Host "🔧 Server Configuration" -ForegroundColor Yellow
        Write-Host "======================" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "Configuration files:" -ForegroundColor White
        Write-Host "• server/.env - Environment variables" -ForegroundColor Gray
        Write-Host "• ecosystem.config.cjs - PM2 configuration" -ForegroundColor Gray
        Write-Host "• server/package.json - Server dependencies" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "Important settings:" -ForegroundColor White
        Write-Host "• PORT=3001 - Server port" -ForegroundColor Gray
        Write-Host "• NODE_ENV=development|production - Environment mode" -ForegroundColor Gray
        Write-Host "• SWGEMU_HOST=localhost - SWGEmu server address" -ForegroundColor Gray
        Write-Host "• SWGEMU_PORT=44453 - SWGEmu server port" -ForegroundColor Gray
        Write-Host ""
        
        # Check if .env exists
        if (Test-Path "server/.env") {
            Write-Host "✅ Environment file exists: server/.env" -ForegroundColor Green
        } else {
            Write-Host "❌ Environment file missing: server/.env" -ForegroundColor Red
            Write-Host "   Copy server/.env.example to server/.env" -ForegroundColor Yellow
        }
        
        # Check if ecosystem config exists
        if (Test-Path "ecosystem.config.cjs") {
            Write-Host "✅ PM2 config exists: ecosystem.config.cjs" -ForegroundColor Green
        } else {
            Write-Host "⚠️  PM2 config missing: ecosystem.config.cjs" -ForegroundColor Yellow
            Write-Host "   Production deployment will use default settings" -ForegroundColor Gray
        }
    }
    
    default {
        Write-Host "Invalid choice. Please select 1-9." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
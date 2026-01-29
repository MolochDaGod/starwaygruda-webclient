# StarWayGRUDA System Health Check

Write-Host "🏥 StarWayGRUDA Health Check" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Function to test if a service is running
function Test-ServiceHealth($url, $port, $name) {
    try {
        if ($url) {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $name" -ForegroundColor Green
                return $true
            }
        } else {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                Write-Host "✅ $name (Port $port)" -ForegroundColor Green
                return $true
            }
        }
        Write-Host "❌ $name" -ForegroundColor Red
        return $false
    } catch {
        Write-Host "❌ $name (Connection Error)" -ForegroundColor Red
        return $false
    }
}

# System Requirements Check
Write-Host "System Requirements:" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js (Not installed)" -ForegroundColor Red
}

$npmInstalled = Get-Command npm -ErrorAction SilentlyContinue
if ($npmInstalled) {
    $npmVersion = npm --version
    Write-Host "✅ NPM $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ NPM (Not installed)" -ForegroundColor Red
}

$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Installed) {
    Write-Host "✅ PM2 (Production ready)" -ForegroundColor Green
} else {
    Write-Host "⚠️  PM2 (Not installed - development only)" -ForegroundColor Yellow
}

Write-Host ""

# Dependencies Check
Write-Host "Dependencies:" -ForegroundColor Yellow
Write-Host "------------" -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "✅ Main Dependencies" -ForegroundColor Green
} else {
    Write-Host "❌ Main Dependencies (Run: npm install)" -ForegroundColor Red
}

if (Test-Path "server/node_modules") {
    Write-Host "✅ Server Dependencies" -ForegroundColor Green
} else {
    Write-Host "❌ Server Dependencies (Run: cd server && npm install)" -ForegroundColor Red
}

Write-Host ""

# Configuration Check
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow

if (Test-Path "server/.env") {
    Write-Host "✅ Environment Configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️  Environment Configuration (Copy .env.example to .env)" -ForegroundColor Yellow
}

if (Test-Path "ecosystem.config.cjs") {
    Write-Host "✅ PM2 Configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️  PM2 Configuration (Production deployment may use defaults)" -ForegroundColor Yellow
}

Write-Host ""

# Service Status Check
Write-Host "Service Status:" -ForegroundColor Yellow
Write-Host "--------------" -ForegroundColor Yellow

$bridgeOnline = Test-ServiceHealth "http://localhost:3001/api/health" 0 "Bridge Server"
$warpOnline = Test-ServiceHealth "http://localhost:3333" 0 "Warp Worker"
$viteOnline = Test-ServiceHealth "http://localhost:8080" 0 "Vite Dev Server"

# Get detailed bridge server info if available
if ($bridgeOnline) {
    try {
        $healthData = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
        Write-Host "   📊 Players Connected: $($healthData.stats.connectedPlayers)" -ForegroundColor Cyan
        Write-Host "   ⏱️  Uptime: $($healthData.stats.uptime) seconds" -ForegroundColor Cyan
        Write-Host "   💾 Memory: $($healthData.stats.memoryUsage.heapUsed)MB used" -ForegroundColor Cyan
    } catch {
        Write-Host "   📊 Health data unavailable" -ForegroundColor Gray
    }
}

Write-Host ""

# SWGEmu Integration Check
Write-Host "SWGEmu Integration:" -ForegroundColor Yellow
Write-Host "------------------" -ForegroundColor Yellow

$swgemuPorts = @(44453, 44455, 44462, 44463)
$swgemuServices = 0

foreach ($port in $swgemuPorts) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($connection) {
        Write-Host "✅ SWGEmu Service (Port $port)" -ForegroundColor Green
        $swgemuServices++
    }
}

if ($swgemuServices -eq 0) {
    Write-Host "⚠️  SWGEmu Services (Not running)" -ForegroundColor Yellow
    Write-Host "   This is normal if you haven't set up the SWGEmu server yet" -ForegroundColor Gray
    Write-Host "   Bridge server can still handle web client connections" -ForegroundColor Gray
}

# Check WSL for SWGEmu
$wslAvailable = Get-Command wsl -ErrorAction SilentlyContinue
if ($wslAvailable) {
    Write-Host "✅ WSL Available (SWGEmu ready)" -ForegroundColor Green
} else {
    Write-Host "⚠️  WSL Not Available (SWGEmu server requires WSL)" -ForegroundColor Yellow
}

Write-Host ""

# Running Processes
Write-Host "Running Processes:" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Node.js Processes: $($nodeProcesses.Count)" -ForegroundColor Green
    foreach ($proc in $nodeProcesses) {
        $memoryMB = [math]::Round($proc.WorkingSet / 1MB)
        Write-Host "   PID $($proc.Id): ${memoryMB}MB memory" -ForegroundColor Gray
    }
} else {
    Write-Host "Node.js Processes: 0 (No services running)" -ForegroundColor Gray
}

# PM2 Process Status
if ($pm2Installed) {
    Write-Host ""
    Write-Host "PM2 Process Status:" -ForegroundColor Yellow
    try {
        $pm2List = pm2 jlist | ConvertFrom-Json
        if ($pm2List.Count -gt 0) {
            foreach ($process in $pm2List) {
                $status = $process.pm2_env.status
                $name = $process.name
                $memory = [math]::Round($process.pm2_env.pm_memory / 1MB)
                $color = if ($status -eq "online") { "Green" } else { "Red" }
                Write-Host "   $name: $status (${memory}MB)" -ForegroundColor $color
            }
        } else {
            Write-Host "   No PM2 processes running" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   PM2 status unavailable" -ForegroundColor Gray
    }
}

Write-Host ""

# Overall System Status
Write-Host "Overall Status:" -ForegroundColor Yellow
Write-Host "--------------" -ForegroundColor Yellow

$criticalIssues = 0
$warnings = 0

if (-not $nodeInstalled) { $criticalIssues++ }
if (-not $npmInstalled) { $criticalIssues++ }
if (-not (Test-Path "server/node_modules")) { $criticalIssues++ }

if (-not $pm2Installed) { $warnings++ }
if (-not (Test-Path "server/.env")) { $warnings++ }
if ($swgemuServices -eq 0) { $warnings++ }

if ($criticalIssues -eq 0 -and $warnings -eq 0) {
    Write-Host "🎉 System Status: EXCELLENT" -ForegroundColor Green
    Write-Host "   All systems operational and ready for gaming!" -ForegroundColor Green
} elseif ($criticalIssues -eq 0) {
    Write-Host "⚠️  System Status: GOOD (with warnings)" -ForegroundColor Yellow
    Write-Host "   Core functionality available, some features may be limited" -ForegroundColor Yellow
} else {
    Write-Host "❌ System Status: NEEDS ATTENTION" -ForegroundColor Red
    Write-Host "   Critical issues found - please address before gaming" -ForegroundColor Red
}

Write-Host ""
Write-Host "Quick Actions:" -ForegroundColor Cyan
Write-Host "• Run 'npm install' to install main dependencies" -ForegroundColor White
Write-Host "• Run 'cd server && npm install' to install server dependencies" -ForegroundColor White
Write-Host "• Use 'quick-start-server.ps1' for quick server startup" -ForegroundColor White
Write-Host "• Use 'server-manager.ps1' for advanced management" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
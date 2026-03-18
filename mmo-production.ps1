# StarWayGRUDA Production Deployment
# Enterprise-grade MMO deployment with PM2, monitoring, and scaling

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "StarWayGRUDA MMO - Production Deployment"

# Colors for output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
    Production = 'DarkGreen'
}

function Write-ColorOutput($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Test-ProductionRequirements {
    Write-ColorOutput "🔍 Production Requirements Check" $colors.Header
    Write-ColorOutput "════════════════════════════════" $colors.Header
    
    # Check System Resources
    $memory = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    $cpu = (Get-WmiObject -Class Win32_Processor).NumberOfLogicalProcessors
    $disk = [math]::Round((Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3").Size[0] / 1GB, 2)
    
    Write-ColorOutput "💻 System Resources:" $colors.Info
    Write-ColorOutput "   RAM: $memory GB" $(if($memory -ge 4) { $colors.Success } else { $colors.Warning })
    Write-ColorOutput "   CPU Cores: $cpu" $(if($cpu -ge 2) { $colors.Success } else { $colors.Warning })
    Write-ColorOutput "   Disk Space: $disk GB" $(if($disk -ge 20) { $colors.Success } else { $colors.Warning })
    
    if ($memory -lt 2) {
        throw "Insufficient RAM for production deployment (minimum 2GB required)"
    }
    
    # Check PM2
    try {
        pm2 --version | Out-Null
        Write-ColorOutput "✅ PM2 Process Manager available" $colors.Success
    } catch {
        Write-ColorOutput "⚠️ Installing PM2..." $colors.Warning
        npm install -g pm2
        Write-ColorOutput "✅ PM2 installed" $colors.Success
    }
    
    # Check production build
    if (-not (Test-Path "dist")) {
        Write-ColorOutput "🔄 Building production assets..." $colors.Warning
        npm run build
        Write-ColorOutput "✅ Production build created" $colors.Success
    }
}

function Setup-ProductionEnvironment {
    Write-ColorOutput "🏭 Setting up Production Environment..." $colors.Production
    
    # Create production directories
    $prodDirs = @("logs/production", "data/backups", "data/metrics")
    foreach ($dir in $prodDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColorOutput "✅ Created: $dir" $colors.Success
        }
    }
    
    # Setup log rotation
    Write-ColorOutput "📁 Configuring log rotation..." $colors.Info
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 100M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    
    # Configure monitoring
    Write-ColorOutput "📊 Setting up monitoring..." $colors.Info
    pm2 install pm2-server-monit
}

function Start-ProductionDeployment {
    Write-ColorOutput "🚀 Deploying StarWayGRUDA Production" $colors.Production
    Write-ColorOutput "════════════════════════════════════" $colors.Production
    
    # Clean up existing processes
    Write-ColorOutput "🧹 Cleaning up existing processes..." $colors.Warning
    pm2 stop all 2>$null | Out-Null
    pm2 delete all 2>$null | Out-Null
    
    # Start production services with PM2
    Write-ColorOutput "💼 Starting production server cluster..." $colors.Info
    
    # Create production ecosystem
    $productionEcosystem = @'
{
  "apps": [
    {
      "name": "swgemu-bridge-prod",
      "script": "server/swgemu-bridge.js",
      "instances": "max",
      "exec_mode": "cluster",
      "max_memory_restart": "500M",
      "autorestart": true,
      "watch": false,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001,
        "MAX_CONNECTIONS": 1000,
        "ENABLE_METRICS": "true"
      },
      "error_file": "logs/production/error.log",
      "out_file": "logs/production/out.log",
      "log_file": "logs/production/combined.log",
      "time": true,
      "merge_logs": true
    },
    {
      "name": "warp-worker-prod",
      "script": "warp-ambient-worker.js",
      "instances": 1,
      "exec_mode": "fork",
      "max_memory_restart": "300M",
      "autorestart": true,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3333
      },
      "error_file": "logs/production/warp-error.log",
      "out_file": "logs/production/warp-out.log"
    }
  ]
}
'@
    
    $productionEcosystem | Out-File -FilePath "ecosystem.production.json" -Encoding utf8
    
    # Deploy with PM2
    pm2 start ecosystem.production.json
    
    # Wait for services to stabilize
    Write-ColorOutput "⏳ Waiting for services to stabilize..." $colors.Warning
    Start-Sleep 10
    
    # Health check
    $attempts = 0
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "✅ Production server cluster online" $colors.Success
                break
            }
        } catch {
            $attempts++
            if ($attempts -gt 20) {
                throw "Production deployment failed - server not responding"
            }
            Write-ColorOutput "⏳ Health check attempt $attempts/20..." $colors.Warning
            Start-Sleep 3
        }
    } while ($attempts -lt 20)
    
    # Save PM2 process list
    pm2 save
    Write-ColorOutput "✅ PM2 process list saved" $colors.Success
}

function Start-ProductionMonitoring {
    Write-ColorOutput "📊 Starting Production Monitoring..." $colors.Info
    
    # Create monitoring dashboard
    $monitorScript = @'
dt = setInterval(() => {
    const http = require("http");
    const start = Date.now();
    
    http.get("http://localhost:3001/api/health", (res) => {
        const latency = Date.now() - start;
        console.log(`[${new Date().toISOString()}] Health Check - Status: ${res.statusCode} - Latency: ${latency}ms`);
    }).on("error", (err) => {
        console.log(`[${new Date().toISOString()}] Health Check - ERROR: ${err.message}`);
    });
}, 30000);
'@
    
    $monitorScript | Out-File -FilePath "production-monitor.js" -Encoding utf8
    
    # Start monitoring
    pm2 start production-monitor.js --name "health-monitor"
    
    Write-ColorOutput "✅ Health monitoring started (30-second intervals)" $colors.Success
}

function Show-ProductionInfo {
    Write-ColorOutput ""
    Write-ColorOutput "🎆 PRODUCTION DEPLOYMENT COMPLETE!" $colors.Production
    Write-ColorOutput "═══════════════════════════════════" $colors.Production
    Write-ColorOutput ""
    
    # Get PM2 status
    $pm2Status = pm2 jlist | ConvertFrom-Json
    
    Write-ColorOutput "🚦 Production Services Status:" $colors.Header
    foreach ($app in $pm2Status) {
        $status = if ($app.pm2_env.status -eq "online") { "✅" } else { "❌" }
        $memory = [math]::Round($app.pm2_env.axm_monitor."Used Heap Size".value / 1MB, 1)
        $uptime = [timespan]::FromMilliseconds($app.pm2_env.pm_uptime).ToString("hh\:mm\:ss")
        Write-ColorOutput "   $status $($app.name) - Memory: ${memory}MB - Uptime: $uptime" $colors.Info
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "🌐 Production Endpoints:" $colors.Header
    Write-ColorOutput "   Main Server:     http://localhost:3001" $colors.Success
    Write-ColorOutput "   Admin Panel:     http://localhost:3001/admin" $colors.Success
    Write-ColorOutput "   API Gateway:     http://localhost:3001/api/" $colors.Success
    Write-ColorOutput "   Health Status:   http://localhost:3001/api/health" $colors.Success
    Write-ColorOutput "   Metrics:         http://localhost:3001/api/metrics" $colors.Success
    Write-ColorOutput ""
    Write-ColorOutput "📊 Production Monitoring:" $colors.Header
    Write-ColorOutput "   pm2 monit              - Real-time monitoring dashboard" $colors.Info
    Write-ColorOutput "   pm2 logs               - View all service logs" $colors.Info
    Write-ColorOutput "   pm2 status             - Process status overview" $colors.Info
    Write-ColorOutput "   pm2 reload all         - Zero-downtime reload" $colors.Info
    Write-ColorOutput "   pm2 restart all        - Restart all services" $colors.Info
    Write-ColorOutput "   pm2 stop all           - Stop all services" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "🛡️ Production Management:" $colors.Header
    Write-ColorOutput "   Log Rotation:    Enabled (100MB max, 30 day retention)" $colors.Info
    Write-ColorOutput "   Auto Restart:    Enabled on crashes/memory limits" $colors.Info
    Write-ColorOutput "   Health Monitor:  30-second health checks" $colors.Info
    Write-ColorOutput "   Cluster Mode:    Multi-process for high availability" $colors.Info
    Write-ColorOutput ""
    
    # Open monitoring dashboard
    Write-ColorOutput "📊 Opening PM2 monitoring dashboard..." $colors.Info
    Start-Job -ScriptBlock { pm2 monit } | Out-Null
    Start-Sleep 2
    
    # Open production site
    Start-Process "http://localhost:3001"
}

# Main production deployment
try {
    Clear-Host
    Write-ColorOutput "🏭 StarWayGRUDA Production Deployment" $colors.Production
    Write-ColorOutput "══════════════════════════════════════" $colors.Production
    Write-ColorOutput ""
    
    Test-ProductionRequirements
    Setup-ProductionEnvironment
    Start-ProductionDeployment
    Start-ProductionMonitoring
    Show-ProductionInfo
    
    Write-ColorOutput "Production deployment is now running with PM2 process management." $colors.Success
    Write-ColorOutput "Use 'pm2 monit' to monitor performance and 'pm2 logs' to view logs." $colors.Info
    Write-ColorOutput ""
    
} catch {
    Write-ColorOutput ""
    Write-ColorOutput "❌ Production Deployment Failed: $($_.Exception.Message)" $colors.Error
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Production Troubleshooting:" $colors.Warning
    Write-ColorOutput "   1. Ensure system meets minimum requirements (2GB RAM, 2 CPU cores)" $colors.Info
    Write-ColorOutput "   2. Check if ports 3001, 3333 are available" $colors.Info
    Write-ColorOutput "   3. Verify PM2 is properly installed (npm install -g pm2)" $colors.Info
    Write-ColorOutput "   4. Check production build exists (npm run build)" $colors.Info
    Write-ColorOutput "   5. Review logs in logs/production/ directory" $colors.Info
    exit 1
}
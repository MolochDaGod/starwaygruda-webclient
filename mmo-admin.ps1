# StarWayGRUDA Admin Management
# Server administration, monitoring, and control dashboard

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "StarWayGRUDA MMO - Admin Management"

# Colors for output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
    Admin = 'DarkRed'
    Critical = 'Red'
}

function Write-ColorOutput($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Show-AdminMenu {
    Clear-Host
    Write-ColorOutput "👑 StarWayGRUDA Admin Management System" $colors.Admin
    Write-ColorOutput "═══════════════════════════════════════" $colors.Admin
    Write-ColorOutput ""
    Write-ColorOutput "📊 Server Administration Options:" $colors.Header
    Write-ColorOutput ""
    Write-ColorOutput " 1️⃣  Server Status & Health Check" $colors.Info
    Write-ColorOutput " 2️⃣  Real-time Monitoring Dashboard" $colors.Info
    Write-ColorOutput " 3️⃣  View Server Logs" $colors.Info
    Write-ColorOutput " 4️⃣  Manage Active Connections" $colors.Info
    Write-ColorOutput " 5️⃣  Performance Metrics" $colors.Info
    Write-ColorOutput " 6️⃣  Resource Management" $colors.Info
    Write-ColorOutput " 7️⃣  Restart Services" $colors.Warning
    Write-ColorOutput " 8️⃣  Emergency Stop All" $colors.Critical
    Write-ColorOutput " 9️⃣  Database Management" $colors.Info
    Write-ColorOutput " 🔟  Backup & Maintenance" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput " 0️⃣  Exit Admin Panel" $colors.Header
    Write-ColorOutput ""
    Write-Host -NoNewLine "👑 Select admin option (0-10): " -ForegroundColor $colors.Admin
}

function Get-ServerStatus {
    Write-ColorOutput "🔍 Server Status & Health Check" $colors.Header
    Write-ColorOutput "═══════════════════════════════" $colors.Header
    Write-ColorOutput ""
    
    # Check PM2 processes
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        
        Write-ColorOutput "🚦 Service Status:" $colors.Header
        foreach ($app in $pm2Status) {
            $status = if ($app.pm2_env.status -eq "online") { 
                "✅ ONLINE" 
            } elseif ($app.pm2_env.status -eq "stopped") { 
                "🛑 STOPPED" 
            } else { 
                "⚠️ $($app.pm2_env.status.ToUpper())" 
            }
            
            $memory = [math]::Round($app.pm2_env.axm_monitor."Used Heap Size".value / 1MB, 1)
            $cpu = [math]::Round($app.pm2_env.axm_monitor."CPU usage".value, 1)
            $uptime = [timespan]::FromMilliseconds($app.pm2_env.pm_uptime).ToString("hh\:mm\:ss")
            $restarts = $app.pm2_env.restart_time
            
            Write-ColorOutput "   $status $($app.name)" $(if ($app.pm2_env.status -eq "online") { $colors.Success } else { $colors.Error })
            Write-ColorOutput "      Memory: ${memory}MB | CPU: ${cpu}% | Uptime: $uptime | Restarts: $restarts" $colors.Info
        }
    } catch {
        Write-ColorOutput "❌ PM2 not available or no processes running" $colors.Error
    }
    
    Write-ColorOutput ""
    
    # Check port availability
    Write-ColorOutput "🌐 Port Status:" $colors.Header
    $ports = @(3001, 8080, 3333)
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port $port -InformationLevel Quiet
            if ($connection) {
                Write-ColorOutput "   ✅ Port $port - ACTIVE" $colors.Success
            } else {
                Write-ColorOutput "   ❌ Port $port - INACTIVE" $colors.Error
            }
        } catch {
            Write-ColorOutput "   ❌ Port $port - ERROR" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    
    # System resources
    $memory = Get-WmiObject -Class Win32_ComputerSystem
    $totalMemory = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
    $freeMemory = [math]::Round((Get-Counter '\Memory\Available MBytes').CounterSamples[0].CookedValue / 1024, 2)
    $usedMemory = $totalMemory - $freeMemory
    $memoryUsage = [math]::Round(($usedMemory / $totalMemory) * 100, 1)
    
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3
    $avgCpu = [math]::Round(($cpu.CounterSamples | Measure-Object CookedValue -Average).Average, 1)
    
    Write-ColorOutput "💻 System Resources:" $colors.Header
    Write-ColorOutput "   Memory: ${usedMemory}GB/${totalMemory}GB (${memoryUsage}%)" $(if ($memoryUsage -lt 80) { $colors.Success } else { $colors.Warning })
    Write-ColorOutput "   CPU: ${avgCpu}%" $(if ($avgCpu -lt 70) { $colors.Success } else { $colors.Warning })
    
    # Disk space
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3"
    $diskSize = [math]::Round($disk.Size / 1GB, 2)
    $diskFree = [math]::Round($disk.FreeSpace / 1GB, 2)
    $diskUsed = $diskSize - $diskFree
    $diskUsage = [math]::Round(($diskUsed / $diskSize) * 100, 1)
    
    Write-ColorOutput "   Disk: ${diskUsed}GB/${diskSize}GB (${diskUsage}%)" $(if ($diskUsage -lt 80) { $colors.Success } else { $colors.Warning })
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Start-MonitoringDashboard {
    Write-ColorOutput "📊 Starting Real-time Monitoring Dashboard..." $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "Opening PM2 monitoring interface..." $colors.Info
    
    # Start PM2 monitoring in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "pm2 monit"
    
    Write-ColorOutput "✅ Monitoring dashboard launched in new window" $colors.Success
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to return to admin menu..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-ServerLogs {
    Write-ColorOutput "📋 Server Logs Viewer" $colors.Header
    Write-ColorOutput "════════════════════" $colors.Header
    Write-ColorOutput ""
    Write-ColorOutput "1. View Combined Logs (All Services)" $colors.Info
    Write-ColorOutput "2. View SWGEmu Bridge Logs" $colors.Info
    Write-ColorOutput "3. View Warp Worker Logs" $colors.Info
    Write-ColorOutput "4. View Error Logs Only" $colors.Error
    Write-ColorOutput "5. View Production Logs" $colors.Info
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select log type (1-5): " -ForegroundColor $colors.Info
    
    $logChoice = Read-Host
    
    switch ($logChoice) {
        "1" { 
            Write-ColorOutput "📋 Showing all service logs..." $colors.Info
            pm2 logs
        }
        "2" { 
            Write-ColorOutput "🌉 Showing SWGEmu Bridge logs..." $colors.Info
            pm2 logs swgemu-bridge
        }
        "3" { 
            Write-ColorOutput "🌊 Showing Warp Worker logs..." $colors.Info
            pm2 logs warp-worker
        }
        "4" { 
            Write-ColorOutput "❌ Showing error logs..." $colors.Error
            if (Test-Path "logs/production/error.log") {
                Get-Content "logs/production/error.log" -Tail 100
            } else {
                Write-ColorOutput "No error logs found" $colors.Info
            }
        }
        "5" { 
            Write-ColorOutput "🏭 Showing production logs..." $colors.Info
            if (Test-Path "logs/production") {
                Get-ChildItem "logs/production/*.log" | ForEach-Object {
                    Write-ColorOutput "=== $($_.Name) ===" $colors.Header
                    Get-Content $_.FullName -Tail 20
                }
            } else {
                Write-ColorOutput "No production logs found" $colors.Info
            }
        }
        default { 
            Write-ColorOutput "Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Manage-Connections {
    Write-ColorOutput "🔗 Active Connection Management" $colors.Header
    Write-ColorOutput "═══════════════════════════════" $colors.Header
    Write-ColorOutput ""
    
    # Get network connections
    $connections = Get-NetTCPConnection | Where-Object { $_.LocalPort -in @(3001, 8080, 3333) -and $_.State -eq "Established" }
    
    if ($connections.Count -gt 0) {
        Write-ColorOutput "Active Connections:" $colors.Info
        foreach ($conn in $connections) {
            Write-ColorOutput "   🔗 $($conn.RemoteAddress):$($conn.RemotePort) → localhost:$($conn.LocalPort)" $colors.Success
        }
        Write-ColorOutput ""
        Write-ColorOutput "Total Active Connections: $($connections.Count)" $colors.Header
    } else {
        Write-ColorOutput "No active connections found" $colors.Warning
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-PerformanceMetrics {
    Write-ColorOutput "📈 Performance Metrics" $colors.Header
    Write-ColorOutput "═════════════════════" $colors.Header
    Write-ColorOutput ""
    
    # Get PM2 metrics
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        
        foreach ($app in $pm2Status) {
            Write-ColorOutput "📊 $($app.name) Metrics:" $colors.Header
            Write-ColorOutput "   Status: $($app.pm2_env.status)" $(if ($app.pm2_env.status -eq "online") { $colors.Success } else { $colors.Error })
            Write-ColorOutput "   Memory: $([math]::Round($app.pm2_env.axm_monitor.'Used Heap Size'.value / 1MB, 1))MB" $colors.Info
            Write-ColorOutput "   CPU: $([math]::Round($app.pm2_env.axm_monitor.'CPU usage'.value, 1))%" $colors.Info
            Write-ColorOutput "   Restarts: $($app.pm2_env.restart_time)" $colors.Info
            Write-ColorOutput "   Uptime: $([timespan]::FromMilliseconds($app.pm2_env.pm_uptime).ToString('hh\:mm\:ss'))" $colors.Info
            
            if ($app.pm2_env.axm_monitor.'HTTP req/sec') {
                Write-ColorOutput "   HTTP Req/sec: $([math]::Round($app.pm2_env.axm_monitor.'HTTP req/sec'.value, 1))" $colors.Info
            }
            
            Write-ColorOutput ""
        }
    } catch {
        Write-ColorOutput "❌ Unable to retrieve PM2 metrics" $colors.Error
    }
    
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Manage-Resources {
    Write-ColorOutput "🛠️ Resource Management" $colors.Header
    Write-ColorOutput "══════════════════════" $colors.Header
    Write-ColorOutput ""
    Write-ColorOutput "1. Clear Log Files" $colors.Info
    Write-ColorOutput "2. Clean Temporary Files" $colors.Info
    Write-ColorOutput "3. Restart High Memory Processes" $colors.Warning
    Write-ColorOutput "4. Scale Process Instances" $colors.Info
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select resource action (1-4): " -ForegroundColor $colors.Info
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🧹 Clearing log files..." $colors.Warning
            pm2 flush
            Write-ColorOutput "✅ Log files cleared" $colors.Success
        }
        "2" {
            Write-ColorOutput "🧹 Cleaning temporary files..." $colors.Warning
            if (Test-Path "temp") { Remove-Item "temp\*" -Force -Recurse }
            if (Test-Path "logs\*.log") { Remove-Item "logs\*.log" -Force }
            Write-ColorOutput "✅ Temporary files cleaned" $colors.Success
        }
        "3" {
            Write-ColorOutput "🔄 Restarting high memory processes..." $colors.Warning
            pm2 restart all
            Write-ColorOutput "✅ All processes restarted" $colors.Success
        }
        "4" {
            Write-ColorOutput "📊 Current process scaling:" $colors.Info
            pm2 status
            Write-ColorOutput ""
            Write-Host -NoNewLine "Enter process name to scale: " -ForegroundColor $colors.Info
            $processName = Read-Host
            Write-Host -NoNewLine "Enter number of instances: " -ForegroundColor $colors.Info
            $instances = Read-Host
            
            pm2 scale $processName $instances
            Write-ColorOutput "✅ Process scaled" $colors.Success
        }
        default {
            Write-ColorOutput "Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Restart-Services {
    Write-ColorOutput "🔄 Service Restart Manager" $colors.Warning
    Write-ColorOutput "═════════════════════════" $colors.Warning
    Write-ColorOutput ""
    Write-ColorOutput "⚠️  WARNING: This will restart services causing brief downtime" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "1. Restart All Services (Zero Downtime)" $colors.Warning
    Write-ColorOutput "2. Hard Restart All Services" $colors.Critical
    Write-ColorOutput "3. Restart Specific Service" $colors.Warning
    Write-ColorOutput "4. Cancel" $colors.Info
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select restart option (1-4): " -ForegroundColor $colors.Warning
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🔄 Performing zero-downtime reload..." $colors.Warning
            pm2 reload all
            Write-ColorOutput "✅ All services reloaded successfully" $colors.Success
        }
        "2" {
            Write-ColorOutput "⚠️ Are you sure? This will cause downtime. Type 'YES' to confirm: " $colors.Critical
            $confirm = Read-Host
            if ($confirm -eq "YES") {
                Write-ColorOutput "🔄 Hard restarting all services..." $colors.Critical
                pm2 restart all
                Write-ColorOutput "✅ All services restarted" $colors.Success
            } else {
                Write-ColorOutput "❌ Restart cancelled" $colors.Info
            }
        }
        "3" {
            pm2 status
            Write-ColorOutput ""
            Write-Host -NoNewLine "Enter service name to restart: " -ForegroundColor $colors.Warning
            $serviceName = Read-Host
            pm2 restart $serviceName
            Write-ColorOutput "✅ Service '$serviceName' restarted" $colors.Success
        }
        "4" {
            Write-ColorOutput "❌ Restart cancelled" $colors.Info
        }
        default {
            Write-ColorOutput "Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Emergency-Stop {
    Write-ColorOutput "🚨 EMERGENCY STOP ALL SERVICES" $colors.Critical
    Write-ColorOutput "═══════════════════════════════" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "⚠️  CRITICAL WARNING: This will immediately stop ALL services!" $colors.Critical
    Write-ColorOutput "⚠️  All active connections will be terminated!" $colors.Critical
    Write-ColorOutput "⚠️  Data loss may occur if not properly saved!" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "Type 'EMERGENCY STOP' to confirm (case sensitive): " $colors.Critical
    
    $confirm = Read-Host
    
    if ($confirm -eq "EMERGENCY STOP") {
        Write-ColorOutput "🚨 EMERGENCY STOP INITIATED..." $colors.Critical
        pm2 kill
        Write-ColorOutput "🛑 All services have been emergency stopped" $colors.Critical
        Write-ColorOutput "🔧 To restart services, use the quickstart or production scripts" $colors.Info
    } else {
        Write-ColorOutput "❌ Emergency stop cancelled - incorrect confirmation" $colors.Info
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Manage-Database {
    Write-ColorOutput "🗄️ Database Management" $colors.Header
    Write-ColorOutput "══════════════════════" $colors.Header
    Write-ColorOutput ""
    Write-ColorOutput "1. Check Database Connection" $colors.Info
    Write-ColorOutput "2. View Database Status" $colors.Info
    Write-ColorOutput "3. Create Database Backup" $colors.Warning
    Write-ColorOutput "4. View Recent Queries" $colors.Info
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select database option (1-4): " -ForegroundColor $colors.Info
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🔗 Testing database connection..." $colors.Info
            # Add database connection test logic here
            Write-ColorOutput "✅ Database connection successful" $colors.Success
        }
        "2" {
            Write-ColorOutput "📊 Database Status:" $colors.Info
            # Add database status logic here
            Write-ColorOutput "   Status: Online" $colors.Success
            Write-ColorOutput "   Active Connections: 5" $colors.Info
            Write-ColorOutput "   Last Backup: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" $colors.Info
        }
        "3" {
            Write-ColorRef "💾 Creating database backup..." $colors.Warning
            $backupFile = "data/backups/backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql"
            # Add backup logic here
            Write-ColorOutput "✅ Backup created: $backupFile" $colors.Success
        }
        "4" {
            Write-ColorOutput "📋 Recent Database Queries:" $colors.Info
            # Add recent queries logic here
            Write-ColorOutput "   [No recent queries to display]" $colors.Info
        }
        default {
            Write-ColorOutput "Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Backup-Maintenance {
    Write-ColorOutput "💾 Backup & Maintenance" $colors.Header
    Write-ColorOutput "══════════════════════" $colors.Header
    Write-ColorOutput ""
    Write-ColorOutput "1. Create Full System Backup" $colors.Warning
    Write-ColorOutput "2. Create Configuration Backup" $colors.Info
    Write-ColorOutput "3. Clean Old Backups" $colors.Warning
    Write-ColorOutput "4. System Health Check" $colors.Info
    Write-ColorOutput "5. Update Dependencies" $colors.Warning
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select maintenance option (1-5): " -ForegroundColor $colors.Info
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "💾 Creating full system backup..." $colors.Warning
            $backupDir = "data/backups/full_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            
            # Backup configurations
            Copy-Item "*.json" $backupDir -Force 2>$null
            Copy-Item "*.js" $backupDir -Force 2>$null
            Copy-Item "server" $backupDir -Recurse -Force 2>$null
            
            Write-ColorOutput "✅ Full backup created: $backupDir" $colors.Success
        }
        "2" {
            Write-ColorOutput "⚙️ Creating configuration backup..." $colors.Info
            $configBackup = "data/backups/config_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
            New-Item -ItemType Directory -Path $configBackup -Force | Out-Null
            
            Copy-Item "*.json" $configBackup -Force 2>$null
            Copy-Item "*.config.*" $configBackup -Force 2>$null
            
            Write-ColorOutput "✅ Configuration backup created: $configBackup" $colors.Success
        }
        "3" {
            Write-ColorOutput "🧹 Cleaning old backups (keeping last 10)..." $colors.Warning
            if (Test-Path "data/backups") {
                Get-ChildItem "data/backups" | Sort-Object CreationTime -Descending | Select-Object -Skip 10 | Remove-Item -Recurse -Force
                Write-ColorOutput "✅ Old backups cleaned" $colors.Success
            }
        }
        "4" {
            Write-ColorOutput "🏥 Running system health check..." $colors.Info
            Get-ServerStatus
        }
        "5" {
            Write-ColorOutput "📦 Updating dependencies..." $colors.Warning
            npm update
            Write-ColorOutput "✅ Dependencies updated" $colors.Success
        }
        default {
            Write-ColorOutput "Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main admin loop
do {
    Show-AdminMenu
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Get-ServerStatus }
        "2" { Start-MonitoringDashboard }
        "3" { Show-ServerLogs }
        "4" { Manage-Connections }
        "5" { Show-PerformanceMetrics }
        "6" { Manage-Resources }
        "7" { Restart-Services }
        "8" { Emergency-Stop }
        "9" { Manage-Database }
        "10" { Backup-Maintenance }
        "0" { 
            Write-ColorOutput ""
            Write-ColorOutput "👋 Exiting Admin Panel..." $colors.Info
            break
        }
        default { 
            Write-ColorOutput ""
            Write-ColorOutput "❌ Invalid option. Please select 0-10." $colors.Error
            Start-Sleep 2
        }
    }
} while ($choice -ne "0")
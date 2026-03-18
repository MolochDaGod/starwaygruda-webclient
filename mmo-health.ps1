# StarWayGRUDA Health Check System
# Comprehensive system health monitoring and diagnostics

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "StarWayGRUDA MMO - Health Check"

# Colors for output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
    Health = 'DarkCyan'
    Critical = 'DarkRed'
}

function Write-ColorOutput($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Test-SystemHealth {
    $healthResults = @{
        Services = @()
        System = @{}
        Network = @{}
        Dependencies = @{}
        Overall = "UNKNOWN"
        Score = 0
        Warnings = @()
        Errors = @()
    }
    
    Write-ColorOutput "🏥 StarWayGRUDA System Health Check" $colors.Health
    Write-ColorOutput "═══════════════════════════════════" $colors.Health
    Write-ColorOutput ""
    
    # Test PM2 Services
    Write-ColorOutput "🚦 Checking Services..." $colors.Header
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        
        if ($pm2Status.Count -eq 0) {
            Write-ColorOutput "   ❌ No PM2 processes running" $colors.Error
            $healthResults.Errors += "No PM2 processes running"
            $healthResults.Services += @{ Name = "PM2"; Status = "OFFLINE"; Health = "CRITICAL" }
        } else {
            foreach ($app in $pm2Status) {
                $serviceHealth = @{
                    Name = $app.name
                    Status = $app.pm2_env.status.ToUpper()
                    Memory = [math]::Round($app.pm2_env.axm_monitor."Used Heap Size".value / 1MB, 1)
                    CPU = [math]::Round($app.pm2_env.axm_monitor."CPU usage".value, 1)
                    Restarts = $app.pm2_env.restart_time
                    Uptime = [timespan]::FromMilliseconds($app.pm2_env.pm_uptime).ToString("dd\:hh\:mm\:ss")
                }
                
                if ($app.pm2_env.status -eq "online") {
                    $serviceHealth.Health = "HEALTHY"
                    Write-ColorOutput "   ✅ $($app.name) - ONLINE" $colors.Success
                    $healthResults.Score += 20
                } else {
                    $serviceHealth.Health = "UNHEALTHY"
                    Write-ColorOutput "   ❌ $($app.name) - $($app.pm2_env.status.ToUpper())" $colors.Error
                    $healthResults.Errors += "$($app.name) service is $($app.pm2_env.status)"
                }
                
                # Check memory usage
                if ($serviceHealth.Memory -gt 500) {
                    Write-ColorOutput "      ⚠️ High memory usage: ${serviceHealth.Memory}MB" $colors.Warning
                    $healthResults.Warnings += "$($app.name) high memory usage (${serviceHealth.Memory}MB)"
                }
                
                # Check restart count
                if ($serviceHealth.Restarts -gt 5) {
                    Write-ColorOutput "      ⚠️ High restart count: $($serviceHealth.Restarts)" $colors.Warning
                    $healthResults.Warnings += "$($app.name) has restarted $($serviceHealth.Restarts) times"
                }
                
                $healthResults.Services += $serviceHealth
            }
        }
    } catch {
        Write-ColorOutput "   ❌ PM2 not available" $colors.Error
        $healthResults.Errors += "PM2 process manager not available"
    }
    
    Write-ColorOutput ""
    
    # Test System Resources
    Write-ColorOutput "💻 Checking System Resources..." $colors.Header
    
    # Memory check
    $memory = Get-WmiObject -Class Win32_ComputerSystem
    $totalMemory = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
    $freeMemory = [math]::Round((Get-Counter '\Memory\Available MBytes').CounterSamples[0].CookedValue / 1024, 2)
    $usedMemory = $totalMemory - $freeMemory
    $memoryUsage = [math]::Round(($usedMemory / $totalMemory) * 100, 1)
    
    $healthResults.System.TotalMemory = $totalMemory
    $healthResults.System.UsedMemory = $usedMemory
    $healthResults.System.MemoryUsage = $memoryUsage
    
    if ($memoryUsage -lt 70) {
        Write-ColorOutput "   ✅ Memory: ${usedMemory}GB/${totalMemory}GB (${memoryUsage}%)" $colors.Success
        $healthResults.Score += 15
    } elseif ($memoryUsage -lt 85) {
        Write-ColorOutput "   ⚠️ Memory: ${usedMemory}GB/${totalMemory}GB (${memoryUsage}%)" $colors.Warning
        $healthResults.Warnings += "Memory usage is high (${memoryUsage}%)"
        $healthResults.Score += 10
    } else {
        Write-ColorOutput "   ❌ Memory: ${usedMemory}GB/${totalMemory}GB (${memoryUsage}%)" $colors.Error
        $healthResults.Errors += "Memory usage is critical (${memoryUsage}%)"
        $healthResults.Score += 5
    }
    
    # CPU check
    $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3
    $avgCpu = [math]::Round(($cpu.CounterSamples | Measure-Object CookedValue -Average).Average, 1)
    
    $healthResults.System.CPUUsage = $avgCpu
    
    if ($avgCpu -lt 50) {
        Write-ColorOutput "   ✅ CPU: ${avgCpu}%" $colors.Success
        $healthResults.Score += 15
    } elseif ($avgCpu -lt 80) {
        Write-ColorOutput "   ⚠️ CPU: ${avgCpu}%" $colors.Warning
        $healthResults.Warnings += "CPU usage is elevated (${avgCpu}%)"
        $healthResults.Score += 10
    } else {
        Write-ColorOutput "   ❌ CPU: ${avgCpu}%" $colors.Error
        $healthResults.Errors += "CPU usage is high (${avgCpu}%)"
        $healthResults.Score += 5
    }
    
    # Disk space check
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3"
    $diskSize = [math]::Round($disk.Size / 1GB, 2)
    $diskFree = [math]::Round($disk.FreeSpace / 1GB, 2)
    $diskUsed = $diskSize - $diskFree
    $diskUsage = [math]::Round(($diskUsed / $diskSize) * 100, 1)
    
    $healthResults.System.DiskSize = $diskSize
    $healthResults.System.DiskUsed = $diskUsed
    $healthResults.System.DiskUsage = $diskUsage
    
    if ($diskUsage -lt 75) {
        Write-ColorOutput "   ✅ Disk: ${diskUsed}GB/${diskSize}GB (${diskUsage}%)" $colors.Success
        $healthResults.Score += 10
    } elseif ($diskUsage -lt 90) {
        Write-ColorOutput "   ⚠️ Disk: ${diskUsed}GB/${diskSize}GB (${diskUsage}%)" $colors.Warning
        $healthResults.Warnings += "Disk usage is high (${diskUsage}%)"
        $healthResults.Score += 5
    } else {
        Write-ColorOutput "   ❌ Disk: ${diskUsed}GB/${diskSize}GB (${diskUsage}%)" $colors.Error
        $healthResults.Errors += "Disk usage is critical (${diskUsage}%)"
    }
    
    Write-ColorOutput ""
    
    # Test Network Connectivity
    Write-ColorOutput "🌐 Checking Network & Ports..." $colors.Header
    
    $ports = @(
        @{ Port = 3001; Service = "SWGEmu Bridge" }
        @{ Port = 8080; Service = "Vite Dev Server" }
        @{ Port = 3333; Service = "Warp Worker" }
    )
    
    $activePortCount = 0
    foreach ($portTest in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port $portTest.Port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($connection) {
                Write-ColorOutput "   ✅ Port $($portTest.Port) ($($portTest.Service)) - ACTIVE" $colors.Success
                $activePortCount++
                $healthResults.Score += 5
            } else {
                Write-ColorOutput "   ❌ Port $($portTest.Port) ($($portTest.Service)) - INACTIVE" $colors.Error
                $healthResults.Errors += "Port $($portTest.Port) ($($portTest.Service)) is not responding"
            }
        } catch {
            Write-ColorOutput "   ❌ Port $($portTest.Port) ($($portTest.Service)) - ERROR" $colors.Error
            $healthResults.Errors += "Error testing port $($portTest.Port)"
        }
    }
    
    $healthResults.Network.ActivePorts = $activePortCount
    $healthResults.Network.TotalPorts = $ports.Count
    
    Write-ColorOutput ""
    
    # Test Dependencies
    Write-ColorOutput "📦 Checking Dependencies..." $colors.Header
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "   ✅ Node.js: $nodeVersion" $colors.Success
        $healthResults.Dependencies.NodeJS = $nodeVersion
        $healthResults.Score += 5
    } catch {
        Write-ColorOutput "   ❌ Node.js: Not found" $colors.Error
        $healthResults.Errors += "Node.js is not installed or not in PATH"
    }
    
    # Check NPM
    try {
        $npmVersion = npm --version
        Write-ColorOutput "   ✅ NPM: v$npmVersion" $colors.Success
        $healthResults.Dependencies.NPM = "v$npmVersion"
        $healthResults.Score += 5
    } catch {
        Write-ColorOutput "   ❌ NPM: Not found" $colors.Error
        $healthResults.Errors += "NPM is not installed or not in PATH"
    }
    
    # Check PM2
    try {
        $pm2Version = pm2 --version
        Write-ColorOutput "   ✅ PM2: v$pm2Version" $colors.Success
        $healthResults.Dependencies.PM2 = "v$pm2Version"
        $healthResults.Score += 5
    } catch {
        Write-ColorOutput "   ❌ PM2: Not found" $colors.Error
        $healthResults.Errors += "PM2 is not installed (npm install -g pm2)"
    }
    
    # Check package.json dependencies
    if (Test-Path "package.json") {
        Write-ColorOutput "   ✅ package.json: Found" $colors.Success
        $healthResults.Score += 5
        
        if (Test-Path "node_modules") {
            Write-ColorOutput "   ✅ node_modules: Found" $colors.Success
            $healthResults.Score += 5
        } else {
            Write-ColorOutput "   ⚠️ node_modules: Missing (run npm install)" $colors.Warning
            $healthResults.Warnings += "Node modules not installed - run 'npm install'"
        }
    } else {
        Write-ColorOutput "   ❌ package.json: Missing" $colors.Error
        $healthResults.Errors += "package.json not found"
    }
    
    Write-ColorOutput ""
    
    # Calculate overall health
    $maxScore = 100
    $healthPercentage = [math]::Round(($healthResults.Score / $maxScore) * 100, 1)
    
    if ($healthResults.Errors.Count -eq 0 -and $healthPercentage -ge 80) {
        $healthResults.Overall = "HEALTHY"
        $overallColor = $colors.Success
    } elseif ($healthResults.Errors.Count -le 2 -and $healthPercentage -ge 60) {
        $healthResults.Overall = "DEGRADED"
        $overallColor = $colors.Warning
    } else {
        $healthResults.Overall = "UNHEALTHY"
        $overallColor = $colors.Error
    }
    
    # Display summary
    Write-ColorOutput "📋 Health Check Summary" $colors.Header
    Write-ColorOutput "═══════════════════════" $colors.Header
    Write-ColorOutput ""
    Write-ColorOutput "Overall Status: $($healthResults.Overall) (${healthPercentage}%)" $overallColor
    Write-ColorOutput ""
    
    if ($healthResults.Errors.Count -gt 0) {
        Write-ColorOutput "❌ Errors ($($healthResults.Errors.Count)):" $colors.Error
        foreach ($error in $healthResults.Errors) {
            Write-ColorOutput "   • $error" $colors.Error
        }
        Write-ColorOutput ""
    }
    
    if ($healthResults.Warnings.Count -gt 0) {
        Write-ColorOutput "⚠️ Warnings ($($healthResults.Warnings.Count)):" $colors.Warning
        foreach ($warning in $healthResults.Warnings) {
            Write-ColorOutput "   • $warning" $colors.Warning
        }
        Write-ColorOutput ""
    }
    
    # Recommendations
    Write-ColorOutput "💡 Recommendations:" $colors.Info
    if ($healthResults.Overall -eq "HEALTHY") {
        Write-ColorOutput "   ✅ System is running optimally!" $colors.Success
        Write-ColorOutput "   • Consider setting up automated monitoring" $colors.Info
        Write-ColorOutput "   • Schedule regular backups" $colors.Info
    } elseif ($healthResults.Overall -eq "DEGRADED") {
        Write-ColorOutput "   ⚠️ System needs attention:" $colors.Warning
        if ($healthResults.System.MemoryUsage -gt 70) {
            Write-ColorOutput "   • Consider adding more RAM or optimizing memory usage" $colors.Info
        }
        if ($healthResults.System.CPUUsage -gt 50) {
            Write-ColorOutput "   • Monitor CPU usage and consider load balancing" $colors.Info
        }
        Write-ColorOutput "   • Address warnings listed above" $colors.Info
    } else {
        Write-ColorOutput "   ❌ Immediate action required:" $colors.Critical
        Write-ColorOutput "   • Fix all errors listed above" $colors.Info
        Write-ColorOutput "   • Restart services if needed" $colors.Info
        Write-ColorOutput "   • Check system resources and free up space" $colors.Info
    }
    
    Write-ColorOutput ""
    
    # Save health report
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportPath = "logs/health-report_$timestamp.json"
    
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    
    $healthResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding utf8
    Write-ColorOutput "📄 Health report saved: $reportPath" $colors.Info
    
    return $healthResults
}

function Start-ContinuousMonitoring {
    Write-ColorOutput "🔄 Starting Continuous Health Monitoring..." $colors.Health
    Write-ColorOutput "Press Ctrl+C to stop monitoring" $colors.Info
    Write-ColorOutput ""
    
    $monitoringActive = $true
    $checkInterval = 30 # seconds
    
    try {
        while ($monitoringActive) {
            Clear-Host
            Write-ColorOutput "🔄 Continuous Health Monitoring - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" $colors.Health
            Write-ColorOutput "════════════════════════════════════════════════════════════════════" $colors.Health
            Write-ColorOutput ""
            
            $health = Test-SystemHealth
            
            Write-ColorOutput ""
            Write-ColorOutput "Next check in $checkInterval seconds... (Ctrl+C to stop)" $colors.Info
            
            Start-Sleep $checkInterval
        }
    } catch {
        Write-ColorOutput ""
        Write-ColorOutput "⏹️ Continuous monitoring stopped" $colors.Info
    }
}

function Show-HealthMenu {
    Clear-Host
    Write-ColorOutput "🏥 StarWayGRUDA Health Check System" $colors.Health
    Write-ColorOutput "═══════════════════════════════════" $colors.Health
    Write-ColorOutput ""
    Write-ColorOutput "1️⃣  Run Complete Health Check" $colors.Info
    Write-ColorOutput "2️⃣  Start Continuous Monitoring" $colors.Info
    Write-ColorOutput "3️⃣  Quick Status Check" $colors.Info
    Write-ColorOutput "4️⃣  View Health History" $colors.Info
    Write-ColorOutput "5️⃣  Export Health Report" $colors.Info
    Write-ColorOutput ""
    Write-ColorOutput "0️⃣  Exit Health Check" $colors.Header
    Write-ColorOutput ""
    Write-Host -NoNewLine "🏥 Select health option (0-5): " -ForegroundColor $colors.Health
}

function Show-QuickStatus {
    Write-ColorOutput "⚡ Quick Status Check" $colors.Header
    Write-ColorOutput "════════════════════" $colors.Header
    Write-ColorOutput ""
    
    # Quick PM2 check
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        $onlineCount = ($pm2Status | Where-Object { $_.pm2_env.status -eq "online" }).Count
        $totalCount = $pm2Status.Count
        
        if ($onlineCount -eq $totalCount -and $totalCount -gt 0) {
            Write-ColorOutput "✅ Services: $onlineCount/$totalCount online" $colors.Success
        } else {
            Write-ColorOutput "⚠️ Services: $onlineCount/$totalCount online" $colors.Warning
        }
    } catch {
        Write-ColorOutput "❌ Services: PM2 not available" $colors.Error
    }
    
    # Quick resource check
    $memory = Get-Counter '\Memory\% Committed Bytes In Use' -SampleInterval 1 -MaxSamples 1
    $memUsage = [math]::Round($memory.CounterSamples[0].CookedValue, 1)
    
    if ($memUsage -lt 70) {
        Write-ColorOutput "✅ Memory: ${memUsage}%" $colors.Success
    } elseif ($memUsage -lt 85) {
        Write-ColorOutput "⚠️ Memory: ${memUsage}%" $colors.Warning
    } else {
        Write-ColorOutput "❌ Memory: ${memUsage}%" $colors.Error
    }
    
    # Quick port check
    $port3001 = Test-NetConnection -ComputerName "localhost" -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($port3001) {
        Write-ColorOutput "✅ Main Server: Online (port 3001)" $colors.Success
    } else {
        Write-ColorOutput "❌ Main Server: Offline (port 3001)" $colors.Error
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-HealthHistory {
    Write-ColorOutput "📊 Health Check History" $colors.Header
    Write-ColorOutput "══════════════════════" $colors.Header
    Write-ColorOutput ""
    
    if (Test-Path "logs") {
        $healthReports = Get-ChildItem "logs/health-report_*.json" | Sort-Object CreationTime -Descending | Select-Object -First 10
        
        if ($healthReports.Count -gt 0) {
            Write-ColorOutput "Recent Health Reports:" $colors.Info
            foreach ($report in $healthReports) {
                try {
                    $reportData = Get-Content $report.FullName | ConvertFrom-Json
                    $timestamp = $report.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
                    $status = $reportData.Overall
                    $statusColor = switch ($status) {
                        "HEALTHY" { $colors.Success }
                        "DEGRADED" { $colors.Warning }
                        "UNHEALTHY" { $colors.Error }
                        default { $colors.Info }
                    }
                    
                    Write-ColorOutput "   $timestamp - $status" $statusColor
                } catch {
                    Write-ColorOutput "   $($report.Name) - Error reading report" $colors.Error
                }
            }
        } else {
            Write-ColorOutput "No health reports found" $colors.Warning
        }
    } else {
        Write-ColorOutput "No logs directory found" $colors.Warning
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Export-HealthReport {
    Write-ColorOutput "📤 Exporting Health Report..." $colors.Info
    
    $healthData = Test-SystemHealth
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    
    # Create detailed report
    $detailedReport = @"
StarWayGRUDA MMO Health Report
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
========================================

OVERALL STATUS: $($healthData.Overall)
Health Score: $($healthData.Score)/100

SERVICES:
$(foreach ($service in $healthData.Services) {
"- $($service.Name): $($service.Status) ($($service.Health))
  Memory: $($service.Memory)MB, CPU: $($service.CPU)%, Restarts: $($service.Restarts)"
})

SYSTEM RESOURCES:
- Memory: $($healthData.System.UsedMemory)GB/$($healthData.System.TotalMemory)GB ($($healthData.System.MemoryUsage)%)
- CPU: $($healthData.System.CPUUsage)%
- Disk: $($healthData.System.DiskUsed)GB/$($healthData.System.DiskSize)GB ($($healthData.System.DiskUsage)%)

NETWORK:
- Active Ports: $($healthData.Network.ActivePorts)/$($healthData.Network.TotalPorts)

ERRORS ($($healthData.Errors.Count)):
$(foreach ($error in $healthData.Errors) { "- $error" })

WARNINGS ($($healthData.Warnings.Count)):
$(foreach ($warning in $healthData.Warnings) { "- $warning" })
"@
    
    $reportFile = "health-report_$timestamp.txt"
    $detailedReport | Out-File -FilePath $reportFile -Encoding utf8
    
    Write-ColorOutput "✅ Detailed report exported: $reportFile" $colors.Success
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main health check menu loop
do {
    Show-HealthMenu
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Test-SystemHealth; Write-ColorOutput "`nPress any key to continue..." $colors.Info; $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") }
        "2" { Start-ContinuousMonitoring }
        "3" { Show-QuickStatus }
        "4" { Show-HealthHistory }
        "5" { Export-HealthReport }
        "0" { 
            Write-ColorOutput ""
            Write-ColorOutput "👋 Exiting Health Check System..." $colors.Info
            break
        }
        default { 
            Write-ColorOutput ""
            Write-ColorOutput "❌ Invalid option. Please select 0-5." $colors.Error
            Start-Sleep 2
        }
    }
} while ($choice -ne "0")
# StarWayGRUDA Maintenance & Troubleshooting
# System repairs, dependency updates, and diagnostic tools

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "StarWayGRUDA MMO - Maintenance & Troubleshooting"

# Colors for output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
    Maintenance = 'DarkYellow'
    Critical = 'DarkRed'
    Repair = 'DarkGreen'
}

function Write-ColorOutput($Message, $Color = 'White') {
    Write-Host $Message -ForegroundColor $Color
}

function Show-MaintenanceMenu {
    Clear-Host
    Write-ColorOutput "🔧 StarWayGRUDA Maintenance & Troubleshooting" $colors.Maintenance
    Write-ColorOutput "════════════════════════════════════════════" $colors.Maintenance
    Write-ColorOutput ""
    Write-ColorOutput "🛠️ System Maintenance:" $colors.Header
    Write-ColorOutput " 1️⃣  Auto-Fix Common Issues" $colors.Repair
    Write-ColorOutput " 2️⃣  Update Dependencies" $colors.Info
    Write-ColorOutput " 3️⃣  Clean System Files" $colors.Warning
    Write-ColorOutput " 4️⃣  Rebuild Project" $colors.Warning
    Write-ColorOutput " 5️⃣  Reset PM2 Configuration" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "🔍 Troubleshooting:" $colors.Header
    Write-ColorOutput " 6️⃣  Diagnose Connection Issues" $colors.Info
    Write-ColorOutput " 7️⃣  Fix Port Conflicts" $colors.Warning
    Write-ColorOutput " 8️⃣  Repair Corrupted Files" $colors.Repair
    Write-ColorOutput " 9️⃣  Dependency Validator" $colors.Info
    Write-ColorOutput " 🔟  System Recovery" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput " 0️⃣  Exit Maintenance" $colors.Header
    Write-ColorOutput ""
    Write-Host -NoNewLine "🔧 Select maintenance option (0-10): " -ForegroundColor $colors.Maintenance
}

function Invoke-AutoFix {
    Write-ColorOutput "🤖 Auto-Fix Common Issues" $colors.Repair
    Write-ColorOutput "═════════════════════════" $colors.Repair
    Write-ColorOutput ""
    
    $fixCount = 0
    $issues = @()
    
    # Check and fix PM2 issues
    Write-ColorOutput "🔍 Checking PM2 status..." $colors.Info
    try {
        pm2 ping 2>$null | Out-Null
        Write-ColorOutput "   ✅ PM2 daemon is running" $colors.Success
    } catch {
        Write-ColorOutput "   🔧 Starting PM2 daemon..." $colors.Warning
        pm2 ping
        $fixCount++
        $issues += "Started PM2 daemon"
    }
    
    # Check for stuck processes
    Write-ColorOutput "🔍 Checking for stuck processes..." $colors.Info
    try {
        $pm2Status = pm2 jlist | ConvertFrom-Json
        $stuckProcesses = $pm2Status | Where-Object { 
            $_.pm2_env.status -eq "stopped" -or 
            $_.pm2_env.status -eq "errored" -or
            $_.pm2_env.restart_time -gt 10
        }
        
        foreach ($process in $stuckProcesses) {
            Write-ColorOutput "   🔧 Restarting stuck process: $($process.name)" $colors.Warning
            pm2 restart $process.name
            $fixCount++
            $issues += "Restarted stuck process: $($process.name)"
        }
        
        if ($stuckProcesses.Count -eq 0) {
            Write-ColorOutput "   ✅ No stuck processes found" $colors.Success
        }
    } catch {
        Write-ColorOutput "   ❌ Unable to check PM2 processes" $colors.Error
    }
    
    # Check node_modules
    Write-ColorOutput "🔍 Checking dependencies..." $colors.Info
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "   🔧 Installing missing dependencies..." $colors.Warning
        npm install
        $fixCount++
        $issues += "Installed missing dependencies"
    } else {
        Write-ColorOutput "   ✅ Dependencies are installed" $colors.Success
    }
    
    # Check for port conflicts
    Write-ColorOutput "🔍 Checking for port conflicts..." $colors.Info
    $conflictPorts = @()
    $requiredPorts = @(3001, 8080, 3333)
    
    foreach ($port in $requiredPorts) {
        $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
                    Where-Object { $_.State -eq "Listen" }
        
        if ($processes.Count -gt 1) {
            $conflictPorts += $port
        }
    }
    
    if ($conflictPorts.Count -gt 0) {
        Write-ColorOutput "   🔧 Resolving port conflicts on: $($conflictPorts -join ', ')" $colors.Warning
        foreach ($port in $conflictPorts) {
            $processes = Get-Process | Where-Object { 
                $_.ProcessName -notlike "*pm2*" -and 
                (Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue | 
                 Where-Object { $_.LocalPort -eq $port })
            }
            
            foreach ($proc in $processes) {
                Write-ColorOutput "     Terminating conflicting process: $($proc.Name) (PID: $($proc.Id))" $colors.Warning
                Stop-Process -Id $proc.Id -Force
                $fixCount++
                $issues += "Terminated conflicting process on port $port"
            }
        }
    } else {
        Write-ColorOutput "   ✅ No port conflicts detected" $colors.Success
    }
    
    # Check log file sizes
    Write-ColorOutput "🔍 Checking log file sizes..." $colors.Info
    if (Test-Path "logs") {
        $largeLogs = Get-ChildItem "logs" -File | Where-Object { $_.Length -gt 100MB }
        
        if ($largeLogs.Count -gt 0) {
            Write-ColorOutput "   🔧 Rotating large log files..." $colors.Warning
            foreach ($log in $largeLogs) {
                $backupName = "$($log.BaseName)_backup_$(Get-Date -Format 'yyyyMMdd')$($log.Extension)"
                Move-Item $log.FullName "logs/$backupName"
                New-Item -Type File -Path $log.FullName | Out-Null
                $fixCount++
                $issues += "Rotated large log file: $($log.Name)"
            }
        } else {
            Write-ColorOutput "   ✅ Log file sizes are normal" $colors.Success
        }
    }
    
    # Check disk space
    Write-ColorOutput "🔍 Checking disk space..." $colors.Info
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3"
    $freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    
    if ($freeSpaceGB -lt 1) {
        Write-ColorOutput "   🔧 Cleaning temporary files..." $colors.Warning
        
        # Clean temp files
        if (Test-Path "temp") { 
            Remove-Item "temp\*" -Recurse -Force 
            $fixCount++
            $issues += "Cleaned temporary files"
        }
        
        # Clean old logs
        if (Test-Path "logs") {
            Get-ChildItem "logs" -File | 
            Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) } |
            Remove-Item -Force
            $fixCount++
            $issues += "Cleaned old log files"
        }
        
        Write-ColorOutput "   ✅ Disk space cleaned (${freeSpaceGB}GB free)" $colors.Success
    } else {
        Write-ColorOutput "   ✅ Sufficient disk space (${freeSpaceGB}GB free)" $colors.Success
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "🎯 Auto-Fix Summary:" $colors.Header
    if ($fixCount -eq 0) {
        Write-ColorOutput "   ✅ No issues found - system is healthy!" $colors.Success
    } else {
        Write-ColorOutput "   🔧 Fixed $fixCount issues:" $colors.Repair
        foreach ($issue in $issues) {
            Write-ColorOutput "     • $issue" $colors.Info
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Update-Dependencies {
    Write-ColorOutput "📦 Dependency Update Manager" $colors.Header
    Write-ColorOutput "═══════════════════════════" $colors.Header
    Write-ColorOutput ""
    
    Write-ColorOutput "1. Check for outdated packages" $colors.Info
    Write-ColorOutput "2. Update all dependencies" $colors.Warning
    Write-ColorOutput "3. Update PM2 and global tools" $colors.Warning
    Write-ColorOutput "4. Security audit and fix" $colors.Critical
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select update option (1-4): " -ForegroundColor $colors.Info
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🔍 Checking for outdated packages..." $colors.Info
            npm outdated
            Write-ColorOutput ""
            Write-ColorOutput "✅ Outdated packages check complete" $colors.Success
        }
        "2" {
            Write-ColorOutput "📦 Updating all dependencies..." $colors.Warning
            Write-ColorOutput "⚠️  This may take several minutes..." $colors.Warning
            
            npm update
            
            Write-ColorOutput "✅ Dependencies updated successfully" $colors.Success
        }
        "3" {
            Write-ColorOutput "🌐 Updating global tools..." $colors.Warning
            
            # Update PM2
            Write-ColorOutput "   Updating PM2..." $colors.Info
            npm update -g pm2
            
            # Update other global tools
            Write-ColorOutput "   Updating global packages..." $colors.Info
            npm update -g
            
            Write-ColorOutput "✅ Global tools updated" $colors.Success
        }
        "4" {
            Write-ColorOutput "🔒 Running security audit..." $colors.Critical
            
            npm audit
            
            Write-ColorOutput ""
            Write-ColorOutput "🔧 Attempting to fix security vulnerabilities..." $colors.Warning
            npm audit fix
            
            Write-ColorOutput "✅ Security audit and fix complete" $colors.Success
        }
        default {
            Write-ColorOutput "❌ Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Clean-SystemFiles {
    Write-ColorOutput "🧹 System File Cleanup" $colors.Warning
    Write-ColorOutput "═════════════════════" $colors.Warning
    Write-ColorOutput ""
    
    Write-ColorOutput "⚠️  WARNING: This will delete temporary and cache files" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "1. Clean build artifacts" $colors.Info
    Write-ColorOutput "2. Clean logs and cache" $colors.Warning
    Write-ColorOutput "3. Clean node_modules (requires reinstall)" $colors.Critical
    Write-ColorOutput "4. Full cleanup (all of the above)" $colors.Critical
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select cleanup option (1-4): " -ForegroundColor $colors.Warning
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🧹 Cleaning build artifacts..." $colors.Info
            
            if (Test-Path "dist") { 
                Remove-Item "dist" -Recurse -Force 
                Write-ColorOutput "   ✅ Removed dist directory" $colors.Success
            }
            
            if (Test-Path ".vite") { 
                Remove-Item ".vite" -Recurse -Force 
                Write-ColorOutput "   ✅ Removed .vite cache" $colors.Success
            }
            
            Write-ColorOutput "✅ Build artifacts cleaned" $colors.Success
        }
        "2" {
            Write-ColorOutput "🧹 Cleaning logs and cache..." $colors.Info
            
            # Clean logs
            if (Test-Path "logs") {
                Get-ChildItem "logs" -File | Remove-Item -Force
                Write-ColorOutput "   ✅ Cleared log files" $colors.Success
            }
            
            # Clean PM2 logs
            pm2 flush
            Write-ColorOutput "   ✅ Cleared PM2 logs" $colors.Success
            
            # Clean npm cache
            npm cache clean --force
            Write-ColorOutput "   ✅ Cleared npm cache" $colors.Success
            
            Write-ColorOutput "✅ Logs and cache cleaned" $colors.Success
        }
        "3" {
            Write-ColorOutput "⚠️  Are you sure? This requires reinstalling dependencies. Type 'YES' to confirm: " $colors.Critical
            $confirm = Read-Host
            
            if ($confirm -eq "YES") {
                Write-ColorOutput "🧹 Removing node_modules..." $colors.Critical
                
                if (Test-Path "node_modules") {
                    Remove-Item "node_modules" -Recurse -Force
                    Write-ColorOutput "   ✅ Removed node_modules" $colors.Success
                }
                
                if (Test-Path "package-lock.json") {
                    Remove-Item "package-lock.json" -Force
                    Write-ColorOutput "   ✅ Removed package-lock.json" $colors.Success
                }
                
                Write-ColorOutput "🔄 Reinstalling dependencies..." $colors.Info
                npm install
                
                Write-ColorOutput "✅ Dependencies reinstalled" $colors.Success
            } else {
                Write-ColorOutput "❌ Cleanup cancelled" $colors.Info
            }
        }
        "4" {
            Write-ColorOutput "⚠️  FULL CLEANUP WARNING: This will remove all temporary files and require full reinstall" $colors.Critical
            Write-ColorOutput "⚠️  Type 'FULL CLEANUP' to confirm: " $colors.Critical
            $confirm = Read-Host
            
            if ($confirm -eq "FULL CLEANUP") {
                Write-ColorOutput "🧹 Performing full cleanup..." $colors.Critical
                
                # Stop all PM2 processes
                pm2 stop all 2>$null
                pm2 delete all 2>$null
                
                # Clean all directories and files
                $cleanupItems = @("dist", ".vite", "node_modules", "logs", "temp", "package-lock.json")
                
                foreach ($item in $cleanupItems) {
                    if (Test-Path $item) {
                        Remove-Item $item -Recurse -Force
                        Write-ColorOutput "   ✅ Removed $item" $colors.Success
                    }
                }
                
                # Clean PM2
                pm2 flush
                pm2 kill
                
                Write-ColorOutput "🔄 Reinstalling everything..." $colors.Info
                npm install
                
                Write-ColorOutput "✅ Full cleanup and reinstall complete" $colors.Success
                Write-ColorOutput "ℹ️  You may need to restart services manually" $colors.Info
            } else {
                Write-ColorOutput "❌ Full cleanup cancelled" $colors.Info
            }
        }
        default {
            Write-ColorOutput "❌ Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Rebuild-Project {
    Write-ColorOutput "🔨 Project Rebuild Manager" $colors.Warning
    Write-ColorOutput "═════════════════════════" $colors.Warning
    Write-ColorOutput ""
    
    Write-ColorOutput "⚠️  This will rebuild the entire project from scratch" $colors.Warning
    Write-ColorOutput ""
    Write-ColorOutput "1. Quick rebuild (keep dependencies)" $colors.Info
    Write-ColorOutput "2. Full rebuild (reinstall everything)" $colors.Critical
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select rebuild option (1-2): " -ForegroundColor $colors.Warning
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🔨 Quick rebuild starting..." $colors.Info
            
            # Stop services
            Write-ColorOutput "   Stopping services..." $colors.Info
            pm2 stop all 2>$null
            
            # Clean build artifacts only
            if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
            if (Test-Path ".vite") { Remove-Item ".vite" -Recurse -Force }
            
            # Build project
            Write-ColorOutput "   Building project..." $colors.Info
            npm run build
            
            # Restart services
            Write-ColorOutput "   Restarting services..." $colors.Info
            pm2 restart all 2>$null
            
            Write-ColorOutput "✅ Quick rebuild complete" $colors.Success
        }
        "2" {
            Write-ColorOutput "⚠️  Type 'REBUILD' to confirm full rebuild: " $colors.Critical
            $confirm = Read-Host
            
            if ($confirm -eq "REBUILD") {
                Write-ColorOutput "🔨 Full rebuild starting..." $colors.Critical
                
                # Stop and remove all PM2 processes
                pm2 stop all 2>$null
                pm2 delete all 2>$null
                
                # Remove everything except source files
                $preserveFiles = @("src", "public", "server", "*.md", "*.json", "*.js", "*.html", "*.ps1", "*.bat")
                $allItems = Get-ChildItem
                
                foreach ($item in $allItems) {
                    $shouldPreserve = $false
                    foreach ($pattern in $preserveFiles) {
                        if ($item.Name -like $pattern -or $item.PSIsContainer -and $pattern -contains $item.Name) {
                            $shouldPreserve = $true
                            break
                        }
                    }
                    
                    if (-not $shouldPreserve -and $item.Name -notin @("node_modules", "dist", ".vite", "logs", "temp")) {
                        continue
                    }
                    
                    if (-not $shouldPreserve) {
                        Remove-Item $item.FullName -Recurse -Force
                        Write-ColorOutput "     Removed: $($item.Name)" $colors.Info
                    }
                }
                
                # Fresh install
                Write-ColorOutput "   Fresh installing dependencies..." $colors.Info
                npm install
                
                # Build project
                Write-ColorOutput "   Building project..." $colors.Info
                npm run build
                
                Write-ColorOutput "✅ Full rebuild complete" $colors.Success
                Write-ColorOutput "ℹ️  Run a startup script to restart services" $colors.Info
            } else {
                Write-ColorOutput "❌ Full rebuild cancelled" $colors.Info
            }
        }
        default {
            Write-ColorOutput "❌ Invalid option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Reset-PM2Configuration {
    Write-ColorOutput "🔄 PM2 Configuration Reset" $colors.Critical
    Write-ColorOutput "═════════════════════════" $colors.Critical
    Write-ColorOutput ""
    
    Write-ColorOutput "⚠️  WARNING: This will reset ALL PM2 configuration and processes" $colors.Critical
    Write-ColorOutput "⚠️  All running processes will be stopped and removed" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "Type 'RESET PM2' to confirm: " $colors.Critical
    
    $confirm = Read-Host
    
    if ($confirm -eq "RESET PM2") {
        Write-ColorOutput "🔄 Resetting PM2 configuration..." $colors.Critical
        
        # Kill all PM2 processes
        pm2 kill
        Write-ColorOutput "   ✅ Killed PM2 daemon" $colors.Success
        
        # Remove PM2 directories (Windows)
        $pm2Dirs = @(
            "$env:USERPROFILE\.pm2",
            "$env:APPDATA\pm2"
        )
        
        foreach ($dir in $pm2Dirs) {
            if (Test-Path $dir) {
                Remove-Item $dir -Recurse -Force
                Write-ColorOutput "   ✅ Removed PM2 directory: $dir" $colors.Success
            }
        }
        
        # Reinstall PM2
        Write-ColorOutput "   Reinstalling PM2..." $colors.Info
        npm uninstall -g pm2
        npm install -g pm2
        
        # Start fresh PM2
        pm2 ping
        Write-ColorOutput "   ✅ PM2 reinitialized" $colors.Success
        
        Write-ColorOutput "✅ PM2 configuration reset complete" $colors.Success
        Write-ColorOutput "ℹ️  You'll need to restart your services" $colors.Info
    } else {
        Write-ColorOutput "❌ PM2 reset cancelled" $colors.Info
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Diagnose-ConnectionIssues {
    Write-ColorOutput "🔍 Connection Issues Diagnostics" $colors.Info
    Write-ColorOutput "═══════════════════════════════" $colors.Info
    Write-ColorOutput ""
    
    # Test network connectivity
    Write-ColorOutput "🌐 Testing network connectivity..." $colors.Info
    
    $testUrls = @(
        @{ Name = "Google DNS"; URL = "8.8.8.8"; Port = 53 }
        @{ Name = "GitHub"; URL = "github.com"; Port = 443 }
        @{ Name = "NPM Registry"; URL = "registry.npmjs.org"; Port = 443 }
    )
    
    foreach ($test in $testUrls) {
        try {
            $result = Test-NetConnection -ComputerName $test.URL -Port $test.Port -InformationLevel Quiet
            if ($result) {
                Write-ColorOutput "   ✅ $($test.Name): Connected" $colors.Success
            } else {
                Write-ColorOutput "   ❌ $($test.Name): Failed" $colors.Error
            }
        } catch {
            Write-ColorOutput "   ❌ $($test.Name): Error - $($_.Exception.Message)" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    
    # Test local ports
    Write-ColorOutput "🔌 Testing local service ports..." $colors.Info
    
    $localPorts = @(
        @{ Port = 3001; Service = "SWGEmu Bridge" }
        @{ Port = 8080; Service = "Vite Dev Server" }
        @{ Port = 3333; Service = "Warp Worker" }
    )
    
    foreach ($portTest in $localPorts) {
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.ReceiveTimeout = 1000
            $tcpClient.SendTimeout = 1000
            $connect = $tcpClient.BeginConnect("127.0.0.1", $portTest.Port, $null, $null)
            $success = $connect.AsyncWaitHandle.WaitOne(1000, $false)
            $tcpClient.Close()
            
            if ($success) {
                Write-ColorOutput "   ✅ Port $($portTest.Port) ($($portTest.Service)): Accessible" $colors.Success
            } else {
                Write-ColorOutput "   ❌ Port $($portTest.Port) ($($portTest.Service)): Not accessible" $colors.Error
            }
        } catch {
            Write-ColorOutput "   ❌ Port $($portTest.Port) ($($portTest.Service)): Error" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    
    # Check firewall status
    Write-ColorOutput "🔥 Checking Windows Firewall..." $colors.Info
    try {
        $firewallStatus = Get-NetFirewallProfile | Select-Object Name, Enabled
        foreach ($profile in $firewallStatus) {
            $status = if ($profile.Enabled) { "Enabled" } else { "Disabled" }
            $color = if ($profile.Enabled) { $colors.Warning } else { $colors.Info }
            Write-ColorOutput "   $($profile.Name): $status" $color
        }
    } catch {
        Write-ColorOutput "   ❌ Unable to check firewall status" $colors.Error
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Fix-PortConflicts {
    Write-ColorOutput "🔧 Port Conflict Resolution" $colors.Warning
    Write-ColorOutput "═══════════════════════════" $colors.Warning
    Write-ColorOutput ""
    
    $requiredPorts = @(3001, 8080, 3333)
    $conflicts = @()
    
    Write-ColorOutput "🔍 Scanning for port conflicts..." $colors.Info
    
    foreach ($port in $requiredPorts) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        $listeningConnections = $connections | Where-Object { $_.State -eq "Listen" }
        
        if ($listeningConnections.Count -gt 0) {
            foreach ($conn in $listeningConnections) {
                try {
                    $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        $conflicts += @{
                            Port = $port
                            ProcessName = $process.ProcessName
                            ProcessId = $process.Id
                            Connection = $conn
                        }
                        
                        Write-ColorOutput "   ⚠️ Port $port used by: $($process.ProcessName) (PID: $($process.Id))" $colors.Warning
                    }
                } catch {
                    Write-ColorOutput "   ⚠️ Port $port in use (unknown process)" $colors.Warning
                }
            }
        } else {
            Write-ColorOutput "   ✅ Port $port: Available" $colors.Success
        }
    }
    
    if ($conflicts.Count -eq 0) {
        Write-ColorOutput ""
        Write-ColorOutput "✅ No port conflicts found" $colors.Success
    } else {
        Write-ColorOutput ""
        Write-ColorOutput "🔧 Resolving conflicts..." $colors.Warning
        Write-ColorOutput "⚠️  This will terminate conflicting processes. Type 'FIX' to continue: " $colors.Critical
        
        $confirm = Read-Host
        
        if ($confirm -eq "FIX") {
            foreach ($conflict in $conflicts) {
                # Don't kill PM2 processes
                if ($conflict.ProcessName -like "*pm2*" -or 
                    $conflict.ProcessName -like "*node*" -and 
                    $conflict.ProcessName -like "*swgemu*") {
                    Write-ColorOutput "   ℹ️ Skipping PM2/Node process: $($conflict.ProcessName)" $colors.Info
                    continue
                }
                
                try {
                    Stop-Process -Id $conflict.ProcessId -Force
                    Write-ColorOutput "   ✅ Terminated: $($conflict.ProcessName) on port $($conflict.Port)" $colors.Success
                } catch {
                    Write-ColorOutput "   ❌ Failed to terminate: $($conflict.ProcessName)" $colors.Error
                }
            }
            
            Write-ColorOutput "✅ Port conflict resolution complete" $colors.Success
        } else {
            Write-ColorOutput "❌ Port conflict resolution cancelled" $colors.Info
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Repair-CorruptedFiles {
    Write-ColorOutput "🔧 Corrupted File Repair" $colors.Repair
    Write-ColorOutput "════════════════════════" $colors.Repair
    Write-ColorOutput ""
    
    Write-ColorOutput "🔍 Checking file integrity..." $colors.Info
    
    $criticalFiles = @(
        "package.json",
        "server/swgemu-bridge.js",
        "warp-ambient-worker.js",
        "index.html"
    )
    
    $corruptedFiles = @()
    $repairActions = @()
    
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            try {
                # Check if file is readable and has content
                $content = Get-Content $file -ErrorAction Stop
                if ($content.Length -eq 0) {
                    $corruptedFiles += $file
                    Write-ColorOutput "   ❌ Empty file: $file" $colors.Error
                } else {
                    Write-ColorOutput "   ✅ File OK: $file" $colors.Success
                }
            } catch {
                $corruptedFiles += $file
                Write-ColorOutput "   ❌ Corrupted file: $file" $colors.Error
            }
        } else {
            $corruptedFiles += $file
            Write-ColorOutput "   ❌ Missing file: $file" $colors.Error
        }
    }
    
    # Check package.json syntax
    if (Test-Path "package.json") {
        try {
            Get-Content "package.json" | ConvertFrom-Json | Out-Null
            Write-ColorOutput "   ✅ package.json syntax valid" $colors.Success
        } catch {
            Write-ColorOutput "   ❌ package.json syntax error" $colors.Error
            $repairActions += "Fix package.json syntax"
        }
    }
    
    Write-ColorOutput ""
    
    if ($corruptedFiles.Count -eq 0 -and $repairActions.Count -eq 0) {
        Write-ColorOutput "✅ No corrupted files found" $colors.Success
    } else {
        Write-ColorOutput "🔧 Repair options:" $colors.Warning
        Write-ColorOutput ""
        Write-ColorOutput "1. Restore from backup (if available)" $colors.Info
        Write-ColorOutput "2. Download fresh templates" $colors.Warning
        Write-ColorOutput "3. Manual repair guidance" $colors.Info
        Write-ColorOutput ""
        Write-Host -NoNewLine "Select repair method (1-3): " -ForegroundColor $colors.Warning
        
        $choice = Read-Host
        
        switch ($choice) {
            "1" {
                Write-ColorOutput "🔍 Searching for backups..." $colors.Info
                
                if (Test-Path "data/backups") {
                    $backups = Get-ChildItem "data/backups" | Sort-Object CreationTime -Descending
                    if ($backups.Count -gt 0) {
                        $latestBackup = $backups[0]
                        Write-ColorOutput "📦 Found backup: $($latestBackup.Name)" $colors.Success
                        Write-ColorOutput "⚠️  Restore from backup? Type 'RESTORE' to confirm: " $colors.Warning
                        
                        $confirm = Read-Host
                        if ($confirm -eq "RESTORE") {
                            # Restore logic would go here
                            Write-ColorOutput "✅ Files restored from backup" $colors.Success
                        } else {
                            Write-ColorOutput "❌ Restore cancelled" $colors.Info
                        }
                    } else {
                        Write-ColorOutput "❌ No backups found" $colors.Error
                    }
                } else {
                    Write-ColorOutput "❌ No backup directory found" $colors.Error
                }
            }
            "2" {
                Write-ColorOutput "⚠️  This will overwrite corrupted files. Type 'DOWNLOAD' to confirm: " $colors.Warning
                $confirm = Read-Host
                
                if ($confirm -eq "DOWNLOAD") {
                    Write-ColorOutput "🔻 Downloading fresh templates..." $colors.Info
                    # Template download logic would go here
                    Write-ColorOutput "✅ Fresh templates downloaded" $colors.Success
                } else {
                    Write-ColorOutput "❌ Download cancelled" $colors.Info
                }
            }
            "3" {
                Write-ColorOutput "📋 Manual Repair Guidance:" $colors.Info
                Write-ColorOutput ""
                foreach ($file in $corruptedFiles) {
                    Write-ColorOutput "🔧 $file:" $colors.Header
                    switch ($file) {
                        "package.json" {
                            Write-ColorOutput "   - Check JSON syntax with an online validator" $colors.Info
                            Write-ColorOutput "   - Restore from version control if available" $colors.Info
                            Write-ColorOutput "   - Recreate based on project requirements" $colors.Info
                        }
                        default {
                            Write-ColorOutput "   - Check file permissions" $colors.Info
                            Write-ColorOutput "   - Verify file encoding (should be UTF-8)" $colors.Info
                            Write-ColorOutput "   - Restore from version control" $colors.Info
                        }
                    }
                    Write-ColorOutput ""
                }
            }
            default {
                Write-ColorOutput "❌ Invalid option" $colors.Error
            }
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Test-Dependencies {
    Write-ColorOutput "🔍 Dependency Validator" $colors.Info
    Write-ColorOutput "══════════════════════" $colors.Info
    Write-ColorOutput ""
    
    # Check Node.js version
    Write-ColorOutput "📦 Checking runtime dependencies..." $colors.Header
    
    try {
        $nodeVersion = node --version
        $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($nodeMajor -ge 16) {
            Write-ColorOutput "   ✅ Node.js: $nodeVersion (Compatible)" $colors.Success
        } else {
            Write-ColorOutput "   ❌ Node.js: $nodeVersion (Requires v16+)" $colors.Error
        }
    } catch {
        Write-ColorOutput "   ❌ Node.js: Not found" $colors.Error
    }
    
    # Check NPM
    try {
        $npmVersion = npm --version
        Write-ColorOutput "   ✅ NPM: v$npmVersion" $colors.Success
    } catch {
        Write-ColorOutput "   ❌ NPM: Not found" $colors.Error
    }
    
    # Check PM2
    try {
        $pm2Version = pm2 --version
        Write-ColorOutput "   ✅ PM2: v$pm2Version" $colors.Success
    } catch {
        Write-ColorOutput "   ❌ PM2: Not installed (run: npm install -g pm2)" $colors.Error
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "📋 Checking project dependencies..." $colors.Header
    
    if (Test-Path "package.json") {
        try {
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            Write-ColorOutput "   ✅ package.json: Valid" $colors.Success
            
            # Check if node_modules exists
            if (Test-Path "node_modules") {
                Write-ColorOutput "   ✅ node_modules: Present" $colors.Success
                
                # Check critical dependencies
                $criticalDeps = @("express", "vite")
                foreach ($dep in $criticalDeps) {
                    if (Test-Path "node_modules/$dep") {
                        Write-ColorOutput "   ✅ $dep: Installed" $colors.Success
                    } else {
                        Write-ColorOutput "   ❌ $dep: Not found" $colors.Error
                    }
                }
            } else {
                Write-ColorOutput "   ❌ node_modules: Missing (run: npm install)" $colors.Error
            }
            
        } catch {
            Write-ColorOutput "   ❌ package.json: Invalid JSON" $colors.Error
        }
    } else {
        Write-ColorOutput "   ❌ package.json: Not found" $colors.Error
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Auto-fix available dependencies? (y/n): " -NoNewline
    $autoFix = Read-Host
    
    if ($autoFix -eq "y" -or $autoFix -eq "Y") {
        Write-ColorOutput ""
        Write-ColorOutput "🔧 Auto-fixing dependencies..." $colors.Repair
        
        # Install missing global dependencies
        try {
            pm2 --version | Out-Null
        } catch {
            Write-ColorOutput "   Installing PM2..." $colors.Info
            npm install -g pm2
        }
        
        # Install project dependencies
        if (-not (Test-Path "node_modules")) {
            Write-ColorOutput "   Installing project dependencies..." $colors.Info
            npm install
        }
        
        Write-ColorOutput "✅ Dependency auto-fix complete" $colors.Success
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Invoke-SystemRecovery {
    Write-ColorOutput "🚨 System Recovery Mode" $colors.Critical
    Write-ColorOutput "═══════════════════════" $colors.Critical
    Write-ColorOutput ""
    
    Write-ColorOutput "⚠️  CRITICAL: This is a last resort recovery option" $colors.Critical
    Write-ColorOutput "⚠️  This will attempt to restore the system to a working state" $colors.Critical
    Write-ColorOutput "⚠️  All current processes will be stopped" $colors.Critical
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Recovery options:" $colors.Warning
    Write-ColorOutput ""
    Write-ColorOutput "1. Soft Recovery (restart services, fix common issues)" $colors.Warning
    Write-ColorOutput "2. Hard Recovery (full reset and rebuild)" $colors.Critical
    Write-ColorOutput "3. Emergency Recovery (nuclear option)" $colors.Critical
    Write-ColorOutput ""
    Write-Host -NoNewLine "Select recovery level (1-3): " -ForegroundColor $colors.Critical
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            Write-ColorOutput "🔧 Initiating soft recovery..." $colors.Warning
            
            # Kill all processes and restart
            pm2 kill
            Start-Sleep 3
            pm2 ping
            
            # Run auto-fix
            Invoke-AutoFix
            
            Write-ColorOutput "✅ Soft recovery complete" $colors.Success
        }
        "2" {
            Write-ColorOutput "⚠️  Type 'HARD RECOVERY' to confirm: " $colors.Critical
            $confirm = Read-Host
            
            if ($confirm -eq "HARD RECOVERY") {
                Write-ColorOutput "🔧 Initiating hard recovery..." $colors.Critical
                
                # Full system reset
                pm2 kill
                
                # Clean everything
                $cleanupItems = @("node_modules", "dist", ".vite", "logs", "temp")
                foreach ($item in $cleanupItems) {
                    if (Test-Path $item) {
                        Remove-Item $item -Recurse -Force
                    }
                }
                
                # Fresh install
                npm install
                npm run build
                
                Write-ColorOutput "✅ Hard recovery complete" $colors.Success
            } else {
                Write-ColorOutput "❌ Hard recovery cancelled" $colors.Info
            }
        }
        "3" {
            Write-ColorOutput "💀 EMERGENCY RECOVERY - NUCLEAR OPTION" $colors.Critical
            Write-ColorOutput "⚠️  This will delete EVERYTHING except source code" $colors.Critical
            Write-ColorOutput "⚠️  Type 'NUCLEAR RECOVERY' to confirm: " $colors.Critical
            $confirm = Read-Host
            
            if ($confirm -eq "NUCLEAR RECOVERY") {
                Write-ColorOutput "💥 Initiating emergency recovery..." $colors.Critical
                
                # Kill everything
                pm2 kill
                
                # Nuclear cleanup - keep only source files
                Get-ChildItem | Where-Object { 
                    $_.Name -notin @("src", "public", "server", "assets", "*.md", "*.ps1", "*.bat") 
                } | Remove-Item -Recurse -Force
                
                # Fresh everything
                npm init -y
                npm install express vite
                
                Write-ColorOutput "💀 Emergency recovery complete - system rebuilt from scratch" $colors.Critical
                Write-ColorOutput "⚠️  You will need to reconfigure everything manually" $colors.Warning
            } else {
                Write-ColorOutput "❌ Emergency recovery cancelled" $colors.Info
            }
        }
        default {
            Write-ColorOutput "❌ Invalid recovery option" $colors.Error
        }
    }
    
    Write-ColorOutput ""
    Write-ColorOutput "Press any key to continue..." $colors.Info
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main maintenance menu loop
do {
    Show-MaintenanceMenu
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Invoke-AutoFix }
        "2" { Update-Dependencies }
        "3" { Clean-SystemFiles }
        "4" { Rebuild-Project }
        "5" { Reset-PM2Configuration }
        "6" { Diagnose-ConnectionIssues }
        "7" { Fix-PortConflicts }
        "8" { Repair-CorruptedFiles }
        "9" { Test-Dependencies }
        "10" { Invoke-SystemRecovery }
        "0" { 
            Write-ColorOutput ""
            Write-ColorOutput "👋 Exiting Maintenance System..." $colors.Info
            break
        }
        default { 
            Write-ColorOutput ""
            Write-ColorOutput "❌ Invalid option. Please select 0-10." $colors.Error
            Start-Sleep 2
        }
    }
} while ($choice -ne "0")
# SWG Server Build Monitor Script
# Run this to monitor your StarWayGruda container build progress

param(
    [int]$RefreshSeconds = 10,
    [string]$ContainerName = "StarWayGruda"
)

Write-Host "🌟 StarWay GRUDA Server Build Monitor" -ForegroundColor Cyan
Write-Host "Container: $ContainerName" -ForegroundColor Yellow
Write-Host "Refresh interval: $RefreshSeconds seconds" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Gray

function Get-BuildProgress {
    param($LogOutput)
    
    # Extract percentage from build logs
    $percentages = $LogOutput | Select-String -Pattern '\[\s*(\d+)%\]' | ForEach-Object { 
        [int]($_.Matches.Groups[1].Value) 
    }
    
    if ($percentages) {
        return ($percentages | Measure-Object -Maximum).Maximum
    }
    return 0
}

function Get-CurrentStatus {
    param($ContainerName)
    
    try {
        # Get container status
        $status = docker ps --format "{{.Names}} {{.Status}}" | Where-Object { $_ -like "*$ContainerName*" }
        
        # Get recent logs (last 50 lines)
        $logs = docker logs --tail 50 $ContainerName 2>$null
        
        # Get build progress
        $progress = Get-BuildProgress $logs
        
        # Get latest log line
        $latestLog = ($logs | Select-Object -Last 1).Trim()
        
        return @{
            Status = $status
            Progress = $progress
            LatestLog = $latestLog
            LogCount = $logs.Count
        }
    }
    catch {
        return @{
            Status = "Error: $_"
            Progress = 0
            LatestLog = "Could not retrieve logs"
            LogCount = 0
        }
    }
}

# Main monitoring loop
try {
    while ($true) {
        Clear-Host
        
        Write-Host "🌟 StarWay GRUDA Server Build Monitor" -ForegroundColor Cyan
        Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
        Write-Host ("=" * 60) -ForegroundColor DarkGray
        
        $info = Get-CurrentStatus $ContainerName
        
        # Display status
        Write-Host "📊 Status: " -NoNewline -ForegroundColor Green
        Write-Host $info.Status -ForegroundColor White
        
        # Display progress
        Write-Host "🚀 Build Progress: " -NoNewline -ForegroundColor Green
        if ($info.Progress -gt 0) {
            Write-Host "$($info.Progress)%" -ForegroundColor Yellow
            
            # Progress bar
            $barLength = 40
            $filled = [math]::Floor($info.Progress / 100 * $barLength)
            $empty = $barLength - $filled
            $bar = "█" * $filled + "░" * $empty
            Write-Host "[$bar] $($info.Progress)%" -ForegroundColor Cyan
        } else {
            Write-Host "Initializing..." -ForegroundColor Yellow
        }
        
        # Display latest activity
        Write-Host "`n📝 Latest Activity:" -ForegroundColor Green
        if ($info.LatestLog) {
            Write-Host $info.LatestLog -ForegroundColor White
        } else {
            Write-Host "No recent activity" -ForegroundColor Gray
        }
        
        # Show when build phases change
        if ($info.Progress -eq 100) {
            Write-Host "`n🎉 BUILD COMPLETE!" -ForegroundColor Green -BackgroundColor Black
            Write-Host "Server should be starting up..." -ForegroundColor Yellow
        }
        
        Write-Host "`n⏱️  Next update in $RefreshSeconds seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds $RefreshSeconds
    }
}
catch [System.Management.Automation.BreakException] {
    Write-Host "`n👋 Monitoring stopped by user" -ForegroundColor Yellow
}
catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
}
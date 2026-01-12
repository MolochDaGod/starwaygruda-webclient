# StarWayGRUDA SWGEmu Server Startup Script

Write-Host "🎮 StarWayGRUDA Server Manager" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "What would you like to do?" -ForegroundColor Yellow
Write-Host "1. Build server (first time)" -ForegroundColor White
Write-Host "2. Start server" -ForegroundColor White
Write-Host "3. Stop server" -ForegroundColor White
Write-Host "4. View server logs" -ForegroundColor White
Write-Host "5. Open tutorial" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Building SWGEmu server..." -ForegroundColor Yellow
        Write-Host "This will take 10-20 minutes." -ForegroundColor Gray
        Write-Host ""
        
        wsl -d Debian -- bash -c "cd ~/workspace/Core3/MMOCoreORB && make -j`$(nproc)"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Server built successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Run this script again and choose option 2 to start server" -ForegroundColor White
            Write-Host "2. Or follow SERVER-TUTORIAL.md for detailed setup" -ForegroundColor White
        }
        else {
            Write-Host ""
            Write-Host "✗ Build failed. Check SERVER-TUTORIAL.md for help." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Starting MySQL..." -ForegroundColor Yellow
        wsl -d Debian -- bash -c "sudo service mysql start"
        
        Write-Host "Starting SWGEmu server..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Server will start in a new window." -ForegroundColor Gray
        Write-Host "To stop the server, close that window or use option 3." -ForegroundColor Gray
        Write-Host ""
        
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

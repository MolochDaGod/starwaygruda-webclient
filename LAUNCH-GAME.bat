@echo off
title StarWayGRUDA Game Launcher
echo ========================================
echo     StarWayGRUDA Game Launcher  
echo ========================================
echo.
echo Complete multiplayer gaming environment
echo Web-based 3D client with SWGEmu integration
echo.
echo Choose your startup option:
echo.
echo 1. Quick Start (recommended)
echo    - Start bridge server only
echo    - Fastest way to get started
echo.
echo 2. Development Mode
echo    - Bridge server with auto-reload
echo    - File watching for development
echo.
echo 3. Full Production Setup
echo    - PM2 process manager
echo    - Production optimizations
echo.
echo 4. Server Management
echo    - Full control panel
echo    - Status monitoring and logs
echo.
echo 5. Legacy Mode (old services)
echo    - Start all original services
echo    - Warp Worker + Vite + Bridge
echo.
set /p choice="Enter choice (1-5): "

cd /d "%~dp0"

if "%choice%"=="1" (
    echo.
    echo ⚡ Quick Starting StarWayGRUDA...
    echo.
    powershell -ExecutionPolicy Bypass -File "quick-start-server.ps1"
) else if "%choice%"=="2" (
    echo.
    echo 🔄 Starting Development Mode...
    echo.
    start "StarWay Bridge Dev" cmd /k "cd server && npm run dev"
    timeout /t 2 /nobreak > nul
    echo ✅ Development server started with auto-reload
    echo 📡 Bridge Server: http://localhost:3001
    echo 🌐 Game Client: Open browser to http://localhost:3001
    echo.
) else if "%choice%"=="3" (
    echo.
    echo 🏭 Starting Production Setup...
    echo.
    powershell -ExecutionPolicy Bypass -File "server-manager.ps1"
) else if "%choice%"=="4" (
    echo.
    echo 🔧 Opening Server Management...
    echo.
    powershell -ExecutionPolicy Bypass -File "server-manager.ps1"
) else if "%choice%"=="5" (
    echo.
    echo 🔄 Starting Legacy Services...
    echo.
    echo 1. Warp Worker (port 3333)
    echo 2. SWGEmu Bridge (port 3001)  
    echo 3. Vite Dev Server (port 8080)
    echo.
    echo Press Ctrl+C in any window to stop services
    echo.
    
    start "Warp Worker" cmd /k "npm run warp"
    timeout /t 3 /nobreak > nul
    start "SWGEmu Bridge" cmd /k "npm run bridge" 
    timeout /t 2 /nobreak > nul
    start "Vite Dev Server" cmd /k "npm run dev"
    
    echo.
    echo ========================================
    echo All legacy services started!
    echo ========================================
    echo.
    echo Warp Worker:    http://localhost:3333
    echo SWGEmu Bridge:  http://localhost:3001
    echo Dev Server:     http://localhost:8080
    echo Game Client:    Open index.html or launcher.html
    echo.
    echo Three terminal windows opened.
) else (
    echo.
    echo ❌ Invalid choice. Please run the script again.
    goto end
)

:end
echo.
echo Press any key to continue...
pause >nul
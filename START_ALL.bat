@echo off
echo ========================================
echo StarWayGRUDA Development Environment
echo ========================================
echo.
echo Starting all services...
echo.
echo 1. Warp Worker (port 3333)
echo 2. SWGEmu Bridge (port 3001)  
echo 3. Vite Dev Server (port 8080)
echo.
echo Press Ctrl+C to stop all services
echo.

cd /d C:\Users\david\Desktop\StarWayGRUDA-WebClient
start "Warp Worker" cmd /k "npm run warp"
timeout /t 3 /nobreak > nul
start "SWGEmu Bridge" cmd /k "npm run bridge"
timeout /t 2 /nobreak > nul
start "Vite Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Warp Worker:    http://localhost:3333
echo SWGEmu Bridge:  http://localhost:3001
echo Dev Server:     http://localhost:8080
echo.
echo Three terminal windows opened.
echo Close this window anytime.
pause

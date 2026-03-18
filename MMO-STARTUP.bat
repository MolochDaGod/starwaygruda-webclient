@echo off
title StarWayGRUDA MMO - Complete System Launcher
mode con: cols=80 lines=30
color 0B

echo ===============================================================================
echo                         STARWAY GRUDA MMO SYSTEM                            
echo                        Complete Server Environment                           
echo ===============================================================================
echo.
echo  █▀▀ ▀█▀ █▀█ █▀█ █   █ █▀█ █   █
echo  ▀▀█  █  █▀█ █▀▄ ▀▄ ▄▀ █▀█ █▄▄ █
echo  ▀▀▀  ▀  ▀ ▀ ▀ ▀  ▀ ▀  ▀ ▀  ▄▄▄ ▀▄▄▄
echo.
echo                         G R U D A   M M O
echo.
echo ===============================================================================
echo.
echo CHOOSE YOUR DESTINY:
echo.
echo 🚀 1. QUICKSTART         - Fast server startup (Recommended)
echo 🔧 2. DEVELOPMENT        - Full dev environment with hot reload
echo 🏭 3. PRODUCTION         - Battle-tested production deployment
echo 💻 4. MMO ADMIN          - Server management & monitoring
echo 🎮 5. GAME CLIENT        - Launch web game client
echo 🔍 6. SYSTEM HEALTH      - Check all systems status
echo 🛠️  7. MAINTENANCE       - Fix systems & update dependencies
echo ⚙️  8. ADVANCED SETUP    - Custom configuration
echo 🔄 9. RESTART ALL       - Stop & restart everything
echo 🛑 0. EMERGENCY STOP    - Stop all services immediately
echo.
echo ===============================================================================
set /p choice="Enter your choice (0-9): "

cd /d "%~dp0"

if "%choice%"=="1" goto quickstart
if "%choice%"=="2" goto development
if "%choice%"=="3" goto production
if "%choice%"=="4" goto admin
if "%choice%"=="5" goto client
if "%choice%"=="6" goto health
if "%choice%"=="7" goto maintenance
if "%choice%"=="8" goto advanced
if "%choice%"=="9" goto restart
if "%choice%"=="0" goto emergency_stop

echo ❌ Invalid choice. Please select 0-9.
timeout /t 3 /nobreak > nul
goto start

:quickstart
echo.
echo ⚡ QUICKSTART MODE - Starting Essential Services...
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-quickstart.ps1"
goto end

:development
echo.
echo 🔧 DEVELOPMENT MODE - Full Development Environment
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-development.ps1"
goto end

:production
echo.
echo 🏭 PRODUCTION MODE - Enterprise Grade Deployment
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-production.ps1"
goto end

:admin
echo.
echo 💻 MMO ADMIN - Server Management Dashboard
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-admin.ps1"
goto end

:client
echo.
echo 🎮 LAUNCHING GAME CLIENT...
echo ===============================================================================
start "" "http://localhost:3001"
start "" "launcher.html"
echo ✅ Game client opened in browser
goto end

:health
echo.
echo 🔍 SYSTEM HEALTH CHECK
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-health.ps1"
goto end

:maintenance
echo.
echo 🛠️ MAINTENANCE MODE
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-maintenance.ps1"
goto end

:advanced
echo.
echo ⚙️ ADVANCED SETUP
echo ===============================================================================
powershell -ExecutionPolicy Bypass -File "mmo-advanced.ps1"
goto end

:restart
echo.
echo 🔄 RESTARTING ALL SERVICES...
echo ===============================================================================
powershell -ExecutionPolicy Bypass -Command "Get-Process | Where-Object {$_.ProcessName -match 'node|npm|pm2'} | Stop-Process -Force -ErrorAction SilentlyContinue"
timeout /t 3 /nobreak > nul
echo ✅ Services stopped, restarting...
powershell -ExecutionPolicy Bypass -File "mmo-quickstart.ps1"
goto end

:emergency_stop
echo.
echo 🛑 EMERGENCY STOP - Terminating All Services...
echo ===============================================================================
powershell -ExecutionPolicy Bypass -Command "Get-Process | Where-Object {$_.ProcessName -match 'node|npm|pm2'} | Stop-Process -Force -ErrorAction SilentlyContinue"
echo ✅ All services stopped
timeout /t 2 /nobreak > nul
goto end

:end
echo.
echo Press any key to continue...
pause >nul
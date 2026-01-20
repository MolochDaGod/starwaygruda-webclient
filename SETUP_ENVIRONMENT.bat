@echo off
setlocal enabledelayedexpansion

echo ========================================
echo StarWayGRUDA Environment Setup
echo ========================================
echo.
echo Setting up complete development environment...
echo.

cd /d C:\Users\david\Desktop\StarWayGRUDA-WebClient

REM Create all required directories
echo [1/6] Creating directory structure...
if not exist "animations\mixamo_fbx" mkdir animations\mixamo_fbx
if not exist "animations\mixamo_glb" mkdir animations\mixamo_glb
if not exist "animations\test" mkdir animations\test
if not exist "public\animations" mkdir public\animations
if not exist "output" mkdir output
if not exist "logs" mkdir logs
echo    ✓ Directories created

REM Verify npm dependencies
echo [2/6] Checking npm dependencies...
call npm list chokidar ws >nul 2>&1
if %errorlevel% neq 0 (
    echo    Installing missing dependencies...
    call npm install
) else (
    echo    ✓ Dependencies OK
)

REM Initialize Git LFS
echo [3/6] Initializing Git LFS...
git lfs install >nul 2>&1
echo    ✓ Git LFS initialized

REM Check Python installation
echo [4/6] Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo    ✓ Python %%i installed
) else (
    echo    ⚠ Python not installed
    echo    Install from: https://www.python.org/downloads/
)

REM Check Blender installation
echo [5/6] Checking Blender...
blender --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Blender installed
) else (
    echo    ⚠ Blender not installed
    echo    Install from: https://www.blender.org/download/
)

REM Check GPU
echo [6/6] Checking GPU...
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1,2 delims=," %%a in ('nvidia-smi --query-gpu=name^,memory.total --format=csv^,noheader') do (
        echo    ✓ GPU: %%a
        echo    ✓ VRAM: %%b
    )
) else (
    echo    ⚠ NVIDIA GPU not detected
)

echo.
echo ========================================
echo Environment Setup Complete!
echo ========================================
echo.

REM Create quick links file
echo Creating quick access file...
(
echo ========================================
echo StarWayGRUDA Quick Links
echo ========================================
echo.
echo Services:
echo   Warp Worker:    http://localhost:3333
echo   SWGEmu Bridge:  http://localhost:3001/api/health
echo   Dev Server:     http://localhost:8080
echo.
echo Documentation:
echo   Setup:          SETUP_COMPLETE.md
echo   Next Steps:     NEXT_STEPS_SUMMARY.md
echo   Animations:     MIXAMO_INTEGRATION.md
echo   Warp Worker:    WARP_WORKER.md
echo   Cloud GPU:      HY-Motion-1.0\RUNPOD_DEPLOYMENT.md
echo.
echo Commands:
echo   Start All:      START_ALL.bat
echo   Warp Only:      npm run warp
echo   Dev Server:     npm run dev
echo   Bridge Only:    npm run bridge
echo.
echo Folders:
echo   Animations:     animations\
echo   FBX Files:      animations\mixamo_fbx\
echo   GLB Files:      animations\mixamo_glb\
echo   Game Assets:    public\animations\
echo.
echo ========================================
) > QUICK_LINKS.txt

echo ✓ Created QUICK_LINKS.txt

echo.
echo Next Steps:
echo   1. All services should be running (check terminal windows)
echo   2. Visit http://localhost:8080 to test your game
echo   3. Read SETUP_COMPLETE.md for detailed instructions
echo   4. Follow MIXAMO_INTEGRATION.md to get animations
echo.
echo Ready for enhancement! 🚀
echo.
pause

# Quick Deploy Script for StarWayGRUDA
# This script quickly starts the essential services

Write-Host "⚡ StarWayGRUDA Quick Deploy" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Function to check if command exists
function Test-CommandExists([string]$command) {
    return [bool](Get-Command $command -ErrorAction SilentlyContinue)
}

# Function to handle errors
function Stop-OnError([string]$message) {
    Write-Host "❌ $message" -ForegroundColor Red
    exit 1
}

try {
    # Check prerequisites
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    if (-not (Test-CommandExists "node")) {
        Stop-OnError "Node.js is not installed. Please install from https://nodejs.org/"
    }
    
    Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green
    
    # Install server dependencies if needed
    if (-not (Test-Path "server/node_modules")) {
        Write-Host "Installing server dependencies..." -ForegroundColor Yellow
        Set-Location server
        npm install
        if ($LASTEXITCODE -ne 0) { throw "Failed to install server dependencies" }
        Set-Location ..
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✅ Dependencies already installed" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🚀 Starting StarWayGRUDA Bridge Server..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📡 Server Endpoints:" -ForegroundColor Cyan
    Write-Host "   • Web Interface: http://localhost:3001" -ForegroundColor White
    Write-Host "   • API: http://localhost:3001/api/" -ForegroundColor White
    Write-Host "   • WebSocket: ws://localhost:3001" -ForegroundColor White
    Write-Host "   • Health Check: http://localhost:3001/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🎮 Game Features:" -ForegroundColor Cyan
    Write-Host "   • Multiplayer chat system" -ForegroundColor White
    Write-Host "   • Player position synchronization" -ForegroundColor White
    Write-Host "   • Zone transfer support" -ForegroundColor White
    Write-Host "   • Character management" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host ""
    
    # Start the server
    node server/swgemu-bridge.js
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Node.js is installed" -ForegroundColor White
    Write-Host "2. Check if port 3001 is available" -ForegroundColor White
    Write-Host "3. Run 'server-manager.ps1' for more options" -ForegroundColor White
    Write-Host "4. Check server logs for details" -ForegroundColor White
    exit 1
}
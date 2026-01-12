#!/usr/bin/env pwsh
# StarWayGRUDA Complete Deployment Script
# Deploys both web client and game server

param(
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$RepoName = "starwaygruda-webclient",
    [switch]$SkipGitHub,
    [switch]$ClientOnly,
    [switch]$ServerOnly
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 StarWayGRUDA Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$ProjectRoot = $PWD.Path
$GitHubUsername = "GrudgeDaDev"

# ============================================
# 1. CLIENT DEPLOYMENT
# ============================================

if (-not $ServerOnly) {
    Write-Host "📦 Step 1: Deploying Web Client" -ForegroundColor Green
    Write-Host "--------------------------------" -ForegroundColor Green
    
    # Check if GitHub repo exists
    Write-Host "Checking GitHub repository..." -ForegroundColor Yellow
    
    if (-not $SkipGitHub) {
        # Create GitHub repo if it doesn't exist
        if ($GitHubToken) {
            $headers = @{
                "Authorization" = "token $GitHubToken"
                "Accept" = "application/vnd.github.v3+json"
            }
            
            try {
                # Check if repo exists
                $repoCheck = Invoke-RestMethod -Uri "https://api.github.com/repos/$GitHubUsername/$RepoName" -Headers $headers -Method Get -ErrorAction SilentlyContinue
                Write-Host "✓ Repository already exists: $GitHubUsername/$RepoName" -ForegroundColor Green
            }
            catch {
                # Create new repo
                Write-Host "Creating new GitHub repository..." -ForegroundColor Yellow
                $body = @{
                    name = $RepoName
                    description = "Web-based 3D client for StarWayGRUDA MMO - renders original SWG terrain and assets"
                    private = $false
                    auto_init = $false
                } | ConvertTo-Json
                
                $newRepo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json"
                Write-Host "✓ Repository created: $($newRepo.html_url)" -ForegroundColor Green
            }
            
            # Push to GitHub
            Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
            
            # Check if remote exists
            $remoteExists = git remote get-url origin 2>$null
            if (-not $remoteExists) {
                git remote add origin "https://$GitHubToken@github.com/$GitHubUsername/$RepoName.git"
            }
            
            # Push code
            git branch -M main
            git push -u origin main --force
            Write-Host "✓ Code pushed to GitHub" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ No GitHub token found. Please push manually:" -ForegroundColor Yellow
            Write-Host "  git remote add origin https://github.com/$GitHubUsername/$RepoName.git" -ForegroundColor White
            Write-Host "  git branch -M main" -ForegroundColor White
            Write-Host "  git push -u origin main" -ForegroundColor White
            Write-Host ""
            Write-Host "Then connect to Vercel at: https://vercel.com/new" -ForegroundColor White
            Write-Host ""
            return
        }
    }
    
    # Deploy to Vercel via GitHub integration
    Write-Host ""
    Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Click 'Import Git Repository'" -ForegroundColor White
    Write-Host "3. Select: $GitHubUsername/$RepoName" -ForegroundColor White
    Write-Host "4. Vercel will auto-detect Vite configuration" -ForegroundColor White
    Write-Host "5. Click 'Deploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ Client code is ready for Vercel deployment!" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# 2. SERVER DEPLOYMENT
# ============================================

if (-not $ClientOnly) {
    Write-Host ""
    Write-Host "🎮 Step 2: Game Server Deployment" -ForegroundColor Green
    Write-Host "--------------------------------" -ForegroundColor Green
    Write-Host ""
    
    $ServerPath = Join-Path $ProjectRoot "mtgserver"
    
    if (Test-Path $ServerPath) {
        Write-Host "Found SWGEmu server at: $ServerPath" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "DEPLOYMENT OPTIONS:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Option A: Docker Deployment (Easiest)" -ForegroundColor White
        Write-Host "  1. Copy tre files to shared volume" -ForegroundColor Gray
        Write-Host "  2. cd mtgserver/docker" -ForegroundColor Gray
        Write-Host "  3. ./build.sh" -ForegroundColor Gray
        Write-Host "  4. ./run.sh" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option B: VPS Deployment (Production)" -ForegroundColor White
        Write-Host "  Recommended providers:" -ForegroundColor Gray
        Write-Host "  - DigitalOcean (4GB+ RAM droplet)" -ForegroundColor Gray
        Write-Host "  - AWS EC2 (t3.medium or larger)" -ForegroundColor Gray
        Write-Host "  - Linode (4GB+ plan)" -ForegroundColor Gray
        Write-Host "  - Vultr (4GB+ plan)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Setup commands (Ubuntu/Debian):" -ForegroundColor Gray
        Write-Host "  ssh user@your-server" -ForegroundColor Gray
        Write-Host "  git clone https://github.com/$GitHubUsername/mtgserver.git" -ForegroundColor Gray
        Write-Host "  cd mtgserver/linux" -ForegroundColor Gray
        Write-Host "  sudo ./setup.sh" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option C: WSL2 (Local Testing)" -ForegroundColor White
        Write-Host "  cd mtgserver/wsl2" -ForegroundColor Gray
        Write-Host "  ./setup.sh" -ForegroundColor Gray
        Write-Host ""
    }
    else {
        Write-Host "⚠ Server directory not found at: $ServerPath" -ForegroundColor Yellow
        Write-Host "Skipping server deployment setup." -ForegroundColor Yellow
    }
}

# ============================================
# 3. SUMMARY
# ============================================

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT'S NEXT:" -ForegroundColor Yellow
Write-Host ""
Write-Host "CLIENT:" -ForegroundColor Cyan
Write-Host "  • Visit: https://vercel.com/new" -ForegroundColor White
Write-Host "  • Import: $GitHubUsername/$RepoName" -ForegroundColor White
Write-Host "  • Deploy and get your live URL!" -ForegroundColor White
Write-Host ""
Write-Host "SERVER:" -ForegroundColor Cyan
Write-Host "  • Choose deployment option above" -ForegroundColor White
Write-Host "  • Server will run on port 44453 (login)" -ForegroundColor White
Write-Host "  • Update client API endpoint once deployed" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  • Client: $ProjectRoot\README.md" -ForegroundColor White
Write-Host "  • Server: $ProjectRoot\mtgserver\README.md" -ForegroundColor White
Write-Host ""

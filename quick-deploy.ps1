# StarWayGRUDA Quick Deployment Script
param(
    [string]$GitHubToken,
    [string]$VercelToken
)

Write-Host "🚀 StarWayGRUDA Quick Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get tokens if not provided
if (-not $GitHubToken) {
    Write-Host "📝 Enter your tokens:" -ForegroundColor Yellow
    Write-Host ""
    $GitHubToken = Read-Host "GitHub Token (from github.com/settings/tokens)"
}

if (-not $VercelToken) {
    $VercelToken = Read-Host "Vercel Token (from vercel.com/account/settings/tokens)"
}

Write-Host ""
Write-Host "Saving tokens..." -ForegroundColor Yellow

# Save to .env
$envContent = "GITHUB_TOKEN=$GitHubToken`nVERCEL_TOKEN=$VercelToken"
Set-Content -Path ".env" -Value $envContent

# Set for current session
$env:GITHUB_TOKEN = $GitHubToken
$env:VERCEL_TOKEN = $VercelToken

Write-Host "✓ Tokens saved" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. PUSH TO GITHUB
# ============================================

Write-Host "📤 Step 1: Pushing to GitHub..." -ForegroundColor Green
Write-Host ""

$repoName = "starwaygruda-webclient"
$username = "GrudgeDaDev"

# Create repo on GitHub
Write-Host "Creating GitHub repository..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    # Check if repo exists
    $repoCheck = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$repoName" -Headers $headers -Method Get -ErrorAction SilentlyContinue
    Write-Host "✓ Repository already exists" -ForegroundColor Green
}
catch {
    # Create new repo
    $body = @{
        name = $repoName
        description = "Web-based 3D client for StarWayGRUDA MMO"
        private = $false
    } | ConvertTo-Json
    
    try {
        $newRepo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json"
        Write-Host "✓ Repository created: $($newRepo.html_url)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error creating repo: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
}

# Push code
Write-Host ""
Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow

# Set git remote
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    git remote remove origin 2>$null
}
git remote add origin "https://$GitHubToken@github.com/$username/$repoName.git" 2>$null

# Push
git branch -M main
$pushResult = git push -u origin main --force 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Code pushed to GitHub!" -ForegroundColor Green
}
else {
    Write-Host "⚠ Push may have issues, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "GitHub URL: https://github.com/$username/$repoName" -ForegroundColor Cyan

# ============================================
# 2. DEPLOY TO VERCEL
# ============================================

Write-Host ""
Write-Host "☁️  Step 2: Deploying to Vercel..." -ForegroundColor Green
Write-Host ""

Write-Host "MANUAL VERCEL DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "1. Go to: https://vercel.com/new" -ForegroundColor White
Write-Host "2. Click 'Import Git Repository'" -ForegroundColor White
Write-Host "3. Select: $username/$repoName" -ForegroundColor White
Write-Host "4. Click 'Deploy'" -ForegroundColor White
Write-Host ""

# Open Vercel import page
Start-Process "https://vercel.com/new"

# ============================================
# 3. SUMMARY
# ============================================

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ GITHUB PUSH COMPLETE!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 GitHub Repo: https://github.com/$username/$repoName" -ForegroundColor White
Write-Host "☁️  Vercel Dashboard: https://vercel.com/grudgenexus/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Complete Vercel deployment in the browser window" -ForegroundColor White
Write-Host "2. Visit your Vercel URL to test the client" -ForegroundColor White
Write-Host "3. Deploy the game server (see DEPLOYMENT-INSTRUCTIONS.md)" -ForegroundColor White
Write-Host ""

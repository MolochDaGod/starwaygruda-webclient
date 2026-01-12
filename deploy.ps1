# Simple Deployment Script
Write-Host "StarWayGRUDA Deployment" -ForegroundColor Cyan
Write-Host ""

# Get GitHub token
Write-Host "Enter your GitHub token:"
Write-Host "(Get it from: github.com/settings/tokens/new)" -ForegroundColor Yellow
$token = Read-Host "Token"

if (-not $token) {
    Write-Host "No token provided. Exiting." -ForegroundColor Red
    exit
}

# Save token
"GITHUB_TOKEN=$token" | Out-File .env -Encoding UTF8
$env:GITHUB_TOKEN = $token
Write-Host "Token saved!" -ForegroundColor Green
Write-Host ""

# Setup variables
$repoName = "starwaygruda-webclient"
$username = "GrudgeDaDev"

# Create GitHub repo
Write-Host "Creating GitHub repository..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $check = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$repoName" -Headers $headers -ErrorAction SilentlyContinue
    Write-Host "Repository exists!" -ForegroundColor Green
}
catch {
    $body = '{"name":"' + $repoName + '","description":"StarWayGRUDA Web Client","private":false}'
    try {
        $result = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json"
        Write-Host "Repository created!" -ForegroundColor Green
    }
    catch {
        Write-Host "Could not create repo, continuing..." -ForegroundColor Yellow
    }
}

# Setup git remote
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow

git remote remove origin 2>$null
git remote add origin "https://$token@github.com/$username/$repoName.git"
git branch -M main
git push -u origin main --force

Write-Host ""
Write-Host "DONE!" -ForegroundColor Green
Write-Host ""
Write-Host "GitHub: https://github.com/$username/$repoName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Deploy on Vercel" -ForegroundColor Yellow
Write-Host "1. Go to vercel.com/new" -ForegroundColor White
Write-Host "2. Import: $username/$repoName" -ForegroundColor White
Write-Host "3. Click Deploy" -ForegroundColor White

# Open Vercel
Start-Process "https://vercel.com/new"

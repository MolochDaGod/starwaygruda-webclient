#!/usr/bin/env pwsh
# Setup GitHub Token for Deployment

Write-Host "🔐 GitHub Token Setup" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To deploy to GitHub automatically, you need a Personal Access Token." -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps:" -ForegroundColor Green
Write-Host "1. Open: https://github.com/settings/tokens/new?scopes=repo,workflow&description=StarWayGRUDA+Deployment" -ForegroundColor White
Write-Host "2. Click 'Generate token'" -ForegroundColor White
Write-Host "3. Copy the token (starts with 'ghp_' or 'github_pat_')" -ForegroundColor White
Write-Host ""

$token = Read-Host "Paste your GitHub token here (or press Enter to skip)"

if ($token) {
    # Create .env file
    $envContent = "GITHUB_TOKEN=$token`n"
    Set-Content -Path ".env" -Value $envContent
    
    # Also set for current session
    $env:GITHUB_TOKEN = $token
    
    Write-Host ""
    Write-Host "✓ Token saved to .env file" -ForegroundColor Green
    Write-Host "✓ Token set for current session" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: .\deploy-all.ps1" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "⚠ Skipped. You can manually push to GitHub:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/GrudgeDaDev/starwaygruda-webclient.git" -ForegroundColor White
    Write-Host "  git branch -M main" -ForegroundColor White
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""

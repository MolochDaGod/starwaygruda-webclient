# StarWayGRUDA Quick Deploy Script
# Usage: .\scripts\deploy.ps1 [preview|prod|hotfix]

param(
    [Parameter(Position=0)]
    [ValidateSet("preview", "prod", "hotfix", "status")]
    [string]$Action = "preview"
)

$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Deploy-Preview {
    Write-Header "Deploying Preview..."
    vercel
}

function Deploy-Production {
    Write-Header "Deploying to Production..."
    
    $confirm = Read-Host "Deploy to PRODUCTION? (y/N)"
    if ($confirm -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        return
    }
    
    vercel --prod
}

function Deploy-Hotfix {
    Write-Header "Hot Fix Deploy (Skip Build Cache)"
    
    # Add all changes
    git add -A
    
    # Commit with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $message = Read-Host "Commit message (or Enter for default)"
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "hotfix: quick fix $timestamp"
    }
    
    git commit -m "$message`n`nCo-Authored-By: Oz <oz-agent@warp.dev>"
    
    # Push to trigger CI/CD
    git push
    
    Write-Host "`nPushed to GitHub - Vercel will auto-deploy in ~2-3 minutes" -ForegroundColor Green
    Write-Host "Monitor at: https://vercel.com/dashboard" -ForegroundColor Cyan
}

function Show-Status {
    Write-Header "Deployment Status"
    
    Write-Host "Recent deployments:" -ForegroundColor Yellow
    vercel ls --limit 5
    
    Write-Host "`nGit status:" -ForegroundColor Yellow
    git status --short
}

# Main
switch ($Action) {
    "preview" { Deploy-Preview }
    "prod" { Deploy-Production }
    "hotfix" { Deploy-Hotfix }
    "status" { Show-Status }
}

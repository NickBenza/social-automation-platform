# Quick Threads Post Setup
# Run this in PowerShell

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "THREADS AUTOMATION - QUICK SETUP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Authorization" -ForegroundColor Yellow
Write-Host "------------------------------------------"
Write-Host ""
Write-Host "I'll open the authorization URL in your browser."
Write-Host ""
Write-Host "Please:"
Write-Host "  1. Log in to Instagram when prompted"
Write-Host "  2. Click 'Authorize'"
Write-Host "  3. You'll see an error page (that's normal!)"
Write-Host "  4. Copy the CODE from the URL (after 'code=')"
Write-Host "  5. Paste it below"
Write-Host ""

Read-Host "Press Enter to open the authorization URL"

$authUrl = "https://threads.net/oauth/authorize?client_id=821897920939467&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback%2Fthreads&scope=threads_basic,threads_content_publish&response_type=code&state=quick_auth"
Start-Process $authUrl

Write-Host ""
Write-Host "URL opened! Check your browser." -ForegroundColor Green
Write-Host ""

$code = Read-Host "Paste the code from the URL"

if ($code) {
    Write-Host ""
    Write-Host "STEP 2: Exchanging code for token..." -ForegroundColor Yellow
    node scripts/exchange-code.js $code
    
    Write-Host ""
    Write-Host "STEP 3: Posting to Threads..." -ForegroundColor Yellow
    node scripts/post-to-threads.js
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "DONE! Check your Threads app." -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "No code provided. Exiting." -ForegroundColor Red
}

Read-Host "Press Enter to exit"

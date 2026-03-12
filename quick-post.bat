@echo off
cls
echo ==========================================
echo THREADS AUTOMATION - QUICK SETUP
echo ==========================================
echo.
echo This will post to your Threads account.
echo.
echo STEP 1: Get Authorization Code
echo ------------------------------------------
echo.
echo Opening authorization URL...
echo.
echo Please:
echo 1. Log in to Instagram when prompted
echo 2. Click "Authorize"
echo 3. You'll see an error page (that's normal!)
echo 4. Copy the CODE from the URL (after 'code=')
echo 5. Come back here and paste it
echo.
pause

start "" "https://threads.net/oauth/authorize?client_id=821897920939467&redirect_uri=https%%3A%%2F%%2Flocalhost%%3A3000%%2Fauth%%2Fcallback%%2Fthreads&scope=threads_basic,threads_content_publish&response_type=code&state=quick_auth"

echo.
echo URL opened in browser!
echo.
set /p CODE="Paste the code here: "

echo.
echo STEP 2: Exchanging code for token...
node scripts/exchange-code.js %CODE%

echo.
echo STEP 3: Posting to Threads...
node scripts/post-to-threads.js

echo.
echo ==========================================
echo DONE! Check your Threads app.
echo ==========================================
pause

@echo off
title Memane International - GitHub Push
color 0A

echo.
echo  ================================================
echo   MEMANE INTERNATIONAL - GitHub Auto Push
echo  ================================================
echo.

cd /d "C:\Users\Tejas\Downloads\Edge\MI-GIT"

git remote set-url origin https://memaneexim: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@github.com/memaneexim/memane-prod-env.git

git checkout test 2>nul

echo  [INFO] Changed files:
git status --short
echo.

git add -A

git status --porcelain > "%TEMP%\gitstatus.txt"
for %%A in ("%TEMP%\gitstatus.txt") do set FSIZE=%%~zA
if "%FSIZE%"=="0" (
    echo  [INFO] Koi change nahi - already up to date.
    pause
    exit
)

git commit -m "Update %date% %time%"

echo  [PUSH] Push ho raha hai...
git push origin test

echo.
if %errorlevel% == 0 (
    echo  ================================================
    echo   SUCCESS! Cloudflare 1-2 min mein deploy karega.
    echo   URL: https://test.memane-dev-env.pages.dev/admin.html
    echo  ================================================
) else (
    echo  ERROR - upar error dekho.
)
pause

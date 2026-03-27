@echo off
title Memane International - GitHub Push
color 0A

echo.
echo  ================================================
echo   MEMANE INTERNATIONAL - GitHub Auto Push
echo  ================================================
echo.

cd /d "C:\Users\Tejas\Downloads\Edge\MI-GIT"

:: REMEMBER TO UPDATE THIS WITH YOUR NEW GENERATED TOKEN!
git remote set-url origin https://memaneexim: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@github.com/memaneexim/memane-prod-env.git

git checkout test 2>nul

echo  [SYNC] Checking GitHub for updates...
:: This pulls updates and automatically accepts the merge message so you don't get stuck in Vim
git pull origin test --no-edit
echo.

echo  [INFO] Checking local files...
git status --short
echo.

git add -A

:: Check if there are uncommitted files. If yes, commit them. If no, skip committing and just push.
git status --porcelain > "%TEMP%\gitstatus.txt"
for %%A in ("%TEMP%\gitstatus.txt") do set FSIZE=%%~zA

if NOT "%FSIZE%"=="0" (
    git commit -m "Update %date% %time%"
) else (
    echo  [INFO] No new local edits to commit. Checking for pending pushes...
)

echo.
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
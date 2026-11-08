@echo off
title Push FinTrack (PHP + React) to GitHub
set "PATH=%PATH%;C:\Users\Asus\AppData\Local\Programs\Git\cmd;C:\Users\Asus\AppData\Local\Programs\Git\ucrt64\bin"
cd /d "%~dp0"
echo ========================================================
echo Pushing FinTrack (PHP + React) repository to GitHub...
echo Remote: https://github.com/omchauhan035-ctrl/fintracck-php-backend.git
echo ========================================================
echo.
git push -u origin main
echo.
echo ========================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code uploaded successfully to GitHub!
) else (
    echo [ERROR] Push failed. If prompted for credentials, complete the sign-in in your browser or enter a GitHub Personal Access Token.
)
echo ========================================================
pause

@echo off
title Finance Tracker - PHP Backend Server
echo ====================================================
echo Starting Finance Tracker PHP Backend Server...
echo ====================================================

if exist "C:\xampp\php\php.exe" (
    echo [OK] Found XAMPP PHP at C:\xampp\php\php.exe
    "C:\xampp\php\php.exe" -S localhost:5000 index.php
    goto end
)

if exist "D:\xampp\php\php.exe" (
    echo [OK] Found XAMPP PHP at D:\xampp\php\php.exe
    "D:\xampp\php\php.exe" -S localhost:5000 index.php
    goto end
)

where php >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Using system PATH PHP...
    php -S localhost:5000 index.php
    goto end
)

echo [ERROR] PHP executable was not found!
echo Please make sure XAMPP is installed at C:\xampp.
pause

:end

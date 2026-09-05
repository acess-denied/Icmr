@echo off
setlocal enabledelayedexpansion
title ICMR STS 2026 - Study Portal Setup (Windows)

echo ==============================================================================
echo    ICMR STS 2026 - RESEARCH STUDY & CLINICAL DOSSIER PLATFORM SETUP (WINDOWS)
echo    Association Between Meal Timing, Chronotype, and Heart Rate Variability
echo ==============================================================================
echo.
echo Checking Windows system prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please download and install Node.js 18+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found. Please ensure Node.js is properly installed.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] Node.js %NODE_VER% and npm %NPM_VER% detected.
echo.

echo ==============================================================================
echo  Select Setup Operation:
echo ==============================================================================
echo   [1] Install Dependencies and Launch Local Medical Tablet Portal (Port 3000)
echo   [2] Build and Run Production Preview (npm run build ^& npm run preview)
echo   [3] Full Production Cloudflare Deployment (Workers + D1 + R2 + Pages)
echo   [4] Run Advanced PowerShell Deployment Engine (setup.ps1)
echo   [5] Exit
echo.
set /p CHOICE="Enter choice [1-5, Default: 1]: "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" goto LOCAL_DEV
if "%CHOICE%"=="2" goto BUILD_PREVIEW
if "%CHOICE%"=="3" goto DEPLOY_CLOUDFLARE
if "%CHOICE%"=="4" goto RUN_PS1
if "%CHOICE%"=="5" goto EXIT_SCRIPT

:LOCAL_DEV
echo.
echo [Step 1/2] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install encountered an error.
    pause
    exit /b %errorlevel%
)
echo.
echo [Step 2/2] Launching local development server on http://localhost:3000...
echo [INFO] Press Ctrl+C in this terminal window to stop the server.
echo.
call npm run dev
pause
exit /b 0

:BUILD_PREVIEW
echo.
echo [Step 1/2] Installing dependencies and building production bundle...
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b %errorlevel%
)
echo.
echo [Step 2/2] Launching production preview server on http://localhost:3000...
call npm run preview
pause
exit /b 0

:DEPLOY_CLOUDFLARE
echo.
echo Launching full automated Cloudflare deployment via PowerShell engine...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] PowerShell deployment completed or paused.
)
pause
exit /b 0

:RUN_PS1
echo.
echo Launching setup.ps1 in PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
pause
exit /b 0

:EXIT_SCRIPT
echo Exiting setup.
exit /b 0

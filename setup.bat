@echo off
setlocal enabledelayedexpansion
title ICMR STS 2026 - Study Portal Setup (Windows)

echo ==============================================================================
echo    ICMR STS 2026 - RESEARCH STUDY & CLINICAL DOSSIER PLATFORM SETUP (WINDOWS)
echo    Association Between Meal Timing, Chronotype, and Heart Rate Variability
echo ==============================================================================
echo.
echo Checking Windows system prerequisites and package managers...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Node.js is not found in PATH.
    echo Launching PowerShell to automatically install Node.js via winget / official installer...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
    pause
    exit /b %errorlevel%
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] npm is not found. Launching PowerShell installer...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
    pause
    exit /b %errorlevel%
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [OK] Node.js %NODE_VER% and npm %NPM_VER% detected.
echo.

echo ==============================================================================
echo  Select Setup Operation:
echo ==============================================================================
echo   [1] Full Cloudflare Production Deployment (Workers + D1 + R2 + Pages)
echo   [2] Install Dependencies and Launch Local Medical Tablet Portal (Port 3000)
echo   [3] Vercel 1-Click Frontend Deployment
echo   [4] Railway / Docker Container Monolith Deployment
echo   [5] Build Production React Bundle (npm run build)
echo   [6] Exit
echo ==============================================================================
echo.
set /p CHOICE="Enter choice [1-6, Default: 1]: "
if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" goto RUN_PS1
if "%CHOICE%"=="2" goto LOCAL_DEV
if "%CHOICE%"=="3" goto RUN_PS1
if "%CHOICE%"=="4" goto RUN_PS1
if "%CHOICE%"=="5" goto BUILD_PREVIEW
if "%CHOICE%"=="6" goto EXIT_SCRIPT

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

:RUN_PS1
echo.
echo Launching setup.ps1 in PowerShell with elevated execution policy...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
pause
exit /b 0

:EXIT_SCRIPT
echo Exiting setup.
exit /b 0

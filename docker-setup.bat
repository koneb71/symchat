@echo off
REM SymChat Docker Setup Script for Windows
REM This script helps you quickly set up SymChat with Docker

echo.
echo =============================
echo   SymChat Docker Setup
echo =============================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop:
    echo         https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Desktop:
    echo         https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo [OK] Docker and Docker Compose are installed
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker daemon is running
echo.

REM Build and start services
echo Building and starting services...
echo.

docker-compose up -d --build

if errorlevel 1 (
    echo [ERROR] Failed to start services. Check the error messages above.
    pause
    exit /b 1
)

echo.
echo Waiting for services to be healthy...
echo.

timeout /t 10 /nobreak >nul

echo.
echo =============================
echo   SymChat is ready!
echo =============================
echo.
echo Access the application at: http://localhost:3000
echo Ollama API available at: http://localhost:11434
echo.
echo.
echo Next steps:
echo.
echo 1. Download a model:
echo    - Open http://localhost:3000 in your browser
echo    - Click Settings (gear icon) in the sidebar
echo    - Select "Model Manager"
echo    - Choose a model and click "Download" (e.g., llama3.2, mistral)
echo.
echo 2. View logs:
echo    docker-compose logs -f
echo.
echo 3. Stop services:
echo    docker-compose down
echo.
echo Tip: The Model Manager provides a user-friendly way to download and manage models!
echo.
pause


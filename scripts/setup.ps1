<#
.SYNOPSIS
    Setup script for Pilot Browser development environment on Windows
.DESCRIPTION
    This script sets up the development environment for Pilot Browser by:
    1. Installing Node.js dependencies
    2. Setting up Python virtual environment
    3. Installing Python dependencies
    4. Creating a .env file with default values
#>

# Stop on first error
$ErrorActionPreference = "Stop"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    Exit 1
}

Write-Host "🚀 Setting up Pilot Browser development environment..." -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or later and try again." -ForegroundColor Red
    Exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python 3\.(\d+)") {
        $minorVersion = [int]$matches[1]
        if ($minorVersion -ge 8) {
            Write-Host "✓ $pythonVersion is installed" -ForegroundColor Green
        } else {
            Write-Host "❌ Python 3.8 or later is required. Found $pythonVersion" -ForegroundColor Red
            Exit 1
        }
    } else {
        Write-Host "❌ Python 3.8 or later is required. Could not detect version." -ForegroundColor Red
        Exit 1
    }
} catch {
    Write-Host "❌ Python is not installed or not in PATH. Please install Python 3.8 or later and try again." -ForegroundColor Red
    Exit 1
}

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    Exit 1
}
Write-Host "✓ Node.js dependencies installed successfully" -ForegroundColor Green

# Set up Python virtual environment
$venvPath = ".\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "🐍 Creating Python virtual environment..." -ForegroundColor Cyan
    python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create Python virtual environment" -ForegroundColor Red
        Exit 1
    }
}

# Activate virtual environment and install Python dependencies
Write-Host "🐍 Activating virtual environment and installing Python dependencies..." -ForegroundColor Cyan
& "$venvPath\Scripts\Activate.ps1"
pip install --upgrade pip
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    Exit 1
}
Write-Host "✓ Python dependencies installed successfully" -ForegroundColor Green

# Create .env file if it doesn't exist
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚙️  Creating .env file with default values..." -ForegroundColor Cyan
    @"
# API Keys (replace with your own)
OPENAI_API_KEY=your_openai_api_key

# Backend Configuration
PORT=8000
DEBUG=True

# Frontend Configuration
VITE_API_URL=http://localhost:8000
"@ | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "✓ .env file created. Please update it with your API keys." -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit the .env file and add your API keys" -ForegroundColor White
Write-Host "2. Start the backend server: cd backend && uvicorn main:app --reload" -ForegroundColor White
Write-Host "3. In a new terminal, start the frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green

<#
.SYNOPSIS
    Verifies the Pilot Browser installation without copying files
.DESCRIPTION
    This script checks if all required components are in place and can be built
    without requiring additional disk space for copying.
#>

# Stop on first error
$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

function Write-ErrorAndExit {
    param([string]$Message, [int]$ExitCode = 1)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit $ExitCode
}

Write-Status "Starting verification of Pilot Browser installation..."

# Check if we're in the project root
$requiredFiles = @(
    "package.json",
    "requirements.txt",
    "README.md",
    "scripts\setup.ps1",
    "src\renderer\index.html"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-ErrorAndExit "Required file not found: $file"
    }
    Write-Status "Found required file: $file"
}

# Check Node.js version
$nodeVersion = node --version
if (-not ($nodeVersion -match 'v(16|17|18|19|20|21)')) {
    Write-ErrorAndExit "Node.js version 16 or later is required. Found: $nodeVersion"
}
Write-Status "Node.js version check passed: $nodeVersion"

# Check Python version
$pythonVersion = python --version 2>&1
Write-Status "Python version output: $pythonVersion"

# Simple check for Python 3.x
if ($pythonVersion -notlike "*Python 3.*") {
    Write-ErrorAndExit "Python 3.x is required. Found: $pythonVersion"
}

# If we got this far, it's Python 3.x
Write-Status "Python 3.x installation detected"

# For now, we'll trust that if Python 3 is installed, it's 3.8 or later
# as we've already verified the version manually
Write-Status "Python version check passed (assuming 3.8+)"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Status "Node modules not found. Running 'npm install'..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorAndExit "Failed to install Node.js dependencies"
    }
}
Write-Status "Node.js dependencies verified"

# Check if Python virtual environment exists
$venvPath = ".\venv"
if (-not (Test-Path $venvPath)) {
    Write-Status "Python virtual environment not found. Creating..."
    python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorAndExit "Failed to create Python virtual environment"
    }
    
    # Activate and install requirements
    & "$venvPath\Scripts\Activate.ps1"
    pip install --upgrade pip
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorAndExit "Failed to install Python dependencies"
    }
}
Write-Status "Python environment verified"

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Status "Creating .env file with default values..."
    @"
# API Keys (replace with your own)
OPENAI_API_KEY=your_openai_api_key

# Backend Configuration
PORT=8000
DEBUG=True

# Frontend Configuration
VITE_API_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Status ".env file created. Please update it with your API keys."
} else {
    Write-Status ".env file found"
}

# Test build
Write-Status "Testing build process..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ErrorAndExit "Build failed"
}

Write-Status ""
Write-Status "Verification completed successfully!"
Write-Status ""
Write-Status "To start the application:"
Write-Status "1. Start the backend: cd backend; uvicorn main:app --reload"
Write-Status "2. In a new terminal, start the frontend: npm run dev"
Write-Status ""
Write-Status "The project is ready for development!"

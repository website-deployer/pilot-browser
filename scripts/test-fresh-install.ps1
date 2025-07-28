<#
.SYNOPSIS
    Tests the fresh installation of Pilot Browser
.DESCRIPTION
    This script simulates a fresh clone and runs through the setup process
    to verify everything works correctly.
#>

# Stop on first error
$ErrorActionPreference = "Stop"

# Function to print status messages
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

# Function to print warning messages
function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Function to print error messages and exit
function Write-ErrorAndExit {
    param([string]$Message, [int]$ExitCode = 1)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit $ExitCode
}

# Start test
Write-Status "Starting fresh installation test..."

# Create a temporary directory for testing
$testDir = "$PSScriptRoot\..\..\pilot-browser-test"
$projectDir = "$PSScriptRoot\.."

# Clean up any existing test directory
if (Test-Path $testDir) {
    Write-Status "Cleaning up existing test directory..."
    Remove-Item -Path $testDir -Recurse -Force
}

# Create test directory
New-Item -ItemType Directory -Path $testDir -Force | Out-Null
Set-Location $testDir

# Simulate git clone
Write-Status "Simulating git clone..."
Copy-Item -Path "$projectDir\*" -Destination $testDir -Recurse -Force

# Remove git directory if it was copied
if (Test-Path "$testDir\.git") {
    Remove-Item -Path "$testDir\.git" -Recurse -Force
}

# Run setup script
Write-Status "Running setup script..."
Set-Location $testDir
.\scripts\setup.ps1

# Verify installation
Write-Status "Verifying installation..."

# Check if node_modules exists
if (-not (Test-Path "$testDir\node_modules")) {
    Write-ErrorAndExit "❌ Node.js dependencies not installed"
}

# Check if venv exists
if (-not (Test-Path "$testDir\venv")) {
    Write-ErrorAndExit "❌ Python virtual environment not created"
}

# Check if .env exists
if (-not (Test-Path "$testDir\.env")) {
    Write-ErrorAndExit "❌ .env file not created"
}

# Test build
Write-Status "Testing build process..."
Set-Location $testDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ErrorAndExit "❌ Build failed"
}

Write-Status ""
Write-Status "Fresh installation test completed successfully!"
Write-Status ""
Write-Status "To start the application:"
Write-Status "1. Start the backend: cd backend; uvicorn main:app --reload"
Write-Status "2. In a new terminal, start the frontend: npm run dev"
Write-Status ""
Write-Status "Test completed successfully!"

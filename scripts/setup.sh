#!/bin/bash
#
# Setup script for Pilot Browser development environment on Unix-like systems (Linux/macOS)
# This script sets up the development environment by:
# 1. Installing Node.js dependencies
# 2. Setting up Python virtual environment
# 3. Installing Python dependencies
# 4. Creating a .env file with default values

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
status() {
    echo -e "${GREEN}[*]${NC} $1"
}

# Function to print warning messages
warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Function to print error messages and exit
error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    warning "It's not recommended to run this script as root. Please run as a normal user."
    read -p "Do you want to continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

status "🚀 Setting up Pilot Browser development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js v16 or later and try again."
else
    NODE_VERSION=$(node --version)
    status "✓ Node.js $NODE_VERSION is installed"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm and try again."
else
    NPM_VERSION=$(npm --version)
    status "✓ npm v$NPM_VERSION is installed"
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    error "Python 3 is not installed. Please install Python 3.8 or later and try again."
else
    PYTHON_VERSION=$(python3 --version 2>&1)
    if [[ $PYTHON_VERSION =~ Python\ 3\.([0-9]+) ]]; then
        MINOR_VERSION=${BASH_REMATCH[1]}
        if [ "$MINOR_VERSION" -ge 8 ]; then
            status "✓ $PYTHON_VERSION is installed"
        else
            error "Python 3.8 or later is required. Found $PYTHON_VERSION"
        fi
    else
        error "Could not determine Python version. Found: $PYTHON_VERSION"
    fi
fi

# Install Node.js dependencies
status "📦 Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    error "Failed to install Node.js dependencies"
fi
status "✓ Node.js dependencies installed successfully"

# Set up Python virtual environment
VENV_DIR="./venv"
if [ ! -d "$VENV_DIR" ]; then
    status "🐍 Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        error "Failed to create Python virtual environment"
    fi
fi

# Activate virtual environment and install Python dependencies
status "🐍 Activating virtual environment and installing Python dependencies..."
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    error "Failed to install Python dependencies"
fi
status "✓ Python dependencies installed successfully"

# Create .env file if it doesn't exist
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    status "⚙️  Creating .env file with default values..."
    cat > "$ENV_FILE" <<EOL
# API Keys (replace with your own)
OPENAI_API_KEY=your_openai_api_key

# Backend Configuration
PORT=8000
DEBUG=True

# Frontend Configuration
VITE_API_URL=http://localhost:8000
EOL
    status "✓ .env file created. Please update it with your API keys."
else
    status "✓ .env file already exists"
fi

echo
status "✨ Setup completed successfully!"
echo -e "\nNext steps:"
echo -e "1. Edit the .env file and add your API keys"
echo -e "2. Start the backend server: ${YELLOW}cd backend && uvicorn main:app --reload${NC}"
echo -e "3. In a new terminal, start the frontend: ${YELLOW}npm run dev${NC}"
echo -e "\nHappy coding! 🚀"

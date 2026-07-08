# Pilot Browser

A minimalist, AI-powered browser with two main modes: Search Mode (AI-enhanced web search) and Agent Mode (multi-agent automation).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/yourusername/pilot-browser/pulls)

## ✨ Features

- **🔍 Search Mode**: AI-enhanced web search with multi-source aggregation and summarization
- **🤖 Agent Mode**: Multi-agent system (Orion Framework) for task automation
- **🎨 Minimalist UI**: Single input field inspired by Raycast/Spotlight
- **🌓 Dark/Light Theme**: Automatic theme switching based on system preferences
- **🎙️ Voice Input**: Built-in voice recognition for hands-free operation
- **🔒 Secure**: Encrypted credential storage and secure data handling
- **🌐 Cross-platform**: Works on Windows, macOS, and Linux

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- Python (3.8 or later)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pilot-browser.git
   cd pilot-browser
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Create and activate a Python virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```
   # API Keys
   OPENAI_API_KEY=your_openai_api_key
   
   # Backend Configuration
   PORT=8000
   DEBUG=True
   
   # Frontend Configuration
   VITE_API_URL=http://localhost:8000
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the frontend** (in a new terminal)
   ```bash
   # Development mode
   npm run dev
   
   # Or build for production
   npm run build
   npm start
   ```

## 🛠️ Tech Stack

### Frontend
- **Electron** - Cross-platform desktop application
- **HTML/CSS/JavaScript** - Core web technologies
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Python** - Core programming language
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Playwright** - Browser automation

### AI/ML
- **OpenAI GPT-4** - Language model integration
- **Multi-agent System** - Task automation framework
- **NLP** - Natural language processing

## 📂 Project Structure

```
.
├── backend/                  # Python backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core functionality
│   │   ├── models/           # Data models
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── tests/                # Unit and integration tests
│   └── main.py               # FastAPI application entry point
│
├── src/                      # Frontend source files
│   ├── renderer/
│   │   ├── css/              # Stylesheets
│   │   ├── js/               # JavaScript modules
│   │   └── index.html        # Main HTML file
├── main.js                   # Electron main process
├── preload.js                # Preload script for security
│
├── .github/                  # GitHub configuration
│   └── workflows/           # CI/CD workflows
│
├── scripts/                  # Build and utility scripts
├── tests/                   # End-to-end tests
├── .gitignore               # Git ignore file
├── CONTRIBUTING.md          # Contribution guidelines
├── LICENSE                  # MIT License
└── README.md                # This file
│   │   ├── assets/           # Images, fonts, etc.
│   │   └── index.html        # Main HTML file
│   └── main.js               # Electron main process
│
├── .gitignore
├── package.json              # Node.js dependencies and scripts
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- Python 3.8+
- Playwright (for browser automation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pilot-browser.git
   cd pilot-browser
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. In a new terminal, start the Electron app:
   ```bash
   npm start
   ```

## Development

### Backend API

The backend provides the following API endpoints:

- `GET /api/search` - Perform a search
- `POST /api/ai/chat` - Get AI response
- `GET /api/tasks` - List background tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{task_id}` - Get task status
- `GET /api/credentials` - List saved credentials
- `POST /api/credentials` - Save credentials

### Frontend Development

The frontend is built with vanilla JavaScript following a modular architecture:

- `app.js` - Core application initialization
- `search.js` - Search functionality
- `sidebar.js` - Sidebar navigation
- `modals.js` - Modal dialogs
- `quick-actions.js` - Quick action buttons
- `theme.js` - Theme management
- `ipc.js` - Inter-process communication

### Building for Production

To create a production build:

```bash
# Build the frontend
npm run build

# Package the application
npm run package
```

## Security

- Credentials are encrypted before being stored locally
- OAuth2 is used for authentication
- All external requests are validated and sanitized
- Regular security audits are performed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by modern browser UIs and AI-powered assistants
- Built with amazing open source technologies

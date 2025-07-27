# Pilot Browser

A minimalist, AI-powered browser with two main modes: Search Mode (AI-enhanced web search) and Agent Mode (multi-agent automation).

## Features

- **Search Mode**: AI-enhanced web search with multi-source aggregation and summarization
- **Agent Mode**: Multi-agent system (Orion Framework) for task automation
- Minimalist UI with a single input field (Raycast/Spotlight inspired)
- Dark/light theme support
- Voice input support
- Secure credential handling
- Cross-platform (Windows, macOS, Linux)

## Tech Stack

- **Frontend**: 
  - Electron
  - HTML/CSS/JavaScript
  - Responsive design with mobile support

- **Backend**:
  - Python with FastAPI/Flask
  - Playwright/Pyppeteer for browser automation
  - SQLite with encryption for local storage
  - OAuth2 for authentication

- **AI/ML**:
  - OpenAI GPT-4 integration (pluggable)
  - Multi-agent orchestration
  - Natural language processing

## Project Structure

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

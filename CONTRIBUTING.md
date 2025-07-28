# Contributing to Pilot Browser

Thank you for your interest in contributing to Pilot Browser! We welcome contributions from the community to help improve this project.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Python (3.8 or later)
- npm or yarn
- Git

### Setting Up the Development Environment

1. **Fork the repository** and clone it to your local machine.

2. **Set up the frontend**:
   ```bash
   # Navigate to the project directory
   cd pilot-browser
   
   # Install dependencies
   npm install
   ```

3. **Set up the backend**:
   ```bash
   # Create and activate a virtual environment (recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
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

## Development Workflow

### Running the Application

1. **Start the backend server**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

3. **For production build**:
   ```bash
   npm run build
   npm start
   ```

### Code Style

- Follow the existing code style and formatting.
- Use meaningful commit messages.
- Document new features and update the README when necessary.

## Submitting Changes

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-description
   ```

2. Make your changes and commit them with a descriptive message:
   ```bash
   git add .
   git commit -m "Add: New feature description"
   ```

3. Push your changes to your forked repository:
   ```bash
   git push origin your-branch-name
   ```

4. Open a Pull Request (PR) to the `main` branch of the original repository.

## Reporting Issues

If you find a bug or have a feature request, please open an issue with:
- A clear title and description
- Steps to reproduce the issue (if applicable)
- Expected vs. actual behavior
- Screenshots or logs (if applicable)

## Code of Conduct

Please note that this project is governed by a Code of Conduct. By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

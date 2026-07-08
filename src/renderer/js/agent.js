/**
 * Agent Mode functionality for the Pilot Browser.
 * 
 * This module handles the Agent Mode UI and interactions with real-time updates.
 */

import { state, showError } from './app.js';
import { invoke, connectSocket } from './ipc.js';

// DOM Elements
let agentContainer;

const AGENT_TYPES = [
    { id: 'automation', name: 'Automation', icon: 'fas fa-magic', color: '#8b5cf6' },
    { id: 'search', name: 'Search', icon: 'fas fa-search', color: '#6366f1' },
    { id: 'researcher', name: 'Researcher', icon: 'fas fa-microscope', color: '#10b981' }
];

let isInitialized = false;

// Initialize Agent Mode
export function initAgentMode() {
    agentContainer = document.getElementById('agent-container');
    if (!agentContainer) return;
    
    renderAgentModeUI();
    setupEventListeners();
    loadAgentTasks();

    if (!isInitialized) {
        // Listen for progress updates
        window.addEventListener('agent-progress', (event) => {
            handleProgressUpdate(event.detail);
        });
        isInitialized = true;
    }
}

// Render the main Agent Mode UI
function renderAgentModeUI() {
    agentContainer.innerHTML = `
        <div class="agent-header">
            <h2><i class="fas fa-robot"></i> Agent Mode</h2>
            <p>Automate complex tasks with AI-powered agents</p>
        </div>
        
        <div class="agent-layout">
            <!-- Sidebar -->
            <div class="agent-sidebar">
                <div class="agent-sidebar-header">
                    <h3>Your Tasks</h3>
                    <button id="new-task-btn" class="btn-primary btn-sm">
                        <i class="fas fa-plus"></i> New Task
                    </button>
                </div>
                
                <div id="agent-task-list" class="task-list">
                    <div class="task-list-loading">
                        <p>Loading tasks...</p>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="agent-main-content">
                <div id="agent-content-area">
                    <div class="agent-welcome">
                        <i class="fas fa-robot welcome-icon"></i>
                        <h3>Agent Command Center</h3>
                        <p>Select a task or create a new one to begin automation.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    document.getElementById('new-task-btn').addEventListener('click', showNewTaskForm);
}

async function loadAgentTasks() {
    const taskList = document.getElementById('agent-task-list');
    try {
        const response = await fetch('http://localhost:8000/api/v1/agent/tasks/');
        const tasks = await response.json();

        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="text-muted" style="padding: 1rem;">No tasks found.</p>';
            return;
        }

        tasks.forEach(task => addTaskToList(task));
    } catch (error) {
        showError('Failed to load tasks');
        taskList.innerHTML = '<p class="text-danger">Error loading tasks.</p>';
    }
}

function addTaskToList(task) {
    const taskList = document.getElementById('agent-task-list');
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.status}`;
    taskElement.id = `task-item-${task.id}`;
    
    const time = new Date(task.created_at).toLocaleTimeString();
    
    taskElement.innerHTML = `
        <div class="task-info">
            <h4 class="task-title">${task.title}</h4>
            <div class="task-meta">
                <span>${task.status}</span> • <span>${time}</span>
            </div>
        </div>
    `;
    
    taskElement.addEventListener('click', () => loadTaskDetails(task.id));
    taskList.prepend(taskElement);

    if (task.status === 'running') {
        connectSocket(task.id);
    }
}

async function loadTaskDetails(taskId) {
    const contentArea = document.getElementById('agent-content-area');
    contentArea.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`http://localhost:8000/api/v1/agent/tasks/${taskId}`);
        const task = await response.json();

        contentArea.innerHTML = `
            <div class="task-details">
                <div class="task-details-header">
                    <h3>${task.title}</h3>
                    <span class="status-badge ${task.status}">${task.status}</span>
                </div>
                <p class="task-description">${task.description || 'No description provided.'}</p>

                <div id="task-live-view-${taskId}" class="task-live-view">
                    <div class="progress-container">
                        <div id="progress-bar-${taskId}" class="progress-bar" style="width: 0%"></div>
                    </div>
                    <div id="progress-log-${taskId}" class="progress-log">
                        <div class="log-entry">Waiting for updates...</div>
                    </div>
                </div>

                <div id="task-results-${taskId}" class="task-results ${task.result ? '' : 'hidden'}">
                    <h4>Results</h4>
                    <pre class="result-block">${JSON.stringify(task.result, null, 2)}</pre>
                </div>
            </div>
        `;

        if (task.status === 'running' || task.status === 'pending') {
             connectSocket(taskId);
        } else if (task.status === 'completed') {
            document.getElementById(`progress-bar-${taskId}`).style.width = '100%';
        }
    } catch (error) {
        showError('Failed to load task details');
    }
}

function showNewTaskForm() {
    const contentArea = document.getElementById('agent-content-area');
    contentArea.innerHTML = `
        <div class="task-form-container">
            <h3>Create New Task</h3>
            <div class="form-group">
                <label>Task Title</label>
                <input type="text" id="task-title" placeholder="e.g., Research latest AI news">
            </div>
            <div class="form-group">
                <label>Description / Query</label>
                <textarea id="task-desc" rows="4" placeholder="What exactly should the agent do?"></textarea>
            </div>
            <button id="submit-task-btn" class="btn-primary">Launch Agent</button>
        </div>
    `;

    document.getElementById('submit-task-btn').addEventListener('click', submitNewTask);
}

async function submitNewTask() {
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;

    if (!title || !desc) {
        showError('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/v1/agent/tasks/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: desc,
                task_type: 'automation',
                parameters: { query: desc }
            })
        });

        const task = await response.json();
        addTaskToList(task);
        loadTaskDetails(task.id);
    } catch (error) {
        showError('Failed to create task');
    }
}

function handleProgressUpdate(update) {
    const { taskId, stage, message, data } = update;

    // Update sidebar status
    const sidebarItem = document.getElementById(`task-item-${taskId}`);
    if (sidebarItem) {
        sidebarItem.querySelector('.task-meta span').textContent = stage.toLowerCase();
    }

    // Update details view
    const log = document.getElementById(`progress-log-${taskId}`);
    const bar = document.getElementById(`progress-bar-${taskId}`);

    if (log && bar) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="stage">[${stage}]</span> ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        const stages = ['Planning', 'Researching', 'Generating script', 'Testing', 'Executing', 'Complete'];
        const progress = ((stages.indexOf(stage) + 1) / stages.length) * 100;
        bar.style.width = `${progress}%`;

        if (stage === 'Complete' || (data && data.status === 'completed')) {
            loadTaskDetails(taskId); // Refresh to show results
        }

        // Show code artifacts if they arrive
        if (stage === 'Generating script' && data && data.code) {
             const resultArea = document.getElementById(`task-results-${taskId}`);
             if (resultArea) {
                 resultArea.classList.remove('hidden');
                 resultArea.innerHTML = `
                    <h4>Generated Script</h4>
                    <pre class="code-block"><code>${data.code}</code></pre>
                    <button class="btn-primary run-script-btn" data-code="${btoa(data.code)}">Run Script</button>
                 `;

                 resultArea.querySelector('.run-script-btn').addEventListener('click', async (e) => {
                     const code = atob(e.target.dataset.code);
                     e.target.disabled = true;
                     e.target.textContent = 'Running...';
                     try {
                         const res = await fetch('http://localhost:8000/api/v1/agent/execute', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ code })
                         });
                         const out = await res.json();
                         const outBlock = document.createElement('pre');
                         outBlock.className = 'output-block';
                         outBlock.textContent = JSON.stringify(out, null, 2);
                         resultArea.appendChild(outBlock);
                     } catch (err) {
                         showError('Execution failed');
                     } finally {
                         e.target.disabled = false;
                         e.target.textContent = 'Run Script';
                     }
                 });
             }
        }
    }
}

/**
 * Agent Mode functionality for the Pilot Browser.
 * 
 * This module handles the Agent Mode UI and interactions.
 */

import { state, showError } from './app.js';
import { invoke } from './ipc.js';

// DOM Elements
let agentContainer;

// Agent types and their configurations
const AGENT_TYPES = [
    { id: 'planner', name: 'Planner', icon: 'fas fa-tasks', color: '#4a6cf7' },
    { id: 'researcher', name: 'Researcher', icon: 'fas fa-search', color: '#17a2b8' },
    { id: 'developer', name: 'Developer', icon: 'fas fa-code', color: '#28a745' },
    { id: 'tester', name: 'Tester', icon: 'fas fa-vial', color: '#ffc107' },
    { id: 'orchestrator', name: 'Orchestrator', icon: 'fas fa-project-diagram', color: '#dc3545' }
];

// Initialize Agent Mode
export function initAgentMode() {
    agentContainer = document.getElementById('agent-container');
    if (!agentContainer) return;
    
    renderAgentModeUI();
    setupEventListeners();
    loadAgentTasks();
}

// Render the main Agent Mode UI
function renderAgentModeUI() {
    agentContainer.innerHTML = `
        <div class="agent-header">
            <h1><i class="fas fa-robot"></i> Agent Mode</h1>
            <p>Automate complex tasks with AI-powered agents</p>
        </div>
        
        <div class="agent-layout">
            <!-- Sidebar -->
            <div class="agent-sidebar">
                <div class="agent-sidebar-header">
                    <h3>Agents</h3>
                    <button id="new-task-btn" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> New Task
                    </button>
                </div>
                
                <!-- Task List -->
                <div class="task-list-container">
                    <div id="agent-task-list" class="task-list">
                        <div class="task-list-loading">
                            <div class="spinner"></div>
                            <p>Loading tasks...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="agent-main-content">
                <div id="agent-welcome" class="agent-welcome">
                    <div class="welcome-content">
                        <div class="welcome-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <h2>Welcome to Agent Mode</h2>
                        <p>Create a new task to get started with AI-powered automation.</p>
                        <button id="welcome-new-task-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Create New Task
                        </button>
                    </div>
                </div>
                
                <div id="agent-task-details" class="agent-task-details" style="display: none;">
                    <!-- Task details will be loaded here -->
                </div>
            </div>
        </div>
    `;
}

// Set up event listeners
function setupEventListeners() {
    // New task buttons
    const newTaskBtn = document.getElementById('new-task-btn');
    const welcomeNewTaskBtn = document.getElementById('welcome-new-task-btn');
    
    if (newTaskBtn) newTaskBtn.addEventListener('click', createMockTask);
    if (welcomeNewTaskBtn) welcomeNewTaskBtn.addEventListener('click', createMockTask);
}

// Create a mock task for demonstration
function createMockTask() {
    const mockTask = {
        id: `task-${Date.now()}`,
        title: 'New Research Task',
        agent_type: 'researcher',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    addTaskToList(mockTask);
    loadTaskDetails(mockTask.id);
}

// Add a task to the task list
function addTaskToList(task) {
    const taskList = document.getElementById('agent-task-list');
    if (!taskList) return;
    
    const agentType = AGENT_TYPES.find(a => a.id === task.agent_type) || {};
    
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.dataset.taskId = task.id;
    taskElement.innerHTML = `
        <div class="task-icon" style="color: ${agentType.color};">
            <i class="${agentType.icon}"></i>
        </div>
        <div class="task-info">
            <h4 class="task-title">${task.title}</h4>
            <div class="task-meta">
                <span class="task-type">${agentType.name}</span>
                <span class="task-status ${task.status}">${task.status}</span>
            </div>
        </div>
    `;
    
    taskElement.addEventListener('click', () => loadTaskDetails(task.id));
    taskList.prepend(taskElement);
}

// Load task details view
function loadTaskDetails(taskId) {
    const detailsPanel = document.getElementById('agent-task-details');
    if (!detailsPanel) return;
    
    detailsPanel.style.display = 'block';
    detailsPanel.innerHTML = `
        <div class="task-details-header">
            <h2>Task Details</h2>
            <p>Task ID: ${taskId}</p>
        </div>
        <div class="task-details-content">
            <p>Task details will be displayed here.</p>
            <button class="btn btn-primary" id="start-task-btn">
                <i class="fas fa-play"></i> Start Task
            </button>
        </div>
    `;
    
    const startBtn = document.getElementById('start-task-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => startTask(taskId));
    }
}

// Start a task
function startTask(taskId) {
    console.log(`Starting task ${taskId}`);
    
    // Update task status in the list
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.querySelector('.task-status').textContent = 'running';
        taskElement.querySelector('.task-status').className = 'task-status running';
    }
    
    // Update the details view
    const detailsPanel = document.getElementById('agent-task-details');
    if (detailsPanel) {
        detailsPanel.innerHTML = `
            <div class="task-details-header">
                <h2>Task in Progress</h2>
            </div>
            <div class="task-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <p>Task is running...</p>
            </div>
        `;
        
        // Simulate task progress
        simulateTaskProgress(taskId);
    }
}

// Simulate task progress
function simulateTaskProgress(taskId) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        if (progress > 100) progress = 100;
        
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            taskComplete(taskId);
        }
    }, 300);
}

// Handle task completion
function taskComplete(taskId) {
    // Update task status in the list
    const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.querySelector('.task-status').textContent = 'completed';
        taskElement.querySelector('.task-status').className = 'task-status completed';
    }
    
    // Update the details view
    const detailsPanel = document.getElementById('agent-task-details');
    if (detailsPanel) {
        detailsPanel.innerHTML = `
            <div class="task-details-header">
                <h2>Task Completed</h2>
            </div>
            <div class="task-result success">
                <i class="fas fa-check-circle"></i>
                <h3>Task Completed Successfully</h3>
                <p>The task has been completed successfully.</p>
            </div>
        `;
    }
}

// Load agent tasks
async function loadAgentTasks() {
    const taskList = document.getElementById('agent-task-list');
    if (!taskList) return;
    
    try {
        // In a real app, this would be an API call
        // const tasks = await invoke('agent:listTasks');
        
        // Mock data for demonstration
        const tasks = [
            {
                id: 'task-1',
                title: 'Research AI in healthcare',
                agent_type: 'researcher',
                status: 'completed',
                created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'task-2',
                title: 'Build weather dashboard',
                agent_type: 'developer',
                status: 'running',
                created_at: new Date().toISOString()
            },
            {
                id: 'task-3',
                title: 'Test login functionality',
                agent_type: 'tester',
                status: 'pending',
                created_at: new Date().toISOString()
            }
        ];
        
        // Clear loading state
        taskList.innerHTML = '';
        
        // Add tasks to the list
        tasks.forEach(task => addTaskToList(task));
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        taskList.innerHTML = `
            <div class="task-list-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load tasks</p>
                <button id="retry-load-tasks" class="btn btn-sm">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
        
        // Add retry button handler
        const retryBtn = document.getElementById('retry-load-tasks');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadAgentTasks);
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('agent-container')) {
        initAgentMode();
    }
});

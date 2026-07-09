// Search functionality for the Pilot Browser

import { state, showError, addToSearchHistory } from './app.js';

let searchController = null; // For aborting fetch requests

/**
 * Initialize search functionality
 */
export function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchForm = document.querySelector('.search-box');
    const clearBtn = document.getElementById('clear-search-btn');
    const voiceBtn = document.getElementById('voice-search-btn');
    const searchModeBtns = document.querySelectorAll('.mode-btn');
    const resultsContainer = document.getElementById('results-container');
    
    if (!searchInput || !searchForm) return;
    
    // Initialize search state
    state.search = {
        query: '',
        mode: 'search', // 'search' or 'ai'
        isSearching: false,
        results: [],
        suggestions: [],
        currentRequest: null
    };
    
    // Handle search form submission
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSearchSubmit(e);
    });

    // Handle quick action buttons
    const calcBtn = document.getElementById('calc-btn');
    const sumBtn = document.getElementById('sum-btn');
    const transBtn = document.getElementById('trans-btn');
    const weatherBtn = document.getElementById('weather-btn');
    const automateBtn = document.getElementById('automate-btn');

    if (calcBtn) calcBtn.addEventListener('click', () => {
        searchInput.value = 'Calculate: ' + searchInput.value;
        handleSearchSubmit(new Event('submit'));
    });
    
    if (sumBtn) sumBtn.addEventListener('click', () => {
        searchInput.value = 'Summarize: ' + searchInput.value;
        handleSearchSubmit(new Event('submit'));
    });

    if (transBtn) transBtn.addEventListener('click', () => {
        searchInput.value = 'Translate to English: ' + searchInput.value;
        handleSearchSubmit(new Event('submit'));
    });

    if (weatherBtn) weatherBtn.addEventListener('click', () => {
        searchInput.value = 'What is the weather in my current location?';
        handleSearchSubmit(new Event('submit'));
    });

    if (automateBtn) automateBtn.addEventListener('click', () => {
        searchInput.value = 'Automate: ' + searchInput.value;
        switchSearchMode('ai');
        handleSearchSubmit(new Event('submit'));
    });

    // Handle search input changes
    searchInput.addEventListener('input', handleSearchInput);
    
    // Handle clear button click
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
    
    // Handle search mode switching
    if (searchModeBtns.length > 0) {
        searchModeBtns.forEach(btn => {
            btn.addEventListener('click', () => switchSearchMode(btn.dataset.mode));
        });
    }
    
    // Handle voice search
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceSearch);
    }
    
    // Initialize search suggestions dropdown (if applicable)
    initSearchSuggestions();
}

/**
 * Handle search form submission
 * @param {Event} e - The form submission event
 */
async function handleSearchSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    const searchInput = document.getElementById('search-input');
    const searchInputContainer = document.querySelector('.search-input-container');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Update search state
    state.search.query = query;
    state.search.isSearching = true;
    
    // Add to search history
    addToSearchHistory(query);
    
    // Show loading state
    showSearchLoading(query);
    if (searchInputContainer) searchInputContainer.classList.add('searching-animation');
    
    try {
        // Perform the search based on the current mode
        if (state.search.mode === 'ai') {
            await performAgentTask(query);
        } else {
            await performWebSearch(query);
        }
    } catch (error) {
        console.error('Search error:', error);
        showSearchError('Failed to perform search. Please try again.');
    } finally {
        state.search.isSearching = false;
        if (searchInputContainer) searchInputContainer.classList.remove('searching-animation');
    }
}

/**
 * Perform an Agent Mode task
 */
async function performAgentTask(query) {
    try {
        showAILoading(query);

        // Call the backend API
        const response = await fetch(`${state.apiUrl}/api/v1/agent/tasks/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}` // Assuming token is in state
            },
            body: JSON.stringify({
                title: query,
                agent_type: 'orchestrator',
                input_data: { query: query, safety_level: document.getElementById('safety-level').value }
            })
        });

        const task = await response.json();
        pollTaskStatus(task.id);

    } catch (error) {
        console.error('Agent task error:', error);
        showSearchError('Failed to start agent task.');
    }
}

function pollTaskStatus(taskId) {
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`${state.apiUrl}/api/v1/agent/tasks/${taskId}`, {
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            const task = await response.json();

            if (task.status === 'completed') {
                clearInterval(interval);
                displayAgentResult(task.result);
            } else if (task.status === 'pending' && task.result && task.result.clarification_needed) {
                clearInterval(interval);
                showClarificationPopup(taskId, task.result.questions);
            } else if (task.status === 'failed') {
                clearInterval(interval);
                showSearchError('Agent task failed: ' + task.result.error);
            }
        } catch (error) {
            console.error('Polling error:', error);
            clearInterval(interval);
        }
    }, 2000);
}

function displayAgentResult(result) {
    const resultsContainer = document.getElementById('results-container');
    if (result.research) {
        displayAIResponse({
            content: result.research.summary,
            sources: result.research.sources
        });
    }

    if (result.artifact) {
        showArtifact(result.artifact);
    }
}

function showArtifact(artifact) {
    const artifactsSidebar = document.getElementById('artifacts-sidebar');
    const artifactsContent = document.getElementById('artifacts-content');

    if (artifactsSidebar && artifactsContent) {
        artifactsSidebar.classList.add('active');
        if (artifact.type === 'app') {
            artifactsContent.innerHTML = `<iframe srcdoc="${artifact.code.replace(/"/g, '&quot;')}" style="width:100%; height:100%; border:none;"></iframe>`;
        } else {
            artifactsContent.innerHTML = `
                <div class="artifact-code-container">
                    <pre><code>${artifact.code}</code></pre>
                    <div class="artifact-actions">
                        <button id="run-artifact-btn" class="btn-primary">
                            <i class="fas fa-play"></i> Run Script
                        </button>
                    </div>
                </div>
                <p>${artifact.explanation}</p>
                <div id="execution-output" class="execution-output hidden"></div>
            `;

            document.getElementById('run-artifact-btn').addEventListener('click', () => {
                runPlaywrightScript(artifact.code);
            });
        }
    }
}

async function runPlaywrightScript(code) {
    const outputEl = document.getElementById('execution-output');
    const runBtn = document.getElementById('run-artifact-btn');

    if (outputEl) {
        outputEl.classList.remove('hidden');
        outputEl.innerHTML = '<div class="spinner-small"></div> Running script...';
    }

    if (runBtn) runBtn.disabled = true;

    try {
        const response = await fetch(`${state.apiUrl}/api/v1/agent/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ code: code })
        });

        const result = await response.json();

        if (outputEl) {
            if (result.error) {
                outputEl.innerHTML = `<div class="error-text">Error: ${result.error}</div>`;
            } else {
                outputEl.innerHTML = `
                    <div class="success-text">Script finished with exit code ${result.returncode}</div>
                    <pre><code>${result.stdout}</code></pre>
                    ${result.stderr ? `<pre class="error-text"><code>${result.stderr}</code></pre>` : ''}
                `;
            }
        }
    } catch (error) {
        console.error('Execution error:', error);
        if (outputEl) outputEl.innerHTML = '<div class="error-text">Failed to execute script.</div>';
    } finally {
        if (runBtn) runBtn.disabled = false;
    }
}

function showClarificationPopup(taskId, questions) {
    const popup = document.getElementById('clarification-popup');
    const questionEl = document.getElementById('clarification-question');
    const optionsEl = document.getElementById('clarification-options');

    if (!popup || !questionEl || !optionsEl) return;

    popup.classList.remove('hidden');
    questionEl.textContent = questions[0];
    optionsEl.innerHTML = '';

    // Mocking some options for the demo
    ['Yes', 'No', 'Tell me more'].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => sendClarification(taskId, opt);
        optionsEl.appendChild(btn);
    });

    document.getElementById('send-clarification').onclick = () => {
        const val = document.getElementById('custom-clarification').value;
        sendClarification(taskId, val);
    };
}

async function sendClarification(taskId, answer) {
    document.getElementById('clarification-popup').classList.add('hidden');

    try {
        await fetch(`${state.apiUrl}/api/v1/agent/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                input_data: { answer: answer }
            })
        });

        console.log(`Clarification sent for ${taskId}: ${answer}`);
        pollTaskStatus(taskId);
    } catch (error) {
        console.error('Error sending clarification:', error);
        showSearchError('Failed to send clarification.');
    }
}

/**
 * Handle search input changes
 */
function handleSearchInput() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.classList.toggle('active', query.length > 0);
    }
    
    // Update search suggestions
    if (query.length > 1) {
        updateSearchSuggestions(query);
    } else {
        hideSearchSuggestions();
    }
}

/**
 * Clear the search input
 */
function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (clearBtn) {
        clearBtn.classList.remove('active');
    }
    
    hideSearchSuggestions();
}

/**
 * Switch between search and AI modes
 * @param {string} mode - The search mode ('search' or 'ai')
 */
function switchSearchMode(mode) {
    if (mode !== 'search' && mode !== 'ai') return;
    if (mode === state.search.mode) return;
    
    // Update UI
    const searchModeBtns = document.querySelectorAll('.mode-btn');
    searchModeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update search input placeholder
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = mode === 'ai' 
            ? 'Ask me anything...' 
            : 'Search the web...';
    }
    
    // Update state
    state.search.mode = mode;
    
    // If there's an active query, perform a new search
    if (state.search.query) {
        handleSearchSubmit(new Event('submit'));
    }
}

/**
 * Perform a web search
 * @param {string} query - The search query
 */
async function performWebSearch(query) {
    if (searchController) {
        searchController.abort();
    }
    searchController = new AbortController();
    
    try {
        const searchParams = {
            query: query,
            filters: {
                GOOGLE_API_KEY: state.preferences.googleApiKey,
                BING_API_KEY: state.preferences.bingApiKey,
                GITHUB_API_KEY: state.preferences.githubApiKey
            }
        };

        const response = await fetch(`${state.apiUrl}/api/v1/search/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(searchParams),
            signal: searchController.signal
        });
        
        const data = await response.json();
        state.search.results = data.results;
        displaySearchResults(data.results, data.provider_errors);
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Search error:', error);
            showSearchError('Failed to perform search. Please try again.');
        }
    } finally {
        searchController = null;
    }
}


/**
 * Show loading state for search
 * @param {string} query - The search query
 */
function showSearchLoading(query) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <p>Searching for "${query}"</p>
        </div>
    `;
}

/**
 * Show loading state for AI search
 * @param {string} query - The search query
 */
function showAILoading(query) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="ai-loading">
            <div class="ai-avatar">
                <div class="ai-avatar-inner">AI</div>
            </div>
            <div class="ai-message">
                <div class="ai-thinking">
                    <span></span><span></span><span></span>
                </div>
                <p>Thinking about "${query}"...</p>
            </div>
        </div>
    `;
}

/**
 * Display search results
 * @param {Array} results - The search results to display
 * @param {Object} providerErrors - Errors from search providers
 */
function displaySearchResults(results, providerErrors = null) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    // Build error badges if any
    let errorBadges = '';
    if (providerErrors) {
        errorBadges = `<div class="provider-errors">
            ${Object.entries(providerErrors).map(([provider, error]) => `
                <span class="error-badge" title="${error}">
                    <i class="fas fa-exclamation-circle"></i> ${provider} failed
                </span>
            `).join('')}
        </div>`;
    }
    
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No results found</h3>
                <p>Try different keywords or check your spelling.</p>
            </div>
        `;
        return;
    }
    
    // Generate HTML for results
    const resultsHTML = results.map((result, index) => `
        <div class="search-result fade-in" style="animation-delay: ${index * 0.05}s">
            <div class="result-source">
                <i class="${getProviderIcon(result.provider)}"></i> ${result.provider}
            </div>
            <h3 class="result-title">
                <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                    ${result.title}
                </a>
            </h3>
            <div class="result-url">${formatUrl(result.url)}</div>
            <p class="result-snippet">${result.snippet}</p>
            ${result.metadata ? `
                <div class="result-meta">
                    ${result.metadata.date ? `<span class="meta-item"><i class="far fa-calendar-alt"></i> ${result.metadata.date}</span>` : ''}
                    ${result.metadata.author ? `<span class="meta-item"><i class="far fa-user"></i> ${result.metadata.author}</span>` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Update results container
    resultsContainer.innerHTML = `
        <div class="search-results">
            <div class="search-stats">
                <span>Found ${results.length} results for "${state.search.query}"</span>
                ${errorBadges}
            </div>
            <div class="results-list">
                ${resultsHTML}
            </div>
        </div>
    `;
}

/**
 * Display AI response
 * @param {Object} response - The AI response to display
 */
function displayAIResponse(response) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="ai-response">
            <div class="ai-avatar">
                <div class="ai-avatar-inner">AI</div>
            </div>
            <div class="ai-message">
                <div class="ai-message-content">
                    ${response.content}
                </div>
                ${response.sources && response.sources.length > 0 ? `
                    <div class="ai-sources">
                        <h4>Sources:</h4>
                        <ul>
                            ${response.sources.map(source => `
                                <li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title || source.url}</a></li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Show search error
 * @param {string} message - The error message to display
 */
function showSearchError(message) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="search-error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Search Failed</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Reload</button>
        </div>
    `;
}

/**
 * Initialize search suggestions
 */
function initSearchSuggestions() {
    // This would set up the suggestions dropdown
    // Implementation depends on your UI requirements
}

/**
 * Update search suggestions based on the current query
 * @param {string} query - The current search query
 */
function updateSearchSuggestions(query) {
    // In a real app, this would fetch suggestions from your backend
    // For now, we'll use mock suggestions
    const mockSuggestions = [
        `${query} definition`,
        `${query} examples`,
        `how to ${query}`,
        `best ${query} 2023`,
        `${query} vs ${getRandomWord()}`
    ];
    
    // Update UI with suggestions
    // This is a simplified example - in a real app, you'd have a proper dropdown
    console.log('Search suggestions:', mockSuggestions);
}

/**
 * Hide search suggestions
 */
function hideSearchSuggestions() {
    // Hide the suggestions dropdown
    // Implementation depends on your UI
}

/**
 * Start voice search
 */
function startVoiceSearch() {
    // This would use the Web Speech API to capture voice input
    // Implementation depends on your requirements
    console.log('Voice search started');
    
    // Show a message to the user
    showError('Voice search is not yet implemented', 'info');
}

/**
 * Get font-awesome icon for provider
 */
function getProviderIcon(provider) {
    const icons = {
        'google': 'fab fa-google',
        'bing': 'fab fa-microsoft',
        'duckduckgo': 'fas fa-search',
        'wikipedia': 'fab fa-wikipedia-w',
        'reddit': 'fab fa-reddit',
        'github': 'fab fa-github'
    };
    return icons[provider.toLowerCase()] || 'fas fa-globe';
}

/**
 * Format a URL for display
 * @param {string} url - The URL to format
 * @returns {string} The formatted URL
 */
function formatUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '') + urlObj.pathname.replace(/\/+$/, '');
    } catch (e) {
        return url;
    }
}


/**
 * Get a random word for suggestions
 * @returns {string} A random word
 */
function getRandomWord() {
    const words = ['JavaScript', 'Python', 'React', 'Vue', 'Node.js', 'Docker', 'Kubernetes', 'Cloud', 'AI', 'ML'];
    return words[Math.floor(Math.random() * words.length)];
}

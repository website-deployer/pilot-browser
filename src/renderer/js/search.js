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
    searchForm.addEventListener('submit', handleSearchSubmit);
    
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
    e.preventDefault();
    
    const searchInput = document.getElementById('search-input');
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
    
    try {
        // Perform the search based on the current mode
        if (state.search.mode === 'ai') {
            await performAISearch(query);
        } else {
            await performWebSearch(query);
        }
    } catch (error) {
        console.error('Search error:', error);
        showSearchError('Failed to perform search. Please try again.');
    } finally {
        state.search.isSearching = false;
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
    // Cancel any pending requests
    if (searchController) {
        searchController.abort();
    }
    
    // Create a new AbortController for this request
    searchController = new AbortController();
    
    try {
        // In a real app, this would be an API call to your backend
        // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        //     signal: searchController.signal
        // });
        // const results = await response.json();
        
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const mockResults = generateMockSearchResults(query);
        
        // Update state
        state.search.results = mockResults;
        
        // Display results
        displaySearchResults(mockResults);
        
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
 * Perform an AI-powered search
 * @param {string} query - The search query
 */
async function performAISearch(query) {
    // Similar to performWebSearch but for AI mode
    // This would call your AI backend instead of the regular search
    
    try {
        // Show loading state
        showAILoading(query);
        
        // In a real app, this would be an API call to your AI backend
        // const response = await fetch('/api/ai/search', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ query })
        // });
        // const result = await response.json();
        
        // For now, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing
        
        const mockAIResponse = generateMockAIResponse(query);
        
        // Display AI response
        displayAIResponse(mockAIResponse);
        
    } catch (error) {
        console.error('AI search error:', error);
        showSearchError('Failed to get AI response. Please try again.');
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
 */
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
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
            <div class="result-source">${result.source}</div>
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
                Found ${results.length} results for "${state.search.query}"
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
 * Generate mock search results for testing
 * @param {string} query - The search query
 * @returns {Array} Mock search results
 */
function generateMockSearchResults(query) {
    const sources = ['Wikipedia', 'TechCrunch', 'Medium', 'GitHub', 'Stack Overflow', 'Reddit'];
    const mockResults = [];
    
    for (let i = 0; i < 8; i++) {
        const source = sources[Math.floor(Math.random() * sources.length)];
        const id = Math.random().toString(36).substring(2, 8);
        
        mockResults.push({
            id: `result-${id}`,
            title: `${query} - ${source} Article ${i + 1}`,
            url: `https://example.com/${source.toLowerCase()}/${query.replace(/\s+/g, '-')}-${id}`,
            snippet: `This is a sample search result for "${query}" from ${source}. It contains some sample text that would normally be a snippet from the actual search result.`,
            source: source,
            metadata: {
                date: new Date().toLocaleDateString(),
                author: Math.random() > 0.5 ? `Author ${String.fromCharCode(65 + i)}` : undefined
            }
        });
    }
    
    return mockResults;
}

/**
 * Generate a mock AI response for testing
 * @param {string} query - The search query
 * @returns {Object} Mock AI response
 */
function generateMockAIResponse(query) {
    const responses = [
        `I found some information about "${query}". Based on my knowledge, this is a topic that has been widely discussed in various sources.`,
        `Here's what I know about "${query}": It's a subject that has gained significant attention recently, with many experts weighing in on the matter.`,
        `When it comes to "${query}", there are several important aspects to consider. Let me break it down for you.`,
        `I've analyzed "${query}" and here's a summary of the key points you should know.`
    ];
    
    return {
        content: responses[Math.floor(Math.random() * responses.length)],
        sources: Array.from({ length: 3 }, (_, i) => ({
            title: `Source ${i + 1} about ${query}`,
            url: `https://example.com/article-${Math.random().toString(36).substring(2, 8)}`
        }))
    };
}

/**
 * Get a random word for suggestions
 * @returns {string} A random word
 */
function getRandomWord() {
    const words = ['JavaScript', 'Python', 'React', 'Vue', 'Node.js', 'Docker', 'Kubernetes', 'Cloud', 'AI', 'ML'];
    return words[Math.floor(Math.random() * words.length)];
}

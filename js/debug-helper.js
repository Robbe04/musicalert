/**
 * Debug Helper for MusicAlert
 * Utility functions to help diagnose and fix issues
 */
const DebugHelper = {
    /**
     * Test API token and authentication
     */
    async testApiAuth() {
        try {
            console.log("Testing API authentication...");
            const token = await api.getToken();
            console.log("✅ Token retrieved successfully:", token.substring(0, 10) + "...");
            return true;
        } catch (error) {
            console.error("❌ API authentication test failed:", error);
            return false;
        }
    },
    
    /**
     * Test getting artist details
     */
    async testArtistFetch(artistId = "4q3ewBCX7sLwd24euuV69X") { // Default to example artist
        try {
            console.log(`Testing artist fetch for ID: ${artistId}`);
            const artist = await api.getArtist(artistId);
            console.log("✅ Artist data retrieved successfully:", artist.name);
            return true;
        } catch (error) {
            console.error("❌ Artist fetch test failed:", error);
            return false;
        }
    },
    
    /**
     * Test getting artist releases
     */
    async testReleasesFetch(artistId = "4q3ewBCX7sLwd24euuV69X") { // Default to example artist
        try {
            console.log(`Testing releases fetch for artist ID: ${artistId}`);
            const releases = await api.getArtistReleases(artistId);
            console.log(`✅ Retrieved ${releases.length} releases successfully`);
            if (releases.length > 0) {
                console.log("First release:", releases[0].name);
            }
            return true;
        } catch (error) {
            console.error("❌ Releases fetch test failed:", error);
            return false;
        }
    },
    
    /**
     * Test new releases functionality
     */
    async testNewReleases() {
        try {
            console.log("Testing new releases functionality with stored favorites");
            const favorites = JSON.parse(localStorage.getItem('spotifyFavorites')) || [];
            
            if (favorites.length === 0) {
                console.log("⚠️ No favorites found - cannot test new releases");
                return false;
            }
            
            console.log(`Found ${favorites.length} favorites to check for new releases`);
            
            // Test with a shorter time period to ensure we get some results
            const releases = await api.checkNewReleases(favorites, 30); // 30 days
            
            console.log(`✅ Retrieved ${releases.length} new releases`);
            if (releases.length > 0) {
                console.log("Sample releases:", releases.slice(0, 2).map(r => 
                    `${r.artist.name} - ${r.album.name} (${r.album.release_date})`
                ));
            }
            return true;
        } catch (error) {
            console.error("❌ New releases test failed:", error);
            return false;
        }
    },
    
    /**
     * Test API limits
     */
    getApiLimitStatus() {
        const stats = api.getApiStats();
        console.group("Spotify API Rate Limit Status");
        console.log(`Token expires in: ${stats.tokenExpiresIn} seconds`);
        console.log(`Rate limited for: ${stats.rateLimitedFor} seconds`);
        console.log(`Queued requests: ${stats.queuedRequests}`);
        console.log(`Is currently rate limited: ${stats.isRateLimited}`);
        console.groupEnd();
        
        return stats;
    },
    
    /**
     * Test sequential API requests to evaluate rate limiting
     */
    async testRateLimits(count = 5) {
        console.group(`Testing API rate limits with ${count} sequential requests`);
        console.log("This will make multiple requests in sequence to test rate limiting");
        console.log("Starting test...");
        
        for (let i = 0; i < count; i++) {
            console.log(`Request ${i+1}/${count}...`);
            try {
                const artists = await api.searchArtists("techno", 1);
                console.log(`✅ Request ${i+1} successful`);
            } catch (error) {
                console.error(`❌ Request ${i+1} failed:`, error);
                break;
            }
            
            // Check if we've become rate limited
            const stats = api.getApiStats();
            if (stats.isRateLimited) {
                console.warn(`🚫 Rate limited after ${i+1} requests. Waiting time: ${stats.rateLimitedFor}s`);
                break;
            }
            
            // Wait a short time between requests
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log("Rate limit test complete");
        console.groupEnd();
    },
    
    /**
     * Create a debug drawer UI
     */
    createDebugDrawer() {
        // Remove existing drawer if present
        const existingDrawer = document.getElementById('debug-drawer');
        if (existingDrawer) {
            existingDrawer.remove();
        }
        
        // Create drawer
        const drawer = document.createElement('div');
        drawer.id = 'debug-drawer';
        drawer.className = 'fixed bottom-0 right-0 bg-gray-900 text-green-400 p-3 rounded-tl-lg z-50 shadow-lg text-xs';
        drawer.style.maxWidth = '300px';
        drawer.style.maxHeight = '400px';
        drawer.style.overflow = 'auto';
        
        // Add header
        const header = document.createElement('div');
        header.className = 'font-bold mb-2 flex justify-between items-center';
        header.innerHTML = `
            <span>🔍 MusicAlert Debug</span>
            <button id="debug-drawer-close" class="text-red-400 hover:text-red-300">×</button>
        `;
        drawer.appendChild(header);
        
        // Add API status section
        const apiSection = document.createElement('div');
        apiSection.className = 'mb-3';
        apiSection.innerHTML = `
            <div class="font-bold border-b border-gray-700 pb-1 mb-1">API Status</div>
            <div id="debug-api-stats">Loading...</div>
        `;
        drawer.appendChild(apiSection);
        
        // Add actions section
        const actionsSection = document.createElement('div');
        actionsSection.className = 'mb-3';
        actionsSection.innerHTML = `
            <div class="font-bold border-b border-gray-700 pb-1 mb-1">Actions</div>
            <button id="debug-reset-token" class="bg-blue-800 text-white px-2 py-1 rounded text-xs mr-1 mb-1">Reset Token</button>
            <button id="debug-test-api" class="bg-blue-800 text-white px-2 py-1 rounded text-xs mr-1 mb-1">Test API</button>
            <button id="debug-test-limits" class="bg-blue-800 text-white px-2 py-1 rounded text-xs mb-1">Test Rate Limits</button>
        `;
        drawer.appendChild(actionsSection);
        
        // Add log section
        const logSection = document.createElement('div');
        logSection.innerHTML = `
            <div class="font-bold border-b border-gray-700 pb-1 mb-1">Log</div>
            <div id="debug-log" class="text-xs" style="max-height: 100px; overflow-y: auto;"></div>
        `;
        drawer.appendChild(logSection);
        
        // Add drawer to document
        document.body.appendChild(drawer);
        
        // Add event listeners
        document.getElementById('debug-drawer-close').addEventListener('click', () => {
            drawer.remove();
        });
        
        document.getElementById('debug-reset-token').addEventListener('click', () => {
            this.resetApiToken();
            this.updateDebugDrawer();
            this.addLogMessage('Token reset');
        });
        
        document.getElementById('debug-test-api').addEventListener('click', async () => {
            this.addLogMessage('Starting API test...');
            await this.testApiAuth();
            this.updateDebugDrawer();
            this.addLogMessage('API test complete');
        });
        
        document.getElementById('debug-test-limits').addEventListener('click', async () => {
            this.addLogMessage('Testing rate limits...');
            await this.testRateLimits(3);
            this.updateDebugDrawer();
            this.addLogMessage('Rate limit test complete');
        });
        
        // Update stats immediately and set interval to update
        this.updateDebugDrawer();
        this.debugDrawerInterval = setInterval(() => this.updateDebugDrawer(), 1000);
        
        return drawer;
    },
    
    /**
     * Update the debug drawer with current information
     */
    updateDebugDrawer() {
        const statsElement = document.getElementById('debug-api-stats');
        if (!statsElement) return;
        
        const stats = api.getApiStats();
        
        statsElement.innerHTML = `
            <div class="grid grid-cols-2 gap-1">
                <div>Token expires:</div>
                <div class="${stats.tokenExpiresIn < 60 ? 'text-yellow-400' : 'text-green-400'}">${stats.tokenExpiresIn}s</div>
                
                <div>Rate limited:</div>
                <div class="${stats.isRateLimited ? 'text-red-400' : 'text-green-400'}">${stats.isRateLimited ? `Yes (${stats.rateLimitedFor}s)` : 'No'}</div>
                
                <div>Queued requests:</div>
                <div>${stats.queuedRequests}</div>
            </div>
        `;
    },
    
    /**
     * Add a message to the debug log
     */
    addLogMessage(message) {
        const logElement = document.getElementById('debug-log');
        if (!logElement) return;
        
        const time = new Date().toLocaleTimeString();
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<span class="text-gray-500">[${time}]</span> ${message}`;
        
        logElement.appendChild(messageElement);
        logElement.scrollTop = logElement.scrollHeight;
    },
    
    /**
     * Toggle debug drawer
     */
    toggleDebugDrawer() {
        const existingDrawer = document.getElementById('debug-drawer');
        if (existingDrawer) {
            existingDrawer.remove();
            clearInterval(this.debugDrawerInterval);
        } else {
            this.createDebugDrawer();
        }
    },
    
    /**
     * Create a status indicator for API rate limits
     */
    createApiStatusIndicator() {
        // Remove existing indicator if present
        const existingIndicator = document.getElementById('api-status-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create indicator
        const indicator = document.createElement('div');
        indicator.id = 'api-status-indicator';
        indicator.className = 'fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-50 text-sm border border-gray-200 dark:border-gray-700';
        
        indicator.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-bold">Spotify API Status</span>
                <button id="api-status-close" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="api-status-content" class="space-y-2">
                <div class="flex justify-between">
                    <span>Status:</span>
                    <span id="api-status-state" class="font-medium text-green-500">Beschikbaar</span>
                </div>
                <div class="flex justify-between">
                    <span>Volgende reset:</span>
                    <span id="api-status-reset-time" class="font-medium">-</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div id="api-status-progress" class="bg-primary h-2.5 rounded-full" style="width: 100%"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Add event listener to close button
        document.getElementById('api-status-close').addEventListener('click', () => {
            indicator.remove();
            clearInterval(this.apiStatusInterval);
        });
        
        // Update status immediately
        this.updateApiStatusIndicator();
        
        // Setup interval to update status
        this.apiStatusInterval = setInterval(() => this.updateApiStatusIndicator(), 1000);
        
        return indicator;
    },
    
    /**
     * Update API status indicator
     */
    updateApiStatusIndicator() {
        const statusState = document.getElementById('api-status-state');
        const resetTime = document.getElementById('api-status-reset-time');
        const progressBar = document.getElementById('api-status-progress');
        
        if (!statusState || !resetTime || !progressBar) return;
        
        const stats = api.getApiStats();
        
        if (stats.isRateLimited) {
            // API is rate limited
            statusState.textContent = 'Gelimiteerd';
            statusState.className = 'font-medium text-red-500';
            
            // Show countdown
            resetTime.textContent = this.formatTimeRemaining(stats.rateLimitedFor);
            
            // Calculate percentage of time remaining (assuming 30s is common rate limit duration)
            const initialLimit = 30; // default to 30 seconds if we don't know actual limit
            const pctRemaining = (stats.rateLimitedFor / initialLimit) * 100;
            progressBar.style.width = `${Math.min(100, pctRemaining)}%`;
            progressBar.className = 'bg-red-500 h-2.5 rounded-full';
            
            // Show message in UI
            this.showRateLimitMessage(stats.rateLimitedFor);
        } else {
            // API is available
            statusState.textContent = 'Beschikbaar';
            statusState.className = 'font-medium text-green-500';
            
            // Token info
            resetTime.textContent = stats.tokenExpiresIn > 0 ? 
                `Token: ${this.formatTimeRemaining(stats.tokenExpiresIn)}` : 
                'Token needed';
            
            // Progress bar
            progressBar.style.width = '100%';
            progressBar.className = 'bg-primary h-2.5 rounded-full';
            
            // Hide message if present
            this.hideRateLimitMessage();
        }
    },
    
    /**
     * Format time remaining in a human-readable format
     */
    formatTimeRemaining(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
        }
    },
    
    /**
     * Show rate limit message in UI
     */
    showRateLimitMessage(seconds) {
        const message = document.getElementById('api-rate-limit-message');
        if (!message) return;
        
        // Update message text with countdown
        const messageText = message.querySelector('span');
        if (messageText) {
            messageText.textContent = `Spotify API limiet bereikt. Je kunt weer nieuwe verzoeken doen over ${this.formatTimeRemaining(seconds)}.`;
        }
        
        // Show message if hidden
        if (message.classList.contains('hidden')) {
            message.classList.remove('hidden');
        }
    },
    
    /**
     * Hide rate limit message in UI
     */
    hideRateLimitMessage() {
        const message = document.getElementById('api-rate-limit-message');
        if (!message || message.classList.contains('hidden')) return;
        
        message.classList.add('hidden');
    },
    
    /**
     * Run all tests
     */
    async runAllTests() {
        console.group("🔍 MusicAlert Diagnostics");
        
        console.log("Starting diagnostic tests...");
        
        const authOk = await this.testApiAuth();
        const artistOk = await this.testArtistFetch();
        const releasesOk = await this.testReleasesFetch();
        const newReleasesOk = await this.testNewReleases();
        
        console.log("\nResults Summary:");
        console.log(`API Authentication: ${authOk ? '✅ OK' : '❌ Failed'}`);
        console.log(`Artist Fetch: ${artistOk ? '✅ OK' : '❌ Failed'}`);
        console.log(`Releases Fetch: ${releasesOk ? '✅ OK' : '❌ Failed'}`);
        console.log(`New Releases: ${newReleasesOk ? '✅ OK' : '❌ Failed'}`);
        
        console.log("\nRun this in the console to fix any API authentication issues:");
        console.log("localStorage.removeItem('spotifyApiToken'); localStorage.removeItem('spotifyTokenExpiry');");
        console.log("Then reload the page.");
        
        console.groupEnd();
    },
    
    /**
     * Reset API token to force a new one
     */
    resetApiToken() {
        console.log("Resetting API token...");
        api.token = '';
        api.tokenExpiresAt = 0;
        console.log("API token reset. Next API call will request a new token.");
        return true;
    }
};

// Add to window object for easy console access
window.debugHelper = DebugHelper;

// Add keyboard shortcut for debug drawer (Ctrl+Shift+D)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        DebugHelper.toggleDebugDrawer();
    }
});

// Add keyboard shortcut for API status indicator (Ctrl+Shift+A)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        DebugHelper.createApiStatusIndicator();
    }
});

console.log("Debug helper loaded. Type debugHelper.runAllTests() in the console to run diagnostics.");
console.log("Press Ctrl+Shift+D to toggle the debug drawer.");
console.log("Press Ctrl+Shift+A to show the API status indicator.");

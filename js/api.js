/**
 * Spotify API Service
 * Handles all communication with the Spotify Web API
 */
class SpotifyApiService {
    constructor() {
        this.clientId = '22db16be6a25441e977dd4d2d6617d71';
        this.clientSecret = 'c7db95f32a9347919b2899d72b4f2bc5';
        this.token = '';
        this.tokenExpiresAt = 0;
        this.rateLimitedUntil = 0;  // Timestamp when rate limit expires
        this.retryCount = 0;        // Counter for exponential backoff
        this.maxRetries = 3;        // Maximum number of retries
        this.requestQueue = [];     // Queue for pending requests
        this.isProcessingQueue = false; // Flag to prevent multiple queue processors
    }

    /**
     * Get a new access token using client credentials
     */
    async getToken() {
        try {
            // Check if we already have a valid token
            if (this.token && Date.now() < this.tokenExpiresAt) {
                return this.token;
            }

            ui.showLoading('Verbinding maken met Spotify...');
            
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`
            });
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`Authentication error: ${data.error}`);
            }
            
            this.token = data.access_token;
            // Set token expiration (subtract 60 seconds as buffer)
            this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
            
            ui.hideLoading();
            return this.token;
        } catch (error) {
            ui.hideLoading();
            ui.showError('Er is een fout opgetreden bij het verbinden met Spotify. Probeer de pagina te vernieuwen.');
            console.error('Error getting token:', error);
            throw error;
        }
    }

    /**
     * Get headers with authorization token
     */
    async getHeaders() {
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Execute API request with rate limiting handling
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     */
    async executeRequest(url, options = {}) {
        // Check if we're in a rate limited state
        if (Date.now() < this.rateLimitedUntil) {
            const waitTime = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
            console.warn(`Rate limited. Waiting ${waitTime} seconds before retrying.`);
            
            // Create a promise that will resolve when the rate limit expires
            return new Promise((resolve, reject) => {
                this.addToQueue({ url, options, resolve, reject });
            });
        }

        try {
            // Add the authorization header if not provided
            if (!options.headers) {
                options.headers = await this.getHeaders();
            }

            const response = await fetch(url, options);
            
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '30');
                this.rateLimitedUntil = Date.now() + (retryAfter * 1000);
                
                // Notify user about rate limiting
                ui.showMessage(`Spotify API limiet bereikt. Wacht ${retryAfter} seconden voordat je verder gaat.`, 'error');
                console.warn(`Rate limited by Spotify API. Retry after ${retryAfter} seconds.`);
                
                // Add the request to the queue
                return new Promise((resolve, reject) => {
                    this.addToQueue({ url, options, resolve, reject });
                });
            }
            
            // Reset retry count on successful requests
            this.retryCount = 0;
            
            // Handle 401 errors (token expired)
            if (response.status === 401) {
                console.log('Token expired. Getting a new one...');
                this.token = '';
                this.tokenExpiresAt = 0;
                
                // Retry the request with a new token
                options.headers = await this.getHeaders();
                return this.executeRequest(url, options);
            }
            
            // Handle other errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API returned status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }
            
            return response.json();
        } catch (error) {
            // Exponential backoff for network errors
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
                    console.warn(`Network error. Retrying in ${delay/1000} seconds... (Attempt ${this.retryCount} of ${this.maxRetries})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.executeRequest(url, options);
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Add a request to the queue
     */
    addToQueue(request) {
        this.requestQueue.push(request);
        
        // Start processing the queue if not already processing
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }
    
    /**
     * Process the queue of pending requests
     */
    async processQueue() {
        if (this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            // Wait until rate limit expires
            const waitTime = this.rateLimitedUntil - Date.now();
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Add 1 second buffer
            }
            
            // Process the next request
            const { url, options, resolve, reject } = this.requestQueue.shift();
            
            try {
                const result = await this.executeRequest(url, options);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
        
        this.isProcessingQueue = false;
    }

    /**
     * Search for artists
     */
    async searchArtists(query, limit = 10) {
        try {
            ui.showLoading('Artiesten zoeken...');
            
            const data = await this.executeRequest(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`
            );
            
            ui.hideLoading();
            return data.artists.items;
        } catch (error) {
            ui.hideLoading();
            if (this.isRateLimitError(error)) {
                ui.showMessage('Spotify API limiet bereikt. Probeer het later nog eens.', 'error');
            } else {
                ui.showError('Er is een fout opgetreden bij het zoeken. Probeer het opnieuw.');
            }
            console.error('Error searching artists:', error);
            return [];
        }
    }
    
    /**
     * Check if error is a rate limit error
     */
    isRateLimitError(error) {
        return error.message && (
            error.message.includes('429') || 
            error.message.toLowerCase().includes('rate limit') ||
            error.message.toLowerCase().includes('too many requests')
        );
    }

    /**
     * Get available genres
     */
    async getGenres() {
        try {
            const data = await this.executeRequest(
                'https://api.spotify.com/v1/recommendations/available-genre-seeds'
            );
            
            return data.genres;
        } catch (error) {
            console.error('Error fetching genres:', error);
            return [];
        }
    }

    /**
     * Get artist details
     */
    async getArtist(artistId) {
        try {
            return await this.executeRequest(
                `https://api.spotify.com/v1/artists/${artistId}`
            );
        } catch (error) {
            console.error('Error fetching artist:', error);
            
            if (this.isRateLimitError(error)) {
                ui.showMessage('Spotify API limiet bereikt. Probeer het later nog eens.', 'error');
            }
            
            throw error;
        }
    }

    /**
     * Get related artists
     */
    async getRelatedArtists(artistId) {
        try {
            const data = await this.executeRequest(
                `https://api.spotify.com/v1/artists/${artistId}/related-artists`
            );
            
            return data.artists.slice(0, 5); // Return top 5 related artists
        } catch (error) {
            console.error('Error fetching related artists:', error);
            
            if (this.isRateLimitError(error)) {
                ui.showMessage('Spotify API limiet bereikt voor het ophalen van vergelijkbare artiesten.', 'error');
            }
            
            return [];
        }
    }

    /**
     * Get latest releases from an artist
     */
    async getArtistReleases(artistId, limit = 6) {
        try {
            ui.showLoading('Releases ophalen...');
            
            // First, get both albums and singles
            const data = await this.executeRequest(
                `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=single,album&limit=20&market=NL`
            );
            
            console.log(`Found ${data.items.length} releases for artist ${artistId}`);
            
            // Sort releases by release date (newest first)
            const sortedReleases = data.items.sort((a, b) => {
                return new Date(b.release_date) - new Date(a.release_date);
            });
            
            // Create a map to track the most recent release for each title
            // This helps eliminate duplicate releases (e.g., same album in different regions)
            const uniqueReleases = new Map();
            
            // Filter out duplicates and prioritize singles over albums when they have the same name
            sortedReleases.forEach(release => {
                const normalizedTitle = release.name.toLowerCase().trim();
                
                if (!uniqueReleases.has(normalizedTitle)) {
                    uniqueReleases.set(normalizedTitle, release);
                } else {
                    // If we already have this title and the current item is a single while the stored is an album,
                    // or if it's newer than what we have, replace it
                    const existingRelease = uniqueReleases.get(normalizedTitle);
                    const existingReleaseDate = new Date(existingRelease.release_date);
                    const currentReleaseDate = new Date(release.release_date);
                    
                    // Prioritize singles over albums, or newer releases
                    if ((release.album_type === 'single' && existingRelease.album_type === 'album') ||
                        (currentReleaseDate > existingReleaseDate)) {
                        uniqueReleases.set(normalizedTitle, release);
                    }
                }
            });
            
            // Take the most recent unique releases
            const latestReleases = Array.from(uniqueReleases.values()).slice(0, limit);
            console.log(`After deduplication, showing ${latestReleases.length} releases`);
            
            // Get full album details with tracks
            const albumPromises = latestReleases.map(album => 
                this.executeRequest(`https://api.spotify.com/v1/albums/${album.id}`)
            );
            
            // Use Promise.allSettled to get as many albums as possible even if some fail
            const albumResults = await Promise.allSettled(albumPromises);
            
            // Filter out any failed album fetches and get successful ones
            const validAlbums = albumResults
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            
            if (validAlbums.length === 0 && albumPromises.length > 0) {
                throw new Error('Geen albums konden opgehaald worden');
            }
            
            ui.hideLoading();
            return validAlbums;
        } catch (error) {
            ui.hideLoading();
            
            if (this.isRateLimitError(error)) {
                ui.showMessage('Spotify API limiet bereikt. Probeer het later nog eens.', 'error');
            } else {
                ui.showError('Er is een fout opgetreden bij het ophalen van releases. Probeer het opnieuw.');
            }
            
            console.error('Error fetching artist releases:', error);
            return [];
        }
    }

    /**
     * Get recommendations based on artists
     */
    async getRecommendations(artistIds, limit = 6) {
        try {
            if (!artistIds.length) return [];
            
            ui.showLoading('Aanbevelingen laden...');
            
            const headers = await this.getHeaders();
            // Use up to 5 seed artists
            const seedArtists = artistIds.slice(0, 5).join(',');
            
            const data = await this.executeRequest(
                `https://api.spotify.com/v1/recommendations?seed_artists=${seedArtists}&limit=${limit}&market=NL`
            );
            
            // Get full artist details for each recommendation
            const artistsDetails = new Set();
            for (const track of data.tracks) {
                for (const artist of track.artists) {
                    if (!artistIds.includes(artist.id)) {
                        artistsDetails.add(artist.id);
                    }
                }
            }
            
            const recommendedArtists = await Promise.all(
                [...artistsDetails].slice(0, 6).map(async (id) => {
                    return await this.getArtist(id);
                })
            );
            
            ui.hideLoading();
            return recommendedArtists;
        } catch (error) {
            ui.hideLoading();
            console.error('Error fetching recommendations:', error);
            return [];
        }
    }

    /**
     * Check for new releases from favorite artists
     */
    async checkNewReleases(favorites, releaseAgeDays = 7) {
        try {
            if (!favorites.length) return [];
            
            ui.showLoading('Nieuwe releases controleren...');
            
            const headers = await this.getHeaders();
            const lastCheck = parseInt(localStorage.getItem('lastReleaseCheck') || '0');
            const now = Date.now();
            
            // Look back the specified number of days (in milliseconds)
            const lookBackPeriod = releaseAgeDays * 24 * 60 * 60 * 1000;
            const cutoffDate = now - lookBackPeriod;
            
            console.log(`Checking for releases since ${new Date(cutoffDate).toLocaleDateString()} (${releaseAgeDays} days)`);
            
            let newReleases = [];
            let processedAlbumIds = new Set(); // Track album IDs to prevent duplicates
            
            // Process favorites in batches to reduce API load
            const batchSize = 5;
            for (let i = 0; i < favorites.length; i += batchSize) {
                const batch = favorites.slice(i, i + batchSize);
                
                for (const artist of batch) {
                    try {
                        // Wait a small delay between artists in a batch
                        if (i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        
                        const data = await this.executeRequest(
                            `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=single,album&limit=10&market=NL`
                        );
                        
                        // Find albums released within the lookback period
                        const recentReleases = data.items.filter(album => {
                            const releaseDate = new Date(album.release_date).getTime();
                            // Check if album is recent and not already processed
                            return releaseDate > cutoffDate && !processedAlbumIds.has(album.id);
                        });
                        
                        console.log(`Found ${recentReleases.length} recent releases for ${artist.name}`);
                        
                        for (const album of recentReleases) {
                            // Mark this album as processed
                            processedAlbumIds.add(album.id);
                            
                            // Check if this is a collaboration by looking at all artists on the album
                            const collaboratingArtists = album.artists.map(a => a.id);
                            
                            // Find primary artist (the first favorite artist that's on this album)
                            let primaryArtist = artist;
                            
                            // If this is a collab with another favorite artist, use the one with earlier position in favorites
                            if (collaboratingArtists.length > 1) {
                                const favoriteCollaborators = favorites.filter(fav => 
                                    collaboratingArtists.includes(fav.id) && fav.id !== artist.id
                                );
                                
                                if (favoriteCollaborators.length > 0) {
                                    // Use first favorite artist in the list as primary
                                    const firstFavoriteIndex = Math.min(
                                        favorites.findIndex(f => f.id === artist.id),
                                        ...favoriteCollaborators.map(fc => favorites.findIndex(f => f.id === fc.id))
                                    );
                                    primaryArtist = favorites[firstFavoriteIndex];
                                }
                            }
                            
                            // Get all collaborating artist names for display
                            let collaborationInfo = null;
                            if (album.artists.length > 1) {
                                const otherArtistNames = album.artists
                                    .filter(a => a.id !== primaryArtist.id)
                                    .map(a => a.name);
                                
                                if (otherArtistNames.length > 0) {
                                    collaborationInfo = {
                                        isCollaboration: true,
                                        collaboratingArtists: otherArtistNames
                                    };
                                }
                            }
                            
                            newReleases.push({
                                artist: primaryArtist,
                                album: album,
                                collaborationInfo: collaborationInfo
                            });
                        }
                    } catch (error) {
                        console.error(`Error processing artist ${artist.name}:`, error);
                    }
                }
                
                // Add a small delay between batches
                if (i + batchSize < favorites.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            console.log(`Found a total of ${newReleases.length} new releases within the last ${releaseAgeDays} days`);
            
            // Only update last check time if we successfully processed all artists
            localStorage.setItem('lastReleaseCheck', now.toString());
            
            ui.hideLoading();
            return newReleases;
        } catch (error) {
            ui.hideLoading();
            console.error('Error checking for new releases:', error);
            return [];
        }
    }
    
    /**
     * Get stats about Spotify API usage
     */
    getApiStats() {
        return {
            tokenExpiresIn: Math.max(0, Math.floor((this.tokenExpiresAt - Date.now()) / 1000)),
            rateLimitedFor: Math.max(0, Math.floor((this.rateLimitedUntil - Date.now()) / 1000)),
            queuedRequests: this.requestQueue.length,
            isRateLimited: Date.now() < this.rateLimitedUntil
        };
    }
}

// Initialize API service
const api = new SpotifyApiService();

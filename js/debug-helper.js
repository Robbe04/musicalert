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

console.log("Debug helper loaded. Type debugHelper.runAllTests() in the console to run diagnostics.");

/**
 * Display Module
 * Handles rendering content to the UI
 */
class DisplayModule {
    constructor(uiService) {
        this.uiService = uiService;
        this.audioVisualizers = new Map(); // Move audio visualizer functionality here
    }

    /**
     * Initialize release age setting
     */
    initializeReleaseAgeSetting() {
        const releaseAgeInput = document.getElementById('release-age');
        const releaseAgeApplyBtn = document.getElementById('release-age-apply');
        
        if (releaseAgeInput && releaseAgeApplyBtn) {
            // Set initial value from app settings
            releaseAgeInput.value = app.releaseAgeDays || 7;
            
            // Apply button click handler
            releaseAgeApplyBtn.addEventListener('click', () => {
                const days = parseInt(releaseAgeInput.value);
                app.setReleaseAgeDays(days);
            });
            
            // Also apply when pressing Enter in the input
            releaseAgeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const days = parseInt(releaseAgeInput.value);
                    app.setReleaseAgeDays(days);
                }
            });
            
            // Validate input on blur (when leaving the field)
            releaseAgeInput.addEventListener('blur', () => {
                let days = parseInt(releaseAgeInput.value);
                
                if (isNaN(days) || days < 1) {
                    days = 7; // Reset to default
                } else if (days > 14) {
                    days = 14; // Cap at 14
                }
                
                releaseAgeInput.value = days;
            });
        }
    }

    /**
     * Display favorites with sorting and filtering options
     */
    displayFavorites(favorites) {
        const container = document.getElementById('favorites');
        const filterContainer = document.getElementById('favorites-filter-container');
        
        if (!favorites.length) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-heart text-5xl"></i>
                    </div>
                    <p class="text-gray-500">Je hebt nog geen DJ's gevolgd</p>
                    <p class="text-gray-500 text-sm mt-2">Zoek naar artiesten en voeg ze toe aan je favorieten</p>
                </div>
            `;
            
            // Hide filter options when no favorites
            if (filterContainer) filterContainer.classList.add('hidden');
            return;
        }
        
        // Show filter options when we have favorites
        if (filterContainer) filterContainer.classList.remove('hidden');
        
        // Deep copy the favorites array to avoid mutating the original
        let sortedFavorites = JSON.parse(JSON.stringify(favorites));
        
        // Get current sort order
        const sortOrder = document.getElementById('favorites-sort')?.value || 'name-asc';
        
        // Sort according to selected option
        switch (sortOrder) {
            case 'name-asc':
                sortedFavorites.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                sortedFavorites.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'recent':
                // If we have added timestamp, use it, otherwise keep original order
                sortedFavorites.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
                break;
            default:
                // Default to alphabetical
                sortedFavorites.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Apply search filter if there's text in the search input
        const searchQuery = document.getElementById('favorites-search')?.value?.trim().toLowerCase();
        if (searchQuery) {
            sortedFavorites = sortedFavorites.filter(artist => 
                artist.name.toLowerCase().includes(searchQuery)
            );
        }
        
        // If no results after filtering
        if (sortedFavorites.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-search text-5xl"></i>
                    </div>
                    <p class="text-gray-500">Geen DJ's gevonden die overeenkomen met "${searchQuery}"</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        sortedFavorites.forEach(artist => {
            html += `
                <div class="artist-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col animate__animated animate__fadeIn">
                    <div class="h-40 bg-gray-200 overflow-hidden relative">
                        ${artist.img ? 
                            `<img src="${artist.img}" alt="${artist.name}" class="w-full h-full object-cover">` : 
                            `<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                                <i class="fas fa-music text-4xl"></i>
                            </div>`
                        }
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-20"></div>
                    </div>
                    <div class="p-4 flex-grow flex flex-col">
                        <h3 class="font-bold text-lg mb-1 truncate">${artist.name}</h3>
                        ${artist.genres ? 
                            `<p class="text-gray-600 text-sm mb-3 truncate">${this.uiService.formatGenreName(artist.genres[0] || '')}</p>` : 
                            '<p class="text-gray-600 text-sm mb-3">DJ / Producer</p>'
                        }
                        <div class="mt-auto flex gap-1 sm:gap-2">
                            <button onclick="app.getLatestTracks('${artist.id}')" 
                                class="flex-1 bg-primary hover:bg-primary-dark text-white py-1 sm:py-2 rounded-lg transition flex items-center justify-center text-xs sm:text-sm">
                                <i class="fas fa-headphones mr-1 sm:mr-2"></i>Muziek
                            </button>
                            <button onclick="app.toggleFavorite('${artist.id}')" 
                                class="bg-red-500 hover:bg-red-600 text-white p-1 sm:p-2 rounded-lg transition">
                                <i class="fas fa-heart-broken"></i>
                            </button>
                            <button onclick="app.shareArtist('${artist.id}', '${artist.name}')"
                                class="bg-blue-500 hover:bg-blue-600 text-white p-1 sm:p-2 rounded-lg transition">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Display notifications of new releases
     */
    displayNotifications(releases) {
        const container = document.getElementById('notifications');
        const filterContainer = document.getElementById('notifications-filter-container');
        
        if (!releases.length) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-bell text-5xl"></i>
                    </div>
                    <p class="text-gray-500">Geen nieuwe releases (< ${app.releaseAgeDays || 7} dagen) gevonden van je gevolgde DJ's</p>
                    <p class="text-gray-500 text-sm mt-2">We laten het je weten wanneer er nieuwe muziek uitkomt</p>
                </div>
            `;
            
            // Hide filter options when no releases
            if (filterContainer) filterContainer.classList.add('hidden');
            return;
        }
        
        // Show filter options when we have releases
        if (filterContainer) filterContainer.classList.remove('hidden');
        
        // Create a flattened list of releases for easier sorting
        let flatReleases = [];
        
        releases.forEach(release => {
            flatReleases.push({
                artist: release.artist,
                album: release.album,
                collaborationInfo: release.collaborationInfo,
                releaseDate: new Date(release.album.release_date).getTime()
            });
        });
        
        // Get sort order
        const sortOrder = document.getElementById('notifications-sort')?.value || 'date-desc';
        
        // Sort according to selected option
        switch (sortOrder) {
            case 'date-desc': // Newest first (default)
                flatReleases.sort((a, b) => b.releaseDate - a.releaseDate);
                break;
            case 'date-asc': // Oldest first
                flatReleases.sort((a, b) => a.releaseDate - b.releaseDate);
                break;
            case 'artist-asc': // Artist name A-Z
                flatReleases.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
                break;
            case 'artist-desc': // Artist name Z-A
                flatReleases.sort((a, b) => b.artist.name.localeCompare(a.artist.name));
                break;
            default:
                flatReleases.sort((a, b) => b.releaseDate - a.releaseDate);
        }
        
        // Apply search filter if there's text in the search input
        const searchQuery = document.getElementById('notifications-search')?.value?.trim().toLowerCase();
        if (searchQuery) {
            flatReleases = flatReleases.filter(release => {
                // Search in artist name, album name, and collaborators
                const artistNameMatch = release.artist.name.toLowerCase().includes(searchQuery);
                const albumNameMatch = release.album.name.toLowerCase().includes(searchQuery);
                
                // Check collaborator names if this is a collaboration
                let collaboratorMatch = false;
                if (release.collaborationInfo && release.collaborationInfo.isCollaboration) {
                    collaboratorMatch = release.collaborationInfo.collaboratingArtists.some(
                        artist => artist.toLowerCase().includes(searchQuery)
                    );
                }
                
                return artistNameMatch || albumNameMatch || collaboratorMatch;
            });
        }
        
        // If no results after filtering
        if (flatReleases.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-search text-5xl"></i>
                    </div>
                    <p class="text-gray-500">Geen releases gevonden die overeenkomen met "${searchQuery}"</p>
                </div>
            `;
            return;
        }
        
        // Display as a list
        let html = '<div class="space-y-4">';
        
        flatReleases.forEach(release => {
            const { artist, album, collaborationInfo } = release;
            const releaseDate = new Date(album.release_date).toLocaleDateString('nl-NL');
            const daysAgo = Math.floor((Date.now() - new Date(album.release_date).getTime()) / (1000 * 60 * 60 * 24));
            const releaseDateText = daysAgo === 0 ? 'Vandaag' : daysAgo === 1 ? 'Gisteren' : `${daysAgo} dagen geleden`;
            
            // Create collaboration display text if needed
            let collaborationText = '';
            if (collaborationInfo && collaborationInfo.isCollaboration) {
                const otherArtists = collaborationInfo.collaboratingArtists;
                collaborationText = otherArtists.length === 1 
                    ? `met ${otherArtists[0]}` 
                    : `met ${otherArtists.slice(0, -1).join(', ')} & ${otherArtists.slice(-1)}`;
            }
            
            html += `
                <div class="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate__animated animate__fadeIn">
                    <div class="flex items-start">
                        <img src="${album.images[0]?.url || ''}" alt="${album.name}" class="w-20 h-20 mr-4 object-cover rounded-lg">
                        <div class="flex-1">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="flex flex-wrap items-center gap-x-1 gap-y-0">
                                        <p class="font-bold text-lg">${artist.name}</p>
                                        ${collaborationText ? 
                                            `<span class="text-xs bg-primary bg-opacity-20 text-primary-dark px-2 py-0.5 rounded-full">
                                                ${collaborationText}
                                            </span>` : 
                                            ''
                                        }
                                    </div>
                                    <p class="text-primary-dark font-medium">${album.name}</p>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span class="text-sm bg-secondary-light text-secondary-dark px-2 py-1 rounded-full">
                                        ${releaseDate}
                                    </span>
                                    <span class="text-xs text-gray-500 mt-1">${releaseDateText}</span>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm mb-3">
                                ${album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)} • ${album.total_tracks} ${album?.total_tracks == '1' ? 'nummer' : 'nummers'}
                            </p>
                            <div class="flex gap-1 sm:gap-2">
                                <a href="${album.external_urls.spotify}" target="_blank" 
                                    class="flex-1 text-center bg-green-600 hover:bg-green-700 text-white py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition">
                                    <i class="fab fa-spotify mr-1 sm:mr-2"></i>Beluisteren
                                </a>
                                <button onclick="app.getLatestTracks('${artist.id}')" 
                                    class="flex-1 bg-primary hover:bg-primary-dark text-white py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition">
                                    Meer bekijken
                                </button>
                                <button onclick="app.shareRelease('${artist.name}', '${album.name}', '${album.external_urls.spotify}')" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white p-1 sm:p-2 rounded-lg transition">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Display recommended artists
     */
    displayRecommendations(artists) {
        const container = document.getElementById('recommendations');
        
        if (!artists.length) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-magic text-5xl"></i>
                    </div>
                    <p class="text-gray-500">Volg eerst enkele DJ's om aanbevelingen te krijgen</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        artists.forEach(artist => {
            const isFavorite = app.favorites.some(fav => fav.id === artist.id);
            
            html += `
                <div class="artist-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col animate__animated animate__fadeIn">
                    <div class="h-40 bg-gray-200 overflow-hidden relative">
                        ${artist.images.length ? 
                            `<img src="${artist.images[0].url}" alt="${artist.name}" class="w-full h-full object-cover">` : 
                            `<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                                <i class="fas fa-music text-4xl"></i>
                            </div>`
                        }
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-20"></div>
                    </div>
                    <div class="p-4 flex-grow flex flex-col">
                        <h3 class="font-bold text-lg mb-1 truncate">${artist.name}</h3>
                        <p class="text-gray-600 text-sm mb-1 truncate">
                            ${artist.genres && artist.genres.length ? this.uiService.formatGenreName(artist.genres[0]) : 'DJ / Producer'}
                        </p>
                        <div class="flex items-center mb-3">
                            <div class="text-yellow-500 mr-1">
                                <i class="fas fa-star"></i>
                            </div>
                            <span class="text-sm text-gray-600">${artist.popularity}% populariteit</span>
                        </div>
                        <div class="mt-auto flex gap-2">
                            <button onclick="app.getLatestTracks('${artist.id}')" 
                                class="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition flex items-center justify-center">
                                <i class="fas fa-headphones mr-2"></i>Ontdekken
                            </button>
                            <button onclick="app.toggleFavorite('${artist.id}', '${artist.name}', '${artist.images.length ? artist.images[0].url : ''}')" 
                                class="${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} p-2 rounded-lg transition">
                                <i class="fas ${isFavorite ? 'fa-heart-broken' : 'fa-heart'}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    /**
     * Display latest tracks
     */
    displayLatestTracks(artist, albums, relatedArtists = []) {
        const resultsContainer = document.getElementById('results');
        const artistImg = artist.images.length > 0 ? artist.images[0].url : '';
        const artistGenres = artist.genres.length ? 
            artist.genres.map(genre => this.uiService.formatGenreName(genre)).join(', ') : 
            'DJ / Producer';
        const isFavorite = app.favorites.some(fav => fav.id === artist.id);
        
        let html = `
            <div class="animate__animated animate__fadeIn">
                <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                    <div class="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                        ${artistImg ? 
                            `<img src="${artistImg}" alt="${artist.name}" class="w-full h-full object-cover">` : 
                            `<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                                <i class="fas fa-music text-4xl"></i>
                            </div>`
                        }
                    </div>
                    <div class="flex-1 text-center md:text-left">
                        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                            <h2 class="text-3xl font-bold text-primary mb-2 md:mb-0">${artist.name}</h2>
                            <button onclick="app.toggleFavorite('${artist.id}', '${artist.name}', '${artistImg}')" 
                                class="inline-flex items-center justify-center px-4 py-2 rounded-lg ${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary-dark'} text-white transition self-center md:self-auto">
                                <i class="fas ${isFavorite ? 'fa-heart-broken' : 'fa-heart'} mr-2"></i>
                                ${isFavorite ? 'Niet meer volgen' : 'Volgen'}
                            </button>
                        </div>
                        <p class="text-gray-600 mb-4">${artistGenres}</p>
                        <div class="flex items-center justify-center md:justify-start mb-4">
                            <div class="text-yellow-500 mr-2">
                                ${this.getPopularityStars(artist.popularity)}
                            </div>
                            <span class="text-sm text-gray-600">${artist.popularity}% populariteit</span>
                        </div>
                        <p class="text-gray-600">
                            ${artist.followers.total.toLocaleString('nl-NL')} volgers op Spotify
                        </p>
                        <div class="mt-4">
                            <a href="${artist.external_urls.spotify}" target="_blank" 
                               class="inline-flex items-center text-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
                               <i class="fab fa-spotify mr-2"></i>Bekijk op Spotify
                            </a>
                        </div>
                    </div>
                </div>
                <h3 class="text-2xl font-bold mb-6 text-primary">Nieuwste Releases</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        `;
        
        albums.forEach(album => {
            const releaseDate = new Date(album.release_date).toLocaleDateString('nl-NL');
            const previewTrack = album.tracks.items.find(track => track.preview_url);
            
            html += `
                <div class="album-card bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 animate__animated animate__fadeIn">
                    <div class="relative h-48 bg-gray-200 overflow-hidden">
                        ${album.images.length ? 
                            `<img src="${album.images[0].url}" alt="${album.name}" class="w-full h-full object-cover">` : 
                            `<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                                <i class="fas fa-music text-4xl"></i>
                            </div>`
                        }
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                            <span class="text-xs font-medium text-white bg-primary bg-opacity-90 rounded-full px-2 py-1">
                                ${album.album_type.toUpperCase()}
                            </span>
                            <span class="text-xs font-medium text-white ml-2">${releaseDate}</span>
                        </div>
                    </div>
                    <div class="p-4">
                        <h4 class="font-bold text-lg mb-1">${album.name}</h4>
                        <p class="text-gray-600 text-sm mb-3">${album.total_tracks} nummers</p>
                        ${previewTrack ? `
                            <div class="mb-4">
                                <div class="audio-visualizer" id="visualizer-${previewTrack.id}" data-track-id="${previewTrack.id}">
                                    ${Array(20).fill().map(() => `<div class="audio-bar" style="height: ${5 + Math.random() * 25}px;"></div>`).join('')}
                                </div>
                                <audio 
                                    id="audio-${previewTrack.id}" 
                                    class="w-full audio-player" 
                                    src="${previewTrack.preview_url}" 
                                    data-track-id="${previewTrack.id}"
                                    controls
                                    data-artist-id="${artist.id}"
                                    data-album-name="${album.name}"
                                    data-track-name="${previewTrack.name}"
                                ></audio>
                            </div>
                        ` : `
                            <p class="text-red-500 mb-4 text-sm">Preview niet beschikbaar</p>
                        `}
                        
                        <div class="mb-4">
                            <button 
                                class="w-full text-left bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition mb-2"
                                onclick="ui.toggleTrackList('${album.id}')"
                            >
                                <div class="flex justify-between items-center">
                                    <span><i class="fas fa-list mr-2"></i>Bekijk alle tracks</span>
                                    <i class="fas fa-chevron-down text-gray-500" id="tracklist-icon-${album.id}"></i>
                                </div>
                            </button>
                            <div id="tracklist-${album.id}" class="hidden mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Titel</th>
                                            <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Duur</th>
                                            <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Preview</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        ${album.tracks.items.map((track, index) => {
                                            const minutes = Math.floor(track.duration_ms / 60000);
                                            const seconds = Math.floor((track.duration_ms % 60000) / 1000);
                                            return `
                                                <tr class="track-item hover:bg-gray-50">
                                                    <td class="px-3 py-2 text-xs text-gray-500">${index + 1}</td>
                                                    <td class="px-3 py-2 text-sm truncate" style="max-width: 150px;">${track.name}</td>
                                                    <td class="px-3 py-2 text-xs text-gray-500 text-right">${minutes}:${seconds.toString().padStart(2, '0')}</td>
                                                    <td class="px-3 py-2 text-right">
                                                        ${track.preview_url ? `
                                                            <a href="${track.preview_url}" target="_blank" class="text-primary hover:text-primary-dark">
                                                                <i class="fas fa-play"></i>
                                                            </a>
                                                        ` : `
                                                            <span class="text-gray-400"><i class="fas fa-ban"></i></span>
                                                        `}
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div class="flex gap-2 mb-2">
                            <a href="${album.external_urls.spotify}" target="_blank" 
                               class="flex-1 text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                               <i class="fab fa-spotify mr-2"></i>Beluisteren
                            </a>
                            <button onclick="app.shareRelease('${artist.name}', '${album.name}', '${album.external_urls.spotify}')" 
                               class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                               <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
        `;
        
        // Add related artists section
        if (relatedArtists && relatedArtists.length > 0) {
            html += `
                <h3 class="text-2xl font-bold my-6 text-primary">Vergelijkbare DJ's</h3>
                <div class="flex overflow-x-auto pb-4 space-x-4 related-artists-scroll">
            `;
            
            relatedArtists.forEach(relArtist => {
                const isFavorite = app.favorites.some(fav => fav.id === relArtist.id);
                
                html += `
                    <div class="flex-shrink-0 w-48 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                        <div class="h-48 bg-gray-200 overflow-hidden relative">
                            ${relArtist.images.length ? 
                                `<img src="${relArtist.images[0].url}" alt="${relArtist.name}" class="w-full h-full object-cover">` : 
                                `<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                                    <i class="fas fa-music text-4xl"></i>
                                </div>`
                            }
                        </div>
                        <div class="p-3">
                            <h4 class="font-bold truncate">${relArtist.name}</h4>
                            <p class="text-gray-600 text-xs mb-2 truncate">
                                ${relArtist.genres.length ? this.uiService.formatGenreName(relArtist.genres[0]) : 'DJ / Producer'}
                            </p>
                            <div class="flex gap-1">
                                <button onclick="app.getLatestTracks('${relArtist.id}')" 
                                    class="flex-1 bg-primary hover:bg-primary-dark text-white py-1 text-sm rounded-lg transition">
                                    Verkennen
                                </button>
                                <button onclick="app.toggleFavorite('${relArtist.id}', '${relArtist.name}', '${relArtist.images.length ? relArtist.images[0].url : ''}')" 
                                    class="${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} p-1 rounded-lg transition">
                                    <i class="fas ${isFavorite ? 'fa-heart-broken' : 'fa-heart'}"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                </div>
            `;
        }
        
        resultsContainer.innerHTML = html;
        
        // Initialize audio visualizers
        this.initAudioVisualizers();
    }
    
    /**
     * Initialize audio visualizers for tracks
     */
    initAudioVisualizers() {
        document.querySelectorAll('.audio-player').forEach(audio => {
            const trackId = audio.dataset.trackId;
            const visualizer = document.getElementById(`visualizer-${trackId}`);
            
            if (!visualizer) return;
            
            audio.addEventListener('play', () => {
                this.startVisualizer(trackId);
                
                // Pause other audio players
                document.querySelectorAll('.audio-player').forEach(otherAudio => {
                    if (otherAudio !== audio && !otherAudio.paused) {
                        otherAudio.pause();
                    }
                });
            });
            
            audio.addEventListener('pause', () => {
                this.stopVisualizer(trackId);
            });
            
            audio.addEventListener('ended', () => {
                this.stopVisualizer(trackId);
            });
        });
    }
    
    /**
     * Setup mutation observer for audio visualizers
     */
    setupAudioVisualizerObserver() {
        // Watch for new audio players being added to the DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const audioPlayers = node.querySelectorAll('.audio-player');
                            if (audioPlayers.length) {
                                this.initAudioVisualizers();
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Start audio visualizer animation
     */
    startVisualizer(trackId) {
        const visualizer = document.getElementById(`visualizer-${trackId}`);
        if (!visualizer) return;
        
        const bars = visualizer.querySelectorAll('.audio-bar');
        
        // Stop existing animation if there is one
        if (this.audioVisualizers.has(trackId)) {
            cancelAnimationFrame(this.audioVisualizers.get(trackId));
        }
        
        const animate = () => {
            bars.forEach(bar => {
                const height = 5 + Math.random() * 25;
                bar.style.height = `${height}px`;
            });
            this.audioVisualizers.set(trackId, requestAnimationFrame(animate));
        };
        
        this.audioVisualizers.set(trackId, requestAnimationFrame(animate));
    }
    
    /**
     * Stop audio visualizer animation
     */
    stopVisualizer(trackId) {
        if (this.audioVisualizers.has(trackId)) {
            cancelAnimationFrame(this.audioVisualizers.get(trackId));
            this.audioVisualizers.delete(trackId);
            
            // Reset visualizer bars
            const visualizer = document.getElementById(`visualizer-${trackId}`);
            if (visualizer) {
                const bars = visualizer.querySelectorAll('.audio-bar');
                bars.forEach(bar => {
                    bar.style.height = '5px';
                });
            }
        }
    }

    /**
     * Generate star rating based on popularity
     */
    getPopularityStars(popularity) {
        const starCount = Math.round(popularity / 20);
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < starCount) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }
}

/**
 * Nieuwe Releases UI Module
 * Behandelt het weergeven van nieuwe muziekreleases van gevolgde artiesten
 */
class NieuweReleasesUI {
    constructor() {
        this.releases = [];
    }

    /**
     * Toon nieuwe releases van gevolgde artiesten
     * @param {Array} releases - Array van nieuwe releases
     */
    displayNotifications(releases) {
        this.releases = releases;
        const container = document.getElementById('notifications');
        const filterContainer = document.getElementById('notifications-filter-container');
        
        // Toon lege staat als er geen releases zijn
        if (!releases.length) {
            this._showEmptyState(container, filterContainer);
            return;
        }

        // Toon filteropties wanneer we releases hebben
        if (filterContainer) filterContainer.classList.remove('hidden');
        
        // Verwerk en sorteer releases
        const processedReleases = this._processReleases(releases);
        
        // Toon "geen resultaten" als er niets overblijft na filteren
        if (processedReleases.length === 0) {
            this._showNoResultsState(container);
            return;
        }
        
        // Genereer en toon HTML
        const html = this._generateReleasesHTML(processedReleases);
        container.innerHTML = html;
    }

    /**
     * Toon lege staat wanneer er geen nieuwe releases zijn
     * @private
     */
    _showEmptyState(container, filterContainer) {
        const releaseAgeDays = app.releaseAgeDays || 7;
        
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-400 mb-4">
                    <i class="fas fa-bell text-5xl"></i>
                </div>
                <p class="text-gray-500">Geen nieuwe releases (< ${releaseAgeDays} dagen) gevonden van je gevolgde DJ's</p>
                <p class="text-gray-500 text-sm mt-2">We laten het je weten wanneer er nieuwe muziek uitkomt</p>
            </div>
        `;
        
        // Verberg filteropties wanneer er geen releases zijn
        if (filterContainer) filterContainer.classList.add('hidden');
    }

    /**
     * Toon "geen resultaten" staat na filteren
     * @private
     */
    _showNoResultsState(container) {
        const searchQuery = document.getElementById('notifications-search')?.value?.trim();
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-400 mb-4">
                    <i class="fas fa-search text-5xl"></i>
                </div>
                <p class="text-gray-500">Geen releases gevonden die overeenkomen met "${searchQuery}"</p>
            </div>
        `;
    }

    /**
     * Verwerk releases: platmaken, sorteren en filteren
     * @param {Array} releases - Originele releases
     * @returns {Array} Verwerkte releases
     * @private
     */
    _processReleases(releases) {
        // Maak een platte lijst van releases voor makkelijker sorteren
        const flatReleases = this._flattenReleases(releases);
        
        // Sorteer op basis van gebruikersvoorkeur
        const sortedReleases = this._sortReleases(flatReleases);
        
        // Filter op basis van zoekterm
        const filteredReleases = this._filterReleasesBySearch(sortedReleases);
        
        return filteredReleases;
    }

    /**
     * Maak een platte lijst van releases
     * @param {Array} releases - Geneste releases structuur
     * @returns {Array} Platte lijst
     * @private
     */
    _flattenReleases(releases) {
        return releases.map(release => ({
            artist: release.artist,
            album: release.album,
            collaborationInfo: release.collaborationInfo,
            releaseDate: new Date(release.album.release_date).getTime()
        }));
    }

    /**
     * Sorteer releases op basis van geselecteerde optie
     * @param {Array} releases - Releases om te sorteren
     * @returns {Array} Gesorteerde releases
     * @private
     */
    _sortReleases(releases) {
        const sortOrder = document.getElementById('notifications-sort')?.value || 'date-desc';
        
        switch (sortOrder) {
            case 'date-desc': // Nieuwste eerst (standaard)
                return releases.sort((a, b) => b.releaseDate - a.releaseDate);
            case 'date-asc': // Oudste eerst
                return releases.sort((a, b) => a.releaseDate - b.releaseDate);
            case 'artist-asc': // Artiest naam A-Z
                return releases.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
            case 'artist-desc': // Artiest naam Z-A
                return releases.sort((a, b) => b.artist.name.localeCompare(a.artist.name));
            default:
                return releases.sort((a, b) => b.releaseDate - a.releaseDate);
        }
    }

    /**
     * Filter releases op basis van zoekterm
     * @param {Array} releases - Releases om te filteren
     * @returns {Array} Gefilterde releases
     * @private
     */
    _filterReleasesBySearch(releases) {
        const searchQuery = document.getElementById('notifications-search')?.value?.trim().toLowerCase();
        
        if (!searchQuery) return releases;
        
        return releases.filter(release => {
            // Zoek in artiestnaam en albumnaam
            const artistMatch = release.artist.name.toLowerCase().includes(searchQuery);
            const albumMatch = release.album.name.toLowerCase().includes(searchQuery);
            
            // Zoek ook in namen van samenwerkende artiesten
            let collaboratorMatch = false;
            if (release.collaborationInfo?.isCollaboration) {
                collaboratorMatch = release.collaborationInfo.collaboratingArtists.some(artist => 
                    artist.toLowerCase().includes(searchQuery)
                );
            }
            
            return artistMatch || albumMatch || collaboratorMatch;
        });
    }

    /**
     * Genereer HTML voor alle releases
     * @param {Array} releases - Releases om weer te geven
     * @returns {string} HTML string
     * @private
     */
    _generateReleasesHTML(releases) {
        const releasesHTML = releases.map(release => this._generateReleaseCard(release)).join('');
        return `<div class="space-y-4">${releasesHTML}</div>`;
    }

    /**
     * Genereer HTML voor één release kaart
     * @param {Object} release - Release object
     * @returns {string} HTML string
     * @private
     */
    _generateReleaseCard(release) {
        const { artist, album, collaborationInfo } = release;
        
        // Formatteer datums
        const releaseDate = new Date(album.release_date).toLocaleDateString('nl-NL');
        const daysAgo = this._calculateDaysAgo(album.release_date);
        const releaseDateText = this._formatDaysAgo(daysAgo);
        
        // Maak samenwerkingstekst
        const collaborationText = this._generateCollaborationText(collaborationInfo);
        
        return `
            <div class="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 animate__animated animate__fadeIn">
                <div class="flex items-start">
                    <img src="${album.images[0]?.url || ''}" alt="${album.name}" class="w-20 h-20 mr-4 object-cover rounded-lg">
                    <div class="flex-1">
                        ${this._generateReleaseHeader(artist, album, collaborationText, releaseDate, releaseDateText)}
                        ${this._generateReleaseInfo(album)}
                        ${this._generateReleaseActions(artist, album)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bereken aantal dagen geleden vanaf vandaag
     * @param {string} releaseDate - Release datum string
     * @returns {number} Aantal dagen geleden
     * @private
     */
    _calculateDaysAgo(releaseDate) {
        return Math.floor((Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Formatteer "dagen geleden" tekst
     * @param {number} daysAgo - Aantal dagen geleden
     * @returns {string} Geformatteerde tekst
     * @private
     */
    _formatDaysAgo(daysAgo) {
        if (daysAgo === 0) return 'Vandaag';
        if (daysAgo === 1) return 'Gisteren';
        return `${daysAgo} dagen geleden`;
    }

    /**
     * Genereer samenwerkingstekst indien van toepassing
     * @param {Object|null} collaborationInfo - Samenwerking informatie
     * @returns {string} Samenwerkingstekst
     * @private
     */
    _generateCollaborationText(collaborationInfo) {
        if (!collaborationInfo?.isCollaboration) return '';
        
        const otherArtists = collaborationInfo.collaboratingArtists;
        
        if (otherArtists.length === 1) {
            return `met ${otherArtists[0]}`;
        }
        
        return `met ${otherArtists.slice(0, -1).join(', ')} & ${otherArtists.slice(-1)}`;
    }

    /**
     * Genereer header voor release (artiest, titel, datum)
     * @private
     */
    _generateReleaseHeader(artist, album, collaborationText, releaseDate, releaseDateText) {
        return `
            <div class="flex md:flex-row flex-col justify-between md:items-start">
                <div class="flex-1 min-w-0 pr-2">
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
        `;
    }

    /**
     * Genereer album informatie (type en aantal tracks)
     * @private
     */
    _generateReleaseInfo(album) {
        const albumType = album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1);
        const trackCount = album.total_tracks === 1 ? 'nummer' : 'nummers';
        
        return `
            <p class="text-gray-600 text-sm mb-3">
                ${albumType} • ${album.total_tracks} ${trackCount}
            </p>
        `;
    }

    /**
     * Genereer actieknoppen voor release
     * @private
     */
    _generateReleaseActions(artist, album) {
        return `
            <div class="flex gap-2">
                <a href="${album.external_urls.spotify}" target="_blank" 
                  class="flex-1 text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                  <i class="fab fa-spotify mr-2"></i>Beluisteren
                </a>
                <button onclick="app.getLatestTracks('${artist.id}')" 
                  class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition">
                  <i class="fas fa-user mr-2"></i>Meer bekijken
                </button>
                <button onclick="app.shareRelease('${artist.name}', '${album.name}', '${album.external_urls.spotify}')" 
                  class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                  <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
    }

    /**
     * Initialiseer sorteer- en filterinstellingen
     */
    initializeSortingAndFiltering() {
        this._setupNotificationsSort();
        this._setupNotificationsSearch();
    }

    /**
     * Setup sorteerinstellingen voor notificaties
     * @private
     */
    _setupNotificationsSort() {
        const notificationsSort = document.getElementById('notifications-sort');
        if (notificationsSort) {
            notificationsSort.addEventListener('change', () => {
                app.checkNewReleases();
            });
        }
    }

    /**
     * Setup zoekfunctionaliteit voor notificaties
     * @private
     */
    _setupNotificationsSearch() {
        const notificationsSearch = document.getElementById('notifications-search');
        if (notificationsSearch) {
            let debounceTimer;
            
            notificationsSearch.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    app.checkNewReleases();
                }, 300);
            });
        }
    }
}

// Maak globale instantie beschikbaar
window.nieuweReleasesUI = new NieuweReleasesUI();

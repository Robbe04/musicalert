/**
 * Search Module
 * Afhandeling van zoekfunctionaliteit en filters
 */
class SearchModule {
    constructor(uiService) {
        this.uiService = uiService;
    }

    /**
     * Pre-search genre filters instellen
     */
    setupPreSearchGenreFilters() {
        const filterToggle = document.getElementById('genre-filter-toggle');
        const filterPanel = document.getElementById('genre-filter-panel');
        
        if (filterToggle && filterPanel) {
            // Toggle filter panel zichtbaarheid
            filterToggle.addEventListener('click', () => {
                filterPanel.classList.toggle('hidden');
                
                // Icoon bijwerken
                const icon = filterToggle.querySelector('i');
                if (filterPanel.classList.contains('hidden')) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            });
            
            // Panel sluiten bij klikken buiten het panel
            document.addEventListener('click', (e) => {
                if (!filterPanel.contains(e.target) && 
                    !filterToggle.contains(e.target) && 
                    !filterPanel.classList.contains('hidden')) {
                    filterPanel.classList.add('hidden');
                    
                    // Icoon bijwerken
                    const icon = filterToggle.querySelector('i');
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
            
            // Genres in het panel laden
            this.loadPreSearchGenres();
        }
    }
    
    /**
     * Genres voor pre-search filtering laden
     */
    async loadPreSearchGenres() {
        const container = document.getElementById('pre-search-genres');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="p-2 text-center"><i class="fas fa-spinner fa-spin mr-2"></i>Genres laden...</div>';
            
            const genres = await api.getGenres();
            
            // Filter om vooral elektronische en DJ-gerelateerde genres te krijgen
            const relevantGenres = [
                'house', 'techno', 'electronic', 'edm', 'dance', 'deep-house', 
                'electro', 'drum-and-bass', 'dubstep', 'trance', 'progressive-house',
                'ambient', 'trap', 'hip-hop', 'r-n-b', 'pop', 'club', 'detroit-techno',
                'disco', 'minimal-techno', 'tech-house', 'hardstyle', 'hardcore', 'gabber',
                'industrial', 'funk', 'soul', 'jazz', 'reggae', 'reggaeton'
            ];
            
            const genresToShow = genres.filter(genre => 
                relevantGenres.some(relevantGenre => genre.includes(relevantGenre))
            ).slice(0, 30);
            
            container.innerHTML = '';
            
            // "Selecteer alle" en "Wis selectie" knoppen toevoegen
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'flex justify-between p-2 border-b border-gray-200 mb-2';
            
            const selectAllBtn = document.createElement('button');
            selectAllBtn.className = 'text-xs text-primary hover:underline';
            selectAllBtn.textContent = 'Selecteer alle';
            selectAllBtn.addEventListener('click', () => this.toggleAllPreSearchGenres(true));
            
            const clearAllBtn = document.createElement('button');
            clearAllBtn.className = 'text-xs text-gray-500 hover:underline';
            clearAllBtn.textContent = 'Wis selectie';
            clearAllBtn.addEventListener('click', () => this.toggleAllPreSearchGenres(false));
            
            controlsDiv.appendChild(selectAllBtn);
            controlsDiv.appendChild(clearAllBtn);
            container.appendChild(controlsDiv);
            
            // Div aanmaken om genres in kolommen te houden
            const genresGrid = document.createElement('div');
            genresGrid.className = 'grid grid-cols-2 gap-1 p-2 max-h-60 overflow-y-auto';
            container.appendChild(genresGrid);
            
            // Genres als checkboxes toevoegen
            genresToShow.forEach(genre => {
                const label = document.createElement('label');
                label.className = 'flex items-center text-sm p-1 hover:bg-gray-50 rounded';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = genre;
                checkbox.className = 'mr-2 h-4 w-4 text-primary focus:ring-primary';
                checkbox.dataset.genre = genre;
                
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(this.uiService.formatGenreName(genre)));
                
                genresGrid.appendChild(label);
            });
            
            // Toepassen knop toevoegen
            const applyBtnContainer = document.createElement('div');
            applyBtnContainer.className = 'p-2 border-t border-gray-200 mt-2';
            
            const applyBtn = document.createElement('button');
            applyBtn.className = 'w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors';
            applyBtn.textContent = 'Toepassen';
            applyBtn.addEventListener('click', () => {
                this.applyPreSearchGenreFilters();
                document.getElementById('genre-filter-panel').classList.add('hidden');
                
                // Icoon bijwerken
                const icon = document.querySelector('#genre-filter-toggle i');
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
            
            applyBtnContainer.appendChild(applyBtn);
            container.appendChild(applyBtnContainer);
            
        } catch (error) {
            container.innerHTML = '<span class="text-red-500 p-2">Fout bij het laden van genres</span>';
            console.error('Error loading pre-search genres:', error);
        }
    }
    
    /**
     * Alle pre-search genre filters toggelen
     */
    toggleAllPreSearchGenres(select) {
        const container = document.getElementById('pre-search-genres');
        if (!container) return;
        
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    }
    
    /**
     * Pre-search genre filters toepassen
     */
    applyPreSearchGenreFilters() {
        const container = document.getElementById('pre-search-genres');
        if (!container) return;
        
        // Geselecteerde genres ophalen
        const selectedGenres = [];
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            selectedGenres.push(checkbox.dataset.genre);
        });
        
        // Geselecteerde genres opslaan
        this.uiService.preSearchGenreFilters = selectedGenres;
        
        // Filter badge counter bijwerken
        const counter = document.getElementById('genre-filter-count');
        if (counter) {
            if (selectedGenres.length > 0) {
                counter.textContent = selectedGenres.length;
                counter.classList.remove('hidden');
            } else {
                counter.classList.add('hidden');
            }
        }
    }

    /**
     * Live search met debounce instellen
     */
    setupLiveSearch() {
        const searchInput = document.getElementById('artistInput');
        const suggestionsContainer = document.getElementById('artistSuggestions');
        
        let debounceTimer;
        
        // Luister naar input in zoekveld
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Eventuele bestaande timer wissen
            clearTimeout(debounceTimer);
            
            // Suggesties verbergen als de query leeg is
            if (query.length < 2) {
                suggestionsContainer.classList.add('hidden');
                return;
            }
            
            // Debounce de zoekopdracht om te veel API-aanroepen te voorkomen
            debounceTimer = setTimeout(async () => {
                try {
                    // Zoekopdracht uitvoeren en suggesties tonen
                    const artists = await api.searchArtists(query, 10);
                    app.lastSearchResults = artists;
                    
                    // Filter artiesten op vooraf geselecteerde genres indien van toepassing
                    if (this.uiService.preSearchGenreFilters && this.uiService.preSearchGenreFilters.length > 0) {
                        const filteredArtists = artists.filter(artist => {
                            if (!artist.genres || artist.genres.length === 0) return false;
                            
                            return artist.genres.some(genre => 
                                this.uiService.preSearchGenreFilters.some(filter => genre.includes(filter))
                            );
                        });
                        
                        // Als we gefilterde resultaten hebben, gebruik deze. Anders, toon alle resultaten
                        if (filteredArtists.length > 0) {
                            this.displayArtistSuggestions(filteredArtists);
                        } else {
                            this.displayArtistSuggestions(artists);
                        }
                    } else {
                        this.displayArtistSuggestions(artists);
                    }
                } catch (error) {
                    console.error('Error in live search:', error);
                }
            }, 300); // Wacht 300ms nadat de gebruiker stopt met typen
        });
        
        // Suggesties verbergen bij klikken buiten
        document.addEventListener('click', (e) => {
            if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) {
                suggestionsContainer.classList.add('hidden');
            }
        });
        
        // Suggesties tonen bij focus op zoekinvoer als deze inhoud heeft
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && app.lastSearchResults.length > 0) {
                this.displayArtistSuggestions(app.lastSearchResults);
            }
        });
    }
    
    /**
     * Artiest suggesties onder zoekvak weergeven
     */
    displayArtistSuggestions(artists) {
        const container = document.getElementById('artistSuggestions');
        
        if (!artists || artists.length === 0) {
            container.classList.add('hidden');
            return;
        }
        
        // Filter op actieve genre filters indien aanwezig
        let filteredArtists = artists;
        if (this.uiService.activeGenreFilters.length > 0) {
            filteredArtists = artists.filter(artist => {
                if (!artist.genres || artist.genres.length === 0) return false;
                
                return artist.genres.some(genre => 
                    this.uiService.activeGenreFilters.some(filter => genre.includes(filter))
                );
            });
            
            // Als geen overeenkomsten, gebruik alle artiesten
            if (filteredArtists.length === 0) {
                filteredArtists = artists;
            }
        }
        
        let html = '';
        
        filteredArtists.forEach(artist => {
            const artistImg = artist.images.length > 0 ? artist.images[0].url : '';
            const genres = artist.genres.length > 0 ? 
                this.uiService.formatGenreName(artist.genres[0]) : 'DJ / Producer';
            
            html += `
                <div class="artist-suggestion p-3 hover:bg-gray-100 cursor-pointer transition flex items-center border-b border-gray-100" 
                     onclick="app.getLatestTracks('${artist.id}')">
                    <div class="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        ${artistImg ? 
                            `<img src="${artistImg}" alt="${artist.name}" class="w-full h-full object-cover">` : 
                            `<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-secondary text-white">
                                <i class="fas fa-music"></i>
                            </div>`
                        }
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium truncate">${artist.name}</p>
                        <p class="text-xs text-gray-500 truncate">${genres}</p>
                    </div>
                    <div class="flex-shrink-0 ml-2">
                        <span class="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                            ${artist.popularity}%
                        </span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.classList.remove('hidden');
    }

    /**
     * Genre filters laden en weergeven
     */
    async loadGenreFilters() {
        const container = document.getElementById('genreFilters');
        
        if (!container) return;
        
        try {
            const genres = await api.getGenres();
            
            // Filter voor voornamelijk elektronische en DJ-gerelateerde genres
            const relevantGenres = [
                'house', 'techno', 'electronic', 'edm', 'dance', 'deep-house', 
                'electro', 'drum-and-bass', 'dubstep', 'trance', 'progressive-house',
                'ambient', 'trap', 'hip-hop', 'r-n-b', 'pop', 'club', 'detroit-techno',
                'disco', 'minimal-techno', 'tech-house'
            ];
            
            const genresToShow = genres.filter(genre => 
                relevantGenres.some(relevantGenre => genre.includes(relevantGenre))
            ).slice(0, 12);
            
            container.innerHTML = '';
            
            genresToShow.forEach(genre => {
                const button = document.createElement('button');
                button.className = 'px-3 py-1 text-sm rounded-full bg-gray-200 hover:bg-gray-300 transition';
                button.textContent = this.uiService.formatGenreName(genre);
                button.dataset.genre = genre;
                button.addEventListener('click', () => this.toggleGenreFilter(button));
                container.appendChild(button);
            });
        } catch (error) {
            container.innerHTML = '<span class="text-red-500">Fout bij het laden van genres</span>';
            console.error('Error loading genres:', error);
        }
    }

    /**
     * Een genre filter display toggelen
     */
    toggleGenreFilter(button) {
        const genre = button.dataset.genre;
        
        if (this.uiService.activeGenreFilters.includes(genre)) {
            this.uiService.activeGenreFilters = this.uiService.activeGenreFilters.filter(g => g !== genre);
            button.classList.remove('bg-primary', 'text-white');
            button.classList.add('bg-gray-200');
        } else {
            this.uiService.activeGenreFilters.push(genre);
            button.classList.remove('bg-gray-200');
            button.classList.add('bg-primary', 'text-white');
        }
        
        // Als we artiest zoekresultaten hebben, filter ze
        if (app.lastSearchResults && app.lastSearchResults.length) {
            this.updateArtistSelectWithFilters(app.lastSearchResults);
        }
    }

    /**
     * Artiest select dropdown bijwerken met gefilterde resultaten
     */
    updateArtistSelectWithFilters(artists) {
        const select = document.getElementById('artistSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecteer een artiest</option>';
        
        // Als geen filters actief, toon alle artiesten
        if (this.uiService.activeGenreFilters.length === 0) {
            artists.forEach(artist => {
                this.addArtistToSelect(select, artist);
            });
            return;
        }
        
        // Filter artiesten op genre
        const filteredArtists = artists.filter(artist => {
            if (!artist.genres || artist.genres.length === 0) return false;
            
            return artist.genres.some(genre => 
                this.uiService.activeGenreFilters.some(filter => genre.includes(filter))
            );
        });
        
        // Voeg gefilterde artiesten toe aan select
        if (filteredArtists.length) {
            filteredArtists.forEach(artist => {
                this.addArtistToSelect(select, artist);
            });
        } else {
            // Als geen overeenkomsten, voeg een optie toe die dat aangeeft
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'Geen artiesten gevonden met deze genres';
            select.appendChild(option);
        }
    }

    /**
     * Artiest aan select dropdown toevoegen
     */
    addArtistToSelect(select, artist) {
        const option = document.createElement('option');
        option.value = artist.id;
        option.textContent = artist.name;
        option.dataset.img = artist.images.length > 0 ? artist.images[0].url : '';
        option.dataset.popularity = artist.popularity || 0;
        option.dataset.genres = artist.genres ? artist.genres.join(',') : '';
        select.appendChild(option);
    }
}

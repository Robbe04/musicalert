/**
 * Main UI Service
 * Coördineert alle UI-functionaliteit
 */
class UIService {
    constructor() {
        this.activeGenreFilters = [];
        this.preSearchGenreFilters = [];
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // Modules initialiseren
        this.searchModule = new SearchModule(this);
        this.displayModule = new DisplayModule(this);
        this.themeModule = new ThemeModule(this);
        this.notificationModule = new NotificationModule(this);
        
        // Thema initialiseren
        this.themeModule.initializeTheme();
    }

    /**
     * UI-elementen initialiseren
     */
    async initialize() {
        // Genres voor filteren laden
        this.searchModule.loadGenreFilters();
        
        // Pre-search genrefilter panel instellen
        this.searchModule.setupPreSearchGenreFilters();
        
        // Live zoeken instellen
        this.searchModule.setupLiveSearch();
        
        // Smooth scroll voor navigatie
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    window.scrollTo({
                        top: target.offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Audio visualizers voor tracks initialiseren
        this.displayModule.setupAudioVisualizerObserver();

        // Sorteren en filteren voor favorieten en notificaties initialiseren
        this.initializeSortingAndFiltering();

        // Installeerknop in instellingen bijwerken
        this.themeModule.updateInstallStatus();
        
        // Themaselector instellen op huidige thema
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = this.currentTheme;
        }
        
        // Mobiel menu initialiseren
        this.notificationModule.initializeMobileMenu();

        // Release leeftijd instelling initialiseren
        this.displayModule.initializeReleaseAgeSetting();
    }

    /**
     * Sorteren en filteren voor favorieten en notificaties initialiseren
     */
    initializeSortingAndFiltering() {
        // Favoriete artiesten sorteren
        const favoritesSort = document.getElementById('favorites-sort');
        if (favoritesSort) {
            favoritesSort.addEventListener('change', () => {
                app.displayFavorites();
            });
        }
        
        // Favoriete artiesten zoeken
        const favoritesSearch = document.getElementById('favorites-search');
        if (favoritesSearch) {
            let debounceTimer;
            favoritesSearch.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    app.displayFavorites();
                }, 300);
            });
        }
        
        // Notificaties sorteren
        const notificationsSort = document.getElementById('notifications-sort');
        if (notificationsSort) {
            notificationsSort.addEventListener('change', () => {
                app.checkNewReleases();
            });
        }
        
        // Notificaties zoeken
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

    /**
     * Laad indicator tonen
     */
    showLoading(message = 'Laden...') {
        // Gebruik inline loading voor artiest zoeken
        if (message.includes('Artiesten zoeken')) {
            const searchInput = document.getElementById('artistInput');
            const loadingIndicator = document.getElementById('searchLoadingIndicator');
            
            if (loadingIndicator) {
                loadingIndicator.classList.remove('hidden');
            } else {
                // Maak inline loading indicator als deze niet bestaat
                const indicator = document.createElement('div');
                indicator.id = 'searchLoadingIndicator';
                indicator.className = 'absolute right-4 top-1/2 transform -translate-y-1/2 text-primary';
                indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                searchInput.parentNode.appendChild(indicator);
            }
            return;
        }
        
        // Voor andere operaties, gebruik de overlay
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        text.textContent = message;
        overlay.classList.remove('hidden');
    }

    /**
     * Laad indicator verbergen
     */
    hideLoading() {
        // Verberg search loading indicator indien aanwezig
        const searchLoadingIndicator = document.getElementById('searchLoadingIndicator');
        if (searchLoadingIndicator) {
            searchLoadingIndicator.classList.add('hidden');
        }
        
        // Verberg overlay
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
    }

    /**
     * Foutmelding tonen
     */
    showError(message) {
        alert(message);
    }

    /**
     * Bericht toast tonen
     */
    showMessage(message, type = 'info') {
        // Maak toast als deze niet bestaat
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white shadow-lg transition-opacity duration-300 z-50 opacity-0';
            document.body.appendChild(toast);
        }
        
        // Stel bericht en kleur in op basis van type
        toast.textContent = message;
        if (type === 'error') {
            toast.classList.add('bg-red-500');
            toast.classList.remove('bg-green-500', 'bg-blue-500');
        } else if (type === 'success') {
            toast.classList.add('bg-green-500');
            toast.classList.remove('bg-red-500', 'bg-blue-500');
        } else {
            toast.classList.add('bg-blue-500');
            toast.classList.remove('bg-red-500', 'bg-green-500');
        }
        
        // Toon toast
        setTimeout(() => {
            toast.classList.add('opacity-100');
        }, 10);
        
        // Verberg toast na 3 seconden
        setTimeout(() => {
            toast.classList.remove('opacity-100');
            setTimeout(() => {
                toast.classList.add('opacity-0');
            }, 300);
        }, 3000);
    }

    /**
     * Genrenaam formatteren voor weergave
     */
    formatGenreName(genre) {
        return genre
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Toggle track lijst zichtbaarheid
     */
    toggleTrackList(albumId) {
        const trackList = document.getElementById(`tracklist-${albumId}`);
        const icon = document.getElementById(`tracklist-icon-${albumId}`);
        
        if (trackList && icon) {
            trackList.classList.toggle('hidden');
            
            if (trackList.classList.contains('hidden')) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        }
    }
}

// Initialize UI service after loading all modules
let ui;
window.addEventListener('DOMContentLoaded', () => {
    ui = new UIService();
});

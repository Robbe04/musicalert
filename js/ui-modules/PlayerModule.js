/**
 * Player Module
 * Handles audio playback and visualizers
 */
class PlayerModule {
    constructor(uiService) {
        this.uiService = uiService;
        this.audioVisualizers = new Map();
    }

    /**
     * Setup audio visualizer observer
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
     * Setup mini-player functionality
     */
    setupMiniPlayer() {
        const miniPlayer = document.getElementById('mini-player');
        if (!miniPlayer) return;

        // Initial setup is done when a track is played
    }

    /**
     * Play a track in the mini-player
     */
    playTrack(trackUrl, trackId, artistId, artistName, trackName, albumName, albumCover, tracks = []) {
        // Don't do anything if the track doesn't have a preview URL
        if (!trackUrl) {
            this.uiService.showMessage('Geen preview beschikbaar voor dit nummer', 'error');
            return;
        }
        
        // Stop any currently playing audio
        this.stopCurrentAudio();
        
        // Update the mini-player
        const miniPlayer = document.getElementById('mini-player');
        const miniPlayerAudio = document.getElementById('mini-player-audio');
        const miniPlayerToggle = document.getElementById('mini-player-toggle');
        const miniPlayerTrack = document.getElementById('mini-player-track');
        const miniPlayerArtist = document.getElementById('mini-player-artist');
        const miniPlayerCover = document.getElementById('mini-player-cover');
        
        // Set up the audio source
        miniPlayerAudio.src = trackUrl;
        miniPlayerAudio.dataset.trackId = trackId;
        miniPlayerAudio.dataset.artistId = artistId;
        miniPlayerAudio.dataset.albumName = albumName || '';
        
        // Update display info
        miniPlayerTrack.textContent = trackName;
        miniPlayerArtist.textContent = artistName;
        miniPlayerCover.src = albumCover || 'img/logo-small.png';
        miniPlayerCover.alt = `${trackName} - ${artistName}`;
        
        // Show play button initially
        miniPlayerToggle.innerHTML = '<i class="fas fa-play"></i>';
        
        // Setup playlist if tracks array is provided
        if (tracks && tracks.length > 0) {
            this.uiService.currentPlaylist = tracks;
            // Find the index of the current track in the playlist
            this.uiService.currentPlaylistIndex = this.uiService.currentPlaylist.findIndex(t => t.id === trackId);
        }
        
        // Show the mini-player
        miniPlayer.classList.add('active');
        
        // Play the audio
        miniPlayerAudio.play()
            .then(() => {
                // Update play button to pause
                miniPlayerToggle.innerHTML = '<i class="fas fa-pause"></i>';
                
                // Track this in app analytics
                if (typeof app.trackListening === 'function') {
                    app.trackListening(artistId, trackId, trackName, albumName);
                }
            })
            .catch(error => {
                console.error('Error playing track:', error);
                this.uiService.showMessage('Kon de preview niet afspelen', 'error');
            });
        
        // Set current playing info
        this.uiService.currentlyPlayingAudio = miniPlayerAudio;
        this.uiService.currentlyPlayingTrackId = trackId;
        
        // Add event listeners if they don't exist yet
        this.setupMiniPlayerEvents();
    }
    
    /**
     * Set up mini-player event listeners
     */
    setupMiniPlayerEvents() {
        const miniPlayerAudio = document.getElementById('mini-player-audio');
        const miniPlayerToggle = document.getElementById('mini-player-toggle');
        const miniPlayerNext = document.getElementById('mini-player-next');
        const miniPlayerPrev = document.getElementById('mini-player-prev');
        const miniPlayerClose = document.getElementById('mini-player-close');
        
        // Toggle play/pause
        miniPlayerToggle.onclick = () => {
            if (miniPlayerAudio.paused) {
                miniPlayerAudio.play()
                    .then(() => {
                        miniPlayerToggle.innerHTML = '<i class="fas fa-pause"></i>';
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                    });
            } else {
                miniPlayerAudio.pause();
                miniPlayerToggle.innerHTML = '<i class="fas fa-play"></i>';
            }
        };
        
        // Next track
        miniPlayerNext.onclick = () => {
            this.playNextTrack();
        };
        
        // Previous track
        miniPlayerPrev.onclick = () => {
            this.playPreviousTrack();
        };
        
        // Close mini-player
        miniPlayerClose.onclick = () => {
            this.closeMiniPlayer();
        };
        
        // When track ends
        miniPlayerAudio.onended = () => {
            miniPlayerToggle.innerHTML = '<i class="fas fa-play"></i>';
            
            // Auto-play next track if available
            this.playNextTrack();
        };
        
        // Add progress bar
        if (!document.querySelector('.mini-player-progress-container')) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'mini-player-progress-container';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'mini-player-progress-bar';
            progressBar.id = 'mini-player-progress';
            
            progressContainer.appendChild(progressBar);
            document.getElementById('mini-player').appendChild(progressContainer);
            
            // Update progress bar during playback
            miniPlayerAudio.ontimeupdate = () => {
                const progress = (miniPlayerAudio.currentTime / miniPlayerAudio.duration) * 100;
                document.getElementById('mini-player-progress').style.width = `${progress}%`;
            };
        }
    }
    
    /**
     * Play the next track in the playlist
     */
    playNextTrack() {
        if (this.uiService.currentPlaylist.length === 0 || this.uiService.currentPlaylistIndex === -1) {
            return;
        }
        
        // Get next track index, wrapping around if needed
        const nextIndex = (this.uiService.currentPlaylistIndex + 1) % this.uiService.currentPlaylist.length;
        const nextTrack = this.uiService.currentPlaylist[nextIndex];
        
        // Check if the next track has a preview URL
        if (!nextTrack.preview_url) {
            // Skip to the next track if no preview URL
            this.uiService.currentPlaylistIndex = nextIndex;
            this.playNextTrack();
            return;
        }
        
        // Get album info
        const albumName = document.getElementById('mini-player-audio').dataset.albumName || '';
        const artistId = document.getElementById('mini-player-audio').dataset.artistId || '';
        const albumCover = document.getElementById('mini-player-cover').src;
        
        // Play the track
        this.playTrack(
            nextTrack.preview_url,
            nextTrack.id,
            artistId, 
            nextTrack.artists[0].name,
            nextTrack.name,
            albumName,
            albumCover,
            this.uiService.currentPlaylist
        );
    }
    
    /**
     * Play the previous track in the playlist
     */
    playPreviousTrack() {
        if (this.uiService.currentPlaylist.length === 0 || this.uiService.currentPlaylistIndex === -1) {
            return;
        }
        
        // Get previous track index, wrapping around if needed
        const prevIndex = (this.uiService.currentPlaylistIndex - 1 + this.uiService.currentPlaylist.length) % this.uiService.currentPlaylist.length;
        const prevTrack = this.uiService.currentPlaylist[prevIndex];
        
        // Check if the previous track has a preview URL
        if (!prevTrack.preview_url) {
            // Skip to the previous track if no preview URL
            this.uiService.currentPlaylistIndex = prevIndex;
            this.playPreviousTrack();
            return;
        }
        
        // Get album info
        const albumName = document.getElementById('mini-player-audio').dataset.albumName || '';
        const artistId = document.getElementById('mini-player-audio').dataset.artistId || '';
        const albumCover = document.getElementById('mini-player-cover').src;
        
        // Play the track
        this.playTrack(
            prevTrack.preview_url,
            prevTrack.id,
            artistId,
            prevTrack.artists[0].name,
            prevTrack.name,
            albumName,
            albumCover,
            this.uiService.currentPlaylist
        );
    }
    
    /**
     * Close the mini-player
     */
    closeMiniPlayer() {
        const miniPlayer = document.getElementById('mini-player');
        const miniPlayerAudio = document.getElementById('mini-player-audio');
        
        // Stop audio
        miniPlayerAudio.pause();
        miniPlayerAudio.currentTime = 0;
        
        // Hide mini-player
        miniPlayer.classList.remove('active');
        
        // Reset current playing info
        this.uiService.currentlyPlayingAudio = null;
        this.uiService.currentlyPlayingTrackId = null;
        this.uiService.currentPlaylist = [];
        this.uiService.currentPlaylistIndex = -1;
    }
    
    /**
     * Stop current audio playback
     */
    stopCurrentAudio() {
        if (this.uiService.currentlyPlayingAudio && !this.uiService.currentlyPlayingAudio.paused) {
            this.uiService.currentlyPlayingAudio.pause();
        }
        
        // Also stop any audio-player elements
        document.querySelectorAll('.audio-player').forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                this.stopVisualizer(audio.dataset.trackId);
            }
        });
    }
}

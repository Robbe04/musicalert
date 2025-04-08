/**
 * UI Modules Loader
 * Responsible for loading all the UI modules and initializing the UI service
 */

// Create a promise to track when all modules are loaded
let modulesLoaded = Promise.all([
    loadScript('js/ui-modules/UIService.js'),
    loadScript('js/ui-modules/SearchModule.js'),
    loadScript('js/ui-modules/DisplayModule.js'),
    loadScript('js/ui-modules/ThemeModule.js'),
    loadScript('js/ui-modules/NotificationModule.js')
]);

// Function to dynamically load a script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize UI when all modules are loaded and DOM is ready
Promise.all([
    modulesLoaded,
    new Promise(resolve => {
        if (document.readyState !== 'loading') {
            resolve();
        } else {
            document.addEventListener('DOMContentLoaded', resolve);
        }
    })
]).then(() => {
    // Initialize UI service when all modules and DOM are ready
    window.ui = new UIService();
    
    // If the app has an initialize method, call it after UI is initialized
    if (window.app && typeof window.app.initialize === 'function') {
        window.app.initialize();
    }
});

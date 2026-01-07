// Auto-detect API URL based on environment
const CONFIG = {
    getAPIURL: function() {
        // If running on deployed server, use same origin
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return window.location.origin;
        }
        // For local development
        return 'http://10.17.25.163:3001';
    }
};

// Export for use in other files
window.CONFIG = CONFIG;

/**
 * Offscreen Document Script
 * Handles geolocation and helps keep the service worker alive
 */

console.log('[Offscreen] Document loaded');

// Keep-alive mechanism: Send periodic pings to background
setInterval(() => {
    chrome.runtime.sendMessage({ 
        type: 'offscreen-keepalive',
        timestamp: Date.now() 
    }).catch(() => {
        // Ignore errors if background is temporarily unavailable
    });
}, 20000);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Respond to pings from background
    if (message.type === 'ping') {
        sendResponse({ pong: true, timestamp: Date.now() });
        return true;
    }
    
    // Only process messages targeted for offscreen
    if (message.target !== 'offscreen') return;

    // Handle geolocation requests
    if (message.type === 'get-geolocation') {
        console.log('[Offscreen] Geolocation requested');
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log('[Offscreen] GPS acquired:', pos.coords.latitude, pos.coords.longitude);
                sendResponse({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: Date.now()
                });
            },
            (err) => {
                console.error('[Offscreen] GPS Error:', err.message);
                sendResponse(null);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000,
                maximumAge: 0
            }
        );
        return true; // Keep channel open for async response
    }
});

// Log that offscreen is active
console.log('[Offscreen] Ready and listening for geolocation requests');
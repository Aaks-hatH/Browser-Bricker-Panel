/**
 * BROWSERBRICKER EXTENSION - CONTENT SCRIPT
 * 
 * Purpose: Securely identify extension presence to official BrowserBricker website
 * Security Model: Extension-initiated messaging (not website-initiated)
 * Compliance: Does not expose extension ID or use privileged APIs
 */

(function() {
    'use strict';
    
    // Only run on official BrowserBricker domains
    const OFFICIAL_DOMAINS = [
    'browser-bricker-panel.onrender.com', 
    'browserbricker.onrender.com',
    'localhost',
    '127.0.0.1'
];
    
    const currentDomain = window.location.hostname;
    const isOfficialDomain = OFFICIAL_DOMAINS.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    if (!isOfficialDomain) {
        // Do not execute on non-official domains
        return;
    }
    
    // Generate a session-specific nonce for this page load
    const sessionNonce = generateNonce();
    
    // Extension information to share
    const extensionInfo = {
        source: 'browserbricker-extension',
        version: chrome.runtime.getManifest().version,
        name: chrome.runtime.getManifest().name,
        status: 'installed',
        timestamp: Date.now(),
        nonce: sessionNonce
    };
    
    /**
     * Generate a cryptographically secure nonce
     */
    function generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Send identification message to the page
     */
    function announcePresence() {
        window.postMessage({
            type: 'BROWSERBRICKER_EXTENSION_IDENTITY',
            data: extensionInfo
        }, window.location.origin);
        
        console.log('[BrowserBricker] Extension announced to official website');
    }
    
    /**
     * Listen for ping requests from the website (with nonce verification)
     */
    function setupPingListener() {
        window.addEventListener('message', (event) => {
            // Verify message origin matches current page
            if (event.origin !== window.location.origin) {
                return;
            }
            
            // Check if this is a ping request
            if (event.data && event.data.type === 'BROWSERBRICKER_PING') {
                // Verify nonce if provided
                if (event.data.nonce && event.data.nonce !== sessionNonce) {
                    console.warn('[BrowserBricker] Invalid nonce in ping request');
                    return;
                }
                
                // Respond with pong
                window.postMessage({
                    type: 'BROWSERBRICKER_PONG',
                    data: {
                        ...extensionInfo,
                        respondingTo: event.data.nonce || null
                    }
                }, window.location.origin);
                
                console.log('[BrowserBricker] Responded to ping request');
            }
        });
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            announcePresence();
            setupPingListener();
        });
    } else {
        // DOM already loaded
        announcePresence();
        setupPingListener();
    }
    
    // Re-announce on page visibility change (handles tab switching)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            announcePresence();
        }
    });
    
    // Re-announce on page focus (additional reliability)
    window.addEventListener('focus', () => {
        announcePresence();
    });
    
})();

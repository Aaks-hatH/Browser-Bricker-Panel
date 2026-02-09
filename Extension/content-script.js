/**
 * BROWSERBRICKER EXTENSION - CONTENT SCRIPT v3.0
 * 
 * Purpose: Securely identify extension presence to official BrowserBricker website
 * Security Model: Extension-initiated messaging (not website-initiated)
 * Compliance: Does not expose extension ID or use privileged APIs
 * 
 * FEATURES:
 * - Announces presence immediately on page load
 * - Sends periodic announcements every 2 seconds until detected
 * - Responds to ping requests from the website
 * - Stops announcing when acknowledged by the page
 * - Re-announces on tab visibility changes
 * - Maximum 30 announcements to prevent infinite loops
 */

(function() {
    'use strict';
    
    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    
    // Only run on official BrowserBricker domains
    const OFFICIAL_DOMAINS = [
        'browser-bricker-panel.onrender.com', 
        'browserbricker.onrender.com',
        'localhost',
        '127.0.0.1'
    ];
    
    const ANNOUNCE_INTERVAL_MS = 2000;  // Announce every 2 seconds
    const MAX_ANNOUNCEMENTS = 30;        // Stop after 30 announcements (60 seconds)
    
    // ============================================================================
    // DOMAIN VALIDATION
    // ============================================================================
    
    const currentDomain = window.location.hostname;
    const isOfficialDomain = OFFICIAL_DOMAINS.some(domain => 
        currentDomain === domain || currentDomain.endsWith('.' + domain)
    );
    
    if (!isOfficialDomain) {
        console.log('[BrowserBricker] Not running on official domain:', currentDomain);
        return;
    }
    
    console.log('[BrowserBricker] ✅ Content script loaded on official domain:', currentDomain);
    
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    // Generate a session-specific nonce for this page load
    const sessionNonce = generateNonce();
    
    // Track detection state
    let hasBeenDetected = false;
    let announceInterval = null;
    let announceCount = 0;
    
    // Extension information to share
    const extensionInfo = {
        source: 'browserbricker-extension',
        version: chrome.runtime.getManifest().version,
        name: chrome.runtime.getManifest().name,
        status: 'installed',
        timestamp: Date.now(),
        nonce: sessionNonce
    };
    
    console.log('[BrowserBricker] Extension info:', {
        name: extensionInfo.name,
        version: extensionInfo.version,
        nonce: sessionNonce.substring(0, 8) + '...'
    });
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    /**
     * Generate a cryptographically secure nonce
     * @returns {string} Hex-encoded nonce
     */
    function generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Update extension info timestamp
     */
    function updateTimestamp() {
        extensionInfo.timestamp = Date.now();
    }
    
    // ============================================================================
    // ANNOUNCEMENT FUNCTIONS
    // ============================================================================
    
    /**
     * Send identification message to the page
     */
    function announcePresence() {
        updateTimestamp();
        
        window.postMessage({
            type: 'BROWSERBRICKER_EXTENSION_IDENTITY',
            data: extensionInfo
        }, window.location.origin);
        
        announceCount++;
        console.log(`[BrowserBricker] 📢 Announcement #${announceCount} sent`);
    }
    
    /**
     * Start periodic announcements
     * Announces every ANNOUNCE_INTERVAL_MS until detected or max reached
     */
    function startPeriodicAnnouncements() {
        // Clear any existing interval
        stopPeriodicAnnouncements();
        
        console.log(`[BrowserBricker] 🔄 Starting periodic announcements (every ${ANNOUNCE_INTERVAL_MS}ms, max ${MAX_ANNOUNCEMENTS})`);
        
        announceInterval = setInterval(() => {
            // Check if detected
            if (hasBeenDetected) {
                console.log('[BrowserBricker] ✅ Detected by page, stopping announcements');
                stopPeriodicAnnouncements();
                return;
            }
            
            // Check if max announcements reached
            if (announceCount >= MAX_ANNOUNCEMENTS) {
                console.log(`[BrowserBricker] ⏸️ Max announcements (${MAX_ANNOUNCEMENTS}) reached, stopping`);
                stopPeriodicAnnouncements();
                return;
            }
            
            // Send announcement
            announcePresence();
        }, ANNOUNCE_INTERVAL_MS);
    }
    
    /**
     * Stop periodic announcements
     */
    function stopPeriodicAnnouncements() {
        if (announceInterval) {
            clearInterval(announceInterval);
            announceInterval = null;
            console.log('[BrowserBricker] ⏹️ Periodic announcements stopped');
        }
    }
    
    /**
     * Mark extension as detected and stop announcements
     */
    function markAsDetected(reason) {
        if (!hasBeenDetected) {
            hasBeenDetected = true;
            console.log(`[BrowserBricker] ✅ Marked as detected (reason: ${reason})`);
            stopPeriodicAnnouncements();
        }
    }
    
    // ============================================================================
    // MESSAGE HANDLING
    // ============================================================================
    
    /**
     * Listen for ping requests and acknowledgments from the website
     */
    function setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Verify message origin matches current page
            if (event.origin !== window.location.origin) {
                return;
            }
            
            const message = event.data;
            
            // Handle ping request
            if (message && message.type === 'BROWSERBRICKER_PING') {
                console.log('[BrowserBricker] 📨 Received PING request');
                
                // Log nonce if provided
                if (message.nonce) {
                    console.log(`[BrowserBricker] Ping nonce: ${message.nonce.substring(0, 8)}...`);
                }
                
                // Mark as detected
                markAsDetected('ping request');
                
                // Update timestamp
                updateTimestamp();
                
                // Respond with pong
                window.postMessage({
                    type: 'BROWSERBRICKER_PONG',
                    data: {
                        ...extensionInfo,
                        respondingTo: message.nonce || null
                    }
                }, window.location.origin);
                
                console.log('[BrowserBricker] 📤 Sent PONG response');
            }
            
            // Handle acknowledgment from page
            if (message && message.type === 'BROWSERBRICKER_ACK') {
                console.log('[BrowserBricker] ✅ Received ACK from page');
                markAsDetected('acknowledgment');
            }
            
            // Handle detection confirmation
            if (message && message.type === 'BROWSERBRICKER_DETECTED') {
                console.log('[BrowserBricker] ✅ Received DETECTED confirmation from page');
                markAsDetected('detection confirmation');
            }
        });
        
        console.log('[BrowserBricker] 👂 Message listener installed');
    }
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    
    /**
     * Initialize the content script
     */
    function initialize() {
        console.log('[BrowserBricker] 🚀 Initializing content script...');
        
        // Setup message listener FIRST (so we can receive pings immediately)
        setupMessageListener();
        
        // Announce immediately if DOM is ready
        if (document.readyState === 'loading') {
            // Wait for DOM to load
            document.addEventListener('DOMContentLoaded', () => {
                console.log('[BrowserBricker] DOM loaded');
                announcePresence();
                
                // Start periodic announcements after a short delay
                setTimeout(() => {
                    if (!hasBeenDetected) {
                        startPeriodicAnnouncements();
                    }
                }, 1000);
            });
        } else {
            // DOM already loaded - announce immediately
            console.log('[BrowserBricker] DOM already loaded');
            announcePresence();
            
            // Start periodic announcements after a short delay
            setTimeout(() => {
                if (!hasBeenDetected) {
                    startPeriodicAnnouncements();
                }
            }, 1000);
        }
        
        // Re-announce on page visibility change (handles tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !hasBeenDetected) {
                console.log('[BrowserBricker] 👁️ Page became visible, re-announcing');
                announcePresence();
                
                // Restart periodic announcements if they stopped
                if (!announceInterval && announceCount < MAX_ANNOUNCEMENTS) {
                    startPeriodicAnnouncements();
                }
            }
        });
        
        // Re-announce on window focus
        window.addEventListener('focus', () => {
            if (!hasBeenDetected) {
                console.log('[BrowserBricker] 🎯 Window focused, re-announcing');
                announcePresence();
            }
        });
        
        console.log('[BrowserBricker] ✅ Content script fully initialized');
    }
    
    // ============================================================================
    // CLEANUP
    // ============================================================================
    
    /**
     * Cleanup on page unload
     */
    window.addEventListener('beforeunload', () => {
        stopPeriodicAnnouncements();
        console.log('[BrowserBricker] 🧹 Cleanup complete');
    });
    
    // ============================================================================
    // START
    // ============================================================================
    
    // Start the content script
    initialize();
    
})();

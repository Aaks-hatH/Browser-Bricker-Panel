/**
 * DEVICE LOCKDOWN EXTENSION v4.1 - ENTERPRISE SECURITY ENDPOINT
 * 
 * Logic Components:
 * 1. PERSISTENCE: High-frequency 2s heartbeat loop + Advanced Keep-Alive System
 * 2. GEOLOCATION: Offscreen Document bridge to bypass Service Worker limits.
 * 3. ENFORCEMENT: Absolute tab redirection and navigation interception.
 * 4. TELEMETRY: Device fingerprinting, network status, and location reporting.
 * 5. ANTI-SUSPENSION: Multiple keep-alive strategies to prevent worker termination
 * 6. FAIL-CLOSED: Auto-lock on connection loss (NEW)
 */

const API_URL = 'https://browserbricker.onrender.com';
const HEARTBEAT_INTERVAL_MS = 2000; // 2-second heartbeat for real-time control
const KEEPALIVE_INTERVAL_MS = 20000; // 20-second keep-alive ping
const ALARM_NAME = 'keepalive-heartbeat';
const ALARM_PERIOD_MINUTES = 0.5; // 30 seconds

// NEW: Fail-closed configuration
const MAX_FAILED_HEARTBEATS = 1; // Lock after 1 consecutive failures (2 seconds)
const GRACE_PERIOD_MS = 100; // 100-ms grace period after startup
const RECONNECT_UNLOCK_REQUIRED_HEARTBEATS = 1; // Need 1 successful heartbeats to unlock

let deviceConfig = null;
let isArmed = false;
let deviceFingerprint = null;
let consecutiveErrors = 0;
let heartbeatTimer = null;
let keepAliveTimer = null;
let lastActivity = Date.now();

// NEW: Fail-closed state tracking
let isFailClosedLocked = false;
let consecutiveSuccesses = 0;
let lastSuccessfulHeartbeat = Date.now();
let startupTime = Date.now();

// ==========================================
// 0. ADVANCED KEEP-ALIVE SYSTEM
// ==========================================

/**
 * Strategy 1: Chrome Alarms API
 * Creates a persistent alarm that fires every 30 seconds
 * This is the most reliable way to keep the service worker alive
 */
async function setupAlarms() {
    // Clear any existing alarms
    await chrome.alarms.clear(ALARM_NAME);
    
    // Create a new alarm
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: ALARM_PERIOD_MINUTES
    });
    
    console.log('[KeepAlive] Alarm created');
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        lastActivity = Date.now();
        console.log('[KeepAlive] Alarm fired - Worker still alive');
        
        // Perform lightweight background activity
        await chrome.storage.local.get(['keepAlive']);
        
        // Ensure offscreen document exists
        await setupOffscreen();
        
        // If armed OR fail-closed locked, do a quick enforcement check (MODIFIED)
        if (isArmed || isFailClosedLocked) {
            await enforceBlockade();
        }
    }
});

/**
 * Strategy 2: Port Connection Keep-Alive
 * Opens a long-lived port connection that keeps the worker active
 */
let keepAlivePort = null;

function setupPortKeepAlive() {
    if (keepAlivePort) {
        keepAlivePort.disconnect();
    }
    
    // Connect to ourselves to keep the service worker alive
    keepAlivePort = chrome.runtime.connect({ name: 'keepalive-port' });
    
    keepAlivePort.onDisconnect.addListener(() => {
        console.log('[KeepAlive] Port disconnected, reconnecting...');
        setTimeout(setupPortKeepAlive, 1000);
    });
    
    keepAlivePort.onMessage.addListener((msg) => {
        if (msg.type === 'ping') {
            keepAlivePort.postMessage({ type: 'pong', timestamp: Date.now() });
        }
    });
    
    console.log('[KeepAlive] Port connection established');
}

// Listen for port connections
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keepalive-port') {
        lastActivity = Date.now();
        
        // Send periodic pings through the port
        const pingInterval = setInterval(() => {
            try {
                port.postMessage({ type: 'ping', timestamp: Date.now() });
            } catch (e) {
                clearInterval(pingInterval);
            }
        }, 15000);
        
        port.onDisconnect.addListener(() => {
            clearInterval(pingInterval);
        });
    }
});

/**
 * Strategy 3: Periodic Storage Access
 * Accessing chrome.storage prevents worker termination
 */
function startStorageKeepAlive() {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
    }
    
    keepAliveTimer = setInterval(async () => {
        lastActivity = Date.now();
        
        // Read and write to storage
        await chrome.storage.local.set({ 
            lastKeepAlive: Date.now(),
            heartbeatCount: (await chrome.storage.local.get('heartbeatCount')).heartbeatCount || 0 + 1
        });
        
        // Also access session storage
        await chrome.storage.session.set({ alive: true });
        
        console.log('[KeepAlive] Storage ping complete');
    }, KEEPALIVE_INTERVAL_MS);
}

/**
 * Strategy 4: Offscreen Document Persistence
 * Keeping the offscreen document alive helps keep the worker alive
 */
async function maintainOffscreenDocument() {
    try {
        const hasDocument = await chrome.offscreen.hasDocument();
        
        if (!hasDocument) {
            console.log('[KeepAlive] Offscreen document missing, recreating...');
            await setupOffscreen();
        }
        
        // Ping the offscreen document to keep it active
        try {
            await chrome.runtime.sendMessage({
                type: 'ping',
                target: 'offscreen'
            });
        } catch (e) {
            // Offscreen might not respond, that's ok
        }
    } catch (e) {
        console.error('[KeepAlive] Offscreen maintenance error:', e);
    }
}

/**
 * Strategy 5: Web Request Listener
 * Having active listeners prevents termination
 */
if (chrome.webRequest) {
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            lastActivity = Date.now();
            // This listener keeps the worker alive
            return {};
        },
        { urls: ["<all_urls>"] },
        []
    );
}

/**
 * Strategy 6: Self-Message Loop
 * Send messages to ourselves periodically
 */
function startSelfMessageLoop() {
    setInterval(() => {
        chrome.runtime.sendMessage({ 
            type: 'keepalive-self-ping',
            timestamp: Date.now() 
        }).catch(() => {
            // Ignore errors, we're just keeping alive
        });
    }, 25000);
}

/**
 * Master Keep-Alive Initialization
 * Activates all keep-alive strategies simultaneously
 */
async function initializeKeepAlive() {
    console.log('[KeepAlive] Initializing all keep-alive strategies...');
    
    // Strategy 1: Alarms
    await setupAlarms();
    
    // Strategy 2: Port connection
    setupPortKeepAlive();
    
    // Strategy 3: Storage access
    startStorageKeepAlive();
    
    // Strategy 4: Offscreen maintenance
    setInterval(maintainOffscreenDocument, 30000);
    
    // Strategy 6: Self-message loop
    startSelfMessageLoop();
    
    // Log status
    setInterval(() => {
        const uptime = Math.floor((Date.now() - lastActivity) / 1000);
        console.log(`[KeepAlive] Worker active. Last activity: ${uptime}s ago`);
    }, 60000);
    
    console.log('[KeepAlive] All strategies activated');
}

// ==========================================
// 1. INITIALIZATION & STORAGE
// ==========================================

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('[Lockdown] Extension Installed/Updated:', details.reason);
    startupTime = Date.now(); // NEW: Reset startup time
    await initializeKeepAlive();
    await startup();
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('[Lockdown] Browser Startup Detected');
    startupTime = Date.now(); // NEW: Reset startup time
    await initializeKeepAlive();
    await startup();
});

// Handle service worker activation
self.addEventListener('activate', async (event) => {
    console.log('[Lockdown] Service Worker Activated');
    await initializeKeepAlive();
});

/**
 * Main entry point for the background service
 */
async function startup() {
    await loadConfig();
    deviceFingerprint = await generateFingerprint();
    
    // Create the Offscreen bridge immediately
    await setupOffscreen();
    
    // Initiate the recursive heartbeat loop
    heartbeatLoop();
    
    console.log('[Lockdown] Extension Ready');
    // NEW: Log fail-closed status
    console.log(`[FAIL-CLOSED] Enabled - locks after ${MAX_FAILED_HEARTBEATS} failures (${MAX_FAILED_HEARTBEATS * 2}s)`);
}

/**
 * Load device configuration from chrome.storage.local
 */
async function loadConfig() {
    const data = await chrome.storage.local.get(['deviceConfig', 'isArmed', 'isFailClosedLocked']); // MODIFIED
    deviceConfig = data.deviceConfig || null;
    isArmed = data.isArmed || false;
    isFailClosedLocked = data.isFailClosedLocked || false; // NEW
    
    console.log('[Lockdown] Config Loaded:', deviceConfig ? 'Configured' : 'Not Configured');
    if (isArmed) console.log('[Lockdown] Device is ARMED');
    if (isFailClosedLocked) console.log('[FAIL-CLOSED] Device locked (connection lost)'); // NEW
}

// ==========================================
// 2. GPS / GEOLOCATION via Offscreen Bridge
// ==========================================

/**
 * Offscreen Documents allow geolocation in a service worker context
 */
async function setupOffscreen() {
    if (await chrome.offscreen.hasDocument?.()) return;

    try {
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen.html'),
            reasons: ['GEOLOCATION'],
            justification: 'Geolocation tracking for security enforcement'
        });
        console.log('[Lockdown] Offscreen Geolocation Bridge Created');
    } catch (err) {
        // Already exists
    }
}

/**
 * Requests current GPS coordinates from the offscreen document
 */
async function getGPSLocation() {
    if (!deviceConfig?.enableLocation) return null;

    try {
        return await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'get-geolocation'
        });
    } catch (e) {
        console.warn('[Lockdown] GPS unavailable or denied:', e.message);
        return null;
    }
}

/**
 * Retrieves browser and battery stats via Battery API approximation
 */
async function getSystemStats() {
    const stats = {
        platform: navigator.platform || 'Unknown',
        language: navigator.language || 'en-US',
        cores: navigator.hardwareConcurrency || 4,
        battery: null,
        network: null
    };

    // Battery Status (if available)
    try {
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            stats.battery = {
                level: Math.round(battery.level * 100),
                charging: battery.charging
            };
        }
    } catch (e) { /* Battery API not available */ }

    // Network Information (if available)
    try {
        if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            stats.network = {
                type: conn.effectiveType || 'unknown',
                downlink: conn.downlink || null
            };
        }
    } catch (e) { /* Network API not available */ }

    return stats;
}

// ==========================================
// 3. HEARTBEAT LOOP (MODIFIED FOR FAIL-CLOSED)
// ==========================================

/**
 * Recursive self-scheduling heartbeat function
 */
async function heartbeatLoop() {
    await checkDeviceState();
    heartbeatTimer = setTimeout(heartbeatLoop, HEARTBEAT_INTERVAL_MS);
}

/**
 * Check device state with server (MODIFIED FOR FAIL-CLOSED)
 */
async function checkDeviceState() {
    if (!deviceConfig) return;

    try {
        const coords = await getGPSLocation();
        const stats = await getSystemStats();
        const nonce = crypto.randomUUID();

        const response = await fetch(`${API_URL}/api/device/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deviceConfig.deviceApiKey}`
            },
            body: JSON.stringify({
                nonce,
                location: coords,
                metadata: {
                    browser: navigator.userAgent,
                    os: stats.platform,
                    fingerprint: deviceFingerprint,
                    version: chrome.runtime.getManifest().version,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Server Response: ${response.status}`);
        }

        const result = await response.json();
        
        // --- ORIGINAL LOGIC ---
        const shouldBeLocked = result.armed || result.quarantined;

        if (shouldBeLocked !== isArmed) {
            console.log(`[Lockdown] State Transition: ${isArmed} -> ${shouldBeLocked}`);
            isArmed = shouldBeLocked;
            await chrome.storage.local.set({ isArmed });
            await handleStateChange();
        }

        // --- NEW: SUCCESSFUL HEARTBEAT HANDLING ---
        lastSuccessfulHeartbeat = Date.now();
        consecutiveErrors = 0;
        consecutiveSuccesses++;
        
        // NEW: Check if we should unlock from fail-closed state
        if (isFailClosedLocked && !isArmed) {
            if (consecutiveSuccesses >= RECONNECT_UNLOCK_REQUIRED_HEARTBEATS) {
                console.log(`[FAIL-CLOSED] Connection restored! Unlocking after ${consecutiveSuccesses} successful heartbeats`);
                isFailClosedLocked = false;
                await chrome.storage.local.set({ isFailClosedLocked: false });
                showNotification('CONNECTION RESTORED', 'Server connection re-established. Device unlocked.');
            }
        }

    } catch (error) {
        consecutiveErrors++;
        consecutiveSuccesses = 0; // NEW: Reset success counter
        console.warn(`[Lockdown] Heartbeat Link Error (${consecutiveErrors}/${MAX_FAILED_HEARTBEATS}):`, error.message);
        
        // --- NEW: FAIL-CLOSED LOGIC ---
        const gracePeriodExpired = (Date.now() - startupTime) > GRACE_PERIOD_MS;
        
        if (consecutiveErrors >= MAX_FAILED_HEARTBEATS && gracePeriodExpired && !isFailClosedLocked) {
            console.error(`[FAIL-CLOSED] ⚠️ ACTIVATING - Connection lost for ${consecutiveErrors * 2} seconds`);
            isFailClosedLocked = true;
            await chrome.storage.local.set({ isFailClosedLocked: true });
            await enforceBlockade();
            showNotification('FAIL-CLOSED ACTIVATED', 'Device locked due to connection failure.');
        }
        
        // Security Feature: If link is lost while armed OR fail-closed, enforce blockade (MODIFIED)
        if (isArmed || isFailClosedLocked) await enforceBlockade();
    }
}

// ==========================================
// 4. LOCKDOWN ENFORCEMENT (BRICKER)
// ==========================================

/**
 * Identifies and redirects all non-essential tabs to the lock screen. (MODIFIED)
 */
async function enforceBlockade() {
    if (!isArmed && !isFailClosedLocked) return; // MODIFIED: Check both conditions

    const lockUrl = chrome.runtime.getURL('lock.html');
    
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            // Do not redirect internal chrome pages, existing lock pages, or system URLs
            if (tab.url && !tab.url.startsWith(lockUrl) && !isSystemPage(tab.url)) {
                chrome.tabs.update(tab.id, { url: lockUrl }).catch(() => {
                    // Fail silently if tab was closed during iteration
                });
            }
        }
    } catch (err) {
        console.error('[Lockdown] Enforcement Error:', err);
    }
}

/**
 * Detects if a URL is a browser system page that should not be redirected
 */
function isSystemPage(url) {

    if (!url) return false;
    
    const sysPrefixes = [`chrome-extension://${chrome.runtime.id}/lock.html`, `chrome-extension://${chrome.runtime.id}/offscreen.html`];
    return sysPrefixes.some(prefix => url.startsWith(prefix));
}

/**
 * Handles notifications and visual updates when state changes
 */
async function handleStateChange() {
    if (isArmed) {
        await enforceBlockade();
        showNotification('SECURITY LOCKDOWN', 'This device has been remotely locked by an administrator.');
    } else {
        showNotification('ACCESS RESTORED', 'Remote security enforcement has been deactivated.');
    }
}

// ==========================================
// 5. EVENT LISTENERS & INTERCEPTORS (MODIFIED)
// ==========================================

// Intercept new tabs created by the user or scripts
chrome.tabs.onCreated.addListener((tab) => {
    lastActivity = Date.now();
    
    if (isArmed || isFailClosedLocked) { // MODIFIED
        const lockUrl = chrome.runtime.getURL('lock.html');
        // Delay update slightly to ensure tab lifecycle allows for redirection
        setTimeout(() => {
            chrome.tabs.update(tab.id, { url: lockUrl }).catch(() => {});
        }, 50);
    }
});

// Intercept navigation events (Typing a URL or clicking a link)
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    lastActivity = Date.now();
    
    if ((isArmed || isFailClosedLocked) && details.frameId === 0) { // MODIFIED
        const lockUrl = chrome.runtime.getURL('lock.html');
        if (!details.url.startsWith(lockUrl) && !isSystemPage(details.url)) {
            chrome.tabs.update(details.tabId, { url: lockUrl }).catch(() => {});
        }
    }
});

// Tab update listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    lastActivity = Date.now();
});

// Window focus listener
chrome.windows.onFocusChanged.addListener((windowId) => {
    lastActivity = Date.now();
});

// ==========================================
// 6. COMMUNICATION (POPUP HANDLER) (MODIFIED)
// ==========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    lastActivity = Date.now();
    
    // Handle keep-alive pings
    if (message.type === 'keepalive-self-ping') {
        sendResponse({ alive: true, timestamp: Date.now() });
        return true;
    }
    
    // Handle offscreen pings
    if (message.type === 'ping' && message.target === 'offscreen') {
        sendResponse({ pong: true });
        return true;
    }
    
    // Status Request from Popup (MODIFIED)
    if (message.action === 'getStatus') {
        getGPSLocation().then(coords => {
            sendResponse({
                configured: !!deviceConfig,
                armed: isArmed,
                failClosedLocked: isFailClosedLocked, // NEW
                deviceName: deviceConfig?.deviceName || 'Unnamed Endpoint',
                online: consecutiveErrors === 0,
                errors: consecutiveErrors,
                location: coords,
                fingerprint: deviceFingerprint ? deviceFingerprint.substring(0, 16) : null,
                uptime: Math.floor((Date.now() - lastActivity) / 1000)
            });
        });
        return true; // Asynchronous response
    }

    // Manual Heartbeat Request
    if (message.action === 'checkNow') {
        checkDeviceState().then(() => {
            sendResponse({ success: true, armed: isArmed });
        });
        return true;
    }

    // Initial Configuration (MODIFIED)
    if (message.action === 'configure') {
        deviceConfig = message.config;
        startupTime = Date.now(); // NEW: Reset grace period on configuration
        chrome.storage.local.set({ deviceConfig }).then(() => {
            checkDeviceState(); 
            sendResponse({ success: true });
        });
        return true;
    }

    // Factory Reset / Reconfigure (MODIFIED)
    if (message.action === 'reset') {
        chrome.storage.local.clear().then(() => {
            deviceConfig = null;
            isArmed = false;
            isFailClosedLocked = false; // NEW
            consecutiveErrors = 0; // NEW
            consecutiveSuccesses = 0; // NEW
            sendResponse({ success: true });
        });
        return true;
    }

    // Geolocation Toggle from Popup
    if (message.action === 'toggleLocation') {
        if (deviceConfig) {
            deviceConfig.enableLocation = message.enabled;
            chrome.storage.local.set({ deviceConfig });
            sendResponse({ success: true });
        }
        return true;
    }
});

// ==========================================
// 7. UTILITIES & FINGERPRINTING
// ==========================================

/**
 * Generates a stable hardware/browser fingerprint using Crypto API
 */
async function generateFingerprint() {
    const dataString = navigator.userAgent + (navigator.hardwareConcurrency || '8') + navigator.platform + navigator.language;
    const msgBuffer = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Standardized Desktop Notification
 */
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: title,
        message: message,
        priority: 2
    });
}

// ==========================================
// 8. STARTUP & REVIVAL DETECTION
// ==========================================

// Detect if worker was suspended and revived
let isFirstRun = true;

if (isFirstRun) {
    console.log('[Lockdown] Initial worker startup');
    isFirstRun = false;
    initializeKeepAlive().then(() => startup());
} else {
    console.log('[Lockdown] Worker revival detected');
    initializeKeepAlive().then(() => startup());
}

console.log('[Lockdown] Background Service v4.1 Active with Enhanced Keep-Alive + FAIL-CLOSED');

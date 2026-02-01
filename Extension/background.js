/**
 * DEVICE LOCKDOWN EXTENSION v4.1 - ENTERPRISE SECURITY ENDPOINT
 * 
 * Logic Components:
 * 1. PERSISTENCE: High-frequency 2s heartbeat loop + Advanced Keep-Alive System
 * 2. GEOLOCATION: Offscreen Document bridge to bypass Service Worker limits.
 * 3. ENFORCEMENT: Absolute tab redirection and navigation interception.
 * 4. TELEMETRY: Device fingerprinting, network status, and location reporting.
 * 5. ANTI-SUSPENSION: Multiple keep-alive strategies to prevent worker termination
 */

const API_URL = 'https://browserbricker.onrender.com';
const HEARTBEAT_INTERVAL_MS = 2000; // 2-second heartbeat for real-time control
const KEEPALIVE_INTERVAL_MS = 20000; // 20-second keep-alive ping
const ALARM_NAME = 'keepalive-heartbeat';
const ALARM_PERIOD_MINUTES = 0.5; // 30 seconds

let deviceConfig = null;
let isArmed = false;
let deviceFingerprint = null;
let consecutiveErrors = 0;
let heartbeatTimer = null;
let keepAliveTimer = null;
let lastActivity = Date.now();

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
        
        // If armed, do a quick enforcement check
        if (isArmed) {
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
    await initializeKeepAlive();
    await startup();
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('[Lockdown] Browser Startup Detected');
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
    startHeartbeatLoop();
    
    console.log('[Lockdown] Startup complete');
}

/**
 * Loads device configuration and last known state from local storage
 */
async function loadConfig() {
    const result = await chrome.storage.local.get(['deviceConfig', 'isArmed']);
    deviceConfig = result.deviceConfig || null;
    isArmed = result.isArmed || false;
    console.log('[Lockdown] Configuration Loaded. Current State:', isArmed ? 'ARMED' : 'DISARMED');
}

// ==========================================
// 2. OFFSCREEN DOCUMENT & GPS BRIDGE
// ==========================================

/**
 * Manifest V3 Service Workers cannot access Geolocation directly.
 * We create an "Offscreen Document" to handle the GPS request.
 */
async function setupOffscreen() {
    try {
        const hasDocument = await chrome.offscreen.hasDocument();
        if (hasDocument) return;
        
        console.log('[Lockdown] Initializing Offscreen GPS Bridge...');
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['GEOLOCATION'],
            justification: 'Required for real-time geofencing and preventing Service Worker termination.',
        });
    } catch (error) {
        console.error('[Lockdown] Offscreen Creation Error:', error);
    }
}

/**
 * Pings the Offscreen bridge to get the current GPS coordinates
 */
async function getGPSLocation() {
    if (!deviceConfig?.deviceApiKey) return null;
    
    try {
        // Ensure bridge is active
        await setupOffscreen(); 
        
        // Messaging the Offscreen bridge (offscreen.js)
        const response = await chrome.runtime.sendMessage({
            type: 'get-geolocation',
            target: 'offscreen'
        });
        
        return response || null;
    } catch (e) {
        console.warn("[Lockdown] GPS Retrieval Failed:", e.message);
        return null;
    }
}

/**
 * Retrieves basic system telemetry
 */
async function getSystemStats() {
    return {
        online: navigator.onLine,
        platform: navigator.platform,
        timestamp: Date.now()
    };
}

// ==========================================
// 3. HEARTBEAT ENGINE
// ==========================================

/**
 * A recursive loop that pings the server every 2 seconds.
 * Using setTimeout ensures that even if a request hangs, they don't stack up.
 */
function startHeartbeatLoop() {
    const run = async () => {
        lastActivity = Date.now();
        
        if (deviceConfig && deviceConfig.deviceApiKey) {
            await checkDeviceState();
        }
        
        // If the device is armed, we re-run the blockade check every 2 seconds
        if (isArmed) {
            await enforceBlockade();
        }

        // Schedule next run
        heartbeatTimer = setTimeout(run, HEARTBEAT_INTERVAL_MS);
    };
    
    // Clear any existing timer
    if (heartbeatTimer) {
        clearTimeout(heartbeatTimer);
    }
    
    run();
}

/**
 * Communicates with the remote API to verify lock status
 */
async function checkDeviceState() {
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
        
        // IMPORTANT: The server returns "armed" or "quarantined". 
        // If either is true, the device must lock.
        const shouldBeLocked = result.data.armed || result.data.quarantined;

        if (shouldBeLocked !== isArmed) {
            console.log(`[Lockdown] State Transition: ${isArmed} -> ${shouldBeLocked}`);
            isArmed = shouldBeLocked;
            await chrome.storage.local.set({ isArmed });
            await handleStateChange();
        }

        consecutiveErrors = 0;
    } catch (error) {
        consecutiveErrors++;
        console.warn(`[Lockdown] Heartbeat Link Error (${consecutiveErrors}):`, error.message);
        
        // Security Feature: If link is lost while armed, stay armed.
        if (isArmed) await enforceBlockade();
    }
}

// ==========================================
// 4. LOCKDOWN ENFORCEMENT (BRICKER)
// ==========================================

/**
 * Identifies and redirects all non-essential tabs to the lock screen.
 */
async function enforceBlockade() {
    if (!isArmed) return;

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
    const sysPrefixes = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'brave://'];
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
// 5. EVENT LISTENERS & INTERCEPTORS
// ==========================================

// Intercept new tabs created by the user or scripts
chrome.tabs.onCreated.addListener((tab) => {
    lastActivity = Date.now();
    
    if (isArmed) {
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
    
    if (isArmed && details.frameId === 0) {
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
// 6. COMMUNICATION (POPUP HANDLER)
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
    
    // Status Request from Popup
    if (message.action === 'getStatus') {
        getGPSLocation().then(coords => {
            sendResponse({
                configured: !!deviceConfig,
                armed: isArmed,
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

    // Initial Configuration
    if (message.action === 'configure') {
        deviceConfig = message.config;
        chrome.storage.local.set({ deviceConfig }).then(() => {
            checkDeviceState(); 
            sendResponse({ success: true });
        });
        return true;
    }

    // Factory Reset / Reconfigure
    if (message.action === 'reset') {
        chrome.storage.local.clear().then(() => {
            deviceConfig = null;
            isArmed = false;
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

console.log('[Lockdown] Background Service v4.1 Active with Enhanced Keep-Alive');
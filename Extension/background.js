/**
 * DEVICE LOCKDOWN EXTENSION v4.1 - ENTERPRISE SECURITY ENDPOINT
 * 
 * Logic Components:
 * 1. PERSISTENCE: High-frequency 2s heartbeat loop + Advanced Keep-Alive System
 * 2. GEOLOCATION: Offscreen Document bridge to bypass Service Worker limits.
 * 3. ENFORCEMENT: Absolute tab redirection and navigation interception.
 * 4. TELEMETRY: Device fingerprinting, network status, and location reporting.
 * 5. ANTI-SUSPENSION: Multiple keep-alive strategies to prevent worker termination
 * 6. FAIL-CLOSED: Auto-lock on connection loss
 */

const API_URL = 'https://browserbricker.onrender.com';
const HEARTBEAT_INTERVAL_MS = 2000; // 2-second heartbeat for real-time control
const KEEPALIVE_INTERVAL_MS = 20000; // 20-second keep-alive ping
const ALARM_NAME = 'keepalive-heartbeat';
const ALARM_PERIOD_MINUTES = 0.5; // 30 seconds

// Fail-closed configuration
const MAX_FAILED_HEARTBEATS = 1; // Lock after 1 consecutive failures (2 seconds)
const GRACE_PERIOD_MS = 10000; // 10-second grace period after startup
const RECONNECT_UNLOCK_REQUIRED_HEARTBEATS = 1; // Need 1 successful heartbeats to unlock

let deviceConfig = null;
let isArmed = false;
let deviceFingerprint = null;
let consecutiveErrors = 0;
let heartbeatTimer = null;
let keepAliveTimer = null;
let lastActivity = Date.now();

// Fail-closed state tracking
let isFailClosedLocked = false;
let consecutiveSuccesses = 0;
let lastSuccessfulHeartbeat = Date.now();
let startupTime = Date.now();

// ==========================================
// 0. ADVANCED KEEP-ALIVE SYSTEM
// ==========================================

/**
 * Strategy 1: Chrome Alarms API
 */
async function setupAlarms() {
    await chrome.alarms.clear(ALARM_NAME);
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: ALARM_PERIOD_MINUTES
    });
    console.log('[KeepAlive] Alarm created');
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        lastActivity = Date.now();
        console.log('[KeepAlive] Alarm fired - Worker still alive');
        await chrome.storage.local.get(['keepAlive']);
        await setupOffscreen();
        if (isArmed || isFailClosedLocked) {
            await enforceBlockade();
        }
    }
});

/**
 * Strategy 2: Port Connection Keep-Alive
 */
let keepAlivePort = null;

function setupPortKeepAlive() {
    if (keepAlivePort) {
        keepAlivePort.disconnect();
    }
    
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

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keepalive-port') {
        lastActivity = Date.now();
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
 */
function startStorageKeepAlive() {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
    }
    
    keepAliveTimer = setInterval(async () => {
        lastActivity = Date.now();
        await chrome.storage.local.set({ 
            lastKeepAlive: Date.now(),
            heartbeatCount: (await chrome.storage.local.get('heartbeatCount')).heartbeatCount || 0 + 1
        });
        await chrome.storage.session.set({ alive: true });
        console.log('[KeepAlive] Storage ping complete');
    }, KEEPALIVE_INTERVAL_MS);
}

/**
 * Strategy 4: Offscreen Document Persistence
 */
async function maintainOffscreenDocument() {
    try {
        const hasDocument = await chrome.offscreen.hasDocument();
        
        if (!hasDocument) {
            console.log('[KeepAlive] Offscreen document missing, recreating...');
            await setupOffscreen();
        }
        
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
 */
if (chrome.webRequest) {
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            lastActivity = Date.now();
            return {};
        },
        { urls: ["<all_urls>"] },
        []
    );
}

/**
 * Strategy 6: Self-Message Loop
 */
function startSelfMessageLoop() {
    setInterval(() => {
        chrome.runtime.sendMessage({ 
            type: 'keepalive-self-ping',
            timestamp: Date.now() 
        }).catch(() => {});
    }, 25000);
}

/**
 * Master Keep-Alive Initialization
 */
async function initializeKeepAlive() {
    console.log('[KeepAlive] Initializing all keep-alive strategies...');
    await setupAlarms();
    setupPortKeepAlive();
    startStorageKeepAlive();
    setInterval(maintainOffscreenDocument, 30000);
    startSelfMessageLoop();
    
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
    startupTime = Date.now();
    await initializeKeepAlive();
    await startup();
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('[Lockdown] Browser Startup Detected');
    startupTime = Date.now();
    await initializeKeepAlive();
    await startup();
});

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
    await setupOffscreen();
    heartbeatLoop();
    console.log('[Lockdown] Extension Ready');
    console.log(`[FAIL-CLOSED] Enabled - locks after ${MAX_FAILED_HEARTBEATS} failures (${MAX_FAILED_HEARTBEATS * 2}s)`);
}

/**
 * Load device configuration from chrome.storage.local
 */
async function loadConfig() {
    const data = await chrome.storage.local.get(['deviceConfig', 'isArmed', 'isFailClosedLocked']);
    deviceConfig = data.deviceConfig || null;
    isArmed = data.isArmed || false;
    isFailClosedLocked = data.isFailClosedLocked || false;
    
    console.log('[Lockdown] Config Loaded:', deviceConfig ? 'Configured' : 'Not Configured');
    if (isArmed) console.log('[Lockdown] Device is ARMED');
    if (isFailClosedLocked) console.log('[FAIL-CLOSED] Device locked (connection lost)');
}

// ==========================================
// 2. GPS / GEOLOCATION via Offscreen Bridge
// ==========================================

/**
 * Offscreen Documents allow geolocation in a service worker context
 */
async function setupOffscreen() {
    try {
        // Check if offscreen document already exists
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        
        if (existingContexts.length > 0) {
            console.log('[Lockdown] Offscreen document already exists');
            return;
        }

        // Create new offscreen document
        await chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('offscreen.html'),
            reasons: ['GEOLOCATION'],
            justification: 'Geolocation tracking for security enforcement'
        });
        
        console.log('[Lockdown] Offscreen Geolocation Bridge Created');
        
        // Give the offscreen document a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (err) {
        // If error is about document already existing, that's fine
        if (err.message?.includes('already exists')) {
            console.log('[Lockdown] Offscreen document already exists (caught)');
        } else {
            console.error('[Lockdown] Error setting up offscreen:', err.message);
        }
    }
}

/**
 * Requests current GPS coordinates from the offscreen document
 */
async function getGPSLocation() {
    if (!deviceConfig?.enableLocation) {
        console.log('[GPS] Location tracking disabled in config');
        return null;
    }

    try {
        console.log('[GPS] Requesting location from offscreen...');
        
        // Use a Promise with timeout to prevent hanging
        const coords = await Promise.race([
            chrome.runtime.sendMessage({
                target: 'offscreen',
                type: 'get-geolocation'
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('GPS request timeout')), 12000)
            )
        ]);
        
        if (coords && coords.lat !== undefined && coords.lon !== undefined) {
            console.log('[GPS] Location acquired:', coords.lat.toFixed(6), coords.lon.toFixed(6));
            return coords;
        } else {
            console.log('[GPS] No location data returned from offscreen');
            return null;
        }
    } catch (e) {
        console.warn('[GPS] Error getting location:', e.message);
        return null;
    }
}

/**
 * Retrieves browser and battery stats
 * Service workers don't have access to navigator.getBattery or navigator.connection
 * We send a message to the offscreen document to get this data
 */
async function getSystemStats() {
    try {
        // Use a Promise with timeout to prevent hanging
        const stats = await Promise.race([
            chrome.runtime.sendMessage({
                target: 'offscreen',
                type: 'get-system-stats'
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Stats request timeout')), 5000)
            )
        ]);
        
        if (stats) {
            console.log('[Stats] Battery:', stats.battery, 'Network:', stats.network);
            return stats;
        }
    } catch (e) {
        console.warn('[Stats] Could not get system stats:', e.message);
    }
    
    // Fallback
    return {
        platform: 'Unknown',
        language: 'en-US',
        cores: 4,
        battery: null,
        network: null
    };
}

// ==========================================
// 3. HEARTBEAT LOOP
// ==========================================

/**
 * Recursive self-scheduling heartbeat function
 */
async function heartbeatLoop() {
    await checkDeviceState();
    heartbeatTimer = setTimeout(heartbeatLoop, HEARTBEAT_INTERVAL_MS);
}

/**
 * Check device state with server
 */
async function checkDeviceState() {
    if (!deviceConfig) return;

    try {
        const coords = await getGPSLocation();
        const stats = await getSystemStats();
        const nonce = crypto.randomUUID();

        console.log('[Heartbeat] Sending to server with location:', coords);

        // Build payload matching server expectations
        const payload = {
            nonce,
            fingerprint: deviceFingerprint
        };

        // Add location fields at TOP LEVEL if available
        if (coords && coords.lat !== undefined && coords.lon !== undefined) {
            payload.lat = coords.lat;
            payload.lon = coords.lon;
            payload.accuracy = coords.accuracy;
            console.log('[Heartbeat] Including location:', payload.lat, payload.lon);
        }

        // Add battery at TOP LEVEL if available
        if (stats && stats.battery) {
            payload.battery = stats.battery;
            console.log('[Heartbeat] Including battery:', stats.battery);
        }

        // Add network at TOP LEVEL if available
        if (stats && stats.network) {
            payload.network = stats.network;
            console.log('[Heartbeat] Including network:', stats.network);
        }

        const response = await fetch(`${API_URL}/api/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deviceConfig.deviceApiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server Response: ${response.status}`);
        }

        const result = await response.json();
        
        const shouldBeLocked = result.armed || result.quarantined;

        if (shouldBeLocked !== isArmed) {
            console.log(`[Lockdown] State Transition: ${isArmed} -> ${shouldBeLocked}`);
            isArmed = shouldBeLocked;
            await chrome.storage.local.set({ isArmed });
            await handleStateChange();
        }

        // Successful heartbeat handling
        lastSuccessfulHeartbeat = Date.now();
        consecutiveErrors = 0;
        consecutiveSuccesses++;
        
        // Check if we should unlock from fail-closed state
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
        consecutiveSuccesses = 0;
        console.warn(`[Lockdown] Heartbeat Link Error (${consecutiveErrors}/${MAX_FAILED_HEARTBEATS}):`, error.message);
        
        const gracePeriodExpired = (Date.now() - startupTime) > GRACE_PERIOD_MS;
        
        if (consecutiveErrors >= MAX_FAILED_HEARTBEATS && gracePeriodExpired && !isFailClosedLocked) {
            console.error(`[FAIL-CLOSED] ⚠️ ACTIVATING - Connection lost for ${consecutiveErrors * 2} seconds`);
            isFailClosedLocked = true;
            await chrome.storage.local.set({ isFailClosedLocked: true });
            await enforceBlockade();
            showNotification('FAIL-CLOSED ACTIVATED', 'Device locked due to connection failure.');
        }
        
        if (isArmed || isFailClosedLocked) await enforceBlockade();
    }
}

// ==========================================
// 4. LOCKDOWN ENFORCEMENT
// ==========================================

async function enforceBlockade() {
    if (!isArmed && !isFailClosedLocked) return;

    const lockUrl = chrome.runtime.getURL('lock.html');
    
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url && !tab.url.startsWith(lockUrl) && !isSystemPage(tab.url)) {
                chrome.tabs.update(tab.id, { url: lockUrl }).catch(() => {});
            }
        }
    } catch (err) {
        console.error('[Lockdown] Enforcement Error:', err);
    }
}

function isSystemPage(url) {
    if (!url) return false;
    const sysPrefixes = [`chrome-extension://${chrome.runtime.id}/lock.html`, `chrome-extension://${chrome.runtime.id}/offscreen.html`];
    return sysPrefixes.some(prefix => url.startsWith(prefix));
}

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

chrome.tabs.onCreated.addListener((tab) => {
    lastActivity = Date.now();
    if (isArmed || isFailClosedLocked) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        setTimeout(() => {
            chrome.tabs.update(tab.id, { url: lockUrl }).catch(() => {});
        }, 50);
    }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    lastActivity = Date.now();
    if ((isArmed || isFailClosedLocked) && details.frameId === 0) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        if (!details.url.startsWith(lockUrl) && !isSystemPage(details.url)) {
            chrome.tabs.update(details.tabId, { url: lockUrl }).catch(() => {});
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    lastActivity = Date.now();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    lastActivity = Date.now();
});

// ==========================================
// 6. COMMUNICATION (POPUP HANDLER)
// ==========================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    lastActivity = Date.now();
    
    if (message.type === 'keepalive-self-ping') {
        sendResponse({ alive: true, timestamp: Date.now() });
        return true;
    }
    
    if (message.type === 'ping' && message.target === 'offscreen') {
        sendResponse({ pong: true });
        return true;
    }
    
    if (message.action === 'getStatus') {
        Promise.all([getGPSLocation(), getSystemStats()]).then(([coords, stats]) => {
            sendResponse({
                configured: !!deviceConfig,
                armed: isArmed,
                failClosedLocked: isFailClosedLocked,
                deviceName: deviceConfig?.deviceName || 'Unnamed Endpoint',
                online: consecutiveErrors === 0,
                errors: consecutiveErrors,
                location: coords,
                battery: stats?.battery,
                network: stats?.network,
                fingerprint: deviceFingerprint ? deviceFingerprint.substring(0, 16) : null,
                uptime: Math.floor((Date.now() - lastActivity) / 1000)
            });
        });
        return true;
    }

    if (message.action === 'checkNow') {
        checkDeviceState().then(() => {
            sendResponse({ success: true, armed: isArmed });
        });
        return true;
    }

    if (message.action === 'configure') {
        deviceConfig = message.config;
        startupTime = Date.now();
        chrome.storage.local.set({ deviceConfig }).then(() => {
            checkDeviceState(); 
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.action === 'reset') {
        chrome.storage.local.clear().then(() => {
            deviceConfig = null;
            isArmed = false;
            isFailClosedLocked = false;
            consecutiveErrors = 0;
            consecutiveSuccesses = 0;
            sendResponse({ success: true });
        });
        return true;
    }

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

async function generateFingerprint() {
    const dataString = 'ChromeExtension' + chrome.runtime.getManifest().version + Date.now();
    const msgBuffer = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
// 8. STARTUP
// ==========================================

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
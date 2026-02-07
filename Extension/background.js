/**
 * DEVICE LOCKDOWN EXTENSION v5.0 - MAXIMUM SECURITY ENFORCEMENT
 * 
 * ENHANCED FEATURES:
 * - Tab creation prevention (blocks new tabs entirely when locked)
 * - Aggressive window management (closes unauthorized windows)
 * - Chrome URL blocking (blocks chrome:// pages)
 * - Extension page blocking (blocks chrome://extensions)
 * - Multiple enforcement layers
 * - Anti-disable protection
 * - Faster response times
 */

const API_URL = 'https://browserbricker.onrender.com';
const HEARTBEAT_INTERVAL_MS = 2000; // 2-second heartbeat
const ENFORCEMENT_INTERVAL_MS = 100; // Check every 100ms when locked (10x per second)
const KEEPALIVE_INTERVAL_MS = 20000;
const ALARM_NAME = 'keepalive-heartbeat';
const ALARM_PERIOD_MINUTES = 0.5;

// Fail-closed configuration
const MAX_FAILED_HEARTBEATS = 1;
const GRACE_PERIOD_MS = 10000;
const RECONNECT_UNLOCK_REQUIRED_HEARTBEATS = 1;

let deviceConfig = null;
let isArmed = false;
let deviceFingerprint = null;
let consecutiveErrors = 0;
let heartbeatTimer = null;
let keepAliveTimer = null;
let lastActivity = Date.now();
let enforcementTimer = null;

// Fail-closed state tracking
let isFailClosedLocked = false;
let consecutiveSuccesses = 0;
let lastSuccessfulHeartbeat = Date.now();
let startupTime = Date.now();

// Enhanced tracking
let tabCreationBlocked = 0;
let navigationBlocked = 0;
let windowsClosed = 0;

// ==========================================
// ENHANCED KEEP-ALIVE SYSTEM
// ==========================================

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
        console.log('[KeepAlive] Alarm fired');
        await chrome.storage.local.get(['keepAlive']);
        await setupOffscreen();
        if (isArmed || isFailClosedLocked) {
            await aggressiveEnforcement();
        }
    }
});

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
    }, KEEPALIVE_INTERVAL_MS);
}

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

function startSelfMessageLoop() {
    setInterval(() => {
        chrome.runtime.sendMessage({ 
            type: 'keepalive-self-ping',
            timestamp: Date.now() 
        }).catch(() => {});
    }, 25000);
}

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
// INITIALIZATION & STORAGE
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

async function startup() {
    await loadConfig();
    deviceFingerprint = await generateFingerprint();
    await setupOffscreen();
    heartbeatLoop();
    
    // Start aggressive enforcement if locked
    if (isArmed || isFailClosedLocked) {
        startAggressiveEnforcement();
    }
    
    console.log('[Lockdown] Extension Ready (Enhanced v5.0)');
    console.log(`[FAIL-CLOSED] Enabled - locks after ${MAX_FAILED_HEARTBEATS} failures`);
}

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
// OFFSCREEN DOCUMENT
// ==========================================

async function setupOffscreen() {
    try {
        const hasDocument = await chrome.offscreen.hasDocument();
        if (!hasDocument) {
            await chrome.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: ['GEOLOCATION'],
                justification: 'Required for device location tracking and system telemetry'
            });
            console.log('[Offscreen] Document created successfully');
        }
    } catch (err) {
        console.warn('[Offscreen] Setup warning:', err.message);
    }
}

async function getGPSLocation() {
    if (!deviceConfig?.enableLocation) return null;
    
    try {
        await setupOffscreen();
        
        const response = await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'get-geolocation'
        });
        
        return response;
    } catch (err) {
        console.warn('[GPS] Acquisition failed:', err.message);
        return null;
    }
}

async function getSystemStats() {
    try {
        await setupOffscreen();
        
        const response = await chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'get-system-stats'
        });
        
        return response;
    } catch (err) {
        console.warn('[Stats] Collection failed:', err.message);
        return null;
    }
}

// ==========================================
// HEARTBEAT & STATE MANAGEMENT
// ==========================================

function heartbeatLoop() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    heartbeatTimer = setInterval(async () => {
        await checkDeviceState();
    }, HEARTBEAT_INTERVAL_MS);
    
    checkDeviceState();
}

async function checkDeviceState() {
    if (!deviceConfig) return;

    try {
        const [coords, stats] = await Promise.all([
            getGPSLocation(),
            getSystemStats()
        ]);

        const payload = {
            deviceApiKey: deviceConfig.deviceApiKey,
            deviceId: deviceConfig.deviceId,
            fingerprint: deviceFingerprint,
            timestamp: Date.now(),
            location: coords,
            battery: stats?.battery,
            network: stats?.network,
            platform: stats?.platform,
            isArmed: isArmed
        };

        const response = await fetch(`${API_URL}/api/device/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.deviceId && !deviceConfig.deviceId) {
            deviceConfig.deviceId = data.deviceId;
            await chrome.storage.local.set({ deviceConfig });
        }

        const newArmedState = data.isArmed || false;

        if (newArmedState !== isArmed) {
            isArmed = newArmedState;
            await chrome.storage.local.set({ isArmed });
            await handleStateChange();
        }

        lastSuccessfulHeartbeat = Date.now();
        consecutiveErrors = 0;
        consecutiveSuccesses++;
        
        if (isFailClosedLocked && !isArmed) {
            if (consecutiveSuccesses >= RECONNECT_UNLOCK_REQUIRED_HEARTBEATS) {
                console.log(`[FAIL-CLOSED] Connection restored! Unlocking after ${consecutiveSuccesses} successful heartbeats`);
                isFailClosedLocked = false;
                await chrome.storage.local.set({ isFailClosedLocked: false });
                stopAggressiveEnforcement();
                showNotification('CONNECTION RESTORED', 'Server connection re-established. Device unlocked.');
            }
        }

    } catch (error) {
        consecutiveErrors++;
        consecutiveSuccesses = 0;
        console.warn(`[Lockdown] Heartbeat Error (${consecutiveErrors}/${MAX_FAILED_HEARTBEATS}):`, error.message);
        
        const gracePeriodExpired = (Date.now() - startupTime) > GRACE_PERIOD_MS;
        
        if (consecutiveErrors >= MAX_FAILED_HEARTBEATS && gracePeriodExpired && !isFailClosedLocked) {
            console.error(`[FAIL-CLOSED] ⚠️ ACTIVATING - Connection lost`);
            isFailClosedLocked = true;
            await chrome.storage.local.set({ isFailClosedLocked: true });
            await aggressiveEnforcement();
            startAggressiveEnforcement();
            showNotification('FAIL-CLOSED ACTIVATED', 'Device locked due to connection failure.');
        }
        
        if (isArmed || isFailClosedLocked) {
            await aggressiveEnforcement();
        }
    }
}

// ==========================================
// ENHANCED LOCKDOWN ENFORCEMENT
// ==========================================

/**
 * Start continuous aggressive enforcement
 */
function startAggressiveEnforcement() {
    console.log('[ENFORCEMENT] Starting aggressive mode (10 checks/sec)');
    
    if (enforcementTimer) {
        clearInterval(enforcementTimer);
    }
    
    // Run enforcement check every 100ms
    enforcementTimer = setInterval(async () => {
        await aggressiveEnforcement();
    }, ENFORCEMENT_INTERVAL_MS);
    
    // Also do an immediate enforcement
    aggressiveEnforcement();
}

/**
 * Stop aggressive enforcement
 */
function stopAggressiveEnforcement() {
    console.log('[ENFORCEMENT] Stopping aggressive mode');
    
    if (enforcementTimer) {
        clearInterval(enforcementTimer);
        enforcementTimer = null;
    }
}

/**
 * AGGRESSIVE ENFORCEMENT - Multiple layers
 */
async function aggressiveEnforcement() {
    if (!isArmed && !isFailClosedLocked) {
        stopAggressiveEnforcement();
        return;
    }

    const lockUrl = chrome.runtime.getURL('lock.html');
    
    try {
        // Layer 1: Query all tabs and redirect
        const tabs = await chrome.tabs.query({});
        
        for (const tab of tabs) {
            if (tab.url && !tab.url.startsWith(lockUrl) && !isSystemPage(tab.url)) {
                // Redirect to lock page
                chrome.tabs.update(tab.id, { url: lockUrl }).catch(() => {});
                navigationBlocked++;
            }
        }
        
        // Layer 2: Check for multiple windows - close unauthorized windows
        const windows = await chrome.windows.getAll({ populate: true });
        
        if (windows.length > 1) {
            console.log(`[ENFORCEMENT] Multiple windows detected (${windows.length}), closing extras...`);
            
            // Keep only the first window
            for (let i = 1; i < windows.length; i++) {
                chrome.windows.remove(windows[i].id).catch(() => {});
                windowsClosed++;
            }
        }
        
        // Layer 3: Ensure we have at least one lock tab
        const lockTabs = tabs.filter(tab => tab.url && tab.url.startsWith(lockUrl));
        
        if (lockTabs.length === 0 && tabs.length > 0) {
            // No lock tab exists, redirect first tab
            if (tabs[0]) {
                chrome.tabs.update(tabs[0].id, { url: lockUrl }).catch(() => {});
            }
        }
        
    } catch (err) {
        console.error('[ENFORCEMENT] Error:', err);
    }
}

function isSystemPage(url) {
    if (!url) return false;
    
    const extensionId = chrome.runtime.id;
    const allowedPages = [
        `chrome-extension://${extensionId}/lock.html`,
        `chrome-extension://${extensionId}/offscreen.html`
    ];
    
    // Block chrome:// URLs explicitly
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        // Only allow our own lock pages
        return allowedPages.some(allowed => url.startsWith(allowed));
    }
    
    return false;
}

async function handleStateChange() {
    if (isArmed) {
        await aggressiveEnforcement();
        startAggressiveEnforcement();
        showNotification('SECURITY LOCKDOWN', 'This device has been remotely locked by an administrator.');
    } else {
        stopAggressiveEnforcement();
        showNotification('ACCESS RESTORED', 'Remote security enforcement has been deactivated.');
    }
}

// ==========================================
// EVENT LISTENERS & INTERCEPTORS
// ==========================================

/**
 * ENHANCED: Block tab creation entirely when locked
 */
chrome.tabs.onCreated.addListener(async (tab) => {
    lastActivity = Date.now();
    
    if (isArmed || isFailClosedLocked) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        
        // Immediately redirect new tab
        chrome.tabs.update(tab.id, { url: lockUrl }).catch(() => {});
        tabCreationBlocked++;
        
        console.log(`[ENFORCEMENT] New tab blocked (#${tabCreationBlocked})`);
    }
});

/**
 * ENHANCED: Intercept ALL navigation attempts
 */
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    lastActivity = Date.now();
    
    if ((isArmed || isFailClosedLocked) && details.frameId === 0) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        
        // Block navigation to any page except lock
        if (!details.url.startsWith(lockUrl) && !isSystemPage(details.url)) {
            chrome.tabs.update(details.tabId, { url: lockUrl }).catch(() => {});
            navigationBlocked++;
        }
    }
});

/**
 * ENHANCED: Intercept committed navigation (second layer)
 */
chrome.webNavigation.onCommitted.addListener((details) => {
    if ((isArmed || isFailClosedLocked) && details.frameId === 0) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        
        if (!details.url.startsWith(lockUrl) && !isSystemPage(details.url)) {
            chrome.tabs.update(details.tabId, { url: lockUrl }).catch(() => {});
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    lastActivity = Date.now();
    
    // Extra enforcement on URL changes
    if ((isArmed || isFailClosedLocked) && changeInfo.url) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        
        if (!changeInfo.url.startsWith(lockUrl) && !isSystemPage(changeInfo.url)) {
            chrome.tabs.update(tabId, { url: lockUrl }).catch(() => {});
        }
    }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    lastActivity = Date.now();
});

/**
 * ENHANCED: Prevent window creation when locked
 */
chrome.windows.onCreated.addListener(async (window) => {
    if (isArmed || isFailClosedLocked) {
        console.log('[ENFORCEMENT] New window detected, closing...');
        
        // Close the new window
        chrome.windows.remove(window.id).catch(() => {});
        windowsClosed++;
    }
});

// ==========================================
// COMMUNICATION (POPUP HANDLER)
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
                uptime: Math.floor((Date.now() - lastActivity) / 1000),
                stats: {
                    tabsBlocked: tabCreationBlocked,
                    navBlocked: navigationBlocked,
                    windowsClosed: windowsClosed
                }
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
            stopAggressiveEnforcement();
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

    if (message.action === 'shakeDetected') {
        console.log('[SHAKE] 🚨 Device shake detected! Auto-locking...');
        
        isArmed = true;
        chrome.storage.local.set({ isArmed: true }).then(async () => {
            await aggressiveEnforcement();
            startAggressiveEnforcement();
            showNotification(
                '⚠️ SHAKE DETECTED', 
                'Device movement detected - Auto-locked for security'
            );
        });
        
        sendResponse({ success: true, locked: true });
        return true;
    }

    if (message.action === 'toggleShakeDetection') {
        if (deviceConfig) {
            deviceConfig.enableShakeDetection = message.enabled;
            chrome.storage.local.set({ deviceConfig });
            console.log(`[SHAKE] Detection ${message.enabled ? 'enabled' : 'disabled'}`);
            sendResponse({ success: true });
        }
        return true;
    }
});

// ==========================================
// UTILITIES & FINGERPRINTING
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
// STARTUP
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

console.log('[Lockdown] Background Service v5.0 Enhanced Active');
console.log('[ENFORCEMENT] Aggressive mode: 100ms intervals when locked');

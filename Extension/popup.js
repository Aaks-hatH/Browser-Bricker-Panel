// Enhanced Popup Script for Device Lockdown Extension v4.0

chrome.storage.local.get(['isArmed'], (result) => {
    if (result.isArmed) {
        // Option A: Redirect the popup to the lock screen (Best)
        window.location.href = "lock.html";
        
        // Option B: Just close the popup immediately
        // window.close(); 
    }
});

const setupScreen = document.getElementById('setupScreen');
const statusScreen = document.getElementById('statusScreen');
const setupForm = document.getElementById('setupForm');
const apiKeyInput = document.getElementById('apiKeyInput');
const statusBadge = document.getElementById('statusBadge');
const onlineBadge = document.getElementById('onlineBadge');
const deviceName = document.getElementById('deviceName');
const refreshBtn = document.getElementById('refreshBtn');
const reconfigureBtn = document.getElementById('reconfigureBtn');
const alertContainer = document.getElementById('alertContainer');

// NEW: Advanced display elements
const securityIndicator = document.getElementById('securityIndicator');
const securityText = document.getElementById('securityText');
const locationCard = document.getElementById('locationCard');
const locationDisplay = document.getElementById('locationDisplay');
const locationToggle = document.getElementById('locationToggle');
const batteryCard = document.getElementById('batteryCard');
const batteryLevel = document.getElementById('batteryLevel');
const batteryStatus = document.getElementById('batteryStatus');
const batteryFill = document.getElementById('batteryFill');
const networkCard = document.getElementById('networkCard');
const networkType = document.getElementById('networkType');
const networkSpeed = document.getElementById('networkSpeed');
const fingerprintDisplay = document.getElementById('fingerprintDisplay');

// Auto-refresh interval
let autoRefreshInterval = null;

// Show alert
function showAlert(message, type = 'error') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Load and display status
async function loadStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
        
        if (!response.configured) {
            setupScreen.style.display = 'block';
            statusScreen.style.display = 'none';
            stopAutoRefresh();
            return;
        }

        setupScreen.style.display = 'none';
        statusScreen.style.display = 'block';

        // Update lock status
        if (response.armed) {
            statusBadge.textContent = 'ARMED';
            statusBadge.className = 'badge badge-armed';
            securityIndicator.className = 'security-indicator warning';
            securityText.textContent = '⚠️ Device is locked';
        } else {
            statusBadge.textContent = 'DISARMED';
            statusBadge.className = 'badge badge-disarmed';
            securityIndicator.className = 'security-indicator';
            securityText.textContent = '✓ All systems secure';
        }

        // Update online status
        if (response.online) {
            onlineBadge.textContent = 'ONLINE';
            onlineBadge.className = 'badge badge-online';
        } else {
            onlineBadge.textContent = 'OFFLINE';
            onlineBadge.className = 'badge badge-offline';
            securityIndicator.className = 'security-indicator warning';
            securityText.textContent = '⚠️ Connection lost - ' + response.errors + ' errors';
        }

        deviceName.textContent = response.deviceName || 'Unknown';

        // NEW: Display location
        if (response.location) {
            locationCard.style.display = 'block';
            const lat = response.location.lat.toFixed(6);
            const lon = response.location.lon.toFixed(6);
            const acc = Math.round(response.location.accuracy);
            locationDisplay.innerHTML = `
                Lat: ${lat}<br>
                Lon: ${lon}<br>
                <span style="font-size: 10px; color: #64748b;">Accuracy: ±${acc}m</span>
            `;
            locationToggle.classList.add('active');
        } else {
            locationCard.style.display = 'block';
            locationDisplay.textContent = 'Location disabled or unavailable';
            locationToggle.classList.remove('active');
        }

        // NEW: Display battery
        if (response.battery) {
            batteryCard.style.display = 'block';
            const level = response.battery.level;
            batteryLevel.textContent = level + '%';
            batteryStatus.textContent = response.battery.charging ? '⚡ Charging' : '🔌 Discharging';
            batteryFill.style.width = level + '%';
            
            if (level > 60) {
                batteryFill.className = 'battery-fill battery-high';
            } else if (level > 20) {
                batteryFill.className = 'battery-fill battery-medium';
            } else {
                batteryFill.className = 'battery-fill battery-low';
            }
        } else {
            batteryCard.style.display = 'none';
        }

        // NEW: Display network
        if (response.network) {
            networkCard.style.display = 'block';
            const type = response.network.type.toUpperCase();
            networkType.textContent = type;
            
            if (response.network.downlink) {
                networkSpeed.textContent = response.network.downlink + ' Mbps';
            } else {
                networkSpeed.textContent = 'Speed unknown';
            }
            
            // Color code network type
            if (type.includes('4G') || type.includes('WIFI')) {
                networkType.style.color = '#10b981';
            } else if (type.includes('3G')) {
                networkType.style.color = '#f59e0b';
            } else {
                networkType.style.color = '#64748b';
            }
        } else {
            networkCard.style.display = 'none';
        }

        // NEW: Display fingerprint
        if (response.fingerprint) {
            fingerprintDisplay.textContent = response.fingerprint;
        } else {
            fingerprintDisplay.textContent = 'Generating...';
        }

        // Start auto-refresh
        startAutoRefresh();
    } catch (error) {
        console.error('Error loading status:', error);
        showAlert('Failed to load status');
    }
}

// Setup form submission
setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiKey = apiKeyInput.value.trim();

    if (apiKey.length !== 64) {
        showAlert('API key must be exactly 64 characters');
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'configure',
            config: {
                deviceApiKey: apiKey,
                deviceName: 'Browser Extension',
                deviceId: null,
                configuredAt: Date.now(),
                enableLocation: true
            }
        });

        if (response.success) {
            showAlert('Device configured successfully!', 'success');
            setTimeout(() => {
                loadStatus();
            }, 1000);
        }
    } catch (error) {
        showAlert('Configuration failed: ' + error.message);
    }
});

// Refresh button
refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Refreshing...';

    try {
        await chrome.runtime.sendMessage({ action: 'checkNow' });
        await loadStatus();
        showAlert('Status refreshed', 'success');
    } catch (error) {
        showAlert('Failed to refresh status');
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Refresh Status';
    }
});

// Reconfigure button
reconfigureBtn.addEventListener('click', async () => {
    if (confirm('Reconfigure device? You will need a new API key from the control panel.')) {
        try {
            await chrome.runtime.sendMessage({ action: 'reset' });
            showAlert('Device reset successfully', 'success');
            setTimeout(() => {
                loadStatus();
            }, 500);
        } catch (error) {
            showAlert('Failed to reset device');
        }
    }
});

// NEW: Location toggle
locationToggle.addEventListener('click', async () => {
    const isActive = locationToggle.classList.contains('active');
    
    try {
        await chrome.runtime.sendMessage({ 
            action: 'toggleLocation', 
            enabled: !isActive 
        });
        
        if (!isActive) {
            locationToggle.classList.add('active');
            showAlert('Location tracking enabled', 'success');
            locationDisplay.textContent = 'Waiting for GPS...';
        } else {
            locationToggle.classList.remove('active');
            showAlert('Location tracking disabled', 'success');
            locationDisplay.textContent = 'Location tracking disabled';
        }
        
        setTimeout(loadStatus, 1000);
    } catch (error) {
        showAlert('Failed to toggle location');
    }
});

// Auto-refresh every 3 seconds
function startAutoRefresh() {
    stopAutoRefresh();
    autoRefreshInterval = setInterval(() => {
        loadStatus();
    }, 3000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Listen for status updates from background
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'statusUpdate') {
        loadStatus();
    }
});

// Initialize
loadStatus();

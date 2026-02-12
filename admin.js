// System Administrator Panel JavaScript - Complete Version
// Version: 5.1.0 - Full Feature Set with New Enhancements

const API_URL = 'https://browserbricker.onrender.com';

// NEW FEATURES TRACKING
let selectedDevices = new Set();

let systemAdminKey = null;
let refreshInterval = null;
let locationRefreshInterval = null;
let currentGroupIdForAssignment = null;

// Map variables
let locationsMap = null;
let locationsMapInitialized = false;
let geofenceMap = null;
let geofenceMapInitialized = false;
let locationMarkers = [];
let geofenceCircles = [];
let isMapView = false;

// ========== FETCH WITH TIMEOUT ==========
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out - check server connection');
        }
        throw error;
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    systemAdminKey = localStorage.getItem('systemAdminKey');
    if (systemAdminKey) {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMain').style.display = 'flex';
        loadDashboard();
        
        // Auto-refresh every 5 seconds
        refreshInterval = setInterval(() => {
            loadDashboard();
            
            // Refresh locations if on locations view
            const locationsView = document.getElementById('locationsView');
            if (locationsView && locationsView.classList.contains('active')) {
                loadLocations();
            }
        }, 5000);
    }
}

// ========== AUTH FUNCTIONS ==========
function switchAuthTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const key = document.getElementById('loginKeyInput').value.trim();
    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');
    
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        const response = await fetch(`${API_URL}/api/system/stats`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        
        if (response.ok) {
            systemAdminKey = key;
            localStorage.setItem('systemAdminKey', key);
            checkAuth();
            showToast('Success', 'Logged in successfully', 'success');
        } else {
            showToast('Error', 'Invalid API key', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error', 'Login failed', 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const code = document.getElementById('regCode').value.trim();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    const btn = document.getElementById('registerBtn');
    const btnText = document.getElementById('registerBtnText');
    const spinner = document.getElementById('registerSpinner');
    
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    try {
        const response = await fetch(`${API_URL}/api/system/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registrationCode: code, name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // FIXED: Changed from data.systemAdminKey to data.apiKey to match backend response
            document.getElementById('newApiKey').textContent = data.apiKey;
            document.querySelector('#registerForm form').style.display = 'none';
            document.getElementById('regSuccess').style.display = 'block';
            showToast('Success', 'Registration successful!', 'success');
        } else {
            showToast('Error', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('Error', 'Registration failed', 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

function copyApiKey() {
    const key = document.getElementById('newApiKey').textContent;
    navigator.clipboard.writeText(key);
    showToast('Copied', 'API Key copied to clipboard', 'success');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('systemAdminKey');
        if (refreshInterval) clearInterval(refreshInterval);
        if (locationRefreshInterval) clearInterval(locationRefreshInterval);
        location.reload();
    }
}

// ========== DASHBOARD LOADING ==========
async function loadDashboard() {
    try {
        const statsRes = await fetch(`${API_URL}/api/system/stats`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (!statsRes.ok) {
            if (statsRes.status === 403 || statsRes.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to load stats');
        }
        
        const stats = await statsRes.json();
        
        // Update header - fix the structure
        if (stats.systemAdmin) {
            document.getElementById('groupNameDisplay').textContent = 
                `Group: ${stats.systemAdmin.groupName} | ${stats.systemAdmin.name}`;
        }
        
        // Update stats with proper null checks
        document.getElementById('statTotal').textContent = stats.devices?.total || 0;
        document.getElementById('statOnline').textContent = stats.devices?.online || 0;
        document.getElementById('statArmed').textContent = stats.devices?.armed || 0;
        document.getElementById('statUsers').textContent = stats.users?.total || 0;
        document.getElementById('statQuarantined').textContent = stats.devices?.quarantined || 0;
        document.getElementById('statGeofenced').textContent = stats.devices?.geofenced || 0;

        // Additional stats from server (update elements if they exist in HTML)
        const offlineEl = document.getElementById('statOffline');
        if (offlineEl) offlineEl.textContent = stats.devices?.offline || 0;
        const disarmedEl = document.getElementById('statDisarmed');
        if (disarmedEl) disarmedEl.textContent = stats.devices?.disarmed || 0;
        const revokedEl = document.getElementById('statRevoked');
        if (revokedEl) revokedEl.textContent = stats.users?.revoked || 0;
        
        // Load data for active view
        const activeView = document.querySelector('.view-container.active');
        if (activeView) {
            const viewId = activeView.id.replace('View', '');
            if (viewId === 'devices') await loadDevices();
            if (viewId === 'users') await loadUsers();
        }
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Error', 'Failed to load dashboard stats', 'error');
    }
}

// ========== DATA LOADING FUNCTIONS ==========
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/api/system/devices`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const devices = data.devices || [];
            const settings = { heartbeatTimeout: 60000 };
            const now = Date.now();
            
            // Calculate online devices
            devices.forEach(device => {
                device.online = device.lastHeartbeat && 
                               (now - device.lastHeartbeat) < settings.heartbeatTimeout;
            });
            
            renderDevices(devices);
        }
    } catch (error) {
        console.error('Load devices error:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/api/system/users`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderUsers(data.users);
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

// ========== MAP FUNCTIONS ==========
function initializeMap(containerId, centerLat = 40.7128, centerLon = -74.0060, zoom = 12) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
    }
    
    const map = L.map(containerId).setView([centerLat, centerLon], zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
    
    return map;
}

function toggleMapView() {
    isMapView = !isMapView;
    const mapView = document.getElementById('locationsMapView');
    const listView = document.getElementById('locationsListView');
    const toggleBtn = document.getElementById('mapViewToggleText');
    
    if (isMapView) {
        mapView.style.display = 'block';
        listView.style.display = 'none';
        toggleBtn.textContent = 'Show List';
        
        if (!locationsMapInitialized) {
            locationsMap = initializeMap('locationsMap', 40.7128, -74.0060, 4);
            locationsMapInitialized = true;
        }
        
        loadLocations();
    } else {
        mapView.style.display = 'none';
        listView.style.display = 'block';
        toggleBtn.textContent = 'Show Map';
    }
    
    lucide.createIcons();
}

async function loadGeofences() {
    try {
        const response = await fetch(`${API_URL}/api/system/geofences`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderGeofences(data.geofences);
        }
    } catch (error) {
        console.error('Load geofences error:', error);
    }
}

async function loadLocations() {
    try {
        const response = await fetch(`${API_URL}/api/system/locations`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderLocations(data.locations);
        }
    } catch (error) {
        console.error('Load locations error:', error);
    }
}

async function loadBreaches() {
    try {
        const response = await fetch(`${API_URL}/api/system/breaches`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderBreaches(data.breaches);
        }
    } catch (error) {
        console.error('Load breaches error:', error);
    }
}

async function loadActivity() {
    try {
        const response = await fetch(`${API_URL}/api/system/activity?limit=50`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderActivity(data.logs);
        }
    } catch (error) {
        console.error('Load activity error:', error);
    }
}

// ========== RENDERING FUNCTIONS ==========
function renderDevices(devices) {
    const container = document.getElementById('devicesTable');
    
    if (devices.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No devices yet</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">Devices will appear here once users register them</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Device</th>
                    <th>Status</th>
                    <th>State</th>
                    <th>Security</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    devices.forEach(device => {
        const onlineBadge = device.online ? 
            '<span class="badge badge-safe">ONLINE</span>' : 
            '<span class="badge" style="background: var(--zinc-200); color: var(--zinc-600);">OFFLINE</span>';
        const stateBadge = device.armed ? 
            '<span class="badge badge-armed">ARMED</span>' : 
            '<span class="badge badge-disarmed">DISARMED</span>';
        
        let securityBadges = '';
        if (device.quarantined) securityBadges += '<span class="badge badge-danger">QUARANTINED</span> ';
        if (device.geofenced) securityBadges += '<span class="badge badge-info">GEOFENCED</span> ';
        if (device.breachCount > 0) securityBadges += `<span class="badge badge-warn">${device.breachCount} BREACH${device.breachCount !== 1 ? 'ES' : ''}</span>`;
        if (!securityBadges) securityBadges = '<span class="badge badge-safe">SECURE</span>';
        
        const lastSeen = device.lastHeartbeat > 0 ? 
            timeSince(device.lastHeartbeat) : 'Never';

        const tagsBadges = device.tags && device.tags.length > 0
            ? '<div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap;">' +
              device.tags.map(t => `<span class="badge" style="background:var(--zinc-200);color:var(--zinc-700);font-size:0.65rem;">${escapeHtml(t)}</span>`).join('') +
              '</div>'
            : '';
        
        const armBtn = device.armed ? 
            `<button class="btn btn-success" style="padding: 8px 16px; font-size: 0.8rem;" onclick="disarmDevice('${device.deviceId}')"><i data-lucide="unlock" size="14"></i></button>` :
            `<button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.8rem;" onclick="armDevice('${device.deviceId}')"><i data-lucide="lock" size="14"></i></button>`;
        
        html += `
            <tr>
                <td>
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(device.deviceName)}</div>
                    <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-400);">${device.deviceId.substring(0, 12)}...</div>
                    ${tagsBadges}
                </td>
                <td>${onlineBadge}</td>
                <td>${stateBadge}</td>
                <td>${securityBadges}</td>
                <td style="font-family: var(--mono); font-size: 0.85rem;">${lastSeen}</td>
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${armBtn}
                        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.8rem;" onclick="openAssignDeviceModal('${device.deviceId}')" title="Add to Group"><i data-lucide="users" size="14"></i></button>
                        <button class="btn btn-ghost" style="padding: 8px 16px; font-size: 0.8rem;" onclick="editDevice('${device.deviceId}', '${escapeHtml(device.deviceName)}')"><i data-lucide="edit-2" size="14"></i></button>
                        <button class="${device.reconfigurationProtected !== false ? 'btn btn-primary' : 'btn btn-ghost'}" style="padding: 8px 16px; font-size: 0.8rem; ${device.reconfigurationProtected !== false ? '' : 'border:1px dashed #f59e0b;color:#f59e0b;'}" title="${device.reconfigurationProtected !== false ? 'Reconfig Protected (click to disable)' : 'Reconfig Unprotected (click to enable)'}" onclick="toggleReconfigProtection('${device.deviceId}', ${device.reconfigurationProtected !== false})"><i data-lucide="${device.reconfigurationProtected !== false ? 'shield-check' : 'shield-off'}" size="14"></i></button>
                        <button class="btn btn-ghost" style="padding: 8px 16px; font-size: 0.8rem; color: var(--status-danger);" onclick="deleteDevice('${device.deviceId}', '${escapeHtml(device.deviceName)}')"><i data-lucide="trash-2" size="14"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    lucide.createIcons();
}

function renderUsers(users) {
    const container = document.getElementById('usersTable');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No master keys yet</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem; margin-bottom: 20px;">Create master keys for users to register devices</p>
                <button class="btn btn-primary" onclick="createUser()">
                    <i data-lucide="plus" size="16"></i>
                    Create Master Key
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Key Hash</th>
                    <th>Devices</th>
                    <th>Uses</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Used</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const statusBadge = user.revoked ? 
            `<span class="badge badge-danger">REVOKED</span>${user.revokedAt ? `<div style="font-size:0.7rem;color:var(--zinc-400);margin-top:2px;">${timeSince(user.revokedAt)}</div>` : ''}` : 
            '<span class="badge badge-safe">ACTIVE</span>';
        
        //  Fix: Use createdAt instead of created
        const created = new Date(user.createdAt).toLocaleDateString();
        const lastUsed = user.lastUsed ? timeSince(user.lastUsed) : 'Never';
        
        //  Fix: Create display hash (first 16 chars)
        const displayHash = user.keyHash.substring(0, 16) + '...';
        
        html += `
            <tr>
                <td><code style="font-family: var(--mono); font-size: 0.8rem; background: var(--zinc-100); padding: 4px 8px; border-radius: 4px;">${displayHash}</code></td>
                <td>
                    <div style="font-weight: 600;">${user.deviceCount} devices</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${user.uses || 0} times</div>
                </td>
                <td>${statusBadge}</td>
                <td style="font-size: 0.85rem;">${created}</td>
                <td style="font-size: 0.85rem; font-family: var(--mono);">${lastUsed}</td>
                <td>
                    ${user.revoked ? '<span style="color: var(--zinc-400); font-size: 0.8rem;">—</span>' : `
                        <button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.8rem;" onclick="revokeUser('${user.keyHash}', '${displayHash}')">
                            <i data-lucide="x-circle" size="14"></i> Revoke
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    lucide.createIcons();
}

function renderGeofences(geofences) {
    const container = document.getElementById('geofencesList');
    
    if (geofences.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No geofences configured</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">Create geofences to restrict device locations</p>
            </div>
        `;
        
        if (geofenceMap && geofenceCircles.length > 0) {
            geofenceCircles.forEach(circle => circle.remove());
            geofenceCircles = [];
        }
        return;
    }
    
    if (!geofenceMapInitialized) {
        geofenceMap = initializeMap('geofenceMap', geofences[0].lat, geofences[0].lon, 10);
        geofenceMapInitialized = true;
        
        geofenceMap.on('click', function(e) {
            document.getElementById('geofenceLat').value = e.latlng.lat.toFixed(6);
            document.getElementById('geofenceLon').value = e.latlng.lng.toFixed(6);
            
            L.circle([e.latlng.lat, e.latlng.lng], {
                radius: parseInt(document.getElementById('geofenceRadius').value) || 1000,
                color: '#8b5cf6',
                fillColor: '#a78bfa',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5'
            }).addTo(geofenceMap).bindPopup('New geofence location (preview)').openPopup();
        });
    }
    
    geofenceCircles.forEach(circle => circle.remove());
    geofenceCircles = [];
    
    let html = '';
    const bounds = [];
    
    geofences.forEach(geo => {
        const statusBadge = geo.enabled ? 
            '<span class="badge badge-safe">ACTIVE</span>' : 
            '<span class="badge badge-warn">DISABLED</span>';
        
        html += `
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid var(--status-info);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(geo.deviceName)}</div>
                        <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${geo.deviceId}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="coordinates-display">
                     Center: ${geo.lat.toFixed(6)}, ${geo.lon.toFixed(6)}<br>
                     Radius: ${geo.radius} meters
                </div>
                ${geo.createdBy ? `<div style="font-size:0.75rem;color:var(--zinc-500);margin-top:6px;">Created by: ${escapeHtml(geo.createdBy)}${geo.createdAt ? ' · ' + timeSince(geo.createdAt) : ''}</div>` : ''}
                <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem; width: 100%; margin-top: 12px;" onclick="removeGeofence('${geo.deviceId}')">
                    <i data-lucide="trash-2" size="12"></i> Remove Geofence
                </button>
            </div>
        `;
        
        const circleColor = geo.enabled ? '#10b981' : '#f59e0b';
        const circle = L.circle([geo.lat, geo.lon], {
            radius: geo.radius,
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.15,
            weight: 3
        }).addTo(geofenceMap);
        
        const marker = L.marker([geo.lat, geo.lon], {
            icon: L.divIcon({
                className: 'geofence-marker',
                html: `<div style="background: ${circleColor}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(geofenceMap);
        
        const popupContent = `
            <div style="min-width: 180px;">
                <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(geo.deviceName)}</div>
                <div style="font-family: monospace; font-size: 0.7rem; color: #71717a; margin-bottom: 6px;">${geo.deviceId}</div>
                <div style="font-size: 0.8rem; margin-bottom: 4px;"><strong>Radius:</strong> ${geo.radius}m</div>
                <div style="font-size: 0.8rem;"><strong>Status:</strong> ${geo.enabled ? '<span style="color: #10b981;"> Active</span>' : '<span style="color: #f59e0b;"> Disabled</span>'}</div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        circle.bindPopup(popupContent);
        
        geofenceCircles.push(circle);
        geofenceCircles.push(marker);
        bounds.push([geo.lat, geo.lon]);
    });
    
    container.innerHTML = html;
    
    if (bounds.length > 0 && geofenceMap) {
        geofenceMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
    
    lucide.createIcons();
    
    lucide.createIcons();
}

function renderLocations(locations) {
    const container = document.getElementById('locationsList');
    
    if (locations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No location data available</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">Location data will appear when devices report their positions</p>
            </div>
        `;
        
        if (locationsMap && locationMarkers.length > 0) {
            locationMarkers.forEach(marker => marker.remove());
            locationMarkers = [];
        }
        return;
    }
    
    let html = '';
    locations.forEach(loc => {
        const locTimestamp = loc.location.timestamp || 0;
        const timeDiff = Date.now() - new Date(locTimestamp).getTime();
        const isRecent = timeDiff < 30000;
        
        html += `
            <div class="location-item">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(loc.deviceName)}</div>
                        <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${loc.deviceId}</div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                        ${isRecent ? '<span class="badge badge-safe"><i data-lucide="radio" size="10"></i> LIVE</span>' : ''}
                        ${loc.armed ? '<span class="badge badge-armed"><i data-lucide="lock" size="10"></i> Armed</span>' : ''}
                        ${loc.quarantined ? '<span class="badge badge-danger"><i data-lucide="shield-alert" size="10"></i> Quarantine</span>' : ''}
                        ${loc.geofenced ? '<span class="badge badge-info"><i data-lucide="map-pin" size="10"></i> GEOFENCED</span>' : ''}
                    </div>
                </div>
                <div class="coordinates-display">
                     ${loc.location.lat.toFixed(6)}, ${loc.location.lon.toFixed(6)}
                </div>
                <div style="font-size: 0.75rem; color: var(--zinc-400); margin-top: 8px;">
                    Last updated: ${timeSince(locTimestamp)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    if (locationsMap && isMapView) {
        locationMarkers.forEach(marker => marker.remove());
        locationMarkers = [];
        
        const bounds = [];
        locations.forEach(loc => {
            const timeDiff = Date.now() - new Date(loc.timestamp).getTime();
            const isRecent = timeDiff < 30000;
            const markerColor = isRecent ? '#10b981' : '#06b6d4';
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: ${markerColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 24],
                popupAnchor: [0, -24]
            });
            
            const marker = L.marker([loc.location.lat, loc.location.lon], { icon: customIcon }).addTo(locationsMap);
            
            const popupContent = `
                <div style="min-width: 200px;">
                    <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.95rem;">${escapeHtml(loc.deviceName)}</div>
                    <div style="font-family: monospace; font-size: 0.75rem; color: #71717a; margin-bottom: 8px;">${loc.deviceId}</div>
                    <div style="background: #f4f4f5; padding: 8px; border-radius: 6px; margin-bottom: 8px; font-size: 0.8rem;">
                        <strong> Coordinates:</strong><br>
                        ${loc.location.lat.toFixed(6)}, ${loc.location.lon.toFixed(6)}
                    </div>
                    <div style="font-size: 0.75rem; color: #71717a; margin-bottom: 6px;">
                        <strong>Status:</strong> ${isRecent ? '<span style="color: #10b981;"> LIVE</span>' : '<span style="color: #06b6d4;"> Recent</span>'}
                    </div>
                    ${loc.geofenced ? '<div style="font-size: 0.75rem; color: #06b6d4;"> Geofenced</div>' : ''}
                    <div style="font-size: 0.7rem; color: #a1a1aa; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e4e4e7;">
                        Last updated: ${timeSince(loc.timestamp)}
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            locationMarkers.push(marker);
            bounds.push([loc.location.lat, loc.location.lon]);
        });
        
        if (bounds.length > 0) {
            locationsMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }
    
    lucide.createIcons();
}

function renderBreaches(breaches) {
    const container = document.getElementById('breachesList');
    
    if (breaches.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No security breaches detected</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">All devices are secure</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    breaches.forEach(breach => {
        const severityColor = breach.severity === 'high' || breach.severity === 'critical'
            ? 'var(--status-danger)' : 'var(--status-warn)';
        html += `
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid ${severityColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(breach.deviceName)}</div>
                        <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${breach.deviceId}</div>
                    </div>
                    <span class="badge badge-${breach.severity === 'high' || breach.severity === 'critical' ? 'danger' : 'warn'}">${(breach.severity || 'unknown').toUpperCase()}</span>
                </div>
                <div style="background: white; padding: 10px; border-radius: 8px; border: var(--border); font-size: 0.85rem;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${breach.type ? breach.type.replace(/_/g, ' ').toUpperCase() : 'SECURITY EVENT'}</div>
                    ${breach.details ? `<div style="color: var(--zinc-600); margin-bottom: 4px;">${escapeHtml(breach.details)}</div>` : ''}
                    <div style="font-size: 0.75rem; color: var(--zinc-400);">${new Date(breach.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderActivity(logs) {
    const container = document.getElementById('activityList');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No activity logged</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">Activity will appear here as actions are performed</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="position: relative; padding-left: 30px;">';
    
    logs.forEach((log, index) => {
        const isLast = index === logs.length - 1;
        
        html += `
            <div style="position: relative; padding-bottom: 30px;">
                <div style="position: absolute; left: -22px; top: 8px; width: 8px; height: 8px; background: var(--zinc-300); border-radius: 50%;"></div>
                ${!isLast ? '<div style="position: absolute; left: -18.5px; top: 16px; width: 1px; height: calc(100% - 8px); background: var(--zinc-200);"></div>' : ''}
                <div style="font-size: 0.75rem; color: var(--zinc-400); margin-bottom: 4px;">${new Date(log.timestamp).toLocaleString()}</div>
                <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(log.description)}</div>
                <div style="font-size: 0.85rem; color: var(--zinc-500);">
                    Type: <span class="badge badge-info">${log.type}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ========== VIEW SWITCHING ==========
function switchView(viewName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Update views
    document.querySelectorAll('.view-container').forEach(view => view.classList.remove('active'));
    
    const viewMap = {
        'overview': 'overviewView',
        'devices': 'devicesView',
        'users': 'usersView',
        'geofencing': 'geofencingView',
        'locations': 'locationsView',
        'breaches': 'breachesView',
        'bulk-ops': 'bulkOpsView',
        'activity': 'activityView',
        'groups': 'groupsView',
        'policies': 'policiesView',
        'profile': 'profileView'
    };
    
    const targetView = document.getElementById(viewMap[viewName]);
    if (targetView) {
        targetView.classList.add('active');
        
        // Update page title
        const titles = {
            'overview': 'Overview',
            'devices': 'Devices',
            'users': 'Master Keys',
            'geofencing': 'Geofencing',
            'locations': 'Live Locations',
            'breaches': 'Security Breaches',
            'bulk-ops': 'Bulk Operations',
            'activity': 'Activity Log',
            'groups': 'Groups',
            'policies': 'Policies',
            'profile': 'Profile & Notifications'
        };
        document.getElementById('pageTitle').textContent = titles[viewName];
        
        // Load data for specific views
        if (viewName === 'devices') loadDevices();
        else if (viewName === 'users') loadUsers();
        else if (viewName === 'groups') loadGroups();
        else if (viewName === 'policies') loadPolicies();
        else if (viewName === 'profile') loadProfile();
        else if (viewName === 'geofencing') {
            loadGeofences();
            setTimeout(() => {
                if (geofenceMap) {
                    geofenceMap.invalidateSize();
                }
            }, 100);
        }
        else if (viewName === 'locations') {
            loadLocations();
            setTimeout(() => {
                if (locationsMap && isMapView) {
                    locationsMap.invalidateSize();
                }
            }, 100);
        }
        else if (viewName === 'breaches') loadBreaches();
        else if (viewName === 'activity') loadActivity();
    }
}

// ========== DEVICE OPERATIONS ==========
async function armDevice(deviceId) {
    const reason = prompt('Enter reason for arming (optional):') || 'Admin action';
    
    try {
        const response = await fetch(`${API_URL}/api/system/device/arm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId, reason })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'Device armed successfully', 'success');
            loadDevices();
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to arm device', 'error');
        }
    } catch (error) {
        console.error('Arm device error:', error);
        showToast('Error', 'Failed to arm device', 'error');
    }
}

async function disarmDevice(deviceId) {
    const reason = prompt('Enter reason for disarming (optional):') || 'Admin release';
    
    try {
        const response = await fetch(`${API_URL}/api/system/device/disarm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId, reason })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'Device disarmed successfully', 'success');
            loadDevices();
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to disarm device', 'error');
        }
    } catch (error) {
        console.error('Disarm device error:', error);
        showToast('Error', 'Failed to disarm device', 'error');
    }
}

function editDevice(deviceId, currentName) {
    document.getElementById('editDeviceId').value = deviceId;
    document.getElementById('editDeviceName').value = currentName;
    document.getElementById('editDeviceModal').classList.add('active');
}

async function saveDeviceEdit(event) {
    event.preventDefault();
    
    const deviceId = document.getElementById('editDeviceId').value;
    const deviceName = document.getElementById('editDeviceName').value.trim();
    
    try {
        const response = await fetch(`${API_URL}/api/system/device/update`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId, deviceName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('editDeviceModal');
            showToast('Success', 'Device updated successfully', 'success');
            loadDevices();
        } else {
            showToast('Error', data.error || 'Failed to update device', 'error');
        }
    } catch (error) {
        console.error('Update device error:', error);
        showToast('Error', 'Failed to update device', 'error');
    }
}

async function deleteDevice(deviceId, deviceName) {
    if (!confirm(` Are you sure you want to delete "${deviceName}"?\n\nThis action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/device/delete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'Device deleted successfully', 'success');
            loadDevices();
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to delete device', 'error');
        }
    } catch (error) {
        console.error('Delete device error:', error);
        showToast('Error', 'Failed to delete device', 'error');
    }
}

// ========== RECONFIGURATION PROTECTION ==========
async function toggleReconfigProtection(deviceId, currentlyProtected) {
    const action = currentlyProtected ? 'disable' : 'enable';
    const msg = currentlyProtected
        ? 'Disable reconfiguration protection? The extension on this device will be allowed to reset or reconfigure.'
        : 'Enable reconfiguration protection? Any extension reset or reconfiguration attempt will be blocked and an email notification will be sent.';
    if (!confirm(msg)) return;
    try {
        const response = await fetch(`${API_URL}/api/system/device/${deviceId}/reconfig-protection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled: !currentlyProtected })
        });
        const data = await response.json();
        if (response.ok) {
            showToast('Success', `Reconfiguration protection ${!currentlyProtected ? 'enabled' : 'disabled'}`, 'success');
            loadDevices();
        } else {
            showToast('Error', data.error || 'Failed to update protection', 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to update reconfiguration protection', 'error');
    }
}

// ========== BULK OPERATIONS ==========
async function armAll() {
    const reason = prompt('Enter reason for arming all devices (optional):') || 'Group lockdown';
    
    if (!confirm(' Are you sure you want to ARM ALL devices in your group?\n\nThis will lock all devices immediately.')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/devices/arm-all`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', `${data.armed} devices armed successfully`, 'success');
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to arm devices', 'error');
        }
    } catch (error) {
        console.error('Arm all error:', error);
        showToast('Error', 'Failed to arm devices', 'error');
    }
}

async function disarmAll() {
    const reason = prompt('Enter reason for disarming all devices (optional):') || 'Group release';
    
    if (!confirm(' Are you sure you want to DISARM ALL devices in your group?\n\nThis will unlock all devices immediately.')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/devices/disarm-all`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', `${data.disarmed} devices disarmed successfully`, 'success');
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to disarm devices', 'error');
        }
    } catch (error) {
        console.error('Disarm all error:', error);
        showToast('Error', 'Failed to disarm devices', 'error');
    }
}

// ========== USER MANAGEMENT ==========
async function createUser() {
    if (!confirm('Create a new master key for a user?\n\nThis will allow them to register and manage devices under your group.')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/users/create`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('newUserKey').textContent = data.masterKey;
            document.getElementById('userKeyModal').classList.add('active');
            showToast('Success', 'Master key created successfully', 'success');
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('Create user error:', error);
        showToast('Error', 'Failed to create user', 'error');
    }
}

function copyUserKey() {
    const key = document.getElementById('newUserKey').textContent;
    navigator.clipboard.writeText(key);
    showToast('Copied', 'Master key copied to clipboard', 'success');
}

async function revokeUser(keyHash, displayHash) {
    console.log(' Revoking user:', { keyHash, displayHash }); // Debug log
    
    if (!confirm(` Are you sure you want to revoke this user (${displayHash})?\n\nThey will no longer be able to access their devices.`)) return;
    
    //  Validate keyHash before sending
    if (!keyHash || keyHash === 'undefined') {
        showToast('Error', 'Invalid key hash', 'error');
        console.error('Invalid keyHash:', keyHash);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/system/users/revoke`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keyHash })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'User revoked successfully', 'success');
            loadUsers();
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to revoke user', 'error');
        }
    } catch (error) {
        console.error('Revoke user error:', error);
        showToast('Error', 'Failed to revoke user', 'error');
    }
}

// ========== GEOFENCING ==========
async function createGeofence(event) {
    event.preventDefault();
    
    const deviceId = document.getElementById('geofenceDeviceId').value.trim();
    const lat = parseFloat(document.getElementById('geofenceLat').value);
    const lon = parseFloat(document.getElementById('geofenceLon').value);
    const radius = parseInt(document.getElementById('geofenceRadius').value);
    
    try {
        const response = await fetch(`${API_URL}/api/system/geofence`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId, lat, lon, radius })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'Geofence created successfully', 'success');
            document.getElementById('createGeofenceForm').reset();
            loadGeofences();
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to create geofence', 'error');
        }
    } catch (error) {
        console.error('Create geofence error:', error);
        showToast('Error', 'Failed to create geofence', 'error');
    }
}

async function removeGeofence(deviceId) {
    if (!confirm('Remove geofence for this device?\n\nThe device will no longer be restricted by location.')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/geofence`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Success', 'Geofence removed successfully', 'success');
            loadGeofences();
            loadDashboard();
        } else {
            showToast('Error', data.error || 'Failed to remove geofence', 'error');
        }
    } catch (error) {
        console.error('Remove geofence error:', error);
        showToast('Error', 'Failed to remove geofence', 'error');
    }
}

// ========== UTILITY FUNCTIONS ==========
function refreshData() {
    loadDashboard();
    const activeView = document.querySelector('.view-container.active');
    if (activeView) {
        const viewId = activeView.id.replace('View', '');
        if (viewId === 'devices') loadDevices();
        else if (viewId === 'users') loadUsers();
        else if (viewId === 'geofencing') loadGeofences();
        else if (viewId === 'locations') loadLocations();
        else if (viewId === 'breaches') loadBreaches();
        else if (viewId === 'activity') loadActivity();
    }
    showToast('Refreshed', 'Data updated successfully', 'success');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function timeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 10) return 'just now';
    if (seconds < 60) return seconds + 's ago';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    return days + 'd ago';
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.4s reverse';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}// ============================
// GROUPS MANAGEMENT JAVASCRIPT
// Add these functions to owner-script.js and admin.js
// ============================

let currentGroups = [];

// ========== LOAD GROUPS ==========
async function loadGroups() {
    try {
        const response = await fetch(`${API_URL}/api/groups`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch groups');
        
        const data = await response.json();
        currentGroups = data.groups || [];
        
        displayGroups(currentGroups);
        updateGroupStats(currentGroups);
    } catch (error) {
        console.error('Load groups error:', error);
        showToast('Error', 'Failed to load groups', 'error');
    }
}

// ========== DISPLAY GROUPS ==========
function displayGroups(groups) {
    const tbody = document.getElementById('groupsTableBody');
    
    if (!groups || groups.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users" style="font-size: 48px; opacity: 0.3; margin-bottom: 10px;"></i>
                    <p>No groups found. Create your first group to get started.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = groups.map(group => `
        <tr>
            <td>
                <strong>${escapeHtml(group.groupName)}</strong>
                ${!group.active ? '<span class="badge badge-danger">Inactive</span>' : ''}
            </td>
            <td>${escapeHtml(group.description || 'No description')}</td>
            <td>${group.policyId ? `<span class="badge badge-info">${escapeHtml(group.policyId)}</span>` : '<span style="color: #999;">No policy</span>'}</td>
            <td>${group.stats?.totalDevices || 0}</td>
            <td>${group.stats?.activeDevices || 0}</td>
            <td>
                <span class="badge ${group.stats?.totalBreaches > 0 ? 'badge-danger' : 'badge-success'}">
                    ${group.stats?.totalBreaches || 0}
                </span>
            </td>
            <td>${new Date(group.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-icon" onclick="viewGroupDetails('${group.groupId}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editGroup('${group.groupId}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${isOwner() ? `
                <button class="btn-icon btn-danger" onclick="confirmDeleteGroup('${group.groupId}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// ========== UPDATE GROUP STATS ==========
function updateGroupStats(groups) {
    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.active).length;
    const totalDevices = groups.reduce((sum, g) => sum + (g.stats?.totalDevices || 0), 0);
    const totalBreaches = groups.reduce((sum, g) => sum + (g.stats?.totalBreaches || 0), 0);
    
    document.getElementById('totalGroupsCount').textContent = totalGroups;
    document.getElementById('activeGroupsCount').textContent = activeGroups;
    document.getElementById('groupTotalDevices').textContent = totalDevices;
    document.getElementById('groupTotalBreaches').textContent = totalBreaches;
}

// ========== CREATE GROUP ==========
function showCreateGroupModal() {
    document.getElementById('createGroupModal').style.display = 'flex';
    document.getElementById('createGroupForm').reset();
}

function closeCreateGroupModal() {
    document.getElementById('createGroupModal').style.display = 'none';
}

async function handleCreateGroup(event) {
    event.preventDefault();
    
    const groupData = {
        groupName: document.getElementById('groupName').value,
        description: document.getElementById('groupDescription').value,
        policyId: document.getElementById('groupPolicySelect')?.value || null,
        settings: {
            maxDevices: parseInt(document.getElementById('maxDevices').value),
            allowGeofencing: document.getElementById('allowGeofencing').checked,
            allowQuarantine: document.getElementById('allowQuarantine').checked,
            defaultArmState: document.getElementById('defaultArmState').checked
        }
    };
    
    try {
        const response = await fetch(`${API_URL}/api/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getApiKey()}`
            },
            body: JSON.stringify(groupData)
        });
        
        if (!response.ok) throw new Error('Failed to create group');
        
        const result = await response.json();
        showToast('Success', 'Group created successfully', 'success');
        closeCreateGroupModal();
        loadGroups();
    } catch (error) {
        console.error('Create group error:', error);
        showToast('Error', 'Failed to create group', 'error');
    }
}

// ========== EDIT GROUP ==========
function editGroup(groupId) {
    const group = currentGroups.find(g => g.groupId === groupId);
    if (!group) return;
    
    document.getElementById('editGroupId').value = groupId;
    document.getElementById('editGroupName').value = group.groupName;
    document.getElementById('editGroupDescription').value = group.description || '';
    document.getElementById('editGroupPolicySelect').value = group.policyId || '';
    document.getElementById('editMaxDevices').value = group.settings?.maxDevices || 100;
    document.getElementById('editAllowGeofencing').checked = group.settings?.allowGeofencing !== false;
    document.getElementById('editAllowQuarantine').checked = group.settings?.allowQuarantine !== false;
    document.getElementById('editDefaultArmState').checked = group.settings?.defaultArmState || false;
    
    document.getElementById('editGroupModal').style.display = 'flex';
}

function closeEditGroupModal() {
    document.getElementById('editGroupModal').style.display = 'none';
}

async function handleEditGroup(event) {
    event.preventDefault();
    
    const groupId = document.getElementById('editGroupId').value;
    const updates = {
        groupName: document.getElementById('editGroupName').value,
        description: document.getElementById('editGroupDescription').value,
        policyId: document.getElementById('editGroupPolicySelect')?.value || null,
        settings: {
            maxDevices: parseInt(document.getElementById('editMaxDevices').value),
            allowGeofencing: document.getElementById('editAllowGeofencing').checked,
            allowQuarantine: document.getElementById('editAllowQuarantine').checked,
            defaultArmState: document.getElementById('editDefaultArmState').checked
        }
    };
    
    try {
        const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getApiKey()}`
            },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update group');
        
        showToast('Success', 'Group updated successfully', 'success');
        closeEditGroupModal();
        loadGroups();
    } catch (error) {
        console.error('Update group error:', error);
        showToast('Error', 'Failed to update group', 'error');
    }
}

// ========== DELETE GROUP ==========
function confirmDeleteGroup(groupId) {
    const group = currentGroups.find(g => g.groupId === groupId);
    if (!group) return;
    
    if (confirm(`Are you sure you want to delete the group "${group.groupName}"?\n\nThis action cannot be undone.`)) {
        deleteGroup(groupId);
    }
}

async function deleteGroup(groupId) {
    try {
        const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete group');
        
        showToast('Success', 'Group deleted successfully', 'success');
        loadGroups();
    } catch (error) {
        console.error('Delete group error:', error);
        showToast('Error', 'Failed to delete group', 'error');
    }
}

// ========== VIEW GROUP DETAILS ==========
async function viewGroupDetails(groupId) {
    const group = currentGroups.find(g => g.groupId === groupId);
    if (!group) return;
    
    try {
        // Fetch group with devices
        const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        const data = await response.json();
        const devices = data.devices || [];
        
        const devicesHtml = devices.length > 0 ? `
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Device Name</th>
                        <th>Status</th>
                        <th>Last Seen</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${devices.map(d => `
                        <tr>
                            <td>${escapeHtml(d.deviceName)}</td>
                            <td>
                                <span class="badge ${d.armed ? 'badge-danger' : 'badge-success'}">
                                    ${d.armed ? 'Armed' : 'Disarmed'}
                                </span>
                            </td>
                            <td>${d.lastHeartbeat ? new Date(d.lastHeartbeat).toLocaleString() : 'Never'}</td>
                            <td>
                                <button class="btn-sm btn-danger" onclick="removeDeviceFromGroup('${groupId}', '${d.deviceId}')">
                                    Remove
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : `
            <div style="text-align: center; padding: 40px; background: var(--zinc-50); border-radius: 8px; border: 2px dashed var(--zinc-300);">
                <i data-lucide="inbox" size="48" style="color: var(--zinc-400); margin-bottom: 10px;"></i>
                <p style="color: var(--zinc-600); font-weight: 600; margin-bottom: 8px;">No devices in this group yet</p>
                <p style="color: var(--zinc-500); font-size: 0.9rem; margin-bottom: 15px;">Click the "Assign Device" button above to add unassigned devices to this group.</p>
            </div>
        `;
        
        const content = `
            <div class="group-details">
                <div class="detail-section">
                    <h4>Basic Information</h4>
                    <table class="details-table">
                        <tr>
                            <td><strong>Group ID:</strong></td>
                            <td>${escapeHtml(group.groupId)}</td>
                        </tr>
                        <tr>
                            <td><strong>Name:</strong></td>
                            <td>${escapeHtml(group.groupName)}</td>
                        </tr>
                        <tr>
                            <td><strong>Description:</strong></td>
                            <td>${escapeHtml(group.description || 'No description')}</td>
                        </tr>
                        <tr>
                            <td><strong>Policy:</strong></td>
                            <td>${group.policyId ? escapeHtml(group.policyId) : 'No policy assigned'}</td>
                        </tr>
                        <tr>
                            <td><strong>Created:</strong></td>
                            <td>${new Date(group.createdAt).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td><strong>Status:</strong></td>
                            <td><span class="badge ${group.active ? 'badge-success' : 'badge-danger'}">
                                ${group.active ? 'Active' : 'Inactive'}
                            </span></td>
                        </tr>
                    </table>
                </div>
                
                <div class="detail-section">
                    <h4>Statistics</h4>
                    <div class="group-stats">
                        <div class="group-stat">
                            <div class="group-stat-value">${group.stats?.totalDevices || devices.length}</div>
                            <div class="group-stat-label">Total Devices</div>
                        </div>
                        <div class="group-stat">
                            <div class="group-stat-value">${group.stats?.activeDevices || 0}</div>
                            <div class="group-stat-label">Active Devices</div>
                        </div>
                        <div class="group-stat">
                            <div class="group-stat-value">${group.stats?.totalBreaches || 0}</div>
                            <div class="group-stat-label">Total Breaches</div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4>Devices in Group</h4>
                        <button class="btn-primary" onclick="showAssignDeviceModal('${groupId}')">
                            <i data-lucide="plus"></i> Assign Device
                        </button>
                    </div>
                    ${devicesHtml}
                </div>
                
                <div class="detail-section">
                    <h4>Settings</h4>
                    <table class="details-table">
                        <tr>
                            <td><strong>Max Devices:</strong></td>
                            <td>${group.settings?.maxDevices || 100}</td>
                        </tr>
                        <tr>
                            <td><strong>Geofencing:</strong></td>
                            <td>${group.settings?.allowGeofencing !== false ? ' Enabled' : ' Disabled'}</td>
                        </tr>
                        <tr>
                            <td><strong>Quarantine:</strong></td>
                            <td>${group.settings?.allowQuarantine !== false ? ' Enabled' : ' Disabled'}</td>
                        </tr>
                        <tr>
                            <td><strong>Default Arm State:</strong></td>
                            <td>${group.settings?.defaultArmState ? ' Armed' : ' Disarmed'}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('groupDetailsContent').innerHTML = content;
        document.getElementById('groupDetailsModal').style.display = 'flex';
        lucide.createIcons();
    } catch (error) {
        console.error('Load group details error:', error);
        showToast('Error', 'Failed to load group details', 'error');
    }
}

function closeGroupDetailsModal() {
    document.getElementById('groupDetailsModal').style.display = 'none';
}

// ========== DEVICE ASSIGNMENT TO GROUPS ==========

async function showAssignDeviceModal(groupId) {
    currentGroupIdForAssignment = groupId;
    
    try {
        // Fetch unassigned devices
        const response = await fetch(`${API_URL}/api/devices/unassigned`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch unassigned devices');
        
        const data = await response.json();
        const devices = data.devices || [];
        
        const devicesList = document.getElementById('unassignedDevicesList');
        
        if (devices.length === 0) {
            devicesList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i data-lucide="inbox" size="48" style="color: #ccc; margin-bottom: 10px;"></i>
                    <p style="color: #666; margin-bottom: 10px;">No unassigned devices available</p>
                    <p style="color: #999; font-size: 0.85rem;">All devices are already assigned to groups.</p>
                </div>
            `;
        } else {
            devicesList.innerHTML = `
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                    <strong style="color: #0369a1;"> How to assign devices:</strong>
                    <p style="color: #075985; font-size: 0.85rem; margin: 5px 0 0 0;">
                        Click "Assign" next to any device below to add it to this group. Devices can only belong to one group at a time.
                    </p>
                </div>
                ${devices.map(d => `
                <div class="device-item" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; background: white;">
                    <div style="flex: 1;">
                        <strong style="color: #111827;">${escapeHtml(d.deviceName)}</strong>
                        <br>
                        <small style="color: #6b7280; font-family: monospace;">${d.deviceId}</small>
                        ${d.online ? '<span style="margin-left: 10px; color: #10b981;"> Online</span>' : '<span style="margin-left: 10px; color: #6b7280;"> Offline</span>'}
                    </div>
                    <button class="btn-primary" onclick="assignDeviceToGroupNow('${groupId}', '${d.deviceId}')" style="white-space: nowrap;">
                        <i data-lucide="plus-circle" size="14"></i> Assign
                    </button>
                </div>
            `).join('')}
            `;
            // Re-initialize lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        document.getElementById('assignDeviceModal').style.display = 'flex';
    } catch (error) {
        console.error('Load unassigned devices error:', error);
        showToast('Error', 'Failed to load unassigned devices. ' + error.message, 'error');
    }
}

function closeAssignDeviceModal() {
    document.getElementById('assignDeviceModal').style.display = 'none';
}

// New function to show group selection modal for a specific device
async function openAssignDeviceModal(deviceId) {
    try {
        // Fetch all groups
        const response = await fetch(`${API_URL}/api/groups`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch groups');
        
        const data = await response.json();
        const groups = data.groups || [];
        
        const groupsList = document.getElementById('unassignedDevicesList');
        
        if (groups.length === 0) {
            groupsList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i data-lucide="inbox" size="48" style="color: #ccc; margin-bottom: 10px;"></i>
                    <p style="color: #666; margin-bottom: 10px;">No groups available</p>
                    <p style="color: #999; font-size: 0.85rem;">Please create a group first.</p>
                </div>
            `;
        } else {
            groupsList.innerHTML = `
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                    <strong style="color: #0369a1;"> Select a group:</strong>
                    <p style="color: #075985; font-size: 0.85rem; margin: 5px 0 0 0;">
                        Choose which group this device should be added to. Devices can only belong to one group at a time.
                    </p>
                </div>
                ${groups.map(g => `
                <div class="device-item" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; background: white;">
                    <div style="flex: 1;">
                        <strong style="color: #111827;">${escapeHtml(g.groupName)}</strong>
                        <br>
                        <small style="color: #6b7280;">${g.description || 'No description'}</small>
                    </div>
                    <button class="btn-primary" onclick="assignDeviceToGroupNow('${g.groupId}', '${deviceId}')" style="white-space: nowrap;">
                        <i data-lucide="plus-circle" size="14"></i> Add to Group
                    </button>
                </div>
            `).join('')}
            `;
            // Re-initialize lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        document.getElementById('assignDeviceModal').style.display = 'flex';
    } catch (error) {
        console.error('Load groups error:', error);
        showToast('Error', 'Failed to load groups. ' + error.message, 'error');
    }
}


async function assignDeviceToGroupNow(groupId, deviceId) {
    try {
        const response = await fetch(`${API_URL}/api/groups/${groupId}/devices/${deviceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getApiKey()}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign device');
        }
        
        showToast('Success', 'Device assigned to group', 'success');
        closeAssignDeviceModal();
        
        // Refresh group details
        viewGroupDetails(groupId);
        loadGroups();
    } catch (error) {
        console.error('Assign device error:', error);
        showToast('Error', error.message || 'Failed to assign device', 'error');
    }
}

async function removeDeviceFromGroup(groupId, deviceId) {
    if (!confirm('Remove this device from the group? The device will become unassigned.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/groups/${groupId}/devices/${deviceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getApiKey()}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove device');
        }
        
        showToast('Success', 'Device removed from group', 'success');
        
        // Refresh group details
        viewGroupDetails(groupId);
        loadGroups();
    } catch (error) {
        console.error('Remove device error:', error);
        showToast('Error', error.message || 'Failed to remove device', 'error');
    }
}

// ========== HELPER FUNCTIONS ==========
function getApiKey() {
    // For admin panel (this is the primary use case)
    if (typeof systemAdminKey !== 'undefined' && systemAdminKey !== null) return systemAdminKey;
    // Fallback to localStorage
    return localStorage.getItem('systemAdminKey');
}

function isOwner() {
    // Admin panel users are never owners
    return false;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== INITIALIZE ON TAB SWITCH ==========
// Modify existing switchTab function to load groups when tab is activated
const originalSwitchTab = window.switchTab;
window.switchTab = function(tabName) {
    if (originalSwitchTab) originalSwitchTab(tabName);
    
    if (tabName === 'groups') {
        loadGroups();
    }
};

// ============================
// POLICIES MANAGEMENT JAVASCRIPT
// ============================

let currentPolicies = [];
let currentViolations = [];

// ========== LOAD POLICIES ==========
async function loadPolicies() {
    try {
        const response = await fetch(`${API_URL}/api/policies`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch policies');
        
        const data = await response.json();
        currentPolicies = data.policies || [];
        
        displayPolicies(currentPolicies);
        updatePolicyStats(currentPolicies);
    } catch (error) {
        console.error('Load policies error:', error);
        showToast('Error', 'Failed to load policies', 'error');
    }
}

// ========== DISPLAY POLICIES ==========
function displayPolicies(policies) {
    const tbody = document.getElementById('policiesTableBody');
    
    if (!policies || policies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-shield-alt" style="font-size: 48px; opacity: 0.3; margin-bottom: 10px;"></i>
                    <p>No policies found. Create your first policy to get started.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = policies.map(policy => {
        const features = [];
        if (policy.rules.timeLimits?.enabled) features.push('Time Limits');
        if (policy.rules.allowedHours?.enabled) features.push('Allowed Hours');
        if (policy.rules.autoArm) features.push('Auto-Arm');
        if (policy.rules.enforceGeofence) features.push('Geofence');
        if (policy.rules.inactivityTimeout?.enabled) features.push('Inactivity');
        
        return `
            <tr>
                <td>
                    <strong>${escapeHtml(policy.policyName)}</strong>
                    ${!policy.active ? '<span class="badge badge-danger">Inactive</span>' : ''}
                </td>
                <td>
                    <span class="badge badge-info">
                        ${policy.scope.type}
                        ${policy.scope.targetIds?.length > 0 ? ` (${policy.scope.targetIds.length})` : ''}
                    </span>
                </td>
                <td>
                    <span class="priority-badge priority-${getPriorityClass(policy.priority)}">
                        ${policy.priority}
                    </span>
                </td>
                <td>
                    ${features.length > 0 
                        ? features.map(f => `<span class="feature-tag">${f}</span>`).join(' ')
                        : '<span style="color: #999;">None</span>'
                    }
                </td>
                <td>
                    <span class="badge ${policy.active ? 'badge-success' : 'badge-danger'}">
                        ${policy.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(policy.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon" onclick="viewPolicyDetails('${policy.policyId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="editPolicy('${policy.policyId}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="togglePolicyStatus('${policy.policyId}')" title="${policy.active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${policy.active ? 'pause' : 'play'}-circle"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="confirmDeletePolicy('${policy.policyId}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== UPDATE POLICY STATS ==========
function updatePolicyStats(policies) {
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.active).length;
    const timeLimitPolicies = policies.filter(p => p.rules.timeLimits?.enabled).length;
    
    document.getElementById('totalPoliciesCount').textContent = totalPolicies;
    document.getElementById('activePoliciesCount').textContent = activePolicies;
    document.getElementById('timeLimitPoliciesCount').textContent = timeLimitPolicies;
}

function getPriorityClass(priority) {
    if (priority >= 50) return 'high';
    if (priority >= 20) return 'medium';
    return 'low';
}

// ========== CREATE POLICY ==========
function showCreatePolicyModal() {
    const modal = document.getElementById('createPolicyModal');
    const form = document.getElementById('createPolicyForm');
    
    // Show modal first
    modal.style.display = 'flex';
    
    // Reset form
    form.reset();
    
    // Reset any conditional sections
    document.getElementById('timeLimitsSection').style.display = 'none';
    document.getElementById('allowedHoursSection').style.display = 'none';
    document.getElementById('autoArmSection').style.display = 'none';
    document.getElementById('inactivitySection').style.display = 'none';
    document.getElementById('scopeTargetsDiv').style.display = 'none';
    
    // Load groups and devices for scope selection
    loadScopeTargets().then(() => {
        console.log('Scope targets loaded successfully');
    }).catch(error => {
        console.error('Failed to load scope targets:', error);
        showToast('Warning', 'Could not load all groups/devices for scope selection', 'warning');
    });
}

function closeCreatePolicyModal() {
    document.getElementById('createPolicyModal').style.display = 'none';
}

async function loadScopeTargets() {
    try {
        // Load groups
        const groupsResponse = await fetch(`${API_URL}/api/groups`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        const groupsData = await groupsResponse.json();
        
        // Load devices
        const devicesResponse = await fetch(`${API_URL}/api/devices`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        const devicesData = await devicesResponse.json();
        
        // Store for later use
        window.availableGroups = groupsData.groups || [];
        window.availableDevices = devicesData.devices || [];
    } catch (error) {
        console.error('Load scope targets error:', error);
    }
}

function handleScopeChange() {
    const scope = document.getElementById('policyScope').value;
    const targetsDiv = document.getElementById('scopeTargetsDiv');
    const targetsSelect = document.getElementById('scopeTargets');
    const targetsLabel = document.getElementById('scopeTargetsLabel');
    
    if (scope === 'global') {
        targetsDiv.style.display = 'none';
        return;
    }
    
    targetsDiv.style.display = 'block';
    targetsSelect.innerHTML = '';
    
    if (scope === 'group') {
        targetsLabel.textContent = 'Select Groups';
        (window.availableGroups || []).forEach(group => {
            const option = document.createElement('option');
            option.value = group.groupId;
            option.textContent = group.groupName;
            targetsSelect.appendChild(option);
        });
    } else if (scope === 'device') {
        targetsLabel.textContent = 'Select Devices';
        (window.availableDevices || []).forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.deviceName;
            targetsSelect.appendChild(option);
        });
    }
}

function toggleSection(sectionName) {
    const checkbox = document.getElementById(`${sectionName}Enabled`);
    const section = document.getElementById(`${sectionName}Section`);
    
    if (section) {
        section.style.display = checkbox.checked ? 'block' : 'none';
    }
}

async function handleCreatePolicy(event) {
    event.preventDefault();
    
    console.log('=== CREATE POLICY FORM SUBMITTED ===');
    
    // Collect form data
    const scope = document.getElementById('policyScope').value;
    const scopeTargets = Array.from(document.getElementById('scopeTargets').selectedOptions)
        .map(opt => opt.value);
    
    console.log('Scope:', scope);
    console.log('Scope Targets:', scopeTargets);
    
    const policyData = {
        policyName: document.getElementById('policyName').value,
        description: document.getElementById('policyDescription').value,
        priority: parseInt(document.getElementById('policyPriority').value),
        scope: {
            type: scope,
            targetIds: scope === 'global' ? [] : scopeTargets
        },
        rules: {
            // Time Limits
            timeLimits: {
                enabled: document.getElementById('timeLimitsEnabled').checked,
                dailyMinutes: parseInt(document.getElementById('dailyMinutes').value) || 480,
                resetTime: document.getElementById('resetTime').value || '00:00',
                action: document.getElementById('timeLimitAction').value
            },
            
            // Allowed Hours
            allowedHours: {
                enabled: document.getElementById('allowedHoursEnabled')?.checked || false,
                schedule: getAllowedHoursSchedule()
            },
            
            // Auto-Arm
            autoArm: document.getElementById('autoArmEnabled').checked,
            autoArmSchedule: {
                enabled: document.getElementById('autoArmScheduleEnabled')?.checked || false,
                startTime: document.getElementById('autoArmStartTime')?.value || '22:00',
                endTime: document.getElementById('autoArmEndTime')?.value || '06:00',
                days: getAutoArmDays()
            },
            
            // Geofence
            enforceGeofence: document.getElementById('enforceGeofence').checked,
            geofenceAction: document.getElementById('geofenceAction').value,
            
            // Breach Response
            breachThreshold: parseInt(document.getElementById('breachThreshold').value) || 3,
            breachAction: document.getElementById('breachAction').value,
            
            // Inactivity
            inactivityTimeout: {
                enabled: document.getElementById('inactivityEnabled').checked,
                minutes: parseInt(document.getElementById('inactivityMinutes').value) || 30
            }
        },
        notifications: {
            onBreach: document.getElementById('notifyBreach').checked,
            onGeofenceExit: document.getElementById('notifyGeofence').checked,
            onTimeLimitReached: document.getElementById('notifyTimeLimit').checked,
            recipients: document.getElementById('notificationEmails').value
                .split(',')
                .map(e => e.trim())
                .filter(e => e)
        }
    };
    
    console.log('=== POLICY DATA TO SUBMIT ===');
    console.log(JSON.stringify(policyData, null, 2));
    
    try {
        console.log('Sending POST request to:', `${API_URL}/api/policies`);
        const response = await fetch(`${API_URL}/api/policies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getApiKey()}`
            },
            body: JSON.stringify(policyData)
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (!response.ok) {
            console.error(' Policy creation failed:', result);
            throw new Error(result.message || result.error || 'Failed to create policy');
        }
        
        console.log(' Policy created successfully:', result);
        showToast('Success', 'Policy created successfully!', 'success');
        closeCreatePolicyModal();
        loadPolicies();
    } catch (error) {
        console.error(' Create policy error:', error);
        showToast('Error', error.message || 'Failed to create policy. Check console for details.', 'error');
    }
}

function getAllowedHoursSchedule() {
    const schedule = [];
    
    for (let day = 0; day <= 6; day++) {
        const checkbox = document.getElementById(`day${day}`);
        if (checkbox && checkbox.checked) {
            schedule.push({
                day: day,
                startTime: document.getElementById(`day${day}Start`).value,
                endTime: document.getElementById(`day${day}End`).value
            });
        }
    }
    
    return schedule;
}

function getAutoArmDays() {
    const days = [];
    const checkboxes = document.querySelectorAll('.days-selector input[type="checkbox"]');
    
    // If no checkboxes with .days-selector class, return default (all days)
    if (!checkboxes || checkboxes.length === 0) {
        return [0, 1, 2, 3, 4, 5, 6]; // All days of the week
    }
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            days.push(parseInt(checkbox.value));
        }
    });
    
    return days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6];
}

// ========== TOGGLE POLICY STATUS ==========
async function togglePolicyStatus(policyId) {
    const policy = currentPolicies.find(p => p.policyId === policyId);
    if (!policy) return;
    
    try {
        const response = await fetch(`${API_URL}/api/policies/${policyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getApiKey()}`
            },
            body: JSON.stringify({ active: !policy.active })
        });
        
        if (!response.ok) throw new Error('Failed to update policy');
        
        showToast('Success', `Policy ${policy.active ? 'deactivated' : 'activated'}`, 'success');
        loadPolicies();
    } catch (error) {
        console.error('Toggle policy error:', error);
        showToast('Error', 'Failed to update policy', 'error');
    }
}

// ========== DELETE POLICY ==========
function confirmDeletePolicy(policyId) {
    const policy = currentPolicies.find(p => p.policyId === policyId);
    if (!policy) return;
    
    if (confirm(`Are you sure you want to delete the policy "${policy.policyName}"?\n\nThis action cannot be undone.`)) {
        deletePolicy(policyId);
    }
}

async function deletePolicy(policyId) {
    try {
        const response = await fetch(`${API_URL}/api/policies/${policyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete policy');
        
        showToast('Success', 'Policy deleted successfully', 'success');
        loadPolicies();
    } catch (error) {
        console.error('Delete policy error:', error);
        showToast('Error', 'Failed to delete policy', 'error');
    }
}

// ========== VIEW POLICY DETAILS ==========
async function viewPolicyDetails(policyId) {
    const policy = currentPolicies.find(p => p.policyId === policyId);
    if (!policy) return;
    
    // Fetch additional details about affected devices/groups
    let affectedTargetsHtml = '';
    try {
        if (policy.scope.type === 'group' && policy.scope.targetIds.length > 0) {
            const groupNames = policy.scope.targetIds.map(id => {
                const group = currentGroups?.find(g => g.groupId === id);
                return group ? group.groupName : id;
            });
            affectedTargetsHtml = `
                <div class="detail-section">
                    <h4>Affected Groups (${groupNames.length})</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${groupNames.map(name => `<span class="badge badge-info">${escapeHtml(name)}</span>`).join('')}
                    </div>
                </div>
            `;
        } else if (policy.scope.type === 'device' && policy.scope.targetIds.length > 0) {
            const deviceNames = policy.scope.targetIds.map(id => {
                const device = window.availableDevices?.find(d => d.deviceId === id);
                return device ? device.deviceName : id;
            });
            affectedTargetsHtml = `
                <div class="detail-section">
                    <h4>Affected Devices (${deviceNames.length})</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${deviceNames.map(name => `<span class="badge badge-info">${escapeHtml(name)}</span>`).join('')}
                    </div>
                </div>
            `;
        } else if (policy.scope.type === 'global') {
            affectedTargetsHtml = `
                <div class="detail-section">
                    <h4>Scope</h4>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 12px; color: white;">
                        <i data-lucide="globe" size="16" style="vertical-align: middle;"></i>
                        <strong> Global Policy</strong>
                        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.85rem;">This policy applies to all devices in the system</p>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error('Error building affected targets:', e);
    }
    
    // Build detailed view HTML
    const content = `
        <div class="policy-details">
            <div class="detail-section">
                <h4>Basic Information</h4>
                <table class="details-table">
                    <tr>
                        <td><strong>Policy ID:</strong></td>
                        <td style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(policy.policyId)}</td>
                    </tr>
                    <tr>
                        <td><strong>Name:</strong></td>
                        <td>${escapeHtml(policy.policyName)}</td>
                    </tr>
                    <tr>
                        <td><strong>Description:</strong></td>
                        <td>${escapeHtml(policy.description || 'No description provided')}</td>
                    </tr>
                    <tr>
                        <td><strong>Priority:</strong></td>
                        <td><span class="priority-badge priority-${getPriorityClass(policy.priority)}">${policy.priority}</span> <small style="color: var(--zinc-500);">(Higher = more important)</small></td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td><span class="badge ${policy.active ? 'badge-success' : 'badge-danger'}">
                            ${policy.active ? ' Active' : ' Inactive'}
                        </span></td>
                    </tr>
                    <tr>
                        <td><strong>Created:</strong></td>
                        <td>${new Date(policy.createdAt).toLocaleString()}</td>
                    </tr>
                </table>
            </div>
            
            ${affectedTargetsHtml}
            
            <div class="detail-section">
                <h4>Configured Rules</h4>
                ${getPolicyRulesHTML(policy.rules)}
            </div>
            
            <div class="detail-section">
                <h4>Notification Settings</h4>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 8px; background: ${policy.notifications.onBreach ? 'var(--zinc-50)' : 'transparent'}; border-radius: 4px; margin-bottom: 4px;">
                        ${policy.notifications.onBreach ? '' : ''} Breach Notifications
                    </li>
                    <li style="padding: 8px; background: ${policy.notifications.onGeofenceExit ? 'var(--zinc-50)' : 'transparent'}; border-radius: 4px; margin-bottom: 4px;">
                        ${policy.notifications.onGeofenceExit ? '' : ''} Geofence Exit Alerts
                    </li>
                    <li style="padding: 8px; background: ${policy.notifications.onTimeLimitReached ? 'var(--zinc-50)' : 'transparent'}; border-radius: 4px; margin-bottom: 4px;">
                        ${policy.notifications.onTimeLimitReached ? '' : ''} Time Limit Warnings
                    </li>
                    ${policy.notifications.recipients.length > 0 ? 
                        `<li style="padding: 8px; background: var(--zinc-50); border-radius: 4px; margin-top: 10px;">
                            <strong> Email Recipients:</strong><br>
                            <span style="font-size: 0.9rem; color: var(--zinc-700);">${policy.notifications.recipients.join(', ')}</span>
                        </li>` : 
                        `<li style="padding: 8px; color: var(--zinc-500); font-style: italic; margin-top: 10px;">
                            No email recipients configured
                        </li>`
                    }
                </ul>
            </div>
        </div>
    `;
    
    // Show in a modal (you'll need to create this modal in HTML)
    const modal = document.getElementById('policyDetailsModal') || createPolicyDetailsModal();
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = content;
    }
    modal.style.display = 'flex';
    
    // Re-initialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getPolicyRulesHTML(rules) {
    let html = '<div style="display: grid; gap: 10px;">';
    let hasRules = false;
    
    if (rules.timeLimits?.enabled) {
        hasRules = true;
        html += `
            <div style="padding: 12px; background: var(--zinc-50); border-left: 3px solid var(--brand-primary); border-radius: 6px;">
                <strong>⏱ Daily Time Limits</strong><br>
                <span style="color: var(--zinc-600); font-size: 0.9rem;">
                    Maximum: ${rules.timeLimits.dailyMinutes} minutes per day<br>
                    Resets at: ${rules.timeLimits.resetTime}<br>
                    Action: ${rules.timeLimits.action.charAt(0).toUpperCase() + rules.timeLimits.action.slice(1)}
                </span>
            </div>
        `;
    }
    
    if (rules.allowedHours?.enabled && rules.allowedHours.schedule?.length > 0) {
        hasRules = true;
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const scheduleText = rules.allowedHours.schedule.map(s => 
            `${dayNames[s.day]}: ${s.startTime} - ${s.endTime}`
        ).join('<br>');
        html += `
            <div style="padding: 12px; background: var(--zinc-50); border-left: 3px solid var(--status-info); border-radius: 6px;">
                <strong> Allowed Hours Schedule</strong><br>
                <span style="color: var(--zinc-600); font-size: 0.85rem;">
                    ${scheduleText}
                </span>
            </div>
        `;
    }
    
    if (rules.autoArm) {
        hasRules = true;
        let scheduleInfo = 'Always enabled';
        if (rules.autoArmSchedule?.enabled) {
            scheduleInfo = `${rules.autoArmSchedule.startTime} - ${rules.autoArmSchedule.endTime}`;
        }
        html += `
            <div style="padding: 12px; background: var(--zinc-50); border-left: 3px solid var(--status-warn); border-radius: 6px;">
                <strong> Automatic Arming</strong><br>
                <span style="color: var(--zinc-600); font-size: 0.9rem;">
                    Schedule: ${scheduleInfo}
                </span>
            </div>
        `;
    }
    
    if (rules.enforceGeofence) {
        hasRules = true;
        html += `
            <div style="padding: 12px; background: var(--zinc-50); border-left: 3px solid var(--status-danger); border-radius: 6px;">
                <strong> Geofence Enforcement</strong><br>
                <span style="color: var(--zinc-600); font-size: 0.9rem;">
                    Action on exit: ${rules.geofenceAction.charAt(0).toUpperCase() + rules.geofenceAction.slice(1)}
                </span>
            </div>
        `;
    }
    
    if (rules.inactivityTimeout?.enabled) {
        hasRules = true;
        html += `
            <div style="padding: 12px; background: var(--zinc-50); border-left: 3px solid var(--zinc-400); border-radius: 6px;">
                <strong> Inactivity Auto-Arm</strong><br>
                <span style="color: var(--zinc-600); font-size: 0.9rem;">
                    Timeout: ${rules.inactivityTimeout.minutes} minutes of inactivity
                </span>
            </div>
        `;
    }
    
    if (rules.breachThreshold) {
        hasRules = true;
        html += `
            <div style="padding: 12px; background: var(--zinc-50); border-left: 3px solid var(--status-danger); border-radius: 6px;">
                <strong> Breach Response</strong><br>
                <span style="color: var(--zinc-600); font-size: 0.9rem;">
                    Threshold: ${rules.breachThreshold} breaches<br>
                    Action: ${rules.breachAction ? rules.breachAction.charAt(0).toUpperCase() + rules.breachAction.slice(1) : 'None'}
                </span>
            </div>
        `;
    }
    
    if (!hasRules) {
        html += `
            <div style="padding: 20px; text-align: center; color: var(--zinc-500); background: var(--zinc-50); border-radius: 8px;">
                <i data-lucide="alert-circle" size="24" style="opacity: 0.5;"></i>
                <p style="margin: 8px 0 0 0;">No rules configured for this policy</p>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// ========== VIOLATIONS ==========
async function loadViolations() {
    try {
        const response = await fetch(`${API_URL}/api/violations?limit=50`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch violations');
        
        const data = await response.json();
        currentViolations = data.violations || [];
        
        // Update stats
        const recent = currentViolations.filter(v => 
            v.timestamp > Date.now() - 86400000 // Last 24 hours
        );
        document.getElementById('recentViolationsCount').textContent = recent.length;
    } catch (error) {
        console.error('Load violations error:', error);
    }
}

function showViolations() {
    // Display violations in modal
    const content = currentViolations.map(v => `
        <div class="violation-item">
            <div class="violation-header">
                <strong>${v.violationType.replace(/_/g, ' ')}</strong>
                <span class="badge badge-${v.severity}">${v.severity}</span>
            </div>
            <div class="violation-details">
                <p>Device: ${v.deviceId}</p>
                <p>Action: ${v.actionTaken}</p>
                <p>Time: ${new Date(v.timestamp).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
    
    document.getElementById('violationsContent').innerHTML = content;
    document.getElementById('violationsModal').style.display = 'flex';
}

function closeViolationsModal() {
    document.getElementById('violationsModal').style.display = 'none';
}

// ========== INITIALIZE ==========
// Update switchTab to load policies
if (window.switchTab) {
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tabName) {
        originalSwitchTab(tabName);
        
        if (tabName === 'policies') {
            loadPolicies();
            loadViolations();
        }
    };
}

// ==================== NEW FEATURES v5.1.0 ====================

// ========== EMAIL MANAGEMENT ==========
async function testEmailConfig() {
    const email = prompt('Enter email address to send test email to:');
    if (!email) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/email/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Success', ` ${data.message}`, 'success');
        } else {
            showToast('Error', ` ${data.error}`, 'error');
        }
    } catch (error) {
        showToast('Error', ' Failed to send test email', 'error');
    }
}

async function loadEmailStats() {
    try {
        const response = await fetch(`${API_URL}/api/admin/email/stats`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (!response.ok) return;
        
        const { stats } = await response.json();
        
        const statsEl = document.getElementById('emailStats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div style="display: flex; gap: 20px; padding: 15px; background: white; border-radius: 8px;">
                    <div><strong>Sent:</strong> ${stats.sent}</div>
                    <div><strong>Failed:</strong> ${stats.failed}</div>
                    <div><strong>Queued:</strong> ${stats.queued}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load email stats:', error);
    }
}

// ========== BULK OPERATIONS ==========
function toggleDeviceSelection(deviceId, checkbox) {
    if (checkbox.checked) {
        selectedDevices.add(deviceId);
    } else {
        selectedDevices.delete(deviceId);
    }
    updateBulkActionsUI();
}

function updateBulkActionsUI() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    if (toolbar) {
        toolbar.style.display = selectedDevices.size > 0 ? 'flex' : 'none';
        const count = document.getElementById('bulkSelectedCount');
        if (count) count.textContent = selectedDevices.size;
    }
}

async function bulkArmSelected() {
    if (selectedDevices.size === 0) return;
    
    if (!confirm(`Arm ${selectedDevices.size} selected devices?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/devices/bulk-arm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ deviceIds: Array.from(selectedDevices) })
        });
        
        const data = await response.json();
        
        showToast('Success', ` Armed ${data.armed} devices, ${data.failed} failed`, 'success');
        
        loadDevices();
        selectedDevices.clear();
        updateBulkActionsUI();
    } catch (error) {
        showToast('Error', 'Bulk arm operation failed', 'error');
    }
}

async function bulkDisarmSelected() {
    if (selectedDevices.size === 0) return;
    
    if (!confirm(`Disarm ${selectedDevices.size} selected devices?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/devices/bulk-disarm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ deviceIds: Array.from(selectedDevices) })
        });
        
        const data = await response.json();
        
        showToast('Success', ` Disarmed ${data.disarmed} devices`, 'success');
        
        loadDevices();
        selectedDevices.clear();
        updateBulkActionsUI();
    } catch (error) {
        showToast('Error', 'Bulk disarm operation failed', 'error');
    }
}

async function bulkDeleteSelected() {
    if (selectedDevices.size === 0) return;
    
    if (!confirm(` Delete ${selectedDevices.size} devices? This cannot be undone!`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/devices/bulk-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ deviceIds: Array.from(selectedDevices) })
        });
        
        const data = await response.json();
        
        showToast('Success', ` Deleted ${data.deleted} devices`, 'success');
        
        loadDevices();
        selectedDevices.clear();
        updateBulkActionsUI();
    } catch (error) {
        showToast('Error', 'Bulk delete operation failed', 'error');
    }
}

// ========== ANALYTICS DASHBOARD ==========
async function loadAnalytics() {
    const timeRange = document.getElementById('analyticsTimeRange')?.value || '7d';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/analytics/dashboard?timeRange=${timeRange}`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (!response.ok) return;
        
        const { analytics } = await response.json();
        
        // Update overview stats
        const updates = {
            'statTotalDevices': analytics.overview.totalDevices,
            'statOnlineDevices': analytics.overview.deviceStatus.online,
            'statArmedDevices': analytics.overview.deviceStatus.armed,
            'statTotalActivity': analytics.activity.total
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
        // Display top devices
        const topDevicesList = document.getElementById('topDevicesList');
        if (topDevicesList && analytics.topDevices) {
            topDevicesList.innerHTML = analytics.topDevices.map(device => `
                <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
                    <span>${device.deviceName}</span>
                    <span style="color: #666;">${device.activityCount} events</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

// ========== EXPORT FUNCTIONS ==========
function exportCompleteData() {
    window.location.href = `${API_URL}/api/admin/export/complete?auth=${systemAdminKey}`;
}

function exportDevicesCSV() {
    window.location.href = `${API_URL}/api/admin/export/csv?type=devices&auth=${systemAdminKey}`;
}

function exportActivityCSV() {
    window.location.href = `${API_URL}/api/admin/export/csv?type=activity&auth=${systemAdminKey}`;
}

// ========== WEBHOOKS MANAGEMENT ==========
async function loadWebhooks() {
    try {
        const response = await fetch(`${API_URL}/api/admin/webhooks`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (!response.ok) return;
        
        const { webhooks } = await response.json();
        
        const list = document.getElementById('webhooksList');
        if (!list) return;
        
        list.innerHTML = webhooks.map(webhook => `
            <div style="padding: 15px; background: white; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${webhook.name}</strong><br>
                        <small style="color: #666;">${webhook.url}</small><br>
                        <small>Events: ${webhook.events.join(', ')}</small>
                    </div>
                    <button onclick="deleteWebhook('${webhook.id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load webhooks:', error);
    }
}

async function addWebhook() {
    const name = document.getElementById('webhookName')?.value;
    const url = document.getElementById('webhookUrl')?.value;
    const eventsSelect = document.getElementById('webhookEvents');
    
    if (!name || !url || !eventsSelect) return;
    
    const events = Array.from(eventsSelect.selectedOptions).map(opt => opt.value);
    
    try {
        const response = await fetch(`${API_URL}/api/admin/webhooks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ name, url, events })
        });
        
        if (response.ok) {
            showToast('Success', 'Webhook added successfully!', 'success');
            loadWebhooks();
            // Clear form
            document.getElementById('webhookName').value = '';
            document.getElementById('webhookUrl').value = '';
        }
    } catch (error) {
        showToast('Error', 'Failed to add webhook', 'error');
    }
}

async function deleteWebhook(id) {
    if (!confirm('Delete this webhook?')) return;
    
    try {
        await fetch(`${API_URL}/api/admin/webhooks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        showToast('Success', 'Webhook deleted', 'success');
        loadWebhooks();
    } catch (error) {
        showToast('Error', 'Failed to delete webhook', 'error');
    }
}

// ========== DEVICE HEALTH MONITORING ==========
async function loadDeviceHealth() {
    try {
        const response = await fetch(`${API_URL}/api/admin/devices/health`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (!response.ok) return;
        
        const { summary, devices } = await response.json();
        
        // Update summary counts
        const updates = {
            'healthyCount': summary.healthy,
            'unhealthyCount': summary.unhealthy,
            'offlineCount': summary.offline
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
        // Display unhealthy devices
        const unhealthyDevices = devices.filter(d => d.health === 'unhealthy');
        
        const detailsDiv = document.getElementById('healthDetails');
        if (detailsDiv) {
            detailsDiv.innerHTML = unhealthyDevices.map(device => `
                <div style="padding: 10px; background: #fee; border-left: 3px solid #ef4444; margin-bottom: 5px;">
                    <strong>${device.deviceName}</strong><br>
                    <small>Issues: ${device.issues.join(', ')}</small><br>
                    <small>Last seen: ${formatTimestamp(device.lastSeen)}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load device health:', error);
    }
}

function formatTimestamp(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

// ========== ADVANCED SEARCH ==========
async function searchDevices() {
    const query = document.getElementById('searchQuery')?.value;
    if (!query && query !== '') return;
    
    const filters = {
        armed: document.getElementById('filterArmed')?.checked ? true : undefined,
        online: document.getElementById('filterOnline')?.checked ? true : undefined,
        quarantined: document.getElementById('filterQuarantined')?.checked ? false : undefined
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
    );
    
    try {
        const response = await fetch(`${API_URL}/api/admin/devices/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ query, filters })
        });
        
        if (!response.ok) return;
        
        const { devices, count } = await response.json();
        
        displaySearchResults(devices, count);
    } catch (error) {
        showToast('Error', 'Search failed', 'error');
    }
}

function displaySearchResults(devices, count) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = `
        <div style="padding: 10px; background: #f0f0f0; margin-bottom: 10px;">
            Found ${count} devices
        </div>
        ${devices.map(device => `
            <div style="padding: 10px; background: white; border-bottom: 1px solid #eee;">
                <strong>${device.deviceName}</strong>
                <span style="margin-left: 10px;">${device.armed ? ' Armed' : ' Disarmed'}</span>
                <span style="margin-left: 10px;">${isDeviceOnline(device) ? '🟢 Online' : ' Offline'}</span>
            </div>
        `).join('')}
    `;
}

function isDeviceOnline(device) {
    return (Date.now() - device.lastHeartbeat) < 5 * 60 * 1000;
}

// ========== SCHEDULED REPORTS ==========
async function sendDailyDigest() {
    try {
        const response = await fetch(`${API_URL}/api/admin/reports/daily-digest`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (response.ok) {
            showToast('Success', 'Daily digest email sent!', 'success');
        } else {
            showToast('Error', 'Failed to send digest', 'error');
        }
    } catch (error) {
        showToast('Error', 'Failed to send digest', 'error');
    }
}

// ========== PROFILE & NOTIFICATION SETTINGS ==========

/**
 * Load admin profile and notification settings
 */
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/api/system/profile`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update profile info
            document.getElementById('profileName').textContent = data.name || 'System Administrator';
            document.getElementById('profileEmail').textContent = data.email || 'No email set';
            
            // Load notification settings
            document.getElementById('notificationEmail').value = data.notificationEmail || data.email || '';
            document.getElementById('notifyGeofenceBreach').checked = data.notifyOnGeofenceBreach !== false;
            document.getElementById('notifyIpBlock').checked = data.notifyOnIpBlock !== false;
            document.getElementById('notifyReconfigAttempt').checked = data.notifyOnReconfigAttempt !== false;
            document.getElementById('notifyPolicyViolation').checked = data.notifyOnPolicyViolation !== false;
            document.getElementById('notifyQuarantine').checked = data.notifyOnQuarantine !== false;
            
            // Update email status
            updateEmailStatus(data.notificationEmail);
        } else {
            showToast('Error', 'Failed to load profile', 'error');
        }
    } catch (error) {
        console.error('Load profile error:', error);
        showToast('Error', 'Failed to load profile', 'error');
    }
}

/**
 * Save notification settings
 */
async function saveNotificationSettings(event) {
    event.preventDefault();
    
    const notificationEmail = document.getElementById('notificationEmail').value.trim();
    
    // Validate email if provided
    if (notificationEmail && !isValidEmail(notificationEmail)) {
        showToast('Error', 'Please enter a valid email address', 'error');
        return;
    }
    
    const settings = {
        notificationEmail: notificationEmail || null,
        notifyOnGeofenceBreach: document.getElementById('notifyGeofenceBreach').checked,
        notifyOnIpBlock: document.getElementById('notifyIpBlock').checked,
        notifyOnReconfigAttempt: document.getElementById('notifyReconfigAttempt').checked,
        notifyOnPolicyViolation: document.getElementById('notifyPolicyViolation').checked,
        notifyOnQuarantine: document.getElementById('notifyQuarantine').checked
    };
    
    try {
        const response = await fetch(`${API_URL}/api/system/notification-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            showToast('Success', 'Notification settings saved!', 'success');
            updateEmailStatus(notificationEmail);
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Save notification settings error:', error);
        showToast('Error', 'Failed to save settings', 'error');
    }
}

/**
 * Send test email to admin's notification address
 */
async function sendTestEmail() {
    const email = document.getElementById('notificationEmail').value.trim();
    
    if (!email) {
        showToast('Error', 'Please enter an email address first', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Error', 'Please enter a valid email address', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/system/test-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${systemAdminKey}`
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showToast('Success', `Test email sent to ${email}!`, 'success');
        } else {
            const data = await response.json();
            showToast('Error', data.error || 'Failed to send test email', 'error');
        }
    } catch (error) {
        console.error('Send test email error:', error);
        showToast('Error', 'Failed to send test email', 'error');
    }
}

/**
 * Update email status indicator
 */
function updateEmailStatus(email) {
    const statusEl = document.getElementById('emailStatus');
    
    if (email) {
        statusEl.innerHTML = `
            <div style="width: 8px; height: 8px; background: var(--status-safe); border-radius: 50%;"></div>
            <span style="font-size: 0.85rem; color: var(--zinc-600);">
                Email notifications enabled for <strong>${email}</strong>
            </span>
        `;
    } else {
        statusEl.innerHTML = `
            <div style="width: 8px; height: 8px; background: var(--status-warn); border-radius: 50%;"></div>
            <span style="font-size: 0.85rem; color: var(--zinc-600);">
                No notification email set - you won't receive security alerts
            </span>
        `;
    }
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
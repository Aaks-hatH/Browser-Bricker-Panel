// System Administrator Panel JavaScript - Complete Version
// Version: 4.2.0 - Full Feature Set

const API_URL = 'https://browserbricker.onrender.com';

let systemAdminKey = null;
let refreshInterval = null;
let locationRefreshInterval = null;

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
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">📱</div>
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
        
        const armBtn = device.armed ? 
            `<button class="btn btn-success" style="padding: 8px 16px; font-size: 0.8rem;" onclick="disarmDevice('${device.deviceId}')"><i data-lucide="unlock" size="14"></i></button>` :
            `<button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.8rem;" onclick="armDevice('${device.deviceId}')"><i data-lucide="lock" size="14"></i></button>`;
        
        html += `
            <tr>
                <td>
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(device.deviceName)}</div>
                    <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-400);">${device.deviceId.substring(0, 12)}...</div>
                </td>
                <td>${onlineBadge}</td>
                <td>${stateBadge}</td>
                <td>${securityBadges}</td>
                <td style="font-family: var(--mono); font-size: 0.85rem;">${lastSeen}</td>
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${armBtn}
                        <button class="btn btn-ghost" style="padding: 8px 16px; font-size: 0.8rem;" onclick="editDevice('${device.deviceId}', '${escapeHtml(device.deviceName)}')"><i data-lucide="edit-2" size="14"></i></button>
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
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">👥</div>
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
            '<span class="badge badge-danger">REVOKED</span>' : 
            '<span class="badge badge-safe">ACTIVE</span>';
        
        // ✅ Fix: Use createdAt instead of created
        const created = new Date(user.createdAt).toLocaleDateString();
        const lastUsed = user.lastUsed ? timeSince(user.lastUsed) : 'Never';
        
        // ✅ Fix: Create display hash (first 16 chars)
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
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">📍</div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No geofences configured</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">Create geofences to restrict device locations</p>
            </div>
        `;
        return;
    }
    
    let html = '';
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
                    📍 Center: ${geo.lat.toFixed(6)}, ${geo.lon.toFixed(6)}<br>
                    📏 Radius: ${geo.radius} meters
                </div>
                <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem; width: 100%; margin-top: 12px;" onclick="removeGeofence('${geo.deviceId}')">
                    <i data-lucide="trash-2" size="12"></i> Remove Geofence
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    lucide.createIcons();
}

function renderLocations(locations) {
    const container = document.getElementById('locationsList');
    
    if (locations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">🗺️</div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No location data available</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">Location data will appear when devices report their positions</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    locations.forEach(loc => {
        const timeDiff = Date.now() - new Date(loc.timestamp).getTime();
        const isRecent = timeDiff < 30000; // Less than 30 seconds
        
        html += `
            <div class="location-item">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(loc.deviceName)}</div>
                        <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${loc.deviceId}</div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        ${isRecent ? '<span class="badge badge-safe"><i data-lucide="radio" size="10"></i> LIVE</span>' : ''}
                        ${loc.geofenced ? '<span class="badge badge-info"><i data-lucide="map-pin" size="10"></i> GEOFENCED</span>' : ''}
                    </div>
                </div>
                <div class="coordinates-display">
                    📍 ${loc.location.lat.toFixed(6)}, ${loc.location.lon.toFixed(6)}
                </div>
                <div style="font-size: 0.75rem; color: var(--zinc-400); margin-top: 8px;">
                    Last updated: ${timeSince(loc.timestamp)}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    lucide.createIcons();
}

function renderBreaches(breaches) {
    const container = document.getElementById('breachesList');
    
    if (breaches.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">🛡️</div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">No security breaches detected</h3>
                <p style="color: var(--zinc-500); font-size: 0.9rem;">All devices are secure</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    breaches.forEach(breach => {
        html += `
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid var(--status-danger);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(breach.deviceName)}</div>
                        <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${breach.deviceId}</div>
                    </div>
                    <span class="badge badge-danger">${breach.count} Breach${breach.count !== 1 ? 'es' : ''}</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; border: var(--border);">
                    ${breach.breaches.map(b => `
                        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--zinc-100);">
                            <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">
                                ${b.type ? b.type.replace(/_/g, ' ').toUpperCase() : 'SECURITY EVENT'}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--zinc-400);">
                                ${new Date(b.timestamp).toLocaleString()}
                            </div>
                        </div>
                    `).join('')}
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
                <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">📋</div>
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
        'activity': 'activityView'
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
            'activity': 'Activity Log'
        };
        document.getElementById('pageTitle').textContent = titles[viewName];
        
        // Load data for specific views
        if (viewName === 'devices') loadDevices();
        else if (viewName === 'users') loadUsers();
        else if (viewName === 'geofencing') loadGeofences();
        else if (viewName === 'locations') loadLocations();
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
            method: 'PUT',
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
    if (!confirm(`⚠️ Are you sure you want to delete "${deviceName}"?\n\nThis action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/device/delete`, {
            method: 'DELETE',
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

// ========== BULK OPERATIONS ==========
async function armAll() {
    const reason = prompt('Enter reason for arming all devices (optional):') || 'Group lockdown';
    
    if (!confirm('⚠️ Are you sure you want to ARM ALL devices in your group?\n\nThis will lock all devices immediately.')) return;
    
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
            showToast('Success', `${data.armedCount} devices armed successfully`, 'success');
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
    
    if (!confirm('⚠️ Are you sure you want to DISARM ALL devices in your group?\n\nThis will unlock all devices immediately.')) return;
    
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
            showToast('Success', `${data.disarmedCount} devices disarmed successfully`, 'success');
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
    
    // ✅ Validate keyHash before sending
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
}

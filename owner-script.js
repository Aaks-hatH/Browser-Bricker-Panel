// BrowserBricker Owner Panel - Complete Enhanced JavaScript
// Version: 5.0.1 - Hierarchical Edition
// Features: System Admins, Registration Codes, Geofencing, Live Tracking, Bulk Operations

lucide.createIcons();

const API_URL = 'https://browserbricker.onrender.com';
let ownerApiKey = null;
let refreshInterval = null;
let locationRefreshInterval = null;
let sessionStartTime = Date.now();
let activityChart = null;
let searchTimeout = null;
let currentGroupIdForAssignment = null;

// Map variables
let ownerLocationsMap = null;
let ownerLocationsMapInitialized = false;
let ownerGeofenceMap = null;
let ownerGeofenceMapInitialized = false;
let ownerLocationMarkers = [];
let ownerGeofenceCircles = [];
let isOwnerMapView = false;

// ========== INITIALIZATION ==========
window.onload = function() {
    const storedKey = sessionStorage.getItem('ownerKey');
    if (storedKey) {
        ownerApiKey = storedKey;
        fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${storedKey}` }
        }).then(res => {
            if (res.ok) {
                revealDashboard();
            } else {
                sessionStorage.removeItem('ownerKey');
            }
        }).catch(() => {
            sessionStorage.removeItem('ownerKey');
        });
    }
    
    initializeAllViews();
    setupSearchHandler();
};

// ========== AUTH FUNCTIONS ==========
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    if (tab === 'login') {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('generateForm').style.display = 'none';
    } else {
        document.getElementById('generateTab').classList.add('active');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('generateForm').style.display = 'block';
    }
    document.getElementById('authError').style.display = 'none';
}

async function handleGenerate(event) {
    event.preventDefault();
    const code = document.getElementById('secretCodeInput').value.trim();
    const btn = document.getElementById('generateBtn');
    const btnText = document.getElementById('generateBtnText');
    const spinner = document.getElementById('generateSpinner');
    
    if (!code) {
        showAuthError('Please enter the secret code');
        return;
    }
    
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_URL}/api/init/admin-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secretCode: code })
        });
        
        if (response.ok) {
            const data = await response.json();
            btnText.textContent = 'Key Generated!';
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            showToast('Success', 'Owner key generated successfully!', 'success');
            
            setTimeout(() => {
                switchAuthTab('login');
                document.getElementById('ownerKeyInput').value = data.adminKey;
                document.getElementById('ownerKeyInput').type = 'text';
                setTimeout(() => {
                    document.getElementById('ownerKeyInput').type = 'password';
                }, 3000);
            }, 800);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate key');
        }
    } catch (err) {
        showAuthError(err.message || 'Invalid secret code. Access denied.');
        gsap.fromTo(".auth-card", { x: -10 }, { 
            x: 10, repeat: 5, yoyo: true, duration: 0.05, 
            onComplete: () => gsap.set('.auth-card', { x: 0 })
        });
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Generate Owner Key';
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const key = document.getElementById('ownerKeyInput').value.trim();
    const btn = document.getElementById('authBtn');
    const btnText = document.getElementById('authBtnText');
    const spinner = document.getElementById('authSpinner');
    
    if (!key || key.length !== 64) {
        showAuthError('Owner key must be exactly 64 characters');
        return;
    }
    
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        
        if (response.ok) {
            ownerApiKey = key;
            sessionStorage.setItem('ownerKey', key);
            btnText.textContent = 'Access Granted!';
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
            setTimeout(() => revealDashboard(), 800);
        } else {
            throw new Error('Unauthorized');
        }
    } catch (err) {
        showAuthError('Invalid owner API key. Access denied.');
        gsap.fromTo(".auth-card", { x: -10 }, { 
            x: 10, repeat: 5, yoyo: true, duration: 0.05, 
            onComplete: () => gsap.set('.auth-card', { x: 0 })
        });
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Authenticate & Access System';
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        lucide.createIcons();
    }
}

function showAuthError(message) {
    const authError = document.getElementById('authError');
    const authErrorText = document.getElementById('authErrorText');
    authErrorText.textContent = message;
    authError.style.display = 'block';
    lucide.createIcons();
}

function revealDashboard() {
    gsap.to("#authOverlay", { opacity: 0, duration: 0.5, onComplete: () => {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('adminMain').style.display = 'flex';
        initDashboard();
        showToast("Access Granted", "Welcome to BrowserBricker Ultimate Owner Panel", "success");
        logTerminal("Owner authenticated successfully", "success");
    }});
}

function logout() {
    if (!confirm('Are you sure you want to sign out?')) return;
    sessionStorage.removeItem('ownerKey');
    clearInterval(refreshInterval);
    clearInterval(locationRefreshInterval);
    setTimeout(() => location.reload(), 300);
}

// ========== DASHBOARD INIT ==========
async function initDashboard() {
    await loadStats();
    await loadSystemAdmins();
    await loadDevices();
    await loadUsers();
    await loadActivity();
    initChart();
    updateSessionTimer();
    
    refreshInterval = setInterval(async () => {
        await loadStats();
        updateSessionTimer();
        
        const activeView = document.querySelector('.view-container.active');
        if (activeView) {
            const viewId = activeView.id.replace('view-', '');
            if (viewId === 'devices') await loadDevices();
            if (viewId === 'locations') await loadLocations();
            if (viewId === 'system-admins') await loadSystemAdmins();
        }
    }, 5000);
    
    locationRefreshInterval = setInterval(async () => {
        const locationsView = document.getElementById('view-locations');
        if (locationsView && locationsView.classList.contains('active')) {
            await loadLocations();
        }
    }, 5000);
}

function updateSessionTimer() {
    const elapsed = Date.now() - sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    document.getElementById('sessionTimer').textContent = 
        `Session: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ========== API HELPER ==========
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerApiKey}`
        }
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(API_URL + endpoint, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// ========== SEARCH HANDLER ==========
function setupSearchHandler() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            clearSearchHighlights();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
}

function performSearch(query) {
    console.log('Searching for:', query);
    // Implement search logic across all data
    showToast('Search', `Searching for: ${query}`, 'info');
}

function clearSearchHighlights() {
    // Clear any search highlights
}

// ========== LOAD DATA FUNCTIONS ==========
async function loadStats() {
    try {
        const data = await apiCall('/api/admin/stats');
        
        // Calculate device stats if not provided
        const devices = data.devices || {};
        const settings = { heartbeatTimeout: 60000 };
        
        document.getElementById('totalDevices').textContent = devices.total || 0;
        document.getElementById('totalUsers').textContent = data.users?.total || 0;
        document.getElementById('armedDevices').textContent = devices.armed || 0;
        document.getElementById('onlineDevices').textContent = devices.online || 0;
        document.getElementById('quarantinedDevices').textContent = devices.quarantined || 0;
        document.getElementById('geofencedDevices').textContent = data.geofences?.total || 0;
        document.getElementById('breachCount').textContent = data.statistics?.geofenceViolations || 0;
        document.getElementById('blockedIPCount').textContent = data.security?.blockedIPs || 0;
        
        if (data.systemAdmins) {
            document.getElementById('totalSystemAdmins').textContent = data.systemAdmins.total || 0;
            document.getElementById('activeSystemAdmins').textContent = data.systemAdmins.active || 0;
        }

        // Update health indicators
        if (data.uptime) {
            document.getElementById('uptimeVal').textContent = formatUptime(data.uptime / 1000);
        }

        // Show recent activity on overview if element exists
        const overviewActivity = document.getElementById('overviewRecentActivity');
        if (overviewActivity && data.recentActivity && data.recentActivity.length > 0) {
            overviewActivity.innerHTML = data.recentActivity.slice(0, 5).map(log => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--zinc-100); font-size: 0.8rem;">
                    <span class="badge badge-info" style="font-size: 0.65rem; margin-right: 6px;">${log.type}</span>
                    ${escapeHtml(log.description)}
                    <div style="font-size: 0.7rem; color: var(--zinc-400); margin-top: 2px;">${formatTime(log.timestamp)}</div>
                </div>
            `).join('');
            lucide.createIcons();
        }
        
        document.getElementById('apiStatusBadge').className = 'badge badge-safe';
        document.getElementById('apiStatusBadge').innerHTML = '<i data-lucide="activity" size="12"></i> API: OK';
        lucide.createIcons();
    } catch (error) {
        console.error('Stats error:', error);
        document.getElementById('apiStatusBadge').className = 'badge badge-danger';
        document.getElementById('apiStatusBadge').innerHTML = '<i data-lucide="alert-circle" size="12"></i> API: ERROR';
        lucide.createIcons();
    }
}

async function loadSystemAdmins() {
    try {
        const data = await apiCall('/api/admin/system-admins');
        const tbody = document.querySelector('#systemAdminsTable tbody');
        
        if (!data.systemAdmins || data.systemAdmins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--zinc-400);">No system administrators found</td></tr>';
        } else {
            tbody.innerHTML = data.systemAdmins.map(admin => {
                const statusBadge = admin.active ? 
                    '<span class="badge badge-safe">Active</span>' :
                    '<span class="badge badge-warn">Inactive</span>';
                
                return `
                    <tr>
                        <td style="font-family: var(--mono); font-size: 0.8rem;">${admin.systemAdminId}</td>
                        <td style="font-weight: 700; color: var(--brand-primary);">${escapeHtml(admin.groupName || 'Default')}</td>
                        <td style="font-weight: 600;">${escapeHtml(admin.name || 'N/A')}</td>
                        <td style="font-family: var(--mono); font-size: 0.75rem;">${escapeHtml(admin.email || 'N/A')}</td>
                        <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                        <td>${formatTime(admin.lastActive)}</td>
                        <td><span class="badge badge-info">${admin.devicesManaged || 0}</span></td>
                        <td><span class="badge badge-info">${admin.usersManaged || 0}</span></td>
                        <td>${statusBadge}</td>
                        <td>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem;" 
                                        onclick="showAdminDetails('${admin.systemAdminId}')">
                                    <i data-lucide="info" size="12"></i>
                                </button>
                                ${admin.active ? 
                                    `<button class="btn btn-warn" style="padding: 6px 12px; font-size: 0.75rem;" 
                                             onclick="deactivateSystemAdmin('${admin.systemAdminId}', '${escapeHtml(admin.name)}')">
                                        <i data-lucide="pause" size="12"></i>
                                     </button>` :
                                    `<button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" 
                                             onclick="activateSystemAdmin('${admin.systemAdminId}', '${escapeHtml(admin.name)}')">
                                        <i data-lucide="play" size="12"></i>
                                     </button>`
                                }
                                <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem; color: var(--status-danger);" 
                                        onclick="deleteSystemAdmin('${admin.systemAdminId}', '${escapeHtml(admin.name)}')">
                                    <i data-lucide="trash-2" size="12"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        // ✅ FIX: Load registration codes separately
        await loadRegistrationCodes();
        
        lucide.createIcons();
    } catch (error) {
        console.error('Load system admins error:', error);
        showToast('Error', 'Failed to load system administrators', 'error');
    }
}

async function loadRegistrationCodes() {
    try {
        const data = await apiCall('/api/admin/registration-codes');
        const codesList = document.getElementById('registrationCodesList');
        
        if (!codesList) return;
        
        if (!data.codes || data.codes.length === 0) {
            codesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No registration codes generated</div>';
        } else {
            codesList.innerHTML = data.codes.map(code => {
                const isExpired = Date.now() > code.expiresAt;
                const statusBadge = code.used ? 
                    '<span class="badge badge-safe">Used</span>' :
                    isExpired ?
                    '<span class="badge badge-danger">Expired</span>' :
                    '<span class="badge badge-info">Active</span>';
                
                return `
                    <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; 
                               margin-bottom: 12px; border-left: 4px solid ${code.used ? 'var(--status-safe)' : isExpired ? 'var(--status-danger)' : 'var(--status-info)'};">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <div style="font-size: 0.7rem; font-weight: 800; color: var(--zinc-400); 
                                           text-transform: uppercase; margin-bottom: 4px;">Group Name</div>
                                <div style="font-weight: 800; color: var(--zinc-900); margin-bottom: 8px; font-size: 1rem;">
                                    ${escapeHtml(code.groupName || 'No Group Specified')}
                                </div>
                                
                                <div style="font-family: var(--mono); font-weight: 700; font-size: 1.1rem; 
                                           letter-spacing: 2px; color: var(--brand-primary); margin-bottom: 8px; 
                                           cursor: pointer; user-select: all;" 
                                     onclick="navigator.clipboard.writeText('${code.code}'); 
                                              showToast('Copied', 'Code copied!', 'success');">
                                    ${code.code}
                                </div>
                                
                                <div style="font-size: 0.8rem; color: var(--zinc-600); 
                                           display: grid; grid-template-columns: auto 1fr; gap: 5px 10px;">
                                    <span style="font-weight: 600;">Created:</span>
                                    <span>${new Date(code.createdAt).toLocaleString()}</span>
                                    <span style="font-weight: 600;">Expires:</span>
                                    <span>${new Date(code.expiresAt).toLocaleString()}</span>
                                    ${code.name ? `<span style="font-weight: 600;">For:</span><span>${escapeHtml(code.name)}</span>` : ''}
                                    ${code.email ? `<span style="font-weight: 600;">Email:</span><span>${escapeHtml(code.email)}</span>` : ''}
                                    ${code.usedBy ? `<span style="font-weight: 600;">Used By:</span><span>${escapeHtml(code.usedBy)}</span>` : ''}
                                    ${code.usedAt ? `<span style="font-weight: 600;">Used At:</span><span>${new Date(code.usedAt).toLocaleString()}</span>` : ''}
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                                ${statusBadge}
                                ${!code.used && !isExpired ? 
                                    `<button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.7rem;" 
                                             onclick="navigator.clipboard.writeText('${code.code}'); 
                                                      showToast('Copied', 'Code copied!', 'success');">
                                        <i data-lucide="copy" size="12"></i> Copy
                                     </button>` : ''
                                }
                                ${!code.used ? 
                                    `<button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.7rem; color: var(--status-danger);" 
                                             onclick="deleteRegistrationCode('${code.code}')">
                                        <i data-lucide="trash-2" size="12"></i> Delete
                                     </button>` : ''
                                }
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Load registration codes error:', error);
        showToast('Error', 'Failed to load registration codes', 'error');
    }
}

async function deleteRegistrationCode(code) {
    if (!confirm(`Delete registration code ${code}?`)) return;
    
    try {
        await apiCall(`/api/admin/registration-code/${code}`, 'DELETE');
        
        showToast('Success', 'Registration code deleted', 'success');
        await loadRegistrationCodes();
    } catch (error) {
        showToast('Error', error.message || 'Failed to delete code', 'error');
    }
}

async function loadDevices() {
    try {
        const data = await apiCall('/api/admin/devices');
        const tbody = document.querySelector('#devicesTable tbody');
        
        if (!data.devices || data.devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--zinc-400);">No devices found</td></tr>';
            updateQuarantineView([]);
            return;
        }

        const settings = { heartbeatTimeout: 60000 }; // 60 seconds
        const now = Date.now();

        tbody.innerHTML = data.devices.map(device => {
            // Calculate if device is online
            const isOnline = device.lastHeartbeat && 
                            (now - device.lastHeartbeat) < settings.heartbeatTimeout;
            
            const statusBadge = isOnline ? 
                '<span class="badge badge-safe"><i data-lucide="wifi" size="10"></i> Online</span>' :
                '<span class="badge badge-warn"><i data-lucide="wifi-off" size="10"></i> Offline</span>';
            
            const lockBadge = device.armed ?
                '<span class="badge badge-armed"><i data-lucide="lock" size="10"></i> Armed</span>' :
                '<span class="badge badge-disarmed"><i data-lucide="unlock" size="10"></i> Disarmed</span>';
            
            let securityBadges = '';
            if (device.quarantined) securityBadges += '<span class="badge badge-danger" style="margin-right: 4px;">Quarantine</span>';
            if (device.geofenced) securityBadges += '<span class="badge badge-info" style="margin-right: 4px;">Geofenced</span>';
            if (device.breachCount > 0) securityBadges += `<span class="badge badge-warn">${device.breachCount} Breaches</span>`;
            if (!securityBadges) securityBadges = '<span class="badge badge-safe">Secure</span>';
            
            const lastSeen = device.lastHeartbeat ? formatTime(device.lastHeartbeat) : 'Never';
            
            const ownerInfo = device.systemAdminId ? 
                `<span class="badge badge-info" style="font-size: 0.65rem;" title="Group: ${escapeHtml(device.groupId || '')}">SysAdmin</span>` :
                `<span class="badge badge-safe" style="font-size: 0.65rem;">User</span>`;

            const tagsBadges = device.tags && device.tags.length > 0
                ? device.tags.map(t => `<span class="badge" style="background:var(--zinc-200);color:var(--zinc-700);font-size:0.65rem;">${escapeHtml(t)}</span>`).join(' ')
                : '';

            return `
                <tr>
                    <td style="font-weight: 600;">${escapeHtml(device.deviceName)}${tagsBadges ? '<div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap;">' + tagsBadges + '</div>' : ''}</td>
                    <td style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${device.deviceId.substring(0, 16)}...</td>
                    <td>${ownerInfo}</td>
                    <td>${statusBadge}</td>
                    <td>${lockBadge}</td>
                    <td>${securityBadges}</td>
                    <td>${lastSeen}</td>
                    <td>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${device.armed ? 
                                `<button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" onclick="toggleDevice('${device.deviceId}', false)"><i data-lucide="unlock" size="12"></i></button>` :
                                `<button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem;" onclick="toggleDevice('${device.deviceId}', true)"><i data-lucide="lock" size="12"></i></button>`
                            }
                            <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem;" onclick="showDeviceDetails('${device.deviceId}')"><i data-lucide="info" size="12"></i></button>
                            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="openAssignDeviceModal('${device.deviceId}')" title="Add to Group"><i data-lucide="users" size="12"></i></button>
                            <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem;" onclick="editDevice('${device.deviceId}', '${escapeHtml(device.deviceName)}')"><i data-lucide="edit" size="12"></i></button>
                            ${device.quarantined ?
                                `<button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" onclick="releaseQuarantine('${device.deviceId}')"><i data-lucide="shield-check" size="12"></i></button>` :
                                `<button class="btn btn-warn" style="padding: 6px 12px; font-size: 0.75rem;" onclick="quarantineDeviceDirect('${device.deviceId}', '${escapeHtml(device.deviceName)}')"><i data-lucide="shield-alert" size="12"></i></button>`
                            }
                            <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem; color: var(--status-danger);" onclick="deleteDevice('${device.deviceId}', '${escapeHtml(device.deviceName)}')"><i data-lucide="trash-2" size="12"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        updateQuarantineView(data.devices.filter(d => d.quarantined));
        lucide.createIcons();
    } catch (error) {
        console.error('Devices error:', error);
        showToast('Error', 'Failed to load devices', 'error');
    }
}
function updateQuarantineView(quarantinedDevices) {
    const qList = document.getElementById('quarantineList');
    if (!qList) return;
    
    if (quarantinedDevices.length === 0) {
        qList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No quarantined devices</div>';
        return;
    }
    
    qList.innerHTML = quarantinedDevices.map(device => `
        <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid var(--status-danger);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(device.deviceName)}</div>
                    <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500); margin-bottom: 8px;">${device.deviceId}</div>
                    <div style="font-size: 0.85rem; color: var(--zinc-600);">
                        Breaches: ${device.breachCount || 0} | 
                        Status: ${device.armed ? 'Locked' : 'Unlocked'} |
                        ${device.online ? 'Online' : 'Offline'}
                    </div>
                </div>
                <button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" onclick="releaseQuarantine('${device.deviceId}')">
                    <i data-lucide="shield-check" size="12"></i> Release
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

async function loadUsers() {
    try {
        const data = await apiCall('/api/admin/users');
        const tbody = document.querySelector('#usersTable tbody');
        
        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--zinc-400);">No master keys found</td></tr>';
            return;
        }

        tbody.innerHTML = data.users.map(user => {
            const statusBadge = user.revoked ?
                '<span class="badge badge-danger">Revoked</span>' :
                '<span class="badge badge-safe">Active</span>';
            
            const ownerBadge = user.systemAdminId ?
                `<span class="badge badge-info" title="Managed by System Admin">SysAdmin</span>` :
                `<span class="badge badge-safe" title="Independent User">User</span>`;

            const groupDisplay = user.groupName && user.groupName !== 'No Group'
                ? `<span style="font-size:0.8rem;color:var(--zinc-600);">${escapeHtml(user.groupName)}</span>`
                : '<span style="color:var(--zinc-400);font-size:0.8rem;">—</span>';

            // Calculate counts from devices array
            const armedCount = user.devices ? user.devices.filter(d => d.armed).length : 0;
            const onlineCount = 0; // Not currently tracked
            const quarantinedCount = user.devices ? user.devices.filter(d => d.quarantined).length : 0;

            return `
                <tr>
                    <td style="font-family: var(--mono); font-size: 0.8rem;">${user.keyHash.substring(0, 16)}...</td>
                    <td>${ownerBadge}</td>
                    <td>${groupDisplay}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>${formatTime(user.lastUsed)}</td>
                    <td><span class="badge badge-info">${user.uses || 0}</span></td>
                    <td><span class="badge badge-info">${user.deviceCount}</span></td>
                    <td><span class="badge badge-${armedCount > 0 ? 'danger' : 'safe'}">${armedCount}</span></td>
                    <td><span class="badge badge-${onlineCount > 0 ? 'safe' : 'warn'}">${onlineCount}</span></td>
                    <td><span class="badge badge-${quarantinedCount > 0 ? 'danger' : 'safe'}">${quarantinedCount}</span></td>
                    <td>${statusBadge}${user.revokedAt ? `<div style="font-size:0.7rem;color:var(--zinc-400);margin-top:2px;">${formatTime(user.revokedAt)}</div>` : ''}</td>
                    <td>
                        ${!user.revoked ? 
                            `<button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem;" onclick="revokeKey('${user.keyHash}')"><i data-lucide="x-circle" size="12"></i> Revoke</button>` :
                            '<span style="color: var(--zinc-400); font-size: 0.75rem;">Revoked</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Users error:', error);
        showToast('Error', 'Failed to load users', 'error');
    }
}

async function loadActivity() {
    try {
        const filter = document.getElementById('activityFilter')?.value || '';
        const data = await apiCall(`/api/admin/activity?limit=100${filter ? '&type=' + filter : ''}`);
        const timeline = document.getElementById('activityTimeline');
        
        if (!data.logs || data.logs.length === 0) {
            timeline.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No activity logs found</div>';
            return;
        }

        timeline.innerHTML = data.logs.map(log => `
            <div class="activity-item">
                <div style="font-size: 0.75rem; color: var(--zinc-400); margin-bottom: 4px;">${new Date(log.timestamp).toLocaleString()}</div>
                <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(log.description)}</div>
                <div style="font-size: 0.85rem; color: var(--zinc-500);">
                    Type: <span class="badge badge-info">${log.type}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Activity error:', error);
    }
}

async function loadBreaches() {
    try {
        const data = await apiCall('/api/admin/breaches');
        const list = document.getElementById('breachesList');
        
        if (!data.breaches || data.breaches.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No security breaches detected</div>';
            return;
        }

        list.innerHTML = data.breaches.map(breach => `
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
                                ${b.type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--zinc-600);">${b.details}</div>
                            <div style="font-size: 0.7rem; color: var(--zinc-400); margin-top: 4px;">
                                Severity: <span class="badge badge-${b.severity === 'critical' ? 'danger' : 'warn'}">${b.severity}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Breaches error:', error);
    }
}

async function loadBlockedIPs() {
    try {
        // ✅ CORRECTED: Use the actual server endpoint
        const data = await apiCall('/api/admin/blocked-ips');
        const list = document.getElementById('blockedIPsList');
        const failedList = document.getElementById('failedAttemptsList');
        
        // ✅ CORRECTED: Server returns { success: true, blockedIPs: [...] }
        const blockedIPs = data.blockedIPs || [];
        
        if (blockedIPs.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No blocked IPs</div>';
        } else {
            list.innerHTML = blockedIPs.map(ipData => {
                // Handle both formats: string "192.168.1.1" or object { ip: "...", reason: "...", blockedAt: ... }
                const ip = typeof ipData === 'string' ? ipData : ipData.ip;
                const reason = typeof ipData === 'object' ? ipData.reason : 'Suspicious activity';
                const blockedAt = typeof ipData === 'object' && ipData.blockedAt 
                    ? new Date(ipData.blockedAt).toLocaleString() 
                    : 'Unknown';
                
                return `
                    <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid var(--status-danger);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-family: var(--mono); font-weight: 700; margin-bottom: 4px;">${ip}</div>
                                <div style="font-size: 0.75rem; color: var(--zinc-500);">
                                    Reason: ${escapeHtml(reason)}<br>
                                    Blocked: ${blockedAt}
                                </div>
                            </div>
                            <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem;" onclick="unblockIPDirect('${ip}')">
                                <i data-lucide="unlock" size="12"></i> Unblock
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Failed attempts list (if your server supports it in the future)
        if (failedList) {
            // For now, show empty state since server doesn't return failed attempts
            failedList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">Failed attempts tracking coming soon</div>';
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Blocked IPs error:', error);
        showToast('Error', 'Failed to load blocked IPs', 'error');
    }
}

async function loadSessions() {
    try {
        const data = await apiCall('/api/admin/sessions');
        const list = document.getElementById('sessionsList');
        
        if (!data.sessions || data.sessions.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No active sessions</div>';
            return;
        }

        list.innerHTML = data.sessions.map(session => {
            const isActive = (Date.now() - session.lastActive) < 3600000;
            return `
                <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-family: var(--mono); font-weight: 700; margin-bottom: 4px;">${escapeHtml(session.email || session.systemAdminId)}</div>
                            <div style="font-size: 0.85rem; color: var(--zinc-600);">
                                Admin ID: ${escapeHtml(session.systemAdminId)}<br>
                                Last Active: ${formatTime(session.lastActive)}
                            </div>
                        </div>
                        <span class="badge badge-${isActive ? 'safe' : 'warn'}">${isActive ? 'Active' : 'Idle'}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Sessions error:', error);
    }
}

// ========== GEOFENCING FUNCTIONS ==========
async function loadGeofences() {
    try {
        const data = await apiCall('/api/admin/geofences');
        const list = document.getElementById('geofencesList');
        
        if (!data.geofences || data.geofences.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No geofences configured</div>';
            
            if (ownerGeofenceMap && ownerGeofenceCircles.length > 0) {
                ownerGeofenceCircles.forEach(circle => circle.remove());
                ownerGeofenceCircles = [];
            }
            return;
        }

        if (!ownerGeofenceMapInitialized) {
            ownerGeofenceMap = initializeOwnerMap('ownerGeofenceMap', data.geofences[0].lat, data.geofences[0].lon, 10);
            ownerGeofenceMapInitialized = true;
            
            ownerGeofenceMap.on('click', function(e) {
                document.getElementById('geofenceLat').value = e.latlng.lat.toFixed(6);
                document.getElementById('geofenceLon').value = e.latlng.lng.toFixed(6);
                
                L.circle([e.latlng.lat, e.latlng.lng], {
                    radius: parseInt(document.getElementById('geofenceRadius').value) || 1000,
                    color: '#3b82f6',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5'
                }).addTo(ownerGeofenceMap).bindPopup('New geofence location (preview)').openPopup();
            });
        }
        
        ownerGeofenceCircles.forEach(circle => circle.remove());
        ownerGeofenceCircles = [];
        
        const bounds = [];

        list.innerHTML = data.geofences.map(geo => {
            const circleColor = geo.enabled ? '#10b981' : '#f59e0b';
            const circle = L.circle([geo.lat, geo.lon], {
                radius: geo.radius,
                color: circleColor,
                fillColor: circleColor,
                fillOpacity: 0.15,
                weight: 3
            }).addTo(ownerGeofenceMap);
            
            const marker = L.marker([geo.lat, geo.lon], {
                icon: L.divIcon({
                    className: 'geofence-marker',
                    html: `<div style="background: ${circleColor}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(ownerGeofenceMap);
            
            const popupContent = `
                <div style="min-width: 180px;">
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(geo.deviceName)}</div>
                    <div style="font-family: monospace; font-size: 0.7rem; color: #71717a; margin-bottom: 6px;">${geo.deviceId}</div>
                    <div style="font-size: 0.8rem; margin-bottom: 4px;"><strong>Radius:</strong> ${geo.radius}m</div>
                    <div style="font-size: 0.8rem;"><strong>Status:</strong> ${geo.enabled ? '<span style="color: #10b981;">● Active</span>' : '<span style="color: #f59e0b;">● Disabled</span>'}</div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            circle.bindPopup(popupContent);
            
            ownerGeofenceCircles.push(circle);
            ownerGeofenceCircles.push(marker);
            bounds.push([geo.lat, geo.lon]);
            
            return `
                <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid ${circleColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(geo.deviceName)}</div>
                            <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${geo.deviceId}</div>
                        </div>
                        <span class="badge badge-${geo.enabled ? 'safe' : 'warn'}">${geo.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                    <div style="background: white; padding: 12px; border-radius: 8px; border: var(--border); margin-bottom: 12px;">
                        <div class="coordinates-display">
                            📍 Center: ${geo.lat.toFixed(6)}, ${geo.lon.toFixed(6)}<br>
                            📏 Radius: ${geo.radius} meters
                        </div>
                        ${geo.createdBy ? `<div style="font-size:0.75rem;color:var(--zinc-500);margin-top:6px;">Created by: ${escapeHtml(geo.createdBy)}${geo.createdAt ? ' · ' + formatTime(geo.createdAt) : ''}</div>` : ''}
                    </div>
                    <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem; width: 100%;" onclick="removeGeofence('${geo.deviceId}')">
                        <i data-lucide="trash-2" size="12"></i> Remove Geofence
                    </button>
                </div>
            `;
        }).join('');
        
        if (bounds.length > 0 && ownerGeofenceMap) {
            ownerGeofenceMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Geofences error:', error);
        showToast('Error', 'Failed to load geofences', 'error');
    }
}

async function createNewGeofence(event) {
    event.preventDefault();
    
    const deviceId = document.getElementById('geofenceDeviceId').value.trim();
    const lat = parseFloat(document.getElementById('geofenceLat').value);
    const lon = parseFloat(document.getElementById('geofenceLon').value);
    const radius = parseInt(document.getElementById('geofenceRadius').value);

    if (!deviceId) {
        showToast('Error', 'Please enter a device ID', 'error');
        return;
    }

    if (isNaN(lat) || isNaN(lon)) {
        showToast('Error', 'Invalid coordinates', 'error');
        return;
    }

    if (isNaN(radius) || radius < 10 || radius > 100000) {
        showToast('Error', 'Radius must be between 10 and 100,000 meters', 'error');
        return;
    }

    try {
        await apiCall('/api/admin/geofence', 'POST', {
            deviceId,
            lat,
            lon,
            radius
        });

        showToast('Success', 'Geofence created successfully', 'success');
        logTerminal(`Geofence created for device ${deviceId.substring(0, 8)}...`, 'info');
        
        document.getElementById('createGeofenceForm').reset();
        
        await loadGeofences();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function removeGeofence(deviceId) {
    if (!confirm('Remove geofence for this device?\n\nThe device will no longer be restricted by location.')) return;

    try {
        await apiCall('/api/admin/geofence', 'DELETE', { deviceId });
        
        showToast('Success', 'Geofence removed successfully', 'success');
        logTerminal(`Geofence removed for device ${deviceId.substring(0, 8)}...`, 'info');
        
        await loadGeofences();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// ========== MAP FUNCTIONS ==========
function initializeOwnerMap(containerId, centerLat = 40.7128, centerLon = -74.0060, zoom = 12) {
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

function toggleOwnerMapView() {
    isOwnerMapView = !isOwnerMapView;
    const mapView = document.getElementById('ownerLocationsMapView');
    const listView = document.getElementById('ownerLocationsListView');
    const toggleBtn = document.getElementById('ownerMapViewToggleText');
    
    if (isOwnerMapView) {
        mapView.style.display = 'block';
        listView.style.display = 'none';
        toggleBtn.textContent = 'Show List';
        
        if (!ownerLocationsMapInitialized) {
            ownerLocationsMap = initializeOwnerMap('ownerLocationsMap', 40.7128, -74.0060, 4);
            ownerLocationsMapInitialized = true;
        }
        
        loadLocations();
    } else {
        mapView.style.display = 'none';
        listView.style.display = 'block';
        toggleBtn.textContent = 'Show Map';
    }
    
    lucide.createIcons();
}

// ========== LOCATION TRACKING ==========
async function loadLocations() {
    try {
        const data = await apiCall('/api/admin/locations');
        const list = document.getElementById('locationsList');
        
        if (!data.locations || data.locations.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No location data available</div>';
            
            if (ownerLocationsMap && ownerLocationMarkers.length > 0) {
                ownerLocationMarkers.forEach(marker => marker.remove());
                ownerLocationMarkers = [];
            }
            return;
        }

        list.innerHTML = data.locations.map(loc => {
            const timeDiff = Date.now() - new Date(loc.timestamp).getTime();
            const isRecent = timeDiff < 10000;
            
            return `
                <div class="location-feed-item" style="border-left-color: ${isRecent ? 'var(--status-safe)' : 'var(--status-info)'};">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(loc.deviceName)}</div>
                            <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${loc.deviceId}</div>
                        </div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                            ${isRecent ? '<span class="badge badge-safe"><i data-lucide="radio" size="10"></i> LIVE</span>' : ''}
                            ${loc.armed ? '<span class="badge badge-armed"><i data-lucide="lock" size="10"></i> Armed</span>' : ''}
                            ${loc.quarantined ? '<span class="badge badge-danger"><i data-lucide="shield-alert" size="10"></i> Quarantine</span>' : ''}
                            ${loc.geofenced ? '<span class="badge badge-info"><i data-lucide="map-pin" size="10"></i> Geofenced</span>' : ''}
                        </div>
                    </div>
                    <div class="coordinates-display">
                        📍 ${loc.location.lat.toFixed(6)}, ${loc.location.lon.toFixed(6)}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--zinc-400); margin-top: 8px;">
                        Last updated: ${formatTime(loc.timestamp)}
                    </div>
                </div>
            `;
        }).join('');
        
        if (ownerLocationsMap && isOwnerMapView) {
            ownerLocationMarkers.forEach(marker => marker.remove());
            ownerLocationMarkers = [];
            
            const bounds = [];
            data.locations.forEach(loc => {
                const timeDiff = Date.now() - new Date(loc.timestamp).getTime();
                const isRecent = timeDiff < 10000;
                const markerColor = isRecent ? '#10b981' : '#06b6d4';
                
                const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${markerColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                    popupAnchor: [0, -24]
                });
                
                const marker = L.marker([loc.location.lat, loc.location.lon], { icon: customIcon }).addTo(ownerLocationsMap);
                
                const popupContent = `
                    <div style="min-width: 200px;">
                        <div style="font-weight: 700; margin-bottom: 6px; font-size: 0.95rem;">${escapeHtml(loc.deviceName)}</div>
                        <div style="font-family: monospace; font-size: 0.75rem; color: #71717a; margin-bottom: 8px;">${loc.deviceId}</div>
                        <div style="background: #f4f4f5; padding: 8px; border-radius: 6px; margin-bottom: 8px; font-size: 0.8rem;">
                            <strong>📍 Coordinates:</strong><br>
                            ${loc.location.lat.toFixed(6)}, ${loc.location.lon.toFixed(6)}
                        </div>
                        <div style="font-size: 0.75rem; color: #71717a; margin-bottom: 6px;">
                            <strong>Status:</strong> ${isRecent ? '<span style="color: #10b981;">● LIVE</span>' : '<span style="color: #06b6d4;">● Recent</span>'}
                        </div>
                        ${loc.geofenced ? '<div style="font-size: 0.75rem; color: #06b6d4;">🔒 Geofenced</div>' : ''}
                        <div style="font-size: 0.7rem; color: #a1a1aa; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e4e4e7;">
                            Last updated: ${formatTime(loc.timestamp)}
                        </div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                ownerLocationMarkers.push(marker);
                bounds.push([loc.location.lat, loc.location.lon]);
            });
            
            if (bounds.length > 0) {
                ownerLocationsMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Locations error:', error);
        showToast('Error', 'Failed to load locations', 'error');
    }
}

async function loadNotifications() {
    try {
        const data = await apiCall('/api/admin/notifications');
        const list = document.getElementById('notificationsList');
        
        if (!data.notifications || data.notifications.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No notifications</div>';
            return;
        }

        list.innerHTML = data.notifications.map(notif => {
            const severityColor = {
                'info': 'var(--status-info)',
                'success': 'var(--status-safe)',
                'warning': 'var(--status-warn)',
                'high': 'var(--status-danger)',
                'critical': 'var(--status-danger)'
            }[notif.severity] || 'var(--zinc-500)';

            const title = notif.deviceName || notif.type || 'Notification';
            const message = notif.details || '';

            return `
                <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid ${severityColor};">
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(title)}</div>
                    <div style="font-size: 0.85rem; color: var(--zinc-600); margin-bottom: 8px;">${escapeHtml(message)}</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="badge badge-info" style="font-size: 0.7rem;">${notif.type || 'event'}</span>
                        <span style="font-size: 0.7rem; color: var(--zinc-400);">${new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Notifications error:', error);
    }
}

async function loadAudit() {
    try {
        const filter = document.getElementById('auditFilter')?.value || '';
        const data = await apiCall(`/api/admin/audit?limit=100${filter ? '&action=' + filter : ''}`);
        const tbody = document.querySelector('#auditTable tbody');
        
        const filterSelect = document.getElementById('auditFilter');
        if (filterSelect && filterSelect.options.length === 1 && data.actions) {
            data.actions.forEach(action => {
                const option = document.createElement('option');
                option.value = action;
                option.textContent = action.replace(/_/g, ' ').toUpperCase();
                filterSelect.appendChild(option);
            });
        }
        
        if (!data.logs || data.logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--zinc-400);">No audit entries</td></tr>';
            return;
        }

        tbody.innerHTML = data.logs.map(entry => `
            <tr>
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                <td><span class="badge badge-info">${entry.action}</span></td>
                <td style="font-family: var(--mono); font-size: 0.75rem;">${entry.actor.substring(0, 12)}...</td>
                <td style="font-family: var(--mono); font-size: 0.75rem;">${entry.target.substring(0, 12)}...</td>
                <td style="font-size: 0.8rem;">${JSON.stringify(entry.details).substring(0, 100)}...</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Audit error:', error);
    }
}

async function loadSettings() {
    try {
        const data = await apiCall('/api/admin/settings');
        const form = document.getElementById('settingsForm');
        
        if (!data.settings) return;

        let html = '<form onsubmit="saveSettings(event)">';
        
        for (const [key, value] of Object.entries(data.settings)) {
            if (data.editable && !data.editable.includes(key)) continue;
            
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            html += '<div class="field-group">';
            html += `<label class="field-label">${label}</label>`;
            
            if (typeof value === 'boolean') {
                html += `<select class="input-control" name="${key}">
                    <option value="true" ${value ? 'selected' : ''}>Enabled</option>
                    <option value="false" ${!value ? 'selected' : ''}>Disabled</option>
                </select>`;
            } else if (typeof value === 'number') {
                html += `<input type="number" class="input-control" name="${key}" value="${value}">`;
            } else {
                html += `<input type="text" class="input-control" name="${key}" value="${value}">`;
            }
            
            html += '</div>';
        }
        
        html += '<button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;"><i data-lucide="save" size="16"></i> Save Settings</button>';
        html += '</form>';
        
        form.innerHTML = html;
        lucide.createIcons();
    } catch (error) {
        console.error('Settings error:', error);
    }
}

async function saveSettings(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const settings = {};
    
    for (const [key, value] of formData.entries()) {
        if (value === 'true') settings[key] = true;
        else if (value === 'false') settings[key] = false;
        else if (!isNaN(value)) settings[key] = Number(value);
        else settings[key] = value;
    }

    try {
        await apiCall('/api/admin/settings', 'PATCH', settings);
        showToast('Success', 'Settings updated successfully', 'success');
        logTerminal('System settings updated', 'info');
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// ========== SYSTEM ADMIN OPERATIONS ==========
async function handleCreateSystemAdmin(event) {
    event.preventDefault();
    
    const groupName = document.getElementById('groupNameInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    
    if (!groupName) {
        showToast('Error', 'Group Name is required', 'error');
        return;
    }
    
    if (!name || !email) {
        showToast('Error', 'Name and Email are required', 'error');
        return;
    }
    
    try {
        const data = await apiCall('/api/admin/system-admins/create', 'POST', { groupName, name, email });
        
        if (data.success) {
            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(data.code);
                showToast('Copied', 'Registration code copied to clipboard', 'success');
            } catch (e) {
                console.log('Clipboard not available');
            }
            
            // Show beautiful modal
            showRegistrationCodeModal(data);
            
            // Clear form
            document.getElementById('groupNameInput').value = '';
            document.getElementById('nameInput').value = '';
            document.getElementById('emailInput').value = '';
            
            // Reload to show new code
            await loadSystemAdmins();
        }
    } catch (error) {
        showToast('Error', error.message || 'Failed to create system admin', 'error');
    }
}

function showRegistrationCodeModal(data) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; 
        justify-content: center; z-index: 10000; animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 40px; max-width: 600px; 
                    width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669);
                           border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                           margin: 0 auto 20px;">
                    <i data-lucide="check-circle" style="color: white;" size="40"></i>
                </div>
                <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 10px;">System Admin Created!</h2>
                <p style="color: #71717a;">Registration code generated successfully</p>
            </div>
            
            <div style="background: #f4f4f5; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 0.75rem; font-weight: 800; color: #a1a1aa; 
                               text-transform: uppercase; margin-bottom: 5px;">Registration Code</div>
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; 
                               font-weight: 700; letter-spacing: 3px; color: #3b82f6; 
                               user-select: all; cursor: pointer;"
                         onclick="navigator.clipboard.writeText('${data.code}'); 
                                  showToast('Copied', 'Code copied!', 'success');">
                        ${data.code}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; font-size: 0.9rem;">
                    <strong>Group:</strong><span>${escapeHtml(data.groupName)}</span>
                    <strong>Name:</strong><span>${escapeHtml(data.name)}</span>
                    <strong>Email:</strong><span>${escapeHtml(data.email)}</span>
                    <strong>Expires:</strong><span>${new Date(data.expiresAt).toLocaleString()}</span>
                </div>
            </div>
            
            <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; 
                       padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; align-items: start;">
                    <i data-lucide="info" style="color: #3b82f6; flex-shrink: 0;" size="20"></i>
                    <div style="font-size: 0.85rem; color: #1e40af;">
                        Share this code with the system administrator to complete registration.
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="navigator.clipboard.writeText('${data.code}'); 
                               showToast('Copied', 'Code copied!', 'success');" 
                        style="flex: 1; padding: 12px 24px; background: #3b82f6; color: white; 
                               border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    📋 Copy Code
                </button>
                <button onclick="this.closest('div').parentElement.parentElement.remove()" 
                        style="flex: 1; padding: 12px 24px; background: #f4f4f5; color: #18181b; 
                               border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function deactivateSystemAdmin(adminId, adminName) {
    if (!confirm(`Deactivate system administrator "${adminName}"?\n\nThis will prevent them from accessing the system.`)) return;

    try {
        await apiCall(`/api/admin/system-admins/${adminId}/deactivate`, 'POST');
        
        showToast('Success', 'System administrator deactivated', 'success');
        logTerminal(`System admin ${adminName} deactivated`, 'warn');
        await loadSystemAdmins();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function activateSystemAdmin(adminId, adminName) {
    if (!confirm(`Activate system administrator "${adminName}"?`)) return;

    try {
        await apiCall(`/api/admin/system-admins/${adminId}/activate`, 'POST');
        
        showToast('Success', 'System administrator activated', 'success');
        logTerminal(`System admin ${adminName} activated`, 'info');
        await loadSystemAdmins();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// FIXED: Added missing createSystemAdmin function
async function createSystemAdmin(event) {
    event.preventDefault();
    
    const groupName = document.getElementById('newAdminGroupName').value.trim();
    const name = document.getElementById('newAdminName').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    
    if (!groupName || !name) {
        showToast('Error', 'Group name and administrator name are required', 'error');
        return;
    }
    
    try {
        // Generate unique IDs for the new system admin
        const systemAdminId = 'SA_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const groupId = 'GRP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        
        const response = await apiCall('/api/admin/registration-code', 'POST', {
            systemAdminId,
            groupId,
            groupName,
            name,
            email: email || undefined
        });
        
        showToast('Success', 'Registration code generated successfully!', 'success');
        logTerminal(`Registration code generated for ${name} (${groupName})`, 'success');
        
        // Clear the form
        document.getElementById('createAdminForm').reset();
        
        // Reload registration codes to show the new one
        await loadRegistrationCodes();
        await loadStats();
        
    } catch (error) {
        console.error('Create system admin error:', error);
        showToast('Error', error.message || 'Failed to generate registration code', 'error');
    }
}

async function deleteSystemAdmin(adminId, adminName) {
    if (!confirm(`DELETE system administrator "${adminName}"?\n\nThis will also delete all their users and devices. This action cannot be undone.`)) return;

    const confirmation = prompt(`Type "${adminName}" to confirm deletion:`);
    if (confirmation !== adminName) {
        showToast('Error', 'Deletion cancelled - name did not match', 'error');
        return;
    }

    try {
        // FIXED: Changed from /api/admin/system-admins/ to /api/admin/system-admin/ to match backend route
        await apiCall(`/api/admin/system-admin/${adminId}`, 'DELETE');
        
        showToast('Success', 'System administrator deleted', 'success');
        logTerminal(`System admin ${adminName} and all associated data deleted`, 'error');
        await loadSystemAdmins();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function showAdminDetails(adminId) {
    try {
        const data = await apiCall('/api/admin/system-admins');
        const admin = data.systemAdmins.find(a => a.systemAdminId === adminId);
        
        if (!admin) {
            showToast('Error', 'System administrator not found', 'error');
            return;
        }

        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(admin.name)}</h3>
                <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${admin.systemAdminId}</div>
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Information</div>
                <div style="font-size: 0.85rem; line-height: 1.8;">
                    Group: ${escapeHtml(admin.groupName || 'N/A')}<br>
                    Email: ${escapeHtml(admin.email || 'N/A')}<br>
                    Status: ${admin.active ? '✅ Active' : '❌ Inactive'}<br>
                    Created: ${new Date(admin.createdAt).toLocaleString()}<br>
                    Last Active: ${formatTime(admin.lastActive)}<br>
                </div>
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Statistics</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                    <div>Total Devices: ${admin.devicesManaged || 0}</div>
                    <div>Total Users: ${admin.usersManaged || 0}</div>
                </div>
            </div>
        `;

        document.getElementById('adminDetailsContent').innerHTML = html;
        document.getElementById('adminDetailsModal').classList.add('active');
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

function closeAdminDetails() {
    document.getElementById('adminDetailsModal').classList.remove('active');
}


// ========== DEVICE OPERATIONS ==========
async function toggleDevice(deviceId, shouldArm) {
    const action = shouldArm ? 'arm' : 'disarm';
    const reason = prompt(`Reason for ${action}ing device:`, `Owner ${action}`);
    if (!reason) return;

    try {
        await apiCall(`/api/admin/device/${action}`, 'POST', { deviceId, reason });
        showToast('Success', `Device ${action}ed successfully`, 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... ${action}ed`, shouldArm ? 'warn' : 'success');
        await loadDevices();
        await loadStats();
    } catch (error) {
        console.error(`${action} error:`, error);
        showToast('Error', error.message || `Failed to ${action} device`, 'error');
    }
}

function editDevice(deviceId, deviceName) {
    document.getElementById('editDeviceId').value = deviceId;
    document.getElementById('editDeviceName').value = deviceName;
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function saveDeviceEdit(event) {
    event.preventDefault();
    
    const deviceId = document.getElementById('editDeviceId').value;
    const deviceName = document.getElementById('editDeviceName').value.trim();

    try {
        await apiCall('/api/admin/device/update', 'PUT', { deviceId, deviceName });
        
        closeEditModal();
        showToast('Success', 'Device updated successfully', 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... updated`, 'info');
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function deleteDevice(deviceId, deviceName) {
    if (!confirm(`Delete device "${deviceName}"?\n\nThis action cannot be undone.`)) return;

    try {
        await apiCall('/api/admin/device/delete', 'DELETE', { deviceId });
        
        showToast('Success', 'Device deleted successfully', 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... deleted`, 'warn');
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function showDeviceDetails(deviceId) {
    try {
        const data = await apiCall('/api/admin/devices');
        const device = data.devices.find(d => d.deviceId === deviceId);
        
        if (!device) {
            showToast('Error', 'Device not found', 'error');
            return;
        }

        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(device.deviceName)}</h3>
                <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${device.deviceId}</div>
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Status</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                    <div>Online: ${device.online ? '✅ Yes' : '❌ No'}</div>
                    <div>Armed: ${device.armed ? '🔒 Yes' : '🔓 No'}</div>
                    <div>Quarantined: ${device.quarantined ? '⚠️ Yes' : '✅ No'}</div>
                    <div>Geofenced: ${device.geofenced ? '📍 Yes' : '❌ No'}</div>
                </div>
                ${device.armed && device.armedBy ? `<div style="margin-top:10px;font-size:0.8rem;color:var(--zinc-600);">Armed by: <strong>${escapeHtml(device.armedBy)}</strong>${device.armReason ? ` — ${escapeHtml(device.armReason)}` : ''}</div>` : ''}
                ${device.quarantined && device.quarantinedBy ? `<div style="margin-top:6px;font-size:0.8rem;color:var(--zinc-600);">Quarantined by: <strong>${escapeHtml(device.quarantinedBy)}</strong>${device.quarantineReason ? ` — ${escapeHtml(device.quarantineReason)}` : ''}</div>` : ''}
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Ownership</div>
                <div style="font-size: 0.85rem; line-height: 1.8;">
                    ${device.systemAdminId ? `System Admin ID: ${device.systemAdminId}<br>` : 'Owner Type: Independent User<br>'}
                    Master Key Hash: ${device.masterKeyHash.substring(0, 16)}...
                </div>
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Metadata</div>
                <div style="font-size: 0.85rem; line-height: 1.8;">
                    ${device.metadata?.browser ? `Browser: ${device.metadata.browser}<br>` : ''}
                    ${device.metadata?.os ? `OS: ${device.metadata.os}<br>` : ''}
                    ${device.metadata?.ip ? `IP: ${device.metadata.ip}<br>` : ''}
                    ${device.metadata?.battery ? `Battery: ${device.metadata.battery.level}% ${device.metadata.battery.charging ? '(Charging)' : ''}<br>` : ''}
                    ${device.metadata?.network ? `Network: ${device.metadata.network.type}<br>` : ''}
                </div>
            </div>
            
            ${device.lockHistory && device.lockHistory.length > 0 ? `
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Recent Lock History</div>
                ${device.lockHistory.slice(-5).map(h => `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--zinc-200); font-size: 0.85rem;">
                        <div>${h.action.toUpperCase()} by ${h.by}</div>
                        <div style="color: var(--zinc-500); font-size: 0.75rem;">${new Date(h.timestamp).toLocaleString()}</div>
                        ${h.reason ? `<div style="color: var(--zinc-600); font-size: 0.75rem;">Reason: ${h.reason}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        `;

        document.getElementById('deviceDetailsContent').innerHTML = html;
        document.getElementById('deviceDetailsModal').classList.add('active');
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

function closeDeviceDetails() {
    document.getElementById('deviceDetailsModal').classList.remove('active');
}

// ========== BULK OPERATIONS ==========
async function armAllDevices() {
    const reason = document.getElementById('armAllReason')?.value || 'Owner bulk lock';
    
    if (!confirm(`Lock ALL devices in the system?\n\nReason: ${reason}\n\nThis will immediately activate the lockdown screen on all devices.`)) return;

    try {
        const data = await apiCall('/api/admin/devices/arm-all', 'POST', { reason });
        
        // Server returns 'armed' not 'armedCount'
        const count = data.armed || 0;
        showToast('Success', `${count} devices locked`, 'success');
        logTerminal(`Bulk operation: Armed ${count} devices`, 'warn');
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function disarmAllDevices() {
    const reason = document.getElementById('disarmAllReason')?.value || 'Owner bulk unlock';
    
    if (!confirm(`Unlock ALL devices in the system?\n\nReason: ${reason}\n\nThis will release all active locks.`)) return;

    try {
        const data = await apiCall('/api/admin/devices/disarm-all', 'POST', { reason });
        
        // Server returns 'disarmed' not 'disarmedCount'
        const count = data.disarmed || 0;
        showToast('Success', `${count} devices unlocked`, 'success');
        logTerminal(`Bulk operation: Disarmed ${count} devices`, 'success');
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// ========== QUARANTINE OPERATIONS ==========
async function quarantineDevice() {
    const deviceId = document.getElementById('quarantineDeviceId').value.trim();
    const reason = document.getElementById('quarantineReason').value.trim() || 'Owner quarantine';

    if (!deviceId) {
        showToast('Error', 'Please enter a device ID', 'error');
        return;
    }

    try {
        await apiCall('/api/admin/device/quarantine', 'POST', { deviceId, reason });
        showToast('Success', 'Device quarantined', 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... quarantined`, 'warn');
        
        document.getElementById('quarantineDeviceId').value = '';
        document.getElementById('quarantineReason').value = '';
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function quarantineDeviceDirect(deviceId, deviceName) {
    const reason = prompt(`Quarantine "${deviceName}"?\n\nEnter reason:`, 'Security concern');
    if (!reason) return;

    try {
        await apiCall('/api/admin/device/quarantine', 'POST', { deviceId, reason });
        showToast('Success', 'Device quarantined', 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... quarantined`, 'warn');
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function releaseQuarantine(deviceId) {
    if (!confirm('Release this device from quarantine?')) return;

    try {
        // Use correct POST endpoint
        await apiCall(`/api/admin/device/${deviceId}/release`, 'POST');
        showToast('Success', 'Device released from quarantine', 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... released from quarantine`, 'info');
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// ========== IP OPERATIONS ==========
async function unblockIP() {
    const ip = document.getElementById('unblockIPInput').value.trim();
    if (!ip) {
        showToast('Error', 'Please enter an IP address', 'error');
        return;
    }

    try {
        await apiCall('/api/admin/unblock-ip', 'DELETE', { ip });
        
        showToast('Success', `IP ${ip} unblocked`, 'success');
        logTerminal(`IP ${ip} unblocked`, 'info');
        
        document.getElementById('unblockIPInput').value = '';
        await loadBlockedIPs();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function unblockIPDirect(ip) {
    if (!confirm(`Unblock IP: ${ip}?`)) return;

    try {
        // This endpoint is already correct
        await apiCall('/api/admin/unblock-ip', 'DELETE', { ip });
        
        showToast('Success', `IP ${ip} unblocked`, 'success');
        logTerminal(`IP ${ip} unblocked`, 'info');
        await loadBlockedIPs();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function revokeKey(keyHash) {
    // Validate keyHash
    if (!keyHash || keyHash === 'undefined' || keyHash === 'null') {
        showToast('Error', 'Invalid key hash', 'error');
        console.error('Attempted to revoke invalid keyHash:', keyHash);
        return;
    }

    if (!confirm(`Revoke this API key?\n\nKey: ${keyHash.substring(0, 16)}...\n\nThis action cannot be undone.`)) return;

    try {
        // Use correct endpoint from server.js
        await apiCall('/api/admin/users/revoke', 'POST', { keyHash });
        showToast('Success', 'API key revoked successfully', 'success');
        logTerminal(`API key revoked: ${keyHash.substring(0, 12)}...`, 'warn');
        await loadUsers();
        await loadStats();
    } catch (error) {
        console.error('Revoke error:', error);
        showToast('Error', error.message || 'Failed to revoke key', 'error');
    }
}

async function clearActivityLog() {
    if (!confirm('Clear entire activity log?\n\nThis action cannot be undone.')) return;

    try {
        await apiCall('/api/admin/activity/clear', 'DELETE');
        showToast('Success', 'Activity log cleared', 'success');
        logTerminal('Activity log cleared by owner', 'warn');
        await loadActivity();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

async function exportSystemState() {
    try {
        showToast('Exporting', 'Generating system backup...', 'info');
        const response = await apiCall('/api/admin/system/export');
        
        // Server wraps data in { success: true, data: {...} }
        const exportData = response.data || response;
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `browserbricker-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Success', 'System backup downloaded successfully', 'success');
        logTerminal('System state exported', 'info');
    } catch (error) { 
        console.error('Export error:', error);
        showToast('Error', `Export failed: ${error.message}`, 'error'); 
    }
}
async function importSystemState(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("⚠️ CRITICAL WARNING ⚠️\n\n" +
                 "This will COMPLETELY OVERWRITE all current data including:\n" +
                 "• All devices\n" +
                 "• All users\n" +
                 "• All system administrators\n" +
                 "• All settings\n" +
                 "• All logs\n\n" +
                 "Are you ABSOLUTELY SURE you want to proceed?")) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            showToast('Importing', 'Restoring system state...', 'info');
            const json = JSON.parse(e.target.result);
            
            // Validate backup file
            if (!json.version) {
                throw new Error('Invalid backup file format - missing version');
            }
            
            // Use correct endpoint and send the parsed data directly
            const result = await apiCall('/api/admin/import', 'POST', json);
            
            showToast('Success', `System Restored! ${result.stats ? 
                `Imported ${result.stats.devices || 0} devices, ${result.stats.masterKeys || 0} users` : ''}`, 'success');
            logTerminal('System state imported successfully', 'success');
            
            // Reload page after successful import
            setTimeout(() => {
                showToast('Reloading', 'Refreshing page to show restored data...', 'info');
                location.reload();
            }, 2000);
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error', `Restoration failed: ${error.message}`, 'error');
        } finally {
            event.target.value = ''; // Reset file input
        }
    };
    
    reader.onerror = () => {
        showToast('Error', 'Failed to read file', 'error');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}
// ========== UI UTILITIES ==========
function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    const targetView = document.getElementById('view-' + viewId);
    if (targetView) targetView.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.onclick && item.onclick.toString().includes(viewId)) {
            item.classList.add('active');
        }
    });

    logTerminal(`Switched to ${viewId} view`, 'info');
    
    // Load data for specific views
    if (viewId === 'system-admins') loadSystemAdmins();
    if (viewId === 'devices') loadDevices();
    if (viewId === 'users') loadUsers();
    if (viewId === 'activity') loadActivity();
    if (viewId === 'quarantine') loadDevices();
    if (viewId === 'breaches') loadBreaches();
    if (viewId === 'blocked-ips') loadBlockedIPs();
    if (viewId === 'sessions') loadSessions();
    if (viewId === 'groups') loadGroups();
    if (viewId === 'policies') loadPolicies();
    if (viewId === 'geofencing') {
        loadGeofences();
        setTimeout(() => {
            if (ownerGeofenceMap) {
                ownerGeofenceMap.invalidateSize();
            }
        }, 100);
    }
    if (viewId === 'locations') {
        loadLocations();
        setTimeout(() => {
            if (ownerLocationsMap && isOwnerMapView) {
                ownerLocationsMap.invalidateSize();
            }
        }, 100);
    }
    if (viewId === 'notifications') loadNotifications();
    if (viewId === 'audit') loadAudit();
    if (viewId === 'settings') loadSettings();
    
    lucide.createIcons();
}

async function refreshAllData() {
    showToast('Refreshing', 'Updating all data...', 'info');
    await loadStats();
    await loadSystemAdmins();
    await loadDevices();
    await loadUsers();
    await loadActivity();
    showToast('Success', 'All data refreshed', 'success');
}

function showToast(title, msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-circle' : 'info';
    const accent = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

    toast.style.cssText = `
        background: white; border: 1px solid rgba(0,0,0,0.1); padding: 16px 20px;
        border-radius: 16px; margin-top: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        display: flex; gap: 15px; align-items: center; pointer-events: auto;
        animation: toastIn 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards; min-width: 300px;
    `;

    toast.innerHTML = `
        <div style="color: ${accent}"><i data-lucide="${icon}"></i></div>
        <div>
            <div style="font-weight: 800; font-size: 0.9rem;">${title}</div>
            <div style="font-size: 0.8rem; color: #71717a; margin-top: 2px;">${msg}</div>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

function logTerminal(msg, type = 'info') {
    const term = document.getElementById('terminalLogs');
    if (!term) return;
    
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
    line.innerHTML = `[${ts}] ${msg}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

function clearTerminal() {
    const term = document.getElementById('terminalLogs');
    if (term) {
        term.innerHTML = '<div class="log-line log-info">Logs cleared.</div>';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatTime(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function formatUptime(seconds) {
    if (!seconds) return '0m';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied', 'Registration code copied to clipboard', 'success');
    }).catch(() => {
        showToast('Error', 'Failed to copy to clipboard', 'error');
    });
}

function initChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'],
            datasets: [{
                label: 'Heartbeats',
                data: [12, 19, 8, 15, 22, 18, 25],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ========== INITIALIZE ALL VIEWS ==========
function initializeAllViews() {
    const container = document.getElementById('dynamicViews');
    if (!container) return;
    
    container.innerHTML = generateAllViewsHTML();
    lucide.createIcons();
}

function generateAllViewsHTML() {
    return `
        <!-- VIEW: OVERVIEW -->
        <div id="view-overview" class="view-container active">
            ${generateOverviewHTML()}
        </div>

        <!-- VIEW: SYSTEM ADMINS -->
        <div id="view-system-admins" class="view-container">
            ${generateSystemAdminsHTML()}
        </div>

        <!-- VIEW: ALL DEVICES -->
        <div id="view-devices" class="view-container">
            ${generateDevicesHTML()}
        </div>

        <!-- VIEW: USERS -->
        <div id="view-users" class="view-container">
            ${generateUsersHTML()}
        </div>

        <!-- VIEW: ACTIVITY -->
        <div id="view-activity" class="view-container">
            ${generateActivityHTML()}
        </div>

        <!-- VIEW: BULK OPERATIONS -->
        <div id="view-bulk-ops" class="view-container">
            ${generateBulkOpsHTML()}
        </div>

        <!-- VIEW: QUARANTINE -->
        <div id="view-quarantine" class="view-container">
            ${generateQuarantineHTML()}
        </div>

        <!-- VIEW: BREACHES -->
        <div id="view-breaches" class="view-container">
            ${generateBreachesHTML()}
        </div>

        <!-- VIEW: BLOCKED IPS -->
        <div id="view-blocked-ips" class="view-container">
            ${generateBlockedIPsHTML()}
        </div>

        <!-- VIEW: SESSIONS -->
        <div id="view-sessions" class="view-container">
            ${generateSessionsHTML()}
        </div>

        <!-- VIEW: GEOFENCING -->
        <div id="view-geofencing" class="view-container">
            ${generateGeofencingHTML()}
        </div>

        <!-- VIEW: LOCATIONS -->
        <div id="view-locations" class="view-container">
            ${generateLocationsHTML()}
        </div>

        <!-- VIEW: GROUPS -->
        <div id="view-groups" class="view-container">
            ${generateGroupsHTML()}
        </div>

        <!-- VIEW: POLICIES -->
        <div id="view-policies" class="view-container">
            ${generatePoliciesHTML()}
        </div>

        <!-- VIEW: NOTIFICATIONS -->
        <div id="view-notifications" class="view-container">
            ${generateNotificationsHTML()}
        </div>

        <!-- VIEW: AUDIT -->
        <div id="view-audit" class="view-container">
            ${generateAuditHTML()}
        </div>

        <!-- VIEW: SETTINGS -->
        <div id="view-settings" class="view-container">
            ${generateSettingsHTML()}
        </div>

        <!-- VIEW: LOGS -->
        <div id="view-logs" class="view-container">
            ${generateLogsHTML()}
        </div>
    `;
}

function generateOverviewHTML() {
    return `
        <div class="session-banner">
            <div style="display: flex; align-items: center; gap: 12px;">
                <i data-lucide="crown" size="20"></i>
                <div>
                    <div style="font-weight: 700; font-size: 0.9rem;">Owner Session Active</div>
                    <div style="opacity: 0.9; font-size: 0.75rem;">Full system control granted</div>
                </div>
            </div>
            <button class="btn" style="background: rgba(255,255,255,0.2); color: white; font-size: 0.75rem; padding: 8px 14px;" onclick="refreshAllData()">
                <i data-lucide="refresh-cw" size="14"></i> Refresh
            </button>
        </div>

        <div class="quick-actions">
            <div class="quick-action-btn" onclick="switchView('system-admins')">
                <div class="quick-action-icon">
                    <i data-lucide="shield" size="24" style="color: var(--brand-primary);"></i>
                </div>
                <div style="font-weight: 700; font-size: 0.85rem;">System Admins</div>
                <div style="font-size: 0.7rem; color: var(--zinc-500); margin-top: 4px;">Manage administrators</div>
            </div>
            
            <div class="quick-action-btn" onclick="armAllDevices()">
                <div class="quick-action-icon">
                    <i data-lucide="lock" size="24" style="color: var(--status-danger);"></i>
                </div>
                <div style="font-weight: 700; font-size: 0.85rem;">Lock All Devices</div>
                <div style="font-size: 0.7rem; color: var(--zinc-500); margin-top: 4px;">Emergency lockdown</div>
            </div>
            
            <div class="quick-action-btn" onclick="disarmAllDevices()">
                <div class="quick-action-icon">
                    <i data-lucide="unlock" size="24" style="color: var(--status-safe);"></i>
                </div>
                <div style="font-weight: 700; font-size: 0.85rem;">Unlock All</div>
                <div style="font-size: 0.7rem; color: var(--zinc-500); margin-top: 4px;">Release all locks</div>
            </div>
            
            <div class="quick-action-btn" onclick="switchView('breaches')">
                <div class="quick-action-icon">
                    <i data-lucide="shield-alert" size="24" style="color: var(--status-warn);"></i>
                </div>
                <div style="font-weight: 700; font-size: 0.85rem;">Breach Monitor</div>
                <div style="font-size: 0.7rem; color: var(--zinc-500); margin-top: 4px;">Security events</div>
            </div>
            
            <div class="quick-action-btn" onclick="switchView('locations')">
                <div class="quick-action-icon">
                    <i data-lucide="map" size="24" style="color: var(--status-info);"></i>
                </div>
                <div style="font-weight: 700; font-size: 0.85rem;">Live Locations</div>
                <div style="font-size: 0.7rem; color: var(--zinc-500); margin-top: 4px;">Device tracking</div>
            </div>
        </div>

        <div class="grid-stats">
            <div class="stat-card">
                <h4>Total Devices</h4>
                <div class="stat-value" id="totalDevices">--</div>
                <div class="stat-trend trend-up">
                    <i data-lucide="arrow-up-right" size="12"></i> System Active
                </div>
            </div>
            <div class="stat-card">
                <h4>Master Keys</h4>
                <div class="stat-value" id="totalUsers">--</div>
                <div class="stat-trend trend-up">
                    <i data-lucide="users" size="12"></i> Registered Users
                </div>
            </div>
            <div class="stat-card">
                <h4>System Admins</h4>
                <div class="stat-value" id="totalSystemAdmins">--</div>
                <div class="stat-trend">
                    <i data-lucide="shield" size="12"></i> Administrators
                </div>
            </div>
            <div class="stat-card">
                <h4>Active Admins</h4>
                <div class="stat-value" style="color: var(--status-safe)" id="activeSystemAdmins">--</div>
                <div class="stat-trend trend-up">
                    <i data-lucide="check-circle" size="12"></i> Currently Active
                </div>
            </div>
            <div class="stat-card">
                <h4>Armed Devices</h4>
                <div class="stat-value" style="color: var(--status-danger)" id="armedDevices">--</div>
                <div class="stat-trend">
                    <i data-lucide="lock" size="12"></i> Currently Locked
                </div>
            </div>
            <div class="stat-card">
                <h4>Online Now</h4>
                <div class="stat-value" style="color: var(--status-safe)" id="onlineDevices">--</div>
                <div class="stat-trend trend-up">
                    <i data-lucide="wifi" size="12"></i> Active Connections
                </div>
            </div>
            <div class="stat-card">
                <h4>Quarantined</h4>
                <div class="stat-value" style="color: var(--status-warn)" id="quarantinedDevices">--</div>
                <div class="stat-trend">
                    <i data-lucide="shield-alert" size="12"></i> Security Hold
                </div>
            </div>
            <div class="stat-card">
                <h4>Geofenced</h4>
                <div class="stat-value" style="color: var(--status-info)" id="geofencedDevices">--</div>
                <div class="stat-trend">
                    <i data-lucide="map-pin" size="12"></i> Location Limited
                </div>
            </div>
            <div class="stat-card">
                <h4>Breach Attempts</h4>
                <div class="stat-value" style="color: var(--status-danger)" id="breachCount">--</div>
                <div class="stat-trend trend-down">
                    <i data-lucide="shield-off" size="12"></i> Security Events
                </div>
            </div>
            <div class="stat-card">
                <h4>Blocked IPs</h4>
                <div class="stat-value" id="blockedIPCount">--</div>
                <div class="stat-trend">
                    <i data-lucide="ban" size="12"></i> IP Protection
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="card-main">
                <h3 class="card-title"><i data-lucide="bar-chart-3"></i> System Activity</h3>
                <div class="chart-container">
                    <canvas id="activityChart"></canvas>
                </div>
            </div>

            <div class="card-main">
                <h3 class="card-title"><i data-lucide="cpu"></i> System Health</h3>
                <div>
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px;">
                            <span>Requests</span><span id="reqVal">--</span>
                        </div>
                        <div style="height: 6px; background: var(--zinc-100); border-radius: 100px; overflow: hidden;">
                            <div id="reqBar" style="width: 0%; height: 100%; background: var(--brand-primary); transition: 0.5s;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px;">
                            <span>Memory</span><span id="memVal">--</span>
                        </div>
                        <div style="height: 6px; background: var(--zinc-100); border-radius: 100px; overflow: hidden;">
                            <div id="memBar" style="width: 0%; height: 100%; background: var(--brand-primary); transition: 0.5s;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px;">
                            <span>Uptime</span><span id="uptimeVal">--</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}


function generateSystemAdminsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="shield"></i> System Administrators</h3>
                <button class="btn btn-ghost" onclick="loadSystemAdmins()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div class="table-wrapper">
                <table id="systemAdminsTable">
                    <thead>
                        <tr>
                            <th>Admin ID</th>
                            <th>Group</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Created</th>
                            <th>Last Active</th>
                            <th>Devices</th>
                            <th>Users</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="9" style="text-align: center; padding: 40px;">Loading system administrators...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
            <div class="card-main">
                <h3 class="card-title"><i data-lucide="plus-circle"></i> Create System Administrator</h3>
                <p style="color: var(--zinc-500); margin-bottom: 20px;">
                    Generate a registration code for a new system administrator. They will use this code to complete their registration.
                </p>
                <form id="createAdminForm" onsubmit="createSystemAdmin(event)">
                <div class="field-group">
    <label class="field-label">Group Name (Required)</label>
    <input type="text" id="newAdminGroupName" class="input-control" placeholder="e.g. North Division / Tech Team" required>
</div>
                    <div class="field-group">
                        <label class="field-label">Administrator Name</label>
                        <input type="text" id="newAdminName" class="input-control" placeholder="Enter full name" required>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Email (Optional)</label>
                        <input type="email" id="newAdminEmail" class="input-control" placeholder="admin@example.com">
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i data-lucide="key" size="16"></i> Generate Registration Code
                    </button>
                </form>
            </div>

            <div class="card-main">
                <h3 class="card-title"><i data-lucide="key"></i> Registration Codes</h3>
                <div id="registrationCodesList" style="max-height: 400px; overflow-y: auto;">
                    <div style="text-align: center; padding: 40px; color: var(--zinc-400);">Loading registration codes...</div>
                </div>
            </div>
        </div>
    `;
}

function generateDevicesHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="monitor"></i> All Devices</h3>
                <button class="btn btn-ghost" onclick="loadDevices()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div class="table-wrapper">
                <table id="devicesTable">
                    <thead>
                        <tr>
                            <th>Device Name</th>
                            <th>Device ID</th>
                            <th>Owner Type</th>
                            <th>Status</th>
                            <th>Lock State</th>
                            <th>Security</th>
                            <th>Last Seen</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="8" style="text-align: center; padding: 40px;">Loading devices...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateUsersHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="users"></i> Master Keys</h3>
                <button class="btn btn-ghost" onclick="loadUsers()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div class="table-wrapper">
                <table id="usersTable">
                    <thead>
                        <tr>
                            <th>Key Hash</th>
                            <th>Owner Type</th>
                            <th>Group</th>
                            <th>Created</th>
                            <th>Last Used</th>
                            <th>Total Uses</th>
                            <th>Devices</th>
                            <th>Armed</th>
                            <th>Online</th>
                            <th>Quarantined</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="11" style="text-align: center; padding: 40px;">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateActivityHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="activity"></i> Activity Log</h3>
                <div style="display: flex; gap: 10px;">
                    <select id="activityFilter" class="input-control" style="width: 150px; padding: 8px 12px; font-size: 0.8rem;" onchange="loadActivity()">
                        <option value="">All Types</option>
                        <option value="system">System</option>
                        <option value="device">Device</option>
                        <option value="admin">Admin</option>
                        <option value="security">Security</option>
                    </select>
                    <button class="btn btn-ghost" onclick="loadActivity()">
                        <i data-lucide="refresh-cw" size="16"></i>
                    </button>
                    <button class="btn btn-danger" onclick="clearActivityLog()">
                        <i data-lucide="trash-2" size="16"></i> Clear
                    </button>
                </div>
            </div>
            <div class="activity-timeline" id="activityTimeline">
                <div style="text-align: center; padding: 40px; color: var(--zinc-400);">Loading activity...</div>
            </div>
        </div>
    `;
}

function generateBulkOpsHTML() {
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="card-main">
                <h3 class="card-title" style="color: var(--status-danger);"><i data-lucide="lock"></i> Arm All Devices</h3>
                <p style="color: var(--zinc-500); margin-bottom: 20px;">
                    Lock all devices in the system simultaneously. This is an emergency operation.
                </p>
                <div class="field-group">
                    <label class="field-label">Lock Reason</label>
                    <input type="text" id="armAllReason" class="input-control" placeholder="e.g., Emergency security lockdown">
                </div>
                <button class="btn btn-danger" style="width: 100%;" onclick="armAllDevices()">
                    <i data-lucide="lock" size="16"></i> Execute Emergency Lockdown
                </button>
            </div>

            <div class="card-main">
                <h3 class="card-title" style="color: var(--status-safe);"><i data-lucide="unlock"></i> Disarm All Devices</h3>
                <p style="color: var(--zinc-500); margin-bottom: 20px;">
                    Release all device locks simultaneously. This will restore normal functionality.
                </p>
                <div class="field-group">
                    <label class="field-label">Unlock Reason</label>
                    <input type="text" id="disarmAllReason" class="input-control" placeholder="e.g., All clear">
                </div>
                <button class="btn btn-success" style="width: 100%;" onclick="disarmAllDevices()">
                    <i data-lucide="unlock" size="16"></i> Release All Locks
                </button>
            </div>
        </div>
    `;
}

function generateQuarantineHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="shield-alert"></i> Quarantined Devices</h3>
                <button class="btn btn-ghost" onclick="loadDevices()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div id="quarantineList"></div>
        </div>

        <div class="card-main" style="max-width: 600px;">
            <h3 class="card-title"><i data-lucide="shield-alert"></i> Quarantine Device</h3>
            <p style="color: var(--zinc-500); margin-bottom: 20px;">
                Place a device in security quarantine.
            </p>
            <div class="field-group">
                <label class="field-label">Device ID</label>
                <input type="text" id="quarantineDeviceId" class="input-control" placeholder="Enter device ID">
            </div>
            <div class="field-group">
                <label class="field-label">Reason</label>
                <input type="text" id="quarantineReason" class="input-control" placeholder="e.g., Suspicious activity">
            </div>
            <button class="btn btn-danger" style="width: 100%;" onclick="quarantineDevice()">
                <i data-lucide="shield-alert" size="16"></i> Quarantine Device
            </button>
        </div>
    `;
}

function generateBreachesHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="shield-off"></i> Security Breach Detection</h3>
                <button class="btn btn-ghost" onclick="loadBreaches()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div id="breachesList"></div>
        </div>
    `;
}

function generateBlockedIPsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="ban"></i> Blocked IP Addresses</h3>
                <button class="btn btn-ghost" onclick="loadBlockedIPs()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div id="blockedIPsList"></div>
        </div>

        <div class="card-main" style="max-width: 600px;">
            <h3 class="card-title"><i data-lucide="unlock"></i> Unblock IP Address</h3>
            <div class="field-group">
                <label class="field-label">IP Address</label>
                <input type="text" id="unblockIPInput" class="input-control" placeholder="Enter IP to unblock">
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="unblockIP()">
                <i data-lucide="unlock" size="16"></i> Unblock IP Address
            </button>
        </div>

        <div class="card-main">
            <h3 class="card-title"><i data-lucide="alert-triangle"></i> Failed Attempts</h3>
            <div id="failedAttemptsList"></div>
        </div>
    `;
}

function generateSessionsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="clock"></i> Active Sessions</h3>
                <button class="btn btn-ghost" onclick="loadSessions()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div id="sessionsList"></div>
        </div>
    `;
}

function generateGeofencingHTML() {
    return `
        <div class="geofence-split">
            <div class="card-main">
                <div class="card-header">
                    <h3 class="card-title"><i data-lucide="map-pin"></i> Active Geofences</h3>
                    <button class="btn btn-ghost" onclick="loadGeofences()">
                        <i data-lucide="refresh-cw" size="16"></i> Refresh
                    </button>
                </div>
                
                <!-- Geofence Map -->
                <div id="ownerGeofenceMap" class="map-container" style="margin-bottom: 20px;"></div>
                
                <!-- Geofence List -->
                <div id="geofencesList"></div>
            </div>

            <div class="card-main">
                <h3 class="card-title"><i data-lucide="plus-circle"></i> Create New Geofence</h3>
                <p style="color: var(--zinc-500); margin-bottom: 20px;">
                    Set up a geographic perimeter for a device. Click on the map to set coordinates.
                </p>
                <form id="createGeofenceForm" onsubmit="createNewGeofence(event)">
                    <div class="field-group">
                        <label class="field-label">Device ID</label>
                        <input type="text" id="geofenceDeviceId" class="input-control" placeholder="Enter device ID" required>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Latitude</label>
                        <input type="number" id="geofenceLat" class="input-control" step="any" placeholder="e.g., 40.712776" required>
                        <small style="font-size: 0.75rem; color: var(--zinc-500); margin-top: 4px; display: block;">
                            Click on the map to set coordinates
                        </small>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Longitude</label>
                        <input type="number" id="geofenceLon" class="input-control" step="any" placeholder="e.g., -74.005974" required>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Radius (meters)</label>
                        <input type="number" id="geofenceRadius" class="input-control" min="10" max="100000" placeholder="e.g., 1000" value="1000" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i data-lucide="map-pin" size="16"></i> Create Geofence
                    </button>
                </form>
            </div>
        </div>
    `;
}

function generateLocationsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="map"></i> Live Device Locations</h3>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-ghost" onclick="toggleOwnerMapView()" id="ownerMapViewToggle">
                        <i data-lucide="layers" size="16"></i>
                        <span id="ownerMapViewToggleText">Show Map</span>
                    </button>
                    <button class="btn btn-ghost" onclick="loadLocations()">
                        <i data-lucide="refresh-cw" size="16"></i>
                        Refresh
                    </button>
                </div>
            </div>
            <div style="background: var(--zinc-50); padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: var(--status-safe); border-radius: 50%; animation: pulse 2s infinite;"></div>
                <span style="font-size: 0.75rem; font-weight: 600; color: var(--zinc-600);">Auto-refreshing every 5 seconds</span>
            </div>
            
            <!-- Map View -->
            <div id="ownerLocationsMapView" style="display: none;">
                <div id="ownerLocationsMap" class="map-container"></div>
            </div>
            
            <!-- List View -->
            <div id="ownerLocationsListView">
                <div id="locationsList"></div>
            </div>
        </div>
    `;
}

function generateNotificationsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="bell"></i> System Notifications</h3>
                <button class="btn btn-ghost" onclick="loadNotifications()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div id="notificationsList"></div>
        </div>
    `;
}

function generateAuditHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="file-text"></i> Audit Trail</h3>
                <div style="display: flex; gap: 10px;">
                    <select id="auditFilter" class="input-control" style="width: 200px; padding: 8px 12px; font-size: 0.8rem;" onchange="loadAudit()">
                        <option value="">All Actions</option>
                    </select>
                    <button class="btn btn-ghost" onclick="loadAudit()">
                        <i data-lucide="refresh-cw" size="16"></i>
                    </button>
                </div>
            </div>
            <div class="table-wrapper">
                <table id="auditTable">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Actor</th>
                            <th>Target</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading audit trail...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateSettingsHTML() {
    return `
        <div class="card-main">
            <h3 class="card-title"><i data-lucide="settings"></i> System Settings</h3>
            <p style="color: var(--zinc-500); margin-bottom: 20px; font-size: 0.9rem;">
                Configure global system behavior and security limits.
            </p>
            <div id="settingsForm">
                <div style="text-align: center; padding: 20px; color: var(--zinc-400);">Loading settings...</div>
            </div>
        </div>

        <div class="card-main" style="border: 1px solid var(--brand-primary); background: rgba(59, 130, 246, 0.03);">
            <div style="display: flex; align-items: flex-start; gap: 16px;">
                <div style="background: var(--brand-primary); color: white; padding: 12px; border-radius: 12px;">
                    <i data-lucide="database" size="24"></i>
                </div>
                <div style="flex: 1;">
                    <h3 class="card-title" style="margin-bottom: 4px;">System State Persistence</h3>
                    <p style="font-size: 0.85rem; color: var(--zinc-600); margin-bottom: 20px; line-height: 1.5;">
                        Because BrowserBricker uses <strong>In-Memory Storage</strong>, all data is lost if the server process restarts. 
                        Download a backup file regularly and upload it after a restart to restore your system state.
                    </p>
                    
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="exportSystemState()">
                            <i data-lucide="download" size="16"></i> Export System State (.json)
                        </button>
                        
                        <label class="btn btn-ghost" style="cursor: pointer; background: white;">
                            <i data-lucide="upload" size="16"></i> Import System State
                            <input type="file" id="importFileInput" style="display: none;" onchange="importSystemState(event)" accept=".json">
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateLogsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="terminal"></i> System Logs</h3>
                <button class="btn btn-ghost" onclick="clearTerminal()">
                    Clear Logs
                </button>
            </div>
            <div class="log-terminal" id="terminalLogs">
                <div class="log-line log-info">BrowserBricker Ultimate Owner Panel initialized...</div>
                <div class="log-line log-success">All API endpoints connected. Ready for operations.</div>
            </div>
        </div>
    `;
}

function generateGroupsHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="users"></i> Groups Management</h3>
                <button class="btn btn-primary" onclick="showCreateGroupModal()">
                    <i data-lucide="plus"></i> Create Group
                </button>
            </div>
            
            <!-- Info Box -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 16px; margin: 20px 0; color: white;">
                <div style="display: flex; align-items: start; gap: 12px;">
                    <i data-lucide="info" size="20" style="flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">About Groups</strong>
                        <p style="font-size: 0.85rem; opacity: 0.95; margin: 0;">
                            Groups help you organize devices into logical collections (e.g., "Sales Team", "Engineering", "Interns"). 
                            Once created, click a group to view details and use the <strong>"Assign Device"</strong> button to add unassigned devices. 
                            You can then apply policies to entire groups for easier management.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="grid-stats" style="margin: 20px 0;">
                <div class="stat-card">
                    <h4>Total Groups</h4>
                    <div class="stat-value" id="totalGroupsCount">0</div>
                </div>
                <div class="stat-card">
                    <h4>Active Groups</h4>
                    <div class="stat-value" style="color: var(--status-safe);" id="activeGroupsCount">0</div>
                </div>
                <div class="stat-card">
                    <h4>Total Devices</h4>
                    <div class="stat-value" id="groupTotalDevices">0</div>
                </div>
                <div class="stat-card">
                    <h4>Total Breaches</h4>
                    <div class="stat-value" style="color: var(--status-danger);" id="groupTotalBreaches">0</div>
                </div>
            </div>
            
            <div class="table-wrapper">
                <table id="groupsTable">
                    <thead>
                        <tr>
                            <th>Group Name</th>
                            <th>Description</th>
                            <th>Devices</th>
                            <th>Active</th>
                            <th>Breaches</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="groupsTableBody">
                        <tr><td colspan="7" style="text-align: center; padding: 40px;">
                            <i data-lucide="users" size="48" style="opacity: 0.3;"></i>
                            <p style="margin-top: 10px; color: var(--zinc-500);">Loading groups...</p>
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generatePoliciesHTML() {
    return `
        <div class="card-main">
            <div class="card-header">
                <h3 class="card-title"><i data-lucide="shield"></i> Policies Management</h3>
                <button class="btn btn-primary" onclick="showCreatePolicyModal()">
                    <i data-lucide="plus"></i> Create Policy
                </button>
            </div>
            
            <!-- Info Box -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px; margin: 20px 0; color: white;">
                <div style="display: flex; align-items: start; gap: 12px;">
                    <i data-lucide="info" size="20" style="flex-shrink: 0; margin-top: 2px;"></i>
                    <div>
                        <strong style="display: block; margin-bottom: 4px;">About Policies</strong>
                        <p style="font-size: 0.85rem; opacity: 0.95; margin: 0;">
                            Policies let you set rules for devices or groups. Control time limits, allowed hours, auto-arming schedules, geofencing, and more. 
                            Policies can be applied <strong>globally</strong> (all devices), to specific <strong>groups</strong>, or individual <strong>devices</strong>.
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="grid-stats" style="margin: 20px 0;">
                <div class="stat-card">
                    <h4>Total Policies</h4>
                    <div class="stat-value" id="totalPoliciesCount">0</div>
                </div>
                <div class="stat-card">
                    <h4>Active Policies</h4>
                    <div class="stat-value" style="color: var(--status-safe);" id="activePoliciesCount">0</div>
                </div>
                <div class="stat-card">
                    <h4>Violations (24h)</h4>
                    <div class="stat-value" style="color: var(--status-warn);" id="recentViolationsCount">0</div>
                </div>
                <div class="stat-card">
                    <h4>With Time Limits</h4>
                    <div class="stat-value" id="timeLimitPoliciesCount">0</div>
                </div>
            </div>
            
            <div class="table-wrapper">
                <table id="policiesTable">
                    <thead>
                        <tr>
                            <th>Policy Name</th>
                            <th>Scope</th>
                            <th>Priority</th>
                            <th>Features</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="policiesTableBody">
                        <tr><td colspan="7" style="text-align: center; padding: 40px;">
                            <i data-lucide="shield" size="48" style="opacity: 0.3;"></i>
                            <p style="margin-top: 10px; color: var(--zinc-500);">Loading policies...</p>
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== INITIALIZATION COMPLETE ==========
console.log('BrowserBricker Owner Panel v4.2.0 - Loaded Successfully');
console.log('Total Functions:', Object.keys(window).filter(k => typeof window[k] === 'function').length);
console.log('Features: System Admins, Geofencing, Live Tracking, Hierarchical Control');
// ============================
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
        ` : '<p style="text-align: center; color: #666; padding: 20px;">No devices in this group</p>';
        
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
                            <td>${group.settings?.allowGeofencing !== false ? '✓ Enabled' : '✗ Disabled'}</td>
                        </tr>
                        <tr>
                            <td><strong>Quarantine:</strong></td>
                            <td>${group.settings?.allowQuarantine !== false ? '✓ Enabled' : '✗ Disabled'}</td>
                        </tr>
                        <tr>
                            <td><strong>Default Arm State:</strong></td>
                            <td>${group.settings?.defaultArmState ? '✓ Armed' : '✗ Disarmed'}</td>
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
            devicesList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No unassigned devices available</p>';
        } else {
            devicesList.innerHTML = devices.map(d => `
                <div class="device-item" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${escapeHtml(d.deviceName)}</strong><br>
                        <small style="color: #666;">${d.deviceId}</small>
                    </div>
                    <button class="btn-primary" onclick="assignDeviceToGroupNow('${groupId}', '${d.deviceId}')">
                        Assign
                    </button>
                </div>
            `).join('');
        }
        
        document.getElementById('assignDeviceModal').style.display = 'flex';
    } catch (error) {
        console.error('Load unassigned devices error:', error);
        showToast('Error', 'Failed to load unassigned devices', 'error');
    }
}

// New function to show group selection modal for a specific device
async function openAssignDeviceModal(deviceId) {
    try {
        // Fetch all groups
        const response = await fetch(`${API_URL}/api/groups`, {
            headers: { 'Authorization': `Bearer ${getApiKey()}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch groups');
        
        const data = await response.json();
        const groups = data.groups || [];
        
        const groupsList = document.getElementById('unassignedDevicesList');
        
        if (groups.length === 0) {
            groupsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No groups available. Please create a group first.</p>';
        } else {
            groupsList.innerHTML = groups.map(g => `
                <div class="device-item" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${escapeHtml(g.groupName)}</strong><br>
                        <small style="color: #666;">${g.description || 'No description'}</small>
                    </div>
                    <button class="btn-primary" onclick="assignDeviceToGroupNow('${g.groupId}', '${deviceId}')">
                        Add to Group
                    </button>
                </div>
            `).join('');
        }
        
        document.getElementById('assignDeviceModal').style.display = 'flex';
    } catch (error) {
        console.error('Load groups error:', error);
        showToast('Error', 'Failed to load groups', 'error');
    }
}


function closeAssignDeviceModal() {
    document.getElementById('assignDeviceModal').style.display = 'none';
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
    // For owner panel
    if (typeof ownerApiKey !== 'undefined' && ownerApiKey !== null) return ownerApiKey;
    // For admin panel
    if (typeof systemAdminKey !== 'undefined') return systemAdminKey;
    return sessionStorage.getItem('ownerKey') || localStorage.getItem('systemAdminKey') || localStorage.getItem('ownerKey');
}

function isOwner() {
    // Check if user is owner (has owner key)
    return (typeof ownerApiKey !== 'undefined' && ownerApiKey !== null) || sessionStorage.getItem('ownerKey') || localStorage.getItem('ownerKey');
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

// ========== POLICIES MANAGEMENT ==========
// ============================
// POLICIES MANAGEMENT JAVASCRIPT
// Add these functions to owner-script.js and admin.js
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

// ========== UPDATE POLICIES STATS ==========
function updatePoliciesStats(policies) {
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.active).length;
    const timeLimitPolicies = policies.filter(p => p.rules.timeLimits?.enabled).length;
    
    const totalEl = document.getElementById('totalPoliciesCount');
    const activeEl = document.getElementById('activePoliciesCount');
    const timeLimitEl = document.getElementById('timeLimitPoliciesCount');
    
    if (totalEl) totalEl.textContent = totalPolicies;
    if (activeEl) activeEl.textContent = activePolicies;
    if (timeLimitEl) timeLimitEl.textContent = timeLimitPolicies;
}

// ========== DISPLAY POLICIES ==========
function displayPolicies(policies) {
    const tbody = document.getElementById('policiesTableBody');
    
    if (!policies || policies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--zinc-500);">
                    No policies found. Create your first policy to get started.
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    
    // Update stats
    updatePoliciesStats(policies);
    
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
                    ${!policy.active ? '<span style="padding: 4px 8px; background: var(--status-danger); color: white; border-radius: 6px; font-size: 11px; font-weight: 600; margin-left: 8px;">Inactive</span>' : ''}
                </td>
                <td>
                    <span style="padding: 4px 8px; background: var(--status-info); color: white; border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ${policy.scope.type}
                        ${policy.scope.targetIds?.length > 0 ? ` (${policy.scope.targetIds.length})` : ''}
                    </span>
                </td>
                <td>
                    <span style="padding: 4px 8px; background: var(--zinc-200); color: var(--zinc-900); border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ${policy.priority}
                    </span>
                </td>
                <td>
                    ${features.length > 0 
                        ? features.map(f => `<span style="padding: 4px 8px; background: var(--zinc-100); color: var(--zinc-700); border-radius: 6px; font-size: 10px; margin-right: 4px; display: inline-block; margin-bottom: 4px;">${f}</span>`).join('')
                        : '<span style="color: var(--zinc-400);">None</span>'
                    }
                </td>
                <td>
                    <span style="padding: 4px 8px; background: ${policy.active ? 'var(--status-safe)' : 'var(--zinc-300)'}; color: white; border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ${policy.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${new Date(policy.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-ghost" onclick="viewPolicyDetails('${policy.policyId}')" style="padding: 6px 10px; font-size: 0.75rem;" title="View Details">
                        <i data-lucide="eye" size="14"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="editPolicy('${policy.policyId}')" style="padding: 6px 10px; font-size: 0.75rem;" title="Edit">
                        <i data-lucide="edit" size="14"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="togglePolicyStatus('${policy.policyId}')" style="padding: 6px 10px; font-size: 0.75rem;" title="${policy.active ? 'Deactivate' : 'Activate'}">
                        <i data-lucide="${policy.active ? 'pause' : 'play'}" size="14"></i>
                    </button>
                    <button class="btn btn-danger" onclick="confirmDeletePolicy('${policy.policyId}')" style="padding: 6px 10px; font-size: 0.75rem;" title="Delete">
                        <i data-lucide="trash-2" size="14"></i>
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
    const timeLimitsSection = document.getElementById('timeLimitsSection');
    const allowedHoursSection = document.getElementById('allowedHoursSection');
    const autoArmSection = document.getElementById('autoArmSection');
    const inactivitySection = document.getElementById('inactivitySection');
    const scopeTargetsDiv = document.getElementById('scopeTargetsDiv');
    
    if (timeLimitsSection) timeLimitsSection.style.display = 'none';
    if (allowedHoursSection) allowedHoursSection.style.display = 'none';
    if (autoArmSection) autoArmSection.style.display = 'none';
    if (inactivitySection) inactivitySection.style.display = 'none';
    if (scopeTargetsDiv) scopeTargetsDiv.style.display = 'none';
    
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
        
        if (!response.ok) {
            const result = await response.json();
            console.error('❌ Policy creation failed:', result);
            throw new Error(result.message || result.error || 'Failed to create policy');
        }
        
        const result = await response.json();
        console.log('✅ Policy created successfully:', result);
        showToast('Success', 'Policy created successfully!', 'success');
        closeCreatePolicyModal();
        loadPolicies();
    } catch (error) {
        console.error('❌ Create policy error:', error);
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
function viewPolicyDetails(policyId) {
    const policy = currentPolicies.find(p => p.policyId === policyId);
    if (!policy) return;
    
    // Build detailed view HTML
    const content = `
        <div class="policy-details">
            <div class="detail-section">
                <h4>Basic Information</h4>
                <table class="details-table">
                    <tr>
                        <td><strong>Policy ID:</strong></td>
                        <td>${escapeHtml(policy.policyId)}</td>
                    </tr>
                    <tr>
                        <td><strong>Name:</strong></td>
                        <td>${escapeHtml(policy.policyName)}</td>
                    </tr>
                    <tr>
                        <td><strong>Description:</strong></td>
                        <td>${escapeHtml(policy.description || 'No description')}</td>
                    </tr>
                    <tr>
                        <td><strong>Scope:</strong></td>
                        <td>${policy.scope.type} ${policy.scope.targetIds.length > 0 ? `(${policy.scope.targetIds.length} targets)` : ''}</td>
                    </tr>
                    <tr>
                        <td><strong>Priority:</strong></td>
                        <td><span class="priority-badge priority-${getPriorityClass(policy.priority)}">${policy.priority}</span></td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td><span class="badge ${policy.active ? 'badge-success' : 'badge-danger'}">
                            ${policy.active ? 'Active' : 'Inactive'}
                        </span></td>
                    </tr>
                    <tr>
                        <td><strong>Created:</strong></td>
                        <td>${new Date(policy.createdAt).toLocaleString()}</td>
                    </tr>
                </table>
            </div>
            
            <div class="detail-section">
                <h4>Rules</h4>
                ${getPolicyRulesHTML(policy.rules)}
            </div>
            
            <div class="detail-section">
                <h4>Notifications</h4>
                <ul>
                    <li>Breach Notifications: ${policy.notifications.onBreach ? '✓' : '✗'}</li>
                    <li>Geofence Exit: ${policy.notifications.onGeofenceExit ? '✓' : '✗'}</li>
                    <li>Time Limit: ${policy.notifications.onTimeLimitReached ? '✓' : '✗'}</li>
                    ${policy.notifications.recipients.length > 0 ? 
                        `<li>Recipients: ${policy.notifications.recipients.join(', ')}</li>` : ''}
                </ul>
            </div>
        </div>
    `;
    
    // Show in a modal (you'll need to create this modal in HTML)
    const modal = document.getElementById('policyDetailsModal') || createPolicyDetailsModal();
    modal.querySelector('.modal-body').innerHTML = content;
    modal.style.display = 'flex';
}

function getPolicyRulesHTML(rules) {
    let html = '<ul>';
    
    if (rules.timeLimits?.enabled) {
        html += `<li><strong>Time Limits:</strong> ${rules.timeLimits.dailyMinutes} minutes/day, `;
        html += `Action: ${rules.timeLimits.action}</li>`;
    }
    
    if (rules.allowedHours?.enabled) {
        html += `<li><strong>Allowed Hours:</strong> ${rules.allowedHours.schedule.length} schedules configured</li>`;
    }
    
    if (rules.autoArm) {
        html += `<li><strong>Auto-Arm:</strong> Enabled`;
        if (rules.autoArmSchedule?.enabled) {
            html += ` (${rules.autoArmSchedule.startTime} - ${rules.autoArmSchedule.endTime})`;
        }
        html += `</li>`;
    }
    
    if (rules.enforceGeofence) {
        html += `<li><strong>Geofence:</strong> ${rules.geofenceAction}</li>`;
    }
    
    if (rules.inactivityTimeout?.enabled) {
        html += `<li><strong>Inactivity Timeout:</strong> ${rules.inactivityTimeout.minutes} minutes</li>`;
    }
    
    html += '</ul>';
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
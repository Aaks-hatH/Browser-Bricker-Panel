// BrowserBricker Owner Panel - Complete Enhanced JavaScript
// Version: 4.2.0 - Hierarchical Edition
// Features: System Admins, Registration Codes, Geofencing, Live Tracking, Bulk Operations

lucide.createIcons();

const API_URL = 'https://browserbricker.onrender.com';
let ownerApiKey = null;
let refreshInterval = null;
let locationRefreshInterval = null;
let sessionStartTime = Date.now();
let activityChart = null;
let searchTimeout = null;

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
        
        document.getElementById('totalDevices').textContent = data.devices?.total || 0;
        document.getElementById('totalUsers').textContent = data.users?.total || 0;
        document.getElementById('armedDevices').textContent = data.devices?.armed || 0;
        document.getElementById('onlineDevices').textContent = data.devices?.online || 0;
        document.getElementById('quarantinedDevices').textContent = data.devices?.quarantined || 0;
        document.getElementById('geofencedDevices').textContent = data.devices?.geofenced || 0;
        document.getElementById('breachCount').textContent = data.statistics?.breachAttempts || 0;
        document.getElementById('blockedIPCount').textContent = data.security?.blockedIPs || 0;
        
        if (data.systemAdmins) {
            document.getElementById('totalSystemAdmins').textContent = data.systemAdmins.total || 0;
            document.getElementById('activeSystemAdmins').textContent = data.systemAdmins.active || 0;
        }

        if (data.system) {
            const memUsed = data.system.memory?.used || 0;
            const memTotal = data.system.memory?.total || 100;
            const memPercent = (memUsed / memTotal) * 100;
            
            document.getElementById('memVal').textContent = `${memUsed}/${memTotal} MB`;
            document.getElementById('memBar').style.width = memPercent + '%';
            document.getElementById('uptimeVal').textContent = formatUptime(data.system.uptime);
            
            const reqCount = data.system.health?.requests || 0;
            document.getElementById('reqVal').textContent = reqCount;
            document.getElementById('reqBar').style.width = Math.min((reqCount / 1000) * 100, 100) + '%';
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
        const codesList = document.getElementById('registrationCodesList');
        
        if (!data.systemAdmins || data.systemAdmins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--zinc-400);">No system administrators found</td></tr>';
        } else {
            tbody.innerHTML = data.systemAdmins.map(admin => {
                const statusBadge = admin.active ? 
                    '<span class="badge badge-safe">Active</span>' :
                    '<span class="badge badge-warn">Inactive</span>';
                
                return `
                    <tr>
                        <td style="font-family: var(--mono); font-size: 0.8rem;">${admin.id}</td>
                        <td style="font-weight: 600;">${escapeHtml(admin.name || 'N/A')}</td>
                        <td style="font-family: var(--mono); font-size: 0.75rem;">${escapeHtml(admin.email || 'N/A')}</td>
                        <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                        <td>${formatTime(admin.lastActive)}</td>
                        <td><span class="badge badge-info">${admin.deviceCount || 0}</span></td>
                        <td><span class="badge badge-info">${admin.userCount || 0}</span></td>
                        <td>${statusBadge}</td>
                        <td>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem;" onclick="showAdminDetails('${admin.id}')">
                                    <i data-lucide="info" size="12"></i>
                                </button>
                                ${admin.active ? 
                                    `<button class="btn btn-warn" style="padding: 6px 12px; font-size: 0.75rem;" onclick="deactivateSystemAdmin('${admin.id}', '${escapeHtml(admin.name)}')"><i data-lucide="pause" size="12"></i></button>` :
                                    `<button class="btn btn-success" style="padding: 6px 12px; font-size: 0.75rem;" onclick="activateSystemAdmin('${admin.id}', '${escapeHtml(admin.name)}')"><i data-lucide="play" size="12"></i></button>`
                                }
                                <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem; color: var(--status-danger);" onclick="deleteSystemAdmin('${admin.id}', '${escapeHtml(admin.name)}')">
                                    <i data-lucide="trash-2" size="12"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        if (data.registrationCodes && codesList) {
            if (data.registrationCodes.length === 0) {
                codesList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No registration codes generated</div>';
            } else {
                codesList.innerHTML = data.registrationCodes.map(code => {
                    const isExpired = Date.now() > code.expiresAt;
                    const statusBadge = code.used ? 
                        '<span class="badge badge-safe">Used</span>' :
                        isExpired ?
                        '<span class="badge badge-danger">Expired</span>' :
                        '<span class="badge badge-info">Active</span>';
                    
                    return `
                        <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid ${code.used ? 'var(--status-safe)' : isExpired ? 'var(--status-danger)' : 'var(--status-info)'};">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                <div>
                                    <div style="font-family: var(--mono); font-weight: 700; font-size: 1.1rem; letter-spacing: 2px; margin-bottom: 4px;">${code.code}</div>
                                    <div style="font-size: 0.85rem; color: var(--zinc-600);">
                                        Created: ${new Date(code.createdAt).toLocaleString()}
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--zinc-600);">
                                        Expires: ${new Date(code.expiresAt).toLocaleString()}
                                    </div>
                                    ${code.used ? `<div style="font-size: 0.85rem; color: var(--zinc-600);">Used: ${new Date(code.usedAt).toLocaleString()}</div>` : ''}
                                    ${code.systemAdminId ? `<div style="font-size: 0.85rem; color: var(--zinc-600);">Admin ID: ${code.systemAdminId}</div>` : ''}
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    ${statusBadge}
                                    ${!code.used && !isExpired ? 
                                        `<button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.7rem;" onclick="copyToClipboard('${code.code}')"><i data-lucide="copy" size="10"></i></button>` : ''
                                    }
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('System admins error:', error);
        showToast('Error', 'Failed to load system administrators', 'error');
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

        tbody.innerHTML = data.devices.map(device => {
            const statusBadge = device.online ? 
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
                `<span class="badge badge-info" style="font-size: 0.65rem;">SysAdmin</span>` :
                `<span class="badge badge-safe" style="font-size: 0.65rem;">User</span>`;

            return `
                <tr>
                    <td style="font-weight: 600;">${escapeHtml(device.deviceName)}</td>
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

            return `
                <tr>
                    <td style="font-family: var(--mono); font-size: 0.8rem;">${user.keyHash}</td>
                    <td>${ownerBadge}</td>
                    <td>${new Date(user.created).toLocaleDateString()}</td>
                    <td>${formatTime(user.lastUsed)}</td>
                    <td><span class="badge badge-info">${user.uses || 0}</span></td>
                    <td><span class="badge badge-info">${user.deviceCount}</span></td>
                    <td><span class="badge badge-${user.armedCount > 0 ? 'danger' : 'safe'}">${user.armedCount}</span></td>
                    <td><span class="badge badge-${user.onlineCount > 0 ? 'safe' : 'warn'}">${user.onlineCount}</span></td>
                    <td><span class="badge badge-${user.quarantinedCount > 0 ? 'danger' : 'safe'}">${user.quarantinedCount}</span></td>
                    <td>${statusBadge}</td>
                    <td>
                        ${!user.revoked ? 
                            `<button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem;" onclick="revokeKey('${user.fullHash}')"><i data-lucide="x-circle" size="12"></i> Revoke</button>` :
                            '<span style="color: var(--zinc-400); font-size: 0.75rem;">Revoked</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
    } catch (error) {
        console.error('Users error:', error);
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
        const data = await apiCall('/api/admin/blocked-ips');
        const list = document.getElementById('blockedIPsList');
        const failedList = document.getElementById('failedAttemptsList');
        
        if (!data.blocked || data.blocked.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No blocked IPs</div>';
        } else {
            list.innerHTML = data.blocked.map(ip => `
                <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-family: var(--mono); font-weight: 700; margin-bottom: 4px;">${ip}</div>
                        <div style="font-size: 0.75rem; color: var(--zinc-500);">Blocked due to suspicious activity</div>
                    </div>
                    <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.75rem;" onclick="unblockIPDirect('${ip}')">
                        <i data-lucide="unlock" size="12"></i> Unblock
                    </button>
                </div>
            `).join('');
        }

        if (failedList) {
            if (!data.failed || data.failed.length === 0) {
                failedList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No failed attempts</div>';
            } else {
                failedList.innerHTML = data.failed.map(attempt => `
                    <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-family: var(--mono); font-weight: 700;">${attempt.ip}</div>
                            <span class="badge badge-warn">${attempt.attempts} Attempts</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--zinc-500);">
                            Last attempt: ${formatTime(attempt.lastAttempt)}
                        </div>
                    </div>
                `).join('');
            }
        }
        
        lucide.createIcons();
    } catch (error) {
        console.error('Blocked IPs error:', error);
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
            const isActive = session.expiresAt > Date.now();
            return `
                <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-family: var(--mono); font-weight: 700; margin-bottom: 4px;">${session.id}</div>
                            <div style="font-size: 0.85rem; color: var(--zinc-600);">
                                Expires: ${new Date(session.expiresAt).toLocaleString()}
                            </div>
                        </div>
                        <span class="badge badge-${isActive ? 'safe' : 'danger'}">${isActive ? 'Active' : 'Expired'}</span>
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
            return;
        }

        list.innerHTML = data.geofences.map(geo => `
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid var(--status-info);">
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
                </div>
                <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.75rem; width: 100%;" onclick="removeGeofence('${geo.deviceId}')">
                    <i data-lucide="trash-2" size="12"></i> Remove Geofence
                </button>
            </div>
        `).join('');
        
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
        await apiCall('/api/device/geofence', 'POST', {
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
        await apiCall('/api/device/geofence', 'DELETE', { deviceId });
        
        showToast('Success', 'Geofence removed successfully', 'success');
        logTerminal(`Geofence removed for device ${deviceId.substring(0, 8)}...`, 'info');
        
        await loadGeofences();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
}

// ========== LOCATION TRACKING ==========
async function loadLocations() {
    try {
        const data = await apiCall('/api/admin/locations');
        const list = document.getElementById('locationsList');
        
        if (!data.locations || data.locations.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--zinc-400);">No location data available</div>';
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
                        <div style="display: flex; gap: 6px;">
                            ${isRecent ? '<span class="badge badge-safe"><i data-lucide="radio" size="10"></i> LIVE</span>' : ''}
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
                'critical': 'var(--status-danger)'
            }[notif.severity] || 'var(--zinc-500)';

            return `
                <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid ${severityColor};">
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(notif.title)}</div>
                    <div style="font-size: 0.85rem; color: var(--zinc-600); margin-bottom: 8px;">${escapeHtml(notif.message)}</div>
                    <div style="font-size: 0.7rem; color: var(--zinc-400);">${new Date(notif.timestamp).toLocaleString()}</div>
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
        
        if (!data.audit || data.audit.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--zinc-400);">No audit entries</td></tr>';
            return;
        }

        tbody.innerHTML = data.audit.map(entry => `
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
async function createSystemAdmin(event) {
    event.preventDefault();
    
    const name = document.getElementById('newAdminName').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();

    if (!name) {
        showToast('Error', 'Please enter an administrator name', 'error');
        return;
    }

    try {
        const data = await apiCall('/api/admin/system-admins/create', 'POST', { name, email });
        
        showToast('Success', 'Registration code generated successfully', 'success');
        logTerminal(`System admin registration code created for ${name}`, 'info');
        
        document.getElementById('createAdminForm').reset();
        
        alert(`Registration Code Generated!\n\nCode: ${data.code}\n\nThis code expires in 7 days. Share it with ${name} to complete registration.`);
        
        await loadSystemAdmins();
        await loadStats();
    } catch (error) {
        showToast('Error', error.message, 'error');
    }
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

async function deleteSystemAdmin(adminId, adminName) {
    if (!confirm(`DELETE system administrator "${adminName}"?\n\nThis will also delete all their users and devices. This action cannot be undone.`)) return;

    const confirmation = prompt(`Type "${adminName}" to confirm deletion:`);
    if (confirmation !== adminName) {
        showToast('Error', 'Deletion cancelled - name did not match', 'error');
        return;
    }

    try {
        await apiCall(`/api/admin/system-admins/${adminId}`, 'DELETE');
        
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
        const admin = data.systemAdmins.find(a => a.id === adminId);
        
        if (!admin) {
            showToast('Error', 'System administrator not found', 'error');
            return;
        }

        let html = `
            <div style="margin-bottom: 20px;">
                <h3 style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(admin.name)}</h3>
                <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-500);">${admin.id}</div>
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Information</div>
                <div style="font-size: 0.85rem; line-height: 1.8;">
                    Email: ${escapeHtml(admin.email || 'N/A')}<br>
                    Status: ${admin.active ? '✅ Active' : '❌ Inactive'}<br>
                    Created: ${new Date(admin.createdAt).toLocaleString()}<br>
                    Last Active: ${formatTime(admin.lastActive)}<br>
                </div>
            </div>
            
            <div style="background: var(--zinc-50); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 12px;">Statistics</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                    <div>Total Devices: ${admin.deviceCount || 0}</div>
                    <div>Total Users: ${admin.userCount || 0}</div>
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
async function toggleDevice(deviceId, arm) {
    try {
        const endpoint = arm ? '/api/admin/device/arm' : '/api/admin/device/disarm';
        await apiCall(endpoint, 'POST', { deviceId });
        
        showToast('Success', `Device ${arm ? 'armed' : 'disarmed'} successfully`, 'success');
        logTerminal(`Device ${deviceId.substring(0, 8)}... ${arm ? 'armed' : 'disarmed'}`, 'info');
        
        await loadStats();
        await loadDevices();
    } catch (error) {
        showToast('Error', error.message, 'error');
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
        
        showToast('Success', `${data.armedCount} devices locked`, 'success');
        logTerminal(`Bulk operation: Armed ${data.armedCount} devices`, 'warn');
        
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
        
        showToast('Success', `${data.disarmedCount} devices unlocked`, 'success');
        logTerminal(`Bulk operation: Disarmed ${data.disarmedCount} devices`, 'success');
        
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
        await apiCall('/api/admin/device/quarantine', 'DELETE', { deviceId });
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
    if (!confirm('Revoke this API key?\n\nThis action cannot be undone.')) return;

    try {
        await apiCall('/api/admin/revoke-key', 'POST', { keyHash });
        showToast('Success', 'API key revoked', 'success');
        logTerminal(`API key revoked: ${keyHash.substring(0, 12)}...`, 'warn');
        await loadUsers();
    } catch (error) {
        showToast('Error', error.message, 'error');
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
    if (viewId === 'geofencing') loadGeofences();
    if (viewId === 'locations') loadLocations();
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
                <div id="geofencesList"></div>
            </div>

            <div class="card-main">
                <h3 class="card-title"><i data-lucide="plus-circle"></i> Create New Geofence</h3>
                <p style="color: var(--zinc-500); margin-bottom: 20px;">
                    Set up a geographic perimeter for a device.
                </p>
                <form id="createGeofenceForm" onsubmit="createNewGeofence(event)">
                    <div class="field-group">
                        <label class="field-label">Device ID</label>
                        <input type="text" id="geofenceDeviceId" class="input-control" placeholder="Enter device ID" required>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Latitude</label>
                        <input type="number" id="geofenceLat" class="input-control" step="any" placeholder="e.g., 40.712776" required>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Longitude</label>
                        <input type="number" id="geofenceLon" class="input-control" step="any" placeholder="e.g., -74.005974" required>
                    </div>
                    
                    <div class="field-group">
                        <label class="field-label">Radius (meters)</label>
                        <input type="number" id="geofenceRadius" class="input-control" min="10" max="100000" placeholder="e.g., 1000" required>
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
                <button class="btn btn-ghost" onclick="loadLocations()">
                    <i data-lucide="refresh-cw" size="16"></i> Refresh
                </button>
            </div>
            <div style="background: var(--zinc-50); padding: 12px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                <div style="width: 8px; height: 8px; background: var(--status-safe); border-radius: 50%; animation: pulse 2s infinite;"></div>
                <span style="font-size: 0.75rem; font-weight: 600; color: var(--zinc-600);">Auto-refreshing every 5 seconds</span>
            </div>
            <div id="locationsList"></div>
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
            <div id="settingsForm"></div>
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

// ========== INITIALIZATION COMPLETE ==========
console.log('BrowserBricker Owner Panel v4.2.0 - Loaded Successfully');
console.log('Total Functions:', Object.keys(window).filter(k => typeof window[k] === 'function').length);
console.log('Features: System Admins, Geofencing, Live Tracking, Hierarchical Control');

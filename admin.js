// System Administrator Panel JavaScript
const API_URL = 'https://browserbricker.onrender.com';

let systemAdminKey = null;
let refreshInterval = null;

// Initialize
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
        refreshInterval = setInterval(loadDashboard, 5000);
    }
}

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
            document.getElementById('newApiKey').textContent = data.systemAdminKey;
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
        location.reload();
    }
}

async function loadDashboard() {
    try {
        // Load stats
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
        
        // Update header
        document.getElementById('groupNameDisplay').textContent = 
            `Group: ${stats.systemAdmin.groupName} | ${stats.systemAdmin.name}`;
        
        // Update stats
        document.getElementById('statTotal').textContent = stats.devices.total;
        document.getElementById('statOnline').textContent = stats.devices.online;
        document.getElementById('statArmed').textContent = stats.devices.armed;
        document.getElementById('statUsers').textContent = stats.users.total;
        
        // Load devices if on devices view
        const devicesView = document.getElementById('devicesView');
        if (devicesView.classList.contains('active')) {
            await loadDevices();
        }
        
        // Load users if on users view
        const usersView = document.getElementById('usersView');
        if (usersView.classList.contains('active')) {
            await loadUsers();
        }
        
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/api/system/devices`, {
            headers: { 'Authorization': `Bearer ${systemAdminKey}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderDevices(data.devices);
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
        const quarantinedBadge = device.quarantined ? 
            '<span class="badge badge-danger">QUARANTINED</span>' : '';
        
        const lastSeen = device.lastHeartbeat > 0 ? 
            timeSince(device.lastHeartbeat) : 'Never';
        
        const armBtn = device.armed ? 
            `<button class="btn btn-success" style="padding: 8px 16px; font-size: 0.8rem;" onclick="disarmDevice('${device.deviceId}')"><i data-lucide="unlock" size="14"></i> Disarm</button>` :
            `<button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.8rem;" onclick="armDevice('${device.deviceId}')"><i data-lucide="lock" size="14"></i> Arm</button>`;
        
        html += `
            <tr>
                <td>
                    <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(device.deviceName)}</div>
                    <div style="font-family: var(--mono); font-size: 0.75rem; color: var(--zinc-400);">${device.deviceId.substring(0, 12)}...</div>
                </td>
                <td>${onlineBadge} ${quarantinedBadge}</td>
                <td>${stateBadge}</td>
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
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Key Hash</th>
                    <th>Devices</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const statusBadge = user.revoked ? 
            '<span class="badge badge-danger">REVOKED</span>' : 
            '<span class="badge badge-safe">ACTIVE</span>';
        
        const created = new Date(user.created).toLocaleDateString();
        
        html += `
            <tr>
                <td><code style="font-family: var(--mono); font-size: 0.8rem; background: var(--zinc-100); padding: 4px 8px; border-radius: 4px;">${user.keyHash}</code></td>
                <td>
                    <div style="font-weight: 600;">${user.deviceCount} total</div>
                    <div style="font-size: 0.75rem; color: var(--zinc-500);">${user.armedCount} armed · ${user.onlineCount} online</div>
                </td>
                <td>${statusBadge}</td>
                <td style="font-size: 0.85rem;">${created}</td>
                <td>
                    ${user.revoked ? '<span style="color: var(--zinc-400); font-size: 0.8rem;">—</span>' : `
                        <button class="btn btn-danger" style="padding: 8px 16px; font-size: 0.8rem;" onclick="revokeUser('${user.fullHash}', '${user.keyHash}')">
                            <i data-lucide="x-circle" size="14"></i> Revoke
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

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
        'bulk-ops': 'bulkOpsView'
    };
    
    const targetView = document.getElementById(viewMap[viewName]);
    if (targetView) {
        targetView.classList.add('active');
        
        // Update page title
        const titles = {
            'overview': 'Overview',
            'devices': 'Devices',
            'users': 'Master Keys',
            'bulk-ops': 'Bulk Operations'
        };
        document.getElementById('pageTitle').textContent = titles[viewName];
        
        // Load data for specific views
        if (viewName === 'devices') {
            loadDevices();
        } else if (viewName === 'users') {
            loadUsers();
        }
    }
}

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
        } else {
            showToast('Error', data.error || 'Failed to disarm device', 'error');
        }
    } catch (error) {
        console.error('Disarm device error:', error);
        showToast('Error', 'Failed to disarm device', 'error');
    }
}

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

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function revokeUser(keyHash, displayHash) {
    if (!confirm(`⚠️ Are you sure you want to revoke this user (${displayHash})?\n\nThey will no longer be able to access their devices.`)) return;
    
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
        } else {
            showToast('Error', data.error || 'Failed to revoke user', 'error');
        }
    } catch (error) {
        console.error('Revoke user error:', error);
        showToast('Error', 'Failed to revoke user', 'error');
    }
}

async function editDevice(deviceId, currentName) {
    const newName = prompt('Enter new device name:', currentName);
    if (!newName || newName === currentName) return;
    
    try {
        const response = await fetch(`${API_URL}/api/system/device/update`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${systemAdminKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId, deviceName: newName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
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
        } else {
            showToast('Error', data.error || 'Failed to delete device', 'error');
        }
    } catch (error) {
        console.error('Delete device error:', error);
        showToast('Error', 'Failed to delete device', 'error');
    }
}

// UTILITY FUNCTIONS

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

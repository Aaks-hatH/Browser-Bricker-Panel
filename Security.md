# Security Documentation

BrowserBricker Security Architecture, Features, and Best Practices

## Table of Contents

- [Security Overview](#security-overview)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [Encryption](#encryption)
- [Anti-Bypass Mechanisms](#anti-bypass-mechanisms)
- [Breach Detection](#breach-detection)
- [Privacy](#privacy)
- [Best Practices](#best-practices)
- [Threat Model](#threat-model)
- [Security Updates](#security-updates)

---

## Security Overview

BrowserBricker employs multiple layers of security to ensure reliable device protection:

### Core Principles

1. **Defense in Depth**: Multiple overlapping security layers
2. **Zero Trust**: Every request authenticated and validated
3. **Fail-Secure**: Devices stay locked on connection loss
4. **Minimal Privilege**: Extensions run with least necessary permissions
5. **Transparency**: Open-source for security auditing

### Security Layers

```
┌─────────────────────────────────────────┐
│   Layer 1: Authentication               │ SHA-256 Keys
├─────────────────────────────────────────┤
│   Layer 2: Device Fingerprinting        │ Hardware ID
├─────────────────────────────────────────┤
│   Layer 3: Network Monitoring            │ IP Tracking
├─────────────────────────────────────────┤
│   Layer 4: Breach Detection              │ Anomaly Detection
├─────────────────────────────────────────┤
│   Layer 5: Quarantine System             │ Isolation
└─────────────────────────────────────────┘
```

---

## Architecture

### Component Security

#### Browser Extension

**Manifest V3 Security:**
- Service worker architecture (no persistent background pages)
- Strict Content Security Policy
- Minimal host permissions
- No eval() or arbitrary code execution

**Permissions Used:**
```json
{
  "permissions": [
    "storage",        // Local configuration
    "tabs",           // Tab management
    "webNavigation",  // Navigation control
    "alarms",         // Heartbeat timing
    "notifications",  // User alerts
    "geolocation",    // GPS tracking
    "offscreen"       // Location bridge
  ]
}
```

#### Server Communication

**HTTPS Only:**
- All API calls over TLS 1.3
- Certificate pinning recommended for production
- No downgrade to HTTP

**API Endpoints:**
```
https://browserbricker.onrender.com/api/
├── device/heartbeat     [POST] - Device check-in
├── device/register      [POST] - New device
├── device/arm           [POST] - Lock device
├── device/disarm        [POST] - Unlock device
├── device/geofence      [POST] - Set boundary
└── devices              [GET]  - List devices
```

### Data Flow

```
Extension → HTTPS → Load Balancer → API Server → Database
    ↓                                    ↓
 Encrypt                            Hash & Store
    ↓                                    ↓
GPS Data                           API Keys
Metadata                          Device States
```

---

## Authentication

### Master API Keys

**Generation:**
- 64 characters (256-bit entropy)
- Cryptographically secure random
- Generated server-side using `crypto.randomBytes(32)`

**Storage:**
- Client: User responsibility (password manager)
- Server: SHA-256 hashed
- Never transmitted in plaintext after initial generation
- No recovery mechanism (security by design)

**Usage:**
```
Authorization: Bearer <master-api-key>
```

**Validation:**
```javascript
const hash = crypto.createHash('sha256')
                   .update(providedKey)
                   .digest('hex');

// Compare with stored hash
if (hash === storedHash) {
  // Authenticated
}
```

### Device API Keys

**Purpose:**
- Authenticate individual devices
- Scoped to single device only
- Cannot manage other devices

**Generation:**
- Unique per device
- Same security as master keys (256-bit)
- Linked to device record in database

**Rotation:**
- Manual rotation by deleting and re-registering
- Recommended every 90 days for high-security environments

### Session Management

**User Sessions:**
- Stored in sessionStorage (browser-side)
- Cleared on logout or browser close
- No persistent cookies
- 24-hour timeout recommended

**Extension Sessions:**
- Persistent in chrome.storage.local
- Device stays configured until manually reset
- Encrypted in Chrome's extension storage

---

## Encryption

### Transport Layer

**TLS Configuration:**
- TLS 1.3 minimum
- Strong cipher suites only:
  - `TLS_AES_256_GCM_SHA384`
  - `TLS_CHACHA20_POLY1305_SHA256`
- Forward secrecy enabled

**Certificate:**
- Managed by Render.com hosting
- Automatic renewal
- Valid wildcard cert for `*.onrender.com`

### Data at Rest

**Server Database:**
- API key hashes (SHA-256)
- Encrypted connection strings
- No plaintext sensitive data

**Client Storage:**
- Chrome extension storage (encrypted by browser)
- Device API key stored locally
- Location history not stored locally

### Cryptographic Operations

**Fingerprinting:**
```javascript
async function generateFingerprint() {
    const data = navigator.userAgent + 
                 navigator.hardwareConcurrency + 
                 navigator.platform + 
                 navigator.language;
    
    const buffer = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    
    return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
}
```

**Nonce Generation:**
```javascript
const nonce = crypto.randomUUID(); // v4 UUID
```

---

## Anti-Bypass Mechanisms

### Extension Lock Enforcement

#### 1. Navigation Interception

**webNavigation API:**
```javascript
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (isArmed && details.frameId === 0) {
        const lockUrl = chrome.runtime.getURL('lock.html');
        if (!details.url.startsWith(lockUrl)) {
            chrome.tabs.update(details.tabId, { url: lockUrl });
        }
    }
});
```

**Coverage:**
- URL bar navigation
- Link clicks
- Form submissions
- JavaScript redirects

#### 2. Tab Creation Control

**tabs API:**
```javascript
chrome.tabs.onCreated.addListener((tab) => {
    if (isArmed) {
        setTimeout(() => {
            chrome.tabs.update(tab.id, { 
                url: chrome.runtime.getURL('lock.html') 
            });
        }, 50);
    }
});
```

#### 3. Lock Screen Hardening

**Keyboard Suppression:**
```javascript
document.addEventListener("keydown", (e) => {
    // Block all modifier keys
    if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }
    
    // Block function keys
    if (e.key.startsWith('F')) {
        e.preventDefault();
        return false;
    }
}, true);
```

**Interaction Blocking:**
```javascript
const blockedEvents = [
    "contextmenu", "copy", "cut", "paste",
    "dragstart", "selectstart", "mousedown",
    "wheel", "touchstart"
];

blockedEvents.forEach(event => {
    document.addEventListener(event, 
        (e) => e.preventDefault(), 
        true
    );
});
```

**DOM Self-Healing:**
```javascript
const snapshot = document.body.innerHTML;

setInterval(() => {
    if (document.body.innerHTML !== snapshot) {
        document.body.innerHTML = snapshot;
    }
}, 1000);
```

#### 4. Persistence System

**Multiple Keep-Alive Strategies:**

1. **Chrome Alarms** (30-second interval)
2. **Port Connection** (long-lived connection)
3. **Storage Access** (20-second pings)
4. **Offscreen Document** (maintains worker)
5. **Web Request Listener** (prevents termination)
6. **Self-Message Loop** (25-second pings)

**Result:**
- Service worker stays active indefinitely
- Heartbeat continues even during low activity
- Lock enforcement persists

### Known Limitations

**User Can Circumvent By:**

1. **Disabling Extension:**
   - Navigate to `chrome://extensions/`
   - Toggle BrowserBricker off
   - **Mitigation**: Requires user knowledge of extensions

2. **Removing Extension:**
   - Delete from extensions page
   - **Mitigation**: User must know about extension

3. **Using Another Browser:**
   - Switch to unprotected browser
   - **Mitigation**: Install on all browsers

4. **Booting Safe Mode:**
   - Start browser without extensions
   - **Mitigation**: System-level controls

**Why These Exist:**
- Chrome security model prevents extensions from being unremovable
- Physical device access provides ultimate control
- BrowserBricker is a deterrent, not a prison

**Additional Protections:**
- Combine with OS-level parental controls
- Use with full-disk encryption
- Implement BIOS passwords
- Enable Chrome policies for managed devices

---

## Breach Detection

### Monitored Events

BrowserBricker automatically detects and logs:

#### Authentication Anomalies
- Multiple failed API key attempts
- Requests from unexpected IPs
- Rapid key rotation
- Invalid device fingerprints

#### Behavioral Anomalies
- Unusual heartbeat patterns
- GPS coordinate jumping
- Rapid arm/disarm cycles
- Extension reinstallation

#### Security Events
- Geofence violations
- Quarantine escapes
- API rate limit hits
- Suspicious metadata changes

### Automatic Responses

**Level 1 - Logging:**
- Record event with timestamp
- Capture full context
- No automated action

**Level 2 - Alerting:**
- Increment breach counter
- Notify administrators
- Flag device in dashboard

**Level 3 - Quarantine:**
- Automatic device isolation
- Lock until manual review
- Prevent all remote unlocks

### Breach Reporting

**Admin Panel Access:**
```
Admin Dashboard → Security → Breach Detection
```

**Information Shown:**
- Device ID and name
- Breach type and count
- Timestamp and details
- Severity level
- Recommended actions

---

## Privacy

### Data Collection

**What We Collect:**

| Data Type | Purpose | Storage |
|-----------|---------|---------|
| Device fingerprint | Unique identification | Hashed |
| GPS coordinates | Geofencing | Encrypted |
| Battery level | Status monitoring | Temporary |
| Network type | Connectivity | Temporary |
| Browser/OS | Compatibility | Not stored |
| IP address | Security | Hashed |
| Timestamps | Activity tracking | Permanent |

**What We DON'T Collect:**
- Browsing history
- Passwords
- Personal files
- Keystrokes
- Screenshots
- Webcam/microphone

### Location Privacy

**GPS Tracking:**
- Only when explicitly enabled
- Requires user permission
- Can be disabled per device
- Accuracy: ±10-50 meters

**Location Data:**
- Encrypted in transit (TLS)
- Not shared with third parties
- Used only for geofencing
- Deleted on device removal

### Third-Party Services

**None.**

BrowserBricker uses:
- No analytics services
- No advertising networks  
- No tracking pixels
- No external CDNs (except fonts)

**Hosting:**
- Render.com (PaaS provider)
- Located in US data centers
- GDPR compliant
- SOC 2 Type II certified

---

## Best Practices

### For End Users

**API Key Management:**
1. Store master key in password manager
2. Use different master keys for different purposes
3. Never email keys to yourself
4. Don't screenshot keys to cloud storage
5. Treat keys like passwords

**Device Security:**
1. Use strong OS passwords
2. Enable full-disk encryption
3. Keep browser updated
4. Use HTTPS everywhere
5. Enable firewall

**Operational Security:**
1. Test locks before relying on them
2. Have backup admin access
3. Document device configurations
4. Regular security audits
5. Plan for emergency unlocks

### For Administrators

**System Hardening:**
1. Use admin panel IP whitelisting
2. Enable 2FA on admin accounts (when available)
3. Rotate admin keys quarterly
4. Monitor breach detection logs
5. Implement device naming standards

**Deployment:**
1. Pre-configure extensions before deployment
2. Document all device registrations
3. Create SOPs for common scenarios
4. Train users on expected behavior
5. Have rollback procedures ready

**Monitoring:**
1. Check system health daily
2. Review audit logs weekly
3. Investigate all breach alerts
4. Track device online/offline patterns
5. Maintain incident response plan

### For Developers

**Code Security:**
1. Never log API keys
2. Sanitize all user inputs
3. Use parameterized queries
4. Validate on server-side
5. Follow least privilege principle

**Deployment:**
1. Use environment variables for secrets
2. Keep dependencies updated
3. Run security scanners
4. Enable CORS properly
5. Implement rate limiting

---

## Threat Model

### Threat Actors

**1. Curious Teenager**
- **Capability**: Low technical skill
- **Goal**: Browse unrestricted
- **Method**: Try obvious bypasses
- **Mitigation**: Basic lock screen hardening sufficient

**2. Tech-Savvy User**
- **Capability**: Moderate technical skill
- **Goal**: Disable protection
- **Method**: Extension manipulation
- **Mitigation**: Extension can be disabled; combine with OS controls

**3. Malicious Insider**
- **Capability**: High technical skill, device access
- **Goal**: Complete system compromise
- **Method**: Multiple attack vectors
- **Mitigation**: Physical security, encryption, monitoring

**4. External Attacker**
- **Capability**: High technical skill, remote
- **Goal**: Unauthorized device control
- **Method**: API attacks, MITM, credential theft
- **Mitigation**: Strong authentication, TLS, rate limiting

### Attack Scenarios

#### Scenario 1: Extension Disable

**Attack:**
```
1. Navigate to chrome://extensions/
2. Find BrowserBricker
3. Toggle OFF
4. Browse unrestricted
```

**Defense:**
- Cannot prevent (Chrome security model)
- Use in combination with managed Chrome policies
- Deploy alongside OS-level parental controls
- Consider kiosk mode for high-security needs

#### Scenario 2: API Key Theft

**Attack:**
```
1. Access extension storage
2. Extract device API key
3. Use key to unlock remotely
```

**Defense:**
- Keys hashed in server storage
- Monitor for unusual API usage patterns
- Breach detection alerts on anomalies
- Geographic IP validation

#### Scenario 3: Geofence Spoofing

**Attack:**
```
1. Use GPS spoofing software
2. Fake location inside geofence
3. Bypass location lock
```

**Defense:**
- GPS spoofing possible with root/jailbreak
- Combine with IP geolocation validation
- Use smaller geofence radius
- Enable breach detection alerts

#### Scenario 4: Network Interception

**Attack:**
```
1. MITM attack on local network
2. Intercept API traffic
3. Extract keys or manipulate responses
```

**Defense:**
- TLS encryption prevents interception
- Certificate validation required
- No sensitive data in URLs
- Nonce-based replay protection

---

## Security Updates

### Vulnerability Reporting

**Found a security issue?**

1. **DO NOT** open a public GitHub issue
2. Email: browserbricker@gmail.com
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Timeline:**
- Acknowledgment: 24-48 hours
- Initial assessment: 3-5 days
- Fix implementation: Varies by severity
- Public disclosure: After fix deployed

### Version History

**v4.1.0 (Current)**
- Enhanced keep-alive system (6 strategies)
- Improved lock screen hardening
- GPS accuracy improvements
- Breach detection system
- Quarantine mode

**Security Patches:**
- Regular dependency updates
- Chrome API compatibility updates
- Server security hardening

### Update Procedure

**Extension Updates:**
1. Download latest release from GitHub
2. Remove old version from browser
3. Load new version unpacked
4. Verify configuration retained

**Server Updates:**
- Zero-downtime deployment
- Automatic failover
- Database migrations tested
- Rollback procedures ready

---

## Compliance

### Data Protection

**GDPR Considerations:**
- Right to access: Via API/dashboard
- Right to deletion: Via device deletion
- Right to portability: Data export available
- Privacy by design: Minimal data collection

**COPPA Considerations:**
- Parental consent: User responsibility
- No data selling: Guaranteed
- No tracking: No third-party analytics

### Terms of Use

Users are responsible for:
- Complying with local laws
- Obtaining necessary consent
- Proper use of monitoring capabilities
- Data protection obligations

BrowserBricker is provided as-is for legitimate device management purposes only.

---

## Security Checklist

Before deploying BrowserBricker, ensure:

- Master key stored in password manager
- Device API keys documented
- Geofencing tested if used
- Lock/unlock cycle tested
- Breach alerts configured
- Backup admin access available
- Users informed of monitoring
- Legal compliance verified
- Emergency procedures documented
- Regular security audits scheduled

---

**Security Documentation v4.1** • Last Updated: January 2026 • By Aakshat Hariharan

For security inquiries: browserbricker@gmail.com

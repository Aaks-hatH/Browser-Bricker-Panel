# BrowserBricker

**Advanced Remote Device Security & Management System**

[![Version](https://img.shields.io/badge/version-4.1.0-blue.svg)](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)](https://github.com/Aaks-hatH/Browser-Bricker-Panel)

> Enterprise-grade remote browser security with real-time device control, geofencing, and comprehensive security features.

Created by **Aakshat Hariharan** • 2026

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Security Architecture](#security-architecture)
- [Installation](#installation)
- [Quick Start Guide](#quick-start-guide)
- [User Dashboard](#user-dashboard)
- [Admin Panel](#admin-panel)
- [Advanced Features](#advanced-features)
- [FAQ](#faq)
- [Support](#support)
- [License](#license)

---

## Overview

BrowserBricker is a powerful remote device management system designed for:

- **Parents** monitoring children's device usage
- **Organizations** managing company computers
- **Individuals** securing personal devices against theft
- **Educational institutions** controlling lab computers

The system consists of three components:

1. **Browser Extension** - Installed on target devices
2. **User Control Panel** - Manage your devices remotely
3. **Admin Dashboard** - Enterprise management (optional)

### How It Works

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Your Device    │─────▶│  Cloud API   │◀─────│ Control Panel   │
│  (Extension)    │◀─────│  (Secure)    │─────▶│ (Your Phone)    │
└─────────────────┘      └──────────────┘      └─────────────────┘
        │                                               │
        └───────────── 2-Second Heartbeat ─────────────┘
```

---

## Key Features

### Core Security

- **Remote Lockdown**: Lock any device instantly from anywhere
- **Real-Time Control**: 2-second heartbeat ensures immediate response
- **Persistent Protection**: Advanced keep-alive system prevents bypass
- **Breach Detection**: Automatic security monitoring and alerts

### Location Services

- **GPS Tracking**: Real-time device location reporting
- **Geofencing**: Automatic lock when device leaves designated area
- **Location History**: Track device movement over time
- **High Accuracy**: Uses device GPS for precise positioning

### Advanced Security

- **Quarantine Mode**: Isolate compromised devices
- **IP Blocking**: Prevent access from suspicious networks
- **Device Fingerprinting**: Unique identification prevents spoofing
- **Encrypted Communications**: All data transmitted securely

### Monitoring & Analytics

- **Battery Status**: Monitor device power levels
- **Network Information**: Track connection type and speed
- **Online/Offline Status**: Real-time connectivity monitoring
- **Activity Logs**: Comprehensive audit trail

### User Experience

- **Clean Interface**: Modern, intuitive design
- **Mobile Friendly**: Manage devices from any device
- **Real-Time Updates**: Auto-refresh every 5 seconds
- **Toast Notifications**: Instant feedback on actions

---

## Security Architecture

### Multi-Layer Protection

```
Layer 1: Authentication (64-character API keys)
    ↓
Layer 2: Device Fingerprinting (Hardware identification)
    ↓
Layer 3: Network Security (IP monitoring & blocking)
    ↓
Layer 4: Breach Detection (Automated threat response)
    ↓
Layer 5: Quarantine System (Isolation protocols)
```

### Encryption & Privacy

- **API Keys**: SHA-256 hashed, never stored in plaintext
- **Transport Security**: All communications over HTTPS
- **Location Privacy**: GPS data encrypted in transit
- **No Third Parties**: Direct communication only

### Anti-Bypass Measures

1. **Navigation Interception**: Blocks all browsing attempts
2. **Tab Enforcement**: Redirects new tabs to lock screen
3. **Keyboard Suppression**: Disables shortcuts and commands
4. **Console Protection**: Prevents developer tools manipulation
5. **DOM Self-Healing**: Automatically repairs tampering
6. **Persistent Workers**: Multiple keep-alive strategies

---

## Installation

### Prerequisites

- Google Chrome, Microsoft Edge, or Chromium-based browser
- Version 88 or higher
- Active internet connection

### Step-by-Step Installation

1. **Download the Extension**
   ```bash
   git clone https://github.com/aakshathariharan/browserbricker.git
   cd browserbricker
   ```

2. **Load in Browser**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select the `browserbricker` folder

3. **Verify Installation**
   - Look for the BrowserBricker icon in your extensions
   - Icon should appear in the browser toolbar
   - Click icon to open the setup interface

### Alternative: Chrome Web Store

> Coming soon: One-click installation from Chrome Web Store

---

## Quick Start Guide

### For First-Time Users

#### 1. Create Your Account

1. Visit the Control Panel: `https://browserbricker.onrender.com`
2. Click **"CREATE ACCOUNT"** tab
3. Click **"GENERATE MASTER KEY"**
4. **IMPORTANT**: Copy and save your 64-character master key
   - Store it in a password manager
   - You cannot recover it if lost
   - This key controls all your devices

#### 2. Register Your First Device

1. Sign in to Control Panel with your master key
2. Click **"REGISTER DEVICE"**
3. Fill in device details:
   - **Device Name**: Friendly name (e.g., "Kid's Laptop")
   - **Tags**: Optional labels (e.g., "family, monitored")
   - **Location**: Optional description (e.g., "Home Office")
4. Click **"REGISTER DEVICE"**
5. **Copy the Device API Key** (64 characters)

#### 3. Configure the Extension

1. On the target device, click the BrowserBricker extension icon
2. Paste the **Device API Key** from step 2
3. Click **"Activate Protection"**
4. Extension will connect to the server
5. You should see "DISARMED" status and "ONLINE" connection

### Your First Lock

1. In the Control Panel, find your device
2. Click the **"ARM"** button
3. Within 2 seconds, the device will show the lock screen
4. To unlock, click **"DISARM"** in the Control Panel

---

## User Dashboard

### Accessing the Dashboard

Visit: `https://browserbricker.onrender.com`

Sign in with your master key.

### Dashboard Overview

```
┌─────────────────────────────────────────────┐
│  BROWSERBRICKER Control Panel               │
├─────────────────────────────────────────────┤
│  Statistics                                  │
│  ┌─────────┬─────────┬─────────┬──────────┐│
│  │ Total   │ Online  │ Armed   │Quarantine││
│  │   5     │   3     │   1     │    0     ││
│  └─────────┴─────────┴─────────┴──────────┘│
├─────────────────────────────────────────────┤
│  Your Devices                                │
│  ┌─────────────────────────────────────────┐│
│  │ Work Laptop               [ARMED]       ││
│  │    ID: a3f2...  │  Online  │  2m ago    ││
│  │    Tags: work, monitored                ││
│  │    [DISARM] [EDIT] [DELETE]            ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### Device Cards

Each device shows:

- **Name & Status**: Visual indicators for armed/disarmed
- **Online Status**: Green dot = online, gray = offline
- **Device ID**: Unique identifier (first 8 chars shown)
- **Last Seen**: Time since last heartbeat
- **Tags**: Custom labels for organization
- **Actions**: Quick control buttons

### Available Actions

| Action | Description |
|--------|-------------|
| **ARM** | Lock the device remotely |
| **DISARM** | Unlock the device |
| **EDIT** | Change device name/tags |
| **DELETE** | Permanently remove device |

### Statistics Panel

- **Total Devices**: All registered devices
- **Online Now**: Devices currently connected
- **Armed**: Devices in locked state
- **Quarantined**: Devices in isolation

---

## Admin Panel

### Access Requirements

Admin access requires an **Admin API Key**. Contact your system administrator or generate one with the backend secret code.

### Admin Dashboard URL

`https://browserbricker.onrender.com/admin.html`

### Admin Capabilities

#### 1. System Overview
- View all devices across all users
- Real-time system statistics
- Network health monitoring
- Server performance metrics

#### 2. Bulk Operations
- **Lock All Devices**: Emergency system-wide lockdown
- **Unlock All**: Release all active locks
- **Reason Tracking**: Document why actions were taken

#### 3. Security Management

**Quarantine System**
- Isolate compromised devices
- Prevent unlock until released
- Track quarantine history

**IP Blocking**
- Block suspicious IP addresses
- Monitor failed access attempts
- Whitelist trusted networks

**Breach Detection**
- Real-time security event monitoring
- Automatic threat response
- Detailed breach reports

#### 4. Geofencing Control
- View all active geofences
- Create new geographic boundaries
- Monitor location violations
- Automatic lock on boundary exit

#### 5. Location Tracking
- Live device GPS coordinates
- Real-time location feed (5-second refresh)
- Location history and patterns
- Accuracy indicators

#### 6. Advanced Features

**Audit Trail**
- Complete action history
- Filter by action type
- User accountability
- Timestamp tracking

**Notifications**
- System-wide alerts
- Severity levels (info, warning, critical)
- Event notifications

**Settings Management**
- Configure system parameters
- Update security policies
- Customize behavior

**System Logs**
- Real-time terminal output
- Error tracking
- Performance monitoring

---

## Advanced Features

### Geofencing

Create virtual boundaries for your devices.

**How to Set Up:**

1. Access Admin Panel
2. Navigate to **Geofencing**
3. Enter:
   - Device ID
   - Latitude (e.g., 40.712776)
   - Longitude (e.g., -74.005974)
   - Radius in meters (e.g., 1000)
4. Click **"Create Geofence"**

**What Happens:**
- Device checks location every heartbeat
- If device exits boundary, automatic lock
- Lock persists until manually released

**Finding Coordinates:**
1. Open Google Maps
2. Right-click your location
3. Click the coordinates that appear
4. Copy latitude and longitude

### Location Tracking

**Real-Time GPS Monitoring:**

Enable in extension:
1. Click extension icon
2. Toggle **"Enable Tracking"** switch
3. Grant location permissions when prompted

View locations:
- Admin Panel → **Location Tracking**
- Shows live coordinates
- Auto-refreshes every 5 seconds
- Displays accuracy in meters

**Privacy Note**: Location data is only transmitted when tracking is enabled and device is online.

### Quarantine Mode

**When to Use:**
- Suspected malware infection
- Security policy violation
- Device theft recovery
- Disciplinary action

**How It Works:**
1. Device is locked immediately
2. Cannot be unlocked remotely
3. Must be released by admin
4. All activity is logged

**Implementing Quarantine:**
- Admin Panel → **Quarantine**
- Enter device ID
- Provide reason
- Click **"Quarantine Device"**

**Releasing from Quarantine:**
- Find device in Quarantine list
- Click **"Release"**
- Device returns to normal state

### Breach Detection

**Monitored Events:**
- Multiple failed access attempts
- Suspicious API requests
- Geofence violations
- Rapid state changes
- Unusual patterns

**Automatic Responses:**
- Increment breach counter
- Log detailed information
- Notify administrators
- Optional auto-quarantine

**Viewing Breaches:**
- Admin Panel → **Breach Detection**
- Lists all security events
- Shows severity levels
- Device-specific details

---

## FAQ

### General Questions

**Q: Is BrowserBricker free to use?**  
A: Yes, the open-source version is completely free.

**Q: What browsers are supported?**  
A: All Chromium-based browsers: Chrome, Edge, Brave, Opera, Vivaldi.

**Q: Does it work on mobile?**  
A: The extension is for desktop browsers. Control panels work on mobile devices.

**Q: How many devices can I manage?**  
A: Unlimited devices per master key.

### Security Questions

**Q: Can the lock screen be bypassed?**  
A: The extension uses multiple anti-bypass techniques, but determined users with advanced technical knowledge could potentially remove the extension. Physical device access provides additional security.

**Q: What if I lose my master key?**  
A: Master keys cannot be recovered. This is a security feature. You'll need to generate a new master key and re-register devices.

**Q: Is my location data private?**  
A: Yes. Location data is encrypted in transit and only accessible through your authenticated account.

**Q: What happens if the internet connection is lost?**  
A: Armed devices stay locked until connection is restored. Disarmed devices remain accessible.

### Technical Questions

**Q: How often does the device check in?**  
A: Every 2 seconds for real-time control.

**Q: Does this drain battery?**  
A: Minimal impact. The extension is designed for efficiency.

**Q: Can I use this on multiple accounts?**  
A: Yes, create separate master keys for different account needs.

**Q: How do I update the extension?**  
A: Download the latest version and reload the extension in Chrome.

### Troubleshooting

**Q: Extension shows "Offline"**  
A: Check internet connection. Verify API URLs are accessible.

**Q: Device won't lock**  
A: Ensure device is online. Check browser hasn't disabled extension.

**Q: Can't generate master key**  
A: Verify you're accessing the correct URL. Check browser console for errors.

**Q: Lock screen doesn't appear**  
A: Verify extension is enabled. Check for browser permission issues.

---

## Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/Aaks-hatH/Browser-Bricker-Panel/issues)
- **Documentation**: [Wiki](https://github.com/Aaks-hatH/Browser-Bricker-Panel/wiki)
- **Email**: browserbricker@gmail.com

### Reporting Bugs

When reporting issues, please include:

1. BrowserBricker version (4.1.0)
2. Browser type and version
3. Operating system
4. Steps to reproduce
5. Expected vs actual behavior
6. Screenshots if applicable

### Feature Requests

Submit feature requests via GitHub Issues with the `enhancement` label.

---

## Support the Project

If you find BrowserBricker useful, consider supporting its development:

**Buy Me a Coffee**: [buymeacoffee.com/hariharanar](buymeacoffee.com/hariharanar)

Your support helps maintain and improve BrowserBricker for everyone.

---

## License

MIT License

Copyright (c) 2026 Aakshat Hariharan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

Built with:
- Chrome Extension Manifest V3
- Modern JavaScript (ES2020+)
- Web Crypto API
- Geolocation API

Special thanks to the open-source community for inspiration and support.

---

## Responsible Use

BrowserBricker is a powerful tool. Please use it responsibly:

**Do:**
- Use for legitimate device management
- Inform users that devices are monitored
- Respect privacy and legal boundaries
- Follow applicable laws and regulations

**Don't:**
- Use for unauthorized surveillance
- Deploy without consent where required
- Violate privacy laws
- Use for malicious purposes

**Legal Notice**: Users are responsible for complying with all applicable laws in their jurisdiction regarding device monitoring and privacy.

---

**Made with care by Aakshat Hariharan**

[GitHub](https://github.com/Aaks-hatH/Browser-Bricker-Panel) • [Report Issue](https://github.com/Aaks-hatH/Browser-Bricker-Panel/issues) • [Documentation](https://github.com/Aaks-hatH/Browser-Bricker-Panel/wiki)

# BrowserBricker

**Advanced Remote Device Security & Management System**

[![Version](https://img.shields.io/badge/version-5.0.0-blue.svg)](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)](https://github.com/Aaks-hatH/Browser-Bricker-Panel)

> Enterprise-grade remote browser security with real-time device control, geofencing, and comprehensive security features.

Created by **Aakshat Hariharan** • 2026

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Security Architecture](#security-architecture)
- [Getting Started](#getting-started)
- [Using BrowserBricker](#using-browserbricker)
- [Advanced Features](#advanced-features)
- [FAQ](#faq)
- [Support](#support)
- [License](#license)

---

## Overview

BrowserBricker is a powerful remote device management system designed for:

- **Parents** monitoring children's device usage
- **Organizations** managing company computers
- **Educational institutions** controlling lab computers
- **Businesses** requiring enterprise device control

The system consists of two main components:

1. **Browser Extension** - Installed on target devices
2. **Web Control Panel** - Manage your devices remotely

### How It Works

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Your Device    │─────▶│BrowserBricker│◀─────│ Control Panel   │
│  (Extension)    │◀─────│Cloud Service │─────▶│ (Any Browser)   │
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
- **Reliable Service**: Enterprise infrastructure ensures uptime

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
- **Audit Trails**: Complete action history

### Monitoring & Analytics

- **Battery Status**: Monitor device power levels
- **Network Information**: Track connection type and speed
- **Online/Offline Status**: Real-time connectivity monitoring
- **Activity Logs**: Comprehensive audit trail
- **Statistics Dashboard**: Overview of all managed devices

### User Experience

- **Clean Interface**: Modern, intuitive design
- **Mobile Friendly**: Manage devices from any device
- **Real-Time Updates**: Auto-refresh every 5 seconds
- **Instant Feedback**: Toast notifications for all actions
- **Multi-Device Support**: Manage unlimited devices

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
    ↓
Layer 6: Cloud Infrastructure (Reliable & secure)
```

### Encryption & Privacy

- **API Keys**: SHA-256 hashed, never stored in plaintext
- **Transport Security**: All communications over HTTPS
- **Location Privacy**: GPS data encrypted in transit
- **Cloud Security**: Enterprise-grade infrastructure
- **No Third Parties**: Direct communication only

### Anti-Bypass Measures

1. **Navigation Interception**: Blocks all browsing attempts
2. **Tab Enforcement**: Redirects new tabs to lock screen
3. **Keyboard Suppression**: Disables shortcuts and commands
4. **Console Protection**: Prevents developer tools manipulation
5. **DOM Self-Healing**: Automatically repairs tampering
6. **Persistent Workers**: Multiple keep-alive strategies

---

## Getting Started

### Prerequisites

- Google Chrome, Microsoft Edge, or Chromium-based browser
- Version 88 or higher
- Active internet connection

### Installation

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

### Create Your Account

1. Visit: `https://browserbricker.onrender.com`
2. Click **"CREATE ACCOUNT"**
3. Click **"GENERATE MASTER KEY"**
4. **IMPORTANT**: Copy and save your 64-character master key
   - Store it in a password manager
   - You cannot recover it if lost
   - This key controls all your devices

### Register Your First Device

1. Sign in to Control Panel with your master key
2. Click **"REGISTER DEVICE"**
3. Enter device details:
   - **Device Name**: Friendly name (e.g., "Kid's Laptop")
   - **Tags**: Optional labels (e.g., "family, monitored")
4. Click **"REGISTER DEVICE"**
5. **Copy the Device API Key** (64 characters)

### Configure the Extension

1. On the target device, click the BrowserBricker extension icon
2. Paste the **Device API Key**
3. Click **"Activate Protection"**
4. Extension will connect to the service
5. You should see "DISARMED" status and "ONLINE" connection

---

## Using BrowserBricker

### Control Panel

Access the control panel at: `https://browserbricker.onrender.com`

**Dashboard Overview:**

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

### Device Actions

| Action | Description |
|--------|-------------|
| **ARM** | Lock the device remotely |
| **DISARM** | Unlock the device |
| **EDIT** | Change device name/tags |
| **DELETE** | Permanently remove device |

### Locking a Device

1. In the Control Panel, find your device
2. Click the **"ARM"** button
3. Within 2 seconds, the device will show the lock screen
4. The lock persists until you disarm it

### Unlocking a Device

1. In the Control Panel, find the armed device
2. Click the **"DISARM"** button
3. Device will unlock within 2 seconds
4. User can resume normal browsing

---

## Advanced Features

### Geofencing

Create virtual boundaries for automatic device control.

**Contact the service owner** at browserbricker@gmail.com to set up geofencing for your devices.

**How It Works:**
- Define a geographic area (latitude, longitude, radius)
- Device automatically locks when leaving the area
- Lock persists until manually released
- All events logged for audit trail

### Location Tracking

**Real-Time GPS Monitoring:**

Enable in extension:
1. Click extension icon
2. Toggle **"Enable Tracking"** switch
3. Grant location permissions when prompted

View locations in the Control Panel to see real-time GPS coordinates.

### Quarantine Mode

**For Maximum Security:**

Contact browserbricker@gmail.com to quarantine a device.

**What Quarantine Does:**
- Locks device immediately
- Prevents remote unlock
- Requires service administrator to release
- All activity logged

**When to Use:**
- Suspected malware infection
- Security policy violation
- Device theft recovery
- Emergency lockdown

### Breach Detection

**Automatic Security Monitoring:**

The system automatically detects:
- Multiple failed access attempts
- Suspicious API requests
- Geofence violations
- Unusual patterns

**Automatic Responses:**
- Security events logged
- Administrators notified
- Optional auto-quarantine
- Complete audit trail

---

## FAQ

### General Questions

**Q: Is BrowserBricker free to use?**  
A: The browser extension is open-source. The cloud service is provided by the developer.

**Q: What browsers are supported?**  
A: All Chromium-based browsers: Chrome, Edge, Brave, Opera, Vivaldi.

**Q: Does it work on mobile?**  
A: The extension is for desktop browsers. Control panels work on any device.

**Q: How many devices can I manage?**  
A: Unlimited devices per account.

**Q: Is the service reliable?**  
A: Yes, the service runs on enterprise-grade infrastructure with high uptime.

### Security Questions

**Q: Can the lock screen be bypassed?**  
A: The extension uses multiple anti-bypass techniques. Physical device access allows extension removal.

**Q: What if I lose my master key?**  
A: Master keys cannot be recovered. Generate a new key and re-register devices.

**Q: Is my location data private?**  
A: Yes. Location data is encrypted and only accessible through your authenticated account.

**Q: What happens if the service is down?**  
A: Armed devices stay locked. Disarmed devices remain accessible.

### Account Questions

**Q: How do I become a System Administrator?**  
A: Contact browserbricker@gmail.com with your organization details.

**Q: Can I manage multiple organizations?**  
A: System Administrators can manage their assigned organization. Contact the service owner for additional access.

**Q: How do I report a bug?**  
A: Email browserbricker@gmail.com with issue details and screenshots.

### Technical Questions

**Q: How often does the device check in?**  
A: Every 2 seconds for real-time control.

**Q: Does this drain battery?**  
A: Minimal impact. The extension is optimized for efficiency.

**Q: Can I use this on multiple accounts?**  
A: Yes, create separate master keys for different purposes.

**Q: How do I update the extension?**  
A: Download the latest version and reload in Chrome.

---

## Support

### Getting Help

- **Bug Reports**: browserbricker@gmail.com
- **Feature Requests**: browserbricker@gmail.com
- **System Admin Access**: browserbricker@gmail.com
- **Security Issues**: browserbricker@gmail.com (confidential)
- **General Questions**: browserbricker@gmail.com

### Reporting Issues

When reporting issues, please include:

1. BrowserBricker version (5.0.0)
2. Browser type and version
3. Operating system
4. Steps to reproduce
5. Expected vs actual behavior
6. Screenshots if applicable

### System Administrator Access

Organizations requiring system administrator access should contact:

**Email**: browserbricker@gmail.com

**Include:**
- Organization name
- Intended use case
- Number of devices to be managed
- Contact information

**Response Time:**
- We respond to all inquiries within 24-48 hours

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
- Enterprise Cloud Infrastructure

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

**Service URL**: https://browserbricker.onrender.com

**Contact**: browserbricker@gmail.com

[GitHub](https://github.com/Aaks-hatH/Browser-Bricker-Panel) • [Report Issue](mailto:browserbricker@gmail.com) • [System Admin Access](mailto:browserbricker@gmail.com)
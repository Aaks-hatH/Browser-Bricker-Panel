# Installation Guide

Complete step-by-step instructions for installing and configuring BrowserBricker.

## Table of Contents

- [System Requirements](#system-requirements)
- [Extension Installation](#extension-installation)
- [Account Setup](#account-setup)
- [Device Registration](#device-registration)
- [First Lock Test](#first-lock-test)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Supported Browsers

- Google Chrome (v88+)
- Microsoft Edge (v88+)
- Brave Browser (v1.20+)
- Opera (v74+)
- Vivaldi (v3.6+)
- Any Chromium-based browser

### Operating Systems

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu, Fedora, etc.)
- Chrome OS

### Requirements

- Active internet connection
- JavaScript enabled
- Location services (for geofencing features)

---

## Extension Installation

### Method 1: Manual Installation (Recommended)

#### Step 1: Download

```bash
# Clone the repository
git clone https://github.com/Aaks-hatH/browserbricker.git

# Navigate to directory
cd browserbricker
```

Or download ZIP:
1. Visit [GitHub Repository](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
2. Click **Code** → **Download ZIP**
3. Extract to a permanent location (don't delete after installation)

#### Step 2: Load Extension

**For Chrome/Edge:**

1. Open browser and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable **Developer Mode**:
   - Look for toggle in top-right corner
   - Switch to ON position

3. Click **Load Unpacked**

4. Select the `browserbricker` folder

5. Extension should now appear in your extensions list

**For Other Chromium Browsers:**

Same process, use your browser's extension page:
- Brave: `brave://extensions/`
- Opera: `opera://extensions/`
- Vivaldi: `vivaldi://extensions/`

#### Step 3: Verify Installation

1. Look for BrowserBricker icon in browser toolbar
2. Icon should show a lock symbol
3. Click icon - you should see the setup screen
4. Status should indicate "Not Configured"

### Method 2: Chrome Web Store (Coming Soon)

One-click installation will be available from the Chrome Web Store.

---

## Account Setup

### Creating Your Master Key

Your master key is the root credential for your account. It controls all devices.

1. **Access Control Panel**
   ```
   https://browser-bricker-panel.onrender.com/main
   ```

2. **Generate Master Key**
   - Click **"CREATE ACCOUNT"** tab
   - Click **"GENERATE MASTER KEY"** button
   - Wait for generation (takes 1-2 seconds)

3. **Save Your Master Key**
   
   **CRITICAL: This key is shown only once!**
   
   The key looks like:
   ```
   a7f3c8e2d1b9f5a4c6e8d2b1f7a3c5e9d4b2f8a6c3e1d7b5f2a9c4e6d8b3f1a5c7e2
   ```
   
   **Where to save it:**
   - Password manager (1Password, LastPass, Bitwarden)
   - Encrypted note file
   - Offline secure storage
   
   **Where NOT to save it:**
   - Plain text file on desktop
   - Email to yourself
   - Screenshot on cloud storage
   - Unencrypted notes app

4. **Copy Master Key**
   - Click **"COPY KEY"** button
   - Paste into your password manager
   - Click **"COPY KEY & CONTINUE"**

5. **First Login**
   - You'll be redirected to login screen
   - Master key auto-filled temporarily
   - Click **"ACCESS DASHBOARD"**
   - You're now in your control panel

### Understanding Master Keys

**Security Features:**
- 64 characters (256-bit entropy)
- Cryptographically random
- SHA-256 hashed on server
- Never stored in plaintext
- Cannot be recovered if lost

**What Master Keys Control:**
- Register new devices
- Arm/disarm devices
- Delete devices
- View device status
- Access all your data

---

## Device Registration

Now that you have your account, register your first device.

### Step 1: Initiate Registration

In the Control Panel:

1. Click **"REGISTER DEVICE"** button (top right)
2. Registration modal opens

### Step 2: Fill Device Information

**Required:**
- **Device Name**: Give it a friendly name
  - Examples: "Living Room PC", "Sarah's Laptop", "Office Computer"
  - Use descriptive names for easy identification

**Optional:**
- **Tags**: Comma-separated labels for organization
  - Examples: "work", "family", "monitored", "school"
  - Helps filter and search devices later

- **Location**: Physical location description
  - Examples: "Home Office", "Kid's Bedroom", "Library Computer"
  - Not GPS coordinates - just a label

### Step 3: Register

1. Click **"REGISTER DEVICE"**
2. Server creates device record
3. Device API Key is generated
4. Modal shows your new key

### Step 4: Save Device API Key

You'll see a 64-character key:

```
d8f2a9c5e7b3f1a6c4e2d9b7f5a3c8e6d1b4f9a2c7e5d3b8f6a1c9e4d2b7f5a3c8e
```

**Important:**
- This key is shown only once
- It authenticates this specific device
- Store it temporarily (you'll use it in next step)
- Click **"COPY KEY"**

### Step 5: Configure Extension

On the device you want to protect:

1. **Open Extension**
   - Click BrowserBricker icon in toolbar
   - Setup screen should appear

2. **Enter Device API Key**
   - Paste the 64-character key from Step 4
   - Key will appear as dots (password field)

3. **Activate Protection**
   - Click **"Activate Protection"**
   - Extension connects to server
   - Wait for confirmation (2-5 seconds)

4. **Verify Connection**
   - Status should change to **"DISARMED"**
   - Connection should show **"ONLINE"**
   - Device name appears
   - Location/battery info may populate

### Step 6: Verify in Control Panel

Back in your Control Panel:

1. Refresh the page (or wait 5 seconds for auto-refresh)
2. Your new device should appear in the list
3. Status indicators:
   - Online (green)
   - Disarmed (unlocked)
   - Last seen: "just now"

---

## First Lock Test

Test that everything works correctly.

### Locking the Device

1. **In Control Panel:**
   - Find your device in the list
   - Click the **"ARM"** button
   - Button changes to green with lock icon

2. **On Target Device:**
   - Within 2 seconds, all tabs redirect
   - Lock screen appears
   - Browser becomes locked

3. **Lock Screen Features:**
   - Cannot navigate away
   - Keyboard shortcuts disabled
   - Context menu blocked
   - F12/DevTools suppressed

### Unlocking the Device

1. **In Control Panel:**
   - Find the device (will show Armed status)
   - Click the **"DISARM"** button
   - Button changes to red with unlock icon

2. **On Target Device:**
   - Within 2 seconds, lock releases
   - Can navigate normally
   - All functionality restored

### What to Test

**Verify These Work:**
- Device locks within 2 seconds
- Lock screen appears on all tabs
- New tabs show lock screen
- Navigation is blocked
- Device unlocks within 2 seconds
- Normal browsing resumes after unlock

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Offline" status | Check internet connection |
| Slow lock (>5 sec) | Verify server accessibility |
| Lock doesn't appear | Check extension is enabled |
| Can still browse | Reload extension and retry |

---

## Troubleshooting

### Extension Issues

#### "Extension Not Loading"

**Symptoms:** Extension doesn't appear in toolbar or extensions list

**Solutions:**
1. Ensure Developer Mode is enabled
2. Try reloading the extension:
   - Go to `chrome://extensions/`
   - Find BrowserBricker
   - Click reload icon (circular arrow)
3. Check browser console for errors (F12)

#### "Setup Screen Won't Appear"

**Symptoms:** Clicking icon does nothing

**Solutions:**
1. Right-click extension icon → Inspect popup
2. Check for JavaScript errors
3. Verify `popup.html` and `popup.js` exist
4. Reload extension

#### "Cannot Activate Protection"

**Symptoms:** Error when entering device key

**Solutions:**
1. Verify key is exactly 64 characters
2. Check for extra spaces at start/end
3. Confirm internet connection
4. Verify API server is accessible:
   ```
   https://browserbricker.onrender.com/health
   ```

### Connection Issues

#### "Shows Offline"

**Symptoms:** Extension shows "OFFLINE" badge

**Solutions:**
1. Check internet connection
2. Verify firewall isn't blocking:
   - `browserbricker.onrender.com`
   - Port 443 (HTTPS)
3. Try manual heartbeat:
   - Click extension icon
   - Click "Refresh Status"
4. Check server status

#### "Lock Delayed"

**Symptoms:** Device takes >5 seconds to lock

**Solutions:**
1. Check network latency
2. Verify 2-second heartbeat is running:
   - Open browser console
   - Look for `[Lockdown] Heartbeat` messages
3. Reload extension to restart heartbeat

### Lock Screen Issues

#### "Can Navigate Away from Lock"

**Symptoms:** User can still browse despite lock

**Solutions:**
1. Verify extension is enabled:
   - `chrome://extensions/`
   - BrowserBricker toggle is ON
2. Check extension permissions granted
3. Reload extension
4. Clear browser cache

#### "Lock Screen Looks Broken"

**Symptoms:** Styling issues, missing elements

**Solutions:**
1. Verify `lock.html` exists and is intact
2. Check browser console for errors
3. Reload the lock screen tab
4. Update extension to latest version

### Account Issues

#### "Lost Master Key"

**Symptoms:** Cannot access account

**Solutions:**
- Master keys cannot be recovered
- You must generate a new master key
- All devices must be re-registered
- This is a security feature, not a bug

**Prevention:**
- Always store master key in password manager
- Keep backup in secure location
- Don't rely on browser autofill

#### "Device Not Appearing in Panel"

**Symptoms:** Registered device doesn't show up

**Solutions:**
1. Refresh the control panel
2. Wait 5 seconds for auto-refresh
3. Verify device is online (check extension)
4. Check device API key is correct
5. Try registering again

### Advanced Debugging

#### Enable Debug Mode

Add to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

This enables verbose logging.

#### Check Heartbeat Status

In browser console on target device:
```javascript
chrome.storage.local.get(['deviceConfig', 'isArmed'], console.log);
```

#### Verify API Connectivity

Test API endpoint:
```bash
curl https://browserbricker.onrender.com/health
```

Should return: `{"status": "ok"}`

#### Reset Extension

Complete reset:
1. Open extension popup
2. Click "Reconfigure Device"
3. Confirm reset
4. Re-enter device API key

---

## Next Steps

After successful installation:

1. **Explore Features**
   - Test geofencing
   - Enable location tracking
   - Try quarantine mode

2. **Register Additional Devices**
   - Repeat device registration process
   - Organize with tags

3. **Set Up Admin Panel** (Optional)
   - Access advanced features
   - Bulk operations
   - System monitoring

4. **Read Documentation**
   - [User Guide](FEATURES.md)
   - [Security Best Practices](SECURITY.md)
   - [FAQ](README.md#faq)

---

## Support

Need help? 

- Email: browserbricker@gmail.com
- Issues: [GitHub Issues](# Installation Guide

Complete step-by-step instructions for installing and configuring BrowserBricker.

## Table of Contents

- [System Requirements](#system-requirements)
- [Extension Installation](#extension-installation)
- [Account Setup](#account-setup)
- [Device Registration](#device-registration)
- [First Lock Test](#first-lock-test)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Supported Browsers

- Google Chrome (v88+)
- Microsoft Edge (v88+)
- Brave Browser (v1.20+)
- Opera (v74+)
- Vivaldi (v3.6+)
- Any Chromium-based browser

### Operating Systems

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu, Fedora, etc.)
- Chrome OS

### Requirements

- Active internet connection
- JavaScript enabled
- Location services (for geofencing features)

---

## Extension Installation

### Method 1: Manual Installation (Recommended)

#### Step 1: Download

```bash
# Clone the repository
git clone https://github.com/Aaks-hatH/browserbricker.git

# Navigate to directory
cd browserbricker
```

Or download ZIP:
1. Visit [GitHub Repository](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
2. Click **Code** → **Download ZIP**
3. Extract to a permanent location (don't delete after installation)

#### Step 2: Load Extension

**For Chrome/Edge:**

1. Open browser and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable **Developer Mode**:
   - Look for toggle in top-right corner
   - Switch to ON position

3. Click **Load Unpacked**

4. Select the `browserbricker` folder

5. Extension should now appear in your extensions list

**For Other Chromium Browsers:**

Same process, use your browser's extension page:
- Brave: `brave://extensions/`
- Opera: `opera://extensions/`
- Vivaldi: `vivaldi://extensions/`

#### Step 3: Verify Installation

1. Look for BrowserBricker icon in browser toolbar
2. Icon should show a lock symbol
3. Click icon - you should see the setup screen
4. Status should indicate "Not Configured"

### Method 2: Chrome Web Store (Coming Soon)

One-click installation will be available from the Chrome Web Store.

---

## Account Setup

### Creating Your Master Key

Your master key is the root credential for your account. It controls all devices.

1. **Access Control Panel**
   ```
   https://browser-bricker-panel.onrender.com/main
   ```

2. **Generate Master Key**
   - Click **"CREATE ACCOUNT"** tab
   - Click **"GENERATE MASTER KEY"** button
   - Wait for generation (takes 1-2 seconds)

3. **Save Your Master Key**
   
   **CRITICAL: This key is shown only once!**
   
   The key looks like:
   ```
   a7f3c8e2d1b9f5a4c6e8d2b1f7a3c5e9d4b2f8a6c3e1d7b5f2a9c4e6d8b3f1a5c7e2
   ```
   
   **Where to save it:**
   - Password manager (1Password, LastPass, Bitwarden)
   - Encrypted note file
   - Offline secure storage
   
   **Where NOT to save it:**
   - Plain text file on desktop
   - Email to yourself
   - Screenshot on cloud storage
   - Unencrypted notes app

4. **Copy Master Key**
   - Click **"COPY KEY"** button
   - Paste into your password manager
   - Click **"COPY KEY & CONTINUE"**

5. **First Login**
   - You'll be redirected to login screen
   - Master key auto-filled temporarily
   - Click **"ACCESS DASHBOARD"**
   - You're now in your control panel

### Understanding Master Keys

**Security Features:**
- 64 characters (256-bit entropy)
- Cryptographically random
- SHA-256 hashed on server
- Never stored in plaintext
- Cannot be recovered if lost

**What Master Keys Control:**
- Register new devices
- Arm/disarm devices
- Delete devices
- View device status
- Access all your data

---

## Device Registration

Now that you have your account, register your first device.

### Step 1: Initiate Registration

In the Control Panel:

1. Click **"REGISTER DEVICE"** button (top right)
2. Registration modal opens

### Step 2: Fill Device Information

**Required:**
- **Device Name**: Give it a friendly name
  - Examples: "Living Room PC", "Sarah's Laptop", "Office Computer"
  - Use descriptive names for easy identification

**Optional:**
- **Tags**: Comma-separated labels for organization
  - Examples: "work", "family", "monitored", "school"
  - Helps filter and search devices later

- **Location**: Physical location description
  - Examples: "Home Office", "Kid's Bedroom", "Library Computer"
  - Not GPS coordinates - just a label

### Step 3: Register

1. Click **"REGISTER DEVICE"**
2. Server creates device record
3. Device API Key is generated
4. Modal shows your new key

### Step 4: Save Device API Key

You'll see a 64-character key:

```
d8f2a9c5e7b3f1a6c4e2d9b7f5a3c8e6d1b4f9a2c7e5d3b8f6a1c9e4d2b7f5a3c8e
```

**Important:**
- This key is shown only once
- It authenticates this specific device
- Store it temporarily (you'll use it in next step)
- Click **"COPY KEY"**

### Step 5: Configure Extension

On the device you want to protect:

1. **Open Extension**
   - Click BrowserBricker icon in toolbar
   - Setup screen should appear

2. **Enter Device API Key**
   - Paste the 64-character key from Step 4
   - Key will appear as dots (password field)

3. **Activate Protection**
   - Click **"Activate Protection"**
   - Extension connects to server
   - Wait for confirmation (2-5 seconds)

4. **Verify Connection**
   - Status should change to **"DISARMED"**
   - Connection should show **"ONLINE"**
   - Device name appears
   - Location/battery info may populate

### Step 6: Verify in Control Panel

Back in your Control Panel:

1. Refresh the page (or wait 5 seconds for auto-refresh)
2. Your new device should appear in the list
3. Status indicators:
   - Online (green)
   - Disarmed (unlocked)
   - Last seen: "just now"

---

## First Lock Test

Test that everything works correctly.

### Locking the Device

1. **In Control Panel:**
   - Find your device in the list
   - Click the **"ARM"** button
   - Button changes to green with lock icon

2. **On Target Device:**
   - Within 2 seconds, all tabs redirect
   - Lock screen appears
   - Browser becomes locked

3. **Lock Screen Features:**
   - Cannot navigate away
   - Keyboard shortcuts disabled
   - Context menu blocked
   - F12/DevTools suppressed

### Unlocking the Device

1. **In Control Panel:**
   - Find the device (will show Armed status)
   - Click the **"DISARM"** button
   - Button changes to red with unlock icon

2. **On Target Device:**
   - Within 2 seconds, lock releases
   - Can navigate normally
   - All functionality restored

### What to Test

**Verify These Work:**
- Device locks within 2 seconds
- Lock screen appears on all tabs
- New tabs show lock screen
- Navigation is blocked
- Device unlocks within 2 seconds
- Normal browsing resumes after unlock

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Offline" status | Check internet connection |
| Slow lock (>5 sec) | Verify server accessibility |
| Lock doesn't appear | Check extension is enabled |
| Can still browse | Reload extension and retry |

---

## Troubleshooting

### Extension Issues

#### "Extension Not Loading"

**Symptoms:** Extension doesn't appear in toolbar or extensions list

**Solutions:**
1. Ensure Developer Mode is enabled
2. Try reloading the extension:
   - Go to `chrome://extensions/`
   - Find BrowserBricker
   - Click reload icon (circular arrow)
3. Check browser console for errors (F12)

#### "Setup Screen Won't Appear"

**Symptoms:** Clicking icon does nothing

**Solutions:**
1. Right-click extension icon → Inspect popup
2. Check for JavaScript errors
3. Verify `popup.html` and `popup.js` exist
4. Reload extension

#### "Cannot Activate Protection"

**Symptoms:** Error when entering device key

**Solutions:**
1. Verify key is exactly 64 characters
2. Check for extra spaces at start/end
3. Confirm internet connection
4. Verify API server is accessible:
   ```
   https://browserbricker.onrender.com/health
   ```

### Connection Issues

#### "Shows Offline"

**Symptoms:** Extension shows "OFFLINE" badge

**Solutions:**
1. Check internet connection
2. Verify firewall isn't blocking:
   - `browserbricker.onrender.com`
   - Port 443 (HTTPS)
3. Try manual heartbeat:
   - Click extension icon
   - Click "Refresh Status"
4. Check server status

#### "Lock Delayed"

**Symptoms:** Device takes >5 seconds to lock

**Solutions:**
1. Check network latency
2. Verify 2-second heartbeat is running:
   - Open browser console
   - Look for `[Lockdown] Heartbeat` messages
3. Reload extension to restart heartbeat

### Lock Screen Issues

#### "Can Navigate Away from Lock"

**Symptoms:** User can still browse despite lock

**Solutions:**
1. Verify extension is enabled:
   - `chrome://extensions/`
   - BrowserBricker toggle is ON
2. Check extension permissions granted
3. Reload extension
4. Clear browser cache

#### "Lock Screen Looks Broken"

**Symptoms:** Styling issues, missing elements

**Solutions:**
1. Verify `lock.html` exists and is intact
2. Check browser console for errors
3. Reload the lock screen tab
4. Update extension to latest version

### Account Issues

#### "Lost Master Key"

**Symptoms:** Cannot access account

**Solutions:**
- Master keys cannot be recovered
- You must generate a new master key
- All devices must be re-registered
- This is a security feature, not a bug

**Prevention:**
- Always store master key in password manager
- Keep backup in secure location
- Don't rely on browser autofill

#### "Device Not Appearing in Panel"

**Symptoms:** Registered device doesn't show up

**Solutions:**
1. Refresh the control panel
2. Wait 5 seconds for auto-refresh
3. Verify device is online (check extension)
4. Check device API key is correct
5. Try registering again

### Advanced Debugging

#### Enable Debug Mode

Add to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

This enables verbose logging.

#### Check Heartbeat Status

In browser console on target device:
```javascript
chrome.storage.local.get(['deviceConfig', 'isArmed'], console.log);
```

#### Verify API Connectivity

Test API endpoint:
```bash
curl https://browserbricker.onrender.com/health
```

Should return: `{"status": "ok"}`

#### Reset Extension

Complete reset:
1. Open extension popup
2. Click "Reconfigure Device"
3. Confirm reset
4. Re-enter device API key

---

## Next Steps

After successful installation:

1. **Explore Features**
   - Test geofencing
   - Enable location tracking
   - Try quarantine mode

2. **Register Additional Devices**
   - Repeat device registration process
   - Organize with tags

3. **Set Up Admin Panel** (Optional)
   - Access advanced features
   - Bulk operations
   - System monitoring

4. **Read Documentation**
   - [User Guide](FEATURES.md)
   - [Security Best Practices](SECURITY.md)
   - [FAQ](README.md#faq)

---

## Support

Need help? 

- Email: browserbricker@gmail.com
- Issues: [GitHub Issues](https://github.com/Aaks-hatH/Browser-Bricker-Panel/issues)
- Docs: [Wiki](# Installation Guide

Complete step-by-step instructions for installing and configuring BrowserBricker.

## Table of Contents

- [System Requirements](#system-requirements)
- [Extension Installation](#extension-installation)
- [Account Setup](#account-setup)
- [Device Registration](#device-registration)
- [First Lock Test](#first-lock-test)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Supported Browsers

- Google Chrome (v88+)
- Microsoft Edge (v88+)
- Brave Browser (v1.20+)
- Opera (v74+)
- Vivaldi (v3.6+)
- Any Chromium-based browser

### Operating Systems

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu, Fedora, etc.)
- Chrome OS

### Requirements

- Active internet connection
- JavaScript enabled
- Location services (for geofencing features)

---

## Extension Installation

### Method 1: Manual Installation (Recommended)

#### Step 1: Download

```bash
# Clone the repository
git clone https://github.com/Aaks-hatH/Browser-Bricker-Panel.git

# Navigate to directory
cd browserbricker
```

Or download ZIP:
1. Visit [GitHub Repository](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
2. Click **Code** → **Download ZIP**
3. Extract to a permanent location (don't delete after installation)

#### Step 2: Load Extension

**For Chrome/Edge:**

1. Open browser and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable **Developer Mode**:
   - Look for toggle in top-right corner
   - Switch to ON position

3. Click **Load Unpacked**

4. Select the `browserbricker` folder

5. Extension should now appear in your extensions list

**For Other Chromium Browsers:**

Same process, use your browser's extension page:
- Brave: `brave://extensions/`
- Opera: `opera://extensions/`
- Vivaldi: `vivaldi://extensions/`

#### Step 3: Verify Installation

1. Look for BrowserBricker icon in browser toolbar
2. Icon should show a lock symbol
3. Click icon - you should see the setup screen
4. Status should indicate "Not Configured"

### Method 2: Chrome Web Store (Coming Soon)

One-click installation will be available from the Chrome Web Store.

---

## Account Setup

### Creating Your Master Key

Your master key is the root credential for your account. It controls all devices.

1. **Access Control Panel**
   ```
   https://browserbricker.onrender.com
   ```

2. **Generate Master Key**
   - Click **"CREATE ACCOUNT"** tab
   - Click **"GENERATE MASTER KEY"** button
   - Wait for generation (takes 1-2 seconds)

3. **Save Your Master Key**
   
   **CRITICAL: This key is shown only once!**
   
   The key looks like:
   ```
   a7f3c8e2d1b9f5a4c6e8d2b1f7a3c5e9d4b2f8a6c3e1d7b5f2a9c4e6d8b3f1a5c7e2
   ```
   
   **Where to save it:**
   - Password manager (1Password, LastPass, Bitwarden)
   - Encrypted note file
   - Offline secure storage
   
   **Where NOT to save it:**
   - Plain text file on desktop
   - Email to yourself
   - Screenshot on cloud storage
   - Unencrypted notes app

4. **Copy Master Key**
   - Click **"COPY KEY"** button
   - Paste into your password manager
   - Click **"COPY KEY & CONTINUE"**

5. **First Login**
   - You'll be redirected to login screen
   - Master key auto-filled temporarily
   - Click **"ACCESS DASHBOARD"**
   - You're now in your control panel

### Understanding Master Keys

**Security Features:**
- 64 characters (256-bit entropy)
- Cryptographically random
- SHA-256 hashed on server
- Never stored in plaintext
- Cannot be recovered if lost

**What Master Keys Control:**
- Register new devices
- Arm/disarm devices
- Delete devices
- View device status
- Access all your data

---

## Device Registration

Now that you have your account, register your first device.

### Step 1: Initiate Registration

In the Control Panel:

1. Click **"REGISTER DEVICE"** button (top right)
2. Registration modal opens

### Step 2: Fill Device Information

**Required:**
- **Device Name**: Give it a friendly name
  - Examples: "Living Room PC", "Sarah's Laptop", "Office Computer"
  - Use descriptive names for easy identification

**Optional:**
- **Tags**: Comma-separated labels for organization
  - Examples: "work", "family", "monitored", "school"
  - Helps filter and search devices later

- **Location**: Physical location description
  - Examples: "Home Office", "Kid's Bedroom", "Library Computer"
  - Not GPS coordinates - just a label

### Step 3: Register

1. Click **"REGISTER DEVICE"**
2. Server creates device record
3. Device API Key is generated
4. Modal shows your new key

### Step 4: Save Device API Key

You'll see a 64-character key:

```
d8f2a9c5e7b3f1a6c4e2d9b7f5a3c8e6d1b4f9a2c7e5d3b8f6a1c9e4d2b7f5a3c8e
```

**Important:**
- This key is shown only once
- It authenticates this specific device
- Store it temporarily (you'll use it in next step)
- Click **"COPY KEY"**

### Step 5: Configure Extension

On the device you want to protect:

1. **Open Extension**
   - Click BrowserBricker icon in toolbar
   - Setup screen should appear

2. **Enter Device API Key**
   - Paste the 64-character key from Step 4
   - Key will appear as dots (password field)

3. **Activate Protection**
   - Click **"Activate Protection"**
   - Extension connects to server
   - Wait for confirmation (2-5 seconds)

4. **Verify Connection**
   - Status should change to **"DISARMED"**
   - Connection should show **"ONLINE"**
   - Device name appears
   - Location/battery info may populate

### Step 6: Verify in Control Panel

Back in your Control Panel:

1. Refresh the page (or wait 5 seconds for auto-refresh)
2. Your new device should appear in the list
3. Status indicators:
   - Online (green)
   - Disarmed (unlocked)
   - Last seen: "just now"

---

## First Lock Test

Test that everything works correctly.

### Locking the Device

1. **In Control Panel:**
   - Find your device in the list
   - Click the **"ARM"** button
   - Button changes to green with lock icon

2. **On Target Device:**
   - Within 2 seconds, all tabs redirect
   - Lock screen appears
   - Browser becomes locked

3. **Lock Screen Features:**
   - Cannot navigate away
   - Keyboard shortcuts disabled
   - Context menu blocked
   - F12/DevTools suppressed

### Unlocking the Device

1. **In Control Panel:**
   - Find the device (will show Armed status)
   - Click the **"DISARM"** button
   - Button changes to red with unlock icon

2. **On Target Device:**
   - Within 2 seconds, lock releases
   - Can navigate normally
   - All functionality restored

### What to Test

**Verify These Work:**
- Device locks within 2 seconds
- Lock screen appears on all tabs
- New tabs show lock screen
- Navigation is blocked
- Device unlocks within 2 seconds
- Normal browsing resumes after unlock

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Offline" status | Check internet connection |
| Slow lock (>5 sec) | Verify server accessibility |
| Lock doesn't appear | Check extension is enabled |
| Can still browse | Reload extension and retry |

---

## Troubleshooting

### Extension Issues

#### "Extension Not Loading"

**Symptoms:** Extension doesn't appear in toolbar or extensions list

**Solutions:**
1. Ensure Developer Mode is enabled
2. Try reloading the extension:
   - Go to `chrome://extensions/`
   - Find BrowserBricker
   - Click reload icon (circular arrow)
3. Check browser console for errors (F12)

#### "Setup Screen Won't Appear"

**Symptoms:** Clicking icon does nothing

**Solutions:**
1. Right-click extension icon → Inspect popup
2. Check for JavaScript errors
3. Verify `popup.html` and `popup.js` exist
4. Reload extension

#### "Cannot Activate Protection"

**Symptoms:** Error when entering device key

**Solutions:**
1. Verify key is exactly 64 characters
2. Check for extra spaces at start/end
3. Confirm internet connection
4. Verify API server is accessible:
   ```
   https://browserbricker.onrender.com/health
   ```

### Connection Issues

#### "Shows Offline"

**Symptoms:** Extension shows "OFFLINE" badge

**Solutions:**
1. Check internet connection
2. Verify firewall isn't blocking:
   - `browserbricker.onrender.com`
   - Port 443 (HTTPS)
3. Try manual heartbeat:
   - Click extension icon
   - Click "Refresh Status"
4. Check server status

#### "Lock Delayed"

**Symptoms:** Device takes >5 seconds to lock

**Solutions:**
1. Check network latency
2. Verify 2-second heartbeat is running:
   - Open browser console
   - Look for `[Lockdown] Heartbeat` messages
3. Reload extension to restart heartbeat

### Lock Screen Issues

#### "Can Navigate Away from Lock"

**Symptoms:** User can still browse despite lock

**Solutions:**
1. Verify extension is enabled:
   - `chrome://extensions/`
   - BrowserBricker toggle is ON
2. Check extension permissions granted
3. Reload extension
4. Clear browser cache

#### "Lock Screen Looks Broken"

**Symptoms:** Styling issues, missing elements

**Solutions:**
1. Verify `lock.html` exists and is intact
2. Check browser console for errors
3. Reload the lock screen tab
4. Update extension to latest version

### Account Issues

#### "Lost Master Key"

**Symptoms:** Cannot access account

**Solutions:**
- Master keys cannot be recovered
- You must generate a new master key
- All devices must be re-registered
- This is a security feature, not a bug

**Prevention:**
- Always store master key in password manager
- Keep backup in secure location
- Don't rely on browser autofill

#### "Device Not Appearing in Panel"

**Symptoms:** Registered device doesn't show up

**Solutions:**
1. Refresh the control panel
2. Wait 5 seconds for auto-refresh
3. Verify device is online (check extension)
4. Check device API key is correct
5. Try registering again

### Advanced Debugging

#### Enable Debug Mode

Add to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

This enables verbose logging.

#### Check Heartbeat Status

In browser console on target device:
```javascript
chrome.storage.local.get(['deviceConfig', 'isArmed'], console.log);
```

#### Verify API Connectivity

Test API endpoint:
```bash
curl https://browserbricker.onrender.com/health
```

Should return: `{"status": "ok"}`

#### Reset Extension

Complete reset:
1. Open extension popup
2. Click "Reconfigure Device"
3. Confirm reset
4. Re-enter device API key

---

## Next Steps

After successful installation:

1. **Explore Features**
   - Test geofencing
   - Enable location tracking
   - Try quarantine mode

2. **Register Additional Devices**
   - Repeat device registration process
   - Organize with tags

3. **Set Up Admin Panel** (Optional)
   - Access advanced features
   - Bulk operations
   - System monitoring

4. **Read Documentation**
   - [User Guide](FEATURES.md)
   - [Security Best Practices](SECURITY.md)
   - [FAQ](README.md#faq)

---

## Support

Need help? 

- Email: browserbricker@gmail.com
- Issues: [GitHub Issues](https://github.com/aakshathariharan/browserbricker/issues)
- Docs: [Wiki](https://github.com/aakshathariharan/browserbricker/wiki)

---

**Installation Guide v4.1** • Last Updated: January 2026 • By Aakshat Hariharan/wiki)

---

**Installation Guide v4.1** • Last Updated: January 2026 • By Aakshat Hariharan/issues)
- Docs: [Wiki](https://github.com/aakshathariharan/browserbricker/wiki)

---

**Installation Guide v4.1** • Last Updated: January 2026 • By Aakshat Hariharan

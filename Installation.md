# Installation Guide - BrowserBricker 6.0

Complete step-by-step instructions for installing and configuring BrowserBricker with the new group management system.

## Table of Contents

- [System Requirements](#system-requirements)
- [Extension Installation](#extension-installation)
- [System Administrator Setup](#system-administrator-setup)
- [Regular User Setup](#regular-user-setup)
- [Group Management Guide](#group-management-guide)
- [Policy Configuration](#policy-configuration)
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

### Step 1: Download

```bash
# Clone the repository
git clone https://github.com/Aaks-hatH/Browser-Bricker-Panel

# Navigate to directory
cd Browser-Bricker-Panel
```

Or download ZIP:
1. Visit [GitHub Repository](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
2. Click **Code** → **Download ZIP**
3. Extract to a permanent location (don't delete after installation)

### Step 2: Load Extension

**For Chrome/Edge:**

1. Open browser and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable **Developer Mode**:
   - Look for toggle in top-right corner
   - Switch to ON position

3. Click **Load Unpacked**

4. Navigate to the extracted folder and select the **Extension** folder

5. Extension should now appear in your extensions list

**For Other Chromium Browsers:**

Same process, use your browser's extension page:
- Brave: `brave://extensions/`
- Opera: `opera://extensions/`
- Vivaldi: `vivaldi://extensions/`

### Step 3: Verify Installation

1. Look for BrowserBricker icon in browser toolbar
2. Icon should show a lock symbol
3. Click icon - you should see the setup screen
4. Status should indicate "Not Configured"

---

## System Administrator Setup

**Note for Owner:** This section is for System Administrators you create. As the platform owner, you already have full access.

### Prerequisites

- You must have received a registration code from the service owner
- Valid email address
- Secure location to store your admin key

### Step 1: Receive Registration Code

Your service owner will provide:
- Unique registration code (format: XXXX-XXXX-XXXX-XXXX)
- Organization/group assignment
- Access portal URL

### Step 2: Initial Registration

1. Navigate to System Administrator Portal:
   ```
   https://browser-bricker-panel.onrender.com/admin
   ```

2. On the login screen, click **"Register New Admin"**

3. Enter your registration code

4. Fill in your information:
   - **Name**: Your full name
   - **Email**: Your organizational email* if asked
   - **Create Password**: Secure password for your admin key

5. Click **"Complete Registration"**

6. **CRITICAL**: Copy and securely store your System Admin Key
   - This 64-character key is shown ONCE
   - Store in password manager or secure location
   - You cannot recover this key if lost

### Step 3: First Login

1. Use your System Admin Key to log in

2. You'll see your admin dashboard with:
   - Organization overview
   - Device management panel
   - Group management (NEW in v6.0)
   - User management
   - Analytics and reporting

### Step 4: Create Your First Group

**Important**: In BrowserBricker 6.0, groups must be created before assigning devices.

1. Navigate to **Groups** section in your admin panel

2. Click **"Create Group"** button

3. Fill in group details:
   - **Group Name**: Descriptive name (e.g., "Engineering Dept")
   - **Description**: Optional details about this group
   - **Policy**: Select a policy or leave as "No Policy"
   - **Max Devices**: Maximum devices allowed (default: 100)
   - **Settings**:
     - ☑ Allow Geofencing
     - ☑ Allow Quarantine
     - ☐ Default Armed State

4. Click **"Create Group"**

Your group is now ready to receive devices!

### Step 5: Generate Registration Codes for Users

1. Go to **User Management** section

2. Click **"Generate Registration Code"**

3. Configure the code:
   - **User Name**: Name of person receiving code (optional)
   - **User Email**: Their email address (optional)
   - **Expiration**: Code validity period (default: 24 hours)
   - **Max Uses**: Usually 1 per user

4. Click **"Generate"**

5. Share the registration code with your user via secure channel

6. User will use this code to register their devices

### Step 6: Assign Devices to Groups

**Method 1: From Group Details**

1. Click **View** (👁 icon) next to a group

2. In group details, click **"Assign Device"**

3. Select device from unassigned devices list

4. Click **"Assign"**

**Method 2: From Devices View**

1. Navigate to **Devices** section

2. Find device you want to assign

3. Click device name to open details

4. Click **"Assign to Group"** button

5. Select target group

6. Confirm assignment

### Administrative Best Practices

**Group Organization:**
- Create groups by department, location, or function
- Use descriptive names (e.g., "Sales Team - West Coast")
- Document group purposes in descriptions
- Start with 2-3 test groups before full rollout

**Device Management:**
- Review unassigned devices daily
- Assign new devices within 24 hours of registration
- Regularly audit group memberships
- Remove inactive devices from groups

**Policy Management:**
- Create policies before assigning to groups
- Test policies on small groups first
- Document policy rules and purposes
- Review and update policies quarterly

**Security:**
- Store your admin key in a password manager
- Enable 2FA if available
- Regularly review audit logs
- Monitor for unauthorized access attempts

---

## Regular User Setup

### Prerequisites

- BrowserBricker extension installed in your browser
- Registration code from your System Administrator
- Active internet connection

### Step 1: Access User Portal

1. Navigate to the user portal:
   ```
   https://browser-bricker-panel.onrender.com/main
   ```

2. You'll see the login/registration screen

### Step 2: Register Your Account

1. Click **"Register New Account"** or **"First Time Setup"**

2. Enter the registration code provided by your administrator

3. Create your Master Key:
   - The system will generate a secure 64-character key
   - **CRITICAL**: Save this key immediately
   - Store in password manager or secure location
   - You CANNOT recover this if lost

4. Click **"Complete Registration"**

### Step 3: Register Your First Device

**Important**: In v6.0, devices start as "unassigned". Your administrator will assign your device to a group.

1. After registration, click **"Register Device"**

2. Enter device information:
   - **Device Name**: Descriptive name (e.g., "Work Laptop")
   - **Tags**: Optional organizational tags

3. Click **"Register"**

4. You'll receive a Device API Key (automatically saved in extension)

### Step 4: Configure Browser Extension

1. Click the BrowserBricker icon in your browser toolbar

2. Click **"Configure Device"**

3. The extension will automatically use your Device API Key

4. Verify configuration:
   - Status should show "Connected"
   - Device name should be displayed
   - Heartbeat indicator should be green

### Step 5: Test Your Device

1. In the user portal, locate your device in the devices list

2. Click **"Lock Device"** button

3. Your browser should immediately show the lock screen

4. Return to user portal (on another device/tab)

5. Click **"Unlock Device"**

6. Lock screen should disappear

**Success!** Your device is now protected and managed.

### Using Your Device

**Daily Operation:**
- Extension runs in background monitoring connection
- Green status = protected and monitored
- Red status = check your connection
- Lock screen appears when device is locked remotely

**Lock Screen Behavior:**
- Full-screen overlay prevents browser use
- Cannot be closed or bypassed
- Shows device name and status
- Displays unlock message when unlocked

**What You Can Do:**
- Lock/unlock your own devices
- View device status and location
- Check lock history
- Update device settings
- Remove devices you own

**What You Cannot Do:**
- Change your group assignment (admin-controlled)
- View other users' devices
- Modify organization policies
- Create or delete groups

---

## Group Management Guide

**For Service Owner / Platform Administrator**

### Understanding the Group System

**What are Groups?**
- Organizational containers for devices
- Apply policies to multiple devices at once
- Manage devices collectively
- Track statistics per group

**Group-Policy-Device Relationship:**
```
Policy → Group → Devices
  ↓       ↓        ↓
Rules  Container  Inherit
```

### Creating Groups

1. Access Owner Panel:
   ```
   https://browser-bricker-panel.onrender.com/owner
   ```

2. Navigate to **Groups** section

3. Click **"Create Group"**

4. Configure group:

   **Basic Information:**
   - **Group Name** (required): Clear, descriptive name
   - **Description**: Purpose and membership details
   - **System Admin**: Which admin owns this group (you can create for any)

   **Policy Assignment:**
   - **Policy**: Select from dropdown or "No Policy"
   - Policies define device behavior rules
   - Can be changed later

   **Settings:**
   - **Max Devices**: Limit for group (default 100)
   - **Allow Geofencing**: Enable location-based controls
   - **Allow Quarantine**: Allow device isolation
   - **Default Arm State**: Lock devices by default

5. Click **"Create Group"**

### Assigning Devices to Groups

**View Unassigned Devices:**

1. Groups section → Click any group

2. Click **"Assign Device"** button

3. See list of all unassigned devices

**Assign Individual Device:**

1. From unassigned devices list, click **"Assign"** next to device

2. Confirm assignment

3. Device immediately inherits group's policy

**Move Device Between Groups:**

1. Open current group details

2. Click **"Remove"** next to device

3. Device becomes unassigned

4. Open target group details

5. Click **"Assign Device"**

6. Select and assign device

### Managing Groups

**Edit Group:**

1. Click **✏️ Edit** icon next to group

2. Modify any settings:
   - Change name or description
   - Update policy assignment
   - Adjust device limits
   - Toggle settings

3. Click **"Save Changes"**

4. All devices in group instantly affected by policy changes

**View Group Details:**

1. Click **👁 View** icon

2. See full group information:
   - Member devices with status
   - Group statistics
   - Policy details
   - Recent activity

**Delete Group:**

1. Click **🗑️ Delete** icon

2. Confirm deletion

3. **Important**: All devices in group become unassigned

4. You must reassign devices to other groups

### Group Best Practices

**Organizational Structure:**

Good group organization:
```
✅ Engineering Team - Full Access
✅ Sales Department - Restricted Hours
✅ Contractors - Limited Access
✅ Executive Devices - High Security
```

Bad group organization:
```
❌ Group 1
❌ Test Group
❌ Miscellaneous
❌ Old Devices
```

**Policy Assignment Strategy:**

1. **Create policies first**: Define rules before groups
2. **Test on small groups**: Verify policy behavior
3. **Roll out gradually**: Expand to more groups
4. **Document policies**: Keep notes on each policy's purpose
5. **Review regularly**: Update policies quarterly

**Device Assignment Workflow:**

```
New Device Registration
↓
Appears in "Unassigned Devices"
↓
Admin Reviews Device
↓
Assigns to Appropriate Group
↓
Device Inherits Group Policy
↓
Monitor and Manage
```

---

## Policy Configuration

**For Service Owner / Platform Administrator**

### Understanding Policies

**What are Policies?**
- Sets of rules controlling device behavior
- Applied at group level (not device level)
- Inherited by all devices in a group
- Can be shared across multiple groups

**Available Policy Rules:**

1. **Auto-Arm Schedule**
   - Automatically lock devices at specified times
   - Set days and time ranges
   - Useful for after-hours protection

2. **Geofencing**
   - Define geographic boundaries
   - Auto-arm when device leaves area
   - Alert or quarantine on breach

3. **Time Limits**
   - Daily usage limits in minutes
   - Auto-lock when limit reached
   - Resets at specified time

4. **Allowed Hours**
   - Specify when devices can be used
   - Different schedules per day
   - Auto-lock outside allowed times

5. **Breach Threshold**
   - Maximum allowed security violations
   - Auto-quarantine after threshold
   - Escalating responses

6. **Inactivity Timeout**
   - Auto-lock after idle period
   - Configurable timeout duration

### Creating a Policy

1. Navigate to **Policies** section in owner panel

2. Click **"Create Policy"**

3. Configure policy:

   **Basic Information:**
   - **Policy Name**: Descriptive name (e.g., "9-5 Weekday Access")
   - **Description**: Explain policy purpose
   - **Priority**: 0-100 (higher = more important)

   **Scope:**
   - **Type**: Global, Group, or Device
   - **Target**: Which groups this applies to

   **Rules:**
   
   - **Auto-Arm**:
     - ☑ Enable Auto-Arm
     - Days: Monday-Friday
     - Time: 18:00 - 08:00
   
   - **Geofencing**:
     - ☑ Enforce Geofence
     - Action on Exit: Alert / Arm / Quarantine
   
   - **Time Limits**:
     - ☑ Enable Daily Limits
     - Minutes: 480 (8 hours)
     - Action: Warn / Arm / Block
   
   - **Allowed Hours**:
     - ☑ Enable Time Restrictions
     - Monday-Friday: 09:00 - 17:00
     - Saturday-Sunday: Blocked
   
   - **Breach Response**:
     - Threshold: 3 violations
     - Action: Notify / Quarantine

4. Click **"Create Policy"**

### Applying Policies to Groups

**Method 1: During Group Creation**
- Select policy from dropdown when creating group

**Method 2: Edit Existing Group**
1. Edit group
2. Change policy selection
3. Save changes
4. All group devices immediately affected

**Method 3: Bulk Application**
- Edit policy scope to include multiple groups
- All targeted groups inherit policy

### Policy Examples

**Example 1: Contractor Devices**
```
Policy Name: Contractor Access
Rules:
- Allowed Hours: Mon-Fri 09:00-17:00
- Time Limits: 8 hours/day
- Geofence: Office location required
- Breach Threshold: 2 violations → Auto-quarantine
```

**Example 2: Executive Devices**
```
Policy Name: Executive Protection
Rules:
- Auto-Arm: Never (manual control only)
- Geofencing: Disabled (travel frequently)
- Time Limits: None
- Breach Threshold: 5 violations → Alert only
```

**Example 3: Sales Team**
```
Policy Name: Sales Team Standard
Rules:
- Allowed Hours: 24/7 (field work)
- Auto-Arm: Weekends only
- Geofence: Regional boundaries
- Time Limits: None
- Breach Threshold: 3 violations → Notify manager
```

**Example 4: After-Hours Security**
```
Policy Name: Night Security Lock
Rules:
- Auto-Arm: Daily 20:00-06:00
- Allowed Hours: 06:00-20:00 weekdays
- Geofencing: Office location during work hours
- Breach Threshold: Immediate quarantine
```

### Policy Testing

**Before Deployment:**

1. Create test group with 1-2 devices
2. Assign policy to test group
3. Verify each rule:
   - Time limits trigger correctly
   - Auto-arm works as expected
   - Geofencing responds appropriately
   - Breach detection functions
4. Monitor for 24-48 hours
5. Adjust rules as needed
6. Deploy to production groups

**Common Testing Scenarios:**

1. **Time Limit Test**:
   - Set very short limit (e.g., 5 minutes)
   - Monitor device behavior
   - Verify lock occurs at limit
   - Reset and verify reset time works

2. **Auto-Arm Test**:
   - Set auto-arm for next hour
   - Wait for scheduled time
   - Verify device locks automatically
   - Test unlock and re-arm cycle

3. **Geofence Test**:
   - Set geofence boundary
   - Move device outside boundary
   - Verify alert/action occurs
   - Move back inside and verify

4. **Allowed Hours Test**:
   - Set narrow allowed window
   - Attempt use outside window
   - Verify device locks
   - Wait for allowed time
   - Verify unlock

---

## Troubleshooting

### Common Issues and Solutions

#### Extension Issues

**Problem: Extension not loading**

Solution:
1. Verify Developer Mode is enabled
2. Check that you loaded the correct folder
3. Look for errors in browser console
4. Try removing and re-adding extension

**Problem: Extension shows "Not Configured"**

Solution:
1. Verify device registration completed
2. Check that Device API Key was saved
3. Re-configure extension with correct key
4. Verify internet connection

**Problem: Heartbeat not connecting**

Solution:
1. Check internet connection
2. Verify API server is accessible
3. Check browser console for errors
4. Disable conflicting extensions
5. Clear browser cache and reload

#### Device Issues

**Problem: Device not appearing in admin panel**

Solution:
1. Verify device registration completed
2. Check that device is online
3. Verify heartbeat is active
4. Refresh admin panel
5. Check device API key is correct

**Problem: Device shows as "Unassigned"**

This is normal in v6.0! Solution:
1. This is expected behavior
2. Admin must manually assign device to group
3. Contact your administrator to assign your device

**Problem: Lock screen not appearing**

Solution:
1. Verify device is armed
2. Check that extension is active
3. Disable conflicting extensions
4. Check browser console for errors
5. Reload extension

**Problem: Cannot unlock device**

Solution:
1. Verify you have permission
2. Check that disarm command was sent
3. Wait 2-3 seconds for heartbeat
4. Check internet connection
5. Manually reload page

#### Group Management Issues

**Problem: Cannot create group**

Solution:
1. Verify you have admin/owner permissions
2. Check that group name is unique
3. Ensure required fields are filled
4. Check for error messages
5. Try with simpler group name

**Problem: Cannot assign device to group**

Solution:
1. Verify device is unassigned
2. Check you own both device and group
3. Verify group has space (max devices)
4. Check permission level
5. Try removing device from current group first

**Problem: Policy not applying to devices**

Solution:
1. Verify policy is assigned to group
2. Check that devices are in correct group
3. Wait 2-3 heartbeat cycles (10 seconds)
4. Verify policy is active (not disabled)
5. Check policy rules are configured correctly

**Problem: Devices not inheriting group policy**

Solution:
1. Verify device is actually in group (check group details)
2. Confirm policy is assigned to group
3. Wait for next heartbeat cycle
4. Check device connection status
5. Review policy logs for errors

#### Permission Issues

**Problem: "Unauthorized" errors**

Solution:
1. Verify your key is correct
2. Check your permission level (owner/admin/user)
3. Ensure you're accessing correct endpoints
4. Try logging out and back in
5. Contact service owner if problem persists

**Problem: Cannot see other admin's groups**

This is correct behavior! Solution:
- System admins can only see their own groups
- This is a security feature
- Only the owner can see all groups
- Working as intended

---

## Support

### Getting Help

**Email Support**: browserbricker@gmail.com

**Include in your request:**
- BrowserBricker version (6.0.0)
- Browser type and version
- Operating system
- Detailed description of issue
- Steps to reproduce
- Screenshots if applicable
- Error messages

**Response Time**: 24-48 hours

### Security Issues

Report security vulnerabilities confidentially to:
- Email: browserbricker@gmail.com
- Subject: "SECURITY: [Brief Description]"
- Do NOT post publicly

---

## Additional Resources

### Documentation
- [API Documentation](https://github.com/Aaks-hatH/Browser-Bricker-Panel)
- [Security Guide](./Security.md)
- [Feature Documentation](./Features.md)
- [Changelog](./ChangeLog.md)

### Service URLs
- **Owner Panel**: https://browser-bricker-panel.onrender.com/owner
- **Admin Panel**: https://browser-bricker-panel.onrender.com/admin
- **User Panel**: https://browser-bricker-panel.onrender.com/main

### GitHub Repository
https://github.com/Aaks-hatH/Browser-Bricker-Panel

---

**Document Version**: 6.0.0  
**Last Updated**: February 11, 2026  
**Maintained By**: Aakshat Hariharan

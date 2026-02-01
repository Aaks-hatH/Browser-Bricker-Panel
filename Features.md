# Features Documentation

Complete guide to all BrowserBricker features and capabilities.

## Table of Contents

- [Remote Lock/Unlock](#remote-lockunlock)
- [Geofencing](#geofencing)
- [Location Tracking](#location-tracking)
- [Quarantine Mode](#quarantine-mode)
- [Device Monitoring](#device-monitoring)
- [Breach Detection](#breach-detection)
- [Admin Features](#admin-features)
- [Bulk Operations](#bulk-operations)
- [Activity Logging](#activity-logging)

---

## Remote Lock/Unlock

### Overview

The core feature of BrowserBricker - lock any device instantly from anywhere.

### How It Works

```
Control Panel → API Server → Device Extension → Lock Screen
     2s           < 1s            < 1s            Instant
```

**Total Time**: Typically under 2 seconds from clicking "ARM" to lock appearing.

### Locking a Device

**Via Control Panel:**

1. Sign in with master key
2. Locate device in list
3. Click **"ARM"** button
4. Device locks within 2 seconds

**Via API** (Advanced):
```bash
curl -X POST https://browserbricker.onrender.com/api/device/arm \
  -H "Authorization: Bearer YOUR_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "device_uuid", "reason": "Scheduled lock"}'
```

### Unlocking a Device

**Via Control Panel:**

1. Find locked device (shows Armed status)
2. Click **"DISARM"** button  
3. Device unlocks within 2 seconds

**Via API**:
```bash
curl -X POST https://browserbricker.onrender.com/api/device/disarm \
  -H "Authorization: Bearer YOUR_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "device_uuid", "reason": "Manual unlock"}'
```

### Lock Screen Features

When locked, the device displays a full-screen lock interface that:

**Blocks:**
- All navigation attempts
- New tab creation
- URL bar access
- Keyboard shortcuts
- Right-click menu
- Developer tools
- Browser history
- Bookmarks access

**Shows:**
- Security enforcement notice
- Device locked status
- Professional warning message
- Contact information

**Visual Example:**
```
┌───────────────────────────────────────────┐
│                                           │
│          DEVICE LOCKED                    │
│                                           │
│  This device has been remotely secured    │
│  by the registered owner or authorized    │
│  administrator.                           │
│                                           │
│  Enforcement Protocol: MDM-REMOTE-LOCK    │
│  Trigger Source: Security Violation       │
│                                           │
│  UNAUTHORIZED ACCESS DETECTED             │
│  DATA PROTECTION MODE ACTIVE              │
│  CONTINUOUS MONITORING ENABLED            │
│                                           │
│  Return to owner or contact administrator │
│                                           │
└───────────────────────────────────────────┘
```

### Lock Persistence

**Connection Lost While Locked:**
- Device **stays locked**
- Lock persists until manual unlock
- Fail-secure design

**Connection Lost While Unlocked:**
- Device remains functional
- Reconnects automatically
- Checks state on reconnection

### Use Cases

**Parental Controls:**
- Lock devices during homework time
- Enforce bedtime restrictions
- Remote discipline actions

**Theft Recovery:**
- Lock stolen laptop immediately
- Prevent data access
- Deter thief

**Organizational Security:**
- Lock terminated employee devices
- Emergency security lockdowns
- Policy enforcement

---

## Geofencing

### Overview

Create virtual geographic boundaries. Devices automatically lock when leaving designated areas.

### How It Works

1. Define a geofence (center point + radius)
2. Device reports GPS location every heartbeat (2s)
3. Server calculates distance from center
4. If outside radius → automatic lock
5. Lock persists until manually released

### Setting Up Geofencing

**Requirements:**
- Admin panel access
- Device GPS coordinates
- Desired radius (meters)

**Steps:**

1. **Get Coordinates:**
   - Open Google Maps
   - Right-click desired location
   - Click coordinates to copy
   - Format: `40.712776, -74.005974`

2. **Create Geofence:**
   - Admin Panel → **Geofencing**
   - Enter device ID
   - Enter latitude (e.g., `40.712776`)
   - Enter longitude (e.g., `-74.005974`)
   - Enter radius (e.g., `1000` for 1km)
   - Click **"Create Geofence"**

3. **Verify:**
   - Geofence appears in active list
   - Device shows geofenced badge
   - Status updates every 2 seconds

### Geofence Parameters

**Latitude/Longitude:**
- Standard GPS coordinates
- Range: -90 to 90 (lat), -180 to 180 (lon)
- Precision: 6 decimal places recommended
- Example: `34.052235, -118.243683`

**Radius:**
- Measured in meters
- Minimum: 10 meters
- Maximum: 100,000 meters (100 km)
- Recommended: 500-2000 meters for typical use

**Calculation:**
```
distance = haversine(device_lat, device_lon, fence_lat, fence_lon)

if distance > radius:
    lock_device()
```

### Geofence Violations

**What Happens:**

1. Device exits geofence boundary
2. Server detects on next heartbeat (within 2s)
3. Device automatically locked
4. Breach event logged
5. Admin notification sent (if configured)

**Device Shows:**
- Lock screen immediately
- Cannot unlock remotely until geofence removed or device returns
- Location continues updating

### Managing Geofences

**View Active Geofences:**
```
Admin Panel → Geofencing → Active Geofences
```

Shows:
- Device name and ID
- Center coordinates
- Radius in meters
- Active/inactive status

**Remove Geofence:**
1. Find geofence in list
2. Click **"Remove Geofence"**
3. Confirm deletion
4. Device can now be unlocked

**Update Geofence:**
- Currently: Delete and recreate
- Future: Edit in place

### Use Cases

**Home Restriction:**
- Keep children's devices at home
- 500m radius around house
- Automatic lock if taken to school

**Workplace Security:**
- Prevent company laptops leaving office
- 1km radius around building
- Alert on unauthorized removal

**Facility Management:**
- Keep library computers in library
- 100m radius per building
- Prevent theft

**School Tablets:**
- Lock if student leaves campus
- 2km radius around school
- After-hours enforcement

### Accuracy Considerations

**GPS Accuracy:**
- Typical: ±10-50 meters
- Best case: ±5 meters
- Affected by: buildings, weather, device quality

**Recommendations:**
- Add 50m buffer to desired radius
- Test geofence before relying on it
- Combine with time-based rules
- Use larger radius for urban areas

**Example:**
- Want device within 500m
- Set geofence radius to 550m
- Accounts for GPS drift

---

## Location Tracking

### Overview

Real-time GPS tracking of all registered devices.

### Enabling Location Tracking

**Per Device:**

1. Click BrowserBricker extension icon
2. Find **"Enable Tracking"** toggle
3. Click to enable
4. Browser requests location permission
5. Grant permission
6. Toggle turns green

**Permission Required:**
- Browser-level location access
- One-time grant
- Can be revoked in browser settings

### Viewing Locations

**Admin Panel:**
```
Admin Panel → Location Tracking
```

**Information Shown:**
- GPS coordinates (lat/lon)
- Accuracy (±meters)
- Last updated timestamp
- Live indicator (<10s = live)
- Geofenced status

**Auto-Refresh:**
- Updates every 5 seconds
- No manual refresh needed
- "LIVE" badge for recent data

### Location Data

**Coordinates Format:**
```
Lat: 40.712776
Lon: -74.005974
Accuracy: ±15m
```

**Accuracy Levels:**
- **Excellent**: ±5-10m (clear sky, good GPS)
- **Good**: ±10-30m (typical outdoor)
- **Fair**: ±30-100m (urban, buildings)
- **Poor**: ±100+m (indoor, bad signal)

**Update Frequency:**
- Extension requests GPS every 2s
- Only when location tracking enabled
- Transmitted with heartbeat
- Server stores latest only

### Privacy Controls

**User Privacy:**
- Must explicitly enable tracking
- Can disable per device
- Not enabled by default
- Clear UI indicator when active

**Admin Responsibilities:**
- Inform users tracking is enabled
- Comply with local privacy laws
- Use for legitimate purposes only
- Document tracking policies

### Use Cases

**Fleet Management:**
- Track company vehicle laptops
- Monitor field device locations
- Verify on-site presence

**Theft Recovery:**
- Locate stolen devices
- Provide to law enforcement
- Track device movement

**Compliance:**
- Verify devices in authorized locations
- Audit location history
- Geographic restrictions

**Safety:**
- Ensure child devices at safe locations
- Emergency location services
- Peace of mind monitoring

### Limitations

**GPS Limitations:**
- Requires clear sky view
- Poor indoor accuracy
- Battery impact (minimal)
- Privacy concerns

**Not Provided:**
- Historical location tracking
- Location playback
- Geolocation database
- Address resolution

---

## Quarantine Mode

### Overview

Maximum security isolation for compromised or suspicious devices.

### What is Quarantine?

A special locked state that:
- Locks device immediately
- Prevents remote unlock
- Requires admin release
- Logs all activity
- Indicates security status

### When to Use Quarantine

**Security Incidents:**
- Malware detected
- Unauthorized access attempt
- Data breach suspected
- Policy violation

**Administrative:**
- Pending investigation
- Temporary seizure
- Compliance hold
- Disciplinary action

**Preventive:**
- High-risk device
- Suspicious behavior
- Unpatched vulnerabilities
- Lost device

### Implementing Quarantine

**Via Admin Panel:**

1. Navigate to **Quarantine** section
2. Enter device ID
3. Enter quarantine reason
4. Click **"Quarantine Device"**

**Via Device List:**
1. Find device in **All Devices**
2. Click quarantine button
3. Confirm quarantine
4. Enter reason when prompted

**Result:**
- Device locks within 2 seconds
- Shows "QUARANTINED" badge
- Cannot be unlocked remotely
- Appears in quarantine list

### Quarantine Restrictions

**User Cannot:**
- Unlock device remotely
- Bypass lock screen
- Access any functionality

**Admin Cannot:**
- Remotely unlock (disarm)
- Modify device settings
- Remove geofence (if active)

**Admin Can:**
- View device status
- Monitor activity
- Release from quarantine
- Delete device

### Releasing from Quarantine

**Steps:**

1. Admin Panel → **Quarantine**
2. Find device in quarantine list
3. Click **"Release"** button
4. Confirm release
5. Device unlocks within 2 seconds

**Post-Release:**
- Device returns to normal state
- Can be armed/disarmed again
- Quarantine logged in history
- Breach counter preserved

### Quarantine List

**Information Shown:**
- Device name and ID
- Quarantine reason
- Breach count
- Online/offline status
- Lock state
- Release button

**Sorting:**
- By breach count
- By quarantine date
- By device name

### Use Cases

**Malware Response:**
```
1. Malware detected on device
2. Quarantine immediately
3. Prevent data exfiltration
4. Investigate offline
5. Clean and release
```

**Policy Violation:**
```
1. User violates acceptable use
2. Quarantine for investigation
3. Review activity logs
4. Determine appropriate action
5. Release or remove
```

**Lost Device:**
```
1. Device reported lost
2. Quarantine to prevent access
3. Attempt recovery
4. Release if recovered
5. Delete if unrecovered
```

---

## Device Monitoring

### Overview

Real-time insights into device status, health, and activity.

### Monitored Metrics

#### Connection Status
- **Online/Offline**: Real-time connectivity
- **Last Heartbeat**: Time since last check-in
- **Error Count**: Consecutive failed heartbeats
- **Uptime**: Time since device activation

#### Battery Information
```javascript
{
  "battery": {
    "level": 75,        // Percentage (0-100)
    "charging": true,   // Charging status
    "chargingTime": 30, // Minutes to full
    "dischargingTime": 240 // Minutes remaining
  }
}
```

**Displayed As:**
```
Battery: 75% Charging
Battery: 45% Discharging
```

**Visual Indicator:**
- Green bar: >60%
- Yellow bar: 20-60%
- Red bar: <20%

#### Network Information
```javascript
{
  "network": {
    "type": "wifi",      // wifi, 4g, 3g, ethernet
    "downlink": 10.5,    // Mbps
    "effectiveType": "4g",
    "rtt": 50            // Round-trip time (ms)
  }
}
```

**Display:**
```
Network: WIFI
Speed: 10.5 Mbps
```

**Color Coding:**
- Green: WiFi, 4G
- Yellow: 3G
- Gray: Unknown/Offline

#### Device Fingerprint

Unique hardware identifier:
```
Fingerprint: a7f3c8e2d1b9f5a4...
```

**Components:**
- User agent hash
- Hardware concurrency
- Platform
- Language
- Timezone

**Uses:**
- Device identification
- Duplicate detection
- Security verification

### Monitoring Dashboard

**Extension Popup:**
```
┌────────────────────────────────┐
│ All systems secure             │
├────────────────────────────────┤
│ Lock Status:    DISARMED       │
│ Connection:     ONLINE         │
│ Device Name:    Work Laptop    │
├────────────────────────────────┤
│ Location                       │
│ Lat: 40.712776                 │
│ Lon: -74.005974                │
│ Accuracy: ±15m                 │
├────────────────────────────────┤
│ Battery                        │
│ 75% Charging                   │
│ [████████░░] 75%               │
├────────────────────────────────┤
│ Network                        │
│ WIFI | 10.5 Mbps               │
└────────────────────────────────┘
```

**Control Panel:**
```
┌─────────────────────────────────────┐
│ Device: Work Laptop                 │
│ Status: Online | Disarmed           │
│ Last Seen: just now                 │
├─────────────────────────────────────┤
│ Tags: work, monitored               │
│ [ARM] [EDIT] [DELETE]               │
└─────────────────────────────────────┘
```

### Auto-Refresh

**Extension:**
- Updates every 3 seconds
- Shows latest server state
- Battery/network refresh

**Control Panel:**
- Auto-refresh every 5 seconds
- No page reload needed
- Real-time statistics

**Admin Panel:**
- Main stats: 5 seconds
- Location tracking: 5 seconds
- Activity log: Manual refresh

---

## Breach Detection

### Overview

Automated monitoring and alerting for security incidents.

### Monitored Events

#### Authentication Breaches
- Failed API key attempts
- Invalid device fingerprints
- Unauthorized access patterns
- Suspicious request rates

#### Geolocation Breaches
- Geofence violations
- Impossible travel (GPS jumps)
- Location spoofing attempts
- Coordinate anomalies

#### Behavioral Breaches
- Rapid arm/disarm cycles
- Extension manipulation detected
- Unusual heartbeat patterns
- Metadata inconsistencies

### Severity Levels

**INFO** (Severity 1):
- Routine monitoring events
- Expected state changes
- Normal operations

**WARNING** (Severity 2):
- Single policy violation
- Recoverable errors
- Minor anomalies

**CRITICAL** (Severity 3):
- Multiple violations
- Security incidents
- Major anomalies
- Immediate action needed

### Automatic Responses

**Level 1 - Log:**
```javascript
{
  "type": "authentication_failure",
  "severity": "warning",
  "details": "Invalid API key attempt",
  "action": "logged"
}
```

**Level 2 - Alert:**
```javascript
{
  "type": "geofence_violation",
  "severity": "critical",
  "details": "Device outside boundary",
  "action": "automatic_lock"
}
```

**Level 3 - Quarantine:**
```javascript
{
  "type": "multiple_breaches",
  "severity": "critical",
  "breachCount": 5,
  "action": "automatic_quarantine"
}
```

### Breach Dashboard

**Admin Panel → Breach Detection:**

Shows per device:
- Total breach count
- Breach types
- Severity distribution
- Last breach timestamp
- Recommended actions

**Example Display:**
```
┌────────────────────────────────────┐
│ Device: Kid's Laptop               │
│ Total Breaches: 3                  │
├────────────────────────────────────┤
│ 1. Geofence Violation (CRITICAL)   │
│    Details: Left school boundary   │
│    Action: Auto-locked             │
│    Time: 2:45 PM                   │
├────────────────────────────────────┤
│ 2. Unusual Activity (WARNING)      │
│    Details: Rapid state changes    │
│    Action: Logged                  │
│    Time: 10:23 AM                  │
└────────────────────────────────────┘
```

---

## Admin Features

### System Statistics

**Dashboard Overview:**
- Total devices (all users)
- Online devices (currently connected)
- Armed devices (locked)
- Quarantined devices
- Geofenced devices
- Total users (master keys)
- Breach attempts
- Blocked IPs

**System Health:**
- Memory usage
- Request count
- Server uptime
- API status

### User Management

**View All Users:**
- Master key hashes
- Device counts
- Last usage
- Active/revoked status

**Revoke Keys:**
```
Admin Panel → Master Keys
Find key → Revoke
```

**Effects:**
- User cannot access devices
- Existing devices stay functional
- No new devices can be registered
- Cannot be undone

### IP Management

**View Blocked IPs:**
```
Admin Panel → Blocked IPs
```

Shows:
- IP address
- Block reason
- Block timestamp

**Unblock IPs:**
1. Find IP in list
2. Click **"Unblock"**
3. IP can access again

**Failed Attempts:**
- IPs with failed auth
- Attempt counts
- Last attempt time

### Sessions Management

View active admin sessions:
- Session ID
- Expiration time
- Active/expired status

---

## Bulk Operations

### Lock All Devices

**Emergency Lockdown:**

1. Admin Panel → **Bulk Operations**
2. Enter lock reason
3. Click **"Execute Emergency Lockdown"**
4. Confirm action
5. All devices lock within 2 seconds

**Use Cases:**
- Security incident
- Emergency situation
- End of work day
- System-wide enforcement

**Effects:**
- Every registered device locks
- Logged in audit trail
- Individual unlock required

### Unlock All Devices

**Mass Release:**

1. Admin Panel → **Bulk Operations**
2. Enter unlock reason
3. Click **"Release All Locks"**
4. Confirm action
5. All devices unlock

**Use Cases:**
- End of security incident
- Morning start-up
- Scheduled release
- False alarm response

---

## Activity Logging

### Logged Events

**System Events:**
- Service startup/shutdown
- Configuration changes
- Error conditions

**Device Events:**
- Registration
- Arm/disarm actions
- Heartbeat responses
- Connection changes

**Admin Events:**
- Bulk operations
- User management
- Settings changes
- Manual interventions

**Security Events:**
- Breach detections
- Quarantine actions
- IP blocks
- Geofence violations

### Activity Log

**View:**
```
Admin Panel → Activity Log
```

**Filter By:**
- Event type
- Time range
- Device
- Severity

**Export:**
- CSV format
- Date range
- Filtered view

### Audit Trail

**Comprehensive logging:**
- Timestamp
- Action type
- Actor (who)
- Target (what)
- Details (why)

**Immutable:**
- Cannot be deleted
- Cannot be modified
- Permanent record
- Compliance ready

---

**Features Documentation v4.1** • Last Updated: January 2026 • By Aakshat Hariharan

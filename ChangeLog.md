# Changelog

All notable changes to BrowserBricker are documented here.

## [4.2.0] - 2026-02-01

### MAJOR UPDATE: Hierarchical Access Control System

This release introduces a complete hierarchical system for multi-organization deployment, perfect for schools, businesses, and resellers.

### Added - Hierarchical System

**Three-Tier Access Control:**
- **OWNER Level** (Top Tier)
  - Full system control across all organizations
  - Create and manage system administrators
  - View all devices across entire system
  - Access via `/api/admin` endpoints (backwards compatible)
  - Generate system administrator registration codes
  - Deactivate/reactivate/delete system administrators
  - Arm/disarm all devices system-wide
  - Complete audit trail and analytics

- **SYSTEM ADMINISTRATOR Level** (Middle Tier)
  - Group-based device management
  - Cannot view or control other administrators' groups
  - Zero-trust isolation between groups
  - Access via `/api/system` endpoints
  - Create users (master keys) within their group
  - Manage only devices in their group
  - Bulk arm/disarm for group devices
  - Group-specific analytics and reporting

- **USER Level** (Bottom Tier)
  - Individual device management
  - Can be independent or under a system administrator
  - Access via `/api/device` endpoints
  - Standard device registration and control
  - Personal device limits

### Added - Registration Code System

**Secure Onboarding:**
- One-time use registration codes for system administrators
- Owner generates codes via `/api/admin/system-admins/create`
- Codes expire after 7 days (configurable)
- Format: `XXXX-XXXX-XXXX-XXXX` (16 alphanumeric chars)
- System admins self-register with code
- Prevents unauthorized system administrator creation
- Full audit trail of code usage

**Registration Workflow:**
1. Owner creates registration code for new group
2. Owner provides code to system administrator
3. System administrator registers at `/api/system/register`
4. System administrator receives their own API key
5. System administrator can now create users and manage devices

### Added - Web Interfaces

**System Administrator Panel (`admin.html` and `admin.js`):**
- Modern, responsive design
- Login with system administrator API key
- Self-registration interface for new admins
- Real-time dashboard with auto-refresh
- Group statistics (devices, users, online/offline, armed/disarmed)
- Device management table
- User (master key) management
- Bulk operations (arm all, disarm all)
- Create new users for group
- Complete device control (arm, disarm, edit, delete)
- User revocation
- Secure API key handling

**Owner Panel (rename existing `admin.html` to `owner.html`):**
- System-wide view of all organizations
- Create registration codes for new system administrators
- Manage all system administrators (activate, deactivate, delete)
- View all registration codes and their status
- Cross-organization device control
- System-wide bulk operations
- Complete system analytics

### Added - Security Features

**Zero-Trust Architecture:**
- Each API call validates role and permissions
- System admins cannot access other groups' data
- Strict device ownership verification
- IP-based access logging
- Failed authentication tracking
- Automatic IP blocking after failed attempts

**Audit Logging:**
- Complete action history with actor tracking
- Hierarchical action attribution
- Registration code usage tracking
- System administrator creation/deletion logs
- Cross-group access attempt detection
- Exportable audit trails

### Added - API Endpoints

**Owner Endpoints (formerly admin):**
- `POST /api/admin/system-admins/create` - Generate registration code
- `GET /api/admin/system-admins` - List all system administrators
- `GET /api/admin/registration-codes` - View all registration codes
- `DELETE /api/admin/registration-codes/:code` - Revoke unused code
- `POST /api/admin/system-admins/:id/deactivate` - Deactivate admin
- `POST /api/admin/system-admins/:id/activate` - Reactivate admin
- `DELETE /api/admin/system-admins/:id` - Delete admin and all their data
- All existing admin endpoints retained

**System Administrator Endpoints:**
- `POST /api/system/register` - Self-register with code
- `GET /api/system/stats` - Group statistics
- `GET /api/system/devices` - List group devices only
- `GET /api/system/users` - List users in group
- `POST /api/system/users/create` - Create new user (master key)
- `POST /api/system/users/revoke` - Revoke user access
- `POST /api/system/device/arm` - Arm device (group only)
- `POST /api/system/device/disarm` - Disarm device (group only)
- `POST /api/system/devices/arm-all` - Arm all group devices
- `POST /api/system/devices/disarm-all` - Disarm all group devices
- `PUT /api/system/device/update` - Update device (group only)
- `DELETE /api/system/device/delete` - Delete device (group only)
- `GET /api/system/activity` - Group activity log
- `GET /api/system/breaches` - Group breach attempts
- `GET /api/system/geofences` - Group geofences
- `POST /api/system/geofence` - Create geofence (group only)
- `DELETE /api/system/geofence` - Delete geofence (group only)
- `GET /api/system/locations` - Group device locations

### Changed

**Authentication System:**
- Maintained backwards compatibility with existing master keys
- Added role-based authentication middleware
- Enhanced failed attempt tracking
- Improved session management

**Device Registration:**
- Devices now track their system administrator and group
- Automatic association with system administrator on registration
- Group name stored with device for easy identification
- Device limits per system administrator (configurable)

**Statistics & Monitoring:**
- Owner sees system-wide statistics
- System administrators see only their group statistics
- Users see only their device statistics
- Hierarchical activity logging

### Configuration

**New Environment Variables:**
```
MAX_DEVICES_PER_SYSADMIN=500       # Device limit per system administrator
MAX_SYSTEM_ADMINS=50                # Maximum system administrators
MAX_USERS_PER_SYSADMIN=100         # User limit per system administrator
REG_CODE_EXPIRY=604800000          # Registration code expiry (7 days in ms)
```

### Use Cases

**Perfect For:**
1. **School Districts** - Each school has a system administrator managing their devices
2. **Multi-Location Businesses** - Each branch manages their own devices
3. **MSPs (Managed Service Providers)** - Manage multiple client organizations
4. **Resellers** - Provide service to multiple independent customers
5. **Enterprise IT** - Department-based device management
6. **Parent Companies** - Subsidiary management with isolation

**Example Deployment:**
```
OWNER (School District IT)
  ├── System Admin 1 (Elementary School)
  │     ├── User (Teacher A) → 5 devices
  │     ├── User (Teacher B) → 3 devices
  │     └── User (Lab Manager) → 25 devices
  │
  ├── System Admin 2 (Middle School)
  │     ├── User (IT Staff) → 50 devices
  │     └── User (Principal) → 2 devices
  │
  └── System Admin 3 (High School)
        ├── User (Teacher C) → 4 devices
        └── User (Student Lab) → 100 devices
```

### Migration Guide

**For Existing Installations:**
1. Existing admin keys become owner keys (no change needed)
2. Existing master keys continue to work as independent users
3. Existing devices remain functional
4. To use new system:
   - Rename `admin.html` to `owner.html`
   - Use `admin.html` for system administrators
   - Generate registration codes for new system administrators

### Breaking Changes

**None** - Full backwards compatibility maintained

### Technical Details

**Storage Structure:**
```javascript
storage = {
  ownerKey: null,
  systemAdmins: Map(),          // New
  registrationCodes: Map(),      // New
  adminKeys: Set(),              // Now owner keys
  masterKeys: Set(),
  masterKeyData: Map(),          // Enhanced with systemAdminId
  devices: Map(),                // Enhanced with systemAdminId, groupId
  // ... rest unchanged
}
```

**Security Model:**
- Owner: Controls everything
- System Admin: Controls only their group (strict enforcement)
- User: Controls only their devices
- No cross-group access possible
- All actions logged with attribution

### Performance

- Optimized filtering for large device counts
- Efficient group-based queries
- Minimal overhead for hierarchical checks
- Scalable to 1000s of devices per system administrator

### Documentation

- Updated API documentation with all new endpoints
- New system administrator guide
- Registration code workflow documentation
- Migration guide for existing deployments
- Security model documentation

---

## [4.1.0] - 2026-01-31

### Added
- Enhanced keep-alive system with 6 concurrent strategies
- Geofencing with virtual geographic boundaries
- Real-time location tracking with GPS
- Quarantine mode for maximum security isolation
- Breach detection system with automated monitoring
- Device fingerprinting for unique identification
- Battery and network monitoring
- Admin panel for enterprise management
- Bulk operations (arm/disarm all devices)
- IP blocking for security
- Activity logging with comprehensive audit trail
- Auto-refresh dashboards
- Enhanced lock screen with multiple anti-bypass mechanisms

### Changed
- Reduced heartbeat interval from 5s to 2s
- Improved lock screen visual design
- Enhanced error handling and retry logic
- Optimized API communication efficiency
- Updated UI with modern design patterns

### Fixed
- Service worker termination issues
- GPS location acquisition reliability
- Lock screen escape attempts
- Memory leak in heartbeat loop
- Cross-browser compatibility issues

### Security
- SHA-256 hashing for all API keys
- TLS 1.3 enforcement
- Enhanced keyboard/mouse suppression
- DOM self-healing against tampering
- Nonce-based replay protection
- Rate limiting on all endpoints

---

## [4.0.0] - 2026-01-15

Initial public release with remote lock/unlock, real-time heartbeat, user control panel, and device registration.

---

**Version 4.2.0** represents a major architectural enhancement enabling multi-organization deployments while maintaining complete backwards compatibility. This release is production-ready for enterprise and large-scale deployments.

For migration assistance or questions, contact: browserbricker@gmail.com
# Changelog

All notable changes to BrowserBricker are documented here.

## [4.2.1] - 2026-02-01

### Added - System Persistence & Recovery
- **JSON State Export:** Added ability for the Owner to download the entire system state (Maps, Sets, Logs, and Settings) as a single encrypted-hash JSON file.
- **JSON State Import:** Added a recovery mechanism to upload a previously saved JSON state, allowing the system to restore all Admins, Devices, and Keys after a server restart or deployment.

### Fixed - Critical API Endpoints
- **Global User Management:** Added missing `GET /api/admin/users` endpoint to allow Owners to view all Master Keys across the entire system.
- **Global Revocation:** Added missing `POST /api/admin/revoke-key` endpoint for Owners to revoke any Master Key regardless of group.
- **Data Synchronization:** Fixed `GET /api/admin/system-admins` to include `registrationCodes` in the response, resolving the issue where pending codes were not appearing in the Owner Panel.

### Fixed - UX & Workflow Improvements
- **Group Management:** Updated the System Admin creation form to include the mandatory `groupName` field required by the server.
- **Registration Workflow:** Replaced browser `alert()` pop-ups with a streamlined **Toast + Auto-Copy** system. New registration codes are now automatically copied to the clipboard and displayed in a non-intrusive toast notification.
- **Persistence UI:** Added a dedicated "System State Persistence" section in the Owner Settings for manual backups.

---

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

### Added - Web Interfaces
- **System Administrator Panel (`admin.html` and `admin.js`)**
- **Owner Panel (renamed existing `admin.html` to `owner.html`)**

### Added - Security Features
- **Zero-Trust Architecture:** Strict role validation and group isolation.
- **Audit Logging:** Comprehensive history with actor tracking and hierarchical attribution.

### Changed
- **Authentication System:** Role-based middleware with backwards compatibility for existing keys.
- **Device Registration:** Devices now track `systemAdminId` and `groupId`.

### Configuration
**New Environment Variables:**
- `MAX_DEVICES_PER_SYSADMIN`
- `MAX_SYSTEM_ADMINS`
- `MAX_USERS_PER_SYSADMIN`
- `REG_CODE_EXPIRY`

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

### Changed
- Reduced heartbeat interval from 5s to 2s
- Improved lock screen visual design
- Enhanced error handling and retry logic

### Fixed
- Service worker termination issues
- GPS location acquisition reliability
- Lock screen escape attempts
- Memory leak in heartbeat loop

### Security
- SHA-256 hashing for all API keys
- TLS 1.3 enforcement
- DOM self-healing against tampering
- Nonce-based replay protection

---

## [4.0.0] - 2026-01-15
Initial public release with remote lock/unlock, real-time heartbeat, user control panel, and device registration.

---

**Version 4.2.1** addresses early feedback from the 4.2.0 deployment, ensuring the Hierarchical System is fully operational and data can be persisted across server restarts.

For migration assistance or questions, contact: browserbricker@gmail.com

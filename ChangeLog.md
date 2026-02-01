# Changelog

All notable changes to BrowserBricker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.0] - 2026-01-31

### Added
- **Enhanced Keep-Alive System**: 6 concurrent strategies for maximum service worker persistence
  - Chrome Alarms API (30-second intervals)
  - Long-lived port connections
  - Periodic storage access
  - Offscreen document maintenance
  - Web request listeners
  - Self-message loops
- **Geofencing**: Create virtual geographic boundaries with automatic enforcement
- **Real-Time Location Tracking**: Live GPS monitoring with 5-second refresh
- **Quarantine Mode**: Maximum security isolation for compromised devices
- **Breach Detection System**: Automated monitoring and alerting for security incidents
- **Device Fingerprinting**: Hardware-based unique identification
- **Battery Monitoring**: Real-time battery level and charging status
- **Network Information**: Connection type and speed monitoring
- **Admin Panel**: Enterprise-grade management dashboard
- **Bulk Operations**: Lock/unlock all devices simultaneously
- **IP Blocking**: Automatic blocking of suspicious IP addresses
- **Activity Logging**: Comprehensive audit trail for all actions
- **Auto-Refresh**: 5-second updates for real-time status
- **Enhanced Lock Screen**: Multiple anti-bypass mechanisms

### Changed
- Reduced heartbeat interval from 5s to 2s for faster response
- Improved lock screen visual design with professional styling
- Enhanced error handling and retry logic
- Optimized API communication efficiency
- Updated UI with modern design patterns

### Fixed
- Service worker termination issues resolved with multi-strategy keep-alive
- GPS location acquisition reliability improved
- Lock screen escape attempts now properly blocked
- Memory leak in heartbeat loop eliminated
- Cross-browser compatibility issues resolved

### Security
- SHA-256 hashing for all API keys
- TLS 1.3 enforcement for all communications
- Enhanced keyboard/mouse event suppression
- DOM self-healing against tampering
- Nonce-based replay protection
- Rate limiting on API endpoints

## [4.0.0] - 2026-01-15

### Added
- Initial public release
- Remote lock/unlock functionality
- Real-time heartbeat system (5-second intervals)
- User control panel
- Device registration system
- Master API key generation
- Basic location services
- Device metadata collection

### Security
- API key authentication
- HTTPS-only communication
- Basic anti-bypass mechanisms

## [3.0.0] - 2025-12-01 (Internal Beta)

### Added
- Manifest V3 migration
- Service worker architecture
- Offscreen document for geolocation
- Chrome storage integration

## [2.0.0] - 2025-10-15 (Internal Alpha)

### Added
- Proof of concept with basic locking
- Simple web interface
- Manual heartbeat system

## [1.0.0] - 2025-09-01 (Internal Prototype)

### Added
- Initial concept and design
- Basic extension structure
- Lock screen prototype

---

## Version Numbering

BrowserBricker follows Semantic Versioning:

- **MAJOR** version: Incompatible API changes
- **MINOR** version: New functionality (backwards compatible)
- **PATCH** version: Bug fixes (backwards compatible)

## Release Dates

- Major releases: Quarterly (March, June, September, December)
- Minor releases: Monthly or as needed
- Patch releases: As needed for critical fixes

## Upgrade Notes

### Upgrading to 4.1.0

**Breaking Changes:** None

**New Features:**
- Geofencing requires GPS permissions
- Location tracking is opt-in per device
- Admin panel requires separate authentication

**Recommendations:**
1. Review security documentation
2. Test geofencing in safe environment
3. Configure breach detection alerts
4. Update admin access policies

**Database Changes:** None (backwards compatible)

---

## Deprecation Notices

### Current Deprecations
- None

### Future Deprecations
- Manifest V2 support (if migrating to V3 wasn't already complete)

---

## Known Issues

### 4.1.0
- Extension can still be manually disabled by tech-savvy users
- GPS accuracy varies by device and environment
- Service worker may terminate after ~5 minutes on some systems (mitigated by keep-alive)

### Workarounds
- Combine with OS-level parental controls
- Use Chrome managed policies for enterprise
- Enable multiple geofences for redundancy

---

## Roadmap

### Planned for 4.2.0 (Q1 2026)
- Two-factor authentication for admin panel
- Mobile app for iOS/Android
- Historical location playback
- Scheduled arm/disarm rules
- Email/SMS notifications
- Advanced breach analytics

### Planned for 4.3.0 (Q2 2026)
- Multi-user organizations
- Role-based access control
- Custom lock screen messages
- Screenshot capture on lock
- Remote command execution

### Planned for 5.0.0 (Q3 2026)
- Firefox support
- Safari support
- Self-hosted option
- API webhooks
- Custom integrations

---

**Changelog maintained by**: Aakshat Hariharan  
**Last Updated**: January 31, 2026

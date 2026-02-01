# Contributing to BrowserBricker

Thank you for your interest in contributing to BrowserBricker! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

### Our Standards

**Positive Environment:**
- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy toward others

**Unacceptable Behavior:**
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Unprofessional conduct

### Enforcement

Violations should be reported to: browserbricker@gmail.com

---

## Getting Started

### Prerequisites

**Required:**
- Node.js 18+ and npm
- Git
- Chrome/Chromium browser
- Code editor (VS Code recommended)

**Recommended:**
- ESLint extension
- Prettier extension
- Chrome DevTools experience

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/browserbricker.git
cd browserbricker

# Add upstream remote
git remote add upstream https://github.com/Aaks-hatH/Browser-Bricker-Panel.git
```

---

## Development Setup

### Extension Development

```bash
# No build step required for basic development
# Extension files are ready to use as-is

# Load extension in Chrome:
# 1. Navigate to chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load Unpacked"
# 4. Select the project directory
```

### Installing Dependencies (if needed)

```bash
# If you're working on build tools or testing
npm install
```

### Running Tests

```bash
# Run extension tests (when available)
npm test

# Run linter
npm run lint

# Format code
npm run format
```

---

## How to Contribute

### Types of Contributions

**Bug Reports:**
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser version and OS

**Feature Requests:**
- Clear use case
- Why it's needed
- How it should work
- Alternative solutions considered

**Code Contributions:**
- Bug fixes
- New features
- Performance improvements
- Documentation updates
- Test coverage

### Finding Issues

**Good First Issues:**
- Labeled `good-first-issue`
- Well-defined scope
- Clear acceptance criteria
- Mentor available

**Help Wanted:**
- Labeled `help-wanted`
- Community input needed
- May require discussion

---

## Pull Request Process

### Before Starting

1. **Check existing issues**
   - Avoid duplicate work
   - Comment on issue to claim it

2. **Discuss major changes**
   - Open issue first
   - Get maintainer feedback
   - Agree on approach

### Development Workflow

```bash
# 1. Sync with upstream
git checkout main
git pull upstream main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes
# ... code, commit, repeat ...

# 4. Keep branch updated
git fetch upstream
git rebase upstream/main

# 5. Push to your fork
git push origin feature/your-feature-name
```

### Commit Messages

**Format:**
```
type(scope): brief description

Detailed explanation of what changed and why.

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(geofencing): add radius validation

Validate geofence radius between 10m and 100km.
Prevents server errors from invalid inputs.

Fixes #45
```

```
fix(lock-screen): prevent escape key bypass

Added event capture to block escape key.
Lock screen now fully keyboard-proof.

Fixes #67
```

### Creating Pull Request

1. **Push branch to your fork**

2. **Open PR on GitHub**
   - Clear title (same as commit message)
   - Detailed description
   - Reference related issues
   - Add screenshots if UI changes

3. **PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] Works in Chrome, Edge, Brave
```

4. **Wait for review**
   - Respond to feedback
   - Make requested changes
   - Keep PR updated

---

## Coding Standards

### JavaScript Style

**General:**
- ES2020+ syntax
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Template literals for interpolation

**Good:**
```javascript
async function loadDevices() {
  const data = await apiCall('/api/devices');
  const devices = data.devices || [];
  
  return devices.map(device => ({
    id: device.deviceId,
    name: device.deviceName,
    online: device.online
  }));
}
```

**Bad:**
```javascript
function loadDevices(){
    var data=apiCall('/api/devices')
    return data.devices.map(function(device){return{id:device.deviceId,name:device.deviceName}})
}
```

### File Organization

```
browserbricker/
├── background.js      # Service worker
├── popup.html         # Extension popup
├── popup.js           # Popup logic
├── lock.html          # Lock screen
├── offscreen.html     # GPS helper
├── offscreen.js       # GPS logic
├── manifest.json      # Extension manifest
└── icon.png           # Extension icon
```

### API Patterns

**Consistent naming:**
```javascript
// Good
async function apiCall(endpoint, method = 'GET', body = null) {}

// Bad  
async function makeRequest(url, type, data) {}
```

**Error handling:**
```javascript
// Always use try-catch
try {
  const response = await fetch(url);
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

### HTML/CSS Standards

**HTML:**
- Semantic elements
- Proper indentation
- Descriptive IDs/classes
- Accessibility attributes

**CSS:**
- CSS variables for colors
- Mobile-first responsive
- Consistent naming (BEM-like)
- Comments for complex sections

---

## Testing

### Manual Testing

**Required for all PRs:**

1. **Extension Loading**
   - Loads without errors
   - Icon appears in toolbar
   - Popup opens correctly

2. **Configuration**
   - Setup screen works
   - API key validation
   - Settings persist

3. **Lock/Unlock**
   - Device locks within 2s
   - All tabs show lock screen
   - New tabs show lock screen
   - Unlock restores functionality

4. **Cross-Browser**
   - Chrome
   - Edge  
   - Brave (recommended)

### Browser Compatibility

Test in:
- Chrome 88+
- Edge 88+
- Brave 1.20+

### Performance Testing

Check:
- Memory usage stays reasonable
- No memory leaks
- CPU usage minimal
- Network requests efficient

---

## Documentation

### Code Comments

**When to comment:**
- Complex algorithms
- Non-obvious decisions
- Security-critical code
- Public APIs

**Example:**
```javascript
/**
 * Generates a stable device fingerprint using hardware characteristics.
 * 
 * Components:
 * - User agent (browser/OS info)
 * - Hardware concurrency (CPU cores)
 * - Platform (OS)
 * - Language preference
 * 
 * @returns {Promise<string>} 64-character hex hash
 */
async function generateFingerprint() {
  // Implementation
}
```

### Documentation Updates

**Update when changing:**
- Public APIs
- User workflows
- Configuration options
- Security features
- Installation steps

**Files to update:**
- README.md (if user-facing)
- FEATURES.md (if new feature)
- SECURITY.md (if security-related)
- INSTALLATION.md (if setup changes)

---

## Review Process

### What Reviewers Look For

**Code Quality:**
- Follows style guide
- No unnecessary complexity
- Proper error handling
- Good variable names

**Functionality:**
- Works as described
- No regressions
- Edge cases handled
- Cross-browser compatible

**Security:**
- No vulnerabilities introduced
- Proper input validation
- Secure by default
- Privacy respected

**Documentation:**
- Code commented appropriately
- User docs updated
- Changelog entry added

### After Review

**If changes requested:**
1. Make requested changes
2. Push to same branch
3. Respond to comments
4. Request re-review

**If approved:**
1. Maintainer will merge
2. Branch will be deleted
3. Your contribution is live!

---

## Release Process

### Version Numbering

**Semantic Versioning:**
- MAJOR.MINOR.PATCH (e.g., 4.1.0)
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Changelog

Update CHANGELOG.md with every PR:

```markdown
## [4.2.0] - 2026-02-15

### Added
- New geofence validation
- Battery monitoring improvements

### Fixed
- Lock screen escape key bypass
- Memory leak in heartbeat loop

### Changed
- Updated dependencies
```

---

## Community

### Communication Channels

**GitHub Issues:**
- Bug reports
- Feature requests
- General questions

**Discussions:**
- Use GitHub Discussions for:
  - Ideas and brainstorming
  - Q&A
  - Show and tell

**Email:**
- Security issues: browserbricker@gmail.com
- General: browserbricker@gmail.com

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to BrowserBricker!

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Contributing Guide v4.1** • Last Updated: January 2026 • By Aakshat Hariharan

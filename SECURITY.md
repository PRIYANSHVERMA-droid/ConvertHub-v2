# Security Policy

## Overview

ConvertHub v2 is a fully offline, local-first desktop application. All file processing happens on-device using embedded engine binaries (FFmpeg, LibreOffice, 7-Zip) and JavaScript libraries (pdf-lib, pdfjs-dist). No user data, file content, telemetry, or metadata is ever transmitted to any external server.

This document outlines the project's security posture, known threat surface, responsible disclosure process, and guidance for users and contributors.

---

## Supported Versions

Security fixes are backported only to the latest stable release. Older releases are not maintained.

| Version | Supported |
|---------|-----------|
| v2.x (latest) | ✅ Active |
| v1.x | ❌ End of Life |

---

## Reporting a Vulnerability

If you discover a security vulnerability in ConvertHub v2, **do not open a public GitHub issue.** Public disclosure before a fix is available puts all users at risk.

**Please report privately via GitHub's built-in security advisory system:**

1. Navigate to the [Security tab](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/security) of this repository.
2. Click **"Report a vulnerability"**.
3. Fill in the advisory form with as much detail as possible.

**What to include in your report:**

- A clear description of the vulnerability and the component affected
- Steps to reproduce the issue (proof-of-concept files, commands, or scenarios)
- The potential impact (what an attacker could achieve)
- Your suggested fix or mitigation, if you have one

**Response timeline:**

| Stage | Target |
|-------|--------|
| Initial acknowledgement | Within 72 hours |
| Triage and severity assessment | Within 7 days |
| Patch or mitigation released | Within 30 days for critical/high severity |
| Public disclosure (CVE if applicable) | After patch is available |

Reporters who follow responsible disclosure will be credited in the release notes unless they prefer to remain anonymous.

---

## Security Architecture

### Offline-First Design

ConvertHub v2 has no network communication during normal operation. There are no API calls, analytics pings, update beacons, or cloud sync features. The only network activity is the auto-updater module (`core/updater.js`), which queries GitHub Releases for version metadata. It does not transmit any user data or file content.

### Process Isolation (Electron IPC)

The application follows Electron's security best practices for renderer/main process separation:

- **`nodeIntegration` is disabled** in the renderer process. Renderer-side UI code (`ui/app.js`) cannot directly access Node.js APIs.
- **`contextIsolation` is enabled.** The renderer and main process operate in separate V8 contexts.
- **`preload.js` acts as the sole bridge.** Only explicitly whitelisted IPC channels exposed via `contextBridge` are accessible to the UI. This limits the attack surface if renderer-side code is ever compromised (e.g. via a malicious file triggering an XSS-equivalent in the HTML renderer).
- **`webSecurity` is not disabled.** The default Chromium security model is preserved.

### Bundled Engine Binaries

The application ships with three native engine binaries:

| Binary | Location | Purpose |
|--------|----------|---------|
| `ffmpeg.exe` | `engines/ffmpeg.exe` | Audio, video, and image conversion |
| `7za.exe` + `7za.dll` | `engines/7zip/` | Archive creation and extraction |
| LibreOffice (embedded) | `engines/libreoffice/` | Document format conversion |

These binaries are executed via `child_process.spawn` from the main process with arguments constructed by `core/conversionManager.js`. They run as child processes of the Electron main process and inherit its OS-level user permissions.

**Important:** Antivirus software may flag these bundled executables as suspicious because locally-executed native binaries are a common vector for malware distribution. The binaries in official ConvertHub v2 releases are unmodified, sourced from their respective upstream projects. See the [Verifying Official Releases](#verifying-official-releases) section below.

---

## Known Threat Surface

The following areas represent the primary attack surface for ConvertHub v2:

### 1. Malicious Input Files

**Risk:** A specially crafted file (e.g., malformed PDF, video, or archive) could trigger a vulnerability in a bundled engine binary (FFmpeg, LibreOffice, 7-Zip) or in the JavaScript PDF libraries (pdf-lib, pdfjs-dist), potentially causing a crash, memory corruption, or arbitrary code execution within the engine's process.

**Mitigations:**
- Engines run as separate child processes, not in the Electron renderer.
- Process arguments are constructed programmatically, not interpolated from raw file content.
- Users should avoid processing files from untrusted sources.

**Residual risk:** Engine vulnerabilities (e.g., a CVE in a specific FFmpeg version) that are not yet patched in the bundled binary. Monitor the [Releases](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/releases) page for engine updates.

---

### 2. Command Injection via File Paths

**Risk:** If file paths supplied by the user are passed unsanitized to `child_process.spawn` or shell execution, an attacker could craft a malicious filename (e.g., `` `rm -rf /` ``) to inject arbitrary shell commands.

**Mitigations:**
- `child_process.spawn` (not `exec`) should be used with argument arrays, which avoids shell interpretation entirely.
- File paths should be validated and sanitized in `core/conversionManager.js` before being passed as arguments.

**Recommendation for contributors:** Never use `child_process.exec` with user-controlled input. Always use `spawn` with explicit argument arrays. Validate that file paths do not contain shell metacharacters before use.

---

### 3. Path Traversal in Output Handling

**Risk:** If output file paths are constructed from user-supplied input without canonicalization, a crafted conversion job could write output files to arbitrary locations on the filesystem (e.g., `../../AppData/Roaming/...`).

**Recommendation:** Output paths should be resolved with `path.resolve()` and validated to confirm they remain within the expected output directory before any write operation.

---

### 4. IPC Channel Abuse

**Risk:** Since `preload.js` exposes IPC channels to the renderer, any XSS vulnerability or prototype pollution in the renderer-side JavaScript (`ui/app.js`) could be leveraged to invoke privileged IPC handlers in the main process.

**Mitigations:**
- Context isolation is enabled, preventing direct prototype access across the bridge.
- IPC handlers in the main process should validate all incoming arguments (types, shapes, allowed values) rather than trusting renderer input.
- No external URLs should be loaded in the app's `BrowserWindow`.

---

### 5. Auto-Updater Integrity

**Risk:** The auto-updater (`core/updater.js`) fetches release metadata from GitHub. If the update mechanism does not verify the authenticity of downloaded binaries before executing them, a compromised network path (MITM) or a compromised GitHub release could deliver a malicious installer.

**Recommendation:** Verify that `electron-updater` (or the equivalent mechanism in use) validates code signatures on downloaded release files before installation. Windows Authenticode signing of release `.exe` files is strongly recommended.

---

### 6. LibreOffice Macro Execution

**Risk:** LibreOffice supports embedded macros in document formats (`.odt`, `.doc`, `.xls`, etc.). If macro execution is not explicitly disabled when invoking LibreOffice, a malicious document could execute arbitrary code via the LibreOffice macro runtime.

**Recommendation:** Always invoke LibreOffice with the `--headless --norestore --nofirststartwizard` flags and confirm that macro execution is disabled in the bundled LibreOffice profile (`engines/libreoffice/presets/`). The `--infilter` and `--convert-to` flags should be used to enforce conversion-only mode.

---

## Verifying Official Releases

To verify that a downloaded release binary has not been tampered with:

1. Download the `.exe` installer from the [Releases](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/releases) page.
2. Compare the file hash against the SHA-256 checksums published in the release notes.
3. On Windows, right-click the installer → Properties → Digital Signatures tab to confirm the Authenticode signature is valid (if code-signing is applied to the release).

**Do not install ConvertHub v2 from any third-party site, torrent, or mirror.** Only official GitHub releases are maintained by this project.

---

## Dependency Security

ConvertHub v2 uses npm for JavaScript dependencies. To audit your local installation for known vulnerabilities:

```bash
npm audit
```

To update dependencies to the latest non-breaking patch versions:

```bash
npm update
npm audit fix
```

Contributors are expected to run `npm audit` before submitting a pull request and to resolve any critical or high severity findings.

**Bundled native binaries** (FFmpeg, 7-Zip, LibreOffice) are not managed by npm. Upstream CVEs in these tools should be tracked via:

- [FFmpeg Security Advisories](https://ffmpeg.org/security.html)
- [7-Zip Changelog](https://www.7-zip.org/history.txt)
- [LibreOffice Security Advisories](https://www.libreoffice.org/about-us/security/)

---

## Electron Security Checklist

This project targets compliance with the [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security). The following items are applicable to ConvertHub v2:

| Item | Status |
|------|--------|
| `nodeIntegration: false` in renderer | ✅ Required |
| `contextIsolation: true` | ✅ Required |
| `webSecurity: true` (default, not disabled) | ✅ Required |
| No use of `eval()` or `new Function()` in renderer | ✅ Required |
| IPC input validation in main process handlers | ⚠️ Must be verified per-handler |
| `child_process.spawn` used (not `exec`) for engine calls | ⚠️ Must be verified in `conversionManager.js` |
| Renderer never loads remote URLs | ✅ Required |
| Auto-updater verifies binary signatures | ⚠️ Verify against release pipeline |
| LibreOffice macro execution disabled | ⚠️ Verify in LibreOffice invocation flags |
| Code signing applied to release `.exe` | ⚠️ Recommended for distribution |

Items marked ⚠️ should be reviewed and confirmed during each release cycle.

---

## Responsible Disclosure Policy

This project follows a **coordinated disclosure** model:

- Reporters should notify the maintainer privately before any public disclosure.
- The maintainer commits to acknowledging reports within 72 hours and providing a remediation timeline.
- Public disclosure (including CVE assignment if warranted) will occur only after a patch is available and users have had reasonable time to update.
- Reporters who act in good faith will not face legal action for security research conducted responsibly.

---

## Security Hall of Fame

Security researchers who report valid vulnerabilities through responsible disclosure will be credited here.

*No entries yet. Be the first.*

---

## Contact

For security issues: use GitHub's private [Security Advisory](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/security/advisories/new) feature.

For general questions: open a [GitHub Discussion](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/discussions) or file an [Issue](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/issues).

---

*This security policy was last updated: June 2026.*
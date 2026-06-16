# Contributing to ConvertHub v2

First off — thanks for taking the time to contribute. ConvertHub v2 is a solo-built, offline-first desktop suite and every contribution (bug report, feature suggestion, code, or documentation fix) genuinely moves the project forward.

This document explains how to get your development environment running, how the codebase is structured, what the contribution workflow looks like, and what the code standards are. Please read it before opening a pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Engine Binaries Policy](#engine-binaries-policy)
- [Security Issues](#security-issues)

---

## Code of Conduct

This project follows a straightforward rule: be respectful and constructive. Harassment, personal attacks, or dismissive behavior in issues, pull requests, or discussions will result in removal from the project. If something goes wrong, open an issue or start a discussion — don't create drama.

---

## Ways to Contribute

You don't need to write code to contribute meaningfully:

- **Bug reports** — Detailed, reproducible reports with sample files (where safe to share) are extremely valuable.
- **Feature requests** — Well-reasoned proposals with clear use cases and scope are welcome.
- **Documentation** — Improving the README, adding inline code comments, fixing typos.
- **UI/UX feedback** — Suggestions on the interface, workflow friction points, or accessibility issues.
- **Code** — Bug fixes, new features, performance improvements, or refactors that align with the roadmap.
- **Engine flag research** — Finding better FFmpeg, LibreOffice, or 7-Zip invocation arguments for quality or performance.

---

## Development Environment Setup

### Prerequisites

Make sure the following are installed before cloning:

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | v18 or v20 LTS | Required by Electron |
| npm | v9+ | Comes with Node.js |
| Git | Any recent version | — |
| Windows OS | Windows 10 / 11 | App currently targets Windows only |

> **Why Windows only?** The bundled engine binaries (`ffmpeg.exe`, `7za.exe`, the LibreOffice install) are Windows builds. Cross-platform support is on the roadmap (see `README.md`). Development on macOS/Linux is possible but you will not be able to run the full conversion pipeline locally.

### Clone and Install

```bash
git clone https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2.git
cd ConvertHub-v2
npm install
```

### Run in Development Mode

```bash
npm start
```

This launches Electron with the app loaded from the local source tree. Changes to `ui/` files (HTML, CSS, JS) are reflected on reload (`Ctrl+R` in the app window). Changes to `main.js`, `preload.js`, or `core/` files require a full restart (`Ctrl+C` then `npm start`).

### Open DevTools

Inside the running app window:

```
Ctrl + Shift + I
```

Or add this line temporarily to `main.js` during development:

```javascript
mainWindow.webContents.openDevTools();
```

Remove it before committing.

### Build a Local Installer

```bash
npm run build
```

This produces a packaged `.exe` installer in the `dist/` directory using `electron-builder`. The `dist/` folder is gitignored — do not commit build artifacts.

---

## Project Structure

```
ConvertHub-v2/
│
├── main.js              # Electron main process — window creation, IPC handlers,
│                        # app lifecycle, child process orchestration
│
├── preload.js           # Context bridge — the ONLY surface between renderer
│                        # and main process; exposes whitelisted IPC channels
│
├── core/
│   ├── conversionManager.js  # Constructs and dispatches engine CLI calls;
│   │                         # manages the conversion job queue
│   ├── pdfProcessor.js       # pdf-lib / pdfjs-dist operations (merge, split,
│   │                         # compress, watermark, page reorder)
│   └── updater.js            # GitHub Releases auto-update check
│
├── engines/
│   ├── ffmpeg.exe            # Audio / video / image conversion engine
│   ├── 7zip/
│   │   ├── 7za.exe           # Archive creation and extraction
│   │   └── 7za.dll
│   └── libreoffice/          # Embedded LibreOffice for document conversion
│       ├── program/
│       ├── presets/
│       ├── share/
│       └── URE/
│
├── ui/
│   ├── index.html            # Single-page shell; all views rendered here
│   ├── app.js                # All renderer-side logic (UI state, IPC calls,
│   │                         # drag-and-drop, queue rendering)
│   └── styles.css            # Global styles, theme variables, animations
│
├── assets/
│   ├── app-icon.ico          # Application icon
│   └── screenshots/          # README screenshots and GIFs
│
├── package.json
├── package-lock.json
├── .gitignore
├── .gitattributes
├── LICENSE
├── README.md
└── SECURITY.md
```

---

## Architecture Overview

Understanding the process boundary is critical before making any changes:

```
┌─────────────────────────────────────────────────────┐
│  RENDERER PROCESS (Chromium)                        │
│  ui/index.html + ui/app.js + ui/styles.css          │
│                                                     │
│  • No Node.js access (nodeIntegration: false)       │
│  • Communicates only via contextBridge API          │
└─────────────────────┬───────────────────────────────┘
                      │  IPC (whitelisted channels only)
                      │  via preload.js / contextBridge
┌─────────────────────▼───────────────────────────────┐
│  MAIN PROCESS (Node.js)                             │
│  main.js + core/conversionManager.js               │
│           + core/pdfProcessor.js                   │
│           + core/updater.js                         │
│                                                     │
│  • Full Node.js + Electron APIs                     │
│  • Spawns engine child processes                    │
│  • Reads / writes filesystem                        │
└─────────────────────┬───────────────────────────────┘
                      │  child_process.spawn()
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ffmpeg.exe      7za.exe     soffice.exe
  (media conv)  (archives)  (doc conversion)
```

**Rules that must not be broken:**

- Never enable `nodeIntegration` in the renderer. It is a critical security boundary.
- Never add new IPC channels in `preload.js` without validating all arguments in the corresponding `ipcMain` handler in `main.js`.
- Never call engine binaries from the renderer. All process spawning must happen in the main process.
- Never use `child_process.exec()` with user-supplied data. Always use `spawn()` with explicit argument arrays.

---

## Development Workflow

### 1. Find or create an issue

Before writing any code, check [Issues](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/issues) to see if the work is already tracked or in progress. If not, open one and describe what you're planning. This avoids duplicated effort and lets us discuss scope before you invest time.

### 2. Fork and branch

```bash
# Fork via GitHub UI, then:
git clone https://github.com/YOUR_USERNAME/ConvertHub-v2.git
cd ConvertHub-v2
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-short-description
```

Branch naming convention:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/short-name` | `feature/pdf-page-reorder` |
| Bug fix | `fix/issue-number-description` | `fix/42-ffmpeg-crash-mkv` |
| Docs | `docs/what-changed` | `docs/update-readme-badges` |
| Refactor | `refactor/what-changed` | `refactor/conversion-queue` |

### 3. Make your changes

Keep changes focused on one thing per branch. A pull request that fixes a bug, refactors an unrelated module, and adds a new feature is much harder to review and much more likely to introduce regressions.

### 4. Test your changes

There is currently no automated test suite. Manual testing is required:

- Test the specific conversion path(s) your change affects end-to-end.
- Test with edge-case inputs: very large files, files with special characters in their names, files with spaces in paths, corrupted files.
- Confirm existing functionality you didn't touch is not broken (smoke test the main conversion flows and PDF toolkit operations).
- Check both dark and light themes if your change touches the UI.

If you are adding a new feature, document the manual test steps in your PR description.

### 5. Run the security audit

```bash
npm audit
```

Resolve any critical or high severity findings before submitting. If a finding is a false positive or has no fix available, document it in the PR.

### 6. Open a pull request

Push your branch and open a PR against `main`. Fill in the PR template completely — reviewers should be able to understand the motivation, the change, and how to verify it without asking follow-up questions.

---

## Coding Standards

### JavaScript

- Use `const` and `let`. Never `var`.
- Use `async/await` over raw Promise chains for readability.
- Use `child_process.spawn` — never `exec` or `execSync` — when invoking engine binaries.
- Validate all IPC arguments in main process handlers. Do not trust renderer input.
- Do not use inline `setTimeout` hacks as substitutes for proper async handling.
- Error handling must be explicit. Swallowing errors with empty `catch` blocks is not acceptable.

```javascript
// ✅ Correct
try {
  const result = await runConversion(job);
  sendToRenderer('conversion:complete', result);
} catch (err) {
  console.error('[conversionManager] Job failed:', err);
  sendToRenderer('conversion:error', { message: err.message });
}

// ❌ Wrong
runConversion(job).then(r => sendToRenderer('conversion:complete', r)).catch(() => {});
```

### IPC Channels

Channel names must follow the `namespace:action` pattern and be documented with a comment at the point of registration in both `preload.js` and `main.js`:

```javascript
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // Trigger a file conversion job
  startConversion: (jobConfig) => ipcRenderer.invoke('conversion:start', jobConfig),
});

// main.js
ipcMain.handle('conversion:start', async (event, jobConfig) => {
  // Validate jobConfig shape before passing to conversionManager
  if (!jobConfig?.inputPath || !jobConfig?.outputFormat) {
    throw new Error('Invalid job config');
  }
  return await conversionManager.enqueue(jobConfig);
});
```

### UI / Frontend

- UI logic lives in `ui/app.js`. Do not add `<script>` tags directly in `index.html`.
- CSS custom properties (variables) defined in `styles.css` must be used for all colors and theme values. Do not hardcode hex values inline.
- New UI sections must support both the dark and light themes. Use the existing CSS variable structure.
- Avoid blocking the renderer thread. Any work that takes more than ~16ms should be offloaded to the main process via IPC.

### File and Path Handling

```javascript
const path = require('path');

// ✅ Always resolve and normalize paths
const resolvedOutput = path.resolve(outputDir, sanitizedFilename);

// ✅ Validate the resolved path stays within the expected directory
if (!resolvedOutput.startsWith(path.resolve(outputDir))) {
  throw new Error('Path traversal detected');
}

// ❌ Never concatenate paths with string interpolation
const badPath = outputDir + '/' + filename; // DO NOT DO THIS
```

---

## Commit Message Convention

This project uses a simplified [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body — explain WHY, not WHAT]

[optional footer — closes #issue-number]
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change with no behavior change |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace, no logic change |
| `chore` | Build config, dependency updates, tooling |
| `security` | Security fix or hardening |

**Examples:**

```
feat(pdf): add drag-and-drop page reordering to PDF organizer

fix(ffmpeg): handle filenames with spaces in conversion args

security(ipc): validate jobConfig shape in conversion:start handler

Closes #38

docs: add CONTRIBUTING.md and SECURITY.md
```

Keep the subject line under 72 characters. Use the imperative mood ("add", "fix", "update" — not "added", "fixed", "updated").

---

## Pull Request Guidelines

A pull request will be reviewed faster and merged more confidently if it:

- **Has a linked issue.** "Closes #42" in the PR description auto-closes the issue on merge.
- **Is scoped to one thing.** One PR, one concern.
- **Describes what changed and why.** Not just what the diff shows, but the reasoning behind the approach.
- **Lists how to test it.** Step-by-step manual verification steps with expected outcomes.
- **Does not include `dist/` or `node_modules/`.** These are gitignored for a reason.
- **Does not commit `engines/` binary changes** unless you have an explicit, documented reason and upstream source for the replacement binary.
- **Passes `npm audit`** with no critical or high severity findings.

PRs that are massive, out of scope, or arrive with no context will be closed with a request to resubmit properly scoped.

---

## Reporting Bugs

Open an [Issue](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/issues/new) and include:

**1. Environment**
- ConvertHub v2 version (from the About section or release tag)
- Windows version (e.g. Windows 11 23H2)
- CPU and GPU model (relevant for hardware acceleration bugs)

**2. What you were doing**
- Which module (Universal File Converter / Smart PDF Toolkit)
- Input file type and approximate size
- Conversion settings or operation selected

**3. What happened vs. what you expected**

**4. Steps to reproduce**
Numbered, minimal steps. If the issue only happens with a specific file, share the file if it contains no sensitive data, or describe its characteristics.

**5. Logs or error output**
Open DevTools (`Ctrl+Shift+I`) → Console tab and paste any red errors. If the app crashes entirely, check `%APPDATA%\ConvertHub v2\logs\` for crash logs.

Issues opened without reproduction steps will be labeled `needs-info` and may be closed if no additional detail is provided within 14 days.

---

## Suggesting Features

Open an [Issue](https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/issues/new) with the label `enhancement` and include:

- **The problem you're solving.** "I want X" is less useful than "I often need to do Y and currently have to Z instead."
- **Your proposed solution.** How you imagine it working from a user perspective.
- **Scope awareness.** Does this fit the offline-first, desktop-native philosophy of the app? Does it require new engine binaries or network access?
- **Alternatives you've considered.**

Features that require cloud connectivity, external API keys, or fundamentally change the offline-first design will generally not be accepted.

---

## Engine Binaries Policy

The `engines/` directory contains pre-built native binaries. These are **not managed by npm** and are not rebuilt as part of the normal contribution workflow.

**Do not submit PRs that modify engine binaries** unless:

- You are updating to a newer upstream version to patch a known CVE.
- The PR includes the upstream source, version number, and SHA-256 hash of the replacement binary.
- The change is discussed in an issue first.

Unverified binary changes will be rejected immediately. This is a hard policy — binary supply chain integrity matters.

---

## Security Issues

**Do not open a public issue for security vulnerabilities.**

Report them privately via GitHub's Security Advisory system. See [SECURITY.md](./SECURITY.md) for the full process, response timeline, and disclosure policy.

---

## Thank You

ConvertHub v2 is built with the belief that powerful software doesn't have to phone home. Every contribution that makes it faster, more reliable, or more useful — while keeping it fully offline — is welcome.

*Happy converting.*

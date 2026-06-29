# Changelog

## [2.3.0] - 2026-06-30

### Added
- **Video Toolkit** — New dedicated module for video editing operations:
  - Trim/cut clips with a visual timeline scrubber (lossless stream copy by default)
  - Merge/join multiple video clips in custom order
  - Extract audio to MP3, AAC, WAV, or FLAC
  - Compress video with quality and resolution presets
  - Hardcode subtitles from SRT, ASS, or VTT files
- In-app About dialog (Help → About ConvertHub)
- Privacy Policy, Terms of Use, and Third-Party Licenses documentation

### Fixed
- Fixed potential path traversal vulnerability during temporary file deletions by enforcing bounds checks.
- Fixed potential command injection vulnerabilities in child process execution by switching entirely to array-based arguments.
- Fixed unchecked URL redirection by introducing a domain allowlist for external link navigation.

### Security
- IPC channel argument validation hardened.
- shell.openExternal domain allowlist added.
- Child process spawn arguments sanitized (no shell interpolation).

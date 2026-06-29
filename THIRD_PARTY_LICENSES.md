# Third-Party Open Source Licenses & Attributions

ConvertHub v2 relies on and bundles several open-source software packages and standalone binary engines. We are grateful to the open-source community and maintainers of these projects.

---

## 🛠️ Standalone Binary Engines

### FFmpeg
- **License**: GNU Lesser General Public License v2.1 (core) / GNU General Public License v2+ (depending on compiled codecs)
- **SPDX Identifier**: `LGPL-2.1-or-later` (with GPL component caveat)
- **Project Home**: [https://ffmpeg.org](https://ffmpeg.org)
- **Source Code**: [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
- **Notice**: FFmpeg is bundled as a pre-compiled binary (`engines/ffmpeg.exe`). If the bundled build includes GPL-licensed libraries (such as libx264 or libx265), the compiled binary is effectively covered by the GPL. Users are free to replace the bundled `ffmpeg.exe` with their own LGPL-only build if desired.

### LibreOffice
- **License**: Mozilla Public License 2.0 (MPL-2.0) and GNU Lesser General Public License
- **SPDX Identifier**: `MPL-2.0`
- **Project Home**: [https://www.libreoffice.org](https://www.libreoffice.org)
- **Source Code**: [https://www.libreoffice.org/download/download/](https://www.libreoffice.org/download/download/)
- **Notice**: LibreOffice is bundled in its standard portable distribution format (`engines/libreoffice/`). The Document Foundation holds all LibreOffice trademarks. ConvertHub v2 is an independent project and is not affiliated with, sponsored by, or endorsed by The Document Foundation.

### 7-Zip
- **License**: GNU Lesser General Public License v2.1 (for `7za.dll` and 7-Zip library components)
- **Author**: Igor Pavlov
- **SPDX Identifier**: `LGPL-2.1-only`
- **Project Home**: [https://www.7-zip.org](https://www.7-zip.org)
- **Source Code**: [https://www.7-zip.org/download.html](https://www.7-zip.org/download.html)
- **Notice**: Bundled as standalone command-line components (`engines/7zip/7za.exe` and `7za.dll`).

---

## 📦 Core Libraries & Dependencies

### pdf-lib
- **License**: MIT
- **SPDX Identifier**: `MIT`
- **Source Code & Repository**: [https://github.com/Hopding/pdf-lib](https://github.com/Hopding/pdf-lib)

### pdfjs-dist
- **License**: Apache License 2.0
- **SPDX Identifier**: `Apache-2.0`
- **Source Code & Repository**: [https://github.com/mozilla/pdf.js](https://github.com/mozilla/pdf.js)

### Electron
- **License**: MIT
- **SPDX Identifier**: `MIT`
- **Source Code & Repository**: [https://github.com/electron/electron](https://github.com/electron/electron)

---

ConvertHub v2 itself is released under the MIT License. See `LICENSE` for details.

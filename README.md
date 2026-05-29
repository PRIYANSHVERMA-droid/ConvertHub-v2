<p align="center">
  <img src="https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/icon.png" width="120">
</p>

<h1 align="center">⚡ ConvertHub v2</h1>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue">
  <img src="https://img.shields.io/badge/platform-Windows-blue">
  <img src="https://img.shields.io/badge/version-2.1-green">
  <img src="https://img.shields.io/badge/built%20with-Electron-purple">
</p>

<p align="center">
  <a href="https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/releases">
    <img src="https://img.shields.io/badge/Download-Latest%20Release-blue?style=for-the-badge">
  </a>
</p>

---

## 🚀 Overview

ConvertHub v2 is a offline desktop conversion workspace focused on a clean UI, curated formats, high-performance processing, and advanced document management.

It integrates powerful, local engines like **FFmpeg**, **LibreOffice**, and **7-Zip** to handle multiple file formats in one unified application without requiring external installations or cloud connections.

---

## 🖥 Preview

### ⚡ Main Application UI

| Dark Theme | Light Theme |
| :---: | :---: |
| ![Main UI Dark](https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/UI%20Dark.png) | ![Main UI Light](https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/UI%20light.png) |

### ⚡ Universal File Converter

| Dark Theme | Light Theme |
| :---: | :---: |
| ![File Converter Dark](https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/File%20Converter%20Ui%20dark.png) | ![File Converter Light](https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/File%20Converter%20Ui%20light.png) |

#### 📂 File Conversion Walkthrough
<p align="center">
  <img src="https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/File%20conversion%20walkthrough.gif" width="850">
</p>

### 🛠 Smart PDF Toolkit

| Dark Theme | Light Theme |
| :---: | :---: |
| ![PDF Toolkit Dark](https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/PDF%20Toolkit%20Ui%20dark.png) | ![PDF Toolkit Light](https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/PDF%20Toolkit%20Ui%20light.png) |

#### 📂 PDF Toolkit Walkthrough
<p align="center">
  <img src="https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/PDF%20Toolkit%20walkthrough.gif" width="850">
</p>

---

## 🔥 Features

### ⚡ Universal File Converter
- 🎵 **Audio conversion**: Support for MP3, WAV, AAC, and FLAC.
- 🎬 **Video conversion**: Support for MP4, MKV, MOV, and AVI.
- 🖼 **Image conversion**: Support for JPG, PNG, and WEBP.
- 📄 **Document conversion**: Offline document conversions powered by LibreOffice.
- 📦 **Archive compression & extraction**: Archive management powered by 7-Zip.
- ⚡ **GPU-accelerated encoding**: Supports hardware acceleration for media conversion.
- ⚡ **Conversion queue system**: Support for high-performance batch operations.
- ⚡ **Presets**: Optimized conversion presets for quick configurations.

### 🛠 Smart PDF Toolkit
- 🖼 **Images to PDF Compilation**: Convert a list of images into a single PDF (configure layouts, margins, orientations, background colors, titles, and password encryption).
- 🔗 **PDF Merger**: Merge multiple PDF files together or compile specific page ranges.
- 📁 **Page Extraction**: Extract specific pages from a PDF as individual files or compiled images.
- 📦 **PDF to ZIP converter**: Export document pages directly as a high-resolution image ZIP archive.
- ✂ **PDF Visual Organizer**: Interactive workspace to drag, rotate, delete, or reorganize pages.
- 📉 **PDF Compression**: Supports pure lossless Flate compression and DPI re-encoded lossy compression.
- ✍ **PDF Watermarker**: Apply customizable watermarks with configurable text, placement, size, color, opacity, and rotation.

---

## 🎯 Presets

### 🎵 Audio
- Balanced MP3  
- High Quality MP3  
- Lossless FLAC  

### 🎬 Video
- Balanced MP4  
- High Quality MP4  
- Web Optimized (WebM)  

### 🖼 Images
- JPEG Balanced  
- JPEG High Quality  
- PNG Lossless  
- WebP Optimized  

### 📄 Documents
- PDF Export  
- Word Editable  
- Plain Text  

### 📦 Archives
- ZIP Compatible  
- 7Z Smaller Size  

---

## 🛠 Tech Stack

- **Electron** – Desktop shell framework  
- **Node.js** – Backend runtime  
- **pdf-lib** – PDF creation and editing engine
- **pdfjs-dist** – PDF rendering and parsing engine
- **FFmpeg** – Multi-format media processing  
- **LibreOffice** – Document conversion engine  
- **7-Zip** – High-ratio archive engine

---

## 📦 Installation

1. Go to the **Releases** section.  
2. Download the latest `.exe` installer.  
3. Run the installer to configure.  

👉 Download here:  
https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/releases  

---

## 📁 Project Structure

```
ConvertHub v2
│
├ assets
│   ├ screenshots
│   │   ├ icon.png
│   │   ├ File Converter Ui dark.png
│   │   ├ File Converter Ui light.png
│   │   ├ File conversion walkthrough.gif
│   │   ├ PDF Toolkit Ui dark.png
│   │   ├ PDF Toolkit Ui light.png
│   │   ├ PDF Toolkit walkthrough.gif
│   │   ├ UI Dark.png
│   │   └ UI light.png
│   └ app-icon.ico
│
├ core
│   ├ conversionManager.js
│   ├ pdfProcessor.js
│   └ updater.js
│
├ dist
│   ├ win-unpacked
│   ├ builder-debug.yml
│   ├ builder-effective-config.yaml
│   ├ ConvertHub v2 Setup.exe
│   └ latest.yml
│
├ engines
│   ├ 7zip
│   │   ├ 7za.exe
│   │   └ 7za.dll
│   │
│   ├ libreoffice
│   │   ├ program
│   │   ├ presets
│   │   ├ share
│   │   └ URE
│   │
│   └ ffmpeg.exe
│
├ node_modules
│
├ ui
│   ├ app.js
│   ├ index.html
│   └ styles.css
│
├ main.js
├ preload.js
├ package.json
├ package-lock.json
│
├ README.md
├ LICENSE
├ .gitignore
└ .gitattributes
```

---

## ⚠️ Notes

- Optimized for **Windows**.
- GPU acceleration depends on hardware support.  
- All engines run 100% locally; no internet connection is required.  
- Antivirus software may flag bundled binaries as false positives.  

---

## 🔮 Future Improvements

- 🐧 **Cross-Platform Support** – Porting configurations and engine wrappers to macOS and Linux platforms.
- 👁 **Offline OCR Support** – Integrating local Tesseract engine to recognize text inside scanned PDF documents and images.
- 🎨 **Preset Creator** – User interface to define, save, and export custom conversion parameter presets.
- ⚡ **Batch PDF Operations** – Support for batch-processing PDF watermarking, compression, and page organizing.

---

## 🤝 Contributing

1. Fork the repository.  
2. Create a new branch.  
3. Submit a pull request.  

---

## 📜 License

This project is licensed under the **MIT License**.  
See the LICENSE file for details.

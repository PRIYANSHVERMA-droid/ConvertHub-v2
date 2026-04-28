<p align="center">
  <img src="https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/icon.png" width="120">
</p>

<h1 align="center">⚡ ConvertHub v2</h1>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue">
  <img src="https://img.shields.io/badge/platform-Windows-blue">
  <img src="https://img.shields.io/badge/version-2.0-green">
  <img src="https://img.shields.io/badge/built%20with-Electron-purple">
</p>

<p align="center">
  <a href="https://github.com/PRIYANSHVERMA-droid/ConvertHub-v2/releases">
    <img src="https://img.shields.io/badge/Download-Latest%20Release-blue?style=for-the-badge">
  </a>
</p>

---

## 🚀 Overview

ConvertHub v2 is a modern desktop file converter focused on clean UI, curated formats, and high-performance processing.

It integrates powerful engines like **FFmpeg**, **LibreOffice**, and **7-Zip** to handle multiple file types in one unified application — without requiring external installations.

---

## 🖥 Preview

<p align="center">
  <img src="https://raw.githubusercontent.com/PRIYANSHVERMA-droid/ConvertHub-v2/main/assets/screenshots/ui.png" width="850">
</p>

---

## 🔥 Features

- 🎵 Audio conversion (MP3, WAV, AAC, FLAC)
- 🎬 Video conversion (MP4, MKV, MOV, AVI)
- 🖼 Image conversion (JPG, PNG, WEBP)
- 📄 Document conversion via LibreOffice
- 📦 Archive compression & extraction via 7-Zip

- ⚡ GPU-accelerated encoding (when supported)
- ⚡ Built-in conversion presets
- ⚡ Conversion queue system
- ⚡ Fully bundled engines (no setup required)

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

- **Electron** – Desktop framework  
- **Node.js** – Backend runtime  
- **FFmpeg** – Media processing  
- **LibreOffice** – Document conversion  
- **7-Zip** – Archive engine

---

## 📦 Installation

1. Go to the **Releases** section  
2. Download the latest `.exe`  
3. Run installer  

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
│   │   └ ui.png
│   └ app-icon.ico
│
├ core
│   └ conversionManager.js
│
├ Data
│   └ settings
│       ├ cache
│       ├ crash
│       ├ updates
│       └ user
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

- Optimized for **Windows**
- GPU acceleration depends on hardware support  
- Conversion speed varies based on file size, format, and system performance  
- Engines are bundled inside the app  
- Antivirus may flag binaries (false positives)  

---

## 🔮 Future Improvements

- Cross-platform support (Linux / macOS)  
- Auto-updater improvements  
- Performance tuning  

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch  
3. Submit a pull request  

---

## 📜 License

This project is licensed under the **MIT License**.  
See the LICENSE file for details.

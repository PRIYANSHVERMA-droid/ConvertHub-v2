import { state, escapeHtml, truncateName, getIconForFormat, getFolderFromPath, formatSize } from './state.js';
import { showToast } from './notifications.js';
import { refreshRecentFiles } from './historyUI.js';

import * as pdfjsLib from '../../node_modules/pdfjs-dist/build/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    '../../node_modules/pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();
window.pdfjsLib = pdfjsLib;


export function initPDFToolkit() {
    const desktopBridge = window.app;

    // --- Local Closed Variables for PDF Workspace ---
    let pdfImages = [];
    let pdfImageIdCounter = 0;
    let pdfImageDragId = null;
    let selectedPdfFile = null;
    let pdfMergeFiles = [];
    let pdfMergeIdCounter = 0;
    let pdfMergeDragId = null;
    let selectedWatermarkFile = null;
    let watermarkLogoFile = null;
    let selectedOrganizeFile = null;
    let pdfOrganizePages = [];
    let pdfCompressFiles = [];
    let pdfOrganizeDragSrcIndex = null;

    // --- DOM Elements ---
    const pdfTabs = Array.from(document.querySelectorAll('#pdf-workspace .pdf-tab'));
    const pdfImgPanel = document.getElementById('panel-img-to-pdf');
    const pdfExtractPanel = document.getElementById('panel-pdf-to-img');
    const pdfMergePanel = document.getElementById('panel-merge-pdf');
    const pdfImgDropzone = document.getElementById('pdf-img-dropzone');
    const pdfImgInput = document.getElementById('pdf-img-input');
    const pdfImageGridSection = document.getElementById('pdf-image-grid-section');
    const pdfThumbnailsGrid = document.getElementById('pdf-thumbnails-grid');
    const pdfImgCount = document.getElementById('pdf-img-count');
    const pdfImgClearBtn = document.getElementById('pdf-img-clear-btn');
    const pdfOutputName = document.getElementById('pdf-output-name');
    const pdfPageSize = document.getElementById('pdf-page-size');
    const pdfPageOrientation = document.getElementById('pdf-page-orientation');
    const pdfPageMargin = document.getElementById('pdf-page-margin');
    const pdfOutputFolderInput = document.getElementById('pdf-output-folder-input');
    const pdfPickFolderBtn = document.getElementById('pdf-pick-folder-btn');
    const pdfOpenFolderBtn = document.getElementById('pdf-open-folder-btn');
    const pdfCompileBtn = document.getElementById('pdf-compile-btn');
    const pdfFileDropzone = document.getElementById('pdf-file-dropzone');
    const pdfFileInput = document.getElementById('pdf-file-input');
    const pdfFileDetails = document.getElementById('pdf-file-details');
    const pdfDetailName = document.getElementById('pdf-detail-name');
    const pdfDetailMeta = document.getElementById('pdf-detail-meta');
    const pdfRemoveFileBtn = document.getElementById('pdf-remove-file-btn');
    const pdfExtractFormat = document.getElementById('pdf-extract-format');
    const pdfExtractRangeType = document.getElementById('pdf-extract-range-type');
    const pdfExtractRangeGroup = document.getElementById('pdf-extract-range-group');
    const pdfExtractRangeInput = document.getElementById('pdf-extract-range-input');
    const pdfResolutionMode = document.getElementById('pdf-resolution-mode');
    const pdfWidthSlider = document.getElementById('pdf-width-slider');
    const pdfWidthVal = document.getElementById('pdf-width-val');
    const pdfDpiGroup = document.getElementById('pdf-dpi-group');
    const pdfDpiSelect = document.getElementById('pdf-dpi-select');
    const pdfJpgQualityGroup = document.getElementById('pdf-jpg-quality-group');
    const pdfJpgQualitySlider = document.getElementById('pdf-jpg-quality-slider');
    const pdfJpgQualityVal = document.getElementById('pdf-jpg-quality-val');
    const pdfFileNaming = document.getElementById('pdf-file-naming');
    const pdfExtractSubfolder = document.getElementById('pdf-extract-subfolder');
    const pdfExtractZip = document.getElementById('pdf-extract-zip');
    const pdfExtractFolderInput = document.getElementById('pdf-extract-folder-input');
    const pdfExtractPickFolderBtn = document.getElementById('pdf-extract-pick-folder-btn');
    const pdfExtractOpenFolderBtn = document.getElementById('pdf-extract-open-folder-btn');
    const pdfExtractBtn = document.getElementById('pdf-extract-btn');
    const pdfMergeDropzone = document.getElementById('pdf-merge-dropzone');
    const pdfMergeInput = document.getElementById('pdf-merge-input');
    const pdfMergeListSection = document.getElementById('pdf-merge-list-section');
    const pdfMergeList = document.getElementById('pdf-merge-list');
    const pdfMergeCount = document.getElementById('pdf-merge-count');
    const pdfMergeClearBtn = document.getElementById('pdf-merge-clear-btn');
    const pdfMergeOutputName = document.getElementById('pdf-merge-output-name');
    const pdfMergeFolderInput = document.getElementById('pdf-merge-folder-input');
    const pdfMergePickFolderBtn = document.getElementById('pdf-merge-pick-folder-btn');
    const pdfMergeOpenFolderBtn = document.getElementById('pdf-open-folder-btn');
    const pdfMergeBtn = document.getElementById('pdf-merge-btn');
    const pdfMergedPagesSection = document.getElementById('pdf-merged-pages-section');
    const pdfMergedPagesList = document.getElementById('pdf-merged-pages-list');
    const pdfMergedClearBtn = document.getElementById('pdf-merged-clear-btn');
    const sidebarImgToPdf = document.getElementById('sidebar-img-to-pdf');
    const sidebarPdfToImg = document.getElementById('sidebar-pdf-to-img');
    const sidebarMergePdf = document.getElementById('sidebar-merge-pdf');

    // Watermark Elements
    const pdfWatermarkPanel = document.getElementById('panel-watermark-pdf');
    const pdfWatermarkDropzone = document.getElementById('pdf-watermark-dropzone');
    const pdfWatermarkInput = document.getElementById('pdf-watermark-input');
    const pdfWatermarkDetails = document.getElementById('pdf-watermark-details');
    const pdfWatermarkDetailName = document.getElementById('pdf-watermark-detail-name');
    const pdfWatermarkDetailMeta = document.getElementById('pdf-watermark-detail-meta');
    const pdfWatermarkRemoveFileBtn = document.getElementById('pdf-watermark-remove-file-btn');
    const pdfWatermarkPreviewSection = document.getElementById('pdf-watermark-preview-section');
    const watermarkPreviewCanvas = document.getElementById('watermark-preview-canvas');

    const sidebarWatermarkPdf = document.getElementById('sidebar-watermark-pdf');
    const pdfWatermarkOutputName = document.getElementById('pdf-watermark-output-name');
    const pdfWatermarkType = document.getElementById('pdf-watermark-type');
    const pdfWatermarkTextGroup = document.getElementById('pdf-watermark-text-group');
    const pdfWatermarkTextInput = document.getElementById('pdf-watermark-text-input');
    const pdfWatermarkFont = document.getElementById('pdf-watermark-font');
    const pdfWatermarkSizeVal = document.getElementById('pdf-watermark-size-val');
    const pdfWatermarkSizeSlider = document.getElementById('pdf-watermark-size-slider');
    const pdfWatermarkColor = document.getElementById('pdf-watermark-color');
    const pdfWatermarkColorHex = document.getElementById('pdf-watermark-color-hex');
    const pdfWatermarkRotationVal = document.getElementById('pdf-watermark-rotation-val');
    const pdfWatermarkRotationSlider = document.getElementById('pdf-watermark-rotation-slider');

    const pdfWatermarkImageGroup = document.getElementById('pdf-watermark-image-group');
    const pdfWatermarkLogoPath = document.getElementById('pdf-watermark-logo-path');
    const pdfWatermarkLogoBrowseBtn = document.getElementById('pdf-watermark-logo-browse-btn');
    const pdfWatermarkLogoScaleVal = document.getElementById('pdf-watermark-logo-scale-val');
    const pdfWatermarkLogoScaleSlider = document.getElementById('pdf-watermark-logo-scale-slider');

    const pdfWatermarkOpacityVal = document.getElementById('pdf-watermark-opacity-val');
    const pdfWatermarkOpacitySlider = document.getElementById('pdf-watermark-opacity-slider');
    const pdfWatermarkPlacement = document.getElementById('pdf-watermark-placement');
    const pdfWatermarkPagesSelect = document.getElementById('pdf-watermark-pages-select');
    const pdfWatermarkPagesRangeGroup = document.getElementById('pdf-watermark-pages-range-group');
    const pdfWatermarkPagesRangeInput = document.getElementById('pdf-watermark-pages-range-input');
    const pdfWatermarkFolderInput = document.getElementById('pdf-watermark-folder-input');
    const pdfWatermarkPickFolderBtn = document.getElementById('pdf-watermark-pick-folder-btn');
    const pdfWatermarkOpenFolderBtn = document.getElementById('pdf-open-folder-btn');
    const pdfWatermarkBtn = document.getElementById('pdf-watermark-btn');

    // Compression Elements
    const pdfCompressPanel = document.getElementById('panel-compress-pdf');
    const pdfCompressDropzone = document.getElementById('pdf-compress-dropzone');
    const pdfCompressInput = document.getElementById('pdf-compress-input');
    const pdfCompressListSection = document.getElementById('pdf-compress-list-section');
    const pdfCompressCount = document.getElementById('pdf-compress-count');
    const pdfCompressClearBtn = document.getElementById('pdf-compress-clear-btn');
    const pdfCompressList = document.getElementById('pdf-compress-list');

    const sidebarCompressPdf = document.getElementById('sidebar-compress-pdf');
    const pdfCompressProfile = document.getElementById('pdf-compress-profile');
    const pdfCompressProfileDesc = document.getElementById('pdf-compress-profile-desc');
    const pdfCompressFolderInput = document.getElementById('pdf-compress-folder-input');
    const pdfCompressPickFolderBtn = document.getElementById('pdf-compress-pick-folder-btn');
    const pdfCompressOpenFolderBtn = document.getElementById('pdf-open-folder-btn');
    const pdfCompressBtn = document.getElementById('pdf-compress-btn');

    // Page Organizer Elements
    const pdfOrganizePanel = document.getElementById('panel-organize-pdf');
    const pdfOrganizeDropzone = document.getElementById('pdf-organize-dropzone');
    const pdfOrganizeInput = document.getElementById('pdf-organize-input');
    const pdfOrganizeDetails = document.getElementById('pdf-organize-details');
    const pdfOrganizeDetailName = document.getElementById('pdf-organize-detail-name');
    const pdfOrganizeDetailMeta = document.getElementById('pdf-organize-detail-meta');
    const pdfOrganizeRemoveFileBtn = document.getElementById('pdf-organize-remove-file-btn');
    const pdfOrganizePagesSection = document.getElementById('pdf-organize-pages-section');
    const pdfOrganizePageCount = document.getElementById('pdf-organize-page-count');
    const pdfOrganizeSelectAll = document.getElementById('pdf-organize-select-all');
    const pdfOrganizeRotateAll = document.getElementById('pdf-organize-rotate-all');
    const pdfOrganizePagesList = document.getElementById('pdf-organize-pages-list');

    const sidebarOrganizePdf = document.getElementById('sidebar-organize-pdf');
    const pdfOrganizeOutputName = document.getElementById('pdf-organize-output-name');
    const pdfOrganizeFolderInput = document.getElementById('pdf-organize-folder-input');
    const pdfOrganizePickFolderBtn = document.getElementById('pdf-organize-pick-folder-btn');
    const pdfOrganizeOpenFolderBtn = document.getElementById('pdf-open-folder-btn');
    const pdfOrganizeBtn = document.getElementById('pdf-organize-btn');

    // Shared config ref from state
    const appSettings = state.appSettings;


    function getImageDimensions(file) {
        return new Promise((resolve) => {
            const src = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                const dimensions = { width: image.naturalWidth || 0, height: image.naturalHeight || 0 };
                URL.revokeObjectURL(src);
                resolve(dimensions);
            };
            image.onerror = () => {
                URL.revokeObjectURL(src);
                resolve({ width: 0, height: 0 });
            };
            image.src = src;
        });
    }

    function normalizePdfSelectedFiles(files, allowedExtensions) {
        const allowed = new Set(allowedExtensions);
        return Array.from(files || []).map((file) => ({
            raw: file,
            name: file.name,
            path: file.path || (window.app?.getPathForFile ? window.app.getPathForFile(file) : ''),
            size: file.size || 0,
            type: file.type || ''
        })).filter((file) => {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            return (file.path || file.raw) && allowed.has(ext);
        });
    }

    function getPdfOutputFolder() {
        return pdfOutputFolderInput?.value || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
    }

    function getPdfExtractFolder() {
        return pdfExtractFolderInput?.value || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
    }

    function getPdfMergeFolder() {
        return pdfMergeFolderInput?.value || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
    }

    function updatePdfButtons() {
        if (pdfCompileBtn) {
            pdfCompileBtn.disabled = false;
        }
        if (pdfExtractBtn) {
            pdfExtractBtn.disabled = !selectedPdfFile;
        }
        if (pdfMergeBtn) {
            pdfMergeBtn.disabled = pdfMergeFiles.length < 2;
        }
    }

    function getImageDimensionsFromPath(filePath) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                const dimensions = { width: image.naturalWidth || 0, height: image.naturalHeight || 0 };
                resolve(dimensions);
            };
            image.onerror = () => {
                resolve({ width: 0, height: 0 });
            };
            image.src = `converthub-media://local-file/?path=${encodeURIComponent(filePath)}`;
        });
    }

    function parsePageRangeFilter(paths, rangeStr) {
        const indices = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [startStr, endStr] = trimmed.split('-');
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end)) {
                    const min = Math.min(start, end);
                    const max = Math.max(start, end);
                    for (let i = min; i <= max; i++) {
                        if (i >= 1 && i <= paths.length) {
                            indices.add(i - 1);
                        }
                    }
                }
            } else {
                const index = parseInt(trimmed, 10);
                if (!isNaN(index) && index >= 1 && index <= paths.length) {
                    indices.add(index - 1);
                }
            }
        }
        return Array.from(indices).sort((a, b) => a - b).map(idx => paths[idx]);
    }

    function parsePdfPageSelection(rangeType, rangeInput, totalPages) {
        if (rangeType !== 'CUSTOM') {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = new Set();
        const parts = String(rangeInput || '').split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) {
                continue;
            }

            if (trimmed.includes('-')) {
                const [startStr, endStr] = trimmed.split('-');
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);

                if (Number.isInteger(start) && Number.isInteger(end)) {
                    const min = Math.max(1, Math.min(start, end));
                    const max = Math.min(totalPages, Math.max(start, end));
                    for (let page = min; page <= max; page++) {
                        pages.add(page);
                    }
                }
                continue;
            }

            const page = parseInt(trimmed, 10);
            if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
                pages.add(page);
            }
        }

        return Array.from(pages).sort((a, b) => a - b);
    }

    function getPdfStem(fileName) {
        return String(fileName || 'document').replace(/\.pdf$/i, '') || 'document';
    }

    function sanitizeFileStem(value) {
        return String(value || 'document')
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/^_+|_+$/g, '') || 'document';
    }

    function joinOutputPath(directory, childName) {
        const separator = String(directory || '').includes('/') && !String(directory || '').includes('\\') ? '/' : '\\';
        return `${String(directory || '').replace(/[\\/]+$/, '')}${separator}${String(childName || '').replace(/^[\\/]+/, '')}`;
    }

    function getExtractedPageFileName(pattern, stem, pageNumber, totalPages, format) {
        const safeStem = sanitizeFileStem(stem);
        const pageToken = String(pageNumber).padStart(Math.max(3, String(totalPages).length), '0');

        switch (pattern) {
            case 'stem-number':
                return `${safeStem}-${pageToken}.${format}`;
            case 'page_number_stem':
                return `page_${pageToken}_${safeStem}.${format}`;
            case 'stem_page_number':
            default:
                return `${safeStem}_page_${pageToken}.${format}`;
        }
    }

    function getPdfRenderScale(mode, width, dpi, viewport) {
        if (mode === 'DPI') {
            return Math.max(0.1, (parseInt(dpi, 10) || 150) / 72);
        }
        return Math.max(0.1, (parseInt(width, 10) || 1200) / viewport.width);
    }

    async function getPdfDocumentBytes(file) {
        if (file?.raw?.arrayBuffer) {
            return new Uint8Array(await file.raw.arrayBuffer());
        }

        if (file?.path) {
            const sourceUrl = `converthub-media://local-file/?path=${encodeURIComponent(file.path)}`;
            const response = await fetch(sourceUrl);
            if (!response.ok) {
                throw new Error(`Unable to read PDF file (${response.status}).`);
            }
            return new Uint8Array(await response.arrayBuffer());
        }

        throw new Error('Unable to read the selected PDF.');
    }

    function renderPdfImageList() {
        if (!pdfImageGridSection || !pdfThumbnailsGrid || !pdfImgCount) {
            return;
        }

        pdfImgCount.textContent = String(pdfImages.length);
        pdfImageGridSection.classList.toggle('hidden', pdfImages.length === 0);
        pdfThumbnailsGrid.innerHTML = '';

        pdfImages.forEach((item, index) => {
            const card = document.createElement('div');
            const safeName = escapeHtml(item.name);
            const safePreviewUrl = escapeHtml(item.previewUrl);
            card.className = 'pdf-thumb-card no-drag';
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="thumb-preview-wrap"><img src="${safePreviewUrl}" alt="${safeName} preview"></div>
                <div class="thumb-copy">
                    <div class="thumb-title" title="${safeName}">${safeName}</div>
                    <div class="thumb-meta">${formatBytes(item.size)} &bull; ${item.width || '?'} x ${item.height || '?'}</div>
                </div>
                <button class="thumb-act-btn drag-btn" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>
                <button class="thumb-act-btn remove-btn" title="Remove image"><i class="fa-solid fa-xmark"></i></button>
            `;

            card.addEventListener('dragstart', () => {
                pdfImageDragId = item.id;
                card.classList.add('queue-item-dragging');
            });
            card.addEventListener('dragover', (event) => {
                event.preventDefault();
                if (pdfImageDragId && pdfImageDragId !== item.id) {
                    card.classList.add('queue-item-drag-over');
                }
            });
            card.addEventListener('dragleave', () => card.classList.remove('queue-item-drag-over'));
            card.addEventListener('drop', (event) => {
                event.preventDefault();
                card.classList.remove('queue-item-drag-over');
                if (!pdfImageDragId || pdfImageDragId === item.id) {
                    return;
                }
                const fromIndex = pdfImages.findIndex((entry) => entry.id === pdfImageDragId);
                const toIndex = index;
                if (fromIndex < 0 || toIndex < 0) {
                    return;
                }
                const [moved] = pdfImages.splice(fromIndex, 1);
                pdfImages.splice(toIndex, 0, moved);
                renderPdfImageList();
            });
            card.addEventListener('dragend', () => {
                pdfImageDragId = null;
                renderPdfImageList();
            });
            card.querySelector('.remove-btn')?.addEventListener('click', () => {
                if (item.previewUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.previewUrl);
                }
                pdfImages = pdfImages.filter((entry) => entry.id !== item.id);
                renderPdfImageList();
                updatePdfButtons();
            });
            pdfThumbnailsGrid.appendChild(card);
        });

        updatePdfButtons();
    }

    async function addPdfImages(files) {
        const allowedExtensions = new Set(['png', 'jpg', 'jpeg', 'webp']);
        const filesArray = Array.from(files || []);
        
        let filesToAdd = [];
        
        for (const file of filesArray) {
            const filePath = file.path || (window.app?.getPathForFile ? window.app.getPathForFile(file) : '');
            if (!filePath) continue;
            
            // Check if it's a directory by running the directory scanner helper
            let isDir = false;
            if (window.app?.readFolderImages) {
                try {
                    const scanRes = await window.app.readFolderImages(filePath);
                    if (scanRes && scanRes.success && scanRes.files && scanRes.files.length > 0) {
                        filesToAdd = filesToAdd.concat(scanRes.files);
                        isDir = true;
                    }
                } catch (err) {
                    console.error('[renderer] Folder scanning failed:', err);
                }
            }
            
            if (!isDir) {
                const ext = file.name.split('.').pop()?.toLowerCase() || '';
                if (allowedExtensions.has(ext)) {
                    filesToAdd.push({
                        raw: file,
                        name: file.name,
                        path: filePath,
                        size: file.size || 0
                    });
                }
            }
        }
        
        if (filesToAdd.length === 0) {
            showToast('Select image files or folders containing PNG, JPG, JPEG, or WEBP formats.', 'warning');
            return;
        }

        const prepared = await Promise.all(filesToAdd.map(async (file) => {
            let dimensions = { width: 0, height: 0 };
            let previewUrl = '';
            
            if (file.raw) {
                dimensions = await getImageDimensions(file.raw);
                previewUrl = URL.createObjectURL(file.raw);
            } else {
                previewUrl = `converthub-media://local-file/?path=${encodeURIComponent(file.path)}`;
                dimensions = await getImageDimensionsFromPath(file.path);
            }
            
            return {
                id: `pdf-img-${pdfImageIdCounter++}`,
                name: file.name,
                path: file.path,
                size: file.size,
                width: dimensions.width,
                height: dimensions.height,
                previewUrl
            };
        }));

        pdfImages = [...pdfImages, ...prepared];
        renderPdfImageList();
        showToast(`${prepared.length} image${prepared.length > 1 ? 's' : ''} added`, 'info');
    }

    function clearPdfImages() {
        pdfImages.forEach((item) => {
            if (item.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(item.previewUrl);
            }
        });
        pdfImages = [];
        if (pdfImgInput) {
            pdfImgInput.value = '';
        }
        renderPdfImageList();
        updatePdfButtons();
    }

    function renderPdfMergeList() {
        if (!pdfMergeListSection || !pdfMergeList || !pdfMergeCount) {
            return;
        }

        pdfMergeCount.textContent = String(pdfMergeFiles.length);
        pdfMergeListSection.classList.toggle('hidden', pdfMergeFiles.length === 0);
        pdfMergeList.innerHTML = '';

        pdfMergeFiles.forEach((item, index) => {
            const card = document.createElement('div');
            const safeName = escapeHtml(item.name);
            card.className = 'pdf-thumb-card no-drag';
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="file-type-icon document"><i class="fa-regular fa-file-pdf"></i></div>
                <div class="thumb-copy">
                    <div class="thumb-title" title="${safeName}">${safeName}</div>
                    <div class="thumb-meta">${formatBytes(item.size)} &bull; Position ${index + 1}</div>
                </div>
                <div class="merge-range">
                    <input type="text" class="glass-input pdf-merge-range-input" placeholder="Pages (e.g. 1-3,5)" value="${escapeHtml(item.range || '')}" title="Specify page range for this file. Leave empty to include all pages.">
                </div>
                <button class="thumb-act-btn drag-btn" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>
                <button class="thumb-act-btn preview-btn" title="Preview pages"><i class="fa-regular fa-grip"></i></button>
                <button class="thumb-act-btn remove-btn" title="Remove PDF"><i class="fa-solid fa-xmark"></i></button>
            `;

            card.addEventListener('dragstart', () => {
                pdfMergeDragId = item.id;
                card.classList.add('queue-item-dragging');
            });
            card.addEventListener('dragover', (event) => {
                event.preventDefault();
                if (pdfMergeDragId && pdfMergeDragId !== item.id) {
                    card.classList.add('queue-item-drag-over');
                }
            });
            card.addEventListener('dragleave', () => card.classList.remove('queue-item-drag-over'));
            card.addEventListener('drop', (event) => {
                event.preventDefault();
                card.classList.remove('queue-item-drag-over');
                if (!pdfMergeDragId || pdfMergeDragId === item.id) {
                    return;
                }
                const fromIndex = pdfMergeFiles.findIndex((entry) => entry.id === pdfMergeDragId);
                const toIndex = index;
                if (fromIndex < 0 || toIndex < 0) {
                    return;
                }
                const [moved] = pdfMergeFiles.splice(fromIndex, 1);
                pdfMergeFiles.splice(toIndex, 0, moved);
                renderPdfMergeList();
            });
            card.addEventListener('dragend', () => {
                pdfMergeDragId = null;
                card.classList.remove('queue-item-dragging', 'queue-item-drag-over');
            });
            card.querySelector('.remove-btn')?.addEventListener('click', () => {
                pdfMergeFiles = pdfMergeFiles.filter((entry) => entry.id !== item.id);
                renderPdfMergeList();
                updatePdfButtons();
            });

            const rangeInputEl = card.querySelector('.pdf-merge-range-input');
            if (rangeInputEl) {
                rangeInputEl.addEventListener('input', (ev) => {
                    const val = String(ev.target.value || '').trim();
                    const idx = pdfMergeFiles.findIndex((e) => e.id === item.id);
                    if (idx >= 0) {
                        pdfMergeFiles[idx].range = val;
                    }
                });
            }

            pdfMergeList.appendChild(card);
        });

        // Attach preview button handlers for loading page thumbnails
        Array.from(pdfMergeList.querySelectorAll('.thumb-act-btn.preview-btn')).forEach((btn) => {
            btn.addEventListener('click', async (ev) => {
                const parent = btn.closest('.pdf-thumb-card');
                const id = parent?.dataset?.id;
                const entry = pdfMergeFiles.find(e => e.id === id);
                if (!entry) return;
                await loadPdfThumbnailsFor(entry);
            });
        });

        // Update merged pages section visibility
        pdfMergedPagesSection?.classList.toggle('hidden', pdfMergedPages.length === 0);
        renderMergedPagesList();

        updatePdfButtons();
    }

    function clearPdfMergeFiles() {
        pdfMergeFiles = [];
        if (pdfMergeInput) {
            pdfMergeInput.value = '';
        }
        renderPdfMergeList();
        updatePdfButtons();
    }

    async function loadPdfThumbnailsFor(entry) {
        if (!entry || !entry.path) return;
        try {
            const pdfJs = window.pdfjsLib;
            if (!pdfJs?.getDocument) {
                throw new Error('PDF renderer is not available. Restart the app and try again.');
            }
            const pdfBytes = await getPdfDocumentBytes(entry);
            const loadingTask = pdfJs.getDocument({
                data: pdfBytes,
                disableFontFace: false,
                useSystemFonts: true
            });
            const pdf = await loadingTask.promise;
            const total = pdf.numPages;
            const bank = document.createElement('div');
            bank.className = 'pdf-thumb-bank';

            for (let i = 1; i <= total; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(viewport.width);
                canvas.height = Math.round(viewport.height);
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                const thumb = canvas.toDataURL('image/png');

                // Yield to event loop to keep UI smooth and responsive
                if (i % 2 === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 0));
                }

                const thumbWrap = document.createElement('div');
                thumbWrap.className = 'pdf-bank-thumb';
                thumbWrap.draggable = true;
                const img = document.createElement('img');
                img.src = thumb;
                thumbWrap.appendChild(img);

                // Drag to merged pages
                thumbWrap.addEventListener('dragstart', () => {
                    pdfBankDrag = { path: entry.path, pageIndex: i - 1, name: entry.name, thumb };
                });
                thumbWrap.addEventListener('dragend', () => {
                    pdfBankDrag = null;
                });

                bank.appendChild(thumbWrap);
            }

            // Show bank below the selected card (simple placement) — insert after the card element
            const cardEl = pdfMergeList.querySelector(`[data-id="${entry.id}"]`);
            if (cardEl) {
                // remove any existing bank sibling
                const existing = cardEl.nextElementSibling;
                if (existing && existing.classList && existing.classList.contains('pdf-thumb-bank')) existing.remove();
                cardEl.parentNode.insertBefore(bank, cardEl.nextSibling);
            }
        } catch (err) {
            console.error('Failed to load PDF thumbnails:', err);
            showToast('Failed to generate page previews for this PDF.', 'error');
        }
    }

    // Merged pages data structure and rendering
    const pdfMergedPages = [];

    function renderMergedPagesList() {
        if (!pdfMergedPagesList) return;
        pdfMergedPagesList.innerHTML = '';
        pdfMergedPages.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'pdf-page-card no-drag';
            card.draggable = true;
            card.dataset.id = p.id;
            card.innerHTML = `
                <img src="${escapeHtml(p.thumb || '')}" alt="page-${p.pageIndex+1}">
                <div class="page-label">${escapeHtml(p.name)} • ${p.pageIndex + 1}</div>
            `;

            card.addEventListener('dragstart', () => {
                pdfPageDragId = p.id;
                card.classList.add('queue-item-dragging');
            });
            card.addEventListener('dragover', (ev) => {
                ev.preventDefault();
                if (pdfPageDragId && pdfPageDragId !== p.id) {
                    card.classList.add('queue-item-drag-over');
                }
            });
            card.addEventListener('dragleave', () => {
                card.classList.remove('queue-item-drag-over');
            });
            card.addEventListener('drop', (ev) => {
                ev.preventDefault();
                card.classList.remove('queue-item-drag-over');
                if (pdfPageDragId && pdfPageDragId !== p.id) {
                    const srcIdx = pdfMergedPages.findIndex((x) => x.id === pdfPageDragId);
                    const targetIdx = pdfMergedPages.findIndex((x) => x.id === p.id);
                    if (srcIdx > -1 && targetIdx > -1) {
                        const [moved] = pdfMergedPages.splice(srcIdx, 1);
                        pdfMergedPages.splice(targetIdx, 0, moved);
                        renderMergedPagesList();
                    }
                }
            });
            card.addEventListener('dragend', () => {
                pdfPageDragId = null;
                card.classList.remove('queue-item-dragging');
            });

            card.querySelector('img')?.addEventListener('dblclick', () => {
                // open full-size in new window
                const win = window.open('', '_blank');
                if (win) win.document.body.innerHTML = `<img src="${p.thumb || ''}" style="max-width:100%">`;
            });

            pdfMergedPagesList.appendChild(card);
        });
    }

    // Drag target for merged pages
    if (pdfMergedPagesList) {
        pdfMergedPagesList.addEventListener('dragover', (ev) => {
            ev.preventDefault();
        });
        pdfMergedPagesList.addEventListener('drop', (ev) => {
            ev.preventDefault();
            if (pdfBankDrag) {
                const id = `merged-page-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
                pdfMergedPages.push({ id, path: pdfBankDrag.path, pageIndex: pdfBankDrag.pageIndex, name: pdfBankDrag.name, thumb: pdfBankDrag.thumb });
                renderMergedPagesList();
                pdfMergedPagesSection?.classList.remove('hidden');
            }
        });
    }

    // Allow reordering inside merged pages via drop
    pdfMergedPagesList?.addEventListener('drop', (ev) => {
        ev.preventDefault();
        // handled by dragend on cards for now
    });

    // Clear merged pages
    function clearMergedPages() {
        pdfMergedPages.length = 0;
        renderMergedPagesList();
        pdfMergedPagesSection?.classList.add('hidden');
    }

    pdfMergedClearBtn?.addEventListener('click', (ev) => {
        ev.preventDefault();
        clearMergedPages();
    });

    function setPdfMode(mode) {
        const isExtractMode = mode === 'pdf-to-img';
        const isMergeMode = mode === 'merge-pdf';
        const isImageMode = mode === 'img-to-pdf';
        const isWatermarkMode = mode === 'watermark-pdf';
        const isCompressMode = mode === 'compress-pdf';
        const isOrganizeMode = mode === 'organize-pdf';

        pdfTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));

        pdfImgPanel?.classList.toggle('hidden', !isImageMode);
        pdfExtractPanel?.classList.toggle('hidden', !isExtractMode);
        pdfMergePanel?.classList.toggle('hidden', !isMergeMode);
        pdfWatermarkPanel?.classList.toggle('hidden', !isWatermarkMode);
        pdfCompressPanel?.classList.toggle('hidden', !isCompressMode);
        pdfOrganizePanel?.classList.toggle('hidden', !isOrganizeMode);

        sidebarImgToPdf?.classList.toggle('hidden', !isImageMode);
        sidebarPdfToImg?.classList.toggle('hidden', !isExtractMode);
        sidebarMergePdf?.classList.toggle('hidden', !isMergeMode);
        sidebarWatermarkPdf?.classList.toggle('hidden', !isWatermarkMode);
        sidebarCompressPdf?.classList.toggle('hidden', !isCompressMode);
        sidebarOrganizePdf?.classList.toggle('hidden', !isOrganizeMode);
    }

    async function compilePdfImages() {
        if (pdfImages.length === 0) {
            showToast('Add images before compiling a PDF.', 'error', 6000);
            return;
        }
        const outputFolder = getPdfOutputFolder();
        if (!outputFolder) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        const pageRangeInput = document.getElementById('pdf-page-range-input')?.value || '';
        const qualityVal = parseInt(document.getElementById('pdf-quality-slider')?.value || '100', 10);
        const imageLayout = document.getElementById('pdf-image-layout')?.value || 'CENTER';
        const addPageNumbers = document.getElementById('pdf-page-numbers')?.checked || false;
        const metaTitle = document.getElementById('pdf-meta-title')?.value || '';
        const metaAuthor = document.getElementById('pdf-meta-author')?.value || '';
        const pdfPassword = document.getElementById('pdf-password')?.value || '';


        let selectedPaths = pdfImages.map((item) => item.path);
        if (pageRangeInput.trim()) {
            selectedPaths = parsePageRangeFilter(selectedPaths, pageRangeInput.trim());
        }

        if (selectedPaths.length === 0) {
            showToast('Page range resulted in 0 pages to compile.', 'warning');
            return;
        }

        pdfCompileBtn.disabled = true;
        const originalLabel = pdfCompileBtn.innerHTML;
        pdfCompileBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling PDF';

        setBatchStatus({ title: 'Compiling PDF', meta: `0/${selectedPaths.length} images`, percent: 0 });

        let progressHandler = null;
        let progressCleanup = null;

        try {
            if (window.app?.onProgress) {
                progressHandler = (data) => {
                    if (data && typeof data.percent === 'number') {
                        setBatchStatus({
                            title: 'Compiling PDF',
                            meta: data.message || `${Math.round(data.percent)}% complete`,
                            percent: data.percent
                        });
                    }
                };
                progressCleanup = window.app.onProgress(progressHandler);
            }

            const result = await window.app?.createPDF?.({
                imagePaths: selectedPaths,
                outputFolder,
                pdfName: pdfOutputName?.value || 'Compiled_Images',
                pageSize: pdfPageSize?.value || 'A4',
                orientation: pdfPageOrientation?.value || 'PORTRAIT',
                marginType: pdfPageMargin?.value || 'NONE',
                quality: qualityVal,
                layout: imageLayout,
                pageNumbers: addPageNumbers,
                title: metaTitle,
                author: metaAuthor,
                password: pdfPassword
            });


            if (result?.success) {
                showToast(`PDF created: ${result.fileName || 'Compiled_Images.pdf'}`, 'success');
                refreshRecentFiles();
                clearPdfImages();
                setBatchStatus({ title: 'Compiling PDF', meta: `Complete`, percent: 100 });
            } else {
                showToast(result?.error || 'Failed to create PDF.', 'error', 6000);
            }
        } catch (error) {
            showToast(error?.message || 'Failed to create PDF.', 'error', 6000);
        } finally {
            if (progressCleanup) progressCleanup();
            else if (window.app?.removeProgressListeners) window.app.removeProgressListeners();
            pdfCompileBtn.innerHTML = originalLabel;
            updatePdfButtons();
            setTimeout(() => setBatchStatus(null), 1500);
        }
    }

    async function loadPdfToImgPages() {
        if (!selectedPdfFile) return;
        const previewSection = document.getElementById('pdf-to-img-preview-grid-section');
        const grid = document.getElementById('pdf-to-img-preview-grid');
        const totalPagesEl = document.getElementById('pdf-to-img-total-pages');
        const selectedCountEl = document.getElementById('pdf-to-img-selected-count');
        
        if (!previewSection || !grid) return;
        
        previewSection.classList.remove('hidden');
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 15px; color: var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: #f43f5e;"></i>
                <span>Generating page thumbnails...</span>
            </div>
        `;
        
        try {
            const pdfJs = window.pdfjsLib;
            const pdfBytes = await getPdfDocumentBytes(selectedPdfFile);
            const loadingTask = pdfJs.getDocument({
                data: pdfBytes,
                disableFontFace: false,
                useSystemFonts: true
            });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;
            
            if (totalPagesEl) totalPagesEl.textContent = totalPages;
            if (selectedCountEl) selectedCountEl.textContent = totalPages;
            
            if (pdfExtractRangeInput) {
                pdfExtractRangeInput.value = `1-${totalPages}`;
            }
            
            grid.innerHTML = '';
            const selectedPages = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
            
            const updateRangeInputFromGrid = () => {
                if (selectedPages.size === totalPages) {
                    pdfExtractRangeInput.value = `1-${totalPages}`;
                } else if (selectedPages.size === 0) {
                    pdfExtractRangeInput.value = '';
                } else {
                    const sortedArr = Array.from(selectedPages).sort((a, b) => a - b);
                    const ranges = [];
                    let rangeStart = null;
                    let rangeEnd = null;
                    
                    for (let i = 0; i < sortedArr.length; i++) {
                        const cur = sortedArr[i];
                        if (rangeStart === null) {
                            rangeStart = cur;
                            rangeEnd = cur;
                        } else if (cur === rangeEnd + 1) {
                            rangeEnd = cur;
                        } else {
                            if (rangeStart === rangeEnd) {
                                ranges.push(`${rangeStart}`);
                            } else {
                                ranges.push(`${rangeStart}-${rangeEnd}`);
                            }
                            rangeStart = cur;
                            rangeEnd = cur;
                        }
                    }
                    if (rangeStart !== null) {
                        if (rangeStart === rangeEnd) {
                            ranges.push(`${rangeStart}`);
                        } else {
                            ranges.push(`${rangeStart}-${rangeEnd}`);
                        }
                    }
                    pdfExtractRangeInput.value = ranges.join(', ');
                }
                if (selectedCountEl) selectedCountEl.textContent = selectedPages.size;
            };

            const syncCheckboxesFromTextInput = () => {
                const rangeStr = pdfExtractRangeInput.value;
                const activePages = parsePdfPageSelection('CUSTOM', rangeStr, totalPages);
                selectedPages.clear();
                
                activePages.forEach(pageNum => {
                    selectedPages.add(pageNum);
                });
                
                grid.querySelectorAll('.pdf-to-img-card').forEach((card) => {
                    const pageNum = parseInt(card.dataset.pageNum, 10);
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = selectedPages.has(pageNum);
                        card.classList.toggle('selected', selectedPages.has(pageNum));
                    }
                });
                if (selectedCountEl) selectedCountEl.textContent = selectedPages.size;
            };

            pdfExtractRangeInput.removeEventListener('input', syncCheckboxesFromTextInput);
            pdfExtractRangeInput.addEventListener('input', syncCheckboxesFromTextInput);

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1 });
                const scale = 110 / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = Math.round(scaledViewport.width);
                canvas.height = Math.round(scaledViewport.height);

                await page.render({
                    canvasContext: context,
                    viewport: scaledViewport
                }).promise;

                const card = document.createElement('div');
                card.className = 'pdf-organize-card pdf-to-img-card selected';
                card.dataset.pageNum = pageNum;
                card.style.cursor = 'pointer';
                card.style.position = 'relative';

                const thumbWrap = document.createElement('div');
                thumbWrap.className = 'pdf-organize-thumb-wrap';
                thumbWrap.appendChild(canvas);
                
                const checkboxWrap = document.createElement('div');
                checkboxWrap.style.position = 'absolute';
                checkboxWrap.style.top = '8px';
                checkboxWrap.style.left = '8px';
                checkboxWrap.style.zIndex = '10';
                checkboxWrap.innerHTML = `<input type="checkbox" checked style="width: 18px; height: 18px; cursor: pointer; accent-color: #f43f5e;">`;
                
                const checkbox = checkboxWrap.querySelector('input');

                const metaRow = document.createElement('div');
                metaRow.className = 'pdf-organize-meta';
                metaRow.innerHTML = `<span>Page ${pageNum}</span>`;

                card.appendChild(checkboxWrap);
                card.appendChild(thumbWrap);
                card.appendChild(metaRow);
                
                const togglePage = (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                    }
                    card.classList.toggle('selected', checkbox.checked);
                    if (checkbox.checked) {
                        selectedPages.add(pageNum);
                    } else {
                        selectedPages.delete(pageNum);
                    }
                    if (pdfExtractRangeType && pdfExtractRangeType.value !== 'CUSTOM') {
                        pdfExtractRangeType.value = 'CUSTOM';
                        pdfExtractRangeGroup?.classList.remove('hidden');
                    }
                    updateRangeInputFromGrid();
                };
                
                card.addEventListener('click', togglePage);
                grid.appendChild(card);
                page.cleanup?.();
            }

            const selectAllBtn = document.getElementById('pdf-to-img-select-all');
            if (selectAllBtn) {
                selectAllBtn.onclick = () => {
                    for (let i = 1; i <= totalPages; i++) selectedPages.add(i);
                    grid.querySelectorAll('.pdf-to-img-card').forEach(c => {
                        c.classList.add('selected');
                        c.querySelector('input').checked = true;
                    });
                    updateRangeInputFromGrid();
                };
            }

            const deselectAllBtn = document.getElementById('pdf-to-img-deselect-all');
            if (deselectAllBtn) {
                deselectAllBtn.onclick = () => {
                    selectedPages.clear();
                    grid.querySelectorAll('.pdf-to-img-card').forEach(c => {
                        c.classList.remove('selected');
                        c.querySelector('input').checked = false;
                    });
                    updateRangeInputFromGrid();
                };
            }

            if (pdf.destroy) await pdf.destroy().catch(() => undefined);
            
            if (pdfDetailMeta) {
                const mb = (selectedPdfFile.size / (1024 * 1024)).toFixed(2);
                pdfDetailMeta.innerHTML = `${mb} MB &bull; ${totalPages} pages`;
            }
        } catch (err) {
            console.error('Failed to load PDF to images grid:', err);
            grid.innerHTML = `<span style="grid-column: 1/-1; color: #ef4444; text-align:center;">Failed to render page previews: ${err.message}</span>`;
        }
    }

    async function setPdfExtractFile(files) {
        const [file] = normalizePdfSelectedFiles(files, ['pdf']);
        if (!file) {
            showToast('Select a valid PDF file.', 'warning');
            return;
        }

        selectedPdfFile = file;
        if (pdfDetailName) pdfDetailName.textContent = file.name;
        if (pdfDetailMeta) pdfDetailMeta.textContent = `${formatBytes(file.size)} &bull; Loading...`;
        pdfFileDropzone?.classList.add('hidden');
        pdfFileDetails?.classList.remove('hidden');
        updatePdfButtons();
        
        await loadPdfToImgPages();
    }

    function clearPdfExtractFile() {
        selectedPdfFile = null;
        if (pdfFileInput) {
            pdfFileInput.value = '';
        }
        pdfFileDetails?.classList.add('hidden');
        pdfFileDropzone?.classList.remove('hidden');
        document.getElementById('pdf-to-img-preview-grid-section')?.classList.add('hidden');
        const grid = document.getElementById('pdf-to-img-preview-grid');
        if (grid) grid.innerHTML = '';
        updatePdfButtons();
    }

    function addPdfMergeFiles(files) {
        const selectedFiles = normalizePdfSelectedFiles(files, ['pdf']);
        if (selectedFiles.length === 0) {
            showToast('Select valid PDF files to merge.', 'warning');
            return;
        }

        const existingPaths = new Set(pdfMergeFiles.map((file) => String(file.path || '').toLowerCase()).filter(Boolean));
        const uniqueFiles = selectedFiles.filter((file) => {
            if (!file.path) {
                return false;
            }
            const normalizedPath = file.path.toLowerCase();
            if (existingPaths.has(normalizedPath)) {
                return false;
            }
            existingPaths.add(normalizedPath);
            return true;
        });

        if (uniqueFiles.length === 0) {
            showToast('Those PDFs are already in the merge list.', 'info');
            return;
        }

        const prepared = uniqueFiles.map((file) => ({
            id: `pdf-merge-${pdfMergeIdCounter++}`,
            raw: file.raw,
            name: file.name,
            path: file.path,
            size: file.size
            ,
            range: ''
        }));

        pdfMergeFiles = [...pdfMergeFiles, ...prepared];
        renderPdfMergeList();
        showToast(`${prepared.length} PDF${prepared.length > 1 ? 's' : ''} added`, 'info');
    }

    async function mergePdfFiles() {
        if (pdfMergeFiles.length < 2) {
            showToast('Add at least two PDFs before merging.', 'warning');
            return;
        }

        const outputFolder = getPdfMergeFolder();
        if (!outputFolder) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        pdfMergeBtn.disabled = true;
        const originalLabel = pdfMergeBtn.innerHTML;
        pdfMergeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Merging PDFs';

        try {
            // If user assembled page-level list, send explicit pageList; otherwise send per-file ranges
            const payload = {
                outputFolder,
                pdfName: pdfMergeOutputName?.value || 'Merged_PDF'
            };
            if (pdfMergedPages.length > 0) {
                payload.pageList = pdfMergedPages.map(p => ({ path: p.path, pageIndex: p.pageIndex }));
            } else {
                payload.pdfPaths = pdfMergeFiles.map((file) => ({ path: file.path, range: file.range }));
            }

            const result = await window.app?.mergePDFs?.(payload);

            if (result?.success) {
                showToast(`Merged ${result.pageCount || ''} pages into ${result.fileName || 'Merged_PDF.pdf'}`, 'success');
                refreshRecentFiles();
                if (appSettings.openFolderOnComplete && result.outputPath) {
                    await window.app?.openFolder?.(getFolderFromPath(result.outputPath));
                }
                clearPdfMergeFiles();
            } else {
                showToast(result?.error || 'Failed to merge PDFs.', 'error', 6000);
            }
        } catch (error) {
            showToast(error?.message || 'Failed to merge PDFs.', 'error', 6000);
        } finally {
            pdfMergeBtn.innerHTML = originalLabel;
            updatePdfButtons();
        }
    }

    async function extractPdfImages() {
        if (!selectedPdfFile) {
            showToast('Add a PDF before extracting images.', 'warning');
            return;
        }

        const format = pdfExtractFormat?.value || 'png';
        const rangeType = pdfExtractRangeType?.value || 'ALL';
        const rangeInput = pdfExtractRangeInput?.value || '';
        const resolutionMode = pdfResolutionMode?.value || 'WIDTH';
        const width = parseInt(pdfWidthSlider?.value || '1200', 10);
        const dpi = parseInt(pdfDpiSelect?.value || '150', 10);
        const jpgQuality = Math.min(100, Math.max(40, parseInt(pdfJpgQualitySlider?.value || '92', 10))) / 100;
        const shouldCreateZip = Boolean(pdfExtractZip?.checked);
        const pdfStem = getPdfStem(selectedPdfFile.name);
        const safePdfStem = sanitizeFileStem(pdfStem);
        const outputFolderRoot = getPdfExtractFolder();

        if (!outputFolderRoot) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        pdfExtractBtn.disabled = true;
        const originalLabel = pdfExtractBtn.innerHTML;
        pdfExtractBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting...';

        let loadingTask = null;
        let pdf = null;
        try {
            const pdfJs = window.pdfjsLib;
            if (!pdfJs?.getDocument) {
                throw new Error('PDF renderer is not available. Restart the app and try again.');
            }

            const pdfBytes = await getPdfDocumentBytes(selectedPdfFile);
            loadingTask = pdfJs.getDocument({
                data: pdfBytes,
                disableFontFace: false,
                useSystemFonts: true
            });
            pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const pagesToExtract = parsePdfPageSelection(rangeType, rangeInput, totalPages);

            if (pagesToExtract.length === 0) {
                showToast('No valid pages to extract.', 'warning');
                return;
            }

            const shouldCreateSubfolder = pdfExtractSubfolder?.checked !== false && pagesToExtract.length > 1;
            const outputFolder = shouldCreateSubfolder
                ? joinOutputPath(outputFolderRoot, safePdfStem)
                : outputFolderRoot;
            let successCount = 0;
            const savedImagePaths = [];
            const imageMimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const exportQuality = format === 'jpg' ? jpgQuality : undefined;

            for (let index = 0; index < pagesToExtract.length; index++) {
                const pageNum = pagesToExtract[index];
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1 });
                const scale = getPdfRenderScale(resolutionMode, width, dpi, viewport);
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const outputWidth = Math.max(1, Math.round(scaledViewport.width));
                const outputHeight = Math.max(1, Math.round(scaledViewport.height));
                canvas.width = outputWidth;
                canvas.height = outputHeight;

                if (format === 'jpg') {
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, outputWidth, outputHeight);
                }

                await page.render({
                    canvasContext: context,
                    viewport: scaledViewport,
                    background: format === 'jpg' ? 'white' : undefined
                }).promise;

                const base64Data = canvas.toDataURL(imageMimeType, exportQuality);
                const dataUrlParts = base64Data.split(',');
                const base64String = dataUrlParts.length > 1 ? dataUrlParts[1] : base64Data;

                const fileName = getExtractedPageFileName(
                    pdfFileNaming?.value || 'stem_page_number',
                    pdfStem,
                    pageNum,
                    totalPages,
                    format
                );
                
                const result = await window.app.saveExtractedPage({
                    base64Data: base64String,
                    outputFolder,
                    fileName
                });

                if (result?.success) {
                    successCount++;
                    if (result.outputPath) {
                        savedImagePaths.push(result.outputPath);
                    }
                }

                page.cleanup?.();
                pdfExtractBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Extracting ${index + 1}/${pagesToExtract.length}`;
            }

            if (successCount === 0) {
                showToast('No pages were saved.', 'warning');
                return;
            }

            if (shouldCreateZip && savedImagePaths.length > 0) {
                const zipResult = await window.app.createExtractedImagesZip?.({
                    filePaths: savedImagePaths,
                    outputFolder,
                    zipName: `${safePdfStem}_images`
                });

                if (zipResult?.success) {
                    showToast(`ZIP created: ${zipResult.fileName}`, 'success');
                } else {
                    showToast(zipResult?.error || 'Images were saved, but ZIP creation failed.', 'warning', 6000);
                }
            }

            showToast(`Successfully extracted ${successCount} page${successCount > 1 ? 's' : ''} as ${format.toUpperCase()}`, 'success');
            refreshRecentFiles();
            if (appSettings.openFolderOnComplete) {
                await window.app.openFolder(outputFolder);
            }
            clearPdfExtractFile();

        } catch (error) {
            console.error('[renderer] PDF extraction failed:', error);
            showToast(`Extraction failed: ${error.message}`, 'error', 6000);
        } finally {
            if (pdf?.destroy) {
                await pdf.destroy().catch(() => undefined);
            } else if (loadingTask?.destroy) {
                loadingTask.destroy();
            }
            pdfExtractBtn.innerHTML = originalLabel;
            pdfExtractBtn.disabled = false;
        }
    }


    // ─── PDF Watermarking Controller ──────────────────────────────────────────
    function setPdfWatermarkFile(files) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.pdf')) {
            selectedWatermarkFile = {
                raw: file,
                name: file.name,
                path: file.path || (window.app && window.app.getPathForFile ? window.app.getPathForFile(file) : ''),
                size: file.size || 0
            };
            
            pdfWatermarkDropzone?.classList.add('hidden');
            pdfWatermarkDetails?.classList.remove('hidden');
            pdfWatermarkPreviewSection?.classList.remove('hidden');
            pdfWatermarkBtn.disabled = false;
            
            if (pdfWatermarkDetailName) pdfWatermarkDetailName.textContent = selectedWatermarkFile.name;
            if (pdfWatermarkDetailMeta) {
                const mb = (selectedWatermarkFile.size / (1024 * 1024)).toFixed(2);
                pdfWatermarkDetailMeta.textContent = `${mb} MB`;
            }

            const stem = getPdfStem(selectedWatermarkFile.name);
            if (pdfWatermarkOutputName) {
                pdfWatermarkOutputName.value = `${sanitizeFileStem(stem)}_watermarked`;
            }

            const dir = getFolderFromPath(selectedWatermarkFile.path);
            if (pdfWatermarkFolderInput) {
                pdfWatermarkFolderInput.value = dir || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
            }

            renderWatermarkPreview();
            showToast('PDF loaded for watermarking.', 'success', 3000, { skipNotification: true });
        } else {
            showToast('Please select a valid PDF file.', 'warning');
        }
    }

    function clearPdfWatermarkFile() {
        selectedWatermarkFile = null;
        pdfWatermarkDropzone?.classList.remove('hidden');
        pdfWatermarkDetails?.classList.add('hidden');
        pdfWatermarkPreviewSection?.classList.add('hidden');
        pdfWatermarkBtn.disabled = true;
        if (pdfWatermarkInput) pdfWatermarkInput.value = '';
    }

    async function renderWatermarkPreview() {
        if (!selectedWatermarkFile) return;
        try {
            const pdfJs = window.pdfjsLib;
            if (!pdfJs?.getDocument) return;

            const pdfBytes = await getPdfDocumentBytes(selectedWatermarkFile);
            const loadingTask = pdfJs.getDocument({
                data: pdfBytes,
                disableFontFace: false,
                useSystemFonts: true
            });
            const pdf = await loadingTask.promise;
            
            if (pdfWatermarkDetailMeta) {
                const mb = (selectedWatermarkFile.size / (1024 * 1024)).toFixed(2);
                pdfWatermarkDetailMeta.textContent = `${mb} MB • ${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''}`;
            }

            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(400 / viewport.height, 400 / viewport.width, 1.5);
            const scaledViewport = page.getViewport({ scale });

            const canvas = watermarkPreviewCanvas;
            const context = canvas.getContext('2d');
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            await page.render({
                canvasContext: context,
                viewport: scaledViewport
            }).promise;

            const type = pdfWatermarkType.value;
            const opacity = Number(pdfWatermarkOpacitySlider.value) / 100;
            const placement = pdfWatermarkPlacement.value;

            context.save();
            context.globalAlpha = opacity;

            if (type === 'text') {
                const text = pdfWatermarkTextInput.value || 'CONFIDENTIAL';
                const fontSize = Number(pdfWatermarkSizeSlider.value) * scale * 0.7;
                const color = pdfWatermarkColor.value || '#ff0000';
                const rotation = Number(pdfWatermarkRotationSlider.value) * Math.PI / 180;
                const font = pdfWatermarkFont.value;

                context.fillStyle = color;
                context.font = `bold ${fontSize}px ${font === 'Courier' ? 'Courier New' : font === 'Times-Roman' ? 'Times New Roman' : 'Arial'}`;
                context.textBaseline = 'middle';
                context.textAlign = 'center';

                const textWidth = context.measureText(text).width;
                const textHeight = fontSize;

                if (placement === 'TILED') {
                    context.translate(canvas.width / 2, canvas.height / 2);
                    context.rotate(rotation);
                    context.translate(-canvas.width / 2, -canvas.height / 2);
                    const stepX = textWidth + 120;
                    const stepY = textHeight + 120;
                    for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                        for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                            context.fillText(text, x, y);
                        }
                    }
                } else {
                    let x = canvas.width / 2;
                    let y = canvas.height / 2;

                    if (placement === 'TOP_LEFT') {
                        x = textWidth / 2 + 15; y = textHeight / 2 + 15;
                    } else if (placement === 'TOP_RIGHT') {
                        x = canvas.width - textWidth / 2 - 15; y = textHeight / 2 + 15;
                    } else if (placement === 'BOTTOM_LEFT') {
                        x = textWidth / 2 + 15; y = canvas.height - textHeight / 2 - 15;
                    } else if (placement === 'BOTTOM_RIGHT') {
                        x = canvas.width - textWidth / 2 - 15; y = canvas.height - textHeight / 2 - 15;
                    }

                    context.translate(x, y);
                    context.rotate(rotation);
                    context.fillText(text, 0, 0);
                }
            } else if (type === 'image' && watermarkLogoFile) {
                const logoScale = Number(pdfWatermarkLogoScaleSlider.value) / 100;
                const img = new Image();
                img.src = watermarkLogoFile.url;
                await new Promise((resolve) => { img.onload = resolve; });

                const w = img.width * logoScale * scale * 0.5;
                const h = img.height * logoScale * scale * 0.5;

                if (placement === 'TILED') {
                    const stepX = w + 120;
                    const stepY = h + 120;
                    for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
                        for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
                            context.drawImage(img, x, y, w, h);
                        }
                    }
                } else {
                    let x = (canvas.width - w) / 2;
                    let y = (canvas.height - h) / 2;

                    if (placement === 'TOP_LEFT') {
                        x = 15; y = 15;
                    } else if (placement === 'TOP_RIGHT') {
                        x = canvas.width - w - 15; y = 15;
                    } else if (placement === 'BOTTOM_LEFT') {
                        x = 15; y = canvas.height - h - 15;
                    } else if (placement === 'BOTTOM_RIGHT') {
                        x = canvas.width - w - 15; y = canvas.height - h - 15;
                    }

                    context.drawImage(img, x, y, w, h);
                }
            }

            context.restore();
            page.cleanup?.();
            await pdf.destroy().catch(() => undefined);
        } catch (err) {
            console.error('Watermark preview render failed:', err);
        }
    }

    async function applyWatermarkPDF() {
        if (!selectedWatermarkFile) return;

        const outputFolder = pdfWatermarkFolderInput?.value || getFolderFromPath(selectedWatermarkFile.path);
        if (!outputFolder) {
            showToast('Select an output folder first.', 'warning');
            return;
        }

        const watermarkType = pdfWatermarkType.value;
        const pdfName = pdfWatermarkOutputName?.value || 'Watermarked_PDF';

        const textOptions = {
            text: pdfWatermarkTextInput.value || 'CONFIDENTIAL',
            fontFamily: pdfWatermarkFont.value || 'Helvetica',
            fontSize: parseInt(pdfWatermarkSizeSlider.value, 10),
            color: pdfWatermarkColor.value,
            opacity: Number(pdfWatermarkOpacitySlider.value) / 100,
            rotation: parseInt(pdfWatermarkRotationSlider.value, 10),
            placement: pdfWatermarkPlacement.value,
            pages: pdfWatermarkPagesSelect.value,
            customRange: pdfWatermarkPagesRangeInput.value
        };

        const imageOptions = {
            imagePath: watermarkLogoFile?.path || '',
            scale: Number(pdfWatermarkLogoScaleSlider.value) / 100,
            opacity: Number(pdfWatermarkOpacitySlider.value) / 100,
            placement: pdfWatermarkPlacement.value,
            pages: pdfWatermarkPagesSelect.value,
            customRange: pdfWatermarkPagesRangeInput.value
        };

        if (watermarkType === 'image' && !imageOptions.imagePath) {
            showToast('Choose a watermark logo image first.', 'warning');
            return;
        }

        pdfWatermarkBtn.disabled = true;
        const originalLabel = pdfWatermarkBtn.innerHTML;
        pdfWatermarkBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Watermarking PDF...';

        try {
            const result = await window.app.watermarkPDF({
                pdfPath: selectedWatermarkFile.path,
                outputFolder,
                pdfName,
                watermarkType,
                textOptions,
                imageOptions
            });

            if (result?.success) {
                showToast(`Watermarked successfully: ${result.fileName}`, 'success');
                refreshRecentFiles();
                if (appSettings.openFolderOnComplete) {
                    await window.app.openFolder(outputFolder);
                }
                clearPdfWatermarkFile();
            } else {
                showToast(result?.error || 'Watermarking failed.', 'error');
            }
        } catch (err) {
            console.error('Watermark execution failed:', err);
            showToast(`Execution failed: ${err.message}`, 'error');
        } finally {
            pdfWatermarkBtn.innerHTML = originalLabel;
            pdfWatermarkBtn.disabled = false;
        }
    }


    // ─── PDF Compression Controller ──────────────────────────────────────────
    function addPdfCompressFiles(files) {
        if (!files || files.length === 0) return;
        
        let addedCount = 0;
        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                const id = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                pdfCompressFiles.push({
                    id,
                    file: {
                        raw: file,
                        name: file.name,
                        path: file.path || (window.app && window.app.getPathForFile ? window.app.getPathForFile(file) : ''),
                        size: file.size || 0
                    },
                    status: 'ready',
                    originalSize: file.size,
                    compressedSize: 0,
                    savings: 0
                });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            pdfCompressDropzone?.classList.add('hidden');
            pdfCompressListSection?.classList.remove('hidden');
            pdfCompressBtn.disabled = false;

            if (pdfCompressFolderInput && pdfCompressFiles.length === addedCount) {
                const dir = getFolderFromPath(pdfCompressFiles[0].file.path);
                pdfCompressFolderInput.value = dir || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
            }

            renderCompressList();
            showToast(`Added ${addedCount} PDF file${addedCount > 1 ? 's' : ''} to compression queue.`, 'success', 3000, { skipNotification: true });
        } else {
            showToast('Please drop valid PDF files.', 'warning');
        }
    }

    function renderCompressList() {
        if (!pdfCompressList) return;
        pdfCompressList.innerHTML = '';
        
        if (pdfCompressCount) {
            pdfCompressCount.textContent = pdfCompressFiles.length;
        }

        if (pdfCompressFiles.length === 0) {
            pdfCompressDropzone?.classList.remove('hidden');
            pdfCompressListSection?.classList.add('hidden');
            pdfCompressBtn.disabled = true;
            return;
        }

        pdfCompressFiles.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'pdf-compress-item-row';
            
            const origMB = (item.originalSize / (1024 * 1024)).toFixed(2);
            let sizeMeta = `${origMB} MB`;
            let statusMarkup = `<span class="compress-status-text">Ready</span>`;

            if (item.status === 'compressing') {
                statusMarkup = `<span class="compress-status-text"><i class="fa-solid fa-spinner fa-spin"></i> Shrinking...</span>`;
            } else if (item.status === 'complete') {
                const compMB = (item.compressedSize / (1024 * 1024)).toFixed(2);
                sizeMeta = `${origMB} MB &bull; Compressed: ${compMB} MB`;
                statusMarkup = `
                    ${item.savings > 0
                        ? `<span class="compress-savings-pill"><i class="fa-solid fa-arrow-down"></i> ${item.savings}%</span>`
                        : `<span class="compress-status-text" style="color:var(--text-muted);">No reduction</span>`
                    }
                    <span class="compress-status-text complete">Done</span>
                `;
            } else if (item.status === 'failed') {
                statusMarkup = `<span class="compress-status-text failed"><i class="fa-solid fa-circle-exclamation"></i> Failed</span>`;
            }

            row.innerHTML = `
                <div class="compress-item-info">
                    <i class="fa-solid fa-file-pdf compress-item-icon"></i>
                    <div class="compress-item-meta">
                        <span class="compress-item-name" title="${escapeHtml(item.file.name)}">${escapeHtml(truncateName(item.file.name, 45))}</span>
                        <span class="compress-item-size-meta">${sizeMeta}</span>
                    </div>
                </div>
                <div class="compress-item-status-col">
                    ${statusMarkup}
                    <button class="icon-btn no-drag compress-remove-btn" data-id="${item.id}" title="Remove file"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;

            row.querySelector('.compress-remove-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                pdfCompressFiles = pdfCompressFiles.filter((cf) => cf.id !== item.id);
                renderCompressList();
            });

            pdfCompressList.appendChild(row);
        });
    }

    function clearPdfCompressFiles() {
        pdfCompressFiles = [];
        renderCompressList();
        if (pdfCompressInput) pdfCompressInput.value = '';
    }

    async function compressPdfFiles() {
        if (pdfCompressFiles.length === 0) return;

        const outputFolder = pdfCompressFolderInput?.value;
        if (!outputFolder) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        const profile = pdfCompressProfile.value || 'recommended';
        pdfCompressBtn.disabled = true;
        const originalLabel = pdfCompressBtn.innerHTML;
        pdfCompressBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Optimizing PDFs...';

        let successCount = 0;

        try {
            for (let i = 0; i < pdfCompressFiles.length; i++) {
                const item = pdfCompressFiles[i];
                if (item.status === 'complete') continue;

                item.status = 'compressing';
                renderCompressList();

                try {
                    if (profile === 'lossless') {
                        // Backend pure lossless Flate/Object optimization
                        const result = await window.app.compressPDFLossless({
                            pdfPath: item.file.path,
                            outputFolder,
                            pdfName: getPdfStem(item.file.name)
                        });

                        if (result?.success) {
                            item.status = 'complete';
                            item.compressedSize = result.compressedSize;
                            item.savings = result.savings;
                            successCount++;
                            refreshRecentFiles();
                        } else {
                            item.status = 'failed';
                        }
                    } else {
                        // Lossy visual compression: rasterize & re-encode
                        // Configure custom values based on profile
                        let dpi = 150;
                        let quality = 75;
                        let customWidth = 1500;
                        if (profile === 'extreme') {
                            dpi = 72;
                            quality = 50;
                            customWidth = 900;
                        } else if (profile === 'high') {
                            dpi = 300;
                            quality = 90;
                            customWidth = 2400;
                        }

                        // Load document in renderer to extract pages
                        const pdfJs = window.pdfjsLib;
                        const pdfBytes = await getPdfDocumentBytes(item.file);
                        const loadingTask = pdfJs.getDocument({
                            data: pdfBytes,
                            disableFontFace: false,
                            useSystemFonts: true
                        });
                        const pdf = await loadingTask.promise;
                        const totalPages = pdf.numPages;
                        const tempFiles = [];

                        // 1. Render all pages as high compression JPEGs
                        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                            const page = await pdf.getPage(pageNum);
                            const viewport = page.getViewport({ scale: 1 });
                            const scale = customWidth / viewport.width;
                            const scaledViewport = page.getViewport({ scale });

                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.width = Math.round(scaledViewport.width);
                            canvas.height = Math.round(scaledViewport.height);

                            context.fillStyle = '#ffffff';
                            context.fillRect(0, 0, canvas.width, canvas.height);

                            await page.render({
                                canvasContext: context,
                                viewport: scaledViewport,
                                background: 'white'
                            }).promise;

                            const base64Data = canvas.toDataURL('image/jpeg', quality / 100);
                            const base64String = base64Data.split(',')[1];
                            const tempFileName = `temp_comp_page_${pageNum}_${Date.now()}.jpg`;

                            // Write extracted temp image
                            const tempRes = await window.app.saveExtractedPage({
                                base64Data: base64String,
                                outputFolder,
                                fileName: tempFileName
                            });

                            if (tempRes?.success && tempRes.outputPath) {
                                tempFiles.push(tempRes.outputPath);
                            }
                            page.cleanup?.();
                        }

                        if (pdf.destroy) await pdf.destroy().catch(() => undefined);

                        // 2. Re-compile extracted images back into a compact PDF
                        if (tempFiles.length > 0) {
                            const pdfStem = getPdfStem(item.file.name);
                            const finalRes = await window.app.createPDF({
                                imagePaths: tempFiles,
                                outputFolder,
                                pdfName: `${sanitizeFileStem(pdfStem)}_compressed`,
                                pageSize: 'FIT',
                                orientation: 'PORTRAIT',
                                marginType: 'NONE',
                                quality: 100,
                                layout: 'CENTER',
                                pageNumbers: false
                            });

                            // Clean up temp images
                            for (const f of tempFiles) {
                                try {
                                    if (window.app && window.app.deleteFile) {
                                        await window.app.deleteFile(f);
                                    }
                                } catch (err) {
                                    console.warn(`Failed to delete temp file ${f}:`, err);
                                }
                            }

                            if (finalRes?.success) {
                                item.status = 'complete';
                                
                                // Let's check size
                                const finalPathExists = await window.app.pathExists({ path: finalRes.outputPath });
                                if (finalPathExists) {
                                    // Retrieve actual size of the compressed file from disk
                                    const compSize = (window.app?.getFileSize)
                                        ? await window.app.getFileSize(finalRes.outputPath)
                                        : 0;
                                    item.compressedSize = compSize || 0;
                                    item.savings = (compSize > 0 && compSize < item.originalSize)
                                        ? Math.round(((item.originalSize - compSize) / item.originalSize) * 100)
                                        : 0;
                                    successCount++;
                                    refreshRecentFiles();
                                } else {
                                    item.status = 'failed';
                                }
                            } else {
                                item.status = 'failed';
                            }
                        } else {
                            item.status = 'failed';
                        }
                    }
                } catch (err) {
                    console.error(`Failed to compress ${item.file.name}:`, err);
                    item.status = 'failed';
                }

                renderCompressList();
            }

            showToast(`Completed compression for ${successCount} PDF file${successCount > 1 ? 's' : ''}.`, 'success');
            if (appSettings.openFolderOnComplete && successCount > 0) {
                await window.app.openFolder(outputFolder);
            }
        } catch (err) {
            console.error('Compression batch failed:', err);
            showToast(`Batch failed: ${err.message}`, 'error');
        } finally {
            pdfCompressBtn.innerHTML = originalLabel;
            pdfCompressBtn.disabled = false;
        }
    }


    // ─── PDF Page Organizer Controller ───────────────────────────────────────
    function setPdfOrganizeFile(files) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.pdf')) {
            selectedOrganizeFile = {
                raw: file,
                name: file.name,
                path: file.path || (window.app && window.app.getPathForFile ? window.app.getPathForFile(file) : ''),
                size: file.size || 0
            };
            
            pdfOrganizeDropzone?.classList.add('hidden');
            pdfOrganizeDetails?.classList.remove('hidden');
            pdfOrganizePagesSection?.classList.remove('hidden');
            pdfOrganizeBtn.disabled = false;
            
            if (pdfOrganizeDetailName) pdfOrganizeDetailName.textContent = selectedOrganizeFile.name;
            if (pdfOrganizeDetailMeta) {
                const mb = (selectedOrganizeFile.size / (1024 * 1024)).toFixed(2);
                pdfOrganizeDetailMeta.textContent = `${mb} MB`;
            }

            const stem = getPdfStem(selectedOrganizeFile.name);
            if (pdfOrganizeOutputName) {
                pdfOrganizeOutputName.value = `${sanitizeFileStem(stem)}_organized`;
            }

            const dir = getFolderFromPath(selectedOrganizeFile.path);
            if (pdfOrganizeFolderInput) {
                pdfOrganizeFolderInput.value = dir || appSettings.defaultOutputFolder || defaultDownloadsPath || '';
            }

            loadOrganizePages();
            showToast('PDF loaded for organization.', 'success', 3000, { skipNotification: true });
        } else {
            showToast('Please select a valid PDF file.', 'warning');
        }
    }

    function clearPdfOrganizeFile() {
        selectedOrganizeFile = null;
        pdfOrganizePages = [];
        pdfOrganizeDropzone?.classList.remove('hidden');
        pdfOrganizeDetails?.classList.add('hidden');
        pdfOrganizePagesSection?.classList.add('hidden');
        pdfOrganizeBtn.disabled = true;
        if (pdfOrganizePagesList) pdfOrganizePagesList.innerHTML = '';
        if (pdfOrganizeInput) pdfOrganizeInput.value = '';
    }

    async function loadOrganizePages() {
        if (!selectedOrganizeFile || !pdfOrganizePagesList) return;
        
        pdfOrganizePagesList.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; padding: 40px; gap: 15px; color: var(--text-muted);">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: #8b5cf6;"></i>
                <span>Generating page thumbnails...</span>
            </div>
        `;

        try {
            const pdfJs = window.pdfjsLib;
            const pdfBytes = await getPdfDocumentBytes(selectedOrganizeFile);
            const loadingTask = pdfJs.getDocument({
                data: pdfBytes,
                disableFontFace: false,
                useSystemFonts: true
            });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            if (pdfOrganizePageCount) {
                pdfOrganizePageCount.textContent = totalPages;
            }
            if (pdfOrganizeDetailMeta) {
                const mb = (selectedOrganizeFile.size / (1024 * 1024)).toFixed(2);
                pdfOrganizeDetailMeta.textContent = `${mb} MB &bull; ${totalPages} page${totalPages > 1 ? 's' : ''}`;
            }

            pdfOrganizePages = [];

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1 });
                // Light rendering scale for lightweight thumbnail
                const scale = 140 / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = Math.round(scaledViewport.width);
                canvas.height = Math.round(scaledViewport.height);

                await page.render({
                    canvasContext: context,
                    viewport: scaledViewport
                }).promise;

                pdfOrganizePages.push({
                    pageNum,
                    rotation: 0,
                    deleted: false,
                    thumbCanvas: canvas
                });
                page.cleanup?.();
            }

            if (pdf.destroy) await pdf.destroy().catch(() => undefined);
            
            renderOrganizeGrid();
        } catch (err) {
            console.error('Failed to render organize thumbnails:', err);
            pdfOrganizePagesList.innerHTML = `<span style="grid-column: 1/-1; color: #ef4444; text-align:center;">Failed to load thumbnails: ${err.message}</span>`;
        }
    }

    function renderOrganizeGrid() {
        if (!pdfOrganizePagesList) return;
        pdfOrganizePagesList.innerHTML = '';

        if (pdfOrganizePages.length === 0) {
            pdfOrganizePagesList.innerHTML = '<span style="grid-column: 1/-1; color: var(--text-muted); text-align:center;">No pages in document.</span>';
            return;
        }

        pdfOrganizePages.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `pdf-organize-card ${item.deleted ? 'deleted' : ''}`;
            card.setAttribute('draggable', !item.deleted);
            card.setAttribute('data-index', index);

            // Thumbnail wrap
            const thumbWrap = document.createElement('div');
            thumbWrap.className = 'pdf-organize-thumb-wrap';
            
            const thumbCanvas = item.thumbCanvas;
            thumbCanvas.style.transition = 'transform 0.3s ease';
            thumbCanvas.style.transform = `rotate(${item.rotation}deg) scale(${item.rotation % 180 === 0 ? 1 : 0.75})`;
            thumbWrap.appendChild(thumbCanvas);

            // Rotation badge
            let rotationBadge = '';
            if (item.rotation !== 0) {
                rotationBadge = `<span class="pdf-organize-rotation-badge">${item.rotation}&deg;</span>`;
            }

            // Meta row
            const metaRow = document.createElement('div');
            metaRow.className = 'pdf-organize-meta';
            metaRow.innerHTML = `<span>Page ${item.pageNum}</span> ${rotationBadge}`;

            // Quick actions overlay
            const actionsOverlay = document.createElement('div');
            actionsOverlay.className = 'pdf-organize-actions-overlay';
            actionsOverlay.innerHTML = `
                <button class="pdf-organize-action-btn btn-rot-left" title="Rotate Left"><i class="fa-solid fa-rotate-left"></i></button>
                <button class="pdf-organize-action-btn btn-rot-right" title="Rotate Right"><i class="fa-solid fa-rotate-right"></i></button>
                <button class="pdf-organize-action-btn btn-delete" title="Delete Page"><i class="fa-solid fa-trash-can"></i></button>
            `;

            actionsOverlay.querySelector('.btn-rot-left')?.addEventListener('click', (e) => {
                e.stopPropagation();
                item.rotation = (item.rotation - 90 + 360) % 360;
                renderOrganizeGrid();
            });

            actionsOverlay.querySelector('.btn-rot-right')?.addEventListener('click', (e) => {
                e.stopPropagation();
                item.rotation = (item.rotation + 90) % 360;
                renderOrganizeGrid();
            });

            actionsOverlay.querySelector('.btn-delete')?.addEventListener('click', (e) => {
                e.stopPropagation();
                item.deleted = true;
                renderOrganizeGrid();
            });

            card.appendChild(thumbWrap);
            card.appendChild(metaRow);
            card.appendChild(actionsOverlay);

            // If marked deleted, overlay restore panel
            if (item.deleted) {
                const deletedOverlay = document.createElement('div');
                deletedOverlay.className = 'pdf-organize-deleted-overlay';
                deletedOverlay.innerHTML = `
                    <span><i class="fa-solid fa-eye-slash"></i> Deleted</span>
                    <button class="outline-btn no-drag" style="padding: 3px 10px; font-size: 11px;" id="restore-page-${index}">Restore</button>
                `;
                deletedOverlay.querySelector('button')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.deleted = false;
                    renderOrganizeGrid();
                });
                card.appendChild(deletedOverlay);
            }

            // HTML5 Drag & Drop event bindings
            card.addEventListener('dragstart', (e) => {
                if (item.deleted) {
                    e.preventDefault();
                    return;
                }
                pdfOrganizeDragSrcIndex = index;
                card.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (index !== pdfOrganizeDragSrcIndex) {
                    card.classList.add('drag-over');
                }
            });

            card.addEventListener('dragenter', (e) => {
                e.preventDefault();
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
                document.querySelectorAll('.pdf-organize-card').forEach((el) => el.classList.remove('drag-over'));
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (pdfOrganizeDragSrcIndex !== null && pdfOrganizeDragSrcIndex !== index) {
                    // Rearrange pages array
                    const draggedItem = pdfOrganizePages.splice(pdfOrganizeDragSrcIndex, 1)[0];
                    pdfOrganizePages.splice(index, 0, draggedItem);
                    pdfOrganizeDragSrcIndex = null;
                    renderOrganizeGrid();
                }
            });

            pdfOrganizePagesList.appendChild(card);
        });
    }

    async function saveOrganizedPdf() {
        if (!selectedOrganizeFile) return;

        const outputFolder = pdfOrganizeFolderInput?.value;
        if (!outputFolder) {
            showToast('Choose an output folder first.', 'warning');
            return;
        }

        const activePages = pdfOrganizePages.filter((p) => !p.deleted);
        if (activePages.length === 0) {
            showToast('Select at least one page to save.', 'warning');
            return;
        }

        const pageOperations = activePages.map((p) => ({
            sourcePageIndex: p.pageNum - 1, // backend is 0-based
            rotation: p.rotation
        }));

        pdfOrganizeBtn.disabled = true;
        const originalLabel = pdfOrganizeBtn.innerHTML;
        pdfOrganizeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving PDF...';

        try {
            const pdfName = pdfOrganizeOutputName?.value || 'Organized_PDF';
            const result = await window.app.organizePDF({
                pdfPath: selectedOrganizeFile.path,
                outputFolder,
                pdfName,
                pageOperations
            });

            if (result?.success) {
                showToast(`PDF organized successfully: ${result.fileName}`, 'success');
                refreshRecentFiles();
                if (appSettings.openFolderOnComplete) {
                    await window.app.openFolder(outputFolder);
                }
                clearPdfOrganizeFile();
            } else {
                showToast(result?.error || 'Failed to save organized PDF.', 'error');
            }
        } catch (err) {
            console.error('Failed to organize PDF:', err);
            showToast(`Saving failed: ${err.message}`, 'error');
        } finally {
            pdfOrganizeBtn.innerHTML = originalLabel;
            pdfOrganizeBtn.disabled = false;
        }
    }

    pdfTabs.forEach((tab) => {
        tab.addEventListener('click', () => setPdfMode(tab.dataset.mode || 'img-to-pdf'));
    });

    pdfImgDropzone?.addEventListener('click', () => pdfImgInput?.click());
    pdfImgDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfImgInput?.click();
    });
    pdfImgDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfImgDropzone.classList.add('dragover');
    });
    pdfImgDropzone?.addEventListener('dragleave', () => pdfImgDropzone.classList.remove('dragover'));
    pdfImgDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfImgDropzone.classList.remove('dragover');
        addPdfImages(event.dataTransfer.files);
    });
    pdfImgInput?.addEventListener('change', (event) => {
        addPdfImages(event.target.files);
        event.target.value = '';
    });
    pdfImgClearBtn?.addEventListener('click', clearPdfImages);
    document.getElementById('pdf-img-add-more-btn')?.addEventListener('click', () => pdfImgInput?.click());
    pdfCompileBtn?.addEventListener('click', compilePdfImages);

    pdfPickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfOutputFolderInput) {
            pdfOutputFolderInput.value = folder;
        }
    });
    pdfOpenFolderBtn?.addEventListener('click', async () => {
        const folder = getPdfOutputFolder();
        if (folder) {
            await window.app?.openFolder?.(folder);
        }
    });

    pdfFileDropzone?.addEventListener('click', () => pdfFileInput?.click());
    pdfFileDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfFileInput?.click();
    });
    pdfFileDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfFileDropzone.classList.add('dragover');
    });
    pdfFileDropzone?.addEventListener('dragleave', () => pdfFileDropzone.classList.remove('dragover'));
    pdfFileDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfFileDropzone.classList.remove('dragover');
        setPdfExtractFile(event.dataTransfer.files);
    });
    pdfFileInput?.addEventListener('change', (event) => {
        setPdfExtractFile(event.target.files);
        event.target.value = '';
    });
    pdfRemoveFileBtn?.addEventListener('click', clearPdfExtractFile);
    pdfExtractBtn?.addEventListener('click', extractPdfImages);
    pdfExtractRangeType?.addEventListener('change', () => {
        pdfExtractRangeGroup?.classList.toggle('hidden', pdfExtractRangeType.value !== 'CUSTOM');
    });
    pdfResolutionMode?.addEventListener('change', () => {
        const isDpiMode = pdfResolutionMode.value === 'DPI';
        pdfDpiGroup?.classList.toggle('hidden', !isDpiMode);
        pdfWidthSlider?.closest('.form-group')?.classList.toggle('hidden', isDpiMode);
    });
    pdfExtractFormat?.addEventListener('change', () => {
        pdfJpgQualityGroup?.classList.toggle('hidden', pdfExtractFormat.value !== 'jpg');
    });
    pdfWidthSlider?.addEventListener('input', () => {
        if (pdfWidthVal) {
            pdfWidthVal.textContent = `${pdfWidthSlider.value}px`;
        }
    });
    pdfJpgQualitySlider?.addEventListener('input', () => {
        if (pdfJpgQualityVal) {
            pdfJpgQualityVal.textContent = `${pdfJpgQualitySlider.value}%`;
        }
    });
    pdfExtractPickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfExtractFolderInput) {
            pdfExtractFolderInput.value = folder;
        }
    });
    pdfExtractOpenFolderBtn?.addEventListener('click', async () => {
        const folder = getPdfExtractFolder();
        if (folder) {
            await window.app?.openFolder?.(folder);
        }
    });

    pdfMergeDropzone?.addEventListener('click', () => pdfMergeInput?.click());
    pdfMergeDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfMergeInput?.click();
    });
    pdfMergeDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfMergeDropzone.classList.add('dragover');
    });
    pdfMergeDropzone?.addEventListener('dragleave', () => pdfMergeDropzone.classList.remove('dragover'));
    pdfMergeDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfMergeDropzone.classList.remove('dragover');
        addPdfMergeFiles(event.dataTransfer.files);
    });
    pdfMergeInput?.addEventListener('change', (event) => {
        addPdfMergeFiles(event.target.files);
        event.target.value = '';
    });
    pdfMergeClearBtn?.addEventListener('click', clearPdfMergeFiles);
    pdfMergeBtn?.addEventListener('click', mergePdfFiles);
    pdfMergePickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfMergeFolderInput) {
            pdfMergeFolderInput.value = folder;
        }
    });
    pdfMergeOpenFolderBtn?.addEventListener('click', async () => {
        const folder = getPdfMergeFolder();
        if (folder) {
            await window.app?.openFolder?.(folder);
        }
    });

    // Sidebar collapsible section toggles
    document.querySelectorAll('.pdf-sidebar-section').forEach((section) => {
        const titleEl = section.querySelector('.pdf-sidebar-title');
        const scrollEl = section.querySelector('.settings-form-scroll');
        if (titleEl && scrollEl) {
            titleEl.addEventListener('click', () => {
                const isCollapsed = scrollEl.classList.toggle('collapsed');
                const chevron = titleEl.querySelector('.fa-chevron-up, .fa-chevron-down');
                if (chevron) {
                    if (isCollapsed) {
                        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
                    } else {
                        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
                    }
                }
            });
        }
    });

    // Advanced Options Toggler
    const pdfAdvancedToggleBtn = document.getElementById('pdf-advanced-toggle-btn');
    const pdfAdvancedOptionsContent = document.getElementById('pdf-advanced-options-content');
    pdfAdvancedToggleBtn?.addEventListener('click', () => {
        const isHidden = pdfAdvancedOptionsContent.classList.toggle('hidden');
        const chevron = pdfAdvancedToggleBtn.querySelector('i');
        if (chevron) {
            if (isHidden) {
                chevron.className = 'fa-solid fa-chevron-down';
            } else {
                chevron.className = 'fa-solid fa-chevron-up';
            }
        }
    });

    // Image Quality Slider Value Update
    const pdfQualitySlider = document.getElementById('pdf-quality-slider');
    const pdfQualityVal = document.getElementById('pdf-quality-val');
    pdfQualitySlider?.addEventListener('input', () => {
        if (pdfQualityVal) {
            pdfQualityVal.textContent = `${pdfQualitySlider.value}%`;
        }
    });



    pdfWatermarkDropzone?.addEventListener('click', () => pdfWatermarkInput?.click());
    pdfWatermarkDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfWatermarkInput?.click();
    });
    pdfWatermarkDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfWatermarkDropzone.classList.add('dragover');
    });
    pdfWatermarkDropzone?.addEventListener('dragleave', () => pdfWatermarkDropzone.classList.remove('dragover'));
    pdfWatermarkDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfWatermarkDropzone.classList.remove('dragover');
        setPdfWatermarkFile(event.dataTransfer.files);
    });
    pdfWatermarkInput?.addEventListener('change', (event) => {
        setPdfWatermarkFile(event.target.files);
        event.target.value = '';
    });
    pdfWatermarkRemoveFileBtn?.addEventListener('click', clearPdfWatermarkFile);
    pdfWatermarkBtn?.addEventListener('click', applyWatermarkPDF);

    pdfWatermarkPickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfWatermarkFolderInput) {
            pdfWatermarkFolderInput.value = folder;
        }
    });
    pdfWatermarkOpenFolderBtn?.addEventListener('click', async () => {
        const folder = pdfWatermarkFolderInput?.value;
        if (folder) await window.app?.openFolder?.(folder);
    });

    // Inputs to trigger live preview updates
    pdfWatermarkType?.addEventListener('change', () => {
        const isImage = pdfWatermarkType.value === 'image';
        pdfWatermarkTextGroup?.classList.toggle('hidden', isImage);
        pdfWatermarkImageGroup?.classList.toggle('hidden', !isImage);
        renderWatermarkPreview();
    });

    pdfWatermarkTextInput?.addEventListener('input', renderWatermarkPreview);
    pdfWatermarkFont?.addEventListener('change', renderWatermarkPreview);
    pdfWatermarkPlacement?.addEventListener('change', renderWatermarkPreview);
    
    pdfWatermarkSizeSlider?.addEventListener('input', () => {
        if (pdfWatermarkSizeVal) pdfWatermarkSizeVal.textContent = `${pdfWatermarkSizeSlider.value}px`;
        renderWatermarkPreview();
    });
    
    pdfWatermarkRotationSlider?.addEventListener('input', () => {
        if (pdfWatermarkRotationVal) pdfWatermarkRotationVal.textContent = `${pdfWatermarkRotationSlider.value}°`;
        renderWatermarkPreview();
    });
    
    pdfWatermarkOpacitySlider?.addEventListener('input', () => {
        if (pdfWatermarkOpacityVal) pdfWatermarkOpacityVal.textContent = `${pdfWatermarkOpacitySlider.value}%`;
        renderWatermarkPreview();
    });

    pdfWatermarkColor?.addEventListener('input', () => {
        if (pdfWatermarkColorHex) pdfWatermarkColorHex.value = pdfWatermarkColor.value;
        renderWatermarkPreview();
    });

    pdfWatermarkPagesSelect?.addEventListener('change', () => {
        pdfWatermarkPagesRangeGroup?.classList.toggle('hidden', pdfWatermarkPagesSelect.value !== 'CUSTOM');
    });

    pdfWatermarkLogoBrowseBtn?.addEventListener('click', async () => {
        const files = await window.app?.selectFiles?.();
        if (files && files.length > 0) {
            const logoPath = files[0];
            const name = logoPath.split('\\').pop().split('/').pop();
            watermarkLogoFile = {
                name,
                path: logoPath,
                url: `converthub-media://load?path=${encodeURIComponent(logoPath)}`
            };
            if (pdfWatermarkLogoPath) pdfWatermarkLogoPath.value = name;
            renderWatermarkPreview();
        }
    });

    pdfWatermarkLogoScaleSlider?.addEventListener('input', () => {
        if (pdfWatermarkLogoScaleVal) pdfWatermarkLogoScaleVal.textContent = `${pdfWatermarkLogoScaleSlider.value}%`;
        renderWatermarkPreview();
    });


    // PDF Compression Panel Bindings
    pdfCompressDropzone?.addEventListener('click', () => pdfCompressInput?.click());
    pdfCompressDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfCompressInput?.click();
    });
    pdfCompressDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfCompressDropzone.classList.add('dragover');
    });
    pdfCompressDropzone?.addEventListener('dragleave', () => pdfCompressDropzone.classList.remove('dragover'));
    pdfCompressDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfCompressDropzone.classList.remove('dragover');
        addPdfCompressFiles(event.dataTransfer.files);
    });
    pdfCompressInput?.addEventListener('change', (event) => {
        addPdfCompressFiles(event.target.files);
        event.target.value = '';
    });
    pdfCompressClearBtn?.addEventListener('click', clearPdfCompressFiles);
    pdfCompressBtn?.addEventListener('click', compressPdfFiles);

    pdfCompressPickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfCompressFolderInput) {
            pdfCompressFolderInput.value = folder;
        }
    });
    pdfCompressOpenFolderBtn?.addEventListener('click', async () => {
        const folder = pdfCompressFolderInput?.value;
        if (folder) await window.app?.openFolder?.(folder);
    });

    pdfCompressProfile?.addEventListener('change', () => {
        const prof = pdfCompressProfile.value;
        if (pdfCompressProfileDesc) {
            if (prof === 'recommended') {
                pdfCompressProfileDesc.textContent = 'Balanced optimization downscaling image layers to 150 DPI at 75% quality. Keeps text editable.';
            } else if (prof === 'extreme') {
                pdfCompressProfileDesc.textContent = 'Maximum size reduction downscaling images to 72 DPI at 50% quality. Perfect for sharing via email/chat.';
            } else if (prof === 'high') {
                pdfCompressProfileDesc.textContent = 'High detail preservation re-encoding images to 300 DPI at 90% quality. Excellent for printing.';
            } else if (prof === 'lossless') {
                pdfCompressProfileDesc.textContent = 'Preserves all vectors and textual editability. Compresses metadata, streams, and removes redundant structures.';
            }
        }
    });


    // PDF Page Organizer Panel Bindings
    pdfOrganizeDropzone?.addEventListener('click', () => pdfOrganizeInput?.click());
    pdfOrganizeDropzone?.querySelector('.pdf-browse-btn')?.addEventListener('click', (event) => {
        event.stopPropagation();
        pdfOrganizeInput?.click();
    });
    pdfOrganizeDropzone?.addEventListener('dragover', (event) => {
        event.preventDefault();
        pdfOrganizeDropzone.classList.add('dragover');
    });
    pdfOrganizeDropzone?.addEventListener('dragleave', () => pdfOrganizeDropzone.classList.remove('dragover'));
    pdfOrganizeDropzone?.addEventListener('drop', (event) => {
        event.preventDefault();
        pdfOrganizeDropzone.classList.remove('dragover');
        setPdfOrganizeFile(event.dataTransfer.files);
    });
    pdfOrganizeInput?.addEventListener('change', (event) => {
        setPdfOrganizeFile(event.target.files);
        event.target.value = '';
    });
    pdfOrganizeRemoveFileBtn?.addEventListener('click', clearPdfOrganizeFile);
    pdfOrganizeBtn?.addEventListener('click', saveOrganizedPdf);

    pdfOrganizePickFolderBtn?.addEventListener('click', async () => {
        const folder = await window.app?.selectOutputFolder?.();
        if (folder && pdfOrganizeFolderInput) {
            pdfOrganizeFolderInput.value = folder;
        }
    });
    pdfOrganizeOpenFolderBtn?.addEventListener('click', async () => {
        const folder = pdfOrganizeFolderInput?.value;
        if (folder) await window.app?.openFolder?.(folder);
    });

    pdfOrganizeSelectAll?.addEventListener('click', () => {
        pdfOrganizePages = pdfOrganizePages.map((p) => ({ ...p, deleted: false }));
        renderOrganizeGrid();
    });

    pdfOrganizeRotateAll?.addEventListener('click', () => {
        pdfOrganizePages = pdfOrganizePages.map((p) => ({
            ...p,
            rotation: (p.rotation + 90) % 360
        }));
        renderOrganizeGrid();
    });



    // --- Startup initialization ---
    if (pdfOutputFolderInput && !pdfOutputFolderInput.value) {
        pdfOutputFolderInput.value = state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || '';
    }
    if (pdfExtractFolderInput && !pdfExtractFolderInput.value) {
        pdfExtractFolderInput.value = state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || '';
    }
    if (pdfMergeFolderInput && !pdfMergeFolderInput.value) {
        pdfMergeFolderInput.value = state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || '';
    }
    if (pdfWatermarkFolderInput && !pdfWatermarkFolderInput.value) {
        pdfWatermarkFolderInput.value = state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || '';
    }
    if (pdfCompressFolderInput && !pdfCompressFolderInput.value) {
        pdfCompressFolderInput.value = state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || '';
    }
    if (pdfOrganizeFolderInput && !pdfOrganizeFolderInput.value) {
        pdfOrganizeFolderInput.value = state.appSettings.defaultOutputFolder || state.defaultDownloadsPath || '';
    }

    renderPdfImageList();
    renderPdfMergeList();
    clearPdfExtractFile();
    setPdfMode('img-to-pdf');

    // Expose needed functions to window scope for cross-module calls
    window.setPdfMode = setPdfMode;
    window.renderPdfImageList = renderPdfImageList;
    window.renderPdfMergeList = renderPdfMergeList;
    window.clearPdfExtractFile = clearPdfExtractFile;
}

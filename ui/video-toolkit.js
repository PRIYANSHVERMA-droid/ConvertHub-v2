(function () {
    const videoAPI = window.videoAPI;
    const electronAPI = window.electronAPI;

    if (!videoAPI) {
        console.error('[video-toolkit] videoAPI is not defined. Preload bridge failed.');
        return;
    }

    // State
    const state = {
        activeTab: 'trim',
        primaryFile: null,
        mediaInfo: null,
        mergeFiles: [],
        subtitleFile: null,
        outputDir: null,
        activeJobId: null,
        recentJobs: [], // array of { jobId, operation, inputFile, status, percent, error, finishedAt }
        sidebarCollapsed: false,
    };

    // Keep track of the current progress handler to avoid duplicates
    let progressListenerRegistered = false;

    // Helper: format time in HH:MM:SS
    function formatTime(secs) {
        if (isNaN(secs) || secs === null) return '00:00:00';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function generateUUID() {
        if (typeof window.crypto?.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    }

    // Helper: format size in bytes
    function formatSize(bytes) {
        if (!bytes || isNaN(bytes)) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Helper: Toast alerts (mirrors parent window's showToast if available)
    function showNotificationToast(msg, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            console.log(`[Toast ${type}]: ${msg}`);
        }
    }

    // Initialize Video Toolkit panel
    async function init() {
        console.log('[video-toolkit] Initializing...');

        // Set default output folder
        if (electronAPI && electronAPI.getDefaultOutput) {
            state.outputDir = await electronAPI.getDefaultOutput();
            const outputFolderInput = document.getElementById('video-output-folder-input');
            if (outputFolderInput) {
                outputFolderInput.value = state.outputDir;
            }
        }

        setupTabListeners();
        setupDropzones();
        setupFormListeners();
        setupTrimSliderSync();
        setupSidebarListeners();
        setupProgressPolling(); // Sync active jobs on startup
    }

    // --- TAB SYSTEM ---
    function setupTabListeners() {
        const tabs = document.querySelectorAll('#video-mode-tabs .pdf-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const mode = tab.dataset.mode;
                switchTab(mode);
            });
        });
    }

    function switchTab(mode) {
        state.activeTab = mode;
        
        // Hide all panels
        document.querySelectorAll('.video-panel').forEach(p => p.classList.add('hidden'));
        
        // Show selected panel
        const panel = document.getElementById(`video-panel-${mode}`);
        if (panel) panel.classList.remove('hidden');

        // Hide all sidebar sections
        document.querySelectorAll('.pdf-sidebar-section').forEach(s => {
            if (s.id !== 'sidebar-video-output') {
                s.classList.add('hidden');
            }
        });

        // Show active sidebar section
        const sidebarSec = document.getElementById(`sidebar-video-${mode}`);
        if (sidebarSec) sidebarSec.classList.remove('hidden');

        // Reset state & buttons based on current tab's active file
        updateRunButtonState();
        clearResultBanner();
    }

    function updateRunButtonState() {
        const tab = state.activeTab;
        const runBtn = document.getElementById(`video-${tab}-run-btn`);
        if (!runBtn) return;

        let hasFiles = false;
        if (tab === 'merge') {
            hasFiles = state.mergeFiles.length > 0;
        } else {
            hasFiles = state.primaryFile !== null;
        }

        // Enable button only if files are loaded and no job is running
        if (hasFiles && !state.activeJobId) {
            runBtn.removeAttribute('disabled');
        } else {
            runBtn.setAttribute('disabled', 'true');
        }
    }

    // --- DROPZONES & FILE PICKERS ---
    function setupDropzones() {
        const dropzoneConfigs = [
            { id: 'video-trim-dropzone', inputId: 'video-trim-input', browseId: 'video-trim-browse-btn' },
            { id: 'video-merge-dropzone', inputId: 'video-merge-input', browseId: 'video-merge-browse-btn' },
            { id: 'video-audio-dropzone', inputId: 'video-audio-input', browseId: 'video-audio-browse-btn' },
            { id: 'video-compress-dropzone', inputId: 'video-compress-input', browseId: 'video-compress-browse-btn' },
            { id: 'video-subtitles-dropzone', inputId: 'video-subtitles-input', browseId: 'video-subtitles-browse-btn' },
            { id: 'sub-file-dropzone', inputId: 'sub-file-input', browseId: null }
        ];

        dropzoneConfigs.forEach(config => {
            const dropzone = document.getElementById(config.id);
            const input = document.getElementById(config.inputId);
            const browseBtn = config.browseId ? document.getElementById(config.browseId) : null;

            if (!dropzone || !input) return;

            // Click zone to trigger native file dialog
            dropzone.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                    input.click();
                }
            });

            if (browseBtn) {
                browseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    input.click();
                });
            }

            // Drag-over visual effects
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    handleFilesAdded(config.id, e.dataTransfer.files);
                }
            });

            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFilesAdded(config.id, e.target.files);
                    e.target.value = ''; // Reset file input
                }
            });
        });
    }

    // Process files added via dropzones or pickers
    async function handleFilesAdded(zoneId, fileList) {
        try {
            if (zoneId === 'sub-file-dropzone') {
                // Handle Subtitle file
                const file = fileList[0];
                const filePath = electronAPI.getPathForFile(file);
                if (!filePath) return;

                const ext = filePath.split('.').pop().toLowerCase();
                if (!['srt', 'ass', 'vtt'].includes(ext)) {
                    showNotificationToast('Invalid subtitle file. Only .SRT, .ASS, and .VTT are supported.', 'error');
                    return;
                }

                state.subtitleFile = filePath;
                renderSubtitleDetails();
                return;
            }

            if (zoneId === 'video-merge-dropzone') {
                // Merge tab supports adding multiple files
                for (let i = 0; i < fileList.length; i++) {
                    const file = fileList[i];
                    const filePath = electronAPI.getPathForFile(file);
                    if (!filePath) continue;

                    // Fetch metadata for duration
                    const info = await videoAPI.getMediaInfo(filePath);
                    state.mergeFiles.push(info);
                }
                
                renderMergeFileList();
                updateRunButtonState();
                
                // Hide upload zone once files are added, show list
                document.getElementById('video-merge-dropzone').classList.add('hidden');
                document.getElementById('video-merge-list-container').classList.remove('hidden');
                return;
            }

            // Handle primary file dropzones (Trim, Audio, Compress, Subtitles)
            const file = fileList[0];
            const filePath = electronAPI.getPathForFile(file);
            if (!filePath) return;

            // Fetch and parse metadata
            state.primaryFile = filePath;
            const info = await videoAPI.getMediaInfo(filePath);
            state.mediaInfo = info;

            // Update UI elements in active panel
            const activeTab = state.activeTab;
            
            // Render media info card in active panel
            const infoCard = document.getElementById(`video-${activeTab}-info-card`);
            if (infoCard) {
                renderMediaInfoCard(infoCard, info);
            }

            // Hide upload zone and show settings
            document.getElementById(`video-${activeTab}-dropzone`).classList.add('hidden');
            document.getElementById(`video-${activeTab}-settings`).classList.remove('hidden');

            // Set up operation-specific defaults
            setupOperationDefaults(activeTab, info);

            updateRunButtonState();

        } catch (err) {
            console.error('[video-toolkit] File load error:', err);
            showNotificationToast(`Failed to parse video details: ${err.message}`, 'error');
        }
    }

    // --- RENDER HELPERS ---
    function renderMediaInfoCard(container, info) {
        container.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--panel-border); border-radius: 8px;">
                <div style="font-size: 24px; color: var(--accent-color); padding: 5px 12px;"><i class="fa-solid fa-file-video"></i></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--text-main); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${info.fileName}</div>
                    <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 15px; margin-top: 4px; flex-wrap: wrap;">
                        <span><i class="fa-solid fa-hourglass-half"></i> Duration: ${formatTime(info.duration)}</span>
                        <span><i class="fa-solid fa-expand"></i> Resolution: ${info.resolution}</span>
                        <span><i class="fa-solid fa-film"></i> Codec: ${info.videoCodec}</span>
                        <span><i class="fa-solid fa-database"></i> Size: ${formatSize(info.fileSize)}</span>
                    </div>
                </div>
                <button class="icon-btn no-drag remove-file-btn" style="color: var(--text-muted); padding: 8px;" title="Remove File"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;

        // Wire up remove button
        container.querySelector('.remove-file-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            resetActivePanel();
        });
    }

    function renderSubtitleDetails() {
        const subDetails = document.getElementById('selected-subtitle-details');
        const filenameLabel = document.getElementById('subtitle-filename');
        const dropzone = document.getElementById('sub-file-dropzone');

        if (state.subtitleFile) {
            filenameLabel.textContent = state.subtitleFile.split(/[\\/]/).pop();
            subDetails.classList.remove('hidden');
            dropzone.classList.add('hidden');
        } else {
            subDetails.classList.add('hidden');
            dropzone.classList.remove('hidden');
        }
    }

    function resetActivePanel() {
        const activeTab = state.activeTab;
        if (activeTab === 'merge') {
            state.mergeFiles = [];
            document.getElementById('video-merge-dropzone').classList.remove('hidden');
            document.getElementById('video-merge-list-container').classList.add('hidden');
        } else {
            state.primaryFile = null;
            state.mediaInfo = null;
            if (activeTab === 'subtitles') {
                state.subtitleFile = null;
                renderSubtitleDetails();
            }
            document.getElementById(`video-${activeTab}-dropzone`).classList.remove('hidden');
            document.getElementById(`video-${activeTab}-settings`).classList.add('hidden');
        }
        updateRunButtonState();
        clearResultBanner();
    }

    // Set default output file names
    function setupOperationDefaults(tab, info) {
        const nameInput = document.getElementById(`video-${tab}-output-name`);
        if (!nameInput) return;

        const baseName = info.fileName.substring(0, info.fileName.lastIndexOf('.')) || info.fileName;
        
        switch (tab) {
            case 'trim':
                nameInput.value = `${baseName}-trimmed.mp4`;
                // Set dual range slider properties
                const trimStart = document.getElementById('trim-start');
                const trimEnd = document.getElementById('trim-end');
                trimStart.max = info.duration;
                trimEnd.max = info.duration;
                trimStart.value = 0;
                trimEnd.value = info.duration;
                updateTrimLabels();
                break;
            case 'audio':
                const selectedFormat = document.querySelector('#audio-format-pills .pill-btn.active').dataset.format;
                nameInput.value = `${baseName}.${selectedFormat}`;
                break;
            case 'compress':
                nameInput.value = `${baseName}-compressed.mp4`;
                break;
            case 'subtitles':
                nameInput.value = `${baseName}-subtitled.mp4`;
                break;
        }
    }

    // --- FORM SELECTIONS (PILL BUTTONS) ---
    function setupFormListeners() {
        // Audio Format Pills
        const formatPills = document.querySelectorAll('#audio-format-pills .pill-btn');
        const bitrateGroup = document.getElementById('audio-bitrate-group');
        formatPills.forEach(pill => {
            pill.addEventListener('click', () => {
                formatPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const format = pill.dataset.format;
                // Hide bitrate group for WAV/FLAC
                if (format === 'wav' || format === 'flac') {
                    bitrateGroup.classList.add('hidden');
                } else {
                    bitrateGroup.classList.remove('hidden');
                }

                // Update output filename extension
                if (state.mediaInfo) {
                    const baseName = state.mediaInfo.fileName.substring(0, state.mediaInfo.fileName.lastIndexOf('.')) || state.mediaInfo.fileName;
                    document.getElementById('video-audio-output-name').value = `${baseName}.${format}`;
                }
            });
        });

        // Audio Bitrate Pills
        const bitratePills = document.querySelectorAll('#audio-bitrate-pills .pill-btn');
        bitratePills.forEach(pill => {
            pill.addEventListener('click', () => {
                bitratePills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            });
        });

        // Compression Quality Pills
        const qualityPills = document.querySelectorAll('#compress-quality-pills .pill-btn');
        qualityPills.forEach(pill => {
            pill.addEventListener('click', () => {
                qualityPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            });
        });

        // Compression Resolution Pills
        const resPills = document.querySelectorAll('#compress-resolution-pills .pill-btn');
        resPills.forEach(pill => {
            pill.addEventListener('click', () => {
                resPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            });
        });

        // Subtitle remove button
        document.getElementById('remove-subtitle-btn').addEventListener('click', () => {
            state.subtitleFile = null;
            renderSubtitleDetails();
        });

        // Output Directory selection button
        document.getElementById('video-pick-folder-btn').addEventListener('click', async () => {
            const folder = await electronAPI.selectOutputFolder();
            if (folder) {
                state.outputDir = folder;
                document.getElementById('video-output-folder-input').value = folder;
            }
        });

        // Output Directory open button
        document.getElementById('video-open-folder-btn').addEventListener('click', () => {
            if (state.outputDir) {
                electronAPI.openFolder(state.outputDir);
            }
        });
    }

    // --- DUAL-HANDLE TRIM SLIDER SYNC ---
    const MIN_TRIM_GAP_SECS = 1.0; // Minimum 1 second cut size

    function setupTrimSliderSync() {
        const trimStart = document.getElementById('trim-start');
        const trimEnd = document.getElementById('trim-end');

        if (!trimStart || !trimEnd) return;

        trimStart.addEventListener('input', () => {
            let startVal = parseFloat(trimStart.value);
            let endVal = parseFloat(trimEnd.value);

            if (startVal >= endVal - MIN_TRIM_GAP_SECS) {
                trimStart.value = endVal - MIN_TRIM_GAP_SECS;
            }
            updateTrimLabels();
        });

        trimEnd.addEventListener('input', () => {
            let startVal = parseFloat(trimStart.value);
            let endVal = parseFloat(trimEnd.value);

            if (endVal <= startVal + MIN_TRIM_GAP_SECS) {
                trimEnd.value = startVal + MIN_TRIM_GAP_SECS;
            }
            updateTrimLabels();
        });
    }

    function updateTrimLabels() {
        const trimStart = document.getElementById('trim-start');
        const trimEnd = document.getElementById('trim-end');
        const track = document.getElementById('trim-slider-track');
        const startLabel = document.getElementById('trim-start-label');
        const endLabel = document.getElementById('trim-end-label');
        const durationLabel = document.getElementById('trim-duration-label');

        const startVal = parseFloat(trimStart.value);
        const endVal = parseFloat(trimEnd.value);
        const maxVal = parseFloat(trimStart.max) || 100;

        // Sync visual color bar
        const startPercent = (startVal / maxVal) * 100;
        const endPercent = (endVal / maxVal) * 100;

        track.style.setProperty('--start-percent', `${startPercent}%`);
        track.style.setProperty('--end-percent', `${endPercent}%`);

        // Labels
        startLabel.textContent = formatTime(startVal);
        endLabel.textContent = formatTime(endVal);
        
        const duration = endVal - startVal;
        durationLabel.textContent = `Selected: ${duration.toFixed(1)}s`;
    }

    // --- MERGE TAB LIST VIEW (DRAG & DROP SORTABLE) ---
    function renderMergeFileList() {
        const list = document.getElementById('video-merge-list');
        const count = document.getElementById('video-merge-count');
        
        list.innerHTML = '';
        count.textContent = `${state.mergeFiles.length} Videos Selected`;

        if (state.mergeFiles.length === 0) {
            resetActivePanel();
            return;
        }

        state.mergeFiles.forEach((file, index) => {
            const row = document.createElement('div');
            row.className = 'merge-file-row no-drag';
            row.draggable = true;
            row.dataset.index = index;
            row.style.cssText = `
                display: flex; gap: 12px; align-items: center; padding: 10px 14px;
                background: rgba(255, 255, 255, 0.02); border: 1px solid var(--panel-border);
                border-radius: 8px; margin-bottom: 8px; cursor: grab; transition: background 0.2s, border-color 0.2s;
            `;

            row.innerHTML = `
                <div class="drag-handle" style="cursor: grab; color: var(--text-muted); font-size: 14px;"><i class="fa-solid fa-bars"></i></div>
                <span style="font-size: 11px; background: var(--accent-color); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${index + 1}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; font-size: 13px; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.fileName}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px; display: flex; gap: 15px;">
                        <span><i class="fa-solid fa-hourglass-half"></i> Duration: ${formatTime(file.duration)}</span>
                        <span><i class="fa-solid fa-expand"></i> ${file.resolution}</span>
                    </div>
                </div>
                <button class="icon-btn-danger no-drag remove-merge-btn" style="padding: 6px 10px; font-size: 11px;" title="Remove"><i class="fa-solid fa-xmark"></i></button>
            `;

            // Drag events
            row.addEventListener('dragstart', (e) => {
                row.style.opacity = '0.5';
                e.dataTransfer.setData('text/plain', index);
            });

            row.addEventListener('dragend', () => {
                row.style.opacity = '1';
                document.querySelectorAll('.merge-file-row').forEach(r => r.style.borderColor = 'var(--panel-border)');
            });

            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                row.style.borderColor = 'var(--accent-color)';
            });

            row.addEventListener('dragleave', () => {
                row.style.borderColor = 'var(--panel-border)';
            });

            row.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const toIdx = index;
                
                if (fromIdx !== toIdx) {
                    const temp = state.mergeFiles.splice(fromIdx, 1)[0];
                    state.mergeFiles.splice(toIdx, 0, temp);
                    renderMergeFileList();
                }
            });

            // Remove clip handler
            row.querySelector('.remove-merge-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                state.mergeFiles.splice(index, 1);
                renderMergeFileList();
            });

            list.appendChild(row);
        });
    }

    // Clear all merge files
    document.getElementById('video-merge-clear-btn').addEventListener('click', () => {
        resetActivePanel();
    });

    document.getElementById('video-merge-add-more-btn').addEventListener('click', () => {
        document.getElementById('video-merge-input').click();
    });

    // --- ACTIONS BANNERS ---
    function clearResultBanner() {
        const banner = document.getElementById('video-result-banner');
        banner.classList.add('hidden');
    }

    function showResultSuccess(msg, outPath) {
        const banner = document.getElementById('video-result-banner');
        const icon = document.getElementById('video-result-icon');
        const text = document.getElementById('video-result-text');
        const actions = document.getElementById('video-result-actions');

        banner.className = 'video-result-banner-success'; // customized via CSS
        banner.style.cssText = `
            margin-top: 20px; padding: 15px; border-radius: 8px; font-size: 13px; display: flex; flex-direction: column; gap: 10px;
            background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #86efac;
        `;

        icon.className = 'fa-solid fa-circle-check';
        icon.style.color = '#22c55e';
        text.innerHTML = `<strong>Success!</strong> ${msg}`;
        actions.classList.remove('hidden');
        banner.classList.remove('hidden');

        // Open folder action
        const folderLink = document.getElementById('video-result-open-folder');
        folderLink.onclick = (e) => {
            e.preventDefault();
            if (outPath) {
                electronAPI.openFolder(outPath.substring(0, outPath.lastIndexOf('\\')) || state.outputDir);
            } else {
                electronAPI.openFolder(state.outputDir);
            }
        };
    }

    function showResultError(msg) {
        const banner = document.getElementById('video-result-banner');
        const icon = document.getElementById('video-result-icon');
        const text = document.getElementById('video-result-text');
        const actions = document.getElementById('video-result-actions');

        banner.style.cssText = `
            margin-top: 20px; padding: 15px; border-radius: 8px; font-size: 13px; display: flex; flex-direction: column; gap: 10px;
            background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5;
        `;

        icon.className = 'fa-solid fa-circle-exclamation';
        icon.style.color = '#ef4444';
        text.innerHTML = `<strong>Error:</strong> ${msg}`;
        actions.classList.add('hidden');
        banner.classList.remove('hidden');
    }

    // --- JOB EXECUTION FLOW ---

    async function executeJob() {
        if (!state.outputDir) {
            showNotificationToast('Please select a valid output folder.', 'error');
            return;
        }

        const tab = state.activeTab;
        const outNameInput = document.getElementById(`video-${tab}-output-name`);
        const outName = outNameInput ? outNameInput.value.trim() : '';

        if (!outName) {
            showNotificationToast('Please specify an output filename.', 'error');
            return;
        }

        const outputPath = state.outputDir + '\\' + outName;
        clearResultBanner();

        let apiCall = null;
        let options = {
            outputPath,
        };

        if (tab === 'trim') {
            const startSecs = parseFloat(document.getElementById('trim-start').value);
            const endSecs = parseFloat(document.getElementById('trim-end').value);
            const reencode = document.getElementById('trim-reencode-checkbox').checked;

            apiCall = videoAPI.trim;
            options.inputPath = state.primaryFile;
            options.startTime = startSecs;
            options.endTime = endSecs;
            options.reencode = reencode;
        } else if (tab === 'merge') {
            const paths = state.mergeFiles.map(f => f.filePath);
            const sumDuration = state.mergeFiles.reduce((acc, f) => acc + f.duration, 0);

            apiCall = videoAPI.merge;
            options.inputPaths = paths;
            options.totalDuration = sumDuration;
        } else if (tab === 'audio') {
            const format = document.querySelector('#audio-format-pills .pill-btn.active').dataset.format;
            const bitrate = document.querySelector('#audio-bitrate-pills .pill-btn.active').dataset.bitrate;

            apiCall = videoAPI.extractAudio;
            options.inputPath = state.primaryFile;
            options.format = format;
            options.bitrate = bitrate;
            options.duration = state.mediaInfo.duration;
        } else if (tab === 'compress') {
            const quality = document.querySelector('#compress-quality-pills .pill-btn.active').dataset.quality;
            const resolution = document.querySelector('#compress-resolution-pills .pill-btn.active').dataset.res;

            apiCall = videoAPI.compress;
            options.inputPath = state.primaryFile;
            options.quality = quality;
            options.resolution = resolution;
            options.duration = state.mediaInfo.duration;
        } else if (tab === 'subtitles') {
            if (!state.subtitleFile) {
                showNotificationToast('Please drop a subtitle file (.srt, .ass, or .vtt) first.', 'error');
                return;
            }

            apiCall = videoAPI.hardcodeSubtitles;
            options.inputPath = state.primaryFile;
            options.subtitlePath = state.subtitleFile;
            options.duration = state.mediaInfo.duration;
        }

        if (!apiCall) return;

        const jobId = generateUUID();
        state.activeJobId = jobId;
        options.jobId = jobId;

        // UI transition to active job status state
        showJobProgressUI(tab);

        // Store local reference for listening
        registerProgressUpdates();

        try {
            // Trigger Operation
            const response = await apiCall(options);
            
            if (response.success) {
                handleJobFinished(jobId, true);
            } else {
                handleJobFinished(jobId, false, response.error || 'Operation failed.');
            }
        } catch (err) {
            console.error('[video-toolkit] Execution error:', err);
            handleJobFinished(jobId, false, err.message || 'An unexpected error occurred.');
        }
    }

    function showJobProgressUI(tab) {
        // Disable run buttons
        ['trim', 'merge', 'audio', 'compress', 'subtitles'].forEach(t => {
            const btn = document.getElementById(`video-${t}-run-btn`);
            if (btn) btn.disabled = true;
        });
        
        // Show status panel
        const statusPanel = document.getElementById('video-job-status-panel');
        statusPanel.classList.remove('hidden');

        // Reset progress bar
        document.getElementById('video-job-progress-fill').style.width = '0%';
        document.getElementById('video-job-percent-label').textContent = '0%';
        
        const labelMap = {
            trim: 'Trimming Video clip...',
            merge: 'Merging multiple Clips...',
            audio: 'Extracting audio Track...',
            compress: 'Compressing video File...',
            subtitles: 'Burning subtitle overlays...'
        };
        document.getElementById('video-job-operation-label').textContent = labelMap[tab] || 'Processing Video...';
        document.getElementById('video-job-status-msg').textContent = 'Spawning FFmpeg engine...';
    }

    function hideJobProgressUI() {
        document.getElementById('video-job-status-panel').classList.add('hidden');
        // Enable run buttons
        ['trim', 'merge', 'audio', 'compress', 'subtitles'].forEach(t => {
            const btn = document.getElementById(`video-${t}-run-btn`);
            if (btn) btn.disabled = false;
        });
        updateRunButtonState();
    }

    // --- PROGRESS LISTENER & EVENT SYNC ---
    function registerProgressUpdates() {
        if (progressListenerRegistered) return;

        videoAPI.onProgress((data) => {
            const { jobId, percent, operation, estimatedReduction } = data;
            
            if (jobId === state.activeJobId) {
                // Update active panel progress UI
                document.getElementById('video-job-progress-fill').style.setProperty('width', `${percent}%`);
                document.getElementById('video-job-percent-label').textContent = `${Math.round(percent)}%`;

                let msg = `Processing frame timeline...`;
                if (estimatedReduction) {
                    msg = `Encoding frames... (Est. size reduction: ${estimatedReduction})`;
                }
                document.getElementById('video-job-status-msg').textContent = msg;
            }

            // Sync sidebar jobs progress bar
            syncSidebarJobs();
        });

        progressListenerRegistered = true;
    }

    async function handleJobFinished(jobId, success, errorMsg = null) {
        if (state.activeJobId === jobId) {
            state.activeJobId = null;
            hideJobProgressUI();
            
            if (success) {
                const tab = state.activeTab;
                const outName = document.getElementById(`video-${tab}-output-name`).value;
                const outPath = state.outputDir + '\\' + outName;
                
                showResultSuccess(`Successfully completed operation. Output saved to: ${outPath}`, outPath);
                showNotificationToast('Video operation completed successfully!', 'success');
            } else {
                showResultError(errorMsg || 'Operation failed or cancelled.');
                showNotificationToast('Video operation failed.', 'error');
            }
        }

        // Clean up progress listener wrapper mapping
        videoAPI.offProgress();
        progressListenerRegistered = false;

        // Reload lists
        syncSidebarJobs();
    }

    // Wire up run buttons in sidebar sections
    ['trim', 'merge', 'audio', 'compress', 'subtitles'].forEach(tab => {
        const btn = document.getElementById(`video-${tab}-run-btn`);
        if (btn) {
            btn.addEventListener('click', () => {
                executeJob();
            });
        }
    });

    // Wire up cancel button in active job panel
    document.getElementById('video-job-cancel-btn').addEventListener('click', async () => {
        if (state.activeJobId) {
            const success = await videoAPI.cancel(state.activeJobId);
            if (success) {
                handleJobFinished(state.activeJobId, false, 'Operation cancelled by user.');
            }
        }
    });

    async function setupProgressPolling() {
        try {
            const active = await videoAPI.getActiveJobs();
            if (active && active.length > 0) {
                const job = active[0];
                state.activeJobId = job.jobId;
                showJobProgressUI(job.operation.toLowerCase().replace(' ', ''));
                registerProgressUpdates();
            }
        } catch (e) {
            console.error('Failed to sync active jobs:', e);
        }
    }

    // --- ACTIVE & RECENT JOBS SIDEBAR REMOVED ---
    async function syncSidebarJobs() {
        // No-op (jobs sidebar replaced by settings sidebar to match Image Toolkit)
    }

    // Auto run initialization
    init();
})();

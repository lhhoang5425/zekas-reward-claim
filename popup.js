/**
 * Zekas Reward Claim - Popup Logic
 * Bản quyền Zekas - Tự động claim điểm Microsoft Bing Rewards
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Main Actions
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const dailySetBtn = document.getElementById('dailySetBtn');
    const statusBadge = document.getElementById('statusBadge');
    const licenseAlert = document.getElementById('licenseAlert');

    // Progress Elements
    const progressCount = document.getElementById('progressCount');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressETA = document.getElementById('progressETA');

    // Stats Elements
    const usedKeywords = document.getElementById('usedKeywords');
    const totalKeywords = document.getElementById('totalKeywords');
    const keywordPoolInfo = document.getElementById('keywordPoolInfo');

    // Settings - Inputs & Containers
    const searchCount = document.getElementById('searchCount');
    const desktopCountItem = document.getElementById('desktopCountItem');
    const searchCountLabel = document.getElementById('searchCountLabel');
    const mobileSearchCount = document.getElementById('mobileSearchCount');
    const mobileCountItem = document.getElementById('mobileCountItem');
    const searchDelayMin = document.getElementById('searchDelayMin');
    const searchDelayMax = document.getElementById('searchDelayMax');
    const tabCloseDelayMin = document.getElementById('tabCloseDelayMin');
    const tabCloseDelayMax = document.getElementById('tabCloseDelayMax');

    // Mode & Option Buttons
    const modeBtns = document.querySelectorAll('[data-mode]');
    const modeBadge = document.getElementById('modeBadge');
    const modeBadgeText = document.getElementById('modeBadgeText');
    const styleBtns = document.querySelectorAll('[data-style]');
    const tabBtns = document.querySelectorAll('[data-tab]');
    const dailyBtns = document.querySelectorAll('[data-daily]');
    const farmBtns = document.querySelectorAll('[data-farm]');
    const langBtns = document.querySelectorAll('[data-lang]');
    const ratioItem = document.getElementById('ratioItem');
    const viRatio = document.getElementById('viRatio');
    const enRatio = document.getElementById('enRatio');

    // Increment/Decrement Buttons
    const searchCountDown = document.getElementById('searchCountDown');
    const searchCountUp = document.getElementById('searchCountUp');
    const mobileCountDown = document.getElementById('mobileCountDown');
    const mobileCountUp = document.getElementById('mobileCountUp');
    const searchDelayMinDown = document.getElementById('searchDelayMinDown');
    const searchDelayMinUp = document.getElementById('searchDelayMinUp');
    const searchDelayMaxDown = document.getElementById('searchDelayMaxDown');
    const searchDelayMaxUp = document.getElementById('searchDelayMaxUp');
    const tabCloseDelayMinDown = document.getElementById('tabCloseDelayMinDown');
    const tabCloseDelayMinUp = document.getElementById('tabCloseDelayMinUp');
    const tabCloseDelayMaxDown = document.getElementById('tabCloseDelayMaxDown');
    const tabCloseDelayMaxUp = document.getElementById('tabCloseDelayMaxUp');

    // Custom Modal Elements
    const customModal = document.getElementById('customModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');

    // Active state
    let currentMode = 'desktop';
    let currentStyle = 'typing';
    let currentTab = 'active';
    let currentDaily = 'off';
    let currentFarm = 'off';
    let currentLang = 'both';
    let isAppRunning = false;

    // Toast notification
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2200);
    }

    // Custom Modal Confirmation (replaces ugly native confirm)
    function showConfirmModal({ title, message, iconType, confirmText, isWarning = true, onConfirm }) {
        if (!customModal) {
            if (confirm(message)) onConfirm && onConfirm();
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalConfirmBtn.textContent = confirmText || 'Xác nhận';

        if (iconType === 'trash' || isWarning) {
            modalIcon.className = 'modal-icon-wrapper warning';
            modalConfirmBtn.className = 'modal-btn modal-btn-confirm';
            modalIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 16h4v2h-4v-2zm0-8h7v2h-7V8zm0 4h6v2h-6v-2zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12V5z" fill="currentColor"/></svg>`;
        } else {
            modalIcon.className = 'modal-icon-wrapper info';
            modalConfirmBtn.className = 'modal-btn modal-btn-confirm info';
            modalIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>`;
        }

        customModal.classList.remove('hidden');

        const cleanup = () => {
            customModal.classList.add('hidden');
            modalConfirmBtn.onclick = null;
            modalCancelBtn.onclick = null;
            customModal.onclick = null;
        };

        modalConfirmBtn.onclick = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };

        modalCancelBtn.onclick = cleanup;
        customModal.onclick = (e) => {
            if (e.target === customModal) cleanup();
        };
    }

    // Format Seconds to string mm:ss
    function formatTime(seconds) {
        if (seconds < 60) return Math.round(seconds) + 's';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    // Ensure min <= max
    function syncMinMax(minInput, maxInput) {
        const minVal = parseInt(minInput.value) || 1;
        const maxVal = parseInt(maxInput.value) || 1;
        if (minVal > maxVal) {
            maxInput.value = minVal;
        }
    }

    // Set UI Controls Disabled State
    function setControlsDisabled(disabled) {
        searchCount.disabled = disabled;
        mobileSearchCount.disabled = disabled;
        searchDelayMin.disabled = disabled;
        searchDelayMax.disabled = disabled;
        tabCloseDelayMin.disabled = disabled;
        tabCloseDelayMax.disabled = disabled;
        viRatio.disabled = disabled;
        enRatio.disabled = disabled;

        modeBtns.forEach(btn => btn.disabled = disabled);
        styleBtns.forEach(btn => btn.disabled = disabled);
        tabBtns.forEach(btn => btn.disabled = disabled);
        dailyBtns.forEach(btn => btn.disabled = disabled);
        farmBtns.forEach(btn => btn.disabled = disabled);
        langBtns.forEach(btn => btn.disabled = disabled);

        if (dailySetBtn) dailySetBtn.disabled = disabled;
        if (resetBtn) resetBtn.disabled = disabled;
        if (clearCacheBtn) clearCacheBtn.disabled = disabled;

        document.querySelectorAll('.btn-adjust').forEach(btn => {
            btn.disabled = disabled;
            btn.style.opacity = disabled ? '0.4' : '1';
            btn.style.pointerEvents = disabled ? 'none' : 'auto';
        });
    }

    // Collect settings object from inputs
    function getSettings() {
        syncMinMax(searchDelayMin, searchDelayMax);
        syncMinMax(tabCloseDelayMin, tabCloseDelayMax);

        return {
            searchCount: parseInt(searchCount.value) || 30,
            mobileSearchCount: parseInt(mobileSearchCount.value) || 20,
            searchDelayMin: (parseInt(searchDelayMin.value) || 7) * 1000,
            searchDelayMax: (parseInt(searchDelayMax.value) || 12) * 1000,
            tabCloseDelayMin: (parseInt(tabCloseDelayMin.value) || 3) * 1000,
            tabCloseDelayMax: (parseInt(tabCloseDelayMax.value) || 6) * 1000,
            searchMode: currentMode,
            searchStyle: currentStyle,
            tabActive: currentTab === 'active',
            autoDailySet: currentDaily === 'on',
            farmMode: currentFarm === 'on',
            keywordLang: currentLang,
            viRatio: parseInt(viRatio.value) || 7,
            enRatio: parseInt(enRatio.value) || 3
        };
    }

    // Save settings to background
    function saveSettings(settingsObj) {
        const settings = (settingsObj instanceof Event) ? getSettings() : (settingsObj || getSettings());
        chrome.runtime.sendMessage({
            type: 'UPDATE_SETTINGS',
            settings
        });
    }

    // Mode Selector Handler
    function setMode(mode) {
        currentMode = mode;
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        if (mode === 'both') {
            mobileCountItem.classList.remove('hidden');
            desktopCountItem.textContent = '';
            desktopCountItem.appendChild(searchCountLabel.parentElement);
            desktopCountItem.appendChild(searchCountDown.parentElement);
            searchCountLabel.textContent = '💻 Số lần Desktop';
        } else {
            mobileCountItem.classList.add('hidden');
            searchCountLabel.textContent = 'Số lần tìm kiếm';
        }

        if (modeBadge) {
            modeBadge.className = 'mode-badge';
            if (mode === 'desktop') {
                modeBadge.classList.add('hidden');
            } else if (mode === 'mobile') {
                modeBadge.classList.remove('hidden');
                modeBadge.classList.add('mode-mobile');
                if (modeBadgeText) modeBadgeText.textContent = 'Chế độ Mobile (iOS)';
            } else if (mode === 'both') {
                modeBadge.classList.remove('hidden');
                modeBadge.classList.add('mode-both');
                if (modeBadgeText) modeBadgeText.textContent = 'Chế độ kết hợp (PC + Mobile)';
            }
        }
    }

    // Style Selector Handler
    function setStyle(style) {
        currentStyle = style;
        styleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === style);
        });
    }

    // Tab Visibility Selector Handler
    function setTabVisibility(tab) {
        currentTab = tab;
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
    }

    // Daily Set Selector Handler
    function setDailySet(daily) {
        currentDaily = daily;
        dailyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.daily === daily);
        });
    }

    // Farm Mode Selector Handler
    function setFarmMode(farm) {
        currentFarm = farm;
        farmBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.farm === farm);
        });
    }

    // Lang Selector Handler
    function setLang(lang) {
        currentLang = lang;
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        if (lang === 'custom') {
            ratioItem.classList.remove('hidden');
        } else {
            ratioItem.classList.add('hidden');
        }
    }

    // Update UI from Background State
    function updateUI(state) {
        if (!state) return;

        const activeEl = document.activeElement;
        const isEditingInput = activeEl && activeEl.tagName === 'INPUT';

        // Load settings if not typing
        if (state.settings && !isEditingInput) {
            searchCount.value = state.settings.searchCount ?? 30;
            mobileSearchCount.value = state.settings.mobileSearchCount ?? 20;
            searchDelayMin.value = Math.round((state.settings.searchDelayMin ?? 7000) / 1000);
            searchDelayMax.value = Math.round((state.settings.searchDelayMax ?? 12000) / 1000);
            tabCloseDelayMin.value = Math.round((state.settings.tabCloseDelayMin ?? 3000) / 1000);
            tabCloseDelayMax.value = Math.round((state.settings.tabCloseDelayMax ?? 6000) / 1000);

            setMode(state.settings.searchMode || 'desktop');
            setStyle(state.settings.searchStyle || 'typing');
            setTabVisibility(state.settings.tabActive === false ? 'background' : 'active');
            setDailySet(state.settings.autoDailySet ? 'on' : 'off');
            setFarmMode(state.settings.farmMode ? 'on' : 'off');
            setLang(state.settings.keywordLang || 'both');

            viRatio.value = state.settings.viRatio ?? 7;
            enRatio.value = state.settings.enRatio ?? 3;
        }

        // Progress Calculation
        const currentSearch = state.currentSearch || 0;
        const total = state.totalSearches || state.settings?.searchCount || 30;
        const currentPhase = state.currentPhase || 'desktop';
        const mode = state.settings?.searchMode || 'desktop';

        if (mode === 'both' && state.isRunning) {
            const phaseLabel = currentPhase === 'desktop' ? '💻 Desktop' : '📱 Mobile';
            progressCount.textContent = `${phaseLabel}: ${currentSearch} / ${total}`;
            if (modeBadge) {
                modeBadge.className = 'mode-badge';
                modeBadge.classList.remove('hidden');
                if (currentPhase === 'desktop') {
                    if (modeBadgeText) modeBadgeText.textContent = '💻 Đang search Desktop... → Mobile tiếp theo';
                } else {
                    modeBadge.classList.add('mode-mobile');
                    if (modeBadgeText) modeBadgeText.textContent = '📱 Đang search Mobile (iOS Spoof)...';
                }
            }
        } else {
            progressCount.textContent = `${currentSearch} / ${total}`;
        }

        const pct = total > 0 ? Math.round((currentSearch / total) * 100) : 0;
        progressFill.style.width = pct + '%';
        progressPercent.textContent = pct + '%';

        // ETA calculation
        if (state.isRunning && currentSearch < total) {
            const remaining = total - currentSearch;
            const avgSearchDelay = ((state.settings?.searchDelayMin || 7000) + (state.settings?.searchDelayMax || 12000)) / 2 / 1000;
            const avgTabClose = ((state.settings?.tabCloseDelayMin || 3000) + (state.settings?.tabCloseDelayMax || 6000)) / 2 / 1000;
            const stepBuffer = 10;
            let totalRemainingSec = remaining * (avgSearchDelay + avgTabClose + stepBuffer);

            if (mode === 'both' && currentPhase === 'desktop') {
                const mobCount = state.settings?.mobileSearchCount || 20;
                totalRemainingSec += mobCount * (avgSearchDelay + avgTabClose + stepBuffer);
            }
            progressETA.textContent = '~' + formatTime(totalRemainingSec);
        } else if (!state.isRunning && currentSearch >= total && total > 0) {
            progressETA.textContent = 'Hoàn thành! ✅';
        } else {
            progressETA.textContent = '--';
        }

        // Stats
        usedKeywords.textContent = state.usedKeywordsCount || state.usedKeywords?.length || 0;
        const totalPool = state.totalKeywords || 0;
        totalKeywords.textContent = totalPool > 0 ? totalPool.toLocaleString() + '+' : '47,888+';

        if (keywordPoolInfo) {
            keywordPoolInfo.textContent = 'Kho: ' + (totalPool > 0 ? totalPool.toLocaleString() : '47,888') + '+ tổ hợp';
        }

        // Running / Stopped UI State
        isAppRunning = !!state.isRunning;
        if (state.isRunning) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            statusBadge.classList.add('running');

            let statusText = 'Đang tìm...';
            if (state.isDetectingRank) {
                statusText = 'Quét hạng...';
            } else if (mode === 'mobile') {
                statusText = 'Mobile...';
            } else if (mode === 'both') {
                statusText = currentPhase === 'desktop' ? 'Desktop...' : 'Mobile...';
            }
            statusBadge.querySelector('.status-text').textContent = statusText;
            setControlsDisabled(true);
        } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
            statusBadge.classList.remove('running');
            statusBadge.querySelector('.status-text').textContent = 'Sẵn sàng';
            setControlsDisabled(false);
        }
    }

    // Refresh state from background
    function checkStatus() {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
            if (res) updateUI(res);
        });
    }

    // Button event - Start
    startBtn.addEventListener('click', () => {
        const settings = getSettings();
        saveSettings(settings);
        chrome.runtime.sendMessage({
            type: 'START_SEARCH',
            settings
        }, (res) => {
            if (res?.success) {
                const modeIcon = currentMode === 'desktop' ? '💻' : (currentMode === 'mobile' ? '📱' : '🔄');
                const extraNote = currentMode === 'both' ? ` (Desktop: ${searchCount.value} + Mobile: ${mobileSearchCount.value})` : '';
                showToast(`${modeIcon} Bắt đầu cày điểm Rewards!${extraNote}`, 'success');
                checkStatus();
            }
        });
    });

    // Button event - Stop
    stopBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'STOP_SEARCH' }, (res) => {
            if (res?.success) {
                showToast('🛑 Đã dừng tiến trình tìm kiếm.', 'error');
                checkStatus();
            }
        });
    });

    // Button event - Reset Keywords (Custom Modal)
    resetBtn.addEventListener('click', () => {
        showConfirmModal({
            title: 'Khôi phục kho từ khóa',
            message: 'Bạn có chắc chắn muốn làm mới kho từ khóa? Toàn bộ lịch sử từ khóa đã dùng sẽ được giải phóng để cày lại từ đầu.',
            iconType: 'refresh',
            isWarning: false,
            confirmText: '🔄 Khôi phục ngay',
            onConfirm: () => {
                chrome.runtime.sendMessage({ type: 'RESET_KEYWORDS' }, (res) => {
                    if (res?.success) {
                        showToast('✨ Đã khôi phục toàn bộ kho từ khóa!', 'success');
                        checkStatus();
                    }
                });
            }
        });
    });

    // Button event - Clear Cache (Custom Modal)
    clearCacheBtn.addEventListener('click', () => {
        showConfirmModal({
            title: 'Dọn rác & Cookie Cache Bing',
            message: 'Dọn dẹp sạch sẽ bộ nhớ Cache & Cookie Bing giúp giải phóng RAM và tránh bị Microsoft theo dõi. (Lưu ý: Có thể cần đăng nhập lại tài khoản Microsoft).',
            iconType: 'trash',
            isWarning: true,
            confirmText: '🧹 Dọn dẹp ngay',
            onConfirm: () => {
                chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, (res) => {
                    if (res?.success) {
                        showToast('🧹 Đã dọn sạch Cache & Cookie thành công!', 'success');
                    }
                });
            }
        });
    });

    // Button event - Daily Set
    dailySetBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'DO_DAILY_SET' });
        showToast('🎁 Đang mở và tự động hoàn thành Daily Set...', 'success');
    });

    // Setup Mode Buttons
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            setMode(mode);
            saveSettings();
            const notices = {
                'desktop': '💻 Chế độ Desktop',
                'mobile': '📱 Chế độ Mobile',
                'both': '🔄 Cả hai: Desktop + Mobile'
            };
            showToast(notices[mode]);
        });
    });

    // Setup Style Buttons
    styleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            setStyle(style);
            saveSettings();
            const notices = {
                'typing': '⌨️ Gõ tự nhiên từng ký tự',
                'direct': '⚡ Tìm thẳng qua URL nhanh'
            };
            showToast(notices[style]);
        });
    });

    // Setup Tab Visibility Buttons
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            setTabVisibility(tab);
            saveSettings();
            const notices = {
                'active': '👁 Xem tab — hiển thị tab tìm kiếm',
                'background': '🔇 Chạy nền — không nhảy tab'
            };
            showToast(notices[tab]);
        });
    });

    // Setup Daily Set Buttons
    dailyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const daily = btn.dataset.daily;
            setDailySet(daily);
            saveSettings();
            showToast(daily === 'on' ? '✅ Bật: Tự làm Daily Set trước khi tìm kiếm' : '❌ Tắt tính năng tự húp Daily Set');
        });
    });

    // Setup Farm Mode Buttons
    farmBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const farm = btn.dataset.farm;
            setFarmMode(farm);
            saveSettings();
            showToast(farm === 'on' ? '🤖 Bật Chế Độ Auto Farm' : '🛡 Chế độ thường');
        });
    });

    // Setup Lang Buttons
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLang(lang);
            saveSettings();
            const notices = {
                'en': '🇬🇧 Chỉ dùng từ khóa tiếng Anh',
                'vi': '🇻🇳 Chỉ dùng từ khóa tiếng Việt',
                'both': '🌐 Pha trộn cả tiếng Anh và tiếng Việt',
                'custom': `📊 Tỉ lệ VN:EN = ${viRatio.value}:${enRatio.value}`
            };
            showToast(notices[lang]);
        });
    });

    // Numeric +/- Helpers
    function attachCounter(downBtn, upBtn, inputEl, min, max, step = 1) {
        downBtn.addEventListener('click', () => {
            const val = parseInt(inputEl.value) || 0;
            if (val > min) {
                inputEl.value = val - step;
                saveSettings();
            }
        });
        upBtn.addEventListener('click', () => {
            const val = parseInt(inputEl.value) || 0;
            if (val < max) {
                inputEl.value = val + step;
                saveSettings();
            }
        });
    }

    attachCounter(searchCountDown, searchCountUp, searchCount, 1, 100);
    attachCounter(mobileCountDown, mobileCountUp, mobileSearchCount, 1, 100);

    function attachRangeAdjuster(btn, input, delta, min, max, pairMin, pairMax) {
        btn.addEventListener('click', () => {
            const val = parseInt(input.value) || 1;
            const next = val + delta;
            if (next >= min && next <= max) {
                input.value = next;
                if (pairMin && pairMax) syncMinMax(pairMin, pairMax);
                saveSettings();
            }
        });
    }

    attachRangeAdjuster(searchDelayMinDown, searchDelayMin, -1, 1, 60, searchDelayMin, searchDelayMax);
    attachRangeAdjuster(searchDelayMinUp, searchDelayMin, 1, 1, 60, searchDelayMin, searchDelayMax);
    attachRangeAdjuster(searchDelayMaxDown, searchDelayMax, -1, 1, 60, searchDelayMin, searchDelayMax);
    attachRangeAdjuster(searchDelayMaxUp, searchDelayMax, 1, 1, 60, searchDelayMin, searchDelayMax);

    attachRangeAdjuster(tabCloseDelayMinDown, tabCloseDelayMin, -1, 1, 120, tabCloseDelayMin, tabCloseDelayMax);
    attachRangeAdjuster(tabCloseDelayMinUp, tabCloseDelayMin, 1, 1, 120, tabCloseDelayMin, tabCloseDelayMax);
    attachRangeAdjuster(tabCloseDelayMaxDown, tabCloseDelayMax, -1, 1, 120, tabCloseDelayMin, tabCloseDelayMax);
    attachRangeAdjuster(tabCloseDelayMaxUp, tabCloseDelayMax, 1, 1, 120, tabCloseDelayMin, tabCloseDelayMax);

    // Save on direct input change
    [searchCount, mobileSearchCount, searchDelayMin, searchDelayMax, tabCloseDelayMin, tabCloseDelayMax, viRatio, enRatio].forEach(input => {
        input.addEventListener('input', () => saveSettings());
    });

    // Listen to background messages
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'STATUS_UPDATE') {
            updateUI(msg.data);
        } else if (msg.type === 'ERROR') {
            showToast('❌ ' + msg.message, 'error');
            checkStatus();
        }
    });

    // Initial check
    checkStatus();
    setInterval(checkStatus, 2000);
});
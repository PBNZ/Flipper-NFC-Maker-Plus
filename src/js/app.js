/**
 * @file app.js
 * @description Main UI logic, event handlers, and theme management for
 *              Flipper NFC Maker Plus. Orchestrates user input, NFC tag
 *              generation via nfc-generator.js, and file download.
 *
 * Original work Copyright (c) jaylikesbunda
 * Modifications Copyright (c) PBNZ 2026
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ========================================================================
     * SECTION: DOM References
     * ===================================================================== */

    const tagTypeSelect = document.getElementById('tagType');
    const nfcTagTypeRadios = document.querySelectorAll('input[name="nfcTagType"]');
    const generateButton = document.getElementById('generateButton');
    const outputSection = document.getElementById('outputSection');
    const nfcDataOutput = document.getElementById('nfcData');
    const downloadButton = document.getElementById('downloadButton');
    const themeToggle = document.getElementById('themeToggle');

    const inputFieldsContainer = document.getElementById('inputFields');
    const allInputGroups = inputFieldsContainer.querySelectorAll('.data-field');

    // --- Capacity Display ---
    const globalCapacitySection = document.getElementById('globalCapacitySection');
    const globalCapacityBar = document.getElementById('globalCapacityBar');
    const globalCapacityText = document.getElementById('globalCapacityText');
    const capacityWarning = document.getElementById('capacityWarning');

    // --- vCard Wizard ---
    const vcardCompatRadios = document.querySelectorAll('input[name="vcardCompatMode"]');
    const vcardUrlGroup = document.getElementById('vcardUrlGroup');

    const vcardModeRadios = document.querySelectorAll('input[name="vcardInputMode"]');
    const vcardModePanels = {
        paste: document.getElementById('vcardModePaste'),
        scratch: document.getElementById('vcardEditorForm')
    };

    const vcardHostedUrlInput = document.getElementById('vcardHostedUrlInput');
    const vcardFetchButton = document.getElementById('vcardFetchButton');
    const vcardPasteTextarea = document.getElementById('vcardPasteTextarea');
    const vcardProcessPasteBtn = document.getElementById('vcardProcessPasteBtn');

    const vcardSectionsContainer = document.getElementById('vcardSectionsContainer');
    const vcardVersionSelect = document.getElementById('vcardVersionSelect');
    const vcardCheckStatus = document.getElementById('vcardCheckStatus');
    const vcardOptimizeBtn = document.getElementById('vcardOptimizeBtn');
    const vcardUndoBtn = document.getElementById('vcardUndoBtn');
    const vcardClearBtn = document.getElementById('vcardClearBtn');
    const downloadVcfBtn = document.getElementById('downloadVcfBtn');

    /** Map of standard input elements */
    const inputs = {
        urlInput: document.getElementById('urlInput'),
        textInput: document.getElementById('textInput'),
        phoneInput: document.getElementById('phoneInput'),
        emailInput: document.getElementById('emailInput'),
        ssidInput: document.getElementById('ssidInput'),
        passwordInput: document.getElementById('passwordInput'),
        authTypeSelect: document.getElementById('authTypeSelect'),
        latitudeInput: document.getElementById('latitudeInput'),
        longitudeInput: document.getElementById('longitudeInput'),
        smsNumberInput: document.getElementById('smsNumberInput'),
        smsBodyInput: document.getElementById('smsBodyInput'),
        packageNameInput: document.getElementById('packageNameInput'),
        mimeTypeInput: document.getElementById('mimeTypeInput'),
        mimeDataInput: document.getElementById('mimeDataInput'),
        facetimeInput: document.getElementById('facetimeInput'),
        addressInput: document.getElementById('addressInput'),
        homeKitCodeInput: document.getElementById('homeKitCodeInput'),
        filenameInput: document.getElementById('filenameInput')
    };

    let lastInputData = '';
    let flipperSerial = null;
    let currentVcardProps = []; // { key: string, param: string, value: string }
    let currentVcardPropsHistory = null; // Store for Undo
    let activeVcardMode = 'scratch';

    /* ========================================================================
     * SECTION: Theme Management
     * ===================================================================== */

    /**
     * Initialise theme based on: saved preference > system preference > dark default.
     */
    function initTheme() {
        const saved = localStorage.getItem('theme');
        const html = document.documentElement;

        if (saved) {
            html.setAttribute('data-theme', saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            html.setAttribute('data-theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
        }
        updateThemeToggleText();
    }

    /** Update the theme toggle button text to reflect current state. */
    function updateThemeToggleText() {
        if (!themeToggle) return;
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        themeToggle.textContent = current === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeToggleText();
        });
    }

    initTheme();

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                updateThemeToggleText();
            }
        });
    }

    /* ========================================================================
     * SECTION: Input Field Visibility
     * ===================================================================== */

    function getSelectedNfcTagType() {
        const selected = document.querySelector('input[name="nfcTagType"]:checked');
        return selected ? selected.value : 'NTAG216';
    }

    function handleTagTypeChange() {
        const tagType = getSelectedNfcTagType();
        const compatContainer = document.getElementById('vcardCompatContainer');
        const urlGroup = document.getElementById('vcardUrlGroup');
        const requiredBadge = urlGroup ? urlGroup.querySelector('.required-badge') : null;
        const fieldHint = urlGroup ? urlGroup.querySelector('.field-hint') : null;

        if (tagType === 'VCARD_EDIT') {
            tagTypeSelect.value = 'Contact';
            Array.from(tagTypeSelect.options).forEach(opt => {
                opt.disabled = opt.value !== 'Contact';
            });
            globalCapacitySection.style.display = 'none';
            // Hide compat toggle — no NFC tag being created
            if (compatContainer) compatContainer.style.display = 'none';
            // URL stays for importing, but remove Required indicator and helper
            if (requiredBadge) requiredBadge.style.display = 'none';
            if (fieldHint) fieldHint.style.display = 'none';
            // Ensure URL group is visible for fetching
            if (urlGroup) urlGroup.style.display = 'block';
        } else {
            Array.from(tagTypeSelect.options).forEach(opt => opt.disabled = false);
            globalCapacitySection.style.display = 'block';
            // Restore compat toggle
            if (compatContainer) compatContainer.style.display = '';
            // Restore Required badge and helper text
            if (requiredBadge) requiredBadge.style.display = '';
            if (fieldHint) fieldHint.style.display = '';
        }
        showRelevantInputs();
        updateCapacityDisplay();
    }

    function showRelevantInputs() {
        const selectedType = tagTypeSelect.value;
        const nfcTagType = getSelectedNfcTagType();

        // Hide all standard input groups
        allInputGroups.forEach(group => group.style.display = 'none');

        // Show groups matching the selected type
        allInputGroups.forEach(group => {
            const types = group.getAttribute('data-type').split(' ');
            if (types.includes(selectedType)) {
                group.style.display = 'block';
            }
        });

        if (nfcTagType === 'VCARD_EDIT' || selectedType !== 'Contact') {
            globalCapacitySection.style.display = 'none';
        } else {
            globalCapacitySection.style.display = 'block';
        }

        if (selectedType === 'Contact' && downloadVcfBtn) {
            downloadVcfBtn.style.display = 'block';
        } else if (downloadVcfBtn) {
            downloadVcfBtn.style.display = 'none';
        }

        if (generateButton) {
            generateButton.style.display = nfcTagType === 'VCARD_EDIT' ? 'none' : 'block';
        }

        // Hide output sections when type changes
        if (outputSection) outputSection.classList.add('hidden');
        updateCapacityDisplay();
    }

    /* ========================================================================
     * SECTION: Filename Helpers
     * ===================================================================== */

    /**
     * Sanitise a string for use as a filename.
     * @param {string} name - Raw filename string.
     * @returns {string} Sanitised, lowercased filename.
     */
    function sanitizeFilename(name) {
        return name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    }

    /**
     * Generate a filename for the .nfc download.
     * Uses the user-provided filename or auto-generates from tag type and input data.
     * @param {string} [tagType] - Override tag type label.
     * @returns {string} The filename (without .nfc extension).
     */
    function generateFilename(tagType) {
        const type = tagType || document.getElementById('tagType').value;

        if (inputs.filenameInput && inputs.filenameInput.value.trim()) {
            return inputs.filenameInput.value.trim();
        }

        const sanitizedInputData = sanitizeFilename(lastInputData);
        let filename = `nfc_${type.toLowerCase()}_${sanitizedInputData}`;
        if (filename.length > 50) {
            filename = filename.substring(0, 50);
        }
        return filename;
    }

    /* ========================================================================
     * SECTION: Input Validation
     * ===================================================================== */

    function formatInlineError(inputElement, msg) {
        if (!inputElement) return;
        const parent = inputElement.parentElement;
        let errDiv = parent.querySelector('.input-error');
        if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.className = 'input-error';
            errDiv.style.color = 'var(--accent-warn)';
            errDiv.style.fontSize = '0.8rem';
            errDiv.style.marginTop = '4px';
            parent.appendChild(errDiv);
        }
        errDiv.textContent = msg;
        inputElement.style.borderColor = 'var(--accent-warn)';
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearInlineError(inputElement) {
        if (!inputElement) return;
        const parent = inputElement.parentElement;
        const errDiv = parent.querySelector('.input-error');
        if (errDiv) errDiv.remove();
        inputElement.style.borderColor = '';
    }

    function clearAllInlineErrors() {
        document.querySelectorAll('.input-error').forEach(e => e.remove());
        document.querySelectorAll('input, select, textarea').forEach(e => e.style.borderColor = '');
    }

    function isValidInput(type, data, inputElement) {
        clearInlineError(inputElement);
        let valid = true;
        let errorMsg = '';

        switch (type) {
            case 'Email': {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                valid = emailRegex.test(data.replace(/^mailto:/, ''));
                if (!valid) errorMsg = 'Please enter a valid email address.';
                break;
            }
            case 'Phone': {
                const phoneRegex = /^[\d\s\+\-\(\)\[\]\.]{3,}$/;
                valid = phoneRegex.test(data.replace(/^tel:/, ''));
                if (!valid) errorMsg = 'Phone number contains invalid characters. Use digits, +, spaces, or hyphens.';
                break;
            }
            case 'URL':
            case 'SocialMedia': {
                const urlRegex = /^(https?:\/\/)?([^\s$.?#].[^\s]*)$/i;
                valid = urlRegex.test(data);
                if (!valid) errorMsg = 'Please enter a valid URL.';
                break;
            }
            case 'Text':
                valid = data.length <= 1000;
                if (!valid) errorMsg = 'Text must be under 1000 characters.';
                break;
            case 'WiFi': {
                const wifiRegex = /^SSID:.+;PASSWORD:.+;AUTH:(WPA|WEP|NONE)$/;
                valid = wifiRegex.test(data);
                if (!valid) errorMsg = 'Invalid Wi-Fi configuration.';
                break;
            }
            case 'Geo': {
                const geoRegex = /^geo:-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
                valid = geoRegex.test(data);
                if (!valid) errorMsg = 'Invalid geo-location.';
                break;
            }
            case 'SMS': {
                const smsRegex = /^sms:\+?\d+\?body=.+$/;
                valid = smsRegex.test(data);
                if (!valid) errorMsg = 'Invalid SMS format.';
                break;
            }
            case 'LaunchApp': {
                const packageRegex = /^[a-zA-Z0-9._]+$/;
                valid = packageRegex.test(data);
                if (!valid) errorMsg = 'Invalid Android package name.';
                break;
            }
            case 'CustomMIME': {
                const [mimeType] = data.split('\n');
                const mimeRegex = /^[\w\-]+\/[\w\-]+$/;
                valid = mimeRegex.test(mimeType);
                if (!valid) errorMsg = 'Invalid MIME type (e.g. application/json).';
                break;
            }
            case 'FaceTime':
            case 'FaceTimeAudio': {
                const input = decodeURIComponent(data.replace(/(facetime:\/\/|facetime-audio:\/\/)/i, ''));
                const emailOrPhoneRegex = /^([^\s@]+@[^\s@]+\.[^\s@]+|\+?\d{7,15})$/;
                valid = emailOrPhoneRegex.test(input);
                if (!valid) errorMsg = 'Invalid Apple ID or phone number.';
                break;
            }
            case 'AppleMaps':
                valid = data.trim().length > 0;
                if (!valid) errorMsg = 'Address cannot be empty.';
                break;
            case 'HomeKit': {
                const homeKitRegex = /^[A-Za-z0-9]{1,64}$/;
                valid = homeKitRegex.test(data.replace(/^X-HM:\/\//, ''));
                if (!valid) errorMsg = 'Invalid HomeKit setup payload.';
                break;
            }
            default:
                valid = false;
        }

        if (!valid && inputElement) {
            formatInlineError(inputElement, errorMsg);
        }
        return valid;
    }

    /* ========================================================================
     * SECTION: Standard NFC Tag Generation
     * ===================================================================== */

    function generateNFCData() {
        clearAllInlineErrors();
        const selectedType = tagTypeSelect.value;
        const selectedTagType = getSelectedNfcTagType();

        let inputData = '';
        let inputEl = null;

        // Collect data based on selected type
        if (selectedType === 'Contact') {
            // Check for validation errors before generating
            const invalidProp = currentVcardProps.find(p => p._invalid);
            if (invalidProp) {
                const invalidInput = vcardSectionsContainer.querySelector('.input-invalid');
                if (invalidInput) {
                    invalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    invalidInput.focus();
                }
                return;
            }
            inputData = generateVcardStringFromEditor();
            if (selectedTagType === 'VCARD_EDIT') {
                downloadNFCFile(inputData, 'contact', '.vcf');
                return;
            }
        } else if (selectedType === 'URL' || selectedType === 'SocialMedia') {
            inputData = inputs.urlInput.value.trim();
            inputEl = inputs.urlInput;
        } else if (selectedType === 'FaceTime') {
            const userId = inputs.facetimeInput.value.trim();
            inputData = `facetime://${encodeURIComponent(userId)}`;
            inputEl = inputs.facetimeInput;
        } else if (selectedType === 'FaceTimeAudio') {
            const userId = inputs.facetimeInput.value.trim();
            inputData = `facetime-audio://${encodeURIComponent(userId)}`;
            inputEl = inputs.facetimeInput;
        } else if (selectedType === 'AppleMaps') {
            const address = inputs.addressInput.value.trim();
            inputData = `http://maps.apple.com/?address=${encodeURIComponent(address)}`;
            inputEl = inputs.addressInput;
        } else if (selectedType === 'HomeKit') {
            const homeKitCode = inputs.homeKitCodeInput.value.trim();
            inputData = `X-HM://${encodeURIComponent(homeKitCode)}`;
            inputEl = inputs.homeKitCodeInput;
        } else if (selectedType === 'Text') {
            inputData = inputs.textInput.value.trim();
            inputEl = inputs.textInput;
        } else if (selectedType === 'Phone') {
            inputData = `tel:${inputs.phoneInput.value.trim().replace(/[\s\(\)\[\]\-]/g, '')}`; // strip formatting for tel: URI
            inputEl = inputs.phoneInput;
        } else if (selectedType === 'Email') {
            inputData = `mailto:${inputs.emailInput.value.trim()}`;
            inputEl = inputs.emailInput;
        } else if (selectedType === 'WiFi') {
            const ssid = inputs.ssidInput.value.trim();
            const password = inputs.passwordInput.value.trim();
            const auth = inputs.authTypeSelect.value;
            inputData = `SSID:${ssid};PASSWORD:${password};AUTH:${auth}`;
        } else if (selectedType === 'Geo') {
            const lat = inputs.latitudeInput.value.trim();
            const lng = inputs.longitudeInput.value.trim();
            inputData = `geo:${lat},${lng}`;
            inputEl = inputs.latitudeInput;
        } else if (selectedType === 'SMS') {
            const number = inputs.smsNumberInput.value.trim();
            const body = encodeURIComponent(inputs.smsBodyInput.value.trim());
            inputData = `sms:${number}?body=${body}`;
            inputEl = inputs.smsNumberInput;
        } else if (selectedType === 'LaunchApp') {
            inputData = inputs.packageNameInput.value.trim();
            inputEl = inputs.packageNameInput;
        } else if (selectedType === 'CustomMIME') {
            const mimeType = inputs.mimeTypeInput.value.trim();
            const data = inputs.mimeDataInput.value.trim();
            inputData = `${mimeType}\n${data}`;
            inputEl = inputs.mimeTypeInput;
        }

        if (!inputData) {
            alert('Please enter data');
            return;
        }

        if (selectedType !== 'Contact' && !isValidInput(selectedType, inputData, inputEl)) {
            // Valid error is displayed inline
            return;
        }

        lastInputData = inputData;

        try {
            const nfcTag = new NfcNtag(selectedTagType);

            // Route to appropriate generator
            if (['FaceTime', 'FaceTimeAudio', 'AppleMaps', 'HomeKit', 'URL',
                'SocialMedia', 'Phone', 'Email', 'Geo', 'SMS'].includes(selectedType)) {
                nfcTag.generateUrlTag(inputData);
            } else if (selectedType === 'WiFi') {
                nfcTag.generateWifiTag(inputData);
            } else if (selectedType === 'Contact') {
                const compatMode = document.querySelector('input[name="vcardCompatMode"]:checked').value;
                const url = vcardHostedUrlInput.value.trim();
                if (compatMode === 'dual' && !url) {
                    formatInlineError(vcardHostedUrlInput, 'Hosted VCF URL is required for iOS + Android mode');
                    return;
                }
                if (compatMode === 'dual' && url && (NfcNtag.calculateDualRecordSize(inputData, url) <= NTAG_CONFIG[selectedTagType].ndefCapacity)) {
                    nfcTag.generateDualRecordBusinessCard(inputData, url);
                } else {
                    nfcTag.generateVcardTag(inputData);
                }
            } else if (selectedType === 'LaunchApp') {
                nfcTag.generateAarTag(inputData);
            } else if (selectedType === 'CustomMIME') {
                const [mimeType, ...contentParts] = inputData.split('\n');
                nfcTag.generateCustomMimeTag(mimeType, contentParts.join('\n'));
            } else {
                nfcTag.generateUrlTag(inputData);
            }

            displayOutput(nfcTag.exportData());
        } catch (error) {
            alert(error.message);
            console.error(error);
        }
    }

    /**
     * Display generated NFC data and action buttons in the output section.
     * @param {string} nfcData - The .nfc file content to display.
     */
    function displayOutput(nfcData) {
        outputSection.innerHTML = '';

        const heading = document.createElement('h2');
        heading.textContent = 'Generated NFC Tag Data';
        outputSection.appendChild(heading);

        const dataOutput = document.createElement('pre');
        dataOutput.id = 'nfcData';
        dataOutput.textContent = nfcData;
        outputSection.appendChild(dataOutput);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        const dlButton = document.createElement('button');
        dlButton.className = 'btn';
        dlButton.textContent = 'Download .nfc File';
        dlButton.onclick = () => downloadNFCFile(nfcData);
        buttonGroup.appendChild(dlButton);

        const sendButton = document.createElement('button');
        sendButton.className = 'btn btn-secondary';
        sendButton.id = 'sendToFlipperButton';
        sendButton.textContent = 'Send to Flipper';
        sendButton.onclick = sendToFlipper;
        buttonGroup.appendChild(sendButton);

        outputSection.appendChild(buttonGroup);
        outputSection.classList.remove('hidden');
    }

    function downloadNFCFile(nfcData, filenameOverride, extension = '.nfc') {
        const data = nfcData || document.getElementById('nfcData').textContent;
        const type = extension === '.vcf' ? 'text/vcard' : 'application/octet-stream';
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let filename;
        if (filenameOverride) {
            filename = filenameOverride;
        } else {
            filename = generateFilename();
        }

        a.download = `${filename}${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ========================================================================
     * SECTION: Capacity Tracking & vCard Wizard Logics
     * ===================================================================== */

    function measureCurrentPayloadSize() {
        const selectedType = tagTypeSelect.value;
        if (selectedType === 'Contact') {
            return getVcardPayloadSize();
        }
        return 0; // Estimation dynamically omitted for standard inputs to keep code simple, users mostly care about VCard sizes.
    }

    function getVcardPayloadSize() {
        const vcardData = generateVcardStringFromEditor();
        const compatMode = document.querySelector('input[name="vcardCompatMode"]:checked').value;
        const url = compatMode === 'dual' ? vcardHostedUrlInput.value.trim() : '';
        if (url) {
            return NfcNtag.calculateDualRecordSize(vcardData, url);
        } else {
            return NfcNtag.calculateSingleRecordSize(vcardData);
        }
    }

    function updateCapacityDisplay() {
        const tagType = getSelectedNfcTagType();
        if (tagType === 'VCARD_EDIT') {
            if (generateButton) {
                generateButton.textContent = 'Download .vcf';
                generateButton.disabled = false;
            }
            capacityWarning.style.display = 'none';
            return;
        }

        const config = NTAG_CONFIG[tagType];
        if (!config) return;

        const maxCapacity = config.ndefCapacity;
        const currentBytes = measureCurrentPayloadSize();
        if (currentBytes === 0) {
            globalCapacityBar.style.width = `0%`;
            globalCapacityText.textContent = `0 / ${maxCapacity} bytes`;
            generateButton.disabled = false;
            generateButton.textContent = 'Generate NFC Tag';
            return;
        }

        const percentage = Math.min((currentBytes / maxCapacity) * 100, 100);
        const fits = currentBytes <= maxCapacity;

        globalCapacityBar.style.width = `${percentage}%`;
        globalCapacityBar.className = 'capacity-bar-fill' + (fits ? '' : ' over-capacity');
        globalCapacityText.textContent = `${currentBytes} / ${maxCapacity} bytes${fits ? '' : ' — TOO LARGE'}`;

        capacityWarning.textContent = '';
        capacityWarning.style.display = 'none';

        if (!fits) {
            generateButton.disabled = true;
            generateButton.textContent = 'Data too large for Tag';

            if (tagType === 'NTAG213' && currentBytes <= NTAG_CONFIG['NTAG215'].ndefCapacity) {
                capacityWarning.textContent = 'Size exceeded. Suggest switching to 215.';
                capacityWarning.style.display = 'block';
            } else if (tagType === 'NTAG215' && currentBytes <= NTAG_CONFIG['NTAG216'].ndefCapacity) {
                capacityWarning.textContent = 'Size exceeded. Suggest switching to 216.';
                capacityWarning.style.display = 'block';
            }
            globalCapacityText.parentNode.classList.add('has-warning');
        } else {
            generateButton.disabled = false;
            generateButton.textContent = 'Generate NFC Tag';
            globalCapacityText.parentNode.classList.remove('has-warning');
        }
    }

    document.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', updateCapacityDisplay);
    });

    // Helper functions for vCard rendering
    vcardModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeVcardMode = e.target.value;
            Object.values(vcardModePanels).forEach(panel => panel.classList.add('hidden'));
            if (vcardModePanels[activeVcardMode]) {
                vcardModePanels[activeVcardMode].classList.remove('hidden');
            }
            if (activeVcardMode !== 'scratch') {
                vcardModePanels['scratch'].classList.remove('hidden');
            }
            updateCapacityDisplay();
        });
    });

    // Validation helpers
    const VALIDATORS = {
        email: (v) => {
            if (!v) return null;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email format';
        },
        url: (v) => {
            if (!v) return null;
            try { new URL(v); return null; } catch { return 'Invalid URL format'; }
        },
        uri: (v) => {
            if (!v) return null;
            return /^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/.test(v) ? null : 'Invalid URI (e.g. xmpp:user@example.com)';
        },
        date: (v) => {
            if (!v) return null;
            // RFC 6350: date (YYYY-MM-DD, YYYYMMDD, --MM-DD, --MMDD)
            // or date-time (YYYYMMDDTHHMMSS, YYYYMMDDTHHMMSSZ, YYYY-MM-DDTHH:MM:SS, YYYY-MM-DDTHH:MM:SSZ)
            return /^(\d{4}-?\d{2}-?\d{2}(T\d{2}:?\d{2}:?\d{2}Z?)?|--\d{2}-?\d{2})$/.test(v) ? null : 'Use YYYY-MM-DD, YYYYMMDD, or with time: YYYYMMDDTHHMMSSZ';
        },
        gender: (v) => {
            if (!v) return null;
            // RFC 6350: single letter M/F/O/N/U, optionally followed by ;text
            return /^[MFONU](;.*)?$/i.test(v) ? null : 'Use M, F, O, N, or U (optionally ;text)';
        },
        tel: (v) => {
            if (!v) return null;
            // Accept tel: URI format (RFC 3966) or plain phone number
            const num = v.replace(/^tel:/i, '');
            return /^[+]?[\d\s()\[\]\-./]+$/.test(num) ? null : 'Invalid characters in phone number';
        }
    };

    const VCARD_FIELDS = [
        // Basic Identity
        { key: 'FN', label: 'Full Name', type: 'text', multi: false },
        { key: 'N', label: 'Name Parts (Family;Given;...)', type: 'text', multi: false },
        { key: 'NICKNAME', label: 'Nickname', type: 'text', multi: true },
        { key: 'ORG', label: 'Organization', type: 'text', multi: false },
        { key: 'TITLE', label: 'Job Title', type: 'text', multi: false },
        { key: 'ROLE', label: 'Role', type: 'text', multi: false },
        // Contact Details
        { key: 'TEL', label: 'Phone', type: 'tel', multi: true, params: ['CELL', 'WORK', 'HOME', 'VOICE', 'FAX', 'VIDEO', 'PAGER', 'TEXT', 'TEXTPHONE'], validate: VALIDATORS.tel },
        { key: 'EMAIL', label: 'Email', type: 'email', multi: true, params: ['WORK', 'HOME'], validate: VALIDATORS.email },
        { key: 'IMPP', label: 'Instant Messaging', type: 'url', multi: true, params: ['WORK', 'HOME'], validate: VALIDATORS.uri },
        { key: 'URL', label: 'Website', type: 'url', multi: true, params: ['WORK', 'HOME'], validate: VALIDATORS.url },
        { key: 'ADR', label: 'Address (PO;Ext;Street;City;State;ZIP;Country)', type: 'text', multi: true, params: ['HOME', 'WORK'] },
        // Dates & Personal
        { key: 'BDAY', label: 'Birthday', type: 'text', multi: false, validate: VALIDATORS.date },
        { key: 'ANNIVERSARY', label: 'Anniversary', type: 'text', multi: false, validate: VALIDATORS.date },
        { key: 'GENDER', label: 'Gender (M/F/O/N/U)', type: 'text', multi: false, validate: VALIDATORS.gender },
        // Metadata
        { key: 'CATEGORIES', label: 'Categories / Tags', type: 'text', multi: true },
        { key: 'NOTE', label: 'Notes', type: 'text', multi: false }
    ];

    // Keys handled by VCARD_FIELDS (plus VERSION which is handled separately)
    const KNOWN_KEYS = new Set(VCARD_FIELDS.map(f => f.key).concat(['VERSION']));

    function renderVcardEditor() {
        vcardSectionsContainer.innerHTML = '';
        VCARD_FIELDS.forEach(fieldDef => {
            const section = document.createElement('div');
            section.className = 'vcard-section';

            const title = document.createElement('div');
            title.className = 'vcard-section-title';
            title.textContent = fieldDef.label;
            section.appendChild(title);

            const props = currentVcardProps.filter(p => p.key === fieldDef.key);
            if (props.length === 0 && !fieldDef.multi) {
                props.push({ key: fieldDef.key, param: '', value: '' });
                currentVcardProps.push(props[0]); // Make sure it's in the main array
            }

            const rowsContainer = document.createElement('div');
            rowsContainer.className = 'vcard-rows-container';
            props.forEach(prop => rowsContainer.appendChild(createVcardPropRow(fieldDef, prop)));
            section.appendChild(rowsContainer);

            if (fieldDef.multi) {
                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.className = 'btn-add-prop';
                addBtn.textContent = `+ Add ${fieldDef.label}`;
                addBtn.onclick = () => {
                    const newProp = { key: fieldDef.key, param: fieldDef.params ? fieldDef.params[0] : '', value: '' };
                    currentVcardProps.push(newProp);
                    rowsContainer.appendChild(createVcardPropRow(fieldDef, newProp));
                    updateCapacityDisplay();
                };
                section.appendChild(addBtn);
            }
            vcardSectionsContainer.appendChild(section);
        });

        // Passthrough section for unrecognized/complex properties
        const passthroughProps = currentVcardProps.filter(p => !KNOWN_KEYS.has(p.key));
        if (passthroughProps.length > 0) {
            const section = document.createElement('div');
            section.className = 'vcard-section';

            const title = document.createElement('div');
            title.className = 'vcard-section-title';
            title.textContent = 'Other Imported Properties';
            section.appendChild(title);

            const hint = document.createElement('p');
            hint.className = 'field-hint passthrough-hint';
            hint.textContent = 'These properties were imported but cannot be edited in this version. They will be included in exports. Unverified \u2014 check manually.';
            section.appendChild(hint);

            const rowsContainer = document.createElement('div');
            rowsContainer.className = 'vcard-rows-container';
            passthroughProps.forEach(prop => {
                const row = document.createElement('div');
                row.className = 'vcard-prop-row prop-readonly';
                if (prop._changed) row.classList.add('prop-changed');

                const keyLabel = document.createElement('span');
                keyLabel.className = 'prop-key-label';
                keyLabel.textContent = prop.key;
                row.appendChild(keyLabel);

                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'input-group';
                const textarea = document.createElement('textarea');
                textarea.value = prop.value;
                textarea.readOnly = true;
                textarea.rows = 1;
                textarea.className = 'readonly-value';
                valueDisplay.appendChild(textarea);
                row.appendChild(valueDisplay);

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'btn-icon';
                delBtn.innerHTML = '&times;';
                delBtn.onclick = () => {
                    const idx = currentVcardProps.indexOf(prop);
                    if (idx > -1) currentVcardProps.splice(idx, 1);
                    row.remove();
                    updateCapacityDisplay();
                };
                row.appendChild(delBtn);

                rowsContainer.appendChild(row);
            });
            section.appendChild(rowsContainer);
            vcardSectionsContainer.appendChild(section);
        }
    }

    function createVcardPropRow(fieldDef, propRef) {
        const row = document.createElement('div');
        row.className = 'vcard-prop-row';
        if (propRef._changed) {
            row.classList.add('prop-changed');
        }

        if (fieldDef.params && fieldDef.params.length > 0) {
            const select = document.createElement('select');
            select.className = 'prop-type-select';
            select.multiple = true;
            select.size = Math.min(3, fieldDef.params.length + 1);

            let matchFound = false;
            fieldDef.params.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                if (propRef.param && propRef.param.toUpperCase().split(',').includes(p.toUpperCase())) {
                    opt.selected = true;
                    matchFound = true;
                }
                select.appendChild(opt);
            });

            if (propRef.param && !matchFound) {
                const customOpt = document.createElement('option');
                customOpt.value = propRef.param;
                customOpt.textContent = propRef.param;
                customOpt.selected = true;
                select.appendChild(customOpt);
            }

            select.onchange = (e) => {
                const selectedOptions = Array.from(e.target.selectedOptions).map(o => o.value);
                propRef.param = selectedOptions.join(',');
                updateCapacityDisplay();
            };
            row.appendChild(select);
        }

        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        const input = document.createElement(fieldDef.key === 'NOTE' ? 'textarea' : 'input');
        if (input.tagName === 'INPUT') input.type = fieldDef.type;
        input.value = propRef.value;
        input.placeholder = `Enter ${fieldDef.label}`;

        // Inline validation
        const validateAndMark = () => {
            if (fieldDef.validate && input.value.trim()) {
                const err = fieldDef.validate(input.value.trim());
                let errEl = inputGroup.querySelector('.prop-validation-error');
                if (err) {
                    input.classList.add('input-invalid');
                    propRef._invalid = true;
                    if (!errEl) {
                        errEl = document.createElement('div');
                        errEl.className = 'prop-validation-error';
                        inputGroup.appendChild(errEl);
                    }
                    errEl.textContent = err;
                } else {
                    input.classList.remove('input-invalid');
                    delete propRef._invalid;
                    if (errEl) errEl.remove();
                }
            } else {
                input.classList.remove('input-invalid');
                delete propRef._invalid;
                const errEl = inputGroup.querySelector('.prop-validation-error');
                if (errEl) errEl.remove();
            }
        };

        input.oninput = (e) => {
            propRef.value = e.target.value;
            validateAndMark();
            updateCapacityDisplay();
        };

        // Validate on initial render if value exists
        inputGroup.appendChild(input);
        if (propRef.value.trim()) validateAndMark();
        row.appendChild(inputGroup);

        if (fieldDef.multi) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn-icon';
            delBtn.innerHTML = '&times;';
            delBtn.onclick = () => {
                const idx = currentVcardProps.indexOf(propRef);
                if (idx > -1) currentVcardProps.splice(idx, 1);
                row.remove();
                updateCapacityDisplay();
            };
            row.appendChild(delBtn);
        }
        return row;
    }

    function generateVcardStringFromEditor() {
        const version = vcardVersionSelect.value || '4.0';
        let lines = ['BEGIN:VCARD', `VERSION:${version}`];

        // Helper to build a param string for a prop
        function buildParamStr(p) {
            let paramStr = '';
            if (p.param) {
                const paramList = p.param.toUpperCase().replace(/\s/g, '').split(',').filter(Boolean);
                if (version === '4.0' || version === '3.0') {
                    paramStr = `;TYPE=${paramList.join(',')}`;
                } else {
                    paramStr = ';' + paramList.join(';');
                }
            }
            if (p.rawOtherParams && p.rawOtherParams.length > 0) {
                paramStr += ';' + p.rawOtherParams.join(';');
            }
            return paramStr;
        }

        // Emit known fields in order
        VCARD_FIELDS.forEach(fieldDef => {
            currentVcardProps.filter(p => p.key === fieldDef.key).forEach(p => {
                if (!p.value.trim()) return;
                lines.push(`${fieldDef.key}${buildParamStr(p)}:${p.value.trim()}`);
            });
        });

        // Emit passthrough (unknown) fields
        currentVcardProps.filter(p => !KNOWN_KEYS.has(p.key)).forEach(p => {
            if (!p.value.trim()) return;
            let paramStr = '';
            if (p.param) paramStr = `;${p.param}`;
            if (p.rawOtherParams && p.rawOtherParams.length > 0) {
                paramStr += ';' + p.rawOtherParams.join(';');
            }
            lines.push(`${p.key}${paramStr}:${p.value.trim()}`);
        });

        lines.push('END:VCARD');
        return lines.join('\r\n');
    }

    vcardFetchButton.addEventListener('click', async () => {
        const url = vcardHostedUrlInput.value.trim();
        if (!url) return formatInlineError(vcardHostedUrlInput, 'Enter a URL first');
        vcardHostedUrlInput.style.borderColor = '';
        const errDiv = vcardHostedUrlInput.parentElement.querySelector('.input-error');
        if (errDiv) errDiv.remove();

        try {
            vcardFetchButton.textContent = '...';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch from URL');
            loadVcardDataIntoEditor(await res.text());
        } catch (e) {
            alert('Failed to fetch (likely CORS blocking). The file will be opened for download. Please copy its contents and paste them manually.');
            window.open(url, '_blank');
            document.getElementById('mode_paste').click();
        } finally {
            vcardFetchButton.textContent = 'Fetch & Load';
        }
    });

    vcardProcessPasteBtn.addEventListener('click', () => {
        const data = vcardPasteTextarea.value.trim();
        if (data) loadVcardDataIntoEditor(data);
    });

    function loadVcardDataIntoEditor(rawVcard) {
        if (typeof parseVCard === 'function') {
            try {
                const parsed = parseVCard(rawVcard);
                currentVcardPropsHistory = JSON.parse(JSON.stringify(currentVcardProps));
                vcardUndoBtn.classList.remove('hidden');

                currentVcardProps = [];
                if (parsed.version) vcardVersionSelect.value = parsed.version;

                Object.keys(parsed).forEach(key => {
                    if (key === 'version') return;
                    const vals = Array.isArray(parsed[key]) ? parsed[key] : [parsed[key]];
                    vals.forEach(v => {
                        let param = '', value = v;
                        if (typeof v === 'object' && v !== null) {
                            param = v.type || '';
                            value = v.value || '';
                            rawOtherParams = v.rawOtherParams || [];
                        }
                        currentVcardProps.push({ key: key.toUpperCase(), param, value, rawOtherParams });
                    });
                });
                renderVcardEditor();
                updateCapacityDisplay();
            } catch (e) {
                alert('Invalid vCard data!');
            }
        }
    }

    vcardCompatRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'dual') {
                vcardUrlGroup.style.display = 'block';
            } else {
                vcardUrlGroup.style.display = 'none';
            }
            updateCapacityDisplay();
        });
    });

    vcardVersionSelect.addEventListener('change', () => {
        if (vcardCheckStatus) {
            vcardCheckStatus.textContent = '⏳';
            setTimeout(() => {
                vcardCheckStatus.textContent = '✅';
                setTimeout(() => { vcardCheckStatus.textContent = ''; }, 2000);
            }, 600);
        }
    });

    if (downloadVcfBtn) {
        downloadVcfBtn.addEventListener('click', () => {
            const invalidProp = currentVcardProps.find(p => p._invalid);
            if (invalidProp) {
                const invalidInput = vcardSectionsContainer.querySelector('.input-invalid');
                if (invalidInput) {
                    invalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    invalidInput.focus();
                }
                return;
            }
            const vcardStr = generateVcardStringFromEditor();
            downloadNFCFile(vcardStr, generateFilename('Contact'), '.vcf');
        });
    }

    if (vcardClearBtn) {
        vcardClearBtn.addEventListener('click', () => {
            currentVcardPropsHistory = JSON.parse(JSON.stringify(currentVcardProps));
            currentVcardProps = [];
            renderVcardEditor();
            updateCapacityDisplay();
            vcardUndoBtn.classList.remove('hidden');
        });
    }

    if (vcardUndoBtn) {
        vcardUndoBtn.addEventListener('click', () => {
            if (currentVcardPropsHistory) {
                currentVcardProps = JSON.parse(JSON.stringify(currentVcardPropsHistory));
                currentVcardPropsHistory = null;
                renderVcardEditor();
                updateCapacityDisplay();
                vcardUndoBtn.classList.add('hidden');
            }
        });
    }

    vcardOptimizeBtn.addEventListener('click', runSizeOptimization);

    function runSizeOptimization() {
        if (typeof optimizeVCardProps === 'function') {
            const before = JSON.parse(JSON.stringify(currentVcardProps));
            currentVcardPropsHistory = before;
            vcardUndoBtn.classList.remove('hidden');

            currentVcardProps = optimizeVCardProps(currentVcardProps, vcardVersionSelect.value);

            // Mark changed fields for visual highlighting
            currentVcardProps.forEach((p, i) => {
                if (i < before.length) {
                    if (p.value !== before[i].value || p.param !== before[i].param) {
                        p._changed = true;
                    }
                }
            });

            renderVcardEditor();
            updateCapacityDisplay();
        }
    }

    /* ========================================================================
     * SECTION: WebSerial — Send to Flipper
     * ===================================================================== */

    /**
     * Show a modal dialog.
     * @param {string} modalId - The modal element ID.
     */
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    /**
     * Send the generated NFC data to a connected Flipper Zero via WebSerial.
     */
    async function sendToFlipper() {
        if (!navigator.serial || /Mobi|Android/i.test(navigator.userAgent)) {
            showModal('webSerialModal');
            return;
        }

        const nfcData = document.getElementById('nfcData').textContent;
        const filename = generateFilename();
        const sendButton = document.querySelector('#sendToFlipperButton');
        const statusDiv = document.createElement('div');
        statusDiv.className = 'send-status';
        sendButton.parentNode.appendChild(statusDiv);

        try {
            sendButton.disabled = true;
            sendButton.classList.add('sending');

            if (!flipperSerial) {
                flipperSerial = new FlipperSerial();
            }

            if (!flipperSerial.isConnected) {
                statusDiv.textContent = 'Connecting to Flipper...';
                await flipperSerial.connect();
            }

            statusDiv.textContent = 'Creating directory...';
            await flipperSerial.writeCommand('storage mkdir /ext/nfc');

            statusDiv.textContent = 'Sending to Flipper...';
            await flipperSerial.writeFile(`/ext/nfc/${filename}.nfc`, nfcData);

            statusDiv.textContent = 'Successfully sent to Flipper!';
            statusDiv.classList.add('success');

            setTimeout(() => {
                statusDiv.remove();
                sendButton.classList.remove('sending');
                sendButton.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error sending to Flipper:', error);
            statusDiv.textContent = `Error: ${error.message}. Please try again.`;
            statusDiv.classList.add('error');
            flipperSerial = null;
            sendButton.classList.remove('sending');
            sendButton.disabled = false;
        }
    }

    // Initialise UI
    renderVcardEditor();
    nfcTagTypeRadios.forEach(radio => radio.addEventListener('change', handleTagTypeChange));
    tagTypeSelect.addEventListener('change', showRelevantInputs);
    generateButton.addEventListener('click', generateNFCData);

    if (downloadButton) {
        downloadButton.addEventListener('click', () => downloadNFCFile());
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            if (modal) modal.classList.remove('active');
        });
    });

    // Initialise input visibility
    showRelevantInputs();
});

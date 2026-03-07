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
    const nfcTagTypeSelect = document.getElementById('nfcTagTypeSelect');
    const generateButton = document.getElementById('generateButton');
    const outputSection = document.getElementById('outputSection');
    const nfcDataOutput = document.getElementById('nfcData');
    const downloadButton = document.getElementById('downloadButton');
    const themeToggle = document.getElementById('themeToggle');

    const inputFieldsContainer = document.getElementById('inputFields');
    const allInputGroups = inputFieldsContainer.querySelectorAll('.data-field');

    // --- iOS Business Card elements ---
    const businessCardSection = document.getElementById('businessCardSection');
    const vcfUrlInput = document.getElementById('vcfUrlInput');
    const fetchVcfButton = document.getElementById('fetchVcfButton');
    const vcfPasteArea = document.getElementById('vcfPasteArea');
    const vcfPasteTextarea = document.getElementById('vcfPasteTextarea');
    const vcardPreview = document.getElementById('vcardPreview');
    const bcNfcTagTypeSelect = document.getElementById('bcNfcTagTypeSelect');
    const capacityBar = document.getElementById('capacityBar');
    const capacityText = document.getElementById('capacityText');
    const generateBcButton = document.getElementById('generateBcButton');
    const bcOutputSection = document.getElementById('bcOutputSection');

    /** Map of standard input elements */
    const inputs = {
        urlInput: document.getElementById('urlInput'),
        textInput: document.getElementById('textInput'),
        phoneInput: document.getElementById('phoneInput'),
        emailInput: document.getElementById('emailInput'),
        ssidInput: document.getElementById('ssidInput'),
        passwordInput: document.getElementById('passwordInput'),
        authTypeSelect: document.getElementById('authTypeSelect'),
        contactInput: document.getElementById('contactInput'),
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
    let currentVcardData = null; // Parsed vCard data for business card feature

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

    /**
     * Show/hide input fields based on the selected tag type.
     * Also toggles the iOS Business Card section visibility.
     */
    function showRelevantInputs() {
        const selectedType = tagTypeSelect.value;

        // Hide all standard input groups
        allInputGroups.forEach(group => group.style.display = 'none');

        // Show groups matching the selected type
        allInputGroups.forEach(group => {
            const types = group.getAttribute('data-type').split(' ');
            if (types.includes(selectedType)) {
                group.style.display = 'block';
            }
        });

        // Toggle business card section
        const isBusinessCard = selectedType === 'iOSBusinessCard';
        if (businessCardSection) {
            businessCardSection.style.display = isBusinessCard ? 'block' : 'none';
        }

        // Toggle standard generate button
        if (generateButton) {
            generateButton.style.display = isBusinessCard ? 'none' : 'block';
        }

        // Hide output sections when type changes
        if (outputSection) outputSection.classList.add('hidden');
        if (bcOutputSection) bcOutputSection.classList.add('hidden');
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

    /**
     * Validate user input for the selected tag type.
     * @param {string} type - The tag type identifier.
     * @param {string} data - The input data to validate.
     * @returns {boolean} True if valid.
     */
    function isValidInput(type, data) {
        switch (type) {
            case 'Email': {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(data.replace(/^mailto:/, ''));
            }
            case 'Phone': {
                const phoneRegex = /^\+?\d{7,15}$/;
                return phoneRegex.test(data.replace(/^tel:/, ''));
            }
            case 'URL':
            case 'SocialMedia': {
                const urlRegex = /^(https?:\/\/)?([^\s$.?#].[^\s]*)$/i;
                return urlRegex.test(data);
            }
            case 'Text':
                return data.length <= 1000;
            case 'WiFi': {
                const wifiRegex = /^SSID:.+;PASSWORD:.+;AUTH:(WPA|WEP|NONE)$/;
                return wifiRegex.test(data);
            }
            case 'Contact':
                return data.startsWith('BEGIN:VCARD') && data.endsWith('END:VCARD');
            case 'Geo': {
                const geoRegex = /^geo:-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
                return geoRegex.test(data);
            }
            case 'SMS': {
                const smsRegex = /^sms:\+?\d+\?body=.+$/;
                return smsRegex.test(data);
            }
            case 'LaunchApp': {
                const packageRegex = /^[a-zA-Z0-9._]+$/;
                return packageRegex.test(data);
            }
            case 'CustomMIME': {
                const [mimeType] = data.split('\n');
                const mimeRegex = /^[\w\-]+\/[\w\-]+$/;
                return mimeRegex.test(mimeType);
            }
            case 'FaceTime':
            case 'FaceTimeAudio': {
                const input = decodeURIComponent(data.replace(/(facetime:\/\/|facetime-audio:\/\/)/i, ''));
                const emailOrPhoneRegex = /^([^\s@]+@[^\s@]+\.[^\s@]+|\+?\d{7,15})$/;
                return emailOrPhoneRegex.test(input);
            }
            case 'AppleMaps':
                return data.trim().length > 0;
            case 'HomeKit': {
                const homeKitRegex = /^[A-Za-z0-9]{1,64}$/;
                return homeKitRegex.test(data.replace(/^X-HM:\/\//, ''));
            }
            default:
                return false;
        }
    }

    /* ========================================================================
     * SECTION: Standard NFC Tag Generation
     * ===================================================================== */

    /**
     * Collect input data, generate NFC tag, and display output.
     */
    function generateNFCData() {
        const selectedType = tagTypeSelect.value;
        const selectedTagType = nfcTagTypeSelect.value;

        if (selectedType === 'iOSBusinessCard') return; // Handled separately

        let inputData = '';

        // Collect data based on selected type
        if (selectedType === 'URL' || selectedType === 'SocialMedia') {
            inputData = inputs.urlInput.value.trim();
        } else if (selectedType === 'FaceTime') {
            const userId = inputs.facetimeInput.value.trim();
            inputData = `facetime://${encodeURIComponent(userId)}`;
        } else if (selectedType === 'FaceTimeAudio') {
            const userId = inputs.facetimeInput.value.trim();
            inputData = `facetime-audio://${encodeURIComponent(userId)}`;
        } else if (selectedType === 'AppleMaps') {
            const address = inputs.addressInput.value.trim();
            inputData = `http://maps.apple.com/?address=${encodeURIComponent(address)}`;
        } else if (selectedType === 'HomeKit') {
            const homeKitCode = inputs.homeKitCodeInput.value.trim();
            inputData = `X-HM://${encodeURIComponent(homeKitCode)}`;
        } else if (selectedType === 'Text') {
            inputData = inputs.textInput.value.trim();
        } else if (selectedType === 'Phone') {
            inputData = `tel:${inputs.phoneInput.value.trim()}`;
        } else if (selectedType === 'Email') {
            inputData = `mailto:${inputs.emailInput.value.trim()}`;
        } else if (selectedType === 'WiFi') {
            const ssid = inputs.ssidInput.value.trim();
            const password = inputs.passwordInput.value.trim();
            const auth = inputs.authTypeSelect.value;
            inputData = `SSID:${ssid};PASSWORD:${password};AUTH:${auth}`;
        } else if (selectedType === 'Contact') {
            inputData = inputs.contactInput.value.trim();
        } else if (selectedType === 'Geo') {
            const lat = inputs.latitudeInput.value.trim();
            const lng = inputs.longitudeInput.value.trim();
            inputData = `geo:${lat},${lng}`;
        } else if (selectedType === 'SMS') {
            const number = inputs.smsNumberInput.value.trim();
            const body = encodeURIComponent(inputs.smsBodyInput.value.trim());
            inputData = `sms:${number}?body=${body}`;
        } else if (selectedType === 'LaunchApp') {
            inputData = inputs.packageNameInput.value.trim();
        } else if (selectedType === 'CustomMIME') {
            const mimeType = inputs.mimeTypeInput.value.trim();
            const data = inputs.mimeDataInput.value.trim();
            inputData = `${mimeType}\n${data}`;
        }

        if (!inputData) {
            alert('Please enter data');
            return;
        }

        if (!isValidInput(selectedType, inputData)) {
            alert('Input contains invalid characters or is improperly formatted.');
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
                nfcTag.generateVcardTag(inputData);
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

    /* ========================================================================
     * SECTION: iOS Business Card Feature
     * ===================================================================== */

    /**
     * Fetch VCF from URL, with CORS fallback to paste textarea.
     */
    async function fetchVcf() {
        const url = vcfUrlInput.value.trim();
        if (!url) {
            alert('Please enter a URL to a hosted .vcf file.');
            return;
        }

        fetchVcfButton.disabled = true;
        fetchVcfButton.textContent = 'Fetching...';

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();

            if (!isValidVCard(text)) {
                throw new Error('The fetched content is not a valid vCard.');
            }

            processVcardContent(text);
        } catch (error) {
            console.warn('VCF fetch failed:', error.message);
            // Show paste fallback
            vcfPasteArea.style.display = 'block';
            vcfPasteArea.querySelector('.paste-hint').textContent =
                `Could not fetch from URL (${error.message}). Paste your VCF content below:`;
        } finally {
            fetchVcfButton.disabled = false;
            fetchVcfButton.textContent = 'Fetch VCF';
        }
    }

    /**
     * Process vCard content: parse, preview, update capacity.
     * @param {string} vcfText - Raw vCard text.
     */
    function processVcardContent(vcfText) {
        try {
            const parsed = parseVCard(vcfText);
            currentVcardData = { parsed, raw: vcfText.trim() };

            // Show preview
            vcardPreview.innerHTML = formatVCardPreviewHTML(parsed);
            vcardPreview.style.display = 'block';

            // Update capacity display
            updateCapacityDisplay();
        } catch (error) {
            alert(error.message);
        }
    }

    /**
     * Update the capacity bar and enable/disable tag type options based on payload size.
     */
    function updateCapacityDisplay() {
        if (!currentVcardData) return;

        const url = vcfUrlInput.value.trim();
        if (!url) return;

        const totalBytes = NfcNtag.calculateDualRecordSize(currentVcardData.raw, url);

        // Update capacity bar for currently selected tag type
        const selectedType = bcNfcTagTypeSelect.value;
        const config = NTAG_CONFIG[selectedType];
        const capacity = config.ndefCapacity;
        const percentage = Math.min((totalBytes / capacity) * 100, 100);
        const fits = totalBytes <= capacity;

        capacityBar.style.width = `${percentage}%`;
        capacityBar.className = 'capacity-bar-fill' + (fits ? '' : ' over-capacity');
        capacityText.textContent = `${totalBytes} / ${capacity} bytes${fits ? '' : ' — TOO LARGE'}`;

        // Enable/disable tag type options
        const options = bcNfcTagTypeSelect.querySelectorAll('option');
        options.forEach(option => {
            const optConfig = NTAG_CONFIG[option.value];
            if (totalBytes > optConfig.ndefCapacity) {
                option.disabled = true;
                option.textContent = `${option.value} (${optConfig.ndefCapacity}B) — too small`;
            } else {
                option.disabled = false;
                option.textContent = `${option.value} (${optConfig.ndefCapacity}B)`;
            }
        });

        // Enable generate button only if it fits
        if (generateBcButton) {
            generateBcButton.disabled = !fits;
        }
    }

    /**
     * Generate the dual-record business card NFC tag.
     */
    function generateBusinessCard() {
        if (!currentVcardData) {
            alert('Please load vCard data first (fetch from URL or paste).');
            return;
        }

        const url = vcfUrlInput.value.trim();
        if (!url) {
            alert('Please enter the hosted VCF URL.');
            return;
        }

        const selectedTagType = bcNfcTagTypeSelect.value;

        try {
            const nfcTag = new NfcNtag(selectedTagType);
            nfcTag.generateDualRecordBusinessCard(currentVcardData.raw, url);
            const nfcData = nfcTag.exportData();

            displayBusinessCardOutput(nfcData);
        } catch (error) {
            alert(error.message);
            console.error(error);
        }
    }

    /**
     * Display business card NFC output.
     * @param {string} nfcData - The .nfc file content.
     */
    function displayBusinessCardOutput(nfcData) {
        bcOutputSection.innerHTML = '';

        const heading = document.createElement('h2');
        heading.textContent = 'Generated Business Card NFC Tag';
        bcOutputSection.appendChild(heading);

        const dataOutput = document.createElement('pre');
        dataOutput.id = 'bcNfcData';
        dataOutput.className = 'nfc-data-output';
        dataOutput.textContent = nfcData;
        bcOutputSection.appendChild(dataOutput);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        const dlButton = document.createElement('button');
        dlButton.className = 'btn';
        dlButton.textContent = 'Download .nfc File';
        dlButton.onclick = () => downloadNFCFile(nfcData, 'business_card');
        buttonGroup.appendChild(dlButton);

        bcOutputSection.appendChild(buttonGroup);
        bcOutputSection.classList.remove('hidden');
    }

    /* ========================================================================
     * SECTION: File Download
     * ===================================================================== */

    /**
     * Trigger download of a .nfc file.
     * @param {string} [nfcData] - The file content. If omitted, reads from #nfcData element.
     * @param {string} [filenameOverride] - Override the auto-generated filename.
     */
    function downloadNFCFile(nfcData, filenameOverride) {
        const data = nfcData || document.getElementById('nfcData').textContent;
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let filename;
        if (filenameOverride) {
            filename = filenameOverride;
        } else {
            filename = generateFilename();
        }

        a.download = `${filename}.nfc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    /* ========================================================================
     * SECTION: Event Listeners
     * ===================================================================== */

    tagTypeSelect.addEventListener('change', showRelevantInputs);
    generateButton.addEventListener('click', generateNFCData);

    if (downloadButton) {
        downloadButton.addEventListener('click', () => downloadNFCFile());
    }

    // iOS Business Card events
    if (fetchVcfButton) {
        fetchVcfButton.addEventListener('click', fetchVcf);
    }

    if (vcfPasteTextarea) {
        vcfPasteTextarea.addEventListener('input', () => {
            const text = vcfPasteTextarea.value.trim();
            if (text && isValidVCard(text)) {
                processVcardContent(text);
            }
        });
    }

    if (bcNfcTagTypeSelect) {
        bcNfcTagTypeSelect.addEventListener('change', updateCapacityDisplay);
    }

    if (generateBcButton) {
        generateBcButton.addEventListener('click', generateBusinessCard);
    }

    if (vcfUrlInput) {
        vcfUrlInput.addEventListener('input', updateCapacityDisplay);
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

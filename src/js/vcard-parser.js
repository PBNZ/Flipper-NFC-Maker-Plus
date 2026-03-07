/**
 * @file vcard-parser.js
 * @description Parses vCard (VCF) content and provides structured data and
 *              HTML preview rendering for the iOS Compatible Business Card feature.
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

/* ============================================================================
 * SECTION: vCard Validation
 * ========================================================================= */

/**
 * Check whether the given text is a valid vCard (has BEGIN:VCARD/END:VCARD wrapper).
 * @param {string} text - The text to validate.
 * @returns {boolean} True if text looks like a valid vCard.
 */
function isValidVCard(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.startsWith('BEGIN:VCARD') && trimmed.endsWith('END:VCARD');
}

/* ============================================================================
 * SECTION: vCard Parsing
 * ========================================================================= */

/**
 * Parse a vCard string into a structured object.
 * Supports common vCard 2.1, 3.0, and 4.0 properties.
 *
 * @param {string} vcfString - The raw vCard text.
 * @returns {Object} Parsed contact data with the following possible fields:
 *   - {string} fullName - FN (formatted name)
 *   - {string} name - N (structured name as "Last;First;Middle;Prefix;Suffix")
 *   - {string} org - ORG (organisation)
 *   - {string} title - TITLE (job title)
 *   - {string[]} phones - TEL entries
 *   - {string[]} emails - EMAIL entries
 *   - {string[]} addresses - ADR entries
 *   - {string} url - URL
 *   - {string} note - NOTE
 *   - {string} version - VERSION
 *   - {string} raw - The original vCard text
 * @throws {Error} If the input is not a valid vCard.
 */
function parseVCard(vcfString) {
    if (!isValidVCard(vcfString)) {
        throw new Error('Invalid vCard: must start with BEGIN:VCARD and end with END:VCARD');
    }

    const result = {
        fullName: '',
        name: '',
        org: '',
        title: '',
        phones: [],
        emails: [],
        addresses: [],
        url: '',
        note: '',
        version: '',
        raw: vcfString.trim()
    };

    // Unfold continuation lines (RFC 6350: line starting with space/tab is continuation)
    const unfolded = vcfString.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'BEGIN:VCARD' || trimmedLine === 'END:VCARD') {
            continue;
        }

        // Split on first colon to get property name and value
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex === -1) continue;

        const propertyPart = trimmedLine.substring(0, colonIndex);
        const value = trimmedLine.substring(colonIndex + 1).trim();

        // Property name is everything before any parameters (separated by ;)
        const propertyName = propertyPart.split(';')[0].toUpperCase();

        switch (propertyName) {
            case 'FN':
                result.fullName = value;
                break;
            case 'N':
                result.name = value;
                break;
            case 'ORG':
                result.org = value.replace(/;/g, ', ');
                break;
            case 'TITLE':
                result.title = value;
                break;
            case 'TEL':
                if (value) result.phones.push(value);
                break;
            case 'EMAIL':
                if (value) result.emails.push(value);
                break;
            case 'ADR':
                if (value) {
                    // ADR fields are ;-separated: PO;Extended;Street;City;Region;Postal;Country
                    const parts = value.split(';').filter(p => p.trim());
                    if (parts.length > 0) {
                        result.addresses.push(parts.join(', '));
                    }
                }
                break;
            case 'URL':
                result.url = value;
                break;
            case 'NOTE':
                result.note = value;
                break;
            case 'VERSION':
                result.version = value;
                break;
            // Ignore other properties silently
        }
    }

    return result;
}

/* ============================================================================
 * SECTION: Preview Rendering
 * ========================================================================= */

/**
 * Generate an HTML preview string from a parsed vCard object.
 *
 * @param {Object} parsed - The parsed vCard object from parseVCard().
 * @returns {string} HTML string for displaying the contact preview.
 */
function formatVCardPreviewHTML(parsed) {
    const escape = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    let html = '<div class="vcard-preview-fields">';

    if (parsed.fullName) {
        html += `<div class="vcard-field"><span class="vcard-label">Name</span><span class="vcard-value">${escape(parsed.fullName)}</span></div>`;
    } else if (parsed.name) {
        const nameParts = parsed.name.split(';').filter(p => p);
        html += `<div class="vcard-field"><span class="vcard-label">Name</span><span class="vcard-value">${escape(nameParts.join(' '))}</span></div>`;
    }

    if (parsed.org) {
        html += `<div class="vcard-field"><span class="vcard-label">Organisation</span><span class="vcard-value">${escape(parsed.org)}</span></div>`;
    }

    if (parsed.title) {
        html += `<div class="vcard-field"><span class="vcard-label">Title</span><span class="vcard-value">${escape(parsed.title)}</span></div>`;
    }

    for (const phone of parsed.phones) {
        html += `<div class="vcard-field"><span class="vcard-label">Phone</span><span class="vcard-value">${escape(phone)}</span></div>`;
    }

    for (const email of parsed.emails) {
        html += `<div class="vcard-field"><span class="vcard-label">Email</span><span class="vcard-value">${escape(email)}</span></div>`;
    }

    for (const addr of parsed.addresses) {
        html += `<div class="vcard-field"><span class="vcard-label">Address</span><span class="vcard-value">${escape(addr)}</span></div>`;
    }

    if (parsed.url) {
        html += `<div class="vcard-field"><span class="vcard-label">URL</span><span class="vcard-value">${escape(parsed.url)}</span></div>`;
    }

    if (parsed.note) {
        html += `<div class="vcard-field"><span class="vcard-label">Note</span><span class="vcard-value">${escape(parsed.note)}</span></div>`;
    }

    html += '</div>';

    if (!parsed.fullName && !parsed.name && parsed.phones.length === 0 && parsed.emails.length === 0) {
        html = '<div class="vcard-preview-empty">No recognisable contact fields found in vCard.</div>';
    }

    return html;
}

// TODO: Future — Enhanced vCard creation/editing UI (full wizard with type qualifiers per field)
// TODO: Future — Direct VCF content creation without requiring a pre-hosted file

/**
 * @file vcard-parser.js
 * @description Parses vCard (VCF) content and provides structured data,
 *              size optimization routines, and compliance formatting.
 *
 * Original work Copyright (c) jaylikesbunda
 * Modifications Copyright (c) PBNZ 2026
 * Licensed under the GNU General Public License v3.
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
    const trimmed = text.trim().toUpperCase();
    return trimmed.startsWith('BEGIN:VCARD') && trimmed.endsWith('END:VCARD');
}

/* ============================================================================
 * SECTION: vCard Parsing
 * ========================================================================= */

/**
 * Parse a vCard string into a structured object for the editor wizard.
 * 
 * @param {string} vcfString - The raw vCard text.
 * @returns {Object} Parsed contact data, e.g. { version: '4.0', FN: [{type:'', value:'John Doe'}], TEL: [...] }
 * @throws {Error} If the input is not a valid vCard.
 */
function parseVCard(vcfString) {
    if (!isValidVCard(vcfString)) {
        throw new Error('Invalid vCard: must start with BEGIN:VCARD and end with END:VCARD');
    }

    const result = { version: '4.0' };

    // Unfold continuation lines (RFC 6350: line starting with space/tab is continuation)
    const unfolded = vcfString.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        const upperLine = trimmedLine.toUpperCase();
        if (!trimmedLine || upperLine === 'BEGIN:VCARD' || upperLine === 'END:VCARD') continue;

        const colonIndex = trimmedLine.indexOf(':');
        // If there's no colon, or it's just a malformed line, skip
        if (colonIndex === -1) continue;

        const propertyPart = trimmedLine.substring(0, colonIndex);
        let value = trimmedLine.substring(colonIndex + 1).trim();

        const propSplits = propertyPart.split(';');
        const propertyName = propSplits[0].toUpperCase();

        if (propertyName === 'VERSION') {
            result.version = value;
            continue;
        }

        let typeParams = [];
        let rawOtherParams = [];
        if (propSplits.length > 1) {
            // Find type parameter
            for (let i = 1; i < propSplits.length; i++) {
                const param = propSplits[i].toUpperCase();
                // vCard 4.0 style: TYPE=WORK,VOICE or TYPE="work,voice"
                if (param.startsWith('TYPE=')) {
                    const vals = param.substring(5).replace(/"/g, '').split(',');
                    typeParams.push(...vals);
                }
                // vCard 2.1/3.0 style: WORK
                else if (!param.includes('=')) {
                    typeParams.push(param);
                }
                else {
                    rawOtherParams.push(propSplits[i]);
                }
            }
        }
        let typeParam = typeParams.join(',');

        if (!result[propertyName]) result[propertyName] = [];

        // Un-escape specific delimiters if needed for UI
        if (propertyName === 'ORG') {
            value = value.replace(/\\;/g, ';');
        }

        result[propertyName].push({ type: typeParam, value, rawOtherParams });
    }

    // --- Mandatory Compliance Fixes ---
    // vCard 3.0 and 4.0 require FN (Formatted Name) and N (Name Parts).
    // If one is missing but the other exists, derive it.

    if (!result['N'] || result['N'].length === 0) {
        if (result['FN'] && result['FN'].length > 0) {
            const fullName = result['FN'][0].value;
            const parts = fullName.split(' ');
            const family = parts.length > 1 ? parts.pop() : '';
            const given = parts.join(' ');
            result['N'] = [{ type: '', value: `${family};${given};;;` }];
        } else {
            // Fallback empty
            result['N'] = [{ type: '', value: ';;;;' }];
        }
    }

    if (!result['FN'] || result['FN'].length === 0) {
        if (result['N'] && result['N'].length > 0) {
            const parts = result['N'][0].value.split(';');
            const family = parts[0] ? parts[0].trim() : '';
            const given = parts[1] ? parts[1].trim() : '';
            const fn = `${given} ${family}`.trim();
            result['FN'] = [{ type: '', value: fn || 'Unknown' }];
        } else {
            result['FN'] = [{ type: '', value: 'Unknown' }];
        }
    }

    return result;
}


/* ============================================================================
 * SECTION: Size Optimization
 * ========================================================================= */

/**
 * Optimizes a list of vCard properties for NFC capacity based on targeting guidelines.
 * 
 * @param {Array} props - Array of { key, param, value }
 * @param {string} version - Target vCard version 
 * @returns {Array} Optimized array
 */
function optimizeVCardProps(props, version) {
    const optimized = [];

    props.forEach(p => {
        let { key, param, value, rawOtherParams } = p;
        if (!value.trim()) return;

        // 1. Strip visual separators from Phone numbers (spaces, brackets, hyphens)
        // This is explicitly an optimization routine per user request.
        if (key === 'TEL') {
            // Handle tel: URI prefix — only strip formatters from the number portion
            if (/^tel:/i.test(value)) {
                const number = value.substring(4).replace(/[\s\(\)\[\]\-]/g, '');
                value = 'tel:' + number;
            } else {
                value = value.replace(/[\s\(\)\[\]\-]/g, '');
            }
        }

        // 2. Transform TYPE parameters to concise format (handled partly by the editor output generator)
        // Here we ensure the param is capitalized and neat.
        if (param) {
            param = param.toUpperCase().trim();
        }

        optimized.push({ key, param, value, rawOtherParams: rawOtherParams || [] });
    });

    return optimized;
}

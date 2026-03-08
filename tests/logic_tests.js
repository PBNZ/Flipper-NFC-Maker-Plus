const fs = require('fs');
const path = require('path');

// Basic polyfill for browser APIs used in the code
global.TextEncoder = require('util').TextEncoder;

// Load the scripts
const helperScript = fs.readFileSync(path.join(__dirname, '../src/js/nfc-generator.js'), 'utf8');
const parserScript = fs.readFileSync(path.join(__dirname, '../src/js/vcard-parser.js'), 'utf8');

// Evaluate in global scope so classes are available
const vm = require('vm');
const context = vm.createContext({ console, process, TextEncoder: global.TextEncoder, Array, Math, String, Object, globalThis: {} });
vm.runInContext(helperScript + ';\nglobalThis.NfcNtag = NfcNtag; globalThis.NfcHelper = NfcHelper;', context);
vm.runInContext(parserScript + ';\nglobalThis.parseVCard = parseVCard; globalThis.optimizeVCardProps = optimizeVCardProps;', context);

const parseVCard = context.globalThis.parseVCard;
const optimizeVCardProps = context.globalThis.optimizeVCardProps;
const NfcNtag = context.globalThis.NfcNtag;

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`✅ PASS: ${message}`);
    } else {
        failed++;
        console.error(`❌ FAIL: ${message}`);
    }
}

console.log('--- Testing vCard Parser ---');

// Test 1: Valid basic 4.0 vcard
const basicVcard = `BEGIN:VCARD
VERSION:4.0
FN:John Doe
N:Doe;John;;;
TEL;TYPE=work,voice;VALUE=uri:tel:+1-111-555-1212
EMAIL:jdoe@example.com
END:VCARD`;

const parsed1 = parseVCard(basicVcard);
assert(parsed1.version === '4.0', 'Parses version 4.0 correctly');
assert(parsed1.FN[0].value === 'John Doe', 'Parses FN correctly');
assert(parsed1.N[0].value === 'Doe;John;;;', 'Parses N correctly');
assert(parsed1.TEL[0].value === 'tel:+1-111-555-1212', 'Parses TEL value correctly');
assert(parsed1.TEL[0].type === 'WORK,VOICE' || parsed1.TEL[0].type === 'WORK', 'Parses multi TYPE param correctly');
assert(parsed1.EMAIL[0].value === 'jdoe@example.com', 'Parses EMAIL correctly');

// Test 2: Incomplete vCard (Missing N but has FN) - Compliance check
const incompleteVcard = `BEGIN:VCARD
VERSION:3.0
FN:Jane Taylor
TEL:123456789
END:VCARD`;

const parsed2 = parseVCard(incompleteVcard);
assert(parsed2.N && parsed2.N[0].value === 'Taylor;Jane;;;', 'Compliance: Derives N from FN');

// Test 3: Missing FN but has N - Compliance check
const incompleteVcard2 = `BEGIN:VCARD
VERSION:3.0
N:Smith;Bob;;;
TEL:987654321
END:VCARD`;

const parsed3 = parseVCard(incompleteVcard2);
assert(parsed3.FN && parsed3.FN[0].value === 'Bob Smith', 'Compliance: Derives FN from N');

// Test 4: Optimization
const vcardProps = [
    { key: 'TEL', param: 'WORK', value: '+1 (555) 123-4567' },
    { key: 'EMAIL', param: 'home', value: 'bob@smith.com' }
];

const optimized = optimizeVCardProps(vcardProps, '4.0');
assert(optimized[0].value === '+15551234567', 'Optimization strips visual separators from TEL');
assert(optimized[1].param === 'HOME', 'Optimization capitalizes param');

console.log('\n--- Testing NFC Generator ---');

// Test Capacity calculations
const vcardStr = `BEGIN:VCARD\nVERSION:4.0\nFN:Tester\nEND:VCARD`;
const vcfUrl = `https://example.com/test.vcf`;

const singleSize = NfcNtag.calculateSingleRecordSize(vcardStr, 'text/vcard');
assert(singleSize > vcardStr.length, 'Single record size includes overhead');

const dualSize = NfcNtag.calculateDualRecordSize(vcardStr, vcfUrl);
assert(dualSize > singleSize, 'Dual record size is larger than single');

// Test Tag generation
let errorThrown = false;
try {
    const generator = new NfcNtag('NTAG215');
    generator.generateVcardTag(vcardStr);
    const nfcFileStr = generator.exportData();
    assert(nfcFileStr.includes('Filetype: Flipper NFC device'), 'Tag generation successful to string');
    assert(nfcFileStr.includes('NTAG215'), 'Tag correctly identifies as NTAG215');
} catch (e) {
    console.error(e);
    errorThrown = true;
}
assert(!errorThrown, 'generateVcardTag completes without error for valid payload');

// Test Oversized Payload
let overSizeErrorThrown = false;
try {
    const generator213 = new NfcNtag('NTAG213'); // 144ndf byte limit
    const largeVcard = `BEGIN:VCARD\nVERSION:4.0\nFN:Test Name With Lots Of Extra Padding To Exceed Limit `.repeat(10) + `END:VCARD`;
    generator213.generateVcardTag(largeVcard);
} catch (e) {
    if (e.message.includes('NDEF message too large')) {
        overSizeErrorThrown = true;
    }
}
assert(overSizeErrorThrown, 'Throws error when payload exceeds tag capacity');


console.log('\n--- Testing Edge Cases & Parsing Quirks ---');
// Test ORG unescaping
const orgVcard = `BEGIN:VCARD\nVERSION:4.0\nORG:My Company\\;Dept A\nEND:VCARD`;
const orgParsed = parseVCard(orgVcard);
assert(orgParsed.ORG[0].value === 'My Company;Dept A', 'Properly unescapes ORG semicolons');

// Test URI Prefix compression (Internal testing via generating a tag)
const tagGenPrefix1 = new NfcNtag('NTAG213');
tagGenPrefix1.generateUrlTag('tel:+1234567');
const export1 = tagGenPrefix1.exportData();
// Prefix 0x05 is for tel:. + is 2B
assert(export1.includes('05 2B'), 'Successfully compressed tel: URI tag into NDEF record');

const tagGenPrefix2 = new NfcNtag('NTAG213');
tagGenPrefix2.generateUrlTag('https://www.google.com');
const export2 = tagGenPrefix2.exportData();
// Compress 'https://www.' using prefix 0x02. 'g' is 67
assert(export2.includes('02 67'), 'Successfully compressed https://www into NDEF record');

console.log(`\nTests Complete. Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);

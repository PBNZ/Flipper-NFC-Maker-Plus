#!/usr/bin/env node
/**
 * vCard 4.0 (RFC 6350) Test Data Generator
 *
 * Generates comprehensive test VCF files covering every property,
 * parameter, value type, encoding edge-case, and structural variation
 * defined in RFC 6350 and common extensions.
 */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "test-vcards");

// ── Helpers ─────────────────────────────────────────────────────────
function vcard(lines) {
  return ["BEGIN:VCARD", "VERSION:4.0", ...lines, "END:VCARD"].join("\r\n") + "\r\n";
}

function write(name, content) {
  fs.writeFileSync(path.join(OUT_DIR, name), content, "utf8");
}

// ── Data pools ──────────────────────────────────────────────────────
const firstNames = [
  "James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda",
  "David","Elizabeth","William","Barbara","Richard","Susan","Joseph","Jessica",
  "Thomas","Sarah","Charles","Karen","Christopher","Lisa","Daniel","Nancy",
  "Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley",
  "Steven","Dorothy","Paul","Kimberly","Andrew","Emily","Joshua","Donna",
  "Kenneth","Michelle","Kevin","Carol","Brian","Amanda","George","Melissa",
  "Timothy","Deborah","Ronald","Stephanie","Edward","Rebecca","Jason","Sharon",
  "Jeffrey","Laura","Ryan","Cynthia","Jacob","Kathleen","Gary","Amy",
  "Nicholas","Angela","Eric","Shirley","Jonathan","Anna","Stephen","Brenda",
  "Larry","Pamela","Justin","Emma","Scott","Nicole","Brandon","Helen",
  "Benjamin","Samantha","Samuel","Katherine","Raymond","Christine","Gregory","Debra",
  "Frank","Rachel","Alexander","Carolyn","Patrick","Janet","Jack","Catherine",
];

const lastNames = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
  "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas",
  "Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White",
  "Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young",
  "Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell",
  "Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker",
  "Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales","Murphy",
  "Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey",
  "Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson",
];

const companies = [
  "Acme Corp","Globex Industries","Initech","Umbrella Corporation",
  "Wayne Enterprises","Stark Industries","Cyberdyne Systems","Soylent Corp",
  "Massive Dynamic","Aperture Science","Oscorp Industries","LexCorp",
  "Tyrell Corporation","Weyland-Yutani","Vault-Tec","Black Mesa Research",
  "Pied Piper","Hooli","Dunder Mifflin","Bluth Company",
  "Sterling Cooper","Wonka Industries","Rekall Inc","OCP",
  "InGen","Nakatomi Trading","Oceanic Airlines","Buy n Large",
];

const titles = [
  "Software Engineer","Product Manager","CEO","CTO","VP of Engineering",
  "Data Scientist","UX Designer","Marketing Director","Sales Manager",
  "DevOps Engineer","Security Analyst","Research Scientist","CFO",
  "Principal Architect","Staff Engineer","Technical Writer","QA Lead",
  "Scrum Master","Business Analyst","Solutions Architect",
  "Frontend Developer","Backend Developer","Full Stack Developer",
  "Machine Learning Engineer","Database Administrator",
  "Network Engineer","Systems Administrator","IT Director",
];

const roles = [
  "Engineering","Management","Executive","Research","Design",
  "Marketing","Sales","Operations","Support","Legal",
  "Finance","Human Resources","Product","Strategy","Consulting",
];

const streets = [
  "123 Main St","456 Oak Ave","789 Pine Rd","1010 Elm Blvd",
  "2345 Maple Dr","6789 Cedar Ln","321 Birch Way","555 Walnut Ct",
  "42 Hitchhiker Ln","1600 Pennsylvania Ave NW","221B Baker St",
  "350 Fifth Avenue","1 Infinite Loop","One Microsoft Way",
];

const cities = [
  "New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia",
  "San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville",
  "Portland","Seattle","Denver","Nashville","Boston","Memphis",
];

const states = ["NY","CA","IL","TX","AZ","PA","TX","CA","TX","CA","TX","FL","OR","WA","CO","TN","MA","TN"];

const countries = ["USA","United States","US"];

const domains = ["example.com","test.org","sample.net","demo.io","fake.dev","mockdata.biz"];

const phoneFormats = [
  (a,b,c) => `tel:+1-${a}-${b}-${c}`,
  (a,b,c) => `tel:+1${a}${b}${c}`,
  (a,b,c) => `tel:+1(${a})${b}-${c}`,
  (a,b,c) => `+1-${a}-${b}-${c}`,
  (a,b,c) => `(${a}) ${b}-${c}`,
  (a,b,c) => `${a}.${b}.${c}`,
  (a,b,c) => `+1 ${a} ${b} ${c}`,
];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function areaCode() { return String(randInt(200, 999)); }
function exchange() { return String(randInt(200, 999)); }
function subscriber() { return String(randInt(1000, 9999)); }
function phone() { return pick(phoneFormats)(areaCode(), exchange(), subscriber()); }
function zip() { return String(randInt(10000, 99999)); }
function email(first, last, domain) { return `${first.toLowerCase()}.${last.toLowerCase()}@${domain || pick(domains)}`; }
function uid() { return "urn:uuid:" + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); }); }
function isoNow() { return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"; }
function randomDate(startYear, endYear) {
  const y = randInt(startYear, endYear);
  const m = String(randInt(1, 12)).padStart(2, "0");
  const d = String(randInt(1, 28)).padStart(2, "0");
  return `${y}${m}${d}`;
}
function randomDateTime() {
  return randomDate(2020, 2026) + "T" + String(randInt(0,23)).padStart(2,"0") + String(randInt(0,59)).padStart(2,"0") + String(randInt(0,59)).padStart(2,"0") + "Z";
}

// Escape vCard text values
function esc(text) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// ── File generators ─────────────────────────────────────────────────
const files = [];

// ---------- 1. Absolute minimum vCard ----------
files.push(["001_minimal.vcf", vcard([
  "FN:John Doe",
])]);

// ---------- 2. Minimal with N ----------
files.push(["002_minimal_with_n.vcf", vcard([
  "N:Doe;John;;;",
  "FN:John Doe",
])]);

// ---------- 3. All N components ----------
files.push(["003_full_n_components.vcf", vcard([
  "N:Van Der Berg;Jan;Pieter,Willem;Dr.;Jr.,M.D.",
  "FN:Dr. Jan Pieter Willem Van Der Berg Jr.\\, M.D.",
])]);

// ---------- 4. Basic contact with common fields ----------
files.push(["004_basic_contact.vcf", vcard([
  "N:Smith;Jane;;;",
  "FN:Jane Smith",
  "ORG:Acme Corp",
  "TITLE:Software Engineer",
  "TEL;VALUE=uri;TYPE=cell:tel:+1-555-123-4567",
  "EMAIL:jane.smith@example.com",
  "ADR;TYPE=work:;;123 Main St;New York;NY;10001;USA",
  "URL:https://janesmith.example.com",
  "NOTE:Test contact with basic fields.",
])]);

// ---------- 5. Multiple phone numbers with all TYPE values ----------
files.push(["005_multiple_phones.vcf", vcard([
  "N:Johnson;Robert;;;",
  "FN:Robert Johnson",
  "TEL;VALUE=uri;TYPE=\"work,voice\":tel:+1-555-100-0001",
  "TEL;VALUE=uri;TYPE=\"home,voice\":tel:+1-555-100-0002",
  "TEL;VALUE=uri;TYPE=cell:tel:+1-555-100-0003",
  "TEL;VALUE=uri;TYPE=\"work,fax\":tel:+1-555-100-0004",
  "TEL;VALUE=uri;TYPE=\"home,fax\":tel:+1-555-100-0005",
  "TEL;VALUE=uri;TYPE=pager:tel:+1-555-100-0006",
  "TEL;VALUE=uri;TYPE=text:tel:+1-555-100-0007",
  "TEL;VALUE=uri;TYPE=textphone:tel:+1-555-100-0008",
  "TEL;VALUE=uri;TYPE=video:tel:+1-555-100-0009",
  "TEL;VALUE=uri;PREF=1;TYPE=cell:tel:+1-555-100-0010",
])]);

// ---------- 6. Phone numbers as plain text (no VALUE=uri) ----------
files.push(["006_phones_text_value.vcf", vcard([
  "N:Williams;Maria;;;",
  "FN:Maria Williams",
  "TEL;TYPE=home:+1 (555) 200-1111",
  "TEL;TYPE=work:555.200.2222",
  "TEL;TYPE=cell:(555) 200-3333",
  "TEL:555-200-4444",
])]);

// ---------- 7. Multiple email addresses with types ----------
files.push(["007_multiple_emails.vcf", vcard([
  "N:Brown;Alex;;;",
  "FN:Alex Brown",
  "EMAIL;TYPE=work;PREF=1:alex.brown@acme.example.com",
  "EMAIL;TYPE=home:alexb@personal.example.net",
  "EMAIL;TYPE=work:a.brown@subsidiary.example.org",
  "EMAIL:alex.throwaway@free.example.io",
])]);

// ---------- 8. Multiple addresses ----------
files.push(["008_multiple_addresses.vcf", vcard([
  "N:Garcia;Carlos;;;",
  "FN:Carlos Garcia",
  "ADR;TYPE=work:;;350 Fifth Avenue;New York;NY;10118;USA",
  "ADR;TYPE=home:;;789 Pine Rd;Los Angeles;CA;90001;USA",
  "ADR;TYPE=home;PREF=1;LABEL=\"789 Pine Rd\\nLos Angeles\\, CA 90001\\nUSA\":;;789 Pine Rd;Los Angeles;CA;90001;USA",
])]);

// ---------- 9. Address with all components and LABEL ----------
files.push(["009_full_address.vcf", vcard([
  "N:Martinez;Sofia;;;",
  "FN:Sofia Martinez",
  "ADR;TYPE=work;LABEL=\"Suite 400\\n123 Business Park Dr\\nAustin\\, TX 78701\\nUSA\":Suite 400;Bldg C;123 Business Park Dr;Austin;TX;78701;USA",
])]);

// ---------- 10. Birthday - full date ----------
files.push(["010_birthday_full.vcf", vcard([
  "N:Davis;Emily;;;",
  "FN:Emily Davis",
  "BDAY:19850315",
])]);

// ---------- 11. Birthday - date-time ----------
files.push(["011_birthday_datetime.vcf", vcard([
  "N:Wilson;Tom;;;",
  "FN:Tom Wilson",
  "BDAY:19900722T083000Z",
])]);

// ---------- 12. Birthday - year unknown (--MMDD) ----------
files.push(["012_birthday_no_year.vcf", vcard([
  "N:Moore;Lisa;;;",
  "FN:Lisa Moore",
  "BDAY:--0704",
])]);

// ---------- 13. Birthday - month only (--MM) ----------
files.push(["013_birthday_month_only.vcf", vcard([
  "N:Taylor;Chris;;;",
  "FN:Chris Taylor",
  "BDAY:--12",
])]);

// ---------- 14. Birthday as text value ----------
files.push(["014_birthday_text.vcf", vcard([
  "N:Anderson;Pat;;;",
  "FN:Pat Anderson",
  "BDAY;VALUE=text:circa 1960",
])]);

// ---------- 15. Anniversary ----------
files.push(["015_anniversary.vcf", vcard([
  "N:Thomas;Rachel;Marie;;",
  "FN:Rachel Marie Thomas",
  "BDAY:19780614",
  "ANNIVERSARY:20050903",
])]);

// ---------- 16. Anniversary as text ----------
files.push(["016_anniversary_text.vcf", vcard([
  "N:Jackson;Frank;;;",
  "FN:Frank Jackson",
  "ANNIVERSARY;VALUE=text:Summer 2010",
])]);

// ---------- 17. Gender variations ----------
files.push(["017_gender_male.vcf", vcard([
  "N:White;Peter;;;",
  "FN:Peter White",
  "GENDER:M",
])]);

files.push(["018_gender_female.vcf", vcard([
  "N:Harris;Laura;;;",
  "FN:Laura Harris",
  "GENDER:F",
])]);

files.push(["019_gender_other.vcf", vcard([
  "N:Clark;Jordan;;;",
  "FN:Jordan Clark",
  "GENDER:O;Non-binary",
])]);

files.push(["020_gender_none.vcf", vcard([
  "N:Lewis;Sam;;;",
  "FN:Sam Lewis",
  "GENDER:N",
])]);

files.push(["021_gender_unknown.vcf", vcard([
  "N:Robinson;Casey;;;",
  "FN:Casey Robinson",
  "GENDER:U",
])]);

files.push(["022_gender_identity_only.vcf", vcard([
  "N:Walker;Riley;;;",
  "FN:Riley Walker",
  "GENDER:;Genderqueer",
])]);

// ---------- 23. NICKNAME ----------
files.push(["023_nickname.vcf", vcard([
  "N:Young;William;;;",
  "FN:William Young",
  "NICKNAME:Bill,Billy,Will",
])]);

// ---------- 24. PHOTO as URI ----------
files.push(["024_photo_uri.vcf", vcard([
  "N:Allen;Sarah;;;",
  "FN:Sarah Allen",
  "PHOTO;MEDIATYPE=image/jpeg:https://example.com/photos/sarah-allen.jpg",
])]);

// ---------- 25. PHOTO as base64 (tiny 1x1 PNG) ----------
const tinyPNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
files.push(["025_photo_base64.vcf", vcard([
  "N:King;Michael;;;",
  "FN:Michael King",
  `PHOTO;ENCODING=b;MEDIATYPE=image/png:${tinyPNG}`,
])]);

// ---------- 26. PHOTO as data URI ----------
files.push(["026_photo_data_uri.vcf", vcard([
  "N:Wright;Amanda;;;",
  "FN:Amanda Wright",
  `PHOTO:data:image/png;base64,${tinyPNG}`,
])]);

// ---------- 27. LOGO ----------
files.push(["027_logo.vcf", vcard([
  "N:Scott;David;;;",
  "FN:David Scott",
  "ORG:Globex Industries",
  "LOGO;MEDIATYPE=image/png:https://example.com/logos/globex.png",
])]);

// ---------- 28. Multiple ORG levels ----------
files.push(["028_org_multi_level.vcf", vcard([
  "N:Torres;Maria;;;",
  "FN:Maria Torres",
  "ORG:Umbrella Corporation;Research Division;Biotech Lab",
])]);

// ---------- 29. GEO property ----------
files.push(["029_geo.vcf", vcard([
  "N:Nguyen;Tran;;;",
  "FN:Tran Nguyen",
  "GEO:geo:40.7128,-74.0060",
])]);

// ---------- 30. TZ as UTC offset ----------
files.push(["030_tz_utc_offset.vcf", vcard([
  "N:Hill;Brandon;;;",
  "FN:Brandon Hill",
  "TZ:utc-05:00",
])]);

// ---------- 31. TZ as text ----------
files.push(["031_tz_text.vcf", vcard([
  "N:Flores;Ana;;;",
  "FN:Ana Flores",
  "TZ;VALUE=text:US Eastern",
])]);

// ---------- 32. TZ as URI ----------
files.push(["032_tz_uri.vcf", vcard([
  "N:Green;Kevin;;;",
  "FN:Kevin Green",
  "TZ;VALUE=uri:America/New_York",
])]);

// ---------- 33. LANG property ----------
files.push(["033_lang.vcf", vcard([
  "N:Adams;Pierre;;;",
  "FN:Pierre Adams",
  "LANG;PREF=1:fr",
  "LANG;PREF=2:en",
])]);

// ---------- 34. IMPP - various protocols ----------
files.push(["034_impp.vcf", vcard([
  "N:Nelson;Steve;;;",
  "FN:Steve Nelson",
  "IMPP;PREF=1:xmpp:steve@jabber.example.com",
  "IMPP:sip:steve.nelson@voip.example.com",
  "IMPP:irc:steve_n@irc.example.net",
  "IMPP:skype:steve.nelson.live",
])]);

// ---------- 35. CATEGORIES ----------
files.push(["035_categories.vcf", vcard([
  "N:Baker;Nicole;;;",
  "FN:Nicole Baker",
  "CATEGORIES:Friends,Coworkers",
])]);

// ---------- 36. Multiple CATEGORIES ----------
files.push(["036_categories_multi.vcf", vcard([
  "N:Hall;Gregory;;;",
  "FN:Gregory Hall",
  "CATEGORIES:VIP",
  "CATEGORIES:Client,Business",
  "CATEGORIES:Golf Buddy",
])]);

// ---------- 37. NOTE with newlines ----------
files.push(["037_note_newlines.vcf", vcard([
  "N:Rivera;Diana;;;",
  "FN:Diana Rivera",
  "NOTE:First line of note.\\nSecond line with more details.\\nThird line\\, with a comma.",
])]);

// ---------- 38. NOTE with special chars ----------
files.push(["038_note_special_chars.vcf", vcard([
  "N:Campbell;Oscar;;;",
  "FN:Oscar Campbell",
  "NOTE:Contains semicolons\\; commas\\, and backslashes\\\\ plus newlines\\n and unicode: \u00e9\u00e0\u00fc\u00f1",
])]);

// ---------- 39. URL property multiple ----------
files.push(["039_urls_multiple.vcf", vcard([
  "N:Mitchell;Tina;;;",
  "FN:Tina Mitchell",
  "URL;TYPE=work:https://www.acme.example.com",
  "URL;TYPE=home:https://tina-mitchell.example.blog",
  "URL:https://github.example.com/tmitchell",
])]);

// ---------- 40. RELATED property ----------
files.push(["040_related.vcf", vcard([
  "N:Carter;Marcus;;;",
  "FN:Marcus Carter",
  "RELATED;TYPE=spouse;VALUE=text:Sandra Carter",
  "RELATED;TYPE=child;VALUE=text:Emma Carter",
  "RELATED;TYPE=sibling;VALUE=uri:urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479",
])]);

// ---------- 41. ROLE ----------
files.push(["041_role.vcf", vcard([
  "N:Roberts;Angela;;;",
  "FN:Angela Roberts",
  "ORG:Pied Piper",
  "TITLE:Chief Technology Officer",
  "ROLE:Executive Management",
])]);

// ---------- 42. REV timestamp ----------
files.push(["042_rev.vcf", vcard([
  "N:Gomez;Diego;;;",
  "FN:Diego Gomez",
  "REV:20240115T103000Z",
])]);

// ---------- 43. UID ----------
files.push(["043_uid.vcf", vcard([
  "N:Phillips;Rachel;;;",
  "FN:Rachel Phillips",
  "UID:urn:uuid:550e8400-e29b-41d4-a716-446655440000",
])]);

// ---------- 44. PRODID ----------
files.push(["044_prodid.vcf", vcard([
  "N:Evans;Derek;;;",
  "FN:Derek Evans",
  "PRODID:-//Flipper NFC Maker Plus//Test Generator//EN",
])]);

// ---------- 45. SOURCE ----------
files.push(["045_source.vcf", vcard([
  "N:Turner;Megan;;;",
  "FN:Megan Turner",
  "SOURCE:https://contacts.example.com/vcards/megan-turner.vcf",
])]);

// ---------- 46. KIND:individual (default) ----------
files.push(["046_kind_individual.vcf", vcard([
  "KIND:individual",
  "N:Diaz;Luis;;;",
  "FN:Luis Diaz",
])]);

// ---------- 47. KIND:group ----------
files.push(["047_kind_group.vcf", vcard([
  "KIND:group",
  "FN:Engineering Team",
  "MEMBER:urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  "MEMBER:urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "MEMBER:urn:uuid:6ba7b810-9dad-11d1-80b4-00c04fd430c8",
])]);

// ---------- 48. KIND:org ----------
files.push(["048_kind_org.vcf", vcard([
  "KIND:org",
  "FN:Acme Corporation",
  "ORG:Acme Corporation",
  "TEL;VALUE=uri:tel:+1-555-000-0000",
  "EMAIL:info@acme.example.com",
  "ADR;TYPE=work:;;One Acme Plaza;Chicago;IL;60601;USA",
  "URL:https://www.acme.example.com",
])]);

// ---------- 49. KIND:location ----------
files.push(["049_kind_location.vcf", vcard([
  "KIND:location",
  "FN:Conference Room Alpha",
  "GEO:geo:37.7749,-122.4194",
  "ADR:;;100 Tech Blvd\\, Room 301;San Francisco;CA;94105;USA",
])]);

// ---------- 50. KEY property as URI ----------
files.push(["050_key_uri.vcf", vcard([
  "N:Parker;Jeff;;;",
  "FN:Jeff Parker",
  "KEY;MEDIATYPE=application/pgp-keys:https://keys.example.com/jeff-parker.asc",
])]);

// ---------- 51. KEY as base64 ----------
files.push(["051_key_base64.vcf", vcard([
  "N:Cruz;Elena;;;",
  "FN:Elena Cruz",
  "KEY;VALUE=text:ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDfake+key+data== elena@example.com",
])]);

// ---------- 52. FBURL ----------
files.push(["052_fburl.vcf", vcard([
  "N:Edwards;Brian;;;",
  "FN:Brian Edwards",
  "FBURL;PREF=1:https://freebusy.example.com/brian",
  "FBURL;MEDIATYPE=text/calendar:https://cal.example.com/brian/freebusy",
])]);

// ---------- 53. CALURI and CALADRURI ----------
files.push(["053_caluri.vcf", vcard([
  "N:Collins;Nadia;;;",
  "FN:Nadia Collins",
  "CALURI;PREF=1:https://cal.example.com/nadia",
  "CALADRURI:mailto:nadia.collins@example.com",
])]);

// ---------- 54. X- extension properties ----------
files.push(["054_x_extensions.vcf", vcard([
  "N:Reyes;Marco;;;",
  "FN:Marco Reyes",
  "X-PHONETIC-FIRST-NAME:MAR-koh",
  "X-PHONETIC-LAST-NAME:RAY-ess",
  "X-SOCIALPROFILE;TYPE=twitter:https://twitter.example.com/marcoreyes",
  "X-SOCIALPROFILE;TYPE=linkedin:https://linkedin.example.com/in/marco-reyes",
  "X-SOCIALPROFILE;TYPE=github:https://github.example.com/marcoreyes",
  "X-MANAGER:Susan Fletcher",
  "X-ASSISTANT:Dave Brown",
  "X-SPOUSE:Maria Reyes",
  "X-CUSTOM-FIELD:Some arbitrary custom value",
])]);

// ---------- 55. Apple-style extensions ----------
files.push(["055_apple_extensions.vcf", vcard([
  "N:Stewart;Olivia;;;",
  "FN:Olivia Stewart",
  "item1.TEL:+1-555-300-0001",
  "item1.X-ABLabel:iPhone",
  "item2.TEL:+1-555-300-0002",
  "item2.X-ABLabel:Work Fax",
  "item3.EMAIL:olivia@example.com",
  "item3.X-ABLabel:Home",
  "item4.URL:https://olivia-blog.example.com",
  "item4.X-ABLabel:_$!<HomePage>!$_",
  "item5.X-ABDATE:2015-06-15",
  "item5.X-ABLabel:_$!<Anniversary>!$_",
  "item6.X-ABRELATEDNAMES:Bob Stewart",
  "item6.X-ABLabel:_$!<Spouse>!$_",
])]);

// ---------- 56. Google-style extensions ----------
files.push(["056_google_extensions.vcf", vcard([
  "N:Morris;Jason;;;",
  "FN:Jason Morris",
  "item1.EMAIL:jason.m@example.com",
  "item1.X-ABLabel:Personal",
  "X-GOOGLE-ETAG:\"abcdef1234567890\"",
  "X-ICQ:123456789",
  "X-YAHOO:jason_morris",
  "X-SKYPE:jason.morris.live",
  "X-JABBER:jason@jabber.example.org",
  "X-QQ:987654321",
])]);

// ---------- 57. Line folding (long lines) ----------
const longNote = "This is a very long note that should demonstrate the line folding capability of the vCard format. According to RFC 6350 section 3.2 line folding is performed by inserting a CRLF immediately followed by a single white space character. This ensures backward compatibility with implementations that have line length limits.";
// Manual folding at 75 octets
const foldedLines = [];
let currentLine = "NOTE:" + longNote;
while (currentLine.length > 75) {
  foldedLines.push(currentLine.substring(0, 75));
  currentLine = " " + currentLine.substring(75);
}
foldedLines.push(currentLine);

files.push(["057_line_folding.vcf", vcard([
  "N:Morales;Valentina;;;",
  "FN:Valentina Morales",
  ...foldedLines,
])]);

// ---------- 58. Line folding in middle of UTF-8 (tab continuation) ----------
files.push(["058_line_folding_tab.vcf", vcard([
  "N:Murphy;Sean;;;",
  "FN:Sean Murphy",
  "NOTE:This line is continued",
  "\twith a tab character",
  " and this with a space.",
])]);

// ---------- 59. SORT-AS parameter ----------
files.push(["059_sort_as.vcf", vcard([
  "N;SORT-AS=\"VanDerBerg,Jan\":Van Der Berg;Jan;;;",
  "FN;SORT-AS=\"VanDerBerg,Jan\":Jan Van Der Berg",
  "ORG;SORT-AS=\"Acme\":The Acme Corporation",
])]);

// ---------- 60. ALTID parameter ----------
files.push(["060_altid.vcf", vcard([
  "N:Tanaka;Hiro;;;",
  "FN;ALTID=1;LANGUAGE=en:Hiro Tanaka",
  "FN;ALTID=1;LANGUAGE=ja:\u7530\u4e2d\u5b8f",
  "ADR;ALTID=1;LANGUAGE=en:;;123 Sakura St;Tokyo;;100-0001;Japan",
  "ADR;ALTID=1;LANGUAGE=ja:;;\u685c\u901a\u308a123;東京都;;100-0001;\u65e5\u672c",
  "TITLE;ALTID=1;LANGUAGE=en:Senior Engineer",
  "TITLE;ALTID=1;LANGUAGE=ja:\u30b7\u30cb\u30a2\u30a8\u30f3\u30b8\u30cb\u30a2",
])]);

// ---------- 61. PID parameter ----------
files.push(["061_pid.vcf", vcard([
  "N:Kim;Soo-yeon;;;",
  "FN:Soo-yeon Kim",
  "EMAIL;PID=1.1:sooyeon@example.com",
  "EMAIL;PID=2.1:skim@work.example.com",
  "CLIENTPIDMAP:1;urn:uuid:53e374d9-337e-4727-8803-a1e9c14e0556",
])]);

// ---------- 62. UTF-8 International - Chinese ----------
files.push(["062_chinese.vcf", vcard([
  "N:\u738b;\u5c0f\u660e;;;",
  "FN:\u738b\u5c0f\u660e",
  "ORG:\u767e\u5ea6\u516c\u53f8",
  "TITLE:\u8f6f\u4ef6\u5de5\u7a0b\u5e08",
  "TEL;VALUE=uri;TYPE=cell:tel:+86-138-0000-0000",
  "EMAIL:xiaoming.wang@example.cn",
  "ADR;TYPE=work:;;\u6d77\u6dc0\u533a\u4e2d\u5173\u6751;\u5317\u4eac;;100190;\u4e2d\u56fd",
  "NOTE:\u8fd9\u662f\u4e00\u4e2a\u6d4b\u8bd5\u8054\u7cfb\u4eba",
])]);

// ---------- 63. UTF-8 International - Japanese ----------
files.push(["063_japanese.vcf", vcard([
  "N:\u4f50\u85e4;\u592a\u90ce;;;",
  "FN:\u4f50\u85e4\u592a\u90ce",
  "ORG:\u30bd\u30cb\u30fc\u682a\u5f0f\u4f1a\u793e",
  "TITLE:\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u30de\u30cd\u30fc\u30b8\u30e3\u30fc",
  "TEL;VALUE=uri;TYPE=work:tel:+81-3-1234-5678",
  "EMAIL:taro.sato@example.co.jp",
  "ADR;TYPE=work:;;\u6e2f\u533a\u516d\u672c\u6728;\u6771\u4eac\u90fd;;106-0032;\u65e5\u672c",
])]);

// ---------- 64. UTF-8 International - Korean ----------
files.push(["064_korean.vcf", vcard([
  "N:\ubc15;\uc9c0\uc601;;;",
  "FN:\ubc15\uc9c0\uc601",
  "ORG:\uc0bc\uc131\uc804\uc790",
  "TEL;VALUE=uri;TYPE=cell:tel:+82-10-1234-5678",
  "EMAIL:jiyoung.park@example.co.kr",
  "ADR;TYPE=work:;;\uc11c\ucd08\ub300\ub85c;\uc11c\uc6b8;;137345;\ub300\ud55c\ubbfc\uad6d",
])]);

// ---------- 65. UTF-8 International - Arabic ----------
files.push(["065_arabic.vcf", vcard([
  "N:\u0627\u0644\u0639\u0644\u064a;\u0623\u062d\u0645\u062f;;;",
  "FN:\u0623\u062d\u0645\u062f \u0627\u0644\u0639\u0644\u064a",
  "ORG:\u0634\u0631\u0643\u0629 \u0627\u0644\u062a\u0642\u0646\u064a\u0629",
  "TEL;VALUE=uri;TYPE=cell:tel:+966-50-000-0000",
  "EMAIL:ahmed@example.sa",
  "ADR;TYPE=work:;;\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0644\u0643;\u0627\u0644\u0631\u064a\u0627\u0636;;11564;\u0627\u0644\u0633\u0639\u0648\u062f\u064a\u0629",
])]);

// ---------- 66. UTF-8 International - Cyrillic ----------
files.push(["066_cyrillic.vcf", vcard([
  "N:\u0418\u0432\u0430\u043d\u043e\u0432;\u0410\u043b\u0435\u043a\u0441\u0435\u0439;\u041d\u0438\u043a\u043e\u043b\u0430\u0435\u0432\u0438\u0447;;",
  "FN:\u0410\u043b\u0435\u043a\u0441\u0435\u0439 \u041d\u0438\u043a\u043e\u043b\u0430\u0435\u0432\u0438\u0447 \u0418\u0432\u0430\u043d\u043e\u0432",
  "ORG:\u042f\u043d\u0434\u0435\u043a\u0441",
  "TEL;VALUE=uri;TYPE=cell:tel:+7-916-000-00-00",
  "EMAIL:alexey@example.ru",
  "ADR;TYPE=work:;;\u0443\u043b. \u041b\u044c\u0432\u0430 \u0422\u043e\u043b\u0441\u0442\u043e\u0433\u043e 16;\u041c\u043e\u0441\u043a\u0432\u0430;;119021;\u0420\u043e\u0441\u0441\u0438\u044f",
])]);

// ---------- 67. UTF-8 International - Accented/Diacritics ----------
files.push(["067_diacritics.vcf", vcard([
  "N:M\u00fcller;Ren\u00e9;J\u00f6rg;;",
  "FN:Ren\u00e9 J\u00f6rg M\u00fcller",
  "ORG:Universit\u00e4t Z\u00fcrich",
  "TITLE:Gesch\u00e4ftsf\u00fchrer",
  "TEL;VALUE=uri;TYPE=work:tel:+41-44-123-45-67",
  "EMAIL:rene.mueller@example.ch",
  "ADR;TYPE=work:;;R\u00e4mistrasse 71;Z\u00fcrich;;8006;Schweiz",
])]);

// ---------- 68. UTF-8 International - Hindi ----------
files.push(["068_hindi.vcf", vcard([
  "N:\u0936\u0930\u094d\u092e\u093e;\u0930\u093e\u091c;;;",
  "FN:\u0930\u093e\u091c \u0936\u0930\u094d\u092e\u093e",
  "ORG:\u091f\u093e\u091f\u093e \u0915\u0902\u0938\u0932\u094d\u091f\u0947\u0902\u0938\u0940 \u0938\u0930\u094d\u0935\u093f\u0938\u0947\u091c",
  "TEL;VALUE=uri;TYPE=cell:tel:+91-98765-43210",
  "EMAIL:raj.sharma@example.in",
])]);

// ---------- 69. Mixed case property names ----------
files.push(["069_mixed_case.vcf", vcard([
  "n:Cooper;James;;;",
  "fn:James Cooper",
  "Org:Initech",
  "TITLE:Senior Developer",
  "tel;type=cell:+1-555-400-0001",
  "email;TYPE=work:james.cooper@example.com",
  "Adr;Type=Work:;;123 Office Park;Portland;OR;97201;USA",
  "Note:Properties with mixed case names",
])]);

// ---------- 70. Escaped characters in values ----------
files.push(["070_escaped_chars.vcf", vcard([
  "N:O'Brien\\;Jr.;Patrick;;;",
  "FN:Patrick O'Brien\\; Jr.",
  "ORG:Smith\\, Jones\\, & Associates",
  "NOTE:Line 1\\nLine 2\\nBackslash: \\\\\\nSemicolon: \\;\\nComma: \\,",
  "ADR:;;123 Main St\\, Suite 4;City\\; State;;12345;",
])]);

// ---------- 71. Empty / missing optional fields ----------
files.push(["071_sparse.vcf", vcard([
  "FN:Sparse Contact",
])]);

// ---------- 72. FN only with spaces ----------
files.push(["072_fn_spaces.vcf", vcard([
  "FN:  Leading and Trailing Spaces  ",
])]);

// ---------- 73. Multiple FN (technically non-standard but seen in the wild) ----------
files.push(["073_multiple_fn.vcf", vcard([
  "N:Peterson;Erik;;;",
  "FN:Erik Peterson",
  "FN;LANGUAGE=sv:Erik Petersson",
])]);

// ---------- 74. N with empty components ----------
files.push(["074_n_empty_components.vcf", vcard([
  "N:Solo;;;;",
  "FN:Solo",
])]);

// ---------- 75. N with only given name ----------
files.push(["075_n_given_only.vcf", vcard([
  "N:;Madonna;;;",
  "FN:Madonna",
])]);

// ---------- 76. PREF parameter on various properties ----------
files.push(["076_pref_values.vcf", vcard([
  "N:Bailey;Stephanie;;;",
  "FN:Stephanie Bailey",
  "TEL;VALUE=uri;TYPE=cell;PREF=1:tel:+1-555-500-0001",
  "TEL;VALUE=uri;TYPE=work;PREF=2:tel:+1-555-500-0002",
  "TEL;VALUE=uri;TYPE=home;PREF=100:tel:+1-555-500-0003",
  "EMAIL;PREF=1:stephanie@example.com",
  "EMAIL;PREF=50:s.bailey@work.example.com",
  "ADR;PREF=1;TYPE=home:;;1 First St;Austin;TX;78701;USA",
  "ADR;PREF=2;TYPE=work:;;2 Second Ave;Dallas;TX;75201;USA",
])]);

// ---------- 77. International phone numbers ----------
files.push(["077_intl_phones.vcf", vcard([
  "N:Reed;Catherine;;;",
  "FN:Catherine Reed",
  "TEL;VALUE=uri;TYPE=cell:tel:+44-20-7946-0958",
  "TEL;VALUE=uri;TYPE=work:tel:+81-3-6234-5678",
  "TEL;VALUE=uri;TYPE=home:tel:+33-1-42-68-53-00",
  "TEL;VALUE=uri;TYPE=cell:tel:+86-138-0013-8000",
  "TEL;VALUE=uri;TYPE=work:tel:+49-30-1234567",
  "TEL;VALUE=uri;TYPE=home:tel:+61-2-1234-5678",
  "TEL;VALUE=uri;TYPE=cell:tel:+91-98765-43210",
  "TEL;VALUE=uri;TYPE=work:tel:+55-11-91234-5678",
])]);

// ---------- 78. SOUND property ----------
files.push(["078_sound.vcf", vcard([
  "N:Kelly;Patrick;;;",
  "FN:Patrick Kelly",
  "SOUND;MEDIATYPE=audio/ogg:https://example.com/sounds/patrick-kelly.ogg",
])]);

// ---------- 79. Fully loaded contact ----------
files.push(["079_fully_loaded.vcf", vcard([
  "KIND:individual",
  "N;SORT-AS=\"Howard,Jennifer\":Howard;Jennifer;Marie;Dr.;Ph.D.",
  "FN:Dr. Jennifer Marie Howard Ph.D.",
  "NICKNAME:Jen,Jenny",
  "PHOTO;MEDIATYPE=image/jpeg:https://example.com/photos/jhoward.jpg",
  "BDAY:19820517",
  "ANNIVERSARY:20100612",
  "GENDER:F",
  "ADR;TYPE=work;PREF=1;LABEL=\"Suite 200\\n100 Innovation Way\\nSan Jose\\, CA 95110\\nUSA\":Suite 200;;100 Innovation Way;San Jose;CA;95110;USA",
  "ADR;TYPE=home:;;456 Oak Ln;Palo Alto;CA;94301;USA",
  "TEL;VALUE=uri;TYPE=\"work,voice\";PREF=1:tel:+1-408-555-0100",
  "TEL;VALUE=uri;TYPE=cell:tel:+1-650-555-0200",
  "TEL;VALUE=uri;TYPE=\"home,voice\":tel:+1-650-555-0300",
  "TEL;VALUE=uri;TYPE=\"work,fax\":tel:+1-408-555-0101",
  "EMAIL;TYPE=work;PREF=1:jennifer.howard@stark.example.com",
  "EMAIL;TYPE=home:jen.howard@personal.example.net",
  "IMPP;PREF=1:xmpp:jhoward@jabber.example.com",
  "IMPP:sip:jennifer.howard@voip.example.com",
  "LANG;PREF=1:en",
  "LANG;PREF=2:es",
  "TZ:America/Los_Angeles",
  "GEO:geo:37.3382,-121.8863",
  "TITLE:VP of Research",
  "ROLE:Executive Management",
  "LOGO;MEDIATYPE=image/png:https://example.com/logos/stark.png",
  "ORG:Stark Industries;Research Division;AI Lab",
  "CATEGORIES:VIP,Executive,Research",
  "NOTE:Key contact for the AI research initiative.\\nReports directly to Tony Stark.",
  "PRODID:-//Test//vCard Generator//EN",
  "REV:20250101T120000Z",
  "SOUND;MEDIATYPE=audio/mp3:https://example.com/sounds/jennifer.mp3",
  "UID:urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "URL;TYPE=work:https://research.stark.example.com/jhoward",
  "URL;TYPE=home:https://jenhoward.example.blog",
  "KEY;MEDIATYPE=application/pgp-keys:https://keys.example.com/jhoward.asc",
  "FBURL:https://freebusy.example.com/jhoward",
  "CALURI:https://cal.example.com/jhoward",
  "CALADRURI:mailto:jennifer.howard@stark.example.com",
  "X-SOCIALPROFILE;TYPE=linkedin:https://linkedin.example.com/in/jennifer-howard",
  "X-SOCIALPROFILE;TYPE=twitter:https://twitter.example.com/jenhoward",
])]);

// ---------- 80. Multiple vCards in single file ----------
files.push(["080_multi_vcard_file.vcf", [
  vcard(["N:Multi;Alice;;;", "FN:Alice Multi", "TEL:+1-555-600-0001", "EMAIL:alice@example.com"]),
  vcard(["N:Multi;Bob;;;", "FN:Bob Multi", "TEL:+1-555-600-0002", "EMAIL:bob@example.com"]),
  vcard(["N:Multi;Carol;;;", "FN:Carol Multi", "TEL:+1-555-600-0003", "EMAIL:carol@example.com"]),
].join("")]);

// ---------- 81. GEO parameter on ADR ----------
files.push(["081_adr_geo_param.vcf", vcard([
  "N:Ward;Timothy;;;",
  "FN:Timothy Ward",
  "ADR;TYPE=work;GEO=\"geo:40.7484,-73.9857\":;;350 Fifth Avenue;New York;NY;10118;USA",
])]);

// ---------- 82. TZ parameter on ADR ----------
files.push(["082_adr_tz_param.vcf", vcard([
  "N:Richardson;Alice;;;",
  "FN:Alice Richardson",
  "ADR;TYPE=work;TZ=\"America/Chicago\":;;233 S Wacker Dr;Chicago;IL;60606;USA",
])]);

// ---------- 83. MEDIATYPE parameter on various ----------
files.push(["083_mediatype.vcf", vcard([
  "N:Cox;Vincent;;;",
  "FN:Vincent Cox",
  "PHOTO;MEDIATYPE=image/webp:https://example.com/photos/vcox.webp",
  "LOGO;MEDIATYPE=image/svg+xml:https://example.com/logos/company.svg",
  "SOUND;MEDIATYPE=audio/wav:https://example.com/sounds/vcox.wav",
])]);

// ---------- 84. VALUE parameter variations ----------
files.push(["084_value_param.vcf", vcard([
  "N:Ramos;Patricia;;;",
  "FN:Patricia Ramos",
  "TEL;VALUE=uri:tel:+1-555-700-0001",
  "TEL;VALUE=text:+1 (555) 700-0002",
  "GEO;VALUE=uri:geo:34.0522,-118.2437",
  "BDAY;VALUE=date-and-or-time:19880315",
  "BDAY;VALUE=text:March 15th",
])]);

// ---------- 85. Quoted parameter values ----------
files.push(["085_quoted_params.vcf", vcard([
  "N:Kim;Daniel;;;",
  "FN:Daniel Kim",
  "TEL;VALUE=uri;TYPE=\"work,voice,pref\":tel:+1-555-800-0001",
  "ADR;TYPE=\"work,postal,parcel\";LABEL=\"Floor 12\\n100 Main St\\nBoston\\, MA 02101\":;;100 Main St;Boston;MA;02101;USA",
])]);

// ---------- 86. CALSCALE parameter ----------
files.push(["086_calscale.vcf", vcard([
  "N:Ortiz;Carmen;;;",
  "FN:Carmen Ortiz",
  "BDAY;CALSCALE=gregorian:19920801",
])]);

// ---------- 87. Empty NOTE ----------
files.push(["087_empty_note.vcf", vcard([
  "N:Morgan;Blake;;;",
  "FN:Blake Morgan",
  "NOTE:",
])]);

// ---------- 88. Empty ADR ----------
files.push(["088_empty_adr.vcf", vcard([
  "N:Cooper;Ian;;;",
  "FN:Ian Cooper",
  "ADR:;;;;;;",
])]);

// ---------- 89. Tel URI with extension ----------
files.push(["089_tel_extension.vcf", vcard([
  "N:Peterson;Dale;;;",
  "FN:Dale Peterson",
  "TEL;VALUE=uri;TYPE=work:tel:+1-555-900-0001;ext=4567",
])]);

// ---------- 90. Very long FN ----------
files.push(["090_long_fn.vcf", vcard([
  "N:Von Hohenzollern-Sigmaringen;Maximilian;Friedrich Wilhelm Karl Georg Alexander;His Royal Highness Prince;Duke of Swabia\\, Count Palatine",
  "FN:His Royal Highness Prince Maximilian Friedrich Wilhelm Karl Georg Alexander Von Hohenzollern-Sigmaringen\\, Duke of Swabia\\, Count Palatine",
])]);

// ---------- 91. Only special/unusual characters in name ----------
files.push(["091_special_name.vcf", vcard([
  "N:O'Malley-Smith;Mary-Jane;;;",
  "FN:Mary-Jane O'Malley-Smith",
])]);

// ---------- 92. Emoji in NOTE (valid UTF-8) ----------
files.push(["092_emoji.vcf", vcard([
  "N:Test;Emoji;;;",
  "FN:Emoji Test",
  "NOTE:\ud83d\ude00 This note has emoji \ud83c\udf1f\ud83d\ude80\ud83c\udf54 and more \ud83d\udc4d",
  "CATEGORIES:\ud83c\udf1f VIP,\ud83d\udcbc Work",
])]);

// ---------- 93. Property groups with multiple properties ----------
files.push(["093_property_groups.vcf", vcard([
  "N:Howard;Dennis;;;",
  "FN:Dennis Howard",
  "work.TEL;VALUE=uri;TYPE=work:tel:+1-555-111-0001",
  "work.ORG:Globex Industries",
  "work.TITLE:Regional Manager",
  "work.ADR:;;555 Corporate Blvd;Houston;TX;77001;USA",
  "work.EMAIL:dennis.howard@globex.example.com",
  "home.TEL;VALUE=uri;TYPE=home:tel:+1-555-111-0002",
  "home.ADR:;;42 Elm St;Houston;TX;77002;USA",
  "home.EMAIL:dennis@personal.example.com",
])]);

// ---------- 94. Duplicate properties (parsers must handle) ----------
files.push(["094_duplicates.vcf", vcard([
  "N:Ramos;Diego;;;",
  "FN:Diego Ramos",
  "TEL:+1-555-222-0001",
  "TEL:+1-555-222-0002",
  "TEL:+1-555-222-0003",
  "EMAIL:diego1@example.com",
  "EMAIL:diego2@example.com",
  "EMAIL:diego3@example.com",
  "EMAIL:diego4@example.com",
  "EMAIL:diego5@example.com",
  "ORG:Company A",
  "ORG:Company B",
  "TITLE:Engineer",
  "TITLE:Consultant",
  "URL:https://one.example.com",
  "URL:https://two.example.com",
  "URL:https://three.example.com",
  "NOTE:First note.",
  "NOTE:Second note.",
])]);

// ---------- 95. Whitespace edge cases ----------
files.push(["095_whitespace.vcf", vcard([
  "N: Whitespace ; Test ;;;",
  "FN: Whitespace Test ",
  "ORG: Company With Spaces ",
  "TITLE: Job Title With Spaces ",
  "NOTE:   Multiple   spaces   in   note   ",
])]);

// ---------- 96. DATE-TIME variants for BDAY and ANNIVERSARY ----------
files.push(["096_datetime_variants.vcf", vcard([
  "N:Lopez;Adriana;;;",
  "FN:Adriana Lopez",
  // Full date
  "BDAY:19950215",
  // Date and time with UTC
  "ANNIVERSARY:20180614T150000Z",
])]);

files.push(["097_datetime_variants2.vcf", vcard([
  "N:Chen;Wei;;;",
  "FN:Wei Chen",
  // Date with time and offset
  "BDAY:19870903T100000-0500",
  // Year and month only
  "ANNIVERSARY:---15",
])]);

// ---------- 98. Bare minimum N with multiple given/additional names ----------
files.push(["098_multiple_given.vcf", vcard([
  "N:Santos;Ana,Maria;Teresa,Lucia;;",
  "FN:Ana Maria Teresa Lucia Santos",
])]);

// ---------- 99. Agent-like references (deprecated in 4.0 but seen in the wild) ----------
files.push(["099_agent_ref.vcf", vcard([
  "N:Fletcher;Susan;;;",
  "FN:Susan Fletcher",
  "ORG:Wayne Enterprises",
  "RELATED;TYPE=agent;VALUE=uri:urn:uuid:abcd1234-ef56-7890-abcd-ef1234567890",
  "NOTE:AGENT property is deprecated in vCard 4.0 but RELATED can serve the same purpose.",
])]);

// ---------- 100. XML property ----------
files.push(["100_xml_property.vcf", vcard([
  "N:Ward;Kelly;;;",
  "FN:Kelly Ward",
  "XML:<custom xmlns=\"http://example.com/ns\"><field1>Value 1</field1><field2>Value 2</field2></custom>",
])]);

// ---------- 101. BIRTHPLACE, DEATHPLACE, DEATHDATE (RFC 6474 extensions) ----------
files.push(["101_rfc6474.vcf", vcard([
  "N:Historical;Person;;;",
  "FN:Historical Person",
  "BDAY:19200101",
  "BIRTHPLACE;VALUE=text:Springfield\\, Illinois\\, USA",
  "DEATHDATE:19990315",
  "DEATHPLACE;VALUE=uri:geo:40.7128,-74.0060",
])]);

// ---------- 102. EXPERTISE, HOBBY, INTEREST (RFC 6715 extensions) ----------
files.push(["102_rfc6715.vcf", vcard([
  "N:Hobbyist;Alex;;;",
  "FN:Alex Hobbyist",
  "EXPERTISE;LEVEL=expert:Quantum Computing",
  "EXPERTISE;LEVEL=beginner:Oil Painting",
  "HOBBY;LEVEL=high:Rock Climbing",
  "HOBBY;LEVEL=medium:Photography",
  "INTEREST;LEVEL=high:Artificial Intelligence",
  "INTEREST;LEVEL=low:Gardening",
])]);

// ---------- 103. CONTACT-URI (RFC 8605) ----------
files.push(["103_contact_uri.vcf", vcard([
  "KIND:org",
  "FN:Example Corporation",
  "ORG:Example Corporation",
  "CONTACT-URI;PREF=1:mailto:contact@example.com",
  "CONTACT-URI:https://example.com/contact",
])]);

// ---------- 104. Very many properties stress test ----------
{
  const lines = ["N:Stress;Test;;;", "FN:Test Stress"];
  for (let i = 1; i <= 20; i++) lines.push(`TEL;VALUE=uri;TYPE=work:tel:+1-555-${String(i).padStart(3,"0")}-${String(i*111).padStart(4,"0")}`);
  for (let i = 1; i <= 15; i++) lines.push(`EMAIL:stress${i}@example${i}.com`);
  for (let i = 1; i <= 5; i++) lines.push(`ADR;TYPE=work:;;${i} Stress Lane;City ${i};ST;${String(10000+i)};USA`);
  for (let i = 1; i <= 5; i++) lines.push(`URL:https://stress${i}.example.com`);
  lines.push("NOTE:Stress test with many properties.");
  lines.push("CATEGORIES:Stress,Test,Many,Props,Edge,Case");
  files.push(["104_stress_many_props.vcf", vcard(lines)]);
}

// ---------- 105. Completely empty N components ----------
files.push(["105_empty_n.vcf", vcard([
  "N:;;;;",
  "FN:Anonymous",
])]);

// ---------- 106. Lowercase BEGIN/END/VERSION ----------
files.push(["106_lowercase_markers.vcf",
  "begin:vcard\r\nversion:4.0\r\nfn:Lowercase Markers\r\nn:Markers;Lowercase;;;\r\nend:vcard\r\n"
]);

// ---------- 107. LF-only line endings (non-standard but common) ----------
files.push(["107_lf_line_endings.vcf",
  "BEGIN:VCARD\nVERSION:4.0\nN:LF;Only;;;\nFN:Only LF\nTEL:+1-555-000-1111\nEMAIL:lf@example.com\nEND:VCARD\n"
]);

// ---------- 108. Mixed CRLF and LF ----------
files.push(["108_mixed_line_endings.vcf",
  "BEGIN:VCARD\r\nVERSION:4.0\nN:Mixed;LineEndings;;;\r\nFN:Mixed LineEndings\nTEL:+1-555-000-2222\r\nEMAIL:mixed@example.com\nEND:VCARD\r\n"
]);

// ---------- 109. Percent-encoded TEL URI ----------
files.push(["109_tel_encoded.vcf", vcard([
  "N:Test;Encoding;;;",
  "FN:Encoding Test",
  "TEL;VALUE=uri:tel:+1-555-123-4567%3Bext%3D100",
])]);

// ---------- 110. ADR with only city and country ----------
files.push(["110_partial_adr.vcf", vcard([
  "N:Partial;Address;;;",
  "FN:Address Partial",
  "ADR;TYPE=home:;;;Tokyo;;;Japan",
  "ADR;TYPE=work:;;;London;;;United Kingdom",
])]);

// ---------- 111. Non-URI IMPP values (seen from some exporters) ----------
files.push(["111_impp_nonuri.vcf", vcard([
  "N:Legacy;IM;;;",
  "FN:IM Legacy",
  "IMPP:aim:legacyim123",
  "IMPP:msnim:legacyim456",
  "IMPP:ymsgr:legacyim789",
  "IMPP:xmpp:legacy@jabber.example.com",
])]);

// ---------- 112. Very long ADR LABEL with many lines ----------
files.push(["112_long_label.vcf", vcard([
  "N:Label;Long;;;",
  "FN:Long Label",
  "ADR;TYPE=work;LABEL=\"Attn: Long Label\\nDepartment of Testing\\nFloor 42\\, Room 1337\\n123 Enterprise Way\\nSilicon Valley\\, CA 94000\\nUnited States of America\":;;123 Enterprise Way;Silicon Valley;CA;94000;USA",
])]);

// ---------- 113. GENDER with extended identity ----------
files.push(["113_gender_extended.vcf", vcard([
  "N:Identity;Extended;;;",
  "FN:Extended Identity",
  "GENDER:O;Agender",
])]);

// ---------- 114. Multiple NICKNAME entries ----------
files.push(["114_multi_nickname.vcf", vcard([
  "N:Nicknames;Multiple;;;",
  "FN:Multiple Nicknames",
  "NICKNAME:Nicky,Nick",
  "NICKNAME;TYPE=work:The Expert",
  "NICKNAME;LANGUAGE=es:El Jefe",
])]);

// ---------- 115. ORG with quoted SORT-AS ----------
files.push(["115_org_sort_as.vcf", vcard([
  "N:Employee;Generic;;;",
  "FN:Generic Employee",
  "ORG;SORT-AS=\"AcmeCorp\":The Acme Corporation;R&D;Experimental Lab",
])]);

// ---------- 116. Multi-valued CATEGORIES with escaping ----------
files.push(["116_categories_escaped.vcf", vcard([
  "N:Cattest;Edge;;;",
  "FN:Edge Cattest",
  "CATEGORIES:Friends\\, Family,Work Contacts,VIP\\; Priority",
])]);

// ---------- 117. MEMBER with mailto URIs (group) ----------
files.push(["117_group_mailto.vcf", vcard([
  "KIND:group",
  "FN:Marketing Team",
  "MEMBER:mailto:alice@example.com",
  "MEMBER:mailto:bob@example.com",
  "MEMBER:mailto:carol@example.com",
  "MEMBER:urn:uuid:abcdef12-3456-7890-abcd-ef1234567890",
])]);

// ---------- 118. International address - German ----------
files.push(["118_address_german.vcf", vcard([
  "N:M\u00fcller;Hans;;;",
  "FN:Hans M\u00fcller",
  "ADR;TYPE=home:;;Schlo\u00dfstra\u00dfe 42;M\u00fcnchen;Bayern;80331;Deutschland",
  "TEL;VALUE=uri:tel:+49-89-123456",
])]);

// ---------- 119. International address - French ----------
files.push(["119_address_french.vcf", vcard([
  "N:Dupont;Marie;;Mme.;",
  "FN:Mme. Marie Dupont",
  "ADR;TYPE=home:;;15 Rue de la Paix;Paris;;75002;France",
  "TEL;VALUE=uri:tel:+33-1-42-60-00-00",
])]);

// ---------- 120. International address - Brazilian ----------
files.push(["120_address_brazilian.vcf", vcard([
  "N:Silva;Jo\u00e3o;Carlos;;",
  "FN:Jo\u00e3o Carlos Silva",
  "ADR;TYPE=home:;;Rua Augusta\\, 1500;S\u00e3o Paulo;SP;01304-001;Brasil",
  "TEL;VALUE=uri:tel:+55-11-98765-4321",
])]);

// ---------- 121-150. Randomly generated realistic contacts ----------
for (let i = 121; i <= 150; i++) {
  const first = pick(firstNames);
  const last = pick(lastNames);
  const company = pick(companies);
  const title = pick(titles);
  const role = pick(roles);
  const cityIdx = randInt(0, cities.length - 1);

  const lines = [
    `N:${last};${first};;;`,
    `FN:${first} ${last}`,
  ];

  // Randomly add properties
  if (Math.random() > 0.3) lines.push(`ORG:${company}`);
  if (Math.random() > 0.4) lines.push(`TITLE:${title}`);
  if (Math.random() > 0.6) lines.push(`ROLE:${role}`);

  // Phones (1-3)
  const phoneCount = randInt(1, 3);
  const phoneTypes = ["cell", "work", "home"];
  for (let p = 0; p < phoneCount; p++) {
    const pt = phoneTypes[p] || "cell";
    if (Math.random() > 0.5) {
      lines.push(`TEL;VALUE=uri;TYPE=${pt}:${phone()}`);
    } else {
      lines.push(`TEL;TYPE=${pt}:${phone()}`);
    }
  }

  // Emails (1-2)
  const emailCount = randInt(1, 2);
  lines.push(`EMAIL;TYPE=work:${email(first, last)}`);
  if (emailCount > 1) lines.push(`EMAIL;TYPE=home:${email(first, last, "personal.example.net")}`);

  // Address
  if (Math.random() > 0.3) {
    lines.push(`ADR;TYPE=${pick(["home","work"])}:;;${pick(streets)};${cities[cityIdx]};${states[cityIdx]};${zip()};USA`);
  }

  // Birthday
  if (Math.random() > 0.6) {
    lines.push(`BDAY:${randomDate(1950, 2000)}`);
  }

  // URL
  if (Math.random() > 0.6) {
    lines.push(`URL:https://${first.toLowerCase()}-${last.toLowerCase()}.example.com`);
  }

  // Note
  if (Math.random() > 0.7) {
    lines.push(`NOTE:Auto-generated test contact #${i}.`);
  }

  // UID
  lines.push(`UID:${uid()}`);
  // REV
  lines.push(`REV:${randomDateTime()}`);

  files.push([`${String(i).padStart(3, "0")}_random_${first.toLowerCase()}_${last.toLowerCase()}.vcf`, vcard(lines)]);
}

// ── Write all files ─────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [filename, content] of files) {
  write(filename, content);
}

console.log(`Generated ${files.length} VCF test files in ${OUT_DIR}`);
console.log("\nCategories covered:");
console.log("  001-003: Minimal/structural (N components, required fields)");
console.log("  004:     Basic contact with common fields");
console.log("  005-006: Phone number variations (TYPE values, URI vs text)");
console.log("  007:     Email addresses with types and PREF");
console.log("  008-009: Address variations (multiple, all components, LABEL)");
console.log("  010-016: BDAY/ANNIVERSARY (full date, datetime, partial, text)");
console.log("  017-022: GENDER (M, F, O, N, U, identity-only)");
console.log("  023:     NICKNAME");
console.log("  024-026: PHOTO (URI, base64, data URI)");
console.log("  027:     LOGO");
console.log("  028:     ORG multi-level");
console.log("  029:     GEO");
console.log("  030-032: TZ (UTC offset, text, URI)");
console.log("  033:     LANG");
console.log("  034:     IMPP (multiple protocols)");
console.log("  035-036: CATEGORIES (single, multiple)");
console.log("  037-038: NOTE (newlines, special chars)");
console.log("  039:     URL (multiple)");
console.log("  040:     RELATED");
console.log("  041:     ROLE");
console.log("  042:     REV");
console.log("  043:     UID");
console.log("  044:     PRODID");
console.log("  045:     SOURCE");
console.log("  046-049: KIND (individual, group, org, location)");
console.log("  050-051: KEY (URI, text)");
console.log("  052:     FBURL");
console.log("  053:     CALURI/CALADRURI");
console.log("  054:     X- extensions (social, phonetic, custom)");
console.log("  055:     Apple-style grouped properties (X-ABLabel)");
console.log("  056:     Google-style extensions");
console.log("  057-058: Line folding (space, tab continuation)");
console.log("  059:     SORT-AS parameter");
console.log("  060:     ALTID + LANGUAGE (multilingual)");
console.log("  061:     PID + CLIENTPIDMAP");
console.log("  062-068: Unicode/i18n (Chinese, Japanese, Korean, Arabic, Cyrillic, Diacritics, Hindi)");
console.log("  069:     Mixed case property names");
console.log("  070:     Escaped characters (\\; \\, \\\\ \\n)");
console.log("  071-072: Sparse/minimal contacts");
console.log("  073:     Multiple FN");
console.log("  074-075: N with empty/partial components");
console.log("  076:     PREF parameter (1-100 scale)");
console.log("  077:     International phone numbers (8 countries)");
console.log("  078:     SOUND");
console.log("  079:     Fully loaded contact (every common property)");
console.log("  080:     Multiple vCards in single file");
console.log("  081-082: GEO/TZ parameters on ADR");
console.log("  083:     MEDIATYPE parameter variations");
console.log("  084:     VALUE parameter variations");
console.log("  085:     Quoted parameter values");
console.log("  086:     CALSCALE parameter");
console.log("  087-088: Empty NOTE, empty ADR");
console.log("  089:     Tel URI with extension");
console.log("  090:     Very long formatted name");
console.log("  091:     Hyphens/apostrophes in names");
console.log("  092:     Emoji in values");
console.log("  093:     Named property groups");
console.log("  094:     Duplicate/repeated properties");
console.log("  095:     Whitespace edge cases");
console.log("  096-097: DATE-TIME format variants");
console.log("  098:     Multiple given/additional names (comma-separated)");
console.log("  099:     RELATED as agent reference");
console.log("  100:     XML property");
console.log("  101:     RFC 6474 (BIRTHPLACE, DEATHPLACE, DEATHDATE)");
console.log("  102:     RFC 6715 (EXPERTISE, HOBBY, INTEREST)");
console.log("  103:     RFC 8605 (CONTACT-URI)");
console.log("  104:     Stress test (many properties)");
console.log("  105:     Completely empty N");
console.log("  106:     Lowercase BEGIN/END/VERSION");
console.log("  107:     LF-only line endings");
console.log("  108:     Mixed CRLF/LF line endings");
console.log("  109:     Percent-encoded TEL URI");
console.log("  110:     Partial address (city+country only)");
console.log("  111:     Non-URI IMPP values");
console.log("  112:     Very long ADR LABEL");
console.log("  113:     Extended GENDER identity");
console.log("  114:     Multiple NICKNAME entries");
console.log("  115:     ORG with SORT-AS");
console.log("  116:     Escaped CATEGORIES");
console.log("  117:     Group with mailto MEMBER");
console.log("  118-120: International addresses (German, French, Brazilian)");
console.log("  121-150: Randomly generated realistic contacts");

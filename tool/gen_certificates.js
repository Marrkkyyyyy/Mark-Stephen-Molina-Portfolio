#!/usr/bin/env node
/**
 * Emits the certificate grid markup for index.html.
 * Every field below was transcribed from the scan itself, not from the résumé —
 * where the two disagreed, the scan won.
 *
 *   node tool/gen_certificates.js            # both grids
 *   node tool/gen_certificates.js headline   # one grid
 *
 * Output is pasted into index.html and committed. This is not a build step.
 */
const CERTS = [
  // ---------------- tier 1: headline ----------------
  { tier:'headline', slug:'cum-laude-distinction-2024',
    title:'Academic Distinction — Cum Laude',
    issuer:'South East Asian Institute of Technology', date:'June 2024',
    detail:'BS Information Technology · 16th Commencement Exercises' },
  { tier:'headline', slug:'champion-psit-programming-2023',
    title:'Computer Programming — Champion',
    issuer:'PSITE–PSITS Region XII', date:'April 2023',
    detail:'Award of Excellence · 11th PSIT Regional Convention, General Santos City' },
  { tier:'headline', slug:'hackforgov-3rd-place-2023',
    title:'HACKFORGOV Capture-the-Flag — 3rd Place',
    issuer:'Department of ICT, Region XII', date:'September 2023',
    detail:'Award of Excellence · “Building Cyber Champions” national CTF' },
  { tier:'headline', slug:'deans-list-academic-excellence-2023',
    title:'Academic Excellence — Dean’s List',
    issuer:'South East Asian Institute of Technology', date:'AY 2022–2023',
    detail:'General weighted average of 1.03' },
  { tier:'headline', slug:'national-it-skills-c-2024',
    title:'National IT Skills Competition — C Programming',
    issuer:'Integrated Society of IT Enthusiasts (iSITE)', date:'April 2024',
    detail:'7th place nationally among 28 competitors' },
  { tier:'headline', slug:'yfc-provincial-eligibility-2023',
    title:'Young Farmers Challenge — Provincial Level',
    issuer:'Department of Agriculture', date:'July 2023',
    detail:'Eligibility for the provincial start-up competition (FarmFinds) · co-awarded with Angelyn C. Sua-an' },
  { tier:'headline', slug:'yfc-business-pitching-regional-2023',
    title:'Young Farmers Challenge — Regional Business Pitching',
    issuer:'DA Regional Field Office XII', date:'October 2023',
    detail:'Regional Level Start-Up competition, Open Category · co-awarded with Angelyn C. Sua-an' },

  // ---------------- tier 2: participation ----------------
  { tier:'rest', slug:'hackforgov-participation-2023',
    title:'HACKFORGOV CTF 2023', issuer:'Department of ICT', date:'September 2023' },
  { tier:'rest', slug:'psits-12th-convention-innotech-2024',
    title:'12th PSITS Regional Convention — InnoTech Gala', issuer:'PSITE Region XII', date:'May 2024' },
  { tier:'rest', slug:'seminar-python-programming-2023',
    title:'Python Programming Workshop', issuer:'SEAIT — College of ICT', date:'June 2023' },
  { tier:'rest', slug:'seminar-web-development-2023',
    title:'Web Development from Scratch', issuer:'SEAIT — College of ICT', date:'June 2023' },
  { tier:'rest', slug:'seminar-leadership-strategic-planning-2023',
    title:'Leadership Skills &amp; Strategic Planning', issuer:'SEAIT Supreme Student Council', date:'March 2023' },
  { tier:'rest', slug:'seminar-mobile-computing-2023',
    title:'Hackathon 2023 — Mobile Computing', issuer:'SEAIT — College of ICT', date:'March 2023' },
  { tier:'rest', slug:'hackathon-2023-appreciation',
    title:'Hackathon 2023 — Appreciation', issuer:'SEAIT — College of ICT', date:'March 2023' },
  { tier:'rest', slug:'seminar-ai-in-education-2023',
    title:'Tech Talk — Revolutionizing Education with AI', issuer:'PSITE–PSITS Region XII', date:'April 2023' },
  { tier:'rest', slug:'seminar-student-to-ceo-2023',
    title:'Tech Talk — A Student’s Path to CEO', issuer:'PSITE–PSITS Region XII', date:'April 2023' },
  { tier:'rest', slug:'seminar-mugna-insider-tech-2023',
    title:'Tech Talk — MUGNA: Insider Tech', issuer:'PSITE–PSITS Region XII', date:'April 2023' },
  { tier:'rest', slug:'seminar-hitchhikers-guide-tech-2023',
    title:'Tech Talk — Hitchhiker’s Guide to the Tech Industry', issuer:'PSITE–PSITS Region XII', date:'April 2023' },
  { tier:'rest', slug:'psits-11th-convention-participation-2023',
    title:'11th PSITS Regional Convention', issuer:'PSITE–PSITS Region XII', date:'April 2023' },
];

const esc = s => String(s).replace(/"/g, '&quot;');

const tile = (c, i, lazy) => `        <button class="cert" type="button" data-cert="${c.slug}" data-index="${i}">
          <div class="cert__shot">
            <img src="assets/certificates/thumbs/${c.slug}.webp" width="480" height="360"
                 ${lazy} decoding="async" alt="Certificate: ${esc(c.title)}">
          </div>
          <div class="cert__body">
            <span class="cert__title">${c.title}</span>
            <span class="cert__sub">${c.issuer} · ${c.date}</span>
          </div>
        </button>`;

const want = process.argv[2];
const all = CERTS.map((c, i) => ({ ...c, i }));

if (want === 'catalogue') {
  // The metadata the lightbox needs, as an ES module.
  console.log('/* Generated by tool/gen_certificates.js — do not edit by hand. */');
  console.log('export const CERTIFICATES = ' + JSON.stringify(all.map(c => ({
    slug: c.slug, title: c.title.replace(/&amp;/g, '&'), issuer: c.issuer,
    date: c.date, detail: c.detail || ''
  })), null, 2) + ';');
  process.exit(0);
}

if (want !== 'rest') {
  console.log(all.filter(c => c.tier === 'headline')
    .map(c => tile(c, c.i, 'loading="lazy"')).join('\n'));
}
if (want !== 'headline') {
  if (!want) console.log('\n<!-- ---- rest ---- -->');
  console.log(all.filter(c => c.tier === 'rest')
    .map(c => tile(c, c.i, 'loading="lazy"')).join('\n'));
}

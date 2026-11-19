// Regenerates everything that is derived from the data block in index.html:
//   - the search-engine data (JSON-LD) between the build:jsonld markers in index.html
//   - /freehold/index.html and /quaker-bridge/index.html (static location pages)
//   - sitemap.xml
// Run from the repo root after editing LOCATIONS, MENU or ADDONS:  node tools/build.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://yumeramennj.com';
// Add profile URLs here as accounts go live (Instagram, Facebook, TikTok, Yelp, Google Maps).
// They are published as "sameAs" so search engines tie the profiles to this site.
const SAME_AS = { brand: [], freehold: [], 'quaker-bridge': [] };

let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// ---- data: evaluate the block the site itself runs ----
const a = index.indexOf('// ===== EDIT HERE');
const b = index.indexOf('const esc =');
if (a < 0 || b < 0) throw new Error('data block markers not found in index.html');
const ctx = {};
vm.runInNewContext(index.slice(a, b) + '\n;this.LOCATIONS=LOCATIONS;this.MENU=MENU;this.ADDONS=ADDONS;', ctx);
const { LOCATIONS, MENU, ADDONS } = ctx;

// ---- shared styles: reuse the site's own CSS ----
const css = [...index.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const fontLinks = (index.match(/<link rel="preconnect"[^>]*>\s*<link rel="stylesheet"[^>]*>/) || [''])[0];
const favicon = (index.match(/<link rel="icon"[^>]*>/) || [''])[0];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DAY = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
const avail = (l, x, i) => l.key === 'F' || x[i] !== 'F';
const price = p => (/^\d+(\.\d+)?$/.test(p) ? Number(p).toFixed(2) : null);
const plain = d => d.replace(/\s*·\s*add .*$/i, '').replace(/\s*·\s*spicy$/i, '');

const COPY = {
  F: {
    title: 'Ramen in Freehold, NJ | Yume Ramen on West Main Street',
    h1: 'Ramen in downtown Freehold',
    desc: 'Yume Ramen Freehold, 5 West Main Street. Tonkotsu, wagyu, crab and vegetarian ramen, bao buns, crispy rice and donburi. Open daily for lunch and dinner. Order pickup online.',
    intro: 'Yume Ramen is the ramen shop at 5 West Main Street in downtown Freehold, a short drive from Manalapan, Marlboro, Howell and Colts Neck. Come in for a bowl at lunch or dinner, or order ahead and pick up at the counter.',
    where: 'Downtown on West Main Street. Street parking out front and the municipal lots on Court Street.',
    faq: [
      ['Where is Yume Ramen in Freehold?', 'At 5 West Main Street in downtown Freehold, NJ 07728.'],
      ['Does Yume Ramen Freehold have vegetarian or vegan ramen?', 'Yes. Yasai Karamiso and Mori Curry are made with vegetarian dashi, and any bowl can be made vegan by swapping to kale noodles. Our kitchen uses shared equipment, so tell us about any allergy before you order.'],
      ['Is there a gluten-free option?', 'You can swap noodles for rice in any bowl. Our kitchen handles wheat and uses shared fryers, so we cannot guarantee any dish is free of gluten.'],
      ['Can I order Yume Ramen Freehold online?', 'Yes. Order pickup online through our Clover ordering page, pay online and collect at the counter.'],
      ['Where do I park?', 'There is street parking on West Main Street and municipal parking on Court Street.']
    ]
  },
  Q: {
    title: 'Ramen at Quaker Bridge Mall, Lawrenceville NJ | Yume Ramen',
    h1: 'Ramen at Quaker Bridge Mall',
    desc: 'Yume Ramen at Quaker Bridge Mall, Lawrenceville NJ. Tonkotsu, spicy miso, seafood and vegetarian ramen, bao buns, karaage and rice bowls. Open daily. Order pickup online.',
    intro: 'Yume Ramen is the ramen shop inside Quaker Bridge Mall on US Route 1 in Lawrenceville, minutes from Princeton, Hamilton, West Windsor and Trenton. Sit down for a bowl between stores, or order ahead and pick up at the counter.',
    where: 'Inside Quaker Bridge Mall off US-1. Free mall parking; enter by the center court.',
    faq: [
      ['Where is Yume Ramen in Quaker Bridge Mall?', 'Inside Quaker Bridge Mall, 3320 US Route 1, Lawrenceville, NJ 08648. Park free at the mall and enter by the center court.'],
      ['Does Yume Ramen at Quaker Bridge have vegetarian or vegan ramen?', 'Yes. Yasai Karamiso is made with vegetarian dashi, and any bowl can be made vegan by swapping to kale noodles. Our kitchen uses shared equipment, so tell us about any allergy before you order.'],
      ['Is there a gluten-free option?', 'You can swap noodles for rice in any bowl. Our kitchen handles wheat and uses shared fryers, so we cannot guarantee any dish is free of gluten.'],
      ['Can I order Yume Ramen Quaker Bridge online?', 'Yes. Order pickup online through our Square ordering page, pay online and collect at the counter.'],
      ['Is Yume Ramen open when the mall is open?', 'We are open daily. Our hours are listed on this page and can differ from the mall\'s hours.']
    ]
  }
};

const hoursSpec = l => l.spec.map(([days, opens, closes]) => ({
  '@type': 'OpeningHoursSpecification', dayOfWeek: days.map(d => DAY[d]), opens, closes
}));

function restaurant(l, full) {
  const url = `${SITE}/${l.slug}/`;
  const r = {
    '@type': 'Restaurant',
    '@id': `${url}#restaurant`,
    name: `Yume Ramen ${l.name}`,
    alternateName: 'Yume Ramen',
    url,
    image: `${SITE}/og.png`,
    telephone: l.tel,
    priceRange: '$$',
    servesCuisine: ['Ramen', 'Japanese'],
    address: { '@type': 'PostalAddress', streetAddress: l.street, addressLocality: l.city, addressRegion: 'NJ', postalCode: l.zip, addressCountry: 'US' },
    openingHoursSpecification: hoursSpec(l),
    hasMap: l.map,
    acceptsReservations: false,
    parentOrganization: { '@id': `${SITE}/#organization` },
    potentialAction: { '@type': 'OrderAction', target: l.order, deliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp' }
  };
  if (SAME_AS[l.slug]?.length) r.sameAs = SAME_AS[l.slug];
  if (!full) { r.menu = `${url}#menu`; return r; }
  r.hasMenu = {
    '@type': 'Menu', '@id': `${url}#menu`, name: `Yume Ramen ${l.name} menu`,
    hasMenuSection: Object.keys(MENU).map(k => ({ k, items: MENU[k].filter(x => avail(l, x, 5)) })).filter(s => s.items.length).map(s => ({
      '@type': 'MenuSection', name: s.k,
      hasMenuItem: s.items.map(it => {
        const m = { '@type': 'MenuItem', name: it[0], description: plain(it[1]) };
        const p = price(it[2]);
        if (p) m.offers = { '@type': 'Offer', price: p, priceCurrency: 'USD' };
        return m;
      })
    }))
  };
  return r;
}

const organization = {
  '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'Yume Ramen', url: `${SITE}/`,
  logo: `${SITE}/apple-touch-icon.png`, image: `${SITE}/og.png`,
  description: 'Ramen shops in Freehold and at Quaker Bridge Mall in Lawrenceville, New Jersey.',
  ...(SAME_AS.brand.length ? { sameAs: SAME_AS.brand } : {})
};
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// ---- index.html: refresh JSON-LD between markers ----
const homeLd = ld({ '@context': 'https://schema.org', '@graph': [
  organization,
  { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Yume Ramen', publisher: { '@id': `${SITE}/#organization` } },
  ...LOCATIONS.map(l => restaurant(l, false))
] });
index = index.replace(/<!-- build:jsonld -->[\s\S]*?<!-- \/build:jsonld -->/, `<!-- build:jsonld -->\n${homeLd}\n<!-- /build:jsonld -->`);
fs.writeFileSync(path.join(root, 'index.html'), index);

// ---- location pages ----
const extraCss = `
.lhero .wrap{grid-template-columns:1fr}
.lhero h1{font-size:clamp(40px,7vw,84px);line-height:.92}
.lhero p{max-width:60ch}
.crumb{font-size:12.5px;font-weight:600;margin-bottom:14px}
.crumb a{color:var(--cream);opacity:.85}
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media (max-width:760px){.two{grid-template-columns:1fr}}
.mapbox{border:3px solid var(--line);border-radius:18px;overflow:hidden;min-height:320px;background:var(--card)}
.mapbox iframe{display:block;width:100%;height:100%;min-height:320px;border:0}
.msec{margin-top:28px}.msec h3{font-size:22px;margin-bottom:12px}
.faq{display:grid;gap:12px}
.faq div{background:var(--card);border:3px solid var(--line);border-radius:14px;padding:14px 18px}
.faq h3{font-size:17px;line-height:1.15;margin-bottom:6px}.faq p{margin:0;font-size:14.5px}
`;

function page(l) {
  const c = COPY[l.key];
  const other = LOCATIONS.find(x => x !== l);
  const url = `${SITE}/${l.slug}/`;
  const sections = Object.keys(MENU).map(k => ({ k, items: MENU[k].filter(x => avail(l, x, 5)) })).filter(s => s.items.length);
  const addons = ADDONS.filter(x => avail(l, x, 2));
  const pageLd = ld({ '@context': 'https://schema.org', '@graph': [
    organization,
    restaurant(l, true),
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Yume Ramen', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: l.name, item: url }
    ] },
    { '@type': 'FAQPage', mainEntity: c.faq.map(([q, an]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: an } })) }
  ] });
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(`${l.street}, ${l.city}, NJ ${l.zip}`)}&output=embed`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(c.title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(c.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="restaurant">
<meta property="og:site_name" content="Yume Ramen">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(c.title)}">
<meta property="og:description" content="${esc(c.desc)}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#4B2A8A">
${favicon}
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${pageLd}
${fontLinks}
<style>${css}${extraCss}</style>
</head>
<body>
<!-- Generated by tools/build.mjs from the data in /index.html. Do not edit by hand. -->
<a class="skip" href="#order">Skip to ordering</a>
<header class="bar">
  <div class="wrap">
    <a class="brand" href="/"><span class="k">夢</span>YUME RAMEN</a>
    <nav class="nav" aria-label="Sections">
      <a href="#order">Hours</a><a href="#menu">Menu</a><a href="#faq">FAQ</a><a href="/${other.slug}/">${esc(other.name)}</a>
    </nav>
    <a class="btn" href="${esc(l.order)}" target="_blank" rel="noopener">Order online</a>
  </div>
</header>

<main id="top">
<div class="hero lhero">
  <div class="wrap">
    <div>
      <div class="crumb"><a href="/">Yume Ramen</a> / ${esc(l.name)}</div>
      <div class="eyebrow" style="color:var(--yellow)">Yume Ramen · ${esc(l.city)}, NJ</div>
      <h1>${esc(c.h1)}</h1>
      <p>${esc(c.intro)}</p>
      <div class="cta">
        <a class="btn" href="${esc(l.order)}" target="_blank" rel="noopener">Order pickup</a>
        <a class="btn ghost" style="color:var(--cream);border-color:var(--cream)" href="${esc(l.map)}" target="_blank" rel="noopener">Directions</a>
        <a class="btn ghost" style="color:var(--cream);border-color:var(--cream)" href="tel:${esc(l.tel)}">Call ${esc(l.phone)}</a>
      </div>
    </div>
  </div>
</div>

<section id="order">
  <div class="wrap">
    <div class="sec-head"><h2>Hours &amp; location</h2><div class="rule"></div><span class="eyebrow">Open daily</span></div>
    <div class="two">
      <article class="loc">
        <span class="pill">${esc(l.name)}</span>
        <h3>Yume Ramen ${esc(l.name)}</h3>
        <p class="addr"><a href="${esc(l.map)}" target="_blank" rel="noopener">${esc(l.addr[0])}<br>${esc(l.addr[1])}</a></p>
        <div class="hours">${l.hours.map(h => `<b>${esc(h[0])}</b><span>${esc(h[1])}</span>`).join('')}</div>
        <a class="ph" href="tel:${esc(l.tel)}">${esc(l.phone)}</a>
        <p class="note">${esc(c.where)}</p>
        <div class="row"><a class="btn" href="${esc(l.order)}" target="_blank" rel="noopener">Order ${esc(l.name)} pickup</a><a class="btn ghost" href="${esc(l.map)}" target="_blank" rel="noopener">Directions</a></div>
        <p class="note">Ordering runs on ${esc(l.orderVia)}. Pay online, pick up at the counter.</p>
      </article>
      <div class="mapbox"><iframe title="Map to Yume Ramen ${esc(l.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${esc(embed)}"></iframe></div>
    </div>
  </div>
</section>

<section id="menu">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(l.name)} menu</h2><div class="rule"></div><span class="eyebrow">Ramen · bao · rice bowls</span></div>
${sections.map(s => `    <div class="msec">
      <h3>${esc(s.k)}</h3>
      <div class="panel">
${s.items.map(it => `        <div class="item${it[4] ? ' sig' : ''}"><div class="top"><span class="nm">${esc(it[0])}</span><span class="pr">${esc(it[2])}</span></div><span class="tag">${esc(it[3])}</span><span class="ds">${esc(it[1])}</span></div>`).join('\n')}
      </div>
    </div>`).join('\n')}
    <div class="addons">
      <h3>Add-ons · to any bowl</h3>
      <div class="grid">${addons.map(x => `<div><span>${esc(x[0])}</span><span>${esc(x[1])}</span></div>`).join('')}</div>
    </div>
    <div class="menu-foot">
      <span>Gluten-free: swap noodles for rice</span><span>Vegan: swap to kale noodles</span><span>spicy = chili</span><span>**cured with pork</span>
    </div>
  </div>
</section>

<section id="faq">
  <div class="wrap">
    <div class="sec-head"><h2>Good to know</h2><div class="rule"></div></div>
    <div class="faq">
${c.faq.map(([q, an]) => `      <div><h3>${esc(q)}</h3><p>${esc(an)}</p></div>`).join('\n')}
    </div>
    <p class="note" style="margin-top:18px">Food allergy notice: our kitchen handles wheat (gluten), soy, egg, milk, fish, shellfish, sesame, peanuts and tree nuts, and dishes are prepared in shared equipment and fryers. We can't guarantee any item is free of any allergen. Consuming raw or undercooked eggs, seafood or meat may increase your risk of foodborne illness.</p>
  </div>
</section>

<section class="story">
  <div class="wrap">
    <div class="big" aria-hidden="true">夢</div>
    <div>
      <div class="eyebrow">Also at</div>
      <h2>Yume Ramen ${esc(other.name)}</h2>
      <p>${esc(other.addr[0])}, ${esc(other.addr[1])}. <a href="/${other.slug}/" style="color:var(--yellow)">Hours, menu and ordering for ${esc(other.name)}</a>.</p>
    </div>
  </div>
</section>
</main>

<footer>
  <div class="wrap">
    <span>© ${new Date().getFullYear()} Yume Ramen · Hungry Trio Hospitality</span>
    <span><a href="/">Home</a> · <a href="/freehold/">Ramen in Freehold, NJ</a> · <a href="/quaker-bridge/">Ramen at Quaker Bridge Mall, Lawrenceville</a></span>
  </div>
</footer>
</body>
</html>
`;
}

for (const l of LOCATIONS) {
  fs.mkdirSync(path.join(root, l.slug), { recursive: true });
  fs.writeFileSync(path.join(root, l.slug, 'index.html'), page(l));
}

// ---- sitemap ----
const today = new Date().toISOString().slice(0, 10);
const urls = [`${SITE}/`, ...LOCATIONS.map(l => `${SITE}/${l.slug}/`)];
fs.writeFileSync(path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);

console.log('built:', urls.join('  '));

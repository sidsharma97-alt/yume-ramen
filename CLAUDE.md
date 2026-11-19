# Yume Ramen website

Static site on GitHub Pages (custom domain in `CNAME`). A push to `main` deploys it.

- All business data (addresses, phones, hours, ordering links, menu, add-ons) lives in one block in `index.html`, marked `EDIT HERE`.
- After changing that block, run `node tools/build.mjs` from the repo root and commit the result. It regenerates `/freehold/index.html`, `/quaker-bridge/index.html`, `sitemap.xml` and the JSON-LD between the `build:jsonld` markers in `index.html`. Never edit those generated parts by hand.
- Each location has `hours` (display text) and `spec` (the same hours, structured, for search engines). Change both together.
- When a social or listing profile goes live, add its URL to `SAME_AS` at the top of `tools/build.mjs` and rebuild.
- Location-page copy (titles, intros, FAQ) is in `COPY` in `tools/build.mjs`.
- Addresses, phone numbers and hours must match the Google Business Profiles exactly.

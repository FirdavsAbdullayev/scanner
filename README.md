# 🧊 AI-Expiry Tracker

**Muzlatgich va Mahsulotlar Muddati Nazoratchisi** — a modern, responsive expiry-tracking dashboard for your fridge, pantry and medicine cabinet.

Built with **React 19 + Vite**, **Tailwind CSS v4** and **lucide-react**, with real barcode scanning (**@zxing/browser**) and automatic product intelligence gathered live from **12 free databases** — the **Open Facts** family ([Open Food Facts](https://world.openfoodfacts.org/), [Open Beauty Facts](https://world.openbeautyfacts.org/), [Open Products Facts](https://world.openproductsfacts.org/), [Open Pet Food Facts](https://world.openpetfoodfacts.org/)), [iTunes](https://itunes.apple.com/) + [MusicBrainz](https://musicbrainz.org/) for media, [openFDA](https://open.fda.gov/) + [RxNav](https://rxnav.nlm.nih.gov/) for medicine, [Open Library](https://openlibrary.org/) + [Google Books](https://books.google.com/) for books, [Open Prices](https://prices.openfoodfacts.org/) for crowd-sourced shelf prices, plus offline GTIN analysis, an optional API-key panel for the retail catalogues, and a self-growing local knowledge base.

---

## ✨ Features

### Dashboard
- Four headline metrics: **Total / Fresh / Expiring soon / Expired**, with count-up animation.
- "Expiring soon" is highlighted with an amber pulse ring and doubles as a filter shortcut.
- 7-day expiry forecast chart, per-category status breakdown and a "needs attention" list.

### Inventory
- Storage-area tabs: **All / Muzlatgich / Oziq-ovqat / Uy dorixonasi** with live counts.
- Search (name, barcode, location, brand, category), status chips, four sort orders and a "show consumed" toggle.
- **Status is always computed** from the expiry date — `Fresh` (> 3 days), `Expiring soon` (≤ 3 days), `Expired` — so it stays correct across midnight and across sessions.
- Add / edit / delete (with confirmation) / mark consumed / quantity stepper.

### Barcode → automatic product intelligence
- **Live camera scanning** with a scan reticle, beep-style flash feedback and duplicate-read debouncing.
- Tuned for real 1D barcodes: a high-resolution "environment" stream with continuous autofocus, the `TRY_HARDER` decode hint, a 160 ms attempt interval, and a bonus native `BarcodeDetector` pass on Android Chrome.
- Flashlight (torch) and camera-flip buttons appear automatically when the device supports them.
- **Any barcode, any product — three collection layers:**
  1. **Databases, queried in parallel.** Every source lives on its own host, so they run concurrently:

     | Domain | Sources | Gives you |
     |---|---|---|
     | Food & drink | Open Food Facts | name, brand, photo, categories, labels, allergens, nutrition per 100 g, Nutri-Score, NOVA |
     | Cosmetics & hygiene | Open Beauty Facts | same, for beauty products |
     | Everything else | Open Products Facts | household, electronics, toys… |
     | Pet food | Open Pet Food Facts | pet food & treats |
     | Media | iTunes, MusicBrainz | album/track, artist, artwork, genre, track count, release date, label |
     | Medicine | openFDA (+ **RxNav** enrichment) | brand/generic name, labeler, dosage form, active ingredients, marketing status |
     | Books | Open Library, Google Books | title, author, publisher, pages, publish date, cover, subjects |
     | Retail catalogues *(optional, key required)* | UPCitemdb, EAN-Search, Go-UPC | broad general-merchandise coverage |
     | Price *(enrichment)* | Open Prices | latest crowd-sourced shelf price + store |

     The hits are merged (the most complete record wins, the others fill the gaps, list fields are unioned).
  2. **Family priority — no crossed wires.** Databases describe different *domains*, so a barcode collision between them would only add noise (a "Nutella" song, a drug sharing a food code, a mis-scanned "ghost" record squatting on a real UPC). Hits are therefore grouped into families and only the highest-priority non-empty family is kept: **medicine → openfacts → retail → book → media**. `medicine` deliberately outranks `openfacts`, because an openFDA hit is an exact regulatory-registry match while the crowdsourced databases demonstrably contain junk entries.
  3. **Offline barcode analysis.** Every code is decoded locally: symbology (EAN-8 / UPC-A / EAN-13 / GTIN-14 / ISBN / ISSN), the **GS1 country of origin** of the manufacturer, and the **check digit** is verified. This works with no network at all, so even a product no database has ever seen still shows a truthful "barcode profile".
  4. **A local knowledge base that keeps learning.** Everything ever looked up — or typed in by hand — is remembered in `localStorage`, so repeat scans resolve instantly and offline, and the catalogue grows the more you scan.
- A "not found" is never a dead end: the barcode profile appears with everything decoded offline, how many databases were asked, plus a one-tap **"Add with this code"** that also teaches the app about that product.
- Automatic fallback to manual entry + one-tap sample barcodes when there's no camera or permission is denied.
- Sample codes to try: `3017620422003` (food, + price), `5449000000996`, `7622210449283`, `737628064502`, `0016000275270`, `4005900259615` (beauty), `7613034464927` (pet food), `8996001601242` (products), `093624969556` (music / iTunes), `0305730150200` (medicine / openFDA + RxNav), `9780141036144` (book / Open Library).

### 🔑 Optional API keys (retail catalogues)
- A collapsible **"Advanced sources"** panel on the scanner page turns on the big retail catalogues — the ones that know the most barcodes overall but all require a (free-tier) key.
- Keys are stored in *this browser only* (`localStorage`) and sent straight to their provider — nothing is proxied through a third party.
- Each key is auto-verified on save (the app probes a barcode that is known to exist), so you immediately see **"Key works"** or **"Key rejected"** instead of silently getting no extra results.
- **The app is fully functional with zero keys** — the keyless sources are simply queried on their own.

> Some sources are best-effort by design: MusicBrainz throttles clients that don't identify themselves (a browser can't set a custom `User-Agent`) and Google Books exhausts its anonymous daily quota — when either refuses, the lookup silently continues with the other sources.

### AI Smart Kitchen
- One click analyses the items expiring soonest and suggests **2–3 recipes** with time, servings, difficulty, ingredients and step-by-step instructions.
- Matching uses real Open Food Facts categories/ingredients when available, and falls back to multilingual keyword signals from the product name (Uzbek / English / Russian).
- Always shows *which* items each recipe uses and *why* it was chosen.

### Internationalisation
- Full **UZ / EN / RU** switcher (all UI copy, dates and numbers are localised; the language persists).
- Data persists in `localStorage`, seeded with a rich demo inventory on first run.

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # production build into dist/
npm run preview  # preview the production build
```

> **Camera note:** browsers only allow `getUserMedia` in a secure context. `http://localhost` counts as secure, so the scanner works in local dev. If you open the app from another machine, serve it over HTTPS.

---

## 🗂 Project structure

```
src/
├── App.jsx                     # providers + layout + dialog orchestration
├── index.css                   # Tailwind v4 theme, glass utilities, keyframes
├── components/
│   ├── layout/                 # Sidebar, Navbar, MobileNav, LanguageSwitcher
│   ├── dashboard/              # StatCard, ExpiryTimeline, CategoryBreakdown, AttentionList
│   ├── inventory/              # CategoryTabs, InventoryToolbar, ItemCard, AddEditItemModal
│   ├── barcode/                # useBarcodeScanner, CameraPanel, ProductPreview, BarcodeProfile, AdvancedSources, ScannerView
│   ├── recipes/                # RecipesView, RecipeCard, AnalyzingLoader
│   └── ui/                     # Modal, Badge, Toasts, EmptyState, ProductThumb, …
├── constants/                  # categories, barcode samples
├── context/                    # Toast / Inventory / UI providers
├── data/seedData.js            # demo inventory (relative dates)
├── hooks/                      # useInventory, useLocalStorage, useToast
├── i18n/                       # uz.js, en.js, ru.js, LanguageContext
├── recipes/                    # recipeTemplates, recipeSignals, recipeEngine
├── services/
│   ├── productLookup.js        # barcode → merged product from 12 sources (family-priority, cached + throttled)
│   ├── apiKeys.js              # optional retail-catalogue keys (localStorage) + key verification probes
│   ├── barcodeInfo.js          # offline GTIN analysis: symbology, GS1 country, check digit, GTIN variants
│   └── knowledgeBase.js        # local, self-growing catalogue of everything collected
└── utils/                      # dateUtils, format helpers
```

---

## 🎨 Design system

- **Glassmorphism:** `backdrop-blur-md bg-white/80 border border-white/20`, layered `shadow-soft`, `rounded-2xl`.
- **Colour language:** emerald/teal = fresh, amber = expiring soon, rose = expired.
- **Mobile-first:** fixed glass sidebar on desktop, top bar + raised-FAB tab bar on phones.
- Respects `prefers-reduced-motion`, keyboard navigable (focus trap, Esc to close, `/` to focus search).

---

## 📄 License

MIT. Product data © [Open Food Facts](https://world.openfoodfacts.org/) contributors (ODbL).


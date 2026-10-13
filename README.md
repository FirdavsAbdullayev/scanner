# 🧊 AI-Expiry Tracker

**Muzlatgich va Mahsulotlar Muddati Nazoratchisi** — a modern, responsive expiry-tracking dashboard for your fridge, pantry and medicine cabinet.

Built with **React 19 + Vite**, **Tailwind CSS v4** and **lucide-react**, with real barcode scanning (**@zxing/browser**) and automatic product intelligence gathered live from the free **Open Facts** family ([Open Food Facts](https://world.openfoodfacts.org/), [Open Beauty Facts](https://world.openbeautyfacts.org/), [Open Products Facts](https://world.openproductsfacts.org/), [Open Pet Food Facts](https://world.openpetfoodfacts.org/)), [MusicBrainz](https://musicbrainz.org/) for media, plus offline GTIN analysis and a self-growing local knowledge base.

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
  1. **Open databases, queried in parallel.** Open Food Facts, Open Beauty Facts, Open Products Facts, Open Pet Food Facts and MusicBrainz. The hits are merged (the most complete record wins, the others fill the gaps), so each item automatically gets its name, brand, quantity, photo, categories, labels, allergens, allergens-safe nutrition per 100 g, Nutri-Score, NOVA and — for media — release date, format and label.
  2. **Offline barcode analysis.** Every code is decoded locally: symbology (EAN-8 / UPC-A / EAN-13 / GTIN-14 / ISBN / ISSN), the **GS1 country of origin** of the manufacturer, and the **check digit** is verified. This works with no network at all, so even a product no database has ever seen still shows a truthful "barcode profile".
  3. **A local knowledge base that keeps learning.** Everything ever looked up — or typed in by hand — is remembered in `localStorage`, so repeat scans resolve instantly and offline, and the catalogue grows the more you scan.
- A "not found" is never a dead end: the barcode profile appears with everything decoded offline, plus a one-tap **"Add with this code"** that also teaches the app about that product.
- Automatic fallback to manual entry + one-tap sample barcodes when there's no camera or permission is denied.
- Sample codes to try: `3017620422003`, `5449000000996`, `7622210449283`, `737628064502`, `0016000275270`, `4005900259615` (beauty), `7613034464927` (pet food), `8996001601242` (products), `093624969556` (music / MusicBrainz).

> MusicBrainz throttles clients that don't identify themselves, and a browser can't set a custom `User-Agent`; if it refuses, the lookup simply falls back to the other sources.

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
│   ├── barcode/                # useBarcodeScanner, CameraPanel, ProductPreview, BarcodeProfile, ScannerView
│   ├── recipes/                # RecipesView, RecipeCard, AnalyzingLoader
│   └── ui/                     # Modal, Badge, Toasts, EmptyState, ProductThumb, …
├── constants/                  # categories, barcode samples
├── context/                    # Toast / Inventory / UI providers
├── data/seedData.js            # demo inventory (relative dates)
├── hooks/                      # useInventory, useLocalStorage, useToast
├── i18n/                       # uz.js, en.js, ru.js, LanguageContext
├── recipes/                    # recipeTemplates, recipeSignals, recipeEngine
├── services/
│   ├── productLookup.js        # barcode → merged product from 5 open databases (cached + throttled)
│   ├── barcodeInfo.js          # offline GTIN analysis: symbology, GS1 country, check digit
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
# scanner

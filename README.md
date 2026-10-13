# 🧊 AI-Expiry Tracker

**Muzlatgich va Mahsulotlar Muddati Nazoratchisi** — a modern, responsive expiry-tracking dashboard for your fridge, pantry and medicine cabinet.

Built with **React 19 + Vite**, **Tailwind CSS v4** and **lucide-react**, with real barcode scanning (**@zxing/browser**) and automatic product intelligence gathered live from the free **Open Facts** family — [Open Food Facts](https://world.openfoodfacts.org/), [Open Beauty Facts](https://world.openbeautyfacts.org/), [Open Products Facts](https://world.openproductsfacts.org/) and [Open Pet Food Facts](https://world.openpetfoodfacts.org/).

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
- **Every scanned code is queried against four open databases at once** (food, beauty, general products, pet food) and the results are merged, so each item automatically gets its name, brand, quantity, photo, categories, labels, allergens and per-100 g nutrition — even for non-food items.
- The collected record is stored with the inventory item, so it is available offline afterwards.
- Automatic fallback to manual entry + one-tap sample barcodes when there's no camera or permission is denied.
- Any scanned/typed barcode can be added to the inventory even when no database has a record of it (typical for new or local products) — the code is kept and the rest is filled in by hand.
- Sample codes to try: `3017620422003`, `5449000000996`, `7622210449283`, `737628064502`, `0016000275270`, `4005900259615` (beauty), `7613034464927` (pet food), `8996001601242` (products).

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
│   ├── barcode/                # useBarcodeScanner, CameraPanel, ProductPreview, ScannerView
│   ├── recipes/                # RecipesView, RecipeCard, AnalyzingLoader
│   └── ui/                     # Modal, Badge, Toasts, EmptyState, ProductThumb, …
├── constants/                  # categories, barcode samples
├── context/                    # Toast / Inventory / UI providers
├── data/seedData.js            # demo inventory (relative dates)
├── hooks/                      # useInventory, useLocalStorage, useToast
├── i18n/                       # uz.js, en.js, ru.js, LanguageContext
├── recipes/                    # recipeTemplates, recipeSignals, recipeEngine
├── services/productLookup.js   # barcode → merged product from 4 open databases (cached + throttled)
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

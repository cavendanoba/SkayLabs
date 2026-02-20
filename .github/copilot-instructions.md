<!-- Short, focused Copilot instructions for contributors and AI agents -->
# Copilot / AI Agent Instructions — SKC Glow (skcglow)

Purpose: help an AI coding agent be immediately productive in this small static frontend.

- **Project type:** static HTML + ES modules (vanilla JS). No build step by default; files are served as-is.
- **Entry points:** `index.html` and `skcglow/index.html`. Bootstrap and module wiring live in `skcglow/app.js`.

Big picture
- The site is a client-rendered product catalog + cart. Data is provided by `skcglow/products.js` (default dataset) and can be overridden at runtime via `localStorage` key `skcCatalog` (admin panel) or `skcCart` (cart state).
- `catalog.js` is responsible for rendering the grid and implements lazy-loading + blur-up placeholders. Key exported functions: `renderCatalog(containerId)` and `showProductModal(productId, callback)`.
- `cart.js` handles add/remove/update and persists cart under `skcCart` in `localStorage`.

Patterns & conventions (do not change without reason)
- ES module imports/exports are used (e.g., `import { renderCatalog } from './catalog.js'`). Keep files as modules; avoid introducing bundlers unless explicitly approved.
- Lazy-load images use `data-lazy-src` + `loading="lazy"` and a blur placeholder. See `catalog.js` (`createBlurPlaceholder`, `setupLazyLoadingWithBlur`).
- Image fallbacks rely on `assets/default.png` and a global `window.handleImageError` shim in `catalog.js`. When editing image handlers, preserve this fallback behavior.
- UI dialogs use SweetAlert2 (`Swal.fire(...)`) — prefer reusing the patterns in `admin.js` and `catalog.js`.
- Event handling: `renderCatalog` uses event delegation on the catalog container (listen for `.add-btn` and image clicks). Follow this pattern for performance and consistency.

Developer workflows & commands
- Quick local test (static server):

  python3 -m http.server 8000

  or

  npx serve .

  Then open `http://localhost:8000/skcglow/` (or `http://localhost:8000/` depending on where you run the server).
- Reset runtime data: clear `localStorage` keys `skcCatalog` and `skcCart` in the browser console to restore defaults from `products.js`.

Where to edit common concerns (examples)
- Change seed products: edit `skcglow/products.js` (fields: `id`, `name`, `price`, `stock`, `image`, `description`).
- Catalog rendering / UX: `skcglow/catalog.js` (cards, placeholders, lazy-loading). Example: `renderCatalog('catalog')` attaches the grid to element with id `catalog`.
- Admin operations & localStorage interactions: `skcglow/admin.js` (uses `skcCatalog` key and SweetAlert2 flows to edit/save catalog).
- Cart logic: `skcglow/cart.js` (persisted under `skcCart`). Use exported helpers where available.

Tests & validation
- There are no automated tests. Verify changes by running a static server and testing flows in the browser: catalog rendering, image loading, add-to-cart, admin edits (persist/restore via localStorage), and modals.
- For performance checks, use Chrome DevTools Network throttling and confirm blur-up + lazy-loading behavior (see `skcglow/PERFORMANCE.md`).

Safe edits / refactors guidance for AI
- Preserve ES module boundaries and exported function names (`renderCatalog`, `showProductModal`, cart exports) to avoid breaking runtime wiring in `index.html` and `app.js`.
- When changing image paths or placeholders, keep `assets/default.png` fallback and the global `window.handleImageError` compatibility shim.
- If adding new dependencies (CDN or npm), state the reason and add usage examples; prefer CDN script tags in `index.html` for this repo's simple deployment style.

Files to inspect for context
- `skcglow/index.html`, `skcglow/app.js`, `skcglow/catalog.js`, `skcglow/cart.js`, `skcglow/admin.js`, `skcglow/products.js`, `skcglow/PERFORMANCE.md`.

If anything is unclear or you need additional examples (e.g., clicking flows, specific DOM selectors, or global variables), ask for the specific file and interaction to inspect.

— End of instructions —

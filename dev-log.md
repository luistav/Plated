# 📓 Development Log: Mise en Place

Chronological record of technical implementations, architectural decisions, and bug resolutions.

---

### Log #001: Project Initialization & The "Atom" Model
**Status:** Completed
*   **Architecture:** Established the three-tier hierarchy: **Ingredients** (Atoms) -> **Recipes** (Molecules) -> **Dishes** (Complexes).
*   **Decision:** Chose Firestore over relational SQL to handle the flexible schemas required for global suppliers and varying UOMs.
*   **Tech:** Setup Tailwind CSS with a "Chef-Noir" aesthetic (Stone-50 / Stone-900).

---

### Log #002: Recursive Costing & Real-time Sync
**Status:** Completed
*   **Implementation:** Developed the `getRecipeCost` recursive algorithm in `App.tsx`.
*   **Challenge:** Infinite loops in circular recipe references.
*   **Solution:** Added validation to prevent a recipe from being added as a component of itself.
*   **Persistence:** Integrated `DbService` with real-time `onSnapshot` listeners to ensure price updates flow through the UI instantly.

---

### Log #003: Gemini Multimodal Integration
**Status:** Completed
*   **Feature:** Built the **Invoice Scanner**. 
*   **Logic:** Gemini 1.5 Flash processes base64 image data. Prompt engineering ensures it returns a strictly typed JSON schema for reconciliation.
*   **Reconciliation UI:** Built a "diff" viewer to compare current vs. scanned pricing before committing to the database.

---

### Log #004: Event Propagation & UI Resilience
**Status:** Completed (Critical Bug Fix)
*   **Bug:** Delete buttons were failing silently in sandboxed web views.
*   **Diagnosis:** Discovered `window.confirm` was blocked by the environment's security policy. Parent row-click handlers were also intercepting the button events.
*   **Fix:** 
    *   Removed `window.confirm`.
    *   Added `e.stopPropagation()` to all delete triggers.
    *   Forced high `z-index` on action buttons.
    *   Implemented `try/catch` with `alert()` in `App.tsx` for transparent database error reporting.

---

### Log #005: Print Engine & Documentation
**Status:** Current
*   **Implementation:** Created CSS media queries for `@media print`. 
*   **Logic:** Added "Station Grouping" logic to the Menu Bible, allowing chefs to print prep lists organized by kitchen section (Garde Manger, Sauce, etc.).
*   **Documentation:** Added `rd-engine-roadmap.md` and `dev-log.md` to the internal system specs.

---

### Log #006: Data Integrity & Smart Audit Trail
**Status:** Completed
*   **Feature:** Implemented the "Safety Net" logic to prevent orphaned ingredients. All items without a supplier now default to an "Unknown" system entity.
*   **Logic:** Refactored `makeStandard` to allow swapping alternative suppliers into the standard slot while preserving history.
*   **Audit Trail:** Enhanced `priceHistory` to log specific "Supplier Change" events, not just price fluctuations.
*   **Scanner:** Updated the Invoice Scanner to be "Source-Aware", automatically updating the supplier link if an item is scanned from a new vendor.

---

### Log #007: Implicit Supplier Creation (UX Polish)
**Status:** Completed
*   **Feature:** Frictionless data entry for new suppliers.
*   **Issue:** Users had to leave the Ingredient form to create a new Supplier entity, or rely on "Unknown".
*   **Solution:** Implemented "Implicit Creation". Typing a new name in the Supplier field (Standard or Alternative) now automatically generates a new Supplier entity in the background upon save.
*   **UI Update:** Replaced `<select>` dropdowns for Alternative Suppliers with `<input list="...">` to support free-text entry alongside existing options.

---

### Log #008: AI Resilience & Scanner Fix
**Status:** Completed
*   **Bug:** Invoice Scanner button was crashing immediately.
*   **Diagnosis:** Code accessed `process.env` directly in a browser environment where `process` is undefined. Also, hardcoded MIME types caused rejection for non-JPEG uploads.
*   **Fix:** 
    *   Implemented safe access pattern `typeof process !== 'undefined'` for API key retrieval.
    *   Added dynamic MIME type extraction from Base64 headers to support PNG/WebP.
    *   Added user alert if API key is missing instead of silent failure.

---

### Log #009: Supplier Catalog Aggregation
**Status:** Completed
*   **Feature:** Comprehensive Supplier Catalogs.
*   **Issue:** Catalog view was only showing ingredients where the supplier was the *Standard* (Primary) supplier, hiding items where they were listed as an alternative.
*   **Solution:** Updated `SupplierModule` filtering logic to aggregate both Standard and Alternative links. Added "Pref" and "Alt" badges to the list to distinguish relationship type and show correct pricing/pack info.

---

### Log #010: Expanded Supplier Logistics
**Status:** Current
*   **Feature:** Ordering Protocol & Delivery Logistics.
*   **Logic:** Added `orderMethod` schema (Email, SMS, Online, Phone). 
*   **UI:** Implemented a 7-day toggle strip for delivery schedules and conditional inputs for ordering details based on the selected method. Added dedicated visual card for Representative contact info.

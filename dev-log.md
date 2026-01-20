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

### Log #006: Planned - Inventory Logic
**Status:** Backlog
*   **Objective:** Define the schema for "Stock Items" vs "Inventory Counts".
*   **Logic:** Need to handle "Theoritical" vs "Actual" waste calculation logic.

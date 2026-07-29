# AGENTS.md

*Guidelines for agentic development, maintenance, and extension of this codebase (pomme_et_romain).*  
_Last updated: 2026-07-24_

## Project Overview

This repository is a static-client web project intended to display and manage a wedding gift list. It uses:
- **Vanilla JavaScript (browser, ES module imports)**
- **No build, test, or lint automation (no Node.js, NPM, or Makefile)**
- **Firebase Firestore** (as a remote backend for storage)
- **All code runs client-side in the browser**, served as static files via GitHub Pages.

---

## 1. Build/Lint/Test Commands

### Building
- **No build step required.**
- Deploy by committing `index.html`, `script.js`, and `style.css` to GitHub. GitHub Pages will serve them as-is.

### Linting
- **No lint tools are present.**
- Please enforce code style manually as described in Section 2.

### Testing
- **No automated tests exist.**
- All functional testing is manual:
  - Edit files, commit, and push.
  - Open the site in a browser and confirm correct behavior.
  - Monitor the browser console (F12) for errors and warnings.
  - Test: entering valid/invalid data in forms, observing gift list dynamic updates, and checking browser-Firebase interaction.

**Running a single test:**
- N/A (No test tooling; test manually in browser per feature/component change.)

### Firebase
- **Configuration:**
  - Update `firebaseConfig` at the top of `script.js` to configure your instance (see `SETUP.md`).
  - Firestore rules and document setup are in `SETUP.md`.

---

## 2. Code Style Guidelines

### Imports
- Use **ES module-style imports** for external libraries (see script.js):
  - Example:
    ```js
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    ````
- Place imports at the start of the file.

### Formatting & Layout
- **Indent with 4 spaces** (existing code is 4 spaces per level).
- Line length: **Wrap at ~100 characters** if possible.
- Space after control keywords: `if (foo) { ... }`, not `if(foo){...}`
- Use semicolons after all statements. Classic JS style.
- For multiline HTML in JS, use string literals as in script.js and indent inner content for clarity.

### Typing Practices
- Dynamic typing (plain .js) – do not use TypeScript or type annotations.
- JSDoc usage is optional.
- When adding new functions, document arguments and return values in comments when utility is non-obvious.

### Naming Conventions
- Use `camelCase` for variables and functions (`giftId`, `runTransaction`).
- Use `UPPER_CASE` for constant values.
- Array or map variables should use plural nouns (example: `GIFTS`).
- Boolean variables use `is`, `has`, or question format (`isValid`, `hasError`, `shouldRender`).

### Functions
- Prefer function declarations for top-level functions.
- Use arrow functions for callbacks, event handlers, and short functions.
- Group related functions together.

### Error Handling
- Always catch and log errors when performing async/await operations, especially around Firebase/Firestore.
- Example:
    ```js
    try {
        await contribute(...);
    } catch (err) {
        console.error(err);
        /* user feedback UI */
    }
    ```
- Log verbose errors to console; surface user-friendly text in the UI as needed.
- Never show raw error objects to end users — provide descriptive, neutral messages.

### Comments
- Use English for code comments, unless describing end-user messages in French (to match UI localization in script.js).
- Document changes and agentic actions at the top of modified regions where possible.

### UI
- All DOM selectors should be specific (e.g., use `[data-role=...]` or `.className`).
- Prefer DOM manipulation via dedicated functions. Always validate user input before updating the UI or database.

### Miscellaneous
- Do not introduce new dependencies or frameworks (keep to vanilla JS, HTML, CSS).
- Manual browser testing is mandatory after all code changes.
- All deployments land automatically on GitHub Pages via main branch changes.

---

## 3. Cursor & Copilot Rules

- **No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` present.**
- Follow this document for all agentic conventions unless/until these files are added.

---

## 4. Further Setup and Configuration

- See `SETUP.md` for onboarding, configuring Firebase, and special instructions regarding Firestore database rules and collection setup.
- Always ensure the Firestore rules in production are secure, matching those shown in `SETUP.md` (`rules_version = '2'; ...`).

---

## 5. Example Agent Actions

- **Editing gifts:** Modify the `GIFTS` array in script.js, then update Firestore collections as described in SETUP.md Section 5.
- **Updating Firebase:** Always keep `firebaseConfig` values secure and out of version control.
- **Reporting:** Log all changes in agent action reports or commit messages for traceability.
- **Testing changes:** Manually enter values in the browser UI, observe browser console, check DOM updates and Firestore writes. If error, document and patch accordingly.

---

_This AGENTS.md file will be updated as new automation or guidelines are added to the repository._

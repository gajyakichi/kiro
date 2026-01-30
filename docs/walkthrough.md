# Kiro – Comprehensive Project Walk‑Through

> **Project Name**: *Kiro* (formerly **kaihatsunote**)  
> **Repository**: <https://github.com/your-org/kiro>  
> **Docs**: <https://kiro.readthedocs.io/>  
> **Current Release**: v0.2.0 (2026‑01‑30)

---

## 1. Project Overview

Kiro is a cross‑platform desktop note‑taking application built on **Next.js**, **Electron**, and **React**.  
It targets writers, developers, and knowledge workers who want:

| Feature | Benefit |
|---------|---------|
| **Local AI** (Ollama) | Generates daily summaries, task suggestions, and inline chat without sending data to the cloud |
| **Theme Lab** | Drag‑and‑drop CSS editing, live preview, preset import/export, and a global icon system |
| **Japanese & English** UI & docs | Bilingual experience for a broader audience |
| **Workspace & Vault Management** | Multi‑vault workflow with persistent settings |
| **WCAG AA** compliant UI | Accessible for users with disabilities |
| **Playwright E2E + Jest unit tests** | Robust, CI‑driven quality guarantees |
| **Modular icon architecture** | Icons are decoupled from themes, making theme design simpler |

---

## 2. Architecture & Key Components

```
┌───────────────────────┐
│   Electron Main        │
│  (Node.js + Chromium)  │
└─────────┬───────────────┘
          │
┌─────────▼──────────────────────────────────────────────┐
│  Renderer: Next.js + React (TS) + Tailwind v4           │
│  ├─ App Shell (Router, Layout, Theme Context)          │
│  ├─ Feature Modules                                  │
│  │  ├─ Theme Lab (CSS Editor, Live Preview, Presets) │
│  │  ├─ AI (Ollama client, Cache, Chat UI)            │
│  │  ├─ Editors (BlockNote, Markdown, Notion)         │
│  │  ├─ Timeline & Calendar                           │
│  │  ├─ Settings (Vaults, Workspace, Localization)   │
│  │  ├─ Icon System (Global, Theme‑Independent)      │
│  │  └─ Prompt Vault (Prompts, Tags, Import/Export)  │
│  ├─ State Management (React Context + Zustand)      │
│  ├─ Persistence (LocalStorage + JSON vault files)   │
│  └─ Accessibility (ARIA, Semantic HTML, WCAG AA)    │
└──────────────────────────────────────────────────────┘
```

* **Electron** hosts the app and exposes Node APIs (file system, environment).
* **Next.js** powers the renderer, enabling SSR for performance and SEO (if needed).
* **Tailwind v4** + **CSS variables** give us a low‑cost theming layer.
* **React Context** + **Zustand** provide a lightweight, testable state layer.
* **Zod / TypeScript** guard data schemas for persistence.
* **Playwright** and **Jest** enforce code quality in CI.

---

## 3. Development Journey (Chronological)

> The following timeline highlights the major milestones, technical shifts, and design decisions that shaped Kiro.

### 2026‑01‑24 – Foundations & Re‑Brand

| Item | Impact |
|------|--------|
| **Icon Management** – Decoupled icon set from theme. | Simplifies theme design; centralizes icon handling. |
| **Japanese Localization** – Completed, added language toggle. | Expands user base; required new locale context. |
| **Workspace & Vault Persistence** – Multi‑vault support, robust persistence. | Improves data integrity for professional users. |
| **Unified Note Timeline** – New UI component. | Streamlines navigation. |
| **Theme Lab** – CSS editor, preset list, real‑time preview. | Empowered users to customize appearance. |
| **Rebranding to Kiro** – Updated assets, docs, repo name. | Clear positioning, brand consistency. |
| **Local AI (Ollama)** – Added, with vault‑storage mode. | Smart project absorption, task suggestions. |
| **Readability & Contrast** – Global UI adjustments. | Better accessibility. |
| **Version Control Hygiene** – Ignored DB & backup files. | Clean history. |

---

### 2026‑01‑25 – Stabilization & Linting

* **Lint fixes** across Electron, Theme API, and Page modules.  
* **Settings persistence** refactor to read from `.env` directly.  
* **Theme hover animations** and UI consistency updated.  
* **Dynamic icon system** introduced: sidebar icons now consume global icon set.  
* **Japanese locale + workspace** polished, vault selection became mandatory.  
* **AI integration** – Project absorption and daily note suggestions now functional.  
* **Theme Lab overhaul** – Real‑time CSS preview and branding updated.  

---

### 2026‑01‑26 – Accessibility, CI, Tests

* Added **MIT license** and bilingual README (English + Japanese).  
* Completed **calendar UI**, **AI cache**, and **system‑calendar design**.  
* Achieved **WCAG AA** compliance (semantic tags, ARIA labels).  
* Fixed **page / Electron / Theme API linting**.  
* Added **unit tests** for NotionEditor, SuggestedTasks, AI modules, and AI suggestions.  
* Reworked **UI/UX**: new icons, timeline upgrade, task UI refactor, AI task check.  
* **Internationalization**: daily summary toggling.  
* Implemented **GitHub Actions** pipeline (Lint, Test, Build).  
* Integrated **BlockNote** editor, improved AI prompt copy.

---

### 2026‑01‑27 – Performance & Feature Expansion

* Introduced **search/filter** in the integrated timeline.  
* Added **inline AI chat** within timeline items.  
* Optimized **heatmap rendering** via code‑splitting, dynamic import, Tailwind v4 migration.  
* Continued WCAG‑AA compliance.  
* Completed **calendar UI**, **prompt vault** UX.  
* Expanded **theme import/export** support in Theme Lab.  
* E2E tests with **Playwright**, unit tests with **Jest**.  
* Cleaned up bundle size, database URLs, icon redesign.

---

### 2026‑01‑28 – UI Consistency & Prompt Vault

* Fixed **settings page theme background** and CSS injection issues.  
* Unified CSS variables for Darcula theme (section borders, contrast).  
* Adjusted tab button contrast, removed blue ring effect.  
* Consolidated settings UI into compact “skin” design.  
* Implemented **Prompt Vault** with a clear UX.  
* Redesigned theme cards to be VS Code‑style, neutralized accent colors.  
* Refactored **InlineMemoEditor** colors to align with theme.  
* Cleaned lint warnings, shortened CSS variable syntax.

---

### 2026‑01‑29 – Release & Documentation

* Bumped version to **v0.2.0**.  
* Merged `feature/skin` into `develop`.  
* Excluded `.ai-cache.json` and `vaults.json` from git.  
* Fixed lint & type errors, added `remark-gfm`.  
* UI/UX tweaks: removed unnecessary tags, improved preview button, unified backgrounds, inline delete confirmation.  
* Adjusted date‑zone logic for daily notes.  

---

### 2026‑01‑30 – Final Release & Roadmap

* **v0.2.0** released: Theme Lab, Local AI, multi‑vault, WCAG AA, bilingual docs, CI/CD.  
* Key tech changes: live CSS preview, theme import/export, icon system, AI cache & chat, Electron installers planned, WCAG AA compliance.  
* **Open questions**: optimal caching strategy for Ollama, deletion UI feedback, plugin architecture.  

---

## 4. Highlighted Decisions & Discussions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Icon system decoupling** | Simplify theme design, reduce coupling. | Easier theme updates, reusable icons across themes. |
| **Rebrand to Kiro** | Clear positioning; differentiate from original name. | Updated assets, documentation, community alignment. |
| **Local AI via Ollama** | Privacy first; no data sent to the cloud. | Built-in AI features, small footprint, future‑proof. |
| **WCAG AA compliance** | Accessibility and legal compliance. | Inclusive UI, improved contrast and semantics. |
| **Bilingual UI & Docs** | Target Japanese and English users. | Broader reach, community growth. |
| **GitHub Actions CI** | Automated quality checks. | Faster releases, reliable build pipeline. |
| **Theme Lab live preview** | Empower users to customize theme in real time. | Higher user engagement, reduced support tickets. |
| **Prompt Vault** | Manage reusable AI prompts. | Efficiency for power users. |

---

## 5. Next Steps & Future Considerations

| Item | Target Date | Notes |
|------|-------------|-------|
| **AI task suggestion validation** | 2026‑02‑15 | Manual QA + automated tests. |
| **Theme Lab performance analysis** | 2026‑02‑01 | Lazy‑load presets, memoize CSS parsing. |
| **Electron installers** (macOS, Windows, Linux) | 2026‑02‑20 | Use `electron-builder` or `electron-forge`. |
| **Prompt Vault import/export & tagging** | 2026‑03‑01 | JSON schema, UI tags. |
| **Additional languages** (Spanish, French) | 2026‑03‑15 | i18n file expansions. |
| **Notion/BlockNote sync** | 2026‑04‑01 | OAuth, incremental sync. |
| **WCAG audit** | 2026‑04‑15 | Manual review, automated tools. |
| **Mobile preview (React Native)** | TBD | Research feasibility, decide on roadmap. |

**Open Questions**

- Optimal caching strategy for Ollama responses (LRU, TTL, persistence).  
- User preference: inline confirmation vs. modal delete dialogs.  
- Designing a **plugin architecture** for third‑party extensions (e.g., custom editors, integrations).  

---

## 6. Resources

| Type | URL |
|------|-----|
| **Source Repo** | <https://github.com/your-org/kiro> |
| **Documentation** | <https://kiro.readthedocs.io/> |
| **Issue Tracker** | <https://github.com/your-org/kiro/issues> |
| **Contributing Guide** | <https://github.com/your-org/kiro/blob/main/CONTRIBUTING.md> |
| **License** | <https://github.com/your-org/kiro/blob/main/LICENSE> |

---

> **Kiro** – The future of note‑taking is local, intelligent, and beautifully themed.  
> Happy hacking! 🚀
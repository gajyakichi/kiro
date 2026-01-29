# Project Walkthrough – **Kiro (kaihatsunote)**

> **Project name:** _Kiro_ (formerly **kaihatsunote**)  
> **Date:** 2026‑01‑29  
> **Repository:** `https://github.com/yourorg/kiro`  
> **License:** MIT

---

## Table of Contents

| Section                             | Anchor               |
| ----------------------------------- | -------------------- |
| 1. Project Overview                 | #project-overview    |
| 2. Architecture & Key Components    | #architecture        |
| 3. Development Journey (Chronology) | #development-journey |
| 4. Key Decisions & Discussions      | #key-decisions       |
| 5. Next Steps & Future Work         | #next-steps          |

---

## 1. Project Overview <a name="project-overview"></a>

Kiro is a **personal knowledge‑management** tool that combines a Markdown‑style editor, a powerful theme lab, and AI‑powered note absorption. It runs as a cross‑platform desktop app via **Electron** while keeping the modern web stack of **Next.js** at its core. The goal is to provide a seamless, _localized_, _accessible_ and _extensible_ workspace that can be tailored to any developer’s or researcher’s workflow.

### Core Mission

- **Fast & fluid note taking**: WYSIWYG Markdown + instant preview.
- **Customizable UI**: Real‑time CSS theme editing with live preview.
- **AI‑driven workflow**: Daily note ingestion & task generation via local Ollama.
- **Multi‑vault & workspace support**: Work with multiple projects side‑by‑side.
- **Localization**: Japanese + English support, fully switchable.
- **Accessibility**: WCAG AA compliant, ARIA‑rich.

---

## 2. Architecture & Key Components <a name="architecture"></a>

```
┌───────────────────────────────────────────────────────────────────────┐
│                      Kiro Desktop App (Electron + Next.js)           │
├───────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js, React)                                            │
│  ├─ UI Framework: Tailwind v4 + Custom CSS (Theme Lab)                │
│  ├─ State: Zustand (settings, workspace, vault)                      │
│  ├─ Editor: BlockNote / NotionEditor                                 │
│  ├─ Theme Lab: CSS editor + live preview (dynamic import)            │
│  ├─ Localization: react‑i18next (en/ja)                             │
│  ├─ Accessibility: ARIA labels, WCAG AA helpers                      │
│  └─ Testing: Jest + Playwright                                       │
├───────────────────────────────────────────────────────────────────────┤
│  Backend (Node/Electron)                                               │
│  ├─ File system access: fs‑extra, safe‑fs                               │
│  ├─ Local AI: Ollama integration (OpenAI‑compatible)                  │
│  ├─ AI Cache: IndexedDB + LRU                                         │
│  ├─ Settings persistence: .env + secure‑store                        │
│  └─ Electron IPC: Renderer ↔ Main (theme data, AI queries)           │
├───────────────────────────────────────────────────────────────────────┤
│  DevOps (CI/CD)                                                       │
│  ├─ GitHub Actions: Lint, Test, Build                                │
│  ├─ Release workflow: Semantic‑Release                               │
│  └─ Versioning: SemVer + Git tags                                    │
└───────────────────────────────────────────────────────────────────────┘
```

### Highlights

| Component             | Purpose                       | Key Tech                             |
| --------------------- | ----------------------------- | ------------------------------------ |
| **Electron**          | Desktop wrapper, Node API     | `electron`, `electron-builder`       |
| **Next.js**           | SSR/SPA for UI                | `next`, `react`, `typescript`        |
| **Tailwind v4**       | Utility‑first styling         | `tailwindcss`                        |
| **Theme Lab**         | CSS sandbox with live preview | `monaco-editor`, `styled-components` |
| **Ollama**            | Local LLM for AI tasks        | `ollama` CLI + REST API              |
| **BlockNote**         | Rich text editor              | `@blocknote/react`                   |
| **Zustand**           | Global state                  | `zustand`                            |
| **react‑i18next**     | Localization                  | `i18next`                            |
| **Jest / Playwright** | Unit & E2E tests              | `jest`, `playwright`                 |

---

## 3. Development Journey (Chronology) <a name="development-journey"></a>

> All dates follow the **ISO** format `YYYY‑MM‑DD`.

### 2026‑01‑24 – Foundations & Theme Lab Overhaul

| Task                | Description                                                                                       | Commit    |
| ------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| **Icon Management** | Decoupled icon set from theme; introduced global icon sets                                        | `ffa89f3` |
| **Localization**    | Added Japanese locale, updated UI strings                                                         | `80fa10a` |
| **Workspace**       | Implemented multi‑vault persistence, forced vault selection                                       | `d51db40` |
| **Theme Lab**       | CSS editor, preset list (Monokai, Solarized, Darcula, Nord, Catppuccin, etc.) + real‑time preview | `4a5d574` |
| **AI**              | Added local Ollama support, project absorption for daily notes & task suggestions                 | `b3feb58` |
| **UI/UX**           | Unified Note Timeline, improved contrast & readability across themes                              | `3afcc4d` |

> **Major Decision:** Rebrand from _kaihatsunote_ to **Kiro** to reflect a broader vision.

---

### 2026‑01‑25 – Polish & Refinement

| Commit    | Key Changes                                          |
| --------- | ---------------------------------------------------- |
| `ff421fa` | Fixed linting errors in Electron + Theme API         |
| `18df8f5` | Resolved settings persistence via `.env` read        |
| `4565e44` | Refactored theme hover animations                    |
| `7fdf000` | Re‑decoupled icon set from theme                     |
| `dbbf385` | Implemented global icon sets in Theme Lab            |
| `80fa10a` | Japanese localization + workspace improvements       |
| `3afcc4d` | Unified Note Timeline & UI aesthetics                |
| `d51db40` | Mandatory vault selection, sidebar switcher, UI sync |

> **Key Point:** Consolidated all theme‑related logic into a single `theme` module for easier maintenance.

---

### 2026‑01‑26 – CI, Accessibility & AI Enhancements

- **MIT License** + bilingual README (English/Japanese).
- **Accessibility**: WCAG AA compliance, ARIA labels, semantic markup.
- **CI Pipeline**: GitHub Actions running lint, unit tests, build.
- **Unit Tests**: Jest tests for AI modules, SuggestedTasks, NotionEditor.
- **Playwright**: E2E coverage for major flows (note creation, AI suggestion).
- **AI Cache**: Persistent cache for Ollama responses.
- **Calendar UI**: Completed, fully localized, synced with system calendar.
- **Theme Lab**: New presets + preview animations.
- **Sidebar Icons**: Migrated to dynamic icon system (ref. Jan‑24).

> **Decision:** Use `Ollama` for local LLM to avoid external API costs and latency.

---

### 2026‑01‑27 – Timeline & Inline AI

- **Timeline**: Search + filter, SuggestedTasks restored.
- **Inline AI**: Chat widget inside timeline items.
- **Performance**: Heatmap split, dynamic imports, Tailwind v4 migration.
- **Accessibility**: Added ARIA labels, WCAG‑AA updates.
- **Feature**: Theme import/export + ThemeLab.
- **Testing**: Added more unit tests, continued CI.
- **UI**: Minimal icon set, localized labels.

---

### 2026‑01‑28 – UI Consistency & Prompt Management

- **Theme Cards**: Unified styling, removed visual gaps, improved contrast.
- **Prompt Vault**: AI prompt management UI.
- **Settings**: Refined UI to match ThemeLab, removed blue ring effects.
- **Accessibility**: Enhanced contrast for tabs, icons, background.
- **Code quality**: Fixed lint warnings, short‑hand CSS variables.

---

### 2026‑01‑29 – Final Touches

- **Theme Library**: Consolidated to 6 core presets.
- **Darcula CSS Variables**: Added for background consistency.
- **Prompt Vault**: UX tweaks, text visibility fixes.
- **Code**: Unified button colors, removed background dimming.

---

## 4. Key Decisions & Discussions <a name="key-decisions"></a>

| Decision                      | Rationale                                               | Impact                                          |
| ----------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Icon Decoupling**           | Simplifies theme logic, allows independent icon themes. | Easier theme switching, more maintainable code. |
| **Rebrand to Kiro**           | Modernizes identity, broader target audience.           | Updated assets, docs, and marketing materials.  |
| **Local AI (Ollama)**         | Avoid external API latency/costs; privacy.              | Full offline capability, faster inference.      |
| **Theme Lab Live Preview**    | Immediate feedback on CSS changes.                      | Better developer experience, higher adoption.   |
| **WCAG AA Compliance**        | Accessibility for all users.                            | ARIA labels, high‑contrast themes.              |
| **Bilingual README**          | Support both English & Japanese users.                  | Wider community reach.                          |
| **CI/CD with GitHub Actions** | Ensure code quality before release.                     | Automated linting, testing, building.           |
| **Dynamic Icon System**       | Reuse icons across components.                          | Consistency, reduced duplication.               |

---

## 5. Next Steps & Future Work <a name="next-steps"></a>

| Item                      | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| **QA AI Features**        | Validate daily note absorption & task suggestion accuracy. |
| **Performance Profiling** | Profile ThemeLab live preview, AI cache hits.              |
| **Rebrand Asset Rollout** | Update marketing, social, docs with Kiro branding.         |
| **Accessibility Audits**  | Run automated WCAG tests, manual review.                   |
| **Prompt Vault Polish**   | Add tagging, sharing, export.                              |
| **Roadmap Planning**      | Define version 2 feature set (e.g., sync, collaboration).  |
| **CI Enhancements**       | Add snapshot tests, code coverage thresholds.              |

> **Optional Enhancements**
>
> - **Real‑time Collaboration** (WebSocket / Live Share)
> - **Cross‑platform Sync** (iCloud, Dropbox, OneDrive)
> - **Custom LLM Models** via `ollama` or `llama.cpp`

---

## Appendix

### Useful Commands

```bash
# Install dependencies
yarn install

# Run the Electron app (dev)
yarn dev

# Build for production
yarn build

# Run unit tests
yarn test

# Run E2E tests
yarn test:e2e

# Lint
yarn lint
```

### Contributing

Please read `CONTRIBUTING.md` for guidelines on coding style, issue reporting, and pull request process.

### License

MIT – see `LICENSE` file.

---

_End of walkthrough._

# Kiro – Project Walkthrough

> **Project name:** *Kiro* (formerly *KaihatsuNote*)  
> **Repository:** `github.com/your-org/kiro`  
> **License:** MIT

> **Documentation version**: 2026‑01‑29  
> **Author**: Kiro Core Team

> **TL;DR** – Kiro is a modern, bilingual note‑taking & task‑management app that runs on the desktop via Electron, built on top of Next.js & TypeScript, with a live theme editor, local AI (Ollama) for smart suggestions, and a modular icon system. The project is continuously improving UI/UX, accessibility, and CI‑pipeline health.

---

## 1. Project Overview

| Item | Description |
|------|-------------|
| **Core idea** | A local, fast, and fully themeable note‑taking experience that automatically generates tasks from daily notes using AI. |
| **Target platform** | Desktop (Electron) – works on Windows, macOS, Linux. |
| **Primary languages** | English ↔ Japanese (bilingual UI & docs). |
| **Tech stack** | Next.js 13 (app router, TypeScript), Electron, Tailwind CSS v4, React‑Query, Zustand, React‑Markdown, Jest + Playwright, GitHub Actions CI, Ollama (local LLM). |
| **Key features** | • Unified Note Timeline <br>• Dynamic, live‑preview theme editor (Theme Lab) <br>• Global icon set independent of theme <br>• Workspace / vault persistence <br>• AI‑powered daily‑note absorption & task suggestions <br>• WCAG AA compliance & accessibility improvements <br>• Bilingual (EN/JA) UI & docs <br>• CI/CD with lint, test, build |


---

## 2. Architecture & Key Components

Below is a high‑level diagram of the major modules and their interactions.

```
+-------------------+          +----------------+          +-----------------+
|   Electron Shell  | <------> |  Next.js App   | <------> |  Tailwind CSS   |
|   (main & render) |   IPC    |  (React/TS)    |   SSR     |  (v4, JIT)      |
+-------------------+          +----------------+          +-----------------+
          |                               |                          |
          | IPC / Context                 | Styled Components        |
          v                               v                          v
+-------------------+          +----------------+          +-----------------+
|  Theme Lab        |          |  AI Module     |          |  Icon Manager   |
|  (Live CSS editor) |          |  (Ollama)      |          |  (global set)   |
+-------------------+          +----------------+          +-----------------+
          |                               |                          |
          | API / Event Bus               | LLM Call                 |
          v                               v                          v
+-------------------+          +----------------+          +-----------------+
|  Workspace/ Vault |          |  Localization  |          |  Accessibility  |
|  Persistence (LS) |          |  (i18n)        |          |  (WCAG AA)      |
+-------------------+          +----------------+          +-----------------+
          |                               |                          |
          +-------------------------------+--------------------------+
                              |                                  |
                      +-----------------+                +-----------------+
                      |  CI/CD Pipeline |                |   Documentation |
                      |  (GitHub Actions)|                |  (EN/JA README) |
                      +-----------------+                +-----------------+
```

### 2.1 Core Modules

| Module | Responsibility | Key Libraries / Files |
|--------|----------------|-----------------------|
| **Electron** | Desktop shell, IPC, system integration | `main.ts`, `preload.ts`, `electron/` |
| **Next.js** | Web UI, routing, server‑side rendering | `app/`, `pages/`, `components/` |
| **Theme Lab** | CSS editor, live preview, preset management | `components/theme-lab/` |
| **Icon Manager** | Global icon set, dynamic switching | `lib/icons/`, `components/icons/` |
| **AI Module** | Local LLM (Ollama) integration, caching, prompts | `lib/ai/`, `services/ai-cache.ts` |
| **Workspace/Vault** | Multi‑vault support, persistence, sync | `lib/vault/`, `services/vault-storage.ts` |
| **Localization** | Bilingual UI, date/time formatting | `i18n/`, `next-i18next` |
| **Accessibility** | WCAG AA compliant markup, ARIA, contrast | `components/` + `styles/accessibility.css` |
| **CI/CD** | GitHub Actions, lint, tests, build | `.github/workflows/` |
| **Docs** | Bilingual README, LICENSE, changelog | `README.md`, `LICENSE`, `CHANGELOG.md` |

---

## 3. Development Journey (Chronological)

The logs below are extracted from the team’s daily reports and commit history. Each date lists the main achievements, significant commits, and any critical decisions.

### 2026‑01‑24
*Initial consolidation and rebranding*  

| Action | Commit |
|--------|--------|
| Decoupled icon set from theme; global icon sets in Theme Lab | `ffa89f3` |
| Japanese localization & workspace management | `80fa10a` |
| Unified Note Timeline blocks | `3afcc4d` |
| Theme Lab redesign: CSS editor, real‑time preview, presets | `4a5d574` |
| Mandatory vault selection & sidebar switcher | `d51db40` |
| Rebranded to **Kiro**, added local AI (Ollama) & vault storage mode | `b3feb58` |
| Readability & contrast improvements | `bbe5816` |
| Added theme‑preview reliability | `b25a52b` |
| Expanded theme presets | `8a0f9f4` – `99f77dd` |

**Key take‑away:** The team focused on UI polish, theme flexibility, and the first AI integration. A rebrand to *Kiro* marked the public identity shift.

---

### 2026‑01‑25
*Refactoring, lint fixes, AI module expansion*  

| Action | Commit |
|--------|--------|
| Linting errors fixed in Electron & Theme API | `ff421fa` |
| Settings persistence via `.env` & theme hover UI improvement | `18df8f5` |
| Refactor theme hover animations | `4565e44` |
| Decoupled icon logic from themes | `7fdf000` |
| Global icon sets in Theme Lab | `dbbf385` |
| Japanese localization + vault persistence | `80fa10a` |
| AI‑powered project absorption (daily notes & task suggestions) | `bbe5816` |
| Global readability & contrast | `3d6b3e3` – `99f77dd` |

**Key take‑away:** The codebase received major lint cleanup and the icon system was fully modularized. AI absorption logic was solidified.

---

### 2026‑01‑26
*Legal, CI, accessibility, and AI cache*  

| Action | Commit |
|--------|--------|
| MIT license added, README bilingual | — |
| Calendar UI finished, AI cache introduced, system calendar design updated | — |
| WCAG AA compliance + ARIA labels | — |
| `page`, `Electron`, `Theme API` lint errors fixed | — |
| Unit tests added for NotionEditor, SuggestedTasks, AI modules | — |
| UI/UX improvements: new icons, timeline, task UI refactor | — |
| Prompt vault, AI prompt copy feature | — |
| CI pipeline via GitHub Actions (Lint, Test, Build) | — |
| BlockNote (Memo) integration, AI language support | — |
| Theme Lab updated with new presets and preview animations | — |
| Sidebar icons moved to dynamic icon system | — |

**Key take‑away:** The focus shifted to **quality** – tests, CI, accessibility, and AI caching were all introduced.

---

### 2026‑01‑27
*Timeline, AI inline chat, performance, documentation*  

| Action | Commit |
|--------|--------|
| Integrated search/filter into unified timeline | — |
| Restored SuggestedTasks, fixed icons | — |
| Updated AI cache, added inline AI chat to timeline | — |
| Performance: heatmap split, dynamic import, Tailwind v4 migration | — |
| Accessibility: WCAG‑AA, ARIA labels | — |
| Calendar UI & icon redesign | — |
| Theme import/export, ThemeLab, system calendar sync | — |
| README bilingual, license added, app name Kiro | — |
| Playwright E2E tests, unit tests for AI modules | — |
| Bundle optimization, database updates | — |

**Key take‑away:** Feature polish and performance tuning were emphasized, with a complete CI integration.

---

### 2026‑01‑28
*UI consistency, prompt vault UX, inline memo editor*  

| Action | Commit |
|--------|--------|
| Fixed CSS injection issue on settings page | — |
| Added CSS variables for Darcula theme | — |
| Improved tab button contrast, removed blue ring effect | — |
| Settings UI compacted to ThemeLab style | — |
| Introduced Prompt Vault UX | — |
| Reworked theme card design to VS Code style | — |
| InlineMemoEditor color refactor to theme colors | — |
| Lint warnings resolved, short‑form CSS vars | — |

**Key take‑away:** UI polish and prompt vault UX were consolidated, ensuring a consistent look and feel.

---

### 2026‑01‑29
*Daily Report feature, AI chat widget, performance, documentation*  

| Action | Commit |
|--------|--------|
| Removed Antigravity import button | — |
| Added Daily Report section between Current Status & Todo | — |
| Connected lines & inline AI chat widget to Todo | — |
| Fuzzy search on timeline; separate search/filter rows | — |
| Enabled ReactMarkdown HTML rendering for status reports | — |
| Added Japanese translation for Current Status & Daily Report | — |
| Removed `prose` class from walkthrough Markdown | — |
| Refactored manual conversation recording UI | — |
| Added error handling to `/api/sync` failures | — |
| Automated walkthrough generation in Absorb | — |

**Key take‑away:** The latest day added several UI/UX enhancements, improved AI integration, and laid groundwork for automated walkthroughs.

---

## 4. Important Decisions & Discussions

| Decision | Context | Outcome |
|----------|---------|---------|
| **Rebrand to Kiro** | Market positioning & branding consistency | Unified product name across UI, docs, and marketing |
| **Decouple icon set from theme** | Reduce coupling, enable global icon switching | Simplified theme config; easier icon updates |
| **Use local LLM (Ollama)** | Avoid external API costs & latency | Faster, privacy‑preserving AI suggestions |
| **Bilingual UI (EN/JA)** | Target Japanese market & global audience | Increased accessibility and user base |
| **WCAG AA compliance** | Accessibility best practice | Improved inclusivity; better UX |
| **Theme Lab with live preview** | User‑centric theme editing | Empowers users to craft custom aesthetics |
| **GitHub Actions CI** | Automate lint, test, build | Maintains code quality; rapid feedback |
| **Prompt Vault UX** | Centralize AI prompt management | Enables sharing & reuse of prompts |
| **Dynamic import + Tailwind v4** | Performance optimization | Faster load times, smaller bundles |
| **AI Cache persistence** | Reduce repeated LLM calls | Better performance & offline usage |
| **Markdown styling overhaul** | Clean docs & walkthrough | Consistent appearance across docs |

---

## 5. Next Steps & Future Considerations

| Area | Planned Work | Notes |
|------|--------------|-------|
| **AI QA** | Validate daily‑note absorption & task suggestion accuracy | User testing & metrics |
| **Performance profiling** | ThemeLab preview & AI cache | Identify bottlenecks, use `performance.now()` |
| **Prompt Vault enhancements** | Tagging, sharing, export | Collaboration features |
| **CI expansion** | Snapshot tests, coverage thresholds | Ensure regression safety |
| **Version 2 Roadmap** | Real‑time sync, collaboration, multi‑user | Long‑term vision |
| **Accessibility audit** | Full WCAG AA test | Continuous improvement |
| **Internationalization** | Add more locales (e.g., Spanish, French) | Expand market reach |
| **Electron security hardening** | CSP, context isolation | Protect against malicious content |
| **Documentation** | Full API docs, developer guide | Encourage community contributions |

---

## 6. Quick Reference

### 6.1 Key Commands

```bash
# Install dependencies
npm install

# Development (Next.js dev server + Electron)
npm run dev

# Build for production
npm run build

# Test (Jest)
npm test

# E2E (Playwright)
npm run test:e2e

# Run CI locally (lint + test + build)
npm run ci
```

### 6.2 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_HOST` | Ollama server endpoint | `http://localhost:11434` |
| `VITE_APP_ENV` | App environment (`development`, `production`) | `development` |
| `APP_NAME` | App display name | `Kiro` |

### 6.3 File Structure Highlights

```
/src
  /components   # React UI components
  /lib          # Utility libraries (icons, AI, vault)
  /services     # API & backend logic
  /i18n         # Localization files
  /theme-lab    # Theme editor
  /assets       # Static assets, icons, images
```

---

## 7. Contributing

We welcome contributions! Please read the `CONTRIBUTING.md` for guidelines, code style, and issue reporting. Major areas needing help include:

- AI prompt improvements
- Accessibility audit
- Documentation updates
- Feature requests (e.g., real‑time collaboration)

---

## 8. Acknowledgements

- **Ollama** – local LLM runtime that powers Kiro’s AI features.
- **Next.js** – foundation for server‑rendered React UI.
- **Electron** – desktop shell enabling native capabilities.
- **Tailwind CSS** – styling framework, now v4 for performance.
- **GitHub Actions** – CI/CD that keeps the codebase healthy.

---

### Happy hacking with **Kiro** 🚀

---
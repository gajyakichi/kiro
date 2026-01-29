# Release Notes

## Version 0.2.0 (2026-01-29)

### 🎨 New Features

#### AI Prompt Management System

- **Prompt Vault**: Complete AI system prompt management interface
  - Create, edit, and delete custom prompts
  - Switch between preset and custom prompts
  - Import/Export prompts as JSON for sharing
  - Visual active prompt indicator

#### Enhanced Markdown Support

- Added GitHub Flavored Markdown (GFM) support via `remark-gfm`
  - Tables, strikethrough, task lists
  - Autolinks and footnotes
  - Improved code block rendering

#### Conversation Management

- New conversation modal for viewing AI chat history
- Improved conversation export format (JSON with Markdown content)
- Enhanced readability of saved conversations

### 🎨 Theme & UI Improvements

#### Theme Consistency

- Complete theme color application across all editors:
  - BlockNote editor (Notion-style block editor)
  - InlineMemoEditor (inline note editor)
  - MarkdownEditor
  - NotionEditor
- Fixed background color inconsistencies
- All components now respect active theme settings

#### Dark Theme Optimizations

- Improved text readability in AI chat messages
- Fixed Preview button visibility in dark themes
- Enhanced contrast for interactive elements
- HTML tag cleanup for cleaner timeline display

#### VS Code Skin Mode

- Compact, professional developer-focused layout
- Reduced padding and minimal shadows
- Console-like typography and spacing
- Theme-aware color consistency

### 🛠️ Technical Improvements

#### Code Quality

- Fixed multiple TypeScript type errors
- Resolved ESLint warnings and linting issues
- Removed unused code and dependencies
- Added CSS linter configuration for Tailwind v4 compatibility

#### Developer Experience

- Added `CONTRIBUTING.md` with development guidelines
- Comprehensive project walkthrough documentation
- Improved code organization and structure
- Better error handling in AI prompt system

#### Database & API

- New Prompts table for system prompt storage
- REST API endpoints for prompt management:
  - `GET/POST/PUT/DELETE /api/prompts`
  - `POST /api/prompts/active` - Set active prompt
  - `GET/POST /api/prompts/import-export` - Backup/restore
- Conversation import/export APIs

### 🐛 Bug Fixes

- Fixed timezone offset issues in daily note date matching
- Corrected HTML tag rendering in timeline content
- Resolved inline chat box text display issues
- Fixed delete confirmation dialog UX
- Improved Daily Summary styling and layout

### 📦 Dependencies

- Added `remark-gfm` ^4.0.1 for GitHub Flavored Markdown
- Updated various dependencies for security and compatibility

### 🔧 Infrastructure

- Removed tracked cache files (`.ai-cache.json`, `vaults.json`)
- Added `.vscode/settings.json` for consistent development environment
- Migration scripts for database schema updates

---

## Version 0.1.0 (Initial Release)

### Core Features

- Git repository integration and activity visualization
- Timeline and heatmap calendar views
- AI-powered daily summaries and task suggestions
- Notion-like note-taking interface
- Multi-language support (English/Japanese)
- Theme customization system
- Local AI support (Ollama integration)
- Desktop app support (Electron)

# Kiro

**Track your development trajectory effortlessly.** / **開発の「軌跡」を、もっと「気楽」に。**

![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

📝 [Release Notes](RELEASE_NOTES.md) | 🤝 [Contributing](CONTRIBUTING.md)

[English](#english) | [日本語](#japanese)

---

<a id="english"></a>

## 📖 About Kiro

Kiro is an all-in-one dashboard application designed to integrate and visualize a developer's daily activities—Git commits, coding, notes, and task management.

By simply connecting your local Git repositories, Kiro automatically imports your commit logs and displays them in a beautiful timeline and heat map calendar. With built-in AI features, it can automatically generate "Daily Summaries" from your activities or suggest your next tasks.

### 💡 Origin of the Name

The name **"Kiro"** comes from the Japanese word **"Kiroku"** (記録), meaning "Record" or "Log".
In Japanese, the sound **"ku"** (苦) also means "suffering" or "pain".
We removed the "ku" from "Kiroku" to symbolize our mission: **to remove the pain from recording development activities.**

### ✨ Key Features

- **Git Integration & Activity Visualization**
  - Visualize repository history with Timelines and Heatmap Calendars.
  - Centralize Git commits, completed tasks, and daily summaries.
- **AI Assistant (Local AI Ready)**
  - Supports **Ollama** for privacy-focused local AI.
  - Auto-generate daily reports from Git logs.
  - Explain or translate code snippets.
  - Performance optimization with query caching.
  - **AI Prompt Management**: Create, edit, and switch between custom system prompts.
- **Enhanced Note-Taking**
  - Notion-like block editor with rich formatting.
  - GitHub Flavored Markdown (GFM) support: tables, task lists, strikethrough.
  - Inline memo editor for quick notes.
  - Conversation history and export.
- **Modern & Intuitive UI**
  - Smooth animations and refined design.
  - **Theme Lab**: Fully customizable themes via CSS.
  - **VS Code Skin**: Compact developer-focused layout option.
  - Complete theme consistency across all editors.
- **Accessibility (A11y)**
  - WCAG AA compliant semantic markup and keyboard navigation.

### 🚀 Setup

#### Prerequisites

- Node.js (v18+)
- npm

#### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd kiro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file:

   ```env
   DATABASE_URL="file:./vault/kiro.db"

   # AI Configuration (Optional)
   AI_PROVIDER="ollama" # or "openai"
   OLLAMA_BASE_URL="http://localhost:11434"
   AI_MODEL="llama3"
   ```

4. **Setup Database**

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start Application**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

<a id="japanese"></a>

## 📖 Kiro について

Kiroは、開発者の日々の活動（Gitコミット、コーディング、メモ、タスク管理）を統合し、可視化するためのオールインワン・ダッシュボードアプリケーションです。

ローカルのGitリポジトリを接続するだけで、コミットログを自動的に読み込み、美しいタイムラインやカレンダーとして表示します。AI機能により、日々の活動から自動的に「日報（Daily Summary）」を生成したり、次のタスクを提案したりすることも可能です。

### 💡 名前の由来

**「Kiro」** という名前は、日本語の **「記録（Kiroku）」** から **「苦（ku）」** を取り除いたものです。
「開発の記録を残すこと」から「苦労（苦）」を取り除き、**楽に・自然に記録を残せるようにしたい** という願いが込められています。

### ✨ 主な機能

- **Git統合 & アクティビティ可視化**
  - ローカルリポジトリの履歴をTimelineおよびカレンダー（ヒートマップ形式）で表示。
  - 「Gitコミット」「完了タスク」「日報」などを一元管理。
- **AIアシスタント (Local AI対応)**
  - **Ollama** 対応。ローカル環境でプライバシーを保ちながらAI機能を利用可能。
  - Gitログから「今日やったこと」を要約する日報生成。
  - コードスニペットの解説や翻訳。
  - 応答速度のキャッシュシステムによる高速化。
  - **AIプロンプト管理**: カスタムシステムプロンプトの作成・編集・切り替えが可能。
- **強化されたノート機能**
  - Notion風のブロックエディタでリッチフォーマッティング。
  - GitHub Flavored Markdown (GFM) 対応：テーブル、タスクリスト、打ち消し線など。
  - クイックメモ用のインラインエディタ。
  - 会話履歴の保存とエクスポート。
- **直感的なモダンUI**
  - スムーズなアニメーションと洗練されたデザイン。
  - **Theme Lab**: CSSによるフルカスタマイズ可能なテーマ機能。
  - **VS Code Skin**: 開発者向けのコンパクトなレイアウトオプション。
  - 全エディタで一貫したテーマカラー適用。
- **アクセシビリティ (A11y)**
  - WCAG AA基準に準拠したセマンティックなマークアップとキーボード操作対応。スリーンリーダーへの配慮。

### 🚀 セットアップ

#### 必要要件

- Node.js (v18以上推奨)
- npm

#### インストール

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd kiro
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   ```

3. **環境変数の設定**
   `.env` ファイルを作成し、必要な設定を行います。

   ```env
   DATABASE_URL="file:./vault/kiro.db"
   AI_PROVIDER="ollama"
   OLLAMA_BASE_URL="http://localhost:11434"
   AI_MODEL="llama3"
   ```

4. **データベースのセットアップ**

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **アプリケーションの起動**
   ```bash
   npm run dev
   ```
   ブラウザで `http://localhost:3000` にアクセスしてください。

## 🛠 Tech Stack / 技術スタック

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Directory), React
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), Lucide Icons
- **Backend/DB**: SQLite, [Prisma](https://www.prisma.io/)
- **Desktop**: Electron (Optional)
- **AI**: Ollama Integration

## � License / ライセンス

[MIT](LICENSE)

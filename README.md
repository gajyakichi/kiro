# Kiro

Kiroは、開発者の日々の活動（Gitコミット、コーディング、メモ、タスク管理）を統合し、可視化するためのオールインワン・ダッシュボードアプリケーションです。

ローカルのGitリポジトリを接続するだけで、コミットログを自動的に読み込み、美しいタイムラインやカレンダーとして表示します。AI機能により、日々の活動から自動的に「日報（Daily Summary）」を生成したり、次のタスクを提案したりすることも可能です。

## ✨ 主な機能

- **Git統合 & アクティビティ可視化**
  - ローカルリポジトリの履歴をTimelineおよびカレンダー（ヒートマップ形式）で表示。
  - 「Gitコミット」「完了タスク」「日報」などを一元管理。
- **AIアシスタント (Local AI対応)**
  - **Ollama** 対応。ローカル環境でプライバシーを保ちながらAI機能を利用可能。
  - Gitログから「今日やったこと」を要約する日報生成。
  - コードスニペットの解説や翻訳。
  - 応答速度のキャッシュシステムによる高速化。
- **直感的なモダンUI**
  - スムーズなアニメーションと洗練されたデザイン。
  - **Theme Lab**: CSSによるフルカスタマイズ可能なテーマ機能。
- **開発進捗管理**
  - チケットやタスクの進捗を管理するダッシュボード。
  - 言語内訳のグラフ表示。
- **アクセシビリティ (A11y)**
  - WCAG AA基準に準拠したセマンティックなマークアップとキーボード操作対応。スクリーンリーダーへの配慮。

## 🚀 セットアップ

### 必要要件

- Node.js (v18以上推奨)
- npm

### インストール

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
   # Database
   DATABASE_URL="file:./dev.db"

   # AI Configuration (Optional)
   AI_PROVIDER="ollama"  # "ollama" or "openai"
   OLLAMA_BASE_URL="http://localhost:11434"
   AI_MODEL="llama3"
   # OPENAI_API_KEY="sk-..." # if provider is openai
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

## 🛠 技術スタック

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Directory), React
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), Lucide Icons
- **Backend/DB**: SQLite, [Prisma](https://www.prisma.io/)
- **Desktop**: Electron (Optional)
- **AI**: Ollama Integration

## 📁 ディレクトリ構造

- `src/app`: Next.js App Router ページ
- `src/components`: UIコンポーネント (IconPicker, ThemeLab等)
- `src/lib`: ユーティリティ (AIクライアント, Git操作, i18n)
- `prisma`: データベーススキーマ
- `electron`: Electron用メインプロセスコード

## 📝 ライセンス

[MIT](LICENSE)

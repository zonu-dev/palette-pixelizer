# palette-pixelizer

画像をアップロードし、サイズとカラーパレットを指定してドット絵化し、PNG で保存できるフロントエンド専用の Web ツール。

公開URL: `https://zonu-dev.github.io/palette-pixelizer/`

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 8
- Vitest
- Canvas API (ブラウザ内で画像処理)
- ESLint (flat config)

## Commands

```bash
npm run dev         # 開発サーバー起動 (http://localhost:5173/)
npm run build       # TypeScriptチェック + プロダクションビルド
npm run build:pages # GitHub Pages 用ビルド (base=/palette-pixelizer/)
npm run lint        # ESLint実行
npm run test        # Vitest実行
npm run preview     # ビルド結果のプレビュー
```

## Project Structure

```
src/
  App.tsx          # メインUIコンポーネント
  App.css          # アプリケーションスタイル
  index.css        # グローバルスタイル・CSS変数
  main.tsx         # エントリーポイント
  lib/
    palettes.ts      # サイズプリセット・パレット定義
    pixelize.ts      # ドット絵変換・色量子化ロジック (CIE94)
    pixelize.test.ts # pixelize.ts のユニットテスト
```

## Rules

- UI テキストはすべて日本語。
- バックエンド・認証・DB は不要。処理はブラウザ内で完結させる。
- `AI_AGENT_WEB_GUIDELINES.md` のデザイン・実装ルールに従うこと。
- 変更後は `lint`、`test`、`build` が通ることを確認する。

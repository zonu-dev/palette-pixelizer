# ドット絵変換

画像をアップロードし、サイズとカラーパレットを指定してドット絵化し、PNG で保存できるフロントエンド専用の Web ツールです。変換はすべてブラウザ内の Canvas で行います。

公開URL:

`https://zonu-dev.github.io/palette-pixelizer/`

## 機能

- 画像1枚のアップロード
- ドラッグ&ドロップとファイル選択
- 色相、彩度、明度の補正
- パレット変換前の補正プレビュー
- プリセットサイズと任意サイズ
- アスペクト比が異なる画像のリサイズ方法
- パレットプリセットとカスタムパレット編集
- 即時プレビュー更新
- PNG 書き出し
- カスタムパレットの localStorage 保存

## ローカル起動

```bash
npm install
npm run dev
```

GitHub Pages 用の `base` を設定しているため、開発サーバーでは通常 `http://localhost:5173/palette-pixelizer/` を開きます。

## ビルド

```bash
npm run build
npm run preview
```

プレビュー確認先:

`http://127.0.0.1:4173/palette-pixelizer/`

## GitHub Pages 公開

1. GitHub リポジトリの `Settings > Pages > Build and deployment` で `GitHub Actions` を選びます。
2. `main` ブランチへ push すると `.github/workflows/deploy-pages.yml` が動作します。
3. デプロイ後、公開URLで表示を確認します。

## 補足

- visible UI text は日本語に統一しています。
- 変換結果のファイル名は `元ファイル名-サイズ-パレットID.png` 形式です。
- SEO 用に canonical、OG、Twitter card、`robots.txt`、`sitemap.xml` を追加しています。

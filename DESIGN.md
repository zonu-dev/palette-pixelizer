---
version: alpha
name: Palette Pixelizer
description: Design system for the browser-only pixel art conversion tool in the ZOOCHI app family.
colors:
  primary: "#8b5cf6"
  secondary: "#38bdf8"
  tertiary: "#fbbf24"
  neutral: "#f4f7f9"
  background: "#f4f7f9"
  background-dot: "#94a3b8"
  surface: "#ffffff"
  surface-soft: "#f8fafc"
  surface-dark: "#1e293b"
  text: "#1e293b"
  text-strong: "#0f172a"
  muted: "#64748b"
  muted-light: "#94a3b8"
  line: "#cbd5e1"
  line-hover: "#475569"
  on-dark: "#ffffff"
  accent: "#8b5cf6"
  accent-deep: "#7c3aed"
  accent-soft: "#f5f3ff"
  accent-soft-border: "#ddd6fe"
  accent-ink: "#6d28d9"
  focus: "rgba(139, 92, 246, 0.18)"
  checkerboard: "#f8fafc"
  checkerboard-line: "rgba(148, 163, 184, 0.16)"
  amber: "#fbbf24"
  marshmallow-pink: "#ff80a1"
  danger: "#dc2626"
typography:
  display-lg:
    fontFamily: Zen Maru Gothic
    fontSize: 42px
    fontWeight: 900
    lineHeight: "1.08"
    letterSpacing: "-0.05em"
  headline-md:
    fontFamily: Zen Maru Gothic
    fontSize: 24px
    fontWeight: 900
    lineHeight: "1.15"
    letterSpacing: "-0.03em"
  title-md:
    fontFamily: Zen Maru Gothic
    fontSize: 18px
    fontWeight: 900
    lineHeight: "1.25"
  body-md:
    fontFamily: Zen Maru Gothic
    fontSize: 16px
    fontWeight: 700
    lineHeight: "1.7"
  body-sm:
    fontFamily: Zen Maru Gothic
    fontSize: 14px
    fontWeight: 700
    lineHeight: "1.55"
  label-md:
    fontFamily: Zen Maru Gothic
    fontSize: 14px
    fontWeight: 900
    lineHeight: "1"
    letterSpacing: "0.02em"
  caption:
    fontFamily: Zen Maru Gothic
    fontSize: 12px
    fontWeight: 700
    lineHeight: "1.45"
rounded:
  xs: 6px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 40px
  full: 999px
spacing:
  micro: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 40px
  shell-max: 1180px
components:
  page-body:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    typography: "{typography.body-md}"
  header-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xxl}"
    padding: "{spacing.sm}"
  app-badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
  settings-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  dropzone:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  dropzone-hover:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  palette-strip:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.sm}"
  palette-editor:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  preview-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  preview-empty:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
  primary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  primary-button-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-dark}"
  secondary-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.line-hover}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  language-switcher:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  language-current:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.full}"
  contact-modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xxl}"
  contact-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

# Palette Pixelizer Design System

## Overview

Palette Pixelizer は、画像を指定サイズとカラーパレットでドット絵化するブラウザ完結ツールである。ZOOCHI 系のライトテーマを前提にし、丸い面、太い文字、短い段差影、紫のアクセントで、創作ツールらしい楽しさと操作の分かりやすさを両立する。

主役は画像追加、元画像調整、サイズ指定、パレット選択、プレビュー、保存である。装飾よりも、設定変更がすぐ結果に反映される感覚を優先する。

## Colors

ベースは `background`, `surface`, `surface-soft`, `text`, `muted`, `line` のニュートラルで組む。製品差分は Palette の紫系 `accent` セットで表現する。

`accent` は選択中のパレット、保存ボタン hover、重要な focus、カスタムパレット編集面に使う。背景や大きな枠を紫一色にしない。透明背景を示す場所では `checkerboard` と `checkerboard-line` を使い、濃色ベタで代用しない。

## Typography

フォントは現行実装に合わせて `Zen Maru Gothic` を使う。見出しは `900`、本文とラベルは `700` 以上を基準にする。

UI テキストは短くする。特にパレット、サイズ、出力、プレビューのラベルは、説明文ではなく操作名として読めるようにする。文言は `src/i18n.ts` の全ロケールで同期する。

## Layout

デスクトップでは設定列とプレビュー列を横並びにする。設定列には画像、色調補正、パレット、サイズと出力を整理し、プレビュー列は仕上がり確認に十分な幅を取る。

モバイルでは1カラムにするが、画像追加前の空状態で面積を使いすぎない。カスタムパレットの色一覧や画像プレビューは、横スクロールや折り返しを使って縦に伸びすぎないようにする。

## Elevation & Depth

奥行きは短い段差影で出す。カードや主要パネルは `0 6px 0 var(--shadow)`、押せる UI は `0 4px 0 var(--button-shadow)` を基準にする。

押下時は `translateY(4px)` で沈ませ、影を消す。ドット絵プレビュー自体には過剰な角丸や影を付けず、ピクセルの見え方と比較表示を優先する。

## Shapes

形は丸く、境界線は 2px から 3px を基本にする。ツール全体のパネルは `xl` 以上、ドロップゾーンと補助面は `lg`、入力やボタンは `md`、色チップと言語切替は `full` を使う。

パレットチップは小さくても押しやすくし、選択状態が色だけに依存しないよう境界線や状態表示も併用する。

## Components

### Header

ヘッダーは ZOOCHI ロゴ、アプリアイコン、アプリ名、1行概要に絞る。機能説明やタグを増やしすぎない。

### Upload & Adjustments

ドロップゾーンは画像追加の主要導線として分かりやすくする。非対応ファイルや読み込み失敗は短い通知で明示する。

色相、彩度、明るさの調整は、元画像に対する処理であることが分かる配置にする。比較表示の「変換前」は、パレット変換前・色調補正前後の意味が混ざらないようにする。

### Palette Editor

パレット選択はこのツールの中心機能である。組み込みパレットとカスタムパレットを混同しない表示にし、色追加、削除、hex 入力、視覚的な色面を相互同期させる。

カスタムパレットは localStorage に保存されるため、削除や編集は静かだが取り返しのつく操作に見えるようにする。

### Preview & Export

プレビューは仕上がりを正確に見せる。透明背景では checkerboard を見せ、PNG/JPEG/WebP の背景処理の違いが分かるようにする。

保存ボタンは主要アクションだが、通常時は白基調を保ち、hover で Palette の紫へ切り替える。

### Contact

問い合わせ導線は本文より目立たせすぎない。モーダル内にはメールと Marshmallow を基本セットとして置き、version は補助情報として小さく扱う。

## Do's and Don'ts

- Do: `src/index.css` の CSS 変数を共有トークンとして扱う
- Do: デザイン値を変えたら `DESIGN.md` も更新する
- Do: 公開 URL は `/apps/palette-pixelizer/` を基準に揃える
- Do: asset は `import.meta.env.BASE_URL` または `%BASE_URL%` ベースにする
- Do: `en`, `ja`, `ko`, `zh-Hans`, `vi`, `id` の文言を揃える
- Don't: バックエンド、認証、DB を追加する
- Don't: ドット絵プレビューに UI 用の角丸や影を足しすぎる
- Don't: 透明背景を濃色ベタで代用する
- Don't: 開発用 mobile preview を本番レイアウト判定の唯一の根拠にする

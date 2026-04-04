import { useEffect, useId, useRef, useState } from 'react'
import './App.css'
import {
  BUILTIN_PALETTES,
  DEFAULT_CUSTOM_COLORS,
  SIZE_PRESETS,
  type PaletteDefinition,
} from './lib/palettes'
import {
  createDownloadFileName,
  normalizeHexColor,
  renderAdjustedImage,
  renderPixelizedImage,
  type AdjustmentSettings,
  type ResizeMode,
} from './lib/pixelize'

type SourceImage = {
  fileName: string
  objectUrl: string
  image: HTMLImageElement
  width: number
  height: number
}

type CustomPalette = PaletteDefinition & {
  isCustom: true
}

type ResolvedPalette = PaletteDefinition & {
  isCustom: boolean
}

const CUSTOM_STORAGE_KEY = 'palette-pixelizer.custom-palettes.v1'
const DEFAULT_SIZE = SIZE_PRESETS[3]
const DEFAULT_PALETTE_KEY = `builtin:${BUILTIN_PALETTES[5].id}`
const DEFAULT_ADJUSTMENTS: AdjustmentSettings = {
  hue: 0,
  saturation: 0,
  brightness: 0,
}
const RESIZE_MODE_OPTIONS: Array<{ value: ResizeMode; label: string }> = [
  { value: 'center-crop', label: '中心トリミング' },
  { value: 'contain', label: '全体表示' },
  { value: 'stretch', label: '引き伸ばし' },
]

type ExportFormat = 'png' | 'jpeg' | 'webp'

const EXPORT_FORMAT_OPTIONS: Array<{
  value: ExportFormat
  label: string
  mimeType: string
  extension: string
}> = [
  { value: 'png', label: 'PNG', mimeType: 'image/png', extension: 'png' },
  { value: 'jpeg', label: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg' },
  { value: 'webp', label: 'WebP', mimeType: 'image/webp', extension: 'webp' },
]

function App() {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const adjustmentPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [outputWidth, setOutputWidth] = useState(DEFAULT_SIZE.width)
  const [outputHeight, setOutputHeight] = useState(DEFAULT_SIZE.height)
  const [selectedPaletteKey, setSelectedPaletteKey] = useState(DEFAULT_PALETTE_KEY)
  const [adjustments, setAdjustments] = useState<AdjustmentSettings>({ ...DEFAULT_ADJUSTMENTS })
  const [resizeMode, setResizeMode] = useState<ResizeMode>('center-crop')
  const [customPalettes, setCustomPalettes] = useState<CustomPalette[]>(() => loadCustomPalettes())
  const [backgroundColor, setBackgroundColor] = useState('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')

  const sizePreset = SIZE_PRESETS.find(
    (preset) => preset.width === outputWidth && preset.height === outputHeight,
  )
  const selectedPalette = resolvePalette(selectedPaletteKey, customPalettes)
  const selectedCustomPalette = selectedPalette.isCustom
    ? customPalettes.find((palette) => palette.id === selectedPalette.id) ?? null
    : null
  const previewScale = Math.max(1, Math.floor(Math.min(520 / outputWidth, 520 / outputHeight)))
  const hasAdjustments = Object.values(adjustments).some((value) => value !== 0)
  const selectedResizeMode =
    RESIZE_MODE_OPTIONS.find((option) => option.value === resizeMode) ?? RESIZE_MODE_OPTIONS[0]
  const effectiveBackground = backgroundColor || (exportFormat !== 'png' ? '#FFFFFF' : '')
  const selectedFormat =
    EXPORT_FORMAT_OPTIONS.find((option) => option.value === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0]

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customPalettes))
  }, [customPalettes])

  useEffect(() => {
    return () => {
      if (sourceImage) {
        URL.revokeObjectURL(sourceImage.objectUrl)
      }
    }
  }, [sourceImage])

  useEffect(() => {
    const canvas = adjustmentPreviewCanvasRef.current

    if (!canvas) {
      return
    }

    if (!sourceImage) {
      canvas.width = 180
      canvas.height = 120
      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    const previewSize = fitWithinBox(outputWidth, outputHeight, 180)

    renderAdjustedImage({
      canvas,
      image: sourceImage.image,
      width: previewSize.width,
      height: previewSize.height,
      adjustments,
      resizeMode,
      backgroundColor: backgroundColor || undefined,
    })
  }, [adjustments, backgroundColor, outputHeight, outputWidth, resizeMode, sourceImage])

  useEffect(() => {
    const canvas = previewCanvasRef.current

    if (!canvas) {
      return
    }

    if (!sourceImage) {
      canvas.width = Math.max(outputWidth, 1)
      canvas.height = Math.max(outputHeight, 1)
      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    renderPixelizedImage({
      canvas,
      image: sourceImage.image,
      width: outputWidth,
      height: outputHeight,
      palette: selectedPalette.colors,
      adjustments,
      resizeMode,
      backgroundColor: effectiveBackground || undefined,
    })
  }, [adjustments, effectiveBackground, outputHeight, outputWidth, resizeMode, selectedPalette, sourceImage])

  async function handleFileSelection(files: FileList | null): Promise<void> {
    const file = files?.[0]

    if (!file || !file.type.startsWith('image/')) {
      return
    }

    const objectUrl = URL.createObjectURL(file)

    try {
      const image = await loadImage(objectUrl)

      setSourceImage((current) => {
        if (current) {
          URL.revokeObjectURL(current.objectUrl)
        }

        return {
          fileName: file.name,
          objectUrl,
          image,
          width: image.naturalWidth,
          height: image.naturalHeight,
        }
      })
    } catch {
      URL.revokeObjectURL(objectUrl)
    }
  }

  function handleSizePresetChange(nextValue: string): void {
    const preset = SIZE_PRESETS.find((item) => item.id === nextValue)

    if (!preset) {
      return
    }

    setOutputWidth(preset.width)
    setOutputHeight(preset.height)
  }

  function handleDimensionChange(axis: 'width' | 'height', rawValue: string): void {
    const numericValue = Number.parseInt(rawValue, 10)

    if (!Number.isFinite(numericValue)) {
      return
    }

    const clamped = clamp(numericValue, 1, 256)

    if (axis === 'width') {
      setOutputWidth(clamped)
      return
    }

    setOutputHeight(clamped)
  }

  function handleAdjustmentChange(
    key: keyof AdjustmentSettings,
    rawValue: string,
  ): void {
    const numericValue = Number.parseInt(rawValue, 10)

    if (!Number.isFinite(numericValue)) {
      return
    }

    const limits: Record<keyof AdjustmentSettings, [number, number]> = {
      hue: [-180, 180],
      saturation: [-100, 100],
      brightness: [-100, 100],
    }
    const [min, max] = limits[key]
    const clamped = clamp(numericValue, min, max)

    setAdjustments((current) => ({
      ...current,
      [key]: clamped,
    }))
  }

  function handleCreateCustomPalette(): void {
    const nextIndex = customPalettes.length + 1
    const nextPalette: CustomPalette = {
      id: `custom-${Date.now()}`,
      name: `カスタム${nextIndex}`,
      colors: [...selectedPalette.colors],
      isCustom: true,
    }

    if (nextPalette.colors.length === 0) {
      nextPalette.colors = [...DEFAULT_CUSTOM_COLORS]
    }

    setCustomPalettes((current) => [...current, nextPalette])
    setSelectedPaletteKey(`custom:${nextPalette.id}`)
  }

  function handleCustomPaletteNameChange(nextName: string): void {
    if (!selectedCustomPalette) {
      return
    }

    setCustomPalettes((current) =>
      current.map((palette) =>
        palette.id === selectedCustomPalette.id
          ? {
              ...palette,
              name: nextName || 'カスタム',
            }
          : palette,
      ),
    )
  }

  function handleCustomColorChange(index: number, nextColor: string): void {
    if (!selectedCustomPalette) {
      return
    }

    setCustomPalettes((current) =>
      current.map((palette) => {
        if (palette.id !== selectedCustomPalette.id) {
          return palette
        }

        const colors = palette.colors.map((color, colorIndex) =>
          colorIndex === index ? nextColor : color,
        )

        return { ...palette, colors }
      }),
    )
  }

  function handleAddCustomColor(): void {
    if (!selectedCustomPalette) {
      return
    }

    setCustomPalettes((current) =>
      current.map((palette) =>
        palette.id === selectedCustomPalette.id
          ? {
              ...palette,
              colors: [...palette.colors, '#FFFFFF'],
            }
          : palette,
      ),
    )
  }

  function handleRemoveCustomColor(index: number): void {
    if (!selectedCustomPalette || selectedCustomPalette.colors.length <= 1) {
      return
    }

    setCustomPalettes((current) =>
      current.map((palette) => {
        if (palette.id !== selectedCustomPalette.id) {
          return palette
        }

        return {
          ...palette,
          colors: palette.colors.filter((_, colorIndex) => colorIndex !== index),
        }
      }),
    )
  }

  function handleDeleteCustomPalette(): void {
    if (!selectedCustomPalette) {
      return
    }

    setCustomPalettes((current) =>
      current.filter((palette) => palette.id !== selectedCustomPalette.id),
    )
    setSelectedPaletteKey(DEFAULT_PALETTE_KEY)
  }

  function clearSourceImage(): void {
    setSourceImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.objectUrl)
      }

      return null
    })
  }

  async function handleDownload(): Promise<void> {
    const canvas = previewCanvasRef.current

    if (!canvas || !sourceImage) {
      return
    }

    const quality = selectedFormat.value === 'jpeg' ? 0.92 : undefined

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, selectedFormat.mimeType, quality)
    })

    if (!blob) {
      return
    }

    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = createDownloadFileName({
      originalName: sourceImage.fileName,
      paletteSegment: selectedPalette.isCustom ? selectedPalette.name : selectedPalette.id,
      width: outputWidth,
      height: outputHeight,
      extension: selectedFormat.extension,
    })
    link.click()
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <main className="app">
      <header className="app-header solid-shadow">
        <div className="page-toolbar">
          <a
            className="zoochi-link"
            href="https://zoochigames.com/index.html"
            aria-label="ZOOCHIのトップページへ"
          >
            <img src="/zoochi-logo.png" alt="ZOOCHI" />
          </a>

          <a className="page-toolbar__link toy-btn" href="https://zoochigames.com/index.html">
            トップページへ
          </a>
        </div>

        <section className="hero-card">
          <div className="hero-card__badge-wrap wobble-container" aria-hidden="true">
            <span className="hero-card__badge wobble-target">
              <img src="/app-icon.png" alt="" className="hero-card__badge-icon" />
            </span>
          </div>

          <div className="hero-card__copy">
            <div className="meta-pills">
              <span className="meta-pill meta-pill--brand">PALETTE PIXELIZER</span>
              <span className="meta-pill">補正もできる</span>
              <span className="meta-pill">PNG / JPEG / WebP</span>
            </div>

            <h1>画像をドット絵にする</h1>
            <p className="lead hero-copy">
              画像を読み込み、サイズ、補正、パレットを整えて、その場でドット絵化して保存できます。
            </p>

            <ul className="feature-tags" aria-label="主な特徴">
              <li>補正プレビューつき</li>
              <li>カスタムパレット対応</li>
              <li>透過画像も保存できる</li>
            </ul>
          </div>
        </section>
      </header>

      <div className="workspace">
        <aside className="settings-pane">
          <div className="tool-surface solid-shadow">
            <div className="surface-heading">
              <span className="surface-heading__marker" aria-hidden="true" />
              <h2>設定</h2>
            </div>

            <div className="surface-scroll custom-scrollbar">
              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="image" />
                  <h2>画像</h2>
                </div>

                <label
                  className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
                  htmlFor={inputId}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    if (event.currentTarget === event.target) {
                      setIsDragging(false)
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                    void handleFileSelection(event.dataTransfer.files)
                  }}
                >
                  <span className="dropzone-icon">
                    <Icon name="upload" />
                  </span>
                  <div className="dropzone-copy">
                    <strong>ドラッグ&ドロップ</strong>
                    <span>または画像を選択</span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }}
                  >
                    画像を選択
                  </button>
                </label>

                <input
                  id={inputId}
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleFileSelection(event.target.files)}
                />

                {sourceImage ? (
                  <div className="source-meta">
                    <img src={sourceImage.objectUrl} alt="" className="source-thumb" />
                    <div className="source-copy">
                      <strong>{sourceImage.fileName}</strong>
                      <span>
                        元画像 {sourceImage.width}×{sourceImage.height}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-button-quiet"
                      onClick={clearSourceImage}
                      aria-label="画像を外す"
                    >
                      <Icon name="x" />
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="section-card pane-section section-card--warm">
                <div className="section-header-row">
                  <div className="section-card__title">
                    <Icon name="sun" />
                    <h2>補正</h2>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setAdjustments({ ...DEFAULT_ADJUSTMENTS })}
                    disabled={!hasAdjustments}
                  >
                    リセット
                  </button>
                </div>

                <SettingRow label="色相">
                  <AdjustmentControl
                    value={adjustments.hue}
                    min={-180}
                    max={180}
                    onChange={(value) => handleAdjustmentChange('hue', value)}
                  />
                </SettingRow>

                <SettingRow label="彩度">
                  <AdjustmentControl
                    value={adjustments.saturation}
                    min={-100}
                    max={100}
                    onChange={(value) => handleAdjustmentChange('saturation', value)}
                  />
                </SettingRow>

                <SettingRow label="明度">
                  <AdjustmentControl
                    value={adjustments.brightness}
                    min={-100}
                    max={100}
                    onChange={(value) => handleAdjustmentChange('brightness', value)}
                  />
                </SettingRow>

                <div className="section-divider" aria-hidden="true" />

                <div className="adjustment-preview">
                  <div className="adjustment-preview-header">
                    <strong>補正プレビュー</strong>
                    <span>パレット変換前</span>
                  </div>
                  <div className="adjustment-preview-frame">
                    {sourceImage ? (
                      <canvas
                        ref={adjustmentPreviewCanvasRef}
                        className="adjustment-preview-canvas"
                      />
                    ) : (
                      <span className="adjustment-preview-empty">画像追加後に表示</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="sliders" />
                  <h2>サイズ</h2>
                </div>

                <SettingRow label="プリセット">
                  <select
                    value={sizePreset?.id ?? 'custom'}
                    onChange={(event) => handleSizePresetChange(event.target.value)}
                  >
                    {SIZE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">任意</option>
                  </select>
                </SettingRow>

                <SettingRow label="幅">
                  <input
                    type="number"
                    min={1}
                    max={256}
                    value={outputWidth}
                    onChange={(event) => handleDimensionChange('width', event.target.value)}
                  />
                </SettingRow>

                <SettingRow label="高さ">
                  <input
                    type="number"
                    min={1}
                    max={256}
                    value={outputHeight}
                    onChange={(event) => handleDimensionChange('height', event.target.value)}
                  />
                </SettingRow>

                <SettingRow label="リサイズ">
                  <select
                    value={resizeMode}
                    onChange={(event) => setResizeMode(event.target.value as ResizeMode)}
                  >
                    {RESIZE_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </SettingRow>
              </section>

              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="palette" />
                  <h2>パレット</h2>
                </div>

                <SettingRow label="選択">
                  <div className="palette-picker-row">
                    <select
                      value={selectedPaletteKey}
                      onChange={(event) => setSelectedPaletteKey(event.target.value)}
                    >
                      <optgroup label="プリセット">
                        {BUILTIN_PALETTES.map((palette) => (
                          <option key={palette.id} value={`builtin:${palette.id}`}>
                            {palette.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="カスタム">
                        {customPalettes.map((palette) => (
                          <option key={palette.id} value={`custom:${palette.id}`}>
                            {palette.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <button type="button" className="icon-button" onClick={handleCreateCustomPalette}>
                      <Icon name="plus" />
                      <span>新規</span>
                    </button>
                  </div>
                </SettingRow>

                <div className="palette-strip" aria-label="選択中の色">
                  {selectedPalette.colors.map((color) => (
                    <span
                      key={`${selectedPalette.id}-${color}`}
                      className="palette-chip"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {selectedCustomPalette ? (
                  <div className="custom-palette-editor">
                    <SettingRow label="名前">
                      <input
                        type="text"
                        value={selectedCustomPalette.name}
                        onChange={(event) => handleCustomPaletteNameChange(event.target.value)}
                      />
                    </SettingRow>

                    <div className="color-list">
                      {selectedCustomPalette.colors.map((color, index) => (
                        <div className="color-row" key={`${selectedCustomPalette.id}-${index}`}>
                          <span className="color-index">{index + 1}</span>
                          <input
                            type="color"
                            value={color}
                            aria-label={`色${index + 1}`}
                            onChange={(event) =>
                              handleCustomColorChange(index, event.target.value.toUpperCase())
                            }
                          />
                          <HexColorField
                            key={`${selectedCustomPalette.id}-${index}-${color}`}
                            value={color}
                            ariaLabel={`色${index + 1}のHEX`}
                            onCommit={(nextColor) => handleCustomColorChange(index, nextColor)}
                          />
                          <button
                            type="button"
                            className="icon-button icon-button-quiet"
                            onClick={() => handleRemoveCustomColor(index)}
                            disabled={selectedCustomPalette.colors.length <= 1}
                            aria-label={`色${index + 1}を削除`}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="custom-actions">
                      <button type="button" className="text-button" onClick={handleAddCustomColor}>
                        <Icon name="plus" />
                        <span>色を追加</span>
                      </button>
                      <button
                        type="button"
                        className="text-button text-button-danger"
                        onClick={handleDeleteCustomPalette}
                      >
                        <Icon name="trash" />
                        <span>パレットを削除</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="save" />
                  <h2>出力</h2>
                </div>

                <SettingRow label="背景色">
                  <div className="bg-color-control">
                    <button
                      type="button"
                      className={`bg-chip ${!backgroundColor ? 'bg-chip-active' : ''}`}
                      onClick={() => setBackgroundColor('')}
                    >
                      透過
                    </button>
                    <input
                      type="color"
                      value={backgroundColor || '#FFFFFF'}
                      onChange={(event) => setBackgroundColor(event.target.value.toUpperCase())}
                    />
                    <HexColorField
                      key={`bg-${backgroundColor}`}
                      value={backgroundColor || ''}
                      ariaLabel="背景色のHEX"
                      placeholder="#FFFFFF"
                      onCommit={(nextColor) => setBackgroundColor(nextColor)}
                    />
                  </div>
                </SettingRow>

                <SettingRow label="保存形式">
                  <select
                    value={exportFormat}
                    onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                  >
                    {EXPORT_FORMAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </SettingRow>

                {exportFormat !== 'png' && !backgroundColor ? (
                  <p className="setting-note">透過部分は白で出力されます</p>
                ) : null}
              </section>
            </div>
          </div>
        </aside>

        <section className="preview-pane">
          <div className="tool-surface preview-surface solid-shadow">
            <div className="preview-header">
              <div className="surface-heading">
                <span className="surface-heading__marker" aria-hidden="true" />
                <h2>プレビュー</h2>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleDownload()}
                disabled={!sourceImage}
              >
                <span className="button-label">保存する</span>
                <span className="button-icon">
                  <Icon name="arrow-right" />
                </span>
              </button>
            </div>

            <div className="preview-meta">
              <span>{outputWidth}×{outputHeight}</span>
              <span>{selectedResizeMode.label}</span>
              <span>{selectedPalette.name}</span>
              <span>{selectedPalette.colors.length}色</span>
              <span>{selectedFormat.label}</span>
              {effectiveBackground ? <span>{effectiveBackground}</span> : <span>透過</span>}
            </div>

            <div className="preview-stage">
              {sourceImage ? (
                <canvas
                  ref={previewCanvasRef}
                  className="preview-canvas"
                  style={{
                    width: `${outputWidth * previewScale}px`,
                    height: `${outputHeight * previewScale}px`,
                  }}
                />
              ) : (
                <div className="preview-empty">
                  <span className="preview-empty-icon">
                    <Icon name="image" />
                  </span>
                  <strong>画像を追加するとここに表示されます</strong>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App

function SettingRow(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <span className="setting-label">{props.label}</span>
      <div className="setting-control">{props.children}</div>
    </div>
  )
}

function AdjustmentControl(props: {
  value: number
  min: number
  max: number
  onChange: (value: string) => void
}) {
  return (
    <div className="adjustment-control">
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      <span className="adjustment-value">{formatSignedValue(props.value)}</span>
    </div>
  )
}

function HexColorField(props: {
  value: string
  ariaLabel: string
  onCommit: (value: string) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState(props.value)

  function commit(): void {
    const normalized = normalizeHexColor(draft)

    if (!normalized) {
      setDraft(props.value)
      return
    }

    setDraft(normalized)
    props.onCommit(normalized)
  }

  return (
    <input
      type="text"
      value={draft}
      aria-label={props.ariaLabel}
      placeholder={props.placeholder}
      onChange={(event) => setDraft(event.target.value.toUpperCase())}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit()
        }

        if (event.key === 'Escape') {
          setDraft(props.value)
        }
      }}
    />
  )
}

function Icon(props: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    'arrow-right': <path d="M5 12h14M13 5l7 7-7 7" />,
    download: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    ),
    image: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </>
    ),
    monitor: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    palette: (
      <path d="M12 22a10 10 0 1 1 9.7-12.5c.3 1.2-.5 2.5-1.8 2.5H17a2 2 0 0 0-2 2c0 .6.3 1.1.7 1.5.6.5.8 1.4.5 2.2A3.5 3.5 0 0 1 12 22Z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    save: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M17 21v-8H7v8" />
        <path d="M7 3v5h8" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
        <path d="M1 14h6M9 8h6M17 12h6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
        <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m17 8-5-5-5 5" />
        <path d="M12 3v12" />
      </>
    ),
    x: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
  }

  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[props.name]}
    </svg>
  )
}

function loadCustomPalettes(): CustomPalette[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY)

    if (!raw) {
      return [
        {
          id: 'custom-default',
          name: 'カスタム',
          colors: [...DEFAULT_CUSTOM_COLORS],
          isCustom: true,
        },
      ]
    }

    const parsed = JSON.parse(raw) as CustomPalette[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [
        {
          id: 'custom-default',
          name: 'カスタム',
          colors: [...DEFAULT_CUSTOM_COLORS],
          isCustom: true,
        },
      ]
    }

    return parsed.map((palette, index) => ({
      id: palette.id || `custom-loaded-${index}`,
      name: palette.name || `カスタム${index + 1}`,
      colors:
        Array.isArray(palette.colors) && palette.colors.length > 0
          ? palette.colors
              .map((color) => normalizeHexColor(color))
              .filter((color): color is string => Boolean(color))
          : [...DEFAULT_CUSTOM_COLORS],
      isCustom: true,
    }))
  } catch {
    return [
      {
        id: 'custom-default',
        name: 'カスタム',
        colors: [...DEFAULT_CUSTOM_COLORS],
        isCustom: true,
      },
    ]
  }
}

function resolvePalette(key: string, customPalettes: CustomPalette[]): ResolvedPalette {
  const [group, paletteId] = key.split(':')

  if (group === 'custom') {
    const customPalette = customPalettes.find((palette) => palette.id === paletteId)

    if (customPalette) {
      return customPalette
    }
  }

  const builtinPalette =
    BUILTIN_PALETTES.find((palette) => palette.id === paletteId) ?? BUILTIN_PALETTES[0]

  return { ...builtinPalette, isCustom: false }
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('画像を読み込めませんでした'))
    image.src = objectUrl
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function fitWithinBox(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  const scale = Math.min(maxSide / Math.max(width, 1), maxSide / Math.max(height, 1), 1)

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function formatSignedValue(value: number): string {
  return value > 0 ? `+${value}` : `${value}`
}

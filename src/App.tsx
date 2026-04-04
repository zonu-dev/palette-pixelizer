import { useEffect, useId, useRef, useState } from 'react'
import './App.css'
import LanguageSwitcher from './components/LanguageSwitcher'
import {
  getPaletteName,
  getResizeModeLabels,
  getTopPageHref,
  readLocaleFromLocation,
  resolveInitialLocale,
  STRINGS,
  syncLocaleState,
  type Locale,
} from './i18n'
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
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale())
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [outputWidth, setOutputWidth] = useState(DEFAULT_SIZE.width)
  const [outputHeight, setOutputHeight] = useState(DEFAULT_SIZE.height)
  const [selectedPaletteKey, setSelectedPaletteKey] = useState(DEFAULT_PALETTE_KEY)
  const [adjustments, setAdjustments] = useState<AdjustmentSettings>({ ...DEFAULT_ADJUSTMENTS })
  const [resizeMode, setResizeMode] = useState<ResizeMode>('center-crop')
  const [customPalettes, setCustomPalettes] = useState<CustomPalette[]>(() =>
    loadCustomPalettes(resolveInitialLocale()),
  )
  const [backgroundColor, setBackgroundColor] = useState('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [isLocalPreview] = useState(() => isLocalPreviewHost())
  const [isMobilePreview, setIsMobilePreview] = useState(() => hasMobilePreviewQuery())

  const t = STRINGS[locale]
  const resizeModeLabels = getResizeModeLabels(locale)
  const resizeModeOptions: Array<{ value: ResizeMode; label: string }> = [
    { value: 'center-crop', label: resizeModeLabels['center-crop'] },
    { value: 'contain', label: resizeModeLabels.contain },
    { value: 'stretch', label: resizeModeLabels.stretch },
  ]
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
    resizeModeOptions.find((option) => option.value === resizeMode) ?? resizeModeOptions[0]
  const effectiveBackground = backgroundColor || (exportFormat !== 'png' ? '#FFFFFF' : '')
  const selectedFormat =
    EXPORT_FORMAT_OPTIONS.find((option) => option.value === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0]
  const selectedPaletteLabel = getPaletteName(
    locale,
    selectedPalette.id,
    selectedPalette.name,
    selectedPalette.isCustom,
  )
  const topPageHref = getTopPageHref(locale, isMobilePreview)

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customPalettes))
  }, [customPalettes])

  useEffect(() => {
    document.body.classList.toggle('mobile-preview', isMobilePreview)
    document.body.classList.toggle('is-local-preview', isLocalPreview)

    return () => {
      document.body.classList.remove('mobile-preview')
      document.body.classList.remove('is-local-preview')
    }
  }, [isLocalPreview, isMobilePreview])

  useEffect(() => {
    syncLocaleState(locale, isMobilePreview, t.pageTitle)
  }, [isMobilePreview, locale, t.pageTitle])

  useEffect(() => {
    function handlePopState() {
      setIsMobilePreview(hasMobilePreviewQuery())
      const nextLocale = readLocaleFromLocation()

      if (nextLocale) {
        setLocale(nextLocale)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

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
      name: t.customPaletteName(nextIndex),
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
              name: nextName || t.customPaletteFallback,
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
    <main className={`app ${isMobilePreview ? 'is-mobile-preview' : ''}`}>
      <header className="page-header">
        <div className="document-toolbar">
          <div className="document-toolbar__controls">
            <a
              className="document-home-link"
              href={topPageHref}
              aria-label={t.topPageAria}
            >
              <img src="/zoochi-logo.png" alt="ZOOCHI" className="brand-logo" />
            </a>

            <LanguageSwitcher ariaLabel={t.languageLabel} locale={locale} onChange={setLocale} />
          </div>
        </div>

        <section className="header-card solid-shadow">
          <div className="header-card__hero">
            <div className="wobble-container app-card__wobble app-card__wobble--negative" aria-hidden="true">
              <div className="wobble-target app-badge app-badge--palette">
                <img src="/app-icon.png" alt="" className="app-badge__icon" />
              </div>
            </div>

            <div className="header-card__copy">
              <h1>Palette Pixelizer</h1>
              <p>{t.headerSummary}</p>
            </div>
          </div>
        </section>
      </header>

      <div className="workspace">
        <aside className="settings-pane">
          <div className="tool-surface solid-shadow">
            <div className="surface-heading">
              <span className="surface-heading__marker" aria-hidden="true" />
              <h2>{t.settingsHeading}</h2>
            </div>

            <div className="surface-scroll custom-scrollbar">
              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="image" />
                  <h2>{t.imageSectionTitle}</h2>
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
                    <strong>{t.dropzoneTitle}</strong>
                    <span>{t.dropzoneSubtitle}</span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => {
                      event.preventDefault()
                      fileInputRef.current?.click()
                    }}
                  >
                    {t.chooseImageLabel}
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
                      <span>{t.originalImageLabel(sourceImage.width, sourceImage.height)}</span>
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-button-quiet"
                      onClick={clearSourceImage}
                      aria-label={t.removeImageAria}
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
                    <h2>{t.adjustmentsTitle}</h2>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setAdjustments({ ...DEFAULT_ADJUSTMENTS })}
                    disabled={!hasAdjustments}
                  >
                    {t.resetLabel}
                  </button>
                </div>

                <SettingRow label={t.hueLabel}>
                  <AdjustmentControl
                    value={adjustments.hue}
                    min={-180}
                    max={180}
                    onChange={(value) => handleAdjustmentChange('hue', value)}
                  />
                </SettingRow>

                <SettingRow label={t.saturationLabel}>
                  <AdjustmentControl
                    value={adjustments.saturation}
                    min={-100}
                    max={100}
                    onChange={(value) => handleAdjustmentChange('saturation', value)}
                  />
                </SettingRow>

                <SettingRow label={t.brightnessLabel}>
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
                    <strong>{t.adjustmentPreviewTitle}</strong>
                    <span>{t.beforePaletteLabel}</span>
                  </div>
                  <div className="adjustment-preview-frame">
                    {sourceImage ? (
                      <canvas
                        ref={adjustmentPreviewCanvasRef}
                        className="adjustment-preview-canvas"
                      />
                    ) : (
                      <span className="adjustment-preview-empty">{t.adjustmentPreviewEmpty}</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="sliders" />
                  <h2>{t.sizeTitle}</h2>
                </div>

                <SettingRow label={t.presetLabel}>
                  <select
                    value={sizePreset?.id ?? 'custom'}
                    onChange={(event) => handleSizePresetChange(event.target.value)}
                  >
                    {SIZE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">{t.customSizeLabel}</option>
                  </select>
                </SettingRow>

                <SettingRow label={t.widthLabel}>
                  <input
                    type="number"
                    min={1}
                    max={256}
                    value={outputWidth}
                    onChange={(event) => handleDimensionChange('width', event.target.value)}
                  />
                </SettingRow>

                <SettingRow label={t.heightLabel}>
                  <input
                    type="number"
                    min={1}
                    max={256}
                    value={outputHeight}
                    onChange={(event) => handleDimensionChange('height', event.target.value)}
                  />
                </SettingRow>

                <SettingRow label={t.resizeLabel}>
                  <select
                    value={resizeMode}
                    onChange={(event) => setResizeMode(event.target.value as ResizeMode)}
                  >
                    {resizeModeOptions.map((option) => (
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
                  <h2>{t.paletteTitle}</h2>
                </div>

                <SettingRow label={t.selectionLabel}>
                  <div className="palette-picker-row">
                    <select
                      value={selectedPaletteKey}
                      onChange={(event) => setSelectedPaletteKey(event.target.value)}
                    >
                      <optgroup label={t.presetGroupLabel}>
                        {BUILTIN_PALETTES.map((palette) => (
                          <option key={palette.id} value={`builtin:${palette.id}`}>
                            {getPaletteName(locale, palette.id, palette.name, false)}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={t.customGroupLabel}>
                        {customPalettes.map((palette) => (
                          <option key={palette.id} value={`custom:${palette.id}`}>
                            {palette.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <button type="button" className="icon-button" onClick={handleCreateCustomPalette}>
                      <Icon name="plus" />
                      <span>{t.newPaletteLabel}</span>
                    </button>
                  </div>
                </SettingRow>

                <div className="palette-strip" aria-label={t.selectedColorsAria}>
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
                    <SettingRow label={t.paletteNameLabel}>
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
                            aria-label={t.colorInputAria(index + 1)}
                            onChange={(event) =>
                              handleCustomColorChange(index, event.target.value.toUpperCase())
                            }
                          />
                          <HexColorField
                            key={`${selectedCustomPalette.id}-${index}-${color}`}
                            value={color}
                            ariaLabel={t.colorHexAria(index + 1)}
                            onCommit={(nextColor) => handleCustomColorChange(index, nextColor)}
                          />
                          <button
                            type="button"
                            className="icon-button icon-button-quiet"
                            onClick={() => handleRemoveCustomColor(index)}
                            disabled={selectedCustomPalette.colors.length <= 1}
                            aria-label={t.deleteColorAria(index + 1)}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="custom-actions">
                      <button type="button" className="text-button" onClick={handleAddCustomColor}>
                        <Icon name="plus" />
                        <span>{t.addColorLabel}</span>
                      </button>
                      <button
                        type="button"
                        className="text-button text-button-danger"
                        onClick={handleDeleteCustomPalette}
                      >
                        <Icon name="trash" />
                        <span>{t.deletePaletteLabel}</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="section-card pane-section">
                <div className="section-card__title">
                  <Icon name="save" />
                  <h2>{t.outputTitle}</h2>
                </div>

                <SettingRow label={t.backgroundColorLabel}>
                  <div className="bg-color-control">
                    <button
                      type="button"
                      className={`bg-chip ${!backgroundColor ? 'bg-chip-active' : ''}`}
                      onClick={() => setBackgroundColor('')}
                    >
                      {t.transparentLabel}
                    </button>
                    <input
                      type="color"
                      value={backgroundColor || '#FFFFFF'}
                      onChange={(event) => setBackgroundColor(event.target.value.toUpperCase())}
                    />
                    <HexColorField
                      key={`bg-${backgroundColor}`}
                      value={backgroundColor || ''}
                      ariaLabel={t.backgroundHexAria}
                      placeholder="#FFFFFF"
                      onCommit={(nextColor) => setBackgroundColor(nextColor)}
                    />
                  </div>
                </SettingRow>

                <SettingRow label={t.exportFormatLabel}>
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
                  <p className="setting-note">{t.nonPngBackgroundNote}</p>
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
                <h2>{t.previewTitle}</h2>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleDownload()}
                disabled={!sourceImage}
              >
                <span className="button-label">{t.saveLabel}</span>
                <span className="button-icon">
                  <Icon name="arrow-right" />
                </span>
              </button>
            </div>

            <div className="preview-meta">
              <span>{outputWidth}×{outputHeight}</span>
              <span>{selectedResizeMode.label}</span>
              <span>{selectedPaletteLabel}</span>
              <span>{t.colorCountLabel(selectedPalette.colors.length)}</span>
              <span>{selectedFormat.label}</span>
              {effectiveBackground ? <span>{effectiveBackground}</span> : <span>{t.transparentLabel}</span>}
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
                  <strong>{t.previewEmptyLabel}</strong>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isLocalPreview ? (
        <button
          type="button"
          className="view-toggle"
          aria-pressed={isMobilePreview}
          onClick={() => setIsMobilePreview((current) => !current)}
        >
          <span className="view-toggle__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" strokeWidth="2.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
          </span>
          <span className="view-toggle__label">
            {isMobilePreview ? t.previewDesktopLabel : t.previewMobileLabel}
          </span>
        </button>
      ) : null}
    </main>
  )
}

export default App

function isLocalPreviewHost() {
  const host = window.location.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
}

function hasMobilePreviewQuery() {
  return new URLSearchParams(window.location.search).get('view') === 'mobile'
}

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

function loadCustomPalettes(locale: Locale): CustomPalette[] {
  const emptyPalette = (): CustomPalette => ({
    id: 'custom-default',
    name: STRINGS[locale].customPaletteFallback,
    colors: [...DEFAULT_CUSTOM_COLORS],
    isCustom: true,
  })

  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY)

    if (!raw) {
      return [emptyPalette()]
    }

    const parsed = JSON.parse(raw) as CustomPalette[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [emptyPalette()]
    }

    return parsed.map((palette, index) => ({
      id: palette.id || `custom-loaded-${index}`,
      name: palette.name || STRINGS[locale].customPaletteName(index + 1),
      colors:
        Array.isArray(palette.colors) && palette.colors.length > 0
          ? palette.colors
              .map((color) => normalizeHexColor(color))
              .filter((color): color is string => Boolean(color))
          : [...DEFAULT_CUSTOM_COLORS],
      isCustom: true,
    }))
  } catch {
    return [emptyPalette()]
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
    image.onerror = () => reject(new Error('Failed to load image.'))
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

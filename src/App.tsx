import {
  type CSSProperties,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import './App.css'
import LanguageSwitcher from './components/LanguageSwitcher'
import {
  getResizeModeLabels,
  getPaletteName,
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

type HsvColor = {
  h: number
  s: number
  v: number
}

type ImageFileHandle = {
  getFile: () => Promise<File>
}

type PickerWindow = Window & {
  showOpenFilePicker?: (options: {
    multiple?: boolean
    excludeAcceptAllOption?: boolean
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<ImageFileHandle[]>
}

const CUSTOM_STORAGE_KEY = 'palette-pixelizer.custom-palettes.v1'
const DEFAULT_SIZE = SIZE_PRESETS[3]
const DEFAULT_PALETTE_KEY = `builtin:${BUILTIN_PALETTES[5].id}`
const DEFAULT_PICKER_BACKGROUND = '#FFFFFF'
const APP_VERSION = __APP_VERSION__
const CONTACT_EMAIL = 'contact@zoochigames.com'
const MARSHMALLOW_URL =
  'https://marshmallow-qa.com/4q8wumfpc9uj4w6?t=WQvBkW&utm_medium=url_text&utm_source=promotion'
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

const BACKGROUND_COLOR_SWATCHES = [
  '#FFFFFF',
  '#E2E8F0',
  '#94A3B8',
  '#475569',
  '#000000',
  '#FEE2E2',
  '#FB7185',
  '#EC4899',
  '#C084FC',
  '#818CF8',
  '#60A5FA',
  '#67E8F9',
  '#86EFAC',
  '#FDE68A',
  '#FDBA74',
  '#A16207',
  '#166534',
  '#1D4ED8',
] as const

const SUPPORTED_IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.avif',
] as const

const SUPPORTED_IMAGE_TYPE_MAP: Record<string, string[]> = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/x-ms-bmp': ['.bmp'],
  'image/svg+xml': ['.svg'],
  'image/avif': ['.avif'],
}

const SUPPORTED_IMAGE_MIME_TYPES = Object.keys(SUPPORTED_IMAGE_TYPE_MAP)
const SUPPORTED_IMAGE_ACCEPT = [...SUPPORTED_IMAGE_MIME_TYPES, ...SUPPORTED_IMAGE_EXTENSIONS].join(',')
const SUPPORTED_IMAGE_PICKER_TYPES = [
  {
    description: 'Supported images',
    accept: SUPPORTED_IMAGE_TYPE_MAP,
  },
] as const

type SelectOption = {
  value: string
  label: string
}

type SelectGroup = {
  label?: string
  options: SelectOption[]
}

type UploadNotice = {
  title: string
  message: string
}

function App() {
  const inputId = useId()
  const contactDialogTitleId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const uploadNoticeTimerRef = useRef<number | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const compareCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const adjustmentPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const colorPickerRef = useRef<HTMLDivElement | null>(null)
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale())
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isInvalidDrag, setIsInvalidDrag] = useState(false)
  const [outputWidth, setOutputWidth] = useState(DEFAULT_SIZE.width)
  const [outputHeight, setOutputHeight] = useState(DEFAULT_SIZE.height)
  const [selectedPaletteKey, setSelectedPaletteKey] = useState(DEFAULT_PALETTE_KEY)
  const [adjustments, setAdjustments] = useState<AdjustmentSettings>({ ...DEFAULT_ADJUSTMENTS })
  const [resizeMode, setResizeMode] = useState<ResizeMode>('center-crop')
  const [customPalettes, setCustomPalettes] = useState<CustomPalette[]>(() =>
    loadCustomPalettes(resolveInitialLocale()),
  )
  const [backgroundColor, setBackgroundColor] = useState('')
  const [pickerColor, setPickerColor] = useState<HsvColor>(() => hexToHsv(DEFAULT_PICKER_BACKGROUND))
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [isColorPickerUpward, setIsColorPickerUpward] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [isLocalPreview] = useState(() => isLocalPreviewHost())
  const [isMobilePreview, setIsMobilePreview] = useState(() => hasMobilePreviewQuery())
  const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
    window.matchMedia('(max-width: 1023px)').matches,
  )
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false)
  const [isSizeOutputOpen, setIsSizeOutputOpen] = useState(false)
  const [isPaletteEditorOpen, setIsPaletteEditorOpen] = useState(false)
  const [isShowingOriginal, setIsShowingOriginal] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)
  const [isEnterReady, setIsEnterReady] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<UploadNotice | null>(null)

  const t = STRINGS[locale]
  const hasImage = Boolean(sourceImage)
  const isCompactLayout = isMobilePreview || isNarrowViewport
  const canExpandPreview = hasImage && isCompactLayout
  const showExpandedPreview = canExpandPreview && isPreviewExpanded
  const canComparePreview = hasImage && (!isCompactLayout || showExpandedPreview)
  const sizePreset = SIZE_PRESETS.find(
    (preset) => preset.width === outputWidth && preset.height === outputHeight,
  )
  const selectedPalette = resolvePalette(selectedPaletteKey, customPalettes)
  const selectedCustomPalette = selectedPalette.isCustom
    ? customPalettes.find((palette) => palette.id === selectedPalette.id) ?? null
    : null
  const hasAdjustments = Object.values(adjustments).some((value) => value !== 0)
  const normalizedBackgroundColor = normalizeHexColor(backgroundColor)
  const safeBackgroundColor = normalizedBackgroundColor ?? DEFAULT_PICKER_BACKGROUND
  const effectiveBackground = normalizedBackgroundColor || (exportFormat !== 'png' ? '#FFFFFF' : '')
  const selectedFormat =
    EXPORT_FORMAT_OPTIONS.find((option) => option.value === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0]
  const selectedPaletteLabel = getPaletteName(
    locale,
    selectedPalette.id,
    selectedPalette.name,
    selectedPalette.isCustom,
  )
  const topPageHref = getTopPageHref(locale, isMobilePreview)
  const previewDisplay = fitWithinBox(
    outputWidth,
    outputHeight,
    showExpandedPreview ? 320 : isCompactLayout ? 170 : 360,
    true,
  )
  const sizeOutputSummary = `${outputWidth}×${outputHeight} / ${selectedFormat.label}`
  const backgroundLabel = normalizedBackgroundColor ? normalizedBackgroundColor.toUpperCase() : t.transparentLabel
  const hueSliderStyle = { '--mini-color-thumb': safeBackgroundColor } as CSSProperties
  const paletteOptionGroups: SelectGroup[] = [
    {
      label: t.presetGroupLabel,
      options: BUILTIN_PALETTES.map((palette) => ({
        value: `builtin:${palette.id}`,
        label: getPaletteName(locale, palette.id, palette.name, false),
      })),
    },
    {
      label: t.customGroupLabel,
      options: customPalettes.map((palette) => ({
        value: `custom:${palette.id}`,
        label: palette.name,
      })),
    },
  ]
  const sizePresetOptionGroups: SelectGroup[] = [
    {
      options: [
        ...SIZE_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })),
        { value: 'custom', label: t.customSizeLabel },
      ],
    },
  ]
  const exportFormatOptionGroups: SelectGroup[] = [
    {
      options: EXPORT_FORMAT_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    },
  ]
  const resizeModeLabels = getResizeModeLabels(locale)
  const resizeModeOptionGroups: SelectGroup[] = [
    {
      options: [
        { value: 'center-crop', label: resizeModeLabels['center-crop'] },
        { value: 'contain', label: resizeModeLabels.contain },
        { value: 'stretch', label: resizeModeLabels.stretch },
      ],
    },
  ]

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customPalettes))
  }, [customPalettes])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsEnterReady(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (uploadNoticeTimerRef.current !== null) {
        window.clearTimeout(uploadNoticeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')

    function handleViewportChange(event: MediaQueryListEvent) {
      setIsNarrowViewport(event.matches)
    }

    mediaQuery.addEventListener('change', handleViewportChange)

    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('mobile-preview', isMobilePreview)
    document.body.classList.toggle('is-local-preview', isLocalPreview)

    return () => {
      document.body.classList.remove('mobile-preview')
      document.body.classList.remove('is-local-preview')
    }
  }, [isLocalPreview, isMobilePreview])

  useEffect(() => {
    if (!isColorPickerOpen) {
      return
    }

    setIsColorPickerUpward(resolvePopoverUpward(colorPickerRef.current))

    function handlePointerDown(event: PointerEvent) {
      if (!colorPickerRef.current?.contains(event.target as Node)) {
        setIsColorPickerOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsColorPickerOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isColorPickerOpen])

  useEffect(() => {
    if (!isContactModalOpen && !showExpandedPreview) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleDocumentKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      if (isContactModalOpen) {
        setIsContactModalOpen(false)
        return
      }

      setIsPreviewExpanded(false)
      setIsShowingOriginal(false)
    }

    document.addEventListener('keydown', handleDocumentKeydown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  }, [isContactModalOpen, showExpandedPreview])

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

    const previewSize = fitWithinBox(outputWidth, outputHeight, 180, true)

    renderAdjustedImage({
      canvas,
      image: sourceImage.image,
      width: previewSize.width,
      height: previewSize.height,
      adjustments,
      resizeMode,
      backgroundColor: normalizedBackgroundColor || undefined,
    })
  }, [
    adjustments,
    isAdjustmentsOpen,
    normalizedBackgroundColor,
    outputHeight,
    outputWidth,
    resizeMode,
    sourceImage,
  ])

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

  useEffect(() => {
    const canvas = compareCanvasRef.current

    if (!canvas) {
      return
    }

    if (!sourceImage) {
      canvas.width = Math.max(previewDisplay.width, 1)
      canvas.height = Math.max(previewDisplay.height, 1)
      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    renderAdjustedImage({
      canvas,
      image: sourceImage.image,
      width: previewDisplay.width,
      height: previewDisplay.height,
      adjustments: DEFAULT_ADJUSTMENTS,
      resizeMode,
      backgroundColor: undefined,
    })
  }, [previewDisplay.height, previewDisplay.width, resizeMode, sourceImage])

  function commitPickerColor(nextColor: HsvColor) {
    setPickerColor(nextColor)
    setBackgroundColor(hsvToHex(nextColor))
  }

  function syncBackgroundColorInput(nextValue: string) {
    setBackgroundColor(nextValue)

    const normalized = normalizeHexColor(nextValue)
    if (!normalized) {
      return
    }

    setPickerColor((current) => syncPickerColorWithHex(current, normalized))
  }

  function updateColorFromPlane(element: HTMLDivElement, clientX: number, clientY: number) {
    const bounds = element.getBoundingClientRect()
    const saturation = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const value = 1 - clamp((clientY - bounds.top) / bounds.height, 0, 1)

    commitPickerColor({
      h: pickerColor.h,
      s: saturation,
      v: value,
    })
  }

  function handleColorPlanePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()

    const element = event.currentTarget
    const pointerId = event.pointerId

    updateColorFromPlane(element, event.clientX, event.clientY)

    try {
      element.setPointerCapture(pointerId)
    } catch {
      // Pointer capture isn't available in every browser.
    }

    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      try {
        element.releasePointerCapture(pointerId)
      } catch {
        // Ignore release failures for unsupported browsers.
      }
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      updateColorFromPlane(element, moveEvent.clientX, moveEvent.clientY)
    }

    function handlePointerUp(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) {
        return
      }

      cleanup()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handleHueChange(event: ChangeEvent<HTMLInputElement>) {
    commitPickerColor({
      h: Number(event.target.value),
      s: pickerColor.s,
      v: pickerColor.v,
    })
  }

  function openColorPicker() {
    setIsColorPickerUpward(resolvePopoverUpward(colorPickerRef.current))
    setIsColorPickerOpen(true)
  }

  function toggleColorPicker() {
    const nextOpen = !isColorPickerOpen

    if (nextOpen) {
      setIsColorPickerUpward(resolvePopoverUpward(colorPickerRef.current))
    }

    setIsColorPickerOpen(nextOpen)
  }

  function dismissUploadNotice(): void {
    if (uploadNoticeTimerRef.current !== null) {
      window.clearTimeout(uploadNoticeTimerRef.current)
      uploadNoticeTimerRef.current = null
    }

    setUploadNotice(null)
  }

  function showUploadNotice(title: string, message: string): void {
    if (uploadNoticeTimerRef.current !== null) {
      window.clearTimeout(uploadNoticeTimerRef.current)
    }

    setUploadNotice({ title, message })
    uploadNoticeTimerRef.current = window.setTimeout(() => {
      uploadNoticeTimerRef.current = null
      setUploadNotice(null)
    }, 4200)
  }

  function resolveDraggedFileState(dataTransfer: DataTransfer | null): 'none' | 'valid' | 'invalid' {
    if (!dataTransfer) {
      return 'none'
    }

    const fileItems = Array.from(dataTransfer.items ?? []).filter((item) => item.kind === 'file')

    if (fileItems.length === 0) {
      return dataTransfer.files.length > 0
        ? isImageFile(dataTransfer.files[0])
          ? 'valid'
          : 'invalid'
        : 'none'
    }

    const firstItem = fileItems[0]
    const resolvedFile = firstItem.getAsFile()

    if (resolvedFile) {
      return isImageFile(resolvedFile) ? 'valid' : 'invalid'
    }

    if (firstItem.type) {
      return isSupportedImageMime(firstItem.type) ? 'valid' : 'invalid'
    }

    return 'valid'
  }

  function handleDragState(event: ReactDragEvent<HTMLElement>): void {
    const dragState = resolveDraggedFileState(event.dataTransfer)
    const isSupported = dragState === 'valid'
    setIsDragging(dragState !== 'none')
    setIsInvalidDrag(dragState === 'invalid')
    event.dataTransfer.dropEffect = isSupported ? 'copy' : 'none'
  }

  async function handleSelectedFile(file: File | null): Promise<void> {
    if (!file) {
      return
    }

    if (!isImageFile(file)) {
      showUploadNotice(t.unsupportedFileTitle, t.unsupportedFileMessage)
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
      showUploadNotice(t.unreadableImageTitle, t.unreadableImageMessage)
    }
  }

  async function handleFileSelection(files: FileList | null): Promise<void> {
    await handleSelectedFile(files?.[0] ?? null)
  }

  async function openImagePicker(): Promise<void> {
    const pickerWindow = window as PickerWindow

    if (pickerWindow.showOpenFilePicker) {
      try {
        const [handle] = await pickerWindow.showOpenFilePicker({
          multiple: false,
          excludeAcceptAllOption: true,
          types: [...SUPPORTED_IMAGE_PICKER_TYPES],
        })

        const file = await handle?.getFile()
        await handleSelectedFile(file ?? null)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }

      return
    }

    fileInputRef.current?.click()
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

  function handlePaletteEdit(): void {
    if (selectedCustomPalette) {
      setIsPaletteEditorOpen((current) => !current)
      return
    }

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
    setIsPaletteEditorOpen(true)
  }

  function handlePaletteSelectionChange(nextKey: string): void {
    setSelectedPaletteKey(nextKey)

    if (!nextKey.startsWith('custom:')) {
      setIsPaletteEditorOpen(false)
    }
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
    setIsPaletteEditorOpen(false)
  }

  function clearSourceImage(): void {
    setIsPreviewExpanded(false)
    setIsShowingOriginal(false)
    setSourceImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.objectUrl)
      }

      return null
    })
  }

  function openExpandedPreview(): void {
    if (!canExpandPreview) {
      return
    }

    setIsPreviewExpanded(true)
  }

  function closeExpandedPreview(): void {
    setIsPreviewExpanded(false)
    setIsShowingOriginal(false)
  }

  function handlePreviewArtworkClick(): void {
    if (!canExpandPreview || showExpandedPreview) {
      return
    }

    openExpandedPreview()
  }

  function handlePreviewArtworkKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (!canExpandPreview || showExpandedPreview) {
      return
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    openExpandedPreview()
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
    <main
      className={`app ${isMobilePreview ? 'is-mobile-preview' : ''} ${
        isCompactLayout ? 'is-compact-layout' : ''
      } ${hasImage ? 'has-image' : 'is-empty'} ${isEnterReady ? 'is-enter-ready' : ''}`}
    >
      <header className="page-header">
        <div className="document-toolbar enter-stage enter-stage--1">
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

        <section className="header-card solid-shadow enter-stage enter-stage--2">
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

      <div className={`workspace workspace--refresh ${isCompactLayout ? 'is-compact' : ''}`}>
        <aside className="settings-column">
          <section className="panel-card panel-card--image solid-shadow enter-stage enter-stage--3">
            <div className="panel-card__heading">
              <div className="panel-title">
                <Icon name="image" />
                <h2>{t.imageSectionTitle}</h2>
              </div>
              {sourceImage ? (
                <button
                  type="button"
                  className="secondary-button secondary-button--inline secondary-button--accent-hover"
                  onClick={clearSourceImage}
                >
                  <Icon name="trash" />
                  {t.removeLabel}
                </button>
              ) : null}
            </div>

            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_IMAGE_ACCEPT}
              className="sr-only"
              onChange={(event) => {
                void handleFileSelection(event.target.files)
                event.currentTarget.value = ''
              }}
            />

            {!sourceImage ? (
              <label
                className={`dropzone dropzone--refresh ${isDragging ? 'dropzone-active' : ''} ${
                  isInvalidDrag ? 'is-invalid-drag' : ''
                }`}
                htmlFor={inputId}
                onClick={(event) => {
                  if ((window as PickerWindow).showOpenFilePicker) {
                    event.preventDefault()
                    void openImagePicker()
                  }
                }}
                onDragEnter={(event) => {
                  event.preventDefault()
                  handleDragState(event)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  handleDragState(event)
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  if (event.currentTarget === event.target) {
                    setIsDragging(false)
                    setIsInvalidDrag(false)
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                  const dragState = resolveDraggedFileState(event.dataTransfer)
                  setIsInvalidDrag(false)

                  if (dragState === 'invalid') {
                    showUploadNotice(t.unsupportedFileTitle, t.unsupportedFileMessage)
                    return
                  }

                  void handleFileSelection(event.dataTransfer.files)
                }}
              >
                <span className="dropzone-icon dropzone-icon--refresh">
                  <Icon name="upload" />
                </span>
                <div className="dropzone-copy dropzone-copy--refresh">
                  <strong>{t.dropzoneTitle}</strong>
                  {t.dropzoneSubtitle ? <span>{t.dropzoneSubtitle}</span> : null}
                </div>
              </label>
            ) : (
              <div
                className="image-source-row"
                role="button"
                tabIndex={0}
                onClick={() => {
                  void openImagePicker()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void openImagePicker()
                  }
                }}
              >
                <div className="image-source-row__thumb-wrap">
                  <img src={sourceImage.objectUrl} alt="" className="image-source-row__thumb" />
                </div>
                <div className="image-source-row__copy">
                  <strong>{sourceImage.fileName}</strong>
                  <span>{t.originalImageLabel(sourceImage.width, sourceImage.height)}</span>
                </div>
              </div>
            )}
          </section>

          {hasImage ? (
            <>
              <AccordionCard
                title={t.adjustmentsTitle}
                iconName="sliders"
                isOpen={isAdjustmentsOpen}
                onToggle={() => setIsAdjustmentsOpen((current) => !current)}
                rightContent={t.beforePaletteLabel}
                className="enter-stage enter-stage--4"
              >
                <div className="accordion-card__toolbar">
                  <p className="accordion-note">{t.beforePaletteLabel}</p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setAdjustments({ ...DEFAULT_ADJUSTMENTS })}
                    disabled={!hasAdjustments}
                  >
                    {t.resetLabel}
                  </button>
                </div>

                <div className="slider-stack">
                  <CompactSlider
                    label={t.hueLabel}
                    value={adjustments.hue}
                    min={-180}
                    max={180}
                    onChange={(value) => handleAdjustmentChange('hue', value)}
                  />
                  <CompactSlider
                    label={t.saturationLabel}
                    value={adjustments.saturation}
                    min={-100}
                    max={100}
                    onChange={(value) => handleAdjustmentChange('saturation', value)}
                  />
                  <CompactSlider
                    label={t.brightnessLabel}
                    value={adjustments.brightness}
                    min={-100}
                    max={100}
                    onChange={(value) => handleAdjustmentChange('brightness', value)}
                  />
                </div>

                <div className="mini-preview">
                  <div className="mini-preview__header">
                    <strong>{t.adjustmentPreviewTitle}</strong>
                    <span>{t.beforePaletteLabel}</span>
                  </div>
                  <div className="mini-preview__frame">
                    {sourceImage ? (
                      <canvas ref={adjustmentPreviewCanvasRef} className="mini-preview__canvas" />
                    ) : (
                      <span className="mini-preview__empty">{t.adjustmentPreviewEmpty}</span>
                    )}
                  </div>
                </div>
              </AccordionCard>

              <section className="panel-card panel-card--palette solid-shadow enter-stage enter-stage--5">
                <div className="panel-card__heading">
                  <div className="panel-title">
                    <Icon name="palette" />
                    <h2>{t.paletteTitle}</h2>
                  </div>
                </div>

                <div className="palette-selector-row">
                  <CustomSelect
                    ariaLabel={t.paletteTitle}
                    value={selectedPaletteKey}
                    groups={paletteOptionGroups}
                    onChange={handlePaletteSelectionChange}
                    className="field-select field-select--palette"
                  />
                  <button type="button" className="secondary-button" onClick={handlePaletteEdit}>
                    {t.editPaletteLabel}
                  </button>
                </div>

                <div className="palette-strip palette-strip--refresh" aria-label={t.selectedColorsAria}>
                  {selectedPalette.colors.map((color) => (
                    <span
                      key={`${selectedPalette.id}-${color}`}
                      className="palette-chip palette-chip--refresh"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {isPaletteEditorOpen && selectedCustomPalette ? (
                  <div className="palette-editor-card">
                    <Field label={t.paletteNameLabel}>
                      <input
                        type="text"
                        value={selectedCustomPalette.name}
                        onChange={(event) => handleCustomPaletteNameChange(event.target.value)}
                      />
                    </Field>

                    <div className="color-list color-list--refresh">
                      {selectedCustomPalette.colors.map((color, index) => (
                        <div className="color-row color-row--refresh" key={`${selectedCustomPalette.id}-${index}`}>
                          <PaletteColorPickerButton
                            value={color}
                            ariaLabel={t.colorInputAria(index + 1)}
                            onCommit={(nextColor) => handleCustomColorChange(index, nextColor)}
                          />
                          <button
                            type="button"
                            className="icon-button icon-button-quiet"
                            onClick={() => handleRemoveCustomColor(index)}
                            disabled={selectedCustomPalette.colors.length <= 1}
                            aria-label={t.deleteColorAria(index + 1)}
                          >
                            <Icon name="x" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="custom-actions custom-actions--refresh">
                      <button type="button" className="text-button" onClick={handleAddCustomColor}>
                        <Icon name="plus" />
                        <span>{t.addColorLabel}</span>
                      </button>
                      <button
                        type="button"
                        className="text-button text-button-danger"
                        onClick={handleDeleteCustomPalette}
                      >
                        <span>{t.deletePaletteLabel}</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <AccordionCard
                title={t.sizeTitle}
                iconName="maximize"
                isOpen={isSizeOutputOpen}
                onToggle={() => setIsSizeOutputOpen((current) => !current)}
                rightContent={sizeOutputSummary}
                className="enter-stage enter-stage--6"
              >
                <div className="settings-stack settings-stack--size-output">
                  <Field label={t.presetLabel}>
                    <CustomSelect
                      ariaLabel={t.presetLabel}
                      value={sizePreset?.id ?? 'custom'}
                      groups={sizePresetOptionGroups}
                      onChange={handleSizePresetChange}
                      className="field-select"
                    />
                  </Field>

                  <div className="dimension-grid dimension-grid--size-output">
                    <Field label={t.widthLabel}>
                      <input
                        type="number"
                        min={1}
                        max={256}
                        value={outputWidth}
                        onChange={(event) => handleDimensionChange('width', event.target.value)}
                      />
                    </Field>
                    <Field label={t.heightLabel}>
                      <input
                        type="number"
                        min={1}
                        max={256}
                        value={outputHeight}
                        onChange={(event) => handleDimensionChange('height', event.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label={t.resizeLabel}>
                    <CustomSelect
                      ariaLabel={t.resizeLabel}
                      value={resizeMode}
                      groups={resizeModeOptionGroups}
                      onChange={(value) => setResizeMode(value as ResizeMode)}
                      className="field-select"
                    />
                  </Field>

                  <div className="size-output-divider" aria-hidden="true" />

                  <div className="settings-grid settings-grid--size-output">
                    <Field label={t.backgroundColorLabel}>
                      <div className="mini-color-field mini-color-field--refresh" ref={colorPickerRef}>
                        <div
                          className={`mini-color-row mini-color-row--refresh ${isColorPickerOpen ? 'is-open' : ''} ${
                            !normalizedBackgroundColor ? 'is-transparent' : ''
                          }`}
                          onPointerDown={(event) => {
                            event.preventDefault()
                            openColorPicker()
                          }}
                        >
                          <button
                            type="button"
                            className={`mini-color-swatch-button ${
                              isColorPickerOpen ? 'is-open' : ''
                            } ${!normalizedBackgroundColor ? 'is-transparent' : ''}`}
                            style={
                              normalizedBackgroundColor
                                ? { backgroundColor: safeBackgroundColor }
                                : undefined
                            }
                            aria-label={`${t.backgroundColorLabel}: ${backgroundLabel}`}
                            aria-expanded={isColorPickerOpen}
                            aria-haspopup="dialog"
                            onPointerDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              toggleColorPicker()
                            }}
                          >
                            <span className="visually-hidden">{backgroundLabel}</span>
                          </button>

                          <input
                            className="mini-input--hex mini-color-row__display"
                            type="text"
                            value={backgroundLabel}
                            readOnly
                            aria-label={`${t.backgroundColorLabel}: ${backgroundLabel}`}
                            aria-expanded={isColorPickerOpen}
                            aria-haspopup="dialog"
                            spellCheck={false}
                            onPointerDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              openColorPicker()
                            }}
                            onFocus={() => openColorPicker()}
                          />

                          <button
                            type="button"
                            className="mini-color-row__toggle"
                            aria-label={t.backgroundColorLabel}
                            aria-expanded={isColorPickerOpen}
                            aria-haspopup="dialog"
                            onPointerDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              toggleColorPicker()
                            }}
                          >
                            <span className="field-chevron" aria-hidden="true">
                              <svg viewBox="0 0 24 24" strokeWidth="3">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                />
                              </svg>
                            </span>
                          </button>
                        </div>

                        {isColorPickerOpen ? (
                          <div
                            className={`mini-color-popover mini-color-popover--refresh ${
                              isColorPickerUpward ? 'is-open-upward' : ''
                            }`}
                            role="dialog"
                            aria-label={t.backgroundColorLabel}
                          >
                            <div className="mini-color-popover__toolbar">
                              <button
                                type="button"
                                className={`mini-color-transparent ${!normalizedBackgroundColor ? 'is-selected' : ''}`}
                                onClick={() => setBackgroundColor('')}
                              >
                                {t.transparentLabel}
                              </button>
                            </div>

                            <div className="mini-color-popover__preview">
                              <span
                                className={`mini-color-popover__preview-swatch ${
                                  !normalizedBackgroundColor ? 'is-transparent' : ''
                                }`}
                                style={
                                  normalizedBackgroundColor
                                    ? { backgroundColor: safeBackgroundColor }
                                    : undefined
                                }
                                aria-hidden="true"
                              />
                              <input
                                className="mini-input mini-input--hex mini-color-popover__hex"
                                type="text"
                                value={backgroundColor}
                                onChange={(event) => syncBackgroundColorInput(event.target.value.trim())}
                                placeholder="#FFFFFF"
                                spellCheck={false}
                                autoFocus
                              />
                            </div>

                            <div
                              className="mini-color-plane"
                              style={{ backgroundColor: hsvToHex({ h: pickerColor.h, s: 1, v: 1 }) }}
                              onPointerDown={handleColorPlanePointerDown}
                            >
                              <span
                                className="mini-color-plane__pointer"
                                style={{
                                  left: `${pickerColor.s * 100}%`,
                                  top: `${(1 - pickerColor.v) * 100}%`,
                                }}
                              />
                            </div>

                            <div className="mini-color-hue-wrap">
                              <input
                                className="mini-color-hue"
                                type="range"
                                min={0}
                                max={360}
                                step={1}
                                value={Math.round(pickerColor.h)}
                                style={hueSliderStyle}
                                onChange={handleHueChange}
                                aria-label={t.backgroundColorLabel}
                              />
                            </div>

                            <div className="mini-color-popover__swatches">
                              {BACKGROUND_COLOR_SWATCHES.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`mini-color-option ${safeBackgroundColor === color && normalizedBackgroundColor ? 'is-selected' : ''}`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`${t.backgroundColorLabel}: ${color.toUpperCase()}`}
                                  title={color.toUpperCase()}
                                  onClick={() => syncBackgroundColorInput(color)}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </Field>

                    <Field label={t.exportFormatLabel}>
                      <CustomSelect
                        ariaLabel={t.exportFormatLabel}
                        value={exportFormat}
                        groups={exportFormatOptionGroups}
                        onChange={(value) => setExportFormat(value as ExportFormat)}
                        className="field-select"
                      />
                    </Field>
                  </div>

                  {exportFormat !== 'png' && !normalizedBackgroundColor ? (
                    <p className="setting-note">{t.nonPngBackgroundNote}</p>
                  ) : null}
                </div>
              </AccordionCard>
            </>
          ) : null}
        </aside>

        <section className={`preview-column ${showExpandedPreview ? 'is-expanded-layer' : ''}`}>
          {showExpandedPreview ? (
            <button
              type="button"
              className="preview-overlay-backdrop"
              aria-label={t.closePreviewLabel}
              onClick={closeExpandedPreview}
            />
          ) : null}

          <div
            className={`preview-shell solid-shadow enter-stage enter-stage--7 ${
              showExpandedPreview ? 'is-expanded' : ''
            } ${canExpandPreview && !showExpandedPreview ? 'is-inline-compact' : ''}`}
          >
            <div className="preview-shell__header">
              <div className="preview-shell__title">
                <Icon name="eye" className="preview-shell__lead-icon" />
                <h2>{t.previewTitle}</h2>
              </div>

              <div className="preview-shell__actions">
                {canExpandPreview ? (
                  <button
                    type="button"
                    className="icon-button icon-button-quiet preview-shell__expand-button"
                    aria-label={showExpandedPreview ? t.closePreviewLabel : t.expandPreviewLabel}
                    onClick={showExpandedPreview ? closeExpandedPreview : openExpandedPreview}
                  >
                    <Icon name={showExpandedPreview ? 'x' : 'maximize'} />
                  </button>
                ) : null}

                <button
                  type="button"
                  className="preview-save-button toy-btn"
                  onClick={() => void handleDownload()}
                  disabled={!sourceImage}
                >
                  <span className="preview-save-button__label">{t.saveLabel}</span>
                  <span className="preview-save-button__icon" aria-hidden="true">
                    <Icon name="download" />
                  </span>
                </button>
              </div>
            </div>

            <div className={`preview-stage preview-stage--refresh ${sourceImage ? 'has-image' : 'is-empty'}`}>
              {!sourceImage ? (
                <div className="preview-empty preview-empty--refresh">
                  <span className="preview-empty-icon preview-empty-icon--refresh">
                    <Icon name="image" />
                  </span>
                  <strong>{t.previewEmptyLabel}</strong>
                </div>
              ) : (
                <>
                  <div
                    className={`preview-artwork ${isShowingOriginal ? 'is-showing-original' : ''}`}
                    style={{ width: `${previewDisplay.width}px`, height: `${previewDisplay.height}px` }}
                    role={canExpandPreview && !showExpandedPreview ? 'button' : undefined}
                    tabIndex={canExpandPreview && !showExpandedPreview ? 0 : undefined}
                    aria-label={canExpandPreview && !showExpandedPreview ? t.expandPreviewLabel : undefined}
                    onClick={handlePreviewArtworkClick}
                    onKeyDown={handlePreviewArtworkKeyDown}
                    onPointerDown={
                      canComparePreview
                        ? (event) => {
                            event.preventDefault()
                            event.currentTarget.setPointerCapture?.(event.pointerId)
                            setIsShowingOriginal(true)
                          }
                        : undefined
                    }
                    onPointerUp={
                      canComparePreview
                        ? (event) => {
                            event.currentTarget.releasePointerCapture?.(event.pointerId)
                            setIsShowingOriginal(false)
                          }
                        : undefined
                    }
                    onPointerLeave={canComparePreview ? () => setIsShowingOriginal(false) : undefined}
                    onPointerCancel={canComparePreview ? () => setIsShowingOriginal(false) : undefined}
                    onLostPointerCapture={canComparePreview ? () => setIsShowingOriginal(false) : undefined}
                  >
                    <canvas
                      ref={compareCanvasRef}
                      className={`preview-canvas preview-canvas--compare ${
                        isShowingOriginal ? 'is-visible' : 'is-hidden'
                      }`}
                      style={{ width: `${previewDisplay.width}px`, height: `${previewDisplay.height}px` }}
                    />
                    <canvas
                      ref={previewCanvasRef}
                      className={`preview-canvas preview-canvas--pixel ${
                        isShowingOriginal ? 'is-hidden' : 'is-visible'
                      }`}
                      style={{ width: `${previewDisplay.width}px`, height: `${previewDisplay.height}px` }}
                    />

                    <div
                      className={`compare-chip ${isShowingOriginal ? 'is-active' : ''} ${
                        showExpandedPreview ? 'is-persisted' : ''
                      }`}
                      aria-hidden="true"
                    >
                      <Icon name="eye" />
                      <span>{t.compareHoldLabel}</span>
                    </div>
                  </div>

                  <div className="preview-chip-row">
                    <span className="preview-chip">{outputWidth}×{outputHeight}</span>
                    <span className="preview-chip">{selectedPaletteLabel}</span>
                    <span className="preview-chip">{selectedFormat.label}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <footer className="app-footer enter-stage enter-stage--8">
        <button
          type="button"
          className="secondary-button app-footer__contact-button btn-wobble-group"
          onClick={() => setIsContactModalOpen(true)}
        >
          <span className="wobble-container" aria-hidden="true">
            <span className="wobble-target app-footer__contact-symbol">
              <ContactGlyph />
            </span>
          </span>
          {t.contactButtonLabel}
        </button>
      </footer>

      {isContactModalOpen ? (
        <div
          className="contact-modal-backdrop"
          role="presentation"
          onClick={() => setIsContactModalOpen(false)}
        >
          <section
            className="contact-modal solid-shadow"
            role="dialog"
            aria-modal="true"
            aria-labelledby={contactDialogTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="contact-modal__header">
              <div className="contact-modal__title-wrap">
                <span className="wobble-container" aria-hidden="true">
                  <span className="wobble-target contact-modal__title-icon">
                    <ContactGlyph />
                  </span>
                </span>
                <div className="contact-modal__title-copy">
                  <h2 id={contactDialogTitleId}>{t.contactDialogTitle}</h2>
                  <p>{t.contactDialogDescription}</p>
                </div>
              </div>

              <button
                type="button"
                className="icon-button contact-modal__close"
                aria-label={t.contactDialogCloseLabel}
                onClick={() => setIsContactModalOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>

            <div className="contact-modal__links">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="toy-btn btn-wobble-group contact-modal__link contact-modal__link--email"
              >
                <span className="wobble-container" aria-hidden="true">
                  <span className="wobble-target contact-modal__link-icon contact-modal__link-icon--email">
                    <EmailGlyph />
                  </span>
                </span>
                <span className="contact-modal__link-copy">
                  <span className="contact-modal__link-title">{t.contactEmailTitle}</span>
                  <span className="contact-modal__link-text">{CONTACT_EMAIL}</span>
                </span>
              </a>

              <a
                href={MARSHMALLOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="toy-btn btn-wobble-group contact-modal__link contact-modal__link--marshmallow"
              >
                <span className="wobble-container" aria-hidden="true">
                  <span className="wobble-target contact-modal__link-icon contact-modal__link-icon--marshmallow">
                    <img src="/marshmallow-logo.svg" alt="" className="contact-modal__marshmallow-logo" />
                  </span>
                </span>
                <span className="contact-modal__link-copy">
                  <span className="contact-modal__link-title">{t.contactMarshmallowTitle}</span>
                  <span className="contact-modal__link-text">{t.contactMarshmallowText}</span>
                </span>
              </a>
            </div>

            <div className="contact-modal__meta" aria-label={`${t.versionLabel} v${APP_VERSION}`}>
              <span className="contact-modal__meta-label">{t.versionLabel}</span>
              <code className="contact-modal__meta-value">v{APP_VERSION}</code>
            </div>
          </section>
        </div>
      ) : null}

      {uploadNotice ? (
        <div className="upload-notice-popup solid-shadow" role="alert" aria-live="assertive">
          <div className="upload-notice-popup__copy">
            <strong>{uploadNotice.title}</strong>
            <p>{uploadNotice.message}</p>
          </div>
          <button
            type="button"
            className="icon-button icon-button-quiet upload-notice-popup__close"
            aria-label={t.uploadNoticeCloseLabel}
            onClick={dismissUploadNotice}
          >
            <Icon name="x" />
          </button>
        </div>
      ) : null}

      {isLocalPreview ? (
        <button
          type="button"
          className="view-toggle"
          aria-pressed={isMobilePreview}
          onClick={() => {
            closeExpandedPreview()
            setIsMobilePreview((current) => !current)
          }}
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

function resolvePopoverUpward(element: HTMLElement | null) {
  const rect = element?.getBoundingClientRect()

  if (!rect) {
    return false
  }

  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  return spaceBelow < 320 && spaceAbove > spaceBelow
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="field-card">
      <span className="field-card__label">{props.label}</span>
      <div className="field-card__control">{props.children}</div>
    </label>
  )
}

function CustomSelect(props: {
  ariaLabel: string
  value: string
  groups: SelectGroup[]
  onChange: (value: string) => void
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [opensUpward, setOpensUpward] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  function getDisplayedGroups() {
    return props.groups
  }

  function getDisplayedFlatOptions() {
    return getDisplayedGroups().flatMap((group) => group.options)
  }

  const displayedGroups = getDisplayedGroups()
  const displayedFlatOptions = displayedGroups.flatMap((group) => group.options)
  const optionIndexByValue = new Map(displayedFlatOptions.map((option, index) => [option.value, index]))
  const currentIndex = Math.max(
    0,
    displayedFlatOptions.findIndex((option) => option.value === props.value),
  )
  const currentOption = displayedFlatOptions[currentIndex] ?? displayedFlatOptions[0]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!isOpen || !rootRef.current || rootRef.current.contains(event.target as Node)) {
        return
      }

      setIsOpen(false)
    }

    function handleDocumentKeydown(event: KeyboardEvent) {
      if (!isOpen || event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      setIsOpen(false)
      window.requestAnimationFrame(() => buttonRef.current?.focus())
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleDocumentKeydown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  }, [isOpen])

  function focusOption(index: number, optionCount = displayedFlatOptions.length) {
    const nextIndex = (index + optionCount) % optionCount
    optionRefs.current[nextIndex]?.focus()
  }

  function resolveOpensUpward() {
    const rect = rootRef.current?.getBoundingClientRect()

    if (!rect) {
      return false
    }

    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    return spaceBelow < 280 && spaceAbove > spaceBelow
  }

  function openMenu(indexOffset = 0, focusTarget = true) {
    const nextOpensUpward = resolveOpensUpward()
    const nextDisplayedFlatOptions = getDisplayedFlatOptions()

    if (nextDisplayedFlatOptions.length === 0) {
      return
    }

    const nextCurrentIndex = Math.max(
      0,
      nextDisplayedFlatOptions.findIndex((option) => option.value === props.value),
    )
    const nextFocusIndex =
      (nextCurrentIndex + indexOffset + nextDisplayedFlatOptions.length) %
      nextDisplayedFlatOptions.length

    setOpensUpward(nextOpensUpward)
    setIsOpen(true)

    window.requestAnimationFrame(() => {
      if (focusTarget) {
        focusOption(nextFocusIndex, nextDisplayedFlatOptions.length)
        return
      }

      if (menuRef.current) {
        menuRef.current.scrollTop = 0
      }
    })
  }

  function closeMenu(focusButton = true) {
    setIsOpen(false)

    if (focusButton) {
      window.requestAnimationFrame(() => buttonRef.current?.focus())
    }
  }

  function chooseValue(nextValue: string) {
    if (nextValue !== props.value) {
      props.onChange(nextValue)
    }

    closeMenu(false)
    window.requestAnimationFrame(() => buttonRef.current?.focus())
  }

  function handleButtonKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openMenu(0)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(-1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      if (isOpen) {
        closeMenu(false)
      } else {
        openMenu(0, true)
      }
    }
  }

  function handleOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(index + 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(index - 1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      focusOption(displayedFlatOptions.length - 1)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key === 'Tab') {
      closeMenu(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      chooseValue(displayedFlatOptions[index].value)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`custom-select ${props.className ?? ''} ${isOpen ? 'is-open' : ''} ${
        opensUpward ? 'is-open-upward' : ''
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        className="custom-select__button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`${props.ariaLabel}: ${currentOption?.label ?? ''}`}
        onClick={() => {
          if (isOpen) {
            closeMenu(false)
          } else {
            openMenu(0, false)
          }
        }}
        onKeyDown={handleButtonKeyDown}
      >
        <span className="custom-select__label">{currentOption?.label}</span>
        <span className="custom-select__icon field-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      <div
        ref={menuRef}
        id={menuId}
        className="custom-select__menu"
        role="listbox"
        aria-label={props.ariaLabel}
        hidden={!isOpen}
      >
        <div className="custom-select__options">
          {displayedGroups.map((group, groupIndex) => (
            <div className="custom-select__group" key={`${group.label ?? 'group'}-${groupIndex}`}>
              {group.label ? <div className="custom-select__group-label">{group.label}</div> : null}
              {group.options.map((option) => {
                const index = optionIndexByValue.get(option.value) ?? 0

                return (
                  <button
                    key={option.value}
                    ref={(node) => {
                      optionRefs.current[index] = node
                    }}
                    type="button"
                    className="custom-select__option"
                    role="option"
                    aria-selected={option.value === props.value}
                    onClick={() => chooseValue(option.value)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  >
                    <span className="custom-select__option-label">{option.label}</span>
                    {option.value === props.value ? (
                      <span className="custom-select__check" aria-hidden="true">
                        <Icon name="check" />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AccordionCard(props: {
  title: string
  iconName: string
  isOpen: boolean
  onToggle: () => void
  rightContent?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`accordion-card solid-shadow ${props.isOpen ? 'is-open' : ''} ${props.className ?? ''}`}>
      <button
        type="button"
        className="accordion-card__trigger"
        aria-expanded={props.isOpen}
        onClick={props.onToggle}
      >
        <span className="accordion-card__title">
          <Icon name={props.iconName} className="accordion-card__lead-icon" />
          <span>{props.title}</span>
        </span>
        <span className="accordion-card__meta">
          {!props.isOpen && props.rightContent ? (
            <span className="accordion-card__summary">{props.rightContent}</span>
          ) : null}
          <span className={`accordion-card__chevron ${props.isOpen ? 'is-open' : ''}`} aria-hidden="true">
            <Icon name="chevron-down" />
          </span>
        </span>
      </button>

      {props.isOpen ? <div className="accordion-card__body">{props.children}</div> : null}
    </section>
  )
}

function CompactSlider(props: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: string) => void
}) {
  const percent = ((props.value - props.min) / Math.max(props.max - props.min, 1)) * 100

  return (
    <div className="compact-slider">
      <label className="compact-slider__label">{props.label}</label>
      <div className="compact-slider__control">
        <input
          className="compact-slider__range"
          type="range"
          min={props.min}
          max={props.max}
          value={props.value}
          style={{ ['--slider-percent' as string]: `${percent}%` }}
          onChange={(event) => props.onChange(event.target.value)}
        />
        <input
          className="compact-slider__number"
          type="number"
          min={props.min}
          max={props.max}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        />
      </div>
    </div>
  )
}

function HexColorField(props: {
  value: string
  ariaLabel: string
  onCommit: (value: string) => void
  placeholder?: string
  className?: string
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
      className={props.className}
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

function PaletteColorPickerButton(props: {
  value: string
  ariaLabel: string
  onCommit: (value: string) => void
}) {
  const pickerRef = useRef<HTMLDivElement | null>(null)
  const normalizedValue = normalizeHexColor(props.value)
  const safeValue = normalizedValue ?? DEFAULT_PICKER_BACKGROUND
  const [pickerColor, setPickerColor] = useState<HsvColor>(() => hexToHsv(safeValue))
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenUpward, setIsOpenUpward] = useState(false)
  const hueSliderStyle = { '--mini-color-thumb': safeValue } as CSSProperties

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setIsOpenUpward(resolvePopoverUpward(pickerRef.current))

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function commitColor(nextColor: HsvColor) {
    setPickerColor(nextColor)
    props.onCommit(hsvToHex(nextColor))
  }

  function togglePicker() {
    const nextOpen = !isOpen

    if (nextOpen) {
      setIsOpenUpward(resolvePopoverUpward(pickerRef.current))
    }

    setIsOpen(nextOpen)
  }

  function openPicker() {
    setIsOpenUpward(resolvePopoverUpward(pickerRef.current))
    setIsOpen(true)
  }

  function syncInput(nextValue: string) {
    const normalized = normalizeHexColor(nextValue)

    if (!normalized) {
      return
    }

    props.onCommit(normalized)
    setPickerColor((current) => syncPickerColorWithHex(current, normalized))
  }

  function updateColorFromPlane(element: HTMLDivElement, clientX: number, clientY: number) {
    const bounds = element.getBoundingClientRect()
    const saturation = clamp((clientX - bounds.left) / bounds.width, 0, 1)
    const value = 1 - clamp((clientY - bounds.top) / bounds.height, 0, 1)

    commitColor({
      h: pickerColor.h,
      s: saturation,
      v: value,
    })
  }

  function handlePlanePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()

    const element = event.currentTarget
    const pointerId = event.pointerId

    updateColorFromPlane(element, event.clientX, event.clientY)

    try {
      element.setPointerCapture(pointerId)
    } catch {
      // Pointer capture isn't available in every browser.
    }

    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)

      try {
        element.releasePointerCapture(pointerId)
      } catch {
        // Ignore release failures for unsupported browsers.
      }
    }

    function handlePointerMove(moveEvent: PointerEvent) {
      updateColorFromPlane(element, moveEvent.clientX, moveEvent.clientY)
    }

    function handlePointerUp(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId) {
        return
      }

      cleanup()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handleHueChange(event: ChangeEvent<HTMLInputElement>) {
    commitColor({
      h: Number(event.target.value),
      s: pickerColor.s,
      v: pickerColor.v,
    })
  }

  return (
    <div
      className="palette-color-picker"
      ref={pickerRef}
      onPointerDown={(event) => {
        event.stopPropagation()
      }}
    >
      <div
        className={`mini-color-row mini-color-row--compact palette-color-picker__row ${
          isOpen ? 'is-open' : ''
        }`}
        onPointerDown={(event) => {
          event.preventDefault()
          openPicker()
        }}
      >
        <button
          type="button"
          className={`palette-color-picker__trigger mini-color-swatch-button ${isOpen ? 'is-open' : ''}`}
          style={{ backgroundColor: safeValue }}
          aria-label={`${props.ariaLabel}: ${safeValue}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            togglePicker()
          }}
        >
          <span className="visually-hidden">{props.value}</span>
        </button>

        <input
          className="mini-input--hex mini-color-row__display"
          type="text"
          value={safeValue}
          readOnly
          aria-label={`${props.ariaLabel}: ${safeValue}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          spellCheck={false}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            openPicker()
          }}
          onFocus={() => openPicker()}
        />

        <button
          type="button"
          className="mini-color-row__toggle"
          aria-label={props.ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            togglePicker()
          }}
        >
          <span className="field-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
        </button>
      </div>

      {isOpen ? (
        <div
          className={`mini-color-popover mini-color-popover--refresh ${
            isOpenUpward ? 'is-open-upward' : ''
          }`}
          role="dialog"
          aria-label={props.ariaLabel}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
        >
          <div className="mini-color-popover__preview">
            <span
              className="mini-color-popover__preview-swatch"
              style={{ backgroundColor: safeValue }}
              aria-hidden="true"
            />
            <HexColorField
              key={props.value}
              className="mini-input mini-input--hex mini-color-popover__hex"
              value={safeValue}
              ariaLabel={props.ariaLabel}
              placeholder="#FFFFFF"
              onCommit={syncInput}
            />
          </div>

          <div
            className="mini-color-plane"
            style={{ backgroundColor: hsvToHex({ h: pickerColor.h, s: 1, v: 1 }) }}
            onPointerDown={handlePlanePointerDown}
          >
            <span
              className="mini-color-plane__pointer"
              style={{
                left: `${pickerColor.s * 100}%`,
                top: `${(1 - pickerColor.v) * 100}%`,
              }}
            />
          </div>

          <div className="mini-color-hue-wrap">
            <input
              className="mini-color-hue"
              type="range"
              min={0}
              max={360}
              step={1}
              value={Math.round(pickerColor.h)}
              style={hueSliderStyle}
              onChange={handleHueChange}
              aria-label={props.ariaLabel}
            />
          </div>

          <div className="mini-color-popover__swatches">
            {BACKGROUND_COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                className={`mini-color-option ${safeValue === color ? 'is-selected' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={`${props.ariaLabel}: ${color.toUpperCase()}`}
                title={color.toUpperCase()}
                onClick={() => syncInput(color)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Icon(props: { name: string; className?: string }) {
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
    check: <path d="m5 13 4 4L19 7" />,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    maximize: (
      <>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </>
    ),
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
      className={props.className ? `icon ${props.className}` : 'icon'}
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

function ContactGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.946 1.37 3.68 3.348 3.97.877.129 1.761.234 2.652.316V21a.75.75 0 0 0 1.28.53l4.184-4.183a.39.39 0 0 1 .266-.112c2.006-.05 3.982-.22 5.922-.506 1.978-.29 3.348-2.023 3.348-3.97V6.741c0-1.947-1.37-3.68-3.348-3.97A49.145 49.145 0 0 0 12 2.25ZM8.25 8.625a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Zm2.625 1.125a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875-1.125a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function EmailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67z" />
      <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908z" />
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

function isSupportedImageMime(type: string): boolean {
  return type in SUPPORTED_IMAGE_TYPE_MAP
}

function isImageFile(file: File): boolean {
  const lowerName = file.name.toLowerCase()

  return (
    (file.type.length > 0 && isSupportedImageMime(file.type)) ||
    SUPPORTED_IMAGE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  )
}

function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value)

  if (!normalized) {
    return null
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

function normalizeHue(value: number) {
  const hue = value % 360
  return hue < 0 ? hue + 360 : hue
}

function hexToHsv(value: string): HsvColor {
  const rgb = hexToRgb(value)
  if (!rgb) {
    return { h: 0, s: 0, v: 0 }
  }

  const red = rgb.r / 255
  const green = rgb.g / 255
  const blue = rgb.b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let hue = 0
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6
    } else if (max === green) {
      hue = (blue - red) / delta + 2
    } else {
      hue = (red - green) / delta + 4
    }
  }

  return {
    h: normalizeHue(hue * 60),
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvToRgb(value: HsvColor) {
  const hue = normalizeHue(value.h)
  const saturation = clamp(value.s, 0, 1)
  const brightness = clamp(value.v, 0, 1)
  const chroma = brightness * saturation
  const segment = hue / 60
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1))

  let red = 0
  let green = 0
  let blue = 0

  if (segment >= 0 && segment < 1) {
    red = chroma
    green = secondary
  } else if (segment < 2) {
    red = secondary
    green = chroma
  } else if (segment < 3) {
    green = chroma
    blue = secondary
  } else if (segment < 4) {
    green = secondary
    blue = chroma
  } else if (segment < 5) {
    red = secondary
    blue = chroma
  } else {
    red = chroma
    blue = secondary
  }

  const match = brightness - chroma

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  }
}

function hsvToHex(value: HsvColor) {
  const rgb = hsvToRgb(value)
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

function syncPickerColorWithHex(current: HsvColor, value: string): HsvColor {
  const next = hexToHsv(value)

  if (next.s === 0 || next.v === 0) {
    return {
      h: current.h,
      s: next.s,
      v: next.v,
    }
  }

  return next
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function fitWithinBox(
  width: number,
  height: number,
  maxSide: number,
  allowUpscale = false,
): { width: number; height: number } {
  const scale = Math.min(maxSide / Math.max(width, 1), maxSide / Math.max(height, 1))
  const safeScale = allowUpscale ? scale : Math.min(scale, 1)

  return {
    width: Math.max(1, Math.round(width * safeScale)),
    height: Math.max(1, Math.round(height * safeScale)),
  }
}

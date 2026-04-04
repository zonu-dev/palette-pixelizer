export type Locale = 'en' | 'ja' | 'ko' | 'zh-Hans' | 'vi' | 'id'

type PaletteStrings = {
  pageTitle: string
  languageLabel: string
  topPageAria: string
  headerSummary: string
  settingsHeading: string
  imageSectionTitle: string
  dropzoneTitle: string
  dropzoneSubtitle: string
  chooseImageLabel: string
  originalImageLabel: (width: number, height: number) => string
  removeImageAria: string
  adjustmentsTitle: string
  resetLabel: string
  hueLabel: string
  saturationLabel: string
  brightnessLabel: string
  adjustmentPreviewTitle: string
  beforePaletteLabel: string
  adjustmentPreviewEmpty: string
  sizeTitle: string
  presetLabel: string
  customSizeLabel: string
  widthLabel: string
  heightLabel: string
  resizeLabel: string
  paletteTitle: string
  selectionLabel: string
  presetGroupLabel: string
  customGroupLabel: string
  newPaletteLabel: string
  selectedColorsAria: string
  paletteNameLabel: string
  addColorLabel: string
  deletePaletteLabel: string
  deleteColorAria: (index: number) => string
  colorInputAria: (index: number) => string
  colorHexAria: (index: number) => string
  outputTitle: string
  backgroundColorLabel: string
  transparentLabel: string
  backgroundHexAria: string
  exportFormatLabel: string
  nonPngBackgroundNote: string
  previewTitle: string
  saveLabel: string
  previewEmptyLabel: string
  colorCountLabel: (count: number) => string
  previewMobileLabel: string
  previewDesktopLabel: string
  customPaletteName: (index: number) => string
  customPaletteFallback: string
}

export type LocaleOption = {
  flagCode: string
  label: string
  value: Locale
}

type ResizeModeLabels = Record<'center-crop' | 'contain' | 'stretch', string>

const APP_ORIGIN = 'https://zoochigames.com'
const STORAGE_KEY = 'palette-pixelizer.locale'

const TOP_PAGE_PATH_BY_LOCALE: Record<Locale, string> = {
  en: '/index.en.html',
  ja: '/index.html',
  ko: '/index.ko.html',
  'zh-Hans': '/index.zh-Hans.html',
  vi: '/index.vi.html',
  id: '/index.id.html',
}

const BUILTIN_PALETTE_NAMES: Record<string, Record<Locale, string>> = {
  'grayscale-2': {
    en: 'Grayscale 2',
    ja: 'グレースケール2色',
    ko: '그레이스케일 2색',
    'zh-Hans': '灰度 2 色',
    vi: 'Thang xám 2 màu',
    id: 'Grayscale 2 warna',
  },
  'grayscale-4': {
    en: 'Grayscale 4',
    ja: 'グレースケール4色',
    ko: '그레이스ケ일 4색',
    'zh-Hans': '灰度 4 色',
    vi: 'Thang xám 4 màu',
    id: 'Grayscale 4 warna',
  },
  'game-boy': {
    en: 'Game Boy style',
    ja: 'Game Boy風',
    ko: 'Game Boy풍',
    'zh-Hans': 'Game Boy 风',
    vi: 'Phong cách Game Boy',
    id: 'Gaya Game Boy',
  },
  'pico-8': {
    en: 'PICO-8 style',
    ja: 'PICO-8風',
    ko: 'PICO-8풍',
    'zh-Hans': 'PICO-8 风',
    vi: 'Phong cách PICO-8',
    id: 'Gaya PICO-8',
  },
  'retro-8': {
    en: 'Retro 8 colors',
    ja: '8色レトロ',
    ko: '레트로 8색',
    'zh-Hans': '复古 8 色',
    vi: 'Retro 8 màu',
    id: 'Retro 8 warna',
  },
  'retro-16': {
    en: 'Retro 16 colors',
    ja: '16色レトロ',
    ko: '레트로 16색',
    'zh-Hans': '复古 16 色',
    vi: 'Retro 16 màu',
    id: 'Retro 16 warna',
  },
}

const RESIZE_MODE_LABELS: Record<Locale, ResizeModeLabels> = {
  en: {
    'center-crop': 'Center crop',
    contain: 'Show full image',
    stretch: 'Stretch',
  },
  ja: {
    'center-crop': '中心トリミング',
    contain: '全体表示',
    stretch: '引き伸ばし',
  },
  ko: {
    'center-crop': '중앙 자르기',
    contain: '전체 표시',
    stretch: '늘이기',
  },
  'zh-Hans': {
    'center-crop': '居中裁切',
    contain: '完整显示',
    stretch: '拉伸',
  },
  vi: {
    'center-crop': 'Cắt giữa',
    contain: 'Hiển thị toàn bộ',
    stretch: 'Kéo giãn',
  },
  id: {
    'center-crop': 'Potong tengah',
    contain: 'Tampilkan seluruh gambar',
    stretch: 'Regangkan',
  },
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'en', label: 'EN', flagCode: 'us' },
  { value: 'ja', label: 'JA', flagCode: 'jp' },
  { value: 'ko', label: 'KO', flagCode: 'kr' },
  { value: 'zh-Hans', label: 'ZH', flagCode: 'cn' },
  { value: 'vi', label: 'VI', flagCode: 'vn' },
  { value: 'id', label: 'ID', flagCode: 'id' },
]

export const STRINGS: Record<Locale, PaletteStrings> = {
  en: {
    pageTitle: 'Palette Pixelizer',
    languageLabel: 'Language',
    topPageAria: 'Go to the ZOOCHI top page',
    headerSummary: 'Turn an image into pixel art and save it',
    settingsHeading: 'Settings',
    imageSectionTitle: 'Image',
    dropzoneTitle: 'Drag & drop',
    dropzoneSubtitle: 'or choose an image',
    chooseImageLabel: 'Choose image',
    originalImageLabel: (width, height) => `Original ${width}×${height}`,
    removeImageAria: 'Remove image',
    adjustmentsTitle: 'Adjustments',
    resetLabel: 'Reset',
    hueLabel: 'Hue',
    saturationLabel: 'Saturation',
    brightnessLabel: 'Brightness',
    adjustmentPreviewTitle: 'Adjustment preview',
    beforePaletteLabel: 'Before palette conversion',
    adjustmentPreviewEmpty: 'Shown after adding an image',
    sizeTitle: 'Size',
    presetLabel: 'Preset',
    customSizeLabel: 'Custom',
    widthLabel: 'Width',
    heightLabel: 'Height',
    resizeLabel: 'Resize',
    paletteTitle: 'Palette',
    selectionLabel: 'Selection',
    presetGroupLabel: 'Presets',
    customGroupLabel: 'Custom',
    newPaletteLabel: 'New',
    selectedColorsAria: 'Selected colors',
    paletteNameLabel: 'Name',
    addColorLabel: 'Add color',
    deletePaletteLabel: 'Delete palette',
    deleteColorAria: (index) => `Delete color ${index}`,
    colorInputAria: (index) => `Color ${index}`,
    colorHexAria: (index) => `HEX for color ${index}`,
    outputTitle: 'Output',
    backgroundColorLabel: 'Background',
    transparentLabel: 'Transparent',
    backgroundHexAria: 'Background HEX',
    exportFormatLabel: 'Export format',
    nonPngBackgroundNote: 'Transparent areas will be exported as white.',
    previewTitle: 'Preview',
    saveLabel: 'Save',
    previewEmptyLabel: 'Add an image to display the preview here',
    colorCountLabel: (count) => `${count} colors`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    customPaletteName: (index) => `Custom ${index}`,
    customPaletteFallback: 'Custom',
  },
  ja: {
    pageTitle: 'Palette Pixelizer',
    languageLabel: '言語',
    topPageAria: 'ZOOCHIのトップページへ',
    headerSummary: '画像をドット絵化して保存',
    settingsHeading: '設定',
    imageSectionTitle: '画像',
    dropzoneTitle: 'ドラッグ&ドロップ',
    dropzoneSubtitle: 'または画像を選択',
    chooseImageLabel: '画像を選択',
    originalImageLabel: (width, height) => `元画像 ${width}×${height}`,
    removeImageAria: '画像を外す',
    adjustmentsTitle: '補正',
    resetLabel: 'リセット',
    hueLabel: '色相',
    saturationLabel: '彩度',
    brightnessLabel: '明度',
    adjustmentPreviewTitle: '補正プレビュー',
    beforePaletteLabel: 'パレット変換前',
    adjustmentPreviewEmpty: '画像追加後に表示',
    sizeTitle: 'サイズ',
    presetLabel: 'プリセット',
    customSizeLabel: '任意',
    widthLabel: '幅',
    heightLabel: '高さ',
    resizeLabel: 'リサイズ',
    paletteTitle: 'パレット',
    selectionLabel: '選択',
    presetGroupLabel: 'プリセット',
    customGroupLabel: 'カスタム',
    newPaletteLabel: '新規',
    selectedColorsAria: '選択中の色',
    paletteNameLabel: '名前',
    addColorLabel: '色を追加',
    deletePaletteLabel: 'パレットを削除',
    deleteColorAria: (index) => `色${index}を削除`,
    colorInputAria: (index) => `色${index}`,
    colorHexAria: (index) => `色${index}のHEX`,
    outputTitle: '出力',
    backgroundColorLabel: '背景色',
    transparentLabel: '透過',
    backgroundHexAria: '背景色のHEX',
    exportFormatLabel: '保存形式',
    nonPngBackgroundNote: '透過部分は白で出力されます',
    previewTitle: 'プレビュー',
    saveLabel: '保存する',
    previewEmptyLabel: '画像を追加するとここに表示されます',
    colorCountLabel: (count) => `${count}色`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    customPaletteName: (index) => `カスタム${index}`,
    customPaletteFallback: 'カスタム',
  },
  ko: {
    pageTitle: 'Palette Pixelizer',
    languageLabel: '언어',
    topPageAria: 'ZOOCHI 상단 페이지로 이동',
    headerSummary: '이미지를 픽셀 아트로 바꿔 저장',
    settingsHeading: '설정',
    imageSectionTitle: '이미지',
    dropzoneTitle: '드래그 앤 드롭',
    dropzoneSubtitle: '또는 이미지를 선택',
    chooseImageLabel: '이미지 선택',
    originalImageLabel: (width, height) => `원본 이미지 ${width}×${height}`,
    removeImageAria: '이미지 제거',
    adjustmentsTitle: '보정',
    resetLabel: '초기화',
    hueLabel: '색조',
    saturationLabel: '채도',
    brightnessLabel: '밝기',
    adjustmentPreviewTitle: '보정 미리보기',
    beforePaletteLabel: '팔레트 변환 전',
    adjustmentPreviewEmpty: '이미지를 추가하면 표시됩니다',
    sizeTitle: '크기',
    presetLabel: '프리셋',
    customSizeLabel: '직접 입력',
    widthLabel: '너비',
    heightLabel: '높이',
    resizeLabel: '리사이즈',
    paletteTitle: '팔레트',
    selectionLabel: '선택',
    presetGroupLabel: '프리셋',
    customGroupLabel: '사용자 지정',
    newPaletteLabel: '새로 만들기',
    selectedColorsAria: '선택된 색상',
    paletteNameLabel: '이름',
    addColorLabel: '색상 추가',
    deletePaletteLabel: '팔레트 삭제',
    deleteColorAria: (index) => `색상 ${index} 삭제`,
    colorInputAria: (index) => `색상 ${index}`,
    colorHexAria: (index) => `색상 ${index} HEX`,
    outputTitle: '출력',
    backgroundColorLabel: '배경색',
    transparentLabel: '투명',
    backgroundHexAria: '배경 HEX',
    exportFormatLabel: '저장 형식',
    nonPngBackgroundNote: '투명 영역은 흰색으로 저장됩니다.',
    previewTitle: '미리보기',
    saveLabel: '저장',
    previewEmptyLabel: '이미지를 추가하면 여기에 표시됩니다',
    colorCountLabel: (count) => `${count}색`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    customPaletteName: (index) => `커스텀 ${index}`,
    customPaletteFallback: '커스텀',
  },
  'zh-Hans': {
    pageTitle: 'Palette Pixelizer',
    languageLabel: '语言',
    topPageAria: '前往 ZOOCHI 顶部页面',
    headerSummary: '将图片转成像素画并保存',
    settingsHeading: '设置',
    imageSectionTitle: '图片',
    dropzoneTitle: '拖放到此处',
    dropzoneSubtitle: '或选择一张图片',
    chooseImageLabel: '选择图片',
    originalImageLabel: (width, height) => `原图 ${width}×${height}`,
    removeImageAria: '移除图片',
    adjustmentsTitle: '调整',
    resetLabel: '重置',
    hueLabel: '色相',
    saturationLabel: '饱和度',
    brightnessLabel: '亮度',
    adjustmentPreviewTitle: '调整预览',
    beforePaletteLabel: '调色板转换前',
    adjustmentPreviewEmpty: '添加图片后显示',
    sizeTitle: '尺寸',
    presetLabel: '预设',
    customSizeLabel: '自定义',
    widthLabel: '宽度',
    heightLabel: '高度',
    resizeLabel: '缩放',
    paletteTitle: '调色板',
    selectionLabel: '选择',
    presetGroupLabel: '预设',
    customGroupLabel: '自定义',
    newPaletteLabel: '新建',
    selectedColorsAria: '当前颜色',
    paletteNameLabel: '名称',
    addColorLabel: '添加颜色',
    deletePaletteLabel: '删除调色板',
    deleteColorAria: (index) => `删除颜色 ${index}`,
    colorInputAria: (index) => `颜色 ${index}`,
    colorHexAria: (index) => `颜色 ${index} 的 HEX`,
    outputTitle: '输出',
    backgroundColorLabel: '背景色',
    transparentLabel: '透明',
    backgroundHexAria: '背景色 HEX',
    exportFormatLabel: '保存格式',
    nonPngBackgroundNote: '透明区域会以白色导出。',
    previewTitle: '预览',
    saveLabel: '保存',
    previewEmptyLabel: '添加图片后会显示在这里',
    colorCountLabel: (count) => `${count} 色`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    customPaletteName: (index) => `自定义 ${index}`,
    customPaletteFallback: '自定义',
  },
  vi: {
    pageTitle: 'Palette Pixelizer',
    languageLabel: 'Ngôn ngữ',
    topPageAria: 'Đi tới trang chủ ZOOCHI',
    headerSummary: 'Biến ảnh thành pixel art rồi lưu lại',
    settingsHeading: 'Thiết lập',
    imageSectionTitle: 'Hình ảnh',
    dropzoneTitle: 'Kéo thả',
    dropzoneSubtitle: 'hoặc chọn một ảnh',
    chooseImageLabel: 'Chọn ảnh',
    originalImageLabel: (width, height) => `Ảnh gốc ${width}×${height}`,
    removeImageAria: 'Gỡ ảnh',
    adjustmentsTitle: 'Điều chỉnh',
    resetLabel: 'Đặt lại',
    hueLabel: 'Hue',
    saturationLabel: 'Độ bão hòa',
    brightnessLabel: 'Độ sáng',
    adjustmentPreviewTitle: 'Xem trước điều chỉnh',
    beforePaletteLabel: 'Trước khi đổi bảng màu',
    adjustmentPreviewEmpty: 'Hiển thị sau khi thêm ảnh',
    sizeTitle: 'Kích thước',
    presetLabel: 'Mẫu sẵn',
    customSizeLabel: 'Tùy chỉnh',
    widthLabel: 'Rộng',
    heightLabel: 'Cao',
    resizeLabel: 'Đổi kích thước',
    paletteTitle: 'Bảng màu',
    selectionLabel: 'Chọn',
    presetGroupLabel: 'Có sẵn',
    customGroupLabel: 'Tùy chỉnh',
    newPaletteLabel: 'Mới',
    selectedColorsAria: 'Màu đã chọn',
    paletteNameLabel: 'Tên',
    addColorLabel: 'Thêm màu',
    deletePaletteLabel: 'Xóa bảng màu',
    deleteColorAria: (index) => `Xóa màu ${index}`,
    colorInputAria: (index) => `Màu ${index}`,
    colorHexAria: (index) => `HEX của màu ${index}`,
    outputTitle: 'Xuất',
    backgroundColorLabel: 'Màu nền',
    transparentLabel: 'Trong suốt',
    backgroundHexAria: 'HEX màu nền',
    exportFormatLabel: 'Định dạng lưu',
    nonPngBackgroundNote: 'Vùng trong suốt sẽ được xuất thành màu trắng.',
    previewTitle: 'Xem trước',
    saveLabel: 'Lưu',
    previewEmptyLabel: 'Thêm ảnh để hiển thị bản xem trước tại đây',
    colorCountLabel: (count) => `${count} màu`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    customPaletteName: (index) => `Tùy chỉnh ${index}`,
    customPaletteFallback: 'Tùy chỉnh',
  },
  id: {
    pageTitle: 'Palette Pixelizer',
    languageLabel: 'Bahasa',
    topPageAria: 'Buka halaman utama ZOOCHI',
    headerSummary: 'Ubah gambar menjadi pixel art lalu simpan',
    settingsHeading: 'Pengaturan',
    imageSectionTitle: 'Gambar',
    dropzoneTitle: 'Seret & lepas',
    dropzoneSubtitle: 'atau pilih satu gambar',
    chooseImageLabel: 'Pilih gambar',
    originalImageLabel: (width, height) => `Gambar asli ${width}×${height}`,
    removeImageAria: 'Lepas gambar',
    adjustmentsTitle: 'Penyesuaian',
    resetLabel: 'Atur ulang',
    hueLabel: 'Hue',
    saturationLabel: 'Saturasi',
    brightnessLabel: 'Kecerahan',
    adjustmentPreviewTitle: 'Pratinjau penyesuaian',
    beforePaletteLabel: 'Sebelum konversi palet',
    adjustmentPreviewEmpty: 'Akan tampil setelah gambar ditambahkan',
    sizeTitle: 'Ukuran',
    presetLabel: 'Preset',
    customSizeLabel: 'Kustom',
    widthLabel: 'Lebar',
    heightLabel: 'Tinggi',
    resizeLabel: 'Ubah ukuran',
    paletteTitle: 'Palet',
    selectionLabel: 'Pilihan',
    presetGroupLabel: 'Preset',
    customGroupLabel: 'Kustom',
    newPaletteLabel: 'Baru',
    selectedColorsAria: 'Warna yang dipilih',
    paletteNameLabel: 'Nama',
    addColorLabel: 'Tambah warna',
    deletePaletteLabel: 'Hapus palet',
    deleteColorAria: (index) => `Hapus warna ${index}`,
    colorInputAria: (index) => `Warna ${index}`,
    colorHexAria: (index) => `HEX warna ${index}`,
    outputTitle: 'Output',
    backgroundColorLabel: 'Warna latar',
    transparentLabel: 'Transparan',
    backgroundHexAria: 'HEX latar',
    exportFormatLabel: 'Format simpan',
    nonPngBackgroundNote: 'Area transparan akan diekspor sebagai putih.',
    previewTitle: 'Pratinjau',
    saveLabel: 'Simpan',
    previewEmptyLabel: 'Tambahkan gambar agar pratinjau tampil di sini',
    colorCountLabel: (count) => `${count} warna`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    customPaletteName: (index) => `Kustom ${index}`,
    customPaletteFallback: 'Kustom',
  },
}

export function getTopPageHref(locale: Locale, isMobilePreview: boolean) {
  const url = new URL(TOP_PAGE_PATH_BY_LOCALE[locale], APP_ORIGIN)

  if (isMobilePreview) {
    url.searchParams.set('view', 'mobile')
  } else {
    url.searchParams.delete('view')
  }

  return url.toString()
}

export function resolveInitialLocale() {
  return (
    readLocaleFromLocation() ??
    readStoredLocale() ??
    readBrowserLocale() ??
    'ja'
  )
}

export function readLocaleFromLocation() {
  return normalizeLocale(new URLSearchParams(window.location.search).get('lang'))
}

export function syncLocaleState(locale: Locale, isMobilePreview: boolean, pageTitle: string) {
  document.documentElement.lang = locale
  document.title = pageTitle
  window.localStorage.setItem(STORAGE_KEY, locale)

  const url = new URL(window.location.href)

  url.searchParams.set('lang', locale)

  if (isMobilePreview) {
    url.searchParams.set('view', 'mobile')
  } else {
    url.searchParams.delete('view')
  }

  window.history.replaceState(null, '', url)
}

export function getResizeModeLabels(locale: Locale) {
  return RESIZE_MODE_LABELS[locale]
}

export function getPaletteName(locale: Locale, paletteId: string, fallback: string, isCustom: boolean) {
  if (isCustom) {
    return fallback
  }

  return BUILTIN_PALETTE_NAMES[paletteId]?.[locale] ?? fallback
}

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null
  }

  const normalized = value.trim()

  if (normalized === 'en' || normalized === 'ja' || normalized === 'ko' || normalized === 'vi' || normalized === 'id') {
    return normalized
  }

  if (normalized === 'zh-Hans' || normalized.toLowerCase() === 'zh' || normalized.toLowerCase() === 'zh-cn') {
    return 'zh-Hans'
  }

  return null
}

function readStoredLocale() {
  return normalizeLocale(window.localStorage.getItem(STORAGE_KEY))
}

function readBrowserLocale() {
  const candidates = [...(window.navigator.languages ?? []), window.navigator.language]

  for (const candidate of candidates) {
    const lowered = candidate.toLowerCase()

    if (lowered.startsWith('ja')) {
      return 'ja'
    }

    if (lowered.startsWith('ko')) {
      return 'ko'
    }

    if (lowered.startsWith('zh')) {
      return 'zh-Hans'
    }

    if (lowered.startsWith('vi')) {
      return 'vi'
    }

    if (lowered === 'id' || lowered.startsWith('id-')) {
      return 'id'
    }

    if (lowered.startsWith('en')) {
      return 'en'
    }
  }

  return null
}

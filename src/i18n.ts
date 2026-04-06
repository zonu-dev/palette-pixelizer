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
  unsupportedFileTitle: string
  unsupportedFileMessage: string
  unreadableImageTitle: string
  unreadableImageMessage: string
  uploadNoticeCloseLabel: string
  chooseImageLabel: string
  removeLabel: string
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
  editPaletteLabel: string
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
  compareHoldLabel: string
  expandPreviewLabel: string
  closePreviewLabel: string
  colorCountLabel: (count: number) => string
  previewMobileLabel: string
  previewDesktopLabel: string
  versionLabel: string
  contactButtonLabel: string
  contactDialogTitle: string
  contactDialogDescription: string
  contactEmailTitle: string
  contactMarshmallowTitle: string
  contactMarshmallowText: string
  contactDialogCloseLabel: string
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
    dropzoneTitle: 'Click to add an image',
    dropzoneSubtitle: '',
    unsupportedFileTitle: 'Unsupported file',
    unsupportedFileMessage: 'Only PNG, JPG, JPEG, GIF, WebP, BMP, SVG, and AVIF images are supported.',
    unreadableImageTitle: 'Could not load image',
    unreadableImageMessage: 'This file could not be opened as an image.',
    uploadNoticeCloseLabel: 'Close upload message',
    chooseImageLabel: 'Choose image',
    removeLabel: 'Remove',
    originalImageLabel: (width, height) => `Original ${width}×${height}`,
    removeImageAria: 'Remove image',
    adjustmentsTitle: 'Adjust original image',
    resetLabel: 'Reset',
    hueLabel: 'Hue',
    saturationLabel: 'Saturation',
    brightnessLabel: 'Brightness',
    adjustmentPreviewTitle: 'Adjustment preview',
    beforePaletteLabel: 'Before palette conversion',
    adjustmentPreviewEmpty: 'Shown after adding an image',
    sizeTitle: 'Size & output',
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
    editPaletteLabel: 'Edit',
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
    exportFormatLabel: 'Format',
    nonPngBackgroundNote: 'Transparent areas will be exported as white.',
    previewTitle: 'Preview',
    saveLabel: 'Save',
    previewEmptyLabel: 'Add an image to preview it here',
    compareHoldLabel: 'Hold to view the original',
    expandPreviewLabel: 'Expand preview',
    closePreviewLabel: 'Close preview',
    colorCountLabel: (count) => `${count} colors`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    versionLabel: 'Version',
    contactButtonLabel: 'Contact',
    contactDialogTitle: 'Contact',
    contactDialogDescription: 'Bug reports, feature requests — feel free to reach out',
    contactEmailTitle: 'Contact by Email',
    contactMarshmallowTitle: 'Ask on Marshmallow',
    contactMarshmallowText: 'Anonymous questions welcome',
    contactDialogCloseLabel: 'Close contact dialog',
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
    dropzoneTitle: 'クリックして画像を追加',
    dropzoneSubtitle: '',
    unsupportedFileTitle: '非対応のファイルです',
    unsupportedFileMessage: 'PNG、JPG、JPEG、GIF、WebP、BMP、SVG、AVIF の画像のみ対応しています。',
    unreadableImageTitle: '画像を読み込めませんでした',
    unreadableImageMessage: 'このファイルは画像として開けませんでした。',
    uploadNoticeCloseLabel: 'アップロードメッセージを閉じる',
    chooseImageLabel: '画像を選択',
    removeLabel: '削除',
    originalImageLabel: (width, height) => `元画像 ${width}×${height}`,
    removeImageAria: '画像を外す',
    adjustmentsTitle: '元画像の色調補正',
    resetLabel: 'リセット',
    hueLabel: '色相',
    saturationLabel: '彩度',
    brightnessLabel: '明度',
    adjustmentPreviewTitle: '補正プレビュー',
    beforePaletteLabel: 'パレット変換前',
    adjustmentPreviewEmpty: '画像追加後に表示',
    sizeTitle: 'サイズと出力',
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
    editPaletteLabel: '編集',
    selectedColorsAria: '選択中の色',
    paletteNameLabel: '名前',
    addColorLabel: '色を追加',
    deletePaletteLabel: 'パレットを削除',
    deleteColorAria: (index) => `色${index}を削除`,
    colorInputAria: (index) => `色${index}`,
    colorHexAria: (index) => `色${index}のHEX`,
    outputTitle: '出力',
    backgroundColorLabel: '背景',
    transparentLabel: '透過',
    backgroundHexAria: '背景色のHEX',
    exportFormatLabel: '形式',
    nonPngBackgroundNote: '透過部分は白で出力されます',
    previewTitle: 'プレビュー',
    saveLabel: '保存',
    previewEmptyLabel: '画像を追加するとプレビューされます',
    compareHoldLabel: '長押しで変換前を見る',
    expandPreviewLabel: 'プレビューを拡大',
    closePreviewLabel: 'プレビューを閉じる',
    colorCountLabel: (count) => `${count}色`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    versionLabel: 'バージョン',
    contactButtonLabel: 'お問い合わせ',
    contactDialogTitle: 'お問い合わせ',
    contactDialogDescription: '不具合の報告やご要望など、お気軽にお問い合わせください',
    contactEmailTitle: 'メールで問い合わせ',
    contactMarshmallowTitle: 'マシュマロで質問する',
    contactMarshmallowText: '匿名で質問できます',
    contactDialogCloseLabel: 'お問い合わせモーダルを閉じる',
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
    dropzoneTitle: '클릭해서 이미지 추가',
    dropzoneSubtitle: '',
    unsupportedFileTitle: '지원되지 않는 파일입니다',
    unsupportedFileMessage: 'PNG, JPG, JPEG, GIF, WebP, BMP, SVG, AVIF 이미지만 지원합니다.',
    unreadableImageTitle: '이미지를 불러올 수 없습니다',
    unreadableImageMessage: '이 파일은 이미지로 열 수 없습니다.',
    uploadNoticeCloseLabel: '업로드 메시지 닫기',
    chooseImageLabel: '이미지 선택',
    removeLabel: '삭제',
    originalImageLabel: (width, height) => `원본 이미지 ${width}×${height}`,
    removeImageAria: '이미지 제거',
    adjustmentsTitle: '원본 이미지 색 보정',
    resetLabel: '초기화',
    hueLabel: '색조',
    saturationLabel: '채도',
    brightnessLabel: '밝기',
    adjustmentPreviewTitle: '보정 미리보기',
    beforePaletteLabel: '팔레트 변환 전',
    adjustmentPreviewEmpty: '이미지를 추가하면 표시됩니다',
    sizeTitle: '크기와 출력',
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
    editPaletteLabel: '편집',
    selectedColorsAria: '선택된 색상',
    paletteNameLabel: '이름',
    addColorLabel: '색상 추가',
    deletePaletteLabel: '팔레트 삭제',
    deleteColorAria: (index) => `색상 ${index} 삭제`,
    colorInputAria: (index) => `색상 ${index}`,
    colorHexAria: (index) => `색상 ${index} HEX`,
    outputTitle: '출력',
    backgroundColorLabel: '배경',
    transparentLabel: '투명',
    backgroundHexAria: '배경 HEX',
    exportFormatLabel: '형식',
    nonPngBackgroundNote: '투명 영역은 흰색으로 저장됩니다.',
    previewTitle: '미리보기',
    saveLabel: '저장',
    previewEmptyLabel: '이미지를 추가하면 미리보기됩니다',
    compareHoldLabel: '길게 눌러 원본 보기',
    expandPreviewLabel: '미리보기 확대',
    closePreviewLabel: '미리보기 닫기',
    colorCountLabel: (count) => `${count}색`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    versionLabel: '버전',
    contactButtonLabel: '문의',
    contactDialogTitle: '문의',
    contactDialogDescription: '버그 제보나 요청 사항 등, 편하게 연락해 주세요',
    contactEmailTitle: '이메일로 문의하기',
    contactMarshmallowTitle: 'Marshmallow로 질문하기',
    contactMarshmallowText: '익명으로 질문할 수 있습니다',
    contactDialogCloseLabel: '문의 모달 닫기',
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
    dropzoneTitle: '点击添加图片',
    dropzoneSubtitle: '',
    unsupportedFileTitle: '不支持的文件',
    unsupportedFileMessage: '仅支持 PNG、JPG、JPEG、GIF、WebP、BMP、SVG、AVIF 图片。',
    unreadableImageTitle: '无法加载图片',
    unreadableImageMessage: '此文件无法作为图片打开。',
    uploadNoticeCloseLabel: '关闭上传消息',
    chooseImageLabel: '选择图片',
    removeLabel: '删除',
    originalImageLabel: (width, height) => `原图 ${width}×${height}`,
    removeImageAria: '移除图片',
    adjustmentsTitle: '原图色彩调整',
    resetLabel: '重置',
    hueLabel: '色相',
    saturationLabel: '饱和度',
    brightnessLabel: '亮度',
    adjustmentPreviewTitle: '调整预览',
    beforePaletteLabel: '调色板转换前',
    adjustmentPreviewEmpty: '添加图片后显示',
    sizeTitle: '尺寸与输出',
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
    editPaletteLabel: '编辑',
    selectedColorsAria: '当前颜色',
    paletteNameLabel: '名称',
    addColorLabel: '添加颜色',
    deletePaletteLabel: '删除调色板',
    deleteColorAria: (index) => `删除颜色 ${index}`,
    colorInputAria: (index) => `颜色 ${index}`,
    colorHexAria: (index) => `颜色 ${index} 的 HEX`,
    outputTitle: '输出',
    backgroundColorLabel: '背景',
    transparentLabel: '透明',
    backgroundHexAria: '背景色 HEX',
    exportFormatLabel: '格式',
    nonPngBackgroundNote: '透明区域会以白色导出。',
    previewTitle: '预览',
    saveLabel: '保存',
    previewEmptyLabel: '添加图片后会显示预览',
    compareHoldLabel: '长按查看转换前',
    expandPreviewLabel: '放大预览',
    closePreviewLabel: '关闭预览',
    colorCountLabel: (count) => `${count} 色`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    versionLabel: '版本',
    contactButtonLabel: '联系我们',
    contactDialogTitle: '联系我们',
    contactDialogDescription: 'Bug反馈、功能建议，欢迎随时联系',
    contactEmailTitle: '发送邮件咨询',
    contactMarshmallowTitle: '在 Marshmallow 提问',
    contactMarshmallowText: '可匿名提问',
    contactDialogCloseLabel: '关闭联系弹窗',
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
    dropzoneTitle: 'Nhấp để thêm ảnh',
    dropzoneSubtitle: '',
    unsupportedFileTitle: 'Tệp không được hỗ trợ',
    unsupportedFileMessage: 'Chỉ hỗ trợ ảnh PNG, JPG, JPEG, GIF, WebP, BMP, SVG và AVIF.',
    unreadableImageTitle: 'Không thể tải ảnh',
    unreadableImageMessage: 'Không thể mở tệp này dưới dạng ảnh.',
    uploadNoticeCloseLabel: 'Đóng thông báo tải lên',
    chooseImageLabel: 'Chọn ảnh',
    removeLabel: 'Xóa',
    originalImageLabel: (width, height) => `Ảnh gốc ${width}×${height}`,
    removeImageAria: 'Gỡ ảnh',
    adjustmentsTitle: 'Chỉnh màu ảnh gốc',
    resetLabel: 'Đặt lại',
    hueLabel: 'Hue',
    saturationLabel: 'Độ bão hòa',
    brightnessLabel: 'Độ sáng',
    adjustmentPreviewTitle: 'Xem trước điều chỉnh',
    beforePaletteLabel: 'Trước khi đổi bảng màu',
    adjustmentPreviewEmpty: 'Hiển thị sau khi thêm ảnh',
    sizeTitle: 'Kích thước và xuất',
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
    editPaletteLabel: 'Sửa',
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
    exportFormatLabel: 'Định dạng',
    nonPngBackgroundNote: 'Vùng trong suốt sẽ được xuất thành màu trắng.',
    previewTitle: 'Xem trước',
    saveLabel: 'Lưu',
    previewEmptyLabel: 'Thêm ảnh để xem bản xem trước',
    compareHoldLabel: 'Nhấn giữ để xem ảnh gốc',
    expandPreviewLabel: 'Mở rộng xem trước',
    closePreviewLabel: 'Đóng xem trước',
    colorCountLabel: (count) => `${count} màu`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    versionLabel: 'Phiên bản',
    contactButtonLabel: 'Liên hệ',
    contactDialogTitle: 'Liên hệ',
    contactDialogDescription: 'Báo lỗi, góp ý — đừng ngại liên hệ nhé',
    contactEmailTitle: 'Liên hệ qua email',
    contactMarshmallowTitle: 'Hỏi trên Marshmallow',
    contactMarshmallowText: 'Có thể hỏi ẩn danh',
    contactDialogCloseLabel: 'Đóng hộp thoại liên hệ',
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
    dropzoneTitle: 'Klik untuk menambah gambar',
    dropzoneSubtitle: '',
    unsupportedFileTitle: 'File tidak didukung',
    unsupportedFileMessage: 'Hanya gambar PNG, JPG, JPEG, GIF, WebP, BMP, SVG, dan AVIF yang didukung.',
    unreadableImageTitle: 'Gambar tidak dapat dimuat',
    unreadableImageMessage: 'File ini tidak dapat dibuka sebagai gambar.',
    uploadNoticeCloseLabel: 'Tutup pesan unggahan',
    chooseImageLabel: 'Pilih gambar',
    removeLabel: 'Hapus',
    originalImageLabel: (width, height) => `Gambar asli ${width}×${height}`,
    removeImageAria: 'Lepas gambar',
    adjustmentsTitle: 'Penyesuaian warna gambar',
    resetLabel: 'Atur ulang',
    hueLabel: 'Hue',
    saturationLabel: 'Saturasi',
    brightnessLabel: 'Kecerahan',
    adjustmentPreviewTitle: 'Pratinjau penyesuaian',
    beforePaletteLabel: 'Sebelum konversi palet',
    adjustmentPreviewEmpty: 'Akan tampil setelah gambar ditambahkan',
    sizeTitle: 'Ukuran & output',
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
    editPaletteLabel: 'Edit',
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
    exportFormatLabel: 'Format',
    nonPngBackgroundNote: 'Area transparan akan diekspor sebagai putih.',
    previewTitle: 'Pratinjau',
    saveLabel: 'Simpan',
    previewEmptyLabel: 'Tambahkan gambar untuk melihat pratinjau',
    compareHoldLabel: 'Tahan untuk melihat sebelum konversi',
    expandPreviewLabel: 'Perbesar pratinjau',
    closePreviewLabel: 'Tutup pratinjau',
    colorCountLabel: (count) => `${count} warna`,
    previewMobileLabel: 'Mobile',
    previewDesktopLabel: 'PC',
    versionLabel: 'Versi',
    contactButtonLabel: 'Kontak',
    contactDialogTitle: 'Kontak',
    contactDialogDescription: 'Laporan bug, saran fitur — jangan ragu hubungi kami',
    contactEmailTitle: 'Hubungi lewat email',
    contactMarshmallowTitle: 'Tanya di Marshmallow',
    contactMarshmallowText: 'Bisa bertanya secara anonim',
    contactDialogCloseLabel: 'Tutup dialog kontak',
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

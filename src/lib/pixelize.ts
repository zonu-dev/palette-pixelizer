type RgbColor = [number, number, number]

const FALLBACK_FILE_NAME = 'image'

export type AdjustmentSettings = {
  hue: number
  saturation: number
  brightness: number
}

export type ResizeMode = 'center-crop' | 'contain' | 'stretch'

export function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, '')

  if (/^[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const doubled = trimmed
      .split('')
      .map((char) => `${char}${char}`)
      .join('')

    return `#${doubled.toUpperCase()}`
  }

  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`
  }

  return null
}

export function renderPixelizedImage(options: {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  width: number
  height: number
  palette: string[]
  adjustments: AdjustmentSettings
  resizeMode: ResizeMode
  backgroundColor?: string
}): void {
  const { canvas, image, width, height, palette, adjustments, resizeMode, backgroundColor } = options
  const context = canvas.getContext('2d')

  if (!context || width < 1 || height < 1 || palette.length === 0) {
    return
  }

  const adjustedSource = createAdjustedSourceCanvas(image, adjustments)

  if (!adjustedSource) {
    return
  }

  canvas.width = width
  canvas.height = height

  drawSourceIntoCanvas({
    context,
    source: adjustedSource,
    width,
    height,
    resizeMode,
    backgroundColor,
  })

  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData
  const parsedPalette = palette.map((color) => parseHexColor(color))

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]

    if (alpha === 0) {
      continue
    }

    const closest = findClosestColor(
      [data[index], data[index + 1], data[index + 2]],
      parsedPalette,
    )

    data[index] = closest[0]
    data[index + 1] = closest[1]
    data[index + 2] = closest[2]
  }

  context.putImageData(imageData, 0, 0)
}

export function renderAdjustedImage(options: {
  canvas: HTMLCanvasElement
  image: HTMLImageElement
  width: number
  height: number
  adjustments: AdjustmentSettings
  resizeMode: ResizeMode
  backgroundColor?: string
}): void {
  const { canvas, image, width, height, adjustments, resizeMode, backgroundColor } = options
  const context = canvas.getContext('2d')

  if (!context || width < 1 || height < 1) {
    return
  }

  const adjustedSource = createAdjustedSourceCanvas(image, adjustments)

  if (!adjustedSource) {
    return
  }

  canvas.width = width
  canvas.height = height

  drawSourceIntoCanvas({
    context,
    source: adjustedSource,
    width,
    height,
    resizeMode,
    backgroundColor,
  })
}

export function createDownloadFileName(options: {
  originalName: string
  paletteSegment: string
  width: number
  height: number
  extension?: string
}): string {
  const ext = options.extension || 'png'
  const baseName = options.originalName.replace(/\.[^.]+$/, '').trim()
  const safeBase = sanitizeSegment(baseName || FALLBACK_FILE_NAME)
  const safePalette = sanitizeSegment(options.paletteSegment)

  return `${safeBase}-${options.width}x${options.height}-${safePalette}.${ext}`
}

function parseHexColor(color: string): RgbColor {
  const normalized = normalizeHexColor(color)

  if (!normalized) {
    return [0, 0, 0]
  }

  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ]
}

function findClosestColor(target: RgbColor, palette: RgbColor[]): RgbColor {
  let closest = palette[0]
  let minimumDistance = Number.POSITIVE_INFINITY

  for (const candidate of palette) {
    const distance = colorDistance(target, candidate)

    if (distance < minimumDistance) {
      minimumDistance = distance
      closest = candidate
    }
  }

  return closest
}

function colorDistance(a: RgbColor, b: RgbColor): number {
  const redMean = (a[0] + b[0]) / 2
  const red = a[0] - b[0]
  const green = a[1] - b[1]
  const blue = a[2] - b[2]

  return (
    ((512 + redMean) * red * red) / 256 +
    4 * green * green +
    ((767 - redMean) * blue * blue) / 256
  )
}

function createAdjustedSourceCanvas(
  image: HTMLImageElement,
  adjustments: AdjustmentSettings,
): HTMLCanvasElement | null {
  const width = Math.max(1, image.naturalWidth)
  const height = Math.max(1, image.naturalHeight)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  canvas.width = width
  canvas.height = height

  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  if (hasAdjustmentEffects(adjustments)) {
    const imageData = context.getImageData(0, 0, width, height)
    applyAdjustmentsToImageData(imageData.data, adjustments)
    context.putImageData(imageData, 0, 0)
  }

  return canvas
}

function drawSourceIntoCanvas(options: {
  context: CanvasRenderingContext2D
  source: HTMLCanvasElement
  width: number
  height: number
  resizeMode: ResizeMode
  backgroundColor?: string
}): void {
  const { context, source, width, height, resizeMode, backgroundColor } = options

  context.clearRect(0, 0, width, height)

  if (backgroundColor) {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  if (resizeMode === 'stretch') {
    context.drawImage(source, 0, 0, width, height)
    return
  }

  const sourceWidth = source.width
  const sourceHeight = source.height
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height

  if (resizeMode === 'center-crop') {
    let cropWidth = sourceWidth
    let cropHeight = sourceHeight
    let startX = 0
    let startY = 0

    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio
      startX = (sourceWidth - cropWidth) / 2
    } else {
      cropHeight = sourceWidth / targetRatio
      startY = (sourceHeight - cropHeight) / 2
    }

    context.drawImage(source, startX, startY, cropWidth, cropHeight, 0, 0, width, height)
    return
  }

  const scale = Math.min(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  context.drawImage(source, offsetX, offsetY, drawWidth, drawHeight)
}

function sanitizeSegment(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*]/g, '-')
  const withoutControls = Array.from(normalized, (character) =>
    character < ' ' ? '-' : character,
  ).join('')
  const compacted = withoutControls
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return compacted || FALLBACK_FILE_NAME
}

function clampPercentage(value: number): number {
  return Math.min(Math.max(value, 0), 200)
}

function hasAdjustmentEffects(adjustments: AdjustmentSettings): boolean {
  return adjustments.hue !== 0 || adjustments.saturation !== 0 || adjustments.brightness !== 0
}

function applyAdjustmentsToImageData(
  data: Uint8ClampedArray,
  adjustments: AdjustmentSettings,
): void {
  const hueOffset = adjustments.hue / 360
  const saturationFactor = clampPercentage(100 + adjustments.saturation) / 100
  const brightnessFactor = clampPercentage(100 + adjustments.brightness) / 100

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3]

    if (alpha === 0) {
      continue
    }

    const [h, s, l] = rgbToHsl(data[index], data[index + 1], data[index + 2])
    const nextHue = wrapUnit(h + hueOffset)
    const nextSaturation = clamp(s * saturationFactor, 0, 1)
    const [red, green, blue] = hslToRgb(nextHue, nextSaturation, l)

    data[index] = clampChannel(red * brightnessFactor)
    data[index + 1] = clampChannel(green * brightnessFactor)
    data[index + 2] = clampChannel(blue * brightnessFactor)
  }
}

function rgbToHsl(red: number, green: number, blue: number): [number, number, number] {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) {
    return [0, 0, lightness]
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

  let hue = 0

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0)
      break
    case g:
      hue = (b - r) / delta + 2
      break
    default:
      hue = (r - g) / delta + 4
      break
  }

  return [hue / 6, saturation, lightness]
}

function hslToRgb(hue: number, saturation: number, lightness: number): RgbColor {
  if (saturation === 0) {
    const channel = Math.round(lightness * 255)
    return [channel, channel, channel]
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q

  return [
    Math.round(hueToChannel(p, q, hue + 1 / 3) * 255),
    Math.round(hueToChannel(p, q, hue) * 255),
    Math.round(hueToChannel(p, q, hue - 1 / 3) * 255),
  ]
}

function hueToChannel(p: number, q: number, hue: number): number {
  let wrappedHue = hue

  if (wrappedHue < 0) {
    wrappedHue += 1
  }

  if (wrappedHue > 1) {
    wrappedHue -= 1
  }

  if (wrappedHue < 1 / 6) {
    return p + (q - p) * 6 * wrappedHue
  }

  if (wrappedHue < 1 / 2) {
    return q
  }

  if (wrappedHue < 2 / 3) {
    return p + (q - p) * (2 / 3 - wrappedHue) * 6
  }

  return p
}

function wrapUnit(value: number): number {
  const wrapped = value % 1
  return wrapped < 0 ? wrapped + 1 : wrapped
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function clampChannel(value: number): number {
  return Math.round(clamp(value, 0, 255))
}

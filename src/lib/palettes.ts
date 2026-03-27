export type SizePreset = {
  id: string
  label: string
  width: number
  height: number
}

export type PaletteDefinition = {
  id: string
  name: string
  colors: string[]
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: '16x16', label: '16×16', width: 16, height: 16 },
  { id: '32x32', label: '32×32', width: 32, height: 32 },
  { id: '48x48', label: '48×48', width: 48, height: 48 },
  { id: '64x64', label: '64×64', width: 64, height: 64 },
  { id: '96x96', label: '96×96', width: 96, height: 96 },
  { id: '128x128', label: '128×128', width: 128, height: 128 },
]

export const BUILTIN_PALETTES: PaletteDefinition[] = [
  {
    id: 'grayscale-2',
    name: 'グレースケール2色',
    colors: ['#111827', '#F9FAFB'],
  },
  {
    id: 'grayscale-4',
    name: 'グレースケール4色',
    colors: ['#171717', '#525252', '#A3A3A3', '#FAFAFA'],
  },
  {
    id: 'game-boy',
    name: 'Game Boy風',
    colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  },
  {
    id: 'pico-8',
    name: 'PICO-8風',
    colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#FFF1E8'],
  },
  {
    id: 'retro-8',
    name: '8色レトロ',
    colors: [
      '#1F2430',
      '#E06C75',
      '#98C379',
      '#E5C07B',
      '#61AFEF',
      '#C678DD',
      '#56B6C2',
      '#F3F4F6',
    ],
  },
  {
    id: 'retro-16',
    name: '16色レトロ',
    colors: [
      '#140C1C',
      '#442434',
      '#30346D',
      '#4E4A4E',
      '#854C30',
      '#346524',
      '#D04648',
      '#757161',
      '#597DCE',
      '#D27D2C',
      '#8595A1',
      '#6DAA2C',
      '#D2AA99',
      '#6DC2CA',
      '#DAD45E',
      '#DEEED6',
    ],
  },
]

export const DEFAULT_CUSTOM_COLORS = ['#0F172A', '#475569', '#CBD5E1', '#F8FAFC']

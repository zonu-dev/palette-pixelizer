import { describe, expect, it } from 'vitest'
import { createDownloadFileName, normalizeHexColor } from './pixelize'

describe('normalizeHexColor', () => {
  it('expands 3-digit hex to 6-digit uppercase', () => {
    expect(normalizeHexColor('#abc')).toBe('#AABBCC')
    expect(normalizeHexColor('f00')).toBe('#FF0000')
  })

  it('normalizes 6-digit hex to uppercase', () => {
    expect(normalizeHexColor('#1a2b3c')).toBe('#1A2B3C')
    expect(normalizeHexColor('ffffff')).toBe('#FFFFFF')
  })

  it('trims whitespace', () => {
    expect(normalizeHexColor('  #abc  ')).toBe('#AABBCC')
  })

  it('returns null for invalid input', () => {
    expect(normalizeHexColor('')).toBeNull()
    expect(normalizeHexColor('#gg0000')).toBeNull()
    expect(normalizeHexColor('#12345')).toBeNull()
  })
})

describe('createDownloadFileName', () => {
  it('builds a filename with size and palette segment', () => {
    const name = createDownloadFileName({
      originalName: 'photo.jpg',
      paletteSegment: 'Game Boy風',
      width: 32,
      height: 32,
    })

    expect(name).toBe('photo-32x32-Game-Boy風.png')
  })

  it('uses fallback when original name is empty', () => {
    const name = createDownloadFileName({
      originalName: '',
      paletteSegment: 'test',
      width: 16,
      height: 16,
    })

    expect(name).toBe('image-16x16-test.png')
  })

  it('sanitizes special characters in file name', () => {
    const name = createDownloadFileName({
      originalName: 'my<file>.png',
      paletteSegment: 'palette',
      width: 64,
      height: 64,
    })

    expect(name).toBe('my-file-64x64-palette.png')
  })

  it('uses custom extension when provided', () => {
    const name = createDownloadFileName({
      originalName: 'photo.jpg',
      paletteSegment: 'retro-16',
      width: 32,
      height: 32,
      extension: 'jpg',
    })

    expect(name).toBe('photo-32x32-retro-16.jpg')
  })

  it('uses webp extension', () => {
    const name = createDownloadFileName({
      originalName: 'photo.jpg',
      paletteSegment: 'retro-16',
      width: 64,
      height: 64,
      extension: 'webp',
    })

    expect(name).toBe('photo-64x64-retro-16.webp')
  })
})

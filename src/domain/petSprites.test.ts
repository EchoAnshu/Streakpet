import { describe, expect, it } from 'vitest'
import { PET_SPECIES } from './pet'
import {
  PET_SPRITES,
  SPRITE_CHARS,
  SPRITE_SIZE,
  SPECIES_PALETTES,
  spriteColorFor,
} from './petSprites'

describe('pet sprites', () => {
  it('defines a sprite for every species', () => {
    for (const species of PET_SPECIES) {
      expect(PET_SPRITES[species]).toBeDefined()
    }
  })

  it('keeps every sprite on a square grid of known characters', () => {
    for (const species of PET_SPECIES) {
      const rows = PET_SPRITES[species]
      expect(rows).toHaveLength(SPRITE_SIZE)
      for (const row of rows) {
        expect(row).toHaveLength(SPRITE_SIZE)
        for (const char of row) {
          expect(SPRITE_CHARS).toContain(char)
        }
      }
    }
  })

  it('gives every used character a color', () => {
    for (const species of PET_SPECIES) {
      for (const row of PET_SPRITES[species]) {
        for (const char of row) {
          const color = spriteColorFor(char, species)
          if (char === '.') {
            expect(color).toBeNull()
          } else {
            expect(color).toMatch(/^#[0-9a-f]{6}$/i)
          }
        }
      }
    }
  })

  it('includes an outline and eyes in every sprite', () => {
    for (const species of PET_SPECIES) {
      const joined = PET_SPRITES[species].join('')
      expect(joined).toContain('o')
      expect(joined).toContain('k')
    }
  })

  it('defines palettes for every species', () => {
    for (const species of PET_SPECIES) {
      const palette = SPECIES_PALETTES[species]
      expect(palette.body).toMatch(/^#[0-9a-f]{6}$/i)
      expect(palette.shade).toMatch(/^#[0-9a-f]{6}$/i)
      expect(palette.light).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('draws a distinct silhouette for every species', () => {
    const grids = PET_SPECIES.map((species) => PET_SPRITES[species].join('\n'))
    expect(new Set(grids).size).toBe(PET_SPECIES.length)
  })

  it('gives every species a defining feature', () => {
    expect(PET_SPRITES.bunny.slice(0, 4).join('')).toContain('p')
    expect(PET_SPRITES.fox.slice(0, 3).join('')).toContain('d')
    expect(PET_SPRITES.panda.slice(1, 3).join('')).toContain('k')
    expect(PET_SPRITES.dolphin.slice(0, 3).join('')).toContain('o')
    expect(PET_SPRITES.cat[8]).toContain('k')
    expect(PET_SPRITES.dog.join('')).toContain('h')
  })
})

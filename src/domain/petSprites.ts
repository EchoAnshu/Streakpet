import { type PetSpecies } from './pet'

export const SPRITE_SIZE = 16

export const SPRITE_CHARS = ['.', 'o', 'b', 'd', 'h', 'w', 'k', 'p'] as const
export type SpriteChar = (typeof SPRITE_CHARS)[number]

export const PET_SPRITES: Record<PetSpecies, string[]> = {
  cat: [
    '....oo....oo....',
    '...oppo..oppo...',
    '..opppo..opppo..',
    '.oooooooooooooo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    'kobpbbbkkbbbpbok',
    'kobpbbkbbkbbpbok',
    '.obbbbbkkbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '..obbbhhhhbbbo..',
    '..obbbhhhhbbbo..',
    '..oooooooooooo..',
  ],
  dog: [
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '.oddbbbbbbbbddo.',
    '.oddbbbbbbbbddo.',
    '.oddbwkbbwkbddo.',
    '.oddbkkbbkkbddo.',
    '.oddbbwwwwbbddo.',
    '.oddbbwkkwbbddo.',
    '.oddbbwppwbbddo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..',
    '..obbbhhhhbbbo..',
    '..obbbhhhhbbbo..',
    '..oooooooooooo..',
  ],
  bunny: [
    '....ooo..ooo....',
    '...oppo..oppo...',
    '...oppo..oppo...',
    '...oppo..oppo...',
    '...oppo..oppo...',
    '..oooooooooooo..',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obpbbbkkbbbpbo.',
    '.obbbbkbbkbbbbo.',
    '.obbbbbkkbbbbbo.',
    '..obbbbbbbbbbo..',
    '..obbbhhhhbbbo..',
    '..obbbhhhhbbbo..',
    '..oooooooooooo..',
  ],
  fox: [
    '....dd....dd....',
    '...oddo..oddo...',
    '..obbo....obbo..',
    '.oooooooooooooo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obbbwwkkwwbbbo.',
    '.obpbwwwwwwbpbo.',
    '.obbbwkwwkwbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '..obbbhhhhbbbo..',
    '..obbbhhhhbbbo..',
    '..oooooooooooo..',
  ],
  panda: [
    '................',
    '...kkk....kkk...',
    '..kkkkk..kkkkk..',
    '.oooooooooooooo.',
    '.owwwwwwwwwwwwo.',
    '.owkkkwwwwkkkwo.',
    '.owkwkwwwwkwkwo.',
    '.owkkkwwwwkkkwo.',
    '.owwwwwkkwwwwwo.',
    '.owwwwwwwwwwwwo.',
    '.owwwwwkkwwwwwo.',
    '.owwwwwwwwwwwwo.',
    '..owwwwwwwwwwo..',
    '..okkwwwwwwkko..',
    '..okkwwwwwwkko..',
    '..oooooooooooo..',
  ],
  dolphin: [
    '.......oo.......',
    '......obbo......',
    '.....obbbbo.....',
    '.oooooooooooooo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbwkbbbbwkbbo.',
    '.obbkkbbbbkkbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbwwwwwwbbbo.',
    '.obbbwwkkwwbbbo.',
    '.obbbbbbbbbbbbo.',
    '.dobbbwwwwbbbod.',
    '..obbbwwwwbbbo..',
    '..obbbwwwwbbbo..',
    '..oooooooooooo..',
  ],
}

export interface SpritePalette {
  body: string
  shade: string
  light: string
}

export const SPECIES_PALETTES: Record<PetSpecies, SpritePalette> = {
  cat: { body: '#f2a33c', shade: '#d9822b', light: '#ffe0ae' },
  dog: { body: '#c08a57', shade: '#9c6c3f', light: '#efd0a8' },
  bunny: { body: '#f6d3e0', shade: '#e3b3c6', light: '#ffffff' },
  fox: { body: '#e8743b', shade: '#c75d2b', light: '#fdf1e3' },
  panda: { body: '#f2f0ee', shade: '#d8d4d0', light: '#ffffff' },
  dolphin: { body: '#5aa9e6', shade: '#3f8ccc', light: '#dceefb' },
}

const OUTLINE = '#3a3028'
const WHITE = '#ffffff'
const DARK = '#2f2a26'
const BLUSH = '#f4a7b1'

export type StageAccessory = 'teen' | 'adult'

export const STAGE_ACCENT_COLORS: Record<StageAccessory, string> = {
  teen: '#2f9e63',
  adult: '#f5a524',
}

export const STAGE_OVERLAYS: Record<StageAccessory, string[]> = {
  teen: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...1111111111...',
    '...11......11...',
    '................',
    '................',
  ],
  adult: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....11..11.....',
    '.....111111.....',
    '......1111......',
    '................',
  ],
}

export function spriteColorFor(char: string, species: PetSpecies): string | null {
  const palette = SPECIES_PALETTES[species]
  switch (char) {
    case 'o':
      return OUTLINE
    case 'b':
      return palette.body
    case 'd':
      return palette.shade
    case 'h':
      return palette.light
    case 'w':
      return WHITE
    case 'k':
      return DARK
    case 'p':
      return BLUSH
    default:
      return null
  }
}

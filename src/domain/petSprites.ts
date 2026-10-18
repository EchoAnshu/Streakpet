import { type PetSpecies } from './pet'

export const SPRITE_SIZE = 12

export const SPRITE_CHARS = ['.', 'o', 'b', 'd', 'w', 'k', 'p'] as const
export type SpriteChar = (typeof SPRITE_CHARS)[number]

export const PET_SPRITES: Record<PetSpecies, string[]> = {
  cat: [
    '............',
    '.o......o...',
    '.obo...obo..',
    '.obbo.obbo..',
    '..obbobbo...',
    '.obbbbbbbbo.',
    '.obkbbbkbbo.',
    '.obbbbbbbbo.',
    '.obpbbbpbbo.',
    '.obbbbbbbbo.',
    '..obbbbbbo..',
    '...oooooo...',
  ],
  dog: [
    '............',
    '.oo......oo.',
    '.obo....obo.',
    '.obbo..obbo.',
    '.obbboobbbo.',
    '.obbbbbbbbo.',
    '.obkbbbkbbo.',
    '.obbbbbbbbo.',
    '.obpbbbpbbo.',
    '.obbbbbbbbo.',
    '..obbbbbbo..',
    '...oooooo...',
  ],
  bunny: [
    '............',
    '.o......o...',
    '.obo...obo..',
    '.obo...obo..',
    '..obbobbo...',
    '.obbbbbbbbo.',
    '.obkbbbkbbo.',
    '.obbbbbbbbo.',
    '.obpbbbpbbo.',
    '.obbbbbbbbo.',
    '..obbbbbbo..',
    '...oooooo...',
  ],
  fox: [
    '............',
    '.o......o...',
    '.obo...obo..',
    '.obbo.obbo..',
    '..obbobbo...',
    '.obbbbbbbbo.',
    '.obkbbbkbbo.',
    '.obbbbbbbbo.',
    '.obwbbbwbbo.',
    '.obbbbbbbbo.',
    '..obbbbbbo..',
    '...oooooo...',
  ],
  panda: [
    '............',
    '.kk......kk.',
    '.kkk....kkk.',
    '..kk....kk..',
    '..obbbbbbo..',
    '.obbbbbbbbo.',
    '.obkbbbkbbo.',
    '.obbbbbbbbo.',
    '.obpbbbpbbo.',
    '.obbbbbbbbo.',
    '..obbbbbbo..',
    '...oooooo...',
  ],
  dolphin: [
    '.....ooo....',
    '....oobbo...',
    '..oobbobbo..',
    '.obbbbbbbbo.',
    '.obbbbbbbbo.',
    '.obkbbbkbbo.',
    '.obbbbbbbbo.',
    '.owbbbbbwo..',
    '.owbbbbbwo..',
    '.owbbbbbwo..',
    '..obbbbbbo..',
    '...oooooo...',
  ],
}

export interface SpritePalette {
  body: string
  shade: string
}

export const SPECIES_PALETTES: Record<PetSpecies, SpritePalette> = {
  cat: { body: '#f2a33c', shade: '#d9822b' },
  dog: { body: '#c08a57', shade: '#9c6c3f' },
  bunny: { body: '#f6d3e0', shade: '#e3b3c6' },
  fox: { body: '#e8743b', shade: '#c75d2b' },
  panda: { body: '#f2f0ee', shade: '#d8d4d0' },
  dolphin: { body: '#5aa9e6', shade: '#3f8ccc' },
}

const OUTLINE = '#3a3028'
const WHITE = '#ffffff'
const DARK = '#2f2a26'
const BLUSH = '#f4a7b1'

export function spriteColorFor(char: string, species: PetSpecies): string | null {
  const palette = SPECIES_PALETTES[species]
  switch (char) {
    case 'o':
      return OUTLINE
    case 'b':
      return palette.body
    case 'd':
      return palette.shade
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

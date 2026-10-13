/**
 * Well-known barcodes that exist in the Open Food Facts database.
 * Used by the scanner page as one-tap demos, and as a fallback for testing
 * when no physical product is at hand.
 *
 * Keep these to real EAN-13 codes with solid OFF coverage.
 */
export const SAMPLE_BARCODES = [
  {
    code: '3017620422003',
    label: 'Nutella',
    hint: 'Chocolate hazelnut spread',
    emoji: '🍫',
  },
  {
    code: '5449000000996',
    label: 'Coca-Cola',
    hint: 'Soft drink, 330ml can',
    emoji: '🥤',
  },
  {
    code: '7622210449283',
    label: 'Milka',
    hint: 'Alpine milk chocolate',
    emoji: '🍫',
  },
  {
    code: '737628064502',
    label: 'Thai Noodles',
    hint: 'Rice noodles, instant',
    emoji: '🍜',
  },
  {
    code: '0016000275270',
    label: 'Cheerios',
    hint: 'Honey Nut Cheerios, breakfast cereal',
    emoji: '🥣',
  },
]

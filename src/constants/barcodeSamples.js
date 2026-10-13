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
  // Non-food entries come from the sibling databases — great for showing the
  // automatic multi-source lookup in action.
  {
    code: '4005900259615',
    label: 'Nivea Sun',
    hint: 'Sunscreen SPF 50, 200 ml (Open Beauty Facts)',
    emoji: '🧴',
  },
  {
    code: '7613034464927',
    label: 'Purina ONE',
    hint: 'Dry dog food, 340 g (Open Pet Food Facts)',
    emoji: '🐾',
  },
  {
    code: '8996001601242',
    label: 'Pucuk Harum',
    hint: 'Bottled tea, 300 ml (Open Products Facts)',
    emoji: '📦',
  },
]

/**
 * Typical shelf-life heuristic — "how long can I keep this after opening?"
 *
 * The public databases know *what* a product is, but never its best-before
 * date (that lives on the package label, not on the barcode). So when the user
 * scans a product we give them a *typical estimate* per product family —
 * enough to prefill a sensible expiry date in the add form.
 *
 * This is deliberately conservative and explicitly labelled as an estimate in
 * the UI: the official expiry on the packaging always wins.
 *
 * Rules are keyword-based (English / Uzbek / Russian) and are checked in
 * priority order — the most perishable families first, canned/condiment
 * families *before* the raw-meat rule so "fish sauce" never reads as "fish".
 */

/** Word-boundary regex that also understands Cyrillic and apostrophes. */
const re = (words) =>
  new RegExp(`(?:^|[^a-zа-яё0-9])(${words.join('|')})(?:[^a-zа-яё0-9]|$)`, 'i')

const RULES = [
  // Baby food spoils fastest after opening.
  { pattern: re(['baby', 'infant', 'chaqaloq', 'детск']), days: 2, modeKey: 'shelf.modeOpened' },
  // Honey keeps almost indefinitely — never let it fall into the canned rule.
  {
    pattern: re(['honey', 'asal', 'bol', 'мёд', 'мед']),
    days: 730,
    modeKey: 'shelf.modeDry',
  },
  // Canned, jars, preserves and condiments — open, then refrigerate.
  // Listed *before* the raw-meat rule so "fish sauce" doesn't read as "fish".
  {
    pattern: re([
      'sauce', 'ketchup', 'mayonnaise', 'mustard', 'jam', 'marmalade', 'pickle', 'preserve',
      'canned', 'sardine', 'konserva', 'murabbo', 'mayonez', 'sous', 'консерв', 'варенье', 'майонез',
      'кетчуп', 'соус', 'банк',
    ]),
    days: 30,
    modeKey: 'shelf.modeOpened',
  },
  // Nut butters (and similar spreads) keep much longer than diary butter.
  {
    pattern: re(['peanut butter', 'hazelnut spread', 'yeryong‘oq', 'арахисов', 'shokoladli pasta']),
    days: 120,
    modeKey: 'shelf.modeDry',
  },
  // Fresh meat, poultry, fish, seafood.
  {
    pattern: re([
      'meat', 'chicken', 'turkey', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'mackerel',
      'seafood', 'shrimp', 'go‘sht', 'gosht', 'tovuq', 'baliq', 'cho‘chqa', 'мясо', 'куриц', 'рыб',
      'свинин', 'говядин', 'баранин',
    ]),
    days: 2,
    modeKey: 'shelf.modeOpened',
  },
  // Cooked meals / ready-made food.
  {
    pattern: re(['ready meal', 'meal', 'broth', 'stew', 'tayyor taom', 'суп', 'готов', 'блюд', 'рагу']),
    days: 2,
    modeKey: 'shelf.modeOpened',
  },
  // Fresh dairy.
  {
    pattern: re([
      'milk', 'yogurt', 'yoghurt', 'kefir', 'cream', 'butter', 'curd', 'sour cream', 'sut', 'qatiq',
      'qaymoq', 'молоко', 'сливк', 'сметан', 'кефир', 'творог', 'йогурт', 'масло',
    ]),
    days: 5,
    modeKey: 'shelf.modeOpened',
  },
  // Cheese.
  {
    pattern: re(['cheese', 'mozzarella', 'cheddar', 'brie', 'camembert', 'parmesan', 'pishloq', 'сыр', 'брынз']),
    days: 14,
    modeKey: 'shelf.modeOpened',
  },
  // Eggs.
  { pattern: re(['egg', 'eggs', 'tuxum', 'яйц']), days: 30, modeKey: 'shelf.modeOpened' },
  // Fresh produce.
  {
    pattern: re([
      'vegetable', 'fruit', 'salad', 'lettuce', 'tomato', 'cucumber', 'banana', 'apple', 'potato',
      'carrot', 'berry', 'sabzavot', 'meva', 'salat', 'pomidor', 'bodring', 'olma', 'banan',
      'kartoshka', 'овощ', 'фрукт', 'салат', 'помидор', 'огурец', 'яблоко', 'банан', 'картофел', 'ягод',
    ]),
    days: 5,
    modeKey: 'shelf.modeOpened',
  },
  // Bread & bakery.
  {
    pattern: re(['bread', 'bun', 'baguette', 'tortilla', 'pita', 'croissant', 'bagel', 'non', 'хлеб', 'булк', 'багет', 'лепёшк']),
    days: 3,
    modeKey: 'shelf.modeOpened',
  },
  // Deli / cured meats.
  {
    pattern: re(['ham', 'sausage', 'salami', 'bacon', 'hot dog', 'kolbasa', 'sosiska', 'колбас', 'сосис']),
    days: 7,
    modeKey: 'shelf.modeOpened',
  },
  // Frozen goods.
  {
    pattern: re(['frozen', 'ice cream', 'pizza', 'pelmeni', 'dumpling', 'muzlatilgan', 'muzqaymoq', 'морожен', 'заморож', 'пельмен']),
    days: 90,
    modeKey: 'shelf.modeFrozen',
  },
  // Chocolate, sweets, snacks.
  {
    pattern: re([
      'chocolate', 'candy', 'cookies', 'biscuit', 'crackers', 'chips', 'nougat', 'wafer', 'spread',
      'spreads', 'shokolad', 'konfet', 'шоколад', 'конфет', 'печенье', 'чипсы', 'вафл', 'пряник',
    ]),
    days: 90,
    modeKey: 'shelf.modeDry',
  },
  // Beverages — once opened, keep in the fridge and drink within a few days.
  {
    pattern: re([
      'cola', 'soda', 'soft drink', 'carbonated', 'lemonade', 'fanta', 'sprite', 'juice',
      'limonad', 'gazlangan', 'ichimlik', 'вода', 'сок', 'газиров', 'лимонад', 'напиток',
    ]),
    days: 3,
    modeKey: 'shelf.modeOpened',
  },
  // Pet food — prepacked, keeps for months.
  {
    pattern: re(['pet food', 'dog food', 'cat food', 'hayvon ozuqasi', 'корм']),
    days: 365,
    modeKey: 'shelf.modeDry',
  },
  // Dry staples.
  {
    pattern: re([
      'rice', 'pasta', 'spaghetti', 'flour', 'sugar', 'coffee', 'tea', 'cereal', 'oat', 'lentil',
      'bean', 'noodle', 'noodles', 'guruch', 'makaron', 'shakar', 'kofe', 'choy', 'loviya', 'рис', 'макарон',
      'мука', 'сахар', 'кофе', 'чай', 'крупа', 'хлопь',
    ]),
    days: 365,
    modeKey: 'shelf.modeDry',
  },
]

/**
 * Estimate a typical shelf life for a product.
 *
 * @param {import('./productLookup.js').NormalizedProduct} product
 * @returns {{ days: number, modeKey: string, beauty?: boolean } | null}
 *   `null` when the product type has no meaningful estimate (medicine, books,
 *   media…).
 */
export function suggestShelfLife(product) {
  if (!product) return null
  if (product.productKind && product.productKind !== 'product') return null

  // Cosmetics follow the "period-after-opening" symbol, ~12 months on average.
  if ((product.sources ?? []).some((id) => String(id).includes('beauty'))) {
    return { days: 365, modeKey: 'shelf.modeDry', beauty: true }
  }

  const haystack = [...(product.categories ?? []), product.name ?? ''].join(' ').toLowerCase()
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) return { days: rule.days, modeKey: rule.modeKey }
  }
  return null
}
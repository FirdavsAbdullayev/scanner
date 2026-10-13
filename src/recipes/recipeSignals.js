/**
 * Ingredient signal extraction.
 *
 * The "AI" in Smart Kitchen works from real product data. For every item we
 * harvest text from:
 *   1. the Open Food Facts payload — categories, product name, ingredients
 *   2. the user's own product name (which may be Uzbek, Russian or English)
 *
 * …then map it onto a small canonical vocabulary of ingredient tags. Recipe
 * templates are matched against those tags, so a product called "Sut 3.2%" and
 * one called "Whole milk" both light up the `dairy` tag.
 */

/** Canonical tags, in display priority order. */
export const SIGNAL_TAGS = [
  'dairy',
  'cheese',
  'egg',
  'bread',
  'grain',
  'vegetable',
  'fruit',
  'meat',
  'fish',
  'sweet',
  'herb',
  'fat',
  'drink',
]

/**
 * Keyword *stems* per tag, covering English, Uzbek and Russian.
 * Matching is word-prefix based (see `matchesStem`), so "potato" also catches
 * "potatoes" and "яйц" catches "яйца"/"яйцо".
 */
export const TAG_KEYWORDS = {
  dairy: [
    'milk', 'yogurt', 'yoghurt', 'kefir', 'cream', 'curd', 'cottage', 'quark', 'buttermilk', 'ayran', 'dair',
    'sut', 'qatiq', 'yogurt', 'tvorog', 'smetana', 'qaymoq', 'chalop',
    'молок', 'кефир', 'йогурт', 'творог', 'сметан', 'сливк', 'ряженк', 'айран', 'молочн',
  ],
  cheese: [
    'cheese', 'gouda', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'feta', 'brynza',
    'pishloq',
    'сыр', 'брынз', 'моцарелл', 'пармезан',
  ],
  egg: [
    'egg', 'omelet', 'omelette', 'mayonnaise',
    'tuxum',
    'яйц', 'яичн', 'омлет', 'майонез',
  ],
  bread: [
    'bread', 'baguette', 'toast', 'bun', 'loaf', 'pita', 'lavash', 'bagel', 'croissant', 'bakery', 'patis',
    'non', 'patir', 'bulochka', 'baton', 'lochira', 'gotirma', 'kulcha',
    'хлеб', 'батон', 'булк', 'булочк', 'лаваш', 'багет', 'батон', 'хлебобул', 'пряник',
  ],
  grain: [
    'rice', 'flour', 'pasta', 'spaghetti', 'macaroni', 'noodle', 'oat', 'buckwheat', 'wheat', 'barley',
    'cereal', 'couscous', 'bulgur', 'semolina', 'corn', 'grain', 'vermicelli',
    'guruch', 'makaron', 'grechka', 'suli', 'bugdoy', 'bulgur', 'mosh', 'krupa',
    'рис', 'мука', 'макарон', 'спагетти', 'гречк', 'овсянк', 'пшено', 'булгур', 'кускус', 'круп',
    'овёс', 'овес', 'пшениц', 'вермишел', 'паста',
  ],
  vegetable: [
    'carrot', 'onion', 'potato', 'tomato', 'cucumber', 'cabbage', 'eggplant', 'aubergine', 'zucchini',
    'beet', 'beetroot', 'garlic', 'lettuce', 'spinach', 'pumpkin', 'broccoli', 'cauliflower',
    'vegetable', 'mushroom', 'legume', 'pepper', 'salad',
    'sabzi', 'piyoz', 'kartoshka', 'pomidor', 'bodring', 'qalampir', 'karam', 'baqlajon', 'kabachki',
    'lavlagi', 'sarimsoq', 'shovul', 'ismaloq', 'qovoq', 'brokoli', 'gulkaram', 'sabzavot', 'qoziqorin',
    'морков', 'лук', 'картоф', 'помидор', 'томат', 'огурец', 'огурц', 'капуст', 'баклажан', 'кабачок',
    'свёкл', 'свекл', 'чеснок', 'шпинат', 'тыкв', 'брокколи', 'овощ', 'гриб', 'салат',
  ],
  fruit: [
    'apple', 'banana', 'orange', 'mandarin', 'tangerine', 'lemon', 'pear', 'grape', 'strawberry',
    'raspberry', 'cherry', 'peach', 'apricot', 'pomegranate', 'kiwi', 'watermelon', 'melon', 'fruit',
    'raisin', 'berry', 'currant',
    'olma', 'banan', 'apelsin', 'mandarin', 'limon', 'nok', 'uzum', 'qulupnay', 'malina', 'olcha',
    'gilos', 'shaftoli', 'orik', 'anor', 'kivi', 'tarvuz', 'qovun', 'meva', 'mayiz',
    'яблок', 'банан', 'апельсин', 'мандарин', 'лимон', 'груш', 'виноград', 'клубник', 'малин',
    'вишн', 'черешн', 'персик', 'абрикос', 'гранат', 'киви', 'арбуз', 'дын', 'фрукт', 'изюм', 'ягод',
  ],
  meat: [
    'meat', 'chicken', 'beef', 'pork', 'lamb', 'minced', 'sausage', 'ham', 'poultry', 'liver',
    'turkey', 'bacon', 'steak', 'bird',
    'gosht', 'tovuq', 'qiyma', 'sosiska', 'kolbasa', 'parranda', 'jigar', 'kotlet', 'tushonka',
    'мяс', 'куриц', 'кури́ц', 'говядин', 'свинин', 'фарш', 'сосиск', 'колбас', 'птиц', 'котлет',
    'печен', 'тушёнк', 'тушенк', 'индейк', 'бекон', 'стейк',
  ],
  fish: [
    'fish', 'salmon', 'tuna', 'herring', 'caviar', 'seafood', 'shrimp', 'prawn', 'cod', 'mackerel',
    'baliq', 'losos', 'seld', 'ikra', 'dengiz',
    'рыб', 'лосос', 'тунец', 'сельд', 'икр', 'морепродукт', 'креветк', 'треск', 'скумбри',
  ],
  sweet: [
    'chocolate', 'sugar', 'honey', 'jam', 'biscuit', 'cookie', 'cake', 'candy', 'sweet', 'dessert',
    'syrup', 'waffle', 'marshmallow', 'marmalade', 'spread', 'nutella', 'caramel', 'praline',
    'confection', 'cocoa', 'breakfast',
    'shokolad', 'shakar', 'asal', 'murabbo', 'pechenye', 'tort', 'kek', 'konfet', 'halva',
    'pishiriq', 'vafli', 'zefir', 'marmelad', 'qand',
    'шоколад', 'сахар', 'мёд', 'мед', 'варень', 'печень', 'торт', 'кекс', 'конфет', 'халв',
    'вафл', 'зефир', 'мармелад', 'джем', 'сироп', 'какао',
  ],
  herb: [
    'spice', 'seasoning', 'herb', 'basil', 'dill', 'parsley', 'thyme', 'cinnamon', 'vanilla',
    'cumin', 'coriander', 'salt', 'sauce', 'ketchup', 'mustard', 'condiment',
    'ziravor', 'kokat', 'rayhon', 'ukrop', 'petrushka', 'kekik', 'murch', 'dolchin', 'vanil',
    'zira', 'kashnich', 'tuz',
    'специ', 'приправ', 'зелен', 'базилик', 'укроп', 'петрушк', 'тимьян', 'корица', 'ванил',
    'зир', 'кинз', 'соль', 'соус', 'кетчуп', 'горчиц',
  ],
  fat: [
    'oil', 'butter', 'margarine', 'lard', 'ghee', 'sunflower', 'olive',
    'moy', 'sariyog', 'margarin', 'zaytun',
    'масл', 'маргарин', 'сало', 'оливков',
  ],
  drink: [
    'water', 'juice', 'tea', 'coffee', 'cola', 'soda', 'lemonade', 'mineral', 'beverage', 'drink',
    'beer', 'wine',
    'suv', 'sharbat', 'choy', 'qahva', 'kola', 'gazli', 'limonad', 'mineral', 'ichimlik',
    'вод', 'сок', 'чай', 'кофе', 'кола', 'газиров', 'лимонад', 'минеральн', 'напиток', 'пиво', 'вино',
  ],
}

/** Minimum stem length — anything shorter causes false positives. */
const MIN_STEM_LENGTH = 3

/** Split text into lower-cased word tokens (Unicode aware). */
function tokenize(text) {
  if (!text) return []
  return String(text)
    .toLowerCase()
    // Uzbek Latin uses several apostrophe variants (o', g', ' ) — strip them all
    // so “yog'urt” tokenises as “yogurt” and matches the apostrophe-free stems.
    .replace(/['’‘ʻʼ`´]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

/** Does `word` start with `stem` (morphology friendly)? */
function matchesStem(word, stem) {
  if (stem.length < MIN_STEM_LENGTH) return word === stem
  return word.startsWith(stem)
}

/**
 * Extract the set of ingredient tags for one inventory item.
 *
 * @param {object} item  an item decorated by `useInventory` (may include `product`)
 * @returns {{ tags: Set<string>, evidence: Record<string, string[]> }}
 */
export function extractTags(item) {
  const product = item?.product ?? null
  const tokens = [
    ...tokenize(item?.name),
    ...tokenize(product?.name),
    ...tokenize(product?.brand),
    ...tokenize(product?.categories?.join(' ')),
    ...tokenize(product?.ingredients),
    ...tokenize(item?.location),
  ]

  const tags = new Set()
  const evidence = {}

  for (const tag of SIGNAL_TAGS) {
    const stems = TAG_KEYWORDS[tag]
    const hits = []
    for (const token of tokens) {
      if (stems.some((stem) => matchesStem(token, stem))) hits.push(token)
    }
    if (hits.length) {
      tags.add(tag)
      evidence[tag] = [...new Set(hits)].slice(0, 3)
    }
  }

  return { tags, evidence }
}

/** Convenience: decorate a list of items with their tags/evidence. */
export function tagItems(items = []) {
  return items.map((item) => {
    const { tags, evidence } = extractTags(item)
    return { ...item, tags, evidence }
  })
}

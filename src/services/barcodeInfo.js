/**
 * Offline barcode analysis — the part that *always* works.
 *
 * Every GTIN/EAN/UPC barcode carries information in the code itself:
 *   - the number of digits tells us the symbology (EAN-8 / UPC-A / EAN-13 / GTIN-14),
 *   - the leading digits are a **GS1 prefix** that identifies the country or
 *     region where the manufacturer registered the product,
 *   - the last digit is a **check digit** we can verify mathematically,
 *   - special ranges are reserved for books (ISBN), periodicals (ISSN),
 *     coupons and in-store/weight barcodes.
 *
 * So even when no database knows a product, the app can still tell the user
 * something useful and truthful about it — no network required.
 */

import { digitsOnly } from '../utils/format.js'

/**
 * GS1 prefix ranges (first three digits of an EAN-13) → ISO-3166-1 alpha-2.
 * `null` marks reserved/global ranges that don't belong to a single country.
 * Reference: https://www.gs1.org/standards/id-keys/company-prefix
 */
const GS1_RANGES = [
  [0, 19, 'US'],
  [20, 29, null], // in-store / restricted circulation
  [30, 39, 'US'],
  [40, 49, null], // restricted circulation (company internal)
  [50, 59, null], // coupons (US)
  [60, 139, 'US'],
  [200, 299, null], // restricted circulation / variable measure
  [300, 379, 'FR'],
  [380, 380, 'BG'],
  [383, 383, 'SI'],
  [385, 385, 'HR'],
  [387, 387, 'BA'],
  [389, 389, 'ME'],
  [400, 440, 'DE'],
  [450, 459, 'JP'],
  [460, 469, 'RU'],
  [470, 470, 'KG'],
  [471, 471, 'TW'],
  [474, 474, 'EE'],
  [475, 475, 'LV'],
  [476, 476, 'AZ'],
  [477, 477, 'LT'],
  [478, 478, 'UZ'],
  [479, 479, 'LK'],
  [480, 480, 'PH'],
  [481, 481, 'BY'],
  [482, 482, 'UA'],
  [484, 484, 'MD'],
  [485, 485, 'AM'],
  [486, 486, 'GE'],
  [487, 487, 'KZ'],
  [488, 488, 'TJ'],
  [489, 489, 'HK'],
  [490, 499, 'JP'],
  [500, 509, 'GB'],
  [520, 520, 'GR'],
  [528, 528, 'LB'],
  [529, 529, 'CY'],
  [530, 530, 'AL'],
  [531, 531, 'MK'],
  [535, 535, 'MT'],
  [539, 539, 'IE'],
  [540, 549, 'BE'],
  [560, 560, 'PT'],
  [569, 569, 'IS'],
  [570, 579, 'DK'],
  [590, 590, 'PL'],
  [594, 594, 'RO'],
  [599, 599, 'HU'],
  [600, 601, 'ZA'],
  [603, 603, 'GH'],
  [604, 604, 'SN'],
  [608, 608, 'BH'],
  [609, 609, 'MU'],
  [611, 611, 'MA'],
  [613, 613, 'DZ'],
  [615, 615, 'NG'],
  [616, 616, 'KE'],
  [618, 618, 'CI'],
  [619, 619, 'TN'],
  [620, 620, 'TZ'],
  [621, 621, 'SY'],
  [622, 622, 'EG'],
  [624, 624, 'LY'],
  [625, 625, 'JO'],
  [626, 626, 'IR'],
  [627, 627, 'KW'],
  [628, 628, 'SA'],
  [629, 629, 'AE'],
  [640, 649, 'FI'],
  [690, 699, 'CN'],
  [700, 709, 'NO'],
  [729, 729, 'IL'],
  [730, 739, 'SE'],
  [740, 740, 'GT'],
  [741, 741, 'SV'],
  [742, 742, 'HN'],
  [743, 743, 'NI'],
  [744, 744, 'CR'],
  [745, 745, 'PA'],
  [746, 746, 'DO'],
  [750, 750, 'MX'],
  [754, 755, 'CA'],
  [759, 759, 'VE'],
  [760, 769, 'CH'],
  [770, 770, 'CO'],
  [773, 773, 'UY'],
  [775, 775, 'PE'],
  [777, 777, 'BO'],
  [779, 779, 'AR'],
  [780, 780, 'CL'],
  [784, 784, 'PY'],
  [786, 786, 'EC'],
  [789, 790, 'BR'],
  [800, 839, 'IT'],
  [840, 849, 'ES'],
  [850, 850, 'CU'],
  [858, 858, 'SK'],
  [859, 859, 'CZ'],
  [860, 860, 'RS'],
  [865, 865, 'MN'],
  [867, 867, 'KP'],
  [868, 869, 'TR'],
  [870, 879, 'NL'],
  [880, 880, 'KR'],
  [884, 884, 'KH'],
  [885, 885, 'TH'],
  [888, 888, 'SG'],
  [890, 890, 'IN'],
  [893, 893, 'VN'],
  [896, 896, 'PK'],
  [899, 899, 'ID'],
  [900, 919, 'AT'],
  [930, 939, 'AU'],
  [940, 949, 'NZ'],
  [950, 950, null], // GS1 Global Office
  [951, 951, null], // GS1 Global Office
  [955, 955, 'MY'],
  [958, 958, 'MO'],
  [977, 977, null], // ISSN (periodicals)
  [978, 979, null], // ISBN (books)
  [980, 980, null], // refund receipts
  [981, 984, null], // coupons / currency
  [990, 999, null], // coupons
]

/** Digit-count → symbology. */
const TYPE_BY_LENGTH = {
  8: 'ean8',
  12: 'upca',
  13: 'ean13',
  14: 'gtin14',
}

/**
 * @typedef {Object} BarcodeInfo
 * @property {string}      code         digits only
 * @property {number}      length
 * @property {string}      type         'ean8'|'upca'|'ean13'|'gtin14'|'isbn'|'issn'|'unknown'
 * @property {string}      kind         'product'|'book'|'periodical'|'internal'|'coupon'
 * @property {boolean}     valid        check digit verified (false when not applicable)
 * @property {boolean}     hasCheckDigit whether a GS1 check digit could be verified
 * @property {string|null} countryCode  ISO-3166-1 alpha-2 of the GS1 prefix, if any
 * @property {boolean}     restricted   in-store / variable-measure / internal range
 */

/**
 * Analyse a barcode completely offline.
 *
 * @param {string|number} rawCode
 * @returns {BarcodeInfo|null} `null` when the input isn't a plausible GTIN
 */
export function analyzeBarcode(rawCode) {
  const code = digitsOnly(rawCode)
  if (!code || !/^\d{8,14}$/.test(code)) return null

  const prefix = Number(code.slice(0, 3))
  const hasCheckDigit = Object.prototype.hasOwnProperty.call(TYPE_BY_LENGTH, code.length)

  let type = TYPE_BY_LENGTH[code.length] ?? 'unknown'
  let kind = 'product'
  let restricted = prefix >= 200 && prefix <= 299

  if (code.length === 13 && (prefix === 978 || prefix === 979)) {
    type = 'isbn'
    kind = 'book'
  } else if (code.length === 13 && prefix === 977) {
    type = 'issn'
    kind = 'periodical'
  } else if (prefix >= 20 && prefix <= 29) {
    kind = 'internal'
    restricted = true
  } else if (restricted) {
    kind = 'internal'
  } else if (code.length === 13 && ((prefix >= 980 && prefix <= 984) || (prefix >= 990 && prefix <= 999))) {
    kind = 'coupon'
  }

  const countryCode = kind === 'book' || kind === 'periodical' || restricted ? null : prefixToIso(prefix)

  return {
    code,
    length: code.length,
    type,
    kind,
    valid: hasCheckDigit ? hasValidCheckDigit(code) : false,
    hasCheckDigit,
    countryCode,
    restricted,
  }
}

/**
 * Alternative spellings of the *same* GTIN.
 *
 * A product can be indexed as a 12-digit UPC-A, a 13-digit EAN-13 or a 14-digit
 * GTIN-14 depending on who stored it; the forms differ only by leading zeros.
 * The Open Facts family normalises these internally, so this is only needed for
 * the other databases (openFDA, iTunes, retail catalogues).
 *
 * @param {string|number} rawCode
 * @returns {string[]} the code itself first, then at most one alternative
 */
export function gtinVariants(rawCode) {
  const code = digitsOnly(rawCode)
  if (!code) return []
  const out = [code]
  if (code.length === 13 && code.startsWith('0')) out.push(code.slice(1)) // EAN-13 → UPC-A
  else if (code.length === 12) out.push(`0${code}`) // UPC-A → EAN-13
  else if (code.length === 14 && code.startsWith('0')) out.push(code.slice(1)) // GTIN-14 → EAN-13
  return out
}

/** GS1 mod-10 check-digit verification (works for EAN-8/13, UPC-A, GTIN-14). */
export function hasValidCheckDigit(code) {
  if (!/^\d{8,14}$/.test(code)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()
  let sum = 0
  digits.reverse().forEach((digit, index) => {
    sum += digit * (index % 2 === 0 ? 3 : 1)
  })
  return (10 - (sum % 10)) % 10 === check
}

/** Resolve a 3-digit GS1 prefix to a region code. */
function prefixToIso(prefix) {
  for (const [from, to, iso] of GS1_RANGES) {
    if (prefix >= from && prefix <= to) return iso
  }
  return null
}

/**
 * Localised region name via the built-in `Intl.DisplayNames` (no big lookup
 * table needed, and it follows the app language automatically).
 */
export function regionName(isoCode, locale, fallback = '') {
  if (!isoCode) return fallback
  try {
    const display = new Intl.DisplayNames([locale], { type: 'region' })
    return display.of(isoCode) || isoCode
  } catch {
    return isoCode
  }
}

/** ISO-3166 code → flag emoji (regional indicator symbols). */
export function flagEmoji(isoCode) {
  if (!isoCode || !/^[A-Za-z]{2}$/.test(isoCode)) return '🌐'
  return isoCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

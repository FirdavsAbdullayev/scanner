/**
 * Demo inventory.
 *
 * Dates are generated *relative to today* so the dashboard always looks alive:
 * a couple of expired items, a few expiring within 3 days, and a healthy
 * "fresh" majority — plus one already-consumed row to show that state off.
 *
 * Items that carry a real barcode start with `product: null`; the app lazily
 * enriches them from Open Food Facts on first load (see `useInventory`).
 */

import { addDays } from '../utils/dateUtils.js'
import { uid } from '../utils/format.js'

/**
 * @typedef {Object} InventoryItem
 * @property {string}  id
 * @property {string}  name
 * @property {'fridge'|'pantry'|'medicine'} category
 * @property {string}  location
 * @property {string}  expiryDate          'YYYY-MM-DD'
 * @property {number}  quantity
 * @property {string}  unit
 * @property {string}  barcode
 * @property {object|null} product         cached Open Food Facts payload
 * @property {boolean} consumed
 * @property {number}  addedAt             epoch ms
 */

/** @type {Array<Omit<InventoryItem,'id'|'addedAt'>>} */
export const SEED_ITEMS = [
  // ── Expired ───────────────────────────────────────────────────────────────
  {
    name: 'Pishloq Gouda',
    category: 'fridge',
    location: 'Pastki tortma',
    expiryDate: addDays(-2),
    quantity: 1,
    unit: 'pack',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Tvorog (9%)',
    category: 'fridge',
    location: 'Yuqori polka',
    expiryDate: addDays(-1),
    quantity: 1,
    unit: 'pack',
    barcode: '',
    product: null,
    consumed: false,
  },

  // ── Expiring soon (<= 3 days) ─────────────────────────────────────────────
  {
    name: 'Qatiq',
    category: 'fridge',
    location: 'Eshik',
    expiryDate: addDays(0),
    quantity: 1,
    unit: 'l',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Sut 3.2%',
    category: 'fridge',
    location: 'Yuqori polka',
    expiryDate: addDays(1),
    quantity: 2,
    unit: 'l',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Tovuq filesi',
    category: 'fridge',
    location: 'Muzlatish kamerasi',
    expiryDate: addDays(2),
    quantity: 1,
    unit: 'kg',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Non (patir)',
    category: 'pantry',
    location: 'Oshxona stoli',
    expiryDate: addDays(2),
    quantity: 1,
    unit: 'pcs',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Cheerios',
    category: 'pantry',
    location: 'Oshxona shkafi',
    expiryDate: addDays(3),
    quantity: 1,
    unit: 'box',
    barcode: '0016000275270',
    product: null,
    consumed: false,
  },

  // ── Fresh ─────────────────────────────────────────────────────────────────
  {
    name: 'Tuxum (10 dona)',
    category: 'fridge',
    location: 'Eshik',
    expiryDate: addDays(6),
    quantity: 10,
    unit: 'pcs',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Banan',
    category: 'pantry',
    location: 'Meva savati',
    expiryDate: addDays(4),
    quantity: 5,
    unit: 'pcs',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Olma (Golden)',
    category: 'fridge',
    location: 'Pastki tortma',
    expiryDate: addDays(14),
    quantity: 6,
    unit: 'pcs',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Milka sutli shokolad',
    category: 'pantry',
    location: 'Oshxona shkafi',
    expiryDate: addDays(21),
    quantity: 2,
    unit: 'pcs',
    barcode: '7622210449283',
    product: null,
    consumed: false,
  },
  {
    name: 'Nutella',
    category: 'pantry',
    location: 'Oshxona shkafi',
    expiryDate: addDays(45),
    quantity: 1,
    unit: 'pcs',
    barcode: '3017620422003',
    product: null,
    consumed: false,
  },
  {
    name: 'Coca-Cola 330ml',
    category: 'pantry',
    location: 'Ichimliklar javoni',
    expiryDate: addDays(60),
    quantity: 6,
    unit: 'can',
    barcode: '5449000000996',
    product: null,
    consumed: false,
  },
  {
    name: 'Guruch (devzira)',
    category: 'pantry',
    location: 'Oziq-ovqat javoni',
    expiryDate: addDays(180),
    quantity: 3,
    unit: 'kg',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Zaytun moyi',
    category: 'pantry',
    location: 'Oshxona shkafi',
    expiryDate: addDays(240),
    quantity: 1,
    unit: 'bottle',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Paracetamol 500mg',
    category: 'medicine',
    location: 'Dorixona javoni',
    expiryDate: addDays(420),
    quantity: 2,
    unit: 'blister',
    barcode: '',
    product: null,
    consumed: false,
  },
  {
    name: 'Vitamin C 1000mg',
    category: 'medicine',
    location: 'Dorixona javoni',
    expiryDate: addDays(28),
    quantity: 1,
    unit: 'tube',
    barcode: '',
    product: null,
    consumed: false,
  },

  // ── Already consumed (shows the consumed state) ───────────────────────────
  {
    name: 'Yogurt Activia',
    category: 'fridge',
    location: 'Yuqori polka',
    expiryDate: addDays(-4),
    quantity: 2,
    unit: 'pcs',
    barcode: '',
    product: null,
    consumed: true,
  },
]

/** Build a fresh, timestamped inventory from the seed list. */
export function createSeedItems() {
  const now = Date.now()
  return SEED_ITEMS.map((item, index) => ({
    ...item,
    id: uid('item'),
    // Stagger "added at" so the "recently added" sort has a real ordering.
    addedAt: now - index * 3_600_000,
  }))
}

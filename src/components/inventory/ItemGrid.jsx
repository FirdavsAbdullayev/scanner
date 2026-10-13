import { ItemCard } from './ItemCard.jsx'

/** Responsive card grid. One column on phones, up to three on wide screens. */
export function ItemGrid({ items }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <ItemCard key={item.id} item={item} index={index} />
      ))}
    </div>
  )
}

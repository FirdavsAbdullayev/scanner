import { useState } from 'react'
import { Package } from 'lucide-react'

/**
 * Product image with a graceful fallback.
 *
 * Open Food Facts photos live on a third-party CDN, so they can be missing,
 * slow or blocked — we swap to a category-tinted icon tile instead of showing
 * a broken image.
 */
export function ProductThumb({ src, alt, fallbackIcon: Fallback = Package, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false)

  const sizes = {
    sm: 'h-10 w-10 rounded-xl',
    md: 'h-14 w-14 rounded-2xl',
    lg: 'h-20 w-20 rounded-2xl',
    xl: 'h-28 w-28 rounded-3xl',
  }
  const iconSizes = {
    sm: 'h-4.5 w-4.5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  }

  const showImage = Boolean(src) && !failed

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/70 bg-gradient-to-br from-white to-slate-100 shadow-sm ${sizes[size]} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <Fallback className={`${iconSizes[size]} text-slate-400`} strokeWidth={1.7} />
      )}
    </span>
  )
}

import { useState } from "react"
import { formatPrice } from "../data"
import type { Page } from "../App"

interface Product {
  id: number
  name: string
  category: string
  price: number
  originalPrice: number
  rating: number
  reviews: number
  sold: number
  stock: number
  weight: number
  discount: number
  image: string
  description: string
  tags: string[]
}

interface ProductCardProps {
  product: Product
  navigate: (page: Page, data?: unknown) => void
  onAddToCart: (product: Product) => void
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      aria-label={`Rating ${rating} dari 5`}
      className="text-xs tracking-tight text-amber-600"
    >
      {"★".repeat(Math.max(0, Math.min(5, Math.round(rating))))}
      <span className="text-gray-300">
        {"★".repeat(5 - Math.max(0, Math.min(5, Math.round(rating))))}
      </span>
    </span>
  )
}

export default function ProductCard({ product, navigate }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const outOfStock = product.stock <= 0

  return (
    <button
      type="button"
      onClick={() => navigate("product-detail", product)}
      aria-label={`${product.name}, ${formatPrice(product.price)}`}
      className="card-hover group flex h-full w-full flex-col overflow-hidden border border-gray-200 bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DF401F]"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-50">
        <img
          src="/images/logo/wicaksono_logo_1.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto h-2/5 w-2/5 object-contain opacity-40"
        />
        {!imageError && product.image && (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}
        {product.discount > 0 && (
          <span className="absolute left-3 top-3 rounded-sm bg-white px-2 py-1 text-xs font-medium text-[#DF401F]">
            -{product.discount}%
          </span>
        )}
        {product.stock > 0 && product.stock < 20 && (
          <span className="absolute right-3 top-3 rounded-sm bg-white px-2 py-1 text-xs font-medium text-amber-700">
            Stok terbatas
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-gray-800">
            Stok habis
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <span className="text-xs capitalize text-gray-500">
          {product.category}
        </span>
        <span className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-gray-900">
          {product.name}
        </span>
        <span className="flex items-center gap-1.5">
          <Stars rating={product.rating} />
          <span className="text-xs text-gray-500">
            {product.rating} ({product.reviews})
          </span>
        </span>
        <span className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </span>
        <span className="text-xs text-gray-500">
          Terjual {product.sold.toLocaleString("id-ID")}
          {product.weight > 0
            ? ` · ${product.weight.toLocaleString("id-ID")} g`
            : ""}
        </span>
      </span>
    </button>
  )
}

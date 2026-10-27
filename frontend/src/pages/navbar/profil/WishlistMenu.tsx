import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch, storageUrl } from "../../../api/client"
import { formatPrice } from "../../../data"
import type { Page } from "../../../App"
import {
  cardClass,
  EmptyState,
  ErrorNotice,
  getErrorMessage,
  isUnauthorized,
  LoadingState,
  outlineButton,
  SectionHeader,
} from "./shared"

interface Product {
  id: number
  name: string
  price: string | number
  image?: string | null
  images?: {
    path: string
    url?: string
    is_primary?: boolean
  }[]
}
interface Item {
  id: number
  product_id: number
  product: Product
}
export default function WishlistMenu({
  navigate,
}: {
  navigate: (page: Page) => void
}) {
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(() => {
    setLoading(true)
    setError("")
    apiFetch<{ data: Item[] }>("/wishlist")
      .then((response) => setItems(response.data ?? []))
      .catch((err) => {
        if (isUnauthorized(err)) navigateRef.current("login")
        else setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    load()
  }, [load])
  const remove = async (productId: number) => {
    setError("")
    try {
      await apiFetch(`/wishlist/${productId}`, { method: "DELETE" })
      setItems((current) =>
        current.filter((item) => item.product_id !== productId),
      )
    } catch (err) {
      if (isUnauthorized(err)) navigateRef.current("login")
      else setError(getErrorMessage(err))
    }
  }
  return (
    <div className={cardClass}>
      <SectionHeader
        title="Wishlist"
        description="Kumpulan produk yang kamu simpan untuk dibeli nanti."
      />
      <ErrorNotice message={error} retry={load} />
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Wishlist kamu masih kosong.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ product }) => {
            const image =
              product.images?.find((item) => item.is_primary)?.url ??
              product.images?.[0]?.url ??
              (product.image ? storageUrl(product.image) : "")
            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-xl border border-gray-100"
              >
                <Link to={`/produk/${product.id}`}>
                  <img
                    className="h-40 w-full bg-gray-50 object-cover"
                    src={image}
                    alt={product.name}
                  />
                </Link>
                <div className="p-4">
                  <Link
                    to={`/produk/${product.id}`}
                    className="line-clamp-2 font-bold text-gray-900 hover:text-[#DF3E1D]"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-2 font-extrabold text-[#DF3E1D]">
                    {formatPrice(Number(product.price))}
                  </p>
                  <button
                    type="button"
                    className={`${outlineButton} mt-4 w-full`}
                    onClick={() => void remove(product.id)}
                  >
                    Hapus dari wishlist
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

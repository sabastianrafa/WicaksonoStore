import { useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  FiArrowLeft,
  FiArrowRight,
  FiLoader,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi"

import { formatPrice } from "../data"
import { apiFetch, storageUrl } from "../api/client"
import type { Page } from "../App"

interface CartProduct {
  id: number
  name: string
  price: string | number
  stock: number
  /** Berat satu produk dalam gram. */
  weight: number
  category?: {
    id: number
    name: string
  }
  images?: {
    id: number
    path: string
    url?: string
    is_primary?: boolean
  }[]
  image?: string | null
}

interface CartItem {
  id: number
  product_id: number
  quantity: number
  subtotal: number
  product: CartProduct
}

interface CartResponse {
  success: boolean
  message: string
  data: {
    id: number
    user_id: number
    items: CartItem[]
    total_items: number
    subtotal: number
  }
}

interface CartItemResponse {
  success: boolean
  message: string
  data: CartItem
}

interface CartActionResponse {
  success: boolean
  message: string
}

interface CartPageProps {
  cart: CartItem[]
  setCart: Dispatch<SetStateAction<CartItem[]>>
  navigate: (page: Page) => void
}

const getProductImage = (item: CartItem): string => {
  const imageUrl =
    item.product.images?.find((image) => image.is_primary)?.url ??
    item.product.images?.[0]?.url ??
    item.product.image ??
    ""

  if (!imageUrl) return ""

  return imageUrl.startsWith("http") ? imageUrl : storageUrl(imageUrl)
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const formatWeight = (weightInGrams: number): string => {
  if (!Number.isFinite(weightInGrams) || weightInGrams <= 0) {
    return "0 g"
  }

  if (weightInGrams >= 1000) {
    const kilograms = weightInGrams / 1000
    return `${kilograms.toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} kg (${weightInGrams.toLocaleString("id-ID")} g)`
  }

  return `${weightInGrams.toLocaleString("id-ID")} g`
}

export default function CartPage({
  cart,
  setCart,
  navigate,
}: CartPageProps) {
  const [loading, setLoading] = useState(true)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(
    () => new Set(),
  )
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let isActive = true

    const loadCart = async () => {
      try {
        setError("")
        const response = await apiFetch<CartResponse>("/cart")

        if (isActive) {
          setCart(response.data.items ?? [])
        }
      } catch (err) {
        console.error("Gagal mengambil keranjang:", err)

        if (isActive) {
          setError(
            getErrorMessage(err, "Gagal mengambil data keranjang."),
          )
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    loadCart()

    return () => {
      isActive = false
    }
  }, [setCart])

  const validItems = useMemo(
    () => cart.filter((item) => Boolean(item?.product)),
    [cart],
  )

  const totalItems = useMemo(
    () =>
      validItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      ),
    [validItems],
  )

  const subtotal = useMemo(
    () =>
      validItems.reduce((total, item) => {
        const serverSubtotal = Number(item.subtotal)

        const itemTotal =
          item.subtotal != null && Number.isFinite(serverSubtotal)
            ? serverSubtotal
            : Number(item.product.price || 0) *
              Number(item.quantity || 0)

        return total + itemTotal
      }, 0),
    [validItems],
  )

  // Berat produk dikalikan jumlah unit yang ada di keranjang.
  const totalWeight = useMemo(
    () =>
      validItems.reduce((total, item) => {
        const productWeight = Number(item.product.weight || 0)
        const quantity = Number(item.quantity || 0)

        return total + productWeight * quantity
      }, 0),
    [validItems],
  )

  const setItemUpdating = (itemId: number, isUpdating: boolean) => {
    setUpdatingIds((previous) => {
      const next = new Set(previous)

      if (isUpdating) {
        next.add(itemId)
      } else {
        next.delete(itemId)
      }

      return next
    })
  }

  const updateQty = async (item: CartItem, quantity: number) => {
    if (updatingIds.has(item.id) || isClearing) return

    if (quantity <= 0) {
      await removeItem(item.id)
      return
    }

    if (quantity > item.product.stock) {
      setError("Jumlah produk melebihi stok yang tersedia.")
      return
    }

    try {
      setItemUpdating(item.id, true)
      setError("")

      const response = await apiFetch<CartItemResponse>(
        `/cart/items/${item.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ quantity }),
        },
      )

      setCart((previous) =>
        previous.map((cartItem) =>
          cartItem.id === item.id ? response.data : cartItem,
        ),
      )
    } catch (err) {
      console.error("Gagal memperbarui quantity:", err)
      setError(
        getErrorMessage(err, "Gagal memperbarui jumlah produk."),
      )
    } finally {
      setItemUpdating(item.id, false)
    }
  }

  const removeItem = async (itemId: number) => {
    if (updatingIds.has(itemId) || isClearing) return

    try {
      setItemUpdating(itemId, true)
      setError("")

      await apiFetch<CartActionResponse>(`/cart/items/${itemId}`, {
        method: "DELETE",
      })

      setCart((previous) =>
        previous.filter((item) => item.id !== itemId),
      )
    } catch (err) {
      console.error("Gagal menghapus item:", err)
      setError(getErrorMessage(err, "Gagal menghapus produk."))
    } finally {
      setItemUpdating(itemId, false)
    }
  }

  const clearCart = async () => {
    if (validItems.length === 0 || isClearing) return

    const confirmed = window.confirm(
      "Apakah kamu yakin ingin menghapus semua produk dari keranjang?",
    )

    if (!confirmed) return

    try {
      setIsClearing(true)
      setError("")

      await apiFetch<CartActionResponse>("/cart", {
        method: "DELETE",
      })

      setCart([])
    } catch (err) {
      console.error("Gagal mengosongkan keranjang:", err)
      setError(
        getErrorMessage(err, "Gagal mengosongkan keranjang."),
      )
    } finally {
      setIsClearing(false)
    }
  }

  const isBusy = updatingIds.size > 0 || isClearing

  if (loading) {
    return (
      <main
        className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center"
        aria-live="polite"
      >
        <FiLoader
          className="mb-4 h-9 w-9 animate-spin text-[#DF401F]"
          aria-hidden="true"
        />
        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          Memuat keranjang...
        </h2>
        <p className="text-sm text-gray-500">
          Mengambil data keranjang belanja.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-sm"
      >
        <button
          type="button"
          onClick={() => navigate("home")}
          className="rounded font-medium text-[#DF401F] transition-colors hover:text-[#b83219] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F] focus-visible:ring-offset-2"
        >
          Beranda
        </button>
        <span className="text-gray-300" aria-hidden="true">
          /
        </span>
        <span className="font-medium text-gray-700" aria-current="page">
          Keranjang Belanja
        </span>
      </nav>

      {/* Page heading */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Keranjang Belanja
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Periksa produk dan jumlah pesanan sebelum melanjutkan.
          </p>
        </div>

        {validItems.length > 0 && (
          <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-[#DF401F]">
            {totalItems} item
          </span>
        )}
      </div>

      {/* Error feedback */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Tutup pesan error"
            className="shrink-0 rounded p-1 text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            ×
          </button>
        </div>
      )}

      {validItems.length === 0 ? (
        /* Empty cart */
        <section className="rounded-2xl border border-gray-100 bg-white px-5 py-20 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
            <FiShoppingCart
              className="h-9 w-9 text-gray-300"
              aria-hidden="true"
            />
          </div>

          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Keranjang masih kosong
          </h2>
          <p className="mx-auto mb-7 max-w-sm text-sm leading-6 text-gray-500">
            Belum ada produk yang ditambahkan. Yuk, temukan oleh-oleh
            favoritmu!
          </p>

          <button
            type="button"
            onClick={() => navigate("catalog")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DF401F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#c9361b] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F] focus-visible:ring-offset-2"
          >
            <FiShoppingCart aria-hidden="true" />
            Mulai Belanja
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Cart list */}
          <section
            aria-label="Daftar produk di keranjang"
            className="min-w-0 space-y-4"
          >
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Produk pilihanmu
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {validItems.length} jenis produk
                </p>
              </div>

              <button
                type="button"
                onClick={clearCart}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                {isClearing ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiTrash2 className="h-4 w-4" />
                )}
                {isClearing ? "Menghapus..." : "Hapus semua"}
              </button>
            </div>

            {validItems.map((item) => {
              const isUpdating = updatingIds.has(item.id)
              const isOutOfStock = item.product.stock <= 0
              const isMaxStock =
                item.quantity >= item.product.stock || isOutOfStock
              const imageUrl = getProductImage(item)

              return (
                <article
                  key={item.id}
                  aria-busy={isUpdating}
                  className={`relative flex gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-opacity sm:gap-4 sm:p-5 ${
                    isUpdating ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {/* Product image */}
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-lg bg-gray-50 object-cover sm:h-24 sm:w-24"
                      onError={(event) => {
                        event.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-50 sm:h-24 sm:w-24">
                      <FiPackage className="h-7 w-7 text-gray-300" />
                    </div>
                  )}

                  {/* Product information */}
                  <div className="min-w-0 flex-1">
                    {item.product.category?.name && (
                      <p className="mb-1 text-xs capitalize text-gray-400">
                        {item.product.category.name}
                      </p>
                    )}

                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
                      {item.product.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Berat satuan:{" "}
                      {formatWeight(Number(item.product.weight || 0))}
                    </p>

                    <p className="mt-2 text-sm font-bold text-[#DF401F]">
                      {formatPrice(Number(item.product.price))}
                    </p>

                    {isMaxStock && (
                      <p className="mt-1 text-xs text-amber-600">
                        {isOutOfStock
                          ? "Stok sedang habis"
                          : "Stok maksimum tercapai"}
                      </p>
                    )}
                  </div>

                  {/* Item actions */}
                  <div className="flex shrink-0 flex-col items-end justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isUpdating || isBusy}
                      aria-label={`Hapus ${item.product.name} dari keranjang`}
                      title="Hapus produk"
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-default disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>

                    {/* Quantity control */}
                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateQty(item, item.quantity - 1)
                        }
                        disabled={isUpdating || isBusy}
                        aria-label={`Kurangi jumlah ${item.product.name}`}
                        className="flex h-9 w-9 items-center justify-center bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:cursor-default disabled:opacity-40 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#DF401F]"
                      >
                        {isUpdating ? (
                          <FiLoader className="h-4 w-4 animate-spin" />
                        ) : (
                          <FiMinus className="h-4 w-4" />
                        )}
                      </button>

                      <span
                        className="min-w-10 px-2 text-center text-sm font-semibold tabular-nums text-gray-900"
                        aria-live="polite"
                        aria-label={`Jumlah ${item.quantity}`}
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQty(item, item.quantity + 1)
                        }
                        disabled={isUpdating || isBusy || isMaxStock}
                        aria-label={`Tambah jumlah ${item.product.name}`}
                        title={
                          isMaxStock
                            ? "Stok maksimum tercapai"
                            : "Tambah jumlah"
                        }
                        className="flex h-9 w-9 items-center justify-center bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:cursor-default disabled:opacity-40 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#DF401F]"
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-right text-sm font-bold text-gray-900">
                      {formatPrice(
                        Number(item.subtotal) ||
                          Number(item.product.price) * item.quantity,
                      )}
                    </p>
                  </div>
                </article>
              )
            })}
          </section>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24">
            <section
              aria-labelledby="order-summary-title"
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id="order-summary-title"
                className="text-lg font-bold text-gray-900"
              >
                Ringkasan Pesanan
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Periksa kembali pesananmu.
              </p>

              <div className="my-5 space-y-4">
                {/* Item count */}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">
                    Subtotal ({totalItems} item)
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {/* Total weight */}
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FiPackage
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Total berat</span>
                  </div>
                  <span className="text-right font-semibold tabular-nums text-gray-900">
                    {formatWeight(totalWeight)}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-800">
                    Total belanja
                  </span>
                  <span className="text-xl font-bold tabular-nums text-[#DF401F]">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("checkout")}
                  disabled={isBusy || validItems.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DF401F] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#c9361b] active:scale-[0.99] disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F] focus-visible:ring-offset-2"
                >
                  {isBusy ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Lanjut ke Pembayaran
                      <FiArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("catalog")}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F] focus-visible:ring-offset-2"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  Lanjut Belanja
                </button>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                Biaya pengiriman akan dihitung pada tahap checkout.
              </p>
            </section>
          </aside>
        </div>
      )}
    </main>
  )
}

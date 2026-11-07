import { useEffect, useState, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import {
  FiBox,
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiChevronRight,
  FiMinus,
  FiPlus,
  FiCheck,
} from "react-icons/fi"
import { FaCartPlus, FaCartArrowDown } from "react-icons/fa"
import { formatPrice } from "../data"
import ProductCard from "../components/ProductCard"
import { apiFetch, storageUrl } from "../api/client"
import type { Page } from "../App"

/* =========================================================
   TYPES
========================================================= */

interface ApiProduct {
  id: number
  category_id: number
  name: string
  description: string | null
  price: string | number
  original_price?: string | number | null
  stock: number
  weight: number
  sold: number
  rating: string | number
  review_count: number
  discount: number
  image?: string | null
  category?: { id: number; name: string } | null
  images?: { path: string; url?: string; is_primary?: boolean }[]
}

interface ApiReview {
  id: number
  rating: number
  comment: string | null
  created_at?: string
  user?: { name?: string } | null
}

interface ApiShippingMethod {
  id: number
  name: string
  description: string | null
  cost: string | number
  estimated_days: string | null
}

interface ListResponse<T> {
  data?: T[]
}

interface ProductDetailPageProps {
  navigate: (page: Page, data?: unknown) => void
  onAddToCart: (product: unknown) => Promise<boolean>
}

/* =========================================================
   HELPERS
========================================================= */

const TABS = [
  ["deskripsi", "Deskripsi"],
  ["ulasan", "Ulasan"],
  ["pengiriman", "Pengiriman"],
] as const

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const toUrl = (raw: string) =>
  /^https?:\/\//.test(raw) ? raw : storageUrl(raw)

/** Semua gambar produk, gambar utama di depan, tanpa duplikat. */
const collectImages = (item: ApiProduct): string[] => {
  const sorted = [...(item.images ?? [])].sort(
    (a, b) => Number(!!b.is_primary) - Number(!!a.is_primary),
  )
  const raws = [...sorted.map((img) => img.url ?? img.path), item.image]

  return [...new Set(raws.filter((raw): raw is string => !!raw).map(toUrl))]
}

const toCardProduct = (item: ApiProduct) => ({
  id: item.id,
  name: item.name,
  category: item.category?.name ?? "",
  price: Number(item.price ?? 0),
  originalPrice: Number(item.original_price ?? item.price ?? 0),
  rating: Number(item.rating ?? 0),
  reviews: Number(item.review_count ?? 0),
  sold: Number(item.sold ?? 0),
  stock: Number(item.stock ?? 0),
  weight: Number(item.weight ?? 0),
  discount: Number(item.discount ?? 0),
  image: collectImages(item)[0] ?? "",
  description: item.description ?? "",
  tags: [] as string[],
})

const formatReviewDate = (value?: string) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : "-"
}

/**
 * Ambil data dari API. path = null berarti tidak mengambil apa pun.
 * Hasil hanya dipakai kalau cocok dengan path saat ini, jadi data produk
 * sebelumnya tidak bocor ke produk berikutnya.
 */
function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data: T | null }>({
    path: null,
    data: null,
  })

  useEffect(() => {
    if (!path) return

    let active = true

    apiFetch<T>(path)
      .then((data) => {
        if (active) setState({ path, data })
      })
      .catch(() => {
        if (active) setState({ path, data: null })
      })

    return () => {
      active = false
    }
  }, [path])

  const settled = state.path === path
  return {
    data: settled ? state.data : null,
    loading: path !== null && !settled,
  }
}

/* =========================================================
   KOMPONEN KECIL
========================================================= */

function Stars({ value, className }: { value: number; className: string }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          className={`${className} ${
            i <= Math.round(value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </>
  )
}

function EmptyBox({ children }: { children: ReactNode }) {
  return (
    <div className="text-center p-10 bg-gray-50 rounded-2xl text-gray-500 font-medium">
      {children}
    </div>
  )
}

const stepperBtn =
  "w-10 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-200 disabled:opacity-50 text-gray-700"
const actionBtn =
  "flex w-full flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"

/* =========================================================
   HALAMAN
========================================================= */

export default function ProductDetailPage({
  navigate,
  onAddToCart,
}: ProductDetailPageProps) {
  const { id } = useParams()
  const productId = Number(id)
  const validId = Number.isInteger(productId) && productId > 0
  
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1)
  const [selectedImg, setSelectedImg] = useState(0)
  const [activeTab, setActiveTab] =
    useState<typeof TABS[number][0]>("deskripsi")
  const [added, setAdded] = useState(false)
  const [busy, setBusy] = useState(false)

  // Detail, ulasan, dan metode pengiriman diambil paralel; produk terkait
  // menunggu kategori dari detail.
  const { data: detail, loading } = useApi<{ data: ApiProduct }>(
    validId ? `/products/${productId}` : null,
  )
  const product = detail?.data ?? null

  const { data: reviewRes } = useApi<ListResponse<ApiReview>>(
    validId ? `/products/${productId}/reviews?per_page=10` : null,
  )
  const { data: shippingRes } =
    useApi<ListResponse<ApiShippingMethod>>("/shipping-methods")
  const { data: relatedRes } = useApi<ListResponse<ApiProduct>>(
    product ? `/products?category_id=${product.category_id}&per_page=5` : null,
  )

  const reviews = reviewRes?.data ?? []
  const shippingMethods = shippingRes?.data ?? []

  useEffect(() => {
    setQty(1)
    setSelectedImg(0)
  }, [productId])

  // Label "Ditambahkan!" hilang sendiri; timer dibersihkan saat unmount.
  useEffect(() => {
    if (!added) return

    const timer = setTimeout(() => setAdded(false), 2000)
    return () => clearTimeout(timer)
  }, [added])

  /* ---------- Status halaman ---------- */

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-6 text-center text-gray-500">
        Memuat produk...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-6 text-center">
        <FiBox className="text-6xl text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
          Produk tidak ditemukan
        </h1>
        <p className="text-gray-400 mb-6">
          Produk mungkin sudah tidak aktif atau tautannya salah.
        </p>
        <button
          className="bg-[#FFF7F5]0 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          onClick={() => navigate("catalog")}
        >
          Kembali ke Katalog
        </button>
      </div>
    )
  }

  /* ---------- Turunan ---------- */

  const card = toCardProduct(product)
  const {
    price,
    originalPrice,
    discount,
    rating,
    reviews: reviewCount,
    stock,
  } = card
  const images = collectImages(product)
  const selectedImage = images[selectedImg] ?? images[0] ?? null
  const related = (relatedRes?.data ?? [])
    .filter((item) => item.id !== product.id)
    .map(toCardProduct)
  const hasDiscount = discount > 0 && originalPrice > price

  // Persentase dihitung dari ulasan yang dimuat (maks. 10 terbaru).
  const starShare = (star: number) =>
    reviews.length
      ? Math.round(
          (reviews.filter((r) => r.rating === star).length / reviews.length) *
            100,
        )
      : 0

  /* ---------- Aksi ---------- */

  // `busy` mencegah klik ganda yang menambah jumlah dua kali.
  const addToCart = async (): Promise<boolean> => {
    if (busy) return false

    setBusy(true)
    try {
      return await onAddToCart({ ...card, quantity: qty })
    } finally {
      setBusy(false)
    }
  }

  const handleAddToCart = async () => {
    if (await addToCart()) setAdded(true)
  }

  const handleBuyNow = async () => {
    if (await addToCart()) navigate("cart")
  }

  /* ---------- Render ---------- */

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400 sm:mb-8 sm:text-sm">
        <button
          onClick={() => navigate("home")}
          className="text-[#DF401F] hover:underline"
        >
          Beranda
        </button>
        <FiChevronRight className="w-4 h-4" />
        <button
          onClick={() => navigate("catalog")}
          className="text-[#DF401F] hover:underline"
        >
          Katalog
        </button>
        {product.category && (
          <>
            <FiChevronRight className="w-4 h-4" />
            <button
              onClick={() =>
                navigate("catalog", { categoryId: product.category_id })
              }
              className="text-[#DF401F] hover:underline"
            >
              {product.category.name}
            </button>
          </>
        )}
        <FiChevronRight className="w-4 h-4" />
        <span className="min-w-0 break-words text-gray-800 font-semibold">
          {product.name}
        </span>
      </div>

      {/* produk */}
      <div className="mb-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
        
        {/* Galeri Produk */}
        <div className="space-y-3">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
            {selectedImage && failedImage !== selectedImage ? (
              <img
                key={selectedImage}
                src={selectedImage}
                alt={product.name}
                onError={() => setFailedImage(selectedImage)}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src="/images/logo/wicaksono_logo_1.webp"
                alt="Foto Produk Tidak Tersedia"
                className="h-90 object-contain opacity-40 p-12"
              />
            )}
          </div>

          {/* Thumbnail */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, index) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setSelectedImg(index)}
                  aria-label={`Lihat gambar ${index + 1}`}
                  aria-pressed={selectedImg === index}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-20 sm:w-20 ${
                    selectedImg === index
                      ? "border-[#DF401F]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>


        {/* Informasi Produk */}
        <div className="flex flex-col">
          {product.category && (
            <span className="mb-3 w-fit rounded-md bg-orange-50 px-3 py-1 text-xs font-medium text-[#DF401F]">
              {product.category.name}
            </span>
          )}

          <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Stars value={rating} className="h-4 w-4" />
            <span className="font-semibold text-gray-800">
              {rating.toFixed(1)}
            </span>
            <span className="text-gray-400">
              ({reviewCount} ulasan)
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              {card.sold.toLocaleString("id-ID")} terjual
            </span>
          </div>

          {/* Harga */}
          <div className="mt-6 border-y border-gray-100 py-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold tracking-tight text-[#DF401F]">
                {formatPrice(price)}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {hasDiscount && (
              <p className="mt-2 text-xs font-medium text-green-600">
                Hemat {formatPrice(originalPrice - price)}
              </p>
            )}
          </div>

          {/* Informasi Stok dan Berat */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 py-5">
            <div>
              <p className="mb-1 text-xs text-gray-400">Berat produk</p>
              <p className="text-sm font-semibold text-gray-800">
                {card.weight > 0
                  ? `${card.weight.toLocaleString("id-ID")} gram`
                  : "Belum diatur"}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Ketersediaan</p>
              <p
                className={`text-sm font-semibold ${
                  stock > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {stock > 0 ? `${stock} tersedia` : "Stok habis"}
              </p>
            </div>
          </div>

          {/* Kuantitas */}
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                Jumlah
              </span>
              <span className="text-xs text-gray-400">
                Maks. {stock}
              </span>
            </div>

            <div className="flex w-fit items-center overflow-hidden rounded-lg border border-gray-200">
              <button
                type="button"
                aria-label="Kurangi jumlah"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={stock === 0 || qty <= 1}
                className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiMinus />
              </button>

              <span className="w-12 text-center text-sm font-semibold text-gray-800">
                {qty}
              </span>

              <button
                type="button"
                aria-label="Tambah jumlah"
                onClick={() =>
                  setQty((q) => Math.min(stock, q + 1))
                }
                disabled={stock === 0 || qty >= stock}
                className="flex h-10 w-10 items-center justify-center text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stock === 0 || busy}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DF401F] px-4 text-sm font-semibold text-[#DF401F] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stock === 0 ? (
                "Stok Habis"
              ) : added ? (
                <>
                  <FiCheck />
                  Ditambahkan
                </>
              ) : (
                <>
                  <FaCartPlus className="h-4 w-4" />
                  Masukkan Keranjang
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={stock === 0 || busy}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DF401F] px-4 text-sm font-semibold text-white transition hover:bg-[#c93619] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaCartArrowDown className="h-4 w-4" />
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="mb-10">
        <div className="flex gap-1 border-b-2 border-gray-100 mb-6 flex-wrap">
          {TABS.map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? "border-orange-500 text-[#DF401F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "ulasan" ? `${label} (${reviewCount})` : label}
            </button>
          ))}
        </div>

        {activeTab === "deskripsi" && (
          <div className="max-w-3xl text-gray-600 leading-relaxed text-sm">
            {product.description || "Belum ada deskripsi untuk produk ini."}
          </div>
        )}

        {activeTab === "ulasan" && (
          <div className="max-w-3xl">
            {reviewCount > 0 && (
              <div className="flex flex-wrap gap-8 mb-8 p-6 bg-[#FFF7F5] rounded-2xl items-center">
                <div className="text-center">
                  <div className="text-5xl font-black text-[#DF401F]">
                    {rating.toFixed(1)}
                  </div>
                  <div className="flex gap-1 justify-center mt-2">
                    <Stars value={rating} className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-medium">
                    {reviewCount} ulasan
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2 min-w-[240px]">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium w-3 text-right">
                        {star}
                      </span>
                      <FiStar className="text-yellow-400 fill-current w-3 h-3" />
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${starShare(star)}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs w-8">
                        {starShare(star)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <EmptyBox>Belum ada ulasan untuk produk ini.</EmptyBox>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => {
                  const name = review.user?.name ?? "Pelanggan"

                  return (
                    <div
                      key={review.id}
                      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FFF7F5]0 text-white flex items-center justify-center font-bold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">
                              {name}
                            </div>
                            <div className="flex gap-0.5 mt-1">
                              <Stars
                                value={review.rating}
                                className="w-3 h-3"
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          {formatReviewDate(review.created_at)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "pengiriman" && (
          <div className="max-w-3xl">
            {shippingMethods.length === 0 ? (
              <EmptyBox>Belum ada metode pengiriman.</EmptyBox>
            ) : (
              <div className="flex flex-col gap-3">
                {shippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm gap-3"
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <FiTruck className="text-gray-400 w-6 h-6 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800 text-sm truncate">
                          {method.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {method.estimated_days
                            ? `Estimasi ${method.estimated_days}`
                            : method.description || "-"}
                        </div>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#DF401F] whitespace-nowrap">
                      {formatPrice(Number(method.cost ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Produk terkait */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-6">
            Produk Terkait
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                navigate={navigate}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

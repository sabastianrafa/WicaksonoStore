import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  FaSearch,
  FaStar,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
  FaTimes,
  FaCheck,
} from "react-icons/fa"

import { formatPrice } from "../../data"
import ProductCard from "../../components/ProductCard"
import { apiFetch, storageUrl } from "../../api/client"
import type { Page } from "../../App"

/* =========================================================
 * TYPES
 * ======================================================= */

interface Product {
  id: number
  name: string
  category: string
  categoryId: number
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

interface CatalogCategory {
  id: number
  slug: string
  name: string
  products_count?: number
}

interface CategoryOption {
  id: number | null
  name: string
  count: number
}

interface Filters {
  search: string
  category: number | null
  minPrice: number
  maxPrice: number
  minRating: number
  sort: string
}

interface ProductResponse {
  data?: Record<string, any>[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

interface CategoryResponse {
  data?: CatalogCategory[]
}

interface CatalogPageProps {
  navigate: (page: Page, data?: unknown) => void
  onAddToCart: (product: unknown) => void
}

/* =========================================================
 * CONSTANTS
 * ======================================================= */

const PER_PAGE = 16
const CATEGORY_PREVIEW_LIMIT = 6

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: null,
  minPrice: 0,
  maxPrice: 0,
  minRating: 0,
  sort: "terlaris",
}

const SORT_OPTIONS = [
  ["terlaris", "Terlaris"],
  ["termurah", "Harga Terendah"],
  ["termahal", "Harga Tertinggi"],
  ["rating", "Rating Tertinggi"],
  ["terbaru", "Terbaru"],
] as const

const RATING_OPTIONS = [4.5, 4, 3.5, 0] as const

/* =========================================================
 * HELPERS
 * ======================================================= */

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeProduct(item: Record<string, any>): Product {
  const primaryImage = item.images?.find((image: any) => image?.is_primary)?.url
  const firstImage = item.images?.[0]?.url
  const rawImage = primaryImage ?? firstImage ?? item.image ?? ""
  const imageUrl = typeof rawImage === "string" ? rawImage.trim() : ""

  return {
    id: toNumber(item.id),
    name: item.name ?? "",
    categoryId: toNumber(item.category_id ?? item.category?.id),
    category:
      item.category?.slug ??
      item.category?.name ??
      (typeof item.category === "string" ? item.category : "lainnya"),
    price: toNumber(item.price),
    originalPrice: toNumber(item.original_price ?? item.price),
    rating: toNumber(item.rating ?? item.average_rating),
    reviews: toNumber(item.review_count ?? item.reviews_count),
    sold: toNumber(item.sold),
    stock: toNumber(item.stock),
    weight: toNumber(item.weight),
    discount: toNumber(item.discount),
    image: imageUrl
      ? /^https?:\/\//i.test(imageUrl)
        ? imageUrl
        : storageUrl(imageUrl)
      : "",
    description: item.description ?? "",
    tags: Array.isArray(item.tags) ? item.tags : [],
  }
}

/** Nomor halaman yang ditampilkan; -1 berarti ellipsis (...). */
function getPaginationPages(current: number, last: number): number[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1)
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)

  return [
    1,
    ...(current > 4 ? [-1] : []),
    ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
    ...(current < last - 3 ? [-1] : []),
    last,
  ]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Terjadi kesalahan saat memuat data. Silakan coba lagi."
}

/* =========================================================
 * COMPONENT
 * ======================================================= */

export default function CatalogPage({
  navigate,
  onAddToCart,
}: CatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<Filters>(() => {
    const categoryId = Number(searchParams.get("kategori"))
    return {
      ...DEFAULT_FILTERS,
      category: categoryId > 0 ? categoryId : null,
    }
  })

  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [catalogMaxPrice, setCatalogMaxPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [priceLimitError, setPriceLimitError] = useState("")
  const [productError, setProductError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
    setPage(1)
  }

  const changeCategory = (category: number | null) => {
    updateFilters({ category })
    setSearchParams(category === null ? {} : { kategori: String(category) }, {
      replace: true,
    })
  }

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, maxPrice: catalogMaxPrice ?? 0 })
    setPage(1)
    setSearchParams({}, { replace: true })
    setShowAllCategories(false)
  }

  const goToPage = (target: number) => {
    if (target < 1 || target > lastPage || target === page) return
    setPage(target)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /* -------------------------------------------------------
   * FETCH PRODUCTS
   * Filtering and pagination are handled by Laravel.
   * ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false
    const { search, category, minPrice, maxPrice, minRating, sort } = filters

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
      sort,
    })

    if (search.trim()) params.set("search", search.trim())
    if (category !== null) params.set("category_id", String(category))
    if (minPrice > 0) params.set("min_price", String(minPrice))
    if (catalogMaxPrice !== null && maxPrice < catalogMaxPrice) {
      params.set("max_price", String(maxPrice))
    }
    if (minRating > 0) params.set("min_rating", String(minRating))

    setLoading(true)
    setProductError("")

    apiFetch<ProductResponse>(`/products?${params.toString()}`)
      .then((response) => {
        if (cancelled) return

        const normalizedProducts = (response.data ?? []).map(normalizeProduct)
        const responseLastPage = Math.max(
          1,
          toNumber(response.meta?.last_page, 1),
        )

        setProducts(normalizedProducts)
        setTotal(toNumber(response.meta?.total, normalizedProducts.length))
        setLastPage(responseLastPage)

        // Jika data berubah dan halaman aktif tidak lagi tersedia,
        // kembalikan ke halaman terakhir yang valid.
        if (page > responseLastPage) setPage(responseLastPage)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error("Gagal memuat produk katalog:", error)
        setProducts([])
        setTotal(0)
        setLastPage(1)
        setProductError(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, page, reloadKey, catalogMaxPrice])

  useEffect(() => {
    let cancelled = false

    setPriceLimitError("")
    apiFetch<ProductResponse>("/products?page=1&per_page=1&sort=termahal")
      .then((response) => {
        if (cancelled) return

        const highestPrice = toNumber(response.data?.[0]?.price)
        setCatalogMaxPrice(highestPrice)
        setFilters((previous) => ({
          ...previous,
          maxPrice:
            previous.maxPrice === 0
              ? highestPrice
              : Math.min(previous.maxPrice, highestPrice),
        }))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        console.error("Gagal memuat harga produk tertinggi:", error)
        setPriceLimitError(getErrorMessage(error))
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  /* -------------------------------------------------------
   * FETCH CATEGORIES
   * ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false

    apiFetch<CategoryResponse>("/categories")
      .then((response) => {
        if (!cancelled) setCategories(response.data ?? [])
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Gagal memuat kategori:", error)
        }
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  /* -------------------------------------------------------
   * DERIVED DATA
   * ----------------------------------------------------- */

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const allProductCount = categories.reduce(
      (sum, category) => sum + toNumber(category.products_count),
      0,
    )

    return [
      {
        id: null,
        name: "Semua Kategori",
        count: allProductCount,
      },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: toNumber(category.products_count),
      })),
    ]
  }, [categories])

  const selectedCategoryName = categories.find(
    (category) => category.id === filters.category,
  )?.name

  const visibleCategories = useMemo(() => {
    if (showAllCategories) return categoryOptions

    const preview = categoryOptions.slice(0, CATEGORY_PREVIEW_LIMIT)
    const selectedCategory = categoryOptions.find(
      (category) => category.id === filters.category,
    )

    // Kategori terpilih tetap terlihat meskipun berada di luar preview.
    if (
      selectedCategory &&
      !preview.some((category) => category.id === selectedCategory.id)
    ) {
      return [...preview, selectedCategory]
    }

    return preview
  }, [categoryOptions, filters.category, showAllCategories])

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.category !== null ||
    filters.minPrice !== DEFAULT_FILTERS.minPrice ||
    (catalogMaxPrice !== null && filters.maxPrice !== catalogMaxPrice) ||
    filters.minRating !== DEFAULT_FILTERS.minRating ||
    filters.sort !== DEFAULT_FILTERS.sort

  const activeFilterCount = [
    filters.search.trim() !== "",
    filters.category !== null,
    filters.minPrice !== DEFAULT_FILTERS.minPrice ||
      (catalogMaxPrice !== null && filters.maxPrice !== catalogMaxPrice),
    filters.minRating !== DEFAULT_FILTERS.minRating,
  ].filter(Boolean).length

  /* -------------------------------------------------------
   * RENDER
   * ----------------------------------------------------- */

  return (
    <div className="mx-auto box-border w-full max-w-[1280px] px-3 py-5 min-[361px]:px-4 md:px-5 md:py-6 lg:px-6 lg:py-8">
      <nav
        className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-400 lg:mb-6"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => navigate("home")}
          className="cursor-pointer border-0 bg-transparent p-0 text-primary hover:text-primary-dark"
        >
          Beranda
        </button>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-gray-800">Katalog Produk</span>
      </nav>

      <h1 className="mb-[18px] text-[1.45rem] font-extrabold text-gray-800 md:mb-6 md:text-[1.6rem] lg:text-[1.8rem]">
        Katalog Produk
      </h1>

      <div className="mb-[18px] flex flex-wrap gap-[10px] lg:mb-6 lg:gap-3">
        <div className="relative min-w-[200px] flex-1">
          <FaSearch
            aria-hidden="true"
            className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-gray-400"
          />
          <input
            type="search"
            className="min-h-[42px] w-full rounded-md border border-border bg-white py-[9px] pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Cari produk oleh-oleh..."
            aria-label="Cari produk"
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </div>

        <select
          className="min-h-[42px] w-full cursor-pointer rounded-md border border-border bg-white px-3 py-[9px] text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 lg:w-auto lg:min-w-[170px]"
          aria-label="Urutkan produk"
          value={filters.sort}
          onChange={(event) => updateFilters({ sort: event.target.value })}
        >
          {SORT_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">
        
        <aside
          className="h-fit min-w-0 rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-[88px]"
          aria-label="Filter produk"
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Filter Produk
            </h2>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="text-xs font-medium text-primary transition hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
          </div>

          {/* Kategori */}
          <section className="border-b border-gray-100 pb-5">
            <h3 className="mb-3 text-xs font-semibold text-gray-800">
              Kategori
            </h3>

            <div
              className="flex flex-col gap-1"
              aria-busy={categoryLoading}
            >
              {visibleCategories.map(({ id, name, count }) => {
                const active = filters.category === id

                return (
                  <label
                    key={id ?? "all"}
                    className="group flex cursor-pointer items-center gap-2.5 py-1.5"
                  >
                    <input
                      type="radio"
                      name="catalog-category"
                      value={id ?? "all"}
                      checked={active}
                      onChange={() => changeCategory(id)}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />

                    <span
                      className={`min-w-0 flex-1 text-xs transition ${
                        active
                          ? "font-semibold text-primary"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {name}
                    </span>

                    <span className="text-[11px] tabular-nums text-gray-400">
                      {count}
                    </span>
                  </label>
                )
              })}
            </div>

            {!categoryLoading &&
              categoryOptions.length > CATEGORY_PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAllCategories((previous) => !previous)
                  }
                  aria-expanded={showAllCategories}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition hover:text-primary-dark"
                >
                  {showAllCategories ? (
                    <>
                      Show less
                      <FaChevronUp size={10} />
                    </>
                  ) : (
                    <>
                      Show more
                      <FaChevronDown size={10} />
                    </>
                  )}
                </button>
              )}
          </section>

          {/* Harga */}
          <section className="border-b border-gray-100 py-5">
            <h3 className="mb-4 text-xs font-semibold text-gray-800">
              Rentang Harga
            </h3>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Maksimal
              </span>

              <span className="text-xs font-semibold text-gray-900">
                {formatPrice(filters.maxPrice)}
              </span>
            </div>

            {priceLimitError && (
              <div className="mb-3 text-xs text-red-500">
                <p>{priceLimitError}</p>

                <button
                  type="button"
                  onClick={() =>
                    setReloadKey((current) => current + 1)
                  }
                  className="mt-1 font-medium underline"
                >
                  Coba lagi
                </button>
              </div>
            )}

            <input
              id="catalog-max-price"
              type="range"
              min={0}
              max={catalogMaxPrice ?? 0}
              step={5000}
              value={filters.maxPrice}
              disabled={catalogMaxPrice === null || catalogMaxPrice === 0}
              onChange={(event) =>
                updateFilters({
                  minPrice: 0,
                  maxPrice: Number(event.target.value),
                })
              }
              className="w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Harga maksimal"
            />

            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>Rp 0</span>
              <span>{formatPrice(catalogMaxPrice ?? 0)}</span>
            </div>
          </section>

          {/* Rating */}
          <section className="pt-5">
            <h3 className="mb-3 text-xs font-semibold text-gray-800">
              Rating Produk
            </h3>

            <div className="flex flex-col gap-2">
              {RATING_OPTIONS.map((rating) => {
                const active = filters.minRating === rating

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      updateFilters({ minRating: rating })
                    }
                    aria-pressed={active}
                    className="flex items-center gap-2 text-left"
                  >
                    <span className="flex items-center gap-0.5 text-yellow-400">
                      {Array.from({ length: 5 }, (_, index) => (
                        <FaStar
                          key={index}
                          size={11}
                          className={
                            rating === 0 || index < Math.floor(rating)
                              ? "opacity-100"
                              : "opacity-25"
                          }
                        />
                      ))}
                    </span>

                    <span
                      className={`text-xs ${
                        active
                          ? "font-semibold text-primary"
                          : "text-gray-500"
                      }`}
                    >
                      {rating === 0 ? "Semua rating" : `${rating}+`}
                    </span>

                    {active && (
                      <span className="ml-auto text-xs text-primary">
                        <FaCheck size={11} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </aside>

        <section aria-label="Daftar produk">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-[10px]">
            <p className="m-0 text-sm text-gray-500">
              Menampilkan <strong className="text-gray-800">{total}</strong>{" "}
              produk
              {activeFilterCount > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({activeFilterCount} filter aktif)
                </span>
              )}
            </p>

            {filters.category !== null && (
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-[7px] rounded-full border-0 bg-[#FFF1ED] px-[11px] py-[5px] text-xs font-semibold text-primary"
                onClick={() => changeCategory(null)}
                title="Hapus filter kategori"
              >
                {selectedCategoryName ?? "Kategori dipilih"}
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </div>

          {loading ? (
            <div
              className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-[18px] max-[639px]:grid-cols-2 max-[639px]:gap-3 max-[360px]:gap-2"
              aria-label="Memuat produk"
            >
              {Array.from({ length: PER_PAGE }, (_, index) => (
                <div
                  className="min-h-[310px] animate-pulse rounded-[14px] border border-divider bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 max-[639px]:min-h-[260px]"
                  key={index}
                />
              ))}
            </div>
          ) : productError ? (
            <div
              className="rounded-[14px] border border-divider bg-white px-5 py-16 text-center"
              role="alert"
            >
              <div className="mb-[14px] text-5xl">⚠️</div>
              <h3 className="mb-2 mt-0 text-gray-800">Gagal memuat produk</h3>
              <p className="mb-5 mt-0 text-sm text-gray-500">{productError}</p>
              <button
                type="button"
                className="min-h-10 cursor-pointer rounded-md border border-transparent bg-primary px-6 py-[10px] text-sm font-medium text-white transition hover:bg-primary-dark"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                Coba lagi
              </button>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-[18px] max-[639px]:grid-cols-2 max-[639px]:gap-3 max-[360px]:gap-2">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    navigate={navigate}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>

              {lastPage > 1 && (
                <nav
                  className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
                  aria-label="Pagination produk"
                >
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className={`inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-lg border border-border p-0 text-gray-700 transition focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300 ${
                      page !== 1 ? "bg-white hover:bg-gray-50" : ""
                    }`}
                    aria-label="Halaman sebelumnya"
                  >
                    <FaChevronLeft aria-hidden="true" />
                  </button>

                  {getPaginationPages(page, lastPage).map(
                    (pageNumber, index) =>
                      pageNumber === -1 ? (
                        <span
                          className="inline-flex w-[30px] items-center justify-center text-gray-400"
                          key={`ellipsis-${index}`}
                        >
                          …
                        </span>
                      ) : (
                        <button
                          type="button"
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`h-[38px] w-[38px] cursor-pointer rounded-lg border font-sans transition focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary ${
                            pageNumber === page
                              ? "border-primary bg-primary font-bold text-white"
                              : "border-border bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                          aria-current={
                            pageNumber === page ? "page" : undefined
                          }
                          aria-label={`Halaman ${pageNumber}`}
                        >
                          {pageNumber}
                        </button>
                      ),
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === lastPage}
                    className={`inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-lg border border-border p-0 text-gray-700 transition focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300 ${
                      page !== lastPage ? "bg-white hover:bg-gray-50" : ""
                    }`}
                    aria-label="Halaman berikutnya"
                  >
                    <FaChevronRight aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          ) : (
            <div className="rounded-[14px] border border-divider bg-white px-5 py-16 text-center">
              <div className="mb-[14px] text-5xl">🔍</div>
              <h3 className="mb-2 mt-0 text-gray-800">
                Produk tidak ditemukan
              </h3>
              <p className="mb-5 mt-0 text-sm text-gray-400">
                Coba kata kunci lain atau ubah filter pencarian.
              </p>
              <button
                type="button"
                className="min-h-10 cursor-pointer rounded-md border border-transparent bg-primary px-6 py-[10px] text-sm font-medium text-white transition hover:bg-primary-dark"
                onClick={resetFilters}
              >
                Reset Filter
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

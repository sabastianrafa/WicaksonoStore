import { useEffect, useRef, useState } from "react"
import { apiFetch, storageUrl } from "../../api/client"
import ProductCard from "../../components/ProductCard"
import type { Page } from "../../App"

import {
  FiTruck,
  FiShoppingCart,
  FiAward,
  FiPackage,
  FiCreditCard,
  FiArrowRight,
} from "react-icons/fi"

import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"

interface HomePageProps {
  navigate: (page: Page, data?: unknown) => void
  onAddToCart: (product: Product) => void
}

/* =========================================================
   PRODUCT
========================================================= */

interface ApiProductImage {
  id: number
  product_id: number
  path: string
  alt_text?: string
  is_primary?: boolean
  sort_order?: number
  url?: string
}

interface ApiProduct {
  id: number
  category_id: number
  name: string
  slug: string
  description: string
  price: string | number
  original_price?: string | number | null
  stock: number
  weight: number
  sold: number
  rating: string | number
  review_count: number
  discount: number
  image?: string | null

  category?: {
    id: number
    name: string
  }

  images?: ApiProductImage[]
}

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

interface ProductResponse {
  success: boolean
  message: string
  data: ApiProduct[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

/* =========================================================
   CATEGORY
========================================================= */

interface ApiCategory {
  id: number
  name: string
  products_count?: number
}

interface CategoryResponse {
  success: boolean
  message: string
  data: ApiCategory[]
}

/* =========================================================
   REVIEW / TESTIMONIAL
========================================================= */

interface ApiReview {
  id: number
  rating: number
  comment: string

  // User tidak menyimpan kolom avatar; nama dipakai untuk inisial.
  user?: {
    id?: number
    name?: string
  }

  product?: {
    id?: number
    name?: string
  }

  created_at?: string
}

interface ReviewResponse {
  success: boolean
  message: string
  data: ApiReview[]
}

/* =========================================================
   STAR COMPONENT
========================================================= */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`flex text-base ${star <= Math.round(rating) ? "text-amber-600" : "text-gray-300"
            }`}
        >
          <FaStar />
        </span>
      ))}
    </span>
  )
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(product: ApiProduct): Product {
  const image =
    product.images?.find((img) => img.is_primary)?.url ??
    product.images?.[0]?.url ??
    product.image ??
    ""

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? "",
    price: Number(product.price),
    originalPrice: Number(product.original_price ?? product.price),
    rating: Number(product.rating ?? 0),
    reviews: Number(product.review_count ?? 0),
    sold: Number(product.sold ?? 0),
    stock: Number(product.stock ?? 0),
    weight: Number(product.weight ?? 0),
    discount: Number(product.discount ?? 0),

    image:
      image.startsWith("http://") || image.startsWith("https://")
        ? image
        : image
          ? storageUrl(image)
          : "",

    description: product.description ?? "",
    tags: [],
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function HomePage({ navigate, onAddToCart }: HomePageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const categoryCarouselRef = useRef<HTMLDivElement>(null)
  const promoCarouselRef = useRef<HTMLDivElement>(null)

  const [promoProducts, setPromoProducts] = useState<Product[]>([])

  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])

  const [categories, setCategories] = useState<ApiCategory[]>([])

  const [testimonials, setTestimonials] = useState<ApiReview[]>([])

  const [loadingPromo, setLoadingPromo] = useState(true)
  const [loadingRecommended, setLoadingRecommended] = useState(true)

  const [loadingCategories, setLoadingCategories] = useState(true)

  const [loadingTestimonials, setLoadingTestimonials] = useState(true)

  const scrollCategories = (direction: -1 | 1) => {
    const carousel = categoryCarouselRef.current
    if (!carousel) return

    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.8,
      behavior: "smooth",
    })
  }

  const scrollPromo = (direction: -1 | 1) => {
    const carousel = promoCarouselRef.current
    if (!carousel) return

    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.8,
      behavior: "smooth",
    })
  }

  /* =========================================================
     FETCH HOMEPAGE DATA
  ========================================================= */

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setLoadingPromo(true)
        setLoadingRecommended(true)
        setLoadingCategories(true)
        setLoadingTestimonials(true)

        /*
        | allSettled (bukan all): satu endpoint gagal tidak boleh
        | mengosongkan seluruh bagian homepage. Contohnya endpoint
        | /api/reviews sempat 404 sehingga produk, kategori, dan
        | testimonial ikut hilang bersamaan.
        */
        const [promoResult, recommendedResult, categoryResult, reviewResult] =
          await Promise.allSettled([
            apiFetch<ProductResponse>("/products?discounted=1&per_page=5"),

            apiFetch<ProductResponse>("/products?sort=terlaris&per_page=8"),

            apiFetch<CategoryResponse>("/categories"),

            apiFetch<ReviewResponse>("/reviews?per_page=3"),
          ])

        const logFailure = (
          label: string,
          result: PromiseSettledResult<unknown>,
        ) => {
          if (result.status === "rejected") {
            console.error(`Gagal memuat ${label}:`, result.reason)
          }
        }

        logFailure("produk promo", promoResult)

        if (promoResult.status === "fulfilled") {
          setPromoProducts(promoResult.value.data.map(normalizeProduct))
        }

        logFailure("produk rekomendasi", recommendedResult)

        if (recommendedResult.status === "fulfilled") {
          setRecommendedProducts(
            recommendedResult.value.data.map(normalizeProduct),
          )
        }

        logFailure("kategori", categoryResult)

        if (categoryResult.status === "fulfilled") {
          setCategories(categoryResult.value.data)
        }

        logFailure("ulasan", reviewResult)

        if (reviewResult.status === "fulfilled") {
          setTestimonials(reviewResult.value.data)
        }
      } catch (error) {
        console.error("Gagal mengambil data homepage:", error)
      } finally {
        setLoadingPromo(false)
        setLoadingRecommended(false)
        setLoadingCategories(false)
        setLoadingTestimonials(false)
      }
    }

    fetchHomepageData()
  }, [])

  return (
    <div>
      {/* =====================================================
          HERO
      ====================================================== */}


      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-gray-500 px-5 py-20 sm:px-8 md:py-24">

        {/* Background Desktop */}
        <img
          src="/images/bg-toko-1.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 hidden h-full w-full object-cover object-[center_55%] md:block"
        />
        {/* Background Mobile */}
        <img
          src="/images/bg-toko-2.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 block h-full w-full object-cover object-[center_55%] md:hidden"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950/80 via-gray-900/55 to-gray-900/30"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-[1280px]">
          <div className="fade-in max-w-[680px]">

            <p className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] text-white/85 uppercase sm:text-sm">
              <span
                className="h-px w-8 bg-[#FFD166]"
                aria-hidden="true"
              />
              Terpercaya sejak 2005
            </p>

            <h1 className="mb-5 mt-0 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.04em] text-white">
              Pusat Oleh-Oleh
              <br />
              <span className="text-[#FFD98A]">
                Khas Malang
              </span>
            </h1>

            <p className="mb-8 mt-0 max-w-[520px] text-base leading-7 text-white/80 sm:text-lg">
              Temukan berbagai pilihan oleh-oleh khas Malang dengan beragam
              produk pilihan dari Wicaksono Malang.
            </p>

            <div className="flex flex-wrap gap-3 max-[639px]:flex-col">

              <button
                type="button"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-white bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-[639px]:w-full"
                onClick={() => navigate("catalog")}
              >
                <FiShoppingCart size={17} />
                Belanja Sekarang
              </button>

              <button
                type="button"
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-white/50 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white max-[639px]:w-full"
                onClick={() =>
                  document.getElementById("promo-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
              >
                Lihat Promo
              </button>

            </div>
          </div>
        </div>
      </section>


      {/* =====================================================
          TRUST BAR
      ====================================================== */}

      <div className="border-y border-gray-200/60 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-6 px-6 py-5">
          {[
            {
              icon: <FiTruck />,
              title: "Gratis Ongkir",
              sub: "Promo khusus Area Kota Malang",
            },
            {
              icon: <FiAward />,
              title: "100% Asli Malang",
              sub: "Langsung dari produsen lokal",
            },
            {
              icon: <FiPackage />,
              title: "Pengemasan Super Aman",
              sub: "Dilengkapi Vakum & Bubble Wrap",
            },
            {
              icon: <FiCreditCard />,
              title: "Pembayaran Mudah",
              sub: "Berbagai pilihan metode bayar",
            },
          ].map(({ icon, title, sub }) => (
            <div
              key={title}
              className="flex flex-[1_1_200px] items-center gap-4"
            >
              <span className="flex text-[28px] text-primary">{icon}</span>

              <div>
                <div className="text-sm font-bold text-gray-900">{title}</div>

                <div className="text-xs text-gray-500">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          CATEGORIES - DARI BACKEND
      ====================================================== */}

      <section className="mx-auto max-w-[1280px] px-4 pt-8 pb-8 md:px-6 md:pt-16">
        <div className="mb-12 text-center">
          <span className="text-[0.85rem] font-bold tracking-wider text-primary uppercase">
            Kategori Oleh-Oleh
          </span>

          <h2 className="my-2 text-[clamp(1.5rem,4vw,2.2rem)] font-extrabold text-gray-900">
            Jelajahi Pilihan Kami
          </h2>

          <p className="mx-auto max-w-[500px] leading-relaxed text-gray-500">
            Pilih kategori favorit Anda dan temukan produk oleh-oleh khas
            Malang.
          </p>
        </div>

        {loadingCategories ? (
          <div className="p-10 text-center text-gray-500">
            Memuat kategori...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Belum ada kategori.
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex"
              aria-label="Geser kategori ke kiri"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>

            <div
              ref={categoryCarouselRef}
              className="flex min-w-0 flex-1 snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Kategori produk"
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    navigate("catalog", {
                      categoryId: category.id,
                    })
                  }
                  className="card-hover flex w-[min(72vw,220px)] shrink-0 snap-start flex-col items-center rounded-lg border border-gray-100 bg-white px-4 py-7 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="mb-[14px] text-[1.05rem] font-bold text-gray-900">
                    {category.name}
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                    {category.products_count !== undefined
                      ? `${category.products_count} Produk`
                      : "Lihat Koleksi"}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories(1)}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex"
              aria-label="Geser kategori ke kanan"
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* =====================================================
          PROMO PRODUCTS - DARI BACKEND
      ====================================================== */}

      <section
        id="promo-section"
        className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8"
      >
        <div className="mb-6 flex items-end justify-between">
          <h2 className="m-0 text-[clamp(1.3rem,3.5vw,1.8rem)] font-extrabold text-gray-900">
            🔥 Promo Spesial
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollPromo(-1)}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex"
              aria-label="Geser promo ke kiri"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollPromo(1)}
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex"
              aria-label="Geser promo ke kanan"
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={promoCarouselRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loadingPromo ? (
            <div className="w-full p-10 text-center text-gray-500">
              Memuat promo...
            </div>
          ) : promoProducts.length === 0 ? (
            <div className="w-full p-10 text-center text-gray-500">
              Belum ada produk promo.
            </div>
          ) : (
            promoProducts.map((product) => (
              <div key={product.id} className="w-[260px] shrink-0 snap-start">
                <ProductCard
                  product={product}
                  navigate={navigate}
                  onAddToCart={onAddToCart}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* =====================================================
          RECOMMENDED PRODUCTS - DARI BACKEND
      ====================================================== */}

      <section className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 text-[clamp(1.3rem,3.5vw,1.8rem)] font-extrabold text-gray-900">
            Rekomendasi Oleh-Oleh
          </h2>

          <button
            onClick={() => navigate("catalog")}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Lihat Semua Produk
            <FiArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-5">
          {loadingRecommended ? (
            <div className="col-span-full p-10 text-center text-gray-500">
              Memuat rekomendasi...
            </div>
          ) : recommendedProducts.length === 0 ? (
            <div className="col-span-full p-10 text-center text-gray-500">
              Belum ada rekomendasi produk.
            </div>
          ) : (
            recommendedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                navigate={navigate}
                onAddToCart={onAddToCart}
              />
            ))
          )}
        </div>
      </section>

      {/* =====================================================
          SHIPPING PROMO
      ====================================================== */}

      <section className="mx-auto my-10 max-w-[1280px] px-4 md:px-6">
        <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-lg border border-border bg-gray-50 p-8">
          <div className="absolute -top-[50px] right-[10%] h-[250px] w-[250px] rounded-full bg-gray-100" />

          <div className="relative z-10 max-w-[600px] text-gray-900">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-[14px] py-1.5 text-xs font-extrabold text-primary-dark">
              <FiTruck size={16} />
              <span>PROMO AREA KOTA MALANG</span>
            </div>

            <h3 className="mb-3 mt-0 text-[clamp(1.5rem,3.5vw,2rem)] font-semibold leading-[1.1]">
              Gratis Ongkir
              <br />
              Tanpa Minimum Belanja!
            </h3>

            <p className="m-0 text-[1.1rem] opacity-90">
              Nikmati fasilitas bebas biaya kirim untuk pengiriman ke wilayah
              Kota Malang.
            </p>
          </div>

          <button
            onClick={() => navigate("catalog")}
            className="relative z-10 cursor-pointer rounded-md border-0 bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Belanja Sekarang
          </button>
        </div>
      </section>

      {/* =====================================================
          TESTIMONIALS - DARI BACKEND
      ====================================================== */}

      <section className="mt-10 border-t border-border bg-white px-6 py-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 text-center">
            <h2 className="my-2 text-[clamp(1.5rem,3.5vw,2rem)] font-extrabold text-gray-900">
              Kata Pelanggan Kami
            </h2>

            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-bold">—</span>

              <span className="text-sm text-gray-500">
                Berdasarkan ulasan pelanggan
              </span>
            </div>
          </div>

          {loadingTestimonials ? (
            <div className="p-10 text-center text-gray-500">
              Memuat ulasan...
            </div>
          ) : testimonials.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Belum ada ulasan pelanggan.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`card-hover rounded-lg border border-border bg-white p-6 transition-all duration-300 ${activeTestimonial === index
                      ? "shadow-[0_12px_24px_rgba(0,0,0,0.06)]"
                      : "shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                    }`}
                  onMouseEnter={() => setActiveTestimonial(index)}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500">
                        {(testimonial.user?.name ?? "P")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <div className="text-[0.95rem] font-bold text-gray-900">
                          {testimonial.user?.name ?? "Pelanggan"}
                        </div>

                        {testimonial.product?.name && (
                          <div className="text-xs text-gray-500">
                            {testimonial.product.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <FcGoogle size={22} />
                  </div>

                  <div className="mb-3 flex gap-1">
                    <Stars rating={Number(testimonial.rating)} />
                  </div>

                  <p className="m-0 text-sm leading-relaxed text-gray-600">
                    {testimonial.comment}
                  </p>

                  {testimonial.product?.name && (
                    <div className="mt-4 text-xs font-medium text-gray-400">
                      Produk:{" "}
                      <span className="text-primary">
                        {testimonial.product.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

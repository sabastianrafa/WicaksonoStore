import { useEffect, useState } from "react";
import { apiFetch, storageUrl } from "../../api/client";
import ProductCard from "../../components/ProductCard";
import type { Page } from "../../App";

import {
  FiTruck,
  FiShoppingCart,
  FiAward,
  FiPackage,
  FiCreditCard,
  FiArrowRight,
} from "react-icons/fi";

import { FaStar } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

interface HomePageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: Product) => void;
}

/* =========================================================
   PRODUCT
========================================================= */

interface ApiProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text?: string;
  is_primary?: boolean;
  sort_order?: number;
  url?: string;
}

interface ApiProduct {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: string | number;
  original_price?: string | number | null;
  stock: number;
  sold: number;
  rating: string | number;
  review_count: number;
  discount: number;
  image?: string | null;

  category?: {
    id: number;
    name: string;
  };

  images?: ApiProductImage[];
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  discount: number;
  image: string;
  description: string;
  tags: string[];
}

interface ProductResponse {
  success: boolean;
  message: string;
  data: ApiProduct[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

/* =========================================================
   CATEGORY
========================================================= */

interface ApiCategory {
  id: number;
  name: string;
  products_count?: number;
}

interface CategoryResponse {
  success: boolean;
  message: string;
  data: ApiCategory[];
}

/* =========================================================
   REVIEW / TESTIMONIAL
========================================================= */

interface ApiReview {
  id: number;
  rating: number;
  comment: string;

  // User tidak menyimpan kolom avatar; nama dipakai untuk inisial.
  user?: {
    id?: number;
    name?: string;
  };

  product?: {
    id?: number;
    name?: string;
  };

  created_at?: string;
}

interface ReviewResponse {
  success: boolean;
  message: string;
  data: ApiReview[];
}

/* =========================================================
   STAR COMPONENT
========================================================= */

function Stars({ rating }: { rating: number }) {
  return (
    <span
      style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(rating)
              ? "star-filled"
              : "star-empty"
          }
          style={{
            fontSize: 16,
            display: "flex",
          }}
        >
          <FaStar />
        </span>
      ))}
    </span>
  );
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(product: ApiProduct): Product {
  const image =
    product.images?.find((img) => img.is_primary)?.url ??
    product.images?.[0]?.url ??
    product.image ??
    "";

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? "",
    price: Number(product.price),
    originalPrice: Number(
      product.original_price ?? product.price
    ),
    rating: Number(product.rating ?? 0),
    reviews: Number(product.review_count ?? 0),
    sold: Number(product.sold ?? 0),
    stock: Number(product.stock ?? 0),
    discount: Number(product.discount ?? 0),

    image:
      image.startsWith("http://") ||
      image.startsWith("https://")
        ? image
        : image
          ? storageUrl(image)
          : "",

    description: product.description ?? "",
    tags: [],
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function HomePage({
  navigate,
  onAddToCart,
}: HomePageProps) {
  const [activeTestimonial, setActiveTestimonial] =
    useState(0);

  const [promoProducts, setPromoProducts] = useState<Product[]>(
    []
  );

  const [recommendedProducts, setRecommendedProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] = useState<ApiCategory[]>(
    []
  );

  const [testimonials, setTestimonials] = useState<ApiReview[]>(
    []
  );

  const [loadingPromo, setLoadingPromo] = useState(true);
  const [loadingRecommended, setLoadingRecommended] =
    useState(true);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loadingTestimonials, setLoadingTestimonials] =
    useState(true);

  /* =========================================================
     FETCH HOMEPAGE DATA
  ========================================================= */

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setLoadingPromo(true);
        setLoadingRecommended(true);
        setLoadingCategories(true);
        setLoadingTestimonials(true);

        /*
        | allSettled (bukan all): satu endpoint gagal tidak boleh
        | mengosongkan seluruh bagian homepage. Contohnya endpoint
        | /api/reviews sempat 404 sehingga produk, kategori, dan
        | testimonial ikut hilang bersamaan.
        */
        const [
          promoResult,
          recommendedResult,
          categoryResult,
          reviewResult,
        ] = await Promise.allSettled([
          apiFetch<ProductResponse>(
            "/products?discounted=1&per_page=5"
          ),

          apiFetch<ProductResponse>(
            "/products?sort=terlaris&per_page=8"
          ),

          apiFetch<CategoryResponse>(
            "/categories"
          ),

          apiFetch<ReviewResponse>(
            "/reviews?per_page=3"
          ),
        ]);

        const logFailure = (
          label: string,
          result: PromiseSettledResult<unknown>
        ) => {
          if (result.status === "rejected") {
            console.error(
              `Gagal memuat ${label}:`,
              result.reason
            );
          }
        };

        logFailure("produk promo", promoResult);

        if (
          promoResult.status === "fulfilled"
        ) {
          setPromoProducts(
            promoResult.value.data.map(
              normalizeProduct
            )
          );
        }

        logFailure(
          "produk rekomendasi",
          recommendedResult
        );

        if (
          recommendedResult.status ===
          "fulfilled"
        ) {
          setRecommendedProducts(
            recommendedResult.value.data.map(
              normalizeProduct
            )
          );
        }

        logFailure("kategori", categoryResult);

        if (
          categoryResult.status === "fulfilled"
        ) {
          setCategories(categoryResult.value.data);
        }

        logFailure("ulasan", reviewResult);

        if (
          reviewResult.status === "fulfilled"
        ) {
          setTestimonials(reviewResult.value.data);
        }
      } catch (error) {
        console.error(
          "Gagal mengambil data homepage:",
          error
        );
      } finally {
        setLoadingPromo(false);
        setLoadingRecommended(false);
        setLoadingCategories(false);
        setLoadingTestimonials(false);
      }
    };

    fetchHomepageData();
  }, []);

  return (
    <div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .hero-section {
          background-image:
            linear-gradient(
              135deg,
              rgba(17, 24, 39, 0.72),
              rgba(17, 24, 39, 0.38)
            ),
            url("/images/gambar.jpg");
          background-position: center 55%;
          background-size: cover;
          min-height: 480px;
          padding: 88px 24px;
          position: relative;
          overflow: hidden;
        }

        .hero-container {
          max-width: 1280px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          align-items: center;
          text-align: center;
        }

        .hero-text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 760px;
          margin: 0 auto;
        }

        .hero-actions {
          justify-content: center;
        }

        @media (max-width: 992px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-section {
            min-height: 420px;
            padding: 72px 20px 56px;
          }
        }

        @media (max-width: 576px) {
          .hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .hero-actions button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-grid">
            {/* LEFT */}
            <div className="hero-text-wrapper fade-in">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.14)",
                  borderRadius: 100,
                  padding: "8px 16px",
                  marginBottom: 24,
                  border:
                    "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "white",
                  }}
                />

                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color:
                      "white",
                    letterSpacing: "0.5px",
                  }}
                >
                  Terpercaya sejak 2005
                </span>
              </div>

              <h1
                style={{
                  fontSize:
                    "clamp(2.4rem, 5vw, 4.2rem)",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1.1,
                  margin: "0 0 24px",
                  letterSpacing: "-1.5px",
                }}
              >
                Pusat Oleh-Oleh
                <br />

                <span
                  style={{
                    color:
                      "#FFD166",
                    display: "inline-block",
                    padding: "0 4px",
                  }}
                >
                  Khas Malang
                </span>
              </h1>

              <p
                style={{
                  fontSize:
                    "clamp(1rem, 1.5vw, 1.15rem)",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.7,
                  margin: "0 0 36px",
                  maxWidth: 480,
                }}
              >
                Temukan berbagai pilihan
                oleh-oleh khas Malang dengan
                beragam produk pilihan dari
                Wicaksono Malang.
              </p>

              <div
                className="hero-actions"
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                <button
                  className="btn-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: "1rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onClick={() =>
                    navigate("catalog")
                  }
                >
                  <FiShoppingCart size={18} />
                  Belanja Sekarang
                </button>

                <button
                  className="btn-outline"
                  style={{
                    padding: "14px 28px",
                    fontSize: "1rem",
                    color: "white",
                    borderColor: "rgba(255,255,255,0.8)",
                  }}
                  onClick={() =>
                    document
                      .getElementById(
                        "promo-section"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  Lihat Promo
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          TRUST BAR
      ====================================================== */}

      <div
        style={{
          background: "white",
          borderBottom:
            "1px solid rgba(0,0,0,0.06)",
          borderTop:
            "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flex: "1 1 200px",
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  color:
                    "var(--color-primary)",
                  display: "flex",
                }}
              >
                {icon}
              </span>

              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--color-text)",
                  }}
                >
                  {title}
                </div>

                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6B7280",
                  }}
                >
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          CATEGORIES - DARI BACKEND
      ====================================================== */}

      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "64px 24px 32px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Kategori Oleh-Oleh
          </span>

          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: "8px 0 12px",
            }}
          >
            Jelajahi Pilihan Kami
          </h2>

          <p
            style={{
              color: "#6B7280",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Pilih kategori favorit Anda dan
            temukan produk oleh-oleh khas
            Malang.
          </p>
        </div>

        {loadingCategories ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "#6B7280",
            }}
          >
            Memuat kategori...
          </div>
        ) : categories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "#6B7280",
            }}
          >
            Belum ada kategori.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 20,
            }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  navigate("catalog", {
                    categoryId: category.id,
                  })
                }
                className="card-hover"
                style={{
                  background: "white",
                  border: "1px solid #F3F4F6",
                  borderRadius:
                    "var(--radius-card)",
                  padding: "28px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow:
                    "0 2px 12px rgba(0,0,0,0.02)",
                  outline: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "var(--color-text)",
                    marginBottom: 14,
                  }}
                >
                  {category.name}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6B7280",
                    fontWeight: 500,
                    background: "#F3F4F6",
                    padding: "4px 12px",
                    borderRadius: 100,
                  }}
                >
                  {category.products_count !==
                  undefined
                    ? `${category.products_count} Produk`
                    : "Lihat Koleksi"}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          PROMO PRODUCTS - DARI BACKEND
      ====================================================== */}

      <section
        id="promo-section"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            🔥 Promo Spesial
          </h2>
        </div>

        <div
          className="hide-scrollbar"
          style={{
            display: "flex",
            gap: 20,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 16,
          }}
        >
          {loadingPromo ? (
            <div
              style={{
                width: "100%",
                padding: 40,
                textAlign: "center",
                color: "#6B7280",
              }}
            >
              Memuat promo...
            </div>
          ) : promoProducts.length === 0 ? (
            <div
              style={{
                width: "100%",
                padding: 40,
                textAlign: "center",
                color: "#6B7280",
              }}
            >
              Belum ada produk promo.
            </div>
          ) : (
            promoProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  minWidth: 260,
                  flex: "0 0 auto",
                  scrollSnapAlign: "start",
                }}
              >
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

      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Rekomendasi Oleh-Oleh
          </h2>

          <button
            onClick={() =>
              navigate("catalog")
            }
            className="btn-outline"
            style={{
              padding: "8px 16px",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Lihat Semua Produk
            <FiArrowRight size={16} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {loadingRecommended ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 40,
                textAlign: "center",
                color: "#6B7280",
              }}
            >
              Memuat rekomendasi...
            </div>
          ) : recommendedProducts.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: 40,
                textAlign: "center",
                color: "#6B7280",
              }}
            >
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

      <section
        style={{
          maxWidth: 1280,
          margin: "40px auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            borderRadius: 20,
            padding: 48,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 32,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -50,
              right: "10%",
              width: 250,
              height: 250,
              borderRadius: "50%",
              background:
                "rgba(255,255,255,0.1)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              color: "white",
              maxWidth: 600,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "white",
                color:
                  "var(--color-primary-dark)",
                fontSize: "0.8rem",
                fontWeight: 800,
                padding: "6px 14px",
                borderRadius: 100,
                marginBottom: 16,
              }}
            >
              <FiTruck size={16} />
              <span>PROMO AREA KOTA MALANG</span>
            </div>

            <h3
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                margin: "0 0 12px",
                lineHeight: 1.1,
              }}
            >
              Gratis Ongkir
              <br />
              Tanpa Minimum Belanja!
            </h3>

            <p
              style={{
                fontSize: "1.1rem",
                margin: 0,
                opacity: 0.9,
              }}
            >
              Nikmati fasilitas bebas biaya
              kirim untuk pengiriman ke
              wilayah Kota Malang.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("catalog")
            }
            style={{
              background: "white",
              color:
                "var(--color-primary-dark)",
              border: "none",
              borderRadius: 12,
              padding: "16px 32px",
              fontSize: "1.1rem",
              fontWeight: 800,
              cursor: "pointer",
              zIndex: 1,
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            Belanja Sekarang
          </button>
        </div>
      </section>

      {/* =====================================================
          TESTIMONIALS - DARI BACKEND
      ====================================================== */}

      <section
        style={{
          background: "white",
          padding: "64px 24px",
          marginTop: 40,
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--color-text)",
                margin: "8px 0",
              }}
            >
              Kata Pelanggan Kami
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                —
              </span>

              <span
                style={{
                  color: "#6B7280",
                  fontSize: "0.9rem",
                }}
              >
                Berdasarkan ulasan pelanggan
              </span>
            </div>
          </div>

          {loadingTestimonials ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#6B7280",
              }}
            >
              Memuat ulasan...
            </div>
          ) : testimonials.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#6B7280",
              }}
            >
              Belum ada ulasan pelanggan.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {testimonials.map(
                (testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className="card-hover"
                    style={{
                      background:
                        "var(--color-bg)",
                      borderRadius:
                        "var(--radius-card)",
                      padding: 24,
                      border:
                        "1px solid #E5E7EB",
                      boxShadow:
                        activeTestimonial ===
                        index
                          ? "0 12px 24px rgba(0,0,0,0.06)"
                          : "0 2px 4px rgba(0,0,0,0.02)",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={() =>
                      setActiveTestimonial(
                        index
                      )
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius:
                              "50%",
                            background:
                              "#F3F4F6",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontWeight: 700,
                            color:
                              "#6B7280",
                            flexShrink: 0,
                          }}
                        >
                          {(testimonial.user
                            ?.name ?? "P")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color:
                                "var(--color-text)",
                              fontSize:
                                "0.95rem",
                            }}
                          >
                            {testimonial.user
                              ?.name ??
                              "Pelanggan"}
                          </div>

                          {testimonial.product
                            ?.name && (
                            <div
                              style={{
                                fontSize:
                                  "0.75rem",
                                color:
                                  "#6B7280",
                              }}
                            >
                              {testimonial
                                .product
                                .name}
                            </div>
                          )}
                        </div>
                      </div>

                      <FcGoogle size={22} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginBottom: 12,
                      }}
                    >
                      <Stars
                        rating={Number(
                          testimonial.rating
                        )}
                      />
                    </div>

                    <p
                      style={{
                        color: "#4B5563",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {testimonial.comment}
                    </p>

                    {testimonial.product
                      ?.name && (
                      <div
                        style={{
                          fontSize:
                            "0.75rem",
                          color: "#9CA3AF",
                          marginTop: 16,
                          fontWeight: 500,
                        }}
                      >
                        Produk:{" "}
                        <span
                          style={{
                            color:
                              "var(--color-primary)",
                          }}
                        >
                          {
                            testimonial
                              .product.name
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
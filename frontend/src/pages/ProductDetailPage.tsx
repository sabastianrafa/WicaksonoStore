import { useEffect, useState } from "react";
import { getProduct, getProducts, formatPrice } from "../api/products";
import type { Product } from "../api/products";
import ProductCard from "../components/ProductCard";
import type { Page } from "../App";

interface ProductDetailPageProps {
  product: Product;
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: Product & { quantity: number }) => void;
}

// dummy
const mockReviews = [
  {
    name: "Ahmad F.",
    rating: 5,
    date: "28 Jul 2026",
    comment:
      "Produknya sesuai deskripsi, kemasan aman, dan rasanya enak. Recommended!",
  },
  {
    name: "Budi S.",
    rating: 4,
    date: "15 Jul 2026",
    comment:
      "Kualitas bagus, pengiriman cepat. Hanya sedikit terlambat tapi overall puas.",
  },
  {
    name: "Dewi L.",
    rating: 5,
    date: "3 Jul 2026",
    comment:
      "Saya sering beli di sini, selalu memuaskan. Pelayanan ramah dan profesional.",
  },
];

export default function ProductDetailPage({
  product,
  navigate,
  onAddToCart,
}: ProductDetailPageProps) {
  // =========================================================
  // STATE
  // =========================================================

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [activeTab, setActiveTab] = useState("deskripsi");
  const [added, setAdded] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // =========================================================
  // LOAD DETAIL PRODUCT
  // =========================================================

  async function loadProductDetail() {
    try {
      setLoadingProduct(true);
      setProductError(null);

      const data = await getProduct(product.id);

      setDetailProduct(data);

      // Reset quantity ketika membuka produk baru
      setQty(1);

      // Reset gambar
      setSelectedImg(0);
    } catch (error) {
      console.error("Gagal mengambil detail produk:", error);

      setDetailProduct(null);

      setProductError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil detail produk.",
      );
    } finally {
      setLoadingProduct(false);
    }
  }

  useEffect(() => {
    loadProductDetail();
  }, [product.id]);

  // =========================================================
  // LOAD RELATED PRODUCTS
  // =========================================================

  useEffect(() => {
    if (!detailProduct) {
      return;
    }

    // Simpan sebagai Product yang sudah dipastikan tidak null
    const currentProduct = detailProduct;

    async function loadRelatedProducts() {
      try {
        setLoadingRelated(true);

        const products = await getProducts();

        const related = products
          .filter(
            (p) =>
              p.id !== currentProduct.id &&
              p.categoryId === currentProduct.categoryId,
          )
          .slice(0, 4);

        setRelatedProducts(related);
      } catch (error) {
        console.error("Gagal mengambil produk terkait:", error);

        setRelatedProducts([]);
      } finally {
        setLoadingRelated(false);
      }
    }

    loadRelatedProducts();
  }, [detailProduct]);

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loadingProduct) {
    return (
      <div
        style={{
          minHeight: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
        }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "4px solid #F3F4F6",
            borderTopColor: "#F97316",
            borderRadius: "50%",
            animation: "productDetailSpin 1s linear infinite",
          }}
        />

        <h2
          style={{
            margin: "18px 0 6px",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#374151",
          }}>
          Memuat detail produk...
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "#9CA3AF",
          }}>
          Mohon tunggu sebentar
        </p>

        <style>
          {`
            @keyframes productDetailSpin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (productError || !detailProduct) {
    return (
      <div
        style={{
          minHeight: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
        }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#FEF2F2",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            marginBottom: 16,
          }}>
          !
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#1F2937",
          }}>
          Gagal Memuat Produk
        </h2>

        <p
          style={{
            maxWidth: 420,
            margin: "0 0 24px",
            color: "#6B7280",
            fontSize: "0.9rem",
            lineHeight: 1.6,
          }}>
          {productError || "Data produk tidak ditemukan."}
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
          <button
            type="button"
            onClick={loadProductDetail}
            className="btn-primary"
            style={{
              padding: "12px 20px",
              border: "none",
              cursor: "pointer",
            }}>
            Coba Lagi
          </button>

          <button
            type="button"
            onClick={() => navigate("catalog")}
            className="btn-outline"
            style={{
              padding: "12px 20px",
              cursor: "pointer",
            }}>
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // CURRENT PRODUCT
  // =========================================================

  const currentProduct = detailProduct;

  // =========================================================
  // IMAGE
  // =========================================================

  const extraImages = currentProduct.image ? [currentProduct.image] : [];
  const DEFAULT_PRODUCT_IMAGE =
    "../../public/images/logo/wicaksono_logo_1.webp";

  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart = () => {
    if (currentProduct.stock <= 0) {
      return;
    }

    onAddToCart({
      ...currentProduct,
      quantity: qty,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  // =========================================================
  // QUANTITY
  // =========================================================

  const decreaseQty = () => {
    setQty((current) => Math.max(1, current - 1));
  };

  const increaseQty = () => {
    setQty((current) => Math.min(currentProduct.stock, current + 1));
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 24px",
      }}>
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 28,
          fontSize: "0.8rem",
          color: "#9CA3AF",
          flexWrap: "wrap",
        }}>
        <button
          type="button"
          onClick={() => navigate("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#F97316",
            fontFamily: "Poppins",
            fontSize: "0.8rem",
          }}>
          Beranda
        </button>

        <span>/</span>

        <button
          type="button"
          onClick={() => navigate("catalog")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#F97316",
            fontFamily: "Poppins",
            fontSize: "0.8rem",
          }}>
          Katalog
        </button>

        <span>/</span>

        <span
          style={{
            color: "#1F2937",
            fontWeight: 600,
          }}>
          {currentProduct.name}
        </span>
      </div>

      {/* =====================================================
          PRODUCT MAIN
      ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 48,
          marginBottom: 48,
        }}>
        {/* ===================================================
            IMAGE GALLERY
        =================================================== */}

        <div>
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 12,
              background: "#FFF8F0",
              aspectRatio: "1",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}>
            {extraImages.length > 0 && extraImages[selectedImg] ? (
              <img
                src={extraImages[selectedImg] || DEFAULT_PRODUCT_IMAGE}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "opacity 0.3s",
                }}
                onError={(e) => {
                  const img = e.currentTarget;

                  // Hindari infinite loop ketika default image juga gagal
                  if (!img.src.endsWith(DEFAULT_PRODUCT_IMAGE)) {
                    img.src = DEFAULT_PRODUCT_IMAGE;

                    // Style khusus untuk gambar default
                    Object.assign(img.style, {
                      objectFit: "contain",
                      padding: "24px",
                      backgroundColor: "#FFF8F0",
                    });
                  }
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                  fontSize: "0.9rem",
                }}>
                Gambar tidak tersedia
              </div>
            )}
          </div>

          {/* Thumbnail */}

          {extraImages.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
              }}>
              {extraImages.map((img, i) => (
                <button
                  type="button"
                  key={`${img}-${i}`}
                  onClick={() => setSelectedImg(i)}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: `2px solid ${
                      selectedImg === i ? "#F97316" : "transparent"
                    }`,
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow:
                      selectedImg === i
                        ? "0 4px 12px rgba(249,115,22,0.25)"
                        : "none",
                    transition: "border-color 0.2s",
                  }}>
                  <img
                    src={product.image || DEFAULT_PRODUCT_IMAGE}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "opacity 0.3s ease",
                    }}
                    onError={(e) => {
                      const img = e.currentTarget;

                      if (!img.dataset.fallback) {
                        img.dataset.fallback = "true";

                        img.src = DEFAULT_PRODUCT_IMAGE;

                        Object.assign(img.style, {
                          objectFit: "contain",
                          width: "100%",
                          height: "100%",
                          padding: "20px",
                        });
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================
            PRODUCT INFO
        =================================================== */}

        <div>
          {/* Category + Tags */}

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}>
            <span
              style={{
                background: "rgba(249,115,22,0.1)",
                color: "#F97316",
                borderRadius: 100,
                padding: "4px 12px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "capitalize",
              }}>
              {currentProduct.category}
            </span>

            {(currentProduct.tags ?? []).map((tag) => (
              <span
                key={tag}
                style={{
                  background: "#F3F4F6",
                  color: "#6B7280",
                  borderRadius: 100,
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Product name */}

          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#1F2937",
              margin: "0 0 12px",
              lineHeight: 1.3,
            }}>
            {currentProduct.name}
          </h1>

          {/* Rating */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}>
            <div
              style={{
                display: "flex",
                gap: 2,
              }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={
                    i <= Math.round(currentProduct.rating)
                      ? "star-filled"
                      : "star-empty"
                  }
                  style={{
                    fontSize: 16,
                  }}>
                  ★
                </span>
              ))}
            </div>

            <span
              style={{
                fontWeight: 600,
                color: "#1F2937",
                fontSize: "0.9rem",
              }}>
              {currentProduct.rating}
            </span>

            <span
              style={{
                color: "#9CA3AF",
                fontSize: "0.85rem",
              }}>
              ({currentProduct.reviews} ulasan)
            </span>

            <span
              style={{
                color: "#9CA3AF",
                fontSize: "0.85rem",
              }}>
              · {Number(currentProduct.sold ?? 0).toLocaleString("id-ID")}{" "}
              terjual
            </span>
          </div>

          {/* Price */}

          <div
            style={{
              background: "linear-gradient(135deg, #FFF8F0, #FEFCE8)",
              borderRadius: 14,
              padding: "20px",
              marginBottom: 24,
              border: "1px solid rgba(249,115,22,0.15)",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                flexWrap: "wrap",
              }}>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color: "#F97316",
                }}>
                {formatPrice(Number(currentProduct.price ?? 0))}
              </span>

              {currentProduct.discount > 0 && (
                <>
                  <span
                    style={{
                      color: "#9CA3AF",
                      textDecoration: "line-through",
                      fontSize: "1.1rem",
                    }}>
                    {formatPrice(
                      Number(
                        currentProduct.originalPrice ??
                          currentProduct.price ??
                          0,
                      ),
                    )}
                  </span>

                  <span
                    style={{
                      background: "#F97316",
                      color: "white",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}>
                    -{currentProduct.discount}%
                  </span>
                </>
              )}
            </div>

            {currentProduct.discount > 0 && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "0.8rem",
                  color: "#16A34A",
                  fontWeight: 600,
                }}>
                Hemat{" "}
                {formatPrice(
                  Math.max(
                    0,
                    Number(
                      currentProduct.originalPrice ?? currentProduct.price ?? 0,
                    ) - Number(currentProduct.price ?? 0),
                  ),
                )}
                !
              </p>
            )}
          </div>

          {/* Stock */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: currentProduct.stock > 0 ? "#16A34A" : "#DC2626",
              }}
            />

            <span
              style={{
                fontSize: "0.85rem",
                color: currentProduct.stock > 0 ? "#16A34A" : "#DC2626",
                fontWeight: 600,
              }}>
              {currentProduct.stock > 0
                ? `Stok tersedia (${currentProduct.stock} unit)`
                : "Stok habis"}
            </span>
          </div>

          {/* Quantity */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}>
            <span
              style={{
                fontWeight: 600,
                color: "#374151",
                fontSize: "0.9rem",
              }}>
              Jumlah:
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1.5px solid #E5E7EB",
                borderRadius: 10,
                overflow: "hidden",
              }}>
              <button
                type="button"
                onClick={decreaseQty}
                disabled={qty <= 1}
                style={{
                  width: 40,
                  height: 40,
                  border: "none",
                  background: qty <= 1 ? "#F3F4F6" : "#F9FAFB",
                  cursor: qty <= 1 ? "not-allowed" : "pointer",
                  fontSize: 18,
                  color: "#374151",
                  fontFamily: "Poppins",
                }}>
                −
              </button>

              <span
                style={{
                  width: 48,
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#1F2937",
                }}>
                {qty}
              </span>

              <button
                type="button"
                onClick={increaseQty}
                disabled={
                  currentProduct.stock <= 0 || qty >= currentProduct.stock
                }
                style={{
                  width: 40,
                  height: 40,
                  border: "none",
                  background:
                    currentProduct.stock <= 0 || qty >= currentProduct.stock
                      ? "#F3F4F6"
                      : "#F9FAFB",
                  cursor:
                    currentProduct.stock <= 0 || qty >= currentProduct.stock
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 18,
                  color: "#374151",
                  fontFamily: "Poppins",
                }}>
                +
              </button>
            </div>

            <span
              style={{
                color: "#9CA3AF",
                fontSize: "0.8rem",
              }}>
              Maks. {currentProduct.stock}
            </span>
          </div>

          {/* Buttons */}

          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 24,
            }}>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={currentProduct.stock <= 0}
              className="btn-outline"
              style={{
                flex: 1,
                padding: "14px",
                cursor: currentProduct.stock <= 0 ? "not-allowed" : "pointer",
                opacity: currentProduct.stock <= 0 ? 0.5 : 1,
              }}>
              {added ? "✓ Ditambahkan!" : "🛒 Tambah ke Keranjang"}
            </button>

            <button
              type="button"
              onClick={() => navigate("checkout")}
              disabled={currentProduct.stock <= 0}
              className="btn-primary"
              style={{
                flex: 1,
                padding: "14px",
                cursor: currentProduct.stock <= 0 ? "not-allowed" : "pointer",
                opacity: currentProduct.stock <= 0 ? 0.5 : 1,
              }}>
              ⚡ Beli Sekarang
            </button>
          </div>

          {/* Info */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "16px",
              background: "#F9FAFB",
              borderRadius: 12,
            }}>
            {[
              {
                icon: "🚚",
                text: "Gratis ongkir min. Rp 100.000 · Estimasi tiba 2-3 hari",
              },
              {
                icon: "✅",
                text: "Produk bersertifikat BPOM & Halal MUI",
              },
              {
                icon: "🔄",
                text: "Garansi pengembalian 7 hari jika rusak",
              },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}>
                <span>{icon}</span>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#4B5563",
                  }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <div
        style={{
          marginBottom: 40,
        }}>
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "2px solid #F3F4F6",
            marginBottom: 24,
          }}>
          {["deskripsi", "ulasan", "pengiriman"].map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                border: "none",
                background: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid #F97316"
                    : "2px solid transparent",
                color: activeTab === tab ? "#F97316" : "#6B7280",
                fontFamily: "Poppins",
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                marginBottom: -2,
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}>
              {tab === "deskripsi"
                ? "Deskripsi"
                : tab === "ulasan"
                  ? `Ulasan (${currentProduct.reviews})`
                  : "Pengiriman"}
            </button>
          ))}
        </div>

        {/* ===================================================
            DESKRIPSI
        =================================================== */}

        {activeTab === "deskripsi" && (
          <div
            style={{
              maxWidth: 720,
            }}>
            <p
              style={{
                color: "#4B5563",
                lineHeight: 1.8,
                margin: 0,
                fontSize: "0.95rem",
              }}>
              {currentProduct.description || "Tidak ada deskripsi produk."}
            </p>
          </div>
        )}

        {/* ===================================================
            ULASAN
        =================================================== */}

        {activeTab === "ulasan" && (
          <div
            style={{
              maxWidth: 720,
            }}>
            <div
              style={{
                display: "flex",
                gap: 32,
                marginBottom: 32,
                padding: "20px",
                background: "#FFF8F0",
                borderRadius: 14,
              }}>
              <div
                style={{
                  textAlign: "center",
                }}>
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: 900,
                    color: "#F97316",
                  }}>
                  {currentProduct.rating}
                </div>

                <div
                  style={{
                    color: "#FACC15",
                    fontSize: 20,
                  }}>
                  {"★".repeat(5)}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#9CA3AF",
                    marginTop: 4,
                  }}>
                  {currentProduct.reviews} ulasan
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  justifyContent: "center",
                }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const percentage = [78, 15, 5, 1, 1][5 - star];

                  return (
                    <div
                      key={star}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#6B7280",
                          minWidth: 16,
                        }}>
                        {star}
                      </span>

                      <span
                        style={{
                          color: "#FACC15",
                          fontSize: 12,
                        }}>
                        ★
                      </span>

                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "#F3F4F6",
                          borderRadius: 100,
                          overflow: "hidden",
                        }}>
                        <div
                          style={{
                            height: "100%",
                            background: "#FACC15",
                            borderRadius: 100,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9CA3AF",
                        }}>
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
              {mockReviews.map((review, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    padding: "20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "#F97316",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}>
                        {review.name[0]}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "#1F2937",
                          }}>
                          {review.name}
                        </div>

                        <div
                          style={{
                            color: "#FACC15",
                            fontSize: 12,
                          }}>
                          {"★".repeat(review.rating)}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#9CA3AF",
                      }}>
                      {review.date}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      color: "#4B5563",
                      lineHeight: 1.6,
                    }}>
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================
            PENGIRIMAN
        =================================================== */}

        {activeTab === "pengiriman" && (
          <div
            style={{
              maxWidth: 720,
            }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              {[
                {
                  label: "JNE Regular",
                  time: "3-5 hari",
                  price: "Rp 15.000",
                  icon: "📦",
                },
                {
                  label: "JNE Express",
                  time: "1-2 hari",
                  price: "Rp 25.000",
                  icon: "⚡",
                },
                {
                  label: "SiCepat Reguler",
                  time: "2-4 hari",
                  price: "Rp 12.000",
                  icon: "🚀",
                },
                {
                  label: "J&T Express",
                  time: "2-3 hari",
                  price: "Rp 14.000",
                  icon: "🏃",
                },
              ].map(({ label, time, price, icon }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "white",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                    }}>
                    <span
                      style={{
                        fontSize: 20,
                      }}>
                      {icon}
                    </span>

                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#1F2937",
                          fontSize: "0.875rem",
                        }}>
                        {label}
                      </div>

                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#9CA3AF",
                        }}>
                        Estimasi {time}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontWeight: 700,
                      color: "#F97316",
                    }}>
                    {price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          RELATED PRODUCTS
      ===================================================== */}

      {loadingRelated && (
        <div
          style={{
            padding: "30px 0",
            textAlign: "center",
            color: "#9CA3AF",
            fontSize: "0.9rem",
          }}>
          Memuat produk terkait...
        </div>
      )}

      {!loadingRelated && relatedProducts.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "#1F2937",
              margin: "0 0 24px",
            }}>
            Produk Terkait
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}>
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                navigate={navigate}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

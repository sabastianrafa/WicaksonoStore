import { useEffect, useState } from 'react';
import { formatPrice } from '../data';
import { apiFetch, storageUrl } from '../api/client';
import type { Page } from "../App";

interface CartProduct {
  id: number;
  name: string;
  price: string | number;
  stock: number;
  category?: {
    id: number;
    name: string;
  };
  images?: {
    id: number;
    path: string;
    url?: string;
    is_primary?: boolean;
  }[];
  image?: string | null;
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: CartProduct;
}

interface CartData {
  id: number;
  user_id: number;
  items: CartItem[];
  total_items: number;
  subtotal: number;
}

interface CartResponse {
  success: boolean;
  message: string;
  data: CartData;
}

interface CartItemResponse {
  success: boolean;
  message: string;
  data: CartItem;
}

interface CartActionResponse {
  success: boolean;
  message: string;
}

/**
 * Mengambil URL gambar produk.
 */
const getProductImage = (item: CartItem) => {
  const product = item.product;

  if (!product) {
    return '';
  }

  const imageUrl =
    product.images?.find((img) => img.is_primary)?.url ??
    product.images?.[0]?.url ??
    product.image ??
    '';

  if (!imageUrl) {
    return '';
  }

  return imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
    ? imageUrl
    : storageUrl(imageUrl);
};

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  icon: string | null;
  is_active: boolean;
}

interface CartPageProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  navigate: (page: Page) => void;
}

export default function CartPage({
  cart,
  setCart,
  navigate,
}: CartPageProps) {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  /*
  | Metode pembayaran dikelola admin lewat /api/payment-methods.
  | Daftar di bawah sebelumnya hardcoded (VISA, BCA, ...), jadi bisa
  | tidak cocok dengan konfigurasi toko yang sebenarnya.
  */
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>([]);

  /*
  |--------------------------------------------------------------------------
  | LOAD CART DARI BACKEND
  |--------------------------------------------------------------------------
  */

  const loadCart = async () => {
    try {
      setError("");

      const response =
        await apiFetch<CartResponse>("/cart");

      setCart(response.data.items);
    } catch (error) {
      console.error(
        "Gagal mengambil keranjang:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data keranjang."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  /*
  | Method pembayaran bersifat publik (tanpa auth), jadi kegagalan
  | tidak boleh memblokir halaman keranjang.
  */
  useEffect(() => {
    let active = true;

    const loadPaymentMethods = async () => {
      try {
        const response =
          await apiFetch<{
            data?: PaymentMethod[];
          }>("/payment-methods");

        if (active) {
          setPaymentMethods(response.data ?? []);
        }
      } catch (err) {
        console.error(
          "Gagal memuat metode pembayaran:",
          err
        );
      }
    };

    loadPaymentMethods();

    return () => {
      active = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE QUANTITY
  |--------------------------------------------------------------------------
  */

  const updateQty = async (
    item: CartItem,
    quantity: number
  ) => {
    // Jika quantity menjadi 0,
    // hapus item melalui endpoint DELETE.
    if (quantity <= 0) {
      await removeItem(item.id);
      return;
    }

    try {
      setUpdatingId(item.id);
      setError("");

      const response =
        await apiFetch<CartItemResponse>(
          `/cart/items/${item.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              quantity,
            }),
          }
        );

      // Update item di state frontend
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? response.data
            : cartItem
        )
      );
    } catch (error) {
      console.error(
        "Gagal memperbarui quantity:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui jumlah produk."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE ITEM
  |--------------------------------------------------------------------------
  */

  const removeItem = async (itemId: number) => {
    try {
      setUpdatingId(itemId);
      setError("");

      await apiFetch<CartActionResponse>(
        `/cart/items/${itemId}`,
        {
          method: "DELETE",
        }
      );

      setCart(
        cart.filter(
          (item) => item.id !== itemId
        )
      );
    } catch (error) {
      console.error(
        "Gagal menghapus item:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal menghapus produk."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR CART
  |--------------------------------------------------------------------------
  */

  const clearCart = async () => {
    if (validItems.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await apiFetch<CartActionResponse>(
        "/cart",
        {
          method: "DELETE",
        }
      );

      setCart([]);
    } catch (error) {
      console.error(
        "Gagal mengosongkan keranjang:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengosongkan keranjang."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOTAL
  |--------------------------------------------------------------------------
  */

  /*
  | Hanya item yang punya `product` yang bisa dirender. Item dari
  | state App (sebelum API merespons) sengaja dilewati supaya tidak
  | melempar error `Cannot read properties of undefined`.
  */
  const validItems = cart.filter((item): item is CartItem =>
    Boolean(item && item.product)
  );

  /*
  | Backend hanya mengirim `subtotal` pada GET /cart. Setelah
  | update quantity, responsnya tidak punya field itu, jadi
  | subtotal dihitung ulang di sini dari harga x jumlah supaya
  | tidak pernah jadi NaN.
  */
  const itemSubtotal = (item: CartItem) => {
    const fromServer = Number(item.subtotal);

    if (Number.isFinite(fromServer) && item.subtotal != null) {
      return fromServer;
    }

    return Number(item.product?.price ?? 0) * Number(item.quantity ?? 0);
  };

  const subtotal = validItems.reduce(
    (sum, item) => sum + itemSubtotal(item),
    0
  );

  const totalItems = validItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const shipping =
    subtotal >= 100000
      ? 0
      : 15000;

  const total = subtotal + shipping;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 16,
          }}
        >
          🛒
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            color: "#1F2937",
          }}
        >
          Memuat keranjang...
        </h2>

        <p
          style={{
            margin: 0,
            color: "#9CA3AF",
          }}
        >
          Mengambil data keranjang dari server.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 24px",
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 24,
          fontSize: "0.8rem",
          color: "#9CA3AF",
        }}
      >
        <button
          onClick={() => navigate("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#DF401F",
            fontFamily: "Poppins",
            fontSize: "0.8rem",
          }}
        >
          Beranda
        </button>

        <span>/</span>

        <span
          style={{
            color: "#1F2937",
            fontWeight: 600,
          }}
        >
          Keranjang Belanja
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Title */}
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: 800,
          color: "#1F2937",
          margin: "0 0 32px",
        }}
      >
        Keranjang Belanja{" "}
        {validItems.length > 0 && (
          <span
            style={{
              color: "#DF401F",
            }}
          >
            ({totalItems})
          </span>
        )}
      </h1>

      {/* EMPTY CART */}
      {validItems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
          }}
        >
          <div
            style={{
              fontSize: 80,
              marginBottom: 20,
            }}
          >
            🛒
          </div>

          <h2
            style={{
              color: "#1F2937",
              margin: "0 0 12px",
            }}
          >
            Keranjang Kosong
          </h2>

          <p
            style={{
              color: "#9CA3AF",
              margin: "0 0 28px",
            }}
          >
            Belum ada produk di keranjangmu.
            Mulai belanja yuk!
          </p>

          <button
            className="btn-primary"
            onClick={() =>
              navigate("catalog")
            }
            style={{
              padding: "14px 32px",
              fontSize: "1rem",
            }}
          >
            🛍️ Mulai Belanja
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 360px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* ==================================================
              CART ITEMS
          ================================================== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Select all bar */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: "14px 20px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  color: "#1F2937",
                  fontSize: "0.9rem",
                }}
              >
                Semua Produk
              </span>

              <button
                onClick={clearCart}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  color: "#DC2626",
                  fontFamily: "Poppins",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Hapus Semua
              </button>
            </div>

            {/* Items */}
            {validItems.map((item) => {
              const isUpdating =
                updatingId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding:
                      "16px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.05)",
                    border:
                      "1px solid rgba(0,0,0,0.04)",
                    opacity: isUpdating
                      ? 0.6
                      : 1,
                  }}
                >
                  {/* IMAGE */}
                  <img
                    src={getProductImage(item)}
                    alt={item.product?.name ?? 'Produk'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />

                  {/* PRODUCT INFO */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin:
                          "0 0 2px",
                        fontSize:
                          "0.75rem",
                        color: "#9CA3AF",
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {item.product.category
                        ?.name ?? ""}
                    </p>

                    <h3
                      style={{
                        margin:
                          "0 0 6px",
                        fontSize:
                          "0.95rem",
                        fontWeight: 600,
                        color: "#1F2937",
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {item.product.name}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#DF401F",
                      }}
                    >
                      {formatPrice(
                        Number(
                          item.product.price
                        )
                      )}
                    </p>
                  </div>

                  {/* ACTION */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection:
                        "column",
                      alignItems:
                        "flex-end",
                      gap: 12,
                      flexShrink: 0,
                    }}
                  >
                    {/* REMOVE */}
                    <button
                      onClick={() =>
                        removeItem(item.id)
                      }
                      disabled={isUpdating}
                      style={{
                        background: "none",
                        border: "none",
                        cursor:
                          isUpdating
                            ? "not-allowed"
                            : "pointer",
                        fontSize: 16,
                        color: "#9CA3AF",
                        transition:
                          "color 0.2s",
                      }}
                    >
                      ✕
                    </button>

                    {/* QUANTITY */}
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        border:
                          "1.5px solid #E5E7EB",
                        borderRadius: 8,
                        overflow:
                          "hidden",
                      }}
                    >
                      <button
                        onClick={() =>
                          updateQty(
                            item,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          isUpdating
                        }
                        style={{
                          width: 32,
                          height: 32,
                          border: "none",
                          background:
                            "#F9FAFB",
                          cursor:
                            isUpdating
                              ? "not-allowed"
                              : "pointer",
                          fontSize: 16,
                          color: "#374151",
                        }}
                      >
                        −
                      </button>

                      <span
                        style={{
                          width: 40,
                          textAlign:
                            "center",
                          fontWeight: 700,
                          fontSize:
                            "0.9rem",
                          color:
                            "#1F2937",
                        }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQty(
                            item,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          isUpdating ||
                          item.quantity >=
                            item.product
                              .stock
                        }
                        style={{
                          width: 32,
                          height: 32,
                          border: "none",
                          background:
                            "#F9FAFB",
                          cursor:
                            isUpdating ||
                            item.quantity >=
                              item.product
                                .stock
                              ? "not-allowed"
                              : "pointer",
                          fontSize: 16,
                          color: "#374151",
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* ITEM SUBTOTAL */}
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#1F2937",
                        fontSize:
                          "0.9rem",
                      }}
                    >
                      {formatPrice(
                        itemSubtotal(item)
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}
          <div
            style={{
              position: "sticky",
              top: 88,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 14,
                padding: "24px",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.08)",
                border:
                  "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px",
                  fontWeight: 700,
                  color: "#1F2937",
                }}
              >
                Ringkasan Pesanan
              </h3>

              {/* SUMMARY */}
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {/* SUBTOTAL */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "#6B7280",
                      fontSize:
                        "0.875rem",
                    }}
                  >
                    Subtotal ({totalItems}{" "}
                    produk)
                  </span>

                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1F2937",
                      fontSize:
                        "0.875rem",
                    }}
                  >
                    {formatPrice(
                      subtotal
                    )}
                  </span>
                </div>

                {/* SHIPPING */}
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <span
                    style={{
                      color: "#6B7280",
                      fontSize:
                        "0.875rem",
                    }}
                  >
                    Ongkir
                  </span>

                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        shipping === 0
                          ? "#16A34A"
                          : "#1F2937",
                      fontSize:
                        "0.875rem",
                    }}
                  >
                    {shipping === 0
                      ? "Gratis!"
                      : formatPrice(
                          shipping
                        )}
                  </span>
                </div>

                {/* FREE SHIPPING INFO */}
                {subtotal < 100000 && (
                  <div
                    style={{
                      background:
                        "rgba(22,163,74,0.08)",
                      borderRadius: 8,
                      padding: 10,
                      fontSize:
                        "0.78rem",
                      color: "#16A34A",
                      fontWeight: 600,
                    }}
                  >
                    💡 Tambah{" "}
                    {formatPrice(
                      100000 - subtotal
                    )}{" "}
                    lagi untuk gratis
                    ongkir!
                  </div>
                )}

                {/* TOTAL */}
                <div
                  style={{
                    borderTop:
                      "1px solid #F3F4F6",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#1F2937",
                    }}
                  >
                    Total
                  </span>

                  <span
                    style={{
                      fontWeight: 800,
                      color: "#DF401F",
                      fontSize:
                        "1.1rem",
                    }}
                  >
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* CHECKOUT */}
              <button
                className="btn-primary"
                onClick={() =>
                  navigate("checkout")
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "1rem",
                }}
              >
                Lanjut ke Pembayaran →
              </button>

              {/* CONTINUE SHOPPING */}
              <button
                onClick={() =>
                  navigate("catalog")
                }
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                  fontFamily:
                    "Poppins",
                  fontSize:
                    "0.875rem",
                }}
              >
                ← Lanjut Belanja
              </button>
            </div>

            {/* PAYMENT METHODS */}
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "white",
                borderRadius: 12,
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin:
                    "0 0 10px",
                  fontSize:
                    "0.78rem",
                  color: "#9CA3AF",
                  fontWeight: 600,
                }}
              >
                METODE PEMBAYARAN
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {paymentMethods.length ===
                0 ? (
                  <span
                    style={{
                      fontSize:
                        "0.75rem",
                      color: "#9CA3AF",
                    }}
                  >
                    Belum ada metode
                    pembayaran aktif.
                  </span>
                ) : (
                  paymentMethods.map(
                    (method) => (
                      <span
                        key={method.id}
                        style={{
                          background:
                            "#F3F4F6",
                          borderRadius: 6,
                          padding:
                            "4px 8px",
                          fontSize:
                            "0.72rem",
                          fontWeight: 600,
                          color: "#4B5563",
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          gap: 4,
                        }}
                      >
                        {method.icon ??
                          "💳"}{" "}
                        {method.name}
                      </span>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
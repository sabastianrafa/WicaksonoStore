import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatPrice } from '../data';
import ProductCard from '../components/ProductCard';
import { apiFetch, storageUrl } from '../api/client';
import type { Page } from '../App';

/* =========================================================
   TYPES
========================================================= */

interface ApiProductImage {
  id: number;
  path: string;
  alt_text?: string | null;
  is_primary?: boolean;
  url?: string;
}

interface ApiProduct {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  original_price?: string | number | null;
  stock: number;
  sold: number;
  rating: string | number;
  review_count: number;
  discount: number;
  image?: string | null;
  category?: { id: number; name: string; slug?: string } | null;
  images?: ApiProductImage[];
}

interface ApiReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at?: string;
  user?: { id?: number; name?: string } | null;
}

interface ApiShippingMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  cost: string | number;
  estimated_days: string | null;
}

interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: { current_page: number; last_page: number; per_page: number; total: number };
}

interface DetailResponse {
  success: boolean;
  message: string;
  data: ApiProduct;
}

/** Bentuk yang dipakai ProductCard. */
interface CardProduct {
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

interface ProductDetailPageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

/* =========================================================
   HELPERS
========================================================= */

const normalizeImage = (item: ApiProduct): string => {
  const images = item.images ?? [];

  const primary = images.find((img) => img.is_primary) ?? images[0];

  const raw = primary?.url ?? primary?.path ?? item.image ?? '';

  if (!raw) return '';

  return raw.startsWith('http://') || raw.startsWith('https://')
    ? raw
    : storageUrl(raw);
};

/** Semua URL gambar produk (utama lebih dulu) untuk galeri. */
const collectImages = (item: ApiProduct): string[] => {
  const images = item.images ?? [];

  const ordered = [
    ...images.filter((img) => img.is_primary),
    ...images.filter((img) => !img.is_primary),
  ];

  const urls = ordered
    .map((img) => img.url ?? img.path)
    .filter(Boolean)
    .map((url) =>
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : storageUrl(url)
    );

  if (item.image && !urls.includes(item.image)) {
    const fallback = item.image.startsWith('http')
      ? item.image
      : storageUrl(item.image);

    urls.unshift(fallback);
  }

  return [...new Set(urls)];
};

const toCardProduct = (item: ApiProduct): CardProduct => ({
  id: item.id,
  name: item.name,
  category: item.category?.name ?? '',
  price: Number(item.price ?? 0),
  originalPrice: Number(item.original_price ?? item.price ?? 0),
  rating: Number(item.rating ?? 0),
  reviews: Number(item.review_count ?? 0),
  sold: Number(item.sold ?? 0),
  stock: Number(item.stock ?? 0),
  discount: Number(item.discount ?? 0),
  image: normalizeImage(item),
  description: item.description ?? '',
  tags: [],
});

const formatReviewDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const PLURAL_STARS = [78, 15, 5, 1, 1];

/* =========================================================
   COMPONENT
========================================================= */

export default function ProductDetailPage({
  navigate,
  onAddToCart,
}: ProductDetailPageProps) {
  const { id } = useParams();
  const productId = Number(id);

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [related, setRelated] = useState<CardProduct[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ApiShippingMethod[]>([]);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [added, setAdded] = useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    if (!Number.isFinite(productId) || productId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setQty(1);
      setSelectedImg(0);

      try {
        const detail =
          await apiFetch<DetailResponse>(
            `/products/${productId}`
          );

        if (!active) return;

        const data = detail.data;

        setProduct(data);
        setImages(collectImages(data));

        // Sisa dimuat terpisah supaya satu gagal tidak memblokir
        // seluruh halaman.
        const [reviewResult, relatedResult, shippingResult] =
          await Promise.allSettled([
            apiFetch<ListResponse<ApiReview>>(
              `/products/${productId}/reviews?per_page=10`
            ),

            apiFetch<ListResponse<ApiProduct>>(
              `/products?category_id=${data.category_id}&per_page=5`
            ),

            apiFetch<ListResponse<ApiShippingMethod>>(
              '/shipping-methods'
            ),
          ]);

        if (!active) return;

        if (reviewResult.status === 'fulfilled') {
          setReviews(reviewResult.value.data ?? []);
        } else {
          console.error(
            'Gagal memuat ulasan:',
            reviewResult.reason
          );
        }

        if (relatedResult.status === 'fulfilled') {
          setRelated(
            (relatedResult.value.data ?? [])
              .filter((item) => item.id !== data.id)
              .map(toCardProduct)
          );
        } else {
          console.error(
            'Gagal memuat produk terkait:',
            relatedResult.reason
          );
        }

        if (shippingResult.status === 'fulfilled') {
          setShippingMethods(
            shippingResult.value.data ?? []
          );
        } else {
          console.error(
            'Gagal memuat metode pengiriman:',
            shippingResult.reason
          );
        }
      } catch (error) {
        console.error('Gagal memuat produk:', error);

        if (active) {
          setNotFound(true);
          setProduct(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [productId]);

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleAddToCart = () => {
    if (!product) return;

    const card = toCardProduct(product);

    onAddToCart({ ...card, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '80px 24px',
          textAlign: 'center',
          color: '#6B7280',
        }}
      >
        Memuat produk...
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          📦
        </div>

        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#1F2937',
            margin: '0 0 8px',
          }}
        >
          Produk tidak ditemukan
        </h1>

        <p
          style={{
            color: '#9CA3AF',
            margin: '0 0 24px',
          }}
        >
          Produk mungkin sudah tidak
          aktif atau tautannya salah.
        </p>

        <button
          className="btn-primary"
          onClick={() => navigate('catalog')}
          style={{ padding: '10px 24px' }}
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const price = Number(product.price ?? 0);
  const originalPrice = Number(product.original_price ?? product.price ?? 0);
  const discount = Number(product.discount ?? 0);
  const rating = Number(product.rating ?? 0);
  const reviewCount = Number(product.review_count ?? 0);
  const stock = Number(product.stock ?? 0);
  const maxQty = Math.max(stock, 1);

  const hasDiscount = discount > 0 && originalPrice > price;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 28,
          fontSize: '0.8rem',
          color: '#9CA3AF',
        }}
      >
        <button
          onClick={() => navigate('home')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#F97316',
            fontFamily: 'Poppins',
            fontSize: '0.8rem',
          }}
        >
          Beranda
        </button>

        <span>/</span>

        <button
          onClick={() => navigate('catalog')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#F97316',
            fontFamily: 'Poppins',
            fontSize: '0.8rem',
          }}
        >
          Katalog
        </button>

        {product.category && (
          <>
            <span>/</span>

            <button
              onClick={() =>
                navigate('catalog', {
                  categoryId: product.category_id,
                })
              }
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#F97316',
                fontFamily: 'Poppins',
                fontSize: '0.8rem',
              }}
            >
              {product.category.name}
            </button>
          </>
        )}

        <span>/</span>

        <span style={{ color: '#1F2937', fontWeight: 600 }}>{product.name}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          marginBottom: 48,
        }}
      >
        {/* Image gallery */}
        <div>
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 12,
              background: '#FFF8F0',
              aspectRatio: '1',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            {images.length > 0 ? (
              <img
                src={images[Math.min(selectedImg, images.length - 1)]}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                }}
              >
                🛍️
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  onClick={() => setSelectedImg(index)}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: `2px solid ${
                      selectedImg === index ? '#F97316' : 'transparent'
                    }`,
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow:
                      selectedImg === index
                        ? '0 4px 12px rgba(249,115,22,0.25)'
                        : 'none',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.category && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  background: 'rgba(249,115,22,0.1)',
                  color: '#F97316',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {product.category.name}
              </span>
            </div>
          )}

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#1F2937',
              margin: '0 0 12px',
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={
                    i <= Math.round(rating)
                      ? 'star-filled'
                      : 'star-empty'
                  }
                  style={{ fontSize: 16 }}
                >
                  ★
                </span>
              ))}
            </div>

            <span
              style={{
                fontWeight: 600,
                color: '#1F2937',
                fontSize: '0.9rem',
              }}
            >
              {rating.toFixed(1)}
            </span>

            <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
              ({reviewCount} ulasan)
            </span>

            <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>
              · {Number(product.sold ?? 0).toLocaleString('id-ID')} terjual
            </span>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #FFF8F0, #FEFCE8)',
              borderRadius: 14,
              padding: '20px',
              marginBottom: 24,
              border: '1px solid rgba(249,115,22,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: '#F97316',
                }}
              >
                {formatPrice(price)}
              </span>

              {hasDiscount && (
                <>
                  <span
                    style={{
                      color: '#9CA3AF',
                      textDecoration: 'line-through',
                      fontSize: '1.1rem',
                    }}
                  >
                    {formatPrice(originalPrice)}
                  </span>

                  <span
                    style={{
                      background: '#F97316',
                      color: 'white',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {hasDiscount && (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '0.8rem',
                  color: '#16A34A',
                  fontWeight: 600,
                }}
              >
                Hemat {formatPrice(originalPrice - price)}!
              </p>
            )}
          </div>

          {/* Stock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: stock > 0 ? '#16A34A' : '#DC2626',
              }}
            />

            <span
              style={{
                fontSize: '0.85rem',
                color: stock > 0 ? '#16A34A' : '#DC2626',
                fontWeight: 600,
              }}
            >
              {stock > 0
                ? `Stok tersedia (${stock} unit)`
                : 'Stok habis'}
            </span>
          </div>

          {/* Qty selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.9rem',
              }}
            >
              Jumlah:
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1.5px solid #E5E7EB',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() =>
                  setQty((q) => Math.max(1, q - 1))
                }
                disabled={stock === 0}
                style={{
                  width: 40,
                  height: 40,
                  border: 'none',
                  background: '#F9FAFB',
                  cursor: stock === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 18,
                  color: '#374151',
                  fontFamily: 'Poppins',
                }}
              >
                −
              </button>

              <span
                style={{
                  width: 48,
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#1F2937',
                }}
              >
                {qty}
              </span>

              <button
                onClick={() =>
                  setQty((q) => Math.min(maxQty, q + 1))
                }
                disabled={stock === 0}
                style={{
                  width: 40,
                  height: 40,
                  border: 'none',
                  background: '#F9FAFB',
                  cursor: stock === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 18,
                  color: '#374151',
                  fontFamily: 'Poppins',
                }}
              >
                +
              </button>
            </div>

            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
              Maks. {stock}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 24,
            }}
          >
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="btn-outline"
              style={{
                flex: 1,
                padding: '14px',
                cursor: stock === 0 ? 'not-allowed' : 'pointer',
                opacity: stock === 0 ? 0.5 : 1,
              }}
            >
              {stock === 0
                ? 'Stok Habis'
                : added
                  ? '✓ Ditambahkan!'
                  : '🛒 Tambah ke Keranjang'}
            </button>

            <button
              onClick={() => navigate('cart')}
              disabled={stock === 0}
              className="btn-primary"
              style={{
                flex: 1,
                padding: '14px',
                cursor: stock === 0 ? 'not-allowed' : 'pointer',
                opacity: stock === 0 ? 0.5 : 1,
              }}
            >
              ⚡ Beli Sekarang
            </button>
          </div>

          {/* Info chips */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: 12,
            }}
          >
            {[
              {
                icon: '🚚',
                text: 'Gratis ongkir min. Rp 100.000 · Estimasi tiba 2-3 hari',
              },
              {
                icon: '✅',
                text: 'Produk bersertifikat BPOM & Halal MUI',
              },
              {
                icon: '🔄',
                text: 'Garansi pengembalian 7 hari jika rusak',
              },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span>{icon}</span>
                <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '2px solid #F3F4F6',
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          {['deskripsi', 'ulasan', 'pengiriman'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                borderBottom:
                  activeTab === tab
                    ? '2px solid #F97316'
                    : '2px solid transparent',
                color: activeTab === tab ? '#F97316' : '#6B7280',
                fontFamily: 'Poppins',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginBottom: -2,
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'deskripsi'
                ? 'Deskripsi'
                : tab === 'ulasan'
                  ? `Ulasan (${reviewCount})`
                  : 'Pengiriman'}
            </button>
          ))}
        </div>

        {activeTab === 'deskripsi' && (
          <div style={{ maxWidth: 720 }}>
            <p
              style={{
                color: '#4B5563',
                lineHeight: 1.8,
                margin: 0,
                fontSize: '0.95rem',
              }}
            >
              {product.description || 'Belum ada deskripsi untuk produk ini.'}
            </p>
          </div>
        )}

        {activeTab === 'ulasan' && (
          <div style={{ maxWidth: 720 }}>
            {reviewCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 32,
                  marginBottom: 32,
                  padding: '20px',
                  background: '#FFF8F0',
                  borderRadius: 14,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: '#F97316',
                    }}
                  >
                    {rating.toFixed(1)}
                  </div>

                  <div style={{ color: '#FACC15', fontSize: 20 }}>
                    {'★'.repeat(5)}
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#9CA3AF',
                      marginTop: 4,
                    }}
                  >
                    {reviewCount} ulasan
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    justifyContent: 'center',
                    minWidth: 240,
                  }}
                >
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div
                      key={star}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: '#6B7280',
                          minWidth: 16,
                        }}
                      >
                        {star}
                      </span>

                      <span style={{ color: '#FACC15', fontSize: 12 }}>
                        ★
                      </span>

                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: '#F3F4F6',
                          borderRadius: 100,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: '#FACC15',
                            borderRadius: 100,
                            width: `${PLURAL_STARS[5 - star]}%`,
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#9CA3AF',
                        }}
                      >
                        {PLURAL_STARS[5 - star]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'white',
                  borderRadius: 14,
                  color: '#9CA3AF',
                }}
              >
                Belum ada ulasan untuk produk ini.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                {reviews.map((review) => {
                  const name = review.user?.name ?? 'Pelanggan';

                  return (
                    <div
                      key={review.id}
                      style={{
                        background: 'white',
                        borderRadius: 12,
                        padding: '20px',
                        boxShadow:
                          '0 2px 8px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#F97316',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: '#1F2937',
                              }}
                            >
                              {name}
                            </div>

                            <div
                              style={{
                                color: '#FACC15',
                                fontSize: 12,
                              }}
                            >
                              {'★'.repeat(review.rating)}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                          }}
                        >
                          {formatReviewDate(review.created_at)}
                        </span>
                      </div>

                      {review.comment && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#4B5563',
                            lineHeight: 1.6,
                          }}
                        >
                          {review.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pengiriman' && (
          <div style={{ maxWidth: 720 }}>
            {shippingMethods.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'white',
                  borderRadius: 14,
                  color: '#9CA3AF',
                }}
              >
                Belum ada metode pengiriman.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {shippingMethods.map((method) => (
                  <div
                    key={method.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'white',
                      borderRadius: 12,
                      boxShadow:
                        '0 2px 8px rgba(0,0,0,0.05)',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>🚚</span>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#1F2937',
                            fontSize: '0.875rem',
                          }}
                        >
                          {method.name}
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                          }}
                        >
                          {method.estimated_days
                            ? `Estimasi ${method.estimated_days}`
                            : method.description || '-'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontWeight: 700,
                        color: '#F97316',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatPrice(Number(method.cost ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#1F2937',
              margin: '0 0 24px',
            }}
          >
            Produk Terkait
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                navigate={navigate}
                onAddToCart={
                  onAddToCart as (product: unknown) => void
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
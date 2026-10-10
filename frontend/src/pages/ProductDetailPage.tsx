import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FiBox, FiShoppingBag, FiStar, FiTruck, 
  FiChevronRight, FiMinus, FiPlus, FiCheck
} from 'react-icons/fi';
import { FaCartPlus, FaCartArrowDown } from 'react-icons/fa'; // Import ikon baru
import { formatPrice } from '../data';
import ProductCard from '../components/ProductCard';
import { apiFetch, storageUrl } from '../api/client';
import type { Page } from '../App';

/* =========================================================
   TYPES
========================================================= */
interface ApiProductImage { id: number; path: string; alt_text?: string | null; is_primary?: boolean; url?: string; }
interface ApiProduct { id: number; category_id: number; name: string; slug: string; description: string | null; price: string | number; original_price?: string | number | null; stock: number; sold: number; rating: string | number; review_count: number; discount: number; image?: string | null; category?: { id: number; name: string; slug?: string } | null; images?: ApiProductImage[]; }
interface ApiReview { id: number; rating: number; comment: string | null; created_at?: string; user?: { id?: number; name?: string } | null; }
interface ApiShippingMethod { id: number; name: string; code: string; description: string | null; cost: string | number; estimated_days: string | null; }
interface ListResponse<T> { success: boolean; message: string; data: T[]; meta?: { current_page: number; last_page: number; per_page: number; total: number }; }
interface DetailResponse { success: boolean; message: string; data: ApiProduct; }
interface CardProduct { id: number; name: string; category: string; price: number; originalPrice: number; rating: number; reviews: number; sold: number; stock: number; discount: number; image: string; description: string; tags: string[]; }
interface ProductDetailPageProps { navigate: (page: Page, data?: unknown) => void; onAddToCart: (product: unknown) => Promise<boolean>; }

/* =========================================================
   HELPERS
========================================================= */
const normalizeImage = (item: ApiProduct): string => {
  const images = item.images ?? [];
  const primary = images.find((img) => img.is_primary) ?? images[0];
  const raw = primary?.url ?? primary?.path ?? item.image ?? '';
  if (!raw) return '';
  return raw.startsWith('http') ? raw : storageUrl(raw);
};

const collectImages = (item: ApiProduct): string[] => {
  const images = item.images ?? [];
  const urls = [
    ...images.filter((img) => img.is_primary),
    ...images.filter((img) => !img.is_primary),
  ]
    .map((img) => img.url ?? img.path)
    .filter(Boolean)
    .map((url) => (url.startsWith('http') ? url : storageUrl(url)));

  if (item.image && !urls.includes(item.image)) {
    urls.unshift(item.image.startsWith('http') ? item.image : storageUrl(item.image));
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
  return Number.isNaN(date.getTime())
    ? '-'
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const PLURAL_STARS = [78, 15, 5, 1, 1];

/* =========================================================
   COMPONENT
========================================================= */
export default function ProductDetailPage({ navigate, onAddToCart }: ProductDetailPageProps) {
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

  useEffect(() => {
    if (!Number.isFinite(productId) || productId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let active = true;
    const loadData = async () => {
      setLoading(true);
      setNotFound(false);
      setQty(1);
      setSelectedImg(0);

      try {
        const detail = await apiFetch<DetailResponse>(`/products/${productId}`);
        if (!active) return;
        const data = detail.data;
        setProduct(data);
        setImages(collectImages(data));

        const [reviewRes, relatedRes, shippingRes] = await Promise.allSettled([
          apiFetch<ListResponse<ApiReview>>(`/products/${productId}/reviews?per_page=10`),
          apiFetch<ListResponse<ApiProduct>>(`/products?category_id=${data.category_id}&per_page=5`),
          apiFetch<ListResponse<ApiShippingMethod>>('/shipping-methods'),
        ]);

        if (!active) return;

        if (reviewRes.status === 'fulfilled') setReviews(reviewRes.value.data ?? []);
        if (relatedRes.status === 'fulfilled') {
          setRelated(
            (relatedRes.value.data ?? [])
              .filter((item) => item.id !== data.id)
              .map(toCardProduct)
          );
        }
        if (shippingRes.status === 'fulfilled') setShippingMethods(shippingRes.value.data ?? []);
      } catch (error) {
        if (active) {
          setNotFound(true);
          setProduct(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [productId]);

  const addCurrentProductToCart = async () => {
    if (!product) return false;
    return onAddToCart({ ...toCardProduct(product), quantity: qty });
  };

  const handleAddToCart = async () => {
    if (await addCurrentProductToCart()) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    if (await addCurrentProductToCart()) {
      navigate('cart');
    }
  };

  /* =========================================================
     RENDER STATES
  ========================================================= */
  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 px-6 text-center text-gray-500">Memuat produk...</div>;
  }

  if (notFound || !product) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-6 text-center">
        <FiBox className="text-6xl text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Produk tidak ditemukan</h1>
        <p className="text-gray-400 mb-6">Produk mungkin sudah tidak aktif atau tautannya salah.</p>
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors" onClick={() => navigate('catalog')}>
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
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-400 font-medium">
        <button onClick={() => navigate('home')} className="text-orange-500 hover:underline">Beranda</button>
        <FiChevronRight className="w-4 h-4" />
        <button onClick={() => navigate('catalog')} className="text-orange-500 hover:underline">Katalog</button>
        {product.category && (
          <>
            <FiChevronRight className="w-4 h-4" />
            <button onClick={() => navigate('catalog', { categoryId: product.category_id })} className="text-orange-500 hover:underline">
              {product.category.name}
            </button>
          </>
        )}
        <FiChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        {/* Image Gallery */}
        <div>
          <div className="rounded-2xl overflow-hidden mb-3 bg-orange-50 aspect-square shadow-lg flex items-center justify-center">
            {images.length > 0 ? (
              <img src={images[Math.min(selectedImg, images.length - 1)]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <FiShoppingBag className="text-6xl text-orange-200" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  onClick={() => setSelectedImg(index)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImg === index ? 'border-orange-500 shadow-md' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <div className="mb-3">
              <span className="bg-orange-100 text-orange-600 rounded-full px-3 py-1 text-xs font-bold">
                {product.category.name}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-extrabold text-gray-800 mb-3 leading-tight">{product.name}</h1>

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <FiStar key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="font-bold text-gray-800 text-sm">{rating.toFixed(1)}</span>
            <span className="text-gray-400 text-sm">({reviewCount} ulasan)</span>
            <span className="text-gray-400 text-sm">&middot; {Number(product.sold ?? 0).toLocaleString('id-ID')} terjual</span>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 mb-6 border border-orange-100">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black text-orange-500">{formatPrice(price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-gray-400 line-through text-lg">{formatPrice(originalPrice)}</span>
                  <span className="bg-orange-500 text-white rounded-md px-2 py-0.5 text-xs font-bold">-{discount}%</span>
                </>
              )}
            </div>
            {hasDiscount && <p className="mt-2 text-sm text-green-600 font-bold">Hemat {formatPrice(originalPrice - price)}!</p>}
          </div>

          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-semibold ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {stock > 0 ? `Stok tersedia (${stock} unit)` : 'Stok habis'}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="font-semibold text-gray-700 text-sm">Jumlah:</span>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
              <button 
                onClick={() => setQty((q) => Math.max(1, q - 1))} 
                disabled={stock === 0}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
              ><FiMinus /></button>
              <span className="w-12 text-center font-bold text-gray-800">{qty}</span>
              <button 
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))} 
                disabled={stock === 0}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
              ><FiPlus /></button>
            </div>
            <span className="text-gray-400 text-xs font-medium">Maks. {stock}</span>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {stock === 0 ? 'Stok Habis' : added ? <><FiCheck /> Ditambahkan!</> : <><FaCartPlus className="w-5 h-5" /> Masukkan Keranjang</>}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaCartArrowDown className="w-5 h-5" /> Beli Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mb-10">
        <div className="flex gap-1 border-b-2 border-gray-100 mb-6 flex-wrap">
          {['deskripsi', 'ulasan', 'pengiriman'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-semibold text-sm capitalize transition-all border-b-2 -mb-[2px] ${
                activeTab === tab ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'ulasan' ? `Ulasan (${reviewCount})` : tab}
            </button>
          ))}
        </div>

        {activeTab === 'deskripsi' && (
          <div className="max-w-3xl text-gray-600 leading-relaxed text-sm">
            {product.description || 'Belum ada deskripsi untuk produk ini.'}
          </div>
        )}

        {activeTab === 'ulasan' && (
          <div className="max-w-3xl">
            {reviewCount > 0 && (
              <div className="flex flex-wrap gap-8 mb-8 p-6 bg-orange-50 rounded-2xl items-center">
                <div className="text-center">
                  <div className="text-5xl font-black text-orange-500">{rating.toFixed(1)}</div>
                  <div className="flex gap-1 justify-center mt-2 text-yellow-400">
                    {[...Array(5)].map((_, i) => <FiStar key={i} className="fill-current w-4 h-4" />)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-medium">{reviewCount} ulasan</div>
                </div>
                <div className="flex-1 flex flex-col gap-2 min-w-[240px]">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600 font-medium w-3 text-right">{star}</span>
                      <FiStar className="text-yellow-400 fill-current w-3 h-3" />
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${PLURAL_STARS[5 - star]}%` }} />
                      </div>
                      <span className="text-gray-400 text-xs w-8">{PLURAL_STARS[5 - star]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center p-10 bg-gray-50 rounded-2xl text-gray-500 font-medium">Belum ada ulasan untuk produk ini.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => {
                  const name = review.user?.name ?? 'Pelanggan';
                  return (
                    <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{name}</div>
                            <div className="flex gap-0.5 text-yellow-400 mt-1">
                              {[...Array(review.rating)].map((_, i) => <FiStar key={i} className="fill-current w-3 h-3" />)}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{formatReviewDate(review.created_at)}</span>
                      </div>
                      {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pengiriman' && (
          <div className="max-w-3xl">
            {shippingMethods.length === 0 ? (
              <div className="text-center p-10 bg-gray-50 rounded-2xl text-gray-500 font-medium">Belum ada metode pengiriman.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {shippingMethods.map((method) => (
                  <div key={method.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm gap-3">
                    <div className="flex gap-4 items-center min-w-0">
                      <FiTruck className="text-gray-400 w-6 h-6 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800 text-sm truncate">{method.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {method.estimated_days ? `Estimasi ${method.estimated_days}` : method.description || '-'}
                        </div>
                      </div>
                    </div>
                    <span className="font-extrabold text-orange-500 whitespace-nowrap">{formatPrice(Number(method.cost ?? 0))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Produk Terkait</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} navigate={navigate} onAddToCart={onAddToCart as (product: unknown) => void} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
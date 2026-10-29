import { useEffect, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaStar, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { formatPrice } from '../../data';
import ProductCard from '../../components/ProductCard';
import { apiFetch, storageUrl } from '../../api/client';
import type { Page } from '../../App';

/* =========================================================
   TYPES
========================================================= */

interface Product {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  weight: number;
  discount: number;
  image: string;
  description: string;
  tags: string[];
}

interface CatalogCategory {
  id: number;
  slug: string;
  name: string;
  products_count?: number;
}

interface Filters {
  search: string;
  category: number | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sort: string;
}

interface ProductResponse {
  data?: any[];
  meta?: { last_page?: number; total?: number };
}

interface CatalogPageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

/* =========================================================
   KONSTANTA & HELPER
========================================================= */

const PER_PAGE = 16;
const MAX_PRICE = 200000;

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: null,
  minPrice: 0,
  maxPrice: MAX_PRICE,
  minRating: 0,
  sort: 'terlaris',
};

const SORT_OPTIONS = [
  ['terlaris', 'Terlaris'],
  ['termurah', 'Harga Terendah'],
  ['termahal', 'Harga Tertinggi'],
  ['rating', 'Rating Tertinggi'],
  ['terbaru', 'Terbaru'],
];

const PRICE_PRESETS = [
  [0, 25000],
  [25000, 50000],
  [50000, 100000],
  [100000, 200000],
];

const RATING_OPTIONS = [4.5, 4, 3.5, 0];

const normalizeProduct = (item: any): Product => {
  const imageUrl: string =
    item.images?.find((img: any) => img.is_primary)?.url ??
    item.images?.[0]?.url ??
    item.image ??
    '';

  return {
    id: Number(item.id),
    name: item.name ?? '',
    categoryId: Number(item.category_id ?? item.category?.id ?? 0),
    category: item.category?.slug ?? item.category?.name ?? item.category ?? 'lainnya',
    price: Number(item.price ?? 0),
    originalPrice: Number(item.original_price ?? item.price ?? 0),
    rating: Number(item.rating ?? item.average_rating ?? 0),
    reviews: Number(item.review_count ?? item.reviews_count ?? 0),
    sold: Number(item.sold ?? 0),
    stock: Number(item.stock ?? 0),
    weight: Number(item.weight ?? 0),
    discount: Number(item.discount ?? 0),
    image: /^https?:\/\//.test(imageUrl) ? imageUrl : storageUrl(imageUrl),
    description: item.description ?? '',
    tags: ['baru', 'premium'],
  };
};

/** Nomor halaman yang ditampilkan; -1 berarti "...". */
function getPaginationPages(current: number, last: number): number[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  return [
    1,
    ...(current > 4 ? [-1] : []),
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
    ...(current < last - 3 ? [-1] : []),
    last,
  ];
}

/* =========================================================
   STYLE YANG DIPAKAI BERULANG
========================================================= */

const linkButton: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#F97316',
  fontFamily: 'Poppins',
};

const sectionTitle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const optionStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  textAlign: 'left',
  padding: '8px 10px',
  borderRadius: 8,
  border: 'none',
  fontFamily: 'Poppins',
  fontSize: '0.875rem',
  cursor: 'pointer',
  background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
  color: active ? '#F97316' : '#374151',
  fontWeight: active ? 600 : 400,
});

const arrowStyle = (disabled: boolean): CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: 'white',
  fontFamily: 'Poppins',
  cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#D1D5DB' : '#374151',
});

const pageStyle = (active: boolean): CSSProperties => ({
  width: 36,
  height: 36,
  borderRadius: 8,
  border: '1px solid',
  borderColor: active ? '#F97316' : '#E5E7EB',
  background: active ? '#F97316' : 'white',
  color: active ? 'white' : '#374151',
  fontFamily: 'Poppins',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
});

const STYLES = `
  .catalog-page { max-width: 1280px; margin: 0 auto; padding: 32px 24px; box-sizing: border-box; width: 100%; }
  .catalog-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 24px; align-items: start; }
  .catalog-sidebar { min-width: 0; position: sticky; top: 88px; }
  .catalog-search-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .catalog-search-input { padding-left: 40px !important; width: 100%; box-sizing: border-box; }
  .catalog-sort { width: auto; min-width: 160px; }
  .catalog-price-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
  .catalog-price-button { min-width: 0; width: 100%; min-height: 38px; padding: 8px 6px; overflow-wrap: anywhere; white-space: normal; line-height: 1.25; box-sizing: border-box; }
  .catalog-product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 18px; }
  .catalog-breadcrumb { display: flex; gap: 8px; align-items: center; margin-bottom: 24px; font-size: .8rem; color: #9CA3AF; flex-wrap: wrap; }
  .catalog-pagination { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 32px; }
  @media (max-width: 760px) {
    .catalog-page { padding: 20px 12px; }
    .catalog-layout { grid-template-columns: minmax(0, 1fr); gap: 18px; }
    .catalog-sidebar { position: static; top: auto; padding: 16px !important; }
    .catalog-search-row { gap: 10px; margin-bottom: 18px; }
    .catalog-search-input { min-width: 0 !important; }
    .catalog-sort { width: 100%; min-width: 0; }
    .catalog-product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .catalog-breadcrumb { margin-bottom: 16px; }
    .catalog-title { font-size: 1.45rem !important; margin-bottom: 18px !important; }
    .catalog-pagination button { padding-left: 10px !important; padding-right: 10px !important; }
  }
  @media (max-width: 360px) {
    .catalog-page { padding-left: 8px; padding-right: 8px; }
    .catalog-product-grid { gap: 8px; }
    .catalog-price-button { font-size: .68rem !important; }
  }
`;

/* =========================================================
   KOMPONEN
========================================================= */

export default function CatalogPage({ navigate, onAddToCart }: CatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // HomePage mengirim ?kategori=<id> saat kategori diklik.
  const [filters, setFilters] = useState<Filters>(() => {
    const id = Number(searchParams.get('kategori'));
    return { ...DEFAULT_FILTERS, category: id > 0 ? id : null };
  });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Mengubah filter selalu mengembalikan ke halaman 1.
  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const changeCategory = (category: number | null) => {
    updateFilters({ category });
    // Jaga URL tetap mencerminkan filter, supaya link bisa dibagikan.
    setSearchParams(category === null ? {} : { kategori: String(category) }, {
      replace: true,
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const goToPage = (target: number) => {
    if (target < 1 || target > lastPage || target === page) return;

    setPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------- Data ---------- */

  // Filtering dan pagination dilakukan oleh Laravel.
  useEffect(() => {
    let cancelled = false;
    const { search, category, minPrice, maxPrice, minRating, sort } = filters;

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
      sort,
    });
    if (search.trim()) params.set('search', search.trim());
    if (category !== null) params.set('category_id', String(category));
    if (minPrice > 0) params.set('min_price', String(minPrice));
    if (maxPrice < MAX_PRICE) params.set('max_price', String(maxPrice));
    if (minRating > 0) params.set('min_rating', String(minRating));

    setLoading(true);

    apiFetch<ProductResponse>(`/products?${params}`)
      .then((res) => {
        if (cancelled) return;

        setProducts((res.data ?? []).map(normalizeProduct));
        setTotal(res.meta?.total ?? 0);
        setLastPage(res.meta?.last_page ?? 1);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error('Gagal memuat produk catalog:', error);
        setProducts([]);
        setTotal(0);
        setLastPage(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Respons lama (misalnya saat mengetik cepat) diabaikan.
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  useEffect(() => {
    apiFetch<{ data?: CatalogCategory[] }>('/categories')
      .then((res) => setCategories(res.data ?? []))
      .catch((error) => console.error('Gagal memuat kategori:', error));
  }, []);

  /* ---------- Turunan ---------- */

  // Total dari products_count per kategori, supaya angka "Semua Kategori"
  // tidak ikut berubah saat filter lain aktif.
  const totalActiveProducts = categories.reduce(
    (sum, category) => sum + (category.products_count ?? 0),
    0
  );

  const categoryOptions = [
    { id: null as number | null, name: 'Semua Kategori', count: totalActiveProducts },
    ...categories.slice(0, 6).map((c) => ({
      id: c.id as number | null,
      name: c.name,
      count: c.products_count ?? 0,
    })),
  ];
  const otherCategories = categories.slice(6);
  const selectedCategoryName = categories.find((c) => c.id === filters.category)?.name;

  /* ---------- Render ---------- */

  return (
    <div className="catalog-page">
      <style>{STYLES}</style>

      {/* Breadcrumb */}
      <div className="catalog-breadcrumb">
        <button onClick={() => navigate('home')} style={{ ...linkButton, fontSize: '0.8rem' }}>
          Beranda
        </button>
        <span>/</span>
        <span style={{ color: '#1F2937', fontWeight: 600 }}>Katalog Produk</span>
      </div>

      <h1
        className="catalog-title"
        style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', margin: '0 0 24px' }}
      >
        Katalog Produk
      </h1>

      {/* Search + Sort */}
      <div className="catalog-search-row">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
            }}
          >
            <FaSearch aria-hidden="true" />
          </span>

          <input
            className="input-field catalog-search-input"
            placeholder="Cari produk oleh-oleh..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>

        <select
          className="input-field catalog-sort"
          style={{ cursor: 'pointer' }}
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
        >
          {SORT_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="catalog-layout">
        {/* SIDEBAR */}
        <div
          className="catalog-sidebar"
          style={{
            background: 'white',
            borderRadius: 14,
            padding: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h3 style={{ margin: 0, fontWeight: 700, color: '#1F2937' }}>Filter</h3>
            <button onClick={resetFilters} style={{ ...linkButton, fontSize: '0.8rem' }}>
              Reset
            </button>
          </div>

          {/* Kategori */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={sectionTitle}>Kategori</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categoryOptions.map(({ id, name, count }) => (
                <button
                  key={id ?? 'all'}
                  onClick={() => changeCategory(id)}
                  style={optionStyle(filters.category === id)}
                >
                  <span>{name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{count}</span>
                </button>
              ))}

              {otherCategories.length > 0 && (
                <select
                  className="input-field"
                  value={filters.category ?? ''}
                  onChange={(e) =>
                    changeCategory(e.target.value ? Number(e.target.value) : null)
                  }
                  style={{ width: '100%', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  <option value="">Lainnya</option>
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.products_count ?? 0})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Harga */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={sectionTitle}>Harga</h4>

            <div className="catalog-price-options">
              {PRICE_PRESETS.map(([min, max]) => {
                const active = filters.minPrice === min && filters.maxPrice === max;

                return (
                  <button
                    key={`${min}-${max}`}
                    className="catalog-price-button"
                    onClick={() => updateFilters({ minPrice: min, maxPrice: max })}
                    style={{
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: active ? '#F97316' : '#E5E7EB',
                      background: active ? 'rgba(249,115,22,0.1)' : 'white',
                      color: active ? '#F97316' : '#6B7280',
                      fontSize: '0.7rem',
                      fontFamily: 'Poppins',
                      cursor: 'pointer',
                    }}
                  >
                    {min === 0
                      ? `≤ ${formatPrice(max)}`
                      : `${formatPrice(min)}–${formatPrice(max)}`}
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={5000}
              value={filters.maxPrice}
              onChange={(e) => updateFilters({ minPrice: 0, maxPrice: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#F97316' }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#9CA3AF',
                marginTop: 4,
              }}
            >
              <span>Rp 0</span>
              <span>{formatPrice(filters.maxPrice)}</span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 style={sectionTitle}>Rating</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RATING_OPTIONS.map((rating) => (
                <button
                  key={rating}
                  onClick={() => updateFilters({ minRating: rating })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background:
                      filters.minRating === rating ? 'rgba(249,115,22,0.1)' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'Poppins',
                    fontSize: '0.85rem',
                    color: '#374151',
                  }}
                >
                  <span style={{ color: '#FACC15', display: 'inline-flex', gap: 2 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <FaStar
                        key={i}
                        size={12}
                        style={{ opacity: rating === 0 || i < Math.floor(rating) ? 1 : 0.25 }}
                      />
                    ))}
                  </span>
                  <span style={{ color: '#6B7280' }}>{rating === 0 ? 'Semua' : `${rating}+`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUK */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>
              Menampilkan <strong style={{ color: '#1F2937' }}>{total}</strong> produk
            </p>

            {filters.category !== null && (
              <button
                onClick={() => changeCategory(null)}
                title="Hapus filter kategori"
                style={{
                  background: 'rgba(249,115,22,0.1)',
                  color: '#F97316',
                  border: 'none',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  fontFamily: 'Poppins',
                  cursor: 'pointer',
                }}
              >
                {selectedCategoryName} <FaTimes aria-hidden="true" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="catalog-product-grid">
              {Array.from({ length: PER_PAGE }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: 310,
                    background: 'white',
                    borderRadius: 14,
                    border: '1px solid #F3F4F6',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="catalog-product-grid">
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
                <div className="catalog-pagination">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    style={arrowStyle(page === 1)}
                  >
                    <FaChevronLeft aria-hidden="true" />
                  </button>

                  {getPaginationPages(page, lastPage).map((p, i) =>
                    p === -1 ? (
                      <span
                        key={`ellipsis-${i}`}
                        style={{ width: 36, textAlign: 'center', color: '#9CA3AF' }}
                      >
                        ...
                      </span>
                    ) : (
                      <button key={p} onClick={() => goToPage(p)} style={pageStyle(p === page)}>
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === lastPage}
                    style={arrowStyle(page === lastPage)}
                  >
                    <FaChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'white',
                borderRadius: 14,
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: '#1F2937', margin: '0 0 8px' }}>Produk tidak ditemukan</h3>
              <p style={{ color: '#9CA3AF', margin: '0 0 20px' }}>
                Coba kata kunci lain atau ubah filter
              </p>
              <button className="btn-primary" onClick={resetFilters} style={{ padding: '10px 24px' }}>
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
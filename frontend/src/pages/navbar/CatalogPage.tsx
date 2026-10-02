import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatPrice } from '../../data';
import ProductCard from '../../components/ProductCard';
import { apiFetch, storageUrl } from '../../api/client';
import type { Page } from '../../App';

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
  discount: number;
  image: string;
  description: string;
  tags: string[];
}

interface CatalogCategory {
  id: number;
  slug: string;
  name: string;
  icon?: string;
  products_count?: number;
}

interface ProductResponse {
  success?: boolean;
  message?: string;
  data?: any[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
  };
}

interface CategoryResponse {
  success?: boolean;
  data?: CatalogCategory[];
}

interface CatalogPageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

const normalizeProduct = (item: any): Product => {
  const imageUrl =
    item.images?.find(
      (img: any) => img.is_primary
    )?.url ??
    item.images?.[0]?.url ??
    item.image ??
    '';

  return {
    id: Number(item.id),

    name: item.name ?? '',

    categoryId: Number(
      item.category_id ??
      item.category?.id ??
      0
    ),

    category:
      item.category?.slug ??
      item.category?.name ??
      item.category ??
      'lainnya',

    price: Number(item.price ?? 0),

    originalPrice: Number(
      item.original_price ??
      item.price ??
      0
    ),

    rating: Number(
      item.rating ??
      item.average_rating ??
      0
    ),

    reviews: Number(
      item.review_count ??
      item.reviews_count ??
      0
    ),

    sold: Number(item.sold ?? 0),

    stock: Number(item.stock ?? 0),

    discount: Number(item.discount ?? 0),

    image:
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://')
        ? imageUrl
        : storageUrl(imageUrl),

    description: item.description ?? '',

    tags: ['baru', 'premium'],
  };
};

export default function CatalogPage({
  navigate,
  onAddToCart,
}: CatalogPageProps) {
  /*
  |--------------------------------------------------------------------------
  | FILTER STATE
  |--------------------------------------------------------------------------
  */

  /*
  | HomePageinality mengirim ?kategori=<id> saat kategori diklik, jadi
  | katalog langsung terfilter ke kategori itu.
  */
  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialCategory = Number(
    searchParams.get('kategori')
  );

  const [search, setSearch] = useState('');

  const [selectedCategory, setSelectedCategory] =
    useState<number | null>(
      Number.isFinite(initialCategory) &&
      initialCategory > 0
        ? initialCategory
        : null
    );

  const [priceRange, setPriceRange] =
    useState<[number, number]>([
      0,
      200000,
    ]);

  const [minRating, setMinRating] =
    useState(0);

  const [sortBy, setSortBy] =
    useState('terlaris');

  /*
  |--------------------------------------------------------------------------
  | PAGINATION STATE
  |--------------------------------------------------------------------------
  */

  const [currentPage, setCurrentPage] =
    useState(1);

  const [lastPage, setLastPage] =
    useState(1);

  const [perPage] = useState(16);

  const [productList, setProductList] =
    useState<Product[]>([]);

  const [productTotal, setProductTotal] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY STATE
  |--------------------------------------------------------------------------
  */

  /*
  | Awal kosong, lalu diisi dari GET /categories.
  | Sebelumnya diinisialisasi dari variabel `categories` yang tidak pernah
  | diimpor, sehingga halaman crash saat render.
  */
  const [catalogCategories, setCatalogCategories] =
    useState<CatalogCategory[]>([]);

  const [categoryCounts, setCategoryCounts] =
    useState<Record<number, number>>({});

  /*
  | Total produk aktif = jumlah products_count per kategori.
  | Dipakai untuk angka di "Semua Kategori" supaya tidak ikut berubah
  | saat filter lain aktif (productTotal ikut berubah karena hasil filter).
  */
  const totalActiveProducts =
    Object.values(categoryCounts).reduce(
      (total, count) => total + count,
      0
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY DISPLAY
  |--------------------------------------------------------------------------
  */

  const visibleCategories =
    catalogCategories.slice(0, 6);

  const otherCategories =
    catalogCategories.slice(6);

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  |
  | Semua filtering dan pagination dilakukan oleh Laravel.
  |
  */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        params.set(
          'page',
          String(currentPage)
        );

        params.set(
          'per_page',
          String(perPage)
        );

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if (search.trim()) {
          params.set(
            'search',
            search.trim()
          );
        }

        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        if (selectedCategory !== null) {
          params.set(
            'category_id',
            String(selectedCategory)
          );
        }

        /*
        |--------------------------------------------------------------------------
        | PRICE
        |--------------------------------------------------------------------------
        */

        if (priceRange[0] > 0) {
          params.set(
            'min_price',
            String(priceRange[0])
          );
        }

        if (priceRange[1] < 200000) {
          params.set(
            'max_price',
            String(priceRange[1])
          );
        }

        /*
        |--------------------------------------------------------------------------
        | RATING
        |--------------------------------------------------------------------------
        */

        if (minRating > 0) {
          params.set(
            'min_rating',
            String(minRating)
          );
        }

        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        params.set(
          'sort',
          sortBy
        );

        const response =
          await apiFetch<ProductResponse>(
            `/products?${params.toString()}`
          );

        setProductList(
          (response.data ?? [])
            .map(normalizeProduct)
        );

        setProductTotal(
          response.meta?.total ?? 0
        );

        setLastPage(
          response.meta?.last_page ?? 1
        );

      } catch (error) {
        console.error(
          'Gagal memuat produk catalog:',
          error
        );

        setProductList([]);
        setProductTotal(0);
        setLastPage(1);

      } finally {
        setLoading(false);
      }
    };

    loadProducts();

  }, [
    currentPage,
    perPage,
    search,
    selectedCategory,
    priceRange,
    minRating,
    sortBy,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOAD CATEGORIES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadCategoryCounts =
      async () => {
        try {
          const response =
            await apiFetch<CategoryResponse>(
              '/categories'
            );

          const apiCategories =
            response.data ?? [];

          setCatalogCategories(
            apiCategories
          );

          setCategoryCounts(
            Object.fromEntries(
              apiCategories.map(
                category => [
                  category.id,
                  category.products_count ?? 0,
                ]
              )
            )
          );

        } catch (error) {
          console.error(
            'Gagal memuat kategori:',
            error
          );
        }
      };

    loadCategoryCounts();

  }, []);

  /*
  |--------------------------------------------------------------------------
  | RESET FILTER
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory(null);

    if (searchParams.has('kategori')) {
      searchParams.delete('kategori');
      setSearchParams(searchParams, {
        replace: true,
      });
    }

    setPriceRange([
      0,
      200000,
    ]);
    setMinRating(0);
    setSortBy('terlaris');
    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | CHANGE FILTER
  |--------------------------------------------------------------------------
  */

  const changeCategory = (
    categoryId: number | null
  ) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);

    // Jaga URL tetap mencerminkan filter, supaya link bisa dibagikan.
    if (categoryId === null) {
      searchParams.delete('kategori');
    } else {
      searchParams.set(
        'kategori',
        String(categoryId)
      );
    }

    setSearchParams(searchParams, {
      replace: true,
    });
  };

  const changePrice = (
    min: number,
    max: number
  ) => {
    setPriceRange([
      min,
      max,
    ]);

    setCurrentPage(1);
  };

  const changeRating = (
    rating: number
  ) => {
    setMinRating(rating);
    setCurrentPage(1);
  };

  const changeSort = (
    value: string
  ) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE NAVIGATION
  |--------------------------------------------------------------------------
  */

  const goToPage = (
    page: number
  ) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /*
  |--------------------------------------------------------------------------
  | PAGINATION NUMBERS
  |--------------------------------------------------------------------------
  */

  const getPaginationPages =
    () => {
      const pages: number[] = [];

      if (lastPage <= 7) {
        for (
          let i = 1;
          i <= lastPage;
          i++
        ) {
          pages.push(i);
        }

        return pages;
      }

      pages.push(1);

      if (currentPage > 4) {
        pages.push(-1);
      }

      const start =
        Math.max(
          2,
          currentPage - 1
        );

      const end =
        Math.min(
          lastPage - 1,
          currentPage + 1
        );

      for (
        let i = start;
        i <= end;
        i++
      ) {
        pages.push(i);
      }

      if (
        currentPage <
        lastPage - 3
      ) {
        pages.push(-1);
      }

      pages.push(lastPage);

      return pages;
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >

      {/* Breadcrumb */}

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 24,
          fontSize: '0.8rem',
          color: '#9CA3AF',
        }}
      >
        <button
          onClick={() =>
            navigate('home')
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
          Beranda
        </button>

        <span>/</span>

        <span
          style={{
            color: '#1F2937',
            fontWeight: 600,
          }}
        >
          Katalog Produk
        </span>
      </div>

      {/* Title */}

      <h1
        style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#1F2937',
          margin: '0 0 24px',
        }}
      >
        Katalog Produk
      </h1>

      {/* Search + Sort */}

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 200,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform:
                'translateY(-50%)',
              fontSize: 16,
            }}
          >
            🔍
          </span>

          <input
            className="input-field"
            style={{
              paddingLeft: 38,
            }}
            placeholder="Cari produk oleh-oleh..."
            value={search}
            onChange={e => {
              setSearch(
                e.target.value
              );

              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="input-field"
          style={{
            width: 'auto',
            minWidth: 160,
            cursor: 'pointer',
          }}
          value={sortBy}
          onChange={e =>
            changeSort(
              e.target.value
            )
          }
        >
          <option value="terlaris">
            Terlaris
          </option>

          <option value="termurah">
            Harga Terendah
          </option>

          <option value="termahal">
            Harga Tertinggi
          </option>

          <option value="rating">
            Rating Tertinggi
          </option>

          <option value="terbaru">
            Terbaru
          </option>
        </select>
      </div>

      {/* Main layout */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            '240px 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >

        {/* SIDEBAR */}

        <div
          style={{
            background: 'white',
            borderRadius: 14,
            padding: '24px',
            boxShadow:
              '0 2px 12px rgba(0,0,0,0.06)',
            border:
              '1px solid rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 88,
          }}
        >

          {/* Filter header */}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontWeight: 700,
                color: '#1F2937',
              }}
            >
              Filter
            </h3>

            <button
              onClick={resetFilters}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#F97316',
                fontSize: '0.8rem',
                fontFamily: 'Poppins',
              }}
            >
              Reset
            </button>
          </div>

          {/* CATEGORY */}

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <h4
              style={{
                margin:
                  '0 0 12px',
                fontSize:
                  '0.85rem',
                fontWeight: 700,
                color: '#374151',
                textTransform:
                  'uppercase',
                letterSpacing: 1,
              }}
            >
              Kategori
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: 6,
              }}
            >

              <button
                onClick={() =>
                  changeCategory(null)
                }
                style={{
                  textAlign: 'left',
                  padding:
                    '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background:
                    selectedCategory === null
                      ? 'rgba(249,115,22,0.1)'
                      : 'transparent',
                  color:
                    selectedCategory === null
                      ? '#F97316'
                      : '#374151',
                  fontFamily:
                    'Poppins',
                  fontWeight:
                    selectedCategory === null
                      ? 600
                      : 400,
                  fontSize:
                    '0.875rem',
                  cursor:
                    'pointer',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                }}
              >
                <span>
                  Semua Kategori
                </span>

                <span
                  style={{
                    fontSize:
                      '0.75rem',
                    color:
                      '#9CA3AF',
                  }}
                >
                  {totalActiveProducts}
                </span>
              </button>

              {visibleCategories.map(
                category => (
                  <button
                    key={category.id}
                    onClick={() =>
                      changeCategory(
                        category.id
                      )
                    }
                    style={{
                      textAlign:
                        'left',
                      padding:
                        '8px 10px',
                      borderRadius:
                        8,
                      border:
                        'none',
                      background:
                        selectedCategory ===
                        category.id
                          ? 'rgba(249,115,22,0.1)'
                          : 'transparent',
                      color:
                        selectedCategory ===
                        category.id
                          ? '#F97316'
                          : '#374151',
                      fontFamily:
                        'Poppins',
                      fontWeight:
                        selectedCategory ===
                        category.id
                          ? 600
                          : 400,
                      fontSize:
                        '0.875rem',
                      cursor:
                        'pointer',
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                    }}
                  >
                    <span>
                      {category.icon}{' '}
                      {category.name}
                    </span>

                    <span
                      style={{
                        fontSize:
                          '0.75rem',
                        color:
                          '#9CA3AF',
                      }}
                    >
                      {
                        categoryCounts[
                          category.id
                        ]
                      ?? 0}
                    </span>
                  </button>
                )
              )}

              {otherCategories.length >
                0 && (
                <select
                  className="input-field"
                  value={
                    selectedCategory ??
                    ''
                  }
                  onChange={e =>
                    changeCategory(
                      e.target.value
                        ? Number(
                            e.target
                              .value
                          )
                        : null
                    )
                  }
                  style={{
                    width: '100%',
                    cursor:
                      'pointer',
                    fontSize:
                      '0.875rem',
                  }}
                >
                  <option value="">
                    Lainnya
                  </option>

                  {otherCategories.map(
                    category => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name} (
                        {categoryCounts[
                          category.id
                        ] ?? 0}
                        )
                      </option>
                    )
                  )}
                </select>
              )}
            </div>
          </div>

          {/* PRICE */}

          <div
            style={{
              marginBottom: 24,
            }}
          >
            <h4
              style={{
                margin:
                  '0 0 12px',
                fontSize:
                  '0.85rem',
                fontWeight: 700,
                color: '#374151',
                textTransform:
                  'uppercase',
                letterSpacing: 1,
              }}
            >
              Harga
            </h4>

            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {[
                [0, 25000],
                [25000, 50000],
                [50000, 100000],
                [100000, 200000],
              ].map(
                ([min, max]) => (
                  <button
                    key={`${min}-${max}`}
                    onClick={() =>
                      changePrice(
                        min,
                        max
                      )
                    }
                    style={{
                      flex: 1,
                      padding:
                        '6px 2px',
                      borderRadius:
                        6,
                      border:
                        '1px solid',
                      borderColor:
                        priceRange[0] ===
                          min &&
                        priceRange[1] ===
                          max
                          ? '#F97316'
                          : '#E5E7EB',
                      background:
                        priceRange[0] ===
                          min &&
                        priceRange[1] ===
                          max
                          ? 'rgba(249,115,22,0.1)'
                          : 'white',
                      color:
                        priceRange[0] ===
                          min &&
                        priceRange[1] ===
                          max
                          ? '#F97316'
                          : '#6B7280',
                      fontSize:
                        '0.7rem',
                      fontFamily:
                        'Poppins',
                      cursor:
                        'pointer',
                    }}
                  >
                    {formatPrice(
                      max
                    ).replace(
                      'Rp ',
                      ''
                    )}
                  </button>
                )
              )}
            </div>

            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={
                priceRange[1]
              }
              onChange={e =>
                changePrice(
                  0,
                  Number(
                    e.target.value
                  )
                )
              }
              style={{
                width: '100%',
                accentColor:
                  '#F97316',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                fontSize:
                  '0.75rem',
                color:
                  '#9CA3AF',
                marginTop: 4,
              }}
            >
              <span>
                Rp 0
              </span>

              <span>
                {formatPrice(
                  priceRange[1]
                )}
              </span>
            </div>
          </div>

          {/* RATING */}

          <div>
            <h4
              style={{
                margin:
                  '0 0 12px',
                fontSize:
                  '0.85rem',
                fontWeight: 700,
                color: '#374151',
                textTransform:
                  'uppercase',
                letterSpacing: 1,
              }}
            >
              Rating
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: 6,
              }}
            >
              {[4.5, 4, 3.5, 0].map(
                rating => (
                  <button
                    key={rating}
                    onClick={() =>
                      changeRating(
                        rating
                      )
                    }
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 8,
                      padding:
                        '6px 10px',
                      borderRadius:
                        8,
                      border:
                        'none',
                      background:
                        minRating ===
                        rating
                          ? 'rgba(249,115,22,0.1)'
                          : 'transparent',
                      cursor:
                        'pointer',
                      fontFamily:
                        'Poppins',
                      fontSize:
                        '0.85rem',
                      color:
                        '#374151',
                    }}
                  >
                    <span
                      style={{
                        color:
                          '#FACC15',
                      }}
                    >
                      {'★'.repeat(
                        rating >=
                          1
                          ? Math.floor(
                              rating
                            )
                          : 5
                      )}
                    </span>

                    <span
                      style={{
                        color:
                          '#6B7280',
                      }}
                    >
                      {rating === 0
                        ? 'Semua'
                        : `${rating}+`}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* PRODUCT CONTENT */}

        <div>

          {/* Result info */}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#6B7280',
                fontSize:
                  '0.875rem',
              }}
            >
              Menampilkan{' '}

              <strong
                style={{
                  color:
                    '#1F2937',
                }}
              >
                {productTotal}
              </strong>{' '}
              produk
            </p>

            {selectedCategory !==
              null && (
              <button
                onClick={() =>
                  changeCategory(null)
                }
                title={
                  'Hapus filter kategori'
                }
                style={{
                  background:
                    'rgba(249,115,22,0.1)',
                  color:
                    '#F97316',
                  border: 'none',
                  borderRadius:
                    100,
                  padding:
                    '4px 12px',
                  fontSize:
                    '0.78rem',
                  fontWeight: 600,
                  fontFamily:
                    'Poppins',
                  cursor:
                    'pointer',
                }}
              >
                {
                  catalogCategories.find(
                    category =>
                      category.id ===
                      selectedCategory
                  )?.name
                }{' '}
                ✕
              </button>
            )}
          </div>

          {/* Loading */}

          {loading ? (
            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 18,
              }}
            >
              {Array.from({
                length: perPage,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    style={{
                      height: 310,
                      background:
                        'white',
                      borderRadius:
                        14,
                      border:
                        '1px solid #F3F4F6',
                      animation:
                        'pulse 1.5s infinite',
                    }}
                  />
                )
              )}
            </div>
          ) : productList.length >
            0 ? (
            <>
              {/* PRODUCT GRID */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 18,
                }}
              >
                {productList.map(
                  product => (
                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                      navigate={
                        navigate
                      }
                      onAddToCart={
                        onAddToCart as (
                          product: unknown
                        ) => void
                      }
                    />
                  )
                )}
              </div>

              {/* PAGINATION */}

              {lastPage > 1 && (
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'center',
                    alignItems:
                      'center',
                    gap: 6,
                    marginTop: 32,
                  }}
                >
                  {/* PREVIOUS */}

                  <button
                    onClick={() =>
                      goToPage(
                        currentPage -
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    style={{
                      padding:
                        '8px 14px',
                      borderRadius:
                        8,
                      border:
                        '1px solid #E5E7EB',
                      background:
                        'white',
                      cursor:
                        currentPage ===
                        1
                          ? 'not-allowed'
                          : 'pointer',
                      color:
                        currentPage ===
                        1
                          ? '#D1D5DB'
                          : '#374151',
                      fontFamily:
                        'Poppins',
                    }}
                  >
                    ←
                  </button>

                  {/* PAGE NUMBERS */}

                  {getPaginationPages().map(
                    (
                      page,
                      index
                    ) =>
                      page === -1 ? (
                        <span
                          key={`ellipsis-${index}`}
                          style={{
                            width: 36,
                            textAlign:
                              'center',
                            color:
                              '#9CA3AF',
                          }}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={
                            page
                          }
                          onClick={() =>
                            goToPage(
                              page
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius:
                              8,
                            border:
                              '1px solid',
                            borderColor:
                              currentPage ===
                              page
                                ? '#F97316'
                                : '#E5E7EB',
                            background:
                              currentPage ===
                              page
                                ? '#F97316'
                                : 'white',
                            color:
                              currentPage ===
                              page
                                ? 'white'
                                : '#374151',
                            cursor:
                              'pointer',
                            fontFamily:
                              'Poppins',
                            fontWeight:
                              currentPage ===
                              page
                                ? 700
                                : 400,
                          }}
                        >
                          {page}
                        </button>
                      )
                  )}

                  {/* NEXT */}

                  <button
                    onClick={() =>
                      goToPage(
                        currentPage +
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      lastPage
                    }
                    style={{
                      padding:
                        '8px 14px',
                      borderRadius:
                        8,
                      border:
                        '1px solid #E5E7EB',
                      background:
                        'white',
                      cursor:
                        currentPage ===
                        lastPage
                          ? 'not-allowed'
                          : 'pointer',
                      color:
                        currentPage ===
                        lastPage
                          ? '#D1D5DB'
                          : '#374151',
                      fontFamily:
                        'Poppins',
                    }}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          ) : (
            /* EMPTY */

            <div
              style={{
                textAlign:
                  'center',
                padding:
                  '80px 20px',
                background:
                  'white',
                borderRadius:
                  14,
              }}
            >
              <div
                style={{
                  fontSize: 64,
                  marginBottom: 16,
                }}
              >
                🔍
              </div>

              <h3
                style={{
                  color:
                    '#1F2937',
                  margin:
                    '0 0 8px',
                }}
              >
                Produk tidak
                ditemukan
              </h3>

              <p
                style={{
                  color:
                    '#9CA3AF',
                  margin:
                    '0 0 20px',
                }}
              >
                Coba kata kunci
                lain atau ubah
                filter
              </p>

              <button
                className="btn-primary"
                onClick={
                  resetFilters
                }
                style={{
                  padding:
                    '10px 24px',
                }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
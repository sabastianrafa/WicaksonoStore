import { useEffect, useState } from "react";
import { getProducts, getCategories } from "../../api/products";
import type { Product, Category } from "../../api/products";
import ProductCard from "../../components/ProductCard";
import type { Page } from "../../App";
import { formatPrice } from "../../api/products";
import { FiSliders, FiX, FiSearch } from "react-icons/fi";

interface CatalogPageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

export default function CatalogPage({
  navigate,
  onAddToCart,
}: CatalogPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("terlaris");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const perPage = 8;

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();

      setProducts(data);
      setCategories(getCategories(data));
      setCurrentPage(1);
    } catch (err) {
      console.error("Gagal mengambil produk:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data produk"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchCat =
        selectedCategory === "all" ||
        p.categoryId === selectedCategory;

      const matchPrice =
        p.price >= priceRange[0] &&
        p.price <= priceRange[1];

      const matchRating = p.rating >= minRating;

      return (
        matchSearch &&
        matchCat &&
        matchPrice &&
        matchRating
      );
    })
    .sort((a, b) => {
      if (sortBy === "terlaris") {
        return b.sold - a.sold;
      }

      if (sortBy === "termurah") {
        return a.price - b.price;
      }

      if (sortBy === "termahal") {
        return b.price - a.price;
      }

      if (sortBy === "rating") {
        return b.rating - a.rating;
      }

      return 0;
    });

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.ceil(filtered.length / perPage);

  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  /* =========================================================
     ACTIVE FILTER COUNT
  ========================================================= */

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (priceRange[1] < 200000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  /* =========================================================
     RESET FILTER
  ========================================================= */

  const resetFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 200000]);
    setMinRating(0);
    setSearch("");
    setCurrentPage(1);
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#DF3F1E] border-t-transparent" />

        <h2 className="text-xl font-semibold tracking-wide text-gray-700">
          Memuat produk...
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Mohon tunggu sebentar
        </p>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800">
          Gagal Memuat Produk
        </h2>

        <p className="mb-6 mt-2 max-w-sm text-sm text-gray-500">
          Terjadi masalah saat mengambil data dari server.
          Silakan periksa koneksi internet Anda.
        </p>

        <button
          type="button"
          onClick={loadProducts}
          disabled={loading}
          className="
            rounded-lg
            bg-[#DF3F1E]
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            shadow-sm
            transition-all
            duration-200
            hover:bg-[#C93618]
            active:scale-95
            disabled:cursor-not-allowed
            disabled:bg-red-400
          "
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  /* =========================================================
     FILTER PANEL
  ========================================================= */

  const filterPanel = (
    <div
      className="
        rounded-[14px]
        border
        border-black/5
        bg-white
        p-6
        shadow-[0_2px_12px_rgba(0,0,0,0.06)]
      "
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">
          Filter
        </h3>

        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="
              border-none
              bg-transparent
              font-[Poppins]
              text-xs
              text-[#DF3F1E]
              transition-colors
              hover:text-[#C93618]
            "
          >
            Reset
          </button>

          {/* Close mobile */}
          <button
            onClick={() => setShowFilters(false)}
            aria-label="Tutup filter"
            className="
              flex
              h-[30px]
              w-[30px]
              items-center
              justify-center
              rounded-lg
              bg-gray-100
              text-gray-600
              transition-colors
              hover:bg-gray-200
              min-[901px]:hidden
            "
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* =====================================================
          CATEGORY
      ===================================================== */}

      <div className="mb-6">
        <h4
          className="
            mb-3
            text-[0.85rem]
            font-bold
            uppercase
            tracking-[1px]
            text-gray-700
          "
        >
          Kategori
        </h4>

        <div className="flex flex-col gap-1.5">
          {/* All */}
          <button
            onClick={() => {
              setSelectedCategory("all");
              setCurrentPage(1);
            }}
            className={`
              flex
              w-full
              items-center
              justify-between
              rounded-lg
              border-none
              px-2.5
              py-2
              text-left
              font-[Poppins]
              text-sm
              transition-all
              duration-200

              ${
                selectedCategory === "all"
                  ? "bg-[#DF3F1E]/10 font-semibold text-[#DF3F1E]"
                  : "bg-transparent font-normal text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span>Semua Kategori</span>
          </button>

          {/* Categories */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`
                flex
                w-full
                items-center
                justify-between
                rounded-lg
                border-none
                px-2.5
                py-2
                text-left
                font-[Poppins]
                text-sm
                transition-all
                duration-200

                ${
                  selectedCategory === cat.id
                    ? "bg-[#DF3F1E]/10 font-semibold text-[#DF3F1E]"
                    : "bg-transparent font-normal text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <span>
                {cat.icon} {cat.name}
              </span>

              <span className="text-xs text-gray-400">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          PRICE
      ===================================================== */}

      <div className="mb-6">
        <h4
          className="
            mb-3
            text-[0.85rem]
            font-bold
            uppercase
            tracking-[1px]
            text-gray-700
          "
        >
          Harga
        </h4>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {[
            [0, 25000],
            [25000, 50000],
            [50000, 100000],
            [100000, 200000],
          ].map(([min, max]) => {
            const active =
              priceRange[0] === min &&
              priceRange[1] === max;

            return (
              <button
                key={`${min}-${max}`}
                onClick={() => {
                  setPriceRange([min, max]);
                  setCurrentPage(1);
                }}
                className={`
                  rounded-md
                  border
                  px-1
                  py-1.5
                  font-[Poppins]
                  text-[0.7rem]
                  transition-all

                  ${
                    active
                      ? "border-[#DF3F1E] bg-[#DF3F1E]/10 text-[#DF3F1E]"
                      : "border-gray-200 bg-white text-gray-500 hover:border-[#DF3F1E]/40"
                  }
                `}
              >
                {formatPrice(max).replace("Rp ", "")}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={200000}
          step={5000}
          value={priceRange[1]}
          onChange={(e) => {
            setPriceRange([0, +e.target.value]);
            setCurrentPage(1);
          }}
          className="
            w-full
            accent-[#DF3F1E]
          "
        />

        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>Rp 0</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* =====================================================
          RATING
      ===================================================== */}

      <div>
        <h4
          className="
            mb-3
            text-[0.85rem]
            font-bold
            uppercase
            tracking-[1px]
            text-gray-700
          "
        >
          Rating
        </h4>

        <div className="flex flex-col gap-1.5">
          {[4.5, 4, 3.5, 0].map((r) => (
            <button
              key={r}
              onClick={() => {
                setMinRating(r);
                setCurrentPage(1);
              }}
              className={`
                flex
                items-center
                gap-2
                rounded-lg
                border-none
                px-2.5
                py-1.5
                text-left
                font-[Poppins]
                text-sm
                transition-all

                ${
                  minRating === r
                    ? "bg-[#DF3F1E]/10"
                    : "bg-transparent hover:bg-gray-50"
                }
              `}
            >
              <span className="text-yellow-400">
                {"★".repeat(r >= 1 ? Math.floor(r) : 5)}
              </span>

              <span className="text-gray-500">
                {r === 0 ? "Semua" : `${r}+`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Apply */}
      <button
        onClick={() => setShowFilters(false)}
        className="
          mt-6
          block
          w-full
          rounded-[10px]
          bg-[#DF3F1E]
          px-3
          py-3
          font-[Poppins]
          font-bold
          text-white
          transition-colors
          hover:bg-[#C93618]
          min-[901px]:hidden
        "
      >
        Terapkan Filter
      </button>
    </div>
  );

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="mb-6 flex items-center gap-2 text-xs text-gray-400">
        <button
          onClick={() => navigate("home")}
          className="
            border-none
            bg-transparent
            font-[Poppins]
            text-xs
            text-[#DF3F1E]
            transition-colors
            hover:text-[#C93618]
          "
        >
          Beranda
        </button>

        <span>/</span>

        <span className="font-semibold text-gray-800">
          Katalog Produk
        </span>
      </div>

      {/* =====================================================
          TITLE
      ===================================================== */}

      <h1
        className="
          mb-6
          text-[clamp(1.4rem,3vw,1.8rem)]
          font-extrabold
          text-gray-800
        "
      >
        Katalog Produk
      </h1>

      {/* =====================================================
          SEARCH + SORT
      ===================================================== */}

      <div
        className="
          mb-6
          flex
          flex-wrap
          gap-3
          max-[480px]:flex-col
        "
      >
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowFilters(true)}
          className="
            hidden
            h-[47px]
            items-center
            gap-2
            whitespace-nowrap
            rounded-[10px]
            border
            border-gray-200
            bg-white
            px-4
            font-[Poppins]
            text-sm
            font-semibold
            text-gray-700
            transition-colors
            hover:bg-gray-50
            max-[900px]:inline-flex
          "
        >
          <FiSliders size={16} />

          Filter

          {activeFilterCount > 0 && (
            <span
              className="
                inline-flex
                h-[18px]
                w-[18px]
                items-center
                justify-center
                rounded-full
                bg-[#DF3F1E]
                text-[0.65rem]
                text-white
              "
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <FiSearch
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
            size={16}
          />

          <input
            placeholder="Cari produk oleh-oleh..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="
              h-[47px]
              w-full
              rounded-[10px]
              border
              border-gray-200
              bg-white
              pl-[38px]
              pr-4
              font-[Poppins]
              text-sm
              text-gray-700
              outline-none
              transition-all
              placeholder:text-gray-400
              focus:border-[#DF3F1E]
              focus:ring-2
              focus:ring-[#DF3F1E]/10
            "
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="
            h-[47px]
            min-w-[160px]
            cursor-pointer
            rounded-[10px]
            border
            border-gray-200
            bg-white
            px-4
            font-[Poppins]
            text-sm
            text-gray-700
            outline-none
            focus:border-[#DF3F1E]
            focus:ring-2
            focus:ring-[#DF3F1E]/10
            max-[480px]:w-full
          "
        >
          <option value="terlaris">Terlaris</option>
          <option value="termurah">Harga Terendah</option>
          <option value="termahal">Harga Tertinggi</option>
          <option value="rating">Rating Tertinggi</option>
        </select>
      </div>

      {/* =====================================================
          CATALOG LAYOUT
      ===================================================== */}

      <div className="grid grid-cols-[240px_1fr] items-start gap-6 max-[900px]:grid-cols-1">
        {/* ===================================================
            MOBILE OVERLAY
        =================================================== */}

        <div
          onClick={() => setShowFilters(false)}
          className={`
            fixed
            inset-0
            z-[55]
            bg-black/40
            transition-opacity
            duration-200
            min-[901px]:hidden

            ${
              showFilters
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }
          `}
        />

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <div
          className={`
            sticky
            top-[88px]
            max-[900px]:fixed
            max-[900px]:left-0
            max-[900px]:top-0
            max-[900px]:z-[60]
            max-[900px]:h-dvh
            max-[900px]:w-[min(320px,85vw)]
            max-[900px]:overflow-y-auto
            max-[900px]:bg-gray-50
            max-[900px]:p-5
            max-[900px]:shadow-[0_0_30px_rgba(0,0,0,0.15)]
            max-[900px]:transition-transform
            max-[900px]:duration-300

            ${
              showFilters
                ? "max-[900px]:translate-x-0"
                : "max-[900px]:-translate-x-full"
            }
          `}
        >
          {filterPanel}
        </div>

        {/* ===================================================
            PRODUCTS
        =================================================== */}

        <div>
          {/* Result Header */}
          <div
            className="
              mb-4
              flex
              flex-wrap
              items-center
              justify-between
              gap-2
            "
          >
            <p className="m-0 text-sm text-gray-500">
              Menampilkan{" "}
              <strong className="text-gray-800">
                {filtered.length}
              </strong>{" "}
              produk
            </p>

            <div className="flex flex-wrap gap-1.5">
              {selectedCategory !== "all" && (
                <span
                  className="
                    rounded-full
                    bg-[#DF3F1E]/10
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-[#DF3F1E]
                  "
                >
                  {
                    categories.find(
                      (c) => c.id === selectedCategory
                    )?.name
                  }{" "}
                  ✕
                </span>
              )}
            </div>
          </div>

          {/* =================================================
              PRODUCT GRID
          ================================================= */}

          {paginated.length > 0 ? (
            <div
              className="
                grid
                grid-cols-[repeat(auto-fill,minmax(160px,1fr))]
                gap-[18px]
              "
            >
              {paginated.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  navigate={navigate}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            /* =================================================
               EMPTY STATE
            ================================================= */

            <div
              className="
                rounded-[14px]
                bg-white
                px-5
                py-20
                text-center
              "
            >
              <div className="mb-4 text-[64px]">
                🔍
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Produk tidak ditemukan
              </h3>

              <p className="mb-5 text-sm text-gray-400">
                Coba kata kunci lain atau ubah filter
              </p>

              <button
                onClick={resetFilters}
                className="
                  rounded-lg
                  bg-[#DF3F1E]
                  px-6
                  py-2.5
                  font-[Poppins]
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  duration-200
                  hover:bg-[#C93618]
                  active:scale-95
                "
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {totalPages > 1 && (
            <div
              className="
                mt-8
                flex
                flex-wrap
                justify-center
                gap-1.5
              "
            >
              {/* Previous */}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
                className={`
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  px-3.5
                  py-2
                  font-[Poppins]
                  transition-all

                  ${
                    currentPage === 1
                      ? "cursor-not-allowed text-gray-300"
                      : "text-gray-700 hover:border-[#DF3F1E] hover:text-[#DF3F1E]"
                  }
                `}
              >
                ←
              </button>

              {/* Page Numbers */}
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`
                    h-9
                    w-9
                    rounded-lg
                    border
                    font-[Poppins]
                    text-sm
                    transition-all

                    ${
                      currentPage === p
                        ? "border-[#DF3F1E] bg-[#DF3F1E] font-bold text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#DF3F1E] hover:text-[#DF3F1E]"
                    }
                  `}
                >
                  {p}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={currentPage === totalPages}
                className={`
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  px-3.5
                  py-2
                  font-[Poppins]
                  transition-all

                  ${
                    currentPage === totalPages
                      ? "cursor-not-allowed text-gray-300"
                      : "text-gray-700 hover:border-[#DF3F1E] hover:text-[#DF3F1E]"
                  }
                `}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { getProducts, getCategories } from "../api/products";
import type { Product, Category } from "../api/products";
import ProductCard from "../components/ProductCard";
import type { Page } from "../App";
import { formatPrice } from "../api/products";

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
    "all",
  );
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("terlaris");
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const perPage = 8;

  // load produk
  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();

      setProducts(data);
      setCategories(getCategories(data));

      // Kembali ke halaman pertama setelah berhasil load
      setCurrentPage(1);
    } catch (err) {
      console.error("Gagal mengambil produk:", err);

      setError(
        err instanceof Error ? err.message : "Gagal mengambil data produk",
      );
    } finally {
      setLoading(false);
    }
  }

  // load
  useEffect(() => {
    loadProducts();
  }, []);

  // filter
  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchRating = p.rating >= minRating;
      return matchSearch && matchCat && matchPrice && matchRating;
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

  const totalPages = Math.ceil(filtered.length / perPage);

  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  // laod
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-20 text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 tracking-wide">
          Memuat produk...
        </h2>
        <p className="text-sm text-gray-400 mt-1">Mohon tunggu sebentar</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Gagal Memuat Produk</h2>
        <p className="text-sm text-gray-500 max-w-sm mt-2 mb-6">
          Terjadi masalah saat mengambil data dari server. Silakan periksa
          koneksi internet Anda.
        </p>
        <button
          type="button"
          onClick={loadProducts}
          disabled={loading}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-sm rounded-lg transition-all duration-200 shadow-sm active:scale-95">
          Coba Lagi
        </button>
      </div>
    );
  }

  // konten
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 24,
          fontSize: "0.8rem",
          color: "#9CA3AF",
        }}>
        <button
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
        <span style={{ color: "#1F2937", fontWeight: 600 }}>
          Katalog Produk
        </span>
      </div>

      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: 800,
          color: "#1F2937",
          margin: "0 0 24px",
        }}>
        Katalog Produk
      </h1>

      {/* search */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
            }}>
            🔍
          </span>
          <input
            className="input-field"
            style={{ paddingLeft: 38 }}
            placeholder="Cari produk oleh-oleh..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="input-field"
          style={{ width: "auto", minWidth: 160, cursor: "pointer" }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}>
          <option value="terlaris">Terlaris</option>
          <option value="termurah">Harga Terendah</option>
          <option value="termahal">Harga Tertinggi</option>
          <option value="rating">Rating Tertinggi</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 24,
          alignItems: "start",
        }}>
        {/* Sidebar Filter */}
        <div
          style={{
            background: "white",
            borderRadius: 14,
            padding: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.05)",
            position: "sticky",
            top: 88,
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: "#1F2937" }}>
              Filter
            </h3>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setPriceRange([0, 200000]);
                setMinRating(0);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#F97316",
                fontSize: "0.8rem",
                fontFamily: "Poppins",
              }}>
              Reset
            </button>
          </div>

          {/* Category */}
          <div style={{ marginBottom: 24 }}>
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}>
              Kategori
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background:
                    selectedCategory === "all"
                      ? "rgba(249,115,22,0.1)"
                      : "transparent",
                  color: selectedCategory === "all" ? "#F97316" : "#374151",
                  fontFamily: "Poppins",
                  fontWeight: selectedCategory === "all" ? 600 : 400,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}>
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      selectedCategory === cat.id
                        ? "rgba(249,115,22,0.1)"
                        : "transparent",
                    color: selectedCategory === cat.id ? "#F97316" : "#374151",
                    fontFamily: "Poppins",
                    fontWeight: selectedCategory === cat.id ? 600 : 400,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <span>
                    {cat.icon} {cat.name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom: 24 }}>
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}>
              Harga
            </h4>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[
                [0, 25000],
                [25000, 50000],
                [50000, 100000],
                [100000, 200000],
              ].map(([min, max]) => (
                <button
                  key={`${min}-${max}`}
                  onClick={() => {
                    setPriceRange([min, max]);
                    setCurrentPage(1);
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 4px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor:
                      priceRange[0] === min && priceRange[1] === max
                        ? "#F97316"
                        : "#E5E7EB",
                    background:
                      priceRange[0] === min && priceRange[1] === max
                        ? "rgba(249,115,22,0.1)"
                        : "white",
                    color:
                      priceRange[0] === min && priceRange[1] === max
                        ? "#F97316"
                        : "#6B7280",
                    fontSize: "0.7rem",
                    fontFamily: "Poppins",
                    cursor: "pointer",
                  }}>
                  {formatPrice(max).replace("Rp\xa0", "")}
                </button>
              ))}
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
              style={{ width: "100%", accentColor: "#F97316" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "#9CA3AF",
                marginTop: 4,
              }}>
              <span>Rp 0</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}>
              Rating
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[4.5, 4, 3.5, 0].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setMinRating(r);
                    setCurrentPage(1);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      minRating === r ? "rgba(249,115,22,0.1)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "Poppins",
                    fontSize: "0.85rem",
                    color: "#374151",
                  }}>
                  <span style={{ color: "#FACC15" }}>
                    {"★".repeat(r >= 1 ? Math.floor(r) : 5)}
                  </span>
                  <span style={{ color: "#6B7280" }}>
                    {r === 0 ? "Semua" : `${r}+`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}>
            <p style={{ margin: 0, color: "#6B7280", fontSize: "0.875rem" }}>
              Menampilkan{" "}
              <strong style={{ color: "#1F2937" }}>{filtered.length}</strong>{" "}
              produk
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {selectedCategory !== "all" && (
                <span
                  style={{
                    background: "rgba(249,115,22,0.1)",
                    color: "#F97316",
                    borderRadius: 100,
                    padding: "4px 12px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}>
                  {categories.find((c) => c.id === selectedCategory)?.name} ✕
                </span>
              )}
            </div>
          </div>

          {paginated.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 18,
              }}>
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
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "white",
                borderRadius: 14,
              }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: "#1F2937", margin: "0 0 8px" }}>
                Produk tidak ditemukan
              </h3>
              <p style={{ color: "#9CA3AF", margin: "0 0 20px" }}>
                Coba kata kunci lain atau ubah filter
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setPriceRange([0, 200000]);
                  setMinRating(0);
                }}
                style={{ padding: "10px 24px" }}>
                Reset Filter
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginTop: 32,
              }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "white",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  color: currentPage === 1 ? "#D1D5DB" : "#374151",
                  fontFamily: "Poppins",
                }}>
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: currentPage === p ? "#F97316" : "#E5E7EB",
                    background: currentPage === p ? "#F97316" : "white",
                    color: currentPage === p ? "white" : "#374151",
                    cursor: "pointer",
                    fontFamily: "Poppins",
                    fontWeight: currentPage === p ? 700 : 400,
                  }}>
                  {p}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  background: "white",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
                  color: currentPage === totalPages ? "#D1D5DB" : "#374151",
                  fontFamily: "Poppins",
                }}>
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

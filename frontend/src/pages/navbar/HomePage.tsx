import { useState } from "react";
import { categories, products, testimonials } from "../../data";
import ProductCard from "../../components/ProductCard";
import type { Page } from "../../App";

// Import berbagai ikon dari react-icons
import { FiTruck, FiShoppingCart, FiAward, FiPackage, FiCreditCard, FiArrowRight } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

interface HomePageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= Math.round(rating) ? "star-filled" : "star-empty"}
          style={{ fontSize: 16, display: "flex" }}>
          <FaStar />
        </span>
      ))}
    </span>
  );
}

export default function HomePage({ navigate, onAddToCart }: HomePageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .hero-section {
          background: linear-gradient(135deg, var(--color-bg) 0%, #FFF3E8 50%, #FEFCE8 100%);
          padding: 30px 24px;
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
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }

        @keyframes float-slow {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-medium {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .anim-float-1 { animation: float-slow 6s ease-in-out infinite; }
        .anim-float-2 { animation: float-medium 5s ease-in-out infinite 1s; }
        .anim-float-3 { animation: float-slow 7s ease-in-out infinite 2s; }

        .hero-collage {
          position: relative;
          width: 100%;
          height: 480px;
          max-width: 500px;
          margin: 0 auto;
        }

        @media (max-width: 992px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
          .hero-section { padding: 60px 20px 40px; }
          .hero-text-wrapper { display: flex; flex-direction: column; align-items: center; }
          .hero-actions { justify-content: center; }
          .hero-collage { transform: scale(0.9); transform-origin: top center; height: 420px; }
        }

        @media (max-width: 576px) {
          .hero-collage { transform: scale(0.7); height: 320px; margin-bottom: -20px; }
          .hero-actions { flex-direction: column; width: 100%; }
          .hero-actions button { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Hero dengan tambahan kelas batik-bg dari CSS */}
      <section className="hero-section batik-bg">
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(223,64,31,0.08)", 
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(22,163,74,0.08)", 
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "40%",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(250,204,21,0.1)", 
            zIndex: 0,
          }}
        />

        <div className="hero-container">
          <div className="hero-grid">
            {/* Kolom Kiri: Teks & Tombol */}
            <div className="hero-text-wrapper fade-in">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(223,64,31,0.1)",
                  borderRadius: 100,
                  padding: "8px 16px",
                  marginBottom: 24,
                  border: "1px solid rgba(223,64,31,0.2)",
                }}>
                <span
                  style={{
                    animation: "pulse-dot 2s infinite",
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    letterSpacing: "0.5px",
                  }}>
                  Terpercaya sejak 2005
                </span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                  fontWeight: 900,
                  color: "var(--color-text)",
                  lineHeight: 1.1,
                  margin: "0 0 24px",
                  letterSpacing: "-1.5px",
                  textShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}>
                Pusat Oleh-Oleh <br />
                <span
                  style={{
                    color: "var(--color-primary)",
                    position: "relative",
                    display: "inline-block",
                    padding: "0 4px",
                  }}>
                  Khas Malang
                </span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(1rem, 1.5vw, 1.15rem)",
                  color: "#4B5563",
                  lineHeight: 1.7,
                  margin: "0 0 36px",
                  maxWidth: 480,
                }}>
                Temukan berbagai pilihan oleh-oleh khas Malang, dari keripik tempe hingga olahan apel, dengan beragam produk pilihan dari oleh-oleh wicaksono malang.
              </p>

              <div
                className="hero-actions"
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  width: "100%",
                }}>
                <button
                  className="btn-primary"
                  style={{ padding: "14px 28px", fontSize: "1rem", display: "inline-flex", alignItems: "center", gap: 8 }}
                  onClick={() => navigate("catalog")}>
                  <FiShoppingCart size={18} /> Belanja Sekarang
                </button>
                <button
                  className="btn-outline"
                  style={{ padding: "14px 28px", fontSize: "1rem" }}
                  onClick={() =>
                    document
                      .getElementById("promo-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }>
                  Lihat Promo
                </button>
              </div>
            </div>

            {/* Kolom Kanan: Kolase Gambar Animasi */}
            <div className="hero-collage fade-in">
              <div
                className="anim-float-1"
                style={{
                  position: "absolute",
                  top: 0,
                  left: "5%",
                  width: "50%",
                  height: "62%",
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(223,64,31,0.25)",
                }}>
                <img
                  src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=480&h=600&fit=crop&auto=format"
                  alt="Keripik Malang"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(223,64,31,0.3), transparent)",
                  }}
                />
              </div>

              <div
                className="anim-float-2"
                style={{
                  position: "absolute",
                  top: "10%",
                  right: "0%",
                  width: "42%",
                  height: "50%",
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(22,163,74,0.25)",
                }}>
                <img
                  src="https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=480&fit=crop&auto=format"
                  alt="Apel Malang"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div
                className="anim-float-3"
                style={{
                  position: "absolute",
                  bottom: "5%",
                  right: "5%",
                  width: "46%",
                  height: "42%",
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(250,204,21,0.3)",
                }}>
                <img
                  src="https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=440&h=400&fit=crop&auto=format"
                  alt="Bakpia"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar dengan React Icons */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}>
            {[
            { icon: <FiTruck />, title: "Gratis Ongkir", sub: "Promo khusus Area Kota Malang" },
            { icon: <FiAward />, title: "100% Asli Malang", sub: "Langsung dari tangan produsen lokal Malang" },
            { icon: <FiPackage />, title: "Pengemasan Super Aman", sub: "Dilengkapi Vakum & Bubble Wrap" },
            { icon: <FiCreditCard />, title: "Pembayaran Mudah", sub: "Tersedia berbagai pilihan metode bayar" },
          ].map(({ icon, title, sub }) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flex: "1 1 200px",
              }}>
              <span style={{ fontSize: 28, color: "var(--color-primary)", display: "flex" }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text)" }}>
                  {title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kategori */}
      {/* Kategori - Versi Upgrade */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span 
            style={{ 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              color: "var(--color-primary)", 
              letterSpacing: "1px", 
              textTransform: "uppercase" 
            }}>
            Kategori Oleh-Oleh
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text)", margin: "8px 0 12px" }}>
            Jelajahi Pilihan Kami
          </h2>
          <p style={{ color: "#6B7280", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Pilih kategori favorit Anda dan rasakan kelezatan otentik yang dibuat langsung oleh tangan-tangan produsen lokal Malang. Yuk, dukung produk UMKM lokal dan pilih oleh-oleh terbaikmu sekarang!
          </p>
        </div>
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 20,
          }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              /* UPGRADE 1: Mengirimkan parameter ID kategori agar halaman katalog langsung mem-filter produk */
              onClick={() => navigate("catalog", { categoryId: cat.id })}
              className="card-hover"
              style={{
                background: "white",
                border: "1px solid #F3F4F6",
                borderRadius: "var(--radius-card)",
                padding: "28px 16px",
                textAlign: "center",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
                outline: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 20,
                  marginBottom: 16,
                  background: `${cat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  transition: "transform 0.3s ease",
                }}>
                {cat.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text)", marginBottom: 6 }}>
                {cat.name}
              </div>
              
              {/* UPGRADE 2: Indikator jumlah ketersediaan barang */}
              <div style={{ 
                fontSize: "0.8rem", 
                color: "#6B7280", 
                fontWeight: 500,
                background: "#F3F4F6",
                padding: "4px 12px",
                borderRadius: 100
              }}>
                {cat.count ? `${cat.count} Produk` : "Lihat Koleksi"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Produk Diskon (Carousel) */}
      <section id="promo-section" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
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
          }}>
          {products.slice(0, 5).map((p) => (
            <div key={p.id} style={{ minWidth: 260, flex: "0 0 auto", scrollSnapAlign: "start" }}>
              <ProductCard product={p} navigate={navigate} onAddToCart={onAddToCart as (product: unknown) => void} />
            </div>
          ))}
        </div>
      </section>

      {/* Tampilan Sekilas Produk */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
            Rekomendasi Oleh-Oleh
          </h2>
          <button
            onClick={() => navigate("catalog")}
            className="btn-outline"
            style={{ padding: "8px 16px", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Lihat Semua Produk <FiArrowRight size={16} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart as (product: unknown) => void} />
          ))}
        </div>
      </section>

      {/* Banner Promo: Eksklusif Gratis Ongkir Malang */}
      <section style={{ maxWidth: 1280, margin: "40px auto", padding: "0 24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            borderRadius: 20,
            padding: "48px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 32,
          }}>
          <div
            style={{
              position: "absolute",
              top: -50,
              right: "10%",
              width: 250,
              height: 250,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1, color: "white", maxWidth: 600 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "white",
                color: "var(--color-primary-dark)",
                fontSize: "0.8rem",
                fontWeight: 800,
                padding: "6px 14px",
                borderRadius: 100,
                marginBottom: 16,
              }}>
              <FiTruck size={16} /> <span>PROMO AREA KOTA MALANG</span>
            </div>
            <h3 style={{ fontSize: "2.5rem", fontWeight: 900, margin: "0 0 12px", lineHeight: 1.1 }}>
              Gratis Ongkir <br />
              Tanpa Minimum Belanja!
            </h3>
            <p style={{ fontSize: "1.1rem", margin: 0, opacity: 0.9 }}>
              Nikmati fasilitas bebas biaya kirim untuk pengiriman ke seluruh
              alamat di wilayah Kota Malang. Pesan hari ini, langsung kami
              antar.
            </p>
          </div>

          <button
            onClick={() => navigate("catalog")}
            style={{
              background: "white",
              color: "var(--color-primary-dark)",
              border: "none",
              borderRadius: 12,
              padding: "16px 32px",
              fontSize: "1.1rem",
              fontWeight: 800,
              cursor: "pointer",
              zIndex: 1,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            Belanja Sekarang
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section
        style={{
          background: "white",
          padding: "64px 24px",
          marginTop: 40,
          borderTop: "1px solid #E5E7EB",
        }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", margin: "8px 0" }}>
              Kata Pelanggan Kami
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>4.9</span>
              <Stars rating={5} />
              <span style={{ color: "#6B7280", fontSize: "0.9rem" }}>
                (Dari 2,100+ ulasan)
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}>
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className="card-hover"
                style={{
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-card)",
                  padding: "24px",
                  border: "1px solid #E5E7EB",
                  boxShadow: activeTestimonial === i ? "0 12px 24px rgba(0,0,0,0.06)" : "0 2px 4px rgba(0,0,0,0.02)",
                  transition: "all 0.3s",
                }}
                onMouseEnter={() => setActiveTestimonial(i)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={t.avatar}
                      alt={t.name}
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.95rem" }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                        Local Guide · {t.city}
                      </div>
                    </div>
                  </div>
                  {/* FcGoogle mengambil dari react-icons/fc */}
                  <FcGoogle size={22} />
                </div>

                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  <Stars rating={t.rating} />
                </div>

                <p style={{ color: "#4B5563", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                  {t.comment}
                </p>

                <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: 16, fontWeight: 500 }}>
                  Varian dibeli: <span style={{ color: "var(--color-primary)" }}>{t.product}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
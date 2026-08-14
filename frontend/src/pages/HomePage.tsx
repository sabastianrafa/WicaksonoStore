import { useState } from 'react';
import { categories, products, testimonials, formatPrice } from '../data';
import ProductCard from '../components/ProductCard';
import type { Page } from '../App';

interface HomePageProps {
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'} style={{ fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

export default function HomePage({ navigate, onAddToCart }: HomePageProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div>
      {/* Hero */}
      <section className="batik-bg" style={{
        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF3E8 50%, #FEFCE8 100%)',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '30%', left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(250,204,21,0.1)', zIndex: 0 }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Text */}
            <div className="fade-in">
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(249,115,22,0.1)', borderRadius: 100,
                padding: '6px 14px', marginBottom: 20, border: '1px solid rgba(249,115,22,0.2)' }}>
                <span style={{ animation: 'pulse-dot 2s infinite', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F97316' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F97316' }}>Terpercaya sejak 2005</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#1F2937',
                lineHeight: 1.15, margin: '0 0 20px',
              }}>
                Pusat Oleh-Oleh{' '}
                <span style={{
                  color: '#F97316',
                  position: 'relative', display: 'inline-block',
                }}>
                  Khas Malang
                  <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0,6 Q50,0 100,6 Q150,12 200,6" stroke="#FACC15" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.75, margin: '0 0 32px', maxWidth: 460 }}>
                Temukan berbagai oleh-oleh khas Malang yang lezat dan autentik. Dari keripik tempe hingga apel segar, kami hadirkan cita rasa terbaik langsung ke pintumu.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                <button className="btn-primary" onClick={() => navigate('catalog')} style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                  🛒 Belanja Sekarang
                </button>
                <button className="btn-outline" style={{ padding: '14px 28px', fontSize: '0.95rem' }}>
                  Lihat Promo
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {[
                  { value: '50+', label: 'Produk Pilihan' },
                  { value: '10rb+', label: 'Pelanggan Puas' },
                  { value: '4.9★', label: 'Rating Rata-rata' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F97316' }}>{value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image Collage */}
            <div style={{ position: 'relative', height: 460 }}>
              <div style={{ position: 'absolute', top: 0, left: 20, width: 240, height: 300, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(249,115,22,0.2)' }}>
                <img src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=480&h=600&fit=crop&auto=format" alt="Keripik Malang" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(249,115,22,0.2), transparent)' }} />
              </div>
              <div style={{ position: 'absolute', top: 40, right: 0, width: 200, height: 240, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(22,163,74,0.2)' }}>
                <img src="https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=480&fit=crop&auto=format" alt="Apel Malang" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 20, width: 220, height: 200, borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 40px rgba(250,204,21,0.25)' }}>
                <img src="https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=440&h=400&fit=crop&auto=format" alt="Bakpia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Floating badge */}
              <div style={{
                position: 'absolute', top: 220, left: 0,
                background: 'white', borderRadius: 12, padding: '12px 16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: 10,
                border: '1px solid rgba(249,115,22,0.15)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1F2937' }}>Pengiriman Cepat</div>
                  <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>Seluruh Indonesia</div>
                </div>
              </div>
              <div style={{
                position: 'absolute', bottom: 60, left: 80,
                background: 'linear-gradient(135deg, #F97316, #EA6C0A)', borderRadius: 12, padding: '12px 16px',
                boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
                display: 'flex', alignItems: 'center', gap: 10, color: 'white',
              }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Terlaris hari ini</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Apel Malang Premium</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.06)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          {[
            { icon: '🚚', title: 'Gratis Ongkir', sub: 'Pembelian min. Rp 100.000' },
            { icon: '✅', title: 'Produk Terjamin', sub: 'Sertifikat BPOM & Halal' },
            { icon: '🔄', title: 'Mudah Dikembalikan', sub: 'Garansi 7 hari' },
            { icon: '🔒', title: 'Pembayaran Aman', sub: 'SSL terenkripsi' },
          ].map(({ icon, title, sub }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F97316', textTransform: 'uppercase', letterSpacing: 2 }}>Kategori</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1F2937', margin: '8px 0' }}>Jelajahi Pilihan Kami</h2>
          <p style={{ color: '#6B7280', maxWidth: 480, margin: '0 auto' }}>Berbagai kategori oleh-oleh khas Malang untuk memenuhi semua selera</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => navigate('catalog')} className="card-hover" style={{
              background: 'white', border: 'none', borderRadius: 14, padding: '24px 16px',
              textAlign: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.25s',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16, margin: '0 auto 12px',
                background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>{cat.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1F2937' }}>{cat.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 4 }}>{cat.count} produk</div>
            </button>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F97316', textTransform: 'uppercase', letterSpacing: 2 }}>Terlaris</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1F2937', margin: '8px 0 0' }}>Produk Pilihan</h2>
          </div>
          <button onClick={() => navigate('catalog')} className="btn-outline" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            Lihat Semua →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart as (product: unknown) => void} />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section style={{ maxWidth: 1280, margin: '32px auto', padding: '0 24px' }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* Left promo */}
          <div style={{
            background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
            padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ background: '#FACC15', color: '#1F2937', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 12 }}>
                ⚡ PROMO SPESIAL
              </div>
              <h3 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
                Diskon 30%<br />Pembelian Pertama
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 20px', fontSize: '0.875rem' }}>
                Gunakan kode: <strong>MALANG30</strong>
              </p>
              <button className="btn-primary" onClick={() => navigate('catalog')} style={{ padding: '12px 24px' }}>
                Klaim Sekarang
              </button>
            </div>
          </div>
          {/* Right promo */}
          <div style={{
            background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
            padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ background: 'white', color: '#F97316', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100, display: 'inline-block', marginBottom: 12 }}>
                🚚 GRATIS ONGKIR
              </div>
              <h3 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
                Kirim ke Seluruh<br />Indonesia
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 20px', fontSize: '0.875rem' }}>
                Minimum pembelian Rp 100.000
              </p>
              <button style={{
                background: 'white', color: '#F97316', border: 'none', borderRadius: 10,
                padding: '12px 24px', fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                cursor: 'pointer', transition: 'transform 0.2s',
              }}
              onClick={() => navigate('catalog')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                Belanja Sekarang
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: 'white', padding: '64px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F97316', textTransform: 'uppercase', letterSpacing: 2 }}>Ulasan</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1F2937', margin: '8px 0' }}>Kata Pelanggan Kami</h2>
            <p style={{ color: '#6B7280', maxWidth: 480, margin: '0 auto' }}>Ribuan pelanggan telah mempercayai kami untuk oleh-oleh khas Malang</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={t.id} className="card-hover" style={{
                background: '#FFF8F0', borderRadius: 16, padding: '28px',
                border: '1px solid rgba(249,115,22,0.12)',
                boxShadow: activeTestimonial === i ? '0 8px 32px rgba(249,115,22,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={() => setActiveTestimonial(i)}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  <Stars rating={t.rating} />
                </div>
                <p style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  "{t.comment}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.avatar} alt={t.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #F97316' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{t.city} · {t.product}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

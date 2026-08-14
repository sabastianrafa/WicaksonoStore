import { useState } from 'react';
import { products, formatPrice } from '../data';
import ProductCard from '../components/ProductCard';
import type { Page } from '../App';

interface ProductDetailPageProps {
  product: {
    id: number; name: string; category: string;
    price: number; originalPrice: number; rating: number;
    reviews: number; sold: number; stock: number; discount: number;
    image: string; description: string; tags: string[];
  };
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: unknown) => void;
}

const mockReviews = [
  { name: 'Ahmad F.', rating: 5, date: '28 Jul 2026', comment: 'Produknya sesuai deskripsi, kemasan aman, dan rasanya enak. Recommended!' },
  { name: 'Budi S.', rating: 4, date: '15 Jul 2026', comment: 'Kualitas bagus, pengiriman cepat. Hanya sedikit terlambat tapi overall puas.' },
  { name: 'Dewi L.', rating: 5, date: '3 Jul 2026', comment: 'Saya sering beli di sini, selalu memuaskan. Pelayanan ramah dan profesional.' },
];

export default function ProductDetailPage({ product, navigate, onAddToCart }: ProductDetailPageProps) {
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [activeTab, setActiveTab] = useState('deskripsi');
  const [added, setAdded] = useState(false);

  const extraImages = [
    product.image,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=400&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop&auto=format',
  ];

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28, fontSize: '0.8rem', color: '#9CA3AF' }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontSize: '0.8rem' }}>Beranda</button>
        <span>/</span>
        <button onClick={() => navigate('catalog')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontSize: '0.8rem' }}>Katalog</button>
        <span>/</span>
        <span style={{ color: '#1F2937', fontWeight: 600 }}>{product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 48 }}>
        {/* Image gallery */}
        <div>
          <div style={{
            borderRadius: 16, overflow: 'hidden', marginBottom: 12,
            background: '#FFF8F0', aspectRatio: '1',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            <img src={extraImages[selectedImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {extraImages.map((img, i) => (
              <button key={i} onClick={() => setSelectedImg(i)} style={{
                flex: 1, aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
                border: `2px solid ${selectedImg === i ? '#F97316' : 'transparent'}`,
                background: 'none', cursor: 'pointer', padding: 0,
                boxShadow: selectedImg === i ? '0 4px 12px rgba(249,115,22,0.25)' : 'none',
                transition: 'border-color 0.2s',
              }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Product info */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316', borderRadius: 100, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{product.category}</span>
            {product.tags.map(t => (
              <span key={t} style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: 100, padding: '4px 12px', fontSize: '0.75rem' }}>{t}</span>
            ))}
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1F2937', margin: '0 0 12px', lineHeight: 1.3 }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} className={i <= Math.round(product.rating) ? 'star-filled' : 'star-empty'} style={{ fontSize: 16 }}>★</span>
              ))}
            </div>
            <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>{product.rating}</span>
            <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>({product.reviews} ulasan)</span>
            <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>· {product.sold.toLocaleString()} terjual</span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #FFF8F0, #FEFCE8)',
            borderRadius: 14, padding: '20px', marginBottom: 24,
            border: '1px solid rgba(249,115,22,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#F97316' }}>{formatPrice(product.price)}</span>
              {product.discount > 0 && (
                <>
                  <span style={{ color: '#9CA3AF', textDecoration: 'line-through', fontSize: '1.1rem' }}>{formatPrice(product.originalPrice)}</span>
                  <span style={{ background: '#F97316', color: 'white', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 700 }}>-{product.discount}%</span>
                </>
              )}
            </div>
            {product.discount > 0 && (
              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>
                Hemat {formatPrice(product.originalPrice - product.price)}!
              </p>
            )}
          </div>

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: product.stock > 0 ? '#16A34A' : '#DC2626' }} />
            <span style={{ fontSize: '0.85rem', color: product.stock > 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
              {product.stock > 0 ? `Stok tersedia (${product.stock} unit)` : 'Stok habis'}
            </span>
          </div>

          {/* Qty selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Jumlah:</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                width: 40, height: 40, border: 'none', background: '#F9FAFB',
                cursor: 'pointer', fontSize: 18, color: '#374151', fontFamily: 'Poppins',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F4F6'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}>−</button>
              <span style={{ width: 48, textAlign: 'center', fontWeight: 700, color: '#1F2937' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{
                width: 40, height: 40, border: 'none', background: '#F9FAFB',
                cursor: 'pointer', fontSize: 18, color: '#374151', fontFamily: 'Poppins',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F4F6'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}>+</button>
            </div>
            <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Maks. {product.stock}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button onClick={handleAddToCart} className="btn-outline" style={{ flex: 1, padding: '14px' }}>
              {added ? '✓ Ditambahkan!' : '🛒 Tambah ke Keranjang'}
            </button>
            <button onClick={() => navigate('checkout')} className="btn-primary" style={{ flex: 1, padding: '14px' }}>
              ⚡ Beli Sekarang
            </button>
          </div>

          {/* Info chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px', background: '#F9FAFB', borderRadius: 12 }}>
            {[
              { icon: '🚚', text: 'Gratis ongkir min. Rp 100.000 · Estimasi tiba 2-3 hari' },
              { icon: '✅', text: 'Produk bersertifikat BPOM & Halal MUI' },
              { icon: '🔄', text: 'Garansi pengembalian 7 hari jika rusak' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #F3F4F6', marginBottom: 24 }}>
          {['deskripsi', 'ulasan', 'pengiriman'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '12px 20px', border: 'none', background: 'none',
              borderBottom: activeTab === tab ? '2px solid #F97316' : '2px solid transparent',
              color: activeTab === tab ? '#F97316' : '#6B7280',
              fontFamily: 'Poppins', fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer', marginBottom: -2,
              textTransform: 'capitalize', transition: 'all 0.2s',
            }}>
              {tab === 'deskripsi' ? 'Deskripsi' : tab === 'ulasan' ? `Ulasan (${product.reviews})` : 'Pengiriman'}
            </button>
          ))}
        </div>

        {activeTab === 'deskripsi' && (
          <div style={{ maxWidth: 720 }}>
            <p style={{ color: '#4B5563', lineHeight: 1.8, margin: 0, fontSize: '0.95rem' }}>{product.description}</p>
          </div>
        )}

        {activeTab === 'ulasan' && (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', gap: 32, marginBottom: 32, padding: '20px', background: '#FFF8F0', borderRadius: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#F97316' }}>{product.rating}</div>
                <div style={{ color: '#FACC15', fontSize: 20 }}>{'★'.repeat(5)}</div>
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: 4 }}>{product.reviews} ulasan</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                {[5,4,3,2,1].map(star => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', minWidth: 16 }}>{star}</span>
                    <span style={{ color: '#FACC15', fontSize: 12 }}>★</span>
                    <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#FACC15', borderRadius: 100, width: `${[78, 15, 5, 1, 1][5-star]}%` }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{[78, 15, 5, 1, 1][5-star]}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mockReviews.map((r, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {r.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1F2937' }}>{r.name}</div>
                        <div style={{ color: '#FACC15', fontSize: 12 }}>{'★'.repeat(r.rating)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{r.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pengiriman' && (
          <div style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'JNE Regular', time: '3-5 hari', price: 'Rp 15.000', icon: '📦' },
                { label: 'JNE Express', time: '1-2 hari', price: 'Rp 25.000', icon: '⚡' },
                { label: 'SiCepat Reguler', time: '2-4 hari', price: 'Rp 12.000', icon: '🚀' },
                { label: 'J&T Express', time: '2-3 hari', price: 'Rp 14.000', icon: '🏃' },
              ].map(({ label, time, price, icon }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Estimasi {time}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#F97316' }}>{price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1F2937', margin: '0 0 24px' }}>Produk Terkait</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {related.map(p => (
              <ProductCard key={p.id} product={p} navigate={navigate} onAddToCart={onAddToCart as (product: unknown) => void} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { formatPrice } from '../data';
import type { Page } from '../App';

interface CartItem {
  id: number; name: string; price: number; image: string;
  quantity: number; category: string;
}

interface CartPageProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  navigate: (page: Page) => void;
}

export default function CartPage({ cart, setCart, navigate }: CartPageProps) {
  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.id !== id));
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i));
    }
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 100000 ? 0 : 15000;
  const total = subtotal + shipping;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: '0.8rem', color: '#9CA3AF' }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontSize: '0.8rem' }}>Beranda</button>
        <span>/</span>
        <span style={{ color: '#1F2937', fontWeight: 600 }}>Keranjang Belanja</span>
      </div>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', margin: '0 0 32px' }}>
        Keranjang Belanja {cart.length > 0 && <span style={{ color: '#F97316' }}>({cart.length})</span>}
      </h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🛒</div>
          <h2 style={{ color: '#1F2937', margin: '0 0 12px' }}>Keranjang Kosong</h2>
          <p style={{ color: '#9CA3AF', margin: '0 0 28px' }}>Belum ada produk di keranjangmu. Mulai belanja yuk!</p>
          <button className="btn-primary" onClick={() => navigate('catalog')} style={{ padding: '14px 32px', fontSize: '1rem' }}>
            🛍️ Mulai Belanja
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Cart items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Select all bar */}
            <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>Semua Produk</span>
              <button onClick={() => setCart([])} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#DC2626', fontFamily: 'Poppins', fontSize: '0.85rem', fontWeight: 500,
              }}>Hapus Semua</button>
            </div>

            {cart.map(item => (
              <div key={item.id} style={{
                background: 'white', borderRadius: 14, padding: '16px 20px',
                display: 'flex', gap: 16, alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                <img src={item.image} alt={item.name} style={{
                  width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
                  background: '#FFF8F0',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'capitalize' }}>{item.category}</p>
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </h3>
                  <p style={{ margin: 0, fontWeight: 700, color: '#F97316' }}>{formatPrice(item.price)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                  <button onClick={() => updateQty(item.id, 0)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                    color: '#9CA3AF', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#DC2626'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}>✕</button>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{
                      width: 32, height: 32, border: 'none', background: '#F9FAFB',
                      cursor: 'pointer', fontSize: 16, color: '#374151',
                    }}>−</button>
                    <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#1F2937' }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{
                      width: 32, height: 32, border: 'none', background: '#F9FAFB',
                      cursor: 'pointer', fontSize: 16, color: '#374151',
                    }}>+</button>
                  </div>
                  <span style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.9rem' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#1F2937' }}>Ringkasan Pesanan</h3>

              {/* Promo code */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input className="input-field" placeholder="Kode promo" style={{ flex: 1 }} />
                <button className="btn-secondary" style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>Pakai</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Subtotal ({cart.length} produk)</span>
                  <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Ongkir</span>
                  <span style={{ fontWeight: 600, color: shipping === 0 ? '#16A34A' : '#1F2937', fontSize: '0.875rem' }}>
                    {shipping === 0 ? 'Gratis!' : formatPrice(shipping)}
                  </span>
                </div>
                {subtotal < 100000 && (
                  <div style={{ background: 'rgba(22,163,74,0.08)', borderRadius: 8, padding: '10px', fontSize: '0.78rem', color: '#16A34A', fontWeight: 600 }}>
                    💡 Tambah {formatPrice(100000 - subtotal)} lagi untuk gratis ongkir!
                  </div>
                )}
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#1F2937' }}>Total</span>
                  <span style={{ fontWeight: 800, color: '#F97316', fontSize: '1.1rem' }}>{formatPrice(total)}</span>
                </div>
              </div>

              <button className="btn-primary" onClick={() => navigate('checkout')} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                Lanjut ke Pembayaran →
              </button>
              <button onClick={() => navigate('catalog')} style={{
                width: '100%', marginTop: 10, padding: '12px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6B7280', fontFamily: 'Poppins', fontSize: '0.875rem',
              }}>
                ← Lanjut Belanja
              </button>
            </div>

            {/* Payment methods */}
            <div style={{ marginTop: 16, padding: '16px', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 600 }}>METODE PEMBAYARAN</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['VISA', 'BCA', 'GoPay', 'OVO', 'DANA', 'Transfer'].map(m => (
                  <span key={m} style={{ background: '#F3F4F6', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, color: '#4B5563' }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

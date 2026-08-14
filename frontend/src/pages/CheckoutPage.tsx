import { useState } from 'react';
import { formatPrice } from '../data';
import type { Page } from '../App';

interface CartItem { id: number; name: string; price: number; image: string; quantity: number; }
interface CheckoutPageProps { cart: CartItem[]; navigate: (page: Page) => void; }

export default function CheckoutPage({ cart, navigate }: CheckoutPageProps) {
  const [step, setStep] = useState(1);
  const [courier, setCourier] = useState('jne-regular');
  const [payment, setPayment] = useState('transfer');
  const [form, setForm] = useState({ name: '', phone: '', province: '', city: '', zip: '', address: '' });
  const [success, setSuccess] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = { 'jne-regular': 15000, 'jne-express': 25000, 'sicepat': 12000, 'jnt': 14000 }[courier] ?? 15000;
  const total = subtotal + shippingFee;

  const handleOrder = () => {
    setSuccess(true);
    setTimeout(() => navigate('home'), 3000);
  };

  if (success) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>✅</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', margin: '0 0 12px' }}>Pesanan Berhasil!</h2>
        <p style={{ color: '#6B7280', margin: '0 0 8px' }}>Terima kasih telah berbelanja di Wicaksono.</p>
        <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: '0 0 24px' }}>No. Pesanan: <strong style={{ color: '#F97316' }}>#WKS-{Date.now().toString().slice(-6)}</strong></p>
        <p style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>Mengalihkan ke beranda...</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: '0.8rem', color: '#9CA3AF' }}>
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontSize: '0.8rem' }}>Beranda</button>
        <span>/</span>
        <button onClick={() => navigate('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontSize: '0.8rem' }}>Keranjang</button>
        <span>/</span>
        <span style={{ color: '#1F2937', fontWeight: 600 }}>Checkout</span>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40, maxWidth: 500 }}>
        {[{ n: 1, label: 'Alamat' }, { n: 2, label: 'Pengiriman' }, { n: 3, label: 'Pembayaran' }].map(({ n, label }, idx) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: idx < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step >= n ? '#F97316' : '#F3F4F6',
                color: step >= n ? 'white' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.3s',
              }}>{step > n ? '✓' : n}</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: step >= n ? '#F97316' : '#9CA3AF' }}>{label}</span>
            </div>
            {idx < 2 && <div style={{ flex: 1, height: 2, background: step > n ? '#F97316' : '#F3F4F6', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        <div>
          {step === 1 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: 700, color: '#1F2937' }}>Alamat Pengiriman</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { field: 'name', label: 'Nama Lengkap', placeholder: 'Masukkan nama lengkap' },
                  { field: 'phone', label: 'Nomor HP', placeholder: '08xx-xxxx-xxxx' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input className="input-field" placeholder={placeholder} value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                {[
                  { field: 'province', label: 'Provinsi', placeholder: 'Pilih provinsi' },
                  { field: 'city', label: 'Kota/Kabupaten', placeholder: 'Masukkan kota' },
                  { field: 'zip', label: 'Kode Pos', placeholder: '00000' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input className="input-field" placeholder={placeholder} value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Alamat Lengkap</label>
                <textarea className="input-field" placeholder="Nama jalan, no. rumah, RT/RW, kelurahan, kecamatan..." rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <button className="btn-primary" onClick={() => setStep(2)} style={{ marginTop: 24, padding: '12px 28px' }}>
                Lanjut ke Pengiriman →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: 700, color: '#1F2937' }}>Pilih Kurir</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'jne-regular', name: 'JNE Regular', time: '3-5 hari', price: 15000 },
                  { id: 'jne-express', name: 'JNE Express', time: '1-2 hari', price: 25000 },
                  { id: 'sicepat', name: 'SiCepat Reguler', time: '2-4 hari', price: 12000 },
                  { id: 'jnt', name: 'J&T Express', time: '2-3 hari', price: 14000 },
                ].map(c => (
                  <label key={c.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', borderRadius: 10, border: `2px solid ${courier === c.id ? '#F97316' : '#E5E7EB'}`,
                    background: courier === c.id ? 'rgba(249,115,22,0.04)' : 'white',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="radio" checked={courier === c.id} onChange={() => setCourier(c.id)} style={{ accentColor: '#F97316', width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Estimasi {c.time}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#F97316' }}>{formatPrice(c.price)}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-outline" onClick={() => setStep(1)} style={{ padding: '12px 24px' }}>← Kembali</button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ padding: '12px 28px' }}>Lanjut ke Pembayaran →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: 700, color: '#1F2937' }}>Metode Pembayaran</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'transfer', name: 'Transfer Bank', sub: 'BCA, Mandiri, BNI, BRI', icon: '🏦' },
                  { id: 'gopay', name: 'GoPay', sub: 'Bayar via aplikasi Gojek', icon: '💚' },
                  { id: 'ovo', name: 'OVO', sub: 'Bayar via OVO', icon: '💜' },
                  { id: 'dana', name: 'DANA', sub: 'Bayar via DANA', icon: '💙' },
                  { id: 'cod', name: 'Bayar di Tempat (COD)', sub: 'Tersedia di area tertentu', icon: '💵' },
                ].map(m => (
                  <label key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 10, border: `2px solid ${payment === m.id ? '#F97316' : '#E5E7EB'}`,
                    background: payment === m.id ? 'rgba(249,115,22,0.04)' : 'white',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <input type="radio" checked={payment === m.id} onChange={() => setPayment(m.id)} style={{ accentColor: '#F97316', width: 16, height: 16 }} />
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{m.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-outline" onClick={() => setStep(2)} style={{ padding: '12px 24px' }}>← Kembali</button>
                <button className="btn-primary" onClick={handleOrder} style={{ padding: '12px 28px', flex: 1 }}>
                  ✅ Konfirmasi Pesanan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div style={{ position: 'sticky', top: 88 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: '#1F2937' }}>Ringkasan Pesanan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={item.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: '#FFF8F0' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>×{item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.85rem', flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#1F2937' }}>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Ongkir</span>
                <span style={{ fontWeight: 600, color: '#1F2937' }}>{formatPrice(shippingFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
                <span style={{ fontWeight: 700, color: '#1F2937' }}>Total</span>
                <span style={{ fontWeight: 800, color: '#F97316', fontSize: '1.1rem' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { orders, formatPrice } from '../data';
import type { Page } from '../App';

export default function DashboardPage({ navigate }: { navigate: (page: Page) => void }) {
  const [activeMenu, setActiveMenu] = useState('profil');
  const [wishlist] = useState([1, 4, 6]);

  const statusColor = (s: string) => ({
    selesai: { bg: '#DCFCE7', text: '#16A34A' },
    dikirim: { bg: '#DBEAFE', text: '#1D4ED8' },
    diproses: { bg: '#FEF3C7', text: '#D97706' },
    batal: { bg: '#FEE2E2', text: '#DC2626' },
  }[s] ?? { bg: '#F3F4F6', text: '#6B7280' });

  const menus = [
    { id: 'profil', label: 'Profil Saya', icon: '👤' },
    { id: 'pesanan', label: 'Riwayat Pesanan', icon: '📦' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
    { id: 'alamat', label: 'Alamat', icon: '📍' },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
      {/* Sidebar */}
      <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 88 }}>
        {/* Profile header */}
        <div style={{ background: 'linear-gradient(135deg, #F97316, #EA6C0A)', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid white', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Siti Rahayu</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>siti@email.com</div>
          <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 100, padding: '4px 12px', display: 'inline-block', fontSize: '0.75rem', color: 'white', fontWeight: 600 }}>
            ⭐ Member Gold
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '12px 0' }}>
          {menus.map(m => (
            <button key={m.id} onClick={() => setActiveMenu(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '12px 20px', border: 'none',
              background: activeMenu === m.id ? 'rgba(249,115,22,0.08)' : 'transparent',
              borderLeft: `3px solid ${activeMenu === m.id ? '#F97316' : 'transparent'}`,
              color: activeMenu === m.id ? '#F97316' : '#374151',
              fontFamily: 'Poppins', fontWeight: activeMenu === m.id ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
              textAlign: 'left',
            }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #F3F4F6', margin: '8px 0' }} />
          <button onClick={() => navigate('home')} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '12px 20px', border: 'none',
            background: 'transparent', color: '#DC2626',
            fontFamily: 'Poppins', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
          }}>
            <span>🚪</span> Keluar
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeMenu === 'profil' && (
          <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin: '0 0 24px', fontWeight: 800, color: '#1F2937' }}>Profil Saya</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Nama Lengkap', value: 'Siti Rahayu' },
                { label: 'Email', value: 'siti@email.com' },
                { label: 'Nomor HP', value: '0812-3456-7890' },
                { label: 'Tanggal Lahir', value: '15 Maret 1992' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
                  <input className="input-field" defaultValue={value} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Jenis Kelamin</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Perempuan', 'Laki-laki'].map(g => (
                  <label key={g} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 16px', borderRadius: 8, border: `1.5px solid ${g === 'Perempuan' ? '#F97316' : '#E5E7EB'}`, background: g === 'Perempuan' ? 'rgba(249,115,22,0.05)' : 'white' }}>
                    <input type="radio" name="gender" defaultChecked={g === 'Perempuan'} style={{ accentColor: '#F97316' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ padding: '12px 28px' }}>Simpan Perubahan</button>
              <button className="btn-outline" style={{ padding: '12px 20px' }}>Ganti Password</button>
            </div>
          </div>
        )}

        {activeMenu === 'pesanan' && (
          <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin: '0 0 24px', fontWeight: 800, color: '#1F2937' }}>Riwayat Pesanan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.slice(0, 3).map(order => {
                const sc = statusColor(order.status);
                return (
                  <div key={order.id} style={{ border: '1px solid #F3F4F6', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.9rem' }}>{order.id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: 2 }}>{order.date} · {order.items} produk</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700, color: '#1F2937' }}>{formatPrice(order.total)}</span>
                      <span style={{ background: sc.bg, color: sc.text, borderRadius: 100, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{order.status}</span>
                      <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>Detail</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeMenu === 'wishlist' && (
          <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin: '0 0 24px', fontWeight: 800, color: '#1F2937' }}>Wishlist</h2>
            <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>{wishlist.length} produk tersimpan</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {wishlist.map(id => (
                <div key={id} style={{ border: '1px solid #F3F4F6', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                    <button style={{ background: 'white', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>❤️</button>
                  </div>
                  <div style={{ height: 120, background: '#FFF8F0' }}>
                    <img src={`https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1F2937', marginBottom: 4 }}>Produk #{id}</div>
                    <div style={{ fontWeight: 700, color: '#F97316', fontSize: '0.9rem' }}>Rp 25.000</div>
                    <button className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.75rem', marginTop: 8 }}>Tambah ke Keranjang</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMenu === 'alamat' && (
          <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontWeight: 800, color: '#1F2937' }}>Alamat Saya</h2>
              <button className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>+ Tambah Alamat</button>
            </div>
            {[
              { label: 'Rumah', name: 'Siti Rahayu', address: 'Jl. Merdeka No. 45, Cilandak, Jakarta Selatan 12430', phone: '0812-3456-7890', main: true },
              { label: 'Kantor', name: 'Siti Rahayu', address: 'Jl. Sudirman Kav. 52-53, Jakarta Pusat 10220', phone: '0812-3456-7890', main: false },
            ].map(addr => (
              <div key={addr.label} style={{ border: `1.5px solid ${addr.main ? '#F97316' : '#E5E7EB'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 12, position: 'relative' }}>
                {addr.main && <div style={{ position: 'absolute', top: -1, left: 16, background: '#F97316', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '0 0 6px 6px' }}>Utama</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: addr.main ? 8 : 0 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#1F2937' }}>{addr.label}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#374151' }}>{addr.name}</p>
                    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#6B7280' }}>{addr.address}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>{addr.phone}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Ubah</button>
                    {!addr.main && <button style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', color: '#DC2626', fontFamily: 'Poppins' }}>Hapus</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

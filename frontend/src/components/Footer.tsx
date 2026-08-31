import type { Page } from '../App';

export default function Footer({ navigate }: { navigate: (page: Page) => void }) {
  return (
    <footer style={{ background: '#1F2937', color: '#F9FAFB', marginTop: 80 }}>
      {/* Top CTA strip */}
      {/* <div style={{
        background: 'linear-gradient(135deg, #F97316, #EA6C0A)',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
            Dapatkan Promo Eksklusif!
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 20px', fontSize: '0.9rem' }}>
            Daftar newsletter dan nikmati diskon 10% untuk pembelian pertamamu
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '0 auto' }}>
            <input type="email" placeholder="Masukkan emailmu..." className="input-field" style={{ flex: 1 }} />
            <button className="btn-primary" style={{
              padding: '10px 20px', background: 'white', color: '#F97316',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Daftar
            </button>
          </div>
        </div>
      </div> */}

      {/* Main footer */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #F97316, #EA6C0A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 20 }}>🎁</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F97316' }}>Wicaksono</div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Oleh-Oleh Khas Malang</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 20px' }}>
            Pusat oleh-oleh khas Malang terpercaya sejak 2005. Menghadirkan cita rasa autentik Malang ke seluruh Indonesia.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {['📘', '📸', '🐦', '▶️'].map((icon, i) => (
              <button key={i} style={{
                width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                border: 'none', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontWeight: 700, color: 'white', marginBottom: 16, fontSize: '0.95rem' }}>Tautan Cepat</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Beranda', page: 'home' as Page },
              { label: 'Katalog Produk', page: 'catalog' as Page },
              { label: 'Tentang Kami', page: 'home' as Page },
              { label: 'Kontak', page: 'home' as Page },
              { label: 'Blog & Resep', page: 'home' as Page },
            ].map(({ label, page }) => (
              <button key={label} onClick={() => navigate(page)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                textAlign: 'left', color: '#9CA3AF', fontSize: '0.85rem',
                fontFamily: 'Poppins, sans-serif', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F97316'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#9CA3AF'; }}>
                → {label}
              </button>
            ))}
          </div>
        </div>

        {/* Kategori */}
        <div>
          <h4 style={{ fontWeight: 700, color: 'white', marginBottom: 16, fontSize: '0.95rem' }}>Kategori</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Keripik & Snack', 'Apel Malang', 'Bakpia & Pia', 'Minuman Segar', 'Souvenir', 'Hampers Lebaran'].map(cat => (
              <button key={cat} onClick={() => navigate('catalog')} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                textAlign: 'left', color: '#9CA3AF', fontSize: '0.85rem',
                fontFamily: 'Poppins, sans-serif', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F97316'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#9CA3AF'; }}>
                → {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontWeight: 700, color: 'white', marginBottom: 16, fontSize: '0.95rem' }}>Hubungi Kami</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📍', text: 'Jl. Semeru No. 12, Klojen, Malang, Jawa Timur 65119' },
              { icon: '📞', text: '+62 341 555-0123' },
              { icon: '✉️', text: 'halo@wicaksono-malang.id' },
              { icon: '⏰', text: 'Senin–Sabtu, 08.00–20.00 WIB' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{icon}</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.82rem', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
            © 2026 Oleh-Oleh Wicaksono Khas Malang. Hak cipta dilindungi.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Kebijakan Pengembalian'].map(l => (
              <button key={l} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6B7280', fontSize: '0.8rem', fontFamily: 'Poppins, sans-serif',
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

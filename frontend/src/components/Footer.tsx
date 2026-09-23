import type { Page } from '../App';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiArrowUp } from 'react-icons/fi';

export default function Footer({ navigate }: { navigate: (page: Page) => void }) {
  return (
    <footer style={{ background: '#1F2937', color: '#F9FAFB', marginTop: 80, position: 'relative' }}>

      {/* Newsletter Strip */}
      {/* <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '28px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
              Dapatkan Promo & Resep Khas Malang
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
              Berlangganan newsletter kami, gratis ongkir untuk pelanggan baru!
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 380 }}>
            <input
              type="email"
              placeholder="Masukkan email kamu"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none',
                fontSize: '0.85rem', fontFamily: 'Poppins, sans-serif', outline: 'none',
              }}
            />
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#1F2937', color: 'white', border: 'none',
              borderRadius: 8, padding: '12px 18px', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#111827'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1F2937'; }}>
              <FiSend size={14} /> Langganan
            </button>
          </div>
        </div>
      </div> */}

      {/* Main footer */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '56px 24px 32px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(223,64,31,0.35)',
            }}>
              <span style={{ fontSize: 22 }}>🎁</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>Wicaksono</div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', letterSpacing: '0.3px' }}>OLEH-OLEH KHAS MALANG</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 20px' }}>
            Pusat oleh-oleh khas Malang terpercaya sejak 2005. Menghadirkan cita rasa autentik Malang ke seluruh Indonesia.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: <FaFacebookF size={15} />, label: 'Facebook' },
              { icon: <FaInstagram size={15} />, label: 'Instagram' },
              { icon: <FaTwitter size={15} />, label: 'Twitter' },
              { icon: <FaYoutube size={15} />, label: 'YouTube' }
            ].map(({ icon, label }, i) => (
              <button key={i} aria-label={label} style={{
                width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#F9FAFB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-primary)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontWeight: 700, color: 'white', marginBottom: 18, fontSize: '0.95rem' }}>Tautan Cepat</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Beranda', page: 'home' as Page },
              { label: 'Katalog Produk', page: 'catalog' as Page },
              { label: 'Tentang Kami', page: 'about' as Page },
              { label: 'Kontak', page: 'contact' as Page },
            ].map(({ label, page }) => (
              <button key={label} onClick={() => navigate(page)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                textAlign: 'left', color: '#9CA3AF', fontSize: '0.85rem',
                fontFamily: 'Poppins, sans-serif', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)';
                (e.currentTarget as HTMLElement).style.gap = '10px';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
                (e.currentTarget as HTMLElement).style.gap = '6px';
              }}>
                <span style={{ color: 'var(--color-primary)' }}>→</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontWeight: 700, color: 'white', marginBottom: 18, fontSize: '0.95rem' }}>Hubungi Kami</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: <FiMapPin size={15} />, text: 'Jl. Semeru No. 12, Klojen, Malang, Jawa Timur 65119' },
              { icon: <FiPhone size={15} />, text: '+62 341 555-0123' },
              { icon: <FiMail size={15} />, text: 'halo@wicaksono-malang.id' },
              { icon: <FiClock size={15} />, text: 'Senin–Sabtu, 08.00–20.00 WIB' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  color: 'var(--color-primary)', marginTop: 1, flexShrink: 0,
                  width: 28, height: 28, borderRadius: 8, background: 'rgba(223,64,31,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{icon}</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.82rem', lineHeight: 1.6, marginTop: 4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust / Payment */}
        <div>
          <h4 style={{ fontWeight: 700, color: 'white', marginBottom: 18, fontSize: '0.95rem' }}>Metode Pembayaran</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {['BCA', 'Mandiri', 'BRI', 'GoPay', 'QRIS', 'OVO'].map(m => (
              <span key={m} style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#D1D5DB',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '6px 10px',
              }}>{m}</span>
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
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D1D5DB'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        aria-label="Kembali ke atas"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'absolute', top: -22, right: 24, width: 44, height: 44, borderRadius: '50%',
          background: 'var(--color-primary)', border: '4px solid #1F2937', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 6px 16px rgba(223,64,31,0.4)', transition: 'transform 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
        <FiArrowUp size={18} />
      </button>
    </footer>
  );
}
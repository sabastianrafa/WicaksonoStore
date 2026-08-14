import { useState } from 'react';
import type { Page } from '../App';

export function LoginPage({ navigate }: { navigate: (page: Page) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#FFF8F0' }}>
      {/* Left visual */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #F97316, #EA6C0A)',
        padding: 48, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: 'white', zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎁</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 12px' }}>Selamat Datang!</h2>
          <p style={{ opacity: 0.85, lineHeight: 1.7, maxWidth: 320, fontSize: '0.95rem' }}>
            Masuk dan temukan berbagai oleh-oleh khas Malang yang lezat dan autentik, dikirim langsung ke pintumu.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
            {['50+ Produk', '10rb+ Pelanggan', 'Rating 4.9★'].map(s => (
              <div key={s} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', marginBottom: 24, fontSize: '0.85rem' }}>← Kembali ke Beranda</button>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', margin: '0 0 6px' }}>Masuk</h1>
          <p style={{ color: '#6B7280', margin: '0 0 28px', fontSize: '0.875rem' }}>Belum punya akun? <button onClick={() => navigate('register')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontWeight: 600 }}>Daftar sekarang</button></p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Email</label>
              <input className="input-field" type="email" placeholder="contoh@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Password</label>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontSize: '0.8rem', fontFamily: 'Poppins' }}>Lupa password?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9CA3AF' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#F97316', width: 16, height: 16 }} />
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>Ingat saya selama 30 hari</span>
            </label>
            <button className="btn-primary" onClick={() => navigate('dashboard')} style={{ padding: '13px', fontSize: '0.95rem' }}>
              Masuk ke Akun
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ color: '#9CA3AF', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>atau masuk dengan</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: 'white', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.875rem', color: '#374151',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
              <span style={{ fontSize: 20 }}>🇬</span>
              Masuk dengan Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ navigate }: { navigate: (page: Page) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#FFF8F0' }}>
      {/* Left visual */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #16A34A, #15803D)',
        padding: 48, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', textAlign: 'center', color: 'white', zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛍️</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 12px' }}>Bergabung Sekarang!</h2>
          <p style={{ opacity: 0.85, lineHeight: 1.7, maxWidth: 320, fontSize: '0.95rem' }}>
            Daftar gratis dan dapatkan diskon 10% untuk pembelian pertama. Ribuan produk khas Malang menunggumu!
          </p>
          <div style={{ marginTop: 32, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Kode Promo Baru</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: 4, marginTop: 4 }}>MALANG10</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 4 }}>Hemat 10% pembelian pertama</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', marginBottom: 24, fontSize: '0.85rem' }}>← Kembali ke Beranda</button>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', margin: '0 0 6px' }}>Buat Akun</h1>
          <p style={{ color: '#6B7280', margin: '0 0 28px', fontSize: '0.875rem' }}>Sudah punya akun? <button onClick={() => navigate('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', fontFamily: 'Poppins', fontWeight: 600 }}>Masuk di sini</button></p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { field: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama lengkap sesuai KTP' },
              { field: 'email', label: 'Email', type: 'email', placeholder: 'contoh@email.com' },
              { field: 'phone', label: 'Nomor HP', type: 'tel', placeholder: '08xx-xxxx-xxxx' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                <input className="input-field" type={type} placeholder={placeholder} value={form[field as keyof typeof form]} onChange={e => update(field, e.target.value)} />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPass ? 'text' : 'password'} placeholder="Min. 8 karakter" value={form.password} onChange={e => update('password', e.target.value)} style={{ paddingRight: 40 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9CA3AF' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Konfirmasi Password</label>
              <input className="input-field" type="password" placeholder="Ulangi password" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
              {form.confirm && form.confirm !== form.password && (
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#DC2626' }}>Password tidak cocok</p>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF' }}>
              Dengan mendaftar, kamu menyetujui <span style={{ color: '#F97316', fontWeight: 600 }}>Syarat & Ketentuan</span> dan <span style={{ color: '#F97316', fontWeight: 600 }}>Kebijakan Privasi</span> kami.
            </p>

            <button className="btn-secondary" onClick={() => navigate('login')} style={{ padding: '13px', fontSize: '0.95rem', width: '100%' }}>
              Daftar Sekarang
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ color: '#9CA3AF', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>atau daftar dengan</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: 'white', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.875rem', color: '#374151',
              transition: 'border-color 0.2s',
            }}>
              <span style={{ fontSize: 20 }}>🇬</span>
              Daftar dengan Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

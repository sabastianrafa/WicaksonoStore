import { useEffect, useState } from 'react';
import { formatPrice } from '../data';
import type { Page } from '../App';
import { apiFetch } from '../api/client';

interface ProfileFields {
  name: string;
  email: string;
  phone: string;
}

interface ProfileResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string | null;
      role: string;
    };
  };
}

export default function DashboardPage({ navigate }: { navigate: (page: Page) => void }) {
  const [activeMenu, setActiveMenu] = useState('profil');
  const [wishlist] = useState([1, 4, 6]);
  const [profile, setProfile] = useState<ProfileFields>({
    name: localStorage.getItem('userName') ?? '',
    email: localStorage.getItem('userEmail') ?? '',
    phone: localStorage.getItem('userPhone') ?? '',
  });
  const [profileForm, setProfileForm] = useState(profile);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch<ProfileResponse>('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;

        const currentProfile = {
          name: data.user.name ?? '',
          email: data.user.email ?? '',
          phone: data.user.phone ?? '',
        };

        setProfile(currentProfile);
        setProfileForm(currentProfile);
        localStorage.setItem('userName', currentProfile.name);
        localStorage.setItem('userEmail', currentProfile.email);
        localStorage.setItem('userPhone', currentProfile.phone);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
      .catch((error) => {
        if (!cancelled) {
          setProfileError(error instanceof Error ? error.message : 'Gagal memuat profil.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const beginProfileEdit = () => {
    setProfileForm(profile);
    setProfileError('');
    setProfileSuccess('');
    setEditingProfile(true);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await apiFetch<ProfileResponse>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim() || null,
        }),
      });

      const updatedProfile = {
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone ?? '',
      };

      setProfile(updatedProfile);
      setProfileForm(updatedProfile);
      localStorage.setItem('userName', updatedProfile.name);
      localStorage.setItem('userEmail', updatedProfile.email);
      localStorage.setItem('userPhone', updatedProfile.phone);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setEditingProfile(false);
      setProfileSuccess('Profil berhasil diperbarui.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

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
          <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{profile.name || 'Customer'}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>{profile.email || ' '}</div>
          <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 100, padding: '4px 12px', display: 'inline-block', fontSize: '0.75rem', color: 'white', fontWeight: 600 }}>
            Profil Customer
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontWeight: 800, color: '#1F2937' }}>Profil Saya</h2>
              {!editingProfile && (
                <button className="btn-outline" onClick={beginProfileEdit} style={{ padding: '9px 16px' }}>
                  Edit Profil
                </button>
              )}
            </div>

            {profileError && (
              <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontSize: '0.85rem' }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, background: '#F0FDF4', color: '#15803D', fontSize: '0.85rem' }}>
                {profileSuccess}
              </div>
            )}

            {loadingProfile ? (
              <div style={{ padding: '32px 0', color: '#6B7280' }}>Memuat profil...</div>
            ) : editingProfile ? (
              <form onSubmit={saveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#6B7280' }}>
                    Nama Lengkap
                    <input
                      className="input-field"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                      required
                      style={{ display: 'block', marginTop: 6 }}
                    />
                  </label>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#6B7280' }}>
                    Email
                    <input
                      className="input-field"
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                      required
                      style={{ display: 'block', marginTop: 6 }}
                    />
                  </label>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#6B7280' }}>
                    Nomor HP
                    <input
                      className="input-field"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                      style={{ display: 'block', marginTop: 6 }}
                    />
                  </label>
                </div>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setProfileForm(profile);
                      setProfileError('');
                      setEditingProfile(false);
                    }}
                    disabled={savingProfile}
                    style={{ padding: '11px 20px' }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={savingProfile} style={{ padding: '11px 24px' }}>
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Nama Lengkap', value: profile.name },
                  { label: 'Email', value: profile.email },
                  { label: 'Nomor HP', value: profile.phone },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '14px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>{label}</div>
                    <div style={{ color: '#1F2937', fontWeight: 600 }}>{value || '-'}</div>
                  </div>
                ))}
              </div>
            )}
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

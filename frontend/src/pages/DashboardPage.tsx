import { useEffect, useState, type FormEvent } from 'react';
import type { Page } from '../App';
import { apiFetch } from '../api/client';

interface ProfileFields {
  name: string;
  email: string;
  phone: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface ProfileResponse {
  success: boolean;
  data: { user: User };
}

interface DashboardPageProps {
  navigate: (page: Page) => void;
}

const MENU_ITEMS = [
  { id: 'profil', label: 'Profil Saya', icon: '👤' },
  { id: 'pesanan', label: 'Riwayat Pesanan', icon: '📦' },
  { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
  { id: 'alamat', label: 'Alamat', icon: '📍' },
] as const;

type MenuId = (typeof MENU_ITEMS)[number]['id'];

const EMPTY_PROFILE: ProfileFields = { name: '', email: '', phone: '' };
const inputClass =
  'mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#DF3E1D] focus:ring-2 focus:ring-[#DF3E1D]/15';
const cardClass = 'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7';
const primaryButton =
  'inline-flex items-center justify-center rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c93418] disabled:cursor-not-allowed disabled:opacity-60';
const outlineButton =
  'inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#DF3E1D] hover:text-[#DF3E1D] disabled:cursor-not-allowed disabled:opacity-60';

export default function DashboardPage({ navigate }: DashboardPageProps) {
  const [activeMenu, setActiveMenu] = useState<MenuId>('profil');
  const [profile, setProfile] = useState<ProfileFields>(() => ({
    name: localStorage.getItem('userName') ?? '',
    email: localStorage.getItem('userEmail') ?? '',
    phone: localStorage.getItem('userPhone') ?? '',
  }));
  const [profileForm, setProfileForm] = useState<ProfileFields>(profile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch<ProfileResponse>('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;

        const user = data.user;
        const nextProfile = {
          name: user.name ?? '',
          email: user.email ?? '',
          phone: user.phone ?? '',
        };

        setProfile(nextProfile);
        setProfileForm(nextProfile);
        localStorage.setItem('userName', nextProfile.name);
        localStorage.setItem('userEmail', nextProfile.email);
        localStorage.setItem('userPhone', nextProfile.phone);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat profil.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field: keyof ProfileFields, value: string) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const startEditing = () => {
    setProfileForm(profile);
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setProfileForm(profile);
    setError('');
    setEditing(false);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch<ProfileResponse>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim() || null,
        }),
      });

      const user = response.data.user;
      const updatedProfile = {
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      };

      setProfile(updatedProfile);
      setProfileForm(updatedProfile);
      localStorage.setItem('userName', updatedProfile.name);
      localStorage.setItem('userEmail', updatedProfile.email);
      localStorage.setItem('userPhone', updatedProfile.phone);
      localStorage.setItem('user', JSON.stringify(user));
      setEditing(false);
      setSuccess('Profil berhasil diperbarui.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSaving(false);
    }
  };

  const activeLabel = MENU_ITEMS.find((item) => item.id === activeMenu)?.label ?? 'Dashboard';

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Akun Saya</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Dashboard Pelanggan
        </h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-[#DF3E1D] to-[#b92c13] px-5 py-7 text-center">
            <div className="mx-auto mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-white/90 bg-white/20 text-3xl">
              👤
            </div>
            <p className="truncate font-bold text-white">{profile.name || 'Pelanggan'}</p>
            <p className="mt-1 truncate text-xs text-white/80">{profile.email || ' '}</p>
            <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Profil Customer
            </span>
          </div>

          <nav className="p-2" aria-label="Menu akun">
            {MENU_ITEMS.map((item) => {
              const selected = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-[3px] px-4 py-3 text-left text-sm transition ${
                    selected
                      ? 'border-[#DF3E1D] bg-[#DF3E1D]/[0.07] font-bold text-[#DF3E1D]'
                      : 'border-transparent font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span aria-hidden="true" className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <div className="my-2 border-t border-gray-100" />
            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <span aria-hidden="true">🚪</span> Kembali ke Beranda
            </button>
          </nav>
        </aside>

        <section className="min-w-0" aria-label={activeLabel}>
          {activeMenu === 'profil' && (
            <div className={cardClass}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Profil Saya</h2>
                  <p className="mt-1 text-sm text-gray-500">Kelola informasi akun kamu.</p>
                </div>
                {!editing && (
                  <button type="button" className={outlineButton} onClick={startEditing}>
                    Edit Profil
                  </button>
                )}
              </div>

              {error && (
                <div role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div role="status" className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {loading ? (
                <div className="flex items-center gap-3 py-10 text-sm text-gray-500">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF3E1D]" />
                  Memuat profil...
                </div>
              ) : editing ? (
                <form onSubmit={saveProfile}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-gray-600">
                      Nama Lengkap
                      <input
                        className={inputClass}
                        value={profileForm.name}
                        onChange={(event) => updateField('name', event.target.value)}
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-600">
                      Email
                      <input
                        className={inputClass}
                        type="email"
                        value={profileForm.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-600 sm:col-span-2">
                      Nomor HP
                      <input
                        className={inputClass}
                        type="tel"
                        value={profileForm.phone}
                        onChange={(event) => updateField('phone', event.target.value)}
                        autoComplete="tel"
                        placeholder="Masukkan nomor HP"
                      />
                    </label>
                  </div>
                  <div className="mt-7 flex flex-wrap justify-end gap-3">
                    <button type="button" className={outlineButton} onClick={cancelEditing} disabled={saving}>
                      Batal
                    </button>
                    <button type="submit" className={primaryButton} disabled={saving}>
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  {([
                    ['Nama Lengkap', profile.name],
                    ['Email', profile.email],
                    ['Nomor HP', profile.phone],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="border-b border-gray-100 py-4 first:pt-1">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
                      <dd className="mt-2 break-words font-semibold text-gray-800">{value || '-'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {activeMenu === 'pesanan' && (
            <div className={cardClass}>
              <h2 className="text-xl font-extrabold text-gray-900">Riwayat Pesanan</h2>
              <EmptyState icon="📦" title="Riwayat pesanan belum tersedia" description="Data pesanan perlu dihubungkan ke endpoint pesanan pada backend." />
            </div>
          )}

          {activeMenu === 'wishlist' && (
            <div className={cardClass}>
              <h2 className="text-xl font-extrabold text-gray-900">Wishlist</h2>
              <EmptyState icon="❤️" title="Wishlist belum tersedia" description="Hubungkan bagian ini ke API wishlist agar produk tersimpan berasal dari akun pelanggan." />
            </div>
          )}

          {activeMenu === 'alamat' && (
            <div className={cardClass}>
              <h2 className="text-xl font-extrabold text-gray-900">Alamat Saya</h2>
              <EmptyState icon="📍" title="Data alamat belum tersedia" description="Hubungkan bagian ini ke API alamat pelanggan untuk menampilkan dan mengelola alamat pengiriman." />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-5 py-12 text-center">
      <div className="text-3xl" aria-hidden="true">{icon}</div>
      <h3 className="mt-3 font-bold text-gray-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

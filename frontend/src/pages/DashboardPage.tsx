import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Page } from '../App';
import { apiFetch, storageUrl } from '../api/client';
import { formatPrice } from '../data';

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
  data: {
    user: User;
  };
}

interface ProductSummary {
  id: number;
  name: string;
  price: string | number;
  image?: string | null;
  images?: { path: string; url?: string; is_primary?: boolean }[];
}

interface WishlistItem {
  id: number;
  product_id: number;
  product: ProductSummary;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string | number;
  image?: string | null;
  product?: ProductSummary | null;
}

interface CustomerOrder {
  id: number;
  order_number: string;
  order_status: string | { value?: string };
  total: string | number;
  created_at: string;
  items: OrderItem[];
  payment?: { status?: string } | null;
  shipping_method?: { name?: string } | null;
}

interface CustomerAddress {
  id: number;
  label: string;
  name: string;
  phone: string;
  province: string;
  province_code: string | null;
  city: string;
  regency_code: string | null;
  district: string | null;
  district_code: string | null;
  village: string | null;
  village_code: string | null;
  postal_code: string;
  rt: string | null;
  rw: string | null;
  neighborhood: string | null;
  landmark: string | null;
  address: string;
  is_default: boolean;
}

interface LocationOption { code: string; name: string }

type AddressForm = Omit<CustomerAddress, 'id' | 'province' | 'city' | 'district' | 'village' | 'is_default'> & {
  id?: number;
  is_default: boolean;
};

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

const EMPTY_PROFILE: ProfileFields = {
  name: '',
  email: '',
  phone: '',
};

const inputClass =
  'mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#DF3E1D] focus:ring-2 focus:ring-[#DF3E1D]/15';

const cardClass =
  'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7';

const primaryButton =
  'inline-flex items-center justify-center rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c93418] disabled:cursor-not-allowed disabled:opacity-60';

const outlineButton =
  'inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#DF3E1D] hover:text-[#DF3E1D] disabled:cursor-not-allowed disabled:opacity-60';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan. Silakan coba kembali.';
}

function isUnauthorized(error: unknown): boolean {
  const message = getErrorMessage(error);

  return /\b401\b|unauthenticated|unauthorized/i.test(message);
}

export default function DashboardPage({
  navigate,
}: DashboardPageProps) {
  const [activeMenu, setActiveMenu] = useState<MenuId>('profil');

  const [profile, setProfile] = useState<ProfileFields>(() => ({
    name: localStorage.getItem('userName') ?? '',
    email: localStorage.getItem('userEmail') ?? '',
    phone: localStorage.getItem('userPhone') ?? '',
  }));

  const [profileForm, setProfileForm] =
    useState<ProfileFields>(profile);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dataError, setDataError] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressForm, setAddressForm] = useState<AddressForm | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressDeleting, setAddressDeleting] = useState<number | null>(null);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [regencies, setRegencies] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [locationError, setLocationError] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  // TODO ROUTING:
  // Pastikan nilai 'login' tersedia di tipe Page dan router aplikasi.
  const redirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');

    navigate('login');
  };

  // ============================================================
  // BACKEND TERHUBUNG: GET /auth/me
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem('token');

      if (!token) {
        if (!cancelled) {
          setLoading(false);
          redirectToLogin();
        }

        return;
      }

      try {
        const response = await apiFetch<ProfileResponse>(
          '/auth/me',
        );

        if (cancelled) return;

        if (!response?.data?.user) {
          throw new Error('Respons profil dari server tidak valid.');
        }

        const user = response.data.user;

        const nextProfile: ProfileFields = {
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
      } catch (err: unknown) {
        if (cancelled) return;

        if (isUnauthorized(err)) {
          redirectToLogin();
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeMenu === 'profil') return;
    let active = true;
    setDataLoading(true);
    setDataError('');
    const request = activeMenu === 'pesanan'
      ? apiFetch<{ data: CustomerOrder[] }>('/orders?per_page=50').then((response) => { if (active) setOrders(response.data ?? []); })
      : activeMenu === 'wishlist'
        ? apiFetch<{ data: WishlistItem[] }>('/wishlist').then((response) => { if (active) setWishlist(response.data ?? []); })
        : apiFetch<{ data: CustomerAddress[] }>('/addresses').then((response) => { if (active) setAddresses(response.data ?? []); });
    request.catch((err: unknown) => {
      if (!active) return;
      if (isUnauthorized(err)) redirectToLogin();
      else setDataError(getErrorMessage(err));
    }).finally(() => { if (active) setDataLoading(false); });
    return () => { active = false; };
  }, [activeMenu, refreshKey]);

  useEffect(() => {
    if (!addressForm) return;
    let active = true;
    apiFetch<{ data: LocationOption[] }>('/locations/provinces')
      .then((response) => { if (active) setProvinces(response.data ?? []); })
      .catch((err: unknown) => { if (active) setLocationError(getErrorMessage(err)); });
    return () => { active = false; };
  }, [Boolean(addressForm)]);

  useEffect(() => {
    if (!addressForm?.province_code) { setRegencies([]); return; }
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/provinces/${encodeURIComponent(addressForm.province_code)}/regencies`)
      .then((response) => { if (active) setRegencies(response.data ?? []); })
      .catch((err: unknown) => { if (active) setLocationError(getErrorMessage(err)); });
    return () => { active = false; };
  }, [addressForm?.province_code]);

  useEffect(() => {
    if (!addressForm?.regency_code) { setDistricts([]); return; }
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/regencies/${encodeURIComponent(addressForm.regency_code)}/districts`)
      .then((response) => { if (active) setDistricts(response.data ?? []); })
      .catch((err: unknown) => { if (active) setLocationError(getErrorMessage(err)); });
    return () => { active = false; };
  }, [addressForm?.regency_code]);

  useEffect(() => {
    if (!addressForm?.district_code) { setVillages([]); return; }
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/districts/${encodeURIComponent(addressForm.district_code)}/villages`)
      .then((response) => { if (active) setVillages(response.data ?? []); })
      .catch((err: unknown) => { if (active) setLocationError(getErrorMessage(err)); });
    return () => { active = false; };
  }, [addressForm?.district_code]);

  const startAddressForm = (address?: CustomerAddress) => {
    setLocationError('');
    setAddressForm(address ? {
      id: address.id, label: address.label, name: address.name, phone: address.phone,
      province_code: address.province_code ?? '', regency_code: address.regency_code ?? '',
      district_code: address.district_code ?? '', village_code: address.village_code ?? '',
      postal_code: address.postal_code ?? '', rt: address.rt ?? '', rw: address.rw ?? '',
      neighborhood: address.neighborhood ?? '', landmark: address.landmark ?? '',
      address: address.address ?? '', is_default: address.is_default,
    } : {
      label: 'Rumah', name: profile.name, phone: profile.phone, province_code: '', regency_code: '',
      district_code: '', village_code: '', postal_code: '', rt: '', rw: '', neighborhood: '',
      landmark: '', address: '', is_default: addresses.length === 0,
    });
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addressForm || addressSaving) return;
    setAddressSaving(true); setDataError(''); setLocationError('');
    const { id, ...payload } = addressForm;
    try {
      await apiFetch(id ? `/addresses/${id}` : '/addresses', {
        method: id ? 'PUT' : 'POST', body: JSON.stringify(payload),
      });
      setAddressForm(null);
      setRefreshKey((value) => value + 1);
      setSuccess(id ? 'Alamat berhasil diperbarui.' : 'Alamat berhasil ditambahkan.');
    } catch (err: unknown) {
      if (isUnauthorized(err)) redirectToLogin(); else setDataError(getErrorMessage(err));
    } finally { setAddressSaving(false); }
  };

  const deleteAddress = async (address: CustomerAddress) => {
    if (!window.confirm(`Hapus alamat "${address.label}"?`)) return;
    setAddressDeleting(address.id); setDataError('');
    try {
      await apiFetch(`/addresses/${address.id}`, { method: 'DELETE' });
      setRefreshKey((value) => value + 1);
      setSuccess('Alamat berhasil dihapus.');
    } catch (err: unknown) { if (isUnauthorized(err)) redirectToLogin(); else setDataError(getErrorMessage(err)); }
    finally { setAddressDeleting(null); }
  };

  const setDefaultAddress = async (address: CustomerAddress) => {
    setDataError('');
    try {
      await apiFetch(`/addresses/${address.id}`, { method: 'PATCH', body: JSON.stringify({ is_default: true }) });
      setRefreshKey((value) => value + 1);
      setSuccess('Alamat utama berhasil diperbarui.');
    } catch (err: unknown) { if (isUnauthorized(err)) redirectToLogin(); else setDataError(getErrorMessage(err)); }
  };

  const removeWishlistItem = async (productId: number) => {
    setDataError('');
    try {
      await apiFetch(`/wishlist/${productId}`, { method: 'DELETE' });
      setWishlist((current) => current.filter((item) => item.product_id !== productId));
    } catch (err: unknown) { if (isUnauthorized(err)) redirectToLogin(); else setDataError(getErrorMessage(err)); }
  };

  const cancelOrder = async (order: CustomerOrder) => {
    if (!window.confirm(`Batalkan pesanan ${order.order_number}?`)) return;
    setBusyOrderId(order.id); setDataError('');
    try {
      await apiFetch(`/orders/${order.id}/cancel`, { method: 'POST' });
      setRefreshKey((value) => value + 1);
    } catch (err: unknown) { if (isUnauthorized(err)) redirectToLogin(); else setDataError(getErrorMessage(err)); }
    finally { setBusyOrderId(null); }
  };

  // ============================================================
  // FORM PROFIL
  // ============================================================

  const updateField = (
    field: keyof ProfileFields,
    value: string,
  ) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
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

  const saveProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (saving) return;

    const name = profileForm.name.trim();
    const email = profileForm.email.trim();
    const phone = profileForm.phone.trim();

    if (!name || !email) {
      setError('Nama lengkap dan email wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch<ProfileResponse>(
        '/auth/profile',
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            email,
            phone: phone || null,
          }),
        },
      );

      if (!response?.data?.user) {
        throw new Error(
          'Respons pembaruan profil dari server tidak valid.',
        );
      }

      const user = response.data.user;

      const updatedProfile: ProfileFields = {
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
      if (isUnauthorized(err)) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const activeLabel =
    MENU_ITEMS.find((item) => item.id === activeMenu)?.label ??
    'Dashboard';

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">Akun Saya</p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Dashboard Pelanggan
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Kelola profil dan informasi akun Wicaksono Store.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-[#DF3E1D] to-[#b92c13] px-5 py-7 text-center">
            <div className="mx-auto mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-white/90 bg-white/20 text-3xl">
              👤
            </div>

            <p className="truncate font-bold text-white">
              {profile.name || 'Pelanggan'}
            </p>

            <p className="mt-1 truncate text-xs text-white/80">
              {profile.email || ' '}
            </p>

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
                  onClick={() => {
                    setActiveMenu(item.id);
                    setError('');
                    setSuccess('');
                  }}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-[3px] px-4 py-3 text-left text-sm transition ${selected
                    ? 'border-[#DF3E1D] bg-[#DF3E1D]/[0.07] font-bold text-[#DF3E1D]'
                    : 'border-transparent font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>

                </button>
              );
            })}

            <div className="my-2 border-t border-gray-100" />

            <button
              type="button"
              onClick={() => navigate('home')}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#DF3E1D]"
            >
              <span aria-hidden="true">🏠</span>
              Kembali ke Beranda
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <section className="min-w-0" aria-label={activeLabel}>
          {activeMenu === 'profil' && (
            <div className={cardClass}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Profil Saya
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Kelola informasi akun kamu.
                  </p>
                </div>

                {!loading && !editing && (
                  <button
                    type="button"
                    className={outlineButton}
                    onClick={startEditing}
                  >
                    Edit Profil
                  </button>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <p>{error}</p>

                  {!loading && (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-2 font-semibold underline"
                    >
                      Muat ulang halaman
                    </button>
                  )}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {success}
                </div>
              )}

              {loading ? (
                <LoadingState label="Memuat profil..." />
              ) : editing ? (
                <form onSubmit={saveProfile}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-gray-600">
                      Nama Lengkap

                      <input
                        className={inputClass}
                        value={profileForm.name}
                        onChange={(event) =>
                          updateField('name', event.target.value)
                        }
                        autoComplete="name"
                        maxLength={255}
                        required
                      />
                    </label>

                    <label className="text-sm font-semibold text-gray-600">
                      Email

                      <input
                        className={inputClass}
                        type="email"
                        value={profileForm.email}
                        onChange={(event) =>
                          updateField('email', event.target.value)
                        }
                        autoComplete="email"
                        maxLength={255}
                        required
                      />
                    </label>

                    <label className="text-sm font-semibold text-gray-600 sm:col-span-2">
                      Nomor HP

                      <input
                        className={inputClass}
                        type="tel"
                        value={profileForm.phone}
                        onChange={(event) =>
                          updateField('phone', event.target.value)
                        }
                        autoComplete="tel"
                        maxLength={30}
                        placeholder="Masukkan nomor HP"
                      />
                    </label>
                  </div>

                  <div className="mt-7 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      className={outlineButton}
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className={primaryButton}
                      disabled={saving}
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  {(
                    [
                      ['Nama Lengkap', profile.name],
                      ['Email', profile.email],
                      ['Nomor HP', profile.phone],
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="border-b border-gray-100 py-4 first:pt-1"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {label}
                      </dt>

                      <dd className="mt-2 break-words font-semibold text-gray-800">
                        {value || '-'}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

            </div>
          )}

          {activeMenu === 'pesanan' && (
            <div className={cardClass}>
              <SectionHeader
                title="Riwayat Pesanan"
                description="Lihat transaksi dan status pengiriman pesanan kamu."
              />
              <DataFeedback loading={dataLoading} error={dataError} />
              <DataSuccess message={success} />
              {!dataLoading && !dataError && (orders.length === 0 ? <EmptyState>Belum ada pesanan.</EmptyState> : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = typeof order.order_status === 'string' ? order.order_status : order.order_status?.value ?? 'pending';
                    return <article key={order.id} className="rounded-xl border border-gray-100 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                        <div><p className="font-bold text-gray-900">{order.order_number}</p><p className="mt-1 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p></div>
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold capitalize text-[#DF3E1D]">{status}</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {(order.items ?? []).map((item) => <div key={item.id} className="flex items-center gap-3 py-3">
                          <img className="h-12 w-12 rounded-lg bg-gray-50 object-cover" src={item.product?.images?.find((image) => image.is_primary)?.url ?? item.product?.images?.[0]?.url ?? (item.product?.image ? storageUrl(item.product.image) : '')} alt="" />
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-800">{item.product_name || item.product?.name || 'Produk'}</p><p className="text-xs text-gray-500">{item.quantity} × {formatPrice(Number(item.price))}</p></div>
                        </div>)}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                        <p className="text-sm text-gray-600">Total <strong className="ml-1 text-gray-900">{formatPrice(Number(order.total))}</strong></p>
                        <div className="flex gap-2">
                          {status === 'pending' && <button type="button" className={outlineButton} disabled={busyOrderId === order.id} onClick={() => void cancelOrder(order)}>{busyOrderId === order.id ? 'Membatalkan…' : 'Batalkan'}</button>}
                          {order.payment?.status === 'pending' && status !== 'cancelled' && <Link className={primaryButton} to={`/pembayaran/${order.id}`}>Bayar</Link>}
                        </div>
                      </div>
                    </article>;
                  })}
                </div>
              ))}
            </div>
          )}

          {activeMenu === 'wishlist' && (
            <div className={cardClass}>
              <SectionHeader
                title="Wishlist"
                description="Kumpulan produk yang kamu simpan untuk dibeli nanti."
              />
              <DataFeedback loading={dataLoading} error={dataError} />
              <DataSuccess message={success} />
              {!dataLoading && !dataError && (wishlist.length === 0 ? <EmptyState>Wishlist kamu masih kosong.</EmptyState> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {wishlist.map(({ product }) => {
                    const image = product.images?.find((item) => item.is_primary)?.url ?? product.images?.[0]?.url ?? (product.image ? storageUrl(product.image) : '');
                    return <article key={product.id} className="overflow-hidden rounded-xl border border-gray-100">
                      <Link to={`/produk/${product.id}`}><img className="h-40 w-full bg-gray-50 object-cover" src={image} alt={product.name} /></Link>
                      <div className="p-4"><Link to={`/produk/${product.id}`} className="line-clamp-2 font-bold text-gray-900 hover:text-[#DF3E1D]">{product.name}</Link>
                        <p className="mt-2 font-extrabold text-[#DF3E1D]">{formatPrice(Number(product.price))}</p>
                        <button type="button" className={`${outlineButton} mt-4 w-full`} onClick={() => void removeWishlistItem(product.id)}>Hapus dari wishlist</button>
                      </div>
                    </article>;
                  })}
                </div>
              ))}
            </div>
          )}

          {activeMenu === 'alamat' && (
            <div className={cardClass}>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><SectionHeader title="Alamat Saya" description="Kelola alamat pengiriman untuk pesanan kamu." /><button type="button" className={primaryButton} onClick={() => startAddressForm()}>Tambah Alamat</button></div>
              <DataFeedback loading={dataLoading} error={dataError} />
              <DataSuccess message={success} />
              {!dataLoading && !dataError && (addresses.length === 0 ? <EmptyState>Belum ada alamat tersimpan.</EmptyState> : (
                <div className="space-y-3">{addresses.map((address) => <article key={address.id} className="rounded-xl border border-gray-100 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-gray-900">{address.label}</h3>{address.is_default && <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">Alamat utama</span>}</div><p className="mt-2 text-sm font-semibold text-gray-800">{address.name} · {address.phone}</p><p className="mt-1 text-sm leading-6 text-gray-600">{address.address}{address.rt ? `, RT ${address.rt}` : ''}{address.rw ? ` / RW ${address.rw}` : ''}{address.neighborhood ? `, ${address.neighborhood}` : ''}, {address.village}, {address.district}, {address.city}, {address.province} {address.postal_code}</p></div>
                    <div className="flex flex-wrap gap-2"><button type="button" className={outlineButton} onClick={() => startAddressForm(address)}>Edit</button>{!address.is_default && <button type="button" className={outlineButton} onClick={() => void setDefaultAddress(address)}>Jadikan utama</button>}<button type="button" className={outlineButton} disabled={addressDeleting === address.id} onClick={() => void deleteAddress(address)}>{addressDeleting === address.id ? 'Menghapus…' : 'Hapus'}</button></div>
                  </div>
                </article>)}</div>
              ))}
              {addressForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddressForm(null); }}>
                <form className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7" onSubmit={(event) => void saveAddress(event)}>
                  <div className="mb-5 flex items-start justify-between"><div><h3 className="text-xl font-extrabold text-gray-900">{addressForm.id ? 'Edit Alamat' : 'Tambah Alamat'}</h3><p className="mt-1 text-sm text-gray-500">Lengkapi lokasi agar alamat bisa dipakai untuk pengiriman.</p></div><button type="button" className="text-2xl text-gray-400" aria-label="Tutup" onClick={() => setAddressForm(null)}>×</button></div>
                  {dataError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{dataError}</p>}
                  {locationError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{locationError}</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([['label', 'Label alamat'], ['name', 'Nama penerima'], ['phone', 'Nomor HP']] as const).map(([key, label]) => <label key={key} className="text-sm font-semibold text-gray-600">{label}<input className={inputClass} required value={addressForm[key]} onChange={(event) => setAddressForm((current) => current ? { ...current, [key]: event.target.value } : current)} /></label>)}
                    {([['province_code', 'Provinsi', provinces], ['regency_code', 'Kabupaten/Kota', regencies], ['district_code', 'Kecamatan', districts], ['village_code', 'Kelurahan/Desa', villages]] as const).map(([key, label, options]) => <label key={key} className="text-sm font-semibold text-gray-600">{label}<select className={inputClass} required value={addressForm[key] ?? ''} disabled={(key === 'regency_code' && !addressForm.province_code) || (key === 'district_code' && !addressForm.regency_code) || (key === 'village_code' && !addressForm.district_code)} onChange={(event) => setAddressForm((current) => {
                      if (!current) return current;
                      if (key === 'province_code') return { ...current, province_code: event.target.value, regency_code: '', district_code: '', village_code: '' };
                      if (key === 'regency_code') return { ...current, regency_code: event.target.value, district_code: '', village_code: '' };
                      if (key === 'district_code') return { ...current, district_code: event.target.value, village_code: '' };
                      return { ...current, village_code: event.target.value };
                    })}><option value="">Pilih {label.toLowerCase()}</option>{options.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>)}
                    <label className="text-sm font-semibold text-gray-600">Kode pos<input className={inputClass} inputMode="numeric" maxLength={5} required value={addressForm.postal_code} onChange={(event) => setAddressForm((current) => current ? { ...current, postal_code: event.target.value.replace(/\D/g, '').slice(0, 5) } : current)} /></label>
                    <label className="text-sm font-semibold text-gray-600 sm:col-span-2">Alamat lengkap<input className={inputClass} required minLength={5} maxLength={2000} value={addressForm.address} onChange={(event) => setAddressForm((current) => current ? { ...current, address: event.target.value } : current)} /></label>
                    {([['rt', 'RT'], ['rw', 'RW'], ['neighborhood', 'Lingkungan'], ['landmark', 'Patokan']] as const).map(([key, label]) => <label key={key} className="text-sm font-semibold text-gray-600">{label}<input className={inputClass} value={addressForm[key] ?? ''} onChange={(event) => setAddressForm((current) => current ? { ...current, [key]: event.target.value } : current)} /></label>)}
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2"><input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm((current) => current ? { ...current, is_default: event.target.checked } : current)} /> Jadikan alamat utama</label>
                  </div>
                  <div className="mt-6 flex justify-end gap-3"><button type="button" className={outlineButton} onClick={() => setAddressForm(null)}>Batal</button><button type="submit" className={primaryButton} disabled={addressSaving}>{addressSaving ? 'Menyimpan…' : 'Simpan Alamat'}</button></div>
                </form>
              </div>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-extrabold text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF3E1D]" />
      {label}
    </div>
  );
}

function DataFeedback({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <LoadingState label="Memuat data…" />;
  if (error) return <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button type="button" className="ml-2 font-semibold underline" onClick={() => window.location.reload()}>Muat ulang</button></div>;
  return null;
}

function EmptyState({ children }: { children: string }) {
  return <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">{children}</div>;
}

function DataSuccess({ message }: { message: string }) {
  if (!message) return null;
  return <div role="status" className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>;
}

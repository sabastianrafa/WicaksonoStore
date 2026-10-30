import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../data';
import { apiFetch, storageUrl } from '../api/client';
import type { Page } from '../App';

/*
| Bentuk item keranjang mengikuti API /api/cart, sama dengan CartPage
| dan App. Sebelumnya bentuk datar sendiri sehingga tidak cocok dengan
| data yang dikirim keranjang.
*/
interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
    price: string | number;
    stock: number;
    weight: number;
    image?: string | null;
    images?: { id: number; path: string; url?: string; is_primary?: boolean }[];
  };
}

/** Item tanpa `product` dilewati agar tidak error saat render. */
const validItems = (cart: CartItem[]) =>
  cart.filter((item) => Boolean(item?.product));

/** Gambar produk, dengan fallback ke path gambar pertama. */
const productImage = (item: CartItem): string => {
  const p = item.product;

  const url =
    p.images?.find((i) => i.is_primary)?.url ??
    p.images?.[0]?.url ??
    p.image ??
    '';

  if (!url) return '';

  return url.startsWith('http://') || url.startsWith('https://')
    ? url
    : storageUrl(url);
}
interface CheckoutPageProps {
  cart: CartItem[];
  navigate: (page: Page, data?: unknown) => void;
  onOrderPlaced?: () => void;
}

interface LocationOption {
  code: string;
  name: string;
}

interface ShippingQuote {
  region: string;
  location: {
    province: string;
    city: string;
  };
  courier: {
    id: number;
    code: string;
    name: string;
    estimated_days: string | null;
  };
  cost: number;
  original_cost: number;
  shipping_discount: number;
  promotion_applied: boolean;
}

interface ShippingQuoteResponse {
  success: boolean;
  data: ShippingQuote;
}

interface SavedAddress {
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

interface AddressesResponse {
  success: boolean;
  data: SavedAddress[];
}

interface AddressResponse {
  success: boolean;
  data: SavedAddress;
}

interface OrderResponse {
  success: boolean;
  data: { id: number; order_number: string };
}

export default function CheckoutPage({ cart, navigate, onOrderPlaced }: CheckoutPageProps) {
  const [step, setStep] = useState(1);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [regencies, setRegencies] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [locationError, setLocationError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [makeDefaultAddress, setMakeDefaultAddress] = useState(false);
  const [form, setForm] = useState(() => ({
    label: 'Rumah',
    name: localStorage.getItem('userName') ?? '',
    phone: localStorage.getItem('userPhone') ?? '',
    province_code: '',
    regency_code: '',
    district_code: '',
    village_code: '',
    zip: '',
    rt: '',
    rw: '',
    neighborhood: '',
    landmark: '',
    address: '',
  }));
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const shippingQuoteRequestId = useRef(0);

  useEffect(() => {
    let active = true;

    apiFetch<AddressesResponse>('/addresses')
      .then((response) => {
        if (!active) return;
        const addresses = response.data;
        setSavedAddresses(addresses);
        const usableAddresses = addresses.filter((address) =>
          address.province_code && address.regency_code && address.district_code && address.village_code
        );
        const defaultAddress = usableAddresses.find((address) => address.is_default);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (usableAddresses[0]) {
          setSelectedAddressId(usableAddresses[0].id);
        } else {
          setAddingAddress(true);
        }
      })
      .catch((error) => {
        if (active) {
          setAddressesError(error instanceof Error ? error.message : 'Gagal memuat alamat tersimpan.');
        }
      })
      .finally(() => {
        if (active) setAddressesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    apiFetch<{ data: LocationOption[] }>('/locations/provinces')
      .then((response) => {
        if (active) setProvinces(response.data);
      })
      .catch((error) => {
        if (active) {
          setLocationError(error instanceof Error ? error.message : 'Gagal memuat daftar provinsi.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.province_code) {
      setRegencies([]);
      return;
    }

    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/provinces/${encodeURIComponent(form.province_code)}/regencies`)
      .then((response) => {
        if (active) setRegencies(response.data);
      })
      .catch((error) => {
        if (active) setLocationError(error instanceof Error ? error.message : 'Gagal memuat daftar kabupaten/kota.');
      });
    return () => {
      active = false;
    };
  }, [form.province_code]);

  useEffect(() => {
    if (!form.regency_code) {
      setDistricts([]);
      return;
    }

    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/regencies/${encodeURIComponent(form.regency_code)}/districts`)
      .then((response) => {
        if (active) setDistricts(response.data);
      })
      .catch((error) => {
        if (active) setLocationError(error instanceof Error ? error.message : 'Gagal memuat daftar kecamatan.');
      });
    return () => {
      active = false;
    };
  }, [form.regency_code]);

  useEffect(() => {
    if (!form.district_code) {
      setVillages([]);
      return;
    }

    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/districts/${encodeURIComponent(form.district_code)}/villages`)
      .then((response) => {
        if (active) setVillages(response.data);
      })
      .catch((error) => {
        if (active) setLocationError(error instanceof Error ? error.message : 'Gagal memuat daftar kelurahan/desa.');
      });
    return () => {
      active = false;
    };
  }, [form.district_code]);

  const items = validItems(cart);

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0
  );
  const shippingFee = shippingQuote?.cost ?? 0;
  const total = subtotal + shippingFee;
  const usableAddresses = savedAddresses.filter((address) =>
    address.province_code && address.regency_code && address.district_code && address.village_code
  );
  const incompleteAddresses = savedAddresses.filter((address) =>
    !address.province_code || !address.regency_code || !address.district_code || !address.village_code
  );

  const updateAddressField = (field: keyof typeof form, value: string) => {
    setForm((current) => {
      if (field === 'province_code') {
        return { ...current, province_code: value, regency_code: '', district_code: '', village_code: '' };
      }
      if (field === 'regency_code') {
        return { ...current, regency_code: value, district_code: '', village_code: '' };
      }
      if (field === 'district_code') {
        return { ...current, district_code: value, village_code: '' };
      }
      return { ...current, [field]: value };
    });
    if (field === 'province_code') {
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
    } else if (field === 'regency_code') {
      setDistricts([]);
      setVillages([]);
    } else if (field === 'district_code') {
      setVillages([]);
    }
    if (['province_code', 'regency_code', 'district_code', 'village_code'].includes(field)) {
      shippingQuoteRequestId.current += 1;
      setShippingQuote(null);
      setShippingError('');
      setQuoteLoading(false);
      setLocationError('');
    }
  };

  const selectAddress = (addressId: number) => {
    setSelectedAddressId(addressId);
    setAddingAddress(false);
    shippingQuoteRequestId.current += 1;
    setShippingQuote(null);
    setShippingError('');
    setOrderError('');
    setQuoteLoading(false);
  };

  const startAddingAddress = () => {
    setSelectedAddressId(null);
    setAddingAddress(true);
    setMakeDefaultAddress(savedAddresses.length === 0);
    setForm((current) => ({
      ...current,
      label: 'Rumah',
      province_code: '',
      regency_code: '',
      district_code: '',
      village_code: '',
      zip: '',
      rt: '',
      rw: '',
      neighborhood: '',
      landmark: '',
      address: '',
    }));
    shippingQuoteRequestId.current += 1;
    setShippingQuote(null);
    setShippingError('');
    setOrderError('');
    setQuoteLoading(false);
  };

  const continueToConfirmation = async () => {
    const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId);
    if (!addingAddress && !selectedAddress) {
      setShippingError('Pilih alamat pengiriman atau tambahkan alamat baru.');
      return;
    }

    if (addingAddress && (
      !form.label.trim() ||
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.province_code ||
      !form.regency_code ||
      !form.district_code ||
      !form.village_code ||
      !/^\d{5}$/.test(form.zip.trim()) ||
      !form.address.trim()
    )) {
      setShippingError('Lengkapi label, data penerima, seluruh wilayah, kode pos 5 digit, dan alamat jalan.');
      return;
    }

    const location = addingAddress ? form : selectedAddress!;
    const requestId = ++shippingQuoteRequestId.current;
    setQuoteLoading(true);
    setShippingError('');

    try {
      const response = await apiFetch<ShippingQuoteResponse>('/shipping-methods/quote', {
        method: 'POST',
        body: JSON.stringify({
          province_code: location.province_code,
          regency_code: location.regency_code,
          district_code: location.district_code,
          village_code: location.village_code,
        }),
      });

      if (requestId !== shippingQuoteRequestId.current) return;

      let addressId = selectedAddressId;
      if (addingAddress) {
        const addressResponse = await apiFetch<AddressResponse>('/addresses', {
          method: 'POST',
          body: JSON.stringify({
            label: form.label.trim(),
            name: form.name.trim(),
            phone: form.phone.trim(),
            province_code: form.province_code,
            regency_code: form.regency_code,
            district_code: form.district_code,
            village_code: form.village_code,
            postal_code: form.zip.trim(),
            rt: form.rt.trim() || null,
            rw: form.rw.trim() || null,
            neighborhood: form.neighborhood.trim() || null,
            landmark: form.landmark.trim() || null,
            address: form.address.trim(),
            is_default: makeDefaultAddress,
          }),
        });
        if (requestId !== shippingQuoteRequestId.current) return;
        addressId = addressResponse.data.id;
        setSavedAddresses((current) => [addressResponse.data, ...current]);
        setSelectedAddressId(addressId);
        setAddingAddress(false);
      }

      if (addressId) {
        setShippingQuote(response.data);
        setOrderError('');
        setStep(2);
      }
    } catch (error) {
      if (requestId === shippingQuoteRequestId.current) {
        setShippingError(error instanceof Error ? error.message : 'Gagal menghitung ongkos kirim.');
      }
    } finally {
      if (requestId === shippingQuoteRequestId.current) {
        setQuoteLoading(false);
      }
    }
  };

  const handleOrder = async () => {
    setOrderError('');

    if (!shippingQuote) {
      setOrderError('Ongkir belum dihitung. Kembali ke alamat untuk menghitung ongkir.');
      setStep(1);
      return;
    }

    if (items.length === 0) {
      setOrderError('Keranjang kosong. Tambahkan produk sebelum checkout.');
      return;
    }

    if (!selectedAddressId) {
      setOrderError('Pilih alamat pengiriman terlebih dahulu.');
      setStep(1);
      return;
    }

    setSubmittingOrder(true);

    try {
      const orderResponse = await apiFetch<OrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          address_id: selectedAddressId,
          shipping_method_id: shippingQuote.courier.id,
        }),
      });

      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced();
      }
      navigate('payment', { orderId: orderResponse.data.id });
    } catch (error) {
      setOrderError(
        error instanceof Error ? error.message : 'Gagal membuat pesanan.'
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

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
        {[{ n: 1, label: 'Alamat & Pengiriman' }, { n: 2, label: 'Konfirmasi Pesanan' }].map(({ n, label }, idx) => (
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
            {idx < 1 && <div style={{ flex: 1, height: 2, background: step > n ? '#F97316' : '#F3F4F6', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        <div>
          {step === 1 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 6px', fontWeight: 700, color: '#1F2937' }}>Alamat Pengiriman</h3>
              <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '0.85rem' }}>
                Pilih alamat yang sudah tersimpan atau tambahkan alamat baru ke akun Anda.
              </p>
              {addressesLoading && (
                <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Memuat alamat tersimpan...</p>
              )}
              {addressesError && (
                <p role="alert" style={{ color: '#DC2626', fontSize: '0.85rem' }}>{addressesError}</p>
              )}
              {!addressesLoading && usableAddresses.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {usableAddresses.map((address) => {
                    const selected = selectedAddressId === address.id && !addingAddress;
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => selectAddress(address.id)}
                        aria-pressed={selected}
                        style={{
                          textAlign: 'left',
                          padding: 16,
                          borderRadius: 10,
                          border: `1px solid ${selected ? '#F97316' : '#E5E7EB'}`,
                          background: selected ? '#FFF7ED' : 'white',
                          cursor: 'pointer',
                          fontFamily: 'Poppins',
                        }}
                      >
                        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <strong style={{ color: '#1F2937', fontSize: '0.9rem' }}>{address.label}</strong>
                          {address.is_default && (
                            <span style={{ color: '#15803D', fontSize: '0.7rem', fontWeight: 700 }}>UTAMA</span>
                          )}
                        </span>
                        <span style={{ display: 'block', marginTop: 8, color: '#374151', fontSize: '0.82rem', fontWeight: 600 }}>
                          {address.name} · {address.phone}
                        </span>
                        <span style={{ display: 'block', marginTop: 5, color: '#6B7280', fontSize: '0.78rem', lineHeight: 1.6 }}>
                          {address.address}
                          {address.rt || address.rw ? `, RT ${address.rt || '-'} / RW ${address.rw || '-'}` : ''}
                          {address.neighborhood ? `, ${address.neighborhood}` : ''}
                          {address.landmark ? `, patokan ${address.landmark}` : ''}
                          {`, ${address.village}, ${address.district}, ${address.city}, ${address.province} ${address.postal_code}`}
                        </span>
                        <span style={{ display: 'block', marginTop: 8, color: selected ? '#C2410C' : '#9CA3AF', fontSize: '0.75rem', fontWeight: 600 }}>
                          {selected ? 'Alamat dipilih' : 'Pilih alamat'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {!addressesLoading && incompleteAddresses.length > 0 && (
                <p style={{ margin: '12px 0 0', padding: '10px 12px', borderRadius: 8, background: '#FFFBEB', color: '#92400E', fontSize: '0.78rem' }}>
                  Ada alamat lama yang belum memiliki wilayah lengkap. Tambahkan ulang alamat tersebut agar bisa dipakai untuk pengiriman.
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={startAddingAddress}
                  aria-pressed={addingAddress}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${addingAddress ? '#F97316' : '#D1D5DB'}`,
                    background: addingAddress ? '#FFF7ED' : 'white',
                    color: addingAddress ? '#C2410C' : '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Poppins',
                    fontSize: '0.82rem',
                  }}
                >
                  + Tambah alamat baru
                </button>
              </div>
              {addingAddress && (
                <>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
                    <h4 style={{ margin: '0 0 16px', color: '#1F2937', fontWeight: 700 }}>Detail alamat baru</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Label alamat</label>
                        <input className="input-field" placeholder="Contoh: Rumah, Kantor" maxLength={255} value={form.label} onChange={event => updateAddressField('label', event.target.value)} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'end', paddingBottom: 9 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontSize: '0.82rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={makeDefaultAddress} onChange={event => setMakeDefaultAddress(event.target.checked)} />
                          Jadikan alamat utama
                        </label>
                      </div>
                    </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { field: 'name', label: 'Nama Lengkap', placeholder: 'Masukkan nama lengkap' },
                  { field: 'phone', label: 'Nomor HP', placeholder: '08xx-xxxx-xxxx' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input
                      className="input-field"
                      placeholder={placeholder}
                      value={form[field as keyof typeof form]}
                      onChange={e => updateAddressField(field as keyof typeof form, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {[
                  { field: 'province_code', label: 'Provinsi', options: provinces, disabled: false, placeholder: 'Pilih provinsi' },
                  { field: 'regency_code', label: 'Kota/Kabupaten', options: regencies, disabled: !form.province_code, placeholder: 'Pilih kota/kabupaten' },
                ].map(({ field, label, options, disabled, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <select
                      className="input-field"
                      value={form[field as keyof typeof form]}
                      disabled={disabled}
                      onChange={(event) => updateAddressField(field as keyof typeof form, event.target.value)}
                    >
                      <option value="">{placeholder}</option>
                      {options.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                {[
                  { field: 'district_code', label: 'Kecamatan', options: districts, disabled: !form.regency_code, placeholder: 'Pilih kecamatan' },
                  { field: 'village_code', label: 'Kelurahan/Desa', options: villages, disabled: !form.district_code, placeholder: 'Pilih kelurahan/desa' },
                ].map(({ field, label, options, disabled, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <select
                      className="input-field"
                      value={form[field as keyof typeof form]}
                      disabled={disabled}
                      onChange={(event) => updateAddressField(field as keyof typeof form, event.target.value)}
                    >
                      <option value="">{placeholder}</option>
                      {options.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Kode Pos</label>
                  <input className="input-field" inputMode="numeric" maxLength={5} placeholder="00000" value={form.zip} onChange={event => updateAddressField('zip', event.target.value.replace(/\D/g, '').slice(0, 5))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {[
                  { field: 'rt', label: 'RT', placeholder: 'Contoh: 001' },
                  { field: 'rw', label: 'RW', placeholder: 'Contoh: 002' },
                  { field: 'neighborhood', label: 'Perumahan / Lingkungan (opsional)', placeholder: 'Nama perumahan atau lingkungan' },
                  { field: 'landmark', label: 'Patokan (opsional)', placeholder: 'Patokan lokasi terdekat' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input className="input-field" maxLength={field === 'rt' || field === 'rw' ? 3 : undefined} placeholder={placeholder} value={form[field as keyof typeof form]} onChange={event => updateAddressField(field as keyof typeof form, event.target.value)} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Nama Jalan, Nomor Rumah, dan Detail Alamat</label>
                <textarea className="input-field" placeholder="Contoh: Jl. Mawar No. 10, Gang 2, rumah pagar hijau" rows={3} value={form.address} onChange={e => updateAddressField('address', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
                  </div>
                </>
              )}
              {locationError && <p role="alert" style={{ color: '#DC2626', fontSize: '0.85rem', margin: '16px 0 0' }}>{locationError}</p>}
              {shippingError && (
                <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '16px 0 0' }}>{shippingError}</p>
              )}
              <button className="btn-primary" onClick={continueToConfirmation} disabled={quoteLoading || addressesLoading} style={{ marginTop: 24, padding: '12px 28px', opacity: quoteLoading || addressesLoading ? 0.65 : 1 }}>
                {quoteLoading ? 'Menghitung ongkir...' : 'Lanjut konfirmasi →'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 6px', fontWeight: 700, color: '#1F2937' }}>Konfirmasi Pesanan</h3>
              <p style={{ margin: '0 0 20px', color: '#6B7280', fontSize: '0.85rem' }}>
                Periksa kembali alamat dan pengiriman. Setelah pesanan dibuat, Anda akan melanjutkan ke halaman pembayaran.
              </p>
              {savedAddresses.find((address) => address.id === selectedAddressId) && (() => {
                const address = savedAddresses.find((item) => item.id === selectedAddressId)!;
                return (
                  <div style={{ padding: '16px 18px', marginBottom: 16, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                    <div style={{ fontWeight: 700, color: '#1F2937' }}>{address.name} · {address.phone}</div>
                    <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#6B7280' }}>
                      {[address.address, address.village, address.district, address.city, address.province, address.postal_code].filter(Boolean).join(', ')}
                    </div>
                  </div>
                );
              })()}
              {shippingQuote && (
                <div style={{ padding: '16px 18px', borderRadius: 10, border: '1px solid #FED7AA', background: '#FFF7ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1F2937' }}>{shippingQuote.courier.name}</div>
                    <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#6B7280' }}>
                      Ongkir ke {shippingQuote.location.city}, {shippingQuote.location.province}
                      {shippingQuote.courier.estimated_days ? ` · Estimasi ${shippingQuote.courier.estimated_days}` : ''}
                    </div>
                    {shippingQuote.promotion_applied && (
                      <div style={{ marginTop: 5, fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>
                        Gratis ongkir · Hemat {formatPrice(shippingQuote.shipping_discount)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {shippingQuote.promotion_applied && (
                      <div style={{ color: '#9CA3AF', fontSize: '0.78rem', textDecoration: 'line-through' }}>
                        {formatPrice(shippingQuote.original_cost)}
                      </div>
                    )}
                    <span style={{ fontWeight: 800, color: shippingQuote.promotion_applied ? '#15803D' : '#F97316' }}>
                      {shippingQuote.promotion_applied ? 'GRATIS' : formatPrice(shippingQuote.cost)}
                    </span>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: '#F8FAFC', color: '#475569', fontSize: '0.85rem' }}>
                Jumlah barang: {items.reduce((sum, item) => sum + item.quantity, 0)} · Total: <strong>{formatPrice(total)}</strong>
              </div>
              {orderError && (
                <p role="alert" style={{ color: '#DC2626', fontSize: '0.85rem', margin: '16px 0 0' }}>{orderError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-outline" onClick={() => setStep(1)} style={{ padding: '12px 24px' }}>← Kembali</button>
                <button
                  className="btn-primary"
                  onClick={handleOrder}
                  disabled={submittingOrder}
                  style={{ padding: '12px 28px', flex: 1, opacity: submittingOrder ? 0.65 : 1 }}
                >
                  {submittingOrder ? 'Menyimpan Pesanan...' : 'Buat Pesanan & Lanjut ke Pembayaran'}
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
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={productImage(item)} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: '#FFF8F0' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>
                      ×{item.quantity}
                      {item.product.weight > 0
                        ? ` · ${item.product.weight.toLocaleString('id-ID')} g`
                        : ''}
                    </p>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.85rem', flexShrink: 0 }}>{formatPrice(Number(item.product.price) * item.quantity)}</span>
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
                <span style={{ fontWeight: 600, color: '#1F2937' }}>{shippingQuote ? formatPrice(shippingFee) : 'Dihitung dari alamat'}</span>
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

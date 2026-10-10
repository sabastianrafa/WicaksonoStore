import { useEffect, useRef, useState } from 'react';
import type { LatLngTuple } from 'leaflet';
import type { Map as MapTilerMap, Marker as MapTilerMarker } from '@maptiler/sdk';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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
interface CheckoutPageProps { cart: CartItem[]; navigate: (page: Page) => void; }

const INDONESIAN_PROVINCES = [
  'Aceh',
  'Bali',
  'Banten',
  'Bengkulu',
  'DI Yogyakarta',
  'DKI Jakarta',
  'Gorontalo',
  'Jambi',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Kalimantan Barat',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'Lampung',
  'Maluku',
  'Maluku Utara',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Tengah',
  'Riau',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Sulawesi Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Sumatera Utara',
];

interface ShippingQuote {
  region: string;
  courier: {
    id: number;
    code: string;
    name: string;
    estimated_days: string | null;
  };
  cost: number;
}

interface ShippingQuoteResponse {
  success: boolean;
  data: ShippingQuote;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    city?: string;
    locality?: string;
    county?: string;
    district?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface LocationSuggestion {
  id: string;
  label: string;
  city: string;
  province: string;
  coordinates: LatLngTuple;
}

const mapTilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY?.trim();

function MapClickHandler({ onPick }: { onPick: (coordinates: LatLngTuple) => void }) {
  useMapEvents({
    click: (event) => onPick([event.latlng.lat, event.latlng.lng]),
  });

  return null;
}

function IndonesianAddressMap({
  apiKey,
  position,
  onPick,
}: {
  apiKey: string;
  position: LatLngTuple | null;
  onPick: (coordinates: LatLngTuple) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapTilerMap | null>(null);
  const markerRef = useRef<MapTilerMarker | null>(null);
  const onPickRef = useRef(onPick);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  onPickRef.current = onPick;

  useEffect(() => {
    let disposed = false;
    let map: MapTilerMap | null = null;

    Promise.all([
      import('@maptiler/sdk'),
      import('@maptiler/sdk/dist/maptiler-sdk.css'),
    ]).then(([sdk]) => {
      if (disposed || !containerRef.current) return;

      sdk.config.apiKey = apiKey;
      sdk.config.primaryLanguage = 'id';

      map = new sdk.Map({
        container: containerRef.current,
        style: sdk.MapStyle.STREETS,
        center: [118, -2.5],
        zoom: 4,
      });
      mapRef.current = map;
      map.on('click', (event) => {
        onPickRef.current([event.lngLat.lat, event.lngLat.lng]);
      });
      map.on('error', () => {
        setMapError('Peta tidak dapat dimuat. Periksa API key MapTiler dan koneksi internet.');
      });
      setMapReady(true);
    }).catch((error: unknown) => {
      console.error('Gagal memuat peta MapTiler:', error);
      setMapError('Peta tidak dapat dimuat. Periksa koneksi internet dan konfigurasi MapTiler.');
    });

    return () => {
      disposed = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !position) return;

    const coordinates: [number, number] = [position[1], position[0]];
    map.flyTo({ center: coordinates, zoom: 13 });
    if (markerRef.current) {
      markerRef.current.setLngLat(coordinates);
    } else {
      markerRef.current = new maptilersdk.Marker({ color: '#F97316' })
        .setLngLat(coordinates)
        .addTo(map);
    }
  }, [mapReady, position]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      {mapError && (
        <div role="alert" style={{ position: 'absolute', inset: 'auto 8px 8px', padding: 8, background: 'white', color: '#DC2626', fontSize: '0.75rem' }}>
          {mapError}
        </div>
      )}
    </div>
  );
}

function MapRecenter({ position }: { position: LatLngTuple | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 0.5 });
  }, [map, position]);

  return null;
}

export default function CheckoutPage({ cart, navigate }: CheckoutPageProps) {
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState('transfer');
  const [form, setForm] = useState(() => ({
    name: localStorage.getItem('userName') ?? '',
    phone: localStorage.getItem('userPhone') ?? '',
    province: '',
    city: '',
    zip: '',
    address: '',
  }));
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [mapPosition, setMapPosition] = useState<LatLngTuple | null>(null);
  const [mapLookupLoading, setMapLookupLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const query = citySearch.trim();
    if (query.length < 3) {
      setLocationSuggestions([]);
      setLocationSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLocationSearchLoading(true);

      try {
        const searchQuery = [query, form.province, 'Indonesia'].filter(Boolean).join(', ');
        const params = new URLSearchParams({ q: searchQuery, limit: '6' });
        const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Pencarian lokasi gagal.');

        const result = await response.json() as PhotonResponse;
        const suggestions = (result.features ?? [])
          .filter(({ properties }) =>
            !properties.countrycode || properties.countrycode.toLowerCase() === 'id'
          )
          .map(({ properties, geometry }) => {
            const city = properties.city ?? properties.locality ?? properties.name ?? properties.county ?? '';
            const province = properties.state ?? '';
            const label = [...new Set([properties.name, city, province, 'Indonesia'].filter(Boolean))].join(', ');
            const [longitude, latitude] = geometry.coordinates;

            return {
              id: `${properties.osm_id ?? label}-${latitude}-${longitude}`,
              label,
              city,
              province,
              coordinates: [latitude, longitude] as LatLngTuple,
            };
          })
          .filter((suggestion) => suggestion.city && suggestion.province);

        if (!controller.signal.aborted) setLocationSuggestions(suggestions);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLocationError(error instanceof Error ? error.message : 'Pencarian lokasi gagal.');
          setLocationSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLocationSearchLoading(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [citySearch, form.province]);

  const items = validItems(cart);

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0
  );
  const shippingFee = shippingQuote?.cost ?? 0;
  const total = subtotal + shippingFee;

  const updateAddressField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'city' || field === 'province') {
      setShippingQuote(null);
      setShippingError('');
    }
  };

  const selectLocation = (location: LocationSuggestion) => {
    updateAddressField('city', location.city);
    updateAddressField('province', location.province);
    setCitySearch('');
    setLocationSuggestions([]);
    setLocationError('');
    setMapPosition(location.coordinates);
  };

  const reverseGeocodeMapPosition = async (coordinates: LatLngTuple) => {
    setMapPosition(coordinates);
    setMapLookupLoading(true);
    setLocationError('');

    try {
      const [latitude, longitude] = coordinates;
      const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), lang: 'id' });
      const response = await fetch(`https://photon.komoot.io/reverse?${params}`);
      if (!response.ok) throw new Error('Lokasi peta tidak dapat dibaca.');

      const result = await response.json() as PhotonResponse;
      const properties = result.features?.[0]?.properties;
      if (!properties) throw new Error('Pilih titik di daratan Indonesia.');

      const city = properties.city ?? properties.locality ?? properties.name ?? properties.county ?? '';
      const province = properties.state ?? '';
      if (!city || !province || (properties.countrycode && properties.countrycode.toLowerCase() !== 'id')) {
        throw new Error('Pilih titik di wilayah Indonesia yang memiliki data kota dan provinsi.');
      }

      updateAddressField('city', city);
      updateAddressField('province', province);
      setCitySearch('');
      setLocationSuggestions([]);
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Lokasi peta tidak dapat dibaca.');
    } finally {
      setMapLookupLoading(false);
    }
  };

  const continueToShipping = async () => {
    if (!form.city.trim() || !form.province.trim()) {
      setShippingError('Isi kota dan provinsi untuk menghitung ongkos kirim.');
      return;
    }

    setQuoteLoading(true);
    setShippingError('');

    try {
      const response = await apiFetch<ShippingQuoteResponse>('/shipping-methods/quote', {
        method: 'POST',
        body: JSON.stringify({
          city: form.city.trim(),
          province: form.province.trim(),
        }),
      });

      setShippingQuote(response.data);
      setStep(2);
    } catch (error) {
      setShippingError(error instanceof Error ? error.message : 'Gagal menghitung ongkos kirim.');
    } finally {
      setQuoteLoading(false);
    }
  };

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
                    <input
                      className="input-field"
                      list={field === 'province' ? 'checkout-provinces' : undefined}
                      placeholder={field === 'province' ? 'Cari provinsi...' : placeholder}
                      value={form[field as keyof typeof form]}
                      onChange={e => updateAddressField(field as keyof typeof form, e.target.value)}
                    />
                    {field === 'province' && (
                      <datalist id="checkout-provinces">
                        {INDONESIAN_PROVINCES.map((province) => (
                          <option key={province} value={province} />
                        ))}
                      </datalist>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                {[
                  { field: 'province', label: 'Provinsi', placeholder: 'Pilih provinsi' },
                  { field: 'city', label: 'Kota/Kabupaten', placeholder: 'Masukkan kota' },
                  { field: 'zip', label: 'Kode Pos', placeholder: '00000' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input
                      className="input-field"
                      list={field === 'province' ? 'checkout-provinces' : undefined}
                      placeholder={field === 'province' ? 'Cari provinsi...' : field === 'city' ? 'Ketik nama kota...' : placeholder}
                      autoComplete="off"
                      value={form[field as keyof typeof form]}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateAddressField(field as keyof typeof form, value);
                        if (field === 'city') {
                          setCitySearch(value);
                          setLocationError('');
                        }
                      }}
                    />
                    {field === 'province' && (
                      <datalist id="checkout-provinces">
                        {INDONESIAN_PROVINCES.map((province) => (
                          <option key={province} value={province} />
                        ))}
                      </datalist>
                    )}
                    {field === 'city' && locationSuggestions.length > 0 && (
                      <div
                        role="listbox"
                        aria-label="Hasil pencarian kota"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 20,
                          maxHeight: 220,
                          overflowY: 'auto',
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: 8,
                          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                        }}
                      >
                        {locationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => selectLocation(suggestion)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 12px',
                              border: 0,
                              borderBottom: '1px solid #F3F4F6',
                              background: 'white',
                              color: '#374151',
                              textAlign: 'left',
                              fontFamily: 'Poppins',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Cari kota atau pilih titik di peta</label>
                  {(locationSearchLoading || mapLookupLoading) && (
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      {mapLookupLoading ? 'Membaca lokasi...' : 'Mencari lokasi...'}
                    </span>
                  )}
                </div>
                {locationError && (
                  <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#DC2626' }}>{locationError}</p>
                )}
                <div style={{ height: 300, overflow: 'hidden', border: '1px solid #E5E7EB', borderRadius: 10, zIndex: 0 }}>
                  {mapTilerApiKey ? (
                    <IndonesianAddressMap
                      apiKey={mapTilerApiKey}
                      position={mapPosition}
                      onPick={reverseGeocodeMapPosition}
                    />
                  ) : (
                    <MapContainer
                      center={[-2.5, 118]}
                      zoom={4}
                      scrollWheelZoom
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapClickHandler onPick={reverseGeocodeMapPosition} />
                      <MapRecenter position={mapPosition} />
                      {mapPosition && (
                        <CircleMarker
                          center={mapPosition}
                          radius={9}
                          pathOptions={{ color: '#C2410C', fillColor: '#F97316', fillOpacity: 0.9 }}
                        />
                      )}
                    </MapContainer>
                  )}
                </div>
                <p style={{ margin: '6px 0 0', color: '#9CA3AF', fontSize: '0.72rem' }}>
                  {mapTilerApiKey
                    ? 'Peta © MapTiler dan OpenStreetMap · Pencarian lokasi oleh Photon'
                    : 'Peta © OpenStreetMap · Pencarian lokasi oleh Photon'}
                </p>
                {!mapTilerApiKey && (
                  <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.72rem' }}>
                    Bahasa label peta belum dikonfigurasi; atur VITE_MAPTILER_API_KEY untuk mengaktifkan Bahasa Indonesia.
                  </p>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Alamat Lengkap</label>
                <textarea className="input-field" placeholder="Nama jalan, no. rumah, RT/RW, kelurahan, kecamatan..." rows={3} value={form.address} onChange={e => updateAddressField('address', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              {shippingError && (
                <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '16px 0 0' }}>{shippingError}</p>
              )}
              <button className="btn-primary" onClick={continueToShipping} disabled={quoteLoading} style={{ marginTop: 24, padding: '12px 28px', opacity: quoteLoading ? 0.65 : 1 }}>
                {quoteLoading ? 'Menghitung ongkir...' : 'Lanjut ke Pengiriman →'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: 700, color: '#1F2937' }}>Kurir untuk Tujuan Anda</h3>
              {shippingQuote && (
                <div style={{ padding: '16px 18px', borderRadius: 10, border: '1px solid #FED7AA', background: '#FFF7ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1F2937' }}>{shippingQuote.courier.name}</div>
                    <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#6B7280' }}>
                      {shippingQuote.region === 'malang' ? 'Kota Malang' : shippingQuote.region === 'jawa' ? 'Pulau Jawa' : 'Luar Pulau Jawa'}
                      {shippingQuote.courier.estimated_days ? ` · Estimasi ${shippingQuote.courier.estimated_days}` : ''}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#F97316', whiteSpace: 'nowrap' }}>{formatPrice(shippingQuote.cost)}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-outline" onClick={() => setStep(1)} style={{ padding: '12px 24px' }}>← Kembali</button>
                <button className="btn-primary" onClick={() => setStep(3)} disabled={!shippingQuote} style={{ padding: '12px 28px' }}>Lanjut ke Pembayaran →</button>
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
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={productImage(item)} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: '#FFF8F0' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>×{item.quantity}</p>
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

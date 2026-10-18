import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import { formatPrice } from '../../data';
import type { ShippingMethod, ShippingPromotion } from './types';
import {
  Modal,
  card,
  emptyCell,
  ghostButton,
  labelStyle,
  primaryButton,
} from './styles';

interface Props {
  methods: ShippingMethod[];
  loading: boolean;
  promotion: ShippingPromotion | null;
  promotionLoading: boolean;
  promotionError: string;
  onSavePromotion: (payload: {
    is_active: boolean;
    minimum_purchase: number;
    area_codes: string[];
  }) => Promise<unknown>;
  onSave: (payload: {
    id: number;
    cost: number;
    estimated_days: string | null;
  }) => Promise<unknown>;
}

interface FormState {
  id: number;
  cost: string;
  estimatedDays: string;
}

const toForm = (method: ShippingMethod): FormState => ({
  id: method.id,
  cost: String(method.cost),
  estimatedDays: method.estimated_days ?? '',
});

const SHIPPING_REGIONS: Record<string, string> = {
  GOSEND: 'Malang Raya',
  JNT_REG: 'Pulau Jawa di luar Malang Raya',
  LION_PARCEL: 'Luar Pulau Jawa',
};

interface LocationOption {
  code: string;
  name: string;
}

export default function ShippingSection({
  methods,
  loading,
  onSave,
  promotion,
  promotionLoading,
  promotionError,
  onSavePromotion,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [minimumPurchase, setMinimumPurchase] = useState('');
  const [areaCodes, setAreaCodes] = useState<string[]>([]);
  const [areaNames, setAreaNames] = useState<Record<string, string>>({});
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [regencies, setRegencies] = useState<LocationOption[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [regencyCode, setRegencyCode] = useState('');
  const [areaLevel, setAreaLevel] = useState<'province' | 'regency'>('province');
  const [promotionSaving, setPromotionSaving] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    apiFetch<{ data: LocationOption[] }>('/locations/provinces')
      .then((response) => setProvinces(response.data))
      .catch((error) => setLocationError(error instanceof Error ? error.message : 'Gagal memuat wilayah.'));
  }, []);

  useEffect(() => {
    if (!promotion) return;
    setPromoEnabled(promotion.is_active);
    setMinimumPurchase(String(promotion.minimum_purchase));
    setAreaCodes(promotion.area_codes);
    setAreaNames(Object.fromEntries(promotion.areas.map((area) => [area.code, area.name])));
  }, [promotion]);

  useEffect(() => {
    if (!provinceCode) {
      setRegencies([]);
      setRegencyCode('');
      return;
    }
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/provinces/${encodeURIComponent(provinceCode)}/regencies`)
      .then((response) => {
        if (active) setRegencies(response.data);
      })
      .catch((error) => {
        if (active) setLocationError(error instanceof Error ? error.message : 'Gagal memuat kota/kabupaten.');
      });
    return () => {
      active = false;
    };
  }, [provinceCode]);

  const addPromotionArea = () => {
    const option = areaLevel === 'province'
      ? provinces.find((province) => province.code === provinceCode)
      : regencies.find((regency) => regency.code === regencyCode);
    if (!option) return;
    setAreaCodes((current) => current.includes(option.code) ? current : [...current, option.code]);
    setAreaNames((current) => ({ ...current, [option.code]: option.name }));
  };

  const savePromotion = async () => {
    const threshold = Number(minimumPurchase);
    if (!Number.isFinite(threshold) || threshold < 0) {
      window.alert('Minimum belanja harus bernilai 0 atau lebih.');
      return;
    }
    if (promoEnabled && areaCodes.length === 0) {
      window.alert('Pilih minimal satu wilayah tujuan untuk mengaktifkan promo.');
      return;
    }

    setPromotionSaving(true);
    try {
      await onSavePromotion({
        is_active: promoEnabled,
        minimum_purchase: threshold,
        area_codes: areaCodes,
      });
      window.alert('Pengaturan promo ongkir berhasil disimpan.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan promo ongkir.');
    } finally {
      setPromotionSaving(false);
    }
  };

  const submit = async () => {
    if (!form) return;

    const cost = Number(form.cost);

    if (!Number.isFinite(cost) || cost < 0) {
      window.alert('Biaya pengiriman tidak valid.');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: form.id,
        cost,
        estimated_days: form.estimatedDays.trim() || null,
      });

      setForm(null);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Gagal menyimpan metode pengiriman.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={card}>
        <div
          style={{
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: '#1F2937' }}>Metode Pengiriman</h2>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
              Hanya GoSend, J&amp;T, dan Lion Parcel. Tarif mengikuti wilayah tujuan.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={emptyCell}>Memuat metode pengiriman...</div>
        ) : methods.length !== 3 ? (
          <div style={emptyCell}>
            Konfigurasi kurir belum lengkap. Jalankan migrasi database terbaru untuk menyiapkan GoSend, J&amp;T, dan Lion Parcel.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {methods.map((method) => (
              <div
                key={method.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  border: '1px solid #F3F4F6',
                  borderRadius: 10,
                  opacity: method.is_active ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(22,163,74,0.08)',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  🚚
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1F2937' }}>
                    {method.name}{' '}
                    <span style={{ ...labelStyle, display: 'inline', marginLeft: 6, fontSize: '0.7rem' }}>
                      ({method.code})
                    </span>
                  </div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                    Tujuan: {SHIPPING_REGIONS[method.code]}
                    {method.estimated_days ? ` · ${method.estimated_days}` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: '#1F2937', fontSize: '0.9rem' }}>
                    {formatPrice(method.cost)}
                  </div>
                  <div style={{ color: '#16A34A', fontSize: '0.72rem' }}>Aktif</div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={ghostButton} onClick={() => setForm(toForm(method))}>
                    Atur Tarif
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800, color: '#1F2937' }}>Promo Gratis Ongkir</h2>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
              Gratis ongkir otomatis diberikan jika subtotal memenuhi minimum dan alamat termasuk wilayah terpilih.
            </p>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600, color: '#374151' }}>
            <input type="checkbox" checked={promoEnabled} onChange={(event) => setPromoEnabled(event.target.checked)} />
            Promo aktif
          </label>
        </div>

        {promotionLoading ? (
          <div style={{ ...emptyCell, padding: 24 }}>Memuat pengaturan promo...</div>
        ) : promotionError ? (
          <p role="alert" style={{ color: '#DC2626', fontSize: '0.85rem' }}>{promotionError}. Muat ulang halaman admin untuk mencoba lagi.</p>
        ) : (
          <>
            <div style={{ marginTop: 18, maxWidth: 360 }}>
              <label style={labelStyle}>Minimum subtotal produk (Rp)</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="1000"
                value={minimumPurchase}
                onChange={(event) => setMinimumPurchase(event.target.value)}
                placeholder="Contoh: 300000"
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={labelStyle}>Wilayah yang mendapat gratis ongkir</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 8 }}>
                <select className="input-field" value={provinceCode} onChange={(event) => setProvinceCode(event.target.value)}>
                  <option value="">Pilih provinsi</option>
                  {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
                </select>
                <select className="input-field" value={areaLevel} onChange={(event) => setAreaLevel(event.target.value as 'province' | 'regency')}>
                  <option value="province">Seluruh provinsi</option>
                  <option value="regency">Kota/kabupaten tertentu</option>
                </select>
                {areaLevel === 'regency' && (
                  <select className="input-field" value={regencyCode} disabled={!provinceCode} onChange={(event) => setRegencyCode(event.target.value)}>
                    <option value="">Pilih kota/kabupaten</option>
                    {regencies.map((regency) => <option key={regency.code} value={regency.code}>{regency.name}</option>)}
                  </select>
                )}
                <button style={ghostButton} onClick={addPromotionArea} disabled={!provinceCode || (areaLevel === 'regency' && !regencyCode)}>
                  + Tambahkan wilayah
                </button>
              </div>
              {locationError && <p role="alert" style={{ color: '#DC2626', fontSize: '0.8rem' }}>{locationError}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {areaCodes.length === 0 && <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Belum ada wilayah dipilih.</span>}
                {areaCodes.map((code) => (
                  <span key={code} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 10px', borderRadius: 20, background: '#FFF7ED', color: '#9A3412', fontSize: '0.8rem' }}>
                    {areaNames[code] ?? code}
                    <button aria-label={`Hapus ${areaNames[code] ?? code}`} onClick={() => setAreaCodes((current) => current.filter((area) => area !== code))} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#9A3412', fontWeight: 700 }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <button style={{ ...primaryButton, marginTop: 20 }} onClick={savePromotion} disabled={promotionSaving || promotionLoading}>
              {promotionSaving ? 'Menyimpan...' : 'Simpan Promo Ongkir'}
            </button>
          </>
        )}
      </div>

      {form && (
        <Modal
          title="Atur Tarif Pengiriman"
          onClose={() => setForm(null)}
          maxWidth={560}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Kurir dan wilayah</label>
            <div style={{ color: '#374151', fontWeight: 700 }}>
              {methods.find((method) => method.id === form.id)?.name} ·{' '}
              {SHIPPING_REGIONS[methods.find((method) => method.id === form.id)?.code ?? '']}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Tarif (Rp)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1000"
              value={form.cost}
              onChange={(event) => setForm({ ...form, cost: event.target.value })}
              placeholder="15000"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Estimasi Pengiriman</label>
            <input
              className="input-field"
              value={form.estimatedDays}
              onChange={(event) => setForm({ ...form, estimatedDays: event.target.value })}
              placeholder="2-3 hari"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={ghostButton} onClick={() => setForm(null)} disabled={saving}>
              Batal
            </button>
            <button style={primaryButton} onClick={submit} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

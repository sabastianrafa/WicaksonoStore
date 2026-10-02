import { useState } from 'react';
import { formatPrice } from '../../data';
import type { ShippingMethod } from './types';
import {
  Modal,
  card,
  dangerButton,
  emptyCell,
  ghostButton,
  labelStyle,
  primaryButton,
} from './styles';

interface Props {
  methods: ShippingMethod[];
  loading: boolean;
  onSave: (payload: {
    id?: number;
    name: string;
    code: string;
    description: string | null;
    cost: number;
    estimated_days: string | null;
    is_active: boolean;
    sort_order: number;
  }) => Promise<unknown>;
  onDelete: (method: ShippingMethod) => void;
}

interface FormState {
  id?: number;
  name: string;
  code: string;
  description: string;
  cost: string;
  estimatedDays: string;
  isActive: boolean;
  sortOrder: string;
  /** Kode hanya di-auto-generate selama belum diubah manual. */
  codeTouched?: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  description: '',
  cost: '',
  estimatedDays: '',
  isActive: true,
  sortOrder: '0',
  codeTouched: false,
};

const toForm = (method: ShippingMethod): FormState => ({
  id: method.id,
  name: method.name,
  code: method.code,
  description: method.description ?? '',
  cost: String(method.cost),
  estimatedDays: method.estimated_days ?? '',
  isActive: method.is_active,
  sortOrder: String(method.sort_order),
  codeTouched: true,
});

/** Slug sederhana untuk kode: "JNE REG" -> "JNE_REG" */
const slugifyCode = (value: string) =>
  value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export default function ShippingSection({ methods, loading, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form) return;

    if (!form.name.trim() || !form.code.trim()) {
      window.alert('Nama dan kode metode pengiriman wajib diisi.');
      return;
    }

    const cost = Number(form.cost);

    if (!Number.isFinite(cost) || cost < 0) {
      window.alert('Biaya pengiriman tidak valid.');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: form.id,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        cost,
        estimated_days: form.estimatedDays.trim() || null,
        is_active: form.isActive,
        sort_order: Number(form.sortOrder) || 0,
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
              {methods.length} metode terdaftar
            </p>
          </div>

          <button
            style={primaryButton}
            onClick={() => setForm({ ...EMPTY_FORM })}
            disabled={form !== null}
          >
            + Tambah Metode
          </button>
        </div>

        {loading ? (
          <div style={emptyCell}>Memuat metode pengiriman...</div>
        ) : methods.length === 0 ? (
          <div style={emptyCell}>Belum ada metode pengiriman.</div>
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
                    {method.description || 'Tanpa deskripsi'}
                    {method.estimated_days ? ` · ${method.estimated_days}` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: '#1F2937', fontSize: '0.9rem' }}>
                    {formatPrice(method.cost)}
                  </div>
                  <div style={{ color: method.is_active ? '#16A34A' : '#9CA3AF', fontSize: '0.72rem' }}>
                    {method.is_active ? 'Aktif' : 'Nonaktif'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={ghostButton} onClick={() => setForm(toForm(method))}>
                    Edit
                  </button>
                  <button style={dangerButton} onClick={() => onDelete(method)}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {form && (
        <Modal
          title={form.id ? 'Edit Metode Pengiriman' : 'Tambah Metode Pengiriman'}
          onClose={() => setForm(null)}
          maxWidth={560}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nama</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        name,
                        // Kode mengikuti nama hanya saat menambah baru
                        // dan selama user belum mengedit kode sendiri.
                        code: prev.id || prev.codeTouched ? prev.code : slugifyCode(name),
                      }
                    : prev
                );
              }}
              placeholder="Contoh: JNE Reguler"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Kode</label>
              <input
                className="input-field"
                value={form.code}
                onChange={(event) =>
                  setForm({
                    ...form,
                    code: slugifyCode(event.target.value),
                    codeTouched: true,
                  })
                }
                placeholder="JNE_REG"
              />
            </div>

            <div>
              <label style={labelStyle}>Biaya (Rp)</label>
              <input
                className="input-field"
                value={form.cost}
                onChange={(event) =>
                  setForm({ ...form, cost: event.target.value.replace(/[^0-9]/g, '') })
                }
                placeholder="15000"
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Deskripsi</label>
            <input
              className="input-field"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Pengiriman 2-3 hari kerja"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Estimasi Pengiriman</label>
              <input
                className="input-field"
                value={form.estimatedDays}
                onChange={(event) => setForm({ ...form, estimatedDays: event.target.value })}
                placeholder="2-3 hari"
              />
            </div>

            <div>
              <label style={labelStyle}>Urutan</label>
              <input
                className="input-field"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sortOrder: event.target.value.replace(/[^0-9]/g, ''),
                  })
                }
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Status</label>
            <select
              className="input-field"
              value={form.isActive ? '1' : '0'}
              onChange={(event) => setForm({ ...form, isActive: event.target.value === '1' })}
            >
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
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

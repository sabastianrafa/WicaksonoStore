import { useState } from 'react';
import type { PaymentMethod, PaymentMethodType } from './types';
import { PAYMENT_METHOD_TYPES } from './utils';
import {
  Modal,
  card,
  dangerButton,
  emptyCell,
  ghostButton,
  primaryButton,
} from './styles';

interface Props {
  methods: PaymentMethod[];
  loading: boolean;
  onSave: (payload: {
    id?: number;
    name: string;
    code: string;
    type: PaymentMethodType;
    account_number: string | null;
    account_name: string | null;
    qris_image: File | null;
    description: string | null;
    is_active: boolean;
  }) => Promise<unknown>;
  onDelete: (method: PaymentMethod) => void;
}

interface FormState {
  id?: number;
  name: string;
  type: PaymentMethodType;
  accountNumber: string;
  accountName: string;
  description: string;
  isActive: boolean;
  codeTouched?: boolean;
  code: string;
  /** URL gambar QRIS yang sudah tersimpan (kalau mode edit). */
  existingQrisImage: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  type: 'bank',
  accountNumber: '',
  accountName: '',
  description: '',
  isActive: true,
  codeTouched: false,
  code: '',
  existingQrisImage: '',
};

const toForm = (method: PaymentMethod): FormState => ({
  id: method.id,
  name: method.name,
  type: method.type,
  accountNumber: method.account_number ?? '',
  accountName: method.account_name ?? '',
  description: method.description ?? '',
  isActive: method.is_active,
  codeTouched: true,
  code: method.code,
  existingQrisImage: method.qris_image,
});

/** payments.method menyimpan string, jadi tetap dinormalisasi konsisten. */
const slugifyCode = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function PaymentMethodsSection({
  methods,
  loading,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setQrisFile(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (method: PaymentMethod) => {
    setQrisFile(null);
    setForm(toForm(method));
  };

  const close = () => {
    setForm(null);
    setQrisFile(null);
  };

  const pickQrisImage = (file: File | undefined) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      window.alert('Gambar harus JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      window.alert('Ukuran gambar maksimal 5 MB.');
      return;
    }

    setQrisFile(file);
  };

  const submit = async () => {
    if (!form) return;

    if (!form.name.trim()) {
      window.alert('Nama wajib diisi.');
      return;
    }

    if (form.type === 'bank' && !form.accountNumber.trim()) {
      window.alert('No Rek wajib diisi untuk metode Bank.');
      return;
    }

    if (form.type === 'qris' && !qrisFile && !form.existingQrisImage) {
      window.alert('Gambar QRIS wajib diunggah untuk metode QRIS.');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: form.id,
        name: form.name.trim(),
        code: slugifyCode(form.code || form.name),
        type: form.type,
        account_number: form.type === 'bank' ? form.accountNumber.trim() : null,
        account_name: form.type === 'bank' ? form.accountName.trim() || null : null,
        qris_image: qrisFile,
        description: form.description.trim() || null,
        is_active: form.isActive,
      });

      close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan metode pembayaran.');
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
            <h2 style={{ margin: 0, fontWeight: 800, color: '#1F2937' }}>
              Metode Pembayaran
            </h2>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
              {methods.length} metode terdaftar
            </p>
          </div>

          <button style={primaryButton} onClick={openAdd} disabled={form !== null}>
            + Tambah Metode
          </button>
        </div>

        {loading ? (
          <div style={emptyCell}>Memuat metode pembayaran...</div>
        ) : methods.length === 0 ? (
          <div style={emptyCell}>Belum ada metode pembayaran.</div>
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
                {method.type === 'qris' && method.qris_image ? (
                  <img
                    src={method.qris_image}
                    alt={`QRIS ${method.name}`}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      objectFit: 'cover',
                      background: '#FFF8F0',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(139,92,246,0.08)',
                      color: '#8B5CF6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {method.icon ?? (method.type === 'bank' ? '🏦' : '📱')}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#1F2937' }}>{method.name}</div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                    {method.type === 'bank'
                      ? `No Rek: ${method.account_number ?? '-'}`
                      : 'QRIS dinamis'}
                    {method.account_name ? ` · ${method.account_name}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  <span
                    style={{
                      background: '#F3F4F6',
                      color: '#4B5563',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {method.type === 'bank' ? 'Bank' : 'QRIS'}
                  </span>

                  <span
                    style={{
                      background: method.is_active ? '#DCFCE7' : '#F3F4F6',
                      color: method.is_active ? '#16A34A' : '#9CA3AF',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                    }}
                  >
                    {method.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button style={ghostButton} onClick={() => openEdit(method)}>
                    Edit
                  </button>
                  <button
                    style={dangerButton}
                    onClick={() => onDelete(method)}
                    title="Metode yang sudah dipakai transaksi tidak bisa dihapus"
                  >
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
          title={form.id ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
          onClose={close}
          maxWidth={520}
        >
          {/* Nama */}
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Nama :</label>
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
                        code:
                          prev.id || prev.codeTouched ? prev.code : slugifyCode(name),
                      }
                    : prev
                );
              }}
              placeholder="Contoh: QRIS"
            />
          </div>

          {/* Metode: Bank / QRIS */}
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Metode :</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYMENT_METHOD_TYPES.map((option) => {
                const active = form.type === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: option.value })}
                    style={{
                      padding: '11px 16px',
                      borderRadius: 8,
                      border: 'none',
                      textAlign: 'left',
                      background: active ? '#E5E7EB' : '#F3F4F6',
                      color: active ? '#111827' : '#6B7280',
                      fontFamily: 'Poppins',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field kondensial */}
          {form.type === 'bank' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>No Rek :</label>
                <input
                  className="input-field"
                  value={form.accountNumber}
                  onChange={(event) =>
                    setForm({ ...form, accountNumber: event.target.value })
                  }
                  placeholder="1234567890"
                  inputMode="numeric"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>Atas Nama :</label>
                <input
                  className="input-field"
                  value={form.accountName}
                  onChange={(event) =>
                    setForm({ ...form, accountName: event.target.value })
                  }
                  placeholder="Nama pemilik rekening"
                />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>Gambar QRIS :</label>

              <div
                style={{
                  position: 'relative',
                  border: '1px dashed #D1D5DB',
                  borderRadius: 12,
                  background: '#FAFAFA',
                  padding: 20,
                  textAlign: 'center',
                  minHeight: 150,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {qrisFile || form.existingQrisImage ? (
                  <img
                    src={qrisFile ? URL.createObjectURL(qrisFile) : form.existingQrisImage}
                    alt="QRIS"
                    style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }}
                  />
                ) : (
                  <div>
                    <div style={{ fontSize: 40, color: '#9CA3AF', lineHeight: 1 }}>+</div>
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: '0.8rem',
                        color: '#6B7280',
                        fontWeight: 600,
                      }}
                    >
                      Tambahkan Gambar Qris
                    </div>
                  </div>
                )}

                {(qrisFile || form.existingQrisImage) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQrisFile(null);
                      if (form.id) setForm({ ...form, existingQrisImage: '' });
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#F3F4F6',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: 15,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => pickQrisImage(event.target.files?.[0])}
                />
              </div>

              <label
                className="btn-primary"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 10,
                  cursor: 'pointer',
                }}
              >
                {qrisFile || form.existingQrisImage ? 'Ganti Gambar' : '+ Unggah Gambar'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => pickQrisImage(event.target.files?.[0])}
                />
              </label>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Deskripsi :</label>
            <input
              className="input-field"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Opsional"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#16A34A', cursor: 'pointer' }}
              />
              Aktif (tampilkan di halaman checkout)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={ghostButton} onClick={close} disabled={saving}>
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

const fieldLabel = {
  display: 'block' as const,
  marginBottom: 6,
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.85rem',
};
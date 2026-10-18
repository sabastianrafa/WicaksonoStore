import { useState } from 'react';
import type { Category } from './types';
import { Modal, ghostButton, labelStyle, primaryButton } from './styles';

interface Props {
  category: Category | null;
  onClose: () => void;
  onSave: (payload: {
    id?: number;
    name: string;
    is_active: boolean;
  }) => Promise<unknown>;
}

export default function CategoryFormModal({ category, onClose, onSave }: Props) {
  const isEdit = category !== null;

  const [name, setName] = useState(category?.name ?? '');
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      window.alert('Nama kategori wajib diisi.');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: category?.id,
        name: name.trim(),
        is_active: isActive,
      });

      onClose();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan kategori.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Kategori' : 'Tambah Kategori'} onClose={onClose} maxWidth={480}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Nama Kategori</label>
        <input
          className="input-field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Mie Instan"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Status</label>
        <select
          className="input-field"
          value={isActive ? '1' : '0'}
          onChange={(event) => setIsActive(event.target.value === '1')}
        >
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button style={ghostButton} onClick={onClose} disabled={saving}>
          Batal
        </button>
        <button style={primaryButton} onClick={submit} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </Modal>
  );
}

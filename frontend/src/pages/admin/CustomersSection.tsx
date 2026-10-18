import { useEffect, useState } from 'react';
import type { AdminUser, ApiMeta, UserFilters } from './types';
import {
  Pagination,
  dangerButton,
  emptyCell,
  metaText,
  panel,
  th,
  toolbarStyle,
} from './styles';
import { formatDateTime, statusColor } from './utils';
import StatusBadge from './StatusBadge';

interface Props {
  users: AdminUser[];
  meta: ApiMeta;
  filters: UserFilters;
  loading: boolean;
  onFilterChange: (patch: Partial<UserFilters>) => void;
  onPageChange: (page: number) => void;
  onUpdateRole: (user: AdminUser, role: string) => Promise<unknown>;
  onDelete: (user: AdminUser) => void;
}

const ROLE_TABS = [
  { value: '', label: 'Semua' },
  { value: 'user', label: 'Pelanggan' },
  { value: 'admin', label: 'Admin' },
];

export default function CustomersSection({
  users,
  meta,
  filters,
  loading,
  onFilterChange,
  onPageChange,
  onUpdateRole,
  onDelete,
}: Props) {
  const [search, setSearch] = useState(filters.search);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== filters.search) onFilterChange({ search });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, filters.search, onFilterChange]);

  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  const changeRole = async (user: AdminUser, role: string) => {
    setBusyId(user.id);

    try {
      await onUpdateRole(user, role);
    } catch {
      // Pesan error sudah ditangani hook.
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={panel}>
      <div style={toolbarStyle}>
        <input
          className="input-field"
          placeholder="Cari nama, email, atau telepon..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 300 }}
        />

        <select
          className="input-field"
          value={filters.role}
          onChange={(event) => onFilterChange({ role: event.target.value })}
          style={{ width: 'auto' }}
        >
          <option value="">Semua Role</option>
          <option value="user">Pelanggan</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => onFilterChange({ role: tab.value })}
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              border: 'none',
              background: filters.role === tab.value ? '#E4401F' : '#F3F4F6',
              color: filters.role === tab.value ? 'white' : '#374151',
              fontFamily: 'Poppins',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Pengguna', 'Kontak', 'Role', 'Pesanan', 'Ulasan', 'Alamat', 'Terdaftar', 'Aksi'].map(
                (header) => (
                  <th key={header} style={th}>
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  Memuat pengguna...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ padding: '14px 16px', minWidth: 180 }}>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>
                      {user.name}
                    </div>
                    <div style={{ ...metaText, fontSize: '0.7rem' }}>ID: {user.id}</div>
                  </td>

                  <td style={{ padding: '14px 16px', minWidth: 200 }}>
                    <div style={{ fontSize: '0.82rem', color: '#374151' }}>{user.email}</div>
                    <div style={{ ...metaText, fontSize: '0.72rem' }}>{user.phone || '-'}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={user.role} />
                  </td>

                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem' }}>
                    {user.orders_count}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem' }}>
                    {user.reviews_count}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem' }}>
                    {user.addresses_count}
                  </td>

                  <td
                    style={{
                      padding: '14px 16px',
                      color: '#6B7280',
                      fontSize: '0.72rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDateTime(user.created_at)}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        className="input-field"
                        value={user.role}
                        disabled={busyId === user.id}
                        onChange={(event) => changeRole(user, event.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                      >
                        <option value="user">Pelanggan</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        style={dangerButton}
                        onClick={() => onDelete(user)}
                        title="Backend menolak menghapus akun sendiri"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={emptyCell}>
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} itemLabel="pengguna" />
    </div>
  );
}

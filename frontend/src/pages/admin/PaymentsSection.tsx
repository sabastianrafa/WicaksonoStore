import { useEffect, useState } from 'react';
import { formatPrice } from '../../data';
import type { AdminPayment, ApiMeta, PaymentFilters, PaymentMethod } from './types';
import {
  Pagination,
  emptyCell,
  metaText,
  panel,
  primaryButton,
  th,
  toolbarStyle,
} from './styles';
import { PAYMENT_STATUSES, formatDateTime, paymentMethodLabel } from './utils';
import StatusBadge, { MethodBadge } from './StatusBadge';

interface Props {
  payments: AdminPayment[];
  meta: ApiMeta;
  filters: PaymentFilters;
  loading: boolean;
  methods: PaymentMethod[];
  onFilterChange: (patch: Partial<PaymentFilters>) => void;
  onPageChange: (page: number) => void;
  onVerify: (payment: AdminPayment) => Promise<unknown>;
  onReject: (payment: AdminPayment, reason: string) => Promise<unknown>;
}

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'paid', label: 'Lunas' },
  { value: 'rejected', label: 'Ditolak' },
];

export default function PaymentsSection({
  payments,
  meta,
  filters,
  loading,
  methods,
  onFilterChange,
  onPageChange,
  onVerify,
  onReject,
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

  const handleVerify = async (payment: AdminPayment) => {
    if (!window.confirm(`Verifikasi pembayaran ${payment.order_number} sebesar ${formatPrice(payment.amount)}? Pastikan dana sudah diterima.`)) {
      return;
    }

    setBusyId(payment.id);

    try {
      await onVerify(payment);
      window.alert('Pembayaran berhasil diverifikasi.');
    } catch {
      // Pesan error sudah ditangani hook.
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (payment: AdminPayment) => {
    const reason = window.prompt('Alasan penolakan pembayaran:');

    if (reason === null) return;
    if (reason.trim().length < 3) {
      window.alert('Alasan penolakan minimal 3 karakter.');
      return;
    }

    setBusyId(payment.id);

    try {
      await onReject(payment, reason.trim());
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
          placeholder="Cari nomor pesanan atau nama..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 280 }}
        />

        <select
          className="input-field"
          value={filters.method}
          onChange={(event) => onFilterChange({ method: event.target.value })}
          style={{ width: 'auto' }}
        >
          <option value="">Semua Metode</option>
          {methods.map((method) => (
            <option key={method.id} value={method.code}>
              {method.name}
              {method.is_active ? '' : ' (nonaktif)'}
            </option>
          ))}
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
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => onFilterChange({ status: tab.value })}
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              border: 'none',
              background: filters.status === tab.value ? '#E4401F' : '#F3F4F6',
              color: filters.status === tab.value ? 'white' : '#374151',
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
              {['No. Pesanan', 'Pelanggan', 'Metode', 'Jumlah', 'Bukti', 'Status', 'Aksi'].map(
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
                <td colSpan={7} style={emptyCell}>
                  Memuat pembayaran...
                </td>
              </tr>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontWeight: 700,
                      color: '#E4401F',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {payment.order_number}
                  </td>

                  <td style={{ padding: '14px 16px', color: '#1F2937', fontSize: '0.875rem' }}>
                    {payment.customer}
                    <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                      {formatDateTime(payment.created_at)}
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <MethodBadge method={payment.method} />
                  </td>

                  <td
                    style={{
                      padding: '14px 16px',
                      fontWeight: 700,
                      color: '#1F2937',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatPrice(payment.amount)}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {payment.proof_url ? (
                      <a
                        href={payment.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}
                      >
                        Lihat
                      </a>
                    ) : (
                      <span style={{ ...metaText, whiteSpace: 'nowrap' }}>Belum ada bukti</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={payment.status} kind="payment" />
                    {payment.verifier && (
                      <div style={{ ...metaText, fontSize: '0.68rem', marginTop: 4 }}>
                        oleh {payment.verifier}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {payment.status === 'pending' && payment.proof_url ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          disabled={busyId === payment.id}
                          onClick={() => handleVerify(payment)}
                          style={{
                            ...primaryButton,
                            padding: '5px 12px',
                            fontSize: '0.75rem',
                            opacity: busyId === payment.id ? 0.6 : 1,
                          }}
                        >
                          Verifikasi
                        </button>

                        <button
                          disabled={busyId === payment.id}
                          onClick={() => handleReject(payment)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            border: '1px solid #FEE2E2',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'Poppins',
                            fontWeight: 600,
                          }}
                        >
                          Tolak
                        </button>
                      </div>
                    ) : payment.status === 'pending' ? (
                      <span style={{ ...metaText, fontSize: '0.7rem' }}>Menunggu bukti dari pelanggan</span>
                    ) : payment.notes ? (
                      <span style={{ ...metaText, fontSize: '0.7rem' }}>{payment.notes}</span>
                    ) : (
                      <span style={metaText}>-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={emptyCell}>
                  Tidak ada pembayaran ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} itemLabel="pembayaran" />
    </div>
  );
}

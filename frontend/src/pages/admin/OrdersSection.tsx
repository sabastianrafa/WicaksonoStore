import { useEffect, useState } from 'react';
import { formatPrice } from '../../data';
import type { AdminOrder, ApiMeta, OrderFilters, OrderItemRow } from './types';
import {
  Modal,
  Pagination,
  detailLabel,
  detailValue,
  emptyCell,
  metaText,
  panel,
  primaryButton,
  th,
  toolbarStyle,
} from './styles';
import { ORDER_STATUS_TRANSITIONS, orderStatusLabel } from './utils';
import StatusBadge, { MethodBadge } from './StatusBadge';
import { apiFetch } from '../../api/client';
import { storageUrl } from '../../api/client';

interface Props {
  orders: AdminOrder[];
  meta: ApiMeta;
  filters: OrderFilters;
  loading: boolean;
  onFilterChange: (patch: Partial<OrderFilters>) => void;
  onPageChange: (page: number) => void;
  onUpdateStatus: (order: AdminOrder, status: string) => Promise<unknown>;
}

const STATUS_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const SORTS = [
  { value: 'latest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'total_desc', label: 'Total Tertinggi' },
  { value: 'total_asc', label: 'Total Terendah' },
];

export default function OrdersSection({
  orders,
  meta,
  filters,
  loading,
  onFilterChange,
  onPageChange,
  onUpdateStatus,
}: Props) {
  const [search, setSearch] = useState(filters.search);
  const [detail, setDetail] = useState<AdminOrder | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== filters.search) onFilterChange({ search });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, filters.search, onFilterChange]);

  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  return (
    <div style={panel}>
      <div style={toolbarStyle}>
        <input
          className="input-field"
          placeholder="Cari nomor pesanan, nama, atau telepon..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 300 }}
        />

        <select
          className="input-field"
          value={filters.sort}
          onChange={(event) => onFilterChange({ sort: event.target.value })}
          style={{ width: 'auto' }}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="input-field"
          value={filters.start_date}
          onChange={(event) => onFilterChange({ start_date: event.target.value })}
          style={{ width: 'auto' }}
          title="Tanggal mulai"
        />

        <input
          type="date"
          className="input-field"
          value={filters.end_date}
          onChange={(event) => onFilterChange({ end_date: event.target.value })}
          style={{ width: 'auto' }}
          title="Tanggal akhir"
        />

        {(filters.search || filters.start_date || filters.end_date) && (
          <button
            style={{ ...metaText, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
            onClick={() => onFilterChange({ search: '', start_date: '', end_date: '' })}
          >
            Reset
          </button>
        )}
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
              {['No. Pesanan', 'Pelanggan', 'Tanggal', 'Item', 'Total', 'Status', 'Aksi'].map(
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
                  Memuat pesanan...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontWeight: 700,
                      color: '#E4401F',
                      fontSize: '0.875rem',
                    }}
                  >
                    {order.order_number}
                  </td>

                  <td style={{ padding: '14px 16px', minWidth: 180 }}>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>
                      {order.customer}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>{order.phone}</div>
                  </td>

                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    {order.date}
                  </td>

                  <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem' }}>
                    {order.items} item
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
                    {formatPrice(order.total)}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <StatusBadge status={order.status} />
                      <StatusBadge status={order.payment_status} kind="payment" size="sm" />
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setDetail(order)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontFamily: 'Poppins',
                        fontWeight: 600,
                      }}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={emptyCell}>
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} itemLabel="pesanan" />

      {detail && (
        <OrderDetailModal
          order={detail}
          onClose={() => setDetail(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
}

/* ---------- Detail pesanan ---------- */

function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: AdminOrder;
  onClose: () => void;
  onUpdateStatus: (order: AdminOrder, status: string) => Promise<unknown>;
}) {
  const [items, setItems] = useState<OrderItemRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await apiFetch<any>(`/admin/orders/${order.id}`);
        const raw = res?.data?.items ?? [];

        const rows: OrderItemRow[] = raw.map((item: any) => ({
          id: Number(item.id),
          product_name: item.product?.name ?? item.product_name ?? '-',
          quantity: Number(item.quantity ?? 0),
          price: Number(item.price ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          image: storageUrl(item.product?.images?.[0]?.path ?? null),
        }));

        if (active) setItems(rows);
      } catch (error) {
        console.error('Gagal memuat detail pesanan:', error);
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [order.id]);

  const transitions = ORDER_STATUS_TRANSITIONS[order.status] ?? [];

  const changeStatus = async (status: string) => {
    if (status === 'cancelled') {
      const confirmed = window.confirm(
        'Membatalkan pesanan akan mengembalikan stok produk. Lanjutkan?'
      );
      if (!confirmed) return;
    }

    setUpdating(true);

    try {
      const updated = (await onUpdateStatus(order, status)) as AdminOrder | undefined;
      if (updated) onClose();
    } catch {
      // Pesan error sudah ditampilkan oleh hook.
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal title={`Pesanan ${order.order_number}`} onClose={onClose} maxWidth={720}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={detailLabel}>Pelanggan</div>
          <div style={detailValue}>{order.customer}</div>
          <div style={{ ...metaText, fontSize: '0.72rem' }}>{order.customer_email}</div>
        </div>

        <div>
          <div style={detailLabel}>Kontak</div>
          <div style={detailValue}>{order.phone || '-'}</div>
        </div>

        <div>
          <div style={detailLabel}>Pengiriman</div>
          <div style={detailValue}>{order.shipping_method}</div>
          <div style={{ ...metaText, fontSize: '0.72rem' }}>{order.address}</div>
        </div>

        <div>
          <div style={detailLabel}>Pembayaran</div>
          <div style={{ marginTop: 2 }}>
            <MethodBadge method={order.payment_method} />{' '}
            <StatusBadge status={order.payment_status} kind="payment" size="sm" />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={detailLabel}>Item Pesanan</div>

        {loading ? (
          <div style={metaText}>Memuat item...</div>
        ) : items && items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid #F9FAFB',
              }}
            >
              <img
                src={item.image}
                alt={item.product_name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  objectFit: 'cover',
                  background: '#FFF8F0',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1F2937' }}>
                  {item.product_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                  {item.quantity} × {formatPrice(item.price)}
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))
        ) : (
          <div style={metaText}>Item tidak tersedia.</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={metaText}>Subtotal</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatPrice(order.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={metaText}>Ongkir</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            {formatPrice(order.shipping_cost)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F2937' }}>Total</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#E4401F' }}>
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div>
        <div style={detailLabel}>Ubah Status Pesanan</div>

        {transitions.length === 0 ? (
          <div style={{ ...metaText, marginTop: 6 }}>
            Status "{orderStatusLabel(order.status)}" sudah final dan tidak bisa diubah lagi.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {transitions.map((status) => (
              <button
                key={status}
                disabled={updating}
                onClick={() => changeStatus(status)}
                style={{
                  ...primaryButton,
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  background: status === 'cancelled' ? '#DC2626' : '#E4401F',
                  opacity: updating ? 0.6 : 1,
                }}
              >
                {orderStatusLabel(status)}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

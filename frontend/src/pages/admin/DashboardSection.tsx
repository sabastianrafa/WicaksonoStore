import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatPrice } from '../../data';
import type {
  AdminOrder,
  DashboardProduct,
  DashboardSummary,
  SalesChartItem,
} from './types';
import { COLORS } from './utils';
import {
  axisTick,
  axisTickSmall,
  card,
  cardTitle,
  formatJuta,
  tooltipStyle,
} from './styles';
import StatusBadge from './StatusBadge';

interface Props {
  summary: DashboardSummary | null;
  salesData: SalesChartItem[];
  topProducts: DashboardProduct[];
  orders: AdminOrder[];
  loading: boolean;
}

const EMPTY_SUMMARY: DashboardSummary = {
  total_products: 0,
  active_products: 0,
  total_categories: 0,
  total_users: 0,
  total_orders: 0,
  pending_orders: 0,
  confirmed_orders: 0,
  processing_orders: 0,
  shipped_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  pending_payments: 0,
  total_revenue: 0,
};

const STATUS_SUMMARY = [
  { key: 'pending_orders', label: 'Menunggu' },
  { key: 'confirmed_orders', label: 'Dikonfirmasi' },
  { key: 'processing_orders', label: 'Diproses' },
  { key: 'shipped_orders', label: 'Dikirim' },
  { key: 'completed_orders', label: 'Selesai' },
  { key: 'cancelled_orders', label: 'Dibatalkan' },
] as const;

export default function DashboardSection({
  summary,
  salesData,
  topProducts,
  orders,
  loading,
}: Props) {
  const data = summary ?? EMPTY_SUMMARY;

  const value = (raw: number) => (loading && !summary ? '...' : raw.toLocaleString('id-ID'));

  const stats = [
    {
      label: 'Total Produk',
      value: value(data.total_products),
      hint: `${data.active_products.toLocaleString('id-ID')} aktif`,
      icon: '📦',
      bg: 'rgba(249,115,22,0.08)',
    },
    {
      label: 'Total Pesanan',
      value: value(data.total_orders),
      hint: `${data.pending_orders} menunggu diproses`,
      icon: '🛒',
      bg: 'rgba(22,163,74,0.08)',
    },
    {
      label: 'Pendapatan',
      value: loading && !summary ? '...' : formatPrice(data.total_revenue),
      hint: 'Dari pembayaran terverifikasi',
      icon: '💰',
      bg: 'rgba(250,204,21,0.1)',
    },
    {
      label: 'Pelanggan',
      value: value(data.total_users),
      hint: `${data.total_categories} kategori terdaftar`,
      icon: '👥',
      bg: 'rgba(139,92,246,0.08)',
    },
  ];

  return (
    <>
      {/* Kartu statistik */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...card, padding: 20, border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: '0.78rem',
                    color: '#6B7280',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {stat.label}
                </p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#1F2937' }}>
                  {stat.value}
                </p>
              </div>

              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>{stat.hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status pesanan + pembayaran tertunda */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {STATUS_SUMMARY.map((item) => (
          <div
            key={item.key}
            style={{
              ...card,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
              {item.label}
            </span>
            <StatusBadge status={item.key.replace('_orders', '')} />
          </div>
        ))}

        <div
          style={{
            ...card,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
            Pembayaran menunggu
          </span>
          <StatusBadge status="pending" kind="payment" />
        </div>
      </div>

      {/* Grafik pendapatan + produk terlaris */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={card}>
          <h3 style={cardTitle()}>Pendapatan Bulanan</h3>

          {salesData.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
              Belum ada data penjualan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisTickSmall}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatJuta}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [formatPrice(Number(v)), 'Pendapatan']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  dot={{ fill: '#F97316', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle()}>Produk Terlaris</h3>

          {topProducts.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
              Belum ada produk.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    dataKey="sold"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {topProducts.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Poppins', fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {topProducts.slice(0, 3).map((product, index) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: COLORS[index % COLORS.length],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#6B7280', flex: 1 }}>{product.name}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F2937' }}>
                      {product.sold.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Jumlah pesanan + pesanan terbaru */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <div style={card}>
          <h3 style={cardTitle(16)}>Jumlah Pesanan per Bulan</h3>

          {salesData.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
              Belum ada pesanan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTickSmall} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle(16)}>Pesanan Terbaru</h3>

          {orders.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
              Belum ada pesanan masuk.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid #F9FAFB',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2937' }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                      {order.customer} · {order.date}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.82rem' }}>
                      {formatPrice(order.total)}
                    </span>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '../../data';
import type {
  DashboardProduct,
  FinancialSummary,
  ProductReport,
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

interface Props {
  salesData: SalesChartItem[];
  topProducts: DashboardProduct[];
  financial: FinancialSummary;
  productReport: ProductReport | null;
}

export default function ReportsSection({
  salesData,
  topProducts,
  financial,
  productReport,
}: Props) {
  const maxSold = Math.max(...topProducts.map((product) => product.sold), 1);

  const summaryRows = [
    {
      label: 'Total Pendapatan Terverifikasi',
      value: formatPrice(financial.totalRevenue),
      color: '#16A34A',
      icon: '💰',
    },
    {
      label: 'Total Pesanan',
      value: financial.totalOrders.toLocaleString('id-ID'),
      color: '#F97316',
      icon: '📦',
    },
    {
      label: 'Rata-rata Order',
      value: formatPrice(financial.averageOrder),
      color: '#8B5CF6',
      icon: '📊',
    },
    {
      label: 'Pesanan Selesai',
      value: `${financial.completionRate.toFixed(1).replace('.', ',')}%`,
      color: '#16A34A',
      icon: '✅',
    },
  ];

  const stockRows = [
    {
      label: 'Total Produk',
      value: (productReport?.total_products ?? 0).toLocaleString('id-ID'),
      color: '#1F2937',
      icon: '📦',
    },
    {
      label: 'Stok Menipis (≤ 10)',
      value: (productReport?.low_stock_count ?? 0).toLocaleString('id-ID'),
      color: '#D97706',
      icon: '⚠️',
    },
    {
      label: 'Stok Habis',
      value: (productReport?.out_of_stock_count ?? 0).toLocaleString('id-ID'),
      color: '#DC2626',
      icon: '🚫',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <h3 style={cardTitle()}>Statistik Pendapatan 6 Bulan</h3>

        {salesData.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
            Belum ada data penjualan.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData}>
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
              <Bar dataKey="revenue" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <div style={card}>
          <h3 style={cardTitle(16)}>Produk Terlaris</h3>

          {topProducts.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF' }}>
              Belum ada produk.
            </div>
          ) : (
            topProducts.map((product, index) => (
              <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${COLORS[index % COLORS.length]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: COLORS[index % COLORS.length],
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2937' }}>
                    {product.name}
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: '#F3F4F6',
                      borderRadius: 100,
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: COLORS[index % COLORS.length],
                        borderRadius: 100,
                        width: `${(product.sold / maxSold) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <span style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.85rem' }}>
                  {product.sold.toLocaleString('id-ID')}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle(16)}>Ringkasan Keuangan</h3>

          {summaryRows.map(({ label, value, color, icon }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #F9FAFB',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span>{icon}</span>
                <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{label}</span>
              </div>
              <span style={{ fontWeight: 800, color, fontSize: '0.95rem' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h3 style={cardTitle(16)}>Laporan Produk & Stok</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {stockRows.map(({ label, value, color, icon }) => (
            <div
              key={label}
              style={{
                border: '1px solid #F3F4F6',
                borderRadius: 10,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>{label}</div>
                <div style={{ fontWeight: 800, color, fontSize: '1.05rem' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {(productReport?.out_of_stock_products.length ?? 0) > 0 ? (
          <>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
              Produk Habis Stok
            </div>
            {productReport?.out_of_stock_products.map((product) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid #F9FAFB',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: '#1F2937', fontWeight: 600 }}>{product.name}</span>
                <span style={{ color: '#DC2626', fontWeight: 700 }}>0</span>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: '#16A34A', fontSize: '0.85rem', fontWeight: 600 }}>
            ✅ Semua produk memiliki stok.
          </div>
        )}
      </div>
    </div>
  );
}

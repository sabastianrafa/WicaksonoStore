import { useState } from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiDownload } from 'react-icons/fi';
import { formatPrice } from '../../data';
import type {
  DashboardProduct,
  FinancialSummary,
  ProductReport,
  SalesChartItem,
} from './types';
import { buildYearlySalesForRange, COLORS } from './utils';
import {
  axisTick,
  card,
  cardTitle,
  chipButton,
  th as tableHeaderStyle,
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
  const [revenuePeriod, setRevenuePeriod] = useState<'yearly' | 'all'>('yearly');
  const [allRangeStart, setAllRangeStart] = useState(2026);
  const allStartYear = 2026;
  const yearlyEndYear = allStartYear + 11;
  const allEndYear = allRangeStart + 6;
  const rangeStartCount = Math.floor((new Date().getFullYear() + 12 - allStartYear) / 6) + 1;
  const allRangeStarts = Array.from(
    { length: Math.max(1, rangeStartCount) },
    (_, index) => allStartYear + index * 6
  );
  const reportStartYear = revenuePeriod === 'yearly' ? allStartYear : allRangeStart;
  const reportEndYear = revenuePeriod === 'yearly' ? yearlyEndYear : allEndYear;
  const revenueData = buildYearlySalesForRange(salesData, reportStartYear, reportEndYear);
  const totalPeriodRevenue = revenueData.reduce((total, item) => total + item.revenue, 0);
  const totalPeriodOrders = revenueData.reduce((total, item) => total + item.orders, 0);
  const maxSold = Math.max(...topProducts.map((product) => product.sold), 1);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['LAPORAN WICAKSONO', '', '', '', '', ''],
      ['Rentang Pendapatan', `${reportStartYear}-${reportEndYear}`, '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Bagian', 'Periode', 'Keterangan', 'Jumlah', 'Nominal (Rp)', 'Persentase (%)'],
      ...revenueData.map((item) => [
        'Pendapatan Tahunan',
        item.label,
        'Total transaksi tidak dibatalkan',
        item.orders,
        item.revenue,
        '',
      ]),
      ['Pendapatan Tahunan', `${reportStartYear}-${reportEndYear}`, 'TOTAL PERIODE', totalPeriodOrders, totalPeriodRevenue, ''],
      ['', '', '', '', '', ''],
      ['Ringkasan Keuangan', '', 'Total Pendapatan Terverifikasi', '', financial.totalRevenue, ''],
      ['Ringkasan Keuangan', '', 'Total Pesanan', financial.totalOrders, '', ''],
      ['Ringkasan Keuangan', '', 'Rata-rata Order', '', financial.averageOrder, ''],
      ['Ringkasan Keuangan', '', 'Pesanan Selesai', '', '', financial.completionRate.toFixed(1)],
      ['', '', '', '', '', ''],
      ...topProducts.map((product) => [
        'Produk Terlaris',
        '',
        product.name,
        product.sold,
        '',
        '',
      ]),
      ['', '', '', '', '', ''],
      ['Ringkasan Stok', '', 'Total Produk', productReport?.total_products ?? 0, '', ''],
      ['Ringkasan Stok', '', 'Stok Menipis (<= 10)', productReport?.low_stock_count ?? 0, '', ''],
      ['Ringkasan Stok', '', 'Stok Habis', productReport?.out_of_stock_count ?? 0, '', ''],
    ];
    const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = `\uFEFFsep=;\r\n${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-wicaksono-${reportStartYear}-${reportEndYear}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <h3 style={cardTitle(0)}>
            {revenuePeriod === 'yearly'
              ? `Pendapatan per Tahun (${allStartYear}–${yearlyEndYear})`
              : `Semua Tahun (${allRangeStart}–${allEndYear})`}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {revenuePeriod === 'all' && (
              <select
                className="input-field"
                aria-label="Pilih rentang tahun laporan"
                value={allRangeStart}
                onChange={(event) => setAllRangeStart(Number(event.target.value))}
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
              >
                {allRangeStarts.map((startYear) => (
                  <option key={startYear} value={startYear}>
                    {startYear}–{startYear + 6}
                  </option>
                ))}
              </select>
            )}
            <div role="group" aria-label="Periode laporan pendapatan" style={{ display: 'flex', gap: 6 }}>
              {([
                ['yearly', 'Per Tahun'],
                ['all', 'Semua'],
              ] as const).map(([period, label]) => (
                <button
                  key={period}
                  type="button"
                  aria-pressed={revenuePeriod === period}
                  onClick={() => setRevenuePeriod(period)}
                  style={{ ...chipButton(revenuePeriod === period), borderRadius: 6 }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                background: 'white',
                color: '#374151',
                fontFamily: 'Poppins',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FiDownload size={15} />
              Ekspor CSV
            </button>
          </div>
        </div>

        {salesData.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
            Belum ada data penjualan.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown) => [formatPrice(Number(v)), 'Pendapatan']}
              />
              <Bar dataKey="revenue" fill="#F97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div style={{ marginTop: 20, borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>
            Rincian Pendapatan
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <th style={tableHeaderStyle}>Tahun</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Jumlah Pesanan</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((item) => (
                  <tr key={item.year} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 16px', fontSize: '0.82rem', color: '#374151' }}>
                      {item.year}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '0.82rem', color: '#6B7280' }}>
                      {item.orders.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#1F2937' }}>
                      {formatPrice(item.revenue)}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#F9FAFB', fontWeight: 800 }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#1F2937' }}>
                    Total
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.82rem', color: '#1F2937' }}>
                    {totalPeriodOrders.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.82rem', color: '#16A34A' }}>
                    {formatPrice(totalPeriodRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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

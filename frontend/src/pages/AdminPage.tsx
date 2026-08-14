import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { products, orders, salesData, topProducts, formatPrice } from '../data';
import type { Page } from '../App';

export default function AdminPage({ navigate }: { navigate: (page: Page) => void }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const statusColor = (s: string) => ({
    selesai: { bg: '#DCFCE7', text: '#16A34A' },
    dikirim: { bg: '#DBEAFE', text: '#1D4ED8' },
    diproses: { bg: '#FEF3C7', text: '#D97706' },
    batal: { bg: '#FEE2E2', text: '#DC2626' },
  }[s] ?? { bg: '#F3F4F6', text: '#6B7280' });

  const menus = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Produk', icon: '📦' },
    { id: 'categories', label: 'Kategori', icon: '🏷️' },
    { id: 'orders', label: 'Pesanan', icon: '🛒' },
    { id: 'customers', label: 'Pelanggan', icon: '👥' },
    { id: 'reports', label: 'Laporan', icon: '📈' },
    { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
  ];

  const stats = [
    { label: 'Total Produk', value: '52', change: '+3', icon: '📦', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    { label: 'Total Pesanan', value: '1.240', change: '+128', icon: '🛒', color: '#16A34A', bg: 'rgba(22,163,74,0.08)' },
    { label: 'Pendapatan', value: 'Rp 9,4jt', change: '+12%', icon: '💰', color: '#FACC15', bg: 'rgba(250,204,21,0.1)' },
    { label: 'Pelanggan', value: '10.234', change: '+89', icon: '👥', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  ];

  const COLORS = ['#F97316', '#16A34A', '#FACC15', '#8B5CF6', '#EC4899'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sidebar */}
      <div style={{
        width: 240, background: '#1F2937', flexShrink: 0,
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F97316, #EA6C0A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎁</div>
            <div>
              <div style={{ color: '#F97316', fontWeight: 800, fontSize: '0.9rem' }}>Wicaksono</div>
              <div style={{ color: '#6B7280', fontSize: '0.65rem' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {menus.map(m => (
            <button key={m.id} onClick={() => setActiveMenu(m.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '11px 20px', border: 'none',
              background: activeMenu === m.id ? 'rgba(249,115,22,0.15)' : 'transparent',
              borderLeft: `3px solid ${activeMenu === m.id ? '#F97316' : 'transparent'}`,
              color: activeMenu === m.id ? '#F97316' : '#9CA3AF',
              fontFamily: 'Poppins', fontWeight: activeMenu === m.id ? 700 : 400,
              fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (activeMenu !== m.id) { (e.currentTarget as HTMLElement).style.color = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; } }}
            onMouseLeave={e => { if (activeMenu !== m.id) { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>A</div>
            <div>
              <div style={{ color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600 }}>Admin</div>
              <div style={{ color: '#6B7280', fontSize: '0.7rem' }}>admin@wicaksono.id</div>
            </div>
          </div>
          <button onClick={() => navigate('home')} style={{
            width: '100%', padding: '8px', background: 'rgba(249,115,22,0.15)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            color: '#F97316', fontFamily: 'Poppins', fontSize: '0.8rem', fontWeight: 600,
          }}>← Lihat Toko</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxHeight: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1F2937' }}>
              {menus.find(m => m.id === activeMenu)?.label}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.85rem' }}>
              5 Agustus 2026, Rabu
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ position: 'relative', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}>
              🔔
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#F97316' }} />
            </button>
            <button className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
              + Tambah Produk
            </button>
          </div>
        </div>

        {/* Stats */}
        {activeMenu === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {stats.map(s => (
                <div key={s.label} style={{
                  background: 'white', borderRadius: 14, padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#1F2937' }}>{s.value}</p>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '0.8rem' }}>↑ {s.change}</span>
                    <span style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>vs bulan lalu</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* Sales chart */}
              <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#1F2937', fontSize: '1rem' }}>Pendapatan Bulanan</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontFamily: 'Poppins', fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: 'Poppins', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}jt`} />
                    <Tooltip
                      contentStyle={{ fontFamily: 'Poppins', fontSize: 12, borderRadius: 10, border: '1px solid #F3F4F6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                      formatter={(v: unknown) => [formatPrice(v as number), 'Pendapatan']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2.5} dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#1F2937', fontSize: '1rem' }}>Kategori Terlaris</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={topProducts} dataKey="sales" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: 'Poppins', fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {topProducts.slice(0, 3).map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: '#6B7280', flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F2937' }}>{p.sales.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart + recent orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#1F2937', fontSize: '1rem' }}>Jumlah Pesanan</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontFamily: 'Poppins', fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: 'Poppins', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontFamily: 'Poppins', fontSize: 12, borderRadius: 10, border: '1px solid #F3F4F6' }} />
                    <Bar dataKey="orders" fill="#16A34A" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: '#1F2937', fontSize: '1rem' }}>Pesanan Terbaru</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {orders.slice(0, 4).map(order => {
                    const sc = statusColor(order.status);
                    return (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1F2937' }}>{order.id}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{order.customer}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.82rem' }}>{formatPrice(order.total)}</span>
                          <span style={{ background: sc.bg, color: sc.text, borderRadius: 100, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700 }}>{order.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {activeMenu === 'products' && (
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 12, alignItems: 'center' }}>
              <input className="input-field" placeholder="Cari produk..." style={{ maxWidth: 280 }} />
              <select className="input-field" style={{ width: 'auto' }}>
                <option>Semua Kategori</option>
                <option>Keripik</option>
                <option>Apel</option>
                <option>Bakpia</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Produk', 'Kategori', 'Harga', 'Stok', 'Terjual', 'Rating', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEFCE8'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#FFF8F0' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2937' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316', borderRadius: 100, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{p.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#F97316', fontSize: '0.875rem' }}>{formatPrice(p.price)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: p.stock < 30 ? '#DC2626' : '#16A34A', fontWeight: 600, fontSize: '0.875rem' }}>{p.stock}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.875rem' }}>{p.sold.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: '#FACC15', fontWeight: 700 }}>★ </span>
                        <span style={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem' }}>{p.rating}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Poppins' }}>Edit</button>
                          <button style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', fontSize: '0.75rem', color: '#DC2626', fontFamily: 'Poppins' }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeMenu === 'orders' && (
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Semua', 'Diproses', 'Dikirim', 'Selesai', 'Batal'].map(s => (
                <button key={s} style={{
                  padding: '6px 14px', borderRadius: 100, border: 'none',
                  background: s === 'Semua' ? '#F97316' : '#F3F4F6',
                  color: s === 'Semua' ? 'white' : '#374151',
                  fontFamily: 'Poppins', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['No. Pesanan', 'Pelanggan', 'Tanggal', 'Item', 'Total', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const sc = statusColor(o.status);
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#F97316', fontSize: '0.875rem' }}>{o.id}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>{o.customer}</td>
                        <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem' }}>{o.date}</td>
                        <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '0.875rem' }}>{o.items} item</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1F2937', fontSize: '0.875rem' }}>{formatPrice(o.total)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.text, borderRadius: 100, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{o.status}</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Poppins', fontWeight: 600 }}>Detail</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeMenu === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: '#1F2937' }}>Statistik Pendapatan 6 Bulan</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontFamily: 'Poppins', fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: 'Poppins', fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(1)}jt`} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'Poppins', fontSize: 12, borderRadius: 10, border: '1px solid #F3F4F6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    formatter={(v: unknown) => [formatPrice(v as number), 'Pendapatan']}
                  />
                  <Bar dataKey="revenue" fill="#F97316" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: '#1F2937', fontSize: '1rem' }}>Produk Terlaris</h3>
                {topProducts.map((p, i) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${COLORS[i]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: COLORS[i] }}>{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2937' }}>{p.name}</div>
                      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 100, marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: COLORS[i], borderRadius: 100, width: `${(p.sales/3200)*100}%` }} />
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.85rem' }}>{p.sales.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: '#1F2937', fontSize: '1rem' }}>Ringkasan Keuangan</h3>
                {[
                  { label: 'Total Pendapatan', value: 'Rp 41.800.000', color: '#16A34A', icon: '💰' },
                  { label: 'Total Pesanan', value: '2.739', color: '#F97316', icon: '📦' },
                  { label: 'Rata-rata Order', value: 'Rp 152.600', color: '#8B5CF6', icon: '📊' },
                  { label: 'Pesanan Selesai', value: '91,2%', color: '#16A34A', icon: '✅' },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F9FAFB' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span>{icon}</span>
                      <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>{label}</span>
                    </div>
                    <span style={{ fontWeight: 800, color, fontSize: '0.95rem' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeMenu === 'customers' || activeMenu === 'categories' || activeMenu === 'settings') && (
          <div style={{ background: 'white', borderRadius: 14, padding: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{menus.find(m => m.id === activeMenu)?.icon}</div>
            <h2 style={{ color: '#1F2937', margin: '0 0 8px' }}>Halaman {menus.find(m => m.id === activeMenu)?.label}</h2>
            <p style={{ color: '#9CA3AF', margin: 0 }}>Fitur ini sedang dalam pengembangan</p>
          </div>
        )}
      </div>
    </div>
  );
}

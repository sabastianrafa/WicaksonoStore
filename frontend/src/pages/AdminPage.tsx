import { useEffect, useState } from 'react';
import type { Page } from '../App';
import { apiFetch } from '../api/client';
import type { AdminProduct, Category } from './admin/types';
import { MENUS, formatIndonesianDate } from './admin/utils';
import { primaryButton } from './admin/styles';
import { useAdminData } from './admin/useAdminData';
import Sidebar from './admin/Sidebar';
import DashboardSection from './admin/DashboardSection';
import ProductsSection from './admin/ProductsSection';
import CategoriesSection from './admin/CategoriesSection';
import CategoryFormModal from './admin/CategoryFormModal';
import OrdersSection from './admin/OrdersSection';
import PaymentsSection from './admin/PaymentsSection';
import ShippingSection from './admin/ShippingSection';
import CustomersSection from './admin/CustomersSection';
import ReportsSection from './admin/ReportsSection';
import ProductFormModal from './admin/ProductFormModal';

export default function AdminPage({ navigate }: { navigate: (page: Page) => void }) {
  const data = useAdminData();

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [productModal, setProductModal] = useState<{ product: AdminProduct | null } | null>(null);
  // undefined = tertutup, null = tambah baru, Category = edit
  const [categoryModal, setCategoryModal] = useState<Category | null | undefined>(undefined);
  const [dateLabel, setDateLabel] = useState(() => formatIndonesianDate(new Date()));

  const adminEmail = localStorage.getItem('userEmail') || 'admin@wicaksono.id';
  const active = MENUS.find((menu) => menu.id === activeMenu);

  useEffect(() => {
    const timer = window.setInterval(
      () => setDateLabel(formatIndonesianDate(new Date())),
      60000
    );

    return () => window.clearInterval(timer);
  }, []);

  /* ---------- Logout ---------- */

  const [loggingOut, setLoggingOut] = useState(false);

  const adminName = localStorage.getItem('userName') || 'Admin';

  // Sama dengan clearSession() di Navbar: cukup token + user.
  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleLogout = async () => {
    if (!window.confirm('Keluar dari panel admin?')) return;

    setLoggingOut(true);

    try {
      if (localStorage.getItem('token')) {
        await apiFetch('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearSession();
      setLoggingOut(false);
      navigate('home');
    }
  };

  /* Produk baru disimpan → muat ulang daftar + ringkasan. */
  const handleProductSaved = () => {
    data.reloadProducts();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      <Sidebar
        activeMenu={activeMenu}
        onSelect={setActiveMenu}
        adminEmail={adminEmail}
        adminName={adminName}
        onBackToShop={() => navigate('home')}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxHeight: '100vh' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1F2937' }}>
              {active?.label}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.85rem' }}>{dateLabel}</p>
          </div>

          {activeMenu === 'products' && (
            <button
              style={primaryButton}
              onClick={() => setProductModal({ product: null })}
            >
              + Tambah Produk
            </button>
          )}

          {activeMenu === 'categories' && (
            <button style={primaryButton} onClick={() => setCategoryModal(null)}>
              + Tambah Kategori
            </button>
          )}
        </div>

        {/* Konten */}
        {activeMenu === 'dashboard' && (
          <DashboardSection
            summary={data.summary}
            salesData={data.salesData}
            topProducts={data.topProducts}
            orders={data.orders}
            loading={data.loadingDashboard}
          />
        )}

        {activeMenu === 'products' && (
          <ProductsSection
            products={data.products}
            categories={data.categories}
            meta={data.productMeta}
            filters={data.productFilters}
            loading={data.loadingProducts}
            onFilterChange={data.setProductFilter}
            onPageChange={(page) => data.setProductFilter({ page })}
            onEdit={(product) => setProductModal({ product })}
            onDelete={data.deleteProduct}
          />
        )}

        {activeMenu === 'categories' && (
          <CategoriesSection
            categories={data.categories}
            onEdit={(category) => setCategoryModal(category)}
            onDelete={data.deleteCategory}
          />
        )}

        {activeMenu === 'orders' && (
          <OrdersSection
            orders={data.orders}
            meta={data.orderMeta}
            filters={data.orderFilters}
            loading={data.loadingOrders}
            onFilterChange={data.setOrderFilter}
            onPageChange={(page) => data.setOrderFilter({ page })}
            onUpdateStatus={data.updateOrderStatus}
          />
        )}

        {activeMenu === 'payments' && (
          <PaymentsSection
            payments={data.payments}
            meta={data.paymentMeta}
            filters={data.paymentFilters}
            loading={data.loadingPayments}
            methods={data.paymentMethods}
            onFilterChange={data.setPaymentFilter}
            onPageChange={(page) => data.setPaymentFilter({ page })}
            onVerify={data.verifyPayment}
            onReject={data.rejectPayment}
          />
        )}

        {activeMenu === 'shipping' && (
          <ShippingSection
            methods={data.shippingMethods}
            loading={data.loadingShipping}
            onSave={data.saveShippingMethod}
            promotion={data.shippingPromotion}
            promotionLoading={data.loadingShippingPromotion}
            promotionError={data.shippingPromotionError}
            onSavePromotion={data.saveShippingPromotion}
          />
        )}

        {activeMenu === 'customers' && (
          <CustomersSection
            users={data.users}
            meta={data.userMeta}
            filters={data.userFilters}
            loading={data.loadingUsers}
            onFilterChange={data.setUserFilter}
            onPageChange={(page) => data.setUserFilter({ page })}
            onUpdateRole={data.updateUserRole}
            onDelete={data.deleteUser}
          />
        )}

        {activeMenu === 'reports' && (
          <ReportsSection
            salesData={data.salesData}
            topProducts={data.topProducts}
            financial={data.financial}
            productReport={data.productReport}
          />
        )}
      </div>

      {productModal && (
        <ProductFormModal
          product={productModal.product}
          categories={data.categories}
          onClose={() => setProductModal(null)}
          onSaved={handleProductSaved}
        />
      )}

      {categoryModal !== undefined && (
        <CategoryFormModal
          category={categoryModal}
          onClose={() => setCategoryModal(undefined)}
          onSave={data.saveCategory}
        />
      )}
    </div>
  );
}

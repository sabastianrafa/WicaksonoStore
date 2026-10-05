import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import type {
  AdminOrder,
  AdminPayment,
  AdminProduct,
  AdminUser,
  ApiMeta,
  Category,
  DashboardProduct,
  DashboardSummary,
  FinancialSummary,
  OrderFilters,
  PaymentFilters,
  PaymentMethod,
  PaymentMethodType,
  ProductFilters,
  ProductReport,
  SalesChartItem,
  SalesReport,
  ShippingMethod,
  UserFilters,
} from './types';
import {
  buildMonthlySales,
  buildQuery,
  normalizeCategory,
  normalizeOrder,
  normalizePayment,
  normalizePaymentMethod,
  normalizeProduct,
  normalizeShippingMethod,
  normalizeTopProduct,
  normalizeUser,
} from './utils';

const EMPTY_META: ApiMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
};

const DEFAULT_ORDER_FILTERS: OrderFilters = {
  search: '',
  status: '',
  sort: 'latest',
  start_date: '',
  end_date: '',
  page: 1,
};

const DEFAULT_PAYMENT_FILTERS: PaymentFilters = {
  search: '',
  status: '',
  method: '',
  page: 1,
};

const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: '',
  category_id: '',
  is_active: '',
  page: 1,
};

const DEFAULT_USER_FILTERS: UserFilters = {
  search: '',
  role: '',
  page: 1,
};

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/**
 * Terpusat: semua pemanggilan endpoint /admin/* ada di sini.
 * Komponen tampilan hanya menerima props + callback.
 */
export function useAdminData() {
  /* ---------- Dashboard & laporan ---------- */

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<DashboardProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesChartItem[]>([]);
  const [financial, setFinancial] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    completionRate: 0,
  });
  const [productReport, setProductReport] = useState<ProductReport | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  /* ---------- Kategori (dimuat penuh untuk dropdown form produk) ---------- */

  const [categories, setCategories] = useState<Category[]>([]);

  /* ---------- Produk ---------- */

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productMeta, setProductMeta] = useState<ApiMeta>(EMPTY_META);
  const [productFilters, setProductFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  const [loadingProducts, setLoadingProducts] = useState(true);

  /* ---------- Pesanan ---------- */

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderMeta, setOrderMeta] = useState<ApiMeta>(EMPTY_META);
  const [orderFilters, setOrderFilters] = useState<OrderFilters>(DEFAULT_ORDER_FILTERS);
  const [loadingOrders, setLoadingOrders] = useState(true);

  /* ---------- Pembayaran ---------- */

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentMeta, setPaymentMeta] = useState<ApiMeta>(EMPTY_META);
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>(
    DEFAULT_PAYMENT_FILTERS
  );
  const [loadingPayments, setLoadingPayments] = useState(true);

  /* ---------- Pelanggan ---------- */

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userMeta, setUserMeta] = useState<ApiMeta>(EMPTY_META);
  const [userFilters, setUserFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);
  const [loadingUsers, setLoadingUsers] = useState(true);

  /* ---------- Metode pengiriman ---------- */

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(true);

  /* ---------- Metode pembayaran ---------- */

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  /* ============================================================
   * Loader
   * ============================================================ */

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);

    try {
      const [dashboardRes, salesRes, productRes] = await Promise.all([
        apiFetch<any>('/admin/dashboard'),
        apiFetch<any>('/admin/reports/sales'),
        apiFetch<any>('/admin/reports/products'),
      ]);

      const rawSummary = dashboardRes?.data?.summary ?? {};

      setSummary({
        total_products: Number(rawSummary.total_products ?? 0),
        active_products: Number(rawSummary.active_products ?? 0),
        total_categories: Number(rawSummary.total_categories ?? 0),
        total_users: Number(rawSummary.total_users ?? 0),
        total_orders: Number(rawSummary.total_orders ?? 0),
        pending_orders: Number(rawSummary.pending_orders ?? 0),
        confirmed_orders: Number(rawSummary.confirmed_orders ?? 0),
        processing_orders: Number(rawSummary.processing_orders ?? 0),
        shipped_orders: Number(rawSummary.shipped_orders ?? 0),
        completed_orders: Number(rawSummary.completed_orders ?? 0),
        cancelled_orders: Number(rawSummary.cancelled_orders ?? 0),
        pending_payments: Number(rawSummary.pending_payments ?? 0),
        total_revenue: Number(rawSummary.total_revenue ?? 0),
      });

      setTopProducts(
        (dashboardRes?.data?.top_products ?? []).map(normalizeTopProduct)
      );

      const report: SalesReport = salesRes?.data ?? {};
      const salesOrders = (report.orders ?? []).map((order: any) => ({
        id: Number(order.id),
        created_at: order.created_at,
        total: Number(order.total ?? 0),
        order_status:
          typeof order.order_status === 'string'
            ? order.order_status
            : (order.order_status?.value ?? ''),
      }));

      setSalesData(buildMonthlySales(salesOrders));

      const totalOrders = Number(report.total_orders ?? 0);
      const totalRevenue = Number(report.total_paid_revenue ?? 0);
      const completedOrders = Number(report.completed_orders ?? 0);

      setFinancial({
        totalRevenue,
        totalOrders,
        averageOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      });

      const rawProductReport = productRes?.data ?? {};

      setProductReport({
        total_products: Number(rawProductReport.total_products ?? 0),
        low_stock_count: Number(rawProductReport.low_stock_count ?? 0),
        out_of_stock_count: Number(rawProductReport.out_of_stock_count ?? 0),
        low_stock_products: (rawProductReport.low_stock_products ?? []).map(
          normalizeProduct
        ),
        out_of_stock_products: (rawProductReport.out_of_stock_products ?? []).map(
          normalizeProduct
        ),
      });
    } catch (error) {
      console.error('Gagal memuat dashboard:', error);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch<any>('/admin/categories?per_page=100&sort=name_asc');
      setCategories((res?.data ?? []).map(normalizeCategory));
    } catch (error) {
      console.error('Gagal memuat kategori:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);

    try {
      const res = await apiFetch<any>(
        `/admin/products${buildQuery({
          search: productFilters.search,
          category_id: productFilters.category_id,
          is_active: productFilters.is_active,
          page: productFilters.page,
          per_page: 10,
        })}`
      );

      setProducts((res?.data ?? []).map(normalizeProduct));
      setProductMeta(res?.meta ?? EMPTY_META);
    } catch (error) {
      console.error('Gagal memuat produk:', error);
      setProducts([]);
      setProductMeta(EMPTY_META);
    } finally {
      setLoadingProducts(false);
    }
  }, [productFilters]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);

    try {
      const res = await apiFetch<any>(
        `/admin/orders${buildQuery({
          search: orderFilters.search,
          status: orderFilters.status,
          sort: orderFilters.sort,
          start_date: orderFilters.start_date,
          end_date: orderFilters.end_date,
          page: orderFilters.page,
          per_page: 10,
        })}`
      );

      setOrders((res?.data ?? []).map(normalizeOrder));
      setOrderMeta(res?.meta ?? EMPTY_META);
    } catch (error) {
      console.error('Gagal memuat pesanan:', error);
      setOrders([]);
      setOrderMeta(EMPTY_META);
    } finally {
      setLoadingOrders(false);
    }
  }, [orderFilters]);

  const loadPayments = useCallback(async () => {
    setLoadingPayments(true);

    try {
      const res = await apiFetch<any>(
        `/admin/payments${buildQuery({
          search: paymentFilters.search,
          status: paymentFilters.status,
          method: paymentFilters.method,
          page: paymentFilters.page,
          per_page: 10,
        })}`
      );

      setPayments((res?.data ?? []).map(normalizePayment));
      setPaymentMeta(res?.meta ?? EMPTY_META);
    } catch (error) {
      console.error('Gagal memuat pembayaran:', error);
      setPayments([]);
      setPaymentMeta(EMPTY_META);
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentFilters]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const res = await apiFetch<any>(
        `/admin/users${buildQuery({
          search: userFilters.search,
          role: userFilters.role,
          page: userFilters.page,
          per_page: 10,
        })}`
      );

      setUsers((res?.data ?? []).map(normalizeUser));
      setUserMeta(res?.meta ?? EMPTY_META);
    } catch (error) {
      console.error('Gagal memuat pengguna:', error);
      setUsers([]);
      setUserMeta(EMPTY_META);
    } finally {
      setLoadingUsers(false);
    }
  }, [userFilters]);

  const loadShippingMethods = useCallback(async () => {
    setLoadingShipping(true);

    try {
      const res = await apiFetch<any>('/admin/shipping-methods?per_page=100');
      setShippingMethods((res?.data ?? []).map(normalizeShippingMethod));
    } catch (error) {
      console.error('Gagal memuat metode pengiriman:', error);
      setShippingMethods([]);
    } finally {
      setLoadingShipping(false);
    }
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    setLoadingPaymentMethods(true);

    try {
      const res = await apiFetch<any>('/admin/payment-methods?per_page=100');
      setPaymentMethods((res?.data ?? []).map(normalizePaymentMethod));
    } catch (error) {
      console.error('Gagal memuat metode pembayaran:', error);
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadCategories();
  }, [loadDashboard, loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadShippingMethods();
  }, [loadShippingMethods]);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  /* ============================================================
   * Aksi
   * ============================================================ */

  const reloadProducts = useCallback(() => {
    loadProducts();
    loadDashboard();
  }, [loadProducts, loadDashboard]);

  const deleteProduct = useCallback(
    async (product: AdminProduct) => {
      if (!window.confirm(`Hapus produk "${product.name}"?`)) return false;

      try {
        await apiFetch(`/admin/products/${product.id}`, { method: 'DELETE' });

        // Kalau baris terakhir di halaman ini habis, mundur satu halaman.
        if (products.length === 1 && productFilters.page > 1) {
          setProductFilters((prev) => ({ ...prev, page: prev.page - 1 }));
        } else {
          loadProducts();
          loadDashboard();
        }

        return true;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal menghapus produk.'));
        return false;
      }
    },
    [products.length, productFilters.page, loadProducts, loadDashboard]
  );

  const updateOrderStatus = useCallback(
    async (order: AdminOrder, status: string) => {
      try {
        const res = await apiFetch<any>(`/admin/orders/${order.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });

        const updated = normalizeOrder(res?.data ?? {});

        setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        loadDashboard();

        return updated;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal memperbarui status pesanan.'));
        throw error;
      }
    },
    [loadDashboard]
  );

  const verifyPayment = useCallback(
    async (payment: AdminPayment) => {
      try {
        const res = await apiFetch<any>(`/admin/payments/${payment.id}/verify`, {
          method: 'PATCH',
          body: JSON.stringify({}),
        });

        const updated = normalizePayment(res?.data ?? {});

        setPayments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        loadDashboard();
        loadOrders();

        return updated;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal memverifikasi pembayaran.'));
        throw error;
      }
    },
    [loadDashboard, loadOrders]
  );

  const rejectPayment = useCallback(
    async (payment: AdminPayment, reason: string) => {
      try {
        const res = await apiFetch<any>(`/admin/payments/${payment.id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        });

        const updated = normalizePayment(res?.data ?? {});

        setPayments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        loadDashboard();

        return updated;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal menolak pembayaran.'));
        throw error;
      }
    },
    [loadDashboard]
  );

  const saveCategory = useCallback(
    async (payload: {
      id?: number;
      name: string;
      is_active: boolean;
    }) => {
      const body = JSON.stringify({
        name: payload.name,
        is_active: payload.is_active,
      });

      const res = await apiFetch<any>(
        payload.id ? `/admin/categories/${payload.id}` : '/admin/categories',
        {
          method: payload.id ? 'PUT' : 'POST',
          body,
        }
      );

      await loadCategories();
      loadDashboard();

      return normalizeCategory(res?.data ?? {});
    },
    [loadCategories, loadDashboard]
  );

  const deleteCategory = useCallback(
    async (category: Category) => {
      if (!window.confirm(`Hapus kategori "${category.name}"?`)) return false;

      try {
        await apiFetch(`/admin/categories/${category.id}`, { method: 'DELETE' });

        await loadCategories();
        loadDashboard();

        return true;
      } catch (error) {
        window.alert(
          errorMessage(error, 'Gagal menghapus kategori. Kategori yang masih punya produk tidak bisa dihapus.')
        );
        return false;
      }
    },
    [loadCategories, loadDashboard]
  );

  const updateUserRole = useCallback(
    async (user: AdminUser, role: string) => {
      try {
        const res = await apiFetch<any>(`/admin/users/${user.id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role }),
        });

        const updated = normalizeUser(res?.data ?? {});

        setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        loadDashboard();

        return updated;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal mengubah role pengguna.'));
        throw error;
      }
    },
    [loadDashboard]
  );

  const deleteUser = useCallback(
    async (user: AdminUser) => {
      if (!window.confirm(`Hapus pengguna "${user.name}"?`)) return false;

      try {
        await apiFetch(`/admin/users/${user.id}`, { method: 'DELETE' });

        if (users.length === 1 && userFilters.page > 1) {
          setUserFilters((prev) => ({ ...prev, page: prev.page - 1 }));
        } else {
          loadUsers();
          loadDashboard();
        }

        return true;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal menghapus pengguna.'));
        return false;
      }
    },
    [users.length, userFilters.page, loadUsers, loadDashboard]
  );

  const saveShippingMethod = useCallback(
    async (payload: {
      id?: number;
      name: string;
      code: string;
      description?: string | null;
      cost: number;
      estimated_days?: string | null;
      is_active: boolean;
      sort_order: number;
    }) => {
      const res = await apiFetch<any>(
        payload.id
          ? `/admin/shipping-methods/${payload.id}`
          : '/admin/shipping-methods',
        {
          method: payload.id ? 'PUT' : 'POST',
          body: JSON.stringify({
            name: payload.name,
            code: payload.code,
            description: payload.description || null,
            cost: payload.cost,
            estimated_days: payload.estimated_days || null,
            is_active: payload.is_active,
            sort_order: payload.sort_order,
          }),
        }
      );

      await loadShippingMethods();

      return normalizeShippingMethod(res?.data ?? {});
    },
    [loadShippingMethods]
  );

  const deleteShippingMethod = useCallback(
    async (method: ShippingMethod) => {
      if (!window.confirm(`Hapus metode pengiriman "${method.name}"?`)) return false;

      try {
        await apiFetch(`/admin/shipping-methods/${method.id}`, { method: 'DELETE' });
        await loadShippingMethods();
        return true;
      } catch (error) {
        window.alert(errorMessage(error, 'Gagal menghapus metode pengiriman.'));
        return false;
      }
    },
    [loadShippingMethods]
  );

  const savePaymentMethod = useCallback(
    async (payload: {
      id?: number;
      name: string;
      code: string;
      type: PaymentMethodType;
      account_number: string | null;
      account_name: string | null;
      qris_image: File | null;
      description: string | null;
      is_active: boolean;
    }) => {
      const endpoint = payload.id
        ? `/admin/payment-methods/${payload.id}`
        : '/admin/payment-methods';

      const fields: Record<string, string> = {
        name: payload.name,
        code: payload.code,
        type: payload.type,
        account_number: payload.account_number ?? '',
        account_name: payload.account_name ?? '',
        description: payload.description ?? '',
        is_active: payload.is_active ? '1' : '0',
      };

      let res: any;

      if (payload.qris_image) {
        /*
        | Multipart tidak bisa memakai method PUT dari fetch, jadi edit
        | dikirim sebagai POST + _method (method spoofing Laravel).
        | apiFetch tidak memasang Content-Type untuk FormData supaya
        | boundary-nya dibuat browser.
        */
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

        formData.append('qris_image', payload.qris_image);

        if (payload.id) formData.append('_method', 'PUT');

        res = await apiFetch(endpoint, { method: 'POST', body: formData });
      } else {
        res = await apiFetch(endpoint, {
          method: payload.id ? 'PUT' : 'POST',
          body: JSON.stringify(fields),
        });
      }

      await loadPaymentMethods();

      return normalizePaymentMethod(res?.data ?? {});
    },
    [loadPaymentMethods]
  );

  const deletePaymentMethod = useCallback(
    async (method: PaymentMethod) => {
      if (!window.confirm(`Hapus metode pembayaran "${method.name}"?`)) return false;

      try {
        await apiFetch(`/admin/payment-methods/${method.id}`, { method: 'DELETE' });
        await loadPaymentMethods();
        return true;
      } catch (error) {
        window.alert(
          errorMessage(
            error,
            'Gagal menghapus metode pembayaran. Metode yang sudah dipakai transaksi tidak bisa dihapus.'
          )
        );
        return false;
      }
    },
    [loadPaymentMethods]
  );

  /* ---------- Filter helpers ---------- */

  const setProductFilter = useCallback(
    (patch: Partial<ProductFilters>) =>
      setProductFilters((prev) => ({ ...prev, page: 1, ...patch })),
    []
  );

  const setOrderFilter = useCallback(
    (patch: Partial<OrderFilters>) =>
      setOrderFilters((prev) => ({ ...prev, page: 1, ...patch })),
    []
  );

  const setPaymentFilter = useCallback(
    (patch: Partial<PaymentFilters>) =>
      setPaymentFilters((prev) => ({ ...prev, page: 1, ...patch })),
    []
  );

  const setUserFilter = useCallback(
    (patch: Partial<UserFilters>) => setUserFilters((prev) => ({ ...prev, page: 1, ...patch })),
    []
  );

  return {
    /* data */
    summary,
    topProducts,
    salesData,
    financial,
    productReport,
    loadingDashboard,
    categories,
    products,
    productMeta,
    productFilters,
    loadingProducts,
    orders,
    orderMeta,
    orderFilters,
    loadingOrders,
    payments,
    paymentMeta,
    paymentFilters,
    loadingPayments,
    users,
    userMeta,
    userFilters,
    loadingUsers,
    shippingMethods,
    loadingShipping,
    paymentMethods,
    loadingPaymentMethods,
    /* aksi */
    reloadProducts,
    deleteProduct,
    updateOrderStatus,
    verifyPayment,
    rejectPayment,
    saveCategory,
    deleteCategory,
    updateUserRole,
    deleteUser,
    saveShippingMethod,
    deleteShippingMethod,
    savePaymentMethod,
    deletePaymentMethod,
    setProductFilter,
    setOrderFilter,
    setPaymentFilter,
    setUserFilter,
  };
}

export type AdminData = ReturnType<typeof useAdminData>;

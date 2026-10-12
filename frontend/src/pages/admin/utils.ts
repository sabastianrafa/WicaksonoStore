import { storageUrl } from '../../api/client';
import type {
  AdminOrder,
  AdminPayment,
  AdminProduct,
  AdminUser,
  ApiMeta,
  Category,
  DashboardProduct,
  PaymentMethod,
  ProductImage,
  SalesChartItem,
  SalesReportOrder,
  ShippingMethod,
} from './types';

export const COLORS = ['#F97316', '#16A34A', '#FACC15', '#8B5CF6', '#EC4899'];

export const MENUS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'products', label: 'Produk', icon: '📦' },
  { id: 'categories', label: 'Kategori', icon: '🏷️' },
  { id: 'orders', label: 'Pesanan', icon: '🛒' },
  { id: 'payments', label: 'Pembayaran', icon: '💳' },
  { id: 'shipping', label: 'Pengiriman', icon: '🚚' },
  { id: 'paymethods', label: 'Metode Bayar', icon: '🧾' },
  { id: 'customers', label: 'Pelanggan', icon: '👥' },
  { id: 'reports', label: 'Laporan', icon: '📈' },
];

/* ---------- Query builder ---------- */

/**
 * Backend memakai `filled()`, jadi parameter kosong harus dihapus
 * supaya tidak ikut memfilter (mis. search='' tidak boleh jadi LIKE '%%').
 */
export function buildQuery(params: Record<string, string | number>): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    search.set(key, String(value));
  });

  const query = search.toString();

  return query ? `?${query}` : '';
}

/* ---------- Normalisasi data API ---------- */

export const normalizeImages = (items: any): ProductImage[] =>
  Array.isArray(items)
    ? items.map((item) => ({
        id: Number(item.id),
        product_id: Number(item.product_id ?? 0),
        path: item.path ?? '',
        alt_text: item.alt_text ?? null,
        is_primary: Boolean(item.is_primary),
        sort_order: Number(item.sort_order ?? 0),
        url: storageUrl(item.url ?? item.path),
      }))
    : [];

export const normalizeProduct = (item: any): AdminProduct => {
  const images = normalizeImages(item.images);

  const primary = images.find((image) => image.is_primary) ?? images[0];

  return {
    id: Number(item.id),
    category_id: Number(item.category_id ?? item.category?.id ?? 0),
    name: item.name ?? '',
    slug: item.slug ?? '',
    category:
      typeof item.category === 'string'
        ? item.category
        : (item.category?.name ?? ''),
    price: Number(item.price ?? 0),
    originalPrice: Number(item.original_price ?? item.price ?? 0),
    rating: Number(item.rating ?? 0),
    reviews: Number(item.review_count ?? 0),
    sold: Number(item.sold ?? 0),
    stock: Number(item.stock ?? 0),
    weight: Number(item.weight ?? 0),
    discount: Number(item.discount ?? 0),
    image: primary?.url || storageUrl(item.image),
    description: item.description ?? '',
    is_active: item.is_active === undefined ? true : Boolean(item.is_active),
    created_at: item.created_at ?? '',
    updated_at: item.updated_at ?? '',
    images,
  };
};

export const normalizeCategory = (item: any): Category => ({
  id: Number(item.id),
  name: item.name ?? '',
  slug: item.slug,
  is_active: item.is_active === undefined ? true : Boolean(item.is_active),
  products_count: Number(item.products_count ?? 0),
});

const enumValue = (value: any, fallback: string): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.value === 'string') {
    return value.value;
  }
  return fallback;
};

export const normalizeOrder = (item: any): AdminOrder => {
  const items = Array.isArray(item.items) ? item.items : [];

  const addressParts = [
    item.shipping_address,
    item.shipping_city,
    item.shipping_province,
    item.shipping_postal_code,
  ].filter(Boolean);

  return {
    id: Number(item.id),
    order_number: item.order_number ?? '-',
    customer: item.user?.name || item.shipping_name || 'Pelanggan',
    customer_email: item.user?.email ?? '',
    phone: item.shipping_phone ?? '',
    date: item.created_at
      ? new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date(item.created_at))
      : '-',
    items: items.reduce(
      (total: number, orderItem: any) => total + Number(orderItem.quantity ?? 0),
      0
    ),
    subtotal: Number(item.subtotal ?? 0),
    shipping_cost: Number(item.shipping_cost ?? 0),
    total: Number(item.total ?? 0),
    status: enumValue(item.order_status, 'pending'),
    payment_method: enumValue(item.payment?.method, '-'),
    payment_status: enumValue(item.payment?.status, 'pending'),
    shipping_method: item.shipping_courier_name ?? item.shipping_method?.name ?? '-',
    address: addressParts.join(', ') || '-',
  };
};

export const normalizeUser = (item: any): AdminUser => ({
  id: Number(item.id),
  name: item.name ?? '',
  email: item.email ?? '',
  phone: item.phone ?? '',
  role: enumValue(item.role, 'user'),
  orders_count: Number(item.orders_count ?? 0),
  reviews_count: Number(item.reviews_count ?? 0),
  addresses_count: Number(item.addresses_count ?? 0),
  created_at: item.created_at ?? '',
});

export const normalizePayment = (item: any): AdminPayment => ({
  id: Number(item.id),
  order_id: Number(item.order_id ?? 0),
  order_number: item.order?.order_number ?? '-',
  customer: item.order?.user?.name || item.order?.shipping_name || 'Pelanggan',
  method: enumValue(item.method, '-'),
  amount: Number(item.amount ?? 0),
  status: enumValue(item.status, 'pending'),
  proof_url: item.proof
    ? storageUrl(item.proof)
    : item.proof_url
      ? storageUrl(item.proof_url)
      : null,
  notes: item.notes ?? null,
  verifier: item.verifier?.name ?? null,
  verified_at: item.verified_at ?? null,
  created_at: item.created_at ?? '',
});

export const normalizeShippingMethod = (item: any): ShippingMethod => ({
  id: Number(item.id),
  name: item.name ?? '',
  code: item.code ?? '',
  description: item.description ?? null,
  cost: Number(item.cost ?? 0),
  estimated_days: item.estimated_days ?? null,
  is_active: item.is_active === undefined ? true : Boolean(item.is_active),
  sort_order: Number(item.sort_order ?? 0),
});

export const normalizePaymentMethod = (item: any): PaymentMethod => {
  const qrisPath = item.qris_image
    ?? item.qris_image_url?.replace(/^\/storage\//, '')
    ?? null;

  return {
    id: Number(item.id),
    name: item.name ?? '',
    code: item.code ?? '',
    type: item.type === 'qris' ? 'qris' : 'bank',
    account_number: item.account_number ?? null,
    account_name: item.account_name ?? null,
    qris_image: storageUrl(qrisPath),
    qris_image_url: item.qris_image_url ?? (qrisPath ? storageUrl(qrisPath) : null),
    description: item.description ?? null,
    icon: item.icon ?? null,
    requires_proof: item.requires_proof === undefined ? true : Boolean(item.requires_proof),
    is_active: item.is_active === undefined ? true : Boolean(item.is_active),
    is_ready: item.is_ready === undefined
      ? (item.type === 'qris' ? Boolean(qrisPath) : Boolean(item.account_number && item.account_name))
      : Boolean(item.is_ready),
    sort_order: Number(item.sort_order ?? 0),
    payments_count: Number(item.payments_count ?? 0),
  };
};

export const normalizeTopProduct = (item: any): DashboardProduct => ({
  id: Number(item.id),
  name: item.name ?? '',
  slug: item.slug ?? '',
  price: Number(item.price ?? 0),
  stock: Number(item.stock ?? 0),
  sold: Number(item.sold ?? 0),
  buyers_count: Number(item.buyers_count ?? 0),
  purchase_percentage: Number(item.purchase_percentage ?? 0),
  rating: Number(item.rating ?? 0),
  image: storageUrl(item.image),
});

/* ---------- Status pesanan (App\Enums\OrderStatus) ---------- */

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const;

/**
 * Transisi status yang diizinkan OrderController::canChangeStatus.
 * Disalin ke sini supaya UI tidak menawarkan aksi yang pasti ditolak backend.
 */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

/* ---------- Status pembayaran (App\Enums\PaymentStatus) ---------- */

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Menunggu Verifikasi' },
  { value: 'paid', label: 'Lunas' },
  { value: 'rejected', label: 'Ditolak' },
] as const;

/* ---------- Metode pembayaran (App\Models\PaymentMethod) ---------- */

export const PAYMENT_METHOD_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'qris', label: 'QRIS' },
] as const;

/*
| Kode metode pembayaran datang dari database, bukan enum PHP lagi.
| Fungsi di bawah hanya fallback tampilan untuk kode yang sudah tidak
| terdaftar di payment_methods.
*/
const PAYMENT_METHOD_FALLBACKS: Record<string, string> = {
  transfer_bank: 'Transfer Bank',
  gopay: 'GoPay',
  ovo: 'OVO',
  dana: 'DANA',
  cod: 'COD (Bayar di Tempat)',
};

export const paymentMethodLabel = (method: string) =>
  PAYMENT_METHOD_FALLBACKS[method] ?? method;

export const PAYMENT_STATUS_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#DCFCE7', text: '#16A34A' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

/* ---------- Warna & label status ---------- */

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  processing: { bg: '#FEF3C7', text: '#D97706' },
  shipped: { bg: '#DBEAFE', text: '#1D4ED8' },
  completed: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  admin: { bg: '#EDE9FE', text: '#6D28D9' },
  user: { bg: '#F3F4F6', text: '#4B5563' },
};

export const statusColor = (status: string) =>
  STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#6B7280' };

const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  admin: 'Admin',
  user: 'Pelanggan',
};

export const orderStatusLabel = (status: string) => STATUS_LABELS[status] ?? status;

export const paymentStatusLabel = (status: string) =>
  PAYMENT_STATUSES.find((item) => item.value === status)?.label ?? status;

/* ---------- Tanggal ---------- */

export const formatIndonesianDate = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

export const formatDateTime = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/* ---------- Agregasi penjualan per bulan (6 bulan terakhir) ---------- */

export function buildMonthlySales(orders: SalesReportOrder[]): SalesChartItem[] {
  const monthlyMap = new Map<string, SalesChartItem>();

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    if (Number.isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyMap.get(monthKey) ?? {
      month: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date),
      monthNumber: date.getMonth() + 1,
      year: date.getFullYear(),
      label: new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(date),
      revenue: 0,
      orders: 0,
    };

    current.orders += 1;
    if (order.order_status !== 'cancelled') {
      current.revenue += Number(order.total ?? 0);
    }

    monthlyMap.set(monthKey, current);
  });

  return Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

export function buildMonthlySalesForYear(
  monthlySales: SalesChartItem[],
  year: number
): SalesChartItem[] {
  const salesByMonth = new Map(
    monthlySales
      .filter((item) => item.year === year)
      .map((item) => [item.monthNumber, item])
  );
  const formatMonth = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  const now = new Date();
  const monthCount = year === now.getFullYear() ? now.getMonth() + 1 : 12;

  return Array.from({ length: monthCount }, (_, index) => {
    const monthNumber = index + 1;
    const existing = salesByMonth.get(monthNumber);
    const month = formatMonth.format(new Date(year, index, 1));

    return {
      month,
      monthNumber,
      year,
      label: month,
      revenue: existing?.revenue ?? 0,
      orders: existing?.orders ?? 0,
    };
  });
}

export function buildYearlySalesForRange(
  monthlySales: SalesChartItem[],
  startYear: number,
  endYear: number
): SalesChartItem[] {
  const yearlyRevenue = new Map<number, number>();
  const yearlyOrders = new Map<number, number>();

  monthlySales.forEach(({ year, revenue, orders }) => {
    yearlyRevenue.set(year, (yearlyRevenue.get(year) ?? 0) + revenue);
    yearlyOrders.set(year, (yearlyOrders.get(year) ?? 0) + orders);
  });

  return Array.from({ length: Math.max(0, endYear - startYear + 1) }, (_, index) => {
    const year = startYear + index;
    return {
      month: String(year),
      monthNumber: 0,
      year,
      label: String(year),
      revenue: yearlyRevenue.get(year) ?? 0,
      orders: yearlyOrders.get(year) ?? 0,
    };
  });
}

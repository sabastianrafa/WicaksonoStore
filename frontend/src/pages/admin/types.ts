/** Bentuk data yang dipakai halaman admin, mengikuti API Laravel. */

export interface ApiMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  is_active: boolean;
  products_count: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  path: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  url: string;
}

export interface AdminProduct {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  weight: number;
  discount: number;
  image: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
}

export interface AdminOrder {
  id: number;
  order_number: string;
  customer: string;
  customer_email: string;
  phone: string;
  date: string;
  items: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_method: string;
  address: string;
}

export interface OrderItemRow {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  orders_count: number;
  reviews_count: number;
  addresses_count: number;
  created_at: string;
}

export interface AdminPayment {
  id: number;
  order_id: number;
  order_number: string;
  customer: string;
  method: string;
  amount: number;
  status: string;
  proof_url: string | null;
  notes: string | null;
  verifier: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  cost: number;
  estimated_days: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ShippingPromotion {
  is_active: boolean;
  minimum_purchase: number;
  area_codes: string[];
  areas: { code: string; name: string; level: 'province' | 'regency' }[];
}

/** Tipe metode pembayaran: bank (rekening) atau qris (gambar QR). */
export type PaymentMethodType = 'bank' | 'qris';

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  type: PaymentMethodType;
  account_number: string | null;
  account_name: string | null;
  qris_image: string | null;
  qris_image_url: string | null;
  description: string | null;
  icon: string | null;
  requires_proof: boolean;
  is_active: boolean;
  is_ready: boolean;
  sort_order: number;
  payments_count: number;
}

export interface DashboardSummary {
  total_products: number;
  active_products: number;
  total_categories: number;
  total_users: number;
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  shipped_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_payments: number;
  total_revenue: number;
}

export interface DashboardProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  sold: number;
  buyers_count: number;
  purchase_percentage: number;
  rating: number;
  image: string;
}

export interface SalesReportOrder {
  id: number;
  created_at: string;
  total: number;
  order_status: string;
}

export interface SalesReport {
  total_orders: number;
  completed_orders: number;
  total_gross_revenue: number;
  total_paid_revenue: number;
  orders: SalesReportOrder[];
}

export interface ProductReport {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  low_stock_products: AdminProduct[];
  out_of_stock_products: AdminProduct[];
}

export interface SalesChartItem {
  month: string;
  monthNumber: number;
  year: number;
  label: string;
  revenue: number;
  orders: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  completionRate: number;
}

/** Filter yang didukung backend pada GET /admin/orders */
export interface OrderFilters {
  search: string;
  status: string;
  sort: string;
  start_date: string;
  end_date: string;
  page: number;
}

/** Filter yang didukung backend pada GET /admin/payments */
export interface PaymentFilters {
  search: string;
  status: string;
  method: string;
  page: number;
}

/** Filter yang didukung backend pada GET /admin/products */
export interface ProductFilters {
  search: string;
  category_id: string;
  is_active: string;
  page: number;
}

/** Filter yang didukung backend pada GET /admin/users */
export interface UserFilters {
  search: string;
  role: string;
  page: number;
}
import { apiFetch } from "./client";

export interface Product {
  id: number;
  name: string;
  category: string;
  categoryId: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  discount: number;
  image: string;
  description: string;
  tags: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
}

interface ApiProduct {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  original_price: string | null;
  stock: number;
  sold: number;
  rating: string;
  review_count: number;
  discount: number;
  image: string | null;
  is_active: boolean;

  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  };

  images: {
    id: number;
    product_id: number;
    path: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
    url: string;
  }[];
}

interface ProductsResponse {
  success: boolean;
  message: string;
  data: ApiProduct[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface ProductResponse {
  success: boolean;
  message: string;
  data: ApiProduct;
}

/**
 * Format harga Rupiah
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Convert response Laravel -> Product frontend
 */
function mapProduct(product: ApiProduct): Product {
  const primaryImage =
    product.images?.find((image) => image.is_primary) ??
    product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? "",
    categoryId: product.category_id,
    price: Number(product.price),
    originalPrice:
      product.original_price !== null
        ? Number(product.original_price)
        : Number(product.price),
    rating: Number(product.rating),
    reviews: product.review_count,
    sold: product.sold,
    stock: product.stock,
    discount: product.discount,
    image: primaryImage?.url ?? "",
    description: product.description,
    tags: [],
  };
}

/**
 * GET /api/products
 */
export async function getProducts(): Promise<Product[]> {
  const response =
    await apiFetch<ProductsResponse>("/products");
  return response.data.map(mapProduct);
}

/**
 * GET /api/products/{id}
 */
export async function getProduct(
  id: number
): Promise<Product> {
  const response =
    await apiFetch<ProductResponse>(
      `/products/${id}`
    );
  return mapProduct(response.data);
}

/**
 * Buat kategori berdasarkan produk yang diterima API.
 */
export function getCategories(
  products: Product[]
): Category[] {
  const categoryMap = new Map<number, Category>();
  products.forEach((product) => {
    const existing = categoryMap.get(product.categoryId);
    if (existing) {
      existing.count += 1;
      return;
    }
    categoryMap.set(product.categoryId, {
      id: product.categoryId,
      name: product.category,
      slug: product.category
        .toLowerCase()
        .replace(/\s+/g, "-"),
      icon: "📦",
      color: "#F97316",
      count: 1,
    });
  });

  return Array.from(categoryMap.values());
}
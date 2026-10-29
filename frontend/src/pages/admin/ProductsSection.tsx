import { useEffect, useState } from 'react';
import { formatPrice } from '../../data';
import type { AdminProduct, ApiMeta, Category, ProductFilters } from './types';
import {
  Pagination,
  dangerButton,
  emptyCell,
  ghostButton,
  metaText,
  panel,
  th,
  toolbarStyle,
} from './styles';
import { formatDateTime } from './utils';

interface Props {
  products: AdminProduct[];
  categories: Category[];
  meta: ApiMeta;
  filters: ProductFilters;
  loading: boolean;
  onFilterChange: (patch: Partial<ProductFilters>) => void;
  onPageChange: (page: number) => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
}

const HEADERS = [
  'Produk',
  'Kategori',
  'Harga',
  'Stok',
  'Berat',
  'Terjual',
  'Rating & Ulasan',
  'Status',
  'Dibuat',
  'Diperbarui',
  'Aksi',
];

const firstWords = (text: string) => {
  const limit = 5;
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= limit) return text.trim();

  return `${words.slice(0, limit).join(' ')} .....`;
};

const hasDiscount = (product: AdminProduct) =>
  product.discount > 0 && product.originalPrice > product.price;

export default function ProductsSection({
  products,
  categories,
  meta,
  filters,
  loading,
  onFilterChange,
  onPageChange,
  onEdit,
  onDelete,
}: Props) {
  // Debounce biar tidak request tiap ketikan.
  const [search, setSearch] = useState(filters.search);

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
          placeholder="Cari nama atau deskripsi produk..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 280 }}
        />

        <select
          className="input-field"
          value={filters.category_id}
          onChange={(event) => onFilterChange({ category_id: event.target.value })}
          style={{ width: 'auto' }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          className="input-field"
          value={filters.is_active}
          onChange={(event) => onFilterChange({ is_active: event.target.value })}
          style={{ width: 'auto' }}
        >
          <option value="">Semua Status</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>

        {(filters.search || filters.category_id || filters.is_active) && (
          <button
            style={{ ...ghostButton, marginLeft: 'auto' }}
            onClick={() => onFilterChange({ search: '', category_id: '', is_active: '' })}
          >
            Reset Filter
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {HEADERS.map((header) => (
                <th key={header} style={th}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={HEADERS.length} style={emptyCell}>
                  Memuat produk...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  {/* Produk */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          objectFit: 'cover',
                          background: '#FFF8F0',
                        }}
                      />

                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1F2937' }}>
                          {product.name}
                        </div>
                        <div
                          title={product.description}
                          style={{
                            marginTop: 2,
                            color: '#9CA3AF',
                            fontSize: '0.68rem',
                            lineHeight: 1.4,
                          }}
                        >
                          {firstWords(product.description)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: 'rgba(249,115,22,0.1)',
                        color: '#F97316',
                        borderRadius: 100,
                        padding: '3px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-block',
                      }}
                    >
                      {product.category || '-'}
                    </span>
                  </td>

                  {/* Harga */}
                  <td style={{ padding: '12px 16px' }}>
                    {hasDiscount(product) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: '#E4401F', fontSize: '0.875rem' }}>
                            {formatPrice(product.price)}
                          </span>
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: 5,
                              background: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          >
                            -{product.discount}%
                          </span>
                        </div>

                        <span
                          style={{
                            color: '#9CA3AF',
                            fontSize: '0.7rem',
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatPrice(product.originalPrice)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#E4401F', fontSize: '0.875rem' }}>
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </td>

                  {/* Stok */}
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        color: product.stock === 0 ? '#DC2626' : product.stock < 30 ? '#D97706' : '#16A34A',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {product.stock}
                    </span>
                  </td>

                  {/* Berat */}
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.875rem' }}>
                    {product.weight > 0 ? `${product.weight.toLocaleString('id-ID')} g` : 'Belum diatur'}
                  </td>

                  {/* Terjual */}
                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.875rem' }}>
                    {product.sold.toLocaleString('id-ID')}
                  </td>

                  {/* Rating */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: '#FACC15', fontWeight: 700 }}>★</span>
                      <span style={{ color: '#1F2937', fontWeight: 600, fontSize: '0.875rem' }}>
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ marginTop: 2, color: '#9CA3AF', fontSize: '0.68rem' }}>
                      {product.reviews.toLocaleString('id-ID')} ulasan
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: product.is_active ? '#DCFCE7' : '#F3F4F6',
                        color: product.is_active ? '#16A34A' : '#6B7280',
                        borderRadius: 100,
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}
                    >
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {formatDateTime(product.created_at)}
                  </td>

                  <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {formatDateTime(product.updated_at)}
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={ghostButton} onClick={() => onEdit(product)}>
                        Edit
                      </button>
                      <button style={dangerButton} onClick={() => onDelete(product)}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={HEADERS.length} style={emptyCell}>
                  Tidak ada produk ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <div style={{ ...metaText, padding: '10px 20px' }}>
          {products.length} produk pada halaman ini dari {meta.total.toLocaleString('id-ID')} total.
        </div>
      )}

      <Pagination meta={meta} onPageChange={onPageChange} itemLabel="produk" />
    </div>
  );
}

import type { Category } from './types';
import { card, dangerButton, emptyCell, ghostButton } from './styles';

interface Props {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export default function CategoriesSection({ categories, onEdit, onDelete }: Props) {
  return (
    <div style={card}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 800, color: '#1F2937' }}>Daftar Kategori</h2>
        <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
          {categories.length} kategori terdaftar
        </p>
      </div>

      {categories.length === 0 ? (
        <div style={emptyCell}>Belum ada kategori.</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                border: '1px solid #F3F4F6',
                borderRadius: 10,
                opacity: category.is_active ? 1 : 0.6,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${category.color ?? '#F97316'}1A`,
                  color: category.color ?? '#F97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {category.icon ?? '🏷️'}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1F2937' }}>{category.name}</div>
                <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                  {category.products_count} produk · {category.is_active ? 'Aktif' : 'Nonaktif'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button style={ghostButton} onClick={() => onEdit(category)}>
                  Edit
                </button>
                <button
                  style={dangerButton}
                  onClick={() => onDelete(category)}
                  title="Kategori yang masih memiliki produk tidak bisa dihapus"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

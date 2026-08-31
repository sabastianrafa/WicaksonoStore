import { formatPrice } from '../api/products';
import type { Page } from '../App';

interface Product {
  id: number; name: string; category: string;
  price: number; originalPrice: number; rating: number;
  reviews: number; sold: number; stock: number; discount: number;
  image: string; description: string; tags: string[];
}

interface ProductCardProps {
  product: Product;
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: Product) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'} style={{ fontSize: 12 }}>★</span>
      ))}
    </span>
  );
}

export default function ProductCard({ product, navigate, onAddToCart }: ProductCardProps) {
  return (
    <div className="card-hover" style={{
      background: 'white', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column',
      cursor: 'pointer',
    }}
    onClick={() => navigate('product-detail', product)}>
      {/* Image */}
      <div style={{ position: 'relative', paddingTop: '75%', background: '#FFF8F0' }}>
        <img src={product.image} alt={product.name} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transition: 'transform 0.4s ease',
        }}
        onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.06)'; }}
        onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }} />
        {product.discount > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#F97316', color: 'white',
            fontSize: '0.7rem', fontWeight: 700,
            padding: '3px 8px', borderRadius: 6,
          }}>
            -{product.discount}%
          </div>
        )}
        {product.stock < 20 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#FEF2F2', color: '#DC2626',
            fontSize: '0.65rem', fontWeight: 600,
            padding: '3px 8px', borderRadius: 6,
            border: '1px solid #FECACA',
          }}>
            Stok terbatas
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 500,
          textTransform: 'capitalize' }}>{product.category}</p>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1F2937',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars rating={product.rating} />
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{product.rating} ({product.reviews})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#F97316' }}>{formatPrice(product.price)}</span>
          {product.discount > 0 && (
            <span style={{ fontSize: '0.78rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>Terjual {product.sold.toLocaleString()}</p>
      </div>

      {/* Add to cart */}
      <div style={{ padding: '0 16px 16px' }}>
        <button className="btn-primary" style={{ width: '100%', padding: '10px' }}
          onClick={e => { e.stopPropagation(); onAddToCart(product); }}>
          + Keranjang
        </button>
      </div>
    </div>
  );
}

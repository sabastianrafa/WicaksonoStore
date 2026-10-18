import { useState } from 'react';
import { formatPrice } from '../data';
import type { Page } from '../App';

interface Product {
  id: number;
  name: string;
  category: string;
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

interface ProductCardProps {
  product: Product;
  navigate: (page: Page, data?: unknown) => void;
  onAddToCart: (product: Product) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(rating)
              ? 'star-filled'
              : 'star-empty'
          }
          style={{ fontSize: 12 }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProductCard({
  product,
  navigate,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className="card-hover"
      onClick={() => navigate('product-detail', product)}
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      {/* =========================
          IMAGE
      ========================== */}
      <div
        style={{
          position: 'relative',
          paddingTop: '75%',
          background: '#FFF8F0',
          overflow: 'hidden',
        }}
      >
        {/* Logo fallback */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFF8F0',
          }}
        >
          <img
            src="/images/logo/wicaksono_logo_1.webp"
            alt="Wicaksono"
            draggable={false}
            style={{
              width: '45%',
              height: '45%',
              objectFit: 'contain',
              opacity: 0.7,
              userSelect: 'none',
            }}
          />
        </div>

        {/* Product Image */}
        {!imageError && product.image && (
          <img
            src={product.image}
            alt={product.name}
            draggable={false}
            onError={(event) => {
              console.error(
                'Gagal memuat gambar:',
                product.name,
                product.image
              );

              setImageError(true);
              event.currentTarget.onerror = null;
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.06)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)';
            }}
          />
        )}

        {/* Discount */}
        {product.discount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 5,
              background: '#F97316',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            -{product.discount}%
          </div>
        )}

        {/* Limited Stock */}
        {product.stock > 0 && product.stock < 20 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 5,
              background: '#FEF2F2',
              color: '#DC2626',
              fontSize: '0.65rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid #FECACA',
            }}
          >
            Stok terbatas
          </div>
        )}

        {/* Out of Stock */}
        {isOutOfStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 4,
              background: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                background: '#374151',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 6,
              }}
            >
              Stok Habis
            </span>
          </div>
        )}
      </div>

      {/* =========================
          CONTENT
      ========================== */}
      <div
        style={{
          padding: '14px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Category */}
        <p
          style={{
            margin: 0,
            fontSize: '0.8rem',
            color: '#9CA3AF',
            fontWeight: 500,
            textTransform: 'capitalize',
          }}
        >
          {product.category}
        </p>

        {/* Product Name */}
        <h3
          style={{
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#1F2937',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
            minHeight: '2.52em',
          }}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Stars rating={product.rating} />

          <span
            style={{
              fontSize: '0.75rem',
              color: '#6B7280',
            }}
          >
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginTop: 2,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: '#F97316',
            }}
          >
            {formatPrice(product.price)}
          </span>

          {product.discount > 0 && (
            <span
              style={{
                fontSize: '0.78rem',
                color: '#9CA3AF',
                textDecoration: 'line-through',
              }}
            >
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Sold */}
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: '#6B7280',
          }}
        >
          Terjual {product.sold.toLocaleString('id-ID')}
        </p>
      </div>

    </div>
  );
}
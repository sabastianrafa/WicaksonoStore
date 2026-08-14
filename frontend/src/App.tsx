import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

export type Page = 'home' | 'catalog' | 'product-detail' | 'cart' | 'checkout' | 'login' | 'register' | 'dashboard' | 'admin';

interface CartItem {
  id: number; name: string; price: number; image: string; quantity: number; category: string;
}

interface ToastProps { message: string; visible: boolean; }

function Toast({ message, visible }: ToastProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#1F2937', color: 'white',
      borderRadius: 12, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      transform: visible ? 'translateY(0)' : 'translateY(80px)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      pointerEvents: 'none', maxWidth: 320,
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
      <span style={{ fontFamily: 'Poppins', fontSize: '0.875rem', fontWeight: 500 }}>{message}</span>
    </div>
  );
}

const noNavPages: Page[] = ['login', 'register', 'admin'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageData, setPageData] = useState<unknown>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState({ message: '', visible: false });

  const navigate = (page: Page, data?: unknown) => {
    setCurrentPage(page);
    if (data !== undefined) setPageData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const addToCart = (product: unknown) => {
    const p = product as CartItem;
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) {
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: p.id, name: p.name, price: p.price, image: p.image, category: p.category, quantity: 1 }];
    });
    showToast(`${p.name.slice(0, 28)}... ditambahkan ke keranjang`);
  };

  const showNav = !noNavPages.includes(currentPage);

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', fontFamily: 'Poppins, sans-serif' }}>
      {showNav && (
        <Navbar
          currentPage={currentPage}
          navigate={navigate}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        />
      )}

      <main className="fade-in" key={currentPage}>
        {currentPage === 'home' && (
          <HomePage navigate={navigate} onAddToCart={addToCart} />
        )}
        {currentPage === 'catalog' && (
          <CatalogPage navigate={navigate} onAddToCart={addToCart} />
        )}
        {currentPage === 'product-detail' && !!pageData && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ProductDetailPage product={pageData as any} navigate={navigate} onAddToCart={addToCart} />
        )}
        {currentPage === 'cart' && (
          <CartPage cart={cart} setCart={setCart} navigate={navigate} />
        )}
        {currentPage === 'checkout' && (
          <CheckoutPage cart={cart} navigate={navigate} />
        )}
        {currentPage === 'login' && (
          <LoginPage navigate={navigate} />
        )}
        {currentPage === 'register' && (
          <RegisterPage navigate={navigate} />
        )}
        {currentPage === 'dashboard' && (
          <DashboardPage navigate={navigate} />
        )}
        {currentPage === 'admin' && (
          <AdminPage navigate={navigate} />
        )}
      </main>

      {showNav && currentPage !== 'cart' && currentPage !== 'checkout' && (
        <Footer navigate={navigate} />
      )}

      {/* Quick access bar (demo navigation) */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(31,41,55,0.92)', backdropFilter: 'blur(12px)',
        borderRadius: 100, padding: '6px 8px',
        display: 'flex', gap: 4, zIndex: 999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {([
          { page: 'home', icon: '🏠', label: 'Beranda' },
          { page: 'catalog', icon: '🛍️', label: 'Produk' },
          { page: 'cart', icon: '🛒', label: 'Keranjang' },
          { page: 'login', icon: '👤', label: 'Login' },
          { page: 'dashboard', icon: '📋', label: 'Akun' },
          { page: 'admin', icon: '⚙️', label: 'Admin' },
        ] as { page: Page; icon: string; label: string }[]).map(({ page, icon, label }) => (
          <button key={page} onClick={() => navigate(page)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 12px', borderRadius: 100, border: 'none',
            background: currentPage === page ? '#F97316' : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          title={label}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{ fontSize: '0.6rem', fontFamily: 'Poppins', fontWeight: 600, color: currentPage === page ? 'white' : 'rgba(255,255,255,0.6)' }}>{label}</span>
          </button>
        ))}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

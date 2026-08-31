import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";

export type Page =
  | "home"
  | "catalog"
  | "product-detail"
  | "cart"
  | "checkout"
  | "login"
  | "register"
  | "dashboard"
  | "admin";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

interface ToastProps {
  message: string;
  visible: boolean;
}

function Toast({ message, visible }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#1F2937",
        color: "white",
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        transform: visible ? "translateY(0)" : "translateY(80px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        pointerEvents: "none",
        maxWidth: 320,
      }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "#16A34A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
        ✓
      </div>

      <span
        style={{
          fontFamily: "Poppins",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}>
        {message}
      </span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| App Content
|--------------------------------------------------------------------------
*/

function AppContent() {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState<CartItem[]>([]);

  const [toast, setToast] = useState({
    message: "",
    visible: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Convert URL -> Page
  |--------------------------------------------------------------------------
  */

  const getCurrentPage = (): Page => {
    const path = location.pathname;

    if (path === "/") {
      return "home";
    }

    if (path === "/produk") {
      return "catalog";
    }

    if (path.startsWith("/produk/")) {
      return "product-detail";
    }

    if (path === "/keranjang") {
      return "cart";
    }

    if (path === "/checkout") {
      return "checkout";
    }

    if (path === "/login") {
      return "login";
    }

    if (path === "/register") {
      return "register";
    }

    if (path === "/dashboard") {
      return "dashboard";
    }

    if (path === "/admin") {
      return "admin";
    }

    return "home";
  };

  const currentPage = getCurrentPage();

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const navigate = (page: Page, data?: unknown) => {
    switch (page) {
      case "home":
        routerNavigate("/");
        break;

      case "catalog":
        routerNavigate("/produk");
        break;

      case "product-detail": {
        const product = data as CartItem;

        if (product?.id) {
          routerNavigate(`/produk/${product.id}`);
        }

        break;
      }

      case "cart":
        routerNavigate("/keranjang");
        break;

      case "checkout":
        routerNavigate("/checkout");
        break;

      case "login":
        routerNavigate("/login");
        break;

      case "register":
        routerNavigate("/register");
        break;

      case "dashboard":
        routerNavigate("/dashboard");
        break;

      case "admin":
        routerNavigate("/admin");
        break;

      default:
        routerNavigate("/");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Toast
  |--------------------------------------------------------------------------
  */

  const showToast = (message: string) => {
    setToast({
      message,
      visible: true,
    });

    setTimeout(() => {
      setToast((t) => ({
        ...t,
        visible: false,
      }));
    }, 2500);
  };

  /*
  |--------------------------------------------------------------------------
  | Add To Cart
  |--------------------------------------------------------------------------
  */

  const addToCart = (product: unknown) => {
    const p = product as CartItem;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id);

      if (existing) {
        return prev.map((item) =>
          item.id === p.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          category: p.category,
          quantity: 1,
        },
      ];
    });

    showToast(`${p.name.slice(0, 28)}... ditambahkan ke keranjang`);
  };

  const noNavPages: Page[] = ["login", "register", "admin"];
  const showNav = !noNavPages.includes(currentPage);

  const productId = location.pathname.startsWith("/produk/")
    ? location.pathname.split("/")[2]
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFF8F0",
        fontFamily: "Poppins, sans-serif",
      }}>
      {showNav && (
        <Navbar
          currentPage={currentPage}
          navigate={navigate}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        />
      )}

      <main className="fade-in" key={location.pathname}>
        <Routes>
          {/* HOME */}
          <Route
            path="/"
            element={<HomePage navigate={navigate} onAddToCart={addToCart} />}
          />

          {/* CATALOG */}
          <Route
            path="/produk"
            element={
              <CatalogPage navigate={navigate} onAddToCart={addToCart} />
            }
          />

          {/* PRODUCT DETAIL */}
          <Route
            path="/produk/:id"
            element={
              <ProductDetailPage
                product={{
                  id: Number(productId),
                }}
                navigate={navigate}
                onAddToCart={addToCart}
              />
            }
          />

          {/* CART */}
          <Route
            path="/keranjang"
            element={
              <CartPage cart={cart} setCart={setCart} navigate={navigate} />
            }
          />

          {/* CHECKOUT */}
          <Route
            path="/checkout"
            element={<CheckoutPage cart={cart} navigate={navigate} />}
          />

          {/* LOGIN */}
          <Route path="/login" element={<LoginPage navigate={navigate} />} />

          {/* REGISTER */}
          <Route
            path="/register"
            element={<RegisterPage navigate={navigate} />}
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={<DashboardPage navigate={navigate} />}
          />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminPage navigate={navigate} />} />
        </Routes>
      </main>

      {showNav && currentPage !== "cart" && currentPage !== "checkout" && (
        <Footer navigate={navigate} />
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

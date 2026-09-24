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
import HomePage from "./pages/navbar/HomePage";
import CatalogPage from "./pages/navbar/CatalogPage";
import AboutPage from "./pages/navbar/AboutPage";
import ContactPage from "./pages/navbar/ContactPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";

/* =========================================================
   PAGE TYPE
========================================================= */

export type Page =
  | "home"
  | "catalog"
  | "about"
  | "contact"
  | "product-detail"
  | "cart"
  | "checkout"
  | "login"
  | "register"
  | "dashboard"
  | "admin";

/* =========================================================
   CART TYPE
========================================================= */

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

/* =========================================================
   TOAST
========================================================= */

interface ToastProps {
  message: string;
  visible: boolean;
}

function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`
        fixed
        bottom-6
        right-6
        z-[9999]
        flex
        max-w-[320px]
        items-center
        gap-2.5
        rounded-xl
        bg-gray-800
        px-5
        py-3.5
        text-white
        shadow-[0_8px_32px_rgba(0,0,0,0.15)]
        transition-all
        duration-300
        ease-[cubic-bezier(0.34,1.56,0.64,1)]
        pointer-events-none

        ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-20 opacity-0"
        }
      `}
    >
      {/* Icon */}
      <div
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-green-600
          text-sm
          font-bold
        "
      >
        ✓
      </div>

      {/* Message */}
      <span className="font-[Poppins] text-sm font-medium">
        {message}
      </span>
    </div>
  );
}

/* =========================================================
   APP CONTENT
========================================================= */

function AppContent() {
  const routerNavigate = useNavigate();
  const location = useLocation();

  /* =======================================================
     STATE
  ======================================================= */

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [toast, setToast] = useState({
    message: "",
    visible: false,
  });

  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  const getCurrentPage = (): Page => {
    const path = location.pathname
      .toLowerCase()
      .replace(/\/$/, "");

    if (path === "" || path === "/") {
      return "home";
    }

    if (path === "/produk") {
      return "catalog";
    }

    if (path === "/tentang") {
      return "about";
    }

    if (path === "/kontak") {
      return "contact";
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

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (message: string) => {
    setToast({
      message,
      visible: true,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
      }));
    }, 3000);
  };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = (page: Page, data?: unknown) => {
    switch (page) {
      case "home":
        routerNavigate("/");
        break;

      case "catalog":
        routerNavigate("/produk");
        break;

      case "about":
        routerNavigate("/tentang");
        break;

      case "contact":
        routerNavigate("/kontak");
        break;

      case "product-detail": {
        const product = data as CartItem;

        if (product?.id) {
          routerNavigate(`/produk/${product.id}`);
        }

        break;
      }

      case "cart":
        if (!isLoggedIn) {
          routerNavigate("/login");
        } else {
          routerNavigate("/keranjang");
        }
        break;

      case "checkout":
        if (!isLoggedIn) {
          routerNavigate("/login");
        } else {
          routerNavigate("/checkout");
        }
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

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const addToCart = (product: unknown) => {
    if (!isLoggedIn) {
      navigate("login");
      return;
    }

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
            : item
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

  /* =======================================================
     NAVBAR VISIBILITY
  ======================================================= */

  const noNavPages: Page[] = [
    "login",
    "register",
    "admin",
  ];

  const showNav = !noNavPages.includes(currentPage);

  /* =======================================================
     PRODUCT ID
  ======================================================= */

  const productId = location.pathname.startsWith("/produk/")
    ? location.pathname.split("/")[2]
    : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        bg-[#FFF8F0]
        font-[Poppins,sans-serif]
      "
    >
      {/* ===================================================
          NAVBAR
      =================================================== */}

      {showNav && (
        <Navbar
          currentPage={currentPage}
          navigate={navigate}
          cartCount={cart.reduce(
            (sum, item) => sum + item.quantity,
            0
          )}
        />
      )}

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main
        key={location.pathname}
        className="
          fade-in
        "
      >
        <Routes>
          {/* HOME */}
          <Route
            path="/"
            element={
              <HomePage
                navigate={navigate}
                onAddToCart={addToCart}
              />
            }
          />

          {/* CATALOG */}
          <Route
            path="/produk"
            element={
              <CatalogPage
                navigate={navigate}
                onAddToCart={addToCart}
              />
            }
          />

          {/* ABOUT */}
          <Route
            path="/tentang"
            element={
              <AboutPage
                navigate={navigate}
              />
            }
          />

          {/* CONTACT */}
          <Route
            path="/kontak"
            element={
              <ContactPage
                navigate={navigate}
              />
            }
          />

          {/* PRODUCT DETAIL */}
          <Route
            path="/produk/:id"
            element={
              <ProductDetailPage
                product={{
                  id: Number(productId),
                } as any}
                navigate={navigate}
                onAddToCart={addToCart}
              />
            }
          />

          {/* CART */}
          <Route
            path="/keranjang"
            element={
              <CartPage
                cart={cart}
                setCart={setCart}
                navigate={navigate}
              />
            }
          />

          {/* CHECKOUT */}
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                cart={cart}
                navigate={navigate}
              />
            }
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <LoginPage
                navigate={navigate}
              />
            }
          />

          {/* REGISTER */}
          <Route
            path="/register"
            element={
              <RegisterPage
                navigate={navigate}
              />
            }
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                navigate={navigate}
              />
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <AdminPage
                navigate={navigate}
              />
            }
          />
        </Routes>
      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      {showNav &&
        currentPage !== "cart" &&
        currentPage !== "checkout" && (
          <Footer navigate={navigate} />
        )}

      {/* ===================================================
          TOAST
      =================================================== */}

      <Toast
        message={toast.message}
        visible={toast.visible}
      />
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
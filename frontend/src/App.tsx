import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
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
import PaymentPage from "./pages/PaymentPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage from "./pages/navbar/profil/DashboardPage";
import AdminPage from "./pages/AdminPage";
import { apiFetch } from "./api/client";

/* =========================================================
   TYPES & KONSTANTA
========================================================= */

export type Page =
  | "home"
  | "catalog"
  | "about"
  | "contact"
  | "product-detail"
  | "cart"
  | "checkout"
  | "payment"
  | "login"
  | "register"
  | "dashboard"
  | "admin";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: {
    id: number;
    name: string;
    price: string | number;
    stock: number;
    weight: number;
    image?: string | null;
    category?: { id: number; name: string };
    images?: { id: number; path: string; url?: string; is_primary?: boolean }[];
  };
}

interface CartAddProduct {
  id: number;
  name: string;
  quantity?: number;
}

const PATHS: Record<Exclude<Page, "product-detail">, string> = {
  home: "/",
  catalog: "/produk",
  about: "/tentang",
  contact: "/kontak",
  cart: "/keranjang",
  checkout: "/checkout",
  payment: "/pembayaran",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  admin: "/admin",
};

const NO_NAV_PAGES: Page[] = ["login", "register", "admin"];
const NO_FOOTER_PAGES: Page[] = ["cart", "checkout"];

function getPageFromPath(pathname: string): Page {
  const path = pathname.toLowerCase().replace(/\/$/, "") || "/";

  if (path.startsWith("/produk/")) return "product-detail";
  if (path.startsWith("/pembayaran/")) return "payment";

  const keys = Object.keys(PATHS) as (keyof typeof PATHS)[];
  return keys.find((key) => PATHS[key] === path) ?? "home";
}

function isCartAddProduct(value: unknown): value is CartAddProduct {
  const p = value as Partial<CartAddProduct> | null;

  return (
    typeof p?.id === "number" &&
    typeof p.name === "string" &&
    (p.quantity === undefined ||
      (Number.isInteger(p.quantity) && p.quantity >= 1))
  );
}

/* =========================================================
   ROUTE GUARDS (layout route: cukup satu kali dipasang)
========================================================= */

const hasToken = () => !!localStorage.getItem("token");

/**
 * Token diverifikasi ke server (/auth/me), jadi token palsu atau
 * kedaluwarsa ditolak. Dengan adminOnly, role juga dicek.
 */
function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const location = useLocation();
  const [status, setStatus] = useState<
    "checking" | "allowed" | "unauthenticated" | "forbidden"
  >(hasToken() ? "checking" : "unauthenticated");

  useEffect(() => {
    if (!hasToken()) return setStatus("unauthenticated");

    let cancelled = false;

    apiFetch<{ data: { user: { role: string } } }>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;

        localStorage.setItem("user", JSON.stringify(data.user));
        const isAdmin = data.user.role?.toLowerCase() === "admin";
        setStatus(adminOnly && !isAdmin ? "forbidden" : "allowed");
      })
      .catch(() => {
        if (cancelled) return;

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, [adminOnly]);

  if (status === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        Memuat...
      </div>
    );
  }

  if (status === "allowed") return <Outlet />;

  return status === "forbidden" ? (
    <Navigate to="/" replace />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

/** Login/register: user yang sudah login diarahkan ke beranda. */
function GuestRoute() {
  return hasToken() ? <Navigate to="/" replace /> : <Outlet />;
}

/* =========================================================
   TOAST
========================================================= */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-6 right-6 z-[9999] flex max-w-[320px] items-center gap-2.5 rounded-xl bg-gray-800 px-5 py-3.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600 text-sm font-bold">
        ✓
      </div>
      <span className="font-[Poppins] text-sm font-medium">{message}</span>
    </div>
  );
}

/* =========================================================
   APP CONTENT
========================================================= */

function AppContent() {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState({ message: "", visible: false });

  const currentPage = getPageFromPath(location.pathname);
  const showNav = !NO_NAV_PAGES.includes(currentPage);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Timer otomatis di-reset kalau toast baru muncul, dan dibersihkan saat unmount.
  useEffect(() => {
    if (!toast.visible) return;

    const timer = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      3000
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => setToast({ message, visible: true });

  const navigate = (page: Page, data?: unknown) => {
    const { id, orderId, categoryId } = (data ?? {}) as {
      id?: number;
      orderId?: number;
      categoryId?: number;
    };

    const target =
      page === "product-detail"
        ? id && `/produk/${id}`
        : page === "payment"
          ? orderId && `/pembayaran/${orderId}`
          : page === "catalog" && categoryId
            ? `${PATHS.catalog}?kategori=${categoryId}`
            : PATHS[page];

    if (!target) return;

    routerNavigate(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = async (product: unknown): Promise<boolean> => {
    if (!hasToken()) {
      navigate("login");
      return false;
    }

    if (!isCartAddProduct(product)) {
      showToast("Data produk tidak valid.");
      return false;
    }

    try {
      await apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          quantity: product.quantity ?? 1,
        }),
      });

      // Ambil ulang dari server agar state mengikuti bentuk data API.
      const response = await apiFetch<{ data?: { items?: CartItem[] } }>("/cart");
      setCart(response.data?.items ?? []);

      const name =
        product.name.length > 28 ? `${product.name.slice(0, 28)}...` : product.name;
      showToast(`${name} ditambahkan ke keranjang`);
      return true;
    } catch (error) {
      console.error("Gagal menambahkan ke keranjang:", error);
      showToast(
        error instanceof Error ? error.message : "Gagal menambahkan ke keranjang."
      );
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-[Poppins,sans-serif]">
      {showNav && (
        <Navbar
          currentPage={currentPage}
          navigate={navigate}
          cartCount={cartCount}
        />
      )}

      <main
        key={location.pathname}
        className={currentPage === "admin" ? undefined : "fade-in"}
      >
        <Routes>
          {/* Publik */}
          <Route
            path="/"
            element={<HomePage navigate={navigate} onAddToCart={addToCart} />}
          />
          <Route
            path="/produk"
            element={<CatalogPage navigate={navigate} onAddToCart={addToCart} />}
          />
          <Route path="/produk/:id" element={<ProductDetailPage navigate={navigate} onAddToCart={addToCart} />} />
          <Route path="/tentang" element={<AboutPage navigate={navigate} />} />
          <Route path="/kontak" element={<ContactPage navigate={navigate} />} />

          {/* Hanya tamu (belum login) */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage navigate={navigate} />} />
            <Route path="/register" element={<RegisterPage navigate={navigate} />} />
          </Route>

          {/* Wajib login */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/keranjang"
              element={<CartPage cart={cart} setCart={setCart} navigate={navigate} />}
            />
            <Route
              path="/checkout"
              element={
                <CheckoutPage
                  cart={cart}
                  navigate={navigate}
                  onOrderPlaced={() => setCart([])}
                />
              }
            />
            <Route path="/pembayaran/:orderId" element={<PaymentPage navigate={navigate} />} />
            <Route path="/dashboard" element={<DashboardPage navigate={navigate} />} />
          </Route>

          {/* Wajib login + role admin */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminPage navigate={navigate} />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showNav && !NO_FOOTER_PAGES.includes(currentPage) && (
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
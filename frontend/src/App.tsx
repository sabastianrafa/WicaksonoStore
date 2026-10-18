import { useState, useEffect, type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import { apiFetch } from "./api/client";

/* =========================================================
   TYPES
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

/*
| Bentuk item keranjang harus sama dengan API (/api/cart) dan dengan
| CartPage. Sebelumnya App memakai bentuk datar sendiri sehingga
| TypeScript melaporkan dua tipe 'CartItem' yang tidak berkaitan, dan
| halaman /keranjang bisa merender item tanpa `product`.
*/
interface CartProduct {
  id: number;
  name: string;
  price: string | number;
  stock: number;
  image?: string | null;
  category?: { id: number; name: string };
  images?: { id: number; path: string; url?: string; is_primary?: boolean }[];
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  subtotal: number;
  product: CartProduct;
}

interface CartAddProduct {
  id: number;
  name: string;
  quantity?: number;
}

interface MeResponse {
  data: { user: { role: string } };
}

/* =========================================================
   AUTH HELPERS
========================================================= */

const hasToken = () => !!localStorage.getItem("token");

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/* =========================================================
   ROUTE GUARDS
========================================================= */

/**
 * Halaman khusus user yang sudah login.
 * Token diverifikasi ke server (/auth/me), jadi token palsu atau
 * kedaluwarsa akan ditolak. Dengan adminOnly, role juga dicek.
 */
function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const location = useLocation();
  const [status, setStatus] = useState<
    "checking" | "allowed" | "unauthenticated" | "forbidden"
  >(hasToken() ? "checking" : "unauthenticated");

  useEffect(() => {
    if (!hasToken()) {
      setStatus("unauthenticated");
      return;
    }

    let cancelled = false;

    apiFetch<MeResponse>("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;

        localStorage.setItem("user", JSON.stringify(data.user));

        const isAdmin = data.user.role?.toLowerCase() === "admin";
        setStatus(adminOnly && !isAdmin ? "forbidden" : "allowed");
      })
      .catch(() => {
        if (cancelled) return;

        clearSession();
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

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status === "forbidden") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/** Halaman login/register: user yang sudah login diarahkan ke beranda. */
function GuestRoute({ children }: { children: ReactNode }) {
  return hasToken() ? <Navigate to="/" replace /> : <>{children}</>;
}

/* =========================================================
   TOAST
========================================================= */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`pointer-events-none fixed bottom-6 right-6 z-[9999] flex max-w-[320px] items-center gap-2.5 rounded-xl bg-gray-800 px-5 py-3.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
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

function AppContent() {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState({ message: "", visible: false });

  /* ---------- Halaman aktif ---------- */

  const getCurrentPage = (): Page => {
    const path = location.pathname.toLowerCase().replace(/\/$/, "") || "/";

    if (path.startsWith("/produk/")) return "product-detail";
    if (path.startsWith("/pembayaran/")) return "payment";

    const match = Object.entries(PATHS).find(([, p]) => p === path);
    return (match?.[0] as Page) ?? "home";
  };

  const currentPage = getCurrentPage();

  /* ---------- Toast ---------- */

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  /* ---------- Navigasi ---------- */
  // Proteksi cart/checkout/dashboard/admin ditangani ProtectedRoute,
  // jadi tidak perlu dicek lagi di sini.

  const navigate = (page: Page, data?: unknown) => {
    if (page === "product-detail") {
      const product = data as CartItem;
      if (product?.id) routerNavigate(`/produk/${product.id}`);
    } else if (page === "payment") {
      const orderId = (data as { orderId?: number } | undefined)?.orderId;
      if (orderId) routerNavigate(`/pembayaran/${orderId}`);
    } else if (page === "catalog") {
      /*
      | HomePage mengirim { categoryId } saat kategori diklik. Tanpa ini
      | datanya dibuang dan katalog terbuka tanpa filter.
      */
      const categoryId = (data as { categoryId?: number } | undefined)?.categoryId;

      routerNavigate(
        categoryId
          ? `/produk?kategori=${categoryId}`
          : PATHS[page] ?? "/"
      );
    } else {
      routerNavigate(PATHS[page] ?? "/");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- Keranjang ---------- */

  const addToCart = async (product: unknown): Promise<boolean> => {
    if (!hasToken()) {
      navigate("login");
      return false;
    }

    if (
      typeof product !== "object" ||
      product === null ||
      !("id" in product) ||
      typeof product.id !== "number" ||
      !("name" in product) ||
      typeof product.name !== "string" ||
      ("quantity" in product &&
        (typeof product.quantity !== "number" ||
          !Number.isInteger(product.quantity) ||
          product.quantity < 1))
    ) {
      console.error("Gagal menambahkan ke keranjang: data produk tidak valid.");
      showToast("Data produk tidak valid.");
      return false;
    }

    const p: CartAddProduct = product;

    /*
    | Keranjang disimpan di server (POST /api/cart/items). Sebelumnya
    | hanya mengubah state lokal, sehingga:
    | - item tidak pernah masuk ke database,
    | - state lokal berisi bentuk data berbeda dari CartPage,
    |   sehingga /keranjang bisa render putih.
    */
    try {
      await apiFetch<{ success: boolean; message: string }>("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          product_id: p.id,
          quantity: p.quantity ?? 1,
        }),
      });

      // Ambil ulang keranjang dari server agar state mengikuti bentuk API.
      const response = await apiFetch<{ data?: { items?: CartItem[] } }>("/cart");
      setCart(response.data?.items ?? []);
      showToast(`${p.name.slice(0, 28)}... ditambahkan ke keranjang`);
      return true;
    } catch (error) {
      console.error("Gagal menambahkan ke keranjang:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal menambahkan ke keranjang."
      );
      return false;
    }
  };

  /* ---------- Render ---------- */

  const showNav = !NO_NAV_PAGES.includes(currentPage);
  const productId = location.pathname.startsWith("/produk/")
    ? location.pathname.split("/")[2]
    : null;

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-[Poppins,sans-serif]">
      {showNav && (
        <Navbar
          currentPage={currentPage}
          navigate={navigate}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        />
      )}

      <main
        key={location.pathname}
        className={currentPage === 'admin' ? undefined : 'fade-in'}
      >
        <Routes>
          {/* ===== Publik ===== */}
          <Route
            path="/"
            element={<HomePage navigate={navigate} onAddToCart={addToCart} />}
          />
          <Route
            path="/produk"
            element={<CatalogPage navigate={navigate} onAddToCart={addToCart} />}
          />
          <Route path="/tentang" element={<AboutPage navigate={navigate} />} />
          <Route path="/kontak" element={<ContactPage navigate={navigate} />} />
          <Route
            path="/produk/:id"
            element={
              <ProductDetailPage
                navigate={navigate}
                onAddToCart={addToCart}
              />
            }
          />

          {/* ===== Hanya tamu (belum login) ===== */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage navigate={navigate} />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage navigate={navigate} />
              </GuestRoute>
            }
          />

          {/* ===== Wajib login ===== */}
          <Route
            path="/keranjang"
            element={
              <ProtectedRoute>
                <CartPage cart={cart} setCart={setCart} navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage
                  cart={cart}
                  navigate={navigate}
                  onOrderPlaced={() => setCart([])}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pembayaran/:orderId"
            element={
              <ProtectedRoute>
                <PaymentPage navigate={navigate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage navigate={navigate} />
              </ProtectedRoute>
            }
          />

          {/* ===== Wajib login + role admin ===== */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage navigate={navigate} />
              </ProtectedRoute>
            }
          />

          {/* URL tidak dikenal */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
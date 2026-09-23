import { useState, useEffect } from "react";
import type { Page } from "../App";
import { FaShoppingCart } from "react-icons/fa";

interface NavbarProps {
  currentPage: Page;
  navigate: (page: Page) => void;
  cartCount: number;
}

export default function Navbar({
  currentPage,
  navigate,
  cartCount,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: { label: string; page: Page }[] = [
    { label: "Beranda", page: "home" },
    { label: "Produk", page: "catalog" },
    { label: "Tentang Kami", page: "about" },
    { label: "Kontak", page: "contact" },
  ];

  const handleNavigate = (page: Page) => {
    navigate(page);
    setMenuOpen(false);
  };

  return (
    <>
      <style>{`
        /* 1. Pemisah Visual: Shadow & Border diatur lebih tegas */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: ${scrolled ? "rgba(255, 255, 255, 0.98)" : "rgba(255,248,240,0.95)"};
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(223, 64, 31, ${scrolled ? "0.15" : "0.08"});
          box-shadow: ${scrolled ? "0 4px 16px rgba(0,0,0,0.06)" : "none"};
          transition: all 0.3s ease;
        }

        .nav-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        .nav-content { display: flex; align-items: center; justify-content: space-between; height: ${scrolled ? "70px" : "86px"}; transition: height 0.3s; }
        
        .logo-img { height: ${scrolled ? "48px" : "56px"}; transition: 0.3s; cursor: pointer; }
        
        /* 2. Indikator Menu Aktif Desktop */
        .nav-link {
          position: relative;
          background: none; border: none; cursor: pointer;
          padding: 8px 12px; border-radius: 6px;
          font-family: "Poppins", sans-serif; font-weight: 500; font-size: 0.95rem;
          color: #374151; transition: 0.2s;
        }
        .nav-link:hover, .nav-link.active { color: #DF401F; }
        .nav-link::after {
          content: ''; position: absolute; width: 0; height: 2px;
          bottom: 2px; left: 50%; background: #DF401F;
          transition: all 0.3s ease; transform: translateX(-50%); border-radius: 2px;
        }
        .nav-link:hover::after, .nav-link.active::after { width: 60%; } /* Garis bawah elegan */

        /* 3 & 4. Kerapatan Aksi & Gaya Tombol Modern */
        .action-group { display: flex; align-items: center; gap: 16px; } /* Jarak lega antara cart & hamburger/auth */
        .auth-group { display: flex; align-items: center; gap: 10px; } /* Jarak rapat antara tombol masuk & daftar */
        
        .btn { 
          padding: 8px 20px; border-radius: 8px; /* Mengganti gaya kapsul menjadi 8px */
          font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: 0.2s; border: none; 
          font-family: "Poppins", sans-serif;
        }
        .btn-outline { background: transparent; color: #DF401F; border: 1.5px solid #DF401F; }
        .btn-outline:hover { background: rgba(223, 64, 31, 0.05); }
        .btn-primary { background: #DF401F; color: white; border: 1.5px solid #DF401F; }
        .btn-primary:hover { background: #c53517; border-color: #c53517; box-shadow: 0 4px 10px rgba(223,64,31,0.2); }

        /* Cart */
        .cart-btn {
          position: relative; background: transparent; border: none; cursor: pointer;
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center; 
        }
        
        /* Tambahkan transisi khusus pada ikon (svg) di dalam tombol */
        .cart-btn svg {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
        }

        /* Saat di-hover, ikon membesar dan warnanya berubah opsional */
        .cart-btn:hover { background: transparent; }
        .cart-btn:hover svg {
          transform: scale(1.25); /* Ikon membesar 25% */
          color: #DF401F !important; /* (Opsional) Berubah oranye saat di-hover */
        }

        .cart-badge {
          position: absolute; top: -2px; right: -2px;
          background: #DF401F; color: white; font-size: 0.7rem; font-weight: bold;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Hamburger Mobile */
        .hamburger {
          display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px;
        }
        .hamburger span {
          display: block; width: 24px; height: 2.5px; background: #374151; border-radius: 3px; transition: 0.3s;
        }
        .hamburger.open span:nth-child(1) { transform: translateY(7.5px) rotate(45deg); background: #DF401F; }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: translateY(-7.5px) rotate(-45deg); background: #DF401F; }

        /* Mobile Menu */
        .mobile-menu {
          overflow: hidden; max-height: ${menuOpen ? "400px" : "0"}; opacity: ${menuOpen ? "1" : "0"};
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-menu-inner { padding: 8px 0 24px; border-top: 1px solid rgba(223,64,31,0.08); }
        .mobile-link {
          display: block; width: 100%; text-align: left; padding: 14px 16px; margin-bottom: 4px;
          background: transparent; border: none; border-radius: 8px; font-weight: 500; color: #374151; font-size: 1rem;
        }
        .mobile-link.active { color: #DF401F; background: rgba(223,64,31,0.05); font-weight: 600; }

        .flex-center { display: flex; align-items: center; gap: 8px; }
        .mobile-only { display: none; }

        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: flex; }
          .hamburger { display: flex; }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            {/* Logo */}
            <img
              src="/images/logo/wicaksono_logo_2.webp"
              alt="Wicaksono Logo"
              className="logo-img"
              onClick={() => handleNavigate("home")}
            />

            {/* Desktop Nav */}
            <div className="flex-center desktop-only" style={{ gap: "12px" }}>
              {navLinks.map(({ label, page }) => (
                <button
                  key={label}
                  onClick={() => handleNavigate(page)}
                  className={`nav-link ${currentPage === page ? "active" : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Aksi Kanan */}
            <div className="action-group">
              {/* Cart Button */}
              <button
                className="cart-btn"
                onClick={() => handleNavigate("cart")}>
                <FaShoppingCart size={22} color="#374151" />
                {cartCount > 0 && (
                  <span className="cart-badge">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* Desktop Auth */}
              <div className="auth-group desktop-only">
                <button
                  className="btn btn-outline"
                  onClick={() => handleNavigate("login")}>
                  Masuk
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleNavigate("register")}>
                  Daftar
                </button>
              </div>

              {/* Mobile Hamburger */}
              <button
                className={`hamburger ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}>
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className="mobile-menu">
            <div className="mobile-menu-inner">
              {navLinks.map(({ label, page }) => (
                <button
                  key={label}
                  onClick={() => handleNavigate(page)}
                  className={`mobile-link ${currentPage === page ? "active" : ""}`}>
                  {label}
                </button>
              ))}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "16px 16px 0",
                }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "12px" }}
                  onClick={() => handleNavigate("login")}>
                  Masuk
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "12px" }}
                  onClick={() => handleNavigate("register")}>
                  Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

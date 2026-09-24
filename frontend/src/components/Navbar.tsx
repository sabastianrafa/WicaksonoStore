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
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md border-b ${
        scrolled
          ? "bg-white/95 border-[#DF401F]/15 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          : "bg-[#FFF8F0]/95 border-[#DF401F]/10"
      }`}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            scrolled ? "h-[70px]" : "h-[86px]"
          }`}>
          {/* Logo */}
          <img
            src="/images/logo/wicaksono_logo_2.webp"
            alt="Wicaksono Logo"
            onClick={() => handleNavigate("home")}
            className={`cursor-pointer w-auto object-contain transition-all duration-300 ${
              scrolled ? "h-12" : "h-14"
            }`}
          />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            {navLinks.map(({ label, page }) => {
              const isActive = currentPage === page;
              return (
                <button
                  key={label}
                  onClick={() => handleNavigate(page)}
                  className={`group relative px-3 py-2 rounded-md font-medium text-[0.95rem] transition-colors duration-200 ${
                    isActive
                      ? "text-[#DF401F]"
                      : "text-gray-700 hover:text-[#DF401F]"
                  }`}>
                  {label}
                  {/* Efek Garis Bawah (Underline Animasi) */}
                  <span
                    className={`absolute bottom-1 left-1/2 h-[2px] bg-[#DF401F] rounded-sm -translate-x-1/2 transition-all duration-300 ${
                      isActive ? "w-[60%]" : "w-0 group-hover:w-[60%]"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Aksi Kanan */}
          <div className="flex items-center gap-4">
            {/* Cart Button */}
            <button
              onClick={() => handleNavigate("cart")}
              className="relative flex items-center justify-center w-11 h-11 bg-transparent border-none cursor-pointer group">
              <FaShoppingCart
                size={22}
                className="text-gray-700 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-125 group-hover:text-[#DF401F]"
              />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#DF401F] text-white text-[0.7rem] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={() => handleNavigate("login")}
                className="px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 border-[1.5px] border-[#DF401F] text-[#DF401F] bg-transparent hover:bg-[#DF401F]/5">
                Masuk
              </button>
              <button
                onClick={() => handleNavigate("register")}
                className="px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 border-[1.5px] border-[#DF401F] bg-[#DF401F] text-white hover:bg-[#c53517] hover:border-[#c53517] hover:shadow-[0_4px_10px_rgba(223,64,31,0.2)]">
                Daftar
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-[5px] p-1.5 bg-transparent border-none cursor-pointer md:hidden">
              <span
                className={`block w-6 h-[2.5px] rounded-sm transition-all duration-300 ${
                  menuOpen
                    ? "translate-y-[7.5px] rotate-45 bg-[#DF401F]"
                    : "bg-gray-700"
                }`}
              />
              <span
                className={`block w-6 h-[2.5px] rounded-sm transition-all duration-300 bg-gray-700 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block w-6 h-[2.5px] rounded-sm transition-all duration-300 ${
                  menuOpen
                    ? "-translate-y-[7.5px] -rotate-45 bg-[#DF401F]"
                    : "bg-gray-700"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className="md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            maxHeight: menuOpen ? "400px" : "0",
            opacity: menuOpen ? 1 : 0,
          }}>
          <div className="py-2 pb-6 border-t border-[#DF401F]/10">
            {navLinks.map(({ label, page }) => {
              const isActive = currentPage === page;
              return (
                <button
                  key={label}
                  onClick={() => handleNavigate(page)}
                  className={`block w-full text-left px-4 py-3.5 mb-1 rounded-lg text-base transition-colors ${
                    isActive
                      ? "text-[#DF401F] bg-[#DF401F]/5 font-semibold"
                      : "text-gray-700 font-medium bg-transparent"
                  }`}>
                  {label}
                </button>
              );
            })}

            <div className="flex gap-3 px-4 pt-4">
              <button
                onClick={() => handleNavigate("login")}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border-[1.5px] border-[#DF401F] text-[#DF401F] bg-transparent hover:bg-[#DF401F]/5">
                Masuk
              </button>
              <button
                onClick={() => handleNavigate("register")}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border-[1.5px] border-[#DF401F] bg-[#DF401F] text-white hover:bg-[#c53517] hover:border-[#c53517]">
                Daftar
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
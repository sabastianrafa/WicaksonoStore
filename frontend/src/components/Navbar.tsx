import { useState } from "react";
import type { Page } from "../App";

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

  const navLinks: { label: string; page: Page }[] = [
    { label: "Beranda", page: "home" },
    { label: "Produk", page: "catalog" },
    { label: "Kategori", page: "catalog" },
    { label: "Tentang", page: "home" },
    { label: "Kontak", page: "home" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255,248,240,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(249,115,22,0.12)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 80,
          }}>
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}>
            <img
              src="/images/logo/wicaksono_logo_2.webp"
              alt="Wicaksono Oleh-Oleh Khas Malang"
              style={{
                width: "auto",
                height: 64,
                maxWidth: 220,
                objectFit: "contain",
                display: "block",
              }}
            />
          </button>

          {/* Desktop Nav */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 4 }}
            className="hidden-mobile">
            {navLinks.map(({ label, page }) => (
              <button
                key={label}
                onClick={() => navigate(page)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  color:
                    currentPage === page && label === "Beranda"
                      ? "#DE3E1D"
                      : "#374151",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = "#DE3E1D";
                  (e.target as HTMLElement).style.background =
                    "rgba(249,115,22,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "#374151";
                  (e.target as HTMLElement).style.background = "transparent";
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Cart */}
            <button
              onClick={() => navigate("cart")}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                width: 40,
                height: 40,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background =
                  "rgba(249,115,22,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}>
              <span style={{ fontSize: 20 }}>🛒</span>
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "#DE3E1D",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            <div style={{ display: "flex", gap: 8 }} className="hidden-mobile">
              <button
                onClick={() => navigate("login")}
                className="btn-outline"
                style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                Masuk
              </button>
              <button
                onClick={() => navigate("register")}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                Daftar
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "none",
                flexDirection: "column",
                gap: 5,
                padding: 8,
              }}
              className="show-mobile">
              <span
                style={{
                  display: "block",
                  width: 22,
                  height: 2,
                  background: "#374151",
                  borderRadius: 2,
                  transition: "all 0.2s",
                  transform: menuOpen
                    ? "rotate(45deg) translate(5px,5px)"
                    : "none",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: 22,
                  height: 2,
                  background: "#374151",
                  borderRadius: 2,
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: "block",
                  width: 22,
                  height: 2,
                  background: "#374151",
                  borderRadius: 2,
                  transition: "all 0.2s",
                  transform: menuOpen
                    ? "rotate(-45deg) translate(5px,-5px)"
                    : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              paddingBottom: 16,
              borderTop: "1px solid rgba(249,115,22,0.12)",
              paddingTop: 12,
            }}>
            {navLinks.map(({ label, page }) => (
              <button
                key={label}
                onClick={() => {
                  navigate(page);
                  setMenuOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: "#374151",
                }}>
                {label}
              </button>
            ))}
            <div style={{ display: "flex", gap: 8, padding: "8px 16px 0" }}>
              <button
                onClick={() => {
                  navigate("login");
                  setMenuOpen(false);
                }}
                className="btn-outline"
                style={{ flex: 1, padding: "10px", fontSize: "0.875rem" }}>
                Masuk
              </button>
              <button
                onClick={() => {
                  navigate("register");
                  setMenuOpen(false);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: "10px", fontSize: "0.875rem" }}>
                Daftar
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

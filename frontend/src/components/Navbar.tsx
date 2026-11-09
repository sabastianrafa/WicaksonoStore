import { useEffect, useState } from "react"
import { FiMenu, FiShoppingBag, FiX } from "react-icons/fi"
import type { Page } from "../App"
import { apiFetch } from "../api/client"

interface NavbarProps {
  currentPage: Page
  navigate: (page: Page) => void
  cartCount: number
}

interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role: string
}

interface MeResponse {
  success: boolean
  message: string
  data: { user: User }
}

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: "Beranda", page: "home" },
  { label: "Produk", page: "catalog" },
  { label: "Tentang Kami", page: "about" },
  { label: "Kontak", page: "contact" },
]

const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export default function Navbar({
  currentPage,
  navigate,
  cartCount,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const isAdmin = user?.role?.toLowerCase() === "admin"

  useEffect(() => {
    let active = true
    const checkAuth = async () => {
      if (!localStorage.getItem("token")) {
        setAuthLoading(false)
        return
      }
      try {
        const { data } = await apiFetch<MeResponse>("/auth/me")
        if (!active) return
        setUser(data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
      } catch (error) {
        console.error("Session login tidak valid:", error)
        clearSession()
        if (active) setUser(null)
      } finally {
        if (active) setAuthLoading(false)
      }
    }
    checkAuth()
    return () => {
      active = false
    }
  }, [])

  const handleNavigate = (page: Page) => {
    navigate(page)
    setMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      if (localStorage.getItem("token"))
        await apiFetch("/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout API error:", error)
    } finally {
      clearSession()
      setUser(null)
      handleNavigate("home")
    }
  }

  const authActions = (mobile = false) => {
    const buttonClass = mobile ? "w-full justify-center" : ""
    const baseClass =
      "inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DF401F]"
    const outlineClass = `${baseClass} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 ${buttonClass}`
    const solidClass = `${baseClass} bg-[#DF401F] text-white hover:bg-[#C9361B] ${buttonClass}`

    if (!user)
      return (
        <>
          <button
            onClick={() => handleNavigate("login")}
            className={outlineClass}
          >
            Masuk
          </button>
          <button
            onClick={() => handleNavigate("register")}
            className={solidClass}
          >
            Daftar
          </button>
        </>
      )
    if (isAdmin)
      return (
        <button
          onClick={() => handleNavigate("admin")}
          className={outlineClass}
        >
          Admin
        </button>
      )
    return (
      <>
        <button
          onClick={() => handleNavigate("dashboard")}
          className={outlineClass}
        >
          Profil
        </button>
        <button onClick={handleLogout} className={solidClass}>
          Keluar
        </button>
      </>
    )
  }

  const navLinks = (mobile = false) =>
    NAV_LINKS.map(({ label, page }) => {
      const active = currentPage === page
      return (
        <button
          key={page}
          onClick={() => handleNavigate(page)}
          aria-current={active ? "page" : undefined}
          className={`${
            mobile
              ? "w-full border-b border-gray-100 px-1 py-3 text-left"
              : "px-3 py-2"
          } text-sm font-medium transition-colors ${
            active ? "text-[#DF401F]" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {label}
        </button>
      )
    })

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          onClick={() => handleNavigate("home")}
          aria-label="Wicaksono Store, beranda"
          className="shrink-0"
        >
          <img
            src="/images/logo/wicaksono_logo_2.webp"
            alt="Wicaksono Store"
            className="h-14 w-auto object-contain"
          />
        </button>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 lg:flex"
        >
          {navLinks()}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate("cart")}
            aria-label={`Keranjang, ${cartCount} produk`}
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50 hover:text-[#DF401F]"
          >
            <FiShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DF401F] px-1 text-[11px] font-semibold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
          {!authLoading && (
            <div className="hidden items-center gap-2 lg:flex">
              {authActions()}
            </div>
          )}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50 lg:hidden"
          >
            {menuOpen ? <FiX size={21} /> : <FiMenu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Navigasi seluler">{navLinks(true)}</nav>
          {!authLoading && (
            <div className="mt-4 flex flex-col gap-2">{authActions(true)}</div>
          )}
        </div>
      )}
    </header>
  )
}

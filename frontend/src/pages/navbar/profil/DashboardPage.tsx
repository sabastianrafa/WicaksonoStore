import { useEffect, useRef, useState } from "react"
import type { Page } from "../../../App"
import { apiFetch } from "../../../api/client"
import AddressesMenu from "./AddressesMenu"
import OrdersMenu from "./OrdersMenu"
import ProfileMenu, {
  type ProfileFields,
  type ProfileUser,
} from "./ProfileMenu"
import WishlistMenu from "./WishlistMenu"

interface Props {
  navigate: (page: Page) => void
}
interface MenuItem {
  id: "profil" | "pesanan" | "wishlist" | "alamat"
  label: string
  icon: string
}
const menus: MenuItem[] = [
  { id: "profil", label: "Profil Saya", icon: "👤" },
  { id: "pesanan", label: "Riwayat Pesanan", icon: "📦" },
  { id: "wishlist", label: "Wishlist", icon: "❤️" },
  { id: "alamat", label: "Alamat", icon: "📍" },
]
const cachedProfile = (): ProfileFields => ({
  name: localStorage.getItem("userName") ?? "",
  email: localStorage.getItem("userEmail") ?? "",
  phone: localStorage.getItem("userPhone") ?? "",
})

export default function DashboardPage({ navigate }: Props) {
  const [activeMenu, setActiveMenu] = useState<MenuItem["id"]>("profil")
  const [profile, setProfile] = useState<ProfileFields>(cachedProfile)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState("")
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useEffect(() => {
    let active = true
    const redirectToLogin = () => {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userPhone")
      navigateRef.current("login")
    }
    if (!localStorage.getItem("token")) {
      setLoading(false)
      redirectToLogin()
      return () => {
        active = false
      }
    }
    apiFetch<{ data?: { user?: ProfileUser } }>("/auth/me")
      .then((response) => {
        if (!active) return
        if (!response.data?.user)
          throw new Error("Respons profil dari server tidak valid.")
        const user = response.data.user
        const next = {
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
        }
        setProfile(next)
        localStorage.setItem("userName", next.name)
        localStorage.setItem("userEmail", next.email)
        localStorage.setItem("userPhone", next.phone)
        localStorage.setItem("user", JSON.stringify(user))
      })
      .catch((error: unknown) => {
        if (!active) return
        const message =
          error instanceof Error ? error.message : "Gagal memuat profil."
        if (/\b401\b|unauthenticated|unauthorized/i.test(message))
          redirectToLogin()
        else setProfileError(message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const onProfileUpdated = (next: ProfileFields, user: ProfileUser) => {
    setProfile(next)
    localStorage.setItem("userName", next.name)
    localStorage.setItem("userEmail", next.email)
    localStorage.setItem("userPhone", next.phone)
    localStorage.setItem("user", JSON.stringify(user))
  }
  const selected = menus.find((menu) => menu.id === activeMenu) ?? menus[0]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Akun Saya</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Dashboard Pelanggan
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Kelola profil dan informasi akun Wicaksono Store.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-[#DF3E1D] to-[#b92c13] px-5 py-7 text-center">
            <div className="mx-auto mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full border-[3px] border-white/90 bg-white/20 text-3xl">
              👤
            </div>
            <p className="truncate font-bold text-white">
              {profile.name || "Pelanggan"}
            </p>
            <p className="mt-1 truncate text-xs text-white/80">
              {profile.email || " "}
            </p>
            <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Profil Customer
            </span>
          </div>
          <nav className="p-2" aria-label="Menu akun">
            {menus.map((menu) => {
              const selectedMenu = menu.id === activeMenu
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setActiveMenu(menu.id)}
                  aria-current={selectedMenu ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-[3px] px-4 py-3 text-left text-sm transition ${
                    selectedMenu
                      ? "border-[#DF3E1D] bg-[#DF3E1D]/[0.07] font-bold text-[#DF3E1D]"
                      : "border-transparent font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {menu.icon}
                  </span>
                  <span>{menu.label}</span>
                </button>
              )
            })}
            <div className="my-2 border-t border-gray-100" />
            <button
              type="button"
              onClick={() => navigate("home")}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-[#DF3E1D]"
            >
              <span aria-hidden="true">🏠</span>Kembali ke Beranda
            </button>
          </nav>
        </aside>
        <section className="min-w-0" aria-label={selected.label}>
          {profileError && activeMenu === "profil" && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {profileError}
            </div>
          )}
          {activeMenu === "profil" && (
            <ProfileMenu
              profile={profile}
              loading={loading}
              onUpdated={onProfileUpdated}
              navigate={navigate}
            />
          )}
          {activeMenu === "pesanan" && <OrdersMenu navigate={navigate} />}
          {activeMenu === "wishlist" && <WishlistMenu navigate={navigate} />}
          {activeMenu === "alamat" && (
            <AddressesMenu navigate={navigate} profile={profile} />
          )}
        </section>
      </div>
    </main>
  )
}

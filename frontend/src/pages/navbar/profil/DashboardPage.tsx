
import { useEffect, useRef, useState } from "react"
import type { IconType } from "react-icons"
import {
  FaUser,
  FaBox,
  FaMapMarkerAlt,
  FaHome,
  FaChevronRight,
} from "react-icons/fa"

import type { Page } from "../../../App"
import { apiFetch } from "../../../api/client"

import AddressesMenu from "./AddressesMenu"
import OrdersMenu from "./OrdersMenu"
import ProfileMenu, {
  type ProfileFields,
  type ProfileUser,
} from "./ProfileMenu"

interface Props {
  navigate: (page: Page) => void
}

interface MenuItem {
  id: "profil" | "pesanan" | "alamat"
  label: string
  icon: IconType
}

const menus: MenuItem[] = [
  {
    id: "profil",
    label: "Profil Saya",
    icon: FaUser,
  },
  {
    id: "pesanan",
    label: "Riwayat Pesanan",
    icon: FaBox,
  },
  {
    id: "alamat",
    label: "Alamat",
    icon: FaMapMarkerAlt,
  },
]

const cachedProfile = (): ProfileFields => ({
  name: localStorage.getItem("userName") ?? "",
  email: localStorage.getItem("userEmail") ?? "",
  phone: localStorage.getItem("userPhone") ?? "",
})

export default function DashboardPage({ navigate }: Props) {
  const [activeMenu, setActiveMenu] =
    useState<MenuItem["id"]>("profil")

  const [profile, setProfile] =
    useState<ProfileFields>(cachedProfile)

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

        if (!response.data?.user) {
          throw new Error("Respons profil dari server tidak valid.")
        }

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
          error instanceof Error
            ? error.message
            : "Gagal memuat profil."

        if (/\b401\b|unauthenticated|unauthorized/i.test(message)) {
          redirectToLogin()
        } else {
          setProfileError(message)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const onProfileUpdated = (
    next: ProfileFields,
    user: ProfileUser,
  ) => {
    setProfile(next)

    localStorage.setItem("userName", next.name)
    localStorage.setItem("userEmail", next.email)
    localStorage.setItem("userPhone", next.phone)
    localStorage.setItem("user", JSON.stringify(user))
  }

  const selected =
    menus.find((menu) => menu.id === activeMenu) ?? menus[0]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      {/* Page Header */}
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Akun Saya
        </p>

        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Dashboard Pelanggan
        </h1>

        <p className="mt-1.5 text-sm text-gray-500">
          Kelola profil dan informasi akun Wicaksono Store.
        </p>
      </header>

      {/* Main Layout */}
      <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">

        {/* Sidebar */}
        <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white lg:sticky lg:top-24">

          {/* User Information */}
          <div className="border-b border-gray-100 px-5 py-5">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DF3E1D]/10">
                <FaUser className="text-base text-[#DF3E1D]" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {profile.name || "Pelanggan"}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {profile.email || " "}
                </p>
              </div>

            </div>

            <div className="mt-3">
              <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                Akun Pelanggan
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className="space-y-1 p-2"
            aria-label="Menu akun"
          >
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Menu Akun
            </p>

            {menus.map((menu) => {
              const selectedMenu = menu.id === activeMenu
              const Icon = menu.icon

              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setActiveMenu(menu.id)}
                  aria-current={selectedMenu ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedMenu
                      ? "bg-[#DF3E1D]/[0.07] font-semibold text-[#DF3E1D]"
                      : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`shrink-0 text-sm ${
                      selectedMenu
                        ? "text-[#DF3E1D]"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />

                  <span>{menu.label}</span>

                  {selectedMenu && (
                    <FaChevronRight
                      aria-hidden="true"
                      className="ml-auto text-[10px] text-[#DF3E1D]"
                    />
                  )}
                </button>
              )
            })}

            <div className="my-2 border-t border-gray-100" />

            {/* Back to Home */}
            <button
              type="button"
              onClick={() => navigate("home")}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#DF3E1D]"
            >
              <FaHome
                aria-hidden="true"
                className="shrink-0 text-sm text-gray-400 transition-colors group-hover:text-[#DF3E1D]"
              />

              <span>Kembali ke Beranda</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <section
          className="min-w-0"
          aria-label={selected.label}
        >
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

          {activeMenu === "pesanan" && (
            <OrdersMenu navigate={navigate} />
          )}

          {activeMenu === "alamat" && (
            <AddressesMenu
              navigate={navigate}
              profile={profile}
            />
          )}
        </section>

      </div>
    </main>
  )
}
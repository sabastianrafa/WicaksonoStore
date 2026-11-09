import { useEffect, useRef, useState, type ReactNode } from "react"
import { apiFetch } from "../../../api/client"
import type { Page } from "../../../App"
import AddressFormModal, {
  type Address,
  type AddressFormValues,
} from "../../../components/AddressFormModal"

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c93418] disabled:cursor-not-allowed disabled:opacity-60"
const outlineButton =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-[#DF3E1D] hover:text-[#DF3E1D] disabled:cursor-not-allowed disabled:opacity-50"

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba kembali."
}

function isUnauthorized(error: unknown): boolean {
  return /\b401\b|unauthenticated|unauthorized/i.test(getErrorMessage(error))
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF3E1D]" />
      Memuat data…
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
      {children}
    </div>
  )
}

function Notice({ message, success = false }: { message: string; success?: boolean }) {
  if (!message) return null
  return (
    <div
      role={success ? "status" : "alert"}
      className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${
        success
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-red-100 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </div>
  )
}

const createEmptyForm = (name = "", phone = "", isDefault = false): AddressFormValues => ({
  label: "Rumah",
  name,
  phone,
  province_code: "",
  regency_code: "",
  district_code: "",
  village_code: "",
  postal_code: "",
  rt: "",
  rw: "",
  neighborhood: "",
  landmark: "",
  address: "",
  is_default: isDefault,
})

function toFormValues(address: Address): AddressFormValues {
  return {
    id: address.id,
    label: address.label,
    name: address.name,
    phone: address.phone,
    province_code: address.province_code ?? "",
    regency_code: address.regency_code ?? "",
    district_code: address.district_code ?? "",
    village_code: address.village_code ?? "",
    postal_code: address.postal_code ?? "",
    rt: address.rt ?? "",
    rw: address.rw ?? "",
    neighborhood: address.neighborhood ?? "",
    landmark: address.landmark ?? "",
    address: address.address ?? "",
    is_default: address.is_default,
  }
}

export default function AddressesMenu({
  navigate,
  profile,
}: {
  navigate: (page: Page) => void
  profile: { name: string; phone: string }
}) {
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  const [items, setItems] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [reload, setReload] = useState(0)
  const [form, setForm] = useState<AddressFormValues | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")

    apiFetch<{ data: Address[] }>("/addresses")
      .then((response) => {
        if (active) setItems(response.data ?? [])
      })
      .catch((err) => {
        if (!active) return
        if (isUnauthorized(err)) navigateRef.current("login")
        else setError(getErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reload])

  const openCreateForm = () => {
    setError("")
    setForm(createEmptyForm(profile.name, profile.phone, items.length === 0))
  }

  const openEditForm = (address: Address) => {
    setError("")
    setForm(toFormValues(address))
  }

  const save = async (values: AddressFormValues) => {
    if (saving) return
    setSaving(true)
    setError("")

    const { id, ...payload } = values
    try {
      await apiFetch(id ? `/addresses/${id}` : "/addresses", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })
      setForm(null)
      setSuccess(id ? "Alamat berhasil diperbarui." : "Alamat berhasil ditambahkan.")
      setReload((value) => value + 1)
    } catch (err) {
      if (isUnauthorized(err)) navigate("login")
      else setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (address: Address) => {
    if (!window.confirm(`Hapus alamat "${address.label}"?`)) return
    setDeleting(address.id)
    setError("")
    setSuccess("")
    try {
      await apiFetch(`/addresses/${address.id}`, { method: "DELETE" })
      setSuccess("Alamat berhasil dihapus.")
      setReload((value) => value + 1)
    } catch (err) {
      if (isUnauthorized(err)) navigate("login")
      else setError(getErrorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  const makeDefault = async (address: Address) => {
    setError("")
    setSuccess("")
    try {
      await apiFetch(`/addresses/${address.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_default: true }),
      })
      setSuccess("Alamat utama berhasil diperbarui.")
      setReload((value) => value + 1)
    } catch (err) {
      if (isUnauthorized(err)) navigate("login")
      else setError(getErrorMessage(err))
    }
  }

  return (
    <div className={cardClass}>
      <SectionHeader
        title="Alamat Saya"
        description="Kelola alamat pengiriman untuk pesanan kamu."
        action={
          <button type="button" className={primaryButton} onClick={openCreateForm}>
            Tambah Alamat
          </button>
        }
      />

      <Notice message={error} />
      <Notice message={success} success />

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Belum ada alamat tersimpan.</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((address) => (
            <article key={address.id} className="rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-900">{address.label}</h3>
                    {address.is_default && (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                        Alamat utama
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {address.name} · {address.phone}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {address.address}
                    {address.rt ? `, RT ${address.rt}` : ""}
                    {address.rw ? ` / RW ${address.rw}` : ""}
                    {address.neighborhood ? `, ${address.neighborhood}` : ""},{" "}
                    {address.village}, {address.district}, {address.city},{" "}
                    {address.province} {address.postal_code}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" className={outlineButton} onClick={() => openEditForm(address)}>
                    Edit
                  </button>
                  {!address.is_default && (
                    <button type="button" className={outlineButton} onClick={() => void makeDefault(address)}>
                      Jadikan utama
                    </button>
                  )}
                  <button
                    type="button"
                    className={outlineButton}
                    disabled={deleting === address.id}
                    onClick={() => void remove(address)}
                  >
                    {deleting === address.id ? "Menghapus…" : "Hapus"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {form && (
        <AddressFormModal
          key={form.id ?? "new-address"}
          initialData={form}
          saving={saving}
          error={error}
          onClose={() => setForm(null)}
          onSubmit={save}
        />
      )}
    </div>
  )
}

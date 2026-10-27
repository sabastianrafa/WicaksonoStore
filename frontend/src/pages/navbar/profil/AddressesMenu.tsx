import { useEffect, useRef, useState, type FormEvent } from "react"
import { apiFetch } from "../../../api/client"
import type { Page } from "../../../App"
import {
  cardClass,
  EmptyState,
  ErrorNotice,
  getErrorMessage,
  inputClass,
  isUnauthorized,
  LoadingState,
  outlineButton,
  primaryButton,
  SectionHeader,
  SuccessNotice,
} from "./shared"

interface Address {
  id: number
  label: string
  name: string
  phone: string
  province: string
  province_code: string | null
  city: string
  regency_code: string | null
  district: string | null
  district_code: string | null
  village: string | null
  village_code: string | null
  postal_code: string
  rt: string | null
  rw: string | null
  neighborhood: string | null
  landmark: string | null
  address: string
  is_default: boolean
}
interface Option {
  code: string
  name: string
}
type Form = Omit<Address, "id" | "province" | "city" | "district" | "village" | "is_default"> & {
  id?: number
  is_default: boolean
}
const emptyForm = (name = "", phone = "", isDefault = false): Form => ({
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

export default function AddressesMenu({
  navigate,
  profile,
}: {
  navigate: (page: Page) => void
  profile: {
    name: string
    phone: string
  }
}) {
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const [items, setItems] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [reload, setReload] = useState(0)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [provinces, setProvinces] = useState<Option[]>([])
  const [regencies, setRegencies] = useState<Option[]>([])
  const [districts, setDistricts] = useState<Option[]>([])
  const [villages, setVillages] = useState<Option[]>([])
  const [locationError, setLocationError] = useState("")
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
  useEffect(() => {
    if (!form) return
    let active = true
    apiFetch<{ data: Option[] }>("/locations/provinces")
      .then((response) => {
        if (active) setProvinces(response.data ?? [])
      })
      .catch((err) => {
        if (active) setLocationError(getErrorMessage(err))
      })
    return () => {
      active = false
    }
  }, [Boolean(form)])
  useEffect(() => {
    if (!form?.province_code) {
      setRegencies([])
      return
    }
    let active = true
    apiFetch<{ data: Option[] }>(
      `/locations/provinces/${encodeURIComponent(form.province_code)}/regencies`,
    )
      .then((response) => {
        if (active) setRegencies(response.data ?? [])
      })
      .catch((err) => {
        if (active) setLocationError(getErrorMessage(err))
      })
    return () => {
      active = false
    }
  }, [form?.province_code])
  useEffect(() => {
    if (!form?.regency_code) {
      setDistricts([])
      return
    }
    let active = true
    apiFetch<{ data: Option[] }>(
      `/locations/regencies/${encodeURIComponent(form.regency_code)}/districts`,
    )
      .then((response) => {
        if (active) setDistricts(response.data ?? [])
      })
      .catch((err) => {
        if (active) setLocationError(getErrorMessage(err))
      })
    return () => {
      active = false
    }
  }, [form?.regency_code])
  useEffect(() => {
    if (!form?.district_code) {
      setVillages([])
      return
    }
    let active = true
    apiFetch<{ data: Option[] }>(
      `/locations/districts/${encodeURIComponent(form.district_code)}/villages`,
    )
      .then((response) => {
        if (active) setVillages(response.data ?? [])
      })
      .catch((err) => {
        if (active) setLocationError(getErrorMessage(err))
      })
    return () => {
      active = false
    }
  }, [form?.district_code])

  const edit = (address?: Address) => {
    setLocationError("")
    setForm(
      address
        ? {
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
        : emptyForm(profile.name, profile.phone, items.length === 0),
    )
  }
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || saving) return
    setSaving(true)
    setError("")
    setLocationError("")
    const { id, ...payload } = form
    try {
      await apiFetch(id ? `/addresses/${id}` : "/addresses", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })
      setForm(null)
      setSuccess(
        id ? "Alamat berhasil diperbarui." : "Alamat berhasil ditambahkan.",
      )
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
  const setField = <Key extends keyof Form>(key: Key, value: Form[Key]) =>
    setForm((current) => {
      if (!current) return current
      if (key === "province_code")
        return {
          ...current,
          province_code: String(value),
          regency_code: "",
          district_code: "",
          village_code: "",
        }
      if (key === "regency_code")
        return {
          ...current,
          regency_code: String(value),
          district_code: "",
          village_code: "",
        }
      if (key === "district_code")
        return { ...current, district_code: String(value), village_code: "" }
      return { ...current, [key]: value }
    })

  const locationFields: {
    key: "province_code" | "regency_code" | "district_code" | "village_code"
    label: string
    options: Option[]
    disabled: boolean
  }[] = [
      {
        key: "province_code",
        label: "Provinsi",
        options: provinces,
        disabled: false,
      },
      {
        key: "regency_code",
        label: "Kabupaten/Kota",
        options: regencies,
        disabled: !form?.province_code,
      },
      {
        key: "district_code",
        label: "Kecamatan",
        options: districts,
        disabled: !form?.regency_code,
      },
      {
        key: "village_code",
        label: "Kelurahan/Desa",
        options: villages,
        disabled: !form?.district_code,
      },
    ]
  return (
    <div className={cardClass}>
      <SectionHeader
        title="Alamat Saya"
        description="Kelola alamat pengiriman untuk pesanan kamu."
        action={
          <button
            type="button"
            className={primaryButton}
            onClick={() => edit()}
          >
            Tambah Alamat
          </button>
        }
      />
      <ErrorNotice
        message={error}
        retry={() => setReload((value) => value + 1)}
      />
      <SuccessNotice message={success} />
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState>Belum ada alamat tersimpan.</EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((address) => (
            <article
              key={address.id}
              className="rounded-xl border border-gray-100 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
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
                  <button
                    type="button"
                    className={outlineButton}
                    onClick={() => edit(address)}
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <button
                      type="button"
                      className={outlineButton}
                      onClick={() => void makeDefault(address)}
                    >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setForm(null)
          }}
        >
          <form
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
            onSubmit={(event) => void save(event)}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  {form.id ? "Edit Alamat" : "Tambah Alamat"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Lengkapi lokasi agar alamat dapat dipakai untuk pengiriman.
                </p>
              </div>
              <button
                type="button"
                className="text-2xl text-gray-400"
                aria-label="Tutup"
                onClick={() => setForm(null)}
              >
                ×
              </button>
            </div>
            <ErrorNotice message={error || locationError} />
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["label", "Label alamat"],
                ["name", "Nama penerima"],
                ["phone", "Nomor HP"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="text-sm font-semibold text-gray-600"
                >
                  {label}
                  <input
                    className={inputClass}
                    required
                    value={form[key]}
                    onChange={(event) => setField(key, event.target.value)}
                  />
                </label>
              ))}
              {locationFields.map(({ key, label, options, disabled }) => (
                <label
                  key={key}
                  className="text-sm font-semibold text-gray-600"
                >
                  {label}
                  <select
                    className={inputClass}
                    required
                    value={form[key] ?? ""}
                    disabled={disabled}
                    onChange={(event) => setField(key, event.target.value)}
                  >
                    <option value="">Pilih {label.toLowerCase()}</option>
                    {options.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <label className="text-sm font-semibold text-gray-600">
                Kode pos
                <input
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={5}
                  required
                  value={form.postal_code}
                  onChange={(event) =>
                    setField(
                      "postal_code",
                      event.target.value.replace(/\D/g, "").slice(0, 5),
                    )
                  }
                />
              </label>
              <label className="text-sm font-semibold text-gray-600 sm:col-span-2">
                Alamat lengkap
                <input
                  className={inputClass}
                  required
                  minLength={5}
                  maxLength={2000}
                  value={form.address}
                  onChange={(event) => setField("address", event.target.value)}
                />
              </label>
              {([
                ["rt", "RT"],
                ["rw", "RW"],
                ["neighborhood", "Lingkungan"],
                ["landmark", "Patokan"],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="text-sm font-semibold text-gray-600"
                >
                  {label}
                  <input
                    className={inputClass}
                    value={form[key] ?? ""}
                    onChange={(event) => setField(key, event.target.value)}
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) =>
                    setField("is_default", event.target.checked)
                  }
                />{" "}
                Jadikan alamat utama
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className={outlineButton}
                onClick={() => setForm(null)}
              >
                Batal
              </button>
              <button type="submit" className={primaryButton} disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Alamat"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

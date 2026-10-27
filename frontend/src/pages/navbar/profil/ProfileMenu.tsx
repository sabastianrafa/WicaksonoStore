import { useState, type FormEvent } from "react"
import { apiFetch } from "../../../api/client"
import type { Page } from "../../../App"
import {
  cardClass,
  ErrorNotice,
  inputClass,
  isUnauthorized,
  LoadingState,
  outlineButton,
  primaryButton,
  SuccessNotice,
  getErrorMessage,
} from "./shared"

export interface ProfileFields {
  name: string
  email: string
  phone: string
}
export interface ProfileUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
}
interface Props {
  profile: ProfileFields
  loading: boolean
  onUpdated: (profile: ProfileFields, user: ProfileUser) => void
  navigate: (page: Page) => void
}

export default function ProfileMenu({
  profile,
  loading,
  onUpdated,
  navigate,
}: Props) {
  const [form, setForm] = useState(profile)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await apiFetch<{ data?: { user?: ProfileUser } }>(
        "/auth/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
          }),
        },
      )
      if (!response.data?.user)
        throw new Error("Respons pembaruan profil tidak valid.")
      const user = response.data.user
      const updated = {
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      }
      onUpdated(updated, user)
      setForm(updated)
      setEditing(false)
      setSuccess("Profil berhasil diperbarui.")
    } catch (err) {
      if (isUnauthorized(err)) navigate("login")
      else setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cardClass}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Profil Saya</h2>
          <p className="mt-1 text-sm text-gray-500">
            Kelola informasi akun kamu.
          </p>
        </div>
        {!loading && !editing && (
          <button
            type="button"
            className={outlineButton}
            onClick={() => {
              setForm(profile)
              setEditing(true)
              setError("")
              setSuccess("")
            }}
          >
            Edit Profil
          </button>
        )}
      </div>
      <ErrorNotice message={error} /> <SuccessNotice message={success} />
      {loading ? (
        <LoadingState label="Memuat profil…" />
      ) : editing ? (
        <form onSubmit={(event) => void save(event)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-600">
              Nama Lengkap
              <input
                className={inputClass}
                value={form.name}
                onChange={(event) =>
                  setForm((old) => ({ ...old, name: event.target.value }))
                }
                autoComplete="name"
                maxLength={255}
                required
              />
            </label>
            <label className="text-sm font-semibold text-gray-600">
              Email
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((old) => ({ ...old, email: event.target.value }))
                }
                autoComplete="email"
                maxLength={255}
                required
              />
            </label>
            <label className="text-sm font-semibold text-gray-600 sm:col-span-2">
              Nomor HP
              <input
                className={inputClass}
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((old) => ({ ...old, phone: event.target.value }))
                }
                autoComplete="tel"
                maxLength={30}
              />
            </label>
          </div>
          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              className={outlineButton}
              disabled={saving}
              onClick={() => {
                setForm(profile)
                setEditing(false)
                setError("")
              }}
            >
              Batal
            </button>
            <button type="submit" className={primaryButton} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-x-8 sm:grid-cols-2">
          {([
            ["Nama Lengkap", profile.name],
            ["Email", profile.email],
            ["Nomor HP", profile.phone],
          ] as const).map(([label, value]) => (
            <div
              key={label}
              className="border-b border-gray-100 py-4 first:pt-1"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </dt>
              <dd className="mt-2 break-words font-semibold text-gray-800">
                {value || "-"}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

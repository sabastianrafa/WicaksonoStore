import { useState, type FormEvent } from "react"
import { apiFetch } from "../../../api/client"
import type { Page } from "../../../App"

import type { ReactNode } from "react"

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
const inputClass =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#DF3E1D] focus:ring-2 focus:ring-[#DF3E1D]/15 disabled:bg-gray-50 disabled:text-gray-400"
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

function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF3E1D]" />
      {label}
    </div>
  )
}

function ErrorNotice({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  if (!message) return null
  return (
    <div role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      {message}
      {retry && (
        <button type="button" className="ml-2 font-semibold underline" onClick={retry}>
          Muat ulang
        </button>
      )}
    </div>
  )
}

function SuccessNotice({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="status" className="mb-4 rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-sm text-green-700">
      {message}
    </div>
  )
}


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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Profil Saya</h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="mt-6 flex justify-end gap-2">
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

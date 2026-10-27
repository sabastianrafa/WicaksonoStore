import type { ReactNode } from "react"

export const inputClass =
  "mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#DF3E1D] focus:ring-2 focus:ring-[#DF3E1D]/15"
export const cardClass =
  "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
export const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c93418] disabled:cursor-not-allowed disabled:opacity-60"
export const outlineButton =
  "inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#DF3E1D] hover:text-[#DF3E1D] disabled:cursor-not-allowed disabled:opacity-60"

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba kembali."
}

export function isUnauthorized(error: unknown): boolean {
  return /\b401\b|unauthenticated|unauthorized/i.test(getErrorMessage(error))
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF3E1D]" />
      {label}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
      {children}
    </div>
  )
}

export function ErrorNotice({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
      {retry && (
        <button
          type="button"
          className="ml-2 font-semibold underline"
          onClick={retry}
        >
          Muat ulang
        </button>
      )}
    </div>
  )
}

export function SuccessNotice({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      {message}
    </div>
  )
}

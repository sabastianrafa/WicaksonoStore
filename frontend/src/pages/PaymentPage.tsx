import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"

import { apiFetch } from "../api/client"
import type { Page } from "../App"
import PaymentStatus from "../components/payment/PaymentStatus"
import PaymentSummary from "../components/payment/PaymentSummary"

import type {
  PaymentDetails,
  PaymentDetailsResponse,
  SnapTokenResponse,
} from "../types/payment"

interface Props {
  navigate: (page: Page, data?: unknown) => void
}

let snapScriptPromise: Promise<void> | null = null

// Pengaman global pada level module: tetap bertahan saat React StrictMode
// menjalankan ulang effect atau komponen di-remount dalam satu sesi halaman.
let snapPreparationLocked = false
let snapEmbedLocked = false

const CHECKOUT_STEPS = [
  "Alamat & Pengiriman",
  "Konfirmasi Pesanan",
  "Pembayaran",
]

function CheckoutStepper() {
  return (
    <ol className="flex w-full items-start" aria-label="Langkah checkout">
      {CHECKOUT_STEPS.map((label, index) => {
        const number = index + 1
        const active = number === 3
        const completed = number < 3

        return (
          <li
            key={label}
            className={`flex min-w-0 items-start ${
              index === 2 ? "flex-none" : "flex-1"
            }`}
            aria-current={active ? "step" : undefined}
          >
            <div className="flex w-[76px] shrink-0 flex-col items-center gap-2 sm:w-32">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  active
                    ? "bg-[#DF401F] text-white"
                    : completed
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {completed ? "✓" : number}
              </span>
              <span
                className={`text-center text-[10px] leading-tight sm:text-xs ${
                  active
                    ? "font-semibold text-[#DF401F]"
                    : "font-medium text-green-700"
                }`}
              >
                {label}
              </span>
            </div>

            {index < 2 && (
              <div
                className="mx-1.5 mt-[17px] h-0.5 flex-1 rounded-full bg-green-600 sm:mx-3"
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function PaymentPage({ navigate }: Props) {
  const { orderId } = useParams()

  const [details, setDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingSnap, setStartingSnap] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pageError, setPageError] = useState("")
  const [snapError, setSnapError] = useState("")
  const [message, setMessage] = useState("")

  const startingSnapRef = useRef(false)
  const snapStartedRef = useRef(false)
  const mountedRef = useRef(true)

  const loadPayment = useCallback(async () => {
    if (!orderId) {
      setPageError("Nomor pesanan tidak valid.")
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch<PaymentDetailsResponse>(
        `/orders/${orderId}/payment`,
      )
      if (!mountedRef.current) return

      setDetails(response.data)
      setPageError("")
    } catch (error) {
      if (!mountedRef.current) return
      setPageError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil informasi pembayaran.",
      )
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    mountedRef.current = true
    void loadPayment()

    return () => {
      mountedRef.current = false
    }
  }, [loadPayment])

  // Status pembayaran tetap disinkronkan dari backend/webhook.
  useEffect(() => {
    if (details?.payment.status !== "pending") return

    const interval = window.setInterval(() => {
      void loadPayment()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [details?.payment.status, loadPayment])

  const loadSnapScript = useCallback(
    async (clientKey: string, production: boolean) => {
      if (window.snap) return

      if (snapScriptPromise) {
        await snapScriptPromise
        if (!window.snap) {
          throw new Error("Midtrans Snap belum siap.")
        }
        return
      }

      const scriptUrl = `${
        production
          ? "https://app.midtrans.com"
          : "https://app.sandbox.midtrans.com"
      }/snap/snap.js?client-key=${encodeURIComponent(clientKey)}`

      const existingScript =
        document.querySelector<HTMLScriptElement>(
          "script[data-midtrans-snap]",
        )

      snapScriptPromise = new Promise<void>((resolve, reject) => {
        const script = existingScript ?? document.createElement("script")

        const cleanup = () => {
          script.removeEventListener("load", handleLoad)
          script.removeEventListener("error", handleError)
        }

        const handleLoad = () => {
          cleanup()
          if (window.snap) {
            resolve()
          } else {
            reject(new Error("Midtrans Snap belum tersedia."))
          }
        }

        const handleError = () => {
          cleanup()
          script.remove()
          reject(new Error("Gagal memuat Midtrans Snap."))
        }

        script.addEventListener("load", handleLoad, { once: true })
        script.addEventListener("error", handleError, { once: true })

        if (!existingScript) {
          script.dataset.midtransSnap = "true"
          script.src = scriptUrl
          script.async = true
          document.body.appendChild(script)
        }
      })

      try {
        await snapScriptPromise
      } catch (error) {
        snapScriptPromise = null
        throw error
      }
    },
    [],
  )

  const startPayment = useCallback(async () => {
    if (
      !orderId ||
      startingSnapRef.current ||
      snapStartedRef.current ||
      snapPreparationLocked ||
      snapEmbedLocked ||
      !details ||
      details.order.status === "cancelled"
    ) {
      return
    }

    // Kunci dipasang secara sinkron sebelum await pertama agar dua effect
    // atau dua mount tidak meminta token dan menjalankan Snap bersamaan.
    snapPreparationLocked = true
    startingSnapRef.current = true
    setStartingSnap(true)
    setSnapError("")
    setMessage("")

    try {
      const response = await apiFetch<SnapTokenResponse>(
        `/orders/${orderId}/payment/snap-token`,
        { method: "POST" },
      )

      const {
        snap_token: snapToken,
        client_key: clientKey,
        is_production: isProduction,
      } = response.data

      await loadSnapScript(clientKey, isProduction)

      if (!window.snap) {
        throw new Error("Midtrans Snap belum siap.")
      }

      const container = document.getElementById(
        "midtrans-snap-container",
      )

      if (!container) {
        throw new Error("Container pembayaran tidak ditemukan.")
      }

      // Embed hanya sekali per mount untuk mencegah invalid state transition.
      if (container.childElementCount > 0) {
        throw new Error(
          "Panel pembayaran sudah aktif. Muat ulang halaman jika panel tertutup.",
        )
      }

      // Kunci sebelum memanggil SDK agar embed tidak dipanggil ulang
      // selama dokumen/browser session ini masih aktif.
      snapStartedRef.current = true
      snapEmbedLocked = true

      window.snap.embed(snapToken, {
        embedId: "midtrans-snap-container",
        onSuccess: () => {
          setMessage(
            "Pembayaran diterima oleh Midtrans. Menunggu konfirmasi server.",
          )
          void loadPayment()
        },
        onPending: () => {
          setMessage(
            "Transaksi menunggu pembayaran. Selesaikan sesuai instruksi Midtrans.",
          )
          void loadPayment()
        },
        onError: () => {
          setMessage("")
          setSnapError(
            "Midtrans tidak dapat memproses pembayaran. Periksa status transaksi atau muat ulang halaman.",
          )
          void loadPayment()
        },
        onClose: () => {
          setMessage(
            "Panel pembayaran ditutup. Jika ingin membukanya kembali, muat ulang halaman ini.",
          )
          void loadPayment()
        },
      })
    } catch (error) {
      // Jika embed belum sempat dipanggil, izinkan percobaan ulang.
      // Jika sudah dipanggil, kunci dipertahankan karena status internal
      // Snap tidak dapat di-reset dengan aman dari aplikasi.
      if (!snapEmbedLocked) {
        snapStartedRef.current = false
      }

      setSnapError(
        error instanceof Error
          ? error.message
          : "Gagal membuka pembayaran Midtrans.",
      )
    } finally {
      snapPreparationLocked = false
      startingSnapRef.current = false
      setStartingSnap(false)
    }
  }, [details, loadPayment, loadSnapScript, orderId])

  // Snap dibuka otomatis setelah detail pembayaran tersedia.
  useEffect(() => {
    if (
      loading ||
      !details ||
      details.payment.method !== "midtrans" ||
      !["pending", "rejected"].includes(details.payment.status) ||
      details.order.status === "cancelled" ||
      snapStartedRef.current ||
      snapPreparationLocked ||
      snapEmbedLocked
    ) {
      return
    }

    void startPayment()
  }, [details, loading, startPayment])

  const refreshPayment = async () => {
    setRefreshing(true)
    try {
      await loadPayment()
    } finally {
      setRefreshing(false)
    }
  }

  const canPay =
    details?.payment.method === "midtrans" &&
    ["pending", "rejected"].includes(details.payment.status) &&
    details.order.status !== "cancelled"

  const isCancelled = details?.order.status === "cancelled"
  const isPaid = details?.payment.status === "paid"

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-2 text-xs text-gray-400"
        >
          <button
            type="button"
            onClick={() => navigate("dashboard", { menu: "pesanan" })}
            className="rounded py-1 text-[#DF401F] transition hover:underline"
          >
            Pesanan saya
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-gray-700" aria-current="page">
            Pembayaran
          </span>
        </nav>

        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pembayaran
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Selesaikan pembayaran pesanan melalui Midtrans.
          </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Pembayaran aman bersama Midtrans
          </span>
        </header>

        <div className="mb-6 rounded-xl border border-gray-100 bg-white px-3 py-5 shadow-sm sm:px-6">
          <CheckoutStepper />
        </div>

        {loading && (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF401F]" />
            <p className="mt-3 text-sm text-gray-500">
              Memuat informasi pembayaran...
            </p>
          </div>
        )}

        {!loading && pageError && !details && (
          <div className="rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-red-600">{pageError}</p>
            <button
              type="button"
              onClick={() => void refreshPayment()}
              disabled={refreshing}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#DF401F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {refreshing && <SpinnerFallback />}
              Coba lagi
            </button>
          </div>
        )}

        {!loading && details && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="min-w-0 space-y-4">
            {pageError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {pageError}
              </div>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700"
              >
                {message}
              </p>
            )}

            {isCancelled && (
              <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    ×
                  </span>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Pesanan telah dibatalkan
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      Batas waktu pembayaran telah berakhir atau pesanan
                      dibatalkan. Kamu tidak dapat melanjutkan pembayaran untuk
                      pesanan ini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("dashboard", { menu: "pesanan" })}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#DF401F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C73818]"
                >
                  Kembali ke pesanan
                </button>
              </section>
            )}

            {isPaid && (
              <section className="rounded-xl border border-green-100 bg-green-50 p-5 sm:p-6">
                <h2 className="font-semibold text-green-800">
                  Pembayaran berhasil
                </h2>
                <p className="mt-1 text-sm text-green-700">
                  Pembayaran telah dikonfirmasi oleh server.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("dashboard", { menu: "pesanan" })}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  Lihat pesanan
                </button>
              </section>
            )}

            {canPay && snapEmbedLocked && !snapStartedRef.current && (
              <div
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                Sesi Snap sebelumnya masih tercatat di halaman ini. Muat ulang
                halaman pembayaran untuk memulai sesi Snap yang baru.
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="ml-1 font-semibold underline"
                >
                  Muat ulang
                </button>
              </div>
            )}

            {canPay && (
              <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Checkout</p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900">
                      Selesaikan pembayaran
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Pilih metode yang paling nyaman untuk Anda.
                    </p>
                  </div>
                  <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">MIDTRANS</span>
                </div>

                {startingSnap && (
                  <div
                    className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 text-sm text-gray-500"
                    role="status"
                  >
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF401F]" />
                    Menyiapkan pembayaran...
                  </div>
                )}

                <div
                  id="midtrans-snap-container"
                    className="min-h-[560px] w-full bg-slate-50/60 sm:min-h-[680px]"
                />

                {snapError && (
                  <div className="border-t border-gray-100 p-4">
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {snapError}
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Muat ulang halaman
                    </button>
                  </div>
                )}
              </section>
            )}

            <p className="px-2 pb-2 text-center text-xs leading-relaxed text-slate-400">
              Pembayaran diproses dengan aman melalui Midtrans. Status akhir
              pembayaran mengikuti konfirmasi webhook dari server.
            </p>
            </div>
            <aside className="space-y-4 lg:sticky lg:top-6">
              <PaymentSummary
                order={details.order}
                payment={details.payment}
                onRefresh={() => void refreshPayment()}
                refreshing={refreshing}
              />
              <PaymentStatus
                paymentStatus={details.payment.status}
                orderStatus={details.order.status}
              />
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500 shadow-sm">
                Data pembayaran Anda diproses oleh Midtrans. Kami akan memperbarui status pesanan setelah menerima konfirmasi transaksi.
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

function SpinnerFallback() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  )
}

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { apiFetch } from "../api/client"
import { formatPrice } from "../data"
import type { Page } from "../App"

interface PaymentDetails {
  payment: {
    id: number
    method: string
    amount: number | string
    status: "pending" | "paid" | "rejected" | "refunded" | "partially_refunded"
  }
  payment_method: {
    name: string
    code: string
    type: string
    description: string | null
  } | null
  midtrans_attempt_status: string | null
  order: {
    id: number
    order_number: string
    total: number
    status: string
  }
}

interface Props {
  navigate: (page: Page, data?: unknown) => void
}

interface SnapTokenResponse {
  data: {
    snap_token: string
    client_key: string
    is_production: boolean
  }
}

const STEPS = ["Pesanan dibuat", "Pilih kanal", "Pembayaran", "Selesai"]

declare global {
  interface Window {
    snap?: {
      embed: (
        token: string,
        options: {
          embedId: string
          onSuccess?: () => void
          onPending?: () => void
          onError?: () => void
          onClose?: () => void
        },
      ) => void
      hide?: () => void
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: () => void
          onPending?: () => void
          onError?: () => void
          onClose?: () => void
        },
      ) => void
    }
  }
}

const styles = `
.pay { --o:#EA580C; --od:#C2410C; --ol:#FFF7ED; --ob:#FED7AA; --ink:#1F2937; --mut:#6B7280; --line:#E5E7EB;
  max-width: 920px; margin: 0 auto; padding: 32px 20px 48px; color: var(--ink); }
.pay * { box-sizing: border-box; }

/* ---------- Back link ---------- */
.pay-back { display:inline-flex; align-items:center; gap:6px; margin-bottom:18px; padding:6px 10px 6px 6px;
  border:0; background:none; color:var(--mut); font-size:.88rem; font-weight:600; cursor:pointer; border-radius:8px;
  transition:color .15s, background .15s; }
.pay-back:hover { color:var(--od); background:var(--ol); }
.pay-back:active { transform:translateY(1px); }
.pay-back:focus-visible { outline:2px solid var(--o); outline-offset:2px; }

/* ---------- Card ---------- */
.pay-card { background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:0 4px 24px rgba(17,24,39,.06); }
.pay-hero { overflow:hidden; }
.pay-hero::before { content:''; display:block; height:5px; background:linear-gradient(90deg,#EA580C,#DF401F,#FDBA74); }
.pay-hero-body { padding:26px 28px 28px; }

/* ---------- Hero ---------- */
.pay-top { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap; }
.pay-order { margin:0; color:#9CA3AF; font-size:.78rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
.pay-title { margin:6px 0 0; font-size:1.65rem; font-weight:800; letter-spacing:-.02em; line-height:1.2; }
.pay-sub { margin:8px 0 0; max-width:520px; color:var(--mut); font-size:.9rem; line-height:1.55; }

/* ---------- Badge ---------- */
.pay-badge { display:inline-flex; align-items:center; gap:8px; padding:7px 13px; border-radius:999px;
  font-size:.78rem; font-weight:700; white-space:nowrap; }
.pay-badge i { width:7px; height:7px; border-radius:50%; background:currentColor; }
.pay-badge.pulse i { animation: pay-pulse 1.6s ease-in-out infinite; }
.pay-badge.warning { background:#FEF3C7; color:#92400E; }
.pay-badge.info    { background:#DBEAFE; color:#1D4ED8; }
.pay-badge.success { background:#DCFCE7; color:#15803D; }
.pay-badge.danger  { background:#FEE2E2; color:#B91C1C; }
.pay-badge.neutral { background:#F3F4F6; color:#4B5563; }

/* ---------- Steps ---------- */
.pay-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:26px 0 0; padding:0; list-style:none; }
.pay-step { min-width:0; }
.pay-step-row { display:flex; align-items:center; }
.pay-dot { flex:none; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-size:.75rem;
  font-weight:800; background:#F3F4F6; color:#9CA3AF; transition:all .2s; }
.pay-step.done .pay-dot { background:var(--o); color:#fff; }
.pay-step.current .pay-dot { background:#fff; color:var(--o); box-shadow:0 0 0 2px var(--o); }
.pay-bar { flex:1; height:3px; margin-left:8px; border-radius:3px; background:var(--line); transition:background .2s; }
.pay-step.done .pay-bar { background:var(--o); }
.pay-step-label { margin:8px 0 0; font-size:.74rem; font-weight:600; color:#9CA3AF; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; }
.pay-step.done .pay-step-label, .pay-step.current .pay-step-label { color:var(--ink); }

/* ---------- Total ---------- */
.pay-total { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;
  margin-top:24px; padding:18px 20px; background:var(--ol); border:1px solid var(--ob); border-radius:14px; }
.pay-total-label { color:var(--mut); font-size:.82rem; font-weight:600; }
.pay-total-value { margin-top:2px; color:var(--od); font-size:2rem; font-weight:800; letter-spacing:-.02em; }

/* ---------- Buttons ---------- */
.pay-actions { display:flex; gap:8px; flex-wrap:wrap; }
.pay-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px;
  padding:9px 16px; border-radius:11px; border:1px solid var(--line); background:#fff; color:#374151;
  font-size:.84rem; font-weight:700; cursor:pointer; font-family:inherit;
  transition:background .15s, border-color .15s, transform .1s, box-shadow .15s, color .15s; }
.pay-btn:hover:not(:disabled) { background:#F9FAFB; border-color:#D1D5DB; }
.pay-btn:active:not(:disabled) { transform:scale(.98); }
.pay-btn:focus-visible, .pay-back:focus-visible, .pay-drop:focus-within {
  outline:2px solid var(--o); outline-offset:2px; }
.pay-btn:disabled { opacity:.55; cursor:not-allowed; }
.pay-btn.sm { min-height:34px; padding:6px 12px; font-size:.78rem; }
.pay-btn.primary { background:var(--o); border-color:var(--o); color:#fff; box-shadow:0 4px 12px rgba(234,88,12,.25); }
.pay-btn.primary:hover:not(:disabled) { background:var(--od); border-color:var(--od); }
.pay-btn.full { width:100%; }
.pay-btn.copied { background:#F0FDF4; border-color:#BBF7D0; color:#15803D; }

/* ---------- Spinner (essential loading feedback) ---------- */
.pay-spinner { display:inline-block; width:13px; height:13px; border:2px solid currentColor;
  border-top-color:transparent; border-radius:50%; animation: pay-rot .65s linear infinite; flex-shrink:0; }

/* ---------- Grid ---------- */
.pay-grid { display:grid; grid-template-columns:3fr 2fr; gap:18px; margin-top:18px; align-items:start; }

/* ---------- Section ---------- */
.pay-section { padding:24px; }
.pay-sec-head { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.pay-num { width:32px; height:32px; border-radius:50%; display:grid; place-items:center; background:var(--ol);
  color:var(--od); font-weight:800; font-size:.88rem; flex-shrink:0; }
.pay-sec-title { margin:0; font-size:1.05rem; font-weight:800; line-height:1.2; }
.pay-sec-hint { margin:2px 0 0; color:var(--mut); font-size:.78rem; }

/* ---------- Method card ---------- */
.pay-method { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid #F3F4F6; border-radius:12px; }
.pay-method-ico { width:42px; height:42px; border-radius:11px; background:#F3F4F6; display:grid;
  place-items:center; font-size:1.2rem; flex-shrink:0; }
.pay-method-name { margin:0; font-weight:700; }
.pay-method-type { margin:2px 0 0; color:var(--mut); font-size:.82rem; }
.pay-desc { margin:14px 0 0; color:#4B5563; font-size:.88rem; line-height:1.6; }

/* ---------- Snap container ---------- */
.pay-snap-wrap { margin-top:16px; }
.pay-snap-container { width:100%; min-height:620px; overflow:auto; border-radius:12px; background:#fff; }
.pay-snap-container:empty { min-height:280px; border:1.5px dashed var(--ob); background:var(--ol);
  display:grid; place-items:center; padding:28px; text-align:center; color:var(--mut); font-size:.85rem; }
.pay-snap-container:empty::before { content:'Panel pembayaran siap. Pilih kanal yang tersedia di atas.'; max-width:280px; }

/* ---------- Notes ---------- */
.pay-note { display:flex; gap:10px; margin:0; padding:14px; border-radius:12px; font-size:.86rem; line-height:1.55; }
.pay-note.info    { background:#EFF6FF; color:#1E40AF; }
.pay-note.success { background:#F0FDF4; color:#166534; }
.pay-note.danger  { background:#FEF2F2; color:#B91C1C; }
.pay-note.warn    { background:#FFFBEB; color:#92400E; border:1px solid #FDE68A; }
.pay-note.neutral { background:#F9FAFB; color:#4B5563; }
.pay-note.mb { margin-bottom:14px; }
.pay-note.mt { margin-top:12px; }

/* ---------- Footer ---------- */
.pay-foot { margin:22px 0 0; text-align:center; color:var(--mut); font-size:.78rem; }
.pay-foot-actions { display:flex; justify-content:center; margin-top:18px; }

/* ---------- Skeleton ---------- */
.pay-skel { animation:pay-pulse 1.4s ease-in-out infinite; }
.pay-skel div { background:#E5E7EB; border-radius:8px; }

/* ---------- Error state ---------- */
.pay-error-box { padding:36px 24px; text-align:center; }
.pay-error-box h1 { margin:0 0 8px; font-size:1.15rem; }
.pay-error-box p { margin:0 auto 18px; max-width:420px; color:var(--mut); font-size:.9rem; line-height:1.55; }
.pay-error-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

/* ---------- Keyframes ---------- */
@keyframes pay-pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
@keyframes pay-rot { to { transform:rotate(360deg) } }

/* ---------- Responsive ---------- */
@media (max-width: 1023px) {
  .pay-grid { grid-template-columns:1fr; }
}

@media (max-width: 639px) {
  .pay { padding:20px 16px 32px; }
  .pay-hero-body { padding:18px 16px 20px; }
  .pay-title { font-size:1.25rem; }
  .pay-section { padding:18px 16px; }
  .pay-total { padding:16px; }
  .pay-total-value { font-size:1.5rem; overflow-wrap:anywhere; }
  .pay-step-label { font-size:.65rem; }
  .pay-total { flex-direction:column; align-items:flex-start; }
  .pay-actions { width:100%; }
  .pay-actions .pay-btn { flex:1; }
  .pay-error-actions { flex-direction:column; }
  .pay-error-actions .pay-btn { width:100%; }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .pay *, .pay *::before { animation:none !important; transition:none !important; }
  /* Spinner is essential feedback → keep but slow, replace rotation with fade */
  .pay .pay-spinner { animation: pay-pulse 2.4s ease-in-out infinite !important;
    border-top-color: currentColor; }
}
`

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const input = document.createElement("textarea")
  input.value = value
  input.setAttribute("readonly", "")
  input.style.position = "fixed"
  input.style.opacity = "0"
  document.body.appendChild(input)
  input.select()
  const ok = document.execCommand("copy")
  input.remove()
  if (!ok) throw new Error("copy failed")
}

function Spinner() {
  return <span className="pay-spinner" aria-hidden="true" />
}

export default function PaymentPage({ navigate }: Props) {
  const { orderId } = useParams()
  const [details, setDetails] = useState<PaymentDetails | null>(null)
  const [copied, setCopied] = useState<"amount" | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [startingSnap, setStartingSnap] = useState(false)
  const [changingMethod, setChangingMethod] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const autoEmbedAttemptedOrderId = useRef<string | null>(null)

  const loadPayment = useCallback(async () => {
    if (!orderId) {
      setError("Nomor pesanan tidak valid.")
      setLoading(false)
      return
    }

    try {
      const response = await apiFetch<{ data: PaymentDetails }>(
        `/orders/${orderId}/payment`,
      )
      setDetails(response.data)
      setError("")
      if (response.data.payment.status === "paid") {
        setMessage("Pembayaran sudah dikonfirmasi oleh server.")
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat informasi pembayaran.",
      )
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void loadPayment()
  }, [loadPayment])

  useEffect(() => {
    if (details?.payment.status !== "pending") return
    const interval = window.setInterval(() => {
      void loadPayment()
    }, 15000)
    return () => window.clearInterval(interval)
  }, [details?.payment.status, loadPayment])

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(null), 2000)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const refreshPayment = async () => {
    setRefreshing(true)
    await loadPayment()
    setRefreshing(false)
  }

  const startMidtransPayment = useCallback(async () => {
    if (!orderId) return
    setStartingSnap(true)
    setError("")
    setMessage("")
    window.snap?.hide?.()
    document.getElementById("midtrans-snap-container")?.replaceChildren()
    try {
      const response = await apiFetch<SnapTokenResponse>(
        `/orders/${orderId}/payment/snap-token`,
        { method: "POST" },
      )
      const {
        snap_token: token,
        client_key: clientKey,
        is_production: production,
      } = response.data
      if (!window.snap) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>(
            "script[data-midtrans-snap]",
          )
          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true })
            existing.addEventListener(
              "error",
              () => reject(new Error("Skrip Midtrans gagal dimuat.")),
              { once: true },
            )
            return
          }
          const script = document.createElement("script")
          script.dataset.midtransSnap = "true"
          script.src = `${
            production
              ? "https://app.midtrans.com"
              : "https://app.sandbox.midtrans.com"
          }/snap/snap.js?client-key=${encodeURIComponent(clientKey)}`
          script.onload = () => resolve()
          script.onerror = () =>
            reject(new Error("Skrip Midtrans gagal dimuat."))
          document.body.appendChild(script)
        })
      }
      if (!window.snap?.embed)
        throw new Error("Midtrans Snap embed belum siap.")
      window.snap.embed(token, {
        embedId: "midtrans-snap-container",
        onSuccess: () => {
          setMessage(
            "Midtrans menerima hasil pembayaran. Menunggu konfirmasi akhir dari server.",
          )
          void loadPayment()
        },
        onPending: () => {
          setMessage(
            "Selesaikan instruksi pada panel Midtrans. Status akan berubah otomatis setelah pembayaran dikonfirmasi.",
          )
          void loadPayment()
        },
        onError: () =>
          setError("Pembayaran gagal diproses. Silakan coba lagi."),
        onClose: () => {
          setMessage(
            "Proses pembayaran ditutup. Anda dapat melanjutkannya dari halaman ini.",
          )
          void loadPayment()
        },
      })
    } catch (snapError) {
      setError(
        snapError instanceof Error
          ? snapError.message
          : "Gagal membuka pembayaran Midtrans.",
      )
    } finally {
      setStartingSnap(false)
    }
  }, [loadPayment, orderId])

  const changePaymentMethod = useCallback(async () => {
    if (!orderId) return

    setChangingMethod(true)
    setError("")
    setMessage("")
    try {
      await apiFetch(`/orders/${orderId}/payment/change-method`, {
        method: "POST",
      })
      window.snap?.hide?.()
      document.getElementById("midtrans-snap-container")?.replaceChildren()
      await startMidtransPayment()
      await loadPayment()
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Gagal mengganti kanal pembayaran.",
      )
    } finally {
      setChangingMethod(false)
    }
  }, [loadPayment, orderId, startMidtransPayment])

  useEffect(() => {
    if (
      !loading &&
      details?.payment.method === "midtrans" &&
      ["pending", "rejected"].includes(details.payment.status) &&
      orderId &&
      autoEmbedAttemptedOrderId.current !== orderId
    ) {
      autoEmbedAttemptedOrderId.current = orderId
      void startMidtransPayment()
    }
  }, [details, loading, orderId, startMidtransPayment])

  const copyValue = async (value: string | null | undefined) => {
    if (!value) return
    try {
      await copyText(value)
      setError("")
      setCopied("amount")
    } catch {
      setError(
        "Teks tidak dapat disalin oleh browser ini. Silakan salin secara manual.",
      )
    }
  }

  const paymentMethod = details?.payment_method
  const cancelled = details?.order.status === "cancelled"
  const paid = details?.payment.status === "paid"
  const rejected = details?.payment.status === "rejected"
  const refunded = details?.payment.status === "refunded"
  const partiallyRefunded = details?.payment.status === "partially_refunded"
  const isMidtrans =
    paymentMethod?.type === "gateway" || details?.payment.method === "midtrans"
  const canChangeMidtransMethod = Boolean(
    isMidtrans &&
      details?.payment.status === "pending" &&
      details.midtrans_attempt_status === "pending" &&
      !cancelled,
  )
  const canRetryMidtransAttempt = Boolean(
    isMidtrans &&
      details?.payment.status === "pending" &&
      ["expire", "deny", "cancel"].includes(
        details.midtrans_attempt_status ?? "",
      ) &&
      !cancelled,
  )
  const amount = details ? Number(details.payment.amount) : 0
  const activeStep = paid ? STEPS.length : canChangeMidtransMethod ? 2 : 1

  const status = cancelled
    ? { label: "Pesanan dibatalkan", tone: "neutral", pulse: false }
    : refunded
      ? { label: "Pembayaran dikembalikan", tone: "neutral", pulse: false }
      : partiallyRefunded
        ? { label: "Refund sebagian", tone: "neutral", pulse: false }
        : paid
          ? { label: "Terverifikasi", tone: "success", pulse: false }
          : rejected
            ? { label: "Perlu pembayaran ulang", tone: "danger", pulse: false }
            : canRetryMidtransAttempt
              ? { label: "Percobaan berakhir", tone: "danger", pulse: false }
              : canChangeMidtransMethod
                ? { label: "Menunggu pembayaran", tone: "warning", pulse: true }
                : { label: "Pilih kanal pembayaran", tone: "info", pulse: true }

  return (
    <div className="pay">
      <style>{styles}</style>

      <button
        type="button"
        className="pay-back"
        onClick={() => navigate("dashboard")}
      >
        <span aria-hidden="true">←</span> Kembali ke pesanan
      </button>

      {loading ? (
        <div
          className="pay-skel"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Memuat informasi pembayaran"
        >
          <div className="pay-card" style={{ padding: 28 }}>
            <div style={{ height: 12, width: 140 }} />
            <div style={{ height: 30, width: 280, marginTop: 14 }} />
            <div style={{ height: 70, marginTop: 28, borderRadius: 14 }} />
          </div>
          <div className="pay-grid">
            <div className="pay-card" style={{ padding: 24 }}>
              <div style={{ height: 220 }} />
            </div>
            <div className="pay-card" style={{ padding: 24 }}>
              <div style={{ height: 220 }} />
            </div>
          </div>
        </div>
      ) : error && !details ? (
        <div className="pay-card pay-error-box" role="alert">
          <h1>Informasi tidak dapat dimuat</h1>
          <p>{error}</p>
          <div className="pay-error-actions">
            <button
              type="button"
              className="pay-btn primary"
              onClick={() => void refreshPayment()}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              {refreshing ? (
                <>
                  <Spinner /> Memuat…
                </>
              ) : (
                "Coba lagi"
              )}
            </button>
            <button
              type="button"
              className="pay-btn"
              onClick={() => navigate("dashboard")}
            >
              Ke pesanan saya
            </button>
          </div>
        </div>
      ) : details ? (
        <>
          <header className="pay-card pay-hero">
            <div className="pay-hero-body">
              <div className="pay-top">
                <div>
                  <p className="pay-order">
                    Pesanan {details.order.order_number}
                  </p>
                  <h1 className="pay-title">
                    {cancelled
                      ? "Pesanan Dibatalkan"
                      : refunded
                        ? "Pembayaran Dikembalikan"
                        : partiallyRefunded
                          ? "Refund Sebagian"
                          : paid
                            ? "Pembayaran Selesai"
                            : canChangeMidtransMethod
                              ? "Menunggu Pembayaran"
                              : "Selesaikan Pembayaran"}
                  </h1>
                  <p className="pay-sub">
                    {cancelled
                      ? "Pesanan ini sudah dibatalkan."
                      : refunded
                        ? "Pembayaran pesanan ini telah dikembalikan."
                        : partiallyRefunded
                          ? "Sebagian pembayaran telah dikembalikan."
                          : paid
                            ? "Pembayaran sudah diverifikasi. Terima kasih telah berbelanja."
                            : isMidtrans
                              ? "Pilih kanal pembayaran di bawah untuk menyelesaikan transaksi."
                              : "Metode pembayaran ini sudah tidak tersedia. Hubungi admin untuk bantuan."}
                  </p>
                </div>
                <span
                  className={`pay-badge ${status.tone}${
                    status.pulse ? " pulse" : ""
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <i aria-hidden="true" /> {status.label}
                </span>
              </div>

              {!cancelled && (
                <ol className="pay-steps" aria-label="Progres pembayaran">
                  {STEPS.map((label, index) => {
                    const state =
                      index < activeStep
                        ? "done"
                        : index === activeStep
                          ? "current"
                          : ""
                    return (
                      <li
                        key={label}
                        className={`pay-step ${state}`}
                        aria-current={state === "current" ? "step" : undefined}
                      >
                        <div className="pay-step-row">
                          <span className="pay-dot" aria-hidden="true">
                            {state === "done" ? "✓" : index + 1}
                          </span>
                          {index < STEPS.length - 1 && (
                            <span className="pay-bar" aria-hidden="true" />
                          )}
                        </div>
                        <p className="pay-step-label">
                          <span className="sr-only">
                            {state === "done"
                              ? "Selesai: "
                              : state === "current"
                                ? "Saat ini: "
                                : "Belum: "}
                          </span>
                          {label}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              )}

              <div className="pay-total">
                <div>
                  <div className="pay-total-label" id="pay-total-label">
                    Total yang harus dibayar
                  </div>
                  <div
                    className="pay-total-value"
                    aria-labelledby="pay-total-label"
                  >
                    {formatPrice(amount)}
                  </div>
                </div>
                <div className="pay-actions">
                  {!paid && !cancelled && (
                    <button
                      type="button"
                      className={`pay-btn sm${
                        copied === "amount" ? " copied" : ""
                      }`}
                      onClick={() => void copyValue(String(amount))}
                      aria-live="polite"
                    >
                      {copied === "amount" ? "✓ Tersalin" : "Salin nominal"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="pay-btn sm"
                    onClick={() => void refreshPayment()}
                    disabled={refreshing}
                    aria-busy={refreshing}
                  >
                    {refreshing ? (
                      <>
                        <Spinner /> Memperbarui…
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">↻</span> Perbarui status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="pay-grid">
            <section className="pay-card pay-section">
              <div className="pay-sec-head">
                <span className="pay-num" aria-hidden="true">
                  1
                </span>
                <div>
                  <h2 className="pay-sec-title">Metode pembayaran</h2>
                  <p className="pay-sec-hint">Ikuti instruksi di bawah ini</p>
                </div>
              </div>

              {isMidtrans ? (
                <>
                  <div className="pay-method">
                    <div className="pay-method-ico" aria-hidden="true">
                      💳
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p className="pay-method-name">
                        {paymentMethod?.name ?? "Midtrans"}
                      </p>
                      <p className="pay-method-type">
                        Pilih Virtual Account, QRIS, e-wallet, atau kanal lain
                        di Snap.
                      </p>
                    </div>
                  </div>

                  {paymentMethod?.description && (
                    <p className="pay-desc">{paymentMethod.description}</p>
                  )}

                  {!paid && !cancelled && !refunded && !partiallyRefunded ? (
                    <div className="pay-snap-wrap">
                      {startingSnap && (
                        <p className="pay-note info mb" role="status">
                          <Spinner />{" "}
                          <span>Menyiapkan pilihan pembayaran…</span>
                        </p>
                      )}
                      <div
                        id="midtrans-snap-container"
                        className="pay-snap-container"
                      />
                      {error && (
                        <button
                          type="button"
                          className="pay-btn primary full"
                          style={{ marginTop: 12 }}
                          onClick={() => void startMidtransPayment()}
                          disabled={startingSnap || changingMethod}
                          aria-busy={startingSnap}
                        >
                          {startingSnap ? (
                            <>
                              <Spinner /> Memuat pembayaran…
                            </>
                          ) : (
                            "Coba tampilkan pembayaran"
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="pay-note neutral mt">
                      Pembayaran ini tidak memerlukan tindakan lebih lanjut.
                    </p>
                  )}
                </>
              ) : (
                <p role="alert" className="pay-note neutral">
                  Pesanan ini menggunakan metode pembayaran lama yang sudah
                  tidak tersedia. Hubungi admin jika perlu bantuan.
                </p>
              )}
            </section>

            <section className="pay-card pay-section">
              <div className="pay-sec-head">
                <span className="pay-num" aria-hidden="true">
                  2
                </span>
                <div>
                  <h2 className="pay-sec-title">Status pembayaran</h2>
                  <p className="pay-sec-hint">
                    Dikonfirmasi otomatis oleh server
                  </p>
                </div>
              </div>

              {cancelled ? (
                <p className="pay-note neutral">Pesanan dibatalkan.</p>
              ) : refunded ? (
                <p role="status" className="pay-note neutral">
                  Pembayaran ini telah dikembalikan. Hubungi admin bila Anda
                  membutuhkan rincian.
                </p>
              ) : partiallyRefunded ? (
                <p role="status" className="pay-note neutral">
                  Pembayaran ini telah dikembalikan sebagian. Hubungi admin
                  untuk rincian nominal refund.
                </p>
              ) : paid ? (
                <p role="status" className="pay-note success">
                  <span aria-hidden="true">✓</span> Pembayaran telah
                  dikonfirmasi oleh server.
                </p>
              ) : rejected ? (
                <div>
                  <p role="status" className="pay-note info">
                    Pembayaran perlu dicoba kembali. Snap akan menyiapkan
                    percobaan baru.
                  </p>
                  <button
                    type="button"
                    className="pay-btn primary full"
                    style={{ marginTop: 12 }}
                    onClick={() => void startMidtransPayment()}
                    disabled={startingSnap}
                    aria-busy={startingSnap}
                  >
                    {startingSnap ? (
                      <>
                        <Spinner /> Menyiapkan pembayaran…
                      </>
                    ) : (
                      "Coba bayar lagi"
                    )}
                  </button>
                </div>
              ) : canRetryMidtransAttempt ? (
                <div>
                  <p role="status" className="pay-note neutral">
                    Percobaan pembayaran sebelumnya berakhir. Buat percobaan
                    baru untuk memilih kanal pembayaran lagi.
                  </p>
                  <button
                    type="button"
                    className="pay-btn primary full"
                    style={{ marginTop: 12 }}
                    onClick={() => void startMidtransPayment()}
                    disabled={startingSnap || changingMethod}
                    aria-busy={startingSnap}
                  >
                    {startingSnap ? (
                      <>
                        <Spinner /> Menyiapkan pembayaran…
                      </>
                    ) : (
                      "Pilih kanal pembayaran lagi"
                    )}
                  </button>
                </div>
              ) : isMidtrans ? (
                <div>
                  <p role="status" className="pay-note info">
                    {canChangeMidtransMethod
                      ? "Transaksi sebelumnya masih menunggu pembayaran. Anda dapat melanjutkannya di panel Snap atau membatalkannya untuk memilih kanal lain."
                      : "Pilih salah satu kanal pada panel Snap. Instruksi pembayaran akan tampil di sana."}
                  </p>
                  {canChangeMidtransMethod && (
                    <div style={{ marginTop: 12 }}>
                      <p
                        className="pay-note warn"
                        role="alert"
                        style={{ marginBottom: 10, fontSize: ".8rem" }}
                      >
                        <span aria-hidden="true">⚠️</span> Instruksi
                        pembayaran yang sedang aktif akan dibuang dan tidak
                        bisa dilanjutkan lagi.
                      </p>
                      <button
                        type="button"
                        className="pay-btn full"
                        onClick={() => void changePaymentMethod()}
                        disabled={changingMethod || startingSnap}
                        aria-busy={changingMethod}
                      >
                        {changingMethod ? (
                          <>
                            <Spinner /> Membatalkan transaksi…
                          </>
                        ) : (
                          "Batalkan & pilih kanal lain"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p role="status" className="pay-note neutral">
                  Metode pembayaran lama ini perlu ditangani admin.
                </p>
              )}

              <div aria-live="assertive" aria-atomic="true">
                {error && details && (
                  <p role="alert" className="pay-note danger mt">
                    {error}
                  </p>
                )}
              </div>
              <div aria-live="polite" aria-atomic="true">
                {message && details && (
                  <p
                    role="status"
                    className={`pay-note ${paid ? "success" : "info"} mt`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </section>
          </div>

          <p className="pay-foot">
            {isMidtrans
              ? "Status pembayaran diperbarui otomatis setelah Midtrans mengonfirmasi transaksi."
              : "Hubungi admin untuk bantuan terkait transaksi lama ini."}
          </p>
          <div className="pay-foot-actions">
            <button
              type="button"
              className="pay-btn"
              onClick={() => navigate("dashboard", { menu: "pesanan" })}
            >
              Lihat pesanan saya
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
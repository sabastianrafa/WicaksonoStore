import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { apiFetch, storageUrl } from "../../../api/client"
import { formatPrice } from "../../../data"
import type { Page } from "../../../App"

import type { ReactNode } from "react"

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
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

function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-gray-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#DF3E1D]" />
      {label}
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



// ─── Types ──────────────────────────────────────────────

interface ProductImage {
  path: string
  url?: string
  is_primary?: boolean
}

interface Product {
  name: string
  image?: string | null
  images?: ProductImage[]
}

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  price: string | number
  product?: Product | null
}

interface Order {
  id: number
  order_number: string
  order_status: string | { value?: string }
  total: string | number
  created_at: string
  items: OrderItem[]
  payment?: {
    status?: string
  } | null
}

interface OrdersMenuProps {
  navigate: (page: Page) => void
}

// ─── Helpers ────────────────────────────────────────────

function getOrderStatus(order: Order): string {
  if (typeof order.order_status === "string") {
    return order.order_status
  }

  return order.order_status?.value ?? "pending"
}

function getProductImage(product?: Product | null): string {
  const images = product?.images ?? []

  const primaryImage = images.find((image) => image.is_primary)
  const imageUrl =
    primaryImage?.url ??
    images[0]?.url ??
    primaryImage?.path ??
    images[0]?.path ??
    product?.image ??
    ""

  return storageUrl(imageUrl)
}

function formatOrderDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    dateStyle: "long",
  })
}

// ─── Components ─────────────────────────────────────────

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        role="img"
        aria-label={item.product?.name ?? item.product_name ?? "Produk"}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50"
      >
        <img
          src="/images/logo/wicaksono_logo_1.webp"
          alt=""
          aria-hidden="true"
          className="absolute h-2/3 w-2/3 object-contain opacity-40"
        />
        {getProductImage(item.product) && (
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={getProductImage(item.product)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none"
            }}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">
          {item.product_name || item.product?.name || "Produk"}
        </p>

        <p className="text-xs text-gray-500">
          {item.quantity} × {formatPrice(Number(item.price))}
        </p>
      </div>
    </div>
  )
}

function OrderCard({
  order,
  busy,
  onCancel,
}: {
  order: Order
  busy: boolean
  onCancel: (order: Order) => void
}) {
  const status = getOrderStatus(order)
  const canCancel = status === "pending"
  const canPay = order.payment?.status === "pending" && status !== "cancelled"

  return (
    <article className="rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {order.order_number}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatOrderDate(order.created_at)}
          </p>
        </div>

        <span className="rounded-full bg-[#FFF7F5] px-2.5 py-1 text-xs font-semibold capitalize text-[#DF3E1D]">
          {status}
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {(order.items ?? []).map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-600">
          Total{" "}
          <strong className="ml-1 text-gray-900">
            {formatPrice(Number(order.total))}
          </strong>
        </p>

        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <button
              type="button"
              className={outlineButton}
              disabled={busy}
              onClick={() => onCancel(order)}
            >
              {busy ? "Membatalkan…" : "Batalkan"}
            </button>
          )}

          {canPay && (
            <Link
              className="inline-flex items-center rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c93619]"
              to={`/pembayaran/${order.id}`}
            >
              Bayar
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Main Component ─────────────────────────────────────

export default function OrdersMenu({ navigate }: OrdersMenuProps) {
  const navigateRef = useRef(navigate)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  // Fetch order history from Laravel backend.
  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await apiFetch<{ data: Order[] }>("/orders?per_page=50")

      setOrders(response.data ?? [])
    } catch (err) {
      if (isUnauthorized(err)) {
        navigateRef.current("login")
        return
      }

      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, reload])

  // Cancel an order through the Laravel API.
  const cancel = useCallback(async (order: Order) => {
    const confirmed = window.confirm(`Batalkan pesanan ${order.order_number}?`)

    if (!confirmed) return

    setBusyId(order.id)
    setError("")
    setSuccess("")

    try {
      await apiFetch(`/orders/${order.id}/cancel`, {
        method: "POST",
      })

      setSuccess("Pesanan berhasil dibatalkan.")
      setReload((value) => value + 1)
    } catch (err) {
      if (isUnauthorized(err)) {
        navigateRef.current("login")
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setBusyId(null)
    }
  }, [])

  return (
    <div className={cardClass}>
      <SectionHeader
        title="Riwayat Pesanan"
        description="Lihat transaksi dan status pengiriman pesanan kamu."
      />

      <ErrorNotice message={error} retry={load} />
      <SuccessNotice message={success} />

      {loading ? (
        <LoadingState />
      ) : orders.length === 0 ? (
        <EmptyState>Belum ada pesanan.</EmptyState>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onCancel={cancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch, storageUrl } from "../../../api/client"
import { formatPrice } from "../../../data"
import type { Page } from "../../../App"
import {
  cardClass,
  EmptyState,
  ErrorNotice,
  getErrorMessage,
  isUnauthorized,
  LoadingState,
  outlineButton,
  SectionHeader,
  SuccessNotice,
} from "./shared"

interface Product {
  name: string
  image?: string | null
  images?: {
    path: string
    url?: string
    is_primary?: boolean
  }[]
}
interface Item {
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
  items: Item[]
  payment?: { status?: string } | null
}

export default function OrdersMenu({
  navigate,
}: {
  navigate: (page: Page) => void
}) {
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)
  const load = useCallback(() => {
    setLoading(true)
    setError("")
    apiFetch<{ data: Order[] }>("/orders?per_page=50")
      .then((response) => setOrders(response.data ?? []))
      .catch((err) => {
        if (isUnauthorized(err)) navigateRef.current("login")
        else setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [reload])
  useEffect(() => {
    load()
  }, [load])
  const cancel = async (order: Order) => {
    if (!window.confirm(`Batalkan pesanan ${order.order_number}?`)) return
    setBusyId(order.id)
    setError("")
    try {
      await apiFetch(`/orders/${order.id}/cancel`, { method: "POST" })
      setSuccess("Pesanan berhasil dibatalkan.")
      setReload((value) => value + 1)
    } catch (err) {
      if (isUnauthorized(err)) navigateRef.current("login")
      else setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }
  
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
        <div className="space-y-4">
          {orders.map((order) => {
            const status =
              typeof order.order_status === "string"
                ? order.order_status
                : (order.order_status?.value ?? "pending")
            return (
              <article
                key={order.id}
                className="rounded-xl border border-gray-100 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        dateStyle: "long",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold capitalize text-[#DF3E1D]">
                    {status}
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <img
                        className="h-12 w-12 rounded-lg bg-gray-50 object-cover"
                        src={
                          item.product?.images?.find(
                            (image) => image.is_primary,
                          )?.url ??
                          item.product?.images?.[0]?.url ??
                          (item.product?.image
                            ? storageUrl(item.product.image)
                            : "")
                        }
                        alt=""
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {item.product_name || item.product?.name || "Produk"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × {formatPrice(Number(item.price))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <p className="text-sm text-gray-600">
                    Total{" "}
                    <strong className="ml-1 text-gray-900">
                      {formatPrice(Number(order.total))}
                    </strong>
                  </p>
                  <div className="flex gap-2">
                    {status === "pending" && (
                      <button
                        type="button"
                        className={outlineButton}
                        disabled={busyId === order.id}
                        onClick={() => void cancel(order)}
                      >
                        {busyId === order.id ? "Membatalkan…" : "Batalkan"}
                      </button>
                    )}
                    {order.payment?.status === "pending" &&
                      status !== "cancelled" && (
                        <Link
                          className="inline-flex items-center rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white"
                          to={`/pembayaran/${order.id}`}
                        >
                          Bayar
                        </Link>
                      )}
                  </div>
                </div>

              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
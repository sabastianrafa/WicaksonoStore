
import type { PaymentStatusType } from "../../types/payment"

interface Props {
  paymentStatus: PaymentStatusType
  orderStatus: string
}

export default function PaymentStatus({
  paymentStatus,
  orderStatus,
}: Props) {
  const cancelled = orderStatus === "cancelled"

  const status = cancelled
    ? {
        label: "Dibatalkan",
        description:
          "Pesanan ini sudah dibatalkan dan tidak dapat dibayar kembali.",
        style: "bg-gray-100 text-gray-600",
        dot: "bg-gray-500",
      }
    : paymentStatus === "paid"
      ? {
          label: "Berhasil",
          description: "Pembayaran berhasil dikonfirmasi.",
          style: "bg-green-50 text-green-700",
          dot: "bg-green-500",
        }
      : paymentStatus === "refunded"
        ? {
            label: "Dikembalikan",
            description: "Dana pembayaran telah dikembalikan.",
            style: "bg-gray-100 text-gray-600",
            dot: "bg-gray-500",
          }
        : paymentStatus === "partially_refunded"
          ? {
              label: "Refund Sebagian",
              description: "Sebagian dana pembayaran telah dikembalikan.",
              style: "bg-gray-100 text-gray-600",
              dot: "bg-gray-500",
            }
          : paymentStatus === "rejected"
            ? {
                label: "Gagal",
                description:
                  "Pembayaran tidak berhasil. Silakan periksa status pesanan.",
                style: "bg-red-50 text-red-600",
                dot: "bg-red-500",
              }
            : {
                label: "Menunggu Pembayaran",
                description:
                  "Silakan selesaikan pembayaran sebelum batas waktu berakhir.",
                style: "bg-amber-50 text-amber-700",
                dot: "bg-amber-500",
              }

  return (
    <section className="flex items-start justify-between gap-4 bg-white p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">
          Status Transaksi
        </p>

        <p className="mt-1 text-sm text-gray-600">
          {status.description}
        </p>
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium ${status.style}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
        {status.label}
      </span>
    </section>
  )
}

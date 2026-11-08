
import { formatPrice } from "../../data"
import type { PaymentOrder, Payment } from "../../types/payment"
import { HiOutlineRefresh } from "react-icons/hi"

interface Props {
  order: PaymentOrder
  payment: Payment
  onRefresh: () => void
  refreshing: boolean
}

export default function PaymentSummary({
  order,
  payment,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <section className="flex items-center justify-between gap-4 bg-white p-5 sm:p-6">
      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          Nomor Pesanan
        </p>

        <p className="mt-1 text-sm font-semibold text-gray-700">
          #{order.order_number}
        </p>

        <p className="mt-3 text-2xl font-bold tracking-tight text-[#DF401F]">
          {formatPrice(Number(payment.amount))}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Perbarui status pembayaran"
        title="Perbarui status"
        className="shrink-0 rounded-lg border border-gray-200 p-2.5 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-40"
      >
        <HiOutlineRefresh
          className={`h-5 w-5 ${
            refreshing ? "animate-spin" : ""
          }`}
        />
      </button>
    </section>
  )
}

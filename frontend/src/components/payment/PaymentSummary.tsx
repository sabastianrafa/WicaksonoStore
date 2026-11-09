
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-lg" aria-hidden="true">💳</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Ringkasan pembayaran</p>
            <p className="text-xs text-slate-500">Diproses aman oleh Midtrans</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Aman</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">Nomor pesanan</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">
          #{order.order_number}
        </p>
      </div>
      <div className="mt-5 flex items-end justify-between border-t border-dashed border-slate-200 pt-4">
        <div>
          <p className="text-xs text-slate-500">Total pembayaran</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{formatPrice(Number(payment.amount))}</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={refreshing} aria-label="Perbarui status pembayaran" title="Perbarui status" className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40">
          <HiOutlineRefresh className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </section>
  )
}

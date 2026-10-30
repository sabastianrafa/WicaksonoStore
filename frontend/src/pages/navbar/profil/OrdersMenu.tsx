
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch, storageUrl } from "../../../api/client";
import { formatPrice } from "../../../data";
import type { Page } from "../../../App";

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
} from "./shared";

// ─── Types ──────────────────────────────────────────────

interface ProductImage {
  path: string;
  url?: string;
  is_primary?: boolean;
}

interface Product {
  name: string;
  image?: string | null;
  images?: ProductImage[];
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: string | number;
  product?: Product | null;
}

interface Order {
  id: number;
  order_number: string;
  order_status: string | { value?: string };
  total: string | number;
  created_at: string;
  items: OrderItem[];
  payment?: {
    status?: string;
  } | null;
}

interface OrdersMenuProps {
  navigate: (page: Page) => void;
}

// ─── Helpers ────────────────────────────────────────────

function getOrderStatus(order: Order): string {
  if (typeof order.order_status === "string") {
    return order.order_status;
  }

  return order.order_status?.value ?? "pending";
}

function getProductImage(product?: Product | null): string {
  const images = product?.images ?? [];

  const primaryImage = images.find((image) => image.is_primary);
  const imageUrl = primaryImage?.url ?? images[0]?.url;

  if (imageUrl) {
    return imageUrl;
  }

  return product?.image ? storageUrl(product.image) : "";
}

function formatOrderDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    dateStyle: "long",
  });
}

// ─── Components ─────────────────────────────────────────

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <img
        className="h-12 w-12 rounded-lg bg-gray-50 object-cover"
        src={getProductImage(item.product)}
        alt={item.product?.name ?? item.product_name ?? "Produk"}
        loading="lazy"
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
  );
}

function OrderCard({
  order,
  busy,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onCancel: (order: Order) => void;
}) {
  const status = getOrderStatus(order);
  const canCancel = status === "pending";
  const canPay =
    order.payment?.status === "pending" && status !== "cancelled";

  return (
    <article className="rounded-xl border border-gray-100 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {order.order_number}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatOrderDate(order.created_at)}
          </p>
        </div>

        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold capitalize text-[#DF3E1D]">
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
  );
}

// ─── Main Component ─────────────────────────────────────

export default function OrdersMenu({ navigate }: OrdersMenuProps) {
  const navigateRef = useRef(navigate);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Fetch order history from Laravel backend.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<{ data: Order[] }>(
        "/orders?per_page=50",
      );

      setOrders(response.data ?? []);
    } catch (err) {
      if (isUnauthorized(err)) {
        navigateRef.current("login");
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reload]);

  // Cancel an order through the Laravel API.
  const cancel = useCallback(async (order: Order) => {
    const confirmed = window.confirm(
      `Batalkan pesanan ${order.order_number}?`,
    );

    if (!confirmed) return;

    setBusyId(order.id);
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/orders/${order.id}/cancel`, {
        method: "POST",
      });

      setSuccess("Pesanan berhasil dibatalkan.");
      setReload((value) => value + 1);
    } catch (err) {
      if (isUnauthorized(err)) {
        navigateRef.current("login");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setBusyId(null);
    }
  }, []);

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
  );
}

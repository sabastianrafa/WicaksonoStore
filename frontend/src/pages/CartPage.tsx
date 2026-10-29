import { useEffect, useState } from 'react';
import { 
  FiShoppingCart, FiTrash2, FiMinus, FiPlus, 
  FiArrowRight, FiArrowLeft, FiCreditCard 
} from 'react-icons/fi';
import { formatPrice } from '../data';
import { apiFetch, storageUrl } from '../api/client';
import type { Page } from "../App";

/* =========================================================
   TYPES
========================================================= */
interface CartProduct { id: number; name: string; price: string | number; stock: number; weight: number; category?: { id: number; name: string; }; images?: { id: number; path: string; url?: string; is_primary?: boolean; }[]; image?: string | null; }
interface CartItem { id: number; product_id: number; quantity: number; subtotal: number; product: CartProduct; }
interface CartData { id: number; user_id: number; items: CartItem[]; total_items: number; subtotal: number; }
interface CartResponse { success: boolean; message: string; data: CartData; }
interface CartItemResponse { success: boolean; message: string; data: CartItem; }
interface CartActionResponse { success: boolean; message: string; }
interface PaymentMethod { id: number; name: string; code: string; icon: string | null; is_active: boolean; }
interface CartPageProps { cart: CartItem[]; setCart: (cart: CartItem[]) => void; navigate: (page: Page) => void; }

/**
 * Helper: Mendapatkan URL gambar produk.
 */
const getProductImage = (item: CartItem) => {
  const product = item.product;
  if (!product) return '';

  const imageUrl = product.images?.find((img) => img.is_primary)?.url ?? product.images?.[0]?.url ?? product.image ?? '';
  if (!imageUrl) return '';

  return imageUrl.startsWith('http') ? imageUrl : storageUrl(imageUrl);
};

/* =========================================================
   COMPONENT
========================================================= */
export default function CartPage({ cart, setCart, navigate }: CartPageProps) {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  /* LOAD DATA */
  const loadCart = async () => {
    try {
      setError("");
      const response = await apiFetch<CartResponse>("/cart");
      setCart(response.data.items);
    } catch (error) {
      console.error("Gagal mengambil keranjang:", error);
      setError(error instanceof Error ? error.message : "Gagal mengambil data keranjang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    let active = true;
    const loadPaymentMethods = async () => {
      try {
        const response = await apiFetch<{ data?: PaymentMethod[] }>("/payment-methods");
        if (active) setPaymentMethods(response.data ?? []);
      } catch (err) {
        console.error("Gagal memuat metode pembayaran:", err);
      }
    };
    loadPaymentMethods();
    return () => { active = false; };
  }, []);

  /* ACTIONS */
  const updateQty = async (item: CartItem, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(item.id);
      return;
    }

    try {
      setUpdatingId(item.id);
      setError("");
      const response = await apiFetch<CartItemResponse>(`/cart/items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      setCart(cart.map((cartItem) => cartItem.id === item.id ? response.data : cartItem));
    } catch (error) {
      console.error("Gagal memperbarui quantity:", error);
      setError(error instanceof Error ? error.message : "Gagal memperbarui jumlah produk.");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      setUpdatingId(itemId);
      setError("");
      await apiFetch<CartActionResponse>(`/cart/items/${itemId}`, { method: "DELETE" });
      setCart(cart.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Gagal menghapus item:", error);
      setError(error instanceof Error ? error.message : "Gagal menghapus produk.");
    } finally {
      setUpdatingId(null);
    }
  };

  const clearCart = async () => {
    if (validItems.length === 0) return;
    try {
      setLoading(true);
      setError("");
      await apiFetch<CartActionResponse>("/cart", { method: "DELETE" });
      setCart([]);
    } catch (error) {
      console.error("Gagal mengosongkan keranjang:", error);
      setError(error instanceof Error ? error.message : "Gagal mengosongkan keranjang.");
    } finally {
      setLoading(false);
    }
  };

  /* CALCULATIONS */
  const validItems = cart.filter((item): item is CartItem => Boolean(item && item.product));

  const itemSubtotal = (item: CartItem) => {
    const fromServer = Number(item.subtotal);
    if (Number.isFinite(fromServer) && item.subtotal != null) return fromServer;
    return Number(item.product?.price ?? 0) * Number(item.quantity ?? 0);
  };

  const subtotal = validItems.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const totalItems = validItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const total = subtotal;

  /* =========================================================
     RENDER STATES
  ========================================================= */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-6 text-center">
        <FiShoppingCart className="mx-auto text-5xl text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Memuat keranjang...</h2>
        <p className="text-gray-500">Mengambil data keranjang dari server.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <button 
          onClick={() => navigate("home")} 
          className="text-[#DF401F] hover:underline font-medium font-poppins"
        >
          Beranda
        </button>
        <span>/</span>
        <span className="text-gray-800 font-semibold">Keranjang Belanja</span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Title */}
      <h1 className="text-[20px] font-[400] text-gray-800 mb-4">
        Keranjang Belanja {validItems.length > 0 && <span className="text-gray-400">| {totalItems}</span>}
      </h1>

      {/* EMPTY CART */}
      {validItems.length === 0 ? (
        <div className="text-center py-20 px-5">
          <FiShoppingCart className="mx-auto text-7xl text-gray-300 mb-5" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Keranjang Kosong</h2>
          <p className="text-gray-500 mb-7">Belum ada produk di keranjangmu. Mulai belanja yuk!</p>
          <button 
            onClick={() => navigate("catalog")}
            className="bg-[#DF401F] hover:bg-orange-700 text-white py-3 px-8 rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <FiShoppingCart /> Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          
          {/* CART ITEMS */}
          <div className="flex flex-col gap-4">
            {/* Header / Select All Bar */}
            <div className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm border border-gray-100">
              <span className="font-semibold text-gray-800 text-sm">Semua Produk</span>
              <button 
                onClick={clearCart} 
                disabled={loading}
                className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 /> Hapus Semua
              </button>
            </div>

            {/* Item List */}
            {validItems.map((item) => {
              const isUpdating = updatingId === item.id;
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-xl p-5 flex gap-4 items-center shadow-sm border border-gray-100 transition-opacity ${isUpdating ? 'opacity-50' : 'opacity-100'}`}
                >
                  {/* Image */}
                  <img 
                    src={getProductImage(item)} 
                    alt={item.product?.name ?? 'Produk'} 
                    className="w-20 h-20 object-cover rounded-lg bg-gray-50 flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 capitalize mb-1">{item.product.category?.name ?? ""}</p>
                    <h3 className="font-semibold text-gray-800 text-sm md:text-base truncate mb-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      {item.product.weight > 0
                        ? `Berat ${item.product.weight.toLocaleString('id-ID')} g`
                        : 'Berat belum diatur'}
                    </p>
                    <p className="font-bold text-[#DF401F]">
                      {formatPrice(Number(item.product.price))}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <button 
                      onClick={() => removeItem(item.id)}
                      disabled={isUpdating}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center border-2 border-gray-100 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateQty(item, item.quantity - 1)}
                        disabled={isUpdating}
                        className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiMinus />
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-gray-800">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQty(item, item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= item.product.stock}
                        className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 disabled:cursor-not-allowed transition-colors"
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <span className="font-bold text-gray-800 text-sm">
                      {formatPrice(itemSubtotal(item))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY (Sidebar) */}
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-5 text-lg">Ringkasan Pesanan</h3>

              <div className="flex flex-col gap-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({totalItems} produk)</span>
                  <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-black text-xl text-[#DF401F]">{formatPrice(total)}</span>
              </div>

              <button 
                onClick={() => navigate("checkout")}
                className="w-full bg-[#DF401F] hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-colors mb-3"
              >
                Lanjut ke Pembayaran <FiArrowRight />
              </button>

              <button 
                onClick={() => navigate("catalog")}
                className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 flex justify-center items-center gap-2 transition-colors text-sm"
              >
                <FiArrowLeft /> Lanjut Belanja
              </button>
            </div>

            {/* PAYMENT METHODS */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-4">
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <FiCreditCard /> Metode Pembayaran
              </p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.length === 0 ? (
                  <span className="text-xs text-gray-400">Belum ada metode pembayaran aktif.</span>
                ) : (
                  paymentMethods.map((method) => (
                    <span 
                      key={method.id} 
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 flex items-center gap-1.5"
                    >
                      {method.icon ?? <FiCreditCard className="text-gray-400" />} {method.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
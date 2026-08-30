<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Menampilkan data ringkasan dashboard untuk admin.
     *
     * GET /api/admin/dashboard
     */
    public function index(Request $request): JsonResponse
    {
        $totalProducts = Product::count();
        $activeProducts = Product::where('is_active', true)->count();
        $totalCategories = Category::count();
        $totalUsers = User::where('role', UserRole::USER)->count();
        $totalOrders = Order::count();

        $pendingOrders = Order::where('order_status', OrderStatus::PENDING)->count();
        $confirmedOrders = Order::where('order_status', OrderStatus::CONFIRMED)->count();
        $processingOrders = Order::where('order_status', OrderStatus::PROCESSING)->count();
        $shippedOrders = Order::where('order_status', OrderStatus::SHIPPED)->count();
        $completedOrders = Order::where('order_status', OrderStatus::COMPLETED)->count();
        $cancelledOrders = Order::where('order_status', OrderStatus::CANCELLED)->count();

        $pendingPayments = Payment::where('status', PaymentStatus::PENDING)->count();

        // Total pendapatan dari pembayaran yang sudah berstatus PAID
        $totalRevenue = (float) Payment::where('status', PaymentStatus::PAID)->sum('amount');

        // Pesanan terbaru
        $recentOrders = Order::with(['user', 'payment'])
            ->latest()
            ->take(5)
            ->get();

        // Produk terlaris
        $topProducts = Product::orderByDesc('sold')
            ->take(5)
            ->get(['id', 'name', 'slug', 'price', 'stock', 'sold', 'rating', 'image']);

        return response()->json([
            'success' => true,
            'message' => 'Data statistik dashboard berhasil diambil.',
            'data' => [
                'summary' => [
                    'total_products' => $totalProducts,
                    'active_products' => $activeProducts,
                    'total_categories' => $totalCategories,
                    'total_users' => $totalUsers,
                    'total_orders' => $totalOrders,
                    'pending_orders' => $pendingOrders,
                    'confirmed_orders' => $confirmedOrders,
                    'processing_orders' => $processingOrders,
                    'shipped_orders' => $shippedOrders,
                    'completed_orders' => $completedOrders,
                    'cancelled_orders' => $cancelledOrders,
                    'pending_payments' => $pendingPayments,
                    'total_revenue' => $totalRevenue,
                ],
                'recent_orders' => $recentOrders,
                'top_products' => $topProducts,
            ],
        ]);
    }

    /**
     * Laporan penjualan.
     *
     * GET /api/admin/reports/sales
     */
    public function salesReport(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['payment', 'user', 'items']);

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        $orders = $query->latest()->get();

        $totalSales = $orders->count();
        $completedSales = $orders->where('order_status', OrderStatus::COMPLETED)->count();
        $totalGrossRevenue = (float) $orders->where('order_status', '!=', OrderStatus::CANCELLED)->sum('total');
        $paidRevenue = (float) $orders->filter(function ($order) {
            return $order->payment && $order->payment->status === PaymentStatus::PAID;
        })->sum('total');

        return response()->json([
            'success' => true,
            'message' => 'Laporan penjualan berhasil diambil.',
            'data' => [
                'total_orders' => $totalSales,
                'completed_orders' => $completedSales,
                'total_gross_revenue' => $totalGrossRevenue,
                'total_paid_revenue' => $paidRevenue,
                'orders' => $orders,
            ],
        ]);
    }

    /**
     * Laporan produk dan stok.
     *
     * GET /api/admin/reports/products
     */
    public function productReport(Request $request): JsonResponse
    {
        $products = Product::with('category')
            ->orderBy('stock', 'asc')
            ->get();

        $lowStockProducts = $products->filter(fn ($p) => $p->stock <= 10)->values();
        $outOfStockProducts = $products->filter(fn ($p) => $p->stock == 0)->values();

        return response()->json([
            'success' => true,
            'message' => 'Laporan produk berhasil diambil.',
            'data' => [
                'total_products' => $products->count(),
                'low_stock_count' => $lowStockProducts->count(),
                'out_of_stock_count' => $outOfStockProducts->count(),
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
                'all_products' => $products,
            ],
        ]);
    }
}

<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ShippingMethodController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\WishlistController;

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\ShippingMethodController as AdminShippingMethodController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Api\Admin\ProductImageController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{product}', [ProductController::class, 'show']);
    Route::get('/{product}/reviews', [ReviewController::class, 'index']);
});

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{category}', [CategoryController::class, 'show']);
});

Route::prefix('shipping-methods')->group(function () {
    Route::get('/', [ShippingMethodController::class, 'index']);
    Route::get('/{shippingMethod}', [ShippingMethodController::class, 'show']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    Route::apiResource('addresses', AddressController::class);

    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/items', [CartController::class, 'addItem']);
        Route::put('/items/{item}', [CartController::class, 'updateItem']);
        Route::delete('/items/{item}', [CartController::class, 'removeItem']);
        Route::delete('/', [CartController::class, 'clear']);
    });

    Route::prefix('wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::get('/{product}', [WishlistController::class, 'check']);
        Route::post('/{product}', [WishlistController::class, 'store']);
        Route::delete('/{product}', [WishlistController::class, 'destroy']);
    });

    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/{order}', [OrderController::class, 'show']);
        Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
    });

    Route::prefix('orders/{order}/payment')->group(function () {
        Route::get('/', [PaymentController::class, 'show']);
        Route::post('/', [PaymentController::class, 'store']);
    });

    Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        
        Route::apiResource('products', AdminProductController::class);
        
        Route::prefix('products/{product}/images')->group(function () {
            Route::post('/', [ProductImageController::class, 'store']);
            Route::delete('/{image}', [ProductImageController::class, 'destroy']);
            Route::patch('/{image}/primary', [ProductImageController::class, 'setPrimary']);
        });

        Route::apiResource('categories', AdminCategoryController::class);

        Route::apiResource('shipping-methods', AdminShippingMethodController::class);

        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
        Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/{payment}', [AdminPaymentController::class, 'show']);
        Route::patch('/payments/{payment}/verify', [AdminPaymentController::class, 'verify']);
        Route::patch('/payments/{payment}/reject', [AdminPaymentController::class, 'reject']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        Route::prefix('reports')->group(function () {
            Route::get('/sales', [DashboardController::class, 'salesReport']);
            Route::get('/products', [DashboardController::class, 'productReport']);
        });
    });
});

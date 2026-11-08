
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
use App\Http\Controllers\Api\LocationController;

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\ShippingMethodController as AdminShippingMethodController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\ShippingPromotionController;

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| Public Products
|--------------------------------------------------------------------------
*/

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{product}', [ProductController::class, 'show']);
    Route::get('/{product}/reviews', [ReviewController::class, 'index']);
});

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/reviews', [ReviewController::class, 'latest']);

/*
|--------------------------------------------------------------------------
| Shipping Methods
|--------------------------------------------------------------------------
*/

Route::prefix('shipping-methods')->group(function () {
    Route::get('/', [ShippingMethodController::class, 'index']);
    Route::get('/{shippingMethod}', [ShippingMethodController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Location
|--------------------------------------------------------------------------
*/

Route::prefix('locations')->group(function () {
    Route::get('/provinces', [LocationController::class, 'provinces']);

    Route::get(
        '/provinces/{province}/regencies',
        [LocationController::class, 'regencies']
    );

    Route::get(
        '/regencies/{regency}/districts',
        [LocationController::class, 'districts']
    );

    Route::get(
        '/districts/{district}/villages',
        [LocationController::class, 'villages']
    );
});

/*
|--------------------------------------------------------------------------
| Midtrans Webhook
|--------------------------------------------------------------------------
| Endpoint ini dipanggil langsung oleh Midtrans.
| Tidak menggunakan autentikasi Sanctum.
*/

Route::post(
    '/payments/midtrans/notification',
    [PaymentController::class, 'handleMidtransNotification']
);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
    });

    /*
    |--------------------------------------------------------------------------
    | Addresses
    |--------------------------------------------------------------------------
    */

    Route::apiResource('addresses', AddressController::class);

    /*
    |--------------------------------------------------------------------------
    | Cart
    |--------------------------------------------------------------------------
    */

    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/items', [CartController::class, 'addItem']);
        Route::put('/items/{item}', [CartController::class, 'updateItem']);
        Route::delete('/items/{item}', [CartController::class, 'removeItem']);
        Route::delete('/', [CartController::class, 'clear']);
    });

    /*
    |--------------------------------------------------------------------------
    | Shipping
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/shipping-methods/quote',
        [ShippingMethodController::class, 'quote']
    );

    /*
    |--------------------------------------------------------------------------
    | Orders
    |--------------------------------------------------------------------------
    */

    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/{order}', [OrderController::class, 'show']);

        Route::post(
            '/{order}/cancel',
            [OrderController::class, 'cancel']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Midtrans Payments
    |--------------------------------------------------------------------------
    */

    Route::prefix('orders/{order}/payment')->group(function () {
        Route::get('/', [PaymentController::class, 'show']);

        Route::post(
            '/snap-token',
            [PaymentController::class, 'createSnapToken']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Reviews
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/products/{product}/reviews',
        [ReviewController::class, 'store']
    );

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->prefix('admin')->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index']);

        /*
        | Products
        */

        Route::apiResource('products', AdminProductController::class);

        Route::prefix('products/{product}/images')->group(function () {
            Route::post('/', [ProductImageController::class, 'store']);
            Route::delete('/{image}', [ProductImageController::class, 'destroy']);

            Route::patch(
                '/{image}/primary',
                [ProductImageController::class, 'setPrimary']
            );
        });

        /*
        | Categories
        */

        Route::apiResource('categories', AdminCategoryController::class);

        /*
        | Shipping
        */

        Route::get(
            '/shipping-methods',
            [AdminShippingMethodController::class, 'index']
        );

        Route::get(
            '/shipping-methods/{shippingMethod}',
            [AdminShippingMethodController::class, 'show']
        );

        Route::put(
            '/shipping-methods/{shippingMethod}',
            [AdminShippingMethodController::class, 'update']
        );

        Route::patch(
            '/shipping-methods/{shippingMethod}',
            [AdminShippingMethodController::class, 'update']
        );

        Route::get(
            '/shipping-promotion',
            [ShippingPromotionController::class, 'show']
        );

        Route::put(
            '/shipping-promotion',
            [ShippingPromotionController::class, 'update']
        );

        /*
        | Orders
        */

        Route::get('/orders', [AdminOrderController::class, 'index']);

        Route::get(
            '/orders/{order}',
            [AdminOrderController::class, 'show']
        );

        Route::patch(
            '/orders/{order}/status',
            [AdminOrderController::class, 'updateStatus']
        );

        /*
        | Payments
        | Admin hanya melihat informasi pembayaran.
        | Status pembayaran diperbarui melalui webhook Midtrans.
        */

        Route::get('/payments', [AdminPaymentController::class, 'index']);

        Route::get(
            '/payments/{payment}',
            [AdminPaymentController::class, 'show']
        );

        /*
        | Users
        */

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);

        Route::patch(
            '/users/{user}/role',
            [AdminUserController::class, 'updateRole']
        );

        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        /*
        | Reports
        */

        Route::prefix('reports')->group(function () {
            Route::get('/sales', [DashboardController::class, 'salesReport']);
            Route::get('/products', [DashboardController::class, 'productReport']);
        });
    });
});

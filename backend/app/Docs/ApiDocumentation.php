<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

/**
 * Dokumentasi endpoint API WicaksonoStore.
 *
 * File ini hanya mendokumentasikan route yang sudah ada di routes/api.php.
 * Tidak mengubah controller atau perilaku API.
 */
class ApiDocumentation
{
    #[OA\Post(
        path: '/api/register',
        summary: 'Register user',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Bastian'),
                    new OA\Property(property: 'email', type: 'string', example: 'user@example.com', format: 'email'),
                    new OA\Property(property: 'phone', type: 'string', example: '08123456789'),
                    new OA\Property(property: 'password', type: 'string', example: 'password123', format: 'password'),
                    new OA\Property(property: 'password_confirmation', type: 'string', example: 'password123', format: 'password')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Registrasi berhasil'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ]
    )]
    public function registerRoot(): void {}

    #[OA\Post(
        path: '/api/auth/register',
        summary: 'Register user',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['name', 'email', 'password', 'password_confirmation'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Bastian'),
                    new OA\Property(property: 'email', type: 'string', example: 'user@example.com', format: 'email'),
                    new OA\Property(property: 'phone', type: 'string', example: '08123456789'),
                    new OA\Property(property: 'password', type: 'string', example: 'password123', format: 'password'),
                    new OA\Property(property: 'password_confirmation', type: 'string', example: 'password123', format: 'password')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Registrasi berhasil'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ]
    )]
    public function registerAuth(): void {}

    #[OA\Post(
        path: '/api/login',
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', example: 'user@example.com', format: 'email'),
                    new OA\Property(property: 'password', type: 'string', example: 'password123', format: 'password')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Login berhasil'),
                new OA\Response(response: 422, description: 'Email atau password salah')
            ]
    )]
    public function loginRoot(): void {}

    #[OA\Post(
        path: '/api/auth/login',
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', example: 'user@example.com', format: 'email'),
                    new OA\Property(property: 'password', type: 'string', example: 'password123', format: 'password')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Login berhasil'),
                new OA\Response(response: 422, description: 'Email atau password salah')
            ]
    )]
    public function loginAuth(): void {}

    #[OA\Get(
        path: '/api/products',
        summary: 'Daftar produk aktif',
        tags: ['Products'],
        parameters: [
                new OA\Parameter(name: 'search', description: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'category_id', description: 'category_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
                new OA\Parameter(name: 'min_price', description: 'min_price', in: 'query', required: false, schema: new OA\Schema(type: 'number')),
                new OA\Parameter(name: 'max_price', description: 'max_price', in: 'query', required: false, schema: new OA\Schema(type: 'number')),
                new OA\Parameter(name: 'sort', description: 'sort', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['latest', 'price_low', 'price_high', 'name_asc', 'name_desc'])),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Daftar produk berhasil diambil')
            ]
    )]
    public function productsIndex(): void {}

    #[OA\Get(
        path: '/api/products/{product}',
        summary: 'Detail produk',
        tags: ['Products'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Detail produk berhasil diambil'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan')
            ]
    )]
    public function productsShow(): void {}

    #[OA\Get(
        path: '/api/products/{product}/reviews',
        summary: 'Daftar ulasan produk',
        tags: ['Reviews'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Ulasan berhasil diambil')
            ]
    )]
    public function productReviewsIndex(): void {}

    #[OA\Get(
        path: '/api/categories',
        summary: 'Daftar kategori aktif',
        tags: ['Categories'],
        responses: [
                new OA\Response(response: 200, description: 'Daftar kategori berhasil diambil')
            ]
    )]
    public function categoriesIndex(): void {}

    #[OA\Get(
        path: '/api/categories/{category}',
        summary: 'Detail kategori',
        tags: ['Categories'],
        parameters: [
                new OA\Parameter(name: 'category', description: 'category', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Detail kategori berhasil diambil'),
                new OA\Response(response: 404, description: 'Kategori tidak ditemukan')
            ]
    )]
    public function categoriesShow(): void {}

    #[OA\Get(
        path: '/api/shipping-methods',
        summary: 'Daftar metode pengiriman aktif',
        tags: ['Shipping Methods'],
        responses: [
                new OA\Response(response: 200, description: 'Daftar metode pengiriman berhasil diambil')
            ]
    )]
    public function shippingIndex(): void {}

    #[OA\Get(
        path: '/api/shipping-methods/{shippingMethod}',
        summary: 'Detail metode pengiriman',
        tags: ['Shipping Methods'],
        parameters: [
                new OA\Parameter(name: 'shippingMethod', description: 'shippingMethod', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Detail metode pengiriman berhasil diambil'),
                new OA\Response(response: 404, description: 'Metode tidak ditemukan')
            ]
    )]
    public function shippingShow(): void {}

    #[OA\Post(
        path: '/api/logout',
        summary: 'Logout',
        tags: ['Authentication'],
        responses: [
                new OA\Response(response: 200, description: 'Logout berhasil'),
                new OA\Response(response: 401, description: 'Unauthenticated')
            ],
        security: [['sanctum' => []]]
    )]
    public function logoutRoot(): void {}

    #[OA\Get(
        path: '/api/user',
        summary: 'User yang sedang login',
        tags: ['Authentication'],
        responses: [
                new OA\Response(response: 200, description: 'Data user berhasil diambil'),
                new OA\Response(response: 401, description: 'Unauthenticated')
            ],
        security: [['sanctum' => []]]
    )]
    public function userRoot(): void {}

    #[OA\Post(
        path: '/api/auth/logout',
        summary: 'Logout',
        tags: ['Authentication'],
        responses: [
                new OA\Response(response: 200, description: 'Logout berhasil'),
                new OA\Response(response: 401, description: 'Unauthenticated')
            ],
        security: [['sanctum' => []]]
    )]
    public function logoutAuth(): void {}

    #[OA\Get(
        path: '/api/auth/me',
        summary: 'User yang sedang login',
        tags: ['Authentication'],
        responses: [
                new OA\Response(response: 200, description: 'Data user berhasil diambil'),
                new OA\Response(response: 401, description: 'Unauthenticated')
            ],
        security: [['sanctum' => []]]
    )]
    public function meAuth(): void {}

    #[OA\Get(
        path: '/api/addresses',
        summary: 'Daftar alamat user',
        tags: ['Addresses'],
        responses: [
                new OA\Response(response: 200, description: 'Alamat berhasil diambil')
            ],
        security: [['sanctum' => []]]
    )]
    public function addressesIndex(): void {}

    #[OA\Post(
        path: '/api/addresses',
        summary: 'Tambah alamat',
        tags: ['Addresses'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['label', 'name', 'phone', 'province', 'city', 'postal_code', 'address'],
                properties: [
                    new OA\Property(property: 'label', type: 'string', example: 'Rumah'),
                    new OA\Property(property: 'name', type: 'string', example: 'Bastian'),
                    new OA\Property(property: 'phone', type: 'string', example: '08123456789'),
                    new OA\Property(property: 'province', type: 'string', example: 'Jawa Timur'),
                    new OA\Property(property: 'city', type: 'string', example: 'Malang'),
                    new OA\Property(property: 'postal_code', type: 'string', example: '65145'),
                    new OA\Property(property: 'address', type: 'string', example: 'Jl. Contoh No. 1'),
                    new OA\Property(property: 'is_default', type: 'boolean', example: true)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Alamat berhasil ditambahkan'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function addressesStore(): void {}

    #[OA\Get(
        path: '/api/addresses/{address}',
        summary: 'Detail alamat',
        tags: ['Addresses'],
        parameters: [
                new OA\Parameter(name: 'address', description: 'address', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Alamat berhasil diambil'),
                new OA\Response(response: 404, description: 'Alamat tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function addressesShow(): void {}

    #[OA\Put(
        path: '/api/addresses/{address}',
        summary: 'Perbarui alamat',
        tags: ['Addresses'],
        parameters: [
                new OA\Parameter(name: 'address', description: 'address', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: [],
                properties: [
                    new OA\Property(property: 'label', type: 'string', example: 'Rumah'),
                    new OA\Property(property: 'name', type: 'string', example: 'Bastian'),
                    new OA\Property(property: 'phone', type: 'string', example: '08123456789'),
                    new OA\Property(property: 'province', type: 'string', example: 'Jawa Timur'),
                    new OA\Property(property: 'city', type: 'string', example: 'Malang'),
                    new OA\Property(property: 'postal_code', type: 'string', example: '65145'),
                    new OA\Property(property: 'address', type: 'string', example: 'Jl. Contoh No. 1'),
                    new OA\Property(property: 'is_default', type: 'boolean', example: true)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Alamat berhasil diperbarui'),
                new OA\Response(response: 404, description: 'Alamat tidak ditemukan'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function addressesUpdate(): void {}

    #[OA\Delete(
        path: '/api/addresses/{address}',
        summary: 'Hapus alamat',
        tags: ['Addresses'],
        parameters: [
                new OA\Parameter(name: 'address', description: 'address', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Alamat berhasil dihapus'),
                new OA\Response(response: 404, description: 'Alamat tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function addressesDestroy(): void {}

    #[OA\Get(
        path: '/api/cart',
        summary: 'Isi keranjang user',
        tags: ['Cart'],
        responses: [
                new OA\Response(response: 200, description: 'Keranjang berhasil diambil')
            ],
        security: [['sanctum' => []]]
    )]
    public function cartIndex(): void {}

    #[OA\Post(
        path: '/api/cart/items',
        summary: 'Tambah item ke keranjang',
        tags: ['Cart'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: [
                    new OA\Property(property: 'product_id', type: 'integer', example: 1),
                    new OA\Property(property: 'quantity', type: 'integer', example: 1)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Item berhasil ditambahkan'),
                new OA\Response(response: 422, description: 'Validasi atau stok gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function cartAdd(): void {}

    #[OA\Put(
        path: '/api/cart/items/{item}',
        summary: 'Ubah quantity item',
        tags: ['Cart'],
        parameters: [
                new OA\Parameter(name: 'item', description: 'item', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['quantity'],
                properties: [
                    new OA\Property(property: 'quantity', type: 'integer', example: 2)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Quantity berhasil diperbarui'),
                new OA\Response(response: 404, description: 'Item tidak ditemukan'),
                new OA\Response(response: 422, description: 'Validasi atau stok gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function cartUpdate(): void {}

    #[OA\Delete(
        path: '/api/cart/items/{item}',
        summary: 'Hapus item keranjang',
        tags: ['Cart'],
        parameters: [
                new OA\Parameter(name: 'item', description: 'item', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Item berhasil dihapus'),
                new OA\Response(response: 404, description: 'Item tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function cartRemove(): void {}

    #[OA\Delete(
        path: '/api/cart',
        summary: 'Kosongkan keranjang',
        tags: ['Cart'],
        responses: [
                new OA\Response(response: 200, description: 'Keranjang berhasil dikosongkan')
            ],
        security: [['sanctum' => []]]
    )]
    public function cartClear(): void {}

    #[OA\Get(
        path: '/api/wishlist',
        summary: 'Daftar wishlist',
        tags: ['Wishlist'],
        responses: [
                new OA\Response(response: 200, description: 'Wishlist berhasil diambil')
            ],
        security: [['sanctum' => []]]
    )]
    public function wishlistIndex(): void {}

    #[OA\Get(
        path: '/api/wishlist/{product}',
        summary: 'Cek produk di wishlist',
        tags: ['Wishlist'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Status wishlist berhasil dicek'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function wishlistCheck(): void {}

    #[OA\Post(
        path: '/api/wishlist/{product}',
        summary: 'Tambah produk ke wishlist',
        tags: ['Wishlist'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 201, description: 'Produk berhasil ditambahkan'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function wishlistStore(): void {}

    #[OA\Delete(
        path: '/api/wishlist/{product}',
        summary: 'Hapus produk dari wishlist',
        tags: ['Wishlist'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Produk berhasil dihapus'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function wishlistDestroy(): void {}

    #[OA\Get(
        path: '/api/orders',
        summary: 'Daftar pesanan user',
        tags: ['Orders'],
        parameters: [
                new OA\Parameter(name: 'status', description: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'])),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pesanan berhasil diambil')
            ],
        security: [['sanctum' => []]]
    )]
    public function ordersIndex(): void {}

    #[OA\Post(
        path: '/api/orders',
        summary: 'Checkout dan membuat pesanan',
        tags: ['Orders'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['address_id', 'shipping_method_id'],
                properties: [
                    new OA\Property(property: 'address_id', type: 'integer', example: 1),
                    new OA\Property(property: 'shipping_method_id', type: 'integer', example: 1),
                    new OA\Property(property: 'payment_method', type: 'string', example: 'transfer_bank'),
                    new OA\Property(property: 'notes', type: 'string', example: 'Tolong dikirim sore hari')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Pesanan berhasil dibuat'),
                new OA\Response(response: 422, description: 'Checkout gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function ordersStore(): void {}

    #[OA\Get(
        path: '/api/orders/{order}',
        summary: 'Detail pesanan user',
        tags: ['Orders'],
        parameters: [
                new OA\Parameter(name: 'order', description: 'order', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Detail pesanan berhasil diambil'),
                new OA\Response(response: 404, description: 'Pesanan tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function ordersShow(): void {}

    #[OA\Post(
        path: '/api/orders/{order}/cancel',
        summary: 'Batalkan pesanan',
        tags: ['Orders'],
        parameters: [
                new OA\Parameter(name: 'order', description: 'order', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pesanan berhasil dibatalkan'),
                new OA\Response(response: 404, description: 'Pesanan tidak ditemukan'),
                new OA\Response(response: 422, description: 'Pesanan tidak dapat dibatalkan')
            ],
        security: [['sanctum' => []]]
    )]
    public function ordersCancel(): void {}

    #[OA\Get(
        path: '/api/orders/{order}/payment',
        summary: 'Detail pembayaran',
        tags: ['Payments'],
        parameters: [
                new OA\Parameter(name: 'order', description: 'order', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pembayaran berhasil diambil'),
                new OA\Response(response: 404, description: 'Pesanan tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function paymentShow(): void {}

    #[OA\Post(
        path: '/api/orders/{order}/payment',
        summary: 'Upload bukti pembayaran',
        tags: ['Payments'],
        parameters: [
                new OA\Parameter(name: 'order', description: 'order', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    type: 'object',
                    required: [],
                    properties: [
                        new OA\Property(property: 'proof', type: 's', example: 't', format: 'binary'),
                    new OA\Property(property: 'method', type: 'string', example: 'transfer_bank'),
                    new OA\Property(property: 'notes', type: 'string', example: 'Pembayaran via transfer')
                    ]
                )
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Bukti pembayaran berhasil diunggah'),
                new OA\Response(response: 422, description: 'Validasi pembayaran gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function paymentStore(): void {}

    #[OA\Post(
        path: '/api/products/{product}/reviews',
        summary: 'Tambah ulasan produk',
        tags: ['Reviews'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['order_id', 'rating'],
                properties: [
                    new OA\Property(property: 'order_id', type: 'integer', example: 1),
                    new OA\Property(property: 'rating', type: 'integer', example: 5),
                    new OA\Property(property: 'comment', type: 'string', example: 'Produknya enak')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Ulasan berhasil disimpan'),
                new OA\Response(response: 404, description: 'Pesanan tidak ditemukan'),
                new OA\Response(response: 422, description: 'Ulasan tidak memenuhi syarat')
            ],
        security: [['sanctum' => []]]
    )]
    public function reviewStore(): void {}

    #[OA\Get(
        path: '/api/admin/dashboard',
        summary: 'Ringkasan dashboard admin',
        tags: ['Admin Dashboard'],
        responses: [
                new OA\Response(response: 200, description: 'Dashboard berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminDashboard(): void {}

    #[OA\Get(
        path: '/api/admin/reports/sales',
        summary: 'Laporan penjualan',
        tags: ['Admin Reports'],
        parameters: [
                new OA\Parameter(name: 'start_date', description: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'end_date', description: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Laporan penjualan berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminSalesReport(): void {}

    #[OA\Get(
        path: '/api/admin/reports/products',
        summary: 'Laporan produk dan stok',
        tags: ['Admin Reports'],
        responses: [
                new OA\Response(response: 200, description: 'Laporan produk berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminProductReport(): void {}

    #[OA\Get(
        path: '/api/admin/products',
        summary: 'Daftar produk admin',
        tags: ['Admin Products'],
        parameters: [
                new OA\Parameter(name: 'search', description: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'category_id', description: 'category_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
                new OA\Parameter(name: 'is_active', description: 'is_active', in: 'query', required: false, schema: new OA\Schema(type: 'boolean')),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Produk berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminProductsIndex(): void {}

    #[OA\Post(
        path: '/api/admin/products',
        summary: 'Tambah produk',
        tags: ['Admin Products'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['category_id', 'name', 'price', 'stock'],
                properties: [
                    new OA\Property(property: 'category_id', type: 'integer', example: 1),
                    new OA\Property(property: 'name', type: 'string', example: 'Keripik Tempe'),
                    new OA\Property(property: 'description', type: 'string', example: 'Keripik tempe khas Malang'),
                    new OA\Property(property: 'price', type: 'number', example: 15000),
                    new OA\Property(property: 'original_price', type: 'number', example: 18000),
                    new OA\Property(property: 'stock', type: 'integer', example: 100),
                    new OA\Property(property: 'discount', type: 'integer', example: 10),
                    new OA\Property(property: 'image', type: 'string', example: 'products/keripik.jpg'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Produk berhasil dibuat'),
                new OA\Response(response: 422, description: 'Validasi gagal'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminProductsStore(): void {}

    #[OA\Get(
        path: '/api/admin/products/{product}',
        summary: 'Detail produk admin',
        tags: ['Admin Products'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Produk berhasil diambil'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminProductsShow(): void {}

    #[OA\Put(
        path: '/api/admin/products/{product}',
        summary: 'Perbarui produk',
        tags: ['Admin Products'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: [],
                properties: [
                    new OA\Property(property: 'category_id', type: 'integer', example: 1),
                    new OA\Property(property: 'name', type: 'string', example: 'Keripik Tempe'),
                    new OA\Property(property: 'description', type: 'string', example: 'Keripik tempe khas Malang'),
                    new OA\Property(property: 'price', type: 'number', example: 15000),
                    new OA\Property(property: 'original_price', type: 'number', example: 18000),
                    new OA\Property(property: 'stock', type: 'integer', example: 100),
                    new OA\Property(property: 'discount', type: 'integer', example: 10),
                    new OA\Property(property: 'image', type: 'string', example: 'products/keripik.jpg'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Produk berhasil diperbarui'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminProductsUpdate(): void {}

    #[OA\Delete(
        path: '/api/admin/products/{product}',
        summary: 'Hapus produk',
        tags: ['Admin Products'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Produk berhasil dihapus'),
                new OA\Response(response: 404, description: 'Produk tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminProductsDestroy(): void {}

    #[OA\Post(
        path: '/api/admin/products/{product}/images',
        summary: 'Upload gambar produk',
        tags: ['Admin Product Images'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    type: 'object',
                    required: ['image'],
                    properties: [
                        new OA\Property(property: 'image', type: 's', example: 't', format: 'binary'),
                    new OA\Property(property: 'alt_text', type: 'string', example: 'Foto produk'),
                    new OA\Property(property: 'is_primary', type: 'boolean', example: true)
                    ]
                )
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Gambar berhasil diupload'),
                new OA\Response(response: 422, description: 'Validasi file gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminImageStore(): void {}

    #[OA\Delete(
        path: '/api/admin/products/{product}/images/{image}',
        summary: 'Hapus gambar produk',
        tags: ['Admin Product Images'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
                new OA\Parameter(name: 'image', description: 'image', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Gambar berhasil dihapus'),
                new OA\Response(response: 404, description: 'Gambar tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminImageDestroy(): void {}

    #[OA\Patch(
        path: '/api/admin/products/{product}/images/{image}/primary',
        summary: 'Jadikan gambar utama',
        tags: ['Admin Product Images'],
        parameters: [
                new OA\Parameter(name: 'product', description: 'product', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
                new OA\Parameter(name: 'image', description: 'image', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Gambar utama berhasil diubah'),
                new OA\Response(response: 404, description: 'Gambar tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminImagePrimary(): void {}

    #[OA\Get(
        path: '/api/admin/categories',
        summary: 'Daftar kategori admin',
        tags: ['Admin Categories'],
        responses: [
                new OA\Response(response: 200, description: 'Kategori berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminCategoriesIndex(): void {}

    #[OA\Post(
        path: '/api/admin/categories',
        summary: 'Tambah kategori',
        tags: ['Admin Categories'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Makanan Khas Malang'),
                    new OA\Property(property: 'icon', type: 'string', example: '🍪'),
                    new OA\Property(property: 'color', type: 'string', example: '#E24E32'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Kategori berhasil dibuat'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminCategoriesStore(): void {}

    #[OA\Get(
        path: '/api/admin/categories/{category}',
        summary: 'Detail kategori admin',
        tags: ['Admin Categories'],
        parameters: [
                new OA\Parameter(name: 'category', description: 'category', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Kategori berhasil diambil'),
                new OA\Response(response: 404, description: 'Kategori tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminCategoriesShow(): void {}

    #[OA\Put(
        path: '/api/admin/categories/{category}',
        summary: 'Perbarui kategori',
        tags: ['Admin Categories'],
        parameters: [
                new OA\Parameter(name: 'category', description: 'category', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: [],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Makanan Khas Malang'),
                    new OA\Property(property: 'icon', type: 'string', example: '🍪'),
                    new OA\Property(property: 'color', type: 'string', example: '#E24E32'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Kategori berhasil diperbarui'),
                new OA\Response(response: 404, description: 'Kategori tidak ditemukan'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminCategoriesUpdate(): void {}

    #[OA\Delete(
        path: '/api/admin/categories/{category}',
        summary: 'Hapus kategori',
        tags: ['Admin Categories'],
        parameters: [
                new OA\Parameter(name: 'category', description: 'category', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Kategori berhasil dihapus'),
                new OA\Response(response: 404, description: 'Kategori tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminCategoriesDestroy(): void {}

    #[OA\Get(
        path: '/api/admin/shipping-methods',
        summary: 'Daftar metode pengiriman admin',
        tags: ['Admin Shipping'],
        responses: [
                new OA\Response(response: 200, description: 'Metode pengiriman berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminShippingIndex(): void {}

    #[OA\Post(
        path: '/api/admin/shipping-methods',
        summary: 'Tambah metode pengiriman',
        tags: ['Admin Shipping'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['name', 'code', 'cost'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'JNE Reguler'),
                    new OA\Property(property: 'code', type: 'string', example: 'JNE_REG'),
                    new OA\Property(property: 'description', type: 'string', example: 'Pengiriman reguler'),
                    new OA\Property(property: 'cost', type: 'number', example: 15000),
                    new OA\Property(property: 'estimated_days', type: 'string', example: '2-4 hari'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                    new OA\Property(property: 'sort_order', type: 'integer', example: 1)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 201, description: 'Metode pengiriman berhasil dibuat'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminShippingStore(): void {}

    #[OA\Get(
        path: '/api/admin/shipping-methods/{shippingMethod}',
        summary: 'Detail metode pengiriman admin',
        tags: ['Admin Shipping'],
        parameters: [
                new OA\Parameter(name: 'shippingMethod', description: 'shippingMethod', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Metode pengiriman berhasil diambil'),
                new OA\Response(response: 404, description: 'Metode tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminShippingShow(): void {}

    #[OA\Put(
        path: '/api/admin/shipping-methods/{shippingMethod}',
        summary: 'Perbarui metode pengiriman',
        tags: ['Admin Shipping'],
        parameters: [
                new OA\Parameter(name: 'shippingMethod', description: 'shippingMethod', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: [],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'JNE Reguler'),
                    new OA\Property(property: 'code', type: 'string', example: 'JNE_REG'),
                    new OA\Property(property: 'description', type: 'string', example: 'Pengiriman reguler'),
                    new OA\Property(property: 'cost', type: 'number', example: 15000),
                    new OA\Property(property: 'estimated_days', type: 'string', example: '2-4 hari'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                    new OA\Property(property: 'sort_order', type: 'integer', example: 1)
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Metode pengiriman berhasil diperbarui'),
                new OA\Response(response: 404, description: 'Metode tidak ditemukan'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminShippingUpdate(): void {}

    #[OA\Delete(
        path: '/api/admin/shipping-methods/{shippingMethod}',
        summary: 'Hapus metode pengiriman',
        tags: ['Admin Shipping'],
        parameters: [
                new OA\Parameter(name: 'shippingMethod', description: 'shippingMethod', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Metode pengiriman berhasil dihapus'),
                new OA\Response(response: 404, description: 'Metode tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminShippingDestroy(): void {}

    #[OA\Get(
        path: '/api/admin/orders',
        summary: 'Daftar semua pesanan',
        tags: ['Admin Orders'],
        parameters: [
                new OA\Parameter(name: 'status', description: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'])),
                new OA\Parameter(name: 'search', description: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'start_date', description: 'start_date', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'end_date', description: 'end_date', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'sort', description: 'sort', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['latest', 'oldest', 'total_desc', 'total_asc'])),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pesanan berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminOrdersIndex(): void {}

    #[OA\Get(
        path: '/api/admin/orders/{order}',
        summary: 'Detail pesanan admin',
        tags: ['Admin Orders'],
        parameters: [
                new OA\Parameter(name: 'order', description: 'order', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Detail pesanan berhasil diambil'),
                new OA\Response(response: 404, description: 'Pesanan tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminOrdersShow(): void {}

    #[OA\Patch(
        path: '/api/admin/orders/{order}/status',
        summary: 'Ubah status pesanan',
        tags: ['Admin Orders'],
        parameters: [
                new OA\Parameter(name: 'order', description: 'order', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', example: 'confirmed')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Status pesanan berhasil diperbarui'),
                new OA\Response(response: 422, description: 'Status tidak valid')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminOrdersStatus(): void {}

    #[OA\Get(
        path: '/api/admin/payments',
        summary: 'Daftar pembayaran',
        tags: ['Admin Payments'],
        parameters: [
                new OA\Parameter(name: 'status', description: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['pending', 'paid', 'rejected'])),
                new OA\Parameter(name: 'method', description: 'method', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'search', description: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pembayaran berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminPaymentsIndex(): void {}

    #[OA\Get(
        path: '/api/admin/payments/{payment}',
        summary: 'Detail pembayaran',
        tags: ['Admin Payments'],
        parameters: [
                new OA\Parameter(name: 'payment', description: 'payment', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Detail pembayaran berhasil diambil'),
                new OA\Response(response: 404, description: 'Pembayaran tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminPaymentsShow(): void {}

    #[OA\Patch(
        path: '/api/admin/payments/{payment}/verify',
        summary: 'Verifikasi pembayaran',
        tags: ['Admin Payments'],
        parameters: [
                new OA\Parameter(name: 'payment', description: 'payment', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: [],
                properties: [
                    new OA\Property(property: 'notes', type: 'string', example: 'Pembayaran valid')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Pembayaran berhasil diverifikasi'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminPaymentsVerify(): void {}

    #[OA\Patch(
        path: '/api/admin/payments/{payment}/reject',
        summary: 'Tolak pembayaran',
        tags: ['Admin Payments'],
        parameters: [
                new OA\Parameter(name: 'payment', description: 'payment', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: [],
                properties: [
                    new OA\Property(property: 'notes', type: 'string', example: 'Bukti pembayaran tidak jelas'),
                    new OA\Property(property: 'reason', type: 'string', example: 'Bukti tidak valid')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Pembayaran ditolak'),
                new OA\Response(response: 422, description: 'Validasi gagal')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminPaymentsReject(): void {}

    #[OA\Get(
        path: '/api/admin/users',
        summary: 'Daftar pengguna',
        tags: ['Admin Users'],
        parameters: [
                new OA\Parameter(name: 'role', description: 'role', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['user', 'admin'])),
                new OA\Parameter(name: 'search', description: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
                new OA\Parameter(name: 'per_page', description: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pengguna berhasil diambil'),
                new OA\Response(response: 403, description: 'Forbidden')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminUsersIndex(): void {}

    #[OA\Get(
        path: '/api/admin/users/{user}',
        summary: 'Detail pengguna',
        tags: ['Admin Users'],
        parameters: [
                new OA\Parameter(name: 'user', description: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pengguna berhasil diambil'),
                new OA\Response(response: 404, description: 'Pengguna tidak ditemukan')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminUsersShow(): void {}

    #[OA\Patch(
        path: '/api/admin/users/{user}/role',
        summary: 'Ubah role pengguna',
        tags: ['Admin Users'],
        parameters: [
                new OA\Parameter(name: 'user', description: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['role'],
                properties: [
                    new OA\Property(property: 'role', type: 'string', example: 'user')
                ]
            )
        ),
        responses: [
                new OA\Response(response: 200, description: 'Role berhasil diperbarui'),
                new OA\Response(response: 422, description: 'Role tidak valid')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminUsersRole(): void {}

    #[OA\Delete(
        path: '/api/admin/users/{user}',
        summary: 'Hapus pengguna',
        tags: ['Admin Users'],
        parameters: [
                new OA\Parameter(name: 'user', description: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
            ],
        responses: [
                new OA\Response(response: 200, description: 'Pengguna berhasil dihapus'),
                new OA\Response(response: 422, description: 'Tidak dapat menghapus akun sendiri')
            ],
        security: [['sanctum' => []]]
    )]
    public function adminUsersDestroy(): void {}

}

<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Order $order;
    protected Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => UserRole::USER]);

        $address = Address::create([
            'user_id' => $this->user->id,
            'label' => 'Rumah',
            'name' => 'Budi Pembeli',
            'phone' => '08123456789',
            'province' => 'Jawa Timur',
            'city' => 'Malang',
            'postal_code' => '65145',
            'address' => 'Jl. Kawi No. 10',
            'is_default' => true,
        ]);

        $shippingMethod = ShippingMethod::create([
            'name' => 'Kurir Test',
            'code' => 'kurir-payment-test',
            'cost' => 10000,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'user_id' => $this->user->id,
            'address_id' => $address->id,
            'shipping_method_id' => $shippingMethod->id,
            'order_number' => 'ORD-TEST-PAYMENT',
            'subtotal' => 50000,
            'shipping_cost' => 10000,
            'total' => 60000,
            'shipping_name' => $address->name,
            'shipping_phone' => $address->phone,
            'shipping_province' => $address->province,
            'shipping_city' => $address->city,
            'shipping_postal_code' => $address->postal_code,
            'shipping_address' => $address->address,
            'order_status' => OrderStatus::PENDING,
        ]);

        $this->payment = Payment::create([
            'order_id' => $this->order->id,
            'method' => 'transfer_bank',
            'amount' => 60000,
            'status' => PaymentStatus::PENDING,
        ]);
    }

    public function test_user_can_upload_payment_proof(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('bukti_transfer.jpg');

        $response = $this->actingAs($this->user)->postJson("/api/orders/{$this->order->id}/payment", [
            'proof' => $file,
            'notes' => 'Transfer via BCA an Budi',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diunggah.',
                'data' => [
                    'status' => 'pending',
                ],
            ]);

        $proofPath = $response->json('data.proof');
        Storage::disk('public')->assertExists($proofPath);
    }

    public function test_admin_can_verify_and_reject_payment(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        // 1. Verify
        $verifyResponse = $this->actingAs($admin)->patchJson("/api/admin/payments/{$this->payment->id}/verify", [
            'notes' => 'Pembayaran valid masuk ke rekening BCA',
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'paid',
                ],
            ]);

        // Order status automatically updated to confirmed
        $this->assertEquals(OrderStatus::CONFIRMED, $this->order->fresh()->order_status);

        // 2. Reject
        $rejectResponse = $this->actingAs($admin)->patchJson("/api/admin/payments/{$this->payment->id}/reject", [
            'reason' => 'Nominal tidak sesuai',
        ]);

        $rejectResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'rejected',
                ],
            ]);
    }
}

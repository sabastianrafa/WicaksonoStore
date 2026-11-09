<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\MidtransTransaction;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
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

        $paymentMethod = PaymentMethod::updateOrCreate(
            ['code' => 'transfer_bank'],
            [
                'name' => 'Transfer Bank Test',
                'type' => PaymentMethod::TYPE_BANK,
                'account_number' => '1234567890',
                'account_name' => 'Wicaksono Store',
                'is_active' => true,
            ]
        );

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
            'payment_method_name' => $paymentMethod->name,
            'payment_method_type' => $paymentMethod->type,
            'payment_account_number' => $paymentMethod->account_number,
            'payment_account_name' => $paymentMethod->account_name,
            'payment_qris_image' => $paymentMethod->qris_image,
            'payment_method_description' => $paymentMethod->description,
            'amount' => 60000,
            'status' => PaymentStatus::PENDING,
        ]);
    }

    public function test_manual_payment_proof_upload_is_rejected_for_midtrans(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('bukti_transfer.jpg');

        $response = $this->actingAs($this->user)->postJson("/api/orders/{$this->order->id}/payment", [
            'proof' => $file,
            'notes' => 'Transfer via BCA an Budi',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'Unggah bukti pembayaran manual sudah tidak tersedia. Selesaikan pembayaran melalui Midtrans Snap.');
        $this->assertNull($this->payment->fresh()->proof);
    }

    public function test_payment_proof_must_fit_php_upload_limit(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->user)->postJson("/api/orders/{$this->order->id}/payment", [
            'proof' => UploadedFile::fake()->image('bukti-terlalu-besar.jpg')->size(1801),
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'Unggah bukti pembayaran manual sudah tidak tersedia. Selesaikan pembayaran melalui Midtrans Snap.');
    }

    public function test_user_can_view_order_total_and_payment_instructions(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/orders/{$this->order->id}/payment");

        $response->assertOk()
            ->assertJsonPath('data.order.order_number', 'ORD-TEST-PAYMENT')
            ->assertJsonPath('data.order.total', 60000)
            ->assertJsonPath('data.payment.method', 'transfer_bank')
            ->assertJsonPath('data.payment_method.account_number', '1234567890')
            ->assertJsonPath('data.payment_method.account_name', 'Wicaksono Store');
    }

    public function test_existing_order_keeps_its_payment_instructions_when_admin_updates_method(): void
    {
        PaymentMethod::where('code', 'transfer_bank')->update([
            'account_number' => '9999999999',
            'account_name' => 'Rekening Baru',
        ]);

        $this->actingAs($this->user)
            ->getJson("/api/orders/{$this->order->id}/payment")
            ->assertOk()
            ->assertJsonPath('data.payment_method.account_number', '1234567890')
            ->assertJsonPath('data.payment_method.account_name', 'Wicaksono Store');
    }

    public function test_admin_can_verify_and_reject_payment(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $this->payment->update(['proof' => 'payments/bukti-transfer.jpg']);

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

        $rejectResponse = $this->actingAs($admin)->patchJson("/api/admin/payments/{$this->payment->id}/reject", [
            'reason' => 'Nominal tidak sesuai',
        ]);

        $rejectResponse->assertUnprocessable()
            ->assertJsonValidationErrors('payment');
        $this->assertSame(PaymentStatus::PAID, $this->payment->fresh()->status);
    }

    public function test_admin_cannot_verify_payment_before_customer_submits_proof(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)
            ->patchJson("/api/admin/payments/{$this->payment->id}/verify")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');

        $this->assertSame(PaymentStatus::PENDING, $this->payment->fresh()->status);
        $this->assertSame(OrderStatus::PENDING, $this->order->fresh()->order_status);
    }

    public function test_admin_can_reject_a_submitted_proof_with_reason(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $this->payment->update(['proof' => 'payments/bukti-transfer.jpg']);

        $response = $this->actingAs($admin)->patchJson("/api/admin/payments/{$this->payment->id}/reject", [
            'reason' => 'Nominal tidak sesuai',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.notes', 'Nominal tidak sesuai');

        $this->assertSame(OrderStatus::PENDING, $this->order->fresh()->order_status);
    }

    public function test_admin_cannot_reject_payment_without_submitted_proof(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)
            ->patchJson("/api/admin/payments/{$this->payment->id}/reject", [
                'reason' => 'Tidak ada bukti',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');

        $this->assertSame(PaymentStatus::PENDING, $this->payment->fresh()->status);
    }

    public function test_midtrans_webhook_rejects_invalid_signature_and_mismatched_amount(): void
    {
        $attempt = $this->prepareMidtransAttempt();
        $payload = $this->midtransPayload($attempt, 'settlement');

        $this->postJson('/api/payments/midtrans/notification', [...$payload, 'signature_key' => 'wrong'])
            ->assertForbidden();
        $this->postJson('/api/payments/midtrans/notification', $this->midtransPayload($attempt, 'settlement', '1.00'))
            ->assertUnprocessable();

        $this->assertSame(PaymentStatus::PENDING, $this->payment->fresh()->status);
    }

    public function test_midtrans_webhook_is_idempotent_and_handles_settlement_cancel_and_refund(): void
    {
        $attempt = $this->prepareMidtransAttempt();
        $settlement = $this->midtransPayload($attempt, 'settlement');

        $this->postJson('/api/payments/midtrans/notification', $settlement)->assertOk();
        $this->postJson('/api/payments/midtrans/notification', $settlement)->assertOk();
        $this->assertSame(PaymentStatus::PAID, $this->payment->fresh()->status);
        $this->assertSame(OrderStatus::CONFIRMED, $this->order->fresh()->order_status);

        $refund = $this->midtransPayload($attempt, 'refund');
        $refund['refund_amount'] = '60000';
        $refund['signature_key'] = $this->signature($refund);
        $this->postJson('/api/payments/midtrans/notification', $refund)->assertOk();
        $this->assertSame(PaymentStatus::REFUNDED, $this->payment->fresh()->status);
    }

    public function test_failed_attempt_can_be_retried_and_late_success_does_not_confirm_cancelled_order(): void
    {
        $attempt = $this->prepareMidtransAttempt();
        $this->payment->update(['status' => PaymentStatus::REJECTED]);
        $this->postJson('/api/payments/midtrans/notification', $this->midtransPayload($attempt, 'expire'))
            ->assertOk();
        $this->assertSame(PaymentStatus::PENDING, $this->payment->fresh()->status);

        $this->order->update(['order_status' => OrderStatus::CANCELLED]);
        $this->postJson('/api/payments/midtrans/notification', $this->midtransPayload($attempt, 'settlement'))
            ->assertOk();
        $this->assertSame(PaymentStatus::PENDING, $this->payment->fresh()->status);
        $this->assertSame(OrderStatus::CANCELLED, $this->order->fresh()->order_status);
    }

    private function prepareMidtransAttempt(): MidtransTransaction
    {
        Config::set('services.midtrans.server_key', 'webhook-test-key');
        $this->payment->update(['method' => 'midtrans']);
        return MidtransTransaction::create([
            'payment_id' => $this->payment->id,
            'midtrans_order_id' => $this->order->order_number.'-RTEST1234',
            'status' => 'created',
            'gross_amount' => $this->order->total,
        ]);
    }

    private function midtransPayload(MidtransTransaction $attempt, string $status, ?string $amount = null): array
    {
        $payload = [
            'order_id' => $attempt->midtrans_order_id,
            'status_code' => '200',
            'gross_amount' => $amount ?? '60000.00',
            'transaction_status' => $status,
            'transaction_id' => 'TX-TEST-1',
        ];
        $payload['signature_key'] = $this->signature($payload);
        return $payload;
    }

    private function signature(array $payload): string
    {
        return hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'webhook-test-key');
    }
}

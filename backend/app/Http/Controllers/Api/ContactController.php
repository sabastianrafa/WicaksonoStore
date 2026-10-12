<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $recipient = config('services.contact.recipient');
        if (! $recipient) {
            return response()->json([
                'success' => false,
                'message' => 'Form kontak belum dikonfigurasi. Silakan hubungi toko melalui WhatsApp.',
            ], 503);
        }

        Mail::raw(
            "Nama: {$validated['name']}\nEmail: {$validated['email']}\n\n{$validated['message']}",
            function ($mail) use ($recipient, $validated): void {
                $mail->to($recipient)
                    ->replyTo($validated['email'], $validated['name'])
                    ->subject('[Wicaksono Store] ' . $validated['subject']);
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dikirim. Tim kami akan segera merespons.',
        ]);
    }
}

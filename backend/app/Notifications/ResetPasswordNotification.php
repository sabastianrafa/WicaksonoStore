<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = rtrim(config('app.frontend_url'), '/') . '/reset-password?'
            . http_build_query(['token' => $this->token, 'email' => $notifiable->getEmailForPasswordReset()]);

        return (new MailMessage)
            ->subject('Reset password Wicaksono Store')
            ->line('Kami menerima permintaan untuk mengatur ulang password akun Anda.')
            ->action('Atur Ulang Password', $url)
            ->line('Tautan ini kedaluwarsa dalam ' . config('auth.passwords.users.expire') . ' menit.')
            ->line('Jika Anda tidak meminta reset password, abaikan email ini.');
    }
}

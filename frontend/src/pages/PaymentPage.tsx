import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch, BACKEND_URL } from '../api/client';
import { formatPrice } from '../data';
import type { Page } from '../App';

interface PaymentDetails {
  payment: {
    id: number;
    method: string;
    amount: number | string;
    status: 'pending' | 'paid' | 'rejected';
    proof: string | null;
    notes: string | null;
  };
  payment_method: {
    name: string;
    code: string;
    type: 'bank' | 'qris';
    account_number: string | null;
    account_name: string | null;
    qris_image_url: string | null;
    description: string | null;
  } | null;
  order: {
    id: number;
    order_number: string;
    total: number;
    status: string;
  };
}

interface Props {
  navigate: (page: Page) => void;
}

const MAX_PROOF_SIZE = 1800 * 1024;
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function PaymentPage({ navigate }: Props) {
  const { orderId } = useParams();
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPayment = useCallback(async () => {
    if (!orderId) {
      setError('Nomor pesanan tidak valid.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch<{ data: PaymentDetails }>(`/orders/${orderId}/payment`);
      setDetails(response.data);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat informasi pembayaran.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  useEffect(() => {
    if (details?.payment.status !== 'pending') return;

    const interval = window.setInterval(() => {
      void loadPayment();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [details?.payment.status, loadPayment]);

  const refreshPayment = async () => {
    setRefreshing(true);
    await loadPayment();
    setRefreshing(false);
  };

  const uploadProof = async () => {
    if (!orderId || !proof) {
      setError('Pilih bukti pembayaran terlebih dahulu.');
      return;
    }

    const formData = new FormData();
    formData.append('proof', proof);

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/orders/${orderId}/payment`, {
        method: 'POST',
        body: formData,
      });
      setProof(null);
      setMessage('Bukti pembayaran berhasil dikirim. Pembayaran akan diperiksa oleh admin.');
      await loadPayment();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccountNumber = async () => {
    const accountNumber = details?.payment_method?.account_number;
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setMessage('Nomor rekening berhasil disalin.');
    } catch {
      setError('Nomor rekening tidak dapat disalin oleh browser ini.');
    }
  };

  const paymentMethod = details?.payment_method;
  const qrImage = paymentMethod?.qris_image_url
    ? paymentMethod.qris_image_url.startsWith('http')
      ? paymentMethod.qris_image_url
      : `${BACKEND_URL}${paymentMethod.qris_image_url}`
    : null;
  const proofUrl = details?.payment.proof
    ? details.payment.proof.startsWith('http')
      ? details.payment.proof
      : `${BACKEND_URL}/storage/${details.payment.proof.replace(/^\/+/, '')}`
    : null;

  return (
    <div style={{ maxWidth: 850, margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        {loading ? (
          <p style={{ color: '#6B7280' }}>Memuat informasi pembayaran...</p>
        ) : error && !details ? (
          <>
            <p role="alert" style={{ color: '#DC2626' }}>{error}</p>
            <button className="btn-outline" onClick={() => navigate('dashboard')}>Ke pesanan saya</button>
          </>
        ) : details ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.82rem' }}>Pesanan {details.order.order_number}</p>
                <h1 style={{ margin: '6px 0 0', color: '#1F2937', fontSize: '1.5rem', fontWeight: 800 }}>
                  {details.order.status === 'cancelled' ? 'Pesanan Dibatalkan' : 'Selesaikan Pembayaran'}
                </h1>
              </div>
              <span style={{
                padding: '7px 12px',
                borderRadius: 20,
                background: details.payment.status === 'paid' ? '#DCFCE7' : details.payment.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                color: details.payment.status === 'paid' ? '#15803D' : details.payment.status === 'rejected' ? '#B91C1C' : '#92400E',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}>
                {details.order.status === 'cancelled'
                  ? 'Pesanan dibatalkan'
                  : details.payment.status === 'paid'
                  ? 'Terverifikasi'
                  : details.payment.status === 'rejected'
                    ? 'Perlu pembayaran ulang'
                    : details.payment.proof
                      ? 'Menunggu verifikasi admin'
                      : 'Menunggu pembayaran'}
              </span>
            </div>
            <button
              type="button"
              className="btn-outline"
              onClick={refreshPayment}
              disabled={refreshing}
              style={{ marginTop: 12, padding: '6px 12px', fontSize: '0.78rem' }}
            >
              {refreshing ? 'Memperbarui...' : 'Perbarui status pembayaran'}
            </button>

            <div style={{ marginTop: 24, padding: 18, background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12 }}>
              <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>Total yang harus dibayar</div>
              <div style={{ marginTop: 4, color: '#C2410C', fontSize: '1.8rem', fontWeight: 800 }}>{formatPrice(Number(details.payment.amount))}</div>
            </div>

            {paymentMethod ? (
              <section style={{ marginTop: 24 }}>
                <h2 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: '#1F2937' }}>{paymentMethod.name}</h2>
                {paymentMethod.description && <p style={{ margin: '0 0 14px', color: '#6B7280', fontSize: '0.88rem' }}>{paymentMethod.description}</p>}
                {paymentMethod.type === 'bank' ? (
                  <div style={{ padding: 18, border: '1px solid #E5E7EB', borderRadius: 12 }}>
                    <div style={{ color: '#6B7280', fontSize: '0.82rem' }}>Transfer ke nomor rekening</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                      <strong style={{ fontSize: '1.35rem', letterSpacing: 1, color: '#1F2937' }}>{paymentMethod.account_number}</strong>
                      <button type="button" className="btn-outline" onClick={copyAccountNumber} style={{ padding: '6px 12px' }}>Salin nomor</button>
                    </div>
                    {paymentMethod.account_name && <div style={{ marginTop: 6, color: '#6B7280' }}>Atas nama {paymentMethod.account_name}</div>}
                  </div>
                ) : qrImage ? (
                  <div style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: 18, border: '1px solid #E5E7EB', borderRadius: 12 }}>
                    <img src={qrImage} alt={`Kode QR ${paymentMethod.name}`} style={{ width: 240, maxWidth: '100%', objectFit: 'contain' }} />
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '0.82rem', textAlign: 'center' }}>Scan kode QRIS dan bayar sesuai total pesanan.</p>
                  </div>
                ) : (
                  <p role="alert" style={{ color: '#DC2626' }}>Informasi QRIS metode ini belum tersedia. Hubungi admin untuk bantuan.</p>
                )}
              </section>
            ) : (
              <p role="alert" style={{ marginTop: 20, color: '#DC2626' }}>Detail metode pembayaran tidak tersedia. Hubungi admin untuk bantuan.</p>
            )}

            {proofUrl && (
              <p style={{ marginTop: 18, color: '#6B7280', fontSize: '0.84rem' }}>
                Bukti yang dikirim: <a href={proofUrl} target="_blank" rel="noreferrer" style={{ color: '#EA580C', fontWeight: 600 }}>Lihat bukti pembayaran</a>
              </p>
            )}

            {details.payment.status === 'rejected' && details.payment.notes && (
              <p role="alert" style={{ marginTop: 16, padding: 12, background: '#FEF2F2', color: '#B91C1C', borderRadius: 8, fontSize: '0.84rem' }}>
                Catatan admin: {details.payment.notes}
              </p>
            )}

            {details.order.status !== 'cancelled' && details.payment.status !== 'paid' && (details.payment.status === 'rejected' || !details.payment.proof) && (
              <section style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid #F3F4F6' }}>
                <h2 style={{ margin: '0 0 6px', fontSize: '1rem', color: '#1F2937' }}>Kirim bukti pembayaran</h2>
                <p style={{ margin: '0 0 14px', color: '#6B7280', fontSize: '0.82rem' }}>Format JPG, PNG, WEBP dengan ukuran maksimal 1,8 MB.</p>
                {details.payment.proof && (
                  <p style={{ margin: '0 0 12px', color: '#B91C1C', fontSize: '0.84rem' }}>Bukti sebelumnya ditolak. Silakan unggah bukti yang benar.</p>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={submitting}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && !ALLOWED_PROOF_TYPES.includes(file.type)) {
                      setError('Bukti harus berupa gambar JPG, PNG, atau WEBP.');
                      setProof(null);
                    } else if (file && file.size > MAX_PROOF_SIZE) {
                      setError('Ukuran bukti pembayaran maksimal 1,8 MB. Kompres atau pilih gambar yang lebih kecil.');
                      setProof(null);
                    } else {
                      setError('');
                      setProof(file);
                    }
                  }}
                />
                {proof && (
                  <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '0.78rem' }}>
                    {proof.name} · {(proof.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
                <button className="btn-primary" onClick={uploadProof} disabled={!proof || submitting} style={{ marginTop: 14, opacity: !proof || submitting ? 0.6 : 1 }}>
                  {submitting ? 'Mengunggah...' : details.payment.proof ? 'Unggah Bukti Baru' : 'Kirim Bukti Pembayaran'}
                </button>
              </section>
            )}

            {details.payment.status === 'paid' && (
              <p role="status" style={{ marginTop: 24, padding: 14, background: '#F0FDF4', color: '#15803D', borderRadius: 10 }}>
                Pembayaran Anda sudah diverifikasi. Pesanan sedang diproses.
              </p>
            )}
            {details.payment.status === 'pending' && details.payment.proof && (
              <p role="status" style={{ marginTop: 24, padding: 14, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 10 }}>
                Bukti pembayaran sudah diterima dan sedang diperiksa oleh admin.
              </p>
            )}

            {error && details && <p role="alert" style={{ color: '#DC2626', fontSize: '0.84rem' }}>{error}</p>}
            {message && details && <p role="status" style={{ color: '#15803D', fontSize: '0.84rem' }}>{message}</p>}
            <button className="btn-outline" onClick={() => navigate('dashboard')} style={{ marginTop: 22 }}>Lihat pesanan saya</button>
          </>
        ) : null}
      </div>
    </div>
  );
}

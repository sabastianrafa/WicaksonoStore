import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
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
  navigate: (page: Page, data?: unknown) => void;
}

const MAX_PROOF_SIZE = 1800 * 1024;
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const STEPS = ['Pesanan dibuat', 'Pembayaran', 'Verifikasi', 'Selesai'];

const styles = `
.pay { --o:#EA580C; --od:#C2410C; --ol:#FFF7ED; --ob:#FED7AA; --ink:#1F2937; --mut:#6B7280; --line:#E5E7EB;
  max-width: 920px; margin: 0 auto; padding: 32px 20px 48px; color: var(--ink); }
.pay * { box-sizing: border-box; }
.pay-back { display:inline-flex; align-items:center; gap:6px; margin-bottom:18px; padding:6px 10px 6px 6px; border:0; background:none;
  color:var(--mut); font-size:.88rem; font-weight:600; cursor:pointer; border-radius:8px; transition:color .15s, background .15s; }
.pay-back:hover { color:var(--od); background:var(--ol); }
.pay-card { background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:0 4px 24px rgba(17,24,39,.06); }
.pay-hero { overflow:hidden; }
.pay-hero::before { content:''; display:block; height:5px; background:linear-gradient(90deg,#EA580C,#F97316,#FDBA74); }
.pay-hero-body { padding:26px 28px 28px; }
.pay-top { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap; }
.pay-order { margin:0; color:#9CA3AF; font-size:.78rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
.pay-title { margin:6px 0 0; font-size:1.65rem; font-weight:800; letter-spacing:-.02em; line-height:1.2; }
.pay-sub { margin:8px 0 0; max-width:520px; color:var(--mut); font-size:.9rem; line-height:1.55; }
.pay-badge { display:inline-flex; align-items:center; gap:8px; padding:7px 13px; border-radius:999px; font-size:.78rem; font-weight:700; white-space:nowrap; }
.pay-badge i { width:7px; height:7px; border-radius:50%; background:currentColor; }
.pay-badge.pulse i { animation: pay-pulse 1.6s ease-in-out infinite; }
.pay-badge.warning { background:#FEF3C7; color:#92400E; }
.pay-badge.info { background:#DBEAFE; color:#1D4ED8; }
.pay-badge.success { background:#DCFCE7; color:#15803D; }
.pay-badge.danger { background:#FEE2E2; color:#B91C1C; }
.pay-badge.neutral { background:#F3F4F6; color:#4B5563; }
.pay-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:26px 0 0; padding:0; list-style:none; }
.pay-step { min-width:0; }
.pay-step-row { display:flex; align-items:center; }
.pay-dot { flex:none; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-size:.75rem; font-weight:800;
  background:#F3F4F6; color:#9CA3AF; transition:all .2s; }
.pay-step.done .pay-dot { background:var(--o); color:#fff; }
.pay-step.current .pay-dot { background:#fff; color:var(--o); box-shadow:0 0 0 2px var(--o); }
.pay-bar { flex:1; height:3px; margin-left:8px; border-radius:3px; background:var(--line); }
.pay-step.done .pay-bar { background:var(--o); }
.pay-step-label { margin:8px 0 0; font-size:.74rem; font-weight:600; color:#9CA3AF; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pay-step.done .pay-step-label, .pay-step.current .pay-step-label { color:var(--ink); }
.pay-total { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; margin-top:24px; padding:18px 20px;
  background:var(--ol); border:1px solid var(--ob); border-radius:14px; }
.pay-total-label { color:var(--mut); font-size:.82rem; font-weight:600; }
.pay-total-value { margin-top:2px; color:var(--od); font-size:2rem; font-weight:800; letter-spacing:-.02em; }
.pay-actions { display:flex; gap:8px; flex-wrap:wrap; }
.pay-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:9px 16px; border-radius:11px;
  border:1px solid var(--line); background:#fff; color:#374151; font-size:.84rem; font-weight:700; cursor:pointer; font-family:inherit;
  transition:background .15s, border-color .15s, transform .1s, box-shadow .15s; }
.pay-btn:hover:not(:disabled) { background:#F9FAFB; border-color:#D1D5DB; }
.pay-btn:active:not(:disabled) { transform:scale(.98); }
.pay-btn:focus-visible, .pay-back:focus-visible, .pay-drop:focus-within { outline:2px solid var(--o); outline-offset:2px; }
.pay-btn:disabled { opacity:.55; cursor:not-allowed; }
.pay-btn.sm { min-height:34px; padding:6px 12px; font-size:.78rem; }
.pay-btn.primary { background:var(--o); border-color:var(--o); color:#fff; box-shadow:0 4px 12px rgba(234,88,12,.25); }
.pay-btn.primary:hover:not(:disabled) { background:var(--od); border-color:var(--od); }
.pay-btn.full { width:100%; }
.pay-btn.copied { background:#F0FDF4; border-color:#BBF7D0; color:#15803D; }
.pay-grid { display:grid; grid-template-columns:3fr 2fr; gap:18px; margin-top:18px; align-items:start; }
.pay-section { padding:24px; }
.pay-sec-head { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.pay-num { width:32px; height:32px; border-radius:50%; display:grid; place-items:center; background:var(--ol); color:var(--od); font-weight:800; font-size:.88rem; }
.pay-sec-title { margin:0; font-size:1.05rem; font-weight:800; line-height:1.2; }
.pay-sec-hint { margin:2px 0 0; color:var(--mut); font-size:.78rem; }
.pay-method { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid #F3F4F6; border-radius:12px; }
.pay-method-ico { width:42px; height:42px; border-radius:11px; background:#F3F4F6; display:grid; place-items:center; font-size:1.2rem; }
.pay-method-name { margin:0; font-weight:700; }
.pay-method-type { margin:2px 0 0; color:var(--mut); font-size:.82rem; }
.pay-desc { margin:14px 0 0; color:#4B5563; font-size:.88rem; line-height:1.6; }
.pay-bank { margin-top:14px; padding:20px; border-radius:14px; color:#fff; background:linear-gradient(135deg,#111827,#374151); }
.pay-bank-label { margin:0; color:#D1D5DB; font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.pay-bank-row { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-top:8px; }
.pay-bank-number { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:1.5rem; font-weight:700; letter-spacing:.08em; word-break:break-all; }
.pay-bank-name { margin:14px 0 0; padding-top:12px; border-top:1px solid rgba(255,255,255,.15); color:#D1D5DB; font-size:.88rem; }
.pay-bank-name b { color:#fff; }
.pay-bank .pay-btn { background:rgba(255,255,255,.14); border-color:transparent; color:#fff; }
.pay-bank .pay-btn:hover:not(:disabled) { background:rgba(255,255,255,.26); border-color:transparent; }
.pay-bank .pay-btn.copied { background:#22C55E; color:#fff; }
.pay-qr { margin-top:14px; padding:20px; text-align:center; background:#F9FAFB; border-radius:14px; }
.pay-qr-frame { display:inline-block; padding:12px; background:#fff; border:1px solid var(--line); border-radius:16px; box-shadow:0 2px 10px rgba(0,0,0,.05); }
.pay-qr img { display:block; width:232px; max-width:100%; aspect-ratio:1; object-fit:contain; border-radius:8px; }
.pay-qr p { margin:14px 0 0; color:var(--mut); font-size:.84rem; line-height:1.55; }
.pay-tips { margin:18px 0 0; padding:0; list-style:none; display:grid; gap:8px; color:#4B5563; font-size:.84rem; line-height:1.5; }
.pay-tips li { display:flex; gap:8px; }
.pay-tips li::before { content:'✓'; color:#16A34A; font-weight:800; }
.pay-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:176px; padding:24px 16px; text-align:center;
  border:2px dashed #D1D5DB; border-radius:14px; cursor:pointer; transition:border-color .15s, background .15s; }
.pay-drop:hover, .pay-drop.drag { border-color:var(--o); background:var(--ol); }
.pay-drop-ico { width:48px; height:48px; margin-bottom:12px; border-radius:50%; display:grid; place-items:center; background:#F3F4F6; color:#4B5563; font-size:1.3rem; }
.pay-drop strong { font-size:.9rem; }
.pay-drop span { margin-top:4px; color:var(--mut); font-size:.76rem; }
.pay-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
.pay-preview { overflow:hidden; border:1px solid var(--line); border-radius:14px; }
.pay-preview-img { position:relative; background:#F9FAFB; }
.pay-preview-img img { display:block; width:100%; max-height:260px; object-fit:contain; }
.pay-remove { position:absolute; top:8px; right:8px; width:30px; height:30px; border:0; border-radius:50%; background:rgba(17,24,39,.7); color:#fff; font-size:1rem; cursor:pointer; }
.pay-remove:hover { background:#111827; }
.pay-file { display:flex; justify-content:space-between; gap:12px; padding:10px 12px; border-top:1px solid #F3F4F6; font-size:.76rem; color:#4B5563; }
.pay-file b { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pay-file span { flex:none; color:var(--mut); }
.pay-note { display:flex; gap:10px; margin:0; padding:14px; border-radius:12px; font-size:.86rem; line-height:1.55; }
.pay-note.info { background:#EFF6FF; color:#1E40AF; }
.pay-note.success { background:#F0FDF4; color:#166534; }
.pay-note.danger { background:#FEF2F2; color:#B91C1C; }
.pay-note.neutral { background:#F9FAFB; color:#4B5563; }
.pay-note.mb { margin-bottom:14px; }
.pay-note.mt { margin-top:12px; }
.pay-link { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:14px; padding:12px 14px; border:1px solid var(--line);
  border-radius:12px; font-size:.84rem; text-decoration:none; color:var(--ink); transition:border-color .15s, background .15s; }
.pay-link:hover { border-color:var(--ob); background:var(--ol); }
.pay-link b { color:var(--od); }
.pay-foot { margin:22px 0 0; text-align:center; color:var(--mut); font-size:.78rem; }
.pay-foot-actions { display:flex; justify-content:center; margin-top:18px; }
.pay-skel { animation:pay-pulse 1.4s ease-in-out infinite; }
.pay-skel div { background:#E5E7EB; border-radius:8px; }
.pay-spin { width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; animation:pay-rot .7s linear infinite; }
.pay-error-box { padding:36px 24px; text-align:center; }
.pay-error-box h1 { margin:0 0 8px; font-size:1.15rem; }
.pay-error-box p { margin:0 auto 18px; max-width:420px; color:var(--mut); font-size:.9rem; line-height:1.55; }
.pay-error-box .pay-btn + .pay-btn { margin-left:8px; }
@keyframes pay-pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
@keyframes pay-rot { to { transform:rotate(360deg) } }
@media (max-width: 760px) {
  .pay { padding:20px 14px 36px; }
  .pay-hero-body { padding:20px 18px 22px; }
  .pay-title { font-size:1.4rem; }
  .pay-grid { grid-template-columns:1fr; }
  .pay-section { padding:20px 18px; }
  .pay-total-value { font-size:1.7rem; }
  .pay-bank-number { font-size:1.25rem; }
  .pay-step-label { font-size:.68rem; }
}
@media (prefers-reduced-motion: reduce) {
  .pay *, .pay *::before { animation:none !important; transition:none !important; }
}
`;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const ok = document.execCommand('copy');
  input.remove();
  if (!ok) throw new Error('copy failed');
}

export default function PaymentPage({ navigate }: Props) {
  const { orderId } = useParams();
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<'account' | 'amount' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!proof) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(proof);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const refreshPayment = async () => {
    setRefreshing(true);
    await loadPayment();
    setRefreshing(false);
  };

  const selectFile = (file: File | null) => {
    setMessage('');
    if (!file) {
      setProof(null);
      return;
    }
    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      setError('Bukti harus berupa gambar JPG, PNG, atau WEBP.');
      setProof(null);
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    if (file.size > MAX_PROOF_SIZE) {
      setError('Ukuran bukti pembayaran maksimal 1,8 MB. Kompres atau pilih gambar yang lebih kecil.');
      setProof(null);
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setError('');
    setProof(file);
  };

  const clearProof = () => {
    setProof(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (submitting) return;
    selectFile(event.dataTransfer.files?.[0] ?? null);
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
      clearProof();
      setMessage('Bukti pembayaran berhasil dikirim. Pembayaran akan diperiksa oleh admin.');
      await loadPayment();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyValue = async (value: string | null | undefined, kind: 'account' | 'amount') => {
    if (!value) return;
    try {
      await copyText(value);
      setError('');
      setCopied(kind);
    } catch {
      setError('Teks tidak dapat disalin oleh browser ini. Silakan salin secara manual.');
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

  const cancelled = details?.order.status === 'cancelled';
  const paid = details?.payment.status === 'paid';
  const rejected = details?.payment.status === 'rejected';
  const awaitingReview = Boolean(details?.payment.proof) && !paid && !rejected && !cancelled;
  const canUpload = Boolean(details && !cancelled && !paid && (rejected || !details.payment.proof));
  const amount = details ? Number(details.payment.amount) : 0;
  const activeStep = paid ? STEPS.length : awaitingReview ? 2 : 1;

  const status = cancelled
    ? { label: 'Pesanan dibatalkan', tone: 'neutral', pulse: false }
    : paid
      ? { label: 'Terverifikasi', tone: 'success', pulse: false }
      : rejected
        ? { label: 'Perlu pembayaran ulang', tone: 'danger', pulse: false }
        : awaitingReview
          ? { label: 'Menunggu verifikasi admin', tone: 'info', pulse: true }
          : { label: 'Menunggu pembayaran', tone: 'warning', pulse: true };

  return (
    <div className="pay">
      <style>{styles}</style>

      <button type="button" className="pay-back" onClick={() => navigate('dashboard')}>
        <span aria-hidden="true">←</span> Kembali ke pesanan
      </button>

      {loading ? (
        <div className="pay-skel" role="status" aria-label="Memuat informasi pembayaran">
          <div className="pay-card" style={{ padding: 28 }}>
            <div style={{ height: 12, width: 140 }} />
            <div style={{ height: 30, width: 280, marginTop: 14 }} />
            <div style={{ height: 70, marginTop: 28, borderRadius: 14 }} />
          </div>
          <div className="pay-grid">
            <div className="pay-card" style={{ padding: 24 }}><div style={{ height: 220 }} /></div>
            <div className="pay-card" style={{ padding: 24 }}><div style={{ height: 220 }} /></div>
          </div>
        </div>
      ) : error && !details ? (
        <div className="pay-card pay-error-box">
          <h1>Informasi tidak dapat dimuat</h1>
          <p role="alert">{error}</p>
          <button type="button" className="pay-btn primary" onClick={() => void refreshPayment()}>Coba lagi</button>
          <button type="button" className="pay-btn" onClick={() => navigate('dashboard')}>Ke pesanan saya</button>
        </div>
      ) : details ? (
        <>
          <header className="pay-card pay-hero">
            <div className="pay-hero-body">
              <div className="pay-top">
                <div>
                  <p className="pay-order">Pesanan {details.order.order_number}</p>
                  <h1 className="pay-title">
                    {cancelled
                      ? 'Pesanan Dibatalkan'
                      : paid
                        ? 'Pembayaran Selesai'
                        : awaitingReview
                          ? 'Pembayaran Sedang Diperiksa'
                          : 'Selesaikan Pembayaran'}
                  </h1>
                  <p className="pay-sub">
                    {cancelled
                      ? 'Pesanan ini sudah dibatalkan.'
                      : paid
                        ? 'Pembayaran sudah diverifikasi. Terima kasih telah berbelanja.'
                        : awaitingReview
                          ? 'Bukti sudah kami terima. Halaman ini diperbarui otomatis saat admin selesai memeriksa.'
                          : 'Transfer sesuai nominal di bawah, lalu unggah bukti pembayaran.'}
                  </p>
                </div>
                <span className={`pay-badge ${status.tone}${status.pulse ? ' pulse' : ''}`}>
                  <i /> {status.label}
                </span>
              </div>

              {!cancelled && (
                <ol className="pay-steps" aria-label="Progres pembayaran">
                  {STEPS.map((label, index) => {
                    const state = index < activeStep ? 'done' : index === activeStep ? 'current' : '';
                    return (
                      <li
                        key={label}
                        className={`pay-step ${state}`}
                        aria-current={state === 'current' ? 'step' : undefined}
                      >
                        <div className="pay-step-row">
                          <span className="pay-dot">{state === 'done' ? '✓' : index + 1}</span>
                          {index < STEPS.length - 1 && <span className="pay-bar" />}
                        </div>
                        <p className="pay-step-label">{label}</p>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="pay-total">
                <div>
                  <div className="pay-total-label">Total yang harus dibayar</div>
                  <div className="pay-total-value">{formatPrice(amount)}</div>
                </div>
                <div className="pay-actions">
                  {!paid && !cancelled && (
                    <button
                      type="button"
                      className={`pay-btn sm${copied === 'amount' ? ' copied' : ''}`}
                      onClick={() => void copyValue(String(amount), 'amount')}
                    >
                      {copied === 'amount' ? '✓ Tersalin' : 'Salin nominal'}
                    </button>
                  )}
                  <button type="button" className="pay-btn sm" onClick={() => void refreshPayment()} disabled={refreshing}>
                    <span aria-hidden="true">↻</span> {refreshing ? 'Memperbarui...' : 'Perbarui status'}
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="pay-grid">
            <section className="pay-card pay-section">
              <div className="pay-sec-head">
                <span className="pay-num">1</span>
                <div>
                  <h2 className="pay-sec-title">Metode pembayaran</h2>
                  <p className="pay-sec-hint">Ikuti instruksi di bawah ini</p>
                </div>
              </div>

              {paymentMethod ? (
                <>
                  <div className="pay-method">
                    <div className="pay-method-ico" aria-hidden="true">{paymentMethod.type === 'bank' ? '🏦' : '▦'}</div>
                    <div style={{ minWidth: 0 }}>
                      <p className="pay-method-name">{paymentMethod.name}</p>
                      <p className="pay-method-type">
                        {paymentMethod.type === 'bank' ? 'Transfer bank' : 'Pembayaran QRIS'}
                      </p>
                    </div>
                  </div>

                  {paymentMethod.description && <p className="pay-desc">{paymentMethod.description}</p>}

                  {paymentMethod.type === 'bank' ? (
                    <div className="pay-bank">
                      <p className="pay-bank-label">Transfer ke nomor rekening</p>
                      <div className="pay-bank-row">
                        <strong className="pay-bank-number">
                          {paymentMethod.account_number || 'Belum tersedia'}
                        </strong>
                        {paymentMethod.account_number && (
                          <button
                            type="button"
                            className={`pay-btn sm${copied === 'account' ? ' copied' : ''}`}
                            onClick={() => void copyValue(paymentMethod.account_number, 'account')}
                          >
                            {copied === 'account' ? '✓ Tersalin' : 'Salin nomor'}
                          </button>
                        )}
                      </div>
                      {paymentMethod.account_name && (
                        <p className="pay-bank-name">Atas nama <b>{paymentMethod.account_name}</b></p>
                      )}
                    </div>
                  ) : qrImage ? (
                    <div className="pay-qr">
                      <div className="pay-qr-frame">
                        <img src={qrImage} alt={`Kode QR ${paymentMethod.name}`} />
                      </div>
                      <p>Scan kode QRIS dengan aplikasi bank atau e-wallet, lalu bayar sesuai total pesanan.</p>
                    </div>
                  ) : (
                    <p role="alert" className="pay-note danger mt">
                      Informasi QRIS metode ini belum tersedia. Hubungi admin untuk bantuan.
                    </p>
                  )}

                  {!paid && !cancelled && (
                    <ul className="pay-tips">
                      <li>Pastikan nominal transfer sama persis dengan total pembayaran.</li>
                      <li>Simpan bukti transfer, lalu unggah pada langkah berikutnya.</li>
                    </ul>
                  )}
                </>
              ) : (
                <p role="alert" className="pay-note danger">
                  Detail metode pembayaran tidak tersedia. Hubungi admin untuk bantuan.
                </p>
              )}
            </section>

            <section className="pay-card pay-section">
              <div className="pay-sec-head">
                <span className="pay-num">2</span>
                <div>
                  <h2 className="pay-sec-title">Bukti pembayaran</h2>
                  <p className="pay-sec-hint">JPG, PNG, WEBP · maks. 1,8 MB</p>
                </div>
              </div>

              {rejected && (
                <div role="alert" className="pay-note danger mb">
                  <span aria-hidden="true">⚠</span>
                  <div>
                    <strong>Bukti sebelumnya ditolak</strong>
                    {details.payment.notes && <div style={{ marginTop: 4 }}>Catatan admin: {details.payment.notes}</div>}
                    <div style={{ marginTop: 4 }}>Silakan unggah bukti yang benar.</div>
                  </div>
                </div>
              )}

              {canUpload ? (
                <>
                  {proof && preview ? (
                    <div className="pay-preview">
                      <div className="pay-preview-img">
                        <img src={preview} alt="Pratinjau bukti pembayaran" />
                        <button
                          type="button"
                          className="pay-remove"
                          onClick={clearProof}
                          disabled={submitting}
                          aria-label="Hapus gambar"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="pay-file">
                        <b>{proof.name}</b>
                        <span>{formatFileSize(proof.size)}</span>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="payment-proof"
                      className={`pay-drop${dragging ? ' drag' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                    >
                      <span className="pay-drop-ico" aria-hidden="true">↑</span>
                      <strong>{dragging ? 'Lepaskan gambar di sini' : 'Pilih atau seret gambar bukti'}</strong>
                      <span>Foto atau tangkapan layar bukti transfer</span>
                      <input
                        ref={fileInput}
                        id="payment-proof"
                        className="pay-sr"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={submitting}
                        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    className="pay-btn primary full"
                    style={{ marginTop: 14 }}
                    onClick={() => void uploadProof()}
                    disabled={!proof || submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="pay-spin" /> Mengunggah...
                      </>
                    ) : details.payment.proof ? (
                      'Unggah Bukti Baru'
                    ) : (
                      'Kirim Bukti Pembayaran'
                    )}
                  </button>
                </>
              ) : cancelled ? (
                <p className="pay-note neutral">Pesanan dibatalkan, bukti pembayaran tidak dapat dikirim.</p>
              ) : paid ? (
                <p role="status" className="pay-note success">
                  <span aria-hidden="true">✓</span> Pembayaran Anda sudah diverifikasi. Pesanan sedang diproses.
                </p>
              ) : (
                <p role="status" className="pay-note info">
                  <span aria-hidden="true">●</span> Bukti pembayaran sudah diterima dan sedang diperiksa oleh admin.
                </p>
              )}

              {proofUrl && (
                <a className="pay-link" href={proofUrl} target="_blank" rel="noreferrer">
                  <span>Bukti yang sudah dikirim</span>
                  <b>Lihat ↗</b>
                </a>
              )}

              {error && details && <p role="alert" className="pay-note danger mt">{error}</p>}
              {message && details && <p role="status" className="pay-note success mt">{message}</p>}
            </section>
          </div>

          <p className="pay-foot">Simpan bukti transfer sampai pembayaran selesai diverifikasi.</p>
          <div className="pay-foot-actions">
            <button type="button" className="pay-btn" onClick={() => navigate('dashboard', { menu: 'pesanan' })}>Lihat pesanan saya</button>
          </div>

        </>
      ) : null}
    </div>
  );
}

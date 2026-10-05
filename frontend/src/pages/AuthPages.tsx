import { useEffect, useRef, useState } from 'react';
import type { Page } from '../App';
import { apiFetch } from '../api/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: string;
              size: string;
              width: number;
              text: string;
            }
          ) => void;
        };
      };
    };
  }
}

/* =========================================================
   SESSION
========================================================= */

interface AuthUser {
  name?: string;
  email: string;
  phone?: string;
  role: string;
}

/*
| apiFetch mengembalikan seluruh body response Laravel:
|   { success, message, data: { user, token } }
| Jadi payload-nya berada di property `data`, bukan di level atas.
*/
interface AuthPayload {
  user: AuthUser;
  token: string;
}

interface AuthResponse {
  data: AuthPayload;
}

/** Simpan seluruh key sesi di satu tempat (login, register, Google). */
function saveSession({ user, token }: AuthPayload) {
  localStorage.setItem('token', token);
  localStorage.setItem('authRole', user.role);
  localStorage.setItem('userName', user.name || '');
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userPhone', user.phone || '');
}



/**
 * apiFetch sudah melempar Error berisi pesan, tapi validasi Laravel
 * mengirim beberapa field sekaligus. dulu hanya errors.email yang
 * ditampilkan, jadi error password/nama/phone ikut hilang.
 */
function readApiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  return error.message || fallback;
}

/* =========================================================
   GOOGLE LOGIN
========================================================= */

function GoogleAuthButton({
  navigate,
  text,
}: {
  navigate: (page: Page) => void;
  text: string;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const result = await apiFetch<AuthResponse>(
              '/auth/google',
              {
                method: 'POST',
                body: JSON.stringify({ credential }),
              }
            );

            saveSession(result.data);

            navigate(
              result.data.user.role === 'admin' ? 'admin' : 'dashboard'
            );
          } catch (error) {
            /*
            | Backend belum punya endpoint /api/auth/google, jadi 404
            | akan muncul kalau GOOGLE_CLIENT_ID sempat diisi. Beri
            | pesan yang jelas, bukan "404 not found" mentah.
            */
            const message =
              error instanceof Error && error.message.includes('404')
                ? 'Login Google belum tersedia di server.'
                : readApiError(error, 'Login Google gagal.');

            window.alert(message);
          }
        },
      });

      buttonRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(
        buttonRef.current,
        {
          theme: 'outline',
          size: 'large',
          width: 360,
          text,
        }
      );
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [clientId, navigate, text]);

  if (!clientId) {
    return (
      <div
        style={{
          color: '#9CA3AF',
          fontSize: '0.78rem',
          textAlign: 'center',
        }}
      >
        Google Login belum dikonfigurasi.
      </div>
    );
  }

  return (
    <div
      ref={buttonRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 40,
      }}
    />
  );
}

/* =========================================================
   LOGIN
========================================================= */

export function LoginPage({
  navigate,
}: {
  navigate: (page: Page) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Pakai apiFetch, bukan fetch ke URL hardcoded, supaya ikut
      // VITE_API_URL seperti halaman lain.
      const result = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (remember) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      saveSession(result.data);

      navigate(
        result.data.user.role === 'admin' ? 'admin' : 'dashboard'
      );
    } catch (err) {
      setError(readApiError(err, 'Login gagal. Coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#FFF8F0',
      }}
    >
      {/* Left visual */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, rgba(17, 24, 39, 0.72), rgba(17, 24, 39, 0.38)), url("/images/gambar.jpg") center / cover no-repeat',
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            color: 'white',
            zIndex: 1,
          }}
        >
          {/* <img
            src="/images/logo/wicaksono_logo_1.webp"
            alt="Logo Wicaksono"
            style={{
              width: 96,
              height: 96,
              objectFit: 'contain',
              marginBottom: 16,
            }}
          /> */}

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              margin: '0 0 12px',
            }}
          >
            Selamat Datang!
          </h2>

          <p
            style={{
              opacity: 0.85,
              lineHeight: 1.7,
              maxWidth: 320,
              fontSize: '0.95rem',
            }}
          >
            Masuk dan temukan berbagai oleh-oleh khas Malang yang
            lezat dan autentik, dikirim langsung ke pintumu.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <button
            onClick={() => navigate('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#F97316',
              fontFamily: 'Poppins',
              marginBottom: 24,
              fontSize: '0.85rem',
            }}
          >
            ← Kembali ke Beranda
          </button>

          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#1F2937',
              margin: '0 0 6px',
            }}
          >
            Masuk
          </h1>

          <p
            style={{
              color: '#6B7280',
              margin: '0 0 28px',
              fontSize: '0.875rem',
            }}
          >
            Belum punya akun?{' '}
            <button
              onClick={() => navigate('register')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#F97316',
                fontFamily: 'Poppins',
                fontWeight: 600,
              }}
            >
              Daftar sekarang
            </button>
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {error && (
              <div
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                Email
              </label>

              <input
                className="input-field"
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <label
                  style={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#374151',
                  }}
                >
                  Password
                </label>

                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#F97316',
                    fontSize: '0.8rem',
                    fontFamily: 'Poppins',
                  }}
                >
                  Lupa password?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  style={{ paddingRight: 40 }}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#9CA3AF',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                style={{
                  accentColor: '#F97316',
                  width: 16,
                  height: 16,
                }}
              />

              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#374151',
                }}
              >
                Ingat saya selama 30 hari
              </span>
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                padding: '13px',
                fontSize: '0.95rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Memproses...' : 'Masuk ke Akun'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: '#E5E7EB',
                }}
              />

              <span
                style={{
                  color: '#9CA3AF',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                atau masuk dengan
              </span>

              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: '#E5E7EB',
                }}
              />
            </div>

            <GoogleAuthButton
              navigate={navigate}
              text="signin_with"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTER
========================================================= */

export function RegisterPage({
  navigate,
}: {
  navigate: (page: Page) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, val: string) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (form.password !== form.confirm) {
      setError('Password tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const result = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          password_confirmation: form.confirm,
        }),
      });

      saveSession(result.data);

      setSuccess(
        'Registrasi berhasil. Anda akan masuk ke halaman dashboard.'
      );

      setTimeout(() => navigate('dashboard'), 800);
    } catch (err) {
      setError(readApiError(err, 'Registrasi gagal. Coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#FFF8F0',
      }}
    >
      {/* Left visual */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'linear-gradient(rgba(22, 101, 52, 0.48), rgba(21, 128, 61, 0.58))',
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            color: 'white',
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛍️</div>

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              margin: '0 0 12px',
            }}
          >
            Bergabung Sekarang!
          </h2>

          <p
            style={{
              opacity: 0.85,
              lineHeight: 1.7,
              maxWidth: 320,
              fontSize: '0.95rem',
            }}
          >
            Daftar gratis dan dapatkan diskon 10% untuk pembelian
            pertama. Ribuan produk khas Malang menunggumu!
          </p>

          <div
            style={{
              marginTop: 32,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '16px 24px',
            }}
          >
            <div
              style={{ fontWeight: 700, fontSize: '1.1rem' }}
            >
              Kode Promo Baru
            </div>

            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: 4,
                marginTop: 4,
              }}
            >
              MALANG10
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              Hemat 10% pembelian pertama
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <button
            onClick={() => navigate('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#F97316',
              fontFamily: 'Poppins',
              marginBottom: 24,
              fontSize: '0.85rem',
            }}
          >
            ← Kembali ke Beranda
          </button>

          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              color: '#1F2937',
              margin: '0 0 6px',
            }}
          >
            Buat Akun
          </h1>

          <p
            style={{
              color: '#6B7280',
              margin: '0 0 28px',
              fontSize: '0.875rem',
            }}
          >
            Sudah punya akun?{' '}
            <button
              onClick={() => navigate('login')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#F97316',
                fontFamily: 'Poppins',
                fontWeight: 600,
              }}
            >
              Masuk di sini
            </button>
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleRegister();
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {error && (
              <div
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#166534',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {success}
              </div>
            )}

            {[
              {
                field: 'name',
                label: 'Nama Lengkap',
                type: 'text',
                placeholder: 'Nama lengkap sesuai KTP',
              },
              {
                field: 'email',
                label: 'Email',
                type: 'email',
                placeholder: 'contoh@email.com',
              },
              {
                field: 'phone',
                label: 'Nomor HP',
                type: 'tel',
                placeholder: '08xx-xxxx-xxxx',
              },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#374151',
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>

                <input
                  className="input-field"
                  type={type}
                  placeholder={placeholder}
                  value={form[field as keyof typeof form]}
                  onChange={(event) => update(field, event.target.value)}
                  required={field !== 'phone'}
                />
              </div>
            ))}

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={(event) =>
                    update('password', event.target.value)
                  }
                  style={{ paddingRight: 40 }}
                  required
                  minLength={8}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#9CA3AF',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                Konfirmasi Password
              </label>

              <input
                className="input-field"
                type="password"
                placeholder="Ulangi password"
                value={form.confirm}
                onChange={(event) =>
                  update('confirm', event.target.value)
                }
                required
              />

              {form.confirm &&
                form.confirm !== form.password && (
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.78rem',
                      color: '#DC2626',
                    }}
                  >
                    Password tidak cocok
                  </p>
                )}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.78rem',
                color: '#9CA3AF',
              }}
            >
              Dengan mendaftar, kamu menyetujui{' '}
              <span
                style={{
                  color: '#F97316',
                  fontWeight: 600,
                }}
              >
                Syarat & Ketentuan
              </span>{' '}
              dan{' '}
              <span
                style={{
                  color: '#F97316',
                  fontWeight: 600,
                }}
              >
                Kebijakan Privasi
              </span>{' '}
              kami.
            </p>

            <button
              type="submit"
              className="btn-secondary"
              disabled={loading}
              style={{
                padding: '13px',
                fontSize: '0.95rem',
                width: '100%',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: '#E5E7EB',
                }}
              />

              <span
                style={{
                  color: '#9CA3AF',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                atau daftar dengan
              </span>

              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: '#E5E7EB',
                }}
              />
            </div>

            <GoogleAuthButton
              navigate={navigate}
              text="signup_with"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
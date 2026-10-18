const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api'
).replace(/\/+$/, '');

export const BACKEND_URL = API_URL.endsWith('/api')
  ? API_URL.slice(0, -4)
  : API_URL;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  // Jangan set Content-Type untuk FormData.
  // Browser akan otomatis membuat:
  // multipart/form-data; boundary=...
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error('API ERROR:', {
      status: response.status,
      url: `${API_URL}${endpoint}`,
      data,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authRole');

      throw new Error(
        'Sesi login sudah berakhir. Silakan login sebagai admin kembali.'
      );
    }

    if (response.status === 403) {
      throw new Error(
        'Akun ini tidak memiliki izin admin untuk menyimpan produk.'
      );
    }

    // Tampilkan error validasi Laravel
    if (data?.errors) {
      const validationErrors = Object.values(data.errors)
        .flat()
        .join(' ');

      throw new Error(
        validationErrors ||
        data?.message ||
        `Request gagal (${response.status})`
      );
    }

    throw new Error(
      data?.message ||
      `Request gagal (${response.status})`
    );
  }

  return data as T;
}

/**
 * Mengubah:
 *
 * products/bakso.jpg
 *
 * menjadi:
 *
 * http://localhost:8000/storage/products/bakso.jpg
 */
export function storageUrl(
  path: string | null | undefined
): string {
  if (!path) {
    return '';
  }

  // Jika sudah URL lengkap, langsung gunakan
  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, '');

  return `${BACKEND_URL}/storage/${cleanPath}`;
}
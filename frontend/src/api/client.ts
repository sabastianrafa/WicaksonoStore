const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000/api'
).replace(/\/$/, '');

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

  /**
   * Jangan set Content-Type untuk FormData.
   *
   * Browser akan otomatis menentukan:
   * multipart/form-data; boundary=...
   */
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
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
 * http://127.0.0.1:8000/storage/products/bakso.jpg
 */
export function storageUrl(
  path: string | null | undefined
): string {
  if (!path) {
    return `${BACKEND_URL}/storage/products/default.jpg`;
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  const cleanPath = path
    .replace(/^\/+/, '')
    .replace(/^storage\//, '');

  return `${BACKEND_URL}/storage/${cleanPath}`;
}
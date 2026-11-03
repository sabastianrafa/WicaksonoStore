import { useEffect, useRef, useState } from "react"
import { formatPrice } from "../data"
import { apiFetch, storageUrl } from "../api/client"
import type { Page } from "../App"

interface CartItem {
  id: number
  product_id: number
  quantity: number
  subtotal: number
  product: {
    id: number
    name: string
    price: string | number
    stock: number
    weight: number
    image?: string | null
    images?: {
      id: number
      path: string
      url?: string
      is_primary?: boolean
    }[]
  }
}

const validItems = (cart: CartItem[]) =>
  cart.filter((item): item is CartItem => Boolean(item?.product))

const productImage = (item: CartItem): string => {
  const p = item.product

  const url =
    p.images?.find((i) => i.is_primary)?.url ??
    p.images?.[0]?.url ??
    p.images?.find((i) => i.is_primary)?.path ??
    p.images?.[0]?.path ??
    p.image ??
    ""

  if (!url) return ""

  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : storageUrl(url)
}

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

interface CheckoutPageProps {
  cart: CartItem[]
  navigate: (page: Page, data?: unknown) => void
  onOrderPlaced?: () => void
}

interface LocationOption {
  code: string
  name: string
}

interface ShippingQuote {
  region: string
  location: {
    province: string
    city: string
  }
  courier: {
    id: number
    code: string
    name: string
    estimated_days: string | null
  }
  cost: number
  original_cost: number
  shipping_discount: number
  promotion_applied: boolean
}

interface ShippingQuoteResponse {
  success: boolean
  data: ShippingQuote
}

interface SavedAddress {
  id: number
  label: string
  name: string
  phone: string
  province: string
  province_code: string | null
  city: string
  regency_code: string | null
  district: string | null
  district_code: string | null
  village: string | null
  village_code: string | null
  postal_code: string
  rt: string | null
  rw: string | null
  neighborhood: string | null
  landmark: string | null
  address: string
  is_default: boolean
}

interface AddressesResponse {
  success: boolean
  data: SavedAddress[]
}

interface AddressResponse {
  success: boolean
  data: SavedAddress
}

interface OrderResponse {
  success: boolean
  data: { id: number; order_number: string }
}

/* ------------------------------------------------------------------ */
/* Inline styles (scoped to .checkout-page — tidak bocor ke halaman    */
/* lain karena hanya di-render selama halaman checkout aktif).         */
/* ------------------------------------------------------------------ */
const CHECKOUT_CSS = `
.checkout-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: Poppins, system-ui, -apple-system, sans-serif;
  color: #1F2937;
}

/* ---------- Breadcrumb ---------- */
.checkout-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
  font-size: 0.8rem;
  color: #9CA3AF;
}
.checkout-breadcrumb button {
  background: none;
  border: none;
  cursor: pointer;
  color: #DF401F;
  font-family: inherit;
  font-size: inherit;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}
.checkout-breadcrumb button:hover { background: #FFF1EC; color: #B73418; }
.checkout-breadcrumb button:focus-visible {
  outline: 2px solid #DF401F;
  outline-offset: 1px;
}
.checkout-breadcrumb .current { color: #1F2937; font-weight: 600; }

/* ---------- Step indicator ---------- */
.checkout-steps {
  list-style: none;
  padding: 0;
  margin: 0 0 40px;
  display: flex;
  align-items: flex-start;
  max-width: 520px;
}
.checkout-step {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}
.checkout-step:last-child { flex: none; }
.checkout-step-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.checkout-step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F3F4F6;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  transition: background 0.3s, color 0.3s, transform 0.25s;
}
.checkout-step-circle.active {
  background: #DF401F;
  color: #fff;
  transform: scale(1.06);
}
.checkout-step-circle.completed { background: #15803D; color: #fff; }
.checkout-step-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9CA3AF;
  text-align: center;
  transition: color 0.3s;
  line-height: 1.3;
}
.checkout-step-label.active { color: #DF401F; }
.checkout-step-label.completed { color: #15803D; }
.checkout-step-connector {
  flex: 1;
  height: 2px;
  background: #F3F4F6;
  margin: 17px 8px 0;
  border-radius: 2px;
  transition: background 0.3s;
}
.checkout-step-connector.completed { background: #DF401F; }

/* ---------- Grid utama ---------- */
.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}
.checkout-main { min-width: 0; }

/* ---------- Card ---------- */
.checkout-card {
  background: #fff;
  border-radius: 14px;
  padding: 28px;
  border: 1px solid #F3F4F6;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.checkout-card h3 {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 1.15rem;
  color: #1F2937;
  line-height: 1.35;
}
.checkout-card .subtitle {
  margin: 0 0 20px;
  color: #6B7280;
  font-size: 0.85rem;
  line-height: 1.6;
}

/* ---------- Address cards ---------- */
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.address-option {
  text-align: left;
  padding: 16px;
  border-radius: 10px;
  border: 1.5px solid #E5E7EB;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.address-option:hover {
  border-color: #F9A88E;
  background: #FFFAF7;
}
.address-option:focus-visible {
  outline: 2px solid #DF401F;
  outline-offset: 2px;
}
.address-option[aria-pressed="true"] {
  border-color: #DF401F;
  background: #FFF7ED;
  box-shadow: 0 0 0 3px rgba(223, 64, 31, 0.1);
}
.address-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.address-head strong { color: #1F2937; font-size: 0.9rem; }
.address-badge {
  color: #15803D;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.address-recipient {
  display: block;
  margin-top: 8px;
  color: #374151;
  font-size: 0.82rem;
  font-weight: 600;
}
.address-detail {
  display: block;
  margin-top: 5px;
  color: #6B7280;
  font-size: 0.78rem;
  line-height: 1.6;
}
.address-action {
  display: block;
  margin-top: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #9CA3AF;
  transition: color 0.15s;
}
.address-option[aria-pressed="true"] .address-action { color: #C2410C; }

/* ---------- Form ---------- */
.checkout-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.checkout-form-grid.first { margin-top: 0; }
.checkout-form-grid.three { grid-template-columns: 1fr 1fr 1fr; }
.form-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.form-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.form-label .required { color: #DC2626; font-weight: 700; }
.form-help { font-size: 0.75rem; color: #9CA3AF; }

.input-field {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1.5px solid #D1D5DB;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #1F2937;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.input-field:hover:not(:disabled) { border-color: #9CA3AF; }
.input-field:focus,
.input-field:focus-visible {
  outline: none;
  border-color: #DF401F;
  box-shadow: 0 0 0 3px rgba(223, 64, 31, 0.15);
}
.input-field:disabled {
  background: #F9FAFB;
  color: #9CA3AF;
  cursor: not-allowed;
}
.input-field::placeholder { color: #9CA3AF; }
textarea.input-field { min-height: 80px; resize: vertical; }

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 0.82rem;
  cursor: pointer;
  padding-bottom: 8px;
}
.checkbox-row input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: #DF401F; cursor: pointer;
}

/* ---------- Buttons ---------- */
.checkout-page .btn-primary,
.checkout-page .btn-outline {
  font-family: inherit;
  font-weight: 600;
  font-size: 0.88rem;
  border-radius: 10px;
  padding: 12px 24px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s, border-color 0.15s, transform 0.1s,
              box-shadow 0.15s, opacity 0.15s;
  min-height: 44px;
}
.checkout-page .btn-primary {
  background: #DF401F;
  color: #fff;
  border: 1.5px solid #DF401F;
}
.checkout-page .btn-primary:hover:not(:disabled) {
  background: #C73818;
  border-color: #C73818;
  box-shadow: 0 4px 12px rgba(223, 64, 31, 0.25);
}
.checkout-page .btn-primary:active:not(:disabled) { transform: translateY(1px); }
.checkout-page .btn-primary:focus-visible {
  outline: 2px solid #DF401F;
  outline-offset: 2px;
}
.checkout-page .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.checkout-page .btn-outline {
  background: #fff;
  color: #374151;
  border: 1.5px solid #D1D5DB;
}
.checkout-page .btn-outline:hover {
  border-color: #9CA3AF;
  background: #F9FAFB;
}
.checkout-page .btn-outline:focus-visible {
  outline: 2px solid #DF401F;
  outline-offset: 2px;
}
.checkout-page .btn-outline:active { transform: translateY(1px); }
.checkout-page button:focus-visible,
.checkout-page a:focus-visible,
.checkout-page input:focus-visible,
.checkout-page select:focus-visible,
.checkout-page textarea:focus-visible {
  outline: 2px solid #DF401F;
  outline-offset: 2px;
}
.checkout-page button:disabled { cursor: not-allowed; }

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.form-actions .btn-primary { flex: 1; min-width: 220px; }

/* ---------- Spinner ---------- */
.checkout-spinner {
  display: inline-block;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: checkout-spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes checkout-spin { to { transform: rotate(360deg); } }

/* ---------- Alert ---------- */
.checkout-alert {
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 16px;
  line-height: 1.55;
}
.checkout-alert.error {
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
}
.checkout-alert.warning {
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
  margin-top: 12px;
  font-size: 0.78rem;
}
.checkout-alert.loading {
  background: #F8FAFC;
  color: #475569;
  border: 1px solid #E2E8F0;
}
.checkout-alert .retry-button {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  margin: 8px 0 0;
  padding: 6px 10px;
  border: 1px solid currentColor;
  border-radius: 6px;
  background: #fff;
  color: #DF401F;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.checkout-alert .retry-button:disabled { opacity: 0.6; }

/* ---------- Confirmation blocks ---------- */
.confirm-box {
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #FAFAFA;
  margin-bottom: 16px;
}
.confirm-box .name { font-weight: 700; color: #1F2937; }
.confirm-box .address {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #6B7280;
  line-height: 1.6;
}

.shipping-box {
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid #FED7AA;
  background: #FFF7ED;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.shipping-box .courier { font-weight: 700; color: #1F2937; }
.shipping-box .meta { margin-top: 4px; font-size: 0.8rem; color: #6B7280; }
.shipping-box .free {
  margin-top: 6px;
  font-size: 0.8rem;
  color: #15803D;
  font-weight: 600;
}
.shipping-cost { text-align: right; white-space: nowrap; }
.shipping-cost .strike {
  color: #9CA3AF;
  font-size: 0.78rem;
  text-decoration: line-through;
}
.shipping-cost .amount { font-weight: 800; }
.shipping-cost .amount.discount { color: #15803D; }
.shipping-cost .amount.normal { color: #DF401F; }

.order-summary-note {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #F8FAFC;
  color: #475569;
  font-size: 0.85rem;
  line-height: 1.6;
}
.order-summary-note strong { color: #1F2937; }

/* ---------- Summary sidebar ---------- */
.checkout-summary { position: sticky; top: 88px; }
.checkout-summary-card {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  border: 1px solid #F3F4F6;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.checkout-summary-card h3 {
  margin: 0 0 16px;
  font-weight: 700;
  font-size: 1rem;
  color: #1F2937;
}
.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  max-height: 320px;
  overflow-y: auto;
}
.summary-item { display: flex; gap: 10px; align-items: center; }
.summary-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: #F9FAFB;
  flex-shrink: 0;
}
.summary-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  border: 1px solid #E5E7EB;
}
.summary-item-info { flex: 1; min-width: 0; }
.summary-item-name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1F2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.summary-item-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #9CA3AF;
}
.summary-item-price {
  font-weight: 600;
  color: #1F2937;
  font-size: 0.85rem;
  flex-shrink: 0;
  white-space: nowrap;
}
.summary-totals {
  border-top: 1px solid #F3F4F6;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}
.summary-row .label { color: #6B7280; }
.summary-row .value { font-weight: 600; color: #1F2937; }
.summary-row.total {
  border-top: 1px solid #F3F4F6;
  padding-top: 10px;
  margin-top: 4px;
}
.summary-row.total .label { font-weight: 700; color: #1F2937; }
.summary-row.total .value {
  font-weight: 800;
  color: #DF401F;
  font-size: 1.1rem;
}

/* ---------- Responsive ---------- */
@media (max-width: 1023px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .checkout-summary { position: static; }
}
@media (max-width: 639px) {
  .checkout-page { padding: 20px 16px; }
  .checkout-card { padding: 18px 16px; }
  .checkout-form-grid,
  .checkout-form-grid.three { grid-template-columns: 1fr; }
  .input-field { font-size: 16px; }
  .checkout-step-label { font-size: 0.65rem; }
  .checkout-step-circle { width: 30px; height: 30px; font-size: 0.8rem; }
  .checkout-step-connector { margin-top: 14px; }
  .form-actions { flex-direction: column; }
  .form-actions .btn-primary,
  .form-actions .btn-outline { width: 100%; min-width: 0; }
  .shipping-box { flex-direction: column; align-items: flex-start; }
  .shipping-cost { text-align: left; }
  .checkout-summary-card { padding: 18px 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .checkout-page *,
  .checkout-page *::before,
  .checkout-page *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="checkout-spinner"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export default function CheckoutPage({
  cart,
  navigate,
  onOrderPlaced,
}: CheckoutPageProps) {
  const [step, setStep] = useState(1)
  const [provinces, setProvinces] = useState<LocationOption[]>([])
  const [regencies, setRegencies] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [villages, setVillages] = useState<LocationOption[]>([])
  const [locationError, setLocationError] = useState("")
  const [locationRetry, setLocationRetry] = useState(0)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressesError, setAddressesError] = useState("")
  const [addressesRetry, setAddressesRetry] = useState(0)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  )
  const [addingAddress, setAddingAddress] = useState(false)
  const [makeDefaultAddress, setMakeDefaultAddress] = useState(false)
  const [form, setForm] = useState(() => ({
    label: "Rumah",
    name: localStorage.getItem("userName") ?? "",
    phone: localStorage.getItem("userPhone") ?? "",
    province_code: "",
    regency_code: "",
    district_code: "",
    village_code: "",
    zip: "",
    rt: "",
    rw: "",
    neighborhood: "",
    landmark: "",
    address: "",
  }))
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [shippingError, setShippingError] = useState("")
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderError, setOrderError] = useState("")
  const shippingQuoteRequestId = useRef(0)
  const activeQuoteRequestId = useRef<number | null>(null)
  const orderSubmissionInFlight = useRef(false)

  useEffect(() => {
    let active = true

    setAddressesLoading(true)
    setAddressesError("")
    apiFetch<AddressesResponse>("/addresses")
      .then((response) => {
        if (!active) return
        const addresses = response.data ?? []
        setSavedAddresses(addresses)
        const usableAddresses = addresses.filter(
          (address) =>
            address.province_code &&
            address.regency_code &&
            address.district_code &&
            address.village_code,
        )
        const defaultAddress = usableAddresses.find(
          (address) => address.is_default,
        )
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        } else if (usableAddresses[0]) {
          setSelectedAddressId(usableAddresses[0].id)
        } else {
          setAddingAddress(true)
        }
      })
      .catch((error) => {
        if (active) {
          setAddressesError(
            getErrorMessage(error, "Gagal memuat alamat tersimpan."),
          )
        }
      })
      .finally(() => {
        if (active) setAddressesLoading(false)
      })

    return () => {
      active = false
    }
  }, [addressesRetry])

  useEffect(() => {
    let active = true

    setLocationError("")
    apiFetch<{ data: LocationOption[] }>("/locations/provinces")
      .then((response) => {
        if (active) setProvinces(response.data ?? [])
      })
      .catch((error) => {
        if (active) {
          setLocationError(
            getErrorMessage(error, "Gagal memuat daftar provinsi."),
          )
        }
      })

    return () => {
      active = false
    }
  }, [locationRetry])

  useEffect(() => {
    if (!form.province_code) {
      setRegencies([])
      return
    }

    let active = true
    apiFetch<{ data: LocationOption[] }>(
      `/locations/provinces/${encodeURIComponent(form.province_code)}/regencies`,
    )
      .then((response) => {
        if (active) setRegencies(response.data ?? [])
      })
      .catch((error) => {
        if (active)
          setLocationError(
            getErrorMessage(error, "Gagal memuat daftar kabupaten/kota."),
          )
      })
    return () => {
      active = false
    }
  }, [form.province_code, locationRetry])

  useEffect(() => {
    if (!form.regency_code) {
      setDistricts([])
      return
    }

    let active = true
    apiFetch<{ data: LocationOption[] }>(
      `/locations/regencies/${encodeURIComponent(form.regency_code)}/districts`,
    )
      .then((response) => {
        if (active) setDistricts(response.data ?? [])
      })
      .catch((error) => {
        if (active)
          setLocationError(
            getErrorMessage(error, "Gagal memuat daftar kecamatan."),
          )
      })
    return () => {
      active = false
    }
  }, [form.regency_code, locationRetry])

  useEffect(() => {
    if (!form.district_code) {
      setVillages([])
      return
    }

    let active = true
    apiFetch<{ data: LocationOption[] }>(
      `/locations/districts/${encodeURIComponent(form.district_code)}/villages`,
    )
      .then((response) => {
        if (active) setVillages(response.data ?? [])
      })
      .catch((error) => {
        if (active)
          setLocationError(
            getErrorMessage(error, "Gagal memuat daftar kelurahan/desa."),
          )
      })
    return () => {
      active = false
    }
  }, [form.district_code, locationRetry])

  const items = validItems(cart)

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity,
    0,
  )
  const shippingFee = shippingQuote?.cost ?? 0
  const total = subtotal + shippingFee
  const usableAddresses = savedAddresses.filter(
    (address) =>
      address.province_code &&
      address.regency_code &&
      address.district_code &&
      address.village_code,
  )
  const incompleteAddresses = savedAddresses.filter(
    (address) =>
      !address.province_code ||
      !address.regency_code ||
      !address.district_code ||
      !address.village_code,
  )

  const updateAddressField = (field: keyof typeof form, value: string) => {
    setForm((current) => {
      if (field === "province_code") {
        return {
          ...current,
          province_code: value,
          regency_code: "",
          district_code: "",
          village_code: "",
        }
      }
      if (field === "regency_code") {
        return {
          ...current,
          regency_code: value,
          district_code: "",
          village_code: "",
        }
      }
      if (field === "district_code") {
        return { ...current, district_code: value, village_code: "" }
      }
      return { ...current, [field]: value }
    })
    if (field === "province_code") {
      setRegencies([])
      setDistricts([])
      setVillages([])
    } else if (field === "regency_code") {
      setDistricts([])
      setVillages([])
    } else if (field === "district_code") {
      setVillages([])
    }
    if (
      [
        "province_code",
        "regency_code",
        "district_code",
        "village_code",
      ].includes(field)
    ) {
      invalidateShippingQuote()
      setLocationError("")
    }
  }

  const invalidateShippingQuote = () => {
    shippingQuoteRequestId.current += 1
    activeQuoteRequestId.current = null
    setShippingQuote(null)
    setShippingError("")
    setOrderError("")
    setQuoteLoading(false)
  }

  const selectAddress = (addressId: number) => {
    setSelectedAddressId(addressId)
    setAddingAddress(false)
    invalidateShippingQuote()
  }

  const startAddingAddress = () => {
    setSelectedAddressId(null)
    setAddingAddress(true)
    setMakeDefaultAddress(savedAddresses.length === 0)
    setForm((current) => ({
      ...current,
      label: "Rumah",
      province_code: "",
      regency_code: "",
      district_code: "",
      village_code: "",
      zip: "",
      rt: "",
      rw: "",
      neighborhood: "",
      landmark: "",
      address: "",
    }))
    invalidateShippingQuote()
  }

  const continueToConfirmation = async () => {
    if (activeQuoteRequestId.current !== null) return

    const selectedAddress = savedAddresses.find(
      (address) => address.id === selectedAddressId,
    )
    if (!addingAddress && !selectedAddress) {
      setShippingError("Pilih alamat pengiriman atau tambahkan alamat baru.")
      return
    }

    if (
      addingAddress &&
      (!form.label.trim() ||
        !form.name.trim() ||
        !form.phone.trim() ||
        !form.province_code ||
        !form.regency_code ||
        !form.district_code ||
        !form.village_code ||
        !/^\d{5}$/.test(form.zip.trim()) ||
        !form.address.trim())
    ) {
      setShippingError(
        "Lengkapi label, data penerima, seluruh wilayah, kode pos 5 digit, dan alamat jalan.",
      )
      return
    }

    const location = addingAddress ? form : selectedAddress!
    const requestId = ++shippingQuoteRequestId.current
    activeQuoteRequestId.current = requestId
    setQuoteLoading(true)
    setShippingError("")

    try {
      const response = await apiFetch<ShippingQuoteResponse>(
        "/shipping-methods/quote",
        {
          method: "POST",
          body: JSON.stringify({
            province_code: location.province_code,
            regency_code: location.regency_code,
            district_code: location.district_code,
            village_code: location.village_code,
          }),
        },
      )

      if (requestId !== shippingQuoteRequestId.current) return

      let addressId = selectedAddressId
      if (addingAddress) {
        const addressResponse = await apiFetch<AddressResponse>("/addresses", {
          method: "POST",
          body: JSON.stringify({
            label: form.label.trim(),
            name: form.name.trim(),
            phone: form.phone.trim(),
            province_code: form.province_code,
            regency_code: form.regency_code,
            district_code: form.district_code,
            village_code: form.village_code,
            postal_code: form.zip.trim(),
            rt: form.rt.trim() || null,
            rw: form.rw.trim() || null,
            neighborhood: form.neighborhood.trim() || null,
            landmark: form.landmark.trim() || null,
            address: form.address.trim(),
            is_default: makeDefaultAddress,
          }),
        })
        if (requestId !== shippingQuoteRequestId.current) return
        addressId = addressResponse.data.id
        setSavedAddresses((current) => [addressResponse.data, ...current])
        setSelectedAddressId(addressId)
        setAddingAddress(false)
      }

      if (addressId) {
        setShippingQuote(response.data)
        setOrderError("")
        setStep(2)
      }
    } catch (error) {
      if (requestId === shippingQuoteRequestId.current) {
        setShippingError(
          error instanceof Error
            ? error.message
            : "Gagal menghitung ongkos kirim.",
        )
      }
    } finally {
      if (requestId === shippingQuoteRequestId.current) {
        activeQuoteRequestId.current = null
        setQuoteLoading(false)
      }
    }
  }

  const handleOrder = async () => {
    if (orderSubmissionInFlight.current) return
    setOrderError("")

    if (!shippingQuote) {
      setOrderError(
        "Ongkir belum dihitung. Kembali ke alamat untuk menghitung ongkir.",
      )
      setStep(1)
      return
    }

    if (items.length === 0) {
      setOrderError("Keranjang kosong. Tambahkan produk sebelum checkout.")
      return
    }

    if (!selectedAddressId) {
      setOrderError("Pilih alamat pengiriman terlebih dahulu.")
      setStep(1)
      return
    }

    orderSubmissionInFlight.current = true
    setSubmittingOrder(true)

    try {
      const orderResponse = await apiFetch<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          address_id: selectedAddressId,
          shipping_method_id: shippingQuote.courier.id,
        }),
      })

      if (typeof onOrderPlaced === "function") {
        onOrderPlaced()
      }
      navigate("payment", { orderId: orderResponse.data.id })
    } catch (error) {
      setOrderError(
        error instanceof Error ? error.message : "Gagal membuat pesanan.",
      )
    } finally {
      orderSubmissionInFlight.current = false
      setSubmittingOrder(false)
    }
  }

  const selectedAddress = savedAddresses.find(
    (address) => address.id === selectedAddressId,
  )

  if (items.length === 0) {
    return (
      <>
        <style>{CHECKOUT_CSS}</style>
        <main className="checkout-page">
          <nav aria-label="Breadcrumb" className="checkout-breadcrumb">
            <button type="button" onClick={() => navigate("home")}>
              Beranda
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => navigate("cart")}>
              Keranjang
            </button>
            <span aria-hidden="true">/</span>
            <span className="current" aria-current="page">
              Checkout
            </span>
          </nav>
          <section className="checkout-card" aria-labelledby="empty-cart-title">
            <h1
              id="empty-cart-title"
              style={{ margin: "0 0 8px", fontSize: "1.25rem" }}
            >
              Keranjang masih kosong
            </h1>
            <p className="subtitle">
              Tambahkan produk terlebih dahulu sebelum melanjutkan checkout.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate("catalog")}
            >
              Cari Produk
            </button>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <style>{CHECKOUT_CSS}</style>
      <div className="checkout-page">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="checkout-breadcrumb">
          <button type="button" onClick={() => navigate("home")}>
            Beranda
          </button>
          <span aria-hidden="true">/</span>
          <button type="button" onClick={() => navigate("cart")}>
            Keranjang
          </button>
          <span aria-hidden="true">/</span>
          <span className="current" aria-current="page">
            Checkout
          </span>
        </nav>

        <h1
          style={{
            margin: "0 0 24px",
            color: "#1F2937",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          Checkout
        </h1>

        {/* Step indicator */}
        <ol className="checkout-steps" aria-label="Langkah checkout">
          {[
            { n: 1, label: "Alamat & Pengiriman" },
            { n: 2, label: "Konfirmasi Pesanan" },
          ].map(({ n, label }, idx) => {
            const isCompleted = step > n
            const isActive = step === n
            return (
              <li
                key={n}
                className="checkout-step"
                aria-current={isActive ? "step" : undefined}
              >
                <div className="checkout-step-inner">
                  <div
                    className={
                      "checkout-step-circle" +
                      (isActive ? " active" : "") +
                      (isCompleted ? " completed" : "")
                    }
                    aria-hidden="true"
                  >
                    {isCompleted ? "✓" : n}
                  </div>
                  <span
                    className={
                      "checkout-step-label" +
                      (isActive ? " active" : "") +
                      (isCompleted ? " completed" : "")
                    }
                  >
                    {label}
                  </span>
                </div>
                {idx < 1 && (
                  <div
                    className={
                      "checkout-step-connector" +
                      (isCompleted ? " completed" : "")
                    }
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="checkout-grid">
          <div className="checkout-main">
            {/* ---------------- STEP 1 ---------------- */}
            {step === 1 && (
              <div className="checkout-card">
                <h3>Alamat Pengiriman</h3>
                <p className="subtitle">
                  Pilih alamat yang sudah tersimpan atau tambahkan alamat baru
                  ke akun Anda.
                </p>

                {addressesLoading && (
                  <div className="checkout-alert loading" role="status">
                    <Spinner size={12} />{" "}
                    <span style={{ marginLeft: 8 }}>
                      Memuat alamat tersimpan…
                    </span>
                  </div>
                )}

                {addressesError && (
                  <div className="checkout-alert error" role="alert">
                    {addressesError}
                    <button
                      type="button"
                      className="retry-button"
                      disabled={addressesLoading}
                      onClick={() =>
                        setAddressesRetry((attempt) => attempt + 1)
                      }
                    >
                      {addressesLoading ? "Memuat…" : "Coba lagi"}
                    </button>
                  </div>
                )}

                {!addressesLoading && usableAddresses.length > 0 && (
                  <div
                    className="address-grid"
                    role="group"
                    aria-label="Pilih alamat tersimpan"
                  >
                    {usableAddresses.map((address) => {
                      const selected =
                        selectedAddressId === address.id && !addingAddress
                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => selectAddress(address.id)}
                          disabled={quoteLoading}
                          aria-pressed={selected}
                          className="address-option"
                        >
                          <span className="address-head">
                            <strong>{address.label}</strong>
                            {address.is_default && (
                              <span className="address-badge">UTAMA</span>
                            )}
                          </span>
                          <span className="address-recipient">
                            {address.name} · {address.phone}
                          </span>
                          <span className="address-detail">
                            {address.address}
                            {address.rt || address.rw
                              ? `, RT ${address.rt || "-"} / RW ${
                                  address.rw || "-"
                                }`
                              : ""}
                            {address.neighborhood
                              ? `, ${address.neighborhood}`
                              : ""}
                            {address.landmark
                              ? `, patokan ${address.landmark}`
                              : ""}
                            {`, ${address.village}, ${address.district}, ${address.city}, ${address.province} ${address.postal_code}`}
                          </span>
                          <span className="address-action">
                            {selected ? "✓ Alamat dipilih" : "Pilih alamat"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {!addressesLoading && incompleteAddresses.length > 0 && (
                  <div className="checkout-alert warning" role="status">
                    Ada alamat lama yang belum memiliki wilayah lengkap.
                    Tambahkan ulang alamat tersebut agar bisa dipakai untuk
                    pengiriman.
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={startAddingAddress}
                    disabled={quoteLoading}
                    aria-pressed={addingAddress}
                    className="btn-outline"
                    style={{
                      fontSize: "0.82rem",
                      padding: "10px 14px",
                      borderColor: addingAddress ? "#DF401F" : undefined,
                      color: addingAddress ? "#C2410C" : undefined,
                      background: addingAddress ? "#FFF7ED" : undefined,
                    }}
                  >
                    + Tambah alamat baru
                  </button>
                </div>

                {addingAddress && (
                  <fieldset
                    disabled={quoteLoading}
                    style={{
                      border: "none",
                      padding: 0,
                      margin: "20px 0 0",
                      borderTop: "1px solid #E5E7EB",
                      paddingTop: 20,
                    }}
                  >
                    <legend
                      style={{
                        fontWeight: 700,
                        color: "#1F2937",
                        padding: 0,
                        marginBottom: 16,
                        fontSize: "1rem",
                      }}
                    >
                      Detail alamat baru
                    </legend>

                    <div className="checkout-form-grid first">
                      <div className="form-field">
                        <label className="form-label" htmlFor="field-label">
                          Label alamat{" "}
                          <span className="required" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <input
                          id="field-label"
                          className="input-field"
                          placeholder="Contoh: Rumah, Kantor"
                          maxLength={255}
                          value={form.label}
                          required
                          onChange={(event) =>
                            updateAddressField("label", event.target.value)
                          }
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          paddingBottom: 6,
                        }}
                      >
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={makeDefaultAddress}
                            onChange={(event) =>
                              setMakeDefaultAddress(event.target.checked)
                            }
                          />
                          Jadikan alamat utama
                        </label>
                      </div>
                    </div>

                    <div className="checkout-form-grid">
                      {[
                        {
                          field: "name",
                          label: "Nama Lengkap",
                          placeholder: "Masukkan nama lengkap",
                        },
                        {
                          field: "phone",
                          label: "Nomor HP",
                          placeholder: "08xx-xxxx-xxxx",
                        },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field} className="form-field">
                          <label
                            className="form-label"
                            htmlFor={`field-${field}`}
                          >
                            {label}{" "}
                            <span className="required" aria-hidden="true">
                              *
                            </span>
                          </label>
                          <input
                            id={`field-${field}`}
                            className="input-field"
                            type={field === "phone" ? "tel" : "text"}
                            autoComplete={
                              field === "name" ? "name" : "tel"
                            }
                            placeholder={placeholder}
                            value={form[(field as keyof typeof form)]}
                            required
                            onChange={(e) =>
                              updateAddressField(
                                field as keyof typeof form,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="checkout-form-grid">
                      {[
                        {
                          field: "province_code",
                          label: "Provinsi",
                          options: provinces,
                          disabled: false,
                          placeholder: "Pilih provinsi",
                        },
                        {
                          field: "regency_code",
                          label: "Kota/Kabupaten",
                          options: regencies,
                          disabled: !form.province_code,
                          placeholder: "Pilih kota/kabupaten",
                        },
                      ].map(
                        ({ field, label, options, disabled, placeholder }) => (
                          <div key={field} className="form-field">
                            <label
                              className="form-label"
                              htmlFor={`field-${field}`}
                            >
                              {label}{" "}
                              <span className="required" aria-hidden="true">
                                *
                              </span>
                            </label>
                            <select
                              id={`field-${field}`}
                              className="input-field"
                              value={form[(field as keyof typeof form)]}
                              disabled={disabled}
                              required
                              onChange={(event) =>
                                updateAddressField(
                                  field as keyof typeof form,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">{placeholder}</option>
                              {options.map((option) => (
                                <option key={option.code} value={option.code}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="checkout-form-grid three">
                      {[
                        {
                          field: "district_code",
                          label: "Kecamatan",
                          options: districts,
                          disabled: !form.regency_code,
                          placeholder: "Pilih kecamatan",
                        },
                        {
                          field: "village_code",
                          label: "Kelurahan/Desa",
                          options: villages,
                          disabled: !form.district_code,
                          placeholder: "Pilih kelurahan/desa",
                        },
                      ].map(
                        ({ field, label, options, disabled, placeholder }) => (
                          <div key={field} className="form-field">
                            <label
                              className="form-label"
                              htmlFor={`field-${field}`}
                            >
                              {label}{" "}
                              <span className="required" aria-hidden="true">
                                *
                              </span>
                            </label>
                            <select
                              id={`field-${field}`}
                              className="input-field"
                              value={form[(field as keyof typeof form)]}
                              disabled={disabled}
                              required
                              onChange={(event) =>
                                updateAddressField(
                                  field as keyof typeof form,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">{placeholder}</option>
                              {options.map((option) => (
                                <option key={option.code} value={option.code}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ),
                      )}
                      <div className="form-field">
                        <label className="form-label" htmlFor="field-zip">
                          Kode Pos{" "}
                          <span className="required" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <input
                          id="field-zip"
                          className="input-field"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          maxLength={5}
                          pattern="[0-9]{5}"
                          placeholder="00000"
                          value={form.zip}
                          required
                          onChange={(event) =>
                            updateAddressField(
                              "zip",
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 5),
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="checkout-form-grid">
                      {[
                        {
                          field: "rt",
                          label: "RT",
                          placeholder: "Contoh: 001",
                        },
                        {
                          field: "rw",
                          label: "RW",
                          placeholder: "Contoh: 002",
                        },
                        {
                          field: "neighborhood",
                          label: "Perumahan / Lingkungan (opsional)",
                          placeholder: "Nama perumahan atau lingkungan",
                        },
                        {
                          field: "landmark",
                          label: "Patokan (opsional)",
                          placeholder: "Patokan lokasi terdekat",
                        },
                      ].map(({ field, label, placeholder }) => (
                        <div key={field} className="form-field">
                          <label
                            className="form-label"
                            htmlFor={`field-${field}`}
                          >
                            {label}
                          </label>
                          <input
                            id={`field-${field}`}
                            className="input-field"
                            maxLength={
                              field === "rt" || field === "rw" ? 3 : undefined
                            }
                            placeholder={placeholder}
                            value={form[(field as keyof typeof form)]}
                            onChange={(event) =>
                              updateAddressField(
                                field as keyof typeof form,
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="checkout-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                      <div className="form-field">
                        <label
                          className="form-label"
                          htmlFor="field-address"
                        >
                          Nama Jalan, Nomor Rumah, dan Detail Alamat{" "}
                          <span className="required" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <textarea
                          id="field-address"
                          className="input-field"
                          autoComplete="street-address"
                          placeholder="Contoh: Jl. Mawar No. 10, Gang 2, rumah pagar hijau"
                          rows={3}
                          value={form.address}
                          required
                          onChange={(e) =>
                            updateAddressField("address", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </fieldset>
                )}

                {locationError && (
                  <div className="checkout-alert error" role="alert">
                    {locationError}
                    <button
                      type="button"
                      className="retry-button"
                      onClick={() => {
                        setLocationError("")
                        setLocationRetry((attempt) => attempt + 1)
                      }}
                    >
                      Muat ulang wilayah
                    </button>
                  </div>
                )}
                {shippingError && (
                  <div className="checkout-alert error" role="alert">
                    {shippingError}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={continueToConfirmation}
                    disabled={quoteLoading || addressesLoading}
                    aria-busy={quoteLoading}
                  >
                    {quoteLoading ? (
                      <>
                        <Spinner size={14} /> Menghitung ongkir…
                      </>
                    ) : (
                      "Lanjut konfirmasi →"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- STEP 2 ---------------- */}
            {step === 2 && (
              <div className="checkout-card">
                <h3>Konfirmasi Pesanan</h3>
                <p className="subtitle">
                  Periksa kembali alamat dan pengiriman. Setelah pesanan
                  dibuat, Anda akan melanjutkan ke halaman pembayaran.
                </p>

                {selectedAddress && (
                  <div className="confirm-box">
                    <div className="name">
                      {selectedAddress.name} · {selectedAddress.phone}
                    </div>
                    <div className="address">
                      {[
                        selectedAddress.address,
                        selectedAddress.village,
                        selectedAddress.district,
                        selectedAddress.city,
                        selectedAddress.province,
                        selectedAddress.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                )}

                {shippingQuote && (
                  <div className="shipping-box">
                    <div>
                      <div className="courier">
                        {shippingQuote.courier.name}
                      </div>
                      <div className="meta">
                        Ongkir ke {shippingQuote.location.city},{" "}
                        {shippingQuote.location.province}
                        {shippingQuote.courier.estimated_days
                          ? ` · Estimasi ${shippingQuote.courier.estimated_days}`
                          : ""}
                      </div>
                      {shippingQuote.promotion_applied && (
                        <div className="free">
                          Gratis ongkir · Hemat{" "}
                          {formatPrice(shippingQuote.shipping_discount)}
                        </div>
                      )}
                    </div>
                    <div className="shipping-cost">
                      {shippingQuote.promotion_applied && (
                        <div className="strike">
                          {formatPrice(shippingQuote.original_cost)}
                        </div>
                      )}
                      <span
                        className={
                          "amount " +
                          (shippingQuote.promotion_applied
                            ? "discount"
                            : "normal")
                        }
                      >
                        {shippingQuote.promotion_applied
                          ? "GRATIS"
                          : formatPrice(shippingQuote.cost)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="order-summary-note" role="status">
                  Jumlah barang:{" "}
                  {items.reduce((sum, item) => sum + item.quantity, 0)} · Total:{" "}
                  <strong>{formatPrice(total)}</strong>
                </div>

                {orderError && (
                  <div className="checkout-alert error" role="alert">
                    {orderError}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={submittingOrder}
                    onClick={() => setStep(1)}
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOrder}
                    disabled={submittingOrder}
                    aria-busy={submittingOrder}
                  >
                    {submittingOrder ? (
                      <>
                        <Spinner size={14} /> Menyimpan Pesanan…
                      </>
                    ) : (
                      "Buat Pesanan & Lanjut ke Pembayaran"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---------------- SUMMARY ---------------- */}
          <aside className="checkout-summary" aria-label="Ringkasan pesanan">
            <div className="checkout-summary-card">
              <h3>Ringkasan Pesanan</h3>
              <div className="summary-items">
                {items.map((item) => {
                  const img = productImage(item)
                  return (
                    <div key={item.id} className="summary-item">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="summary-img"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="summary-img summary-img-placeholder"
                          aria-hidden="true"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      )}
                      <div className="summary-item-info">
                        <p className="summary-item-name">{item.product.name}</p>
                        <p className="summary-item-meta">
                          ×{item.quantity}
                          {item.product.weight > 0
                            ? ` · ${item.product.weight.toLocaleString(
                                "id-ID",
                              )} g`
                            : ""}
                        </p>
                      </div>
                      <span className="summary-item-price">
                        {formatPrice(
                          Number(item.product.price) * item.quantity,
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span className="label">Subtotal</span>
                  <span className="value">{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Ongkir</span>
                  <span className="value">
                    {shippingQuote
                      ? formatPrice(shippingFee)
                      : "Dihitung dari alamat"}
                  </span>
                </div>
                <div className="summary-row total">
                  <span className="label">Total</span>
                  <span className="value">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
import { useEffect, useRef, useState } from "react"
import { formatPrice } from "../data"
import { apiFetch, storageUrl } from "../api/client"
import type { Page } from "../App"
import AddressFormModal, {
  type AddressFormValues,
} from "../components/AddressFormModal"

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


function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-white/30 border-t-white"
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressesError, setAddressesError] = useState("")
  const [addressesRetry, setAddressesRetry] = useState(0)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  )
  const [addingAddress, setAddingAddress] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
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
          setAddressModalOpen(true)
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
    setAddressModalOpen(true)
    setMakeDefaultAddress(savedAddresses.length === 0)
    setForm((current) => ({
      ...current,
      label: "Rumah",
      name: localStorage.getItem("userName") ?? current.name,
      phone: localStorage.getItem("userPhone") ?? current.phone,
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

  const handleAddressModalSubmit = (values: AddressFormValues) => {
    setForm((current) => ({
      ...current,
      label: values.label,
      name: values.name,
      phone: values.phone,
      province_code: values.province_code ?? "",
      regency_code: values.regency_code ?? "",
      district_code: values.district_code ?? "",
      village_code: values.village_code ?? "",
      zip: values.postal_code,
      rt: values.rt ?? "",
      rw: values.rw ?? "",
      neighborhood: values.neighborhood ?? "",
      landmark: values.landmark ?? "",
      address: values.address,
    }))
    setMakeDefaultAddress(values.is_default)
    setAddingAddress(true)
    setAddressModalOpen(false)
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
        <main className="mx-auto w-full max-w-7xl px-4 py-6 font-sans text-gray-800 sm:px-6 sm:py-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <button type="button" className="rounded px-1.5 py-1 text-[#DF401F] transition hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F]" onClick={() => navigate("home")}>
              Beranda
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" className="rounded px-1.5 py-1 text-[#DF401F] transition hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F]" onClick={() => navigate("cart")}>
              Keranjang
            </button>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-gray-800" aria-current="page">
              Checkout
            </span>
          </nav>
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7" aria-labelledby="empty-cart-title">
            <h1
              id="empty-cart-title"
              className="mb-2 text-xl font-bold text-gray-900"
            >
              Keranjang masih kosong
            </h1>
            <p className="mb-5 mt-1 text-sm leading-relaxed text-gray-500">
              Tambahkan produk terlebih dahulu sebelum melanjutkan checkout.
            </p>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DF401F] bg-[#DF401F] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#C73818] hover:bg-[#C73818] disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 font-sans text-gray-800 sm:px-6 sm:py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <button type="button" className="rounded px-1.5 py-1 text-[#DF401F] transition hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F]" onClick={() => navigate("home")}>
            Beranda
          </button>
          <span aria-hidden="true">/</span>
          <button type="button" className="rounded px-1.5 py-1 text-[#DF401F] transition hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F]" onClick={() => navigate("cart")}>
            Keranjang
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-gray-800" aria-current="page">
            Checkout
          </span>
        </nav>

        <h1 className="mb-6 text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
          Checkout
        </h1>

        {/* Step indicator */}
        <ol className="mb-10 flex w-full max-w-[520px] items-start" aria-label="Langkah checkout">
          {[
            { n: 1, label: "Alamat & Pengiriman" },
            { n: 2, label: "Konfirmasi Pesanan" },
          ].map(({ n, label }, idx) => {
            const isCompleted = step > n
            const isActive = step === n
            return (
              <li
                key={n}
                className="flex min-w-0 flex-1 items-start last:flex-none"
                aria-current={isActive ? "step" : undefined}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                      isActive
                        ? "scale-105 bg-[#DF401F] text-white"
                        : isCompleted
                          ? "bg-green-700 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                    aria-hidden="true"
                  >
                    {isCompleted ? "✓" : n}
                  </div>
                  <span
                    className={`text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                      isActive
                        ? "text-[#DF401F]"
                        : isCompleted
                          ? "text-green-700"
                          : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < 1 && (
                  <div
                    className={`mx-2 mt-[17px] h-0.5 flex-1 rounded-full ${
                      isCompleted ? "bg-[#DF401F]" : "bg-gray-100"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          <div className="min-w-0">
            {/* ---------------- STEP 1 ---------------- */}
            {step === 1 && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
                <h3 className="text-base font-bold leading-snug text-gray-900 sm:text-lg">Alamat Pengiriman</h3>
                <p className="mb-5 mt-1 text-sm leading-relaxed text-gray-500">
                  Pilih alamat yang sudah tersimpan atau tambahkan alamat baru
                  ke akun Anda.
                </p>

                {addressesLoading && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-600" role="status">
                    <Spinner size={12} />{" "}
                    <span>Memuat alamat tersimpan…</span>
                  </div>
                )}

                {addressesError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700" role="alert">
                    {addressesError}
                    <button
                      type="button"
                      className="mt-2 inline-flex min-h-9 items-center rounded-md border border-current bg-white px-3 py-1.5 text-sm font-semibold text-[#DF401F] disabled:opacity-60"
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
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
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
                          className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left text-gray-700 transition hover:border-orange-300 hover:bg-orange-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F]/30 aria-pressed:border-[#DF401F] aria-pressed:bg-orange-50 aria-pressed:shadow-[0_0_0_3px_rgba(223,64,31,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <strong>{address.label}</strong>
                            {address.is_default && (
                              <span className="text-[10px] font-bold tracking-wide text-green-700">UTAMA</span>
                            )}
                          </span>
                          <span className="mt-2 block text-sm font-semibold text-gray-700">
                            {address.name} · {address.phone}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-gray-500">
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
                          <span className="mt-3 block text-xs font-bold text-gray-400">
                            {selected ? "✓ Alamat dipilih" : "Pilih alamat"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {!addressesLoading && incompleteAddresses.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800" role="status">
                    Ada alamat lama yang belum memiliki wilayah lengkap.
                    Tambahkan ulang alamat tersebut agar bisa dipakai untuk
                    pengiriman.
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={startAddingAddress}
                    disabled={quoteLoading}
                    aria-pressed={addingAddress}
                    className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      addingAddress
                        ? "border-[#DF401F] bg-orange-50 text-orange-800"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    + Tambah alamat baru
                  </button>
                </div>

                {addingAddress && !addressModalOpen && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {form.label} · {form.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{form.phone}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {form.address}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Kode pos: {form.zip || "-"}
                        </p>
                        {makeDefaultAddress && (
                          <span className="mt-2 inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            Alamat utama
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddressModalOpen(true)}
                        className="shrink-0 text-sm font-semibold text-[#DF401F] hover:underline"
                      >
                        Ubah
                      </button>
                    </div>
                  </div>
                )}

                {shippingError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700" role="alert">
                    {shippingError}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DF401F] bg-[#DF401F] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#C73818] hover:bg-[#C73818] disabled:cursor-not-allowed disabled:opacity-60"
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
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
                <h3 className="text-base font-bold leading-snug text-gray-900 sm:text-lg">Konfirmasi Pesanan</h3>
                <p className="mb-5 mt-1 text-sm leading-relaxed text-gray-500">
                  Periksa kembali alamat dan pengiriman. Setelah pesanan
                  dibuat, Anda akan melanjutkan ke halaman pembayaran.
                </p>

                {selectedAddress && (
                  <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="font-bold text-gray-900">
                      {selectedAddress.name} · {selectedAddress.phone}
                    </div>
                    <div className="mt-1.5 text-sm leading-relaxed text-gray-500">
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
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <div>
                      <div className="font-bold text-gray-900">
                        {shippingQuote.courier.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Ongkir ke {shippingQuote.location.city},{" "}
                        {shippingQuote.location.province}
                        {shippingQuote.courier.estimated_days
                          ? ` · Estimasi ${shippingQuote.courier.estimated_days}`
                          : ""}
                      </div>
                      {shippingQuote.promotion_applied && (
                        <div className="mt-1.5 text-sm font-semibold text-green-700">
                          Gratis ongkir · Hemat{" "}
                          {formatPrice(shippingQuote.shipping_discount)}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {shippingQuote.promotion_applied && (
                        <div className="text-xs text-gray-400 line-through">
                          {formatPrice(shippingQuote.original_cost)}
                        </div>
                      )}
                      <span
                        className={`font-extrabold ${
                          shippingQuote.promotion_applied
                            ? "text-green-700"
                            : "text-[#DF401F]"
                        }`}
                      >
                        {shippingQuote.promotion_applied
                          ? "GRATIS"
                          : formatPrice(shippingQuote.cost)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600" role="status">
                  Jumlah barang:{" "}
                  {items.reduce((sum, item) => sum + item.quantity, 0)} · Total:{" "}
                  <strong>{formatPrice(total)}</strong>
                </div>

                {orderError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700" role="alert">
                    {orderError}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submittingOrder}
                    onClick={() => setStep(1)}
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DF401F] bg-[#DF401F] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#C73818] hover:bg-[#C73818] disabled:cursor-not-allowed disabled:opacity-60"
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
          <aside className="lg:sticky lg:top-24" aria-label="Ringkasan pesanan">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-4 text-base font-bold text-gray-900">Ringkasan Pesanan</h3>
              <div className="mb-4 flex max-h-80 flex-col gap-3 overflow-y-auto">
                {items.map((item) => {
                  const img = productImage(item)
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
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
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-xs font-semibold text-gray-900">{item.product.name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          ×{item.quantity}
                          {item.product.weight > 0
                            ? ` · ${item.product.weight.toLocaleString(
                                "id-ID",
                              )} g`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPrice(
                          Number(item.product.price) * item.quantity,
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-500">Ongkir</span>
                  <span className="font-semibold text-gray-800">
                    {shippingQuote
                      ? formatPrice(shippingFee)
                      : "Dihitung dari alamat"}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-3 border-t border-gray-100 pt-3 text-sm font-bold">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold text-gray-800">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {addressModalOpen && (
        <AddressFormModal
          initialData={{
            label: form.label,
            name: form.name,
            phone: form.phone,
            province_code: form.province_code,
            regency_code: form.regency_code,
            district_code: form.district_code,
            village_code: form.village_code,
            postal_code: form.zip,
            rt: form.rt || null,
            rw: form.rw || null,
            neighborhood: form.neighborhood || null,
            landmark: form.landmark || null,
            address: form.address,
            is_default: makeDefaultAddress,
          }}
          onClose={() => {
            setAddressModalOpen(false)
            setAddingAddress(false)
          }}
          onSubmit={handleAddressModalSubmit}
        />
      )}
    </>
  )
}
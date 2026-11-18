import { useEffect, useMemo, useRef, useState } from "react"
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
  weight?: { billable_weight: number; actual_weight: number; volumetric_weight: number }
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
  data: {
    id: number
    order_number: string
  }
}

const CHECKOUT_STEPS = [
  "Alamat & Pengiriman",
  "Konfirmasi Pesanan",
  "Pembayaran",
]

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

const validItems = (cart: CartItem[]) =>
  cart.filter((item): item is CartItem => Boolean(item?.product))

const productImage = (item: CartItem): string => {
  const product = item.product
  const image =
    product.images?.find((entry) => entry.is_primary)?.url ??
    product.images?.[0]?.url ??
    product.images?.find((entry) => entry.is_primary)?.path ??
    product.images?.[0]?.path ??
    product.image ??
    ""

  if (!image) return ""

  return image.startsWith("http://") || image.startsWith("https://")
    ? image
    : storageUrl(image)
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current/25 border-t-current"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

function CheckoutStepper({ currentStep }: { currentStep: 1 | 2 }) {
  return (
    <ol
      className="flex w-full items-start"
      aria-label="Langkah checkout"
    >
      {CHECKOUT_STEPS.map((label, index) => {
        const number = index + 1
        const completed = number < currentStep
        const active = number === currentStep

        return (
          <li
            key={label}
            className={`flex min-w-0 items-start ${
              index === CHECKOUT_STEPS.length - 1 ? "flex-none" : "flex-1"
            }`}
            aria-current={active ? "step" : undefined}
          >
            <div className="flex w-[76px] shrink-0 flex-col items-center gap-2 sm:w-32">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  completed
                    ? "bg-green-600 text-white"
                    : active
                      ? "bg-[#DF401F] text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {completed ? "✓" : number}
              </span>
              <span
                className={`text-center text-[10px] leading-tight sm:text-xs ${
                  active
                    ? "font-semibold text-[#DF401F]"
                    : completed
                      ? "font-medium text-green-700"
                      : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>

            {index < CHECKOUT_STEPS.length - 1 && (
              <div
                className={`mx-1.5 mt-[17px] h-0.5 flex-1 rounded-full sm:mx-3 ${
                  completed ? "bg-green-600" : "bg-gray-100"
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function EmptyCart({
  navigate,
}: {
  navigate: CheckoutPageProps["navigate"]
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-xl text-[#DF401F]">
          🛒
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          Keranjang masih kosong
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
          Tambahkan produk terlebih dahulu sebelum melanjutkan checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate("catalog")}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#DF401F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C73818]"
        >
          Cari Produk
        </button>
      </div>
    </main>
  )
}

export default function CheckoutPage({
  cart,
  navigate,
  onOrderPlaced,
}: CheckoutPageProps) {
  const [step, setStep] = useState<1 | 2>(1)
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
  const [tipeLayanan, setTipeLayanan] = useState<'reguler' | 'cargo'>('reguler')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [shippingError, setShippingError] = useState("")
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderError, setOrderError] = useState("")

  const shippingQuoteRequestId = useRef(0)
  const activeQuoteRequestId = useRef<number | null>(null)
  const orderSubmissionInFlight = useRef(false)

  const items = useMemo(() => validItems(cart), [cart])

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.product.price) * item.quantity,
        0,
      ),
    [items],
  )

  const totalWeight = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Math.max(0, Number(item.product.weight) || 0) * item.quantity,
        0,
      ),
    [items],
  )

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const shippingFee = shippingQuote?.cost ?? 0
  const total = subtotal + shippingFee

  const usableAddresses = useMemo(
    () =>
      savedAddresses.filter(
        (address) =>
          Boolean(address.province_code) &&
          Boolean(address.regency_code) &&
          Boolean(address.district_code) &&
          Boolean(address.village_code),
      ),
    [savedAddresses],
  )

  const incompleteAddresses = useMemo(
    () =>
      savedAddresses.filter(
        (address) =>
          !address.province_code ||
          !address.regency_code ||
          !address.district_code ||
          !address.village_code,
      ),
    [savedAddresses],
  )

  const selectedAddress = useMemo(
    () => savedAddresses.find((address) => address.id === selectedAddressId),
    [savedAddresses, selectedAddressId],
  )

  useEffect(() => {
    let active = true

    setAddressesLoading(true)
    setAddressesError("")

    apiFetch<AddressesResponse>("/addresses")
      .then((response) => {
        if (!active) return

        const addresses = response.data ?? []
        setSavedAddresses(addresses)

        const usable = addresses.filter(
          (address) =>
            address.province_code &&
            address.regency_code &&
            address.district_code &&
            address.village_code,
        )

        const defaultAddress = usable.find((address) => address.is_default)
        const initialAddress = defaultAddress ?? usable[0]

        if (initialAddress) {
          setSelectedAddressId(initialAddress.id)
          setAddingAddress(false)
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

  const saveNewAddress = async (): Promise<number> => {
    const response = await apiFetch<AddressResponse>("/addresses", {
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

    const newAddress = response.data
    setSavedAddresses((current) => [newAddress, ...current])
    setSelectedAddressId(newAddress.id)
    setAddingAddress(false)

    return newAddress.id
  }

  const continueToConfirmation = async () => {
    if (activeQuoteRequestId.current !== null || quoteLoading) return

    setShippingError("")
    setOrderError("")

    const currentAddress = selectedAddress

    if (!addingAddress && !currentAddress) {
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
        "Lengkapi data penerima, wilayah, kode pos 5 digit, dan alamat jalan.",
      )
      return
    }

    const location = addingAddress ? form : currentAddress!
    const requestId = ++shippingQuoteRequestId.current
    activeQuoteRequestId.current = requestId
    setQuoteLoading(true)

    try {
      const quoteResponse = await apiFetch<ShippingQuoteResponse>(
        "/shipping-methods/quote",
        {
          method: "POST",
          body: JSON.stringify({
            province_code: location.province_code,
            regency_code: location.regency_code,
            district_code: location.district_code,
            village_code: location.village_code,
            tipe_layanan: tipeLayanan,
          }),
        },
      )

      if (requestId !== shippingQuoteRequestId.current) return

      if (addingAddress) {
        await saveNewAddress()
      }

      if (requestId !== shippingQuoteRequestId.current) return

      setShippingQuote(quoteResponse.data)
      setStep(2)
    } catch (error) {
      if (requestId === shippingQuoteRequestId.current) {
        setShippingError(
          getErrorMessage(error, "Gagal memproses alamat atau ongkir."),
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
        "Ongkos kirim belum tersedia. Kembali ke alamat untuk menghitung ulang.",
      )
      setStep(1)
      return
    }

    if (items.length === 0) {
      setOrderError("Keranjang kosong. Tambahkan produk sebelum checkout.")
      return
    }

    if (!selectedAddressId) {
      setOrderError("Alamat pengiriman belum dipilih.")
      setStep(1)
      return
    }

    orderSubmissionInFlight.current = true
    setSubmittingOrder(true)

    try {
      const response = await apiFetch<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          address_id: selectedAddressId,
          shipping_method_id: shippingQuote.courier.id,
          tipe_layanan: tipeLayanan,
        }),
      })

      onOrderPlaced?.()
      navigate("payment", { orderId: response.data.id })
    } catch (error) {
      setOrderError(
        getErrorMessage(error, "Gagal membuat pesanan. Silakan coba lagi."),
      )
    } finally {
      orderSubmissionInFlight.current = false
      setSubmittingOrder(false)
    }
  }

  const addressText = (address: SavedAddress) =>
    [
      address.address,
      address.rt || address.rw
        ? `RT ${address.rt || "-"} / RW ${address.rw || "-"}`
        : null,
      address.neighborhood,
      address.landmark ? `Patokan: ${address.landmark}` : null,
      address.village,
      address.district,
      address.city,
      address.province,
      address.postal_code,
    ]
      .filter(Boolean)
      .join(", ")

  if (items.length === 0) {
    return <EmptyCart navigate={navigate} />
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 font-sans text-gray-800 sm:px-6 sm:py-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-400"
          >
            <button
              type="button"
              onClick={() => navigate("home")}
              className="rounded px-1 py-1 text-[#DF401F] transition hover:bg-orange-50"
            >
              Beranda
            </button>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              onClick={() => navigate("cart")}
              className="rounded px-1 py-1 text-[#DF401F] transition hover:bg-orange-50"
            >
              Keranjang
            </button>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-gray-800" aria-current="page">
              Checkout
            </span>
          </nav>

          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Lengkapi alamat dan periksa pesanan sebelum melakukan pembayaran.
            </p>
          </div>

          <div className="mb-8 rounded-xl border border-gray-100 bg-white px-3 py-5 shadow-sm sm:px-6">
            <CheckoutStepper currentStep={step} />
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
            <div className="min-w-0">
              {step === 1 && (
                <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      Alamat Pengiriman
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      Pilih alamat tersimpan atau tambahkan alamat baru.
                    </p>
                  </div>

                  {addressesLoading && (
                    <div
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
                      role="status"
                    >
                      <Spinner size={14} />
                      Memuat alamat tersimpan...
                    </div>
                  )}

                  {addressesError && (
                    <div
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                      role="alert"
                    >
                      <p>{addressesError}</p>
                      <button
                        type="button"
                        disabled={addressesLoading}
                        onClick={() =>
                          setAddressesRetry((attempt) => attempt + 1)
                        }
                        className="mt-2 font-semibold text-[#DF401F] disabled:opacity-50"
                      >
                        Coba muat ulang
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
                            className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DF401F]/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                              selected
                                ? "border-[#DF401F] bg-orange-50/70 shadow-[0_0_0_2px_rgba(223,64,31,0.08)]"
                                : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {address.label}
                              </span>
                              {address.is_default && (
                                <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700">
                                  UTAMA
                                </span>
                              )}
                            </span>

                            <span className="mt-2 block text-sm font-semibold text-gray-700">
                              {address.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                              {address.phone}
                            </span>
                            <span className="mt-2 block text-xs leading-relaxed text-gray-500">
                              {addressText(address)}
                            </span>

                            <span
                              className={`mt-3 block text-xs font-semibold ${
                                selected ? "text-[#DF401F]" : "text-gray-400"
                              }`}
                            >
                              {selected ? "✓ Alamat dipilih" : "Pilih alamat"}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!addressesLoading && incompleteAddresses.length > 0 && (
                    <div
                      className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800"
                      role="status"
                    >
                      Ada alamat lama yang belum memiliki data wilayah lengkap.
                      Tambahkan ulang alamat tersebut agar dapat digunakan.
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startAddingAddress}
                      disabled={quoteLoading}
                      aria-pressed={addingAddress}
                      className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                        addingAddress
                          ? "border-[#DF401F] bg-orange-50 text-[#DF401F]"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      + Tambah alamat baru
                    </button>
                  </div>

                  {addingAddress && !addressModalOpen && (
                    <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {form.label} · {form.name || "Nama penerima"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {form.phone || "Nomor telepon belum diisi"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {form.address || "Alamat jalan belum diisi"}
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
                  )}

                  {shippingError && (
                    <div
                      className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      role="alert"
                    >
                      {shippingError}
                    </div>
                  )}

                  <div className="mt-6 max-w-xs">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Tipe layanan</label>
                    <select className="input-field" value={tipeLayanan} onChange={(event) => { setTipeLayanan(event.target.value as 'reguler' | 'cargo'); setShippingQuote(null) }}>
                      <option value="reguler">Reguler (pembagi 6000)</option>
                      <option value="cargo">Cargo (pembagi 4000)</option>
                    </select>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("cart")}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Kembali ke keranjang
                    </button>
                    <button
                      type="button"
                      onClick={() => void continueToConfirmation()}
                      disabled={quoteLoading || addressesLoading}
                      aria-busy={quoteLoading}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#DF401F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C73818] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {quoteLoading ? (
                        <>
                          <Spinner size={14} />
                          Menghitung ongkir...
                        </>
                      ) : (
                        "Lanjut konfirmasi"
                      )}
                    </button>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                      Konfirmasi Pesanan
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      Pastikan alamat, ongkos kirim, dan produk sudah benar.
                      Setelah pesanan dibuat, kamu akan diarahkan ke Midtrans.
                    </p>
                  </div>

                  {selectedAddress && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-400">
                            ALAMAT PENERIMA
                          </p>
                          <p className="mt-1 text-sm font-bold text-gray-900">
                            {selectedAddress.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {selectedAddress.phone}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            {addressText(selectedAddress)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          disabled={submittingOrder}
                          className="shrink-0 text-sm font-semibold text-[#DF401F] hover:underline disabled:opacity-50"
                        >
                          Ubah
                        </button>
                      </div>
                    </div>
                  )}

                  {shippingQuote && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50/70 p-4">
                      <div>
                        <p className="text-xs font-medium text-gray-400">
                          PENGIRIMAN
                        </p>
                        <p className="mt-1 font-bold text-gray-900">
                          {shippingQuote.courier.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Ke {shippingQuote.location.city},{" "}
                          {shippingQuote.location.province}
                          {shippingQuote.weight ? ` · ${shippingQuote.weight.billable_weight} kg ditagihkan` : ''}
                          {shippingQuote.courier.estimated_days
                            ? ` · Estimasi ${shippingQuote.courier.estimated_days}`
                            : ""}
                        </p>
                        {shippingQuote.promotion_applied && (
                          <p className="mt-1.5 text-xs font-semibold text-green-700">
                            Subsidi ongkir · Hemat{" "}
                            {formatPrice(shippingQuote.shipping_discount)}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {shippingQuote.promotion_applied && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPrice(shippingQuote.original_cost)}
                          </p>
                        )}
                        <p
                          className={`font-bold ${
                            shippingQuote.promotion_applied
                              ? "text-green-700"
                              : "text-[#DF401F]"
                          }`}
                        >
                          {formatPrice(shippingQuote.cost)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-800">
                        Detail pesanan
                      </p>
                      <span className="text-xs text-gray-400">
                        {itemCount} barang
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {items.map((item) => {
                        const image = productImage(item)

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={item.product.name}
                                loading="lazy"
                                className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <span aria-hidden="true">□</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {item.product.name}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-400">
                                {item.quantity} ×{" "}
                                {formatPrice(Number(item.product.price))}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-gray-800">
                              {formatPrice(
                                Number(item.product.price) * item.quantity,
                              )}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {orderError && (
                    <div
                      className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
                      role="alert"
                    >
                      {orderError}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={submittingOrder}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleOrder()}
                      disabled={submittingOrder || !shippingQuote}
                      aria-busy={submittingOrder}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#DF401F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C73818] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingOrder ? (
                        <>
                          <Spinner size={14} />
                          Membuat pesanan...
                        </>
                      ) : (
                        "Buat pesanan & lanjut pembayaran"
                      )}
                    </button>
                  </div>
                </section>
              )}
            </div>

            <aside
              className="lg:sticky lg:top-24"
              aria-label="Ringkasan pesanan"
            >
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">
                    Ringkasan Pesanan
                  </h2>
                  <span className="text-xs text-gray-400">
                    {itemCount} barang
                  </span>
                </div>

                <div className="mb-4 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const image = productImage(item)

                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={item.product.name}
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                            <span aria-hidden="true">□</span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            ×{item.quantity}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs font-semibold text-gray-800">
                          {formatPrice(
                            Number(item.product.price) * item.quantity,
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-800">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Ongkos kirim</span>
                    <span className="text-right font-medium text-gray-800">
                      {shippingQuote
                        ? formatPrice(shippingFee)
                        : "Dihitung setelah alamat dipilih"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Total berat</span>
                    <span className="font-medium text-gray-800">
                      {totalWeight.toLocaleString("id-ID")} g
                      {totalWeight >= 1000
                        ? ` (${(totalWeight / 1000).toLocaleString("id-ID", {
                            maximumFractionDigits: 2,
                          })} kg)`
                        : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-between gap-3 border-t border-gray-100 pt-3">
                    <span className="text-sm font-bold text-gray-900">
                      Total pembayaran
                    </span>
                    <span className="text-base font-bold text-[#DF401F]">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
                  Metode pembayaran tersedia melalui Midtrans setelah pesanan
                  berhasil dibuat.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

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
            if (!form.address) {
              setAddingAddress(false)
            }
          }}
          onSubmit={handleAddressModalSubmit}
        />
      )}
    </>
  )
}

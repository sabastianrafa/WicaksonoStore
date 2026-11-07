
import { useEffect, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { apiFetch } from "../api/client"

export interface Address {
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

export type AddressFormValues = Omit<
    Address,
    "id" | "province" | "city" | "district" | "village" | "is_default"
> & { id?: number; is_default: boolean }

interface Option {
    code: string
    name: string
}

interface AddressFormModalProps {
    initialData: AddressFormValues
    saving?: boolean
    error?: string
    onClose: () => void
    onSubmit: (values: AddressFormValues) => void | Promise<void>
}

const inputClass =
    "mt-1 block w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#DF3E1D] focus:ring-2 focus:ring-[#DF3E1D]/10 disabled:bg-gray-50 disabled:text-gray-400"

const labelClass =
    "block text-sm font-medium text-gray-700"

const primaryButton =
    "inline-flex items-center justify-center rounded-lg bg-[#DF3E1D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c93418] disabled:cursor-not-allowed disabled:opacity-60"

const outlineButton =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Gagal memuat data lokasi. Silakan coba kembali."
}

export default function AddressFormModal({
    initialData,
    saving = false,
    error = "",
    onClose,
    onSubmit,
}: AddressFormModalProps) {
    const [form, setForm] = useState<AddressFormValues>(initialData)

    const [provinces, setProvinces] = useState<Option[]>([])
    const [regencies, setRegencies] = useState<Option[]>([])
    const [districts, setDistricts] = useState<Option[]>([])
    const [villages, setVillages] = useState<Option[]>([])

    const [locationError, setLocationError] = useState("")

    // Load provinces
    useEffect(() => {
        let active = true

        apiFetch<{ data: Option[] }>("/locations/provinces")
            .then((response) => {
                if (active) setProvinces(response.data ?? [])
            })
            .catch((err) => {
                if (active) setLocationError(getErrorMessage(err))
            })

        return () => {
            active = false
        }
    }, [])

    // Load regencies
    useEffect(() => {
        if (!form.province_code) {
            setRegencies([])
            return
        }

        let active = true

        apiFetch<{ data: Option[] }>(
            `/locations/provinces/${encodeURIComponent(form.province_code)}/regencies`,
        )
            .then((response) => {
                if (active) setRegencies(response.data ?? [])
            })
            .catch((err) => {
                if (active) setLocationError(getErrorMessage(err))
            })

        return () => {
            active = false
        }
    }, [form.province_code])

    // Load districts
    useEffect(() => {
        if (!form.regency_code) {
            setDistricts([])
            return
        }

        let active = true

        apiFetch<{ data: Option[] }>(
            `/locations/regencies/${encodeURIComponent(form.regency_code)}/districts`,
        )
            .then((response) => {
                if (active) setDistricts(response.data ?? [])
            })
            .catch((err) => {
                if (active) setLocationError(getErrorMessage(err))
            })

        return () => {
            active = false
        }
    }, [form.regency_code])

    // Load villages
    useEffect(() => {
        if (!form.district_code) {
            setVillages([])
            return
        }

        let active = true

        apiFetch<{ data: Option[] }>(
            `/locations/districts/${encodeURIComponent(form.district_code)}/villages`,
        )
            .then((response) => {
                if (active) setVillages(response.data ?? [])
            })
            .catch((err) => {
                if (active) setLocationError(getErrorMessage(err))
            })

        return () => {
            active = false
        }
    }, [form.district_code])

    // Handle form changes
    const setField = <Key extends keyof AddressFormValues>(
        key: Key,
        value: AddressFormValues[Key],
    ) => {
        setForm((current) => {
            if (key === "province_code") {
                return {
                    ...current,
                    province_code: String(value),
                    regency_code: "",
                    district_code: "",
                    village_code: "",
                }
            }

            if (key === "regency_code") {
                return {
                    ...current,
                    regency_code: String(value),
                    district_code: "",
                    village_code: "",
                }
            }

            if (key === "district_code") {
                return {
                    ...current,
                    district_code: String(value),
                    village_code: "",
                }
            }

            return { ...current, [key]: value }
        })
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void onSubmit(form)
    }

    // Location fields with progressive visibility
    const locationFields: {
        key:
            | "province_code"
            | "regency_code"
            | "district_code"
            | "village_code"
        label: string
        options: Option[]
        visible: boolean
    }[] = [
        {
            key: "province_code",
            label: "Provinsi",
            options: provinces,
            visible: true,
        },
        {
            key: "regency_code",
            label: "Kabupaten/Kota",
            options: regencies,
            visible: Boolean(form.province_code),
        },
        {
            key: "district_code",
            label: "Kecamatan",
            options: districts,
            visible: Boolean(form.regency_code),
        },
        {
            key: "village_code",
            label: "Kelurahan/Desa",
            options: villages,
            visible: Boolean(form.district_code),
        },
    ]

    // Reusable section heading
    const SectionTitle = ({
        title,
        description,
    }: {
        title: string
        description?: string
    }) => (
        <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-900">
                {title}
            </h4>
            {description && (
                <p className="mt-0.5 text-xs text-gray-400">
                    {description}
                </p>
            )}
        </div>
    )

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 p-3 sm:p-5"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose()
                }
            }}
        >
            <form
                className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                onSubmit={handleSubmit}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            {form.id ? "Edit Alamat" : "Tambah Alamat"}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Lengkapi informasi alamat pengiriman.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                        aria-label="Tutup"
                        disabled={saving}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    {/* Error */}
                    {(error || locationError) && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600"
                        >
                            {error || locationError}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Recipient */}
                        <section>
                            <SectionTitle
                                title="Informasi Penerima"
                                description="Informasi orang yang menerima pesanan."
                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className={labelClass}>
                                    Label alamat
                                    <input
                                        className={inputClass}
                                        placeholder="Contoh: Rumah"
                                        required
                                        value={form.label}
                                        onChange={(event) =>
                                            setField("label", event.target.value)
                                        }
                                    />
                                </label>

                                <label className={labelClass}>
                                    Nama penerima
                                    <input
                                        className={inputClass}
                                        placeholder="Nama lengkap"
                                        required
                                        value={form.name}
                                        onChange={(event) =>
                                            setField("name", event.target.value)
                                        }
                                    />
                                </label>

                                <label className={`${labelClass} sm:col-span-2`}>
                                    Nomor HP
                                    <input
                                        className={inputClass}
                                        type="tel"
                                        inputMode="tel"
                                        placeholder="08xxxxxxxxxx"
                                        required
                                        value={form.phone}
                                        onChange={(event) =>
                                            setField("phone", event.target.value)
                                        }
                                    />
                                </label>
                            </div>
                        </section>

                        <div className="border-t border-gray-100" />

                        {/* Location */}
                        <section>
                            <SectionTitle
                                title="Lokasi Pengiriman"
                                description="Pilih lokasi secara berurutan."
                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {locationFields
                                    .filter((field) => field.visible)
                                    .map(({ key, label, options }) => (
                                        <label
                                            key={key}
                                            className={labelClass}
                                        >
                                            {label}

                                            <select
                                                className={inputClass}
                                                required
                                                value={form[key] ?? ""}
                                                onChange={(event) =>
                                                    setField(key, event.target.value)
                                                }
                                            >
                                                <option value="">
                                                    Pilih {label.toLowerCase()}
                                                </option>

                                                {options.map((option) => (
                                                    <option
                                                        key={option.code}
                                                        value={option.code}
                                                    >
                                                        {option.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    ))}
                            </div>
                        </section>

                        <div className="border-t border-gray-100" />

                        {/* Address detail */}
                        <section>
                            <SectionTitle
                                title="Detail Alamat"
                                description="Masukkan alamat lengkap agar pengiriman lebih mudah."
                            />

                            <div className="space-y-3">
                                <label className={labelClass}>
                                    Alamat lengkap
                                    <textarea
                                        className={`${inputClass} resize-y`}
                                        placeholder="Nama jalan, nomor rumah, blok, dan sebagainya..."
                                        required
                                        minLength={5}
                                        maxLength={2000}
                                        rows={3}
                                        value={form.address}
                                        onChange={(event) =>
                                            setField("address", event.target.value)
                                        }
                                    />
                                </label>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <label className={labelClass}>
                                        Kode pos
                                        <input
                                            className={inputClass}
                                            inputMode="numeric"
                                            placeholder="651xx"
                                            maxLength={5}
                                            required
                                            value={form.postal_code}
                                            onChange={(event) =>
                                                setField(
                                                    "postal_code",
                                                    event.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 5),
                                                )
                                            }
                                        />
                                    </label>

                                    {(
                                        [
                                            ["rt", "RT"],
                                            ["rw", "RW"],
                                        ] as const
                                    ).map(([key, label]) => (
                                        <label
                                            key={key}
                                            className={labelClass}
                                        >
                                            {label}
                                            <input
                                                className={inputClass}
                                                placeholder="000"
                                                value={form[key] ?? ""}
                                                onChange={(event) =>
                                                    setField(key, event.target.value)
                                                }
                                            />
                                        </label>
                                    ))}

                                    <label className={labelClass}>
                                        Lingkungan
                                        <input
                                            className={inputClass}
                                            placeholder="Opsional"
                                            value={form.neighborhood ?? ""}
                                            onChange={(event) =>
                                                setField(
                                                    "neighborhood",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <label className={labelClass}>
                                    Patokan lokasi
                                    <input
                                        className={inputClass}
                                        placeholder="Contoh: Dekat masjid"
                                        value={form.landmark ?? ""}
                                        onChange={(event) =>
                                            setField("landmark", event.target.value)
                                        }
                                    />
                                </label>
                            </div>
                        </section>

                        {/* Default address */}
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100">
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-[#DF3E1D]"
                                checked={form.is_default}
                                onChange={(event) =>
                                    setField("is_default", event.target.checked)
                                }
                            />
                            Jadikan alamat utama
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                    <button
                        type="button"
                        className={outlineButton}
                        disabled={saving}
                        onClick={onClose}
                    >
                        Batal
                    </button>

                    <button
                        type="submit"
                        className={primaryButton}
                        disabled={saving}
                    >
                        {saving ? "Menyimpan..." : "Simpan Alamat"}
                    </button>
                </div>
            </form>
        </div>,
        document.body,
    )
}
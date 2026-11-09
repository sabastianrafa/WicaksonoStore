
import { useState, type ChangeEvent, type FormEvent } from "react"
import type { Page } from "../../App"
import {
  FiMapPin,
  FiPhoneCall,
  FiMail,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi"

interface ContactPageProps {
  navigate: (page: Page, data?: unknown) => void
}

const contactInfo = [
  {
    icon: FiMapPin,
    title: "Alamat Toko",
    description:
      "Jl. Candi Agung II No.1, Purwantoro, Kec. Blimbing, Kota Malang, Jawa Timur 65142",
  },
  {
    icon: FiPhoneCall,
    title: "Telepon / WhatsApp",
    description: "+62 822 6477 4945",
  },
  {
    icon: FiMail,
    title: "Email",
    description: "info@wicaksono.com",
  },
  {
    icon: FiClock,
    title: "Jam Operasional",
    description: "Senin - Minggu: 07.00 - 21.00 WIB",
  },
]

export default function ContactPage({ navigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    console.log("Form data:", formData)

    setIsSubmitted(true)

    window.setTimeout(() => {
      setIsSubmitted(false)
    }, 3000)

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-700"

  return (
    <main className="fade-in bg-white text-gray-800">
      {/* Header */}
      <section className="border-b border-gray-100 px-5 py-14 text-center md:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Kontak
          </span>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Hubungi Kami
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
            Ada pertanyaan seputar produk, pemesanan jumlah besar,
            atau kemitraan? Tim kami siap membantu Anda.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        {/* Contact Information + Form */}
        <section className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Contact Information */}
          <div>
            <div className="mb-8">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Informasi
              </span>

              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Informasi Toko
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-500">
                Temukan informasi dan hubungi kami melalui
                saluran komunikasi berikut.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {contactInfo.map((info) => {
                const Icon = info.icon

                return (
                  <div
                    key={info.title}
                    className="flex gap-4 py-5 first:pt-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-primary">
                      <Icon size={19} strokeWidth={1.7} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="mb-1 text-sm font-semibold text-gray-900">
                        {info.title}
                      </h3>

                      <p className="break-words text-sm leading-6 text-gray-500">
                        {info.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contact Form */}
          <div className="border-t border-gray-200 pt-8 lg:border-t-0 lg:pt-0">
            <div className="mb-7">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Pesan
              </span>

              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Kirim Pesan
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-500">
                Isi formulir berikut untuk menyampaikan
                pertanyaan atau kebutuhan Anda.
              </p>
            </div>

            {isSubmitted && (
              <div
                className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                role="status"
              >
                <FiCheckCircle className="mt-0.5 shrink-0" size={18} />

                <p>
                  Pesan Anda berhasil diproses oleh formulir.
                  Namun, pengiriman ke email belum terintegrasi.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Nama Lengkap
                </label>

                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Masukkan nama Anda"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Alamat Email
                </label>

                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="email@anda.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="contact-subject" className={labelClass}>
                  Subjek Pesan
                </label>

                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Misal: Pesanan Partai Besar"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className={labelClass}>
                  Pesan Anda
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className={`${inputClass} resize-y`}
                  placeholder="Tuliskan pertanyaan atau kebutuhan Anda..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <FiSend size={16} />
                Kirim Pesan
              </button>
            </form>
          </div>
        </section>

        {/* Google Maps */}
        <section className="mt-20 border-t border-gray-100 pt-14 md:mt-24 md:pt-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Lokasi
              </span>

              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Kunjungi Lokasi Kami
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-500">
                Kami menantikan kedatangan Anda di pusat toko kami.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiMapPin className="shrink-0 text-primary" />
              <span>Malang, Jawa Timur</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.5282515022604!2d112.63468171083817!3d-7.944234979102484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd629c24db45ef3%3A0xe58463eb721e5be0!2sWicaksono%20Pusat%20Oleh-oleh%20Khas%20Malang!5e0!3m2!1sid!2sid!4v1787940602474!5m2!1sid!2sid"
              title="Lokasi Toko Wicaksono"
              className="h-[280px] w-full border-0 sm:h-[360px] lg:h-[420px]"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 flex flex-col items-start justify-between gap-5 border-t border-gray-100 pt-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Ingin melihat produk kami?
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Temukan berbagai oleh-oleh khas Malang.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("catalog")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-dark"
          >
            Lihat Katalog
            <FiArrowRight size={16} />
          </button>
        </section>
      </div>
    </main>
  )
}

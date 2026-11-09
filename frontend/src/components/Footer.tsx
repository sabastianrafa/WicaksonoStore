import type { Page } from "../App"
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa"
import { FiArrowUp, FiMail, FiMapPin, FiPhone } from "react-icons/fi"

const links: { label: string; page: Page }[] = [
  { label: "Beranda", page: "home" },
  { label: "Katalog produk", page: "catalog" },
  { label: "Tentang kami", page: "about" },
  { label: "Kontak", page: "contact" },
] 

export default function Footer({
  navigate,
}: {
  navigate: (page: Page) => void
}) {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white text-gray-600">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1.2fr] lg:gap-16">
        <section className="flex flex-col justify-center">
          <img
            src="/images/logo/wicaksono_logo_1.webp"
            alt="Wicaksono Store"
            className="mb-4 h-12 w-auto object-contain object-left"
          />
          <p className="max-w-sm text-sm leading-6 ">
            Wicaksono oleh-oleh khas Malang. Kami menyediakan berbagai macam produk lokal dengan memberikan pelayanan terbaik bagi pelanggan kami.
          </p>
          <div
            className="mt-4 flex gap-3 text-gray-500"
            aria-label="Media sosial"
          >
            {[
              ["Facebook", FaFacebookF],
              ["Instagram", FaInstagram],
              ["Twitter", FaTwitter],
              ["YouTube", FaYoutube],
            ].map(([label, Icon]) => {
              const SocialIcon = Icon as typeof FaFacebookF
              return (
                <span
                  key={label as string}
                  aria-label={label as string}
                  title={label as string}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm"
                >
                  {" "}
                  <SocialIcon aria-hidden="true" />{" "}
                </span>
              )
            })}
          </div>
        </section>

        <nav aria-label="Tautan footer">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Tautan</h2>
          <ul className="space-y-3">
            {links.map(({ label, page }) => (
              <li key={page}>
                <button
                  onClick={() => navigate(page)}
                  className="text-sm hover:text-[#DF401F] focus-visible:text-[#DF401F]"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section>
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Hubungi kami
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <FiMapPin className="mt-0.5 shrink-0" />
              Jl. Semeru No. 12, Klojen, Malang, Jawa Timur 65119
            </li>
            <li className="flex items-center gap-3">
              <FiPhone />
              <a href="tel:+623415550123" className="hover:text-[#DF401F]">
                +62 341 555-0123
              </a>
            </li>
            <li className="flex items-center gap-3">
              <FiMail />
              <a
                href="mailto:halo@wicaksono-malang.id"
                className="hover:text-[#DF401F]"
              >
                halo@wicaksono-malang.id
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-gray-500 sm:px-6">
          <span>© 2026 Oleh-Oleh Wicaksono Khas Malang.</span>
          <div className="flex flex-wrap gap-4">
            {[
              "Kebijakan Privasi",
              "Syarat & Ketentuan",
              "Kebijakan Pengembalian",
            ].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 hover:text-gray-900"
          >
            Kembali ke atas <FiArrowUp aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
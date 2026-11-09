
import type { Page } from "../../App"
import {
  FiTarget,
  FiStar,
  FiHeart,
  FiShoppingBag,
  FiArrowRight,
} from "react-icons/fi"

interface AboutPageProps {
  navigate: (page: Page, data?: unknown) => void
}

const values = [
  {
    icon: FiTarget,
    title: "Visi Kami",
    description:
      "Menjadi pelopor pelestarian kuliner khas Malang yang dikenal di seluruh penjuru Nusantara.",
  },
  {
    icon: FiStar,
    title: "Kualitas Premium",
    description:
      "Mengkurasi produk terbaik dengan standar kebersihan tinggi dan harga yang tetap terjangkau.",
  },
  {
    icon: FiHeart,
    title: "Dukungan Lokal",
    description:
      "Tumbuh bersama mitra UMKM lokal untuk menggerakkan roda perekonomian daerah.",
  },
]

export default function AboutPage({ navigate }: AboutPageProps) {
  return (
    <main className="fade-in bg-white text-gray-800">
      {/* Header */}
      <section className="border-b border-gray-100 px-5 py-14 text-center md:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Tentang Kami
          </span>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Cerita{" "}
            <span className="text-primary">Wicaksono</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
            Berawal dari kecintaan pada resep leluhur, kami hadir
            untuk melestarikan dan membagikan kekayaan rasa Kota
            Malang kepada Nusantara.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">

        {/* Our Story */}
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="overflow-hidden rounded-xl bg-gray-100">
            <img
              src="/images/bg-toko-1.webp"
              alt="Toko Pusat Wicaksono Oleh-Oleh"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-[1.02]"
            />
          </div>

          <div>
            <span className="mb-4 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              Sejak 2005
            </span>

            <h2 className="mb-6 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
              Lebih dari Sekadar
              <br />
              Oleh-Oleh Biasa
            </h2>

            <div className="space-y-4 text-sm leading-7 text-gray-500 sm:text-base">
              <p>
                Wicaksono adalah pusat oleh-oleh khas Malang
                yang lahir dari semangat memberdayakan UMKM lokal.
                Selama hampir dua dekade, kami telah menjadi
                jembatan antara tangan-tangan terampil produsen
                lokal dengan keluarga di seluruh Indonesia.
              </p>

              <p>
                Dari renyahnya keripik tempe Sanan hingga
                manisnya sari apel Batu, setiap produk yang
                terpajang di etalase kami telah melewati kurasi
                ketat demi memastikan kualitas, kebersihan,
                dan cita rasa autentik yang tidak pernah berubah.
              </p>
            </div>

            <div className="mt-7 h-1 w-14 rounded-full bg-primary" />
          </div>
        </section>

        {/* Vision and Values */}
        <section className="mt-20 border-t border-gray-100 pt-14 md:mt-28 md:pt-20">
          <div className="mb-10 max-w-xl">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Nilai Kami
            </span>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Apa yang Kami Percayai
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              Prinsip yang menjadi dasar kami dalam memberikan
              pengalaman terbaik kepada pelanggan.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((item, index) => {
              const Icon = item.icon

              return (
                <article
                  key={item.title}
                  className="group border-t border-gray-200 pt-6 transition-colors hover:border-primary"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-primary">
                    <Icon size={21} strokeWidth={1.7} />
                  </div>

                  <span className="mb-3 block text-xs font-medium text-gray-400">
                    0{index + 1}
                  </span>

                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="text-sm leading-7 text-gray-500">
                    {item.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-20 border-t border-gray-100 pt-14 md:mt-28 md:pt-20">
          <div className="flex flex-col justify-between gap-7 rounded-xl bg-gray-50 p-7 sm:p-10 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Siap Mencicipi Kelezatannya?
              </h2>

              <p className="mt-3 text-sm leading-7 text-gray-500">
                Jangan biarkan kerabat Anda menunggu.
                Bawa pulang cita rasa terbaik khas Malang hari ini.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("catalog")}
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <FiShoppingBag size={17} />
              Lihat Katalog
              <FiArrowRight size={16} />
            </button>
          </div>
        </section>

      </div>
    </main>
  )
}
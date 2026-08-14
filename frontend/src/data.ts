export const categories = [
  { id: 'keripik', name: 'Keripik', icon: '🥔', count: 24, color: '#F97316' },
  { id: 'apel', name: 'Apel', icon: '🍎', count: 12, color: '#16A34A' },
  { id: 'bakpia', name: 'Bakpia', icon: '🥮', count: 18, color: '#FACC15' },
  { id: 'pia', name: 'Pia', icon: '🍪', count: 15, color: '#F97316' },
  { id: 'minuman', name: 'Minuman', icon: '🧃', count: 9, color: '#16A34A' },
  { id: 'souvenir', name: 'Souvenir', icon: '🎁', count: 31, color: '#FACC15' },
];

export const products = [
  {
    id: 1, name: 'Keripik Tempe Malang Original', category: 'keripik',
    price: 25000, originalPrice: 32000, rating: 4.8, reviews: 234, sold: 1520,
    stock: 48, discount: 22,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop&auto=format',
    description: 'Keripik tempe khas Malang yang renyah dan gurih, dibuat dari tempe pilihan berkualitas tinggi dengan bumbu rahasia turun-temurun. Cocok sebagai camilan sehari-hari atau oleh-oleh khas Malang.',
    tags: ['renyah', 'gurih', 'halal'],
  },
  {
    id: 2, name: 'Apel Malang Segar Premium', category: 'apel',
    price: 45000, originalPrice: 50000, rating: 4.9, reviews: 412, sold: 3200,
    stock: 120, discount: 10,
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop&auto=format',
    description: 'Apel segar langsung dari kebun Batu Malang. Dipanen pada waktu yang tepat untuk menjaga kesegaran dan rasa manis alami. Tersedia dalam kemasan vakum untuk menjaga kualitas.',
    tags: ['segar', 'premium', 'organik'],
  },
  {
    id: 3, name: 'Bakpia Malang Isi Kacang Hijau', category: 'bakpia',
    price: 35000, originalPrice: 35000, rating: 4.7, reviews: 189, sold: 876,
    stock: 60, discount: 0,
    image: 'https://images.unsplash.com/photo-1621236378699-8597faf6a176?w=400&h=400&fit=crop&auto=format',
    description: 'Bakpia khas Malang dengan isian kacang hijau yang lembut dan manis. Dibuat secara tradisional menggunakan resep asli tanpa pengawet, menghadirkan cita rasa autentik yang tak terlupakan.',
    tags: ['tradisional', 'manis', 'tanpa pengawet'],
  },
  {
    id: 4, name: 'Pia Apel Khas Malang', category: 'pia',
    price: 28000, originalPrice: 35000, rating: 4.6, reviews: 156, sold: 643,
    stock: 35, discount: 20,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop&auto=format',
    description: 'Pia unik dengan isian selai apel Malang yang segar dan harum. Perpaduan sempurna antara kulit pia renyah dengan isian apel yang legit, menjadi oleh-oleh favorit wisatawan.',
    tags: ['unik', 'harum', 'favorit'],
  },
  {
    id: 5, name: 'Sari Apel Malang 500ml', category: 'minuman',
    price: 18000, originalPrice: 22000, rating: 4.8, reviews: 320, sold: 2100,
    stock: 200, discount: 18,
    image: 'https://images.unsplash.com/photo-1635321593217-40050ad13c74?w=400&h=400&fit=crop&auto=format',
    description: 'Minuman sari apel murni dari buah apel Malang pilihan. Tanpa pemanis buatan, 100% alami dan menyegarkan. Dikemas higienis dalam botol 500ml siap minum.',
    tags: ['alami', 'segar', 'tanpa pengawet'],
  },
  {
    id: 6, name: 'Miniatur Tugu Malang', category: 'souvenir',
    price: 55000, originalPrice: 65000, rating: 4.5, reviews: 98, sold: 412,
    stock: 25, discount: 15,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop&auto=format',
    description: 'Miniatur Tugu Malang yang cantik sebagai kenang-kenangan. Dibuat dari bahan resin berkualitas dengan detail yang apik, cocok untuk dijadikan hiasan meja atau koleksi.',
    tags: ['kenangan', 'handmade', 'detail'],
  },
  {
    id: 7, name: 'Keripik Singkong Balado', category: 'keripik',
    price: 22000, originalPrice: 27000, rating: 4.7, reviews: 278, sold: 1890,
    stock: 85, discount: 19,
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop&auto=format',
    description: 'Keripik singkong dengan bumbu balado pedas yang menggugah selera. Renyah, pedas, dan sangat cocok untuk menemani waktu santai bersama keluarga.',
    tags: ['pedas', 'renyah', 'gurih'],
  },
  {
    id: 8, name: 'Batik Malang Motif Topeng', category: 'souvenir',
    price: 120000, originalPrice: 150000, rating: 4.9, reviews: 67, sold: 234,
    stock: 15, discount: 20,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=400&fit=crop&auto=format',
    description: 'Batik Malang dengan motif topeng Malangan yang khas dan elegan. Dibuat oleh pengrajin lokal menggunakan teknik batik tulis asli, menghadirkan karya seni yang bernilai tinggi.',
    tags: ['handmade', 'batik tulis', 'eksklusif'],
  },
];

export const testimonials = [
  {
    id: 1, name: 'Siti Rahayu', city: 'Jakarta', rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format',
    comment: 'Oleh-oleh dari Wicaksono selalu jadi favorit keluarga saya! Kemasan rapih, produk segar, dan pengiriman cepat. Pasti pesan lagi!',
    product: 'Apel Malang Premium',
  },
  {
    id: 2, name: 'Budi Santoso', city: 'Surabaya', rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
    comment: 'Keripik tempenya enak banget! Renyah dan gurih. Sudah langganan di sini hampir 2 tahun. Recommended!',
    product: 'Keripik Tempe Malang',
  },
  {
    id: 3, name: 'Dewi Lestari', city: 'Bandung', rating: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
    comment: 'Pelayanan sangat ramah dan responsif. Batik Malangnya cantik sekali, jadi souvenir terbaik yang pernah saya beli.',
    product: 'Batik Malang Motif Topeng',
  },
];

export const orders = [
  { id: '#WKS-001', customer: 'Ahmad Fauzi', date: '2 Agu 2026', total: 185000, status: 'dikirim', items: 3 },
  { id: '#WKS-002', customer: 'Rina Kusuma', date: '1 Agu 2026', total: 320000, status: 'diproses', items: 5 },
  { id: '#WKS-003', customer: 'Dodi Prasetyo', date: '31 Jul 2026', total: 75000, status: 'selesai', items: 2 },
  { id: '#WKS-004', customer: 'Maya Sari', date: '30 Jul 2026', total: 455000, status: 'selesai', items: 7 },
  { id: '#WKS-005', customer: 'Hendra Wijaya', date: '29 Jul 2026', total: 90000, status: 'batal', items: 1 },
];

export const salesData = [
  { month: 'Mar', revenue: 4200000, orders: 312 },
  { month: 'Apr', revenue: 5800000, orders: 428 },
  { month: 'Mei', revenue: 7100000, orders: 536 },
  { month: 'Jun', revenue: 6400000, orders: 481 },
  { month: 'Jul', revenue: 8900000, orders: 672 },
  { month: 'Agu', revenue: 9400000, orders: 710 },
];

export const topProducts = [
  { name: 'Apel Malang', sales: 3200 },
  { name: 'Keripik Tempe', sales: 1520 },
  { name: 'Sari Apel', sales: 2100 },
  { name: 'Pia Apel', sales: 643 },
  { name: 'Bakpia Kacang', sales: 876 },
];

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

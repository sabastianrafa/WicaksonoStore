import type { Page } from '../../App';
import { FiTarget, FiStar, FiHeart, FiShoppingBag } from 'react-icons/fi';

interface AboutPageProps {
  navigate: (page: Page, data?: unknown) => void;
}

export default function AboutPage({ navigate }: AboutPageProps) {
  return (
    <div className="mobile-page fade-in">
      {/* CSS Lokal untuk Responsivitas Grid */}
      <style>{`
        .about-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
          margin-top: 40px;
        }
        .about-values {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 80px;
        }
        @media (max-width: 768px) {
          .about-layout {
            grid-template-columns: 1fr;
            gap: 32px;
            text-align: center;
          }
          .about-values {
            grid-template-columns: 1fr;
            margin-top: 60px;
          }
        }
      `}</style>

      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--color-bg) 0%, #FFF3E8 100%)', 
        padding: '60px 24px 40px',
        textAlign: 'center',
        borderBottom: '1px solid #F3F4F6'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(2rem, 4vw, 3rem)', 
          fontWeight: 900, 
          color: 'var(--color-text)',
          marginBottom: 16,
          letterSpacing: '-0.5px'
        }}>
          Cerita <span style={{ color: 'var(--color-primary)' }}>Wicaksono</span>
        </h1>
        <p style={{ color: '#6B7280', maxWidth: 600, margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Berawal dari kecintaan pada resep leluhur, kami hadir untuk melestarikan dan membagikan kekayaan rasa Kota Malang kepada Nusantara.
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
        
        {/* Kisah Kami */}
        <div className="about-layout">
          <div style={{ position: 'relative' }}>
            {/* Dekorasi Background di belakang gambar */}
            <div style={{ 
              position: 'absolute', 
              top: -16, 
              left: -16, 
              right: 16, 
              bottom: 16, 
              background: 'var(--color-primary)', 
              borderRadius: 24, 
              opacity: 0.1,
              zIndex: 0 
            }} />
            <img 
              src="/images/logo/wicaksono_logo_1.webp" 
              alt="Toko Pusat Wicaksono Oleh-Oleh" 
              style={{ 
                width: '100%', 
                height: '450px', 
                objectFit: 'cover', 
                borderRadius: 24,
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                position: 'relative',
                zIndex: 1
              }} 
            />
          </div>
          <div>
            <div style={{ 
              display: 'inline-block', 
              padding: '6px 16px', 
              background: 'rgba(22,163,74,0.1)', 
              color: '#16A34A', 
              borderRadius: 100,
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: 16
            }}>
              Sejak 2005
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 20, lineHeight: 1.2 }}>
              Lebih dari Sekadar <br/> Oleh-Oleh Biasa
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.8, marginBottom: 16 }}>
              Wicaksono adalah pusat oleh-oleh khas Malang yang lahir dari semangat memberdayakan UMKM lokal. Selama hampir dua dekade, kami telah menjadi jembatan antara tangan-tangan terampil produsen lokal dengan keluarga di seluruh Indonesia.
            </p>
            <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.8 }}>
              Dari renyahnya keripik tempe Sanan hingga manisnya sari apel Batu, setiap produk yang terpajang di etalase kami telah melewati kurasi ketat demi memastikan kualitas, kebersihan, dan cita rasa autentik yang tidak pernah berubah.
            </p>
          </div>
        </div>

        {/* Visi, Misi, Nilai */}
        <div className="about-values">
          {[
            { icon: <FiTarget size={32} color="var(--color-primary)" />, title: 'Visi Kami', desc: 'Menjadi pelopor pelestarian kuliner khas Malang yang dikenal di seluruh penjuru Nusantara.' },
            { icon: <FiStar size={32} color="var(--color-primary)" />, title: 'Kualitas Premium', desc: 'Mengkurasi produk terbaik dengan standar kebersihan tinggi dan harga yang tetap terjangkau.' },
            { icon: <FiHeart size={32} color="var(--color-primary)" />, title: 'Dukungan Lokal', desc: 'Tumbuh bersama mitra UMKM lokal untuk menggerakkan roda perekonomian daerah.' }
          ].map((item, index) => (
            <div key={index} className="card-hover" style={{ 
              padding: '32px 24px', 
              background: 'white', 
              borderRadius: 20,
              border: '1px solid #F3F4F6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'rgba(249,115,22,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 20
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 12, fontSize: '1.2rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action Section */}
        <div style={{ 
          marginTop: 80, 
          padding: '48px 24px', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          borderRadius: 24,
          textAlign: 'center',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>Siap Mencicipi Kelezatannya?</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 500, margin: '0 auto 32px' }}>
            Jangan biarkan kerabat Anda menunggu. Bawa pulang cita rasa terbaik khas Malang hari ini.
          </p>
          <button 
            className="btn-outline"
            onClick={() => navigate('catalog')}
            style={{ 
              background: 'white', 
              color: 'var(--color-primary-dark)', 
              border: 'none',
              padding: '16px 32px', 
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}>
            <FiShoppingBag size={20} /> Lihat Katalog Produk
          </button>
        </div>

      </div>
    </div>
  );
}
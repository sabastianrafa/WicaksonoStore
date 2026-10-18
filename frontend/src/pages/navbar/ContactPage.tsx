import type { Page } from '../../App';
import { useState } from 'react';
import { FiMapPin, FiPhoneCall, FiMail, FiClock } from 'react-icons/fi';

interface ContactPageProps {
  navigate: (page: Page, data?: unknown) => void;
}

export default function ContactPage({ navigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="mobile-page fade-in">
      <style>{`
        .contact-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .contact-layout {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .contact-map {
            height: 300px !important;
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
          Hubungi Kami
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6B7280',
          fontSize: '1.1rem',
          maxWidth: 600,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Ada pertanyaan seputar produk, pemesanan jumlah besar, atau kemitraan? Tim kami siap membantu Anda dengan sepenuh hati.
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px' }}>
        
        <div className="contact-layout">
          
          {/* Bagian Kiri: Informasi Kontak */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 24 }}>
              Informasi Toko
            </h2>

            {[
              { icon: <FiMapPin size={24} color="var(--color-primary)" />, title: 'Alamat Toko', desc: 'Jl. Candi Agung II No.1, Purwantoro, Kec. Blimbing, Kota Malang, Jawa Timur 65142' },
              { icon: <FiPhoneCall size={24} color="var(--color-primary)" />, title: 'Telepon / WhatsApp', desc: '+62 822 6477 4945' },
              { icon: <FiMail size={24} color="var(--color-primary)" />, title: 'Email', desc: 'info@wicaksono.com' },
              { icon: <FiClock size={24} color="var(--color-primary)" />, title: 'Jam Operasional', desc: 'Senin - Minggu: 07.00 - 21.00 WIB' }
            ].map((info, idx) => (
              <div key={idx} className="card-hover" style={{
                display: 'flex',
                gap: 16,
                marginBottom: 20,
                padding: 24,
                background: 'white',
                borderRadius: 16,
                border: '1px solid #F3F4F6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: 'rgba(249,115,22,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {info.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 6, fontSize: '1.05rem' }}>
                    {info.title}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {info.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bagian Kanan: Form Kontak */}
          <div style={{ 
            background: 'white', 
            padding: 32, 
            borderRadius: 24, 
            border: '1px solid #F3F4F6',
            boxShadow: '0 20px 40px rgba(0,0,0,0.04)' 
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 24 }}>
              Kirim Pesan
            </h2>

            {isSubmitted && (
              <div style={{
                background: '#DCFCE7',
                color: '#16A34A',
                padding: '16px',
                borderRadius: 12,
                marginBottom: 24,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 20 }}>✅</span> Pesan Anda berhasil dikirim! Tim kami akan segera merespons.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#374151', marginBottom: 8 }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid #E5E7EB', fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none', background: '#F9FAFB'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#374151', marginBottom: 8 }}>
                  Alamat Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid #E5E7EB', fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none', background: '#F9FAFB'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                  placeholder="email@anda.com"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#374151', marginBottom: 8 }}>
                  Subjek Pesan
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid #E5E7EB', fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none', background: '#F9FAFB'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                  placeholder="Misal: Pesanan Partai Besar"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#374151', marginBottom: 8 }}>
                  Pesan Anda
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12,
                    border: '1.5px solid #E5E7EB', fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.95rem', transition: 'border-color 0.2s', outline: 'none', 
                    background: '#F9FAFB', resize: 'vertical'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                  placeholder="Tuliskan detail pertanyaan atau kebutuhan Anda di sini..."
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%', padding: '16px',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Kirim Pesan Sekarang
              </button>
            </form>
          </div>
        </div>

        {/* Peta Lokasi */}
        <div style={{ marginTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Kunjungi Lokasi Kami
            </h2>
            <p style={{ color: '#6B7280', marginTop: 8 }}>
              Kami menantikan kedatangan Anda di pusat toko kami.
            </p>
          </div>
          
          <div className="contact-map" style={{
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '4px solid white',
            height: 480
          }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.5282515022604!2d112.63468171083817!3d-7.944234979102484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd629c24db45ef3%3A0xe58463eb721e5be0!2sWicaksono%20Pusat%20Oleh-oleh%20Khas%20Malang!5e0!3m2!1sid!2sid!4v1787940602474!5m2!1sid!2sid"
              title="Lokasi Toko Wicaksono"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
        
      </div>
    </div>
  );
}
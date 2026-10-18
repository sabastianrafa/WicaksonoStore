import { MENUS } from './utils';

interface SidebarProps {
  activeMenu: string;
  onSelect: (id: string) => void;
  adminEmail: string;
  adminName: string;
  onBackToShop: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

export default function Sidebar({
  activeMenu,
  onSelect,
  adminEmail,
  adminName,
  onBackToShop,
  onLogout,
  loggingOut,
}: SidebarProps) {
  return (
    <div
      style={{
        width: 240,
        background: '#1F2937',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src="/images/logo/wicaksono_logo_1.webp"
              alt="Logo Wicaksono"
              style={{ width: 36, height: 36, objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ color: '#E4401F', fontWeight: 800, fontSize: '0.9rem' }}>Wicaksono</div>
            <div style={{ color: '#6B7280', fontSize: '0.65rem' }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {MENUS.map((menu) => {
          const active = activeMenu === menu.id;

          return (
            <button
              key={menu.id}
              onClick={() => onSelect(menu.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 20px',
                border: 'none',
                background: active ? 'rgba(249,115,22,0.15)' : 'transparent',
                borderLeft: `3px solid ${active ? '#E4401F' : 'transparent'}`,
                color: active ? '#E4401F' : '#9CA3AF',
                fontFamily: 'Poppins',
                fontWeight: active ? 700 : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(event) => {
                if (active) return;
                event.currentTarget.style.color = '#E5E7EB';
                event.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(event) => {
                if (active) return;
                event.currentTarget.style.color = '#9CA3AF';
                event.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 16 }}>{menu.icon}</span>
              {menu.label}
            </button>
          );
        })}
      </nav>

      {/* Profil */}
      <div
        style={{
          padding: '16px 18px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            marginBottom: 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 38,
              minWidth: 38,
              height: 38,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <img
              src="/images/logo/wicaksono_logo_1.webp"
              alt="Wicaksono"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 5,
                display: 'block',
              }}
            />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                color: '#F9FAFB',
                fontSize: '0.82rem',
                fontWeight: 600,
                lineHeight: 1.3,
                marginBottom: 2,
              }}
            >
              {adminName}
            </div>

            <div
              style={{
                color: '#9CA3AF',
                fontSize: '0.7rem',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={adminEmail}
            >
              {adminEmail}
            </div>
          </div>
        </div>

        <button
          onClick={onBackToShop}
          style={{
            width: '100%',
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 12px',
            background: 'rgba(228, 64, 31, 0.12)',
            border: '1px solid rgba(228, 64, 31, 0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#E4401F',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.78rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = 'rgba(228, 64, 31, 0.2)';
            event.currentTarget.style.borderColor = 'rgba(228, 64, 31, 0.35)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'rgba(228, 64, 31, 0.12)';
            event.currentTarget.style.borderColor = 'rgba(228, 64, 31, 0.2)';
          }}
        >
          <span style={{ fontSize: 15 }}>←</span>
          <span>Lihat Toko</span>
        </button>

        <button
          onClick={onLogout}
          disabled={loggingOut}
          title="Keluar dari sesi admin"
          style={{
            width: '100%',
            height: 38,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 12px',
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: 8,
            cursor: loggingOut ? 'wait' : 'pointer',
            color: '#F87171',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.78rem',
            fontWeight: 600,
            opacity: loggingOut ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(event) => {
            if (loggingOut) return;
            event.currentTarget.style.background =
              'rgba(220, 38, 38, 0.2)';
            event.currentTarget.style.borderColor =
              'rgba(220, 38, 38, 0.35)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background =
              'rgba(220, 38, 38, 0.12)';
            event.currentTarget.style.borderColor =
              'rgba(220, 38, 38, 0.2)';
          }}
        >
          <span style={{ fontSize: 15 }}>⏻</span>
          <span>{loggingOut ? 'Keluar...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}

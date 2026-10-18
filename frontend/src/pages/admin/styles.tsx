import type { CSSProperties, ReactNode } from 'react';
import type { ApiMeta } from './types';

/* ---------- Kartu ---------- */

export const card: CSSProperties = {
  background: 'white',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

export const panel: CSSProperties = {
  background: 'white',
  borderRadius: 14,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

export const cardTitle = (marginBottom = 20): CSSProperties => ({
  margin: `0 0 ${marginBottom}px`,
  fontWeight: 700,
  color: '#1F2937',
  fontSize: '1rem',
});

export const th: CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
};

/** Efek hover baris tabel. Pakai: <tr {...rowHover('#F9FAFB')}> */
export const rowHover = (bg: string) => ({
  onMouseEnter: (e: any) => {
    e.currentTarget.style.background = bg;
  },
  onMouseLeave: (e: any) => {
    e.currentTarget.style.background = 'transparent';
  },
});

/* ---------- Tombol ---------- */

export const primaryButton: CSSProperties = {
  padding: '9px 18px',
  fontSize: '0.85rem',
  fontFamily: 'Poppins',
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
  background: '#E4401F',
  color: 'white',
  cursor: 'pointer',
};

export const ghostButton: CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid #E5E7EB',
  background: 'white',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontFamily: 'Poppins',
  fontWeight: 600,
  color: '#374151',
};

export const dangerButton: CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid #FEE2E2',
  background: '#FEF2F2',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontFamily: 'Poppins',
  fontWeight: 600,
  color: '#DC2626',
};

export const chipButton = (active: boolean): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 100,
  border: 'none',
  background: active ? '#E4401F' : '#F3F4F6',
  color: active ? 'white' : '#374151',
  fontFamily: 'Poppins',
  fontWeight: 600,
  fontSize: '0.8rem',
  cursor: 'pointer',
});

export const toolbarStyle: CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #F3F4F6',
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
};

export const emptyCell: CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#9CA3AF',
};

export const metaText: CSSProperties = {
  color: '#6B7280',
  fontSize: '0.75rem',
};

/* ---------- Recharts ---------- */

export const axisTick = { fontFamily: 'Poppins', fontSize: 12, fill: '#6B7280' };
export const axisTickSmall = { fontFamily: 'Poppins', fontSize: 11, fill: '#6B7280' };

export const tooltipStyle: CSSProperties = {
  fontFamily: 'Poppins',
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid #F3F4F6',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

export const formatJuta = (v: number) => `${(v / 1000000).toFixed(1)}jt`;

/* ---------- Pagination ---------- */

/**
 * Backend mengirim meta { current_page, last_page, per_page, total }.
 * Halaman yangValid dibatasi agar tidak keluar dari rentang saat data berubah.
 */
export function Pagination({
  meta,
  onPageChange,
  itemLabel = 'data',
}: {
  meta: ApiMeta;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const currentPage = Math.min(Math.max(meta.current_page, 1), Math.max(meta.last_page, 1));

  if (meta.last_page <= 1) return null;

  const from = (currentPage - 1) * meta.per_page + 1;
  const to = Math.min(currentPage * meta.per_page, meta.total);

  return (
    <div
      style={{
        padding: '14px 20px',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={metaText}>
        Menampilkan {from}–{to} dari {meta.total.toLocaleString('id-ID')} {itemLabel}
      </span>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={pageButton(currentPage === 1)}
        >
          ←
        </button>

        {pageNumbers(currentPage, meta.last_page).map((page, index) =>
          page === '…' ? (
            <span key={`gap-${index}`} style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: 6,
                border: page === currentPage ? '1px solid #E4401F' : '1px solid #E5E7EB',
                background: page === currentPage ? '#E4401F' : 'white',
                color: page === currentPage ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'Poppins',
              }}
            >
              {page}
            </button>
          )
        )}

        <button
          disabled={currentPage === meta.last_page}
          onClick={() => onPageChange(currentPage + 1)}
          style={pageButton(currentPage === meta.last_page)}
        >
          →
        </button>
      </div>
    </div>
  );
}

function pageButton(disabled: boolean): CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #E5E7EB',
    background: disabled ? '#F9FAFB' : 'white',
    color: disabled ? '#D1D5DB' : '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.75rem',
    fontFamily: 'Poppins',
  };
}

/** Tampilkan maksimal 5 nomor halaman sekitar posisi sekarang. */
function pageNumbers(current: number, last: number): Array<number | '…'> {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages: Array<number | '…'> = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < last - 1) pages.push('…');

  pages.push(last);

  return pages;
}

/* ---------- Modal ---------- */

export function Modal({
  title,
  onClose,
  children,
  maxWidth = 760,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17,24,39,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'white',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1F2937' }}>
            {title}
          </h2>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F3F4F6',
              width: 34,
              height: 34,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
              color: '#374151',
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.85rem',
};

export const detailLabel: CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: '#9CA3AF',
  fontWeight: 700,
  marginBottom: 4,
};

export const detailValue: CSSProperties = {
  fontSize: '0.85rem',
  color: '#1F2937',
  fontWeight: 600,
};

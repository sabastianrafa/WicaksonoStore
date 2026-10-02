import {
  PAYMENT_STATUS_COLORS,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  statusColor,
} from './utils';

type BadgeKind = 'order' | 'payment';

export default function StatusBadge({
  status,
  kind = 'order',
  size = 'md',
}: {
  status: string;
  kind?: BadgeKind;
  size?: 'sm' | 'md';
}) {
  const colors =
    kind === 'payment'
      ? (PAYMENT_STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#6B7280' })
      : statusColor(status);

  const small = size === 'sm';

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 100,
        padding: small ? '2px 8px' : '4px 12px',
        fontSize: small ? '0.68rem' : '0.75rem',
        fontWeight: 700,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {kind === 'payment' ? paymentStatusLabel(status) : orderStatusLabel(status)}
    </span>
  );
}

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      style={{
        background: '#F3F4F6',
        color: '#4B5563',
        borderRadius: 6,
        padding: '3px 8px',
        fontSize: '0.72rem',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {paymentMethodLabel(method)}
    </span>
  );
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#3b63f5,#1f37d8)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#06b6d4,#0e7490)',
  'linear-gradient(135deg,#22c55e,#15803d)',
  'linear-gradient(135deg,#f59e0b,#b45309)',
]
function colorFor(name = '') {
  let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name = '') { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }

const STATUS_CONFIG = {
  PAID:    { badge: 'badge-success', label: '✓ Paid',    icon: '✓' },
  PENDING: { badge: 'badge-warning', label: '⏳ Pending', icon: '⏳' },
  FAILED:  { badge: 'badge-danger',  label: '✕ Failed',  icon: '✕' },
}

export default function SettlementCard({ settlement, onPay, currentUserId }) {
  const canPay = settlement.status === 'PENDING' && settlement.fromUserId === currentUserId
  const cfg = STATUS_CONFIG[settlement.status] || STATUS_CONFIG.PENDING

  return (
    <div className="settlement-card">
      <div className="settlement-flow">
        <div className="settlement-user">
          <div className="settle-avatar" style={{ background: colorFor(settlement.fromUserName) }}>
            {initials(settlement.fromUserName)}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{settlement.fromUserName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Payer</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div className="settlement-amount">₹{settlement.amount.toFixed(2)}</div>
          <div style={{ fontSize: 16, color: 'var(--color-text-muted)' }}>→</div>
        </div>

        <div className="settlement-user">
          <div className="settle-avatar" style={{ background: colorFor(settlement.toUserName) }}>
            {initials(settlement.toUserName)}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{settlement.toUserName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Receiver</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
        {canPay && (
          <button className="btn btn-primary btn-sm" onClick={() => onPay(settlement)}>
            Pay Now →
          </button>
        )}
      </div>
    </div>
  )
}

export default function BalanceCard({ balance }) {
  const statusLabel = balance.status === 'GETS_BACK' ? 'gets back' : balance.status === 'OWES' ? 'owes' : 'settled up'
  const statusClass = balance.status === 'GETS_BACK' ? 'text-success' : balance.status === 'OWES' ? 'text-danger' : 'text-muted'

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{balance.userName}</strong>
        <span className={statusClass}>
          ₹{Math.abs(balance.netBalance).toFixed(2)} {statusLabel}
        </span>
      </div>
      <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
        Paid ₹{balance.totalPaid.toFixed(2)} · Share ₹{balance.totalOwed.toFixed(2)}
      </div>
    </div>
  )
}

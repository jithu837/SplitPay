import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { getBalances } from '../services/expenseService'
import { getGroup } from '../services/groupService'
import Loading from '../components/Loading'

ChartJS.register(ArcElement, Tooltip, Legend)

const AVATAR_COLORS = [
  'linear-gradient(135deg,#3b63f5,#1f37d8)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#06b6d4,#0e7490)',
  'linear-gradient(135deg,#22c55e,#15803d)',
  'linear-gradient(135deg,#f59e0b,#b45309)',
  'linear-gradient(135deg,#ef4444,#b91c1c)',
]
const CHART_COLORS = ['#3b63f5','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ef4444']

function colorFor(name = '') {
  let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function BalanceSummary() {
  const { id } = useParams()
  const [balances, setBalances] = useState([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBalances(id), getGroup(id)]).then(([b, g]) => {
      setBalances(b)
      setGroupName(g.name)
      setLoading(false)
    })
  }, [id])

  if (loading) return <Loading label="Loading balances…" />

  const chartData = {
    labels: balances.map((b) => b.userName),
    datasets: [{
      data: balances.map((b) => Math.abs(b.netBalance) || 0.01),
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
      hoverBorderWidth: 2,
      hoverBorderColor: '#fff',
    }],
  }
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#8494b5',
          padding: 16,
          font: { size: 12, family: 'Inter' },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ₹${ctx.parsed.toFixed(2)}`,
        },
      },
    },
  }

  const totalSpent = balances.reduce((s, b) => s + b.totalPaid, 0)
  const owedCount = balances.filter((b) => b.status === 'OWES').length
  const settledCount = balances.filter((b) => b.status === 'SETTLED').length

  return (
    <div className="animate-fadeIn">
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/groups/${id}`}>{groupName}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Balances</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1>Balance Summary</h1>
        <p className="page-subtitle">{groupName} · ₹{totalSpent.toFixed(2)} total spent · {owedCount} owe · {settledCount} settled</p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start', gap: 20 }}>
        {/* Balance List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {balances.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">⚖️</div>
                <h3>All settled up!</h3>
                <p>No balances to show. Add expenses to see who owes what.</p>
              </div>
            </div>
          ) : balances.map((b) => {
            const isOwes = b.status === 'OWES'
            const isGetsBack = b.status === 'GETS_BACK'
            const isSettled = b.status === 'SETTLED'
            return (
              <div key={b.userId} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: colorFor(b.userName),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {b.userName?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.userName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      Paid ₹{b.totalPaid.toFixed(2)} · Share ₹{b.totalOwed.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 17, fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isOwes ? 'var(--color-danger)' : isGetsBack ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}>
                      {isSettled ? '₹0.00' : `${isOwes ? '-' : '+'}₹${Math.abs(b.netBalance).toFixed(2)}`}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {isOwes && <span className="badge badge-danger" style={{ fontSize: 10 }}>Owes</span>}
                      {isGetsBack && <span className="badge badge-success" style={{ fontSize: 10 }}>Gets back</span>}
                      {isSettled && <span className="badge badge-neutral" style={{ fontSize: 10 }}>Settled</span>}
                    </div>
                  </div>
                </div>

                {/* Mini progress bar */}
                {b.totalOwed > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      height: 4, borderRadius: 99,
                      background: 'var(--color-surface-raised)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((b.totalPaid / Math.max(b.totalOwed, b.totalPaid)) * 100, 100)}%`,
                        background: isGetsBack
                          ? 'linear-gradient(90deg,var(--color-success),#16a34a)'
                          : isOwes
                          ? 'linear-gradient(90deg,var(--color-danger),#dc2626)'
                          : 'var(--color-text-muted)',
                        borderRadius: 99,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      <span>Paid</span>
                      <span>Fair share</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: 20 }}>Balance distribution</h3>
          {balances.length > 0 ? (
            <Pie data={chartData} options={chartOptions} />
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <p>No data yet</p>
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Total spent</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{totalSpent.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Members with dues</span>
                <span style={{ fontWeight: 700 }}>{owedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Settled up</span>
                <span style={{ fontWeight: 700 }}>{settledCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

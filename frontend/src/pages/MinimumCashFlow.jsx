import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getMinimumCashFlow } from '../services/expenseService'
import { generateSettlementPlan } from '../services/settlementService'
import Loading from '../components/Loading'

export default function MinimumCashFlow() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getMinimumCashFlow(id).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [id])

  const handleGenerate = async () => {
    setGenerating(true)
    await generateSettlementPlan(id)
    setGenerating(false)
    navigate(`/groups/${id}/settlements`)
  }

  if (loading || !data) return <Loading label="Computing cash flow…" />

  const saved = data.originalTransactionCount - data.optimizedTransactionCount

  return (
    <div className="animate-fadeIn">
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/groups/${id}`}>Group</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Cash Flow</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1>Minimum Cash Flow</h1>
        <p className="page-subtitle">Debt consolidation using a greedy priority-queue algorithm</p>
      </div>

      {/* Algorithm info */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <span className="alert-icon">🧮</span>
        <div style={{ fontSize: 13 }}>
          This reduces the raw per-expense debts into the smallest practical set of payments.
          It uses a greedy priority-queue algorithm that reliably collapses many small IOUs into very few payments.
        </div>
      </div>

      {/* Stats Cards */}
      {data.originalTransactionCount > 0 && (
        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-label">
              <div className="stat-card-label-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>📤</div>
              Original Debts
            </div>
            <div className="stat-card-value">{data.originalTransactionCount}</div>
            <div className="stat-card-meta">transactions before optimization</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">
              <div className="stat-card-label-icon" style={{ background: 'rgba(59,99,245,0.1)' }}>✨</div>
              Optimized To
            </div>
            <div className="stat-card-value text-primary">{data.optimizedTransactionCount}</div>
            <div className="stat-card-meta">minimum payments needed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">
              <div className="stat-card-label-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>💰</div>
              Transactions Saved
            </div>
            <div className="stat-card-value text-success">{saved}</div>
            <div className="stat-card-meta">{saved > 0 ? `${Math.round((saved / data.originalTransactionCount) * 100)}% reduction` : 'already optimal'}</div>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ gap: 20, alignItems: 'start' }}>
        {/* Original obligations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16 }}>Original Obligations</h2>
            <span className="badge badge-neutral">{data.originalTransactionCount}</span>
          </div>

          {data.originalObligations.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon">📭</div>
                <h3>No expenses yet</h3>
                <p>Add expenses to see obligations</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.originalObligations.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                    <span style={{ fontWeight: 600 }}>{t.fromUserName}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>→</span>
                    <span style={{ fontWeight: 600 }}>{t.toUserName}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--color-text-muted)' }}>
                    ₹{t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optimized settlements */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16 }}>Optimized Plan</h2>
            <span className="badge badge-primary">{data.optimizedTransactionCount}</span>
          </div>

          {data.optimizedSettlements.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon" style={{ fontSize: 36 }}>🎉</div>
                <h3>All settled up!</h3>
                <p>Everyone's balances are zero — nothing to pay.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.optimizedSettlements.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--color-primary-subtle)',
                  border: '1.5px solid rgba(59,99,245,0.2)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{t.fromUserName}</span>
                    <span style={{ color: 'var(--color-primary)', fontSize: 14 }}>→</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{t.toUserName}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: 'var(--color-primary)' }}>
                    ₹{t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {data.optimizedSettlements.length > 0 && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 16, width: '100%', padding: '13px', fontSize: 15, fontWeight: 700 }}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating plan…</>
                : '✦ Generate Settlement Plan →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

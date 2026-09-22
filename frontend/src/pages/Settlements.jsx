import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getSettlements } from '../services/settlementService'
import { getGroup } from '../services/groupService'
import Loading from '../components/Loading'
import SettlementCard from '../components/SettlementCard'

export default function Settlements() {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [settlements, setSettlements] = useState([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const [s, g] = await Promise.all([getSettlements(id), getGroup(id)])
    setSettlements(s)
    setGroupName(g.name)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handlePay = (settlement) => {
    navigate(`/groups/${id}/settlements/${settlement.id}/pay`)
  }

  if (loading) return <Loading label="Loading settlements…" />

  const pending  = settlements.filter((s) => s.status === 'PENDING')
  const paid     = settlements.filter((s) => s.status === 'PAID')
  const failed   = settlements.filter((s) => s.status === 'FAILED')
  const myPending = pending.filter((s) => s.fromUserId === user.id)
  const totalPendingAmount = pending.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="animate-fadeIn">
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/groups/${id}`}>{groupName}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Settlements</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Settlements</h1>
          <p className="page-subtitle">{groupName} · {settlements.length} total</p>
        </div>
        <Link to={`/groups/${id}/cash-flow`} className="btn btn-outline btn-sm">
          🧮 Recalculate
        </Link>
      </div>

      {settlements.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No settlement plan yet</h3>
            <p>Generate a plan from the Minimum Cash Flow page to see who should pay whom.</p>
            <Link to={`/groups/${id}/cash-flow`} className="btn btn-primary">
              🧮 Generate settlement plan
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>⏳</div>
                Pending
              </div>
              <div className="stat-card-value text-warning">{pending.length}</div>
              <div className="stat-card-meta">₹{totalPendingAmount.toFixed(2)} outstanding</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>✓</div>
                Paid
              </div>
              <div className="stat-card-value text-success">{paid.length}</div>
              <div className="stat-card-meta">completed payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">
                <div className="stat-card-label-icon" style={{ background: 'rgba(59,99,245,0.1)' }}>💳</div>
                My Dues
              </div>
              <div className="stat-card-value text-primary">{myPending.length}</div>
              <div className="stat-card-meta">
                {myPending.length > 0
                  ? `₹${myPending.reduce((s, t) => s + t.amount, 0).toFixed(2)} to pay`
                  : "You're all clear!"}
              </div>
            </div>
          </div>

          {/* My action needed */}
          {myPending.length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: 20 }}>
              <span className="alert-icon">⚡</span>
              <div>
                <strong>Action required:</strong> You have {myPending.length} pending payment{myPending.length > 1 ? 's' : ''} totalling ₹{myPending.reduce((s, t) => s + t.amount, 0).toFixed(2)}.
              </div>
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Pending Payments <span className="badge badge-warning">{pending.length}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map((s) => (
                  <SettlementCard key={s.id} settlement={s} onPay={handlePay} currentUserId={user.id} />
                ))}
              </div>
            </div>
          )}

          {/* Paid */}
          {paid.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Completed <span className="badge badge-success">{paid.length}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paid.map((s) => (
                  <SettlementCard key={s.id} settlement={s} onPay={handlePay} currentUserId={user.id} />
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {failed.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Failed <span className="badge badge-danger">{failed.length}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {failed.map((s) => (
                  <SettlementCard key={s.id} settlement={s} onPay={handlePay} currentUserId={user.id} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

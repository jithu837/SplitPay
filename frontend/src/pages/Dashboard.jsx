import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { getMyGroups } from '../services/groupService'
import { getBalances } from '../services/expenseService'
import { getSettlements } from '../services/settlementService'
import Loading from '../components/Loading'
import GroupCard from '../components/GroupCard'

function StatCard({ label, value, icon, colorClass, glow, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-glow" style={{ background: glow }} />
      <div className="stat-card-label">
        <div className="stat-card-label-icon" style={{ background: `${glow.replace('0.08', '0.15')}` }}>
          {icon}
        </div>
        {label}
      </div>
      <div className={`stat-card-value ${colorClass}`}>{value}</div>
      {sub && <div className="stat-card-meta">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const [groups, setGroups] = useState([])
  const [stats, setStats] = useState({ youOwe: 0, youAreOwed: 0, pendingSettlements: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const myGroups = await getMyGroups()
      if (cancelled) return
      setGroups(myGroups)

      let youOwe = 0, youAreOwed = 0, pendingSettlements = 0

      await Promise.all(
        myGroups.map(async (g) => {
          try {
            const [balances, settlements] = await Promise.all([getBalances(g.id), getSettlements(g.id)])
            const mine = balances.find((b) => b.userId === user.id)
            if (mine) {
              if (mine.netBalance > 0) youAreOwed += mine.netBalance
              if (mine.netBalance < 0) youOwe += Math.abs(mine.netBalance)
            }
            pendingSettlements += settlements.filter((s) => s.status === 'PENDING').length
          } catch { /* no expenses yet */ }
        })
      )

      if (!cancelled) {
        setStats({ youOwe, youAreOwed, pendingSettlements })
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.id])

  if (loading) return <Loading label="Loading your dashboard…" />

  const firstName = user?.name?.split(' ')[0]
  const netBalance = stats.youAreOwed - stats.youOwe

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Good {getGreeting()}, {firstName} 👋</h1>
            <p className="page-subtitle">Here's your financial overview across all groups.</p>
          </div>
          <Link to="/groups/new" className="btn btn-primary">
            + New Group
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        <StatCard
          label="You Owe"
          value={`₹${stats.youOwe.toFixed(0)}`}
          icon="📤"
          colorClass="text-danger"
          glow="rgba(239,68,68,0.08)"
          sub={stats.youOwe > 0 ? 'Pending payments' : 'You\'re all clear!'}
        />
        <StatCard
          label="You're Owed"
          value={`₹${stats.youAreOwed.toFixed(0)}`}
          icon="📥"
          colorClass="text-success"
          glow="rgba(34,197,94,0.08)"
          sub={stats.youAreOwed > 0 ? 'Awaiting payments' : 'Nothing pending'}
        />
        <StatCard
          label="Net Balance"
          value={`${netBalance >= 0 ? '+' : ''}₹${netBalance.toFixed(0)}`}
          icon="⚖️"
          colorClass={netBalance >= 0 ? 'text-success' : 'text-danger'}
          glow="rgba(59,99,245,0.08)"
          sub={netBalance >= 0 ? 'You\'re in the green' : 'You\'re in the red'}
        />
        <StatCard
          label="Active Groups"
          value={groups.length}
          icon="👥"
          colorClass="text-primary"
          glow="rgba(59,99,245,0.08)"
          sub={`${stats.pendingSettlements} pending settlements`}
        />
      </div>

      {/* Groups Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2>Your Groups</h2>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
            {groups.length === 0 ? 'No groups yet' : `${groups.length} group${groups.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/groups/new" className="btn btn-outline btn-sm">+ New group</Link>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏠</div>
          <h3 style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>No groups yet</h3>
          <p className="text-muted" style={{ marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
            Create your first group to start tracking shared expenses with friends.
          </p>
          <Link to="/groups/new" className="btn btn-primary">
            Create your first group →
          </Link>
        </div>
      ) : (
        <div className="grid grid-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}

      {/* Quick tip */}
      {groups.length > 0 && stats.pendingSettlements > 0 && (
        <div className="alert alert-warning" style={{ marginTop: 24 }}>
          <span className="alert-icon">💡</span>
          <div>
            <strong>You have {stats.pendingSettlements} pending settlement{stats.pendingSettlements > 1 ? 's' : ''}.</strong>
            {' '}Open a group and go to Settlements to pay or request payment.
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

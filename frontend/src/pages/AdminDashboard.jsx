import { useEffect, useState } from 'react'
import { getAdminStats, getAdminUsers, getAdminGroups } from '../services/adminService'
import Loading from '../components/Loading'

const STATUS_COLORS = {
  PAID:    { badge: 'badge-success', icon: '✓' },
  PENDING: { badge: 'badge-warning', icon: '⏳' },
  FAILED:  { badge: 'badge-danger',  icon: '✕' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminUsers(), getAdminGroups()]).then(([s, u, g]) => {
      setStats(s)
      setUsers(u)
      setGroups(g)
      setLoading(false)
    })
  }, [])

  if (loading) return <Loading label="Loading admin data…" />

  const statCards = [
    { label: 'Total Users',       value: stats.totalUsers,       icon: '👥', color: '#3b63f5', bg: 'rgba(59,99,245,0.1)' },
    { label: 'Total Groups',      value: stats.totalGroups,      icon: '◫',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Total Expenses',    value: stats.totalExpenses,    icon: '📋', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: 'Total Settlements', value: stats.totalSettlements, icon: '💸', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  ]

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1>Admin Dashboard</h1>
          <span className="admin-badge">⭐ Admin</span>
        </div>
        <p className="page-subtitle">Platform overview and user management</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-glow" style={{ background: s.color }} />
            <div className="stat-card-label">
              <div className="stat-card-label-icon" style={{ background: s.bg, fontSize: 14 }}>
                {s.icon}
              </div>
              {s.label}
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Payment Status */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Payment Status Summary</h3>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {Object.entries(stats.paymentStatusSummary || {}).map(([status, count]) => {
            const cfg = STATUS_COLORS[status] || { badge: 'badge-neutral', icon: '?' }
            return (
              <div key={status} style={{
                flex: 1, minWidth: 120,
                padding: '16px 20px',
                background: 'var(--color-surface-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{count}</div>
                <div style={{ marginTop: 6 }}>
                  <span className={`badge ${cfg.badge}`}>{cfg.icon} {status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 4, width: 'fit-content' }}>
        {[{ key: 'users', label: `Users (${users.length})` }, { key: 'groups', label: `Groups (${groups.length})` }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {tab === 'users' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#3b63f5,#1f37d8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    {u.role === 'ADMIN'
                      ? <span className="admin-badge">⭐ Admin</span>
                      : <span className="badge badge-neutral">Member</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Groups Table */}
      {tab === 'groups' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {g.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{g.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">👥 {g.memberIds?.length || 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

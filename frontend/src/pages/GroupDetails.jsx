import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getGroup, addMember, removeMember, deleteGroup } from '../services/groupService'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import Modal from '../components/Modal'

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

const GROUP_COLORS = [
  'linear-gradient(135deg,#3b63f5,#1f37d8)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#06b6d4,#0e7490)',
]
function groupColor(name = '') {
  let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return GROUP_COLORS[Math.abs(h) % GROUP_COLORS.length]
}

export default function GroupDetails() {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const data = await getGroup(id)
    setGroup(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await addMember(id, { email: memberEmail })
      setMemberEmail('')
      setShowAddMember(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add member')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the group?')) return
    await removeMember(id, memberId)
    load()
  }

  const handleDeleteGroup = async () => {
    if (!confirm('Delete this group? All expenses and settlements will be permanently removed.')) return
    await deleteGroup(id)
    navigate('/dashboard')
  }

  if (loading || !group) return <Loading />

  const isCreator = group.createdBy === user.id

  return (
    <div className="animate-fadeIn">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{group.name}</span>
      </div>

      {/* Group Header */}
      <div className="card" style={{ marginBottom: 24, padding: '28px 28px', backgroundImage: 'radial-gradient(ellipse 80% 100% at 90% -10%, rgba(59,99,245,0.06) 0%, transparent 60%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: groupColor(group.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {group.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ marginBottom: 4 }}>{group.name}</h1>
              <p className="text-muted" style={{ fontSize: 14 }}>{group.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span className="badge badge-neutral">👥 {group.members?.length || 0} members</span>
                {isCreator && <span className="badge badge-primary">⭐ You created this</span>}
              </div>
            </div>
          </div>
          {isCreator && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteGroup}>
              🗑 Delete group
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="action-row">
        <Link to={`/groups/${id}/expenses/new`} className="btn btn-primary">
          + Add Expense
        </Link>
        <Link to={`/groups/${id}/expenses`} className="action-tile">
          <span className="action-tile-icon">📋</span> Expense History
        </Link>
        <Link to={`/groups/${id}/balances`} className="action-tile">
          <span className="action-tile-icon">⚖️</span> Balances
        </Link>
        <Link to={`/groups/${id}/settlements`} className="action-tile">
          <span className="action-tile-icon">💸</span> Settlements
        </Link>
        <Link to={`/groups/${id}/cash-flow`} className="action-tile">
          <span className="action-tile-icon">🧮</span> Cash Flow
        </Link>
      </div>

      {/* Members Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Members</h2>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
              {group.members?.length || 0} people in this group
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAddMember(true)}>
            + Add Member
          </button>
        </div>

        <div className="grid grid-3" style={{ gap: 12 }}>
          {group.members?.map((m) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: colorFor(m.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {m.name}
                    {m.id === group.createdBy && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-warning)', fontWeight: 700 }}>CREATOR</span>
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{m.email}</div>
                </div>
              </div>
              {isCreator && m.id !== group.createdBy && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleRemoveMember(m.id)}
                  style={{ color: 'var(--color-danger)', fontSize: 12 }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => { setShowAddMember(false); setError('') }} title="Add Member">
        <p className="text-muted" style={{ fontSize: 13.5, marginBottom: 20 }}>
          Enter the registered email address of the person you want to add to <strong>{group.name}</strong>.
        </p>
        <form onSubmit={handleAddMember}>
          <div className="field">
            <label className="label">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon">@</span>
              <input
                className="input input-with-icon"
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                autoFocus
              />
            </div>
          </div>
          <ErrorMessage message={error} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" type="submit">Add to group</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

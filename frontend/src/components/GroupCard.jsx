import { Link } from 'react-router-dom'

const GROUP_COLORS = [
  'linear-gradient(135deg,#3b63f5,#1f37d8)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#06b6d4,#0e7490)',
  'linear-gradient(135deg,#22c55e,#15803d)',
  'linear-gradient(135deg,#f59e0b,#b45309)',
  'linear-gradient(135deg,#ef4444,#b91c1c)',
]

function getColor(name = '') {
  let hash = 0
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length]
}

export default function GroupCard({ group }) {
  const initial = group.name?.[0]?.toUpperCase() || 'G'
  const memberCount = group.members?.length || 0
  const previewMembers = (group.members || []).slice(0, 4)

  return (
    <Link to={`/groups/${group.id}`} className="group-card">
      <div className="group-card-header">
        <div className="group-avatar" style={{ background: getColor(group.name) }}>
          {initial}
        </div>
        <span className="badge badge-neutral">{memberCount} members</span>
      </div>

      <div className="group-card-name">{group.name}</div>
      <div className="group-card-desc" style={{ minHeight: 36 }}>
        {group.description || 'No description provided'}
      </div>

      <div className="group-card-footer">
        <div style={{ display: 'flex' }}>
          {previewMembers.map((m, i) => (
            <div
              key={m.id}
              className="member-face"
              title={m.name}
              style={{ zIndex: previewMembers.length - i }}
            >
              {m.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {memberCount > 4 && (
            <div className="member-face" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)', fontSize: 9 }}>
              +{memberCount - 4}
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          View group →
        </span>
      </div>
    </Link>
  )
}

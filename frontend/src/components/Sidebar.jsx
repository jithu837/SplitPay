import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const navLinks = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/groups',    icon: '◫', label: 'My Groups' },
  { to: '/profile',   icon: '◎', label: 'Profile' },
]

const adminLinks = [
  { to: '/admin', icon: '⚙', label: 'Admin Panel' },
]

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth)

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">Navigation</div>
      {navLinks.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <span className="sidebar-icon">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}

      {user?.role === 'ADMIN' && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section-label">Admin</div>
          {adminLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </>
      )}

      <div style={{ flex: 1 }} />
      <div className="sidebar-divider" />
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-disabled)', lineHeight: 1.5 }}>
          SplitPay v1.0
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-disabled)' }}>
          Powered by Razorpay UPI
        </div>
      </div>
    </aside>
  )
}

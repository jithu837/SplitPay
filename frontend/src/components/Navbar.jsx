import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/features/authSlice'

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-brand-icon">💸</div>
        Split<span>Pay</span>
      </Link>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="navbar-user">
              <div className="navbar-avatar">{initials}</div>
              <span className="navbar-username">{user?.name?.split(' ')[0]}</span>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ color: 'var(--color-text-muted)' }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
          </>
        )}
      </div>
    </nav>
  )
}

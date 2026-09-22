import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateMe, changePassword } from '../services/authService'
import { updateUser } from '../store/features/authSlice'
import ErrorMessage from '../components/ErrorMessage'

export default function Profile() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  const [name, setName] = useState(user.name)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileMsg('')
    try {
      const updated = await updateMe({ name })
      dispatch(updateUser(updated))
      setProfileMsg('Profile updated successfully!')
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not update profile')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMsg('')
    try {
      await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setPasswordMsg('Password changed successfully!')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Could not change password')
    }
  }

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: 28 }}>
        <h1>Profile Settings</h1>
        <p className="page-subtitle">Manage your account information and security</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Avatar + Info */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b63f5,#1f37d8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 8px 24px rgba(59,99,245,0.3)',
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</div>
            <div className="text-muted" style={{ fontSize: 13.5, marginTop: 4 }}>{user.email}</div>
            <div style={{ marginTop: 8 }}>
              {user.role === 'ADMIN' ? (
                <span className="admin-badge">⭐ Admin</span>
              ) : (
                <span className="badge badge-neutral">Member</span>
              )}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <h3>Basic Information</h3>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Update your display name</p>
          </div>

          {profileMsg && (
            <div className="success-msg">{profileMsg}</div>
          )}
          <ErrorMessage message={profileError} />

          <form onSubmit={handleProfileSubmit}>
            <div className="field">
              <label className="label">Full name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  className="input input-with-icon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  className="input input-with-icon"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 5 }}>
                Email cannot be changed
              </div>
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={name === user.name || !name.trim()}
            >
              Save changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h3>Change Password</h3>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>Use a strong password you don't use elsewhere</p>
          </div>

          {passwordMsg && (
            <div className="success-msg">{passwordMsg}</div>
          )}
          <ErrorMessage message={passwordError} />

          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <label className="label">Current password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  className="input input-with-icon"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  required
                  placeholder="••••••••"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 14,
                  }}
                >
                  {showCurrentPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="field">
              <label className="label">New password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  className="input input-with-icon"
                  type={showNewPw ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 14,
                  }}
                >
                  {showNewPw ? '🙈' : '👁'}
                </button>
              </div>
              {passwords.newPassword && passwords.newPassword.length < 8 && (
                <div style={{ fontSize: 11.5, color: 'var(--color-warning)', marginTop: 5 }}>
                  Password must be at least 8 characters
                </div>
              )}
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!passwords.currentPassword || passwords.newPassword.length < 8}
            >
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

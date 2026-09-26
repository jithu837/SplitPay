import { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { register, googleLogin, appleLogin } from '../services/authService'
import { setCredentials } from '../store/features/authSlice'
import ErrorMessage from '../components/ErrorMessage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export default function Register() {
  const [mode, setMode] = useState(null) // null | 'email'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slowWarning, setSlowWarning] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Show a friendly message after 5 s in case Render is cold-starting
  useEffect(() => {
    if (!loading) { setSlowWarning(false); return }
    const t = setTimeout(() => setSlowWarning(true), 5000)
    return () => clearTimeout(t)
  }, [loading])

  const handleSuccess = useCallback((data) => {
    dispatch(setCredentials({ token: data.token, user: data.user }))
    navigate('/dashboard')
  }, [dispatch, navigate])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // ── Email/phone registration form submit ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cleanPhone = form.phone.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      setError('Mobile number must be a valid 10-digit number')
      return
    }
    setLoading(true)
    try {
      const data = await register({ ...form, phone: cleanPhone })
      handleSuccess(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Google Sign-In ──
  const handleGoogle = useCallback(() => {
    if (!window.google?.accounts?.id) {
      setError('Google Sign-In is loading. Please try again in a moment.')
      return
    }
    setError('')
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setLoading(true)
        try {
          const data = await googleLogin({ token: response.credential })
          handleSuccess(data)
        } catch (err) {
          setError(err.response?.data?.message || 'Google sign-in failed')
        } finally {
          setLoading(false)
        }
      },
    })
    window.google.accounts.id.prompt()
  }, [handleSuccess])

  // ── Apple Sign-In ──
  const handleApple = useCallback(async () => {
    if (!window.AppleID) {
      setError('Apple Sign-In is loading. Please try again in a moment.')
      return
    }
    setError('')
    try {
      window.AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || 'com.splitpay.web',
        scope: 'name email',
        redirectURI: window.location.origin + '/register',
        usePopup: true,
      })
      const response = await window.AppleID.auth.signIn()
      setLoading(true)
      const data = await appleLogin({
        token: response.authorization.id_token,
        name: response.user?.name
          ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim()
          : undefined,
      })
      handleSuccess(data)
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err.response?.data?.message || 'Apple sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }, [handleSuccess])

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-slideUp" style={{ maxWidth: 420 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          Split<span style={{ color: 'var(--brand-400)' }}>Pay</span>
        </div>

        <div className="auth-title">Create an account</div>

        <ErrorMessage message={error} />
        {slowWarning && (
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
            fontSize: 12.5, color: 'var(--color-warning)', lineHeight: 1.5,
          }}>
            ⏳ Our server is waking up from sleep — this usually takes up to 30 seconds on first use. Please wait…
          </div>
        )}

        {/* ── Option buttons (no mode selected yet) ── */}
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            <button
              className="oauth-btn"
              onClick={handleApple}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.08-.5-2.07-.48-3.2 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.02 8.9 8.76c1.27.07 2.15.72 2.9.78.97-.2 1.9-.9 3.03-.81 1.28.1 2.25.62 2.88 1.57-2.64 1.6-2.02 5.12.37 6.1-.45 1.2-.66 1.72-1.24 2.78l.21 1.1zM12.05 8.68c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continue with Apple
            </button>

            <button
              className="oauth-btn"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <button
              className="oauth-btn"
              onClick={() => setMode('email')}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
              Continue with email
            </button>
          </div>
        )}

        {/* ── Email registration form ── */}
        {mode === 'email' && (
          <form onSubmit={handleSubmit} style={{ marginTop: 4 }}>
            <div className="field">
              <label className="label">Full name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  className="input input-with-icon"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Email address</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  className="input input-with-icon"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Mobile number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input
                  className="input input-with-icon"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number (e.g. 9876543210)"
                  maxLength={10}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  className="input input-with-icon"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 6 }}>
                Must be at least 8 characters
              </div>
            </div>

            <button
              id="register-submit"
              className="btn btn-primary btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8, padding: '12px', fontSize: 15, fontWeight: 700 }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
              ) : 'Create account →'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => { setMode(null); setError('') }}
              style={{ marginTop: 8, fontSize: 13 }}
            >
              ← All sign-up options
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: 20, fontSize: 11.5, color: 'var(--color-text-disabled)', textAlign: 'center', lineHeight: 1.6 }}>
          By continuing, you agree to Split Pay's <a href="#" style={{ color: 'var(--color-text-muted)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--color-text-muted)' }}>Privacy Policy</a>.
        </div>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in instead</Link>
        </div>
      </div>
    </div>
  )
}

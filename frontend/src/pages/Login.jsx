import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/authService'
import { setCredentials } from '../store/features/authSlice'
import ErrorMessage from '../components/ErrorMessage'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
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

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form)
      dispatch(setCredentials({ token: data.token, user: data.user }))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-slideUp">
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          Split<span style={{ color: 'var(--brand-400)' }}>Pay</span>
        </div>

        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">Sign in to your SplitPay account</div>

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

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email or Mobile number</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                className="input input-with-icon"
                type="text"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com or 10-digit mobile"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <label className="label" style={{ margin: 0 }}>Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: 12.5, color: 'var(--brand-400)', textDecoration: 'none', fontWeight: 600 }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                className="input input-with-icon"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <button
            id="login-submit"
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, padding: '12px', fontSize: 15, fontWeight: 700 }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
            ) : 'Sign in →'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one free</Link>
        </div>
      </div>
    </div>
  )
}

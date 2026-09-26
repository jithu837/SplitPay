import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/authService'
import { setCredentials } from '../store/features/authSlice'
import ErrorMessage from '../components/ErrorMessage'

export default function Register() {
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

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

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
      dispatch(setCredentials({ token: data.token, user: data.user }))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
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

        <div className="auth-title">Create your account</div>
        <div className="auth-subtitle">Start splitting expenses with your friends</div>

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
        </form>

        <div style={{ marginTop: 16, fontSize: 11.5, color: 'var(--color-text-disabled)', textAlign: 'center' }}>
          By signing up you agree to our Terms & Privacy Policy
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

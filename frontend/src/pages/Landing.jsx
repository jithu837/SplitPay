import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const features = [
  {
    icon: '⚡',
    color: 'linear-gradient(135deg,#3b63f5,#1f37d8)',
    bg: 'rgba(59,99,245,0.1)',
    title: 'Split Any Way',
    desc: 'Equal, exact amounts, or percentage-based splits — all validated server-side, always accurate.',
  },
  {
    icon: '🧮',
    color: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    bg: 'rgba(139,92,246,0.1)',
    title: 'Minimum Transactions',
    desc: 'Our greedy cash-flow algorithm collapses complex debts into the absolute fewest payments.',
  },
  {
    icon: '📱',
    color: 'linear-gradient(135deg,#06b6d4,#0e7490)',
    bg: 'rgba(6,182,212,0.1)',
    title: 'Instant UPI Settlement',
    desc: 'Settle debts directly over UPI via Razorpay Checkout — verified and recorded in real time.',
  },
  {
    icon: '👥',
    color: 'linear-gradient(135deg,#22c55e,#15803d)',
    bg: 'rgba(34,197,94,0.1)',
    title: 'Group Management',
    desc: 'Create groups for trips, flatmates, events — add or remove members anytime.',
  },
  {
    icon: '📊',
    color: 'linear-gradient(135deg,#f59e0b,#b45309)',
    bg: 'rgba(245,158,11,0.1)',
    title: 'Full Expense History',
    desc: 'Every expense is tracked with categories, payer info, and split breakdowns.',
  },
  {
    icon: '🔐',
    color: 'linear-gradient(135deg,#ef4444,#b91c1c)',
    bg: 'rgba(239,68,68,0.1)',
    title: 'Secure by Design',
    desc: 'JWT authentication, Spring Security, and server-side balance verification at every step.',
  },
]

const stats = [
  { value: '100%', label: 'Server-side Verified' },
  { value: '0 Fee', label: 'Platform Charges' },
  { value: 'UPI', label: 'Native Payments' },
  { value: 'OSS', label: 'Open Source' },
]

export default function Landing() {
  const { isAuthenticated } = useSelector((state) => state.auth)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="public-layout">
      {/* Hero */}
      <div className="landing-hero">
        <div className="landing-eyebrow">
          ✦ Smart Group Expense Management
        </div>
        <h1>Split bills.<br />Settle smart.<br />Pay instantly.</h1>
        <p>
          SplitPay tracks group expenses, works out exactly who owes whom using a
          minimum-cash-flow algorithm, and lets you settle over UPI — all in one place.
        </p>
        <div className="landing-cta">
          <Link to="/register" className="btn btn-primary btn-xl">
            Get started free →
          </Link>
          <Link to="/login" className="btn btn-secondary btn-xl">
            Sign in
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        maxWidth: 700,
        margin: '0 auto 64px',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 1,
        background: 'var(--color-border)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: 'var(--color-surface)',
            padding: '20px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1, color: 'var(--color-text)' }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="landing-features">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            Everything you need, nothing you don't
          </h2>
          <p className="text-muted" style={{ marginTop: 8, fontSize: 15 }}>
            Built for real-world group spending — from weekend trips to monthly flatmates.
          </p>
        </div>

        <div className="grid grid-3">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ background: f.bg }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA footer */}
        <div style={{
          marginTop: 64,
          textAlign: 'center',
          padding: '48px 32px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-2xl)',
          backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(59,99,245,0.12) 0%, transparent 60%)',
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 12 }}>
            Ready to split smarter?
          </h2>
          <p className="text-muted" style={{ marginBottom: 28, fontSize: 15 }}>
            Join your friends and colleagues on SplitPay. It's free, forever.
          </p>
          <Link to="/register" className="btn btn-primary btn-xl">
            Create your account →
          </Link>
        </div>
      </div>
    </div>
  )
}

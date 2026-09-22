import { Link, useParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const { id } = useParams()
  return (
    <div className="result-page animate-fadeIn">
      <div style={{
        width: 100, height: 100, borderRadius: '50%', marginBottom: 24,
        background: 'var(--color-success-bg)',
        border: '2px solid rgba(34,197,94,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <span style={{ fontSize: 44 }}>✓</span>
      </div>
      <div className="result-title text-success">Payment Successful!</div>
      <div className="result-subtitle">
        The payment signature was verified on the backend and your settlement has been marked as <strong>Paid</strong>.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={`/groups/${id}/settlements`} className="btn btn-primary btn-lg">
          View settlements
        </Link>
        <Link to="/dashboard" className="btn btn-secondary btn-lg">
          Go to dashboard
        </Link>
      </div>
      <div style={{ marginTop: 32, padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-success-bg)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: 'var(--color-success)' }}>
        🎉 Great job! Every settled payment brings the group closer to being debt-free.
      </div>
    </div>
  )
}

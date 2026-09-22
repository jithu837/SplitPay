import { Link, useParams } from 'react-router-dom'

export default function PaymentFailure() {
  const { id, settlementId } = useParams()
  return (
    <div className="result-page animate-fadeIn">
      <div style={{
        width: 100, height: 100, borderRadius: '50%', marginBottom: 24,
        background: 'var(--color-danger-bg)',
        border: '2px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <span style={{ fontSize: 44 }}>✕</span>
      </div>
      <div className="result-title text-danger">Payment Failed</div>
      <div className="result-subtitle">
        The payment wasn't completed, or signature verification failed on the backend.
        No settlement was marked as paid — your money is safe.
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={`/groups/${id}/settlements/${settlementId}/pay`} className="btn btn-primary btn-lg">
          ↺ Try again
        </Link>
        <Link to={`/groups/${id}/settlements`} className="btn btn-secondary btn-lg">
          Back to settlements
        </Link>
      </div>
      <div style={{ marginTop: 32, padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-bg)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: 'var(--color-warning)' }}>
        💡 If this keeps happening, check your internet connection or try a different payment method in Razorpay.
      </div>
    </div>
  )
}

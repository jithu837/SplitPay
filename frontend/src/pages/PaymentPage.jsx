import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { createPaymentOrder, verifyPayment } from '../services/paymentService'
import { loadRazorpayScript } from '../utils/loadRazorpayScript'
import ErrorMessage from '../components/ErrorMessage'

export default function PaymentPage() {
  const { id: groupId, settlementId } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handlePayNow = async () => {
    setError('')
    setLoading(true)
    try {
      const order = await createPaymentOrder(settlementId)
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setError('Could not load Razorpay checkout. Check your connection and try again.')
        setLoading(false)
        return
      }

      const options = {
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'SplitPay',
        description: 'Settlement Payment · Test Mode',
        order_id: order.razorpayOrderId,
        handler: async (response) => {
          try {
            const result = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (result.paymentStatus === 'SUCCESS') {
              navigate(`/groups/${groupId}/settlements/${settlementId}/success`)
            } else {
              navigate(`/groups/${groupId}/settlements/${settlementId}/failure`)
            }
          } catch {
            navigate(`/groups/${groupId}/settlements/${settlementId}/failure`)
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#3b63f5' },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', () => {
        navigate(`/groups/${groupId}/settlements/${settlementId}/failure`)
      })
      razorpay.open()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/groups/${groupId}/settlements`}>Settlements</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Pay</span>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card" style={{ padding: '36px 36px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3b63f5,#1f37d8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(59,99,245,0.3)',
            }}>
              💸
            </div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Confirm Payment</h2>
            <p className="text-muted" style={{ fontSize: 13.5 }}>Settle your dues via Razorpay</p>
          </div>

          {/* Test Mode badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--color-warning-bg)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 18 }}>🧪</span>
            <div style={{ fontSize: 13 }}>
              <strong style={{ color: 'var(--color-warning)' }}>TEST MODE</strong>
              <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>
                No real money moves. Use Razorpay's test card/UPI credentials at checkout.
              </div>
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: 24 }}>
            {[
              { n: '1', text: 'Click "Pay with Razorpay" below' },
              { n: '2', text: 'Complete payment in the Razorpay checkout' },
              { n: '3', text: 'Your settlement is automatically marked Paid' },
            ].map((step) => (
              <div key={step.n} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary-subtle)',
                  border: '1.5px solid rgba(59,99,245,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
                }}>
                  {step.n}
                </div>
                <span style={{ fontSize: 13.5, color: 'var(--color-text-secondary)' }}>{step.text}</span>
              </div>
            ))}
          </div>

          <ErrorMessage message={error} />

          <button
            id="pay-now-btn"
            className="btn btn-primary btn-full"
            onClick={handlePayNow}
            disabled={loading}
            style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 'var(--radius-md)' }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Opening Razorpay…</>
            ) : '💸 Pay with Razorpay'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to={`/groups/${groupId}/settlements`} className="btn btn-ghost btn-sm">
              ← Back to settlements
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

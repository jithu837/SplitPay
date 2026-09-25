import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyOtp, resetPassword } from '../services/authService'
import ErrorMessage from '../components/ErrorMessage'

const STEPS = ['email', 'otp', 'password']

export default function ForgotPassword() {
  const navigate = useNavigate()

  // ── Step tracking ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(0) // 0=email, 1=otp, 2=new-password

  // ── Step 1 state ───────────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [otpHint, setOtpHint] = useState('')

  // ── Step 2 state ───────────────────────────────────────────────────────────
  const [otp, setOtp] = useState(['', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [resetToken, setResetToken] = useState('')
  const otpRefs = useRef([])

  // ── Step 3 state ───────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // ── Resend countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setSendError('')
    setSendLoading(true)
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() })
      if (res?.otp) {
        setOtpHint(res.otp)
      }
      setStep(1)
      setCountdown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setSendError('')
    setSendLoading(true)
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() })
      if (res?.otp) {
        setOtpHint(res.otp)
      }
      setOtp(['', '', '', ''])
      setVerifyError('')
      setCountdown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to resend OTP.')
    } finally {
      setSendLoading(false)
    }
  }

  // ── OTP input handlers ─────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      setOtp(pasted.split(''))
      otpRefs.current[3]?.focus()
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 4) return
    setVerifyError('')
    setVerifyLoading(true)
    try {
      const data = await verifyOtp({ email: email.trim().toLowerCase(), otp: otpString })
      setResetToken(data.resetToken)
      setStep(2)
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.')
      return
    }
    setResetError('')
    setResetLoading(true)
    try {
      await resetPassword({ resetToken, newPassword })
      setSuccessMsg('Password reset successfully!')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  const otpFilled = otp.every((d) => d !== '')

  // ── Step indicator ────────────────────────────────────────────────────────
  const stepLabels = ['Email', 'Verify OTP', 'New Password']

  return (
    <div className="auth-wrapper">
      <div className="auth-card animate-slideUp" style={{ maxWidth: 420 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          Split<span style={{ color: 'var(--brand-400)' }}>Pay</span>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0, marginBottom: 28
        }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i < step
                    ? 'var(--brand-500)'
                    : i === step
                      ? 'linear-gradient(135deg, #3b63f5, #1f37d8)'
                      : 'var(--color-surface-2)',
                  border: i === step ? '2px solid var(--brand-400)' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: i <= step ? '#fff' : 'var(--color-text-muted)',
                  boxShadow: i === step ? '0 0 16px rgba(59,99,245,0.4)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: i <= step ? 'var(--color-text)' : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{
                  width: 48, height: 2, margin: '0 4px', marginBottom: 22,
                  background: i < step ? 'var(--brand-500)' : 'var(--color-border)',
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Email ── */}
        {step === 0 && (
          <div className="animate-fadeIn">
            <div className="auth-title">Forgot Password?</div>
            <div className="auth-subtitle">
              Enter your registered email address and we'll send you a 4-digit OTP.
            </div>

            <ErrorMessage message={sendError} />

            <form onSubmit={handleSendOtp} style={{ marginTop: 20 }}>
              <div className="field">
                <label className="label">Email address</label>
                <div className="input-wrapper">
                  <span className="input-icon">@</span>
                  <input
                    id="forgot-email"
                    className="input input-with-icon"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                id="send-otp-btn"
                className="btn btn-primary btn-full"
                type="submit"
                disabled={sendLoading || !email.trim()}
                style={{ marginTop: 8, padding: '12px', fontSize: 15, fontWeight: 700 }}
              >
                {sendLoading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Sending OTP…</>
                ) : 'Send OTP →'}
              </button>
            </form>

            <div className="auth-divider">or</div>
            <div className="auth-footer">
              Remember your password?{' '}
              <Link to="/login">Sign in</Link>
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="auth-title">Enter OTP</div>
            <div className="auth-subtitle">
              We sent a 4-digit code to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>.
              Check your inbox (and spam folder).
            </div>

            <ErrorMessage message={verifyError} />
            {sendError && <ErrorMessage message={sendError} />}

            {otpHint && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: 16,
                fontSize: 14,
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <span>🔐 OTP Code: <strong style={{ letterSpacing: 2, fontSize: 17, color: '#fff' }}>{otpHint}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setOtp(otpHint.split(''))
                    otpRefs.current[3]?.focus()
                  }}
                  style={{
                    background: 'rgba(56, 189, 248, 0.25)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: 6,
                    color: '#fff',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  Auto-fill ⚡
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ marginTop: 24 }}>
              {/* 6-box OTP input */}
              <div style={{
                display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24,
              }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    id={`otp-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 46, height: 54,
                      textAlign: 'center',
                      fontSize: 22, fontWeight: 700,
                      background: 'var(--color-surface-2)',
                      border: digit
                        ? '2px solid var(--brand-400)'
                        : '2px solid var(--color-border)',
                      borderRadius: 10,
                      color: 'var(--color-text)',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow: digit ? '0 0 12px rgba(59,99,245,0.25)' : 'none',
                      caretColor: 'var(--brand-400)',
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>

              <button
                id="verify-otp-btn"
                className="btn btn-primary btn-full"
                type="submit"
                disabled={verifyLoading || !otpFilled}
                style={{ padding: '12px', fontSize: 15, fontWeight: 700 }}
              >
                {verifyLoading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying…</>
                ) : 'Verify OTP →'}
              </button>
            </form>

            {/* Resend */}
            <div style={{
              textAlign: 'center', marginTop: 18, fontSize: 13.5,
              color: 'var(--color-text-muted)',
            }}>
              Didn't receive the code?{' '}
              {countdown > 0 ? (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  Resend in <strong style={{ color: 'var(--brand-400)' }}>{countdown}s</strong>
                </span>
              ) : (
                <button
                  id="resend-otp-btn"
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendLoading}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--brand-400)', fontWeight: 600, fontSize: 13.5,
                    padding: 0, textDecoration: 'underline',
                  }}
                >
                  {sendLoading ? 'Sending…' : 'Resend OTP'}
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                type="button"
                onClick={() => { setStep(0); setOtp(['', '', '', '', '', '']); setVerifyError('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: 12.5,
                }}
              >
                ← Change email
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <div className="auth-title">Set New Password</div>
            <div className="auth-subtitle">
              Choose a strong password you haven't used elsewhere.
            </div>

            {successMsg ? (
              <div style={{
                textAlign: 'center', padding: '20px 0',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div className="success-msg" style={{ fontSize: 15 }}>{successMsg}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 8 }}>
                  Redirecting to login…
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} style={{ marginTop: 20 }}>
                <ErrorMessage message={resetError} />

                <div className="field">
                  <label className="label">New password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔑</span>
                    <input
                      id="new-password"
                      className="input input-with-icon"
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      autoFocus
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', fontSize: 14,
                      }}
                    >
                      {showNewPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-warning)', marginTop: 5 }}>
                      Password must be at least 8 characters
                    </div>
                  )}
                </div>

                <div className="field">
                  <label className="label">Confirm new password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="confirm-password"
                      className="input input-with-icon"
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)', fontSize: 14,
                      }}
                    >
                      {showConfirmPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-warning)', marginTop: 5 }}>
                      Passwords do not match
                    </div>
                  )}
                </div>

                {/* Password strength indicator */}
                {newPassword.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      height: 4, borderRadius: 4,
                      background: 'var(--color-border)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: newPassword.length < 8
                          ? '25%' : newPassword.length < 12
                            ? '60%' : '100%',
                        background: newPassword.length < 8
                          ? '#ef4444' : newPassword.length < 12
                            ? '#f59e0b' : '#22c55e',
                        transition: 'all 0.3s ease',
                      }} />
                    </div>
                    <div style={{
                      fontSize: 11, marginTop: 4,
                      color: newPassword.length < 8
                        ? '#ef4444' : newPassword.length < 12
                          ? '#f59e0b' : '#22c55e',
                    }}>
                      {newPassword.length < 8
                        ? 'Weak' : newPassword.length < 12
                          ? 'Good' : 'Strong'}
                    </div>
                  </div>
                )}

                <button
                  id="reset-password-btn"
                  className="btn btn-primary btn-full"
                  type="submit"
                  disabled={
                    resetLoading ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  style={{ padding: '12px', fontSize: 15, fontWeight: 700 }}
                >
                  {resetLoading ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Resetting…</>
                  ) : 'Reset Password →'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

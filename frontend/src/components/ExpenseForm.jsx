import { useState } from 'react'

const CATEGORIES = [
  { value: 'FOOD',          icon: '🍔', label: 'Food & Drinks' },
  { value: 'TRAVEL',        icon: '✈️', label: 'Travel' },
  { value: 'ACCOMMODATION', icon: '🏨', label: 'Accommodation' },
  { value: 'ENTERTAINMENT', icon: '🎬', label: 'Entertainment' },
  { value: 'UTILITIES',     icon: '💡', label: 'Utilities' },
  { value: 'GROCERIES',     icon: '🛒', label: 'Groceries' },
  { value: 'SHOPPING',      icon: '🛍️', label: 'Shopping' },
  { value: 'HEALTH',        icon: '💊', label: 'Health' },
  { value: 'EDUCATION',     icon: '📚', label: 'Education' },
  { value: 'OTHER',         icon: '📦', label: 'Other' },
]

const SPLIT_TYPES = [
  { value: 'EQUAL',      icon: '⚖️', label: 'Equal split',       desc: 'Divide equally among participants' },
  { value: 'EXACT',      icon: '🎯', label: 'Exact amounts',     desc: 'Enter specific amounts for each' },
  { value: 'PERCENTAGE', icon: '📊', label: 'By percentage',     desc: 'Enter percentage shares' },
]

/**
 * Builds an ExpenseRequest payload matching the backend contract.
 * Amounts/percentages entered here are for UX only — the backend
 * recomputes and validates everything authoritatively.
 */
export default function ExpenseForm({ members, onSubmit, submitting, initialValues }) {
  const [description, setDescription] = useState(initialValues?.description || '')
  const [amount, setAmount]           = useState(initialValues?.amount || '')
  const [category, setCategory]       = useState(initialValues?.category || 'FOOD')
  const [paidBy, setPaidBy]           = useState(initialValues?.paidBy || members[0]?.id || '')
  const [splitType, setSplitType]     = useState(initialValues?.splitType || 'EQUAL')
  const [selectedIds, setSelectedIds] = useState(members.map((m) => m.id))
  const [exactAmounts, setExactAmounts]   = useState({})
  const [percentages, setPercentages]     = useState({})
  const [error, setError]             = useState('')

  const toggleMember = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const exactTotal    = selectedIds.reduce((s, id) => s + Number(exactAmounts[id] || 0), 0)
  const percentTotal  = selectedIds.reduce((s, id) => s + Number(percentages[id] || 0), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!description.trim()) return setError('Description is required')
    if (!amount || Number(amount) <= 0) return setError('Amount must be greater than 0')
    if (selectedIds.length === 0) return setError('Select at least one participant')

    const participants = selectedIds.map((userId) => {
      if (splitType === 'EXACT')      return { userId, amount: Number(exactAmounts[userId] || 0) }
      if (splitType === 'PERCENTAGE') return { userId, percentage: Number(percentages[userId] || 0) }
      return { userId }
    })

    onSubmit({
      description: description.trim(),
      amount: Number(amount),
      category,
      paidBy,
      splitType,
      participants,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Description */}
      <div className="field">
        <label className="label">Description *</label>
        <div className="input-wrapper">
          <span className="input-icon">📝</span>
          <input
            className="input input-with-icon"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Hotel stay, Dinner at restaurant…"
            required
          />
        </div>
      </div>

      {/* Amount + Category */}
      <div className="field-row">
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Total Amount (₹) *</label>
          <div className="input-wrapper">
            <span className="input-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹</span>
            <input
              className="input input-with-icon"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Category</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Paid by */}
      <div className="field" style={{ marginTop: 18 }}>
        <label className="label">Paid by</label>
        <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Split type */}
      <div className="field">
        <label className="label">Split type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {SPLIT_TYPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSplitType(s.value)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 8px',
                border: `1.5px solid ${splitType === s.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: splitType === s.value ? 'var(--color-primary-subtle)' : 'var(--color-surface-alt)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: splitType === s.value ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{s.label}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
          {SPLIT_TYPES.find((s) => s.value === splitType)?.desc}
        </div>
      </div>

      {/* Participants */}
      <div className="field">
        <label className="label">
          Participants
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>
            {selectedIds.length} of {members.length} selected
          </span>
        </label>
        <div style={{
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          background: 'var(--color-surface-alt)',
        }}>
          {members.map((m, i) => (
            <div
              key={m.id}
              onClick={() => toggleMember(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderBottom: i < members.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
                background: selectedIds.includes(m.id) ? 'var(--color-primary-subtle)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${selectedIds.includes(m.id) ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                background: selectedIds.includes(m.id) ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {selectedIds.includes(m.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
              </div>

              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#3b63f5,#1f37d8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {m.name?.[0]?.toUpperCase()}
              </div>

              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>{m.name}</span>

              {/* Extra inputs */}
              {splitType === 'EXACT' && selectedIds.includes(m.id) && (
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>₹</span>
                  <input
                    className="input"
                    style={{ width: 100, padding: '5px 9px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                    type="number"
                    placeholder="0.00"
                    value={exactAmounts[m.id] || ''}
                    onChange={(e) => setExactAmounts((p) => ({ ...p, [m.id]: e.target.value }))}
                  />
                </div>
              )}
              {splitType === 'PERCENTAGE' && selectedIds.includes(m.id) && (
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    className="input"
                    style={{ width: 72, padding: '5px 9px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                    type="number"
                    placeholder="0"
                    value={percentages[m.id] || ''}
                    onChange={(e) => setPercentages((p) => ({ ...p, [m.id]: e.target.value }))}
                  />
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Validation hints */}
        {splitType === 'EXACT' && selectedIds.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Entered total</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: Math.abs(exactTotal - Number(amount)) < 0.01 ? 'var(--color-success)' : 'var(--color-warning)',
            }}>
              ₹{exactTotal.toFixed(2)} / ₹{Number(amount || 0).toFixed(2)}
            </span>
          </div>
        )}
        {splitType === 'PERCENTAGE' && selectedIds.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Total percentage</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: Math.abs(percentTotal - 100) < 0.01 ? 'var(--color-success)' : 'var(--color-warning)',
            }}>
              {percentTotal.toFixed(1)}% / 100%
            </span>
          </div>
        )}
      </div>

      {error && <div className="error-banner"><span>⚠</span>{error}</div>}

      <button
        className="btn btn-primary btn-full"
        type="submit"
        disabled={submitting}
        style={{ padding: '12px', fontSize: 15, fontWeight: 700 }}
      >
        {submitting ? (
          <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
        ) : '✓ Save expense'}
      </button>
    </form>
  )
}

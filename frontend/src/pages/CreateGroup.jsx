import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createGroup } from '../services/groupService'
import ErrorMessage from '../components/ErrorMessage'

const GROUP_TYPES = [
  { icon: '✈️', label: 'Trip', desc: 'Vacation, weekend getaway' },
  { icon: '🏠', label: 'Flatmates', desc: 'Monthly shared expenses' },
  { icon: '🎉', label: 'Event', desc: 'Party, celebration' },
  { icon: '🍽️', label: 'Food', desc: 'Eating out, deliveries' },
  { icon: '💼', label: 'Work', desc: 'Team expenses' },
  { icon: '📦', label: 'Other', desc: 'Everything else' },
]

export default function CreateGroup() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const group = await createGroup({ name, description })
      navigate(`/groups/${group.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create group')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (type) => {
    setSelectedType(type.label)
    if (!name) setName(type.label === 'Other' ? '' : type.label)
  }

  return (
    <div className="animate-fadeIn">
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">New Group</span>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: 28 }}>
          <h1>Create a Group</h1>
          <p className="page-subtitle">Set up a group to start splitting expenses with friends.</p>
        </div>

        {/* Group Type Picker */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14 }}>What's this group for?</h3>
          <div className="grid grid-3" style={{ gap: 10 }}>
            {GROUP_TYPES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => handleTypeSelect(t)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '13px 14px',
                  border: `1.5px solid ${selectedType === t.label ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: selectedType === t.label ? 'var(--color-primary-subtle)' : 'var(--color-surface-alt)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: selectedType === t.label ? 'var(--color-primary)' : 'var(--color-text)' }}>{t.label}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ marginBottom: 20 }}>Group details</h3>

          <div className="field">
            <label className="label">Group name *</label>
            <div className="input-wrapper">
              <span className="input-icon">👥</span>
              <input
                className="input input-with-icon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Goa Trip 2025, Flat 4B, etc."
                maxLength={60}
              />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 5 }}>
              {name.length}/60 characters
            </div>
          </div>

          <div className="field">
            <label className="label">Description <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description to help members understand what this group is for…"
              style={{ minHeight: 80 }}
            />
          </div>

          <ErrorMessage message={error} />

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating…</>
              ) : '✦ Create group'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>

        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <span className="alert-icon">💡</span>
          <div style={{ fontSize: 13 }}>
            After creating the group, you can add members by their registered email address.
          </div>
        </div>
      </div>
    </div>
  )
}

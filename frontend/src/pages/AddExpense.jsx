import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGroup } from '../services/groupService'
import { addExpense } from '../services/expenseService'
import ExpenseForm from '../components/ExpenseForm'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

export default function AddExpense() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getGroup(id).then(setGroup)
  }, [id])

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    setError('')
    try {
      await addExpense(id, payload)
      navigate(`/groups/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save expense')
    } finally {
      setSubmitting(false)
    }
  }

  if (!group) return <Loading label="Loading group…" />

  return (
    <div className="animate-fadeIn">
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/groups/${id}`}>{group.name}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Add Expense</span>
      </div>

      <div style={{ maxWidth: 580 }}>
        <div style={{ marginBottom: 24 }}>
          <h1>Add Expense</h1>
          <p className="page-subtitle">Record a shared expense for <strong>{group.name}</strong></p>
        </div>

        <div className="card">
          <ErrorMessage message={error} />
          <ExpenseForm members={group.members} onSubmit={handleSubmit} submitting={submitting} />
        </div>

        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <span className="alert-icon">💡</span>
          <div style={{ fontSize: 13 }}>
            After adding, go to <strong>Cash Flow</strong> to regenerate the optimal settlement plan, or view updated balances immediately.
          </div>
        </div>
      </div>
    </div>
  )
}

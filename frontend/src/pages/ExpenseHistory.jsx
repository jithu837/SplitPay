import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getExpenses, deleteExpense } from '../services/expenseService'
import { getGroup } from '../services/groupService'
import Loading from '../components/Loading'

const CATEGORY_ICONS = {
  FOOD: '🍔', TRAVEL: '✈️', ACCOMMODATION: '🏨', ENTERTAINMENT: '🎬',
  UTILITIES: '💡', GROCERIES: '🛒', SHOPPING: '🛍️', HEALTH: '💊',
  EDUCATION: '📚', OTHER: '📦',
}
const SPLIT_LABELS = { EQUAL: 'Equal', EXACT: 'Exact', PERCENTAGE: 'Percent' }

export default function ExpenseHistory() {
  const { id } = useParams()
  const [expenses, setExpenses] = useState([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const [exp, group] = await Promise.all([getExpenses(id), getGroup(id)])
    setExpenses(exp)
    setGroupName(group.name)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async (expenseId) => {
    if (!confirm('Delete this expense? This will affect balances and settlements.')) return
    await deleteExpense(expenseId)
    load()
  }

  if (loading) return <Loading label="Loading expenses…" />

  const filtered = expenses.filter((e) =>
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase()) ||
    e.paidByName?.toLowerCase().includes(search.toLowerCase())
  )

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="animate-fadeIn">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/groups/${id}`}>{groupName}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Expense History</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Expense History</h1>
          <p className="page-subtitle">{groupName} · {expenses.length} expenses · ₹{total.toFixed(2)} total</p>
        </div>
        <Link to={`/groups/${id}/expenses/new`} className="btn btn-primary">+ Add Expense</Link>
      </div>

      {/* Search */}
      {expenses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="input-wrapper" style={{ maxWidth: 360 }}>
            <span className="input-icon" style={{ fontSize: 14 }}>🔍</span>
            <input
              className="input input-with-icon"
              placeholder="Search by description, category, payer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No expenses yet</h3>
            <p>Add your first shared expense to start tracking who owes what.</p>
            <Link to={`/groups/${id}/expenses/new`} className="btn btn-primary">
              + Add first expense
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No results</h3>
            <p>No expenses match your search "{search}"</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Expense</th>
                <th>Category</th>
                <th>Paid by</th>
                <th>Split</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{e.description}</div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{CATEGORY_ICONS[e.category] || '📦'}</span>
                      <span style={{ fontSize: 12.5 }}>{e.category}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#3b63f5,#1f37d8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {e.paidByName?.[0]?.toUpperCase()}
                      </div>
                      {e.paidByName}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{SPLIT_LABELS[e.splitType] || e.splitType}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                      ₹{e.amount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)', fontSize: 12 }}
                      onClick={() => handleDelete(e.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {expenses.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            display: 'flex',
            gap: 24,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', marginTop: 2 }}>₹{total.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expenses</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginTop: 2 }}>{expenses.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import { pingBackend } from './services/api'

import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import CreateGroup from './pages/CreateGroup'
import GroupDetails from './pages/GroupDetails'
import AddExpense from './pages/AddExpense'
import ExpenseHistory from './pages/ExpenseHistory'
import BalanceSummary from './pages/BalanceSummary'
import MinimumCashFlow from './pages/MinimumCashFlow'
import Settlements from './pages/Settlements'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  // Silently wake up the Render server when the app loads (avoids cold-start
  // delay hitting the user mid-form-submit on login / register).
  useEffect(() => { pingBackend() }, [])
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups" element={<Dashboard />} />
          <Route path="/groups/new" element={<CreateGroup />} />
          <Route path="/groups/:id" element={<GroupDetails />} />
          <Route path="/groups/:id/expenses/new" element={<AddExpense />} />
          <Route path="/groups/:id/expenses" element={<ExpenseHistory />} />
          <Route path="/groups/:id/balances" element={<BalanceSummary />} />
          <Route path="/groups/:id/cash-flow" element={<MinimumCashFlow />} />
          <Route path="/groups/:id/settlements" element={<Settlements />} />
          <Route path="/groups/:id/settlements/:settlementId/pay" element={<PaymentPage />} />
          <Route path="/groups/:id/settlements/:settlementId/success" element={<PaymentSuccess />} />
          <Route path="/groups/:id/settlements/:settlementId/failure" element={<PaymentFailure />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  )
}

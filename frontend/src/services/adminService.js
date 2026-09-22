import api from './api'

export const getAdminUsers = () => api.get('/admin/users').then((r) => r.data)
export const getAdminGroups = () => api.get('/admin/groups').then((r) => r.data)
export const getAdminTransactions = () => api.get('/admin/transactions').then((r) => r.data)
export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data)

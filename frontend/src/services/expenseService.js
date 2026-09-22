import api from './api'

export const addExpense = (groupId, payload) => api.post(`/groups/${groupId}/expenses`, payload).then((r) => r.data)
export const getExpenses = (groupId) => api.get(`/groups/${groupId}/expenses`).then((r) => r.data)
export const updateExpense = (id, payload) => api.put(`/expenses/${id}`, payload).then((r) => r.data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`).then((r) => r.data)
export const getBalances = (groupId) => api.get(`/groups/${groupId}/balances`).then((r) => r.data)
export const getMinimumCashFlow = (groupId) => api.get(`/groups/${groupId}/minimum-cash-flow`).then((r) => r.data)

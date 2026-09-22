import api from './api'

export const getSettlements = (groupId) => api.get(`/groups/${groupId}/settlements`).then((r) => r.data)
export const generateSettlementPlan = (groupId) => api.post(`/groups/${groupId}/settlements/generate`).then((r) => r.data)

import api from './api'

export const createGroup = (payload) => api.post('/groups', payload).then((r) => r.data)
export const getMyGroups = () => api.get('/groups').then((r) => r.data)
export const getGroup = (id) => api.get(`/groups/${id}`).then((r) => r.data)
export const updateGroup = (id, payload) => api.put(`/groups/${id}`, payload).then((r) => r.data)
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then((r) => r.data)
export const addMember = (id, payload) => api.post(`/groups/${id}/members`, payload).then((r) => r.data)
export const removeMember = (id, userId) => api.delete(`/groups/${id}/members/${userId}`).then((r) => r.data)

import api from './api'

export const createPaymentOrder = (settlementId) =>
  api.post('/payments/create-order', { settlementId }).then((r) => r.data)

export const verifyPayment = (payload) => api.post('/payments/verify', payload).then((r) => r.data)

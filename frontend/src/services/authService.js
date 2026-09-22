import api from './api'

export const register = (payload) => api.post('/auth/register', payload).then((r) => r.data)
export const login = (payload) => api.post('/auth/login', payload).then((r) => r.data)
export const getMe = () => api.get('/users/me').then((r) => r.data)
export const updateMe = (payload) => api.put('/users/me', payload).then((r) => r.data)
export const changePassword = (payload) => api.put('/users/change-password', payload).then((r) => r.data)

// Forgot Password / OTP flow
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then((r) => r.data)
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload).then((r) => r.data)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((r) => r.data)

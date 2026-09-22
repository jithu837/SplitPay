import axios from 'axios'

let rawBaseURL = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '')
if (rawBaseURL.startsWith('http') && !rawBaseURL.endsWith('/api')) {
  rawBaseURL = `${rawBaseURL}/api`
}

const api = axios.create({ baseURL: rawBaseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('splitpay_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('splitpay_token')
      localStorage.removeItem('splitpay_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

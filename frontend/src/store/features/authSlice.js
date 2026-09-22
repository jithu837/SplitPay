import { createSlice } from '@reduxjs/toolkit'

const storedToken = localStorage.getItem('splitpay_token')
const storedUser = localStorage.getItem('splitpay_user')

const initialState = {
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: Boolean(storedToken),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, user } = action.payload
      state.token = token
      state.user = user
      state.isAuthenticated = true
      localStorage.setItem('splitpay_token', token)
      localStorage.setItem('splitpay_user', JSON.stringify(user))
    },
    updateUser: (state, action) => {
      state.user = action.payload
      localStorage.setItem('splitpay_user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('splitpay_token')
      localStorage.removeItem('splitpay_user')
    },
  },
})

export const { setCredentials, updateUser, logout } = authSlice.actions
export default authSlice.reducer

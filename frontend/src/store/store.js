import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import groupReducer from './features/groupSlice'
import notificationReducer from './features/notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupReducer,
    notifications: notificationReducer,
  },
})

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [], // { id, type: 'success' | 'error' | 'info', message }
}

let nextId = 1

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.push({ id: nextId++, ...action.payload })
    },
    removeNotification: (state, action) => {
      state.items = state.items.filter((n) => n.id !== action.payload)
    },
  },
})

export const { addNotification, removeNotification } = notificationSlice.actions
export default notificationSlice.reducer

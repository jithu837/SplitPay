import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  groups: [],
  currentGroup: null,
}

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload
    },
    upsertGroup: (state, action) => {
      const idx = state.groups.findIndex((g) => g.id === action.payload.id)
      if (idx >= 0) state.groups[idx] = action.payload
      else state.groups.push(action.payload)
    },
    removeGroupById: (state, action) => {
      state.groups = state.groups.filter((g) => g.id !== action.payload)
    },
  },
})

export const { setGroups, setCurrentGroup, upsertGroup, removeGroupById } = groupSlice.actions
export default groupSlice.reducer

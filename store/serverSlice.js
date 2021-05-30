import { createSlice } from '@reduxjs/toolkit'

export const serverSlice = createSlice({
  name: 'server',
  initialState: {
    value: null,
  },
  reducers: {
    setServer: (state, action) => {
      state.value = action.payload
    }
  }
})

export const { setServer } = serverSlice.actions

export default serverSlice.reducer
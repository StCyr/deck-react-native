import { createSlice } from '@reduxjs/toolkit'

export const colorSchemeSlice = createSlice({
  name: 'colorScheme',
  initialState: {
    value: 'OS',
  },
  reducers: {
    setColorScheme: (state, action) => {
      state.value = action.payload
    },
  },
})

export const { setColorScheme } = colorSchemeSlice.actions

export default colorSchemeSlice.reducer

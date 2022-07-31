import { createSlice } from '@reduxjs/toolkit'
import createStyles from '../styles/base'

export const colorSchemeSlice = createSlice({
  name: 'colorScheme',
  initialState: 'OS',
  reducers: {
    setColorScheme: (state, action) => {
      return action.payload
    },
  },
})

export const { setColorScheme } = colorSchemeSlice.actions

export default colorSchemeSlice.reducer

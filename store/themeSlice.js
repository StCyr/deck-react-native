import { createSlice } from '@reduxjs/toolkit'
import createStyles from '../styles/base'

export const themeSlice = createSlice({
  name: 'theme',
  initialState: createStyles('light'),
  reducers: {
    setTheme: (state, action) => {
      const newStyle = createStyles(action.payload)
      return {...state, ...newStyle}
    },
  },
})

export const { setTheme } = themeSlice.actions

export default themeSlice.reducer

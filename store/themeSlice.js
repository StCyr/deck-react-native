import { createSlice } from '@reduxjs/toolkit'
import createStyles from '../styles/base'

export const themeSlice = createSlice({
  name: 'theme',
  initialState: createStyles('light'),
  reducers: {
    setTheme: (state, action) => {
      console.log('saving theme: ', action.payload)
      const newStyle = createStyles(action.payload)
      return {...state, ...newStyle}
    },
  },
})

export const { setTheme } = themeSlice.actions

export default themeSlice.reducer

import { configureStore } from '@reduxjs/toolkit'
import serverReducer from './serverSlice'
import tokenReducer from './tokenSlice'

export default configureStore({
  reducer: {
      server: serverReducer,
      token: tokenReducer
  },
})
import { configureStore } from '@reduxjs/toolkit'
import boardReducer from './BoardSlice'
import serverReducer from './serverSlice'
import tokenReducer from './tokenSlice'

export default configureStore({
  reducer: {
    boards: boardReducer,
    server: serverReducer,
    token: tokenReducer
  },
})
import { configureStore } from '@reduxjs/toolkit'
import boardReducer from './boardSlice'
import serverReducer from './serverSlice'
import preferencesReducer from './preferencesSlice'
import themeReducer from './themeSlice'
import tokenReducer from './tokenSlice'

export default configureStore({
	reducer: {
		boards: boardReducer,
		preferences: preferencesReducer,
		server: serverReducer,
		theme: themeReducer,
		token: tokenReducer
	},
})

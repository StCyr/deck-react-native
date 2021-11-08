import { createSlice } from '@reduxjs/toolkit'

export const preferencesSlice = createSlice({
    name: 'preferences',
    initialState: {
        theme: null,
    },
    reducers: {
        setTheme: (state, action) => {
            state.theme = action.payload
        },
    }
})

export const { setTheme } = preferencesSlice.actions

export default preferencesSlice.reducer
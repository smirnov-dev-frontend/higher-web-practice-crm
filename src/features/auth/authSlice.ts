import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { User } from '../../types/user'

type AuthState = {
   currentUser: User | null
}

const storedUser = localStorage.getItem('currentUser')

const initialState: AuthState = {
   currentUser: storedUser ? JSON.parse(storedUser) : null,
}

export const authSlice = createSlice({
   name: 'auth',
   initialState,
   reducers: {
      setCurrentUser: (state, action: PayloadAction<User>) => {
         state.currentUser = action.payload
         localStorage.setItem('currentUser', JSON.stringify(action.payload))
      },
      logout: (state) => {
         state.currentUser = null
         localStorage.removeItem('currentUser')
      },
   },
})

export const { setCurrentUser, logout } = authSlice.actions
export const authReducer = authSlice.reducer
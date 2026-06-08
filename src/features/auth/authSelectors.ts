import type { RootState } from '../../app/store'

export const selectCurrentUser = (state: RootState) => state.auth.currentUser

export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.currentUser)
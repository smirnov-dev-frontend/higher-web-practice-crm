import { Navigate, Outlet } from 'react-router-dom'

import { useAppSelector } from '../../app/hooks'
import { selectIsAuthenticated } from '../../features/auth/authSelectors'

export function ProtectedRoute() {
   const isAuthenticated = useAppSelector(selectIsAuthenticated)

   if (!isAuthenticated) {
      return <Navigate replace to="/" />
   }

   return <Outlet />
}
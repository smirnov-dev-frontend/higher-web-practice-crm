import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout'
import { AuthLayout } from '../components/layout/AuthLayout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { ClientsPage } from '../pages/ClientsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DealsPage } from '../pages/DealsPage'
import { LoginPage } from '../pages/LoginPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReportsPage } from '../pages/ReportsPage'
import { TasksPage } from '../pages/TasksPage'
import { EmailConfirmationPage } from '../pages/EmailConfirmationPage'
import { PasswordRecoveryPage } from '../pages/PasswordRecoveryPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <LoginPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/password-recovery',
        element: <PasswordRecoveryPage />,
      },
      {
        path: '/email-confirmation',
        element: <EmailConfirmationPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/clients',
            element: <ClientsPage />,
          },
          {
            path: '/deals',
            element: <DealsPage />,
          },
          {
            path: '/tasks',
            element: <TasksPage />,
          },
          {
            path: '/reports',
            element: <ReportsPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/" />,
  },
])
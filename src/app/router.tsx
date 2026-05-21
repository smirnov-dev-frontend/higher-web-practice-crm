import { createBrowserRouter } from 'react-router-dom'

import { StubPage } from '../pages/StubPage'

export const router = createBrowserRouter([
  { path: '/', element: <StubPage /> },
])


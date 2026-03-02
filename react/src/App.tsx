import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from './components/pages/LoginPage/LoginPage'
import { DashboardPage } from './components/pages/DashboardPage/DashboardPage'
import { LayersPage } from './components/pages/LayersPage/LayersPage'
import { InputFormPage } from './components/pages/InputFormPage/InputFormPage'
import { InputCsvPage } from './components/pages/InputCsvPage/InputCsvPage'
import { InputEditPage } from './components/pages/InputEditPage/InputEditPage'
import { InputDivisionPage } from './components/pages/InputDivisionPage/InputDivisionPage'
import { UsersPage } from './components/pages/UsersPage/UsersPage'
import { ProfilePage } from './components/pages/ProfilePage/ProfilePage'
import { AdminPage } from './components/pages/AdminPage/AdminPage'
import { ManualPage } from './components/pages/ManualPage/ManualPage'
import { DetailPage } from './components/pages/DetailPage/DetailPage'
import { DetailQRPage } from './components/pages/DetailQRPage/DetailQRPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/v3">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/layers" element={<LayersPage />} />
          <Route path="/input-form" element={<InputFormPage />} />
          <Route path="/input-csv" element={<InputCsvPage />} />
          <Route path="/input-edit" element={<InputEditPage />} />
          <Route path="/divisions" element={<InputDivisionPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/manual" element={<ManualPage />} />
          <Route path="/detail" element={<DetailPage />} />
          <Route path="/detail-qr" element={<DetailQRPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

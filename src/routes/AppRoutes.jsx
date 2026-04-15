import { Routes, Route } from 'react-router-dom'
import { AppShell } from '../layouts/AppShell'
import { ProtectedRoute, AdminRoute } from './ProtectedRoute'
import { HomePage } from '../pages/HomePage'
import { AuthPage } from '../pages/AuthPage'
import { CourtRentalPage } from '../pages/CourtRentalPage'
import { ReservationCheckoutPage } from '../pages/ReservationCheckoutPage'
import { MyReservationsPage } from '../pages/MyReservationsPage'
import { EnrollmentPage } from '../pages/EnrollmentPage'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/quadras" element={<CourtRentalPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <ReservationCheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/minhas-reservas"
          element={
            <ProtectedRoute>
              <MyReservationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matricula"
          element={
            <ProtectedRoute>
              <EnrollmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}

import { Routes, Route, Navigate } from 'react-router'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import DokterLayout from './layouts/DokterLayout'
import FarmasiLayout from './layouts/FarmasiLayout'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import InputPasien from './pages/admin/InputPasien'
import AntrianAdmin from './pages/admin/AntrianAdmin'
import AuditTrail from './pages/AuditTrail'

// Dokter pages
import DokterDashboard from './pages/dokter/DokterDashboard'
import DokterAntrian from './pages/dokter/DokterAntrian'
import PeriksaPasien from './pages/dokter/PeriksaPasien'
import DokterRiwayat from './pages/dokter/DokterRiwayat'

// Farmasi pages
import FarmasiDashboard from './pages/farmasi/FarmasiDashboard'
import FarmasiRiwayat from './pages/farmasi/FarmasiRiwayat'

// Auth
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="input-pasien" element={<InputPasien />} />
        <Route path="antrian" element={<AntrianAdmin />} />
        <Route path="audit" element={<AuditTrail />} />
      </Route>

      {/* Dokter routes */}
      <Route path="/dokter" element={
        <ProtectedRoute allowedRole="dokter">
          <DokterLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DokterDashboard />} />
        <Route path="antrian" element={<DokterAntrian />} />
        <Route path="periksa/:id" element={<PeriksaPasien />} />
        <Route path="riwayat" element={<DokterRiwayat />} />
      </Route>

      {/* Farmasi routes */}
      <Route path="/farmasi" element={
        <ProtectedRoute allowedRole="farmasi">
          <FarmasiLayout />
        </ProtectedRoute>
      }>
        <Route index element={<FarmasiDashboard />} />
        <Route path="riwayat" element={<FarmasiRiwayat />} />
      </Route>

      {/* Legacy redirects */}
      <Route path="/form" element={<Navigate to="/admin/input-pasien" replace />} />
      <Route path="/antrian" element={<Navigate to="/admin/antrian" replace />} />
      <Route path="/hasil" element={<Navigate to="/admin" replace />} />
      <Route path="/audit" element={<Navigate to="/admin/audit" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

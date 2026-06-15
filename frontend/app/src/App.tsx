import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import FormPasien from './pages/FormPasien'
import HasilTriage from './pages/HasilTriage'
import DashboardAntrian from './pages/DashboardAntrian'
import AuditTrail from './pages/AuditTrail'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<FormPasien />} />
        <Route path="/hasil" element={<HasilTriage />} />
        <Route path="/antrian" element={<DashboardAntrian />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

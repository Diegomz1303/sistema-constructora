// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'

// --- ¡LA IMPORTACIÓN CORRECTA! ---
// Debe apuntar al "portero" (Dashboard.jsx), NO al panel del ingeniero.
import Dashboard from './pages/ingeniero/Dashboard' 

import CrearTicket from './pages/trabajador/CrearTicket'
import GestionUsuarios from './pages/ingeniero/GestionUsuarios'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
             {/* Esta ruta AHORA usará el portero correctamente */}
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/crear-ticket" element={<CrearTicket />} />
             <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
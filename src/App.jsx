// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ProtectedRoute from './components/layout/ProtectedRoute'
// IMPORTAMOS EL NUEVO DASHBOARD
import Dashboard from './pages/ingeniero/Dashboard'
import CrearTicket from './pages/trabajador/CrearTicket'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <Router>
        {/* Recuerda que el AuthProvider ya está en main.jsx, no es necesario repetirlo aquí si ya envuelve a <App /> allí.
            Si te da error de 'useAuth must be used within AuthProvider', asegúrate de que main.jsx esté bien.
        */}
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
           {/* Usamos el componente importado */}
           <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/crear-ticket" element={<CrearTicket />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
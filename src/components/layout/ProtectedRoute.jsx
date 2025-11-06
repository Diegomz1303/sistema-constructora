// src/components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    // Puedes poner aquí un spinner bonito luego
    return <div>Cargando sesión...</div>
  }

  // Si no hay usuario, lo mandamos al login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si hay usuario, dejamos que vea la página (Outlet renderiza la ruta hija)
  return <Outlet />
}

export default ProtectedRoute
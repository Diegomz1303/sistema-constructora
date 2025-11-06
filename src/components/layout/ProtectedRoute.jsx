// src/components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    // Un spinner simple centrado para evitar "flashes" de contenido
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        color: '#64748b',
        fontFamily: 'sans-serif'
      }}>
        Verificando credenciales... 🔒
      </div>
    )
  }

  // Si no hay usuario autenticado, patada al login de inmediato
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
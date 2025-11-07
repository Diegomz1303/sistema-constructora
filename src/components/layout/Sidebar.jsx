// src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, FilePlus, Users, LogOut, Menu, X, Bell } from 'lucide-react' // --- NUEVO --- Importa 'Bell'
import './Sidebar.css'
// --- NUEVO --- Importamos la lógica de Push y Toasts
import { subscribeToPushNotifications } from '../../utils/pushSubscription'
import { toast } from 'react-hot-toast'

const Sidebar = () => {
  const { user, role, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  
  // --- NUEVO --- Estado para saber si ya está suscrito
  const [isSubscribed, setIsSubscribed] = useState(Notification.permission === 'granted')

  const toggleSidebar = () => setIsOpen(!isOpen)

  useEffect(() => {
    if (window.innerWidth <= 768 && isOpen) {
       document.body.style.overflow = 'hidden'
    } else {
       document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const links = role === 'ingeniero' ? [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Centro de Control' },
    { to: '/gestion-usuarios', icon: <Users size={20} />, label: 'Personal' },
  ] : [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Mis Reportes' },
    { to: '/crear-ticket', icon: <FilePlus size={20} />, label: 'Nuevo Reporte' },
  ]

  // --- NUEVO --- Función para manejar el clic del botón
  const handleSubscribe = async () => {
    if (!user) return toast.error('Error: Usuario no encontrado');
    
    const toastId = toast.loading('Activando notificaciones...');
    try {
      await subscribeToPushNotifications(user);
      toast.success('¡Notificaciones activadas!', { id: toastId });
      setIsSubscribed(true); // Actualiza el estado del botón
    } catch (error) {
      console.error(error);
      toast.error(`Error: ${error.message}`, { id: toastId });
      setIsSubscribed(false); // Mantiene el estado como no suscrito
    }
  }

  return (
    <>
      <button onClick={toggleSidebar} className="mobile-menu-btn">
        {isOpen ? <X size={24} color="#2c3e50" /> : <Menu size={24} color="#2c3e50" />}
      </button>

      <div 
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">
            🏗️ <span className="logo-text">ObraApp</span>
          </h2>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
             {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name">
                {user?.email?.split('@')[0]}
            </p>
            <span className="user-role">
                {role === 'ingeniero' ? 'Ingeniero Jefe' : 'Personal de Obra'}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* --- MODIFICADO --- Footer del Sidebar */}
        <div className="sidebar-footer">
          {/* Botón para activar notificaciones */}
          <button 
            onClick={handleSubscribe} 
            disabled={isSubscribed} // Se deshabilita si ya tiene permiso
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '0.8rem 1rem',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubscribed ? 'default' : 'pointer',
              fontWeight: '600',
              transition: 'background 0.2s',
              marginBottom: '0.5rem', // Espacio entre botones
              background: isSubscribed ? '#e8f5e9' : '#e0f2fe',
              color: isSubscribed ? '#2e7d32' : '#0284c7',
            }}
          >
            <Bell size={20} />
            <span>{isSubscribed ? 'Notificaciones OK' : 'Activar Avisos'}</span>
          </button>
          
          {/* Botón de Cerrar Sesión (sin cambios) */}
          <button onClick={() => { setIsOpen(false); signOut(); }} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
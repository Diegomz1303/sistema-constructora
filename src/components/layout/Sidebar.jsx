// src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, FilePlus, Users, LogOut, Menu, X } from 'lucide-react'

const Sidebar = () => {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  // --- NUEVO: BLOQUEAR SCROLL CUANDO ESTÁ ABIERTO EN MÓVIL ---
  useEffect(() => {
    if (window.innerWidth <= 768 && isOpen) {
       document.body.style.overflow = 'hidden' // Bloquea scroll del fondo
    } else {
       document.body.style.overflow = 'unset'  // Restaura scroll
    }
    // Limpieza al desmontar
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const links = role === 'ingeniero' ? [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Centro de Control' },
    { to: '/gestion-usuarios', icon: <Users size={20} />, label: 'Personal' },
  ] : [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Mis Reportes' },
    { to: '/crear-ticket', icon: <FilePlus size={20} />, label: 'Nuevo Reporte' },
  ]

  return (
    <>
      {/* Botón móvil mejorado: position fixed para que no scrollee */}
      <button 
        onClick={toggleSidebar}
        className="mobile-menu-btn"
        style={{ 
            position: 'fixed', 
            top: '1rem', 
            left: '1rem', 
            zIndex: 110, // Mayor que el sidebar para estar siempre visible
            background: 'white', 
            border: 'none', 
            borderRadius: '50%', // Redondo queda mejor
            width: '45px',
            height: '45px',
            display: 'none', // Por defecto oculto en desktop
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            cursor: 'pointer'
        }}
      >
        {isOpen ? <X size={24} color="#2c3e50" /> : <Menu size={24}yb color="#2c3e50" />}
      </button>

      {/* Overlay para cerrar al hacer click fuera */}
      <div 
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Principal */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            🏗️ <span className="logo-text">ObraApp</span>
          </h2>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
             {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name" style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px'}}>
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
              onClick={() => setIsOpen(false)} // Cierra el menú al hacer click en un link
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
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
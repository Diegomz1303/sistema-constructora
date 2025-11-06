// src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, FilePlus, Users, LogOut, Menu, X } from 'lucide-react'
import './Sidebar.css' // <-- IMPORTANTE: Importar el nuevo archivo CSS

const Sidebar = () => {
  const { user, role, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  // Bloquear scroll cuando el menú móvil está abierto
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

  return (
    <>
      {/* Botón móvil ahora usa clase CSS */}
      <button onClick={toggleSidebar} className="mobile-menu-btn">
        {isOpen ? <X size={24} color="#2c3e50" /> : <Menu size={24} color="#2c3e50" />}
      </button>

      {/* Overlay */}
      <div 
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Principal */}
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
// src/components/layout/Sidebar.jsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
// Asegúrate de tener instalados estos iconos, o cámbialos por texto/emojis si prefieres
import { LayoutDashboard, FilePlus, Users, LogOut, Menu, X } from 'lucide-react'

const Sidebar = () => {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  // --- AQUÍ ESTÁ LA CLAVE: DEFINIMOS LOS MENÚS SEGÚN EL ROL ---
  const links = role === 'ingeniero' ? [
    // Menú para INGENIERO
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Centro de Control' },
    { to: '/gestion-usuarios', icon: <Users size={20} />, label: 'Personal' }, // <--- ¡ESTE ES EL QUE TE FALTA!
  ] : [
    // Menú para TRABAJADOR
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Mis Reportes' },
    { to: '/crear-ticket', icon: <FilePlus size={20} />, label: 'Nuevo Reporte' },
  ]

  return (
    <>
      {/* Botón móvil */}
      <button 
        onClick={toggleSidebar}
        className="mobile-menu-btn"
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 100, background: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'none' }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Principal */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏗️ <span className="logo-text">ObraApp</span>
          </h2>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
             {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.email?.split('@')[0]}</p>
            {/* Muestra el rol real */}
            <span className="user-role">
                {role === 'ingeniero' ? 'Ingeniero Jefe' : 'Personal de Obra'}
            </span>
          </div>
        </div>

        {/* Lista de navegación dinámica */}
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
          <button onClick={signOut} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Fondo oscuro para móvil */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
    </>
  )
}

export default Sidebar
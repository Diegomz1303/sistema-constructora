// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
// --- NUEVO --- Importar el componente de la campana
import NotificationBell from './NotificationBell'

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      {/* --- NUEVO --- Añadimos la campana al layout */}
      <NotificationBell />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
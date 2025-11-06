// src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar' // Asegúrate que este archivo también esté correcto

const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Aquí se renderizarán las páginas hijas (Dashboards, CrearTicket, etc.) */}
        <Outlet />
      </main>
    </div>
  )
}

// ¡ESTA ES LA LÍNEA QUE SEGURO TE FALTA O ESTÁ MAL!
export default Layout
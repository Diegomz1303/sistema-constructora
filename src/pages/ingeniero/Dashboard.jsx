// src/pages/ingeniero/Dashboard.jsx
import { useAuth } from '../../context/AuthContext'
import EngineerDashboard from './EngineerDashboard'
import WorkerDashboard from '../trabajador/WorkerDashboard'

// ¡AQUÍ DEFINE QUIÉN ES EL VERDADERO INGENIERO!
const EMAIL_INGENIERO_JEFE = 'diegoamz123@gmail.com' // <--- CAMBIA ESTO AL CORREO DEL JEFE

const Dashboard = () => {
  const { user } = useAuth()

  if (!user) return null

  // Verificamos si el que entró es el jefe
  const soyElJefe = user.email.toLowerCase() === EMAIL_INGENIERO_JEFE.toLowerCase()

  return (
    <>
      {soyElJefe ? (
        // Si es el jefe, le mostramos SU panel
        <EngineerDashboard />
      ) : (
        // Si NO es el jefe, le mostramos el panel de trabajador
        <WorkerDashboard />
      )}
    </>
  )
}

export default Dashboard
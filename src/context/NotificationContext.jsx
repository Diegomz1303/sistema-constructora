// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext({})

export const NotificationProvider = ({ children }) => {
  const { user, role } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user || !role) return

    let channel

    // 1. Escuchar notificaciones basado en el ROL
    if (role === 'ingeniero') {
      // Escuchar por NUEVOS tickets asignados a MÍ
      channel = supabase
        .channel('ingeniero-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tickets',
            filter: `assigned_to=eq.${user.id}`, // Solo tickets asignados a mi ID
          },
          (payload) => {
            const newTicket = payload.new
            const message = `Nuevo ticket #${newTicket.id} (${newTicket.title.substring(0, 20)}...)`
            setNotifications((prev) => [message, ...prev])
            setUnreadCount((prev) => prev + 1)
          }
        )
        .subscribe()
    } 
    
    if (role === 'trabajador') {
      // Escuchar por ACTUALIZACIONES en MIS tickets
      channel = supabase
        .channel('trabajador-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tickets',
            filter: `user_email=eq.${user.email}`, // Solo tickets creados por mi email
          },
          (payload) => {
            // Solo notificar si el estado realmente cambió
            if (payload.old.status !== payload.new.status) {
              const newStatus = payload.new.status
              const message = `Ticket #${payload.new.id} actualizado a: ${newStatus.toUpperCase()}`
              setNotifications((prev) => [message, ...prev])
              setUnreadCount((prev) => prev + 1)
            }
          }
        )
        .subscribe()
    }

    // 2. Limpieza al desmontar
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user, role])

  const markAllAsRead = () => {
    setUnreadCount(0)
    // Opcional: podrías borrar las notificaciones también
    // setNotifications([]) 
  }

  const value = {
    notifications,
    unreadCount,
    markAllAsRead,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook para usar el contexto
export const useNotifications = () => {
  return useContext(NotificationContext)
}
// src/components/layout/NotificationBell.jsx
import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import './NotificationBell.css' // Crearemos este archivo ahora

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen && unreadCount > 0) {
      // Marcar como leído al abrir
      markAllAsRead()
    }
  }

  return (
    <div className="notification-bell-wrapper">
      <button onClick={handleToggle} className="notification-bell-btn">
        <Bell size={22} color="#2c3e50" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <button onClick={() => setIsOpen(false)} className="notification-close-btn">
              <X size={18} />
            </button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No hay notificaciones nuevas.</p>
            ) : (
              notifications.map((msg, index) => (
                <div key={index} className="notification-item">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
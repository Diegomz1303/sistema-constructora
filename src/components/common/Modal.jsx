// src/components/common/Modal.jsx
import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children }) => {
  // Bloquear el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      padding: '1rem' // Para que no toque los bordes en móvil
    }} onClick={onClose}>
      
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '500px', // Responsivo: máximo 500px, si no, 100%
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        animation: 'slideIn 0.3s ease-out'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header del Modal */}
        <div style={{
          padding: '1rem 1.5rem', borderBottom: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>
            &times;
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>

      </div>
      {/* Añadimos la animación en línea para no ensuciar el CSS global por ahora */}
      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export default Modal
// src/components/tickets/TicketCard.jsx

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'alta': return { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' }
    case 'media': return { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' }
    case 'baja': return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' }
    default: return { bg: 'white', text: '#333', border: '#ddd' }
  }
}

const getTypeIcon = (type) => {
  switch (type) {
    case 'material': return '📦'
    case 'incidencia': return '⚠️'
    case 'duda': return '❓'
    default: return '📝'
  }
}

// AHORA RECIBIMOS LAS FUNCIONES onViewDetails y onApprove COMO PROPS
const TicketCard = ({ ticket, onViewDetails, onApprove }) => {
  const colors = getPriorityColor(ticket.priority)
  const date = new Date(ticket.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px', padding: '1.2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0',
      display: 'flex', flexDirection: 'column', gap: '0.8rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)' }}
    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      
      {/* Header: Icono, Título y Prioridad */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', background: '#f8f9fa', padding: '8px', borderRadius: '12px' }}>
            {getTypeIcon(ticket.type)}
          </span>
          <div>
             <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1rem', lineHeight: '1.3' }}>{ticket.title}</h3>
             <span style={{ fontSize: '0.75rem', color: '#90a4ae' }}>#{ticket.id}</span>
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: '20px',
          backgroundColor: colors.bg, color: colors.text, fontWeight: 'bold',
          border: `1px solid ${colors.border}`, whiteSpace: 'nowrap'
        }}>
          {ticket.priority.toUpperCase()}
        </span>
      </div>

      {/* Descripción corta (máximo 2 líneas) */}
      <p style={{ 
        color: '#546e7a', fontSize: '0.9rem', margin: '0', lineHeight: '1.5',
        display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {ticket.description}
      </p>

      {/* Footer: Usuario y Fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#b0bec5', marginTop: 'auto', paddingTop: '0.8rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>👤 {ticket.user_email.split('@')[0]}</span>
        <span>🕒 {date}</span>
      </div>
      
      {/* Botones de Acción */}
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.8rem' }}>
        <button 
          onClick={onViewDetails} // CONECTADO
          style={{ flex: 1, padding: '0.7rem', border: '1px solid #eceff1', background: 'white', color: '#546e7a', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.target.style.background = '#f8f9fa'}
          onMouseOut={(e) => e.target.style.background = 'white'}
        >
            Ver Detalles
        </button>
        
        {ticket.status === 'pendiente' && (
            <button 
              onClick={onApprove} // CONECTADO
              style={{ flex: 1.2, padding: '0.7rem', border: 'none', background: '#007bff', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#0056b3'}
              onMouseOut={(e) => e.target.style.background = '#007bff'}
            >
                Responder
            </button>
        )}
      </div>
    </div>
  )
}

export default TicketCard
// src/pages/trabajador/WorkerDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'

// --- NUEVO --- Lista de filtros actualizada
const STATUS_FILTERS = ['todos', 'pendiente', 'visto', 'en proceso', 'completado', 'rechazado']

const WorkerDashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const fetchMyTickets = async () => {
    setLoading(true) // --- AÑADIDO --- Mostrar carga al cambiar filtro
    let query = supabase
      .from('tickets')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false })

    if (filter !== 'todos') query = query.eq('status', filter)

    const { data } = await query
    if (data) setTickets(data)
    setLoading(false)
  }

  // --- EFECTO CON TIEMPO REAL ---
  useEffect(() => {
    if (!user) return
    fetchMyTickets()

    const channel = supabase
      .channel('realtime my tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        
        if (payload.eventType === 'UPDATE' && payload.old.user_email === user.email) {
            // Comprueba si el estado realmente cambió
            if (payload.old.status !== payload.new.status) {
              const newStatus = payload.new.status.toUpperCase();
              toast(`Tu ticket "${payload.new.title.substring(0, 20)}..." ha sido actualizado a: ${newStatus}`, { icon: '📬' })
            }
        }
        fetchMyTickets()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [filter, user])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Toaster position="top-center" />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <div>
           <h2 style={{ color: '#2c3e50', margin: 0 }}>🔨 Mis Reportes</h2>
           <p style={{ margin: 0, color: '#7f8c8d' }}>Usuario: {user.email.split('@')[0]}</p>
        </div>
      </header>
      {/* NOTA: He quitado los botones de Salir y Nuevo de aquí, ya que están en el Sidebar */}

      {/* --- MODIFICADO --- Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {STATUS_FILTERS.map(status => (
           <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.6rem 1.2rem', borderRadius: '30px', border: 'none', background: filter === status ? '#2c3e50' : 'white', color: filter === status ? 'white' : '#7f8c8d', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize', boxShadow: filter === status ? '0 4px 12px rgba(44,62,80,0.2)' : '0 2px 5px rgba(0,0,0,0.05)', transition:'all 0.2s', whiteSpace: 'nowrap' }}>
             {status}
           </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Cargando mis reportes...</div>
      ) : tickets.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', color: '#b0bec5', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📭</span>
            <p style={{ fontSize: '1.2rem', margin: 0 }}>No tienes reportes en estado "{filter}".</p>
         </div>
       ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {tickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onViewDetails={() => { setSelectedTicket(ticket); setIsDetailsOpen(true) }} 
                onApprove={null} // El trabajador no puede aprobar
                onComplete={null} // El trabajador no puede completar
              />
            ))}
         </div>
       )
      }

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Mis Detalles y Chat">
        {selectedTicket && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h3 style={{margin:0}}>{selectedTicket.title}</h3>
            {selectedTicket.image_url && (
              <a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer">
                <img src={selectedTicket.image_url} alt="Evidencia" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #eee' }} />
              </a>
            )}
            <p style={{background:'#f9f9f9', padding:'1rem', borderRadius:'8px', margin:0}}>{selectedTicket.description}</p>
            
            {/* --- MODIFICADO --- Lógica para mostrar respuesta oficial */}
            {selectedTicket.status === 'rechazado' && selectedTicket.engineer_response && (
              <div style={{background:'#ffebee', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid #c62828'}}>
                <strong>Respuesta (Rechazado):</strong>
                <p style={{margin:'0.5rem 0 0 0'}}>{selectedTicket.engineer_response}</p>
              </div>
            )}
            {(selectedTicket.status === 'en proceso' || selectedTicket.status === 'completado') && selectedTicket.engineer_response && (
              <div style={{background:'#e8f5e9', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid #2e7d32'}}>
                <strong>Respuesta Oficial:</strong>
                <p style={{margin:'0.5rem 0 0 0'}}>{selectedTicket.engineer_response}</p>
              </div>
            )}

            <TicketChat ticketId={selectedTicket.id} />
            <button onClick={()=>setIsDetailsOpen(false)} style={{width:'100%', marginTop:'0.5rem', padding:'0.8rem', border:'none', background:'#eee', borderRadius:'6px', cursor:'pointer'}}>Cerrar</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkerDashboard
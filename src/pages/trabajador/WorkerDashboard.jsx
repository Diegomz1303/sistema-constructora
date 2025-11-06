// src/pages/trabajador/WorkerDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'

const WorkerDashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const fetchMyTickets = async () => {
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

    // Suscribirse solo a cambios que afecten a ESTE usuario (opcional, pero más eficiente)
    // Por simplicidad, escuchamos todo y filtramos en el fetchMyTickets
    const channel = supabase
      .channel('realtime my tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        // Si alguien actualizó UNO DE MIS tickets (ej: el ingeniero lo aprobó)
        if (payload.eventType === 'UPDATE' && payload.new.user_email === user.email) {
            const newStatus = payload.new.status.toUpperCase();
            toast(`Tu ticket ha sido actualizado a: ${newStatus}`, { icon: '📬' })
        }
        fetchMyTickets()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [filter, user])

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <Toaster position="top-center" />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <div>
           <h2 style={{ color: '#2c3e50', margin: 0 }}>🔨 Mis Reportes</h2>
           <p style={{ margin: 0, color: '#7f8c8d' }}>Usuario: {user.email.split('@')[0]}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/crear-ticket')} style={{ padding: '0.7rem 1.2rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
               <span>＋</span> Nuevo
            </button>
            <button onClick={signOut} style={{ padding: '0.7rem', border: '1px solid #e74c3c', background: 'white', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {['todos', 'pendiente', 'aprobado', 'rechazado'].map(status => (
           <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', background: filter === status ? '#3498db' : '#ecf0f1', color: filter === status ? 'white' : '#7f8c8d', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
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
              <TicketCard key={ticket.id} ticket={ticket} onViewDetails={() => { setSelectedTicket(ticket); setIsDetailsOpen(true) }} onApprove={null} />
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
            {selectedTicket.engineer_response && <div style={{background:'#e8f5e9', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid green'}}><strong>Respuesta Oficial:</strong><p style={{margin:0}}>{selectedTicket.engineer_response}</p></div>}
            <TicketChat ticketId={selectedTicket.id} />
            <button onClick={()=>setIsDetailsOpen(false)} style={{width:'100%', marginTop:'0.5rem', padding:'0.8rem', border:'none', background:'#eee', borderRadius:'6px', cursor:'pointer'}}>Cerrar</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkerDashboard
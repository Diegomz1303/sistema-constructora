// src/pages/ingeniero/EngineerDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'

const EngineerDashboard = () => {
  const { user, signOut } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [responseText, setResponseText] = useState('')

  const fetchAllTickets = async () => {
    setLoading(true)
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'todos') query = query.eq('status', filter)

    const { data } = await query
    if (data) setTickets(data)
    setLoading(false)
  }

  useEffect(() => { if(user) fetchAllTickets() }, [filter, user])

  const handleUpdateStatus = async (newStatus) => {
    if (!responseText.trim() && newStatus === 'rechazado') return toast.error('Indica el motivo del rechazo')
    const toastId = toast.loading('Actualizando...')
    await supabase.from('tickets').update({ status: newStatus, engineer_response: responseText }).eq('id', selectedTicket.id)
    toast.success(`Ticket ${newStatus.toUpperCase()}`, { id: toastId })
    setIsResponseOpen(false)
    fetchAllTickets()
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <Toaster position="top-center" />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <div>
           <h2 style={{ color: '#d35400', margin: 0 }}>🏗️ Centro de Control</h2>
           <p style={{ margin: 0, color: '#7f8c8d' }}>Ingeniero: {user.email.split('@')[0]}</p>
        </div>
        <button onClick={signOut} style={{ padding: '0.7rem', border: '1px solid #e74c3c', background: 'white', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer' }}>Cerrar Sesión</button>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {['pendiente', 'aprobado', 'rechazado', 'todos'].map(status => (
           <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', background: filter === status ? '#d35400' : '#fbeee6', color: filter === status ? 'white' : '#d35400', cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
             {status}
           </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Cargando reportes...</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', color: '#b0bec5', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>✅</span>
            <p style={{ fontSize: '1.2rem', margin: 0 }}>¡Todo al día! No hay tickets "{filter}".</p>
        </div>
      ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onViewDetails={() => { setSelectedTicket(ticket); setIsDetailsOpen(true) }} onApprove={() => { setSelectedTicket(ticket); setResponseText(''); setIsResponseOpen(true) }} />
            ))}
         </div>
      )}

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Detalles del Reporte">
         {selectedTicket && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h3 style={{margin:0}}>{selectedTicket.title}</h3>

            {/* --- NUEVO --- MOSTRAR LA IMAGEN SI EXISTE */}
            {selectedTicket.image_url && (
              <a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer" title="Ver imagen completa">
                <img 
                  src={selectedTicket.image_url} 
                  alt="Evidencia del ticket" 
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #eee' }} 
                />
              </a>
            )}

            <p style={{background:'#f9f9f9', padding:'1rem', borderRadius:'8px', margin:0}}>{selectedTicket.description}</p>
            {selectedTicket.engineer_response && <div style={{background:'#e8f5e9', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid green'}}><strong>Respuesta:</strong><p style={{margin:0}}>{selectedTicket.engineer_response}</p></div>}
            <TicketChat ticketId={selectedTicket.id} />
            <button onClick={()=>setIsDetailsOpen(false)} style={{width:'100%', marginTop:'0.5rem', padding:'0.8rem', border:'none', background:'#eee', borderRadius:'6px', cursor:'pointer'}}>Cerrar</button>
          </div>
         )}
      </Modal>

      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} title="📣 Resolución Oficial">
         {selectedTicket && (
          <div>
            <p>Resolviendo: <strong>{selectedTicket.title}</strong></p>
            <textarea value={responseText} onChange={e=>setResponseText(e.target.value)} rows={4} style={{width:'100%', padding:'0.8rem', borderRadius:'8px', border:'1px solid #ccc', marginBottom:'1rem', fontFamily:'inherit'}} placeholder="Nota de resolución..."></textarea>
            <div style={{display:'flex', gap:'10px'}}>
                <button onClick={()=>handleUpdateStatus('rechazado')} style={{flex:1, padding:'1rem', background:'white', color:'red', border:'2px solid red', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>Rechazar</button>
                <button onClick={()=>handleUpdateStatus('aprobado')} style={{flex:2, padding:'1rem', background:'green', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>Aprobar</button>
            </div>
          </div>
         )}
      </Modal>
    </div>
  )
}

export default EngineerDashboard
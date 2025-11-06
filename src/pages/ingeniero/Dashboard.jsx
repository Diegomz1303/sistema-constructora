// src/pages/ingeniero/EngineerDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'

const EngineerDashboard = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')
  
  // Estados solo para tickets
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [responseText, setResponseText] = useState('')

  const fetchAllTickets = async () => {
    setLoading(true)
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false })
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Toaster position="top-center" />
      
      {/* --- HEADER LIMPIO (SIN BOTONES) --- */}
      <header style={{ marginBottom: '2rem' }}>
         <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '1.8rem' }}>Centro de Control</h1>
         <p style={{ color: '#7f8c8d', margin: '0.5rem 0 0 0' }}>Bienvenido, Ingeniero.</p>
      </header>

      {/* --- ESTADÍSTICAS (NUEVO DISEÑO) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Tarjeta Pendientes */}
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Pendientes</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#e67e22', fontWeight:'bold'}}>
               {tickets.filter(t => t.status === 'pendiente').length}
             </p>
          </div>
          {/* Tarjeta Aprobados */}
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>En Proceso</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#27ae60', fontWeight:'bold'}}>
               {tickets.filter(t => t.status === 'aprobado').length}
             </p>
          </div>
          {/* Tarjeta Total */}
           <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Total Tickets</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#2c3e50', fontWeight:'bold'}}>
               {tickets.length}
             </p>
          </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {['pendiente', 'aprobado', 'rechazado', 'todos'].map(status => (
           <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.6rem 1.2rem', borderRadius: '30px', border: 'none', background: filter === status ? '#2c3e50' : 'white', color: filter === status ? 'white' : '#7f8c8d', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize', boxShadow: filter === status ? '0 4px 12px rgba(44,62,80,0.2)' : '0 2px 5px rgba(0,0,0,0.05)', transition:'all 0.2s' }}>
             {status}
           </button>
        ))}
      </div>

      {/* Lista de Tickets */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Cargando...</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8f9fa', borderRadius: '16px', color: '#b0bec5' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            <p style={{ margin: 0 }}>No hay tickets en esta vista.</p>
        </div>
      ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} onViewDetails={() => { setSelectedTicket(ticket); setIsDetailsOpen(true) }} onApprove={() => { setSelectedTicket(ticket); setResponseText(''); setIsResponseOpen(true) }} />
            ))}
         </div>
      )}

      {/* Modal Detalles + Chat */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Detalles del Reporte">
         {selectedTicket && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h3 style={{margin:0, color:'#2c3e50'}}>{selectedTicket.title}</h3>
            {selectedTicket.image_url && (<a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer"><img src={selectedTicket.image_url} alt="Evidencia" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border:'1px solid #eee' }} /></a>)}
            <p style={{background:'#f8f9fa', padding:'1rem', borderRadius:'8px', margin:0, lineHeight:1.5}}>{selectedTicket.description}</p>
            {selectedTicket.engineer_response && <div style={{background:'#e8f5e9', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid #27ae60'}}><strong>Respuesta Oficial:</strong><p style={{margin:'0.5rem 0 0 0'}}>{selectedTicket.engineer_response}</p></div>}
            <TicketChat ticketId={selectedTicket.id} />
            <button onClick={()=>setIsDetailsOpen(false)} style={{width:'100%', marginTop:'1rem', padding:'0.8rem', border:'none', background:'#f1f3f5', borderRadius:'8px', cursor:'pointer', fontWeight:'600', color:'#546e7a'}}>Cerrar Ventana</button>
          </div>
         )}
      </Modal>

      {/* Modal Respuesta */}
      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} title="📣 Resolución Oficial">
         {selectedTicket && (
          <div>
            <p style={{color:'#7f8c8d', marginBottom:'1rem'}}>Resolviendo: <strong>{selectedTicket.title}</strong></p>
            <textarea value={responseText} onChange={e=>setResponseText(e.target.value)} rows={5} style={{width:'100%', padding:'1rem', borderRadius:'12px', border:'1px solid #e0e0e0', marginBottom:'1.5rem', fontFamily:'inherit', resize:'vertical'}} placeholder="Escribe aquí la resolución..."></textarea>
            <div style={{display:'flex', gap:'1rem'}}>
                <button onClick={()=>handleUpdateStatus('rechazado')} style={{flex:1, padding:'1rem', background:'white', color:'#e74c3c', border:'2px solid #e74c3c', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>❌ Rechazar</button>
                <button onClick={()=>handleUpdateStatus('aprobado')} style={{flex:2, padding:'1rem', background:'#27ae60', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>✅ Aprobar Solicitud</button>
            </div>
          </div>
         )}
      </Modal>
    </div>
  )
}

export default EngineerDashboard
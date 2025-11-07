// src/pages/ingeniero/Dashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'
import { UserCog } from 'lucide-react' // Icono para derivar

const Dashboard = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [engineers, setEngineers] = useState([]) // Lista de ingenieros para derivar
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')

  // Estados para modales
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [isDeriveOpen, setIsDeriveOpen] = useState(false) // Nuevo modal para derivar
  const [responseText, setResponseText] = useState('')

  // Función para cargar tickets
  const fetchAllTickets = async () => {
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'todos') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query
    if (!error && data) setTickets(data)
    setLoading(false)
  }

  // Cargar lista de ingenieros al inicio
  useEffect(() => {
    const fetchEngineers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'ingeniero')
        .neq('id', user?.id) // Opcional: excluirse a uno mismo de la lista de derivación
      if (data) setEngineers(data)
    }
    if (user) fetchEngineers()
  }, [user])

  // Tiempo real
  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchAllTickets()

    const channel = supabase
      .channel('realtime tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchAllTickets()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [filter, user])

  // Manejar la aprobación/rechazo
  const handleUpdateStatus = async (newStatus) => {
    if (!responseText.trim() && newStatus === 'rechazado') return toast.error('Indica el motivo')
    const toastId = toast.loading('Actualizando ticket...')
    const { error } = await supabase.from('tickets').update({ status: newStatus, engineer_response: responseText }).eq('id', selectedTicket.id)

    if (error) toast.error('Error', { id: toastId })
    else {
      toast.success(`Ticket ${newStatus}`, { id: toastId })
      setIsResponseOpen(false)
      setResponseText('')
    }
  }

  // NUEVA FUNCIÓN: Derivar ticket
  const handleDeriveTicket = async (newEngineerId) => {
    if (!newEngineerId) return
    const toastId = toast.loading('Derivando ticket...')
    
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to: newEngineerId }) // Actualizamos el responsable
      .eq('id', selectedTicket.id)

    if (error) {
      toast.error('Error al derivar', { id: toastId })
    } else {
      toast.success('Ticket derivado correctamente', { id: toastId })
      setIsDeriveOpen(false)
      setIsDetailsOpen(false) // Cerramos también el detalle
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <Toaster position="top-center" />
      
      <header style={{ marginBottom: '2rem' }}>
         <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '1.8rem' }}>Centro de Control</h1>
         <p style={{ color: '#7f8c8d', margin: '0.5rem 0 0 0' }}>Bienvenido, Ingeniero.</p>
      </header>

      {/* Filtros y Estadísticas (simplificado para ahorrar espacio aquí, es igual al anterior) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {['pendiente', 'aprobado', 'rechazado', 'todos'].map(status => (
           <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.6rem 1.2rem', borderRadius: '30px', border: 'none', background: filter === status ? '#2c3e50' : 'white', color: filter === status ? 'white' : '#7f8c8d', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize', boxShadow: filter === status ? '0 4px 12px rgba(44,62,80,0.2)' : '0 2px 5px rgba(0,0,0,0.05)', transition:'all 0.2s', whiteSpace: 'nowrap' }}>
             {status}
           </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Cargando tickets...</div>
      ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {tickets.map(ticket => (
              <TicketCard 
                key={ticket.id} ticket={ticket} 
                onViewDetails={() => { setSelectedTicket(ticket); setIsDetailsOpen(true) }} 
                onApprove={() => { setSelectedTicket(ticket); setIsResponseOpen(true) }} 
              />
            ))}
         </div>
      )}

      {/* MODAL DETALLES (Actualizado con botón de derivar) */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Detalles del Reporte">
         {selectedTicket && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {/* Header del modal con botón Derivar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
               <h3 style={{margin:0, color:'#2c3e50', fontSize:'1.2rem'}}>{selectedTicket.title}</h3>
               <button 
                 onClick={() => setIsDeriveOpen(true)}
                 style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: '600' }}
                 title="Derivar a otro ingeniero"
               >
                 <UserCog size={16} /> Derivar
               </button>
            </div>
            
            {/* ... (resto de detalles: imagen, descripción, chat) ... */}
            {selectedTicket.image_url && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                <a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer">
                  <img src={selectedTicket.image_url} alt="Evidencia" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
                </a>
              </div>
            )}
            <p style={{background:'#f8f9fa', padding:'1rem', borderRadius:'8px', margin:0, lineHeight:1.5, color:'#2c3e50'}}>{selectedTicket.description}</p>
            <TicketChat ticketId={selectedTicket.id} />
          </div>
         )}
      </Modal>

      {/* NUEVO MODAL: Derivar Ticket */}
      <Modal isOpen={isDeriveOpen} onClose={() => setIsDeriveOpen(false)} title="↪️ Derivar Ticket">
        <div>
           <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Selecciona el ingeniero al que deseas transferir este reporte.</p>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             {engineers.length > 0 ? engineers.map(eng => (
               <button 
                 key={eng.id}
                 onClick={() => handleDeriveTicket(eng.id)}
                 style={{ padding: '1rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                 onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
               >
                 <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '50%' }}>👷‍♂️</div>
                 <span style={{ fontWeight: '500', color: '#1e293b' }}>{eng.email ? eng.email.split('@')[0] : 'Ingeniero'}</span>
               </button>
             )) : (
               <p>No hay otros ingenieros disponibles.</p>
             )}
           </div>
        </div>
      </Modal>

      {/* MODAL RESPUESTA (Sin cambios) */}
      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} title="📣 Resolución Oficial">
         {selectedTicket && (
          <div>
            <textarea value={responseText} onChange={e=>setResponseText(e.target.value)} rows={4} style={{width:'100%', padding:'1rem', borderRadius:'12px', border:'2px solid #e2e8f0', marginBottom:'1.5rem', fontFamily:'inherit', resize:'vertical', fontSize:'1rem'}} placeholder="Respuesta oficial..." />
            <div style={{display:'flex', gap:'1rem'}}>
                <button onClick={()=>handleUpdateStatus('rechazado')} style={{flex:1, padding:'1rem', background:'white', color:'#e74c3c', border:'2px solid #e74c3c', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>❌ Rechazar</button>
                <button onClick={()=>handleUpdateStatus('aprobado')} style={{flex:2, padding:'1rem', background:'#27ae60', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>✅ Aprobar</button>
            </div>
          </div>
         )}
      </Modal>
    </div>
  )
}

export default Dashboard
// src/pages/ingeniero/Dashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')

  // Estados para modales
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [responseText, setResponseText] = useState('')

  // Función para cargar tickets (se usa al inicio y en cada cambio en tiempo real)
  const fetchAllTickets = async () => {
    // No ponemos setLoading(true) aquí para evitar parpadeos en actualizaciones en tiempo real
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'todos') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error cargando tickets:', error.message)
      toast.error('Error de conexión')
    } else {
      setTickets(data || [])
    }
    setLoading(false) // Solo desactivamos loading la primera vez
  }

  // --- EFECTO DE TIEMPO REAL ---
  useEffect(() => {
    if (!user) return

    // 1. Carga inicial
    setLoading(true)
    fetchAllTickets()

    // 2. Suscripción a TODOS los cambios en la tabla 'tickets'
    console.log("🔌 Conectando a tiempo real...")
    const channel = supabase
      .channel('dashboard-ingeniero-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          console.log('🔔 Cambio detectado en DB:', payload.eventType)
          // Si hay un cambio, recargamos los datos silenciosamente
          fetchAllTickets()
          // Opcional: Mostrar una pequeña notificación
          if (payload.eventType === 'INSERT') {
            toast('Nuevo ticket recibido', { icon: '📨', duration: 3000 })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
           console.log('✅ Suscripción activa')
        }
      })

    // 3. Limpieza al salir del dashboard
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, filter]) // Se reinicia si cambia el usuario o el filtro activo

  // Manejar la aprobación/rechazo
  const handleUpdateStatus = async (newStatus) => {
    if (!responseText.trim() && newStatus === 'rechazado') {
      return toast.error('Debes indicar el motivo del rechazo')
    }

    const toastId = toast.loading('Actualizando ticket...')
    const { error } = await supabase
      .from('tickets')
      .update({
        status: newStatus,
        engineer_response: responseText,
        // Opcional: podrías guardar quién lo aprobó si tuvieras ese campo
        // engineer_id: user.id 
      })
      .eq('id', selectedTicket.id)

    if (error) {
      toast.error('Error al actualizar: ' + error.message, { id: toastId })
    } else {
      toast.success(`Ticket ${newStatus.toUpperCase()}`, { id: toastId })
      setIsResponseOpen(false)
      setResponseText('')
      // No hace falta llamar a fetchAllTickets() aquí porque
      // el evento de tiempo real (UPDATE) lo hará automáticamente ;)
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <Toaster position="top-center" />
      
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
         <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '1.8rem' }}>Centro de Control</h1>
         <p style={{ color: '#7f8c8d', margin: '0.5rem 0 0 0' }}>Bienvenido, Ingeniero.</p>
      </header>

      {/* Estadísticas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Pendientes</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#e67e22', fontWeight:'bold'}}>
               {tickets.filter(t => t.status === 'pendiente').length}
             </p>
          </div>
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>En Proceso</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#27ae60', fontWeight:'bold'}}>
               {tickets.filter(t => t.status === 'aprobado').length}
             </p>
          </div>
           <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Total Visualizados</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#2c3e50', fontWeight:'bold'}}>
               {tickets.length}
             </p>
          </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {['pendiente', 'aprobado', 'rechazado', 'todos'].map(status => (
           <button 
             key={status} 
             onClick={() => setFilter(status)} 
             style={{ 
               padding: '0.6rem 1.2rem', 
               borderRadius: '30px', 
               border: 'none', 
               background: filter === status ? '#2c3e50' : 'white', 
               color: filter === status ? 'white' : '#7f8c8d', 
               cursor: 'pointer', 
               fontWeight: '600', 
               textTransform: 'capitalize', 
               boxShadow: filter === status ? '0 4px 12px rgba(44,62,80,0.2)' : '0 2px 5px rgba(0,0,0,0.05)', 
               transition:'all 0.2s',
               whiteSpace: 'nowrap'
             }}
           >
             {status}
           </button>
        ))}
      </div>

      {/* Lista de Tickets */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          Cargando tickets en tiempo real...
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8f9fa', borderRadius: '16px', color: '#b0bec5' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
            <p style={{ margin: 0 }}>No hay tickets en esta vista.</p>
        </div>
      ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {tickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onViewDetails={() => { setSelectedTicket(ticket); setIsDetailsOpen(true) }} 
                onApprove={() => { setSelectedTicket(ticket); setIsResponseOpen(true) }} 
              />
            ))}
         </div>
      )}

      {/* MODAL 1: Detalles */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Detalles del Reporte">
         {selectedTicket && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h3 style={{margin:0, color:'#2c3e50', fontSize:'1.2rem'}}>{selectedTicket.title}</h3>
            
            {selectedTicket.image_url && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                <a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={selectedTicket.image_url} 
                    alt="Evidencia" 
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} 
                  />
                </a>
              </div>
            )}
            
            <div style={{background:'#f8f9fa', padding:'1rem', borderRadius:'8px'}}>
              <h4 style={{margin:'0 0 0.5rem 0', fontSize:'0.9rem', color:'#7f8c8d'}}>Descripción:</h4>
              <p style={{margin:0, lineHeight:1.5, color:'#2c3e50'}}>{selectedTicket.description}</p>
            </div>

            {selectedTicket.engineer_response && (
              <div style={{background:'#e8f5e9', padding:'1rem', borderRadius:'8px', borderLeft:'4px solid #27ae60'}}>
                <h4 style={{margin:'0 0 0.5rem 0', fontSize:'0.9rem', color:'#1b5e20'}}>Respuesta Oficial:</h4>
                <p style={{margin:0, color:'#2e7d32'}}>{selectedTicket.engineer_response}</p>
              </div>
            )}
            
            <TicketChat ticketId={selectedTicket.id} />
            
            <button 
              onClick={()=>setIsDetailsOpen(false)} 
              style={{width:'100%', padding:'0.8rem', border:'none', background:'#f1f3f5', borderRadius:'8px', cursor:'pointer', fontWeight:'600', color:'#546e7a'}}
            >
              Cerrar Ventana
            </button>
          </div>
         )}
      </Modal>

      {/* MODAL 2: Respuesta/Aprobación */}
      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} title="📣 Resolución Oficial">
         {selectedTicket && (
          <div>
            <p style={{color:'#546e7a', marginBottom:'1rem', fontSize:'0.95rem'}}>
              Vas a resolver el ticket: <strong style={{color:'#2c3e50'}}>{selectedTicket.title}</strong>
            </p>
            
            <textarea 
              value={responseText} 
              onChange={e=>setResponseText(e.target.value)} 
              rows={4} 
              style={{
                width:'100%', padding:'1rem', borderRadius:'12px', 
                border:'2px solid #e2e8f0', marginBottom:'1.5rem', 
                fontFamily:'inherit', resize:'vertical', fontSize:'1rem'
              }} 
              placeholder="Escribe aquí la respuesta oficial para el trabajador..."
            />
            
            <div style={{display:'flex', gap:'1rem'}}>
                <button 
                  onClick={()=>handleUpdateStatus('rechazado')} 
                  style={{flex:1, padding:'1rem', background:'white', color:'#e74c3c', border:'2px solid #e74c3c', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', transition:'all 0.2s'}}
                  onMouseOver={(e) => e.target.style.background = '#fff5f5'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  ❌ Rechazar
                </button>
                <button 
                  onClick={()=>handleUpdateStatus('aprobado')} 
                  style={{flex:2, padding:'1rem', background:'#27ae60', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(39, 174, 96, 0.3)', transition:'all 0.2s'}}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ✅ Aprobar Solicitud
                </button>
            </div>
          </div>
         )}
      </Modal>
    </div>
  )
}

export default Dashboard
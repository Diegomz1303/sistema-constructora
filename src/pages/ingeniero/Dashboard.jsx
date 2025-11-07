// src/pages/ingeniero/Dashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'
import { UserCog, CheckCircle, Search, FilterX } from 'lucide-react' // --- NUEVO --- Importamos iconos de búsqueda y limpiar

const STATUS_FILTERS = ['pendiente', 'visto', 'en proceso', 'completado', 'rechazado', 'todos']

const Dashboard = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [engineers, setEngineers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')
  const [stats, setStats] = useState({ pending: 0, visto: 0, processing: 0, completed: 0 })

  // --- NUEVO --- Estados para Filtros Avanzados
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('todas')
  const [typeFilter, setTypeFilter] = useState('todos')

  // Estados para modales
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [isDeriveOpen, setIsDeriveOpen] = useState(false)
  const [responseText, setResponseText] = useState('')

  // Función para cargar tickets (SIN CAMBIOS)
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

  // Función para cargar estadísticas (SIN CAMBIOS)
  const fetchStats = async () => {
    const { data, error } = await supabase.from('tickets').select('status')
    if (!error && data) {
      const pending = data.filter(t => t.status === 'pendiente').length
      const visto = data.filter(t => t.status === 'visto').length
      const processing = data.filter(t => t.status === 'en proceso').length
      const completed = data.filter(t => t.status === 'completado').length
      setStats({ pending, visto, processing, completed })
    }
  }

  useEffect(() => {
    const fetchEngineers = async () => {
      const { data } = await supabase.from('profiles').select('id, email').eq('role', 'ingeniero').neq('id', user?.id)
      if (data) setEngineers(data)
    }
    if (user) fetchEngineers()
  }, [user])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchAllTickets()
    fetchStats()
    const channel = supabase.channel('realtime tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchAllTickets()
        fetchStats()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [filter, user])

  const handleMarkAsVisto = async (ticket) => {
    if (ticket.status === 'pendiente') {
      await supabase.from('tickets').update({ status: 'visto' }).eq('id', ticket.id)
    }
  }

  const handleMarkAsCompleted = async (ticketId) => {
    const toastId = toast.loading('Marcando como completado...')
    const { error } = await supabase.from('tickets').update({ status: 'completado', engineer_response: responseText || 'Completado por el ingeniero.' }).eq('id', ticketId)
    if (error) toast.error('Error', { id: toastId })
    else {
      toast.success('Ticket completado', { id: toastId })
      setIsResponseOpen(false)
      setIsDetailsOpen(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!responseText.trim() && newStatus === 'rechazado') return toast.error('Indica el motivo')
    const toastId = toast.loading('Actualizando ticket...')
    const finalStatus = newStatus === 'aprobado' ? 'en proceso' : newStatus
    const { error } = await supabase.from('tickets').update({ status: finalStatus, engineer_response: responseText }).eq('id', selectedTicket.id)
    if (error) toast.error('Error', { id: toastId })
    else {
      toast.success(`Ticket ${finalStatus}`, { id: toastId })
      setIsResponseOpen(false)
      setResponseText('')
    }
  }

  const handleDeriveTicket = async (newEngineerId) => {
    if (!newEngineerId) return
    const toastId = toast.loading('Derivando ticket...')
    const { error } = await supabase.from('tickets').update({ assigned_to: newEngineerId }).eq('id', selectedTicket.id)
    if (error) toast.error('Error al derivar', { id: toastId })
    else {
      toast.success('Ticket derivado', { id: toastId })
      setIsDeriveOpen(false)
      setIsDetailsOpen(false)
    }
  }

  // --- NUEVO --- Lógica de filtrado en cliente
  const filteredTickets = tickets.filter(ticket => {
    // 1. Filtro de texto (título o descripción)
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    // 2. Filtro de Prioridad
    const matchesPriority = priorityFilter === 'todas' || ticket.priority === priorityFilter
    
    // 3. Filtro de Tipo
    const matchesType = typeFilter === 'todos' || ticket.type === typeFilter

    return matchesSearch && matchesPriority && matchesType
  })

  // --- NUEVO --- Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setPriorityFilter('todas')
    setTypeFilter('todos')
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <Toaster position="top-center" />
      
      <header style={{ marginBottom: '2rem' }}>
         <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '1.8rem' }}>Centro de Control</h1>
         <p style={{ color: '#7f8c8d', margin: '0.5rem 0 0 0' }}>Bienvenido, Ingeniero.</p>
      </header>

      {/* Panel de Estadísticas (KPIs) - SIN CAMBIOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Pendientes</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#e67e22', fontWeight:'bold'}}>{stats.pending}</p>
          </div>
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Visto</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#0288d1', fontWeight:'bold'}}>{stats.visto}</p>
          </div>
          <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>En Proceso</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#3949ab', fontWeight:'bold'}}>{stats.processing}</p>
          </div>
           <div style={{background:'white', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', textAlign:'center'}}>
             <h3 style={{margin:0, color:'#7f8c8d', fontSize:'0.8rem', textTransform:'uppercase'}}>Completados</h3>
             <p style={{margin:'0.5rem 0 0 0', fontSize:'2.5rem', color:'#27ae60', fontWeight:'bold'}}>{stats.completed}</p>
          </div>
      </div>

      {/* Filtros de Estado (Tabs) - SIN CAMBIOS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '5px' }}>
        {STATUS_FILTERS.map(status => (
           <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.6rem 1.2rem', borderRadius: '30px', border: 'none', background: filter === status ? '#2c3e50' : 'white', color: filter === status ? 'white' : '#7f8c8d', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize', boxShadow: filter === status ? '0 4px 12px rgba(44,62,80,0.2)' : '0 2px 5px rgba(0,0,0,0.05)', transition:'all 0.2s', whiteSpace: 'nowrap' }}>
             {status}
           </button>
        ))}
      </div>

      {/* --- NUEVO --- Barra de Herramientas de Filtrado Avanzado */}
      <div style={{ 
        display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
        background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
      }}>
        {/* Buscador */}
        <div style={{ flex: '2 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Buscar por título o descripción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
          />
        </div>
        
        {/* Filtro Prioridad */}
        <div style={{ flex: '1 1 150px' }}>
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer' }}
          >
            <option value="todas">⭐ Todas Prioridades</option>
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Media</option>
            <option value="baja">🟢 Baja</option>
          </select>
        </div>

        {/* Filtro Tipo */}
        <div style={{ flex: '1 1 150px' }}>
           <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer' }}
          >
            <option value="todos">📋 Todos Tipos</option>
            <option value="material">📦 Material</option>
            <option value="incidencia">⚠️ Incidencia</option>
            <option value="duda">❓ Duda</option>
          </select>
        </div>

        {/* Botón Limpiar */}
        {(searchTerm || priorityFilter !== 'todas' || typeFilter !== 'todos') && (
           <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.7rem 1rem', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
             <FilterX size={16} /> Limpiar
           </button>
        )}
      </div>

      {/* Lógica de renderizado (USANDO filteredTickets en lugar de tickets) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>Cargando tickets...</div>
      ) : filteredTickets.length === 0 ? (
         <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', color: '#b0bec5', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>
              {(searchTerm || priorityFilter !== 'todas' || typeFilter !== 'todos') ? '🔍' : '📭'}
            </span>
            <h3 style={{ margin: 0, color: '#546e7a' }}>
              {(searchTerm || priorityFilter !== 'todas' || typeFilter !== 'todos') ? 'Sin resultados' : 'Bandeja Vacía'}
            </h3>
            <p style={{ fontSize: '1rem', margin: '0.5rem 0 0 0' }}>
              {(searchTerm || priorityFilter !== 'todas' || typeFilter !== 'todos') 
                ? 'No hay tickets que coincidan con tus filtros.'
                : `No hay reportes en la vista de "${filter}".`
              }
            </p>
         </div>
      ) : (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onViewDetails={() => { 
                  setSelectedTicket(ticket); 
                  setIsDetailsOpen(true);
                  handleMarkAsVisto(ticket);
                }} 
                onApprove={() => { 
                  setSelectedTicket(ticket); 
                  setResponseText(ticket.engineer_response || '');
                  setIsResponseOpen(true);
                }} 
                onComplete={() => handleMarkAsCompleted(ticket.id)}
              />
            ))}
         </div>
      )}

      {/* Modales (SIN CAMBIOS) */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Detalles del Reporte">
         {selectedTicket && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
               <h3 style={{margin:0, color:'#2c3e50', fontSize:'1.2rem'}}>{selectedTicket.title}</h3>
               <button onClick={() => setIsDeriveOpen(true)} style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '0.5rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: '600' }} title="Derivar a otro ingeniero">
                 <UserCog size={16} /> Derivar
               </button>
            </div>
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

      <Modal isOpen={isDeriveOpen} onClose={() => setIsDeriveOpen(false)} title="↪️ Derivar Ticket">
        <div>
           <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Selecciona el ingeniero al que deseas transferir este reporte.</p>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             {engineers.length > 0 ? engineers.map(eng => (
               <button key={eng.id} onClick={() => handleDeriveTicket(eng.id)} style={{ padding: '1rem', border: '1px solid #e2e8f0', background: 'white', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                 <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '50%' }}>👷‍♂️</div>
                 <span style={{ fontWeight: '500', color: '#1e293b' }}>{eng.email ? eng.email.split('@')[0] : 'Ingeniero'}</span>
               </button>
             )) : ( <p>No hay otros ingenieros disponibles.</p> )}
           </div>
        </div>
      </Modal>

      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} title="📣 Resolución Oficial">
         {selectedTicket && (
          <div>
            <textarea value={responseText} onChange={e=>setResponseText(e.target.value)} rows={4} style={{width:'100%', padding:'1rem', borderRadius:'12px', border:'2px solid #e2e8f0', marginBottom:'1.5rem', fontFamily:'inherit', resize:'vertical', fontSize:'1rem'}} placeholder="Respuesta oficial (opcional si solo aprueba)..." />
            <div style={{display:'flex', gap:'1rem'}}>
                <button onClick={()=>handleUpdateStatus('rechazado')} style={{flex:1, padding:'1rem', background:'white', color:'#e74c3c', border:'2px solid #e74c3c', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>❌ Rechazar</button>
                <button onClick={()=>handleUpdateStatus('aprobado')} style={{flex:2, padding:'1rem', background:'#007bff', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>Aprobar (Marcar 'En Proceso')</button>
            </div>
            {selectedTicket.status === 'en proceso' && (
              <button onClick={() => handleMarkAsCompleted(selectedTicket.id)} style={{width: '100%', marginTop: '1rem', padding:'1rem', background:'#28a745', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <CheckCircle size={20} /> Marcar como Completado
              </button>
            )}
          </div>
         )}
      </Modal>
    </div>
  )
}

export default Dashboard
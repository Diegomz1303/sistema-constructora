// src/pages/ingeniero/EngineerDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import TicketChat from '../../components/tickets/TicketChat'
import { Toaster, toast } from 'react-hot-toast'

// --- CLIENTE ADMIN PARA CREAR USUARIOS ---
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const EngineerDashboard = () => {
  const { user, signOut } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')
  
  // Estados para modales de tickets
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [responseText, setResponseText] = useState('')

  // Estados para modal de usuarios
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [newUserLoading, setNewUserLoading] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'trabajador'
  })

  // --- FUNCIÓN 1: CARGAR TICKETS ---
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

  // --- FUNCIÓN 2: RESPONDER TICKET ---
  const handleUpdateStatus = async (newStatus) => {
    if (!responseText.trim() && newStatus === 'rechazado') return toast.error('Indica el motivo del rechazo')
    const toastId = toast.loading('Actualizando...')
    await supabase.from('tickets').update({ status: newStatus, engineer_response: responseText }).eq('id', selectedTicket.id)
    toast.success(`Ticket ${newStatus.toUpperCase()}`, { id: toastId })
    setIsResponseOpen(false)
    fetchAllTickets()
  }

  // --- FUNCIÓN 3: CREAR USUARIO ---
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setNewUserLoading(true)
    const toastId = toast.loading('Creando usuario...')

    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        email_confirm: true,
      })
      if (userError) throw userError

      if (newUserForm.role === 'ingeniero' && userData.user) {
        await supabaseAdmin.from('profiles').update({ role: 'ingeniero' }).eq('id', userData.user.id)
      }

      toast.success(`✅ Usuario ${newUserForm.email} creado`, { id: toastId })
      setIsUserModalOpen(false)
      setNewUserForm({ email: '', password: '', role: 'trabajador' })
    } catch (error) {
      console.error(error)
      toast.error('Error: ' + error.message, { id: toastId })
    } finally {
      setNewUserLoading(false)
    }
  }

  const handleNewUserChange = (e) => {
    setNewUserForm({ ...newUserForm, [e.target.name]: e.target.value })
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <Toaster position="top-center" />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <div>
           <h2 style={{ color: '#d35400', margin: 0 }}>🏗️ Centro de Control</h2>
           <p style={{ margin: 0, color: '#7f8c8d' }}>Ingeniero: {user.email.split('@')[0]}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsUserModalOpen(true)} style={{ padding: '0.7rem', background: '#34495e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>👥 Personal</button>
            <button onClick={signOut} style={{ padding: '0.7rem', border: '1px solid #e74c3c', background: 'white', color: '#e74c3c', borderRadius: '8px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </div>
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
            {selectedTicket.image_url && (<a href={selectedTicket.image_url} target="_blank" rel="noopener noreferrer"><img src={selectedTicket.image_url} alt="Evidencia" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px' }} /></a>)}
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

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="👥 Crear Nuevo Personal">
         <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div><label style={{display:'block',fontWeight:'500',marginBottom:'0.5rem'}}>Correo</label><input type="email" name="email" value={newUserForm.email} onChange={handleNewUserChange} required style={{width:'100%',padding:'0.8rem',borderRadius:'8px',border:'1px solid #ccc'}}/></div>
           <div><label style={{display:'block',fontWeight:'500',marginBottom:'0.5rem'}}>Contraseña</label><input type="text" name="password" value={newUserForm.password} onChange={handleNewUserChange} required minLength={6} style={{width:'100%',padding:'0.8rem',borderRadius:'8px',border:'1px solid #ccc',fontFamily:'monospace'}}/></div>
           <div><label style={{display:'block',fontWeight:'500',marginBottom:'0.5rem'}}>Rol</label><select name="role" value={newUserForm.role} onChange={handleNewUserChange} style={{width:'100%',padding:'0.8rem',borderRadius:'8px',border:'1px solid #ccc',backgroundColor:'white'}}><option value="trabajador">👷‍♂️ Trabajador</option><option value="ingeniero">🏗️ Ingeniero</option></select></div>
           <button type="submit" disabled={newUserLoading} style={{marginTop:'1rem',padding:'1rem',background:'#3498db',color:'white',border:'none',borderRadius:'8px',fontWeight:'bold',cursor:newUserLoading?'not-allowed':'pointer'}}>{newUserLoading?'Creando...':'✨ Crear Usuario'}</button>
         </form>
      </Modal>
    </div>
  )
}

export default EngineerDashboard
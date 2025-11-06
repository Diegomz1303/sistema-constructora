// src/pages/ingeniero/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import TicketCard from '../../components/tickets/TicketCard'
import Modal from '../../components/common/Modal'
import { Toaster, toast } from 'react-hot-toast' // Importamos Toaster para feedback

const Dashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pendiente')

  // ESTADOS PARA LOS MODALES
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isResponseOpen, setIsResponseOpen] = useState(false)
  const [responseText, setResponseText] = useState('') // Para lo que escribe el ing.

  // Cargar tickets
  const fetchTickets = async () => {
    setLoading(true)
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'todos') query = query.eq('status', filter)

    const { data, error } = await query
    if (error) console.error('Error loading tickets:', error)
    else setTickets(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [filter])

  // Abrir modal de DETALLES
  const openDetails = (ticket) => {
    setSelectedTicket(ticket)
    setIsDetailsOpen(true)
  }

  // Abrir modal de RESPUESTA
  const openResponse = (ticket) => {
    setSelectedTicket(ticket)
    setResponseText('') // Limpiamos el texto anterior
    setIsResponseOpen(true)
  }

  // --- FUNCIÓN PRINCIPAL: ACTUALIZAR EL TICKET ---
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return

    // Validar que si rechaza, escriba un motivo
    if (newStatus === 'rechazado' && !responseText.trim()) {
      toast.error('Si rechazas, debes indicar el motivo.')
      return
    }

    const toastId = toast.loading('Actualizando ticket...')

    const { error } = await supabase
      .from('tickets')
      .update({
        status: newStatus,
        engineer_response: responseText // Guardamos lo que escribió el ing
      })
      .eq('id', selectedTicket.id)

    if (error) {
      toast.error('Error al actualizar', { id: toastId })
    } else {
      toast.success(`Ticket ${newStatus.toUpperCase()} correctamente`, { id: toastId })
      setIsResponseOpen(false) // Cerrar modal
      fetchTickets() // Recargar la lista para que desaparezca de "pendientes"
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1rem 5rem 1rem' }}>
      <Toaster position="top-center" />
      
      {/* --- HEADER --- */}
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
        <div style={{ flex: '1 1 auto' }}>
           <h2 style={{ color: '#2c3e50', margin: 0, fontSize: '1.8rem' }}>🏗️ Centro de Control</h2>
           <p style={{ margin: '0.2rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Usuario: <strong>{user.email.split('@')[0]}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
             <button onClick={() => navigate('/crear-ticket')} style={{ padding: '0.7rem 1.2rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(46,204,113,0.2)' }}>
              <span>➕</span> <span style={{ display: 'inline-block' }}>Nuevo Reporte</span>
            </button>
            <button onClick={signOut} style={{ padding: '0.7rem', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Salir
            </button>
        </div>
      </header>

      {/* --- FILTROS --- */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
        {['pendiente', 'aprobado', 'rechazado', 'todos'].map(status => (
            <button key={status} onClick={() => setFilter(status)} style={{ padding: '0.6rem 1.2rem', borderRadius: '30px', border: 'none', background: filter === status ? '#3498db' : 'white', color: filter === status ? 'white' : '#546e7a', cursor: 'pointer', fontWeight: '600', textTransform: 'capitalize', boxShadow: filter === status ? '0 4px 6px rgba(52,152,219,0.2)' : '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s ease', flex: '1 1 auto' }}>
                {status}
            </button>
        ))}
      </div>

      {/* --- GRID DE TICKETS --- */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Cargando...</div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', color: '#b0bec5', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📭</span>
            <p style={{ fontSize: '1.2rem', margin: 0 }}>No hay tickets en esta bandeja.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {tickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  onViewDetails={() => openDetails(ticket)}
                  onApprove={() => openResponse(ticket)}
                />
            ))}
        </div>
      )}

      {/* --- MODAL 1: SOLO VER DETALLES --- */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="📝 Detalles del Reporte">
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>{selectedTicket.title}</h3>
            <p style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedTicket.description}</p>
            
            {/* Si ya tiene respuesta del ingeniero, la mostramos aquí */}
            {selectedTicket.engineer_response && (
               <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2ecc71' }}>
                 <strong style={{ color: '#2e7d32' }}>👷‍♂️ Respuesta del Ingeniero:</strong>
                 <p style={{ margin: '0.5rem 0 0 0', color: '#1b5e20' }}>{selectedTicket.engineer_response}</p>
               </div>
            )}

            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
               <button onClick={() => setIsDetailsOpen(false)} style={{ padding: '0.8rem 1.5rem', background: '#ecf0f1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL 2: RESPONDER (APROBAR/RECHAZAR) --- */}
      <Modal isOpen={isResponseOpen} onClose={() => setIsResponseOpen(false)} title="📣 Responder Solicitud">
        {selectedTicket && (
          <div>
            <p style={{ color: '#7f8c8d', marginBottom: '1rem' }}>
              Estás respondiendo a: <strong>{selectedTicket.title}</strong>
            </p>

            <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#2c3e50' }}>
              Nota de respuesta (Opcional si apruebas, obligatoria si rechazas):
            </label>
            <textarea
              rows="4"
              placeholder="Ej: Compra autorizada, coordinar con logística para envío mañana a primera hora."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'inherit', marginBottom: '1.5rem', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* BOTÓN RECHAZAR */}
              <button
                onClick={() => handleUpdateStatus('rechazado')}
                style={{ flex: 1, padding: '1rem', background: '#fff', color: '#e74c3c', border: '2px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                ❌ Rechazar
              </button>
              {/* BOTÓN APROBAR */}
              <button
                onClick={() => handleUpdateStatus('aprobado')}
                style={{ flex: 2, padding: '1rem', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
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
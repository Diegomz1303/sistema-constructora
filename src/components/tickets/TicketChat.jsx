// src/components/tickets/TicketChat.jsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'

const TicketChat = ({ ticketId }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null) // Para hacer scroll automático al último mensaje

  // 1. Cargar historial inicial y suscribirse a nuevos mensajes
  useEffect(() => {
    // a) Cargar historial existente
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }
    fetchHistory()

    // b) Activar el "oído" para mensajes nuevos en tiempo real 👂
    const channel = supabase
      .channel(`chat_room_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          // ¡Llegó un mensaje nuevo! Lo agregamos a la lista
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    // Limpieza al cerrar el chat
    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  // 2. Hacer scroll hacia abajo cuando llega un mensaje nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const textToSend = newMessage
    setNewMessage('') // Limpiar input rápido para sensación de velocidad

    await supabase
      .from('ticket_messages')
      .insert([
        { ticket_id: ticketId, user_email: user.email, message: textToSend }
      ])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #eee', borderRadius: '8px', marginTop: '1.5rem' }}>
      
      {/* HEADER DEL CHAT */}
      <div style={{ padding: '0.8rem', background: '#f8f9fa', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#546e7a' }}>
        💬 Chat del Reporte
      </div>

      {/* ÁREA DE MENSAJES (Scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f9f9f9' }}>
        {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#ccc', fontSize: '0.9rem' }}>No hay mensajes aún. ¡Inicia la conversación!</p>
        ) : (
            messages.map((msg) => {
              const isMe = msg.user_email === user.email
              return (
                <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ 
                      padding: '0.6rem 1rem', 
                      borderRadius: '12px', 
                      background: isMe ? '#007bff' : 'white', 
                      color: isMe ? 'white' : '#333',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      borderTopRightRadius: isMe ? '2px' : '12px',
                      borderTopLeftRadius: isMe ? '12px' : '2px'
                  }}>
                    {msg.message}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#999', marginLeft: '0.5rem', display: 'block', marginTop: '2px', textAlign: isMe ? 'right' : 'left' }}>
                    {isMe ? 'Tú' : msg.user_email.split('@')[0]}
                  </span>
                </div>
              )
            })
        )}
        <div ref={messagesEndRef} /> {/* Elemento invisible para el autoscroll */}
      </div>

      {/* INPUT PARA ESCRIBIR */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '0.8rem', borderTop: '1px solid #eee', background: 'white', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, padding: '0.8rem', border: '1px solid #ddd', borderRadius: '20px', marginRight: '0.5rem', outline: 'none' }}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          style={{ background: '#2ecc71', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
        >
          ➤
        </button>
      </form>

    </div>
  )
}

export default TicketChat
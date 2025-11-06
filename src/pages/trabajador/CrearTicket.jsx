// src/pages/trabajador/CrearTicket.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import { Toaster, toast } from 'react-hot-toast'

const CrearTicket = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    type: 'material'
  })

  // Maneja los cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Envía los datos a Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()

    // 1. Validaciones simples
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('⚠️ El título y la descripción son obligatorios.')
      return
    }

    setLoading(true)

    // 2. Insertar en la tabla 'tickets'
    const { error } = await supabase
      .from('tickets')
      .insert([
        {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          type: formData.type,
          status: 'pendiente',     // Siempre empieza como pendiente
          user_email: user.email   // Guardamos quién lo hizo
        }
      ])

    if (error) {
      console.error('Error Supabase:', error)
      toast.error('❌ Error al guardar: ' + error.message)
    } else {
      toast.success('✅ ¡Reporte enviado a oficina!')
      // Esperamos un poco para que el usuario lea el mensaje antes de redirigir
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="login-container" style={{ alignItems: 'flex-start', padding: '2rem 1rem' }}>
      <Toaster position="top-center" />

      <div className="login-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📝</span> Nuevo Reporte
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Tipo de Reporte */}
          <div>
            <label style={{ fontWeight: '500', color: '#34495e', display: 'block', marginBottom: '0.5rem' }}>¿Qué deseas reportar?</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {['material', 'incidencia', 'duda'].map((tipo) => (
                <label key={tipo} style={{
                  flex: 1, minWidth: '100px', padding: '0.8rem',
                  border: formData.type === tipo ? '2px solid #3498db' : '1px solid #ddd',
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                  backgroundColor: formData.type === tipo ? '#ebf5fb' : 'white',
                  fontWeight: formData.type === tipo ? 'bold' : 'normal',
                  textTransform: 'capitalize'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value={tipo}
                    checked={formData.type === tipo}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  {tipo === 'material' ? '📦 ' : tipo === 'incidencia' ? '⚠️ ' : '❓ '}
                  {tipo}
                </label>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#34495e' }}>Asunto Breve *</label>
            <input
              type="text"
              name="title"
              className="login-input"
              placeholder="Ej: Falta acero de 3/8 en zona norte"
              value={formData.title}
              onChange={handleChange}
              maxLength={50}
            />
          </div>

          {/* Prioridad */}
          <div>
            <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#34495e' }}>Nivel de Urgencia</label>
            <select
              name="priority"
              className="login-input"
              value={formData.priority}
              onChange={handleChange}
              style={{ backgroundColor: 'white' }}
            >
              <option value="baja">🟢 Baja (Puede esperar)</option>
              <option value="media">🟡 Media (Normal)</option>
              <option value="alta">🔴 Alta (¡Detiene la obra!)</option>
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#34495e' }}>Detalles *</label>
            <textarea
              name="description"
              className="login-input"
              rows="4"
              placeholder="Describe ubicación exacta, cantidad necesaria o detalles del problema..."
              value={formData.description}
              onChange={handleChange}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{ flex: 1, padding: '1rem', border: 'none', background: '#ecf0f1', color: '#7f8c8d', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="login-button"
              style={{ flex: 2 }}
            >
              {loading ? 'Enviando...' : 'Enviar Reporte 🚀'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CrearTicket
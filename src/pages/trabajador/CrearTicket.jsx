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

  // Estado para el archivo de imagen
  const [imageFile, setImageFile] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    type: 'material'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Manejar la selección de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('⚠️ Título y descripción son obligatorios.')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Enviando reporte...')

    try {
      let finalImageUrl = null

      // 1. SI HAY FOTO, LA SUBIMOS PRIMERO
      if (imageFile) {
        toast.loading('Subiendo foto...', { id: toastId })
        
        // Crear un nombre único para el archivo: "idUsuario-timestamp-nombreOriginal"
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        // Subir a Supabase Storage (bucket 'evidencia')
        const { error: uploadError } = await supabase.storage
          .from('evidencia')
          .upload(filePath, imageFile)

        if (uploadError) {
          throw new Error('Error subiendo imagen: ' + uploadError.message)
        }

        // Obtener la URL pública para guardarla en la BD
        const { data: { publicUrl } } = supabase.storage
          .from('evidencia')
          .getPublicUrl(filePath)
        
        finalImageUrl = publicUrl
      }

      // 2. GUARDAR EL TICKET EN LA BASE DE DATOS
      const { error: insertError } = await supabase
        .from('tickets')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            type: formData.type,
            status: 'pendiente',
            user_email: user.email,
            image_url: finalImageUrl // <--- AQUÍ GUARDAMOS LA URL DE LA FOTO
          }
        ])

      if (insertError) throw insertError

      toast.success('✅ ¡Reporte enviado con éxito!', { id: toastId })
      setTimeout(() => navigate('/dashboard'), 2000)

    } catch (error) {
      console.error('Error:', error)
      toast.error('❌ Error: ' + error.message, { id: toastId })
      setLoading(false)
    }
  }

  return (
    <div className="login-container" style={{ alignItems: 'flex-start', padding: '2rem 1rem' }}>
      <Toaster position="top-center" />

      <div className="login-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📸</span> Nuevo Reporte con Foto
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
                  <input type="radio" name="type" value={tipo} checked={formData.type === tipo} onChange={handleChange} style={{ display: 'none' }} />
                  {tipo === 'material' ? '📦 ' : tipo === 'incidencia' ? '⚠️ ' : '❓ '}
                  {tipo}
                </label>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#34495e' }}>Asunto Breve *</label>
            <input type="text" name="title" className="login-input" placeholder="Ej: Tubo roto en piso 2" value={formData.title} onChange={handleChange} maxLength={50} />
          </div>

          {/* EVIDENCIA FOTOGRÁFICA (NUEVO) */}
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '2px dashed #ccc' }}>
            <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#2c3e50' }}>
               📷 Adjuntar Foto de Evidencia (Opcional)
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ width: '100%', padding: '0.5rem' }}
            />
            {imageFile && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#2ecc71' }}>
                    ✅ Foto seleccionada: {imageFile.name}
                </p>
            )}
          </div>

          {/* Prioridad y Descripción */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
             <div style={{minWidth: '120px'}}>
                <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#34495e' }}>Prioridad</label>
                <select name="priority" className="login-input" value={formData.priority} onChange={handleChange} style={{ backgroundColor: 'white' }}>
                  <option value="baja">🟢 Baja</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🔴 Alta</option>
                </select>
             </div>
          </div>
          <div>
            <label className="login-subtitle" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '500', color: '#34495e' }}>Detalles *</label>
            <textarea name="description" className="login-input" rows="4" placeholder="Describe el problema..." value={formData.description} onChange={handleChange} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '1rem', border: 'none', background: '#ecf0f1', color: '#7f8c8d', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="login-button" style={{ flex: 2 }}>
              {loading ? 'Subiendo...' : 'Enviar Reporte 🚀'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CrearTicket
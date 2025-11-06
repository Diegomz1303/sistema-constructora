// src/pages/trabajador/CrearTicket.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import { Toaster, toast } from 'react-hot-toast'
import { Camera, UploadCloud, X } from 'lucide-react'

const CrearTicket = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [location, setLocation] = useState({ lat: null, lng: null, error: null })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    type: 'material'
  })

  // --- ESTILOS COMUNES ---
 const containerStyle = {
    // CAMBIO CLAVE: Aumentamos de '700px' a '1000px' (o el valor que prefieras)
    maxWidth: '1000px',
    width: '95%', // Esto asegura que en móviles no toque los bordes
    margin: '0 auto',
    padding: '3rem', // Aumentamos un poco el padding para que se vea más espacioso
    backgroundColor: '#ffffff',
    borderRadius: '24px', // Bordes un poco más redondeados para un look más moderno
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#334155',
    fontSize: '0.95rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '1rem',
    color: '#1e293b',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none'
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation(prev => ({ ...prev, error: "No soportado" }))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null }),
      (err) => {
        console.error("Error GPS:", err);
        setLocation(prev => ({ ...prev, error: "Ubicación no disponible" }))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    return () => imagePreview && URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) return toast.error('Falta título o descripción')
    
    setLoading(true)
    // CORREGIDO: const en lugar de constOX
    const toastId = toast.loading('Enviando reporte...')

    try {
      let finalImageUrl = null
      if (imageFile) {
        const fileName = `${user.id}-${Date.now()}.${imageFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('evidencia').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('evidencia').getPublicUrl(fileName)
        finalImageUrl = data.publicUrl
      }

      const { error: insertError } = await supabase.from('tickets').insert([{
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        type: formData.type,
        status: 'pendiente',
        user_email: user.email,
        image_url: finalImageUrl,
        latitude: location.lat,
        longitude: location.lng
      }])

      if (insertError) throw insertError
      toast.success('¡Reporte creado!', { id: toastId })
      navigate('/dashboard')
    } catch (error) {
      toast.error('Error: ' + error.message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem 1rem', minHeight: '100%', display: 'flex', justifyContent: 'center' }}>
      <Toaster position="top-center" />

      <div style={containerStyle} className="animate-fade-in">
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: '#eff6ff', borderRadius: '50%', marginBottom: '1rem' }}>
            <Camera size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#1e293b', margin: '0 0 0.5rem 0', fontWeight: '800' }}>Nuevo Reporte</h1>
          
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px', 
            padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500',
            backgroundColor: location.lat ? '#dcfce7' : '#fee2e2',
            color: location.lat ? '#166534' : '#991b1b'
          }}>
            <span>{location.lat ? '📍' : '⚠️'}</span>
            {location.lat 
              ? `Ubicación detectada` 
              : location.error || "Buscando GPS..."}
          </div>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>

          <div>
            <label style={labelStyle}>¿Qué tipo de reporte es?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.8rem' }}>
              {['material', 'incidencia', 'duda'].map((type) => (
                <label key={type} style={{
                  padding: '1rem',
                  border: formData.type === type ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                  backgroundColor: formData.type === type ? '#eff6ff' : 'white',
                  borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s', fontWeight: '600',
                  color: formData.type === type ? '#1d4ed8' : '#64748b',
                  textTransform: 'capitalize'
                }}>
                  <input type="radio" name="type" value={type} checked={formData.type === type} onChange={handleChange} style={{ display: 'none' }} />
                  <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                    {type === 'material' ? '🧱' : type === 'incidencia' ? '⚠️' : '❓'}
                  </span>
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1.2rem' }}>
            <div>
              <label style={labelStyle}>Asunto Principal *</label>
              <input 
                type="text" 
                name="title" 
                placeholder="Ej: Falta cemento en Zona B" 
                value={formData.title} 
                onChange={handleChange} 
                maxLength={60}
                style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: '500' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={labelStyle}>Prioridad</label>
              <select name="priority" value={formData.priority} onChange={handleChange} 
                style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.8rem' }}
              >
                <option value="baja">🟢 Baja</option>
                <option value="media">🟡 Media</option>
                <option value="alta">🔴 Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Evidencia Fotográfica</label>
            {!imageFile ? (
              <label style={{ 
                border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '1rem', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '50%' }}>
                  <UploadCloud size={30} color="#0ea5e9" />
                </div>
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  <span style={{ color: '#0ea5e9', fontWeight: '600' }}>Haz clic para subir</span> una foto
                  <p style={{ fontSize: '0.8rem', margin: '0.5rem 0 0 0', opacity: 0.7 }}>JPG, PNG (Máx 5MB)</p>
                </div>
              </label>
            ) : (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }} />
                <button 
                  type="button"
                  onClick={removeImage}
                  style={{ 
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                    borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Detalles Adicionales *</label>
            <textarea 
              name="description" 
              rows="4" 
              placeholder="Describe el problema con el mayor detalle posible..." 
              value={formData.description} 
              onChange={handleChange} 
              style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.5' }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              style={{ 
                flex: 1, padding: '1rem', border: 'none', borderRadius: '12px',
                backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '700', fontSize: '1rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                flex: 2, padding: '1rem', border: 'none', borderRadius: '12px',
                backgroundColor: loading ? '#94a3b8' : '#3b82f6', 
                color: 'white', fontWeight: '700', fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer', 
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'transform 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Enviando...' : <>Enviar Reporte 🚀</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CrearTicket